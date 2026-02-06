package com.fyp.supervision.service;

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

@Service
@RequiredArgsConstructor
public class SupervisorService {

    private final UserAccountRepository userAccountRepository;
    private final SupervisorProfileRepository supervisorProfileRepository;
    private final ProjectRepository projectRepository;
    private final SupervisorRequestRepository supervisorRequestRepository;
    private final ProposalRepository proposalRepository;
    private final ProposalReviewRepository proposalReviewRepository;
    private final MeetingRepository meetingRepository;
    private final MeetingLogRepository meetingLogRepository;
    private final ProjectDocumentRepository projectDocumentRepository;
    private final FypCycleRepository fypCycleRepository;
    private final NotificationService notificationService;

    // --- Profile ---
    public SupervisorProfile getProfile(Long userId) {
        return supervisorProfileRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Supervisor profile not found"));
    }

    @Transactional
    public SupervisorProfile updateProfile(Long userId, Map<String, Object> updates) {
        SupervisorProfile profile = getProfile(userId);
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
        return supervisorProfileRepository.save(profile);
    }

    // --- Dashboard ---
    public Map<String, Object> getDashboard(Long userId) {
        Map<String, Object> dashboard = new HashMap<>();
        long pendingRequests = supervisorRequestRepository.countBySupervisorUser_UserIdAndStatus(userId, RequestStatus.PENDING);
        List<Project> projects = projectRepository.findBySupervisor_UserId(userId);
        long activeProjects = projects.stream().filter(p -> p.getStatus() == ProjectStatus.ACTIVE).count();

        dashboard.put("totalSupervisees", projects.size());
        dashboard.put("activeSupervisees", activeProjects);
        dashboard.put("pendingRequests", pendingRequests);
        dashboard.put("pendingProposals", 0);
        dashboard.put("upcomingMeetings", 0);
        dashboard.put("pendingLogs", 0);
        return dashboard;
    }

    // --- Requests ---
    public List<SupervisorRequest> getRequests(Long userId, String status) {
        if (status != null && !status.isBlank()) {
            return supervisorRequestRepository.findBySupervisorUser_UserIdAndStatusOrderBySubmittedAtDesc(
                    userId, RequestStatus.valueOf(status));
        }
        return supervisorRequestRepository.findBySupervisorUser_UserIdOrderBySubmittedAtDesc(userId);
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

            // Create project
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

            // Update supervisor load
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

    // --- Supervisees ---
    public List<Map<String, Object>> getSupervisees(Long userId) {
        List<Project> projects = projectRepository.findBySupervisor_UserId(userId);
        List<Map<String, Object>> result = new ArrayList<>();
        for (Project p : projects) {
            Map<String, Object> dto = new HashMap<>();
            UserAccount student = p.getStudent();
            dto.put("superviseeId", p.getProjectId().toString());
            dto.put("userId", student.getUserId().toString());
            dto.put("studentId", student.getMmuId());
            dto.put("fullName", student.getFullName());
            dto.put("email", student.getEmail());
            dto.put("projectTitle", p.getProjectTitle());
            dto.put("projectStatus", p.getStatus().name());
            result.add(dto);
        }
        return result;
    }

    // --- Proposals ---
    public List<Proposal> getProposals(Long userId) {
        return proposalRepository.findBySupervisor_UserId(userId);
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

        if ("APPROVED".equals(data.get("feedbackType"))) {
            proposal.setStatus(ProposalStatus.APPROVED);
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

    // --- Meetings ---
    public List<Meeting> getMeetings(Long userId, String status) {
        return meetingRepository.findBySupervisorUserId(userId);
    }

    // --- Meeting Logs ---
    public List<MeetingLog> getMeetingLogs(Long userId, String status) {
        if (status != null && !status.isBlank()) {
            return meetingLogRepository.findBySupervisor_UserIdAndStatusOrderByCreatedAtDesc(
                    userId, MeetingLogStatus.valueOf(status));
        }
        return meetingLogRepository.findBySupervisor_UserIdOrderByCreatedAtDesc(userId);
    }

    private String toJson(Object obj) {
        try {
            return new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(obj);
        } catch (Exception e) {
            return "{}";
        }
    }
}
