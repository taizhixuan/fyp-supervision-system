package com.fyp.supervision.service;

import com.fyp.supervision.entity.*;
import com.fyp.supervision.enums.*;
import com.fyp.supervision.exception.BadRequestException;
import com.fyp.supervision.exception.ResourceNotFoundException;
import com.fyp.supervision.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
@RequiredArgsConstructor
public class StudentService {

    private final UserAccountRepository userAccountRepository;
    private final StudentProfileRepository studentProfileRepository;
    private final SupervisorProfileRepository supervisorProfileRepository;
    private final ProjectRepository projectRepository;
    private final SupervisorRequestRepository supervisorRequestRepository;
    private final ProposalRepository proposalRepository;
    private final ProposalVersionRepository proposalVersionRepository;
    private final ProposalReviewRepository proposalReviewRepository;
    private final MeetingRepository meetingRepository;
    private final MeetingLogRepository meetingLogRepository;
    private final MeetingLogSignatureRepository meetingLogSignatureRepository;
    private final ProjectDocumentRepository projectDocumentRepository;
    private final DeadlineRepository deadlineRepository;
    private final NotificationRepository notificationRepository;
    private final NotificationService notificationService;

    // ========================= Profile =========================

    public Map<String, Object> getProfileDto(Long userId) {
        StudentProfile profile = studentProfileRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Student profile not found"));
        UserAccount user = userAccountRepository.findById(userId).orElseThrow();
        return buildStudentProfileDto(profile, user);
    }

    public StudentProfile getProfile(Long userId) {
        return studentProfileRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Student profile not found"));
    }

    @Transactional
    public Map<String, Object> updateProfile(Long userId, Map<String, Object> updates) {
        StudentProfile profile = getProfile(userId);
        UserAccount user = userAccountRepository.findById(userId).orElseThrow();
        if (updates.containsKey("bio")) profile.setBio((String) updates.get("bio"));
        if (updates.containsKey("skills")) profile.setSkills(toJson(updates.get("skills")));
        if (updates.containsKey("researchInterests")) profile.setInterests(toJson(updates.get("researchInterests")));
        if (updates.containsKey("linkedinUrl")) profile.setLinkedinUrl((String) updates.get("linkedinUrl"));
        if (updates.containsKey("githubUrl")) profile.setGithubUrl((String) updates.get("githubUrl"));
        if (updates.containsKey("portfolioUrl")) profile.setPortfolioUrl((String) updates.get("portfolioUrl"));
        if (updates.containsKey("phone")) {
            user.setPhone((String) updates.get("phone"));
            userAccountRepository.save(user);
        }
        studentProfileRepository.save(profile);
        return buildStudentProfileDto(profile, user);
    }

    // ========================= Dashboard =========================

    public Map<String, Object> getDashboard(Long userId) {
        Map<String, Object> dashboard = new HashMap<>();
        UserAccount user = userAccountRepository.findById(userId).orElseThrow();
        StudentProfile profile = studentProfileRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Student profile not found"));

        dashboard.put("profile", buildStudentProfileDto(profile, user));

        Optional<Project> projectOpt = projectRepository.findByStudent_UserId(userId);
        dashboard.put("registrationStatus", buildRegistrationStatus(userId, user, projectOpt));

        // Upcoming meetings
        List<Meeting> meetings = meetingRepository.findAllByStudentUserId(userId);
        List<Map<String, Object>> upcomingMeetings = meetings.stream()
                .filter(m -> m.getStatus() != MeetingStatus.CANCELLED && m.getStatus() != MeetingStatus.COMPLETED)
                .sorted(Comparator.comparing(m -> m.getProposedStartAt() != null ? m.getProposedStartAt() : LocalDateTime.MAX))
                .limit(5)
                .map(m -> buildMeetingDto(m))
                .toList();
        dashboard.put("upcomingMeetings", upcomingMeetings);

        // Pending logs
        List<MeetingLog> draftLogs = meetingLogRepository.findByStudent_UserIdAndStatusOrderByCreatedAtDesc(userId, MeetingLogStatus.DRAFT);
        dashboard.put("pendingLogs", draftLogs.stream().limit(5).map(this::buildMeetingLogDto).toList());

        // Recent documents
        List<ProjectDocument> docs = projectDocumentRepository.findByProject_Student_UserIdOrderByUploadedAtDesc(userId);
        dashboard.put("recentDocuments", docs.stream().limit(5).map(this::buildDocumentDto).toList());

        // Upcoming deadlines
        List<Deadline> deadlines = deadlineRepository.findByDueDateAfterOrderByDueDateAsc(LocalDate.now());
        dashboard.put("upcomingDeadlines", deadlines.stream().limit(10).map(this::buildDeadlineDto).toList());

        // Proposal status
        proposalRepository.findByStudent_UserId(userId).ifPresent(p -> dashboard.put("proposalStatus", buildProposalDto(p)));

        // Notifications
        long unreadCount = notificationRepository.countByUser_UserIdAndReadAtIsNull(userId);
        dashboard.put("notifications", Map.of("unreadCount", unreadCount));

        // Quick stats
        long totalMeetings = meetingRepository.countByProject_Student_UserId(userId);
        long completedLogs = meetingLogRepository.countByStudent_UserIdAndStatus(userId, MeetingLogStatus.LOCKED);
        long documentsUploaded = projectDocumentRepository.countByProject_Student_UserId(userId);
        dashboard.put("quickStats", Map.of(
            "totalMeetings", totalMeetings,
            "completedLogs", completedLogs,
            "documentsUploaded", documentsUploaded
        ));

        return dashboard;
    }

    // ========================= Supervisor Directory =========================

    public Map<String, Object> searchSupervisorsDto(String search, String faculty, Boolean availableOnly, Pageable pageable) {
        Page<SupervisorProfile> page;
        if (search != null && !search.isBlank()) {
            page = supervisorProfileRepository.searchSupervisors(search, pageable);
        } else if (faculty != null && !faculty.isBlank()) {
            page = supervisorProfileRepository.findByFaculty(faculty, pageable);
        } else if (Boolean.TRUE.equals(availableOnly)) {
            page = supervisorProfileRepository.findAvailableSupervisors(pageable);
        } else {
            page = supervisorProfileRepository.findAllActiveSupervisors(pageable);
        }

        List<Map<String, Object>> supervisors = page.getContent().stream()
                .map(this::buildSupervisorSummaryDto)
                .toList();

        Map<String, Object> result = new HashMap<>();
        result.put("supervisors", supervisors);
        result.put("total", page.getTotalElements());
        result.put("page", page.getNumber() + 1);
        result.put("totalPages", page.getTotalPages());
        return result;
    }

    public Map<String, Object> getSupervisorDetailDto(Long supervisorId) {
        SupervisorProfile profile = supervisorProfileRepository.findById(supervisorId)
                .orElseThrow(() -> new ResourceNotFoundException("Supervisor not found"));
        return buildSupervisorDetailDto(profile);
    }

    // ========================= Supervision Requests =========================

    public List<Map<String, Object>> getSupervisionRequestDtos(Long userId) {
        List<SupervisorRequest> requests = supervisorRequestRepository.findByStudent_UserIdOrderBySubmittedAtDesc(userId);
        return requests.stream().map(this::buildSupervisionRequestDto).toList();
    }

    @Transactional
    public Map<String, Object> createSupervisionRequest(Long userId, Map<String, Object> data) {
        Long supervisorId = Long.valueOf(data.get("supervisorId").toString());

        if (supervisorRequestRepository.existsByStudent_UserIdAndSupervisorUser_UserIdAndStatus(userId, supervisorId, RequestStatus.PENDING)) {
            throw new BadRequestException("You already have a pending request to this supervisor.");
        }

        UserAccount student = userAccountRepository.findById(userId).orElseThrow();
        UserAccount supervisor = userAccountRepository.findById(supervisorId)
                .orElseThrow(() -> new ResourceNotFoundException("Supervisor not found"));

        SupervisorRequest request = SupervisorRequest.builder()
                .student(student)
                .supervisorUser(supervisor)
                .proposedTitle((String) data.get("proposedTitle"))
                .topicSummary((String) data.get("topicDescription"))
                .message((String) data.get("message"))
                .build();

        SupervisorRequest saved = supervisorRequestRepository.save(request);

        notificationService.createNotification(
                supervisorId, "REQUEST",
                "New Supervision Request",
                student.getFullName() + " has sent you a supervision request.",
                "/supervisor/requests"
        );

        return buildSupervisionRequestDto(saved);
    }

    @Transactional
    public void withdrawSupervisionRequest(Long requestId, Long userId) {
        SupervisorRequest request = supervisorRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Request not found"));
        if (!request.getStudent().getUserId().equals(userId)) {
            throw new BadRequestException("You can only withdraw your own requests.");
        }
        if (request.getStatus() != RequestStatus.PENDING) {
            throw new BadRequestException("Only pending requests can be withdrawn.");
        }
        request.setStatus(RequestStatus.WITHDRAWN);
        supervisorRequestRepository.save(request);
    }

    // ========================= Proposals =========================

    public Map<String, Object> getProposalDto(Long userId) {
        Proposal proposal = proposalRepository.findByStudent_UserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Proposal not found"));
        return buildProposalDto(proposal);
    }

    public Optional<Proposal> getProposal(Long userId) {
        return proposalRepository.findByStudent_UserId(userId);
    }

    @Transactional
    public Map<String, Object> createProposal(Long userId, Map<String, Object> data) {
        if (proposalRepository.findByStudent_UserId(userId).isPresent()) {
            throw new BadRequestException("You already have a proposal.");
        }

        UserAccount student = userAccountRepository.findById(userId).orElseThrow();
        Optional<Project> project = projectRepository.findByStudent_UserId(userId);

        Proposal proposal = Proposal.builder()
                .student(student)
                .title((String) data.get("title"))
                .status(ProposalStatus.DRAFT)
                .currentVersion(1)
                .build();
        project.ifPresent(p -> {
            proposal.setProject(p);
            proposal.setSupervisor(p.getSupervisor());
        });

        Proposal saved = proposalRepository.save(proposal);

        String contentJson = toJson(data);
        ProposalVersion version = ProposalVersion.builder()
                .proposal(saved)
                .versionNo(1)
                .contentText(contentJson)
                .build();
        proposalVersionRepository.save(version);

        return buildProposalDto(saved);
    }

    @Transactional
    public Map<String, Object> updateProposal(Long userId, Map<String, Object> data) {
        Proposal proposal = proposalRepository.findByStudent_UserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Proposal not found"));

        if (data.containsKey("title")) proposal.setTitle((String) data.get("title"));

        int newVersion = proposal.getCurrentVersion() + 1;
        proposal.setCurrentVersion(newVersion);
        proposalRepository.save(proposal);

        ProposalVersion version = ProposalVersion.builder()
                .proposal(proposal)
                .versionNo(newVersion)
                .contentText(toJson(data))
                .build();
        proposalVersionRepository.save(version);

        return buildProposalDto(proposal);
    }

    @Transactional
    public Map<String, Object> submitProposal(Long userId) {
        Proposal proposal = proposalRepository.findByStudent_UserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Proposal not found"));
        if (proposal.getStatus() != ProposalStatus.DRAFT && proposal.getStatus() != ProposalStatus.REVISION_REQUIRED) {
            throw new BadRequestException("Proposal cannot be submitted in its current status.");
        }
        proposal.setStatus(ProposalStatus.SUBMITTED);
        Proposal saved = proposalRepository.save(proposal);

        if (proposal.getSupervisor() != null) {
            notificationService.createNotification(
                    proposal.getSupervisor().getUserId(), "PROPOSAL",
                    "Proposal Submitted",
                    proposal.getStudent().getFullName() + " has submitted their proposal for review.",
                    "/supervisor/proposals"
            );
        }

        return buildProposalDto(saved);
    }

    public List<Map<String, Object>> getProposalVersionDtos(Long userId) {
        Proposal proposal = proposalRepository.findByStudent_UserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Proposal not found"));
        List<ProposalVersion> versions = proposalVersionRepository.findByProposal_ProposalIdOrderByVersionNoDesc(proposal.getProposalId());
        return versions.stream().map(v -> buildProposalVersionDto(v, proposal)).toList();
    }

    public List<Map<String, Object>> getProposalFeedbackDtos(Long userId) {
        Optional<Proposal> proposalOpt = proposalRepository.findByStudent_UserId(userId);
        if (proposalOpt.isEmpty()) return List.of();
        List<ProposalReview> reviews = proposalReviewRepository.findByProposal_ProposalIdOrderByReviewedAtDesc(proposalOpt.get().getProposalId());
        return reviews.stream().map(this::buildProposalFeedbackDto).toList();
    }

    // ========================= Meetings =========================

    public Map<String, Object> getMeetingsDto(Long userId, String status, Pageable pageable) {
        Page<Meeting> page;
        if (status != null && !status.isBlank()) {
            page = meetingRepository.findByStudentUserIdAndStatus(userId, MeetingStatus.valueOf(status), pageable);
        } else {
            page = meetingRepository.findByStudentUserId(userId, pageable);
        }

        List<Map<String, Object>> meetings = page.getContent().stream()
                .map(this::buildMeetingDto)
                .toList();

        Map<String, Object> result = new HashMap<>();
        result.put("meetings", meetings);
        result.put("total", page.getTotalElements());
        return result;
    }

    public Map<String, Object> getMeetingDto(Long meetingId) {
        Meeting meeting = meetingRepository.findById(meetingId)
                .orElseThrow(() -> new ResourceNotFoundException("Meeting not found"));
        return buildMeetingDto(meeting);
    }

    // ========================= Meeting Logs =========================

    public Map<String, Object> getLogsDto(Long userId, String status, Pageable pageable) {
        Page<MeetingLog> page;
        if (status != null && !status.isBlank()) {
            page = meetingLogRepository.findByStudent_UserIdAndStatusOrderByCreatedAtDesc(userId, MeetingLogStatus.valueOf(status), pageable);
        } else {
            page = meetingLogRepository.findByStudent_UserIdOrderByCreatedAtDesc(userId, pageable);
        }

        List<Map<String, Object>> logs = page.getContent().stream()
                .map(this::buildMeetingLogDto)
                .toList();

        Map<String, Object> result = new HashMap<>();
        result.put("logs", logs);
        result.put("total", page.getTotalElements());
        return result;
    }

    public Map<String, Object> getLogDto(Long logId) {
        MeetingLog log = meetingLogRepository.findById(logId)
                .orElseThrow(() -> new ResourceNotFoundException("Meeting log not found"));
        return buildMeetingLogDto(log);
    }

    // ========================= Documents =========================

    public Map<String, Object> getDocumentsDto(Long userId, String type, String phase, Pageable pageable) {
        Page<ProjectDocument> page = projectDocumentRepository.findByProject_Student_UserIdOrderByUploadedAtDesc(userId, pageable);

        List<Map<String, Object>> documents = page.getContent().stream()
                .map(this::buildDocumentDto)
                .toList();

        Map<String, Object> result = new HashMap<>();
        result.put("documents", documents);
        result.put("total", page.getTotalElements());
        return result;
    }

    public Map<String, Object> getDocumentDto(Long documentId) {
        ProjectDocument doc = projectDocumentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found"));
        return buildDocumentDto(doc);
    }

    // ========================= Deadlines =========================

    public Map<String, Object> getDeadlinesDto(Long userId) {
        List<Deadline> deadlines = deadlineRepository.findByAudienceAndDueDateAfterOrderByDueDateAsc("STUDENT", LocalDate.now());
        if (deadlines.isEmpty()) {
            deadlines = deadlineRepository.findByDueDateAfterOrderByDueDateAsc(LocalDate.now());
        }
        List<Map<String, Object>> dtos = deadlines.stream().map(this::buildDeadlineDto).toList();
        return Map.of("deadlines", dtos);
    }

    public List<Deadline> getDeadlines(Long userId) {
        return deadlineRepository.findByAudienceAndDueDateAfterOrderByDueDateAsc("STUDENT", LocalDate.now());
    }

    // ========================= DTO Builders =========================

    public Map<String, Object> buildStudentProfileDto(StudentProfile profile, UserAccount user) {
        Map<String, Object> dto = new LinkedHashMap<>();
        dto.put("userId", user.getUserId().toString());
        dto.put("studentId", user.getMmuId());
        dto.put("fullName", user.getFullName());
        dto.put("email", user.getEmail());
        dto.put("phone", user.getPhone());
        dto.put("programCode", profile.getProgramme() != null ? profile.getProgramme() : "");
        dto.put("programName", profile.getProgramme() != null ? profile.getProgramme() : "");
        dto.put("faculty", profile.getFaculty() != null ? profile.getFaculty() : "");
        dto.put("intakeYear", profile.getIntakeYear() != null ? profile.getIntakeYear() : 0);
        dto.put("expectedGraduation", profile.getExpectedGraduation() != null ? profile.getExpectedGraduation() : "");
        dto.put("cgpa", profile.getCgpa());
        dto.put("profileImageUrl", user.getProfileImagePath());
        dto.put("bio", profile.getBio());
        dto.put("skills", parseJsonArray(profile.getSkills()));
        dto.put("researchInterests", parseJsonArray(profile.getInterests()));
        dto.put("linkedinUrl", profile.getLinkedinUrl());
        dto.put("githubUrl", profile.getGithubUrl());
        dto.put("portfolioUrl", profile.getPortfolioUrl());
        dto.put("createdAt", user.getCreatedAt() != null ? user.getCreatedAt().toString() : "");
        dto.put("updatedAt", profile.getUpdatedAt() != null ? profile.getUpdatedAt().toString() : "");
        return dto;
    }

    public Map<String, Object> buildSupervisorSummaryDto(SupervisorProfile sp) {
        UserAccount user = userAccountRepository.findById(sp.getUserId()).orElse(null);
        Map<String, Object> dto = new LinkedHashMap<>();
        dto.put("supervisorId", sp.getUserId().toString());
        dto.put("userId", sp.getUserId().toString());
        dto.put("fullName", user != null ? user.getFullName() : "");
        dto.put("email", user != null ? user.getEmail() : "");
        dto.put("title", sp.getPosition() != null ? sp.getPosition() : "Lecturer");
        dto.put("department", sp.getDepartment() != null ? sp.getDepartment() : "");
        dto.put("faculty", sp.getFaculty() != null ? sp.getFaculty() : "");
        dto.put("profileImageUrl", user != null ? user.getProfileImagePath() : null);
        dto.put("researchAreas", parseJsonArray(sp.getResearchAreas()));
        dto.put("currentLoad", sp.getCurrentLoad());
        dto.put("maxCapacity", sp.getSupervisionQuota());
        dto.put("isAcceptingStudents", sp.getCurrentLoad() < sp.getSupervisionQuota()
                && !"UNAVAILABLE".equalsIgnoreCase(sp.getAvailabilityStatus()));
        return dto;
    }

    public Map<String, Object> buildSupervisorDetailDto(SupervisorProfile sp) {
        Map<String, Object> dto = buildSupervisorSummaryDto(sp);
        dto.put("bio", sp.getBio());
        dto.put("qualifications", List.of());
        dto.put("publications", List.of());
        dto.put("expertise", parseJsonArray(sp.getExpertise()));
        dto.put("officeLocation", sp.getOfficeLocation());
        dto.put("officeHours", sp.getOfficeHours());
        dto.put("preferredMeetingPlatforms", List.of("ZOOM", "GOOGLE_MEET"));
        dto.put("averageResponseTime", "2 days");
        dto.put("rating", null);
        long totalSupervised = projectRepository.countBySupervisor_UserId(sp.getUserId());
        dto.put("totalSupervised", totalSupervised);
        return dto;
    }

    private Map<String, Object> buildSupervisionRequestDto(SupervisorRequest req) {
        SupervisorProfile supProfile = supervisorProfileRepository.findById(req.getSupervisorUser().getUserId()).orElse(null);
        Map<String, Object> dto = new LinkedHashMap<>();
        dto.put("requestId", req.getRequestId().toString());
        dto.put("studentId", req.getStudent().getMmuId());
        dto.put("supervisorId", req.getSupervisorUser().getUserId().toString());
        dto.put("supervisor", supProfile != null ? buildSupervisorSummaryDto(supProfile) : Map.of());
        dto.put("proposedTitle", req.getProposedTitle() != null ? req.getProposedTitle() : "");
        dto.put("topicDescription", req.getTopicSummary() != null ? req.getTopicSummary() : "");
        dto.put("message", req.getMessage());
        dto.put("status", req.getStatus().name());
        dto.put("submittedAt", req.getSubmittedAt() != null ? req.getSubmittedAt().toString() : "");
        dto.put("respondedAt", req.getRespondedAt() != null ? req.getRespondedAt().toString() : null);
        dto.put("responseMessage", req.getResponseMessage());
        dto.put("expiresAt", req.getExpiresAt() != null ? req.getExpiresAt().toString() : "");
        return dto;
    }

    private Map<String, Object> buildProposalDto(Proposal p) {
        // Get latest version content
        List<ProposalVersion> versions = proposalVersionRepository.findByProposal_ProposalIdOrderByVersionNoDesc(p.getProposalId());
        Map<String, Object> latestContent = Map.of();
        String fileUrl = null;
        String fileName = null;
        if (!versions.isEmpty()) {
            ProposalVersion latest = versions.get(0);
            latestContent = parseJsonMap(latest.getContentText());
            fileUrl = latest.getUploadFilePath();
            fileName = latest.getFileName();
        }

        Map<String, Object> dto = new LinkedHashMap<>();
        dto.put("proposalId", p.getProposalId().toString());
        dto.put("studentId", p.getStudent().getMmuId());
        dto.put("supervisorId", p.getSupervisor() != null ? p.getSupervisor().getUserId().toString() : null);
        dto.put("title", p.getTitle() != null ? p.getTitle() : "");
        dto.put("problemStatement", latestContent.getOrDefault("problemStatement", ""));
        dto.put("objectives", latestContent.getOrDefault("objectives", List.of()));
        dto.put("scope", latestContent.getOrDefault("scope", ""));
        dto.put("methodology", latestContent.getOrDefault("methodology", ""));
        dto.put("expectedOutcomes", latestContent.getOrDefault("expectedOutcomes", List.of()));
        dto.put("timeline", latestContent.getOrDefault("timeline", null));
        dto.put("references", latestContent.getOrDefault("references", List.of()));
        dto.put("status", p.getStatus().name());
        dto.put("version", p.getCurrentVersion());
        dto.put("submittedAt", p.getStatus() == ProposalStatus.SUBMITTED || p.getStatus() == ProposalStatus.UNDER_REVIEW || p.getStatus() == ProposalStatus.APPROVED ? p.getUpdatedAt().toString() : null);
        dto.put("fileUrl", fileUrl);
        dto.put("fileName", fileName);
        dto.put("createdAt", p.getCreatedAt() != null ? p.getCreatedAt().toString() : "");
        dto.put("updatedAt", p.getUpdatedAt() != null ? p.getUpdatedAt().toString() : "");
        return dto;
    }

    private Map<String, Object> buildProposalVersionDto(ProposalVersion v, Proposal proposal) {
        Map<String, Object> dto = new LinkedHashMap<>();
        dto.put("versionId", v.getVersionId().toString());
        dto.put("proposalId", proposal.getProposalId().toString());
        dto.put("version", v.getVersionNo());
        dto.put("title", proposal.getTitle());
        dto.put("status", proposal.getStatus().name());
        dto.put("submittedAt", null);
        dto.put("fileUrl", v.getUploadFilePath());
        dto.put("changes", null);
        dto.put("createdAt", v.getCreatedAt() != null ? v.getCreatedAt().toString() : "");
        return dto;
    }

    private Map<String, Object> buildProposalFeedbackDto(ProposalReview review) {
        Map<String, Object> dto = new LinkedHashMap<>();
        dto.put("feedbackId", review.getReviewId().toString());
        dto.put("proposalId", review.getProposal().getProposalId().toString());
        dto.put("reviewerType", review.getReviewerRole());
        dto.put("reviewerId", review.getReviewer().getUserId().toString());
        dto.put("reviewerName", review.getReviewer().getFullName());
        dto.put("status", review.getDecision());
        dto.put("comments", review.getRemarks() != null ? review.getRemarks() : "");
        dto.put("detailedFeedback", List.of());
        dto.put("createdAt", review.getReviewedAt() != null ? review.getReviewedAt().toString() : "");
        return dto;
    }

    public Map<String, Object> buildMeetingDto(Meeting m) {
        Map<String, Object> dto = new LinkedHashMap<>();
        dto.put("meetingId", m.getMeetingId().toString());
        dto.put("studentId", m.getProject() != null && m.getProject().getStudent() != null ? m.getProject().getStudent().getMmuId() : "");
        dto.put("supervisorId", m.getProject() != null && m.getProject().getSupervisor() != null ? m.getProject().getSupervisor().getUserId().toString() : "");

        // Build supervisor summary if available
        if (m.getProject() != null && m.getProject().getSupervisor() != null) {
            SupervisorProfile sp = supervisorProfileRepository.findById(m.getProject().getSupervisor().getUserId()).orElse(null);
            dto.put("supervisor", sp != null ? buildSupervisorSummaryDto(sp) : Map.of());
        } else {
            dto.put("supervisor", Map.of());
        }

        dto.put("title", m.getTitle() != null ? m.getTitle() : "");
        dto.put("agenda", m.getAgenda());
        dto.put("scheduledAt", m.getConfirmedStartAt() != null ? m.getConfirmedStartAt().toString() : (m.getProposedStartAt() != null ? m.getProposedStartAt().toString() : ""));
        dto.put("duration", m.getDurationMinutes() != null ? m.getDurationMinutes() : 60);
        dto.put("platform", m.getPlatform() != null ? m.getPlatform() : "OTHER");
        dto.put("location", m.getLocation());
        dto.put("meetingLink", m.getMeetingUrl());
        dto.put("status", m.getStatus().name());
        dto.put("notes", m.getNotes());
        dto.put("rescheduleReason", null);
        dto.put("cancelReason", m.getCancelReason());
        dto.put("createdAt", m.getCreatedAt() != null ? m.getCreatedAt().toString() : "");
        dto.put("updatedAt", m.getUpdatedAt() != null ? m.getUpdatedAt().toString() : "");
        return dto;
    }

    public Map<String, Object> buildMeetingLogDto(MeetingLog log) {
        Map<String, Object> dto = new LinkedHashMap<>();

        // Identity
        dto.put("logId", log.getLogId().toString());
        dto.put("meetingId", log.getMeeting() != null ? log.getMeeting().getMeetingId().toString() : null);
        dto.put("projectId", log.getProject() != null ? log.getProject().getProjectId().toString() : null);

        // Header metadata
        dto.put("meetingDate", log.getMeetingDate() != null ? log.getMeetingDate().toString() : "");
        dto.put("meetingNumber", log.getMeetingNumber() != null ? log.getMeetingNumber() : 1);
        dto.put("meetingMode", log.getMeetingMode() != null ? log.getMeetingMode() : "PHYSICAL");
        dto.put("projectTitle", log.getProject() != null && log.getProject().getProjectTitle() != null ? log.getProject().getProjectTitle() : "");
        dto.put("fypPhase", log.getFypPhase() != null ? log.getFypPhase() : "FYP1");

        // Participants
        UserAccount student = log.getStudent();
        Map<String, Object> studentDto = new LinkedHashMap<>();
        studentDto.put("studentId", student.getMmuId());
        studentDto.put("fullName", student.getFullName());
        studentDto.put("matricNo", student.getMmuId());
        studentDto.put("programme", studentProfileRepository.findById(student.getUserId())
                .map(StudentProfile::getProgramme).orElse(""));
        dto.put("student", studentDto);

        UserAccount supervisor = log.getSupervisor();
        Map<String, Object> supervisorDto = new LinkedHashMap<>();
        supervisorDto.put("supervisorId", supervisor.getMmuId());
        supervisorDto.put("fullName", supervisor.getFullName());
        supervisorDto.put("title", supervisorProfileRepository.findById(supervisor.getUserId())
                .map(SupervisorProfile::getPosition).orElse(null));
        dto.put("supervisor", supervisorDto);

        // Section 1: Tasks (parse JSON, add labels)
        dto.put("tasks", parseTasks(log.getTasksJson()));
        dto.put("workDoneDetails", log.getWorkDoneDetails() != null ? log.getWorkDoneDetails() : "");

        // Sections 2 & 3
        dto.put("workToBeDone", log.getWorkToBeDone() != null ? log.getWorkToBeDone() : "");
        dto.put("problemsAndSolutions", log.getProblemsAndSolutions() != null ? log.getProblemsAndSolutions() : "");

        // Section 4
        dto.put("supervisorComments", log.getSupervisorComments() != null ? log.getSupervisorComments() : "");

        // Workflow
        dto.put("status", mapMeetingLogStatus(log.getStatus()));
        dto.put("correctionReason", log.getCorrectionReason());

        // Signatures (always emit array, never null — frontend reads .length)
        List<Map<String, Object>> sigDtos = new ArrayList<>();
        List<MeetingLogSignature> signatures = log.getSignatures();
        if (signatures != null) {
            for (MeetingLogSignature sig : signatures) {
                Map<String, Object> sigDto = new LinkedHashMap<>();
                sigDto.put("signatureId", sig.getSignatureId() != null ? sig.getSignatureId().toString() : null);
                sigDto.put("signerUserId", sig.getSigner() != null ? sig.getSigner().getUserId().toString() : null);
                sigDto.put("signerName", sig.getSigner() != null ? sig.getSigner().getFullName() : null);
                sigDto.put("signerRole", sig.getSignerRole());
                sigDto.put("signatureImageUrl", sig.getSignatureImageUrl());
                sigDto.put("signatureSha256", sig.getSignatureSha256());
                sigDto.put("signedAt", sig.getSignedAt() != null ? sig.getSignedAt().toString() : null);
                sigDtos.add(sigDto);
            }
        }
        dto.put("signatures", sigDtos);

        // Timestamps
        dto.put("createdAt", log.getCreatedAt() != null ? log.getCreatedAt().toString() : "");
        dto.put("updatedAt", log.getUpdatedAt() != null ? log.getUpdatedAt().toString() : "");
        dto.put("submittedAt", log.getSubmittedAt() != null ? log.getSubmittedAt().toString() : null);
        dto.put("lockedAt", log.getLockedAt() != null ? log.getLockedAt().toString() : null);

        return dto;
    }

    private static final Map<String, String> MEETING_LOG_TASK_LABELS = Map.of(
            "PLANNING", "Planning",
            "LITERATURE_REVIEW", "Literature Review",
            "REQUIREMENT_ANALYSIS", "Requirement Analysis",
            "DESIGN_METHODOLOGY", "Design & Methodology",
            "PROTOTYPE_POC", "Prototype / Proof of Concept",
            "DRAFT_REPORT", "Draft Report / Report Writing"
    );

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> parseTasks(String tasksJson) {
        if (tasksJson == null || tasksJson.isBlank()) return List.of();
        try {
            List<Map<String, Object>> raw = new com.fasterxml.jackson.databind.ObjectMapper().readValue(tasksJson, List.class);
            List<Map<String, Object>> out = new ArrayList<>();
            for (Map<String, Object> t : raw) {
                String code = t.get("taskCode") != null ? t.get("taskCode").toString() : "";
                Map<String, Object> task = new LinkedHashMap<>();
                task.put("taskCode", code);
                task.put("label", MEETING_LOG_TASK_LABELS.getOrDefault(code, code));
                task.put("isSelected", Boolean.TRUE.equals(t.get("isSelected")));
                task.put("details", t.get("details"));
                out.add(task);
            }
            return out;
        } catch (Exception e) {
            return List.of();
        }
    }

    public Map<String, Object> buildDocumentDto(ProjectDocument doc) {
        Map<String, Object> dto = new LinkedHashMap<>();
        dto.put("documentId", doc.getDocumentId().toString());
        dto.put("studentId", doc.getProject() != null && doc.getProject().getStudent() != null ? doc.getProject().getStudent().getMmuId() : "");
        dto.put("title", doc.getTitle() != null ? doc.getTitle() : "");
        dto.put("description", doc.getDescription());
        dto.put("type", doc.getDocType());
        dto.put("category", doc.getDocType());
        dto.put("phase", doc.getPhase());
        dto.put("fileName", doc.getFileName());
        dto.put("fileSize", doc.getFileSize() != null ? doc.getFileSize() : 0);
        dto.put("fileUrl", "/api/student/documents/" + doc.getDocumentId() + "/download");
        dto.put("mimeType", doc.getMimeType());
        dto.put("version", doc.getVersionNo());
        dto.put("uploadedAt", doc.getUploadedAt() != null ? doc.getUploadedAt().toString() : "");
        dto.put("updatedAt", doc.getUploadedAt() != null ? doc.getUploadedAt().toString() : "");
        dto.put("uploadedBy", doc.getUploadedBy() != null ? doc.getUploadedBy().getFullName() : null);
        return dto;
    }

    public Map<String, Object> buildDeadlineDto(Deadline d) {
        Map<String, Object> dto = new LinkedHashMap<>();
        dto.put("deadlineId", d.getDeadlineId().toString());
        dto.put("title", d.getTitle());
        dto.put("description", d.getDescription());
        dto.put("dueDate", d.getDueDate().toString());
        dto.put("type", d.getDeadlineType() != null ? d.getDeadlineType() : "OTHER");
        dto.put("phase", null);
        long daysRemaining = ChronoUnit.DAYS.between(LocalDate.now(), d.getDueDate());
        dto.put("isUpcoming", daysRemaining >= 0 && daysRemaining <= 14);
        dto.put("daysRemaining", daysRemaining);
        dto.put("priority", daysRemaining <= 3 ? "HIGH" : daysRemaining <= 7 ? "MEDIUM" : "LOW");
        dto.put("isCompleted", false);
        dto.put("reminderSent", false);
        return dto;
    }

    private Map<String, Object> buildRegistrationStatus(Long userId, UserAccount user, Optional<Project> projectOpt) {
        Map<String, Object> reg = new LinkedHashMap<>();
        reg.put("registrationId", userId.toString());
        reg.put("studentId", user.getMmuId());
        reg.put("academicYear", "2024/2025");
        reg.put("semester", 1);
        reg.put("cycle", "FYP1");

        if (projectOpt.isPresent()) {
            Project project = projectOpt.get();
            reg.put("status", "REGISTERED");
            reg.put("supervisorId", project.getSupervisor() != null ? project.getSupervisor().getUserId().toString() : null);
            if (project.getSupervisor() != null) {
                SupervisorProfile sp = supervisorProfileRepository.findById(project.getSupervisor().getUserId()).orElse(null);
                reg.put("supervisor", sp != null ? buildSupervisorSummaryDto(sp) : null);
            }
        } else {
            // Check for pending requests
            boolean hasPendingRequest = supervisorRequestRepository.existsByStudent_UserIdAndStatus(userId, RequestStatus.PENDING);
            if (hasPendingRequest) {
                reg.put("status", "SUPERVISOR_PENDING");
            } else {
                reg.put("status", "NOT_STARTED");
            }
        }
        reg.put("nextSteps", List.of());
        reg.put("timeline", List.of());
        return reg;
    }

    private String mapMeetingLogStatus(MeetingLogStatus status) {
        return switch (status) {
            case DRAFT -> "DRAFT";
            case SUBMITTED -> "SUBMITTED";
            case SUPERVISOR_SIGNED -> "SUPERVISOR_SIGNED";
            case LOCKED -> "LOCKED";
            case CORRECTION_REQUIRED -> "REVISION_REQUIRED";
        };
    }

    // ========================= Helpers =========================

    private String toJson(Object obj) {
        try {
            return new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(obj);
        } catch (Exception e) {
            return "{}";
        }
    }

    @SuppressWarnings("unchecked")
    public List<String> parseJsonArray(String json) {
        if (json == null || json.isBlank()) return List.of();
        try {
            return new com.fasterxml.jackson.databind.ObjectMapper().readValue(json, List.class);
        } catch (Exception e) {
            return List.of();
        }
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> parseJsonMap(String json) {
        if (json == null || json.isBlank()) return Map.of();
        try {
            return new com.fasterxml.jackson.databind.ObjectMapper().readValue(json, Map.class);
        } catch (Exception e) {
            return Map.of();
        }
    }
}
