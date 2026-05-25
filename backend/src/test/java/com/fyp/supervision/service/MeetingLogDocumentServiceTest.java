package com.fyp.supervision.service;

import com.fyp.supervision.entity.MeetingLog;
import com.fyp.supervision.entity.MeetingLogSignature;
import com.fyp.supervision.entity.Project;
import com.fyp.supervision.entity.UserAccount;
import com.fyp.supervision.repository.StudentProfileRepository;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
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

        Project project = new Project();
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

    @Test
    void ticksInPersonCheckboxForPhysicalMode() throws Exception {
        MeetingLog log = headerSampleLog();   // meetingMode = "PHYSICAL"
        byte[] bytes = service.renderLog(log);

        String text = extractAllText(bytes);
        assertThat(text).contains("☑ In-Person");
        assertThat(text).contains("☐ Online");
    }

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

    @Test
    void embedsSignaturePictureWhenSignerHasDataUrl() throws Exception {
        MeetingLog baseline = headerSampleLog();
        // Make sure baseline has no signatures.
        baseline.setSignatures(new java.util.ArrayList<>());
        byte[] baselineBytes = service.renderLog(baseline);
        int baselinePictureCount;
        try (XWPFDocument doc = new XWPFDocument(new java.io.ByteArrayInputStream(baselineBytes))) {
            baselinePictureCount = doc.getAllPictures().size();
        }

        MeetingLog withSig = headerSampleLog();
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
        withSig.setSignatures(new java.util.ArrayList<>(java.util.List.of(sig)));

        byte[] withSigBytes = service.renderLog(withSig);
        try (XWPFDocument doc = new XWPFDocument(new java.io.ByteArrayInputStream(withSigBytes))) {
            assertThat(doc.getAllPictures().size())
                    .as("signature should add at least one picture beyond the template's existing images")
                    .isGreaterThan(baselinePictureCount);
        }
    }

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
}
