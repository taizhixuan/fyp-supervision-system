package com.fyp.supervision.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fyp.supervision.entity.IntegrationSetting;
import com.fyp.supervision.entity.UserAccount;
import com.fyp.supervision.exception.BadRequestException;
import com.fyp.supervision.repository.IntegrationSettingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

/**
 * Admin control over which LLM the chatbot and proposal analyzer use: a local
 * Ollama model, a cloud API (Groq / OpenAI), any OpenAI-compatible endpoint, or
 * none. The choice lives in the "LLM Provider" integration_setting row and is
 * pushed to both Flask services. Because the services keep it in memory, a
 * scheduled sync re-pushes it after an AI container restarts. API keys are never
 * stored here; the services read them from their own env.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class LlmConfigService {

    public static final String ROW_NAME = "LLM Provider";
    public static final String ROW_TYPE = "LLM";
    private static final Set<String> PROVIDERS = Set.of("env", "ollama", "groq", "openai", "custom", "none");

    private final IntegrationSettingRepository repository;
    private final AiServiceClient aiServiceClient;
    private final ObjectMapper objectMapper;

    // ---------- desired state (what the admin picked) ----------

    public Optional<IntegrationSetting> row() {
        return repository.findFirstByNameIgnoreCase(ROW_NAME);
    }

    /** The config the services should run. An INACTIVE row means "no LLM". */
    public Map<String, Object> desired() {
        Map<String, Object> out = new LinkedHashMap<>();
        Optional<IntegrationSetting> row = row();
        Map<String, Object> settings = row.map(r -> parse(r.getSettingsJson())).orElse(Map.of());
        boolean enabled = row.map(r -> "ACTIVE".equalsIgnoreCase(r.getStatus())).orElse(true);
        out.put("provider", enabled ? str(settings.get("provider"), "env") : "none");
        out.put("model", str(settings.get("model"), ""));
        out.put("baseUrl", str(settings.get("baseUrl"), ""));
        out.put("enabled", enabled);
        return out;
    }

    public Map<String, Object> status() {
        Map<String, Object> desired = desired();
        Map<String, Object> services = new LinkedHashMap<>();
        boolean inSync = true;
        for (Map.Entry<String, String> svc : aiServiceClient.llmServiceUrls().entrySet()) {
            Map<String, Object> entry = new LinkedHashMap<>();
            try {
                Map<String, Object> actual = aiServiceClient.getLlmConfig(svc.getValue());
                entry.putAll(actual);
                entry.put("reachable", true);
                boolean match = matches(desired, actual);
                entry.put("inSync", match);
                inSync &= match;
            } catch (Exception e) {
                entry.put("reachable", false);
                entry.put("error", e.getMessage());
                inSync = false;
            }
            services.put(svc.getKey(), entry);
        }
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("desired", desired);
        out.put("services", services);
        out.put("inSync", inSync);
        return out;
    }

    // ---------- changes ----------

    public Map<String, Object> update(Map<String, Object> body, UserAccount actor) {
        String provider = str(body.get("provider"), "").toLowerCase();
        String model = str(body.get("model"), "");
        String baseUrl = str(body.get("baseUrl"), "");
        if (!PROVIDERS.contains(provider)) {
            throw new BadRequestException("Unknown provider. Use one of: " + String.join(", ", PROVIDERS));
        }
        if (model.length() > 200) {
            throw new BadRequestException("Model name is too long.");
        }
        if (!baseUrl.isEmpty()) {
            validateBaseUrl(baseUrl);
        }
        if ("custom".equals(provider) && (model.isEmpty() || baseUrl.isEmpty())) {
            throw new BadRequestException("The custom provider needs both a base URL and a model.");
        }
        if ("env".equals(provider) || "none".equals(provider)) {
            model = "";
            baseUrl = "";
        }

        IntegrationSetting setting = row().orElseGet(() -> IntegrationSetting.builder()
                .name(ROW_NAME)
                .integrationType(ROW_TYPE)
                .description("Language model used by the chatbot and proposal analyzer.")
                .status("ACTIVE")
                .build());
        Map<String, Object> settings = new LinkedHashMap<>();
        settings.put("provider", provider);
        settings.put("model", model);
        settings.put("baseUrl", baseUrl);
        try {
            setting.setSettingsJson(objectMapper.writeValueAsString(settings));
        } catch (Exception e) {
            throw new BadRequestException("Could not save LLM settings.");
        }
        setting.setProvider(provider);
        setting.setUpdatedBy(actor);
        repository.save(setting);

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("applied", apply());
        out.putAll(status());
        return out;
    }

    /** Push the desired config to every LLM-using service. Never throws. */
    public Map<String, Object> apply() {
        Map<String, Object> body = pushBody(desired());
        Map<String, Object> results = new LinkedHashMap<>();
        for (Map.Entry<String, String> svc : aiServiceClient.llmServiceUrls().entrySet()) {
            try {
                results.put(svc.getKey(), aiServiceClient.putLlmConfig(svc.getValue(), body));
            } catch (Exception e) {
                log.warn("Could not push LLM config to {}: {}", svc.getKey(), e.getMessage());
                results.put(svc.getKey(), Map.of("reachable", false, "error", String.valueOf(e.getMessage())));
            }
        }
        return results;
    }

    /** Send a tiny prompt through each service's current LLM. */
    public Map<String, Object> test() {
        Map<String, Object> services = new LinkedHashMap<>();
        boolean allOk = true;
        for (Map.Entry<String, String> svc : aiServiceClient.llmServiceUrls().entrySet()) {
            try {
                Map<String, Object> r = aiServiceClient.testLlm(svc.getValue());
                services.put(svc.getKey(), r);
                allOk &= Boolean.TRUE.equals(r.get("success"));
            } catch (Exception e) {
                services.put(svc.getKey(), Map.of("success", false, "message", "Service unreachable: " + e.getMessage()));
                allOk = false;
            }
        }
        final boolean ok = allOk;
        row().ifPresent(r -> {
            r.setLastTestedAt(LocalDateTime.now());
            r.setLastTestResult(ok ? "SUCCESS" : "FAILED");
            repository.save(r);
        });
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("success", allOk);
        out.put("message", allOk ? summarize(services) : firstFailure(services));
        out.put("services", services);
        return out;
    }

    /** Models offered by the current endpoint (for Ollama: the models already pulled). */
    @SuppressWarnings("unchecked")
    public Map<String, Object> models() {
        for (String url : aiServiceClient.llmServiceUrls().values()) {
            try {
                return aiServiceClient.listLlmModels(url);
            } catch (Exception ignored) {
                // try the next service
            }
        }
        return Map.of("provider", "unknown", "models", List.of());
    }

    /** Re-push after an AI container restart wiped its in-memory override. */
    @Scheduled(initialDelay = 30_000, fixedDelay = 120_000)
    public void sync() {
        Map<String, Object> desired;
        try {
            desired = desired();
        } catch (Exception e) {
            return; // DB not ready yet
        }
        Map<String, Object> body = pushBody(desired);
        for (Map.Entry<String, String> svc : aiServiceClient.llmServiceUrls().entrySet()) {
            try {
                Map<String, Object> actual = aiServiceClient.getLlmConfig(svc.getValue());
                if (!matches(desired, actual)) {
                    aiServiceClient.putLlmConfig(svc.getValue(), body);
                    log.info("Re-synced LLM config to {} (provider={})", svc.getKey(), body.get("provider"));
                }
            } catch (Exception e) {
                log.debug("LLM sync skipped for {}: {}", svc.getKey(), e.getMessage());
            }
        }
    }

    // ---------- helpers ----------

    private Map<String, Object> pushBody(Map<String, Object> desired) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("provider", desired.get("provider"));
        body.put("model", desired.get("model"));
        body.put("baseUrl", desired.get("baseUrl"));
        return body;
    }

    static boolean matches(Map<String, Object> desired, Map<String, Object> actual) {
        String provider = str(desired.get("provider"), "env");
        String source = str(actual.get("source"), "");
        String actualProvider = str(actual.get("provider"), "");
        if ("env".equals(provider)) {
            return "env".equals(source);
        }
        if (!"admin".equals(source) || !provider.equals(actualProvider)) {
            return false;
        }
        String model = str(desired.get("model"), "");
        String baseUrl = str(desired.get("baseUrl"), "");
        return (model.isEmpty() || model.equals(str(actual.get("model"), "")))
                && (baseUrl.isEmpty() || baseUrl.equals(str(actual.get("baseUrl"), "")));
    }

    private static void validateBaseUrl(String url) {
        try {
            URI uri = URI.create(url);
            String scheme = uri.getScheme();
            if (scheme == null || !(scheme.equalsIgnoreCase("http") || scheme.equalsIgnoreCase("https"))
                    || uri.getHost() == null) {
                throw new BadRequestException("Base URL must be an http(s) URL, e.g. http://ollama:11434/v1");
            }
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Base URL is not a valid URL.");
        }
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> parse(String json) {
        if (json == null || json.isBlank()) return Map.of();
        try {
            return objectMapper.readValue(json, Map.class);
        } catch (Exception e) {
            return Map.of();
        }
    }

    private static String str(Object v, String fallback) {
        if (v == null) return fallback;
        String s = v.toString().trim();
        return s.isEmpty() ? fallback : s;
    }

    @SuppressWarnings("unchecked")
    private static String summarize(Map<String, Object> services) {
        StringBuilder sb = new StringBuilder();
        services.forEach((name, v) -> {
            Map<String, Object> r = (Map<String, Object>) v;
            if (sb.length() > 0) sb.append(" · ");
            sb.append(name).append(": ").append(r.get("message"));
        });
        return sb.toString();
    }

    @SuppressWarnings("unchecked")
    private static String firstFailure(Map<String, Object> services) {
        for (Map.Entry<String, Object> e : services.entrySet()) {
            Map<String, Object> r = (Map<String, Object>) e.getValue();
            if (!Boolean.TRUE.equals(r.get("success"))) {
                return e.getKey() + ": " + r.get("message");
            }
        }
        return "LLM test failed.";
    }
}
