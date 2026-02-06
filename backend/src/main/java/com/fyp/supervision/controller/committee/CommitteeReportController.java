package com.fyp.supervision.controller.committee;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/committee/reports")
@RequiredArgsConstructor
public class CommitteeReportController {

    @GetMapping
    public ResponseEntity<?> getReports() {
        return ResponseEntity.ok(Map.of("reports", List.of()));
    }

    @PostMapping("/generate")
    public ResponseEntity<?> generateReport(@RequestBody Map<String, Object> config) {
        // Placeholder — will generate reports
        return ResponseEntity.ok(Map.of("reportId", "1", "downloadUrl", "/api/committee/reports/1/download"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteReport(@PathVariable Long id) {
        return ResponseEntity.noContent().build();
    }
}
