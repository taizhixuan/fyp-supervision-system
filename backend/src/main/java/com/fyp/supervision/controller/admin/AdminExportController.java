package com.fyp.supervision.controller.admin;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin/export-configs")
@RequiredArgsConstructor
public class AdminExportController {

    @GetMapping
    public ResponseEntity<?> getExportConfigs() {
        return ResponseEntity.ok(Map.of("configs", List.of()));
    }

    @PostMapping
    public ResponseEntity<?> createExportConfig(@RequestBody Map<String, Object> data) {
        return ResponseEntity.ok(Map.of("configId", "1"));
    }

    @PostMapping("/{id}/run")
    public ResponseEntity<?> runExport(@PathVariable Long id) {
        return ResponseEntity.ok(Map.of("downloadUrl", "/api/admin/export-configs/" + id + "/download"));
    }
}
