package com.fyp.supervision.controller.student;

import com.fyp.supervision.entity.ChatMessage;
import com.fyp.supervision.entity.ChatSession;
import com.fyp.supervision.entity.Project;
import com.fyp.supervision.entity.StudentProfile;
import com.fyp.supervision.entity.UserAccount;
import com.fyp.supervision.exception.AiServiceUnavailableException;
import com.fyp.supervision.repository.ChatMessageRepository;
import com.fyp.supervision.repository.ChatSessionRepository;
import com.fyp.supervision.repository.ProjectRepository;
import com.fyp.supervision.repository.ProposalRepository;
import com.fyp.supervision.repository.StudentProfileRepository;
import com.fyp.supervision.repository.UserAccountRepository;
import com.fyp.supervision.service.AiServiceClient;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
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
    private final StudentProfileRepository studentProfileRepository;
    private final ProjectRepository projectRepository;
    private final ProposalRepository proposalRepository;
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

        // Personalised context: programme, phase, cycle status, supervisor pairing,
        // proposal status. Lets the assistant tailor answers to the student's actual
        // state without the student having to repeat it.
        String extraContext = buildExtraContext(userId);

        Map<String, Object> payload = new HashMap<>();
        payload.put("message", messageText);
        payload.put("sessionHistory", sessionHistory);
        if (extraContext != null) {
            payload.put("context", extraContext);
        }

        Map<String, Object> aiResult;
        try {
            aiResult = aiServiceClient.chat(payload);
        } catch (AiServiceUnavailableException ex) {
            // The user message is already persisted (so the optimistic UI is honest about
            // what was sent), but we don't save a fake assistant reply. The frontend
            // surfaces the 503 as a toast and the student can retry.
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(Map.of(
                    "message", "The AI assistant is currently unavailable. Please try again in a moment."
            ));
        }

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

    /**
     * Records a thumbs up / down on an assistant message. Idempotent: re-sending
     * the same value is a no-op; sending the opposite flips it; sending null/empty
     * clears the feedback.
     */
    @PostMapping("/feedback/{messageId}")
    public ResponseEntity<?> setFeedback(@AuthenticationPrincipal UserDetails user,
                                         @PathVariable Long messageId,
                                         @RequestBody Map<String, Object> data) {
        Long userId = Long.parseLong(user.getUsername());

        ChatMessage msg = chatMessageRepository.findById(messageId).orElse(null);
        if (msg == null
                || msg.getSession() == null
                || msg.getSession().getUser() == null
                || !userId.equals(msg.getSession().getUser().getUserId())) {
            // Hide existence — same response shape as a true "not yours".
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Message not found"));
        }
        if (!"assistant".equalsIgnoreCase(msg.getSender())) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Feedback can only be set on assistant messages"));
        }

        String value = data.get("feedback") != null ? data.get("feedback").toString().trim().toUpperCase() : "";
        if (value.isEmpty() || "NULL".equals(value)) {
            msg.setFeedback(null);
            msg.setFeedbackAt(null);
        } else if ("UP".equals(value) || "DOWN".equals(value)) {
            msg.setFeedback(value);
            msg.setFeedbackAt(LocalDateTime.now());
        } else {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "feedback must be UP, DOWN, or null"));
        }
        chatMessageRepository.save(msg);

        com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
        return ResponseEntity.ok(toMessageDto(msg, mapper));
    }

    /**
     * Builds a short personalised-context string that the chatbot prepends to
     * its retrieval context. Returns null when nothing meaningful is known
     * about the student (so the chatbot doesn't pollute the prompt with empty
     * boilerplate).
     */
    private String buildExtraContext(Long userId) {
        StringBuilder sb = new StringBuilder();
        sb.append("Student context (use only if relevant to the question):\n");
        boolean any = false;

        Optional<StudentProfile> profileOpt = studentProfileRepository.findById(userId);
        if (profileOpt.isPresent()) {
            StudentProfile p = profileOpt.get();
            if (p.getProgramme() != null && !p.getProgramme().isBlank()) {
                sb.append("- Programme: ").append(p.getProgramme()).append('\n');
                any = true;
            }
            if (p.getSpecialisation() != null && !p.getSpecialisation().isBlank()) {
                sb.append("- Specialisation: ").append(p.getSpecialisation()).append('\n');
                any = true;
            }
        }

        Optional<Project> projectOpt = projectRepository.findByStudent_UserId(userId);
        if (projectOpt.isPresent()) {
            Project project = projectOpt.get();
            if (project.getStage() != null && !project.getStage().isBlank()) {
                sb.append("- Current phase: ").append(project.getStage()).append('\n');
                any = true;
            }
            if (project.getCycle() != null) {
                if (project.getCycle().getAcademicYear() != null) {
                    sb.append("- Academic year: ").append(project.getCycle().getAcademicYear()).append('\n');
                    any = true;
                }
                if (project.getCycle().getSemester() != null) {
                    sb.append("- Semester: ").append(project.getCycle().getSemester()).append('\n');
                    any = true;
                }
                if (project.getCycle().getStatus() != null) {
                    sb.append("- Cycle status: ").append(project.getCycle().getStatus()).append('\n');
                    any = true;
                }
            }
            if (project.getSupervisor() != null) {
                sb.append("- Supervisor: paired\n");
                any = true;
            } else {
                sb.append("- Supervisor: not yet paired\n");
                any = true;
            }
        }

        proposalRepository.findByStudent_UserId(userId).ifPresent(proposal -> {
            if (proposal.getStatus() != null) {
                sb.append("- Proposal status: ").append(proposal.getStatus()).append('\n');
            }
        });

        return any ? sb.toString() : null;
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
        if (msg.getFeedback() != null) {
            dto.put("feedback", msg.getFeedback());
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
