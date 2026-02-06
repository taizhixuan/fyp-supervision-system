package com.fyp.supervision.service;

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

    @SuppressWarnings("unchecked")
    public Map<String, Object> getRecommendations(Map<String, Object> payload) {
        try {
            ResponseEntity<Map> response = postJson(recommendationUrl + "/ai/recommendations", payload);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return response.getBody();
            }
        } catch (RestClientException e) {
            log.warn("AI recommendation service unavailable: {}", e.getMessage());
        }
        return Map.of("recommendations", java.util.List.of(), "generatedAt", java.time.LocalDateTime.now().toString());
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> analyzeProposal(Map<String, Object> payload) {
        try {
            ResponseEntity<Map> response = postJson(analyzerUrl + "/ai/analyze-proposal", payload);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return response.getBody();
            }
        } catch (RestClientException e) {
            log.warn("AI proposal analyzer service unavailable: {}", e.getMessage());
        }
        return Map.of("error", "AI analysis service is currently unavailable.");
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> chat(Map<String, Object> payload) {
        try {
            ResponseEntity<Map> response = postJson(chatbotUrl + "/ai/chat", payload);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return response.getBody();
            }
        } catch (RestClientException e) {
            log.warn("AI chatbot service unavailable: {}", e.getMessage());
        }
        return Map.of(
            "reply", "The AI assistant is currently unavailable. Please try again later.",
            "references", java.util.List.of(),
            "confidence", 0.0
        );
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
