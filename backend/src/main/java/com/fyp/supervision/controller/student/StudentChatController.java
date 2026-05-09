package com.fyp.supervision.controller.student;

import com.fyp.supervision.entity.ChatMessage;
import com.fyp.supervision.entity.ChatSession;
import com.fyp.supervision.entity.UserAccount;
import com.fyp.supervision.repository.ChatMessageRepository;
import com.fyp.supervision.repository.ChatSessionRepository;
import com.fyp.supervision.repository.UserAccountRepository;
import com.fyp.supervision.service.AiServiceClient;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/student/chat")
@RequiredArgsConstructor
public class StudentChatController {
    private final ChatSessionRepository chatSessionRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final UserAccountRepository userAccountRepository;
    private final AiServiceClient aiServiceClient;

    @GetMapping
    public ResponseEntity<?> getChat(@AuthenticationPrincipal UserDetails user) {
        Long userId = Long.parseLong(user.getUsername());
        ChatSession session = chatSessionRepository.findTopByUser_UserIdAndEndedAtIsNullOrderByStartedAtDesc(userId)
                .orElse(null);
        Map<String, Object> body = new HashMap<>();
        if (session == null) {
            body.put("sessionId", null);
            body.put("messages", List.of());
            body.put("createdAt", null);
            body.put("updatedAt", null);
            return ResponseEntity.ok(body);
        }
        List<ChatMessage> messages = chatMessageRepository.findBySession_SessionIdOrderBySentAtAsc(session.getSessionId());
        com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
        List<Map<String, Object>> messageDtos = messages.stream()
                .map(msg -> toMessageDto(msg, mapper))
                .collect(Collectors.toList());
        LocalDateTime lastTs = messages.isEmpty()
                ? session.getStartedAt()
                : messages.get(messages.size() - 1).getSentAt();
        body.put("sessionId", session.getSessionId().toString());
        body.put("messages", messageDtos);
        body.put("createdAt", session.getStartedAt() != null ? session.getStartedAt().toString() : null);
        body.put("updatedAt", lastTs != null ? lastTs.toString() : null);
        return ResponseEntity.ok(body);
    }

    @PostMapping
    public synchronized ResponseEntity<?> sendMessage(@AuthenticationPrincipal UserDetails user, @RequestBody Map<String, Object> data) {
        Long userId = Long.parseLong(user.getUsername());
        UserAccount account = userAccountRepository.findById(userId).orElseThrow();

        String messageText = data.get("message") != null ? data.get("message").toString().trim() : "";
        if (messageText.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Message cannot be empty"));
        }

        // Get or create session (synchronized prevents double-session race for the same user)
        ChatSession session = chatSessionRepository.findTopByUser_UserIdAndEndedAtIsNullOrderByStartedAtDesc(userId)
                .orElseGet(() -> chatSessionRepository.save(ChatSession.builder().user(account).build()));

        // Save user message
        ChatMessage userMsg = ChatMessage.builder()
                .session(session)
                .sender("user")
                .content(messageText)
                .build();
        chatMessageRepository.save(userMsg);

        // Build session history for AI (excluding the just-saved current message — it's passed separately)
        List<ChatMessage> history = chatMessageRepository.findBySession_SessionIdOrderBySentAtAsc(session.getSessionId());
        List<Map<String, String>> sessionHistory = history.stream()
                .filter(m -> !m.getMessageId().equals(userMsg.getMessageId()))
                .map(msg -> Map.of("sender", msg.getSender().toUpperCase(), "content", msg.getContent()))
                .collect(Collectors.toList());

        // Call AI chatbot
        Map<String, Object> payload = new HashMap<>();
        payload.put("message", messageText);
        payload.put("sessionHistory", sessionHistory);

        Map<String, Object> aiResult = aiServiceClient.chat(payload);

        String reply = (String) aiResult.getOrDefault("reply", "Sorry, I couldn't generate a response.");
        BigDecimal confidence = null;
        Object rawConfidence = aiResult.get("confidence");
        if (rawConfidence instanceof Number) {
            confidence = BigDecimal.valueOf(((Number) rawConfidence).doubleValue())
                    .setScale(4, RoundingMode.HALF_UP);
        }

        com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
        String referencesJson = "[]";
        try {
            Object refs = aiResult.get("references");
            if (refs != null) {
                referencesJson = mapper.writeValueAsString(refs);
            }
        } catch (Exception ignored) {}

        // Save AI response
        ChatMessage aiMsg = ChatMessage.builder()
                .session(session)
                .sender("assistant")
                .content(reply)
                .confidenceScore(confidence)
                .referencesJson(referencesJson)
                .build();
        chatMessageRepository.save(aiMsg);

        return ResponseEntity.ok(toMessageDto(aiMsg, mapper));
    }

    @DeleteMapping
    public ResponseEntity<Void> clearChat(@AuthenticationPrincipal UserDetails user) {
        Long userId = Long.parseLong(user.getUsername());
        ChatSession session = chatSessionRepository.findTopByUser_UserIdAndEndedAtIsNullOrderByStartedAtDesc(userId)
                .orElse(null);
        if (session != null) {
            session.setEndedAt(LocalDateTime.now());
            chatSessionRepository.save(session);
        }
        return ResponseEntity.noContent().build();
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> toMessageDto(ChatMessage msg, com.fasterxml.jackson.databind.ObjectMapper mapper) {
        Map<String, Object> dto = new HashMap<>();
        dto.put("messageId", msg.getMessageId().toString());
        dto.put("role", "user".equalsIgnoreCase(msg.getSender()) ? "user" : "assistant");
        dto.put("content", msg.getContent());
        dto.put("timestamp", msg.getSentAt() != null ? msg.getSentAt().toString() : null);
        if (msg.getConfidenceScore() != null) {
            dto.put("confidence", msg.getConfidenceScore().doubleValue());
        }
        try {
            Object refs = mapper.readValue(
                    msg.getReferencesJson() != null && !msg.getReferencesJson().isBlank()
                            ? msg.getReferencesJson() : "[]",
                    List.class);
            dto.put("references", refs);
        } catch (Exception e) {
            dto.put("references", List.of());
        }
        return dto;
    }
}
