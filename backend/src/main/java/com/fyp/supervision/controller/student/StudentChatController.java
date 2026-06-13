package com.fyp.supervision.controller.student;

import com.fyp.supervision.entity.ChatMemory;
import com.fyp.supervision.entity.ChatMessage;
import com.fyp.supervision.entity.ChatPreferences;
import com.fyp.supervision.entity.ChatSession;
import com.fyp.supervision.entity.Deadline;
import com.fyp.supervision.entity.MeetingLog;
import com.fyp.supervision.entity.ProjectDocument;
import com.fyp.supervision.entity.Project;
import com.fyp.supervision.entity.StudentProfile;
import com.fyp.supervision.entity.UserAccount;
import com.fyp.supervision.enums.MeetingLogStatus;
import com.fyp.supervision.exception.AiServiceUnavailableException;
import com.fyp.supervision.repository.ChatMemoryRepository;
import com.fyp.supervision.repository.ChatMessageRepository;
import com.fyp.supervision.repository.ChatPreferencesRepository;
import com.fyp.supervision.repository.ChatSessionRepository;
import com.fyp.supervision.repository.DeadlineRepository;
import com.fyp.supervision.repository.MeetingLogRepository;
import com.fyp.supervision.repository.ProjectDocumentRepository;
import com.fyp.supervision.repository.ProjectRepository;
import com.fyp.supervision.repository.ProposalRepository;
import com.fyp.supervision.repository.ProposalVersionRepository;
import com.fyp.supervision.repository.StudentProfileRepository;
import com.fyp.supervision.repository.UserAccountRepository;
import com.fyp.supervision.service.AiServiceClient;
import com.fyp.supervision.service.RateLimitService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.locks.ReentrantLock;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/student/chat")
@RequiredArgsConstructor
public class StudentChatController {
    private final ChatSessionRepository chatSessionRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final ChatMemoryRepository chatMemoryRepository;
    private final ChatPreferencesRepository chatPreferencesRepository;
    private final UserAccountRepository userAccountRepository;
    private final StudentProfileRepository studentProfileRepository;
    private final ProjectRepository projectRepository;
    private final ProposalRepository proposalRepository;
    private final ProposalVersionRepository proposalVersionRepository;
    private final ProjectDocumentRepository projectDocumentRepository;
    private final DeadlineRepository deadlineRepository;
    private final MeetingLogRepository meetingLogRepository;
    private final AiServiceClient aiServiceClient;
    private final RateLimitService rateLimitService;

    // Per-user locks guard only the get-or-create-session step. Keyed by userId so two
    // different students never block each other (the old method-level `synchronized`
    // serialized every chat POST across all users on the single controller instance).
    private final ConcurrentHashMap<Long, ReentrantLock> userSessionLocks = new ConcurrentHashMap<>();

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
    public ResponseEntity<?> sendMessage(@AuthenticationPrincipal UserDetails user, @RequestBody Map<String, Object> data) {
        Long userId = Long.parseLong(user.getUsername());
        UserAccount account = userAccountRepository.findById(userId).orElseThrow();

        String messageText = data.get("message") != null ? data.get("message").toString().trim() : "";
        if (messageText.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Message cannot be empty"));
        }

        // PDPA gate — must explicitly consent before any cross-border AI call.
        Boolean consent = chatPreferencesRepository.findById(userId).map(ChatPreferences::getAiProcessingConsented).orElse(null);
        if (consent == null || !consent) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                    "errorCode", "AI_CONSENT_REQUIRED",
                    "message", "You must consent to AI processing before using the chatbot. Open Account Settings → Privacy."
            ));
        }

        // Rate limit — defends LLM token spend and discourages abusive bursts.
        rateLimitService.require("chat", userId);

        // Get or create session under a per-user lock so the same user's concurrent requests
        // can't open two sessions, without serializing other users or holding any lock across
        // the remote AI call below.
        ReentrantLock sessionLock = userSessionLocks.computeIfAbsent(userId, k -> new ReentrantLock());
        sessionLock.lock();
        ChatSession session;
        try {
            session = chatSessionRepository.findTopByUser_UserIdAndEndedAtIsNullOrderByStartedAtDesc(userId)
                    .orElseGet(() -> chatSessionRepository.save(ChatSession.builder().user(account).build()));
        } finally {
            sessionLock.unlock();
        }

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
        // proposal status, deadlines, log progress. The proposal text body is folded in
        // only when the user's message looks proposal-related, keeping handbook RAG
        // chunks visible for generic questions.
        String extraContext = buildExtraContext(userId, messageText);

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

    @GetMapping("/preferences")
    public ResponseEntity<Map<String, Object>> getPreferences(@AuthenticationPrincipal UserDetails user) {
        Long userId = Long.parseLong(user.getUsername());
        ChatPreferences prefs = chatPreferencesRepository.findById(userId).orElse(null);
        Map<String, Object> body = new HashMap<>();
        body.put("responseLength", prefs != null ? prefs.getResponseLength() : "BALANCED");
        body.put("tone", prefs != null ? prefs.getTone() : "NEUTRAL");
        body.put("language", prefs != null ? prefs.getLanguage() : "EN");
        body.put("aiProcessingConsented", prefs != null ? prefs.getAiProcessingConsented() : null);
        body.put("aiConsentDecidedAt", prefs != null && prefs.getAiConsentDecidedAt() != null
                ? prefs.getAiConsentDecidedAt().toString() : null);
        return ResponseEntity.ok(body);
    }

    @PutMapping("/preferences")
    public ResponseEntity<Map<String, Object>> updatePreferences(
            @AuthenticationPrincipal UserDetails user,
            @RequestBody Map<String, Object> data) {
        Long userId = Long.parseLong(user.getUsername());

        String length = normalisePreference((String) data.get("responseLength"),
                List.of("SHORT", "BALANCED", "DETAILED"), "BALANCED");
        String tone = normalisePreference((String) data.get("tone"),
                List.of("FORMAL", "NEUTRAL", "CASUAL"), "NEUTRAL");
        String language = normalisePreference((String) data.get("language"),
                List.of("EN", "MS", "ZH", "MIXED"), "EN");

        ChatPreferences prefs = chatPreferencesRepository.findById(userId).orElseGet(() -> {
            UserAccount u = userAccountRepository.findById(userId).orElseThrow();
            // @MapsId on ChatPreferences.user derives the @Id from the user association at
            // persist time. Setting only the association lets Hibernate fill the @Id
            // correctly; setting both led to the "null identifier" AssertionFailure when
            // the row was created for the first time (e.g. fresh chat_preferences after
            // a docker compose down -v).
            ChatPreferences p = new ChatPreferences();
            p.setUser(u);
            return p;
        });
        prefs.setResponseLength(length);
        prefs.setTone(tone);
        prefs.setLanguage(language);

        // Optional explicit consent toggle — only updated when the caller sends the key,
        // so the style-only update path (Chatbot settings popover) leaves consent untouched.
        if (data.containsKey("aiProcessingConsented")) {
            Object rawConsent = data.get("aiProcessingConsented");
            Boolean consent = rawConsent instanceof Boolean ? (Boolean) rawConsent
                    : rawConsent == null ? null : Boolean.parseBoolean(rawConsent.toString());
            prefs.setAiProcessingConsented(consent);
            prefs.setAiConsentDecidedAt(LocalDateTime.now());
        }

        chatPreferencesRepository.save(prefs);

        Map<String, Object> body = new HashMap<>();
        body.put("responseLength", length);
        body.put("tone", tone);
        body.put("language", language);
        body.put("aiProcessingConsented", prefs.getAiProcessingConsented());
        body.put("aiConsentDecidedAt", prefs.getAiConsentDecidedAt() != null ? prefs.getAiConsentDecidedAt().toString() : null);
        return ResponseEntity.ok(body);
    }

    private String normalisePreference(String value, List<String> allowed, String fallback) {
        if (value == null) return fallback;
        String upper = value.trim().toUpperCase();
        return allowed.contains(upper) ? upper : fallback;
    }

    @DeleteMapping
    public ResponseEntity<Void> clearChat(@AuthenticationPrincipal UserDetails user) {
        Long userId = Long.parseLong(user.getUsername());
        ChatSession session = chatSessionRepository.findTopByUser_UserIdAndEndedAtIsNullOrderByStartedAtDesc(userId)
                .orElse(null);
        if (session != null) {
            session.setEndedAt(LocalDateTime.now());
            chatSessionRepository.save(session);

            // Summarize the just-ended session into long-term memory. Best-effort:
            // failures are logged and skipped, never propagated to the user.
            try {
                updateChatMemory(userId, session.getSessionId());
            } catch (Exception ex) {
                log.warn("Chat memory update failed for user {}: {}", userId, ex.getMessage());
            }
        }
        return ResponseEntity.noContent().build();
    }

    /**
     * Pulls the session's messages, asks the chatbot service to summarize them
     * (folding in the previous memory if any), and upserts the result into
     * {@code chat_memory}. Called from {@link #clearChat} on session-end.
     */
    private void updateChatMemory(Long userId, Long sessionId) {
        List<ChatMessage> sessionMessages =
                chatMessageRepository.findBySession_SessionIdOrderBySentAtAsc(sessionId);
        if (sessionMessages.size() < 2) return; // nothing useful to summarize

        List<Map<String, String>> messageDtos = sessionMessages.stream()
                .map(m -> Map.of(
                        "sender", m.getSender() == null ? "" : m.getSender(),
                        "content", m.getContent() == null ? "" : m.getContent()))
                .collect(Collectors.toList());

        String previous = chatMemoryRepository.findById(userId)
                .map(ChatMemory::getSummaryText)
                .orElse(null);

        Map<String, Object> payload = new HashMap<>();
        payload.put("messages", messageDtos);
        if (previous != null && !previous.isBlank()) {
            payload.put("previousSummary", previous);
        }

        String summary = aiServiceClient.summarizeSession(payload);
        if (summary == null || summary.isBlank()) return;

        ChatMemory memory = chatMemoryRepository.findById(userId).orElseGet(() -> {
            UserAccount u = userAccountRepository.findById(userId).orElseThrow();
            // Same @MapsId fix as ChatPreferences — set only the association, let Hibernate
            // derive the @Id at persist time.
            ChatMemory m = new ChatMemory();
            m.setUser(u);
            return m;
        });
        memory.setSummaryText(summary);
        chatMemoryRepository.save(memory);
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
    // Keywords that suggest the student is asking about THEIR proposal. When matched,
    // the latest proposal version's text is folded into the context.
    private static final List<String> PROPOSAL_INTENT_KEYWORDS = List.of(
            "my proposal", "my project", "my topic", "my research", "my work", "my draft",
            "my abstract", "my problem", "my methodology", "my literature", "my objective",
            "my scope", "my idea", "review my", "check my", "feedback on my", "feedback on this",
            "problem statement", "research question", "literature review", "methodology",
            "objective", "scope of", "abstract"
    );

    private static final int PROPOSAL_CONTENT_CHAR_BUDGET = 3000;

    private static final List<String> MEETING_LOG_INTENT_KEYWORDS = List.of(
            "meeting log", "last meeting", "previous meeting", "recent meeting",
            "what did we discuss", "what we discussed", "we talked about",
            "agreed on", "action item", "follow up", "follow-up",
            "in my meeting", "in our meeting", "supervisor said", "supervisor told",
            "supervisor mentioned", "she said", "he said", "they said",
            "what's next", "what should i do next", "where am i", "where i am",
            "my logs", "my meetings"
    );

    private static final List<String> DOCUMENT_INTENT_KEYWORDS = List.of(
            "my document", "my documents", "i uploaded", "i submitted",
            "my upload", "my submission", "my report", "my draft",
            "interim report", "final report", "progress report",
            "what have i uploaded", "documents i", "files i"
    );

    private boolean matchesAny(String messageText, List<String> keywords) {
        if (messageText == null || messageText.isBlank()) return false;
        String lower = messageText.toLowerCase();
        for (String kw : keywords) {
            if (lower.contains(kw)) return true;
        }
        return false;
    }

    private boolean looksProposalRelated(String messageText) {
        return matchesAny(messageText, PROPOSAL_INTENT_KEYWORDS);
    }

    private String truncate(String s, int max) {
        if (s == null) return "";
        String trimmed = s.trim().replaceAll("\\s+", " ");
        return trimmed.length() > max ? trimmed.substring(0, max) + "…" : trimmed;
    }

    private String describeLength(String code) {
        return switch (code == null ? "BALANCED" : code) {
            case "SHORT" -> "short — 1-3 sentences or a tight bullet list. No preamble.";
            case "DETAILED" -> "detailed — full explanation with examples, sub-points, and rationale.";
            default -> "balanced — 1-2 short paragraphs or a focused bullet list.";
        };
    }

    private String describeTone(String code) {
        return switch (code == null ? "NEUTRAL" : code) {
            case "FORMAL" -> "formal academic — third person, no slang or emoji.";
            case "CASUAL" -> "casual — friendly second-person 'you', conversational, contractions OK.";
            default -> "neutral — clear and direct, lightly friendly, no slang.";
        };
    }

    private String describeLanguage(String code) {
        return switch (code == null ? "EN" : code) {
            case "MS" -> "Bahasa Malaysia. Technical terms may stay in English where standard.";
            case "ZH" -> "Mandarin Chinese (Simplified). Technical terms may stay in English where standard.";
            case "MIXED" -> "Malaysian-style English — primarily English, but mixing in Bahasa or Mandarin words is fine when natural.";
            default -> "English.";
        };
    }

    private String buildExtraContext(Long userId, String messageText) {
        StringBuilder sb = new StringBuilder();
        LocalDate today = LocalDate.now();

        // Style directive — leads the context so the LLM honours it from the
        // first token of generation. Falls back to balanced/neutral/EN when
        // the student hasn't set explicit preferences.
        chatPreferencesRepository.findById(userId).ifPresent(prefs -> {
            sb.append("Response style directive (the student set these — honour them):\n");
            sb.append("- Length: ").append(describeLength(prefs.getResponseLength())).append('\n');
            sb.append("- Tone: ").append(describeTone(prefs.getTone())).append('\n');
            sb.append("- Language: ").append(describeLanguage(prefs.getLanguage())).append("\n\n");
        });

        sb.append("Student context (use only if relevant to the question):\n");
        sb.append("- Today's date: ").append(today).append('\n');
        boolean any = true;

        // Long-term memory carried across past chat sessions.
        chatMemoryRepository.findById(userId).ifPresent(memory -> {
            String text = memory.getSummaryText();
            if (text != null && !text.isBlank()) {
                sb.append("- Long-term memory from past chats (treat as background, ")
                  .append("not gospel — verify when in doubt):\n  ")
                  .append(text.replace("\n", "\n  "))
                  .append('\n');
            }
        });

        Optional<StudentProfile> profileOpt = studentProfileRepository.findById(userId);
        if (profileOpt.isPresent()) {
            StudentProfile p = profileOpt.get();
            if (p.getProgramme() != null && !p.getProgramme().isBlank()) {
                sb.append("- Programme: ").append(p.getProgramme()).append('\n');
            }
            if (p.getSpecialisation() != null && !p.getSpecialisation().isBlank()) {
                sb.append("- Specialisation: ").append(p.getSpecialisation()).append('\n');
            }
        }

        String currentPhase = null;
        Optional<Project> projectOpt = projectRepository.findByStudent_UserId(userId);
        if (projectOpt.isPresent()) {
            Project project = projectOpt.get();
            if (project.getStage() != null && !project.getStage().isBlank()) {
                sb.append("- Current phase: ").append(project.getStage()).append('\n');
            }
            if (project.getCycle() != null) {
                if (project.getCycle().getCycleType() != null) {
                    currentPhase = project.getCycle().getCycleType();
                }
                if (project.getCycle().getAcademicYear() != null) {
                    sb.append("- Academic year: ").append(project.getCycle().getAcademicYear()).append('\n');
                }
                if (project.getCycle().getSemester() != null) {
                    sb.append("- Semester: ").append(project.getCycle().getSemester()).append('\n');
                }
                if (project.getCycle().getStatus() != null) {
                    sb.append("- Cycle status: ").append(project.getCycle().getStatus()).append('\n');
                }
            }
            if (project.getSupervisor() != null) {
                sb.append("- Supervisor: paired");
                if (project.getSupervisor().getFullName() != null) {
                    sb.append(" (").append(project.getSupervisor().getFullName()).append(')');
                }
                sb.append('\n');
            } else {
                sb.append("- Supervisor: not yet paired\n");
            }
        }

        // Proposal grounding: always include the title (cheap), include the full content
        // body only when the user's message appears proposal-related.
        boolean proposalIntent = looksProposalRelated(messageText);
        proposalRepository.findByStudent_UserId(userId).ifPresent(proposal -> {
            if (proposal.getStatus() != null) {
                sb.append("- Proposal status: ").append(proposal.getStatus()).append('\n');
            }
            if (proposal.getTitle() != null && !proposal.getTitle().isBlank()) {
                sb.append("- Proposal title: ").append(proposal.getTitle()).append('\n');
            }

            if (proposalIntent) {
                proposalVersionRepository
                        .findByProposal_ProposalIdOrderByVersionNoDesc(proposal.getProposalId())
                        .stream().findFirst()
                        .ifPresent(version -> {
                            String content = version.getContentText();
                            if (content != null && !content.isBlank()) {
                                String trimmed = content.length() > PROPOSAL_CONTENT_CHAR_BUDGET
                                        ? content.substring(0, PROPOSAL_CONTENT_CHAR_BUDGET) + "\n... [truncated]"
                                        : content;
                                sb.append("- Latest proposal draft (v").append(version.getVersionNo())
                                        .append(", use this as the authoritative source for questions about the student's own work):\n");
                                sb.append("\"\"\"\n").append(trimmed).append("\n\"\"\"\n");
                            }
                        });
            }
        });

        // Meeting log progress for the current phase (FCI requires ≥ 6 LOCKED logs per phase).
        if (currentPhase != null) {
            long locked = meetingLogRepository.countByStudent_UserIdAndStatusAndFypPhase(
                    userId, MeetingLogStatus.LOCKED, currentPhase);
            sb.append("- Meeting logs (").append(currentPhase).append("): ")
                    .append(locked).append(" of 6 locked\n");
        }

        // Upcoming deadlines visible to students (next 3, dated and with days-until).
        List<Deadline> upcoming = deadlineRepository.findByAudienceAndDueDateAfterOrderByDueDateAsc("STUDENT", today);
        DateTimeFormatter dayFmt = DateTimeFormatter.ofPattern("d MMM yyyy");
        if (!upcoming.isEmpty()) {
            sb.append("- Upcoming deadlines:\n");
            upcoming.stream().limit(3).forEach(d -> {
                LocalDate due = d.getExtendedDate() != null ? d.getExtendedDate() : d.getDueDate();
                if (due == null) return;
                long days = ChronoUnit.DAYS.between(today, due);
                sb.append("    • ")
                        .append(d.getTitle() != null ? d.getTitle() : "Deadline")
                        .append(" — ").append(due.format(dayFmt))
                        .append(" (").append(days).append(days == 1 ? " day" : " days").append(" away)")
                        .append('\n');
            });
        }

        // Recent meeting logs — only when the message looks meeting-related.
        // The bot can then quote what was discussed instead of asking the
        // student to repeat it.
        if (matchesAny(messageText, MEETING_LOG_INTENT_KEYWORDS)) {
            List<MeetingLog> recentLogs = meetingLogRepository
                    .findByStudent_UserIdOrderByCreatedAtDesc(userId, PageRequest.of(0, 3))
                    .getContent();
            if (!recentLogs.isEmpty()) {
                DateTimeFormatter shortFmt = DateTimeFormatter.ofPattern("d MMM");
                sb.append("- Recent meeting logs (most recent first; refer to these instead of asking the student to repeat):\n");
                for (MeetingLog log : recentLogs) {
                    sb.append("    [#").append(log.getMeetingNumber() != null ? log.getMeetingNumber() : "?")
                            .append(" · ");
                    if (log.getMeetingDate() != null) {
                        sb.append(log.getMeetingDate().format(shortFmt));
                    } else {
                        sb.append("?");
                    }
                    if (log.getFypPhase() != null && !log.getFypPhase().isBlank()) {
                        sb.append(" · ").append(log.getFypPhase());
                    }
                    sb.append(" · ").append(log.getStatus()).append("]\n");
                    if (log.getDiscussionSummary() != null && !log.getDiscussionSummary().isBlank()) {
                        sb.append("      Discussion: ").append(truncate(log.getDiscussionSummary(), 280)).append('\n');
                    }
                    if (log.getActionItems() != null && !log.getActionItems().isBlank()) {
                        sb.append("      Action items: ").append(truncate(log.getActionItems(), 200)).append('\n');
                    }
                    if (log.getWorkToBeDone() != null && !log.getWorkToBeDone().isBlank()) {
                        sb.append("      Next: ").append(truncate(log.getWorkToBeDone(), 200)).append('\n');
                    }
                    if (log.getSupervisorComments() != null && !log.getSupervisorComments().isBlank()) {
                        sb.append("      Supervisor: ").append(truncate(log.getSupervisorComments(), 200)).append('\n');
                    }
                }
            }
        }

        // Document metadata — body content not parsed (binaries), but the bot
        // can still reference what the student has uploaded.
        if (matchesAny(messageText, DOCUMENT_INTENT_KEYWORDS)) {
            List<ProjectDocument> recentDocs = projectDocumentRepository
                    .findByProject_Student_UserIdOrderByUploadedAtDesc(userId, PageRequest.of(0, 5))
                    .getContent();
            if (!recentDocs.isEmpty()) {
                sb.append("- Recent documents (titles only — file bodies are not available to read):\n");
                for (ProjectDocument doc : recentDocs) {
                    sb.append("    • ");
                    if (doc.getDocType() != null) sb.append("[").append(doc.getDocType()).append("] ");
                    sb.append(doc.getTitle() != null ? doc.getTitle() : doc.getFileName());
                    if (doc.getVersionNo() != null) sb.append(" (v").append(doc.getVersionNo()).append(")");
                    if (doc.getUploadedAt() != null) {
                        sb.append(" — ").append(doc.getUploadedAt().toLocalDate().format(dayFmt));
                    }
                    sb.append('\n');
                }
            }
        }

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
