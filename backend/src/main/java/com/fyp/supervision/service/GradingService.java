package com.fyp.supervision.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fyp.supervision.entity.FypGrade;
import com.fyp.supervision.entity.Project;
import com.fyp.supervision.entity.UserAccount;
import com.fyp.supervision.exception.BadRequestException;
import com.fyp.supervision.exception.ForbiddenException;
import com.fyp.supervision.exception.ResourceNotFoundException;
import com.fyp.supervision.repository.FypGradeRepository;
import com.fyp.supervision.repository.ProjectRepository;
import com.fyp.supervision.repository.UserAccountRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;

/**
 * Final-report grading. One {@link FypGrade} row per (project, phase, grader). Status
 * flow: DRAFT → SUBMITTED (grader signs off) → FINALISED (admin locks it; student sees).
 *
 * <p>The rubric structure is intentionally untyped — stored as JSON {@code rubricJson}
 * the grader posts. The service derives {@code totalScore} (sum of criterion marks) and
 * {@code letterGrade} (MMU FCI scale) for fast filtering and student display.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class GradingService {

    private final FypGradeRepository gradeRepository;
    private final ProjectRepository projectRepository;
    private final UserAccountRepository userAccountRepository;
    private final ObjectMapper objectMapper;

    private static final List<String> ALLOWED_PHASES = List.of("FYP1", "FYP2");
    private static final List<String> ALLOWED_STATUSES_FOR_GRADER_EDIT = List.of("DRAFT", "SUBMITTED");

    // ---------- Reads ----------

    /** Grades visible to admin/committee — every row for a project. */
    public List<Map<String, Object>> listForProject(Long projectId) {
        return gradeRepository.findByProject_ProjectIdOrderByCreatedAtDesc(projectId).stream()
                .map(this::buildDto).toList();
    }

    /** Admin inbox — all grades in a given status (typically SUBMITTED, awaiting finalisation). */
    public List<Map<String, Object>> listByStatus(String status) {
        return gradeRepository.findByStatusOrderByUpdatedAtDesc(status).stream()
                .map(this::buildDto).toList();
    }

    /** Supervisor's grading queue — every row they authored. */
    public List<Map<String, Object>> listForGrader(Long graderUserId) {
        return gradeRepository.findByGrader_UserIdOrderByUpdatedAtDesc(graderUserId).stream()
                .map(this::buildDto).toList();
    }

    /**
     * Student-facing read — only FINALISED grades are visible. The student must own
     * the project; otherwise 403.
     */
    public List<Map<String, Object>> listForStudent(Long studentUserId) {
        Project project = projectRepository.findByStudent_UserId(studentUserId).orElse(null);
        if (project == null) return List.of();
        return gradeRepository.findByProject_ProjectIdAndStatusOrderByPhaseAscCreatedAtAsc(
                project.getProjectId(), "FINALISED").stream()
                .map(this::buildDto).toList();
    }

    // ---------- Writes ----------

    /**
     * Create or update the grader's grade row for a (project, phase). Idempotent — if a
     * row already exists, it's updated in place. Only the assigned supervisor can grade
     * their own student's project (defence-in-depth — the URL prefix already restricts
     * to SUPERVISOR role, but per-student ownership is a finer check).
     */
    @Transactional
    public Map<String, Object> submitGrade(Long graderUserId, Long projectId, String phase,
                                           Map<String, Object> payload) {
        if (!ALLOWED_PHASES.contains(phase)) {
            throw new BadRequestException("phase must be FYP1 or FYP2");
        }
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));
        UserAccount grader = userAccountRepository.findById(graderUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Grader not found"));

        // Per-student ownership check — only the assigned supervisor (or an admin via a
        // future override flag) can leave a SUPERVISOR-role grade.
        boolean isAssignedSupervisor = project.getSupervisor() != null
                && Objects.equals(project.getSupervisor().getUserId(), graderUserId);
        String requestedRole = (String) payload.getOrDefault("graderRole", "SUPERVISOR");
        if ("SUPERVISOR".equals(requestedRole) && !isAssignedSupervisor) {
            throw new ForbiddenException("You are not the assigned supervisor for this project.");
        }

        FypGrade grade = gradeRepository
                .findByProject_ProjectIdAndPhaseAndGrader_UserId(projectId, phase, graderUserId)
                .orElseGet(() -> FypGrade.builder()
                        .project(project)
                        .phase(phase)
                        .grader(grader)
                        .graderRole(requestedRole)
                        .status("DRAFT")
                        .build());

        // Once finalised, even the original grader can't edit — admin must un-finalise
        // (currently no endpoint for that; intentional — keeps the audit trail clean).
        if ("FINALISED".equals(grade.getStatus())) {
            throw new BadRequestException("Grade is finalised and cannot be edited.");
        }

        @SuppressWarnings("unchecked")
        Map<String, Object> rubric = (Map<String, Object>) payload.getOrDefault("rubric", Map.of());
        grade.setRubricJson(toJson(rubric));
        grade.setTotalScore(deriveTotalScore(rubric));
        grade.setLetterGrade(toLetterGrade(grade.getTotalScore()));
        if (payload.containsKey("remarks")) grade.setRemarks((String) payload.get("remarks"));

        // Status transition: bump DRAFT → SUBMITTED if caller asked for it.
        String requestedStatus = (String) payload.getOrDefault("status", grade.getStatus());
        if ("SUBMITTED".equals(requestedStatus) && "DRAFT".equals(grade.getStatus())) {
            grade.setStatus("SUBMITTED");
        }
        if (!ALLOWED_STATUSES_FOR_GRADER_EDIT.contains(grade.getStatus())) {
            throw new BadRequestException("Cannot edit a grade in status " + grade.getStatus());
        }

        return buildDto(gradeRepository.save(grade));
    }

    /**
     * Lock a SUBMITTED grade. From here on it's visible to the student and immutable
     * for the grader.
     */
    @Transactional
    public Map<String, Object> finaliseGrade(Long gradeId, Long adminUserId) {
        FypGrade grade = gradeRepository.findById(gradeId)
                .orElseThrow(() -> new ResourceNotFoundException("Grade not found"));
        if (!"SUBMITTED".equals(grade.getStatus())) {
            throw new BadRequestException(
                    "Only SUBMITTED grades can be finalised (current status: " + grade.getStatus() + ").");
        }
        UserAccount admin = userAccountRepository.findById(adminUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Admin not found"));
        grade.setStatus("FINALISED");
        grade.setFinalisedBy(admin);
        grade.setFinalisedAt(LocalDateTime.now());
        return buildDto(gradeRepository.save(grade));
    }

    // ---------- Helpers ----------

    /** Sum the numeric values of a rubric map. Non-numeric values are ignored. */
    public BigDecimal deriveTotalScore(Map<String, Object> rubric) {
        if (rubric == null || rubric.isEmpty()) return BigDecimal.ZERO;
        BigDecimal sum = BigDecimal.ZERO;
        for (Object v : rubric.values()) {
            if (v instanceof Number n) {
                sum = sum.add(BigDecimal.valueOf(n.doubleValue()));
            } else if (v instanceof String s) {
                try { sum = sum.add(new BigDecimal(s.trim())); }
                catch (NumberFormatException ignored) { /* skip non-numeric */ }
            }
        }
        return sum;
    }

    /** MMU FCI grading scale (rough). Tune later if HQ changes the bands. */
    public String toLetterGrade(BigDecimal totalScore) {
        if (totalScore == null) return null;
        double s = totalScore.doubleValue();
        if (s >= 80) return "A";
        if (s >= 75) return "A-";
        if (s >= 70) return "B+";
        if (s >= 65) return "B";
        if (s >= 60) return "B-";
        if (s >= 55) return "C+";
        if (s >= 50) return "C";
        if (s >= 45) return "C-";
        if (s >= 40) return "D";
        return "F";
    }

    private Map<String, Object> buildDto(FypGrade grade) {
        Map<String, Object> dto = new LinkedHashMap<>();
        dto.put("gradeId", grade.getGradeId());
        dto.put("projectId", grade.getProject() != null ? grade.getProject().getProjectId() : null);
        dto.put("phase", grade.getPhase());
        dto.put("graderUserId", grade.getGrader() != null ? grade.getGrader().getUserId() : null);
        dto.put("graderName", grade.getGrader() != null ? grade.getGrader().getFullName() : null);
        dto.put("graderRole", grade.getGraderRole());
        dto.put("rubric", parseJsonMap(grade.getRubricJson()));
        dto.put("totalScore", grade.getTotalScore());
        dto.put("letterGrade", grade.getLetterGrade());
        dto.put("remarks", grade.getRemarks());
        dto.put("status", grade.getStatus());
        dto.put("finalisedAt", grade.getFinalisedAt() != null ? grade.getFinalisedAt().toString() : null);
        dto.put("finalisedBy", grade.getFinalisedBy() != null ? grade.getFinalisedBy().getFullName() : null);
        dto.put("createdAt", grade.getCreatedAt() != null ? grade.getCreatedAt().toString() : null);
        dto.put("updatedAt", grade.getUpdatedAt() != null ? grade.getUpdatedAt().toString() : null);
        return dto;
    }

    private String toJson(Object obj) {
        try { return objectMapper.writeValueAsString(obj); }
        catch (Exception e) { return "{}"; }
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> parseJsonMap(String json) {
        if (json == null || json.isBlank()) return Map.of();
        try { return objectMapper.readValue(json, Map.class); }
        catch (Exception e) { return Map.of(); }
    }

    /** Used by GradingService callers that need the entity directly. */
    public Optional<FypGrade> findEntity(Long gradeId) {
        return gradeRepository.findById(gradeId);
    }
}
