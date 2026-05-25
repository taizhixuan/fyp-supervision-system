package com.fyp.supervision.controller.admin;

import com.fyp.supervision.entity.IntegrationSetting;
import com.fyp.supervision.exception.ResourceNotFoundException;
import com.fyp.supervision.repository.IntegrationSettingRepository;
import com.fyp.supervision.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.HttpURLConnection;
import java.net.URI;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/admin/integrations")
@RequiredArgsConstructor
public class AdminIntegrationController {
    private final IntegrationSettingRepository integrationRepository;
    private final AdminService adminService;

    @GetMapping
    public ResponseEntity<?> getIntegrations() {
        return ResponseEntity.ok(adminService.getIntegrations());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getIntegration(@PathVariable Long id) {
        return ResponseEntity.ok(adminService.getIntegrationDetail(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateIntegration(@PathVariable Long id, @RequestBody Map<String, Object> data) {
        IntegrationSetting setting = integrationRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Not found"));
        if (data.containsKey("endpointUrl")) setting.setEndpointUrl((String) data.get("endpointUrl"));
        if (data.containsKey("status")) setting.setStatus((String) data.get("status"));
        if (data.containsKey("settingsJson")) setting.setSettingsJson((String) data.get("settingsJson"));
        integrationRepository.save(setting);
        return ResponseEntity.ok(Map.of("success", true));
    }

    /**
     * Actually probe the integration's endpoint with an HTTP HEAD (5 s connect, 5 s read).
     * SUCCESS only when the response code is < 400. Failures persist FAILED and surface
     * the underlying error so admins can debug instead of being lied to.
     */
    @PostMapping("/{id}/test")
    public ResponseEntity<?> testIntegration(@PathVariable Long id) {
        IntegrationSetting setting = integrationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Not found"));
        setting.setLastTestedAt(LocalDateTime.now());

        Map<String, Object> result = new LinkedHashMap<>();
        String url = setting.getEndpointUrl();
        if (url == null || url.isBlank()) {
            setting.setLastTestResult("FAILED");
            integrationRepository.save(setting);
            result.put("success", false);
            result.put("message", "No endpoint URL configured.");
            return ResponseEntity.ok(result);
        }

        long start = System.currentTimeMillis();
        try {
            HttpURLConnection conn = (HttpURLConnection) URI.create(url).toURL().openConnection();
            conn.setRequestMethod("HEAD");
            conn.setConnectTimeout(5_000);
            conn.setReadTimeout(5_000);
            conn.setInstanceFollowRedirects(true);
            int code = conn.getResponseCode();
            long elapsed = System.currentTimeMillis() - start;
            boolean ok = code > 0 && code < 400;
            setting.setLastTestResult(ok ? "SUCCESS" : "FAILED");
            integrationRepository.save(setting);
            result.put("success", ok);
            result.put("message", ok ? "Connection test passed." : "HTTP " + code);
            result.put("responseTime", elapsed);
            result.put("statusCode", code);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            long elapsed = System.currentTimeMillis() - start;
            setting.setLastTestResult("FAILED");
            integrationRepository.save(setting);
            result.put("success", false);
            result.put("message", e.getClass().getSimpleName() + ": " + e.getMessage());
            result.put("responseTime", elapsed);
            return ResponseEntity.ok(result);
        }
    }
}
