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
        if (session == null) {
            return ResponseEntity.ok(Map.of("sessionId", "", "messages", List.of(), "createdAt", "", "updatedAt", ""));
        }
        List<ChatMessage> messages = chatMessageRepository.findBySession_SessionIdOrderBySentAtAsc(session.getSessionId());
        List<Map<String, Object>> messageDtos = new ArrayList<>();
        com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
        for (ChatMessage msg : messages) {
            Map<String, Object> dto = new HashMap<>();
            dto.put("messageId", msg.getMessageId().toString());
            dto.put("role", msg.getSender());
            dto.put("content", msg.getContent());
            dto.put("timestamp", msg.getSentAt() != null ? msg.getSentAt().toString() : "");
            try {
                Object refs = mapper.readValue(msg.getReferencesJson() != null ? msg.getReferencesJson() : "[]", List.class);
                dto.put("references", refs);
            } catch (Exception e) {
                dto.put("references", List.of());
            }
            messageDtos.add(dto);
        }
        return ResponseEntity.ok(Map.of(
                "sessionId", session.getSessionId().toString(),
                "messages", messageDtos,
                "createdAt", session.getStartedAt().toString(),
                "updatedAt", session.getStartedAt().toString()
        ));
    }

    @SuppressWarnings("unchecked")
    @PostMapping
    public ResponseEntity<?> sendMessage(@AuthenticationPrincipal UserDetails user, @RequestBody Map<String, Object> data) {
        Long userId = Long.parseLong(user.getUsername());
        UserAccount account = userAccountRepository.findById(userId).orElseThrow();

        // Get or create session
        ChatSession session = chatSessionRepository.findTopByUser_UserIdAndEndedAtIsNullOrderByStartedAtDesc(userId)
                .orElseGet(() -> {
                    ChatSession newSession = ChatSession.builder().user(account).build();
                    return chatSessionRepository.save(newSession);
                });

        String messageText = (String) data.get("message");

        // Save user message
        ChatMessage userMsg = ChatMessage.builder()
                .session(session)
                .sender("user")
                .content(messageText)
                .build();
        chatMessageRepository.save(userMsg);

        // Build session history for AI
        List<ChatMessage> history = chatMessageRepository.findBySession_SessionIdOrderBySentAtAsc(session.getSessionId());
        List<Map<String, String>> sessionHistory = history.stream()
                .map(msg -> Map.of("sender", msg.getSender().toUpperCase(), "content", msg.getContent()))
                .collect(Collectors.toList());

        // Call AI chatbot
        Map<String, Object> payload = new HashMap<>();
        payload.put("message", messageText);
        payload.put("sessionHistory", sessionHistory);

        Map<String, Object> aiResult = aiServiceClient.chat(payload);

        String reply = (String) aiResult.getOrDefault("reply", "Sorry, I couldn't generate a response.");
        String referencesJson = "[]";
        try {
            Object refs = aiResult.get("references");
            if (refs != null) {
                referencesJson = new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(refs);
            }
        } catch (Exception ignored) {}

        // Save AI response
        ChatMessage aiMsg = ChatMessage.builder()
                .session(session)
                .sender("assistant")
                .content(reply)
                .referencesJson(referencesJson)
                .build();
        chatMessageRepository.save(aiMsg);

        // Return DTO matching frontend ChatMessage type
        Map<String, Object> msgDto = new HashMap<>();
        msgDto.put("messageId", aiMsg.getMessageId().toString());
        msgDto.put("role", aiMsg.getSender());
        msgDto.put("content", aiMsg.getContent());
        msgDto.put("timestamp", aiMsg.getSentAt() != null ? aiMsg.getSentAt().toString() : "");
        try {
            Object refs = new com.fasterxml.jackson.databind.ObjectMapper().readValue(
                    aiMsg.getReferencesJson() != null ? aiMsg.getReferencesJson() : "[]", List.class);
            msgDto.put("references", refs);
        } catch (Exception e) {
            msgDto.put("references", List.of());
        }
        return ResponseEntity.ok(msgDto);
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
}
