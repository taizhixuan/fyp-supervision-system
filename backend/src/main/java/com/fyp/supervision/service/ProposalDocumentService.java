package com.fyp.supervision.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fyp.supervision.entity.Proposal;
import com.fyp.supervision.entity.StudentProfile;
import com.fyp.supervision.entity.SupervisorProfile;
import com.fyp.supervision.entity.UserAccount;
import com.fyp.supervision.repository.StudentProfileRepository;
import com.fyp.supervision.repository.SupervisorProfileRepository;
import com.fyp.supervision.repository.UserAccountRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.xwpf.usermodel.ParagraphAlignment;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.usermodel.XWPFParagraph;
import org.apache.poi.xwpf.usermodel.XWPFRun;
import org.apache.poi.xwpf.usermodel.XWPFTable;
import org.apache.poi.xwpf.usermodel.XWPFTableCell;
import org.apache.poi.xwpf.usermodel.XWPFTableRow;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Renders the official MMU FCI FYP Proposal Form .docx populated with the
 * student's structured proposal data. The blank template lives at
 * {@code resources/templates/fyp-proposal-form.docx} and is a single
 * 2-column table; we match each row by the label in column 0 and write the
 * value into column 1.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ProposalDocumentService {

    private static final String TEMPLATE_PATH = "templates/fyp-proposal-form.docx";

    private final UserAccountRepository userAccountRepository;
    private final StudentProfileRepository studentProfileRepository;
    private final SupervisorProfileRepository supervisorProfileRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public byte[] renderProposalForm(Proposal proposal, Map<String, Object> latestContent)
            throws Exception {
        Map<String, String> values = buildRowValues(proposal, latestContent);

        try (InputStream in = new ClassPathResource(TEMPLATE_PATH).getInputStream();
             XWPFDocument doc = new XWPFDocument(in);
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            for (XWPFTable table : doc.getTables()) {
                for (XWPFTableRow row : table.getRows()) {
                    if (row.getTableCells().size() < 2) continue;
                    XWPFTableCell labelCell = row.getCell(0);
                    String label = normaliseLabel(labelCell.getText());
                    String value = lookupValue(values, label);
                    if (value != null) {
                        replaceCellContent(row.getCell(1), value);
                    }
                }
            }

            doc.write(out);
            return out.toByteArray();
        }
    }

    private Map<String, String> buildRowValues(Proposal proposal, Map<String, Object> content) {
        Map<String, String> v = new LinkedHashMap<>();
        v.put("project title", nz(proposal.getTitle()));
        v.put("supervisor name", supervisorDisplay(proposal));
        v.put("co-supervisor name", str(content.get("coSupervisorName")));
        v.put("project status", str(content.getOrDefault("projectStatus", "Student-Proposed")));
        boolean industry = Boolean.TRUE.equals(content.get("industryCollaboration"));
        v.put("industry collaboration", industry ? "Yes" : "No");
        if (industry) {
            String company = nz(str(content.get("industryCompanyName")));
            String contact = nz(str(content.get("industryContactName")));
            String phone = nz(str(content.get("industryContactPhone")));
            v.put("company name", company + (contact.isBlank() ? "" : " — " + contact)
                    + (phone.isBlank() ? "" : " (" + phone + ")"));
        } else {
            v.put("company name", "—");
        }
        v.put("project type", str(content.get("projectType")));
        v.put("project specialization", str(content.getOrDefault("specialisation",
                defaultStudentSpec(proposal))));
        v.put("project category", str(content.get("projectCategory")));
        v.put("project focus", str(content.get("projectFocus")));
        v.put("project description", buildDescription(content));
        v.put("project objectives", listToBullets(content.get("objectives")));
        v.put("project outcomes", listToBullets(content.get("expectedOutcomes")));
        v.put("project scope", str(content.get("scope")));
        v.put("number of students", str(content.getOrDefault("numberOfStudents", "One")));
        v.put("student 1 subtitle", str(content.get("student1Subtitle")));
        v.put("student 1 work distribution", str(content.get("student1WorkDistribution")));
        v.put("student 2 subtitle", str(content.get("student2Subtitle")));
        v.put("student 2 work distribution", str(content.get("student2WorkDistribution")));
        v.put("student 1 details", studentDetails(proposal.getStudent()));
        v.put("student 2 details", student2Details(content));
        return v;
    }

    private String supervisorDisplay(Proposal proposal) {
        if (proposal.getSupervisor() == null) return "—";
        UserAccount sup = proposal.getSupervisor();
        SupervisorProfile sp = supervisorProfileRepository.findById(sup.getUserId()).orElse(null);
        StringBuilder sb = new StringBuilder(nz(sup.getFullName()));
        if (sp != null && sp.getPosition() != null) {
            sb.append(" (").append(sp.getPosition()).append(")");
        }
        return sb.toString();
    }

    private String studentDetails(UserAccount user) {
        if (user == null) return "—";
        StudentProfile sp = studentProfileRepository.findById(user.getUserId()).orElse(null);
        List<String> parts = new ArrayList<>();
        parts.add(nz(user.getFullName()));
        parts.add(nz(user.getMmuId()));
        if (sp != null && sp.getSpecialisation() != null) parts.add(sp.getSpecialisation());
        if (user.getPhone() != null && !user.getPhone().isBlank()) parts.add(user.getPhone());
        parts.add(nz(user.getEmail()));
        return String.join(", ", parts);
    }

    private String student2Details(Map<String, Object> content) {
        Object id = content.get("student2MmuId");
        if (!(id instanceof String s) || s.isBlank()) return "—";
        UserAccount s2 = userAccountRepository.findByMmuId(s.trim()).orElse(null);
        return s2 != null ? studentDetails(s2) : ("MMU ID: " + s + " (not found in system)");
    }

    private String defaultStudentSpec(Proposal proposal) {
        if (proposal.getStudent() == null) return "";
        return studentProfileRepository.findById(proposal.getStudent().getUserId())
                .map(StudentProfile::getSpecialisation)
                .orElse("");
    }

    private String buildDescription(Map<String, Object> content) {
        StringBuilder sb = new StringBuilder();
        appendSection(sb, "Background / Problem Statement", str(content.get("problemStatement")));
        appendSection(sb, "Methodology", str(content.get("methodology")));
        appendSection(sb, "Expected Output / Significance",
                listToBullets(content.get("expectedOutcomes")));
        return sb.toString().strip();
    }

    private void appendSection(StringBuilder sb, String label, String body) {
        if (body == null || body.isBlank()) return;
        if (sb.length() > 0) sb.append('\n');
        sb.append(label).append(":\n").append(body.strip()).append('\n');
    }

    @SuppressWarnings("unchecked")
    private String listToBullets(Object value) {
        if (!(value instanceof List<?> list) || list.isEmpty()) return "";
        StringBuilder sb = new StringBuilder();
        for (Object item : (List<Object>) list) {
            String s = str(item);
            if (s == null || s.isBlank()) continue;
            sb.append("• ").append(s.strip()).append('\n');
        }
        return sb.toString().strip();
    }

    /** Find the first row-value whose key is a prefix of the provided label. */
    private String lookupValue(Map<String, String> values, String label) {
        if (label == null) return null;
        for (Map.Entry<String, String> e : values.entrySet()) {
            if (label.startsWith(e.getKey())) {
                return e.getValue();
            }
        }
        return null;
    }

    private String normaliseLabel(String raw) {
        if (raw == null) return "";
        return raw.toLowerCase().replaceAll("\\s+", " ").trim();
    }

    /**
     * Replace all paragraphs / runs in a cell with a single paragraph carrying
     * {@code value}. Multi-line values (e.g. bulleted lists) become multiple
     * paragraphs sharing the same run formatting.
     */
    private void replaceCellContent(XWPFTableCell cell, String value) {
        // Capture font from the existing first run so we keep the template style.
        String fontFamily = "Times New Roman";
        Integer fontSize = 11;
        if (!cell.getParagraphs().isEmpty()) {
            XWPFParagraph p0 = cell.getParagraphs().get(0);
            if (!p0.getRuns().isEmpty()) {
                XWPFRun r0 = p0.getRuns().get(0);
                if (r0.getFontFamily() != null) fontFamily = r0.getFontFamily();
                if (r0.getFontSize() != -1) fontSize = r0.getFontSize();
            }
        }

        // Wipe existing paragraphs.
        for (int i = cell.getParagraphs().size() - 1; i >= 0; i--) {
            cell.removeParagraph(i);
        }

        String text = value == null ? "" : value;
        String[] lines = text.split("\\R", -1);
        for (String line : lines) {
            XWPFParagraph p = cell.addParagraph();
            p.setAlignment(ParagraphAlignment.LEFT);
            XWPFRun r = p.createRun();
            r.setFontFamily(fontFamily);
            r.setFontSize(fontSize);
            r.setText(line);
        }
    }

    private String nz(String s) {
        return s == null ? "" : s;
    }

    private String str(Object value) {
        return value == null ? null : value.toString();
    }
}
