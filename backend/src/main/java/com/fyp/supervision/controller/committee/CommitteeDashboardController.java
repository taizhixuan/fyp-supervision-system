package com.fyp.supervision.controller.committee;

import com.fyp.supervision.enums.*;
import com.fyp.supervision.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/committee/dashboard")
@RequiredArgsConstructor
public class CommitteeDashboardController {
    private final UserAccountRepository userRepo;
    private final ProjectRepository projectRepo;
    private final ProposalRepository proposalRepo;
    private final SupervisorRequestRepository requestRepo;

    @GetMapping
    public ResponseEntity<?> getDashboard() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalStudents", userRepo.countByRole(UserRole.STUDENT));
        stats.put("totalSupervisors", userRepo.countByRole(UserRole.SUPERVISOR));
        stats.put("activeProjects", projectRepo.countByStatus(ProjectStatus.ACTIVE));
        stats.put("pendingProposals", proposalRepo.countByStatus(ProposalStatus.SUBMITTED));
        stats.put("approvedProposals", proposalRepo.countByStatus(ProposalStatus.APPROVED));
        stats.put("alerts", List.of());
        stats.put("recentActivities", List.of());
        return ResponseEntity.ok(stats);
    }
}
