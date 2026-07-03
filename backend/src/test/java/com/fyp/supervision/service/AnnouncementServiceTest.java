package com.fyp.supervision.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fyp.supervision.entity.Announcement;
import com.fyp.supervision.entity.AnnouncementAudience;
import com.fyp.supervision.entity.FypCycle;
import com.fyp.supervision.entity.Project;
import com.fyp.supervision.entity.StudentProfile;
import com.fyp.supervision.entity.UserAccount;
import com.fyp.supervision.enums.AnnouncementStatus;
import com.fyp.supervision.enums.UserRole;
import com.fyp.supervision.repository.AnnouncementReadRepository;
import com.fyp.supervision.repository.AnnouncementRepository;
import com.fyp.supervision.repository.ProjectRepository;
import com.fyp.supervision.repository.StudentProfileRepository;
import com.fyp.supervision.repository.UserAccountRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class AnnouncementServiceTest {

    @Mock AnnouncementRepository announcementRepository;
    @Mock AnnouncementReadRepository announcementReadRepository;
    @Mock ProjectRepository projectRepository;
    @Mock StudentProfileRepository studentProfileRepository;
    @Mock UserAccountRepository userAccountRepository;
    @Mock FileStorageService fileStorageService;
    @Mock ObjectMapper objectMapper;

    @InjectMocks AnnouncementService service;

    private static final long FYP1_STUDENT_ID = 100L;
    private static final long FYP2_STUDENT_ID = 200L;
    private static final long SUPERVISOR_ID = 50L;
    private static final long COMMITTEE_ID = 60L;
    private static final long OTHER_SUPERVISOR_ID = 70L;
    private static final Pageable DEFAULT_PAGE = PageRequest.of(0, 50);

    private long nextId = 1;

    @BeforeEach
    void setUp() {
        // Default student contexts; tests that need a different shape override.
        configureStudentContext(FYP1_STUDENT_ID, "FYP1",
                "Bachelor of Computer Science (Hons.)", "Software Engineering");
        configureStudentContext(FYP2_STUDENT_ID, "FYP2",
                "Bachelor of Computer Science (Hons.)", "Software Engineering");
        // No reads in these tests — every announcement starts unread. Stub here
        // rather than per-test so the audience-filter tests don't have to know
        // about the read-tracking layer.
        when(announcementReadRepository.readIdsForUser(any(), any(Collection.class)))
                .thenReturn(Set.of());
    }

    private void configureStudentContext(long userId, String cycleType, String programme, String specialisation) {
        FypCycle cycle = new FypCycle();
        cycle.setCycleType(cycleType);
        Project project = new Project();
        project.setCycle(cycle);
        when(projectRepository.findByStudent_UserId(userId)).thenReturn(Optional.of(project));

        StudentProfile profile = new StudentProfile();
        profile.setUserId(userId);
        profile.setProgramme(programme);
        profile.setSpecialisation(specialisation);
        when(studentProfileRepository.findById(userId)).thenReturn(Optional.of(profile));
    }

    private Announcement announcement(String scope, UserAccount author) {
        Announcement a = new Announcement();
        a.setAnnouncementId(nextId++);
        a.setScope(scope);
        a.setStatus(AnnouncementStatus.PUBLISHED);
        a.setTitle("test " + scope);
        a.setContent("body");
        a.setCreatedBy(author);
        return a;
    }

    private UserAccount userOfRole(long id, UserRole role) {
        UserAccount u = new UserAccount();
        u.setUserId(id);
        u.setRole(role);
        u.setFullName(role.name() + " " + id);
        return u;
    }

    private void mockPublishedReturns(Announcement... rows) {
        Page<Announcement> page = new PageImpl<>(List.of(rows));
        when(announcementRepository.findByStatusOrderByCreatedAtDesc(
                eq(AnnouncementStatus.PUBLISHED), any(Pageable.class)))
                .thenReturn(page);
        // listForSupervisor / listForStaff also pull PUBLISHED + scheduled DRAFT rows.
        when(announcementRepository.findByStatusInOrderByCreatedAtDesc(
                anyCollection(), any(Pageable.class)))
                .thenReturn(page);
    }

    // ---------- audience filter (via listForStudent) ----------

    @Test
    void listForStudent_includesScopeAll() {
        UserAccount committee = userOfRole(COMMITTEE_ID, UserRole.FYP_COMMITTEE);
        mockPublishedReturns(announcement("ALL", committee));

        Page<Map<String, Object>> page = service.listForStudent(FYP1_STUDENT_ID, DEFAULT_PAGE);

        assertThat(page.getContent()).hasSize(1);
        assertThat(page.getContent().get(0).get("scope")).isEqualTo("ALL");
    }

    @Test
    void listForStudent_excludesFyp1AnnouncementForFyp2Student() {
        mockPublishedReturns(
                announcement("FYP1", userOfRole(COMMITTEE_ID, UserRole.FYP_COMMITTEE)));

        Page<Map<String, Object>> page = service.listForStudent(FYP2_STUDENT_ID, DEFAULT_PAGE);

        assertThat(page.getContent()).isEmpty();
    }

    @Test
    void listForStudent_includesFyp1AnnouncementForFyp1Student() {
        mockPublishedReturns(
                announcement("FYP1", userOfRole(COMMITTEE_ID, UserRole.FYP_COMMITTEE)));

        Page<Map<String, Object>> page = service.listForStudent(FYP1_STUDENT_ID, DEFAULT_PAGE);

        assertThat(page.getContent()).hasSize(1);
    }

    @Test
    void listForStudent_includesProgrammeMatch() {
        // PROGRAMME_SE → matches student with specialisation Software Engineering.
        mockPublishedReturns(
                announcement("PROGRAMME_SE", userOfRole(COMMITTEE_ID, UserRole.FYP_COMMITTEE)));

        Page<Map<String, Object>> page = service.listForStudent(FYP1_STUDENT_ID, DEFAULT_PAGE);

        assertThat(page.getContent()).hasSize(1);
    }

    @Test
    void listForStudent_excludesProgrammeMismatch() {
        // PROGRAMME_DS → student is SE specialisation, should NOT see it.
        mockPublishedReturns(
                announcement("PROGRAMME_DS", userOfRole(COMMITTEE_ID, UserRole.FYP_COMMITTEE)));

        Page<Map<String, Object>> page = service.listForStudent(FYP1_STUDENT_ID, DEFAULT_PAGE);

        assertThat(page.getContent()).isEmpty();
    }

    @Test
    void listForStudent_specificStudentsOnlyForTargeted() {
        UserAccount supervisor = userOfRole(SUPERVISOR_ID, UserRole.SUPERVISOR);
        Announcement a = announcement("SPECIFIC_STUDENTS", supervisor);
        // Target only the FYP1 student, not the FYP2 student.
        UserAccount targetStudent = userOfRole(FYP1_STUDENT_ID, UserRole.STUDENT);
        AnnouncementAudience aud = new AnnouncementAudience();
        aud.setAnnouncement(a);
        aud.setTargetStudent(targetStudent);
        a.getAudiences().add(aud);
        mockPublishedReturns(a);

        Page<Map<String, Object>> targetedPage = service.listForStudent(FYP1_STUDENT_ID, DEFAULT_PAGE);
        Page<Map<String, Object>> otherPage = service.listForStudent(FYP2_STUDENT_ID, DEFAULT_PAGE);

        assertThat(targetedPage.getContent()).hasSize(1);
        assertThat(otherPage.getContent()).isEmpty();
    }

    // ---------- inbox/outbox split (listForSupervisor) ----------

    @Test
    void listForSupervisor_marksOwnAsSent() {
        UserAccount me = userOfRole(SUPERVISOR_ID, UserRole.SUPERVISOR);
        mockPublishedReturns(announcement("ALL_SUPERVISEES", me));

        List<Map<String, Object>> result = service.listForSupervisor(SUPERVISOR_ID, DEFAULT_PAGE);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).get("direction")).isEqualTo("SENT");
    }

    @Test
    void listForSupervisor_marksCommitteeAsReceived() {
        UserAccount committee = userOfRole(COMMITTEE_ID, UserRole.FYP_COMMITTEE);
        mockPublishedReturns(announcement("ALL", committee));

        List<Map<String, Object>> result = service.listForSupervisor(SUPERVISOR_ID, DEFAULT_PAGE);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).get("direction")).isEqualTo("RECEIVED");
    }

    @Test
    void listForSupervisor_excludesOtherSupervisorsAnnouncements() {
        // An announcement created by another supervisor — scoped to their supervisees,
        // not relevant to me, must NOT appear in my inbox.
        UserAccount otherSup = userOfRole(OTHER_SUPERVISOR_ID, UserRole.SUPERVISOR);
        mockPublishedReturns(announcement("ALL_SUPERVISEES", otherSup));

        List<Map<String, Object>> result = service.listForSupervisor(SUPERVISOR_ID, DEFAULT_PAGE);

        assertThat(result).isEmpty();
    }

    @Test
    void listForSupervisor_includesAdminBroadcasts() {
        UserAccount admin = userOfRole(99L, UserRole.SYSTEM_ADMIN);
        mockPublishedReturns(announcement("ALL", admin));

        List<Map<String, Object>> result = service.listForSupervisor(SUPERVISOR_ID, DEFAULT_PAGE);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).get("direction")).isEqualTo("RECEIVED");
    }
}
