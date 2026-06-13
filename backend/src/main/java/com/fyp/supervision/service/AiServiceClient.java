package com.fyp.supervision.service;

import com.fyp.supervision.exception.AiServiceUnavailableException;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Slf4j
@Service
public class AiServiceClient {

    private final RestTemplate restTemplate;
    private final MeterRegistry meterRegistry;

    @Value("${app.ai.recommendation-url}")
    private String recommendationUrl;

    @Value("${app.ai.analyzer-url}")
    private String analyzerUrl;

    @Value("${app.ai.chatbot-url}")
    private String chatbotUrl;

    public AiServiceClient(MeterRegistry meterRegistry) {
        // Bound the wait on a slow/hung AI service so a request thread (and any lock it
        // holds) can't block indefinitely. Read timeout is generous for LLM generation.
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(10_000);
        factory.setReadTimeout(120_000);
        this.restTemplate = new RestTemplate(factory);
        this.meterRegistry = meterRegistry;
    }

    /**
     * Calls the Flask recommender. Throws {@link AiServiceUnavailableException}
     * when the service is unreachable or returns a non-2xx response, so the
     * caller can return 503 instead of a fake empty list that hides a real
     * outage from the user.
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> getRecommendations(Map<String, Object> payload) {
        try {
            ResponseEntity<Map> response = postJson(recommendationUrl + "/ai/recommendations", payload);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return response.getBody();
            }
            throw new AiServiceUnavailableException(
                    "Recommendation service returned non-2xx status: " + response.getStatusCode());
        } catch (RestClientException e) {
            log.warn("AI recommendation service unavailable: {}", e.getMessage());
            throw new AiServiceUnavailableException(
                    "Recommendation service unavailable: " + e.getMessage(), e);
        }
    }

    /**
     * Calls the Flask proposal analyzer. Throws {@link AiServiceUnavailableException}
     * when the service is unreachable or returns a non-2xx response, so the
     * caller can return 503 instead of persisting an all-zero
     * {@code ProposalCheckResult} into the student's analysis history.
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> analyzeProposal(Map<String, Object> payload) {
        try {
            ResponseEntity<Map> response = postJson(analyzerUrl + "/ai/analyze-proposal", payload);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return response.getBody();
            }
            throw new AiServiceUnavailableException(
                    "Proposal analyzer returned non-2xx status: " + response.getStatusCode());
        } catch (RestClientException e) {
            log.warn("AI proposal analyzer service unavailable: {}", e.getMessage());
            throw new AiServiceUnavailableException(
                    "Proposal analyzer service unavailable: " + e.getMessage(), e);
        }
    }

    /**
     * Calls the Flask chatbot. Throws {@link AiServiceUnavailableException}
     * when the service is unreachable or returns a non-2xx response, so the
     * caller can return 503 instead of persisting a placeholder assistant
     * message into the chat history.
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> chat(Map<String, Object> payload) {
        Timer.Sample sample = Timer.start(meterRegistry);
        String outcome = "success";
        try {
            ResponseEntity<Map> response = postJson(chatbotUrl + "/ai/chat", payload);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return response.getBody();
            }
            outcome = "error";
            throw new AiServiceUnavailableException(
                    "Chatbot returned non-2xx status: " + response.getStatusCode());
        } catch (RestClientException e) {
            outcome = "unavailable";
            log.warn("AI chatbot service unavailable: {}", e.getMessage());
            throw new AiServiceUnavailableException(
                    "Chatbot service unavailable: " + e.getMessage(), e);
        } finally {
            sample.stop(Timer.builder("app_ai_chat_seconds")
                    .description("Latency of /ai/chat calls to the Flask chatbot, tagged by outcome.")
                    .tag("outcome", outcome)
                    .publishPercentiles(0.5, 0.95, 0.99)
                    .register(meterRegistry));
        }
    }

    /**
     * Summarize a closed chat session into a long-term memory snippet. Returns
     * empty string on any failure — the caller treats memory as best-effort
     * and never blocks the user-facing flow on a summary failure.
     */
    @SuppressWarnings("unchecked")
    public String summarizeSession(Map<String, Object> payload) {
        try {
            ResponseEntity<Map> response = postJson(chatbotUrl + "/ai/summarize", payload);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Object summary = response.getBody().get("summary");
                return summary == null ? "" : summary.toString();
            }
            log.warn("Summarize returned non-2xx: {}", response.getStatusCode());
            return "";
        } catch (RestClientException e) {
            log.warn("Summarize unavailable: {}", e.getMessage());
            return "";
        }
    }

    public boolean isRecommendationServiceHealthy() {
        return checkHealth(recommendationUrl);
    }

    public boolean isAnalyzerServiceHealthy() {
        return checkHealth(analyzerUrl);
    }

    public boolean isChatbotServiceHealthy() {
        return checkHealth(chatbotUrl);
    }

    @SuppressWarnings("rawtypes")
    private ResponseEntity<Map> postJson(String url, Map<String, Object> payload) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload, headers);
        return restTemplate.exchange(url, HttpMethod.POST, request, Map.class);
    }

    private boolean checkHealth(String baseUrl) {
        try {
            ResponseEntity<String> response = restTemplate.getForEntity(baseUrl + "/ai/health", String.class);
            return response.getStatusCode().is2xxSuccessful();
        } catch (RestClientException e) {
            return false;
        }
    }
}
