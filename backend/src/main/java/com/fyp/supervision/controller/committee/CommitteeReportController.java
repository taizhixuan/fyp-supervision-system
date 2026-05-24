package com.fyp.supervision.controller.committee;

import com.fyp.supervision.service.CommitteeReportService;
import com.fyp.supervision.service.report.ReportFormat;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.PathResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/committee/reports")
@RequiredArgsConstructor
public class CommitteeReportController {

    private final CommitteeReportService committeeReportService;

    @GetMapping
    public ResponseEntity<?> getReports() {
        List<Map<String, Object>> reports = committeeReportService.getReportDtos();
        return ResponseEntity.ok(Map.of("reports", reports, "total", reports.size()));
    }

    /** Canonical generate endpoint. */
    @PostMapping("/generate")
    public ResponseEntity<?> generateCanonical(@AuthenticationPrincipal UserDetails user,
                                               @RequestBody Map<String, Object> config) {
        return doGenerate(user, config);
    }

    /** Back-compat alias — accepts the same payload at the bare collection URL. */
    @PostMapping
    public ResponseEntity<?> generateAlias(@AuthenticationPrincipal UserDetails user,
                                           @RequestBody Map<String, Object> config) {
        return doGenerate(user, config);
    }

    private ResponseEntity<?> doGenerate(UserDetails user, Map<String, Object> config) {
        try {
            Long userId = Long.parseLong(user.getUsername());
            Map<String, Object> result = committeeReportService.generateReport(userId, config);
            return ResponseEntity.ok(result);
        } catch (IOException e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("message", "Failed to generate report: " + e.getMessage()));
        }
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<Resource> downloadReport(@PathVariable Long id) {
        try {
            Path path = committeeReportService.getReportFilePath(id);
            ReportFormat fmt = committeeReportService.getReportFormat(id);
            Resource resource = new PathResource(path);
            String filename = path.getFileName() != null ? path.getFileName().toString()
                    : ("report." + fmt.extension);
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(fmt.contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteReport(@PathVariable Long id) {
        try {
            committeeReportService.deleteReport(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
}
