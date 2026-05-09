package com.fyp.supervision.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fyp.supervision.entity.FypGrade;
import com.fyp.supervision.entity.Project;
import com.fyp.supervision.entity.UserAccount;
import com.fyp.supervision.exception.BadRequestException;
import com.fyp.supervision.exception.ForbiddenException;
import com.fyp.supervision.repository.FypGradeRepository;
import com.fyp.supervision.repository.ProjectRepository;
import com.fyp.supervision.repository.UserAccountRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class GradingServiceTest {

    @Mock FypGradeRepository gradeRepository;
    @Mock ProjectRepository projectRepository;
    @Mock UserAccountRepository userAccountRepository;

    @InjectMocks GradingService service;

    private static final long SUPERVISOR_ID = 50L;
    private static final long OTHER_SUPERVISOR_ID = 51L;
    private static final long STUDENT_ID = 100L;
    private static final long PROJECT_ID = 1L;
    private static final long ADMIN_ID = 1L;

    private Project project;
    private UserAccount supervisor;
    private UserAccount otherSupervisor;

    @BeforeEach
    void setUp() {
        // GradingService allocates ObjectMapper itself? It's @RequiredArgsConstructor with
        // a final ObjectMapper, so yes — Spring would inject one in prod. Here we feed
        // a real ObjectMapper via the @InjectMocks setup by reusing ReflectionTestUtils.
        // Easier: pass via an explicit constructor wrapper. Mockito's @InjectMocks doesn't
        // construct ObjectMapper; we set it via reflection-free helper below.
        try {
            var f = GradingService.class.getDeclaredField("objectMapper");
            f.setAccessible(true);
            f.set(service, new ObjectMapper());
        } catch (Exception e) {
            throw new RuntimeException(e);
        }

        supervisor = new UserAccount();
        supervisor.setUserId(SUPERVISOR_ID);
        supervisor.setFullName("Dr. Test");
        otherSupervisor = new UserAccount();
        otherSupervisor.setUserId(OTHER_SUPERVISOR_ID);
        otherSupervisor.setFullName("Dr. Other");
        project = new Project();
        project.setProjectId(PROJECT_ID);
        project.setSupervisor(supervisor);
        when(projectRepository.findById(PROJECT_ID)).thenReturn(Optional.of(project));
        when(userAccountRepository.findById(SUPERVISOR_ID)).thenReturn(Optional.of(supervisor));
        when(userAccountRepository.findById(OTHER_SUPERVISOR_ID)).thenReturn(Optional.of(otherSupervisor));
        when(gradeRepository.save(any(FypGrade.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    private Map<String, Object> rubric(double criterionA, double criterionB, double criterionC) {
        Map<String, Object> r = new LinkedHashMap<>();
        r.put("methodology", criterionA);
        r.put("execution", criterionB);
        r.put("documentation", criterionC);
        return r;
    }

    // ---------- letter grade scale ----------

    @Test
    void letterGrade_bandsMatchMmuFciScale() {
        assertThat(service.toLetterGrade(BigDecimal.valueOf(85))).isEqualTo("A");
        assertThat(service.toLetterGrade(BigDecimal.valueOf(75))).isEqualTo("A-");
        assertThat(service.toLetterGrade(BigDecimal.valueOf(70))).isEqualTo("B+");
        assertThat(service.toLetterGrade(BigDecimal.valueOf(60))).isEqualTo("B-");
        assertThat(service.toLetterGrade(BigDecimal.valueOf(50))).isEqualTo("C");
        assertThat(service.toLetterGrade(BigDecimal.valueOf(40))).isEqualTo("D");
        assertThat(service.toLetterGrade(BigDecimal.valueOf(39.9))).isEqualTo("F");
        assertThat(service.toLetterGrade(null)).isNull();
    }

    @Test
    void deriveTotalScore_sumsNumericAndIgnoresOthers() {
        Map<String, Object> r = new LinkedHashMap<>();
        r.put("a", 10);
        r.put("b", 20.5);
        r.put("c", "30");
        r.put("d", "non-numeric"); // ignored
        r.put("e", null);          // ignored

        assertThat(service.deriveTotalScore(r)).isEqualByComparingTo("60.5");
    }

    // ---------- submitGrade ----------

    @Test
    void submitGrade_assignedSupervisor_savesNewDraft() {
        when(gradeRepository.findByProject_ProjectIdAndPhaseAndGrader_UserId(PROJECT_ID, "FYP2", SUPERVISOR_ID))
                .thenReturn(Optional.empty());

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("rubric", rubric(25, 25, 30));
        body.put("remarks", "Strong execution.");

        Map<String, Object> result = service.submitGrade(SUPERVISOR_ID, PROJECT_ID, "FYP2", body);

        assertThat(result.get("status")).isEqualTo("DRAFT");
        assertThat(((BigDecimal) result.get("totalScore"))).isEqualByComparingTo("80");
        assertThat(result.get("letterGrade")).isEqualTo("A");
    }

    @Test
    void submitGrade_supervisorRoleByNonAssignedSupervisor_throwsForbidden() {
        when(gradeRepository.findByProject_ProjectIdAndPhaseAndGrader_UserId(PROJECT_ID, "FYP2", OTHER_SUPERVISOR_ID))
                .thenReturn(Optional.empty());
        Map<String, Object> body = Map.of("rubric", rubric(20, 20, 20), "graderRole", "SUPERVISOR");

        assertThatThrownBy(() -> service.submitGrade(OTHER_SUPERVISOR_ID, PROJECT_ID, "FYP2", body))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("not the assigned supervisor");
    }

    @Test
    void submitGrade_canBumpDraftToSubmitted() {
        when(gradeRepository.findByProject_ProjectIdAndPhaseAndGrader_UserId(PROJECT_ID, "FYP2", SUPERVISOR_ID))
                .thenReturn(Optional.empty());
        Map<String, Object> body = Map.of("rubric", rubric(20, 20, 25), "status", "SUBMITTED");

        Map<String, Object> result = service.submitGrade(SUPERVISOR_ID, PROJECT_ID, "FYP2", body);

        assertThat(result.get("status")).isEqualTo("SUBMITTED");
    }

    @Test
    void submitGrade_finalisedRow_cannotBeEdited() {
        FypGrade existing = FypGrade.builder()
                .gradeId(99L).project(project).grader(supervisor).graderRole("SUPERVISOR")
                .phase("FYP2").status("FINALISED").build();
        when(gradeRepository.findByProject_ProjectIdAndPhaseAndGrader_UserId(PROJECT_ID, "FYP2", SUPERVISOR_ID))
                .thenReturn(Optional.of(existing));

        assertThatThrownBy(() -> service.submitGrade(SUPERVISOR_ID, PROJECT_ID, "FYP2",
                Map.of("rubric", rubric(10, 10, 10))))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("finalised");
    }

    @Test
    void submitGrade_invalidPhase_throws() {
        assertThatThrownBy(() -> service.submitGrade(SUPERVISOR_ID, PROJECT_ID, "FYP3",
                Map.of("rubric", rubric(0, 0, 0))))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("phase must be");
    }

    // ---------- finaliseGrade ----------

    @Test
    void finaliseGrade_submittedRow_locksAndSetsFinaliser() {
        UserAccount admin = new UserAccount();
        admin.setUserId(ADMIN_ID);
        admin.setFullName("Admin");
        FypGrade existing = FypGrade.builder()
                .gradeId(7L).project(project).grader(supervisor).graderRole("SUPERVISOR")
                .phase("FYP2").status("SUBMITTED").totalScore(BigDecimal.valueOf(72)).letterGrade("B+")
                .build();
        when(gradeRepository.findById(7L)).thenReturn(Optional.of(existing));
        when(userAccountRepository.findById(ADMIN_ID)).thenReturn(Optional.of(admin));

        Map<String, Object> result = service.finaliseGrade(7L, ADMIN_ID);

        assertThat(result.get("status")).isEqualTo("FINALISED");
        assertThat(result.get("finalisedBy")).isEqualTo("Admin");
        assertThat(result.get("finalisedAt")).isNotNull();
    }

    @Test
    void finaliseGrade_draftRow_throws() {
        FypGrade existing = FypGrade.builder()
                .gradeId(7L).project(project).grader(supervisor).graderRole("SUPERVISOR")
                .phase("FYP2").status("DRAFT").build();
        when(gradeRepository.findById(7L)).thenReturn(Optional.of(existing));

        assertThatThrownBy(() -> service.finaliseGrade(7L, ADMIN_ID))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Only SUBMITTED grades can be finalised");
    }

    // ---------- listForStudent ----------

    @Test
    void listForStudent_returnsOnlyFinalisedRows() {
        when(projectRepository.findByStudent_UserId(STUDENT_ID)).thenReturn(Optional.of(project));
        FypGrade finalised = FypGrade.builder()
                .gradeId(1L).project(project).grader(supervisor).graderRole("SUPERVISOR")
                .phase("FYP1").status("FINALISED").totalScore(BigDecimal.valueOf(80)).letterGrade("A")
                .build();
        when(gradeRepository.findByProject_ProjectIdAndStatusOrderByPhaseAscCreatedAtAsc(PROJECT_ID, "FINALISED"))
                .thenReturn(List.of(finalised));

        List<Map<String, Object>> grades = service.listForStudent(STUDENT_ID);

        assertThat(grades).hasSize(1);
        assertThat(grades.get(0).get("letterGrade")).isEqualTo("A");
    }

    @Test
    void listForStudent_noProject_returnsEmpty() {
        when(projectRepository.findByStudent_UserId(STUDENT_ID)).thenReturn(Optional.empty());
        assertThat(service.listForStudent(STUDENT_ID)).isEmpty();
    }
}
