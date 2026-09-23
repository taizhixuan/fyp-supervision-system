package com.fyp.supervision.controller.admin;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fyp.supervision.config.FileStorageConfig;
import com.fyp.supervision.entity.IntegrationSetting;
import com.fyp.supervision.entity.UserAccount;
import com.fyp.supervision.exception.BadRequestException;
import com.fyp.supervision.exception.ResourceNotFoundException;
import com.fyp.supervision.repository.IntegrationSettingRepository;
import com.fyp.supervision.repository.UserAccountRepository;
import com.fyp.supervision.service.AdminService;
import com.fyp.supervision.service.AiServiceClient;
import com.fyp.supervision.service.AuditService;
import com.fyp.supervision.service.LlmConfigService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.net.HttpURLConnection;
import java.net.InetAddress;
import java.net.URI;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/admin/integrations")
@RequiredArgsConstructor
public class AdminIntegrationController {
    private static final Set<String> STATUSES = Set.of("ACTIVE", "INACTIVE");

    private final IntegrationSettingRepository integrationRepository;
    private final AdminService adminService;
    private final AiServiceClient aiServiceClient;
    private final FileStorageConfig fileStorageConfig;
    private final LlmConfigService llmConfigService;
    private final AuditService auditService;
    private final UserAccountRepository userAccountRepository;
    private final ObjectMapper objectMapper;

    @Value("${app.email.enabled:false}")
    private boolean emailEnabled;
    @Value("${spring.mail.host:}")
    private String mailHost;
    @Value("${spring.mail.port:}")
    private String mailPort;
    @Value("${app.email.from:}")
    private String mailFrom;
    @Value("${app.ai.recommendation-url}")
    private String recommendationUrl;
    @Value("${app.ai.analyzer-url}")
    private String analyzerUrl;
    @Value("${app.ai.chatbot-url}")
    private String chatbotUrl;

    @GetMapping
    @SuppressWarnings("unchecked")
    public ResponseEntity<?> getIntegrations() {
        Map<String, Object> body = new LinkedHashMap<>(adminService.getIntegrations());
        List<Map<String, Object>> rows = (List<Map<String, Object>>) body.get("integrations");
        rows.forEach(this::addRuntime);
        return ResponseEntity.ok(body);
    }

    @GetMapping("/{id:\\d+}")
    public ResponseEntity<?> getIntegration(@PathVariable Long id) {
        Map<String, Object> dto = adminService.getIntegrationDetail(id);
        addRuntime(dto);
        return ResponseEntity.ok(dto);
    }

    /** Enable/disable a row, or replace its settings. */
    @PutMapping("/{id:\\d+}")
    public ResponseEntity<?> updateIntegration(@PathVariable Long id, @RequestBody Map<String, Object> data,
                                               @AuthenticationPrincipal UserDetails principal,
                                               HttpServletRequest httpRequest) {
        IntegrationSetting setting = integrationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Integration not found"));
        String before = setting.getStatus();
        if (data.containsKey("status")) {
            String status = String.valueOf(data.get("status")).trim().toUpperCase(Locale.ROOT);
            if (!STATUSES.contains(status)) {
                throw new BadRequestException("Status must be ACTIVE or INACTIVE.");
            }
            setting.setStatus(status);
        }
        if (data.containsKey("endpointUrl")) {
            Object url = data.get("endpointUrl");
            setting.setEndpointUrl(url == null || url.toString().isBlank() ? null : url.toString().trim());
        }
        // The UI sends `settings` as an object; older callers sent a raw `settingsJson` string.
        // The LLM row's settings only change through PUT /llm, which validates them.
        if (!isLlm(setting)) {
            if (data.get("settings") instanceof Map<?, ?> settings) {
                try {
                    setting.setSettingsJson(objectMapper.writeValueAsString(settings));
                } catch (Exception e) {
                    throw new BadRequestException("Settings could not be saved.");
                }
            } else if (data.get("settingsJson") instanceof String json) {
                setting.setSettingsJson(json);
            }
        }
        UserAccount actor = actorOf(principal);
        setting.setUpdatedBy(actor);
        integrationRepository.save(setting);

        // Toggling the LLM row changes what the AI services should run right now.
        if (isLlm(setting)) {
            llmConfigService.apply();
        }
        auditService.record(actor, "INTEGRATION_UPDATED", "INTEGRATION_SETTING", String.valueOf(id),
                setting.getName() + ": " + before + " -> " + setting.getStatus(), httpRequest);

        Map<String, Object> dto = adminService.buildIntegrationDto(setting);
        addRuntime(dto);
        return ResponseEntity.ok(dto);
    }

    // ---------- LLM provider (chatbot + analyzer) ----------

    @GetMapping("/llm")
    public ResponseEntity<?> getLlm() {
        return ResponseEntity.ok(llmConfigService.status());
    }

    @PutMapping("/llm")
    public ResponseEntity<?> updateLlm(@RequestBody Map<String, Object> body,
                                       @AuthenticationPrincipal UserDetails principal,
                                       HttpServletRequest httpRequest) {
        UserAccount actor = actorOf(principal);
        Map<String, Object> result = llmConfigService.update(body, actor);
        auditService.record(actor, "LLM_PROVIDER_CHANGED", "INTEGRATION_SETTING", LlmConfigService.ROW_NAME,
                "provider=" + body.get("provider") + " model=" + body.get("model") + " baseUrl=" + body.get("baseUrl"),
                httpRequest);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/llm/test")
    public ResponseEntity<?> testLlm() {
        return ResponseEntity.ok(llmConfigService.test());
    }

    @GetMapping("/llm/models")
    public ResponseEntity<?> llmModels() {
        return ResponseEntity.ok(llmConfigService.models());
    }

    /**
     * Actually probe the integration's endpoint with an HTTP HEAD (5 s connect, 5 s read).
     * SUCCESS only when the response code is < 400. Failures persist FAILED and surface
     * the underlying error so admins can debug instead of being lied to.
     */
    @PostMapping("/{id:\\d+}/test")
    public ResponseEntity<?> testIntegration(@PathVariable Long id) {
        IntegrationSetting setting = integrationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Not found"));
        setting.setLastTestedAt(LocalDateTime.now());

        Map<String, Object> result = new LinkedHashMap<>();

        // AI microservices and local storage aren't public HTTP endpoints, so test them
        // against their real internal health instead of a HEAD request to a URL.
        String type = setting.getIntegrationType() == null ? "" : setting.getIntegrationType().trim();
        if (isLlm(setting)) {
            // LlmConfigService records lastTested/lastTestResult on the row itself.
            return ResponseEntity.ok(llmConfigService.test());
        }
        if ("EMAIL".equalsIgnoreCase(type)) {
            // Don't send a real email from a button; check the config the sender will use.
            boolean ok = emailEnabled && mailHost != null && !mailHost.isBlank();
            setting.setLastTestResult(ok ? "SUCCESS" : "FAILED");
            integrationRepository.save(setting);
            result.put("success", ok);
            result.put("message", ok
                    ? "SMTP configured: " + mailHost + ":" + mailPort
                    : "Email sending is off (APP_EMAIL_ENABLED=false) or MAIL_HOST is empty.");
            return ResponseEntity.ok(result);
        }
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

    // ---------- helpers ----------

    private boolean isLlm(IntegrationSetting s) {
        return LlmConfigService.ROW_TYPE.equalsIgnoreCase(s.getIntegrationType());
    }

    private UserAccount actorOf(UserDetails principal) {
        if (principal == null) return null;
        try {
            return userAccountRepository.findById(Long.parseLong(principal.getUsername())).orElse(null);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    /**
     * Read-only facts about how each integration is actually wired, taken from the
     * running config rather than the DB, so the page shows what is really in effect.
     */
    private void addRuntime(Map<String, Object> dto) {
        String type = String.valueOf(dto.get("type"));
        String name = String.valueOf(dto.get("name"));
        Map<String, Object> runtime = new LinkedHashMap<>();
        switch (type.toUpperCase(Locale.ROOT)) {
            case "EMAIL" -> {
                runtime.put("sendingEnabled", emailEnabled);
                runtime.put("smtpHost", mailHost);
                runtime.put("smtpPort", mailPort);
                runtime.put("fromAddress", mailFrom);
            }
            case "STORAGE" -> {
                Path p = fileStorageConfig.getUploadPath();
                runtime.put("uploadPath", String.valueOf(p));
                runtime.put("writable", p != null && Files.isDirectory(p) && Files.isWritable(p));
            }
            case "AI" -> {
                String url = name.equalsIgnoreCase("Recommendation Service") ? recommendationUrl
                        : name.equalsIgnoreCase("Proposal Analyzer") ? analyzerUrl
                        : name.equalsIgnoreCase("FYP Chatbot") ? chatbotUrl : null;
                if (url != null) runtime.put("serviceUrl", url);
            }
            default -> { }
        }
        dto.put("runtime", runtime);
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
