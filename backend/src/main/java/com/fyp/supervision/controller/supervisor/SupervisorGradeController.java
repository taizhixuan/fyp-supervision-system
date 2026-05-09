package com.fyp.supervision.controller.supervisor;

import com.fyp.supervision.entity.UserAccount;
import com.fyp.supervision.repository.UserAccountRepository;
import com.fyp.supervision.service.AuditService;
import com.fyp.supervision.service.GradingService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/supervisor/grades")
@RequiredArgsConstructor
public class SupervisorGradeController {
    private final GradingService gradingService;
    private final AuditService auditService;
    private final UserAccountRepository userAccountRepository;

    /** Grader's queue — all grade rows authored by this supervisor. */
    @GetMapping
    public ResponseEntity<?> myGrades(@AuthenticationPrincipal UserDetails user) {
        Long uid = Long.parseLong(user.getUsername());
        List<Map<String, Object>> grades = gradingService.listForGrader(uid);
        return ResponseEntity.ok(Map.of("grades", grades, "total", grades.size()));
    }

    /**
     * Submit (or update a DRAFT) grade for a project + phase.
     * Body: {@code { projectId, phase, rubric: {criterionA:.., ..}, remarks?, status? }}
     * Setting {@code status: SUBMITTED} signs the grade off; admin must then finalise.
     */
    @PostMapping
    public ResponseEntity<?> submit(@AuthenticationPrincipal UserDetails user,
                                    HttpServletRequest httpRequest,
                                    @RequestBody Map<String, Object> body) {
        Long uid = Long.parseLong(user.getUsername());
        Long projectId = ((Number) body.get("projectId")).longValue();
        String phase = (String) body.getOrDefault("phase", "FYP2");
        Map<String, Object> result = gradingService.submitGrade(uid, projectId, phase, body);
        // Audit only when the grader signs off (SUBMITTED), not on every DRAFT save.
        if ("SUBMITTED".equals(result.get("status"))) {
            UserAccount actor = userAccountRepository.findById(uid).orElse(null);
            auditService.record(actor, "GRADE_SUBMITTED", "FYP_GRADE",
                    String.valueOf(result.get("gradeId")),
                    "project=" + projectId + " phase=" + phase
                            + " score=" + result.get("totalScore")
                            + " (" + result.get("letterGrade") + ")",
                    httpRequest);
        }
        return ResponseEntity.ok(result);
    }
}
