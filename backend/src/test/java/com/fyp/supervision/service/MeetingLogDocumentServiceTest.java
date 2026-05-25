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
