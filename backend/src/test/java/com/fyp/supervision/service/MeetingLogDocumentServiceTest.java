package com.fyp.supervision.service;

import com.fyp.supervision.entity.MeetingLog;
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
