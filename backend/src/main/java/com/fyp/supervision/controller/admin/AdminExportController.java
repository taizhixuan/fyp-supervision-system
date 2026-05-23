package com.fyp.supervision.controller.admin;

import com.fyp.supervision.entity.ExportConfig;
import com.fyp.supervision.repository.ExportConfigRepository;
import com.fyp.supervision.service.AdminExportService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.PathResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin/export-configs")
@RequiredArgsConstructor
public class AdminExportController {

    private final AdminExportService adminExportService;
    private final ExportConfigRepository exportConfigRepository;

    @GetMapping
    public ResponseEntity<?> getExportConfigs() {
        List<Map<String, Object>> configs = adminExportService.getConfigDtos();
        return ResponseEntity.ok(Map.of("configs", configs, "total", configs.size()));
    }

    @PostMapping
    public ResponseEntity<?> createExportConfig(
            @AuthenticationPrincipal UserDetails user,
            @RequestBody Map<String, Object> data) {
        Long userId = parseUserId(user);
        Map<String, Object> created = adminExportService.createConfig(userId, data);
        return ResponseEntity.ok(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateExportConfig(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable Long id,
            @RequestBody Map<String, Object> data) {
        Long userId = parseUserId(user);
        return ResponseEntity.ok(adminExportService.updateConfig(userId, id, data));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteExportConfig(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable Long id) {
        Long userId = parseUserId(user);
        adminExportService.deleteConfig(userId, id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/run")
    public ResponseEntity<?> runExport(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable Long id) {
        Long userId = parseUserId(user);
        try {
            return ResponseEntity.ok(adminExportService.runExport(userId, id));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("message", "Export failed: " + e.getMessage()));
        }
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<Resource> downloadExport(@PathVariable Long id) {
        try {
            ExportConfig config = exportConfigRepository.findById(id).orElse(null);
            if (config == null) return ResponseEntity.notFound().build();
            var path = adminExportService.getExportFilePath(id);
            Resource resource = new PathResource(path);
            String filename = adminExportService.fileNameForConfig(config);
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(adminExportService.contentTypeFor(config)))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    private Long parseUserId(UserDetails user) {
        if (user == null) return null;
        try {
            return Long.parseLong(user.getUsername());
        } catch (Exception e) {
            return null;
        }
    }
}
