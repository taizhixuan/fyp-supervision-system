package com.fyp.supervision.controller.admin;

import com.fyp.supervision.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/admin/dashboard")
@RequiredArgsConstructor
public class AdminDashboardController {
    private final AdminService adminService;

    @GetMapping
    public ResponseEntity<?> getDashboard() {
        return ResponseEntity.ok(adminService.getDashboard());
    }
}
