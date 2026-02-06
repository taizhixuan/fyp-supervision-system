package com.fyp.supervision.controller.admin;

import com.fyp.supervision.service.AdminMaintenanceService;
import com.fyp.supervision.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.PathResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.nio.file.Path;
import java.util.Map;

@RestController
@RequestMapping("/admin/maintenance")
@RequiredArgsConstructor
public class AdminMaintenanceController {

    private final AdminService adminService;
    private final AdminMaintenanceService adminMaintenanceService;

    @GetMapping("/jobs")
    public ResponseEntity<?> getJobs() {
        return ResponseEntity.ok(adminMaintenanceService.getJobs());
    }

    @GetMapping("/backups")
    public ResponseEntity<?> getBackups() {
        return ResponseEntity.ok(adminMaintenanceService.getBackups());
    }

    @GetMapping("/health-checks")
    public ResponseEntity<?> getHealthChecks() {
        return ResponseEntity.ok(adminService.getHealthChecks());
    }

    @PostMapping("/backup")
    public ResponseEntity<?> createBackup(
            @AuthenticationPrincipal UserDetails user,
            @RequestBody(required = false) Map<String, Object> data) {
        Long userId = user != null ? Long.parseLong(user.getUsername()) : null;
        Map<String, Object> body = data != null ? data : Map.of();
        return ResponseEntity.ok(adminMaintenanceService.createBackup(userId, body));
    }

    @PostMapping("/restore/{id}")
    public ResponseEntity<?> restoreBackup(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable String id) {
        Long userId = user != null ? Long.parseLong(user.getUsername()) : null;
        return ResponseEntity.ok(adminMaintenanceService.restoreBackup(userId, id));
    }

    @PostMapping("/cleanup")
    public ResponseEntity<?> cleanup(
            @AuthenticationPrincipal UserDetails user,
            @RequestBody(required = false) Map<String, Object> options) {
        Long userId = user != null ? Long.parseLong(user.getUsername()) : null;
        Map<String, Object> body = options != null ? options : Map.of();
        return ResponseEntity.ok(adminMaintenanceService.cleanup(userId, body));
    }

    @PostMapping("/clear-cache")
    public ResponseEntity<?> clearCache() {
        return ResponseEntity.ok(adminMaintenanceService.clearCache());
    }

    @GetMapping("/backups/download")
    public ResponseEntity<Resource> downloadBackup(@RequestParam String file) {
        Path path = adminMaintenanceService.getBackupFilePath(file);
        Resource resource = new PathResource(path);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + path.getFileName().toString() + "\"")
                .body(resource);
    }
}
