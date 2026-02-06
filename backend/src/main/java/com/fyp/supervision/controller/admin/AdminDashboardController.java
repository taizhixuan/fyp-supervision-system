package com.fyp.supervision.controller.admin;

import com.fyp.supervision.enums.*;
import com.fyp.supervision.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/admin/dashboard")
@RequiredArgsConstructor
public class AdminDashboardController {
    private final UserAccountRepository userRepo;
    private final ProjectRepository projectRepo;
    private final ProposalRepository proposalRepo;

    @GetMapping
    public ResponseEntity<?> getDashboard() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalUsers", userRepo.count());
        stats.put("totalStudents", userRepo.countByRole(UserRole.STUDENT));
        stats.put("totalSupervisors", userRepo.countByRole(UserRole.SUPERVISOR));
        stats.put("pendingApprovals", userRepo.countByStatus(UserStatus.PENDING));
        stats.put("activeProjects", projectRepo.countByStatus(ProjectStatus.ACTIVE));
        stats.put("alerts", List.of());
        stats.put("recentActivity", List.of());
        return ResponseEntity.ok(stats);
    }
}
