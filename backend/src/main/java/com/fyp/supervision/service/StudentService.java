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
    private final MeetingRepository meetingRepository;
    private final MeetingLogRepository meetingLogRepository;
    private final ProjectDocumentRepository projectDocumentRepository;
    private final DeadlineRepository deadlineRepository;
    private final NotificationService notificationService;

    // --- Profile ---
    public StudentProfile getProfile(Long userId) {
        return studentProfileRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Student profile not found"));
    }

    @Transactional
    public StudentProfile updateProfile(Long userId, Map<String, Object> updates) {
        StudentProfile profile = getProfile(userId);
        if (updates.containsKey("bio")) profile.setBio((String) updates.get("bio"));
        if (updates.containsKey("skills")) profile.setSkills(toJson(updates.get("skills")));
        if (updates.containsKey("researchInterests")) profile.setInterests(toJson(updates.get("researchInterests")));
        if (updates.containsKey("linkedinUrl")) profile.setLinkedinUrl((String) updates.get("linkedinUrl"));
        if (updates.containsKey("githubUrl")) profile.setGithubUrl((String) updates.get("githubUrl"));
        if (updates.containsKey("portfolioUrl")) profile.setPortfolioUrl((String) updates.get("portfolioUrl"));
        if (updates.containsKey("phone")) {
            UserAccount user = profile.getUser();
            user.setPhone((String) updates.get("phone"));
            userAccountRepository.save(user);
        }
        return studentProfileRepository.save(profile);
    }

    // --- Dashboard ---
    public Map<String, Object> getDashboard(Long userId) {
        Map<String, Object> dashboard = new HashMap<>();
        StudentProfile profile = getProfile(userId);

        // Build profile DTO inline
        UserAccount user = userAccountRepository.findById(userId).orElseThrow();
        dashboard.put("profile", buildStudentProfileDto(profile, user));

        // Registration status
        Optional<Project> projectOpt = projectRepository.findByStudent_UserId(userId);
        dashboard.put("registrationStatus", buildRegistrationStatus(userId, projectOpt));

        // Upcoming meetings
        dashboard.put("upcomingMeetings", List.of());

        // Pending logs
        long pendingLogs = meetingLogRepository.countByStudent_UserIdAndStatus(userId, MeetingLogStatus.DRAFT);
        dashboard.put("pendingLogs", List.of());

        // Recent documents
        dashboard.put("recentDocuments", List.of());

        // Upcoming deadlines
        List<Deadline> deadlines = deadlineRepository.findByDueDateAfterOrderByDueDateAsc(LocalDate.now());
        dashboard.put("upcomingDeadlines", deadlines);

        // Proposal status
        proposalRepository.findByStudent_UserId(userId).ifPresent(p -> dashboard.put("proposalStatus", p));

        // Notifications
        dashboard.put("notifications", Map.of("unreadCount", 0));

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

    // --- Supervisor Directory ---
    public Page<SupervisorProfile> searchSupervisors(String search, String faculty, Boolean availableOnly, Pageable pageable) {
        if (search != null && !search.isBlank()) {
            return supervisorProfileRepository.searchSupervisors(search, pageable);
        }
        if (faculty != null && !faculty.isBlank()) {
            return supervisorProfileRepository.findByFaculty(faculty, pageable);
        }
        if (Boolean.TRUE.equals(availableOnly)) {
            return supervisorProfileRepository.findAvailableSupervisors(pageable);
        }
        return supervisorProfileRepository.findAllActiveSupervisors(pageable);
    }

    public SupervisorProfile getSupervisorDetail(Long supervisorId) {
        return supervisorProfileRepository.findById(supervisorId)
                .orElseThrow(() -> new ResourceNotFoundException("Supervisor not found"));
    }

    // --- Supervision Requests ---
    public List<SupervisorRequest> getSupervisionRequests(Long userId) {
        return supervisorRequestRepository.findByStudent_UserIdOrderBySubmittedAtDesc(userId);
    }

    @Transactional
    public SupervisorRequest createSupervisionRequest(Long userId, Map<String, Object> data) {
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

        return saved;
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

    // --- Proposals ---
    public Optional<Proposal> getProposal(Long userId) {
        return proposalRepository.findByStudent_UserId(userId);
    }

    @Transactional
    public Proposal createProposal(Long userId, Map<String, Object> data) {
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

        // Create first version
        String contentJson = toJson(data);
        ProposalVersion version = ProposalVersion.builder()
                .proposal(saved)
                .versionNo(1)
                .contentText(contentJson)
                .build();
        proposalVersionRepository.save(version);

        return saved;
    }

    @Transactional
    public Proposal updateProposal(Long userId, Map<String, Object> data) {
        Proposal proposal = proposalRepository.findByStudent_UserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Proposal not found"));

        if (data.containsKey("title")) proposal.setTitle((String) data.get("title"));

        // Create a new version
        int newVersion = proposal.getCurrentVersion() + 1;
        proposal.setCurrentVersion(newVersion);
        proposalRepository.save(proposal);

        ProposalVersion version = ProposalVersion.builder()
                .proposal(proposal)
                .versionNo(newVersion)
                .contentText(toJson(data))
                .build();
        proposalVersionRepository.save(version);

        return proposal;
    }

    @Transactional
    public Proposal submitProposal(Long userId) {
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

        return saved;
    }

    public List<ProposalVersion> getProposalVersions(Long userId) {
        Proposal proposal = proposalRepository.findByStudent_UserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Proposal not found"));
        return proposalVersionRepository.findByProposal_ProposalIdOrderByVersionNoDesc(proposal.getProposalId());
    }

    // --- Deadlines ---
    public List<Deadline> getDeadlines(Long userId) {
        return deadlineRepository.findByAudienceAndDueDateAfterOrderByDueDateAsc("STUDENT", LocalDate.now());
    }

    // --- Helpers ---
    private String toJson(Object obj) {
        try {
            return new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(obj);
        } catch (Exception e) {
            return "{}";
        }
    }

    private Map<String, Object> buildStudentProfileDto(StudentProfile profile, UserAccount user) {
        Map<String, Object> dto = new HashMap<>();
        dto.put("userId", user.getUserId().toString());
        dto.put("studentId", user.getMmuId());
        dto.put("fullName", user.getFullName());
        dto.put("email", user.getEmail());
        dto.put("phone", user.getPhone());
        dto.put("programCode", profile.getProgramme());
        dto.put("programName", profile.getProgramme());
        dto.put("faculty", profile.getFaculty());
        dto.put("intakeYear", profile.getIntakeYear());
        dto.put("expectedGraduation", profile.getExpectedGraduation());
        dto.put("cgpa", profile.getCgpa());
        dto.put("profileImageUrl", user.getProfileImagePath());
        dto.put("bio", profile.getBio());
        dto.put("skills", parseJsonArray(profile.getSkills()));
        dto.put("researchInterests", parseJsonArray(profile.getInterests()));
        dto.put("linkedinUrl", profile.getLinkedinUrl());
        dto.put("githubUrl", profile.getGithubUrl());
        dto.put("portfolioUrl", profile.getPortfolioUrl());
        dto.put("createdAt", user.getCreatedAt().toString());
        dto.put("updatedAt", profile.getUpdatedAt().toString());
        return dto;
    }

    private Map<String, Object> buildRegistrationStatus(Long userId, Optional<Project> projectOpt) {
        Map<String, Object> reg = new HashMap<>();
        reg.put("registrationId", userId.toString());
        reg.put("studentId", userId.toString());
        reg.put("academicYear", "2024/2025");
        reg.put("semester", 1);
        reg.put("cycle", "FYP1");
        if (projectOpt.isPresent()) {
            reg.put("status", "REGISTERED");
        } else {
            reg.put("status", "NOT_STARTED");
        }
        reg.put("nextSteps", List.of());
        reg.put("timeline", List.of());
        return reg;
    }

    @SuppressWarnings("unchecked")
    private List<String> parseJsonArray(String json) {
        if (json == null || json.isBlank()) return List.of();
        try {
            return new com.fasterxml.jackson.databind.ObjectMapper().readValue(json, List.class);
        } catch (Exception e) {
            return List.of();
        }
    }
}
