package com.fyp.supervision.controller.admin;

import com.fyp.supervision.service.AdminExportService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.PathResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin/export-configs")
@RequiredArgsConstructor
public class AdminExportController {

    private final AdminExportService adminExportService;

    @GetMapping
    public ResponseEntity<?> getExportConfigs() {
        List<Map<String, Object>> configs = adminExportService.getConfigDtos();
        return ResponseEntity.ok(Map.of("configs", configs, "total", configs.size()));
    }

    @PostMapping
    public ResponseEntity<?> createExportConfig(@RequestBody Map<String, Object> data) {
        Map<String, Object> created = adminExportService.createConfig(data);
        return ResponseEntity.ok(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateExportConfig(@PathVariable Long id, @RequestBody Map<String, Object> data) {
        return ResponseEntity.ok(adminExportService.updateConfig(id, data));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteExportConfig(@PathVariable Long id) {
        adminExportService.deleteConfig(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/run")
    public ResponseEntity<?> runExport(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(adminExportService.runExport(id));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("message", "Export failed: " + e.getMessage()));
        }
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<Resource> downloadExport(@PathVariable Long id) {
        try {
            var path = adminExportService.getExportFilePath(id);
            Resource resource = new PathResource(path);
            String filename = path.getFileName() != null ? path.getFileName().toString() : "export.csv";
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType("text/csv"))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
}
