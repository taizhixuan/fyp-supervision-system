package com.fyp.supervision.service;

import com.fyp.supervision.entity.AuditLog;
import com.fyp.supervision.entity.ChatMemory;
import com.fyp.supervision.entity.ChatMessage;
import com.fyp.supervision.entity.ChatPreferences;
import com.fyp.supervision.entity.ChatSession;
import com.fyp.supervision.entity.Meeting;
import com.fyp.supervision.entity.MeetingLog;
import com.fyp.supervision.entity.Notification;
import com.fyp.supervision.entity.Project;
import com.fyp.supervision.entity.ProjectDocument;
import com.fyp.supervision.entity.Proposal;
import com.fyp.supervision.entity.ProposalVersion;
import com.fyp.supervision.entity.StudentProfile;
import com.fyp.supervision.entity.SupervisorRequest;
import com.fyp.supervision.entity.UserAccount;
import com.fyp.supervision.repository.AuditLogRepository;
import com.fyp.supervision.repository.ChatMemoryRepository;
import com.fyp.supervision.repository.ChatMessageRepository;
import com.fyp.supervision.repository.ChatPreferencesRepository;
import com.fyp.supervision.repository.ChatSessionRepository;
import com.fyp.supervision.repository.MeetingLogRepository;
import com.fyp.supervision.repository.MeetingRepository;
import com.fyp.supervision.repository.NotificationRepository;
import com.fyp.supervision.repository.ProjectDocumentRepository;
import com.fyp.supervision.repository.ProjectRepository;
import com.fyp.supervision.repository.ProposalRepository;
import com.fyp.supervision.repository.ProposalVersionRepository;
import com.fyp.supervision.repository.StudentProfileRepository;
import com.fyp.supervision.repository.SupervisorRequestRepository;
import com.fyp.supervision.repository.UserAccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Builds a JSON-shaped aggregate of all personal data the system holds for a
 * student, for the PDPA right of access. Audited on each export. Binary file
 * contents are intentionally omitted — only metadata is included.
 */
@Service
@RequiredArgsConstructor
public class PersonalDataExportService {

    private final UserAccountRepository userAccountRepository;
    private final StudentProfileRepository studentProfileRepository;
    private final ProjectRepository projectRepository;
    private final ProposalRepository proposalRepository;
    private final ProposalVersionRepository proposalVersionRepository;
    private final MeetingRepository meetingRepository;
    private final MeetingLogRepository meetingLogRepository;
    private final ProjectDocumentRepository projectDocumentRepository;
    private final SupervisorRequestRepository supervisorRequestRepository;
    private final ChatSessionRepository chatSessionRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final ChatMemoryRepository chatMemoryRepository;
    private final ChatPreferencesRepository chatPreferencesRepository;
    private final NotificationRepository notificationRepository;
    private final AuditLogRepository auditLogRepository;

    @Transactional
    public Map<String, Object> exportForStudent(Long userId) {
        UserAccount user = userAccountRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("exportedAt", LocalDateTime.now().toString());
        data.put("subjectUserId", userId);
        data.put("privacyNoticeVersion", user.getPrivacyNoticeVersion());
        data.put("account", accountMap(user));
        data.put("profile", profileMap(studentProfileRepository.findById(userId).orElse(null)));

        Project project = projectRepository.findByStudent_UserId(userId).orElse(null);
        data.put("project", projectMap(project));

        Proposal proposal = proposalRepository.findByStudent_UserId(userId).orElse(null);
        data.put("proposal", proposalMap(proposal));

        data.put("meetings", listOf(meetingRepository.findAllByStudentUserId(userId), this::meetingMap));
        data.put("meetingLogs", listOf(allLogsForStudent(userId), this::meetingLogMap));
        data.put("documents", listOf(projectDocumentRepository.findByProject_Student_UserIdOrderByUploadedAtDesc(userId), this::documentMap));
        data.put("supervisorRequests", listOf(supervisorRequestRepository.findByStudent_UserIdOrderBySubmittedAtDesc(userId), this::supervisorRequestMap));

        data.put("chatPreferences", chatPreferencesMap(chatPreferencesRepository.findById(userId).orElse(null)));
        data.put("chatMemory", chatMemoryMap(chatMemoryRepository.findById(userId).orElse(null)));
        data.put("chatSessions", chatSessionsWithMessages(userId));

        data.put("notifications", listOf(
                notificationRepository.findByUser_UserIdOrderByCreatedAtDesc(userId, PageRequest.of(0, 500)).getContent(),
                this::notificationMap));

        recordExportAudit(user);
        return data;
    }

    // Workaround: MeetingLogRepository only has the by-status finder. Pull all statuses via the supervisor-side method shape isn't applicable; fetch via JPA repository's findAll filtered by student in memory would be wasteful. Use a small projection here.
    private List<MeetingLog> allLogsForStudent(Long userId) {
        // Re-use the by-status finder for each enum value would work, but iterating Repository.findAll() is fine for an
        // export endpoint that runs once per user request. Filter in-memory.
        List<MeetingLog> all = new ArrayList<>();
        for (com.fyp.supervision.enums.MeetingLogStatus s : com.fyp.supervision.enums.MeetingLogStatus.values()) {
            all.addAll(meetingLogRepository.findByStudent_UserIdAndStatusOrderByCreatedAtDesc(userId, s));
        }
        return all;
    }

    private Map<String, Object> accountMap(UserAccount u) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("userId", u.getUserId());
        m.put("mmuId", u.getMmuId());
        m.put("fullName", u.getFullName());
        m.put("email", u.getEmail());
        m.put("phone", u.getPhone());
        m.put("role", u.getRole());
        m.put("status", u.getStatus());
        m.put("profileImagePath", u.getProfileImagePath());
        m.put("createdAt", str(u.getCreatedAt()));
        m.put("updatedAt", str(u.getUpdatedAt()));
        m.put("lastLoginAt", str(u.getLastLoginAt()));
        m.put("termsAcceptedAt", str(u.getTermsAcceptedAt()));
        m.put("privacyNoticeVersion", u.getPrivacyNoticeVersion());
        return m;
    }

    private Map<String, Object> profileMap(StudentProfile p) {
        if (p == null) return null;
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("programme", p.getProgramme());
        m.put("specialisation", p.getSpecialisation());
        m.put("faculty", p.getFaculty());
        m.put("intakeYear", p.getIntakeYear());
        m.put("expectedGraduation", p.getExpectedGraduation());
        m.put("cgpa", p.getCgpa());
        m.put("fypStatus", p.getFypStatus());
        m.put("interests", p.getInterests());
        m.put("skills", p.getSkills());
        m.put("bio", p.getBio());
        m.put("linkedinUrl", p.getLinkedinUrl());
        m.put("githubUrl", p.getGithubUrl());
        m.put("portfolioUrl", p.getPortfolioUrl());
        m.put("updatedAt", str(p.getUpdatedAt()));
        return m;
    }

    private Map<String, Object> projectMap(Project p) {
        if (p == null) return null;
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("projectId", p.getProjectId());
        m.put("title", p.getProjectTitle());
        m.put("description", p.getDescription());
        m.put("specialisation", p.getSpecialisation());
        m.put("category", p.getCategory());
        m.put("stage", p.getStage());
        m.put("fyp1Passed", p.getFyp1Passed());
        m.put("status", p.getStatus());
        m.put("registeredAt", str(p.getRegisteredAt()));
        m.put("updatedAt", str(p.getUpdatedAt()));
        return m;
    }

    private Map<String, Object> proposalMap(Proposal p) {
        if (p == null) return null;
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("proposalId", p.getProposalId());
        m.put("title", p.getTitle());
        m.put("status", p.getStatus());
        m.put("currentVersion", p.getCurrentVersion());
        m.put("createdAt", str(p.getCreatedAt()));
        m.put("updatedAt", str(p.getUpdatedAt()));
        List<ProposalVersion> versions = proposalVersionRepository.findByProposal_ProposalIdOrderByVersionNoDesc(p.getProposalId());
        m.put("versions", listOf(versions, v -> {
            Map<String, Object> vm = new LinkedHashMap<>();
            vm.put("versionNo", v.getVersionNo());
            vm.put("contentText", v.getContentText());
            vm.put("fileName", v.getFileName());
            vm.put("createdAt", str(v.getCreatedAt()));
            return vm;
        }));
        return m;
    }

    private Map<String, Object> meetingMap(Meeting m) {
        Map<String, Object> r = new LinkedHashMap<>();
        r.put("meetingId", m.getMeetingId());
        r.put("title", m.getTitle());
        r.put("meetingType", m.getMeetingType());
        r.put("proposedStartAt", str(m.getProposedStartAt()));
        r.put("proposedEndAt", str(m.getProposedEndAt()));
        r.put("confirmedStartAt", str(m.getConfirmedStartAt()));
        r.put("confirmedEndAt", str(m.getConfirmedEndAt()));
        r.put("platform", m.getPlatform());
        r.put("location", m.getLocation());
        r.put("agenda", m.getAgenda());
        r.put("notes", m.getNotes());
        r.put("status", m.getStatus());
        r.put("cancelReason", m.getCancelReason());
        r.put("createdAt", str(m.getCreatedAt()));
        return r;
    }

    private Map<String, Object> meetingLogMap(MeetingLog log) {
        Map<String, Object> r = new LinkedHashMap<>();
        r.put("logId", log.getLogId());
        r.put("meetingDate", str(log.getMeetingDate()));
        r.put("meetingNumber", log.getMeetingNumber());
        r.put("meetingMode", log.getMeetingMode());
        r.put("fypPhase", log.getFypPhase());
        r.put("tasksJson", log.getTasksJson());
        r.put("discussionSummary", log.getDiscussionSummary());
        r.put("workDoneDetails", log.getWorkDoneDetails());
        r.put("workToBeDone", log.getWorkToBeDone());
        r.put("problemsAndSolutions", log.getProblemsAndSolutions());
        r.put("actionItems", log.getActionItems());
        r.put("nextMeetingDate", str(log.getNextMeetingDate()));
        r.put("supervisorComments", log.getSupervisorComments());
        r.put("status", log.getStatus());
        r.put("submittedAt", str(log.getSubmittedAt()));
        r.put("lockedAt", str(log.getLockedAt()));
        r.put("createdAt", str(log.getCreatedAt()));
        return r;
    }

    private Map<String, Object> documentMap(ProjectDocument d) {
        Map<String, Object> r = new LinkedHashMap<>();
        r.put("documentId", d.getDocumentId());
        r.put("title", d.getTitle());
        r.put("description", d.getDescription());
        r.put("docType", d.getDocType());
        r.put("phase", d.getPhase());
        r.put("versionNo", d.getVersionNo());
        r.put("fileName", d.getFileName());
        r.put("fileSize", d.getFileSize());
        r.put("mimeType", d.getMimeType());
        r.put("uploadedAt", str(d.getUploadedAt()));
        return r;
    }

    private Map<String, Object> supervisorRequestMap(SupervisorRequest s) {
        Map<String, Object> r = new LinkedHashMap<>();
        r.put("requestId", s.getRequestId());
        r.put("proposedTitle", s.getProposedTitle());
        r.put("topicSummary", s.getTopicSummary());
        r.put("message", s.getMessage());
        r.put("responseMessage", s.getResponseMessage());
        r.put("status", s.getStatus());
        r.put("submittedAt", str(s.getSubmittedAt()));
        r.put("respondedAt", str(s.getRespondedAt()));
        r.put("expiresAt", str(s.getExpiresAt()));
        return r;
    }

    private Map<String, Object> chatPreferencesMap(ChatPreferences p) {
        if (p == null) return null;
        Map<String, Object> r = new LinkedHashMap<>();
        r.put("responseLength", p.getResponseLength());
        r.put("tone", p.getTone());
        r.put("language", p.getLanguage());
        r.put("updatedAt", str(p.getUpdatedAt()));
        return r;
    }

    private Map<String, Object> chatMemoryMap(ChatMemory m) {
        if (m == null) return null;
        Map<String, Object> r = new LinkedHashMap<>();
        r.put("summaryText", m.getSummaryText());
        r.put("updatedAt", str(m.getUpdatedAt()));
        return r;
    }

    private List<Map<String, Object>> chatSessionsWithMessages(Long userId) {
        List<ChatSession> sessions = chatSessionRepository.findByUser_UserIdOrderByStartedAtDesc(userId);
        List<Map<String, Object>> out = new ArrayList<>(sessions.size());
        for (ChatSession s : sessions) {
            Map<String, Object> sm = new LinkedHashMap<>();
            sm.put("sessionId", s.getSessionId());
            sm.put("startedAt", str(s.getStartedAt()));
            sm.put("endedAt", str(s.getEndedAt()));
            List<ChatMessage> msgs = chatMessageRepository.findBySession_SessionIdOrderBySentAtAsc(s.getSessionId());
            sm.put("messages", listOf(msgs, msg -> {
                Map<String, Object> mm = new LinkedHashMap<>();
                mm.put("sender", msg.getSender());
                mm.put("content", msg.getContent());
                mm.put("confidenceScore", msg.getConfidenceScore());
                mm.put("sentAt", str(msg.getSentAt()));
                mm.put("feedback", msg.getFeedback());
                return mm;
            }));
            out.add(sm);
        }
        return out;
    }

    private Map<String, Object> notificationMap(Notification n) {
        Map<String, Object> r = new LinkedHashMap<>();
        r.put("notificationId", n.getNotificationId());
        r.put("type", n.getType());
        r.put("title", n.getTitle());
        r.put("message", n.getMessage());
        r.put("targetRoute", n.getTargetRoute());
        r.put("createdAt", str(n.getCreatedAt()));
        r.put("readAt", str(n.getReadAt()));
        return r;
    }

    private void recordExportAudit(UserAccount user) {
        auditLogRepository.save(AuditLog.builder()
                .user(user)
                .action("DATA_EXPORT")
                .entityName("UserAccount")
                .entityId(String.valueOf(user.getUserId()))
                .details("Personal data export requested by user (PDPA right of access)")
                .build());
    }

    private static <T, R> List<R> listOf(List<T> source, java.util.function.Function<T, R> mapper) {
        if (source == null || source.isEmpty()) return List.of();
        List<R> out = new ArrayList<>(source.size());
        for (T t : source) out.add(mapper.apply(t));
        return out;
    }

    private static String str(LocalDateTime t) { return t == null ? null : t.toString(); }
    private static String str(LocalDate d) { return d == null ? null : d.toString(); }
}
