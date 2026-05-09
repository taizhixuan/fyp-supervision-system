package com.fyp.supervision.controller.admin;

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
@RequestMapping("/admin/grades")
@RequiredArgsConstructor
public class AdminGradeController {
    private final GradingService gradingService;
    private final AuditService auditService;
    private final UserAccountRepository userAccountRepository;

    /** All grade rows for a project (any phase, any grader). */
    @GetMapping("/project/{projectId}")
    public ResponseEntity<?> forProject(@PathVariable Long projectId) {
        List<Map<String, Object>> grades = gradingService.listForProject(projectId);
        return ResponseEntity.ok(Map.of("grades", grades, "total", grades.size()));
    }

    /** Admin inbox — defaults to SUBMITTED rows awaiting finalisation. */
    @GetMapping
    public ResponseEntity<?> list(@RequestParam(defaultValue = "SUBMITTED") String status) {
        List<Map<String, Object>> grades = gradingService.listByStatus(status);
        return ResponseEntity.ok(Map.of("grades", grades, "total", grades.size()));
    }

    /**
     * Lock a SUBMITTED grade. After this the student can see it on their dashboard and
     * the grader can no longer edit it.
     */
    @PostMapping("/{gradeId}/finalise")
    public ResponseEntity<?> finalise(@AuthenticationPrincipal UserDetails admin,
                                      HttpServletRequest httpRequest,
                                      @PathVariable Long gradeId) {
        Long adminId = Long.parseLong(admin.getUsername());
        Map<String, Object> result = gradingService.finaliseGrade(gradeId, adminId);
        UserAccount actor = userAccountRepository.findById(adminId).orElse(null);
        auditService.record(actor, "GRADE_FINALISED", "FYP_GRADE", String.valueOf(gradeId),
                "project=" + result.get("projectId") + " phase=" + result.get("phase")
                        + " score=" + result.get("totalScore")
                        + " (" + result.get("letterGrade") + ")",
                httpRequest);
        return ResponseEntity.ok(result);
    }
}
