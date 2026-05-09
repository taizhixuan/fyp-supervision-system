package com.fyp.supervision.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fyp.supervision.entity.*;
import com.fyp.supervision.enums.*;
import com.fyp.supervision.exception.BadRequestException;
import com.fyp.supervision.exception.ResourceNotFoundException;
import com.fyp.supervision.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SupervisorService {

    private final UserAccountRepository userAccountRepository;
    private final SupervisorProfileRepository supervisorProfileRepository;
    private final StudentProfileRepository studentProfileRepository;
    private final ProjectRepository projectRepository;
    private final SupervisorRequestRepository supervisorRequestRepository;
    private final ProposalRepository proposalRepository;
    private final ProposalVersionRepository proposalVersionRepository;
    private final ProposalReviewRepository proposalReviewRepository;
    private final ProposalCheckResultRepository proposalCheckResultRepository;
    private final MeetingRepository meetingRepository;
    private final MeetingLogRepository meetingLogRepository;
    private final MeetingLogSignatureRepository meetingLogSignatureRepository;
    private final ProjectDocumentRepository projectDocumentRepository;
    private final AnnouncementRepository announcementRepository;
    private final FypCycleRepository fypCycleRepository;
    private final NotificationService notificationService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    // ========== Profile ==========

    public SupervisorProfile getProfile(Long userId) {
        return supervisorProfileRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Supervisor profile not found"));
    }

    /** Returns DTO matching frontend SupervisorProfile type */
    public Map<String, Object> getProfileDto(Long userId) {
        SupervisorProfile profile = getProfile(userId);
        UserAccount user = userAccountRepository.findById(userId).orElseThrow();
        return buildProfileDto(profile, user);
    }

    @Transactional
    public Map<String, Object> updateProfile(Long userId, Map<String, Object> updates) {
        SupervisorProfile profile = getProfile(userId);
        UserAccount user = userAccountRepository.findById(userId).orElseThrow();
        if (updates.containsKey("department")) profile.setDepartment((String) updates.get("department"));
        if (updates.containsKey("faculty")) profile.setFaculty((String) updates.get("faculty"));
        if (updates.containsKey("position")) profile.setPosition((String) updates.get("position"));
        if (updates.containsKey("researchAreas")) profile.setResearchAreas(toJson(updates.get("researchAreas")));
        if (updates.containsKey("expertise")) profile.setExpertise(toJson(updates.get("expertise")));
        if (updates.containsKey("bio")) profile.setBio((String) updates.get("bio"));
        if (updates.containsKey("officeLocation")) profile.setOfficeLocation((String) updates.get("officeLocation"));
        if (updates.containsKey("officeHours")) profile.setOfficeHours((String) updates.get("officeHours"));
        if (updates.containsKey("linkedinUrl")) profile.setLinkedinUrl((String) updates.get("linkedinUrl"));
        if (updates.containsKey("googleScholarUrl")) profile.setGoogleScholarUrl((String) updates.get("googleScholarUrl"));
        if (updates.containsKey("preferredProjectTypes")) profile.setPreferredProjectTypes(toJson(updates.get("preferredProjectTypes")));
        if (updates.containsKey("maxSupervisionQuota")) profile.setSupervisionQuota(((Number) updates.get("maxSupervisionQuota")).intValue());
        if (updates.containsKey("isAcceptingStudents")) {
            boolean accepting = (Boolean) updates.get("isAcceptingStudents");
            profile.setAvailabilityStatus(accepting ? "AVAILABLE" : "UNAVAILABLE");
        }
        supervisorProfileRepository.save(profile);
        return buildProfileDto(profile, user);
    }

    /** Builds frontend SupervisorProfile shape */
    public Map<String, Object> buildProfileDto(SupervisorProfile profile, UserAccount user) {
        Map<String, Object> dto = new LinkedHashMap<>();
        dto.put("supervisorId", user.getMmuId());
        dto.put("userId", user.getUserId().toString());
        dto.put("fullName", user.getFullName());
        dto.put("email", user.getEmail());
        dto.put("department", profile.getDepartment() != null ? profile.getDepartment() : "");
        dto.put("faculty", profile.getFaculty() != null ? profile.getFaculty() : "");
        dto.put("position", profile.getPosition() != null ? profile.getPosition() : "");
        dto.put("researchAreas", parseJsonArray(profile.getResearchAreas()));
        dto.put("expertise", parseJsonArray(profile.getExpertise()));
        dto.put("currentSupervisionCount", profile.getCurrentLoad());
        dto.put("maxSupervisionQuota", profile.getSupervisionQuota());
        dto.put("availableSlots", Math.max(0, profile.getSupervisionQuota() - profile.getCurrentLoad()));
        dto.put("isAcceptingStudents", "AVAILABLE".equals(profile.getAvailabilityStatus()) && profile.getCurrentLoad() < profile.getSupervisionQuota());
        dto.put("preferredProjectTypes", parseJsonArray(profile.getPreferredProjectTypes()));
        dto.put("bio", profile.getBio());
        dto.put("officeLocation", profile.getOfficeLocation());
        dto.put("phoneNumber", user.getPhone());
        dto.put("linkedInUrl", profile.getLinkedinUrl());
        dto.put("googleScholarUrl", profile.getGoogleScholarUrl());
        dto.put("createdAt", user.getCreatedAt() != null ? user.getCreatedAt().toString() : "");
        dto.put("updatedAt", profile.getUpdatedAt() != null ? profile.getUpdatedAt().toString() : "");
        return dto;
    }

    // ========== Dashboard ==========

    /** Returns DTO matching frontend SupervisorDashboardStats */
    public Map<String, Object> getDashboard(Long userId) {
        List<Project> projects = projectRepository.findBySupervisor_UserId(userId);
        long pendingRequests = supervisorRequestRepository.countBySupervisorUser_UserIdAndStatus(userId, RequestStatus.PENDING);

        long proposalsToReview = 0;
        for (Proposal p : proposalRepository.findBySupervisor_UserId(userId)) {
            if (p.getStatus() == ProposalStatus.SUBMITTED || p.getStatus() == ProposalStatus.UNDER_REVIEW) {
                proposalsToReview++;
            }
        }

        long upcomingMeetings = meetingRepository.countBySupervisorUserIdAndStatusIn(userId,
                List.of(MeetingStatus.PROPOSED, MeetingStatus.CONFIRMED));
        long pendingLogReviews = meetingLogRepository.countBySupervisor_UserIdAndStatus(userId, MeetingLogStatus.SUBMITTED);

        // Supervisees by status
        long notStarted = projects.stream().filter(p -> p.getStatus() == ProjectStatus.ACTIVE && p.getRegisteredAt() != null && p.getRegisteredAt().isAfter(LocalDateTime.now().minusDays(7))).count();
        long inProgress = projects.stream().filter(p -> p.getStatus() == ProjectStatus.ACTIVE).count();
        long completed = projects.stream().filter(p -> p.getStatus() == ProjectStatus.COMPLETED).count();
        long onHold = projects.stream().filter(p -> p.getStatus() == ProjectStatus.SUSPENDED).count();

        Map<String, Object> dashboard = new LinkedHashMap<>();
        dashboard.put("totalSupervisees", projects.size());
        dashboard.put("pendingRequests", pendingRequests);
        dashboard.put("upcomingMeetings", upcomingMeetings);
        dashboard.put("pendingLogReviews", pendingLogReviews);
        dashboard.put("proposalsToReview", proposalsToReview);
        dashboard.put("documentsToReview", 0);
        dashboard.put("activeAnnouncements", 0);
        dashboard.put("superviseesByStatus", Map.of(
                "notStarted", notStarted,
                "inProgress", inProgress,
                "completed", completed,
                "onHold", onHold
        ));
        dashboard.put("superviseesByRisk", Map.of(
                "low", 0, "medium", 0, "high", 0, "critical", 0
        ));
        dashboard.put("recentActivity", List.of());
        return dashboard;
    }

    // ========== Requests ==========

    /** Loads a SupervisorRequest entity by ID */
    public SupervisorRequest getRequestEntity(Long requestId) {
        return supervisorRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Request not found"));
    }

    /** Returns list of request DTOs matching frontend SupervisionRequest (supervisor view) */
    public List<Map<String, Object>> getRequestDtos(Long userId, String status) {
        List<SupervisorRequest> requests;
        if (status != null && !status.isBlank()) {
            requests = supervisorRequestRepository.findBySupervisorUser_UserIdAndStatusOrderBySubmittedAtDesc(
                    userId, RequestStatus.valueOf(status));
        } else {
            requests = supervisorRequestRepository.findBySupervisorUser_UserIdOrderBySubmittedAtDesc(userId);
        }
        return requests.stream().map(this::buildRequestDto).collect(Collectors.toList());
    }

    public Map<String, Object> buildRequestDto(SupervisorRequest request) {
        UserAccount student = request.getStudent();
        StudentProfile sp = studentProfileRepository.findById(student.getUserId()).orElse(null);

        Map<String, Object> dto = new LinkedHashMap<>();
        dto.put("requestId", request.getRequestId());
        dto.put("studentId", student.getMmuId());
        dto.put("studentName", student.getFullName());
        dto.put("studentEmail", student.getEmail());
        dto.put("studentProgram", sp != null ? (sp.getProgramme() != null ? sp.getProgramme() : "") : "");
        dto.put("studentYear", sp != null && sp.getIntakeYear() != null ? (LocalDateTime.now().getYear() - sp.getIntakeYear() + 1) : 1);
        dto.put("studentCGPA", sp != null && sp.getCgpa() != null ? sp.getCgpa().doubleValue() : null);
        dto.put("proposedTitle", request.getProposedTitle() != null ? request.getProposedTitle() : "");
        dto.put("projectDescription", request.getTopicSummary() != null ? request.getTopicSummary() : "");
        dto.put("researchArea", "");
        dto.put("motivation", request.getMessage() != null ? request.getMessage() : "");
        dto.put("status", request.getStatus().name());
        dto.put("submittedAt", request.getSubmittedAt() != null ? request.getSubmittedAt().toString() : "");
        dto.put("respondedAt", request.getRespondedAt() != null ? request.getRespondedAt().toString() : null);
        dto.put("rejectionReason", request.getResponseMessage());
        return dto;
    }

    @Transactional
    public Map<String, Object> respondToRequest(Long requestId, Long userId, Map<String, Object> data) {
        SupervisorRequest request = supervisorRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Request not found"));
        if (!request.getSupervisorUser().getUserId().equals(userId)) {
            throw new BadRequestException("Not your request to respond to.");
        }
        if (request.getStatus() != RequestStatus.PENDING) {
            throw new BadRequestException("Request is no longer pending.");
        }

        String action = (String) data.get("action");
        request.setRespondedAt(LocalDateTime.now());

        if ("ACCEPT".equalsIgnoreCase(action)) {
            request.setStatus(RequestStatus.ACCEPTED);

            FypCycle activeCycle = fypCycleRepository.findByStatus(CycleStatus.ACTIVE).orElse(null);
            Project project = Project.builder()
                    .cycle(activeCycle)
                    .student(request.getStudent())
                    .supervisor(request.getSupervisorUser())
                    .projectTitle(request.getProposedTitle() != null ? request.getProposedTitle() : "Untitled Project")
                    .status(ProjectStatus.ACTIVE)
                    .registeredAt(LocalDateTime.now())
                    .build();
            projectRepository.save(project);

            SupervisorProfile profile = supervisorProfileRepository.findById(userId).orElse(null);
            if (profile != null) {
                profile.setCurrentLoad(profile.getCurrentLoad() + 1);
                supervisorProfileRepository.save(profile);
            }

            notificationService.createNotification(
                    request.getStudent().getUserId(), "REQUEST",
                    "Supervision Request Accepted",
                    request.getSupervisorUser().getFullName() + " has accepted your supervision request!",
                    "/student/dashboard"
            );
        } else {
            request.setStatus(RequestStatus.REJECTED);
            request.setResponseMessage((String) data.get("rejectionReason"));

            notificationService.createNotification(
                    request.getStudent().getUserId(), "REQUEST",
                    "Supervision Request Declined",
                    request.getSupervisorUser().getFullName() + " has declined your supervision request.",
                    "/student/supervisors"
            );
        }

        supervisorRequestRepository.save(request);
        return Map.of("success", true);
    }

    // ========== Supervisees ==========

    /** Returns list of supervisee DTOs matching frontend Supervisee type */
    public List<Map<String, Object>> getSuperviseeDtos(Long userId) {
        List<Project> projects = projectRepository.findBySupervisor_UserId(userId);
        return projects.stream().map(this::buildSuperviseeDto).collect(Collectors.toList());
    }

    /** Returns single supervisee detail DTO */
    public Map<String, Object> getSuperviseeDetailDto(Long projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Supervisee not found"));
        return buildSuperviseeDto(project);
    }

    public Map<String, Object> buildSuperviseeDto(Project project) {
        UserAccount student = project.getStudent();
        StudentProfile sp = studentProfileRepository.findById(student.getUserId()).orElse(null);

        // Get proposal status
        String proposalStatus = "NOT_SUBMITTED";
        Proposal proposal = proposalRepository.findByStudent_UserId(student.getUserId()).orElse(null);
        if (proposal != null) {
            proposalStatus = proposal.getStatus().name();
        }

        long totalMeetings = meetingRepository.countByProject_Student_UserId(student.getUserId());
        long pendingLogs = meetingLogRepository.countBySupervisor_UserIdAndStatus(
                project.getSupervisor().getUserId(), MeetingLogStatus.SUBMITTED);
        long totalLogs = meetingLogRepository.findBySupervisor_UserIdOrderByCreatedAtDesc(
                project.getSupervisor().getUserId()).stream()
                .filter(l -> l.getStudent().getUserId().equals(student.getUserId()))
                .count();
        long documentsCount = projectDocumentRepository.countByProject_Student_UserId(student.getUserId());

        Map<String, Object> dto = new LinkedHashMap<>();
        dto.put("superviseeId", project.getProjectId().toString());
        dto.put("userId", student.getUserId().toString());
        dto.put("studentId", student.getMmuId());
        dto.put("fullName", student.getFullName());
        dto.put("email", student.getEmail());
        dto.put("program", sp != null && sp.getProgramme() != null ? sp.getProgramme() : "");
        dto.put("year", sp != null && sp.getIntakeYear() != null ? (LocalDateTime.now().getYear() - sp.getIntakeYear() + 1) : 1);
        dto.put("cgpa", sp != null && sp.getCgpa() != null ? sp.getCgpa().doubleValue() : null);
        dto.put("projectTitle", project.getProjectTitle());
        dto.put("projectStatus", project.getStatus().name());
        dto.put("proposalStatus", proposalStatus);
        dto.put("supervisionStartDate", project.getRegisteredAt() != null ? project.getRegisteredAt().toString() : "");
        dto.put("expectedCompletionDate", "");
        dto.put("lastMeetingDate", null);
        dto.put("nextMeetingDate", null);
        dto.put("totalMeetings", totalMeetings);
        dto.put("pendingLogs", pendingLogs);
        dto.put("totalLogs", totalLogs);
        dto.put("documentsCount", documentsCount);
        dto.put("overallProgress", 0);
        dto.put("riskLevel", "LOW");
        return dto;
    }

    // ========== Proposals ==========

    /** Returns list of proposal DTOs matching frontend ProposalForReview */
    public List<Map<String, Object>> getProposalDtos(Long userId) {
        List<Proposal> proposals = proposalRepository.findBySupervisor_UserId(userId);
        return proposals.stream().map(this::buildProposalForReviewDto).collect(Collectors.toList());
    }

    /** Returns single proposal DTO matching frontend ProposalForReview */
    public Map<String, Object> getProposalForReviewDto(Long proposalId) {
        Proposal proposal = proposalRepository.findById(proposalId)
                .orElseThrow(() -> new ResourceNotFoundException("Proposal not found"));
        return buildProposalForReviewDto(proposal);
    }

    public Map<String, Object> buildProposalForReviewDto(Proposal proposal) {
        UserAccount student = proposal.getStudent();
        List<ProposalVersion> versions = proposalVersionRepository.findByProposal_ProposalIdOrderByVersionNoDesc(proposal.getProposalId());
        List<ProposalReview> reviews = proposalReviewRepository.findByProposal_ProposalIdOrderByReviewedAtDesc(proposal.getProposalId());

        // Get latest version content
        Map<String, Object> contentMap = new LinkedHashMap<>();
        if (!versions.isEmpty()) {
            ProposalVersion latest = versions.get(0);
            contentMap = parseProposalContent(latest.getContentText());
        }

        // Get AI analysis
        Map<String, Object> aiAnalysis = null;
        List<ProposalCheckResult> checks = proposalCheckResultRepository.findByProposal_ProposalIdOrderByCheckedAtDesc(proposal.getProposalId());
        if (!checks.isEmpty()) {
            ProposalCheckResult check = checks.get(0);
            aiAnalysis = new LinkedHashMap<>();
            aiAnalysis.put("overallScore", check.getOverallScore() != null ? check.getOverallScore() : 0);
            aiAnalysis.put("clarityScore", check.getClarityScore() != null ? check.getClarityScore() : 0);
            aiAnalysis.put("feasibilityScore", check.getFeasibilityScore() != null ? check.getFeasibilityScore() : 0);
            aiAnalysis.put("originality", check.getInnovationScore() != null ? check.getInnovationScore() : 0);
            aiAnalysis.put("suggestions", parseJsonArray(check.getSuggestedImprovements()));
            aiAnalysis.put("strengths", parseJsonArray(check.getStrengths()));
            aiAnalysis.put("weaknesses", parseJsonArray(check.getWeaknesses()));
            aiAnalysis.put("analyzedAt", check.getCheckedAt() != null ? check.getCheckedAt().toString() : "");
        }

        // Build version DTOs
        List<Map<String, Object>> versionDtos = versions.stream().map(v -> {
            Map<String, Object> vDto = new LinkedHashMap<>();
            vDto.put("versionId", v.getVersionId());
            vDto.put("version", v.getVersionNo());
            vDto.put("submittedAt", v.getCreatedAt() != null ? v.getCreatedAt().toString() : "");
            vDto.put("status", proposal.getStatus().name());
            return vDto;
        }).collect(Collectors.toList());

        // Build feedback DTOs
        List<Map<String, Object>> feedbackDtos = reviews.stream().map(r -> {
            Map<String, Object> fDto = new LinkedHashMap<>();
            fDto.put("feedbackId", r.getReviewId());
            fDto.put("supervisorId", r.getReviewer().getMmuId());
            fDto.put("supervisorName", r.getReviewer().getFullName());
            fDto.put("content", r.getRemarks() != null ? r.getRemarks() : "");
            fDto.put("feedbackType", mapDecisionToFeedbackType(r.getDecision()));
            fDto.put("createdAt", r.getReviewedAt() != null ? r.getReviewedAt().toString() : "");
            return fDto;
        }).collect(Collectors.toList());

        Map<String, Object> dto = new LinkedHashMap<>();
        dto.put("proposalId", proposal.getProposalId());
        dto.put("studentId", student.getMmuId());
        dto.put("studentName", student.getFullName());
        dto.put("title", proposal.getTitle());
        dto.put("version", proposal.getCurrentVersion());
        dto.put("status", proposal.getStatus().name());
        dto.put("submittedAt", proposal.getCreatedAt() != null ? proposal.getCreatedAt().toString() : "");
        dto.put("lastUpdatedAt", proposal.getUpdatedAt() != null ? proposal.getUpdatedAt().toString() : "");
        dto.put("content", contentMap);
        dto.put("aiAnalysis", aiAnalysis);
        dto.put("previousVersions", versionDtos);
        dto.put("feedbackHistory", feedbackDtos);
        return dto;
    }

    @Transactional
    public Map<String, Object> provideFeedback(Long proposalId, Long userId, Map<String, Object> data) {
        Proposal proposal = proposalRepository.findById(proposalId)
                .orElseThrow(() -> new ResourceNotFoundException("Proposal not found"));

        ProposalReview review = ProposalReview.builder()
                .proposal(proposal)
                .reviewer(userAccountRepository.findById(userId).orElseThrow())
                .reviewerRole("SUPERVISOR")
                .decision((String) data.getOrDefault("feedbackType", "REVISION_REQUIRED"))
                .remarks((String) data.get("content"))
                .build();
        proposalReviewRepository.save(review);

        if ("APPROVED".equals(data.get("feedbackType")) || "APPROVAL".equals(data.get("feedbackType"))) {
            proposal.setStatus(ProposalStatus.APPROVED);
        } else if ("REJECTION".equals(data.get("feedbackType"))) {
            proposal.setStatus(ProposalStatus.REJECTED);
        } else {
            proposal.setStatus(ProposalStatus.REVISION_REQUIRED);
        }
        proposalRepository.save(proposal);

        notificationService.createNotification(
                proposal.getStudent().getUserId(), "PROPOSAL",
                "Proposal Feedback Received",
                "Your supervisor has provided feedback on your proposal.",
                "/student/proposal"
        );

        return Map.of("success", true);
    }

    // ========== Meetings ==========

    /** Returns list of meeting DTOs matching frontend SupervisorMeeting */
    public List<Map<String, Object>> getMeetingDtos(Long userId, String status) {
        List<Meeting> meetings;
        if (status != null && !status.isBlank()) {
            meetings = meetingRepository.findBySupervisorUserIdAndStatus(userId, MeetingStatus.valueOf(status));
        } else {
            meetings = meetingRepository.findBySupervisorUserId(userId);
        }
        return meetings.stream().map(this::buildSupervisorMeetingDto).collect(Collectors.toList());
    }

    public Map<String, Object> buildSupervisorMeetingDto(Meeting meeting) {
        UserAccount student = meeting.getProject() != null ? meeting.getProject().getStudent() : null;

        Map<String, Object> dto = new LinkedHashMap<>();
        dto.put("meetingId", meeting.getMeetingId());
        dto.put("studentId", student != null ? student.getMmuId() : "");
        dto.put("studentName", student != null ? student.getFullName() : "");
        dto.put("title", meeting.getTitle() != null ? meeting.getTitle() : "");
        dto.put("type", meeting.getMeetingType() != null ? meeting.getMeetingType() : "IN_PERSON");
        dto.put("status", meeting.getStatus().name());
        dto.put("requestedBy", "STUDENT"); // default
        dto.put("proposedDateTime", meeting.getProposedStartAt() != null ? meeting.getProposedStartAt().toString() : "");
        dto.put("alternativeDateTimes", parseJsonArray(meeting.getAlternativeDatetimes()));
        dto.put("confirmedDateTime", meeting.getConfirmedStartAt() != null ? meeting.getConfirmedStartAt().toString() : null);
        dto.put("duration", meeting.getDurationMinutes() != null ? meeting.getDurationMinutes() : 60);
        dto.put("location", meeting.getLocation());
        dto.put("meetingUrl", meeting.getMeetingUrl());
        dto.put("onlinePlatform", meeting.getPlatform());
        dto.put("agenda", meeting.getAgenda());
        dto.put("notes", meeting.getNotes());
        dto.put("cancelReason", meeting.getCancelReason());
        dto.put("actionItems", List.of());
        dto.put("createdAt", meeting.getCreatedAt() != null ? meeting.getCreatedAt().toString() : "");
        dto.put("updatedAt", meeting.getUpdatedAt() != null ? meeting.getUpdatedAt().toString() : "");
        return dto;
    }

    // ========== Meeting Logs ==========

    /** Returns list of log DTOs matching frontend SupervisionLogForReview */
    public List<Map<String, Object>> getLogDtos(Long userId, String status) {
        List<MeetingLog> logs;
        if (status != null && !status.isBlank()) {
            logs = meetingLogRepository.findBySupervisor_UserIdAndStatusOrderByCreatedAtDesc(
                    userId, MeetingLogStatus.valueOf(status));
        } else {
            logs = meetingLogRepository.findBySupervisor_UserIdOrderByCreatedAtDesc(userId);
        }
        return logs.stream().map(this::buildLogForReviewDto).collect(Collectors.toList());
    }

    public Map<String, Object> buildLogForReviewDto(MeetingLog log) {
        UserAccount student = log.getStudent();

        Map<String, Object> dto = new LinkedHashMap<>();
        dto.put("logId", log.getLogId());
        dto.put("studentId", student != null ? student.getMmuId() : "");
        dto.put("studentName", student != null ? student.getFullName() : "");
        dto.put("weekNumber", log.getMeetingNumber() != null ? log.getMeetingNumber() : 0);
        dto.put("weekStartDate", log.getMeetingDate() != null ? log.getMeetingDate().toString() : "");
        dto.put("weekEndDate", log.getNextMeetingDate() != null ? log.getNextMeetingDate().toString() : "");
        dto.put("status", log.getStatus().name());
        dto.put("activities", log.getWorkDoneDetails() != null ? log.getWorkDoneDetails() : "");
        dto.put("progressSummary", log.getDiscussionSummary() != null ? log.getDiscussionSummary() : "");
        dto.put("challenges", log.getProblemsAndSolutions());
        dto.put("nextWeekPlan", log.getWorkToBeDone() != null ? log.getWorkToBeDone() : "");
        dto.put("hoursSpent", 0);
        dto.put("submittedAt", log.getSubmittedAt() != null ? log.getSubmittedAt().toString() : "");
        dto.put("supervisorComment", log.getSupervisorComments());
        dto.put("supervisorSignedAt", null);

        // Check signatures
        List<MeetingLogSignature> signatures = meetingLogSignatureRepository.findByMeetingLog_LogId(log.getLogId());
        for (MeetingLogSignature sig : signatures) {
            if ("SUPERVISOR".equals(sig.getSignerRole())) {
                dto.put("supervisorSignedAt", sig.getSignedAt() != null ? sig.getSignedAt().toString() : null);
            }
        }

        dto.put("lockedAt", log.getLockedAt() != null ? log.getLockedAt().toString() : null);
        return dto;
    }

    // ========== Documents ==========

    /** Returns list of document DTOs matching frontend SuperviseeDocument */
    public List<Map<String, Object>> getDocumentDtos(Long userId, Long studentId, String type) {
        List<ProjectDocument> docs;
        if (studentId != null) {
            if (type != null && !type.isBlank()) {
                docs = projectDocumentRepository.findByProject_Student_UserIdAndDocTypeOrderByUploadedAtDesc(studentId, type);
            } else {
                docs = projectDocumentRepository.findByProject_Student_UserIdOrderByUploadedAtDesc(studentId);
            }
        } else {
            docs = projectDocumentRepository.findByProject_Supervisor_UserIdOrderByUploadedAtDesc(userId);
        }
        return docs.stream().map(this::buildDocumentDto).collect(Collectors.toList());
    }

    public Map<String, Object> buildDocumentDto(ProjectDocument doc) {
        UserAccount student = (doc.getProject() != null && doc.getProject().getStudent() != null)
                ? doc.getProject().getStudent()
                : doc.getUploadedBy();

        Map<String, Object> dto = new LinkedHashMap<>();
        dto.put("documentId", doc.getDocumentId());
        dto.put("studentId", student != null && student.getMmuId() != null ? student.getMmuId() : "");
        dto.put("studentName", student != null && student.getFullName() != null ? student.getFullName() : "");
        dto.put("title", doc.getTitle() != null && !doc.getTitle().isBlank() ? doc.getTitle() : doc.getFileName());
        String type = doc.getDocType() != null && !doc.getDocType().isBlank() ? doc.getDocType() : "OTHER";
        dto.put("type", type);
        dto.put("phase", doc.getPhase() != null && !doc.getPhase().isBlank() ? doc.getPhase() : "FYP1");
        dto.put("version", doc.getVersionNo() != null ? doc.getVersionNo() : 1);
        dto.put("fileName", doc.getFileName());
        dto.put("fileType", doc.getMimeType() != null ? doc.getMimeType() : "");
        dto.put("mimeType", doc.getMimeType());
        dto.put("fileSize", doc.getFileSize() != null ? doc.getFileSize() : 0);
        dto.put("storagePath", doc.getStoragePath());
        dto.put("downloadUrl", "/supervisor/documents/" + doc.getDocumentId() + "/download");
        dto.put("description", doc.getDescription());
        dto.put("uploadedAt", doc.getUploadedAt() != null ? doc.getUploadedAt().toString() : "");
        dto.put("lastViewedAt", null);
        dto.put("hasFeedback", false);
        dto.put("feedbackCount", 0);
        return dto;
    }

    /** Returns single document detail DTO */
    public Map<String, Object> getDocumentDetailDto(Long documentId) {
        ProjectDocument doc = projectDocumentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found"));
        return buildDocumentDto(doc);
    }

    // ========== Announcements ==========

    /** Returns list of announcement DTOs matching frontend SupervisorAnnouncement */
    public List<Map<String, Object>> getAnnouncementDtos(Long userId) {
        var announcements = announcementRepository.findByCreatedBy_UserIdOrderByCreatedAtDesc(userId, org.springframework.data.domain.Pageable.unpaged());
        return announcements.getContent().stream().map(this::buildAnnouncementDto).collect(Collectors.toList());
    }

    public Map<String, Object> buildAnnouncementDto(Announcement ann) {
        Map<String, Object> dto = new LinkedHashMap<>();
        dto.put("announcementId", ann.getAnnouncementId());
        dto.put("supervisorId", ann.getCreatedBy() != null ? ann.getCreatedBy().getMmuId() : "");
        dto.put("title", ann.getTitle());
        dto.put("content", ann.getContent());
        dto.put("visibility", ann.getScope() != null ? ann.getScope() : "ALL_SUPERVISEES");
        dto.put("priority", ann.getPriority() != null ? ann.getPriority() : "NORMAL");
        dto.put("publishAt", ann.getPublishAt() != null ? ann.getPublishAt().toString() : "");
        dto.put("expiresAt", ann.getExpiresAt() != null ? ann.getExpiresAt().toString() : null);
        dto.put("isActive", ann.getStatus() == AnnouncementStatus.PUBLISHED);
        dto.put("viewCount", ann.getViewCount());
        dto.put("createdAt", ann.getCreatedAt() != null ? ann.getCreatedAt().toString() : "");
        dto.put("updatedAt", ann.getUpdatedAt() != null ? ann.getUpdatedAt().toString() : "");
        return dto;
    }

    // ========== Helpers ==========

    private String mapDecisionToFeedbackType(String decision) {
        if (decision == null) return "COMMENT";
        return switch (decision.toUpperCase()) {
            case "APPROVED", "APPROVAL" -> "APPROVAL";
            case "REJECTED", "REJECTION" -> "REJECTION";
            case "REVISION_REQUIRED" -> "REVISION_REQUEST";
            default -> "COMMENT";
        };
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> parseProposalContent(String contentText) {
        if (contentText == null || contentText.isBlank()) {
            return Map.of(
                    "background", "", "problemStatement", "", "objectives", List.of(),
                    "scope", "", "methodology", "", "expectedOutcomes", "", "timeline", ""
            );
        }
        try {
            return objectMapper.readValue(contentText, Map.class);
        } catch (Exception e) {
            return Map.of(
                    "background", contentText, "problemStatement", "", "objectives", List.of(),
                    "scope", "", "methodology", "", "expectedOutcomes", "", "timeline", ""
            );
        }
    }

    @SuppressWarnings("unchecked")
    private List<String> parseJsonArray(String json) {
        if (json == null || json.isBlank()) return List.of();
        try {
            return objectMapper.readValue(json, List.class);
        } catch (Exception e) {
            return List.of();
        }
    }

    private String toJson(Object obj) {
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (Exception e) {
            return "[]";
        }
    }
}
