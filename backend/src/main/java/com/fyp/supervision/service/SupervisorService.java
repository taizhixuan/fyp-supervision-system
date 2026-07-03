package com.fyp.supervision.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fyp.supervision.entity.*;
import com.fyp.supervision.enums.*;
import com.fyp.supervision.exception.BadRequestException;
import com.fyp.supervision.exception.ForbiddenException;
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
    private final DocumentFeedbackRepository documentFeedbackRepository;
    private final NotificationService notificationService;
    private final FileStorageService fileStorageService;
    private final ProjectProgressService projectProgressService;
    private final SystemParameterService systemParameters;

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
        if (updates.get("maxSupervisionQuota") instanceof Number quota) profile.setSupervisionQuota(quota.intValue());
        if (updates.get("isAcceptingStudents") instanceof Boolean accepting) {
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
        dto.put("pastProjects", recentSupervisedProjects(profile.getUserId()));
        return dto;
    }

    /**
     * Up to 6 most-recent projects this supervisor has supervised, sorted by
     * updatedAt descending. Same shape as the student-facing supervisor detail
     * page so the supervisor sees what students see — and matches the AI
     * recommender's signal source.
     */
    private List<Map<String, Object>> recentSupervisedProjects(Long supervisorUserId) {
        if (supervisorUserId == null) return List.of();
        List<Project> projects = projectRepository.findBySupervisor_UserId(supervisorUserId);
        return projects.stream()
                .filter(p -> p != null && p.getProjectTitle() != null && !p.getProjectTitle().isBlank())
                .sorted(Comparator.comparing(
                        Project::getUpdatedAt,
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .limit(6)
                .map(p -> {
                    Map<String, Object> entry = new LinkedHashMap<>();
                    entry.put("title", p.getProjectTitle().trim());
                    entry.put("status", p.getStatus() != null ? p.getStatus().name() : null);
                    entry.put("year", p.getUpdatedAt() != null ? p.getUpdatedAt().getYear() : null);
                    return entry;
                })
                .toList();
    }

    // ========== Dashboard ==========

    /** Returns DTO matching frontend SupervisorDashboardStats */
    public Map<String, Object> getDashboard(Long userId) {
        List<Project> projects = projectRepository.findBySupervisor_UserId(userId);
        long pendingRequests = supervisorRequestRepository.countBySupervisorUser_UserIdAndStatus(userId, RequestStatus.PENDING);

        long proposalsToReview = 0;
        for (Proposal p : proposalRepository.findBySupervisor_UserId(userId)) {
            // Only SUBMITTED proposals await the supervisor. UNDER_REVIEW means the
            // supervisor already approved and it now sits with the committee.
            if (p.getStatus() == ProposalStatus.SUBMITTED) {
                proposalsToReview++;
            }
        }

        long upcomingMeetings = meetingRepository.countBySupervisorUserIdAndStatusIn(userId,
                List.of(MeetingStatus.PROPOSED, MeetingStatus.CONFIRMED));
        long pendingLogReviews = meetingLogRepository.countBySupervisor_UserIdAndStatus(userId, MeetingLogStatus.SUBMITTED);

        // Active projects = ones in PLANNING/ACTIVE cycles (the supervisor's current workload).
        List<Project> activeProjects = projects.stream()
                .filter(p -> p.getCycle() == null || p.getCycle().getStatus() == null
                        || p.getCycle().getStatus() == CycleStatus.ACTIVE
                        || p.getCycle().getStatus() == CycleStatus.PLANNING)
                .collect(Collectors.toList());

        long documentsToReview = activeProjects.stream()
                .mapToLong(p -> projectDocumentRepository.countByProject_Student_UserIdAndIsLatestTrue(p.getStudent().getUserId()))
                .sum();

        // Active announcements = ones authored by this supervisor and still PUBLISHED.
        long activeAnnouncements = announcementRepository
                .findByCreatedBy_UserIdOrderByCreatedAtDesc(userId, org.springframework.data.domain.Pageable.unpaged())
                .getContent().stream()
                .filter(a -> a.getStatus() == AnnouncementStatus.PUBLISHED)
                .count();

        // Supervisees by status (project-level)
        long notStarted = activeProjects.stream().filter(p -> p.getStatus() == ProjectStatus.ACTIVE && p.getRegisteredAt() != null && p.getRegisteredAt().isAfter(LocalDateTime.now().minusDays(7))).count();
        long inProgress = activeProjects.stream().filter(p -> p.getStatus() == ProjectStatus.ACTIVE).count();
        long completed = projects.stream().filter(p -> p.getStatus() == ProjectStatus.COMPLETED).count();
        long onHold = projects.stream().filter(p -> p.getStatus() == ProjectStatus.SUSPENDED).count();

        // Supervisees by risk (computed across active projects)
        long lowRisk = 0, medRisk = 0, highRisk = 0;
        for (Project p : activeProjects) {
            String level = projectProgressService.riskFor(p).level();
            if ("HIGH".equals(level)) highRisk++;
            else if ("MEDIUM".equals(level)) medRisk++;
            else lowRisk++;
        }

        Map<String, Object> dashboard = new LinkedHashMap<>();
        dashboard.put("totalSupervisees", activeProjects.size());
        dashboard.put("pendingRequests", pendingRequests);
        dashboard.put("upcomingMeetings", upcomingMeetings);
        dashboard.put("pendingLogReviews", pendingLogReviews);
        dashboard.put("proposalsToReview", proposalsToReview);
        dashboard.put("documentsToReview", documentsToReview);
        dashboard.put("activeAnnouncements", activeAnnouncements);
        dashboard.put("superviseesByStatus", Map.of(
                "notStarted", notStarted,
                "inProgress", inProgress,
                "completed", completed,
                "onHold", onHold
        ));
        dashboard.put("superviseesByRisk", Map.of(
                "low", lowRisk, "medium", medRisk, "high", highRisk, "critical", 0
        ));
        dashboard.put("recentActivity", buildRecentActivity(userId, activeProjects));
        return dashboard;
    }

    /** Last 10 activity items across all the supervisor's active supervisees. */
    private List<Map<String, Object>> buildRecentActivity(Long supervisorUserId, List<Project> activeProjects) {
        List<Map<String, Object>> items = new java.util.ArrayList<>();
        long idCounter = 1;

        for (Project p : activeProjects) {
            UserAccount student = p.getStudent();
            String studentName = student != null ? student.getFullName() : "Unknown";

            // Latest meeting (proposed or completed)
            List<Meeting> recentMeetings = meetingRepository
                    .findTop5ByProject_ProjectIdOrderByConfirmedStartAtDesc(p.getProjectId());
            for (Meeting m : recentMeetings) {
                LocalDateTime ts = m.getUpdatedAt() != null ? m.getUpdatedAt() : m.getCreatedAt();
                if (ts == null) continue;
                Map<String, Object> item = new LinkedHashMap<>();
                item.put("activityId", idCounter++);
                item.put("type", "MEETING");
                item.put("title", m.getTitle() != null ? m.getTitle() : "Meeting");
                item.put("description", studentName + " — " + m.getStatus().name().toLowerCase().replace('_', ' '));
                item.put("timestamp", ts.toString());
                item.put("actor", studentName);
                items.add(item);
            }

            // Latest meeting log
            List<MeetingLog> recentLogs = meetingLogRepository
                    .findBySupervisor_UserIdOrderByCreatedAtDesc(supervisorUserId).stream()
                    .filter(l -> l.getStudent() != null && student != null
                            && student.getUserId().equals(l.getStudent().getUserId()))
                    .limit(3)
                    .collect(Collectors.toList());
            for (MeetingLog l : recentLogs) {
                LocalDateTime ts = l.getSubmittedAt() != null ? l.getSubmittedAt() : l.getCreatedAt();
                if (ts == null) continue;
                Map<String, Object> item = new LinkedHashMap<>();
                item.put("activityId", idCounter++);
                item.put("type", "LOG");
                item.put("title", "Meeting Log #" + (l.getMeetingNumber() != null ? l.getMeetingNumber() : ""));
                item.put("description", studentName + " — " + l.getStatus().name().toLowerCase().replace('_', ' '));
                item.put("timestamp", ts.toString());
                item.put("actor", studentName);
                items.add(item);
            }
        }

        // Newest first, cap at 10
        items.sort((a, b) -> ((String) b.get("timestamp")).compareTo((String) a.get("timestamp")));
        if (items.size() > 10) {
            return new java.util.ArrayList<>(items.subList(0, 10));
        }
        return items;
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

            FypCycle activeCycle = fypCycleRepository
                    .findFirstByCycleTypeAndStatusOrderByStartDateDesc("FYP1", CycleStatus.ACTIVE)
                    .orElseGet(() -> fypCycleRepository
                            .findFirstByStatusOrderByStartDateDesc(CycleStatus.ACTIVE)
                            .orElse(null));
            String title = request.getProposedTitle() != null ? request.getProposedTitle() : "Untitled Project";

            // Reuse the placeholder Project that was created when the student joined the cycle.
            Project project = projectRepository.findByStudent_UserId(request.getStudent().getUserId())
                    .orElseGet(() -> Project.builder()
                            .cycle(activeCycle)
                            .student(request.getStudent())
                            .stage("FYP1")
                            .status(ProjectStatus.ACTIVE)
                            .registeredAt(LocalDateTime.now())
                            .build());
            if (project.getCycle() == null) project.setCycle(activeCycle);
            // The student is already paired with another supervisor — block the second
            // accept instead of silently reassigning them and leaking the first
            // supervisor's load count.
            if (project.getSupervisor() != null
                    && !project.getSupervisor().getUserId().equals(userId)) {
                throw new BadRequestException("This student already has an assigned supervisor.");
            }
            boolean alreadyMine = project.getSupervisor() != null
                    && project.getSupervisor().getUserId().equals(userId);
            // Enforce supervision capacity when taking on a NEW student: the supervisor's
            // own quota, capped by the system-wide max_students_per_supervisor parameter.
            if (!alreadyMine) {
                SupervisorProfile svProfile = supervisorProfileRepository.findById(userId).orElse(null);
                if (svProfile != null) {
                    int quota = svProfile.getSupervisionQuota() != null
                            ? svProfile.getSupervisionQuota() : Integer.MAX_VALUE;
                    int cap = Math.min(quota, systemParameters.getInt("max_students_per_supervisor", quota));
                    int load = svProfile.getCurrentLoad() != null ? svProfile.getCurrentLoad() : 0;
                    if (load >= cap) {
                        throw new BadRequestException(
                                "You have reached your maximum supervision capacity (" + cap + " students).");
                    }
                }
            }
            project.setSupervisor(request.getSupervisorUser());
            project.setProjectTitle(title);
            if (project.getStage() == null) project.setStage("FYP1");
            if (project.getStatus() == null) project.setStatus(ProjectStatus.ACTIVE);
            if (project.getRegisteredAt() == null) project.setRegisteredAt(LocalDateTime.now());
            projectRepository.save(project);

            // Atomic increment avoids a lost update if the supervisor accepts two
            // requests concurrently. Only count a newly-paired student.
            if (!alreadyMine) {
                supervisorProfileRepository.incrementCurrentLoad(userId);
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

    /**
     * Active supervisees only — students whose enrolled cycle is still PLANNING/ACTIVE.
     * Past supervisees (cycle COMPLETED/ARCHIVED) are excluded from the default view to
     * keep "current workload" honest. Use {@link #getPastSuperviseeDtos} for history.
     */
    public List<Map<String, Object>> getSuperviseeDtos(Long userId) {
        return projectRepository.findBySupervisor_UserId(userId).stream()
                .filter(p -> {
                    if (p.getCycle() == null || p.getCycle().getStatus() == null) return true;
                    return p.getCycle().getStatus() == com.fyp.supervision.enums.CycleStatus.ACTIVE
                            || p.getCycle().getStatus() == com.fyp.supervision.enums.CycleStatus.PLANNING;
                })
                .map(this::buildSuperviseeDto)
                .collect(Collectors.toList());
    }

    /** Past supervisees (cycle COMPLETED or ARCHIVED) — surfaced in a separate tab. */
    public List<Map<String, Object>> getPastSuperviseeDtos(Long userId) {
        return projectRepository.findBySupervisor_UserId(userId).stream()
                .filter(p -> p.getCycle() != null && p.getCycle().getStatus() != null
                        && (p.getCycle().getStatus() == com.fyp.supervision.enums.CycleStatus.COMPLETED
                                || p.getCycle().getStatus() == com.fyp.supervision.enums.CycleStatus.ARCHIVED))
                .map(this::buildSuperviseeDto)
                .collect(Collectors.toList());
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
        Long supervisorUserId = project.getSupervisor() != null ? project.getSupervisor().getUserId() : null;
        long pendingLogs = supervisorUserId != null
                ? meetingLogRepository.countBySupervisor_UserIdAndStudent_UserIdAndStatus(
                        supervisorUserId, student.getUserId(), MeetingLogStatus.SUBMITTED)
                : 0;
        long totalLogs = supervisorUserId != null
                ? meetingLogRepository.countBySupervisor_UserIdAndStudent_UserId(
                        supervisorUserId, student.getUserId())
                : 0;
        long documentsCount = projectDocumentRepository.countByProject_Student_UserIdAndIsLatestTrue(student.getUserId());

        // Last completed meeting for this project
        String lastMeetingDate = meetingRepository
                .findMaxConfirmedStartAtByProjectAndStatus(project.getProjectId(), MeetingStatus.COMPLETED)
                .map(LocalDateTime::toString)
                .orElse(null);
        // Next confirmed/proposed meeting in the future
        List<Meeting> upcoming = meetingRepository.findUpcomingByProjectAndStatusIn(
                project.getProjectId(),
                List.of(MeetingStatus.PROPOSED, MeetingStatus.CONFIRMED),
                LocalDateTime.now());
        String nextMeetingDate = upcoming.isEmpty() ? null
                : (upcoming.get(0).getConfirmedStartAt() != null
                        ? upcoming.get(0).getConfirmedStartAt().toString()
                        : (upcoming.get(0).getProposedStartAt() != null
                                ? upcoming.get(0).getProposedStartAt().toString() : null));
        String expectedCompletion = project.getCycle() != null && project.getCycle().getEndDate() != null
                ? project.getCycle().getEndDate().toString() : "";

        ProjectProgressService.ProjectRisk risk = projectProgressService.riskFor(project);
        int progress = projectProgressService.progressFor(project);

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
        dto.put("expectedCompletionDate", expectedCompletion);
        dto.put("lastMeetingDate", lastMeetingDate);
        dto.put("nextMeetingDate", nextMeetingDate);
        dto.put("totalMeetings", totalMeetings);
        dto.put("pendingLogs", pendingLogs);
        dto.put("totalLogs", totalLogs);
        dto.put("documentsCount", documentsCount);
        dto.put("overallProgress", progress);
        dto.put("riskLevel", risk.level());
        dto.put("riskFactors", risk.factors());
        // Cycle status surfaces "past student" badges on the supervisor side.
        if (project.getCycle() != null && project.getCycle().getStatus() != null) {
            dto.put("cycleStatus", project.getCycle().getStatus().name());
            dto.put("cycleType", project.getCycle().getCycleType());
            dto.put("cycleAcademicYear", project.getCycle().getAcademicYear());
        } else {
            dto.put("cycleStatus", null);
            dto.put("cycleType", null);
            dto.put("cycleAcademicYear", null);
        }
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

        // Get latest version content + supporting attachment
        Map<String, Object> contentMap = new LinkedHashMap<>();
        String fileUrl = null;
        String fileName = null;
        if (!versions.isEmpty()) {
            ProposalVersion latest = versions.get(0);
            contentMap = parseProposalContent(latest.getContentText());
            fileName = latest.getFileName();
            String vp = latest.getUploadFilePath();
            if (vp != null && !vp.isBlank()) {
                String trimmed = vp.startsWith("/") ? vp.substring(1) : vp;
                fileUrl = trimmed.startsWith("uploads/") ? "/" + trimmed : "/uploads/" + trimmed;
            }
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
            // Per-version content so the supervisor can open the details of any prior version.
            vDto.put("content", parseProposalContent(v.getContentText()));
            String vp = v.getUploadFilePath();
            if (vp != null && !vp.isBlank()) {
                String trimmed = vp.startsWith("/") ? vp.substring(1) : vp;
                vDto.put("fileUrl", trimmed.startsWith("uploads/") ? "/" + trimmed : "/uploads/" + trimmed);
            } else {
                vDto.put("fileUrl", null);
            }
            vDto.put("fileName", v.getFileName());
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
        dto.put("fileUrl", fileUrl);
        dto.put("fileName", fileName);
        dto.put("aiAnalysis", aiAnalysis);
        dto.put("previousVersions", versionDtos);
        dto.put("feedbackHistory", feedbackDtos);
        return dto;
    }

    @Transactional
    public Map<String, Object> provideFeedback(Long proposalId, Long userId, Map<String, Object> data) {
        Proposal proposal = proposalRepository.findById(proposalId)
                .orElseThrow(() -> new ResourceNotFoundException("Proposal not found"));

        // Defense in depth: only the owning supervisor may review this proposal.
        Long owner = proposal.getSupervisor() != null ? proposal.getSupervisor().getUserId() : null;
        if (owner == null && proposal.getProject() != null && proposal.getProject().getSupervisor() != null) {
            owner = proposal.getProject().getSupervisor().getUserId();
        }
        if (owner == null || !owner.equals(userId)) {
            throw new ForbiddenException("You can only review your own students' proposals.");
        }

        // The supervisor is the FIRST reviewer in the two-stage flow. They may only act
        // while the proposal is awaiting supervisor review (SUBMITTED). Once approved it
        // moves to the committee queue (UNDER_REVIEW) and is out of the supervisor's hands.
        if (proposal.getStatus() != ProposalStatus.SUBMITTED) {
            throw new BadRequestException("This proposal is not awaiting your review.");
        }

        String feedbackType = (String) data.getOrDefault("feedbackType", "REVISION_REQUIRED");
        ProposalReview review = ProposalReview.builder()
                .proposal(proposal)
                .reviewer(userAccountRepository.findById(userId).orElseThrow())
                .reviewerRole("SUPERVISOR")
                .decision(feedbackType)
                .remarks((String) data.get("content"))
                .build();
        proposalReviewRepository.save(review);

        if ("APPROVED".equals(feedbackType) || "APPROVAL".equals(feedbackType)) {
            // Supervisor approval does NOT finalise the proposal — it forwards it to the
            // FYP committee. The student is only REGISTERED after committee approval.
            proposal.setStatus(ProposalStatus.UNDER_REVIEW);
            proposalRepository.save(proposal);
            notificationService.createNotification(
                    proposal.getStudent().getUserId(), "PROPOSAL",
                    "Proposal Approved by Supervisor",
                    "Your supervisor approved your proposal. It has been forwarded to the FYP committee for final review.",
                    "/student/proposal"
            );
            notifyCommitteeOfProposal(proposal);
        } else if ("REJECTION".equals(feedbackType)) {
            proposal.setStatus(ProposalStatus.REJECTED);
            proposalRepository.save(proposal);
            notificationService.createNotification(
                    proposal.getStudent().getUserId(), "PROPOSAL",
                    "Proposal Rejected",
                    "Your supervisor has rejected your proposal. See the feedback for details.",
                    "/student/proposal"
            );
        } else {
            proposal.setStatus(ProposalStatus.REVISION_REQUIRED);
            proposalRepository.save(proposal);
            notificationService.createNotification(
                    proposal.getStudent().getUserId(), "PROPOSAL",
                    "Proposal Revision Requested",
                    "Your supervisor has requested revisions to your proposal.",
                    "/student/proposal"
            );
        }

        return Map.of("success", true);
    }

    /** Notify every active committee member that a supervisor-approved proposal awaits committee review. */
    private void notifyCommitteeOfProposal(Proposal proposal) {
        String studentName = proposal.getStudent() != null && proposal.getStudent().getFullName() != null
                ? proposal.getStudent().getFullName() : "A student";
        List<UserAccount> committee = userAccountRepository.findByRoleAndStatus(UserRole.FYP_COMMITTEE, UserStatus.ACTIVE);
        for (UserAccount member : committee) {
            notificationService.createNotification(
                    member.getUserId(), "PROPOSAL",
                    "New Proposal for Committee Review",
                    studentName + "'s proposal has been approved by the supervisor and is awaiting committee review.",
                    "/committee/proposals"
            );
        }
    }

    /**
     * Resolve a proposal version's attachment for download by the owning supervisor.
     * {@code versionId} null → latest version.
     */
    public ProposalVersion resolveAttachmentVersion(Long proposalId, Long userId, Long versionId) {
        Proposal proposal = proposalRepository.findById(proposalId)
                .orElseThrow(() -> new ResourceNotFoundException("Proposal not found"));
        Long owner = proposal.getSupervisor() != null ? proposal.getSupervisor().getUserId() : null;
        if (owner == null && proposal.getProject() != null && proposal.getProject().getSupervisor() != null) {
            owner = proposal.getProject().getSupervisor().getUserId();
        }
        if (owner == null || !owner.equals(userId)) {
            throw new ForbiddenException("You can only access your own students' proposals.");
        }
        List<ProposalVersion> versions = proposalVersionRepository
                .findByProposal_ProposalIdOrderByVersionNoDesc(proposalId);
        ProposalVersion v = (versionId != null)
                ? versions.stream().filter(x -> x.getVersionId().equals(versionId)).findFirst()
                        .orElseThrow(() -> new ResourceNotFoundException("Version not found"))
                : versions.stream().findFirst()
                        .orElseThrow(() -> new ResourceNotFoundException("No proposal version found"));
        if (v.getUploadFilePath() == null || v.getUploadFilePath().isBlank()) {
            throw new ResourceNotFoundException("No attachment on this proposal version");
        }
        return v;
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

    @Transactional
    public Map<String, Object> createMeeting(Long supervisorUserId, Map<String, Object> data) {
        String projectIdStr = data.get("studentId") != null ? data.get("studentId").toString() : null;
        if (projectIdStr == null || projectIdStr.isBlank()) {
            throw new BadRequestException("Student selection is required.");
        }
        Long projectId;
        try {
            projectId = Long.parseLong(projectIdStr);
        } catch (NumberFormatException e) {
            throw new BadRequestException("Invalid student selection.");
        }
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));
        if (project.getSupervisor() == null
                || !supervisorUserId.equals(project.getSupervisor().getUserId())) {
            throw new BadRequestException("You can only schedule meetings with your own supervisees.");
        }

        String title = (String) data.get("title");
        if (title == null || title.isBlank()) {
            throw new BadRequestException("Meeting title is required.");
        }
        String proposed = (String) data.get("proposedDateTime");
        if (proposed == null || proposed.isBlank()) {
            throw new BadRequestException("Proposed date and time is required.");
        }
        LocalDateTime proposedStart;
        try {
            // Accept both `2026-05-30T14:00` and `2026-05-30T14:00:00.000Z` shapes.
            if (proposed.endsWith("Z")) {
                proposedStart = java.time.OffsetDateTime.parse(proposed).toLocalDateTime();
            } else {
                proposedStart = LocalDateTime.parse(proposed);
            }
        } catch (Exception e) {
            throw new BadRequestException("Invalid date/time format.");
        }
        int duration = data.get("duration") instanceof Number
                ? ((Number) data.get("duration")).intValue() : 60;
        if (duration < 15) duration = 15;
        if (duration > 480) duration = 480;

        UserAccount supervisor = userAccountRepository.findById(supervisorUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Supervisor not found"));

        Meeting meeting = Meeting.builder()
                .project(project)
                .requestedBy(supervisor)
                .title(title.trim())
                .meetingType((String) data.getOrDefault("type", "IN_PERSON"))
                .proposedStartAt(proposedStart)
                .proposedEndAt(proposedStart.plusMinutes(duration))
                .durationMinutes(duration)
                .location((String) data.get("location"))
                .meetingUrl((String) data.get("meetingUrl"))
                .platform((String) data.get("onlinePlatform"))
                .agenda((String) data.get("agenda"))
                .status(MeetingStatus.PROPOSED)
                .build();
        Meeting saved = meetingRepository.save(meeting);

        if (project.getStudent() != null) {
            notificationService.createNotification(
                    project.getStudent().getUserId(),
                    "MEETING",
                    "New meeting proposed by supervisor",
                    "Your supervisor has proposed \"" + saved.getTitle() + "\" on "
                            + proposedStart.toString().replace("T", " ") + ".",
                    "/student/meetings/" + saved.getMeetingId()
            );
        }

        return buildSupervisorMeetingDto(saved);
    }

    public Map<String, Object> buildSupervisorMeetingDto(Meeting meeting) {
        UserAccount student = meeting.getProject() != null ? meeting.getProject().getStudent() : null;
        String requestedByRole = "STUDENT";
        if (meeting.getRequestedBy() != null && meeting.getProject() != null
                && meeting.getProject().getSupervisor() != null
                && meeting.getRequestedBy().getUserId().equals(meeting.getProject().getSupervisor().getUserId())) {
            requestedByRole = "SUPERVISOR";
        }

        Map<String, Object> dto = new LinkedHashMap<>();
        dto.put("meetingId", meeting.getMeetingId());
        dto.put("studentId", student != null ? student.getMmuId() : "");
        dto.put("studentName", student != null ? student.getFullName() : "");
        dto.put("studentEmail", student != null ? student.getEmail() : "");
        dto.put("title", meeting.getTitle() != null ? meeting.getTitle() : "");
        dto.put("type", meeting.getMeetingType() != null ? meeting.getMeetingType() : "IN_PERSON");
        dto.put("status", meeting.getStatus().name());
        dto.put("requestedBy", requestedByRole);
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
                docs = projectDocumentRepository.findByProject_Student_UserIdAndDocTypeAndIsLatestTrueOrderByUploadedAtDesc(studentId, type);
            } else {
                docs = projectDocumentRepository.findByProject_Student_UserIdAndIsLatestTrueOrderByUploadedAtDesc(studentId);
            }
        } else {
            docs = projectDocumentRepository.findByProject_Supervisor_UserIdAndIsLatestTrueOrderByUploadedAtDesc(userId);
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
        List<DocumentFeedback> feedback = documentFeedbackRepository
                .findByDocument_DocumentIdOrderByCreatedAtDesc(doc.getDocumentId());
        dto.put("hasFeedback", !feedback.isEmpty());
        dto.put("feedbackCount", feedback.size());
        dto.put("feedback", feedback.stream().map(this::buildDocumentFeedbackDto).collect(Collectors.toList()));
        return dto;
    }

    private Map<String, Object> buildDocumentFeedbackDto(DocumentFeedback fb) {
        Map<String, Object> dto = new LinkedHashMap<>();
        dto.put("feedbackId", fb.getFeedbackId());
        dto.put("content", fb.getContent());
        dto.put("supervisorName", fb.getSupervisor() != null ? fb.getSupervisor().getFullName() : "");
        dto.put("createdAt", fb.getCreatedAt() != null ? fb.getCreatedAt().toString() : "");
        dto.put("annotatedFileName", fb.getAnnotatedFileName());
        dto.put("annotatedFileSize", fb.getAnnotatedFileSize());
        dto.put("annotatedFilePath", fb.getAnnotatedFilePath());
        dto.put("annotatedFileUrl", fb.getAnnotatedFilePath() != null
                ? "/supervisor/documents/feedback/" + fb.getFeedbackId() + "/download" : null);
        return dto;
    }

    /** Returns single document detail DTO */
    public Map<String, Object> getDocumentDetailDto(Long documentId) {
        ProjectDocument doc = projectDocumentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found"));
        return buildDocumentDto(doc);
    }

    /** Persist supervisor feedback on a supervisee's document. */
    @Transactional
    public Map<String, Object> submitDocumentFeedback(
            Long supervisorUserId,
            Long documentId,
            String content,
            org.springframework.web.multipart.MultipartFile annotatedFile) {
        boolean hasFile = annotatedFile != null && !annotatedFile.isEmpty();
        if ((content == null || content.isBlank()) && !hasFile) {
            throw new BadRequestException("Add a comment or attach an annotated file.");
        }
        ProjectDocument doc = projectDocumentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found"));
        if (doc.getProject() == null || doc.getProject().getSupervisor() == null
                || !supervisorUserId.equals(doc.getProject().getSupervisor().getUserId())) {
            throw new BadRequestException("You can only review documents from your supervisees.");
        }

        UserAccount supervisor = userAccountRepository.findById(supervisorUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Supervisor not found"));

        DocumentFeedback.DocumentFeedbackBuilder builder = DocumentFeedback.builder()
                .document(doc)
                .supervisor(supervisor)
                .content(content == null ? "" : content.trim());

        if (hasFile) {
            String path = fileStorageService.storeFile(annotatedFile, "document-feedback", supervisorUserId);
            builder.annotatedFilePath(path)
                    .annotatedFileName(annotatedFile.getOriginalFilename())
                    .annotatedFileSize(annotatedFile.getSize());
        }

        DocumentFeedback saved = documentFeedbackRepository.save(builder.build());

        if (doc.getProject() != null && doc.getProject().getStudent() != null) {
            notificationService.createNotification(
                    doc.getProject().getStudent().getUserId(),
                    "DOCUMENT",
                    "Document feedback received",
                    "Your supervisor has provided feedback on \"" +
                            (doc.getTitle() != null && !doc.getTitle().isBlank() ? doc.getTitle() : doc.getFileName()) + "\".",
                    "/student/documents/" + doc.getDocumentId()
            );
        }

        return buildDocumentFeedbackDto(saved);
    }

    public DocumentFeedback getOwnedFeedback(Long supervisorUserId, Long feedbackId) {
        DocumentFeedback fb = documentFeedbackRepository.findById(feedbackId)
                .orElseThrow(() -> new ResourceNotFoundException("Feedback not found"));
        if (fb.getDocument() == null || fb.getDocument().getProject() == null
                || fb.getDocument().getProject().getSupervisor() == null
                || !supervisorUserId.equals(fb.getDocument().getProject().getSupervisor().getUserId())) {
            throw new BadRequestException("You can only access feedback on your supervisees' documents.");
        }
        return fb;
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
