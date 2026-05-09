package com.fyp.supervision.service;

import com.fyp.supervision.exception.AiServiceUnavailableException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Slf4j
@Service
public class AiServiceClient {

    private final RestTemplate restTemplate;

    @Value("${app.ai.recommendation-url}")
    private String recommendationUrl;

    @Value("${app.ai.analyzer-url}")
    private String analyzerUrl;

    @Value("${app.ai.chatbot-url}")
    private String chatbotUrl;

    public AiServiceClient() {
        this.restTemplate = new RestTemplate();
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
        try {
            ResponseEntity<Map> response = postJson(chatbotUrl + "/ai/chat", payload);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return response.getBody();
            }
            throw new AiServiceUnavailableException(
                    "Chatbot returned non-2xx status: " + response.getStatusCode());
        } catch (RestClientException e) {
            log.warn("AI chatbot service unavailable: {}", e.getMessage());
            throw new AiServiceUnavailableException(
                    "Chatbot service unavailable: " + e.getMessage(), e);
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
