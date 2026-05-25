package com.fyp.supervision.service;

import com.fyp.supervision.entity.MeetingLog;
import com.fyp.supervision.entity.Project;
import com.fyp.supervision.entity.StudentProfile;
import com.fyp.supervision.entity.UserAccount;
import com.fyp.supervision.repository.StudentProfileRepository;
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
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Renders a {@link MeetingLog} into the MMU FCI Meeting Log .docx template,
 * populating header / sections / signatures. Mirrors {@link ProposalDocumentService}.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MeetingLogDocumentService {

    private static final String TEMPLATE_FYP1 = "templates/meeting-log-fyp1.docx";
    private static final String TEMPLATE_FYP2 = "templates/meeting-log-fyp2.docx";

    private final StudentProfileRepository studentProfileRepository;
    private final FileStorageService fileStorageService;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd MMM yyyy");

    /** Render a single meeting log into populated DOCX bytes. */
    public byte[] renderLog(MeetingLog log) throws Exception {
        String templatePath = "FYP2".equalsIgnoreCase(log.getFypPhase())
                ? TEMPLATE_FYP2 : TEMPLATE_FYP1;
        Map<String, String> headerValues = buildHeaderValues(log);

        try (InputStream in = new ClassPathResource(templatePath).getInputStream();
             XWPFDocument doc = new XWPFDocument(in);
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            for (XWPFTable table : doc.getTables()) {
                fillHeaderTable(table, headerValues);
            }

            doc.write(out);
            return out.toByteArray();
        }
    }

    private Map<String, String> buildHeaderValues(MeetingLog log) {
        UserAccount student = log.getStudent();
        UserAccount sup = log.getSupervisor();
        Project project = log.getProject();
        StudentProfile sp = (student != null)
                ? studentProfileRepository.findById(student.getUserId()).orElse(null)
                : null;

        Map<String, String> v = new LinkedHashMap<>();
        v.put("meeting date:", log.getMeetingDate() != null
                ? log.getMeetingDate().format(DATE_FMT) : "");
        v.put("meeting no.:", log.getMeetingNumber() != null
                ? log.getMeetingNumber().toString() : "");
        v.put("project id:", project != null && project.getProjectId() != null
                ? String.format("%04d", project.getProjectId()) : "");
        v.put("project title:", project != null && project.getProjectTitle() != null
                ? project.getProjectTitle() : "");
        v.put("student id:", student != null ? nz(student.getMmuId()) : "");
        v.put("student name:", student != null ? nz(student.getFullName()) : "");
        v.put("student programme and specialisation:", sp != null
                ? (nz(sp.getProgramme()) + (sp.getSpecialisation() != null ? " / " + sp.getSpecialisation() : ""))
                : "");
        v.put("supervisor name:", sup != null ? nz(sup.getFullName()) : "");
        v.put("co-supervisor name:", "");
        v.put("collaborating company:", "");
        v.put("company supervisor name:", "");
        return v;
    }

    /**
     * For a row in the header table: column 0 is the label, column 1 is the
     * value. Some header rows have two pairs (label-cell, value-cell, label-cell,
     * value-cell) — handle both.
     */
    private void fillHeaderTable(XWPFTable table, Map<String, String> values) {
        for (XWPFTableRow row : table.getRows()) {
            var cells = row.getTableCells();
            for (int i = 0; i < cells.size() - 1; i++) {
                String label = normaliseLabel(cells.get(i).getText());
                String value = values.get(label);
                if (value != null) {
                    replaceCellContent(cells.get(i + 1), value);
                }
            }
        }
    }

    private String normaliseLabel(String raw) {
        if (raw == null) return "";
        return raw.toLowerCase().replaceAll("\\s+", " ").trim();
    }

    private String nz(String s) { return s == null ? "" : s; }

    /**
     * Wipe the cell and write a single paragraph containing the value, preserving
     * the font from the existing first run. Multi-line values become multiple
     * paragraphs. Cloned from {@link ProposalDocumentService#replaceCellContent}.
     */
    private void replaceCellContent(XWPFTableCell cell, String value) {
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
        for (int i = cell.getParagraphs().size() - 1; i >= 0; i--) {
            cell.removeParagraph(i);
        }
        String text = value == null ? "" : value;
        for (String line : text.split("\\R", -1)) {
            XWPFParagraph p = cell.addParagraph();
            p.setAlignment(ParagraphAlignment.LEFT);
            XWPFRun r = p.createRun();
            r.setFontFamily(fontFamily);
            r.setFontSize(fontSize);
            r.setText(line);
        }
    }
}
