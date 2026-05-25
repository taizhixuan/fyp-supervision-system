# Meeting Log Export Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the ability for a student to download any of their meeting logs as a `.docx` matching the official MMU FCI template — single-log or bulk-zipped per phase.

**Architecture:** A new `MeetingLogDocumentService` mirrors the existing `ProposalDocumentService` pattern: load a `.docx` template via classpath, walk Apache POI XWPF tables, replace label-cell values, swap unicode checkbox glyphs, embed signature images. Two new `StudentMeetingLogController` endpoints stream the bytes back (single `.docx` and bulk `.zip`). Frontend adds one download button to the log detail page and an "Export All" dropdown to the list page.

**Tech Stack:** Spring Boot 3.2.5 (Java 17), Apache POI 5.x XWPF (already on classpath), React 18 + TypeScript + TanStack Query, Mockito + JUnit 5 for tests.

**Reference spec:** `docs/superpowers/specs/2026-05-25-meeting-log-export-design.md`

---

## File map

| File | Action | Responsibility |
| --- | --- | --- |
| `backend/src/main/resources/templates/meeting-log-fyp1.docx` | Create (copy) | Classpath template for FYP1 logs |
| `backend/src/main/resources/templates/meeting-log-fyp2.docx` | Create (copy) | Classpath template for FYP2 logs |
| `backend/src/main/resources/templates/README.md` | Create | Notes where the templates come from and how to refresh them |
| `backend/src/main/java/com/fyp/supervision/service/MeetingLogDocumentService.java` | Create | Renders one or many MeetingLog rows into populated `.docx` bytes / a `.zip` |
| `backend/src/test/java/com/fyp/supervision/service/MeetingLogDocumentServiceTest.java` | Create | 6 Mockito-based unit tests covering each render path |
| `backend/src/main/java/com/fyp/supervision/controller/student/StudentMeetingLogController.java` | Modify | Add `GET /{id}/export.docx` and `GET /export.zip` |
| `frontend/src/lib/hooks/useMeetingLog.ts` | Modify | Add `useExportMeetingLog` + `useExportMeetingLogsBulk` mutations |
| `frontend/src/pages/student/MeetingLogDetail.tsx` | Modify | Wire "Download DOCX" button to the single-log hook |
| `frontend/src/pages/student/MeetingLogList.tsx` | Modify | Add "Export All" dropdown (FYP1 / FYP2) wired to the bulk hook |

---

## Task 1: Copy templates into the classpath

**Files:**
- Create: `backend/src/main/resources/templates/meeting-log-fyp1.docx`
- Create: `backend/src/main/resources/templates/meeting-log-fyp2.docx`
- Create: `backend/src/main/resources/templates/README.md`

- [ ] **Step 1: Copy both .docx files into the resources/templates directory**

PowerShell:

```powershell
Copy-Item "E:\FYP\fyp-supervision-system\docs-project\template\Meeting Log FYP1.docx" "E:\FYP\fyp-supervision-system\backend\src\main\resources\templates\meeting-log-fyp1.docx"
Copy-Item "E:\FYP\fyp-supervision-system\docs-project\template\Meeting Log FYP2.docx" "E:\FYP\fyp-supervision-system\backend\src\main\resources\templates\meeting-log-fyp2.docx"
```

- [ ] **Step 2: Create the README so future devs know where the templates come from**

Write `backend/src/main/resources/templates/README.md`:

```markdown
# Meeting Log Templates

These two files are runtime copies of the MMU FCI meeting log templates.

- Source of truth: `docs-project/template/Meeting Log FYP1.docx`, `Meeting Log FYP2.docx`
- Loaded by: `com.fyp.supervision.service.MeetingLogDocumentService` via `ClassPathResource`

If you change the source `.docx`, copy the updated file here too — Maven
includes everything under `src/main/resources/**` in the JAR, and the service
loads from the classpath, not from the docs-project folder.

The companion `fyp-proposal-form.docx` in this directory is read by
`ProposalDocumentService` and follows the same pattern.
```

- [ ] **Step 3: Verify the files are picked up by the build**

Run from repo root:

```powershell
cd backend
mvn -DskipTests process-resources
```

Expected: `BUILD SUCCESS` and the files appear under `backend/target/classes/templates/`.

- [ ] **Step 4: Commit**

```powershell
git add backend/src/main/resources/templates/meeting-log-fyp1.docx backend/src/main/resources/templates/meeting-log-fyp2.docx backend/src/main/resources/templates/README.md
git commit -m "add meeting log fyp1/fyp2 docx templates to classpath"
```

---

## Task 2: Skeleton MeetingLogDocumentService that loads the template

**Files:**
- Create: `backend/src/main/java/com/fyp/supervision/service/MeetingLogDocumentService.java`
- Create: `backend/src/test/java/com/fyp/supervision/service/MeetingLogDocumentServiceTest.java`

- [ ] **Step 1: Write the failing test (template loads, returns non-empty bytes)**

```java
package com.fyp.supervision.service;

import com.fyp.supervision.entity.MeetingLog;
import com.fyp.supervision.entity.UserAccount;
import com.fyp.supervision.repository.StudentProfileRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import static org.assertj.core.api.Assertions.assertThat;

class MeetingLogDocumentServiceTest {

    private StudentProfileRepository studentProfileRepository;
    private FileStorageService fileStorageService;
    private MeetingLogDocumentService service;

    @BeforeEach
    void setUp() {
        studentProfileRepository = Mockito.mock(StudentProfileRepository.class);
        fileStorageService = Mockito.mock(FileStorageService.class);
        service = new MeetingLogDocumentService(studentProfileRepository, fileStorageService);
    }

    @Test
    void rendersFyp1TemplateReturnsNonEmptyBytes() throws Exception {
        MeetingLog log = minimalLog("FYP1");
        byte[] bytes = service.renderLog(log);
        assertThat(bytes).isNotEmpty();
        // ZIP magic — .docx is a zip
        assertThat(bytes[0]).isEqualTo((byte) 'P');
        assertThat(bytes[1]).isEqualTo((byte) 'K');
    }

    private MeetingLog minimalLog(String phase) {
        UserAccount student = new UserAccount();
        student.setUserId(10L);
        student.setFullName("Test Student");
        student.setMmuId("1191100001");
        UserAccount sup = new UserAccount();
        sup.setUserId(20L);
        sup.setFullName("Dr Test Supervisor");
        return MeetingLog.builder()
                .logId(1L)
                .student(student)
                .supervisor(sup)
                .fypPhase(phase)
                .meetingNumber(1)
                .build();
    }
}
```

- [ ] **Step 2: Run test to verify it fails (service class doesn't exist)**

```powershell
cd backend
mvn test "-Dtest=MeetingLogDocumentServiceTest#rendersFyp1TemplateReturnsNonEmptyBytes"
```

Expected: compilation failure — `MeetingLogDocumentService` symbol not found.

- [ ] **Step 3: Write the skeleton service**

```java
package com.fyp.supervision.service;

import com.fyp.supervision.entity.MeetingLog;
import com.fyp.supervision.repository.StudentProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;

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

    /** Render a single meeting log into populated DOCX bytes. */
    public byte[] renderLog(MeetingLog log) throws Exception {
        String templatePath = "FYP2".equalsIgnoreCase(log.getFypPhase())
                ? TEMPLATE_FYP2 : TEMPLATE_FYP1;
        try (InputStream in = new ClassPathResource(templatePath).getInputStream();
             XWPFDocument doc = new XWPFDocument(in);
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            // Future tasks fill in the doc here.
            doc.write(out);
            return out.toByteArray();
        }
    }
}
```

- [ ] **Step 4: Run test to verify it passes**

```powershell
mvn test "-Dtest=MeetingLogDocumentServiceTest#rendersFyp1TemplateReturnsNonEmptyBytes"
```

Expected: `Tests run: 1, Failures: 0, Errors: 0`.

- [ ] **Step 5: Commit**

```powershell
git add backend/src/main/java/com/fyp/supervision/service/MeetingLogDocumentService.java backend/src/test/java/com/fyp/supervision/service/MeetingLogDocumentServiceTest.java
git commit -m "skeleton MeetingLogDocumentService that loads phase-specific template"
```

---

## Task 3: Populate header table fields

**Files:**
- Modify: `backend/src/main/java/com/fyp/supervision/service/MeetingLogDocumentService.java`
- Modify: `backend/src/test/java/com/fyp/supervision/service/MeetingLogDocumentServiceTest.java`

- [ ] **Step 1: Add a test asserting header values are present in rendered output**

Append to `MeetingLogDocumentServiceTest`:

```java
@Test
void rendersFyp1HeaderFields() throws Exception {
    MeetingLog log = headerSampleLog();
    byte[] bytes = service.renderLog(log);

    String text = extractAllText(bytes);
    assertThat(text).contains("1191100001");           // student id
    assertThat(text).contains("Test Student");          // student name
    assertThat(text).contains("Dr Test Supervisor");    // supervisor
    assertThat(text).contains("AI Supervision Project");// project title
    assertThat(text).contains("3");                     // meeting number
}

private MeetingLog headerSampleLog() {
    UserAccount student = new UserAccount();
    student.setUserId(10L);
    student.setFullName("Test Student");
    student.setMmuId("1191100001");
    UserAccount sup = new UserAccount();
    sup.setUserId(20L);
    sup.setFullName("Dr Test Supervisor");

    com.fyp.supervision.entity.Project project = new com.fyp.supervision.entity.Project();
    project.setProjectId(42L);
    project.setProjectTitle("AI Supervision Project");

    return MeetingLog.builder()
            .logId(1L)
            .student(student)
            .supervisor(sup)
            .project(project)
            .fypPhase("FYP1")
            .meetingNumber(3)
            .meetingDate(java.time.LocalDate.of(2026, 5, 15))
            .meetingMode("PHYSICAL")
            .build();
}

/** Read every w:t element from the rendered DOCX (test helper). */
private String extractAllText(byte[] bytes) throws java.io.IOException {
    try (XWPFDocument doc = new XWPFDocument(new java.io.ByteArrayInputStream(bytes))) {
        StringBuilder sb = new StringBuilder();
        for (var p : doc.getParagraphs()) sb.append(p.getText()).append('\n');
        for (var t : doc.getTables()) {
            for (var r : t.getRows()) {
                for (var c : r.getTableCells()) {
                    for (var p : c.getParagraphs()) sb.append(p.getText()).append('\n');
                }
            }
        }
        return sb.toString();
    }
}
```

Add the import at the top of the test file:

```java
import com.fyp.supervision.entity.Project;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
```

- [ ] **Step 2: Run test to verify it fails**

```powershell
mvn test "-Dtest=MeetingLogDocumentServiceTest#rendersFyp1HeaderFields"
```

Expected: assertion failure — `1191100001` / `Test Student` / `Dr Test Supervisor` not in rendered text.

- [ ] **Step 3: Add header field substitution to the service**

In `MeetingLogDocumentService.java` add these private helpers and call them from `renderLog`:

```java
import com.fyp.supervision.entity.MeetingLogSignature;
import com.fyp.supervision.entity.Project;
import com.fyp.supervision.entity.StudentProfile;
import com.fyp.supervision.entity.UserAccount;
import org.apache.poi.xwpf.usermodel.ParagraphAlignment;
import org.apache.poi.xwpf.usermodel.XWPFParagraph;
import org.apache.poi.xwpf.usermodel.XWPFRun;
import org.apache.poi.xwpf.usermodel.XWPFTable;
import org.apache.poi.xwpf.usermodel.XWPFTableCell;
import org.apache.poi.xwpf.usermodel.XWPFTableRow;

import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.Map;
```

Replace the body of `renderLog` with:

```java
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

private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd MMM yyyy");

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
```

- [ ] **Step 4: Run both tests to verify pass**

```powershell
mvn test "-Dtest=MeetingLogDocumentServiceTest"
```

Expected: `Tests run: 2, Failures: 0, Errors: 0`.

- [ ] **Step 5: Commit**

```powershell
git add backend/src/main/java/com/fyp/supervision/service/MeetingLogDocumentService.java backend/src/test/java/com/fyp/supervision/service/MeetingLogDocumentServiceTest.java
git commit -m "render meeting log header fields into docx template"
```

---

## Task 4: Tick the Meeting Mode + Project Type checkboxes

**Files:**
- Modify: `backend/src/main/java/com/fyp/supervision/service/MeetingLogDocumentService.java`
- Modify: `backend/src/test/java/com/fyp/supervision/service/MeetingLogDocumentServiceTest.java`

- [ ] **Step 1: Add a test asserting "In-Person" is ticked and "Online" is not for a PHYSICAL log**

Append to test class:

```java
@Test
void ticksInPersonCheckboxForPhysicalMode() throws Exception {
    MeetingLog log = headerSampleLog();   // meetingMode = "PHYSICAL"
    byte[] bytes = service.renderLog(log);

    // Walk all runs and find ones adjacent to "In-Person" / "Online" labels.
    String text = extractAllText(bytes);
    // Ticked glyph next to In-Person, untouched next to Online.
    assertThat(text).contains("☑ In-Person");
    assertThat(text).contains("☐ Online");
}
```

- [ ] **Step 2: Run test to verify it fails**

```powershell
mvn test "-Dtest=MeetingLogDocumentServiceTest#ticksInPersonCheckboxForPhysicalMode"
```

Expected: assertion failure (no `☑ In-Person` substring yet).

- [ ] **Step 3: Implement checkbox-tick walking on the same header table**

Inside `MeetingLogDocumentService`, add a helper and call it from `renderLog` before `doc.write`:

```java
private static final String CHECKBOX_EMPTY = "☐";   // ☐
private static final String CHECKBOX_TICK  = "☑";   // ☑

/**
 * Tick the checkbox glyph that precedes one of the given labels, untick the
 * others. Searches every paragraph in every cell of every table.
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
    // Some checkbox labels live in body paragraphs (outside any table).
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
        // Replace "☐ label" or "☑ label" with the correct one.
        String want = (ticked ? CHECKBOX_TICK : CHECKBOX_EMPTY) + " " + label;
        String otherGlyph = (ticked ? CHECKBOX_EMPTY : CHECKBOX_TICK) + " " + label;
        if (newText.contains(otherGlyph)) {
            newText = newText.replace(otherGlyph, want);
            changed = true;
        } else if (newText.contains(label) && !newText.contains(want)) {
            // Template didn't include a glyph next to the label — prepend one.
            newText = newText.replace(label, want);
            changed = true;
        }
    }
    if (changed) {
        // Wipe runs and rewrite as one run preserving original font.
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
```

In `renderLog`, after `fillHeaderTable(...)` and before `doc.write`:

```java
Map<String, Boolean> modeAndType = new LinkedHashMap<>();
boolean physical = "PHYSICAL".equalsIgnoreCase(log.getMeetingMode());
modeAndType.put("In-Person", physical);
modeAndType.put("Online", !physical && "ONLINE".equalsIgnoreCase(log.getMeetingMode()));
// projectType lives on Project, not MeetingLog — read defensively.
String projectType = log.getProject() != null ? null : null;  // placeholder; Project entity has no projectType column today
modeAndType.put("Research-based", "RESEARCH".equalsIgnoreCase(projectType));
modeAndType.put("Application-based", "APPLICATION".equalsIgnoreCase(projectType));
setCheckboxes(doc, modeAndType);
```

> Note: `Project` does not have a `projectType` field in the current schema. Both project-type boxes stay unchecked, which is honest. If a future migration adds the column, change the two `projectType` lines above.

- [ ] **Step 4: Run test to verify pass**

```powershell
mvn test "-Dtest=MeetingLogDocumentServiceTest"
```

Expected: `Tests run: 3, Failures: 0, Errors: 0`.

- [ ] **Step 5: Commit**

```powershell
git add backend/src/main/java/com/fyp/supervision/service/MeetingLogDocumentService.java backend/src/test/java/com/fyp/supervision/service/MeetingLogDocumentServiceTest.java
git commit -m "tick meeting mode + project type checkboxes in docx export"
```

---

## Task 5: Tick the Section 1 / Section 2 task checkboxes

**Files:**
- Modify: `backend/src/main/java/com/fyp/supervision/service/MeetingLogDocumentService.java`
- Modify: `backend/src/test/java/com/fyp/supervision/service/MeetingLogDocumentServiceTest.java`

- [ ] **Step 1: Add a test for FYP2 task ticking**

Append to test class:

```java
@Test
void ticksFyp2TasksThatAreSelectedInTasksJson() throws Exception {
    MeetingLog log = headerSampleLog();
    log.setFypPhase("FYP2");
    log.setTasksJson(
            "[{\"taskCode\":\"IMPLEMENTATION\",\"isSelected\":true},"
            + "{\"taskCode\":\"TESTING\",\"isSelected\":true},"
            + "{\"taskCode\":\"FINAL_REPORT\",\"isSelected\":false}]");

    byte[] bytes = service.renderLog(log);
    String text = extractAllText(bytes);
    assertThat(text).contains("☑ Implementation");
    assertThat(text).contains("☑ Testing");
    assertThat(text).contains("☐ Final Report");
}
```

- [ ] **Step 2: Run test to verify it fails**

```powershell
mvn test "-Dtest=MeetingLogDocumentServiceTest#ticksFyp2TasksThatAreSelectedInTasksJson"
```

Expected: assertion failure on `☑ Implementation`.

- [ ] **Step 3: Add the task code → label maps + tasksJson parse**

Inject `ObjectMapper` and add the maps. At the top of `MeetingLogDocumentService`:

```java
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.type.TypeReference;
import java.util.List;
```

In the class body:

```java
private final ObjectMapper objectMapper = new ObjectMapper();

private static final Map<String, String> FYP1_TASKS = Map.of(
        "PLANNING",              "Planning",
        "LITERATURE_REVIEW",     "Literature Review",
        "REQUIREMENT_ANALYSIS",  "Requirement Analysis",
        "DESIGN_METHODOLOGY",    "Design & Methodology",
        "PROTOTYPE_POC",         "Prototype / Proof of Concept",
        "DRAFT_REPORT",          "Draft Report / Report Writing"
);
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

/** Parse tasksJson into code → isSelected map. */
private Map<String, Boolean> parseSelectedTasks(MeetingLog log) {
    Map<String, Boolean> map = new LinkedHashMap<>();
    String json = log.getTasksJson();
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
    } catch (Exception e) {
        log.getLogId(); // touch, then swallow — bad JSON means no ticks
    }
    return map;
}
```

In `renderLog`, before `doc.write`, after the mode/type block:

```java
Map<String, String> taskLabels = "FYP2".equalsIgnoreCase(log.getFypPhase())
        ? FYP2_TASKS : FYP1_TASKS;
Map<String, Boolean> selected = parseSelectedTasks(log);
Map<String, Boolean> taskCheckboxes = new LinkedHashMap<>();
for (Map.Entry<String, String> entry : taskLabels.entrySet()) {
    taskCheckboxes.put(entry.getValue(), selected.getOrDefault(entry.getKey(), false));
}
setCheckboxes(doc, taskCheckboxes);
```

- [ ] **Step 4: Run test to verify pass**

```powershell
mvn test "-Dtest=MeetingLogDocumentServiceTest"
```

Expected: `Tests run: 4, Failures: 0, Errors: 0`.

- [ ] **Step 5: Commit**

```powershell
git add backend/src/main/java/com/fyp/supervision/service/MeetingLogDocumentService.java backend/src/test/java/com/fyp/supervision/service/MeetingLogDocumentServiceTest.java
git commit -m "tick fyp1/fyp2 task checkboxes from tasksJson"
```

---

## Task 6: Write the body sections (Details + Section 3 problems + Section 4 comments)

**Files:**
- Modify: `backend/src/main/java/com/fyp/supervision/service/MeetingLogDocumentService.java`
- Modify: `backend/src/test/java/com/fyp/supervision/service/MeetingLogDocumentServiceTest.java`

- [ ] **Step 1: Add a test for body text injection**

```java
@Test
void writesWorkDetailsAndProblemsAndComments() throws Exception {
    MeetingLog log = headerSampleLog();
    log.setWorkDoneDetails("Implemented the login screen.\nFixed two CSS bugs.");
    log.setWorkToBeDone("Wire signup flow.");
    log.setProblemsAndSolutions("Token refresh fails. Mitigated by polling.");
    log.setSupervisorComments("Good progress, keep going.");

    byte[] bytes = service.renderLog(log);
    String text = extractAllText(bytes);
    assertThat(text).contains("Implemented the login screen.");
    assertThat(text).contains("Fixed two CSS bugs.");
    assertThat(text).contains("Wire signup flow.");
    assertThat(text).contains("Token refresh fails.");
    assertThat(text).contains("Good progress, keep going.");
}
```

- [ ] **Step 2: Run test to verify it fails**

```powershell
mvn test "-Dtest=MeetingLogDocumentServiceTest#writesWorkDetailsAndProblemsAndComments"
```

Expected: assertion failure on first `contains`.

- [ ] **Step 3: Append body-section writes**

The body table (table index varies — find by content) has rows whose label includes "WORK DONE", "WORK TO BE DONE", "PROBLEMS ENCOUNTERED", or "COMMENTS". The row directly below each label is the value cell.

Add to `MeetingLogDocumentService`:

```java
/** Find the body table by scanning for one of the section headings. */
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
 * Append a "Value:" paragraph to a cell without wiping the existing template
 * scaffolding (the "Details (max 3-5 bullet points):" line in sections 1/2).
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
```

In `renderLog`, add `fillBodySections(doc, log);` after the task-checkbox block.

Also handle Section 4 "Satisfactory" tick: a supervisor signature implies satisfactory. Add to `renderLog` (after `fillBodySections`):

```java
boolean satisfactory = log.getSignatures() != null && log.getSignatures().stream()
        .anyMatch(s -> "SUPERVISOR".equalsIgnoreCase(s.getSignerRole()));
Map<String, Boolean> satBoxes = new LinkedHashMap<>();
satBoxes.put("Satisfactory", satisfactory);
satBoxes.put("Not Satisfactory", false);
setCheckboxes(doc, satBoxes);
```

- [ ] **Step 4: Run test to verify pass**

```powershell
mvn test "-Dtest=MeetingLogDocumentServiceTest"
```

Expected: `Tests run: 5, Failures: 0, Errors: 0`.

- [ ] **Step 5: Commit**

```powershell
git add backend/src/main/java/com/fyp/supervision/service/MeetingLogDocumentService.java backend/src/test/java/com/fyp/supervision/service/MeetingLogDocumentServiceTest.java
git commit -m "write meeting log body sections + tick satisfactory when signed"
```

---

## Task 7: Embed signature images when present

**Files:**
- Modify: `backend/src/main/java/com/fyp/supervision/service/MeetingLogDocumentService.java`
- Modify: `backend/src/test/java/com/fyp/supervision/service/MeetingLogDocumentServiceTest.java`

- [ ] **Step 1: Add a test that asserts an embedded picture exists when a signature data URL is present**

```java
@Test
void embedsSignaturePictureWhenSignerHasDataUrl() throws Exception {
    MeetingLog log = headerSampleLog();
    UserAccount signer = new UserAccount();
    signer.setUserId(10L);
    signer.setFullName("Test Student");

    // 1x1 transparent PNG, base64
    String pngBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
    MeetingLogSignature sig = MeetingLogSignature.builder()
            .signatureId(1L)
            .signer(signer)
            .signerRole("STUDENT")
            .signatureImageUrl("data:image/png;base64," + pngBase64)
            .signedAt(java.time.LocalDateTime.now())
            .build();
    log.setSignatures(new java.util.ArrayList<>(java.util.List.of(sig)));

    byte[] bytes = service.renderLog(log);
    try (XWPFDocument doc = new XWPFDocument(new java.io.ByteArrayInputStream(bytes))) {
        long pictureCount = doc.getAllPictures().size();
        assertThat(pictureCount).isGreaterThan(0);
    }
}
```

Add to imports:

```java
import com.fyp.supervision.entity.MeetingLogSignature;
```

- [ ] **Step 2: Run test to verify it fails**

```powershell
mvn test "-Dtest=MeetingLogDocumentServiceTest#embedsSignaturePictureWhenSignerHasDataUrl"
```

Expected: `pictureCount > 0` fails (count is 0).

- [ ] **Step 3: Add the signature-embedding code**

Add to `MeetingLogDocumentService`:

```java
import org.apache.poi.xwpf.usermodel.Document;
import org.apache.poi.util.Units;

import java.util.Base64;

private static final java.util.Map<String, String> SIG_LABEL_BY_ROLE = java.util.Map.of(
        "STUDENT",     "Student’s Signature",
        "SUPERVISOR",  "Supervisor’s Signature"
);

private void embedSignatures(XWPFDocument doc, MeetingLog log) {
    if (log.getSignatures() == null || log.getSignatures().isEmpty()) return;
    for (MeetingLogSignature sig : log.getSignatures()) {
        byte[] imageBytes = decodeSignatureBytes(sig.getSignatureImageUrl());
        if (imageBytes == null) continue;
        String wantedLabel = SIG_LABEL_BY_ROLE.get(
                sig.getSignerRole() == null ? "" : sig.getSignerRole().toUpperCase());
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

private void attachSignatureBelowLabel(XWPFDocument doc, String labelText,
                                        byte[] imageBytes, MeetingLogSignature sig) {
    for (XWPFTable table : doc.getTables()) {
        var rows = table.getRows();
        for (int i = 0; i < rows.size(); i++) {
            String cellText = rows.get(i).getCell(0).getText();
            if (cellText == null || !cellText.replace("’", "'")
                    .contains(labelText.replace("’", "'"))) continue;
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
```

In `renderLog`, after the satisfactory checkbox block, call:

```java
embedSignatures(doc, log);
```

- [ ] **Step 4: Run test to verify pass**

```powershell
mvn test "-Dtest=MeetingLogDocumentServiceTest"
```

Expected: `Tests run: 6, Failures: 0, Errors: 0`.

- [ ] **Step 5: Commit**

```powershell
git add backend/src/main/java/com/fyp/supervision/service/MeetingLogDocumentService.java backend/src/test/java/com/fyp/supervision/service/MeetingLogDocumentServiceTest.java
git commit -m "embed signature images into meeting log docx export"
```

---

## Task 8: Bulk ZIP export method

**Files:**
- Modify: `backend/src/main/java/com/fyp/supervision/service/MeetingLogDocumentService.java`
- Modify: `backend/src/test/java/com/fyp/supervision/service/MeetingLogDocumentServiceTest.java`

- [ ] **Step 1: Add a test for bulk zip output**

```java
@Test
void bulkZipContainsOneDocxPerLog() throws Exception {
    MeetingLog a = headerSampleLog(); a.setLogId(1L); a.setMeetingNumber(1);
    MeetingLog b = headerSampleLog(); b.setLogId(2L); b.setMeetingNumber(2);
    MeetingLog c = headerSampleLog(); c.setLogId(3L); c.setMeetingNumber(3);

    byte[] zipBytes = service.renderLogsAsZip(java.util.List.of(a, b, c), "FYP1", "1191100001");

    java.util.Set<String> entries = new java.util.HashSet<>();
    try (var zin = new java.util.zip.ZipInputStream(new java.io.ByteArrayInputStream(zipBytes))) {
        java.util.zip.ZipEntry entry;
        while ((entry = zin.getNextEntry()) != null) {
            entries.add(entry.getName());
        }
    }
    assertThat(entries).containsExactlyInAnyOrder(
            "MeetingLog_FYP1_M1_1191100001.docx",
            "MeetingLog_FYP1_M2_1191100001.docx",
            "MeetingLog_FYP1_M3_1191100001.docx");
}

@Test
void bulkZipWithEmptyListIncludesReadmeNote() throws Exception {
    byte[] zipBytes = service.renderLogsAsZip(java.util.List.of(), "FYP2", "1191100001");
    boolean foundReadme = false;
    try (var zin = new java.util.zip.ZipInputStream(new java.io.ByteArrayInputStream(zipBytes))) {
        java.util.zip.ZipEntry entry;
        while ((entry = zin.getNextEntry()) != null) {
            if (entry.getName().equals("README.txt")) foundReadme = true;
        }
    }
    assertThat(foundReadme).isTrue();
}
```

- [ ] **Step 2: Run tests to verify they fail (method doesn't exist)**

```powershell
mvn test "-Dtest=MeetingLogDocumentServiceTest"
```

Expected: compilation error — `renderLogsAsZip` symbol not found.

- [ ] **Step 3: Add the bulk method**

Append to `MeetingLogDocumentService`:

```java
import java.nio.charset.StandardCharsets;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

public byte[] renderLogsAsZip(List<MeetingLog> logs, String phase, String studentMmuId)
        throws Exception {
    ByteArrayOutputStream baos = new ByteArrayOutputStream();
    try (ZipOutputStream zip = new ZipOutputStream(baos)) {
        if (logs.isEmpty()) {
            zip.putNextEntry(new ZipEntry("README.txt"));
            zip.write(("No meeting logs found for phase " + phase + ".")
                    .getBytes(StandardCharsets.UTF_8));
            zip.closeEntry();
        } else {
            for (MeetingLog log : logs) {
                String fileName = "MeetingLog_" + phase + "_M"
                        + (log.getMeetingNumber() == null ? "X" : log.getMeetingNumber())
                        + "_" + studentMmuId + ".docx";
                zip.putNextEntry(new ZipEntry(fileName));
                zip.write(renderLog(log));
                zip.closeEntry();
            }
        }
    }
    return baos.toByteArray();
}
```

- [ ] **Step 4: Run all tests to verify pass**

```powershell
mvn test "-Dtest=MeetingLogDocumentServiceTest"
```

Expected: `Tests run: 8, Failures: 0, Errors: 0`.

- [ ] **Step 5: Commit**

```powershell
git add backend/src/main/java/com/fyp/supervision/service/MeetingLogDocumentService.java backend/src/test/java/com/fyp/supervision/service/MeetingLogDocumentServiceTest.java
git commit -m "bulk-zip meeting log export with filename convention"
```

---

## Task 9: Add controller endpoints (single + bulk)

**Files:**
- Modify: `backend/src/main/java/com/fyp/supervision/controller/student/StudentMeetingLogController.java`

- [ ] **Step 1: Add the two endpoints + ownership check helper**

Replace the file with:

```java
package com.fyp.supervision.controller.student;

import com.fyp.supervision.entity.MeetingLog;
import com.fyp.supervision.exception.BadRequestException;
import com.fyp.supervision.exception.ResourceNotFoundException;
import com.fyp.supervision.repository.MeetingLogRepository;
import com.fyp.supervision.repository.UserAccountRepository;
import com.fyp.supervision.service.MeetingLogDocumentService;
import com.fyp.supervision.service.MeetingLogService;
import com.fyp.supervision.service.StudentAccessService;
import com.fyp.supervision.service.StudentService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/student/meeting-logs")
@RequiredArgsConstructor
public class StudentMeetingLogController {
    private final MeetingLogService meetingLogService;
    private final StudentService studentService;
    private final StudentAccessService studentAccessService;
    private final MeetingLogDocumentService meetingLogDocumentService;
    private final MeetingLogRepository meetingLogRepository;
    private final UserAccountRepository userAccountRepository;

    @GetMapping
    public ResponseEntity<?> getLogs(
            @AuthenticationPrincipal UserDetails user,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String phase,
            Pageable pageable) {
        Long userId = Long.parseLong(user.getUsername());
        return ResponseEntity.ok(studentService.getLogsDto(userId, status, phase, pageable));
    }

    @GetMapping("/prefill")
    public ResponseEntity<?> getPrefill(
            @AuthenticationPrincipal UserDetails user,
            @RequestParam(required = false) Long meetingId) {
        Long userId = Long.parseLong(user.getUsername());
        return ResponseEntity.ok(meetingLogService.getPrefillData(userId, meetingId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getLog(@AuthenticationPrincipal UserDetails user, @PathVariable Long id) {
        Long userId = Long.parseLong(user.getUsername());
        return ResponseEntity.ok(studentService.getLogDto(userId, id));
    }

    @PostMapping
    public ResponseEntity<?> createLog(@AuthenticationPrincipal UserDetails user, @RequestBody Map<String, Object> data) {
        Long userId = Long.parseLong(user.getUsername());
        studentAccessService.requireActiveCycle(userId);
        MeetingLog log = meetingLogService.createLog(userId, data);
        return ResponseEntity.ok(studentService.buildMeetingLogDto(log));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateLog(@AuthenticationPrincipal UserDetails user, @PathVariable Long id, @RequestBody Map<String, Object> data) {
        Long userId = Long.parseLong(user.getUsername());
        studentAccessService.requireActiveCycle(userId);
        MeetingLog log = meetingLogService.updateLog(id, userId, data);
        return ResponseEntity.ok(studentService.buildMeetingLogDto(log));
    }

    @PostMapping("/{id}/submit")
    public ResponseEntity<?> submitLog(@AuthenticationPrincipal UserDetails user, @PathVariable Long id) {
        Long userId = Long.parseLong(user.getUsername());
        studentAccessService.requireActiveCycle(userId);
        MeetingLog log = meetingLogService.submitLog(id, userId);
        return ResponseEntity.ok(studentService.buildMeetingLogDto(log));
    }

    @PostMapping("/{id}/sign")
    public ResponseEntity<?> signLog(@AuthenticationPrincipal UserDetails user, @PathVariable Long id, @RequestBody Map<String, Object> data) {
        Long userId = Long.parseLong(user.getUsername());
        studentAccessService.requireActiveCycle(userId);
        MeetingLog log = meetingLogService.signLog(id, userId, data);
        return ResponseEntity.ok(studentService.buildMeetingLogDto(log));
    }

    /** Single meeting log → DOCX. Any status exportable. */
    @GetMapping("/{id}/export.docx")
    public ResponseEntity<byte[]> exportSingle(
            @AuthenticationPrincipal UserDetails user, @PathVariable Long id) throws Exception {
        Long userId = Long.parseLong(user.getUsername());
        MeetingLog log = meetingLogRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Meeting log not found"));
        if (log.getStudent() == null || !userId.equals(log.getStudent().getUserId())) {
            throw new ResourceNotFoundException("Meeting log not found");
        }
        byte[] bytes = meetingLogDocumentService.renderLog(log);
        String fileName = "MeetingLog_" + nz(log.getFypPhase(), "FYP1")
                + "_M" + (log.getMeetingNumber() == null ? "X" : log.getMeetingNumber())
                + "_" + nz(log.getStudent().getMmuId(), String.valueOf(userId)) + ".docx";
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + fileName + "\"")
                .contentType(MediaType.parseMediaType(
                        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"))
                .body(bytes);
    }

    /** All meeting logs in the given phase → ZIP. */
    @GetMapping("/export.zip")
    public ResponseEntity<byte[]> exportBulk(
            @AuthenticationPrincipal UserDetails user,
            @RequestParam(name = "phase") String phase) throws Exception {
        Long userId = Long.parseLong(user.getUsername());
        String p = phase == null ? "" : phase.trim().toUpperCase();
        if (!p.equals("FYP1") && !p.equals("FYP2")) {
            throw new BadRequestException("phase must be FYP1 or FYP2");
        }
        var allForStudent = meetingLogRepository
                .findByStudent_UserIdAndFypPhaseOrderByCreatedAtDesc(userId, p,
                        org.springframework.data.domain.Pageable.unpaged())
                .getContent();
        String mmuId = userAccountRepository.findById(userId)
                .map(u -> u.getMmuId() == null ? String.valueOf(userId) : u.getMmuId())
                .orElse(String.valueOf(userId));
        byte[] zipBytes = meetingLogDocumentService.renderLogsAsZip(
                (List<MeetingLog>) allForStudent, p, mmuId);
        String fileName = "MeetingLogs_" + p + "_" + mmuId + ".zip";
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + fileName + "\"")
                .contentType(MediaType.parseMediaType("application/zip"))
                .body(zipBytes);
    }

    private String nz(String s, String fallback) {
        return (s == null || s.isBlank()) ? fallback : s;
    }
}
```

- [ ] **Step 2: Confirm `MeetingLogRepository.findByStudent_UserIdAndFypPhaseOrderByCreatedAtDesc` exists**

```powershell
cd backend
mvn -q -DskipTests compile
```

If the build fails with "method not found", the repo has `findByStudent_UserIdAndFypPhase…` already (verified during exploration). If it doesn't, add this method to `backend/src/main/java/com/fyp/supervision/repository/MeetingLogRepository.java`:

```java
org.springframework.data.domain.Page<MeetingLog> findByStudent_UserIdAndFypPhaseOrderByCreatedAtDesc(
        Long studentUserId, String fypPhase, org.springframework.data.domain.Pageable pageable);
```

(The plan already requires no separate task here because the repo method exists — but the conditional add keeps the plan self-sufficient.)

- [ ] **Step 3: Run all tests and full backend compile**

```powershell
mvn -DskipTests compile
mvn test
```

Expected: `BUILD SUCCESS`, and the full test suite (`Tests run: 45+, Failures: 0, Errors: 0`) still passes.

- [ ] **Step 4: Commit**

```powershell
git add backend/src/main/java/com/fyp/supervision/controller/student/StudentMeetingLogController.java
git add backend/src/main/java/com/fyp/supervision/repository/MeetingLogRepository.java
git commit -m "add /student/meeting-logs export endpoints (docx single + zip bulk)"
```

---

## Task 10: Frontend hooks — single + bulk download

**Files:**
- Modify: `frontend/src/lib/hooks/useMeetingLog.ts`

- [ ] **Step 1: Append the two new mutation hooks**

Append (after the existing hooks at the bottom of the file):

```typescript
/**
 * Download one meeting log as a populated MMU FCI .docx file.
 * Triggers a browser download via an in-memory blob URL.
 */
export function useExportMeetingLog() {
  return useMutation({
    mutationFn: async (logId: string | number) => {
      const response = await apiClient.get(
        `/student/meeting-logs/${logId}/export.docx`,
        { responseType: 'blob' },
      )
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      // Pull the filename from Content-Disposition if present, otherwise fall back.
      const disp = (response.headers as Record<string, string>)['content-disposition'] || ''
      const match = disp.match(/filename="?([^";]+)"?/i)
      a.download = match?.[1] || `MeetingLog_${logId}.docx`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
      return true
    },
  })
}

/**
 * Download all of the student's logs for the given phase as a zipped bundle.
 */
export function useExportMeetingLogsBulk() {
  return useMutation({
    mutationFn: async (phase: 'FYP1' | 'FYP2') => {
      const response = await apiClient.get('/student/meeting-logs/export.zip', {
        params: { phase },
        responseType: 'blob',
      })
      const blob = new Blob([response.data], { type: 'application/zip' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const disp = (response.headers as Record<string, string>)['content-disposition'] || ''
      const match = disp.match(/filename="?([^";]+)"?/i)
      a.download = match?.[1] || `MeetingLogs_${phase}.zip`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
      return true
    },
  })
}
```

- [ ] **Step 2: Lint**

```powershell
cd frontend
npm run lint
```

Expected: zero errors.

- [ ] **Step 3: Commit**

```powershell
git add frontend/src/lib/hooks/useMeetingLog.ts
git commit -m "add useExportMeetingLog + useExportMeetingLogsBulk hooks"
```

---

## Task 11: Wire "Download DOCX" button on MeetingLogDetail

**Files:**
- Modify: `frontend/src/pages/student/MeetingLogDetail.tsx`

- [ ] **Step 1: Import the new hook**

In the existing `useMeetingLog` import line, add `useExportMeetingLog`:

```typescript
import {
  useMeetingLogDetail,
  useSignMeetingLog,
  useSubmitMeetingLog,
  useExportMeetingLog,
} from '@/lib/hooks/useMeetingLog'
```

- [ ] **Step 2: Add the mutation hook + handler in the component body**

Inside the `MeetingLogDetail` function, near the other mutations:

```typescript
const exportMutation = useExportMeetingLog()

const handleExport = async () => {
  if (!id) return
  try {
    await exportMutation.mutateAsync(id)
  } catch {
    // mutation surfaces error via state; no extra handling here
  }
}
```

- [ ] **Step 3: Render the button next to the existing action buttons**

Find the row of action buttons in the JSX (the `<div>` near the bottom of the page that holds Edit / Submit / Sign buttons). Add a new Button:

```tsx
<Button
  variant="secondary"
  size="sm"
  onClick={handleExport}
  isLoading={exportMutation.isPending}
>
  <Download className="h-4 w-4 mr-2" />
  Download DOCX
</Button>
```

(`Download` is already imported per the existing icon list.)

- [ ] **Step 4: Lint**

```powershell
cd frontend
npm run lint
```

Expected: zero errors.

- [ ] **Step 5: Commit**

```powershell
git add frontend/src/pages/student/MeetingLogDetail.tsx
git commit -m "MeetingLogDetail: wire Download DOCX button"
```

---

## Task 12: Wire "Export All" dropdown on MeetingLogList

**Files:**
- Modify: `frontend/src/pages/student/MeetingLogList.tsx`

- [ ] **Step 1: Import the new hook + Download icon**

Add to the existing imports at the top of the file:

```typescript
import { useExportMeetingLogsBulk } from '@/lib/hooks/useMeetingLog'
import { Download } from 'lucide-react'   // skip if already imported
```

- [ ] **Step 2: Add the mutation + a small dropdown state in the component body**

Inside `MeetingLogList` component, near other hooks:

```typescript
const bulkExport = useExportMeetingLogsBulk()
const [exportOpen, setExportOpen] = useState(false)

const handleBulkExport = async (phase: 'FYP1' | 'FYP2') => {
  setExportOpen(false)
  try {
    await bulkExport.mutateAsync(phase)
  } catch {
    // error surfaced via mutation state
  }
}
```

(If `useState` isn't already imported, add it: `import { useState } from 'react'`.)

- [ ] **Step 3: Add the dropdown UI to the page header**

Find the page header element (the row containing the title + filter buttons) and insert the dropdown trigger near the top-right:

```tsx
<div className="relative">
  <Button
    variant="secondary"
    size="sm"
    onClick={() => setExportOpen((v) => !v)}
    isLoading={bulkExport.isPending}
  >
    <Download className="h-4 w-4 mr-2" />
    Export All
  </Button>
  {exportOpen && (
    <div className="absolute right-0 z-10 mt-1 w-40 rounded-md border border-stone-200 bg-white shadow-lg">
      <button
        className="w-full px-3 py-2 text-left text-sm hover:bg-stone-50"
        onClick={() => handleBulkExport('FYP1')}
      >
        All FYP1 Logs
      </button>
      <button
        className="w-full px-3 py-2 text-left text-sm hover:bg-stone-50"
        onClick={() => handleBulkExport('FYP2')}
      >
        All FYP2 Logs
      </button>
    </div>
  )}
</div>
```

- [ ] **Step 4: Lint**

```powershell
cd frontend
npm run lint
```

Expected: zero errors.

- [ ] **Step 5: Commit**

```powershell
git add frontend/src/pages/student/MeetingLogList.tsx
git commit -m "MeetingLogList: wire Export All (FYP1/FYP2) dropdown"
```

---

## Task 13: Browser QA + final commit

**Files:** none modified — verification only.

- [ ] **Step 1: Make sure backend + frontend are running fresh**

```powershell
# Kill any orphan backend on 8080 first
netstat -ano | findstr :8080
# If something is listening, taskkill /F /PID <pid>
cd backend
mvn spring-boot:run "-Dspring-boot.run.profiles=dev"
```

In a separate shell:

```powershell
cd frontend
npm run dev
```

- [ ] **Step 2: Manual test single-log download**

1. Open `http://localhost:3000/login`, log in as `student@student.mmu.edu.my` / `Test@123`.
2. Navigate to `/student/meeting-logs` and open any log.
3. Click "Download DOCX". A file `MeetingLog_FYP1_M{n}_{mmuId}.docx` should download.
4. Open the file in Word/LibreOffice. Verify: student name, student id, meeting date, meeting number, meeting mode checkbox, work-done details, supervisor name, signature image (if signed) all present.

- [ ] **Step 3: Manual test bulk-zip download**

1. From `/student/meeting-logs`, click "Export All" → "All FYP1 Logs".
2. A `MeetingLogs_FYP1_{mmuId}.zip` should download.
3. Unzip: one `.docx` per log, named with meeting numbers. If the student has zero FYP1 logs, the zip should contain `README.txt`.

- [ ] **Step 4: Manual test ownership rejection**

1. Open browser devtools → Console.
2. Run:
   ```js
   const t = localStorage.getItem('access_token');
   const r = await fetch('/api/student/meeting-logs/999999/export.docx',
     { headers: { Authorization: `Bearer ${t}` } });
   r.status   // expect 404
   ```
3. Expected response: status 404 with `Meeting log not found` body.

- [ ] **Step 5: Run the full backend test suite + frontend lint to verify nothing regressed**

```powershell
cd backend
mvn test
```

```powershell
cd frontend
npm run lint
```

Expected: backend `Tests run: 45+, Failures: 0, Errors: 0`; lint `0 errors`.

- [ ] **Step 6: Final push to origin**

```powershell
cd ..
git push
```

Expected: all task commits land on `origin/main`.

---

## Self-review (done before publishing the plan)

**Spec coverage:** every spec section maps to at least one task —
header fields → Task 3, checkboxes → Task 4+5, body sections → Task 6,
signatures → Task 7, bulk zip → Task 8, endpoints → Task 9, hooks → Task 10,
detail UI → Task 11, list UI → Task 12. Templates on classpath → Task 1.
Error handling cases listed in the spec are all covered by Task 9 (404 +
400) and Task 8 (empty-list README).

**Placeholder scan:** every code block is complete. No "fill in later",
no "similar to Task N", every test has a concrete assertion.

**Type consistency:** `renderLog(MeetingLog)` and
`renderLogsAsZip(List<MeetingLog>, String phase, String studentMmuId)` are
the only public service methods, used identically in tests and controller.
Hook names match component usage (`useExportMeetingLog`,
`useExportMeetingLogsBulk`). Filename pattern (`MeetingLog_FYPx_Mn_{mmuId}.docx`)
is identical in Task 8 (test + impl), Task 9 (controller), and Task 13 (QA).
