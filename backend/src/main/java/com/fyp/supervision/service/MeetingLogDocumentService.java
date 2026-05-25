package com.fyp.supervision.service;

import com.fyp.supervision.entity.MeetingLog;
import com.fyp.supervision.entity.MeetingLogSignature;
import com.fyp.supervision.entity.Project;
import com.fyp.supervision.entity.StudentProfile;
import com.fyp.supervision.entity.UserAccount;
import com.fyp.supervision.repository.StudentProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.util.Units;
import org.apache.poi.xwpf.usermodel.Document;
import org.apache.poi.xwpf.usermodel.ParagraphAlignment;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.usermodel.XWPFParagraph;
import org.apache.poi.xwpf.usermodel.XWPFRun;
import org.apache.poi.xwpf.usermodel.XWPFTable;
import org.apache.poi.xwpf.usermodel.XWPFTableCell;
import org.apache.poi.xwpf.usermodel.XWPFTableRow;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
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

    private static final String CHECKBOX_EMPTY = "☐";   // ☐
    private static final String CHECKBOX_TICK  = "☑";   // ☑

    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final Map<String, String> FYP1_TASKS = new LinkedHashMap<>() {{
        put("PLANNING",              "Planning");
        put("LITERATURE_REVIEW",     "Literature Review");
        put("REQUIREMENT_ANALYSIS",  "Requirement Analysis");
        put("DESIGN_METHODOLOGY",    "Design & Methodology");
        put("PROTOTYPE_POC",         "Prototype / Proof of Concept");
        put("DRAFT_REPORT",          "Draft Report / Report Writing");
    }};
    private static final Map<String, String> FYP2_TASKS = new LinkedHashMap<>() {{
        put("BACKGROUND_STUDY",           "Background Study");
        put("IMPLEMENTATION",             "Implementation");
        put("TESTING",                    "Testing");
        put("EVALUATION",                 "Evaluation");
        put("COMMERCIALISATION_PROPOSAL", "Commercialisation Proposal");
        put("RESEARCH_PAPER",             "Research Paper");
        put("DRAFT_REPORT",               "Draft Report");
        put("FINAL_REPORT",               "Final Report");
    }};

    private static final Map<String, String> SIG_LABEL_BY_ROLE = java.util.Map.of(
            "STUDENT",    "Student’s Signature",
            "SUPERVISOR", "Supervisor’s Signature"
    );

    /** Parse tasksJson into code → isSelected map. Bad JSON returns empty map. */
    private Map<String, Boolean> parseSelectedTasks(MeetingLog meetingLog) {
        Map<String, Boolean> map = new LinkedHashMap<>();
        String json = meetingLog.getTasksJson();
        if (json == null || json.isBlank()) return map;
        try {
            List<Map<String, Object>> items = objectMapper.readValue(json,
                    new TypeReference<List<Map<String, Object>>>() {});
            for (Map<String, Object> item : items) {
                Object code = item.get("taskCode");
                Object sel = item.get("isSelected");
                if (code != null) {
                    map.put(code.toString(), Boolean.TRUE.equals(sel));
                }
            }
        } catch (Exception ignored) {
            // Bad JSON → no tasks ticked.
        }
        return map;
    }

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

            Map<String, Boolean> modeAndType = new LinkedHashMap<>();
            boolean physical = "PHYSICAL".equalsIgnoreCase(log.getMeetingMode());
            boolean online = "ONLINE".equalsIgnoreCase(log.getMeetingMode());
            modeAndType.put("In-Person", physical);
            modeAndType.put("Online", online);
            // Project entity has no projectType column today — leave both research/application unchecked.
            modeAndType.put("Research-based", false);
            modeAndType.put("Application-based", false);
            setCheckboxes(doc, modeAndType);

            Map<String, String> taskLabels = "FYP2".equalsIgnoreCase(log.getFypPhase())
                    ? FYP2_TASKS : FYP1_TASKS;
            Map<String, Boolean> selected = parseSelectedTasks(log);
            Map<String, Boolean> taskCheckboxes = new LinkedHashMap<>();
            for (Map.Entry<String, String> entry : taskLabels.entrySet()) {
                taskCheckboxes.put(entry.getValue(), selected.getOrDefault(entry.getKey(), false));
            }
            setCheckboxes(doc, taskCheckboxes);

            fillBodySections(doc, log);

            boolean satisfactory = log.getSignatures() != null && log.getSignatures().stream()
                    .anyMatch(s -> "SUPERVISOR".equalsIgnoreCase(s.getSignerRole()));
            Map<String, Boolean> satBoxes = new LinkedHashMap<>();
            satBoxes.put("Satisfactory", satisfactory);
            satBoxes.put("Not Satisfactory", false);
            setCheckboxes(doc, satBoxes);

            embedSignatures(doc, log);

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
     * Tick the checkbox glyph that precedes one of the given labels, untick the
     * others. Searches every paragraph in every cell of every table, plus body
     * paragraphs outside tables.
     */
    private void setCheckboxes(XWPFDocument doc, Map<String, Boolean> labelToTicked) {
        for (XWPFTable table : doc.getTables()) {
            for (XWPFTableRow row : table.getRows()) {
                for (XWPFTableCell cell : row.getTableCells()) {
                    for (XWPFParagraph p : cell.getParagraphs()) {
                        rewriteParagraphCheckboxes(p, labelToTicked);
                    }
                }
            }
        }
        for (XWPFParagraph p : doc.getParagraphs()) {
            rewriteParagraphCheckboxes(p, labelToTicked);
        }
    }

    private void rewriteParagraphCheckboxes(XWPFParagraph p, Map<String, Boolean> labelToTicked) {
        String fullText = p.getText();
        if (fullText == null || fullText.isBlank()) return;
        boolean changed = false;
        String newText = fullText;
        for (Map.Entry<String, Boolean> entry : labelToTicked.entrySet()) {
            String label = entry.getKey();
            boolean ticked = entry.getValue();
            String want = (ticked ? CHECKBOX_TICK : CHECKBOX_EMPTY) + " " + label;
            String otherGlyph = (ticked ? CHECKBOX_EMPTY : CHECKBOX_TICK) + " " + label;
            if (newText.contains(otherGlyph)) {
                newText = newText.replace(otherGlyph, want);
                changed = true;
            } else if (newText.contains(label) && !newText.contains(want)) {
                // Template has no glyph next to label — prepend one.
                newText = newText.replace(label, want);
                changed = true;
            }
        }
        if (changed) {
            String fontFamily = "Times New Roman";
            Integer fontSize = 11;
            if (!p.getRuns().isEmpty()) {
                XWPFRun r0 = p.getRuns().get(0);
                if (r0.getFontFamily() != null) fontFamily = r0.getFontFamily();
                if (r0.getFontSize() != -1) fontSize = r0.getFontSize();
            }
            for (int i = p.getRuns().size() - 1; i >= 0; i--) {
                p.removeRun(i);
            }
            XWPFRun r = p.createRun();
            r.setFontFamily(fontFamily);
            r.setFontSize(fontSize);
            r.setText(newText);
        }
    }

    /** Fill the body sections of the meeting log. */
    private void fillBodySections(XWPFDocument doc, MeetingLog log) {
        String workDone = (log.getWorkDoneDetails() != null ? log.getWorkDoneDetails() : "")
                .trim();
        String workToBeDone = (log.getWorkToBeDone() != null ? log.getWorkToBeDone() : "")
                .trim();
        String problems = (log.getProblemsAndSolutions() != null ? log.getProblemsAndSolutions() : "")
                .trim();
        String comments = (log.getSupervisorComments() != null ? log.getSupervisorComments() : "")
                .trim();

        for (XWPFTable table : doc.getTables()) {
            var rows = table.getRows();
            for (int i = 0; i < rows.size(); i++) {
                String label = rows.get(i).getCell(0).getText();
                if (label == null) continue;
                String upper = label.toUpperCase();
                if (upper.contains("1. WORK DONE") && i + 1 < rows.size() && !workDone.isEmpty()) {
                    appendValueParagraph(rows.get(i + 1).getCell(0), workDone);
                } else if (upper.contains("2. WORK TO BE DONE") && i + 1 < rows.size() && !workToBeDone.isEmpty()) {
                    appendValueParagraph(rows.get(i + 1).getCell(0), workToBeDone);
                } else if (upper.contains("3. PROBLEMS ENCOUNTERED") && i + 1 < rows.size() && !problems.isEmpty()) {
                    replaceCellContent(rows.get(i + 1).getCell(0), problems);
                } else if (upper.contains("4. COMMENTS") && i + 1 < rows.size() && !comments.isEmpty()) {
                    replaceCellContent(rows.get(i + 1).getCell(0), comments);
                }
            }
        }
    }

    /**
     * Append a value paragraph to a cell WITHOUT wiping existing template
     * scaffolding (e.g. the "Details (max 3-5 bullet points):" line stays put).
     */
    private void appendValueParagraph(XWPFTableCell cell, String value) {
        String fontFamily = "Times New Roman";
        Integer fontSize = 11;
        if (!cell.getParagraphs().isEmpty() && !cell.getParagraphs().get(0).getRuns().isEmpty()) {
            XWPFRun r0 = cell.getParagraphs().get(0).getRuns().get(0);
            if (r0.getFontFamily() != null) fontFamily = r0.getFontFamily();
            if (r0.getFontSize() != -1) fontSize = r0.getFontSize();
        }
        for (String line : value.split("\\R", -1)) {
            XWPFParagraph p = cell.addParagraph();
            p.setAlignment(ParagraphAlignment.LEFT);
            XWPFRun r = p.createRun();
            r.setFontFamily(fontFamily);
            r.setFontSize(fontSize);
            r.setText(line);
        }
    }

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

    private void embedSignatures(XWPFDocument doc, MeetingLog log) {
        if (log.getSignatures() == null || log.getSignatures().isEmpty()) return;
        for (MeetingLogSignature sig : log.getSignatures()) {
            byte[] imageBytes = decodeSignatureBytes(sig.getSignatureImageUrl());
            if (imageBytes == null || imageBytes.length == 0) continue;
            String role = sig.getSignerRole() == null ? "" : sig.getSignerRole().toUpperCase();
            String wantedLabel = SIG_LABEL_BY_ROLE.get(role);
            if (wantedLabel == null) continue;
            attachSignatureBelowLabel(doc, wantedLabel, imageBytes, sig);
        }
    }

    private byte[] decodeSignatureBytes(String url) {
        if (url == null || url.isBlank()) return null;
        if (url.startsWith("data:image")) {
            int comma = url.indexOf(',');
            if (comma <= 0) return null;
            try { return Base64.getDecoder().decode(url.substring(comma + 1)); }
            catch (IllegalArgumentException e) { return null; }
        }
        try {
            var resource = fileStorageService.loadFile(url);
            try (var in = resource.getInputStream()) {
                return in.readAllBytes();
            }
        } catch (Exception e) {
            return null;
        }
    }

    /**
     * Find the table row whose cell 0 contains the given label (with curly-quote
     * normalisation), then replace the next row's cell 0 with an embedded picture
     * plus a small "Signed: <name> — <timestamp>" caption.
     */
    private void attachSignatureBelowLabel(XWPFDocument doc, String labelText,
                                            byte[] imageBytes, MeetingLogSignature sig) {
        String normalisedLabel = labelText.replace("’", "'");
        for (XWPFTable table : doc.getTables()) {
            var rows = table.getRows();
            for (int i = 0; i < rows.size(); i++) {
                String cellText = rows.get(i).getCell(0).getText();
                if (cellText == null) continue;
                String normalisedCell = cellText.replace("’", "'");
                if (!normalisedCell.contains(normalisedLabel)) continue;
                int targetRow = Math.min(i + 1, rows.size() - 1);
                XWPFTableCell target = rows.get(targetRow).getCell(0);
                for (int p = target.getParagraphs().size() - 1; p >= 0; p--) {
                    target.removeParagraph(p);
                }
                XWPFParagraph p = target.addParagraph();
                XWPFRun r = p.createRun();
                try (var stream = new java.io.ByteArrayInputStream(imageBytes)) {
                    r.addPicture(stream, Document.PICTURE_TYPE_PNG, "sig.png",
                            Units.toEMU(120), Units.toEMU(40));
                } catch (Exception ignored) {
                    r.setText("(signature image could not be embedded)");
                }
                XWPFParagraph cap = target.addParagraph();
                XWPFRun cr = cap.createRun();
                cr.setFontFamily("Times New Roman");
                cr.setFontSize(9);
                cr.setText("Signed: " + (sig.getSigner() != null ? sig.getSigner().getFullName() : "")
                        + " — " + (sig.getSignedAt() != null
                                ? sig.getSignedAt().format(DateTimeFormatter.ofPattern("dd MMM yyyy HH:mm"))
                                : ""));
                return;
            }
        }
    }
}
