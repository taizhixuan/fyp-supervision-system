package com.fyp.supervision.controller.admin;

import com.fyp.supervision.config.FileStorageConfig;
import com.fyp.supervision.entity.IntegrationSetting;
import com.fyp.supervision.exception.ResourceNotFoundException;
import com.fyp.supervision.repository.IntegrationSettingRepository;
import com.fyp.supervision.service.AdminService;
import com.fyp.supervision.service.AiServiceClient;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.HttpURLConnection;
import java.net.InetAddress;
import java.net.URI;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;

@RestController
@RequestMapping("/admin/integrations")
@RequiredArgsConstructor
public class AdminIntegrationController {
    private final IntegrationSettingRepository integrationRepository;
    private final AdminService adminService;
    private final AiServiceClient aiServiceClient;
    private final FileStorageConfig fileStorageConfig;

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

        // AI microservices and local storage aren't public HTTP endpoints, so test them
        // against their real internal health instead of a HEAD request to a URL.
        String type = setting.getIntegrationType() == null ? "" : setting.getIntegrationType().trim();
        if ("AI".equalsIgnoreCase(type)) {
            String name = setting.getName() == null ? "" : setting.getName().trim();
            Boolean ok = null;
            if (name.equalsIgnoreCase("Recommendation Service")) ok = aiServiceClient.isRecommendationServiceHealthy();
            else if (name.equalsIgnoreCase("Proposal Analyzer")) ok = aiServiceClient.isAnalyzerServiceHealthy();
            else if (name.equalsIgnoreCase("FYP Chatbot")) ok = aiServiceClient.isChatbotServiceHealthy();
            if (ok != null) {
                setting.setLastTestResult(ok ? "SUCCESS" : "FAILED");
                integrationRepository.save(setting);
                result.put("success", ok);
                result.put("message", ok ? name + " responded on /ai/health." : name + " health check failed.");
                return ResponseEntity.ok(result);
            }
            // Unknown AI row falls through to the generic HTTP test below.
        }
        if ("STORAGE".equalsIgnoreCase(type)) {
            Path p = fileStorageConfig.getUploadPath();
            boolean ok = p != null && Files.isDirectory(p) && Files.isWritable(p);
            setting.setLastTestResult(ok ? "SUCCESS" : "FAILED");
            integrationRepository.save(setting);
            result.put("success", ok);
            result.put("message", ok
                    ? "Upload directory is writable: " + p
                    : "Upload directory missing or not writable: " + p);
            return ResponseEntity.ok(result);
        }

        String url = setting.getEndpointUrl();
        if (url == null || url.isBlank()) {
            setting.setLastTestResult("FAILED");
            integrationRepository.save(setting);
            result.put("success", false);
            result.put("message", "No endpoint URL configured.");
            return ResponseEntity.ok(result);
        }

        long start = System.currentTimeMillis();
        HttpURLConnection conn = null;
        try {
            validateOutboundUrl(url);
            conn = (HttpURLConnection) URI.create(url).toURL().openConnection();
            conn.setRequestMethod("HEAD");
            conn.setConnectTimeout(5_000);
            conn.setReadTimeout(5_000);
            // Don't follow redirects — a 30x could bounce to an internal host and defeat
            // the address check below (SSRF).
            conn.setInstanceFollowRedirects(false);
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
        } finally {
            if (conn != null) conn.disconnect();
        }
    }

    /**
     * Reject anything that isn't a plain http/https URL pointing at a public host, so the
     * server can't be tricked into probing internal services or cloud metadata (SSRF).
     */
    private void validateOutboundUrl(String url) throws Exception {
        URI uri = URI.create(url);
        String scheme = uri.getScheme();
        if (scheme == null
                || !(scheme.equalsIgnoreCase("http") || scheme.equalsIgnoreCase("https"))) {
            throw new IllegalArgumentException("Only http/https endpoints are allowed.");
        }
        String host = uri.getHost();
        if (host == null || host.isBlank()) {
            throw new IllegalArgumentException("Endpoint URL has no host.");
        }
        String h = host.toLowerCase(Locale.ROOT);
        if (h.equals("metadata.google.internal")) {
            throw new IllegalArgumentException("Endpoint resolves to a disallowed internal address.");
        }
        for (InetAddress addr : InetAddress.getAllByName(host)) {
            if (addr.isLoopbackAddress() || addr.isAnyLocalAddress() || addr.isLinkLocalAddress()
                    || addr.isSiteLocalAddress() || addr.isMulticastAddress()) {
                throw new IllegalArgumentException("Endpoint resolves to a disallowed internal address.");
            }
        }
    }
}
