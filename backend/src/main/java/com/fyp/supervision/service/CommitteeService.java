package com.fyp.supervision.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fyp.supervision.entity.*;
import com.fyp.supervision.enums.*;
import com.fyp.supervision.exception.ResourceNotFoundException;
import com.fyp.supervision.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CommitteeService {

    private final UserAccountRepository userAccountRepository;
    private final StudentProfileRepository studentProfileRepository;
    private final SupervisorProfileRepository supervisorProfileRepository;
    private final ProjectRepository projectRepository;
    private final ProposalRepository proposalRepository;
    private final ProposalVersionRepository proposalVersionRepository;
    private final ProposalReviewRepository proposalReviewRepository;
    private final ProposalCheckResultRepository proposalCheckResultRepository;
    private final SupervisorRequestRepository supervisorRequestRepository;
    private final AnnouncementRepository announcementRepository;
    private final ResourceDocumentRepository resourceDocumentRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();

    // ========== Dashboard ==========

    /** Returns DTO matching frontend CommitteeDashboardStats */
    public Map<String, Object> getDashboard() {
        long totalStudents = userAccountRepository.countByRole(UserRole.STUDENT);
        long totalSupervisors = userAccountRepository.countByRole(UserRole.SUPERVISOR);
        long activeProjects = projectRepository.countByStatus(ProjectStatus.ACTIVE);
        long completedProjects = projectRepository.countByStatus(ProjectStatus.COMPLETED);
        long pendingProposals = proposalRepository.countByStatus(ProposalStatus.SUBMITTED);
        long approvedProposals = proposalRepository.countByStatus(ProposalStatus.APPROVED);
        long rejectedProposals = proposalRepository.countByStatus(ProposalStatus.REJECTED);
        long totalProposals = pendingProposals + approvedProposals + rejectedProposals
                + proposalRepository.countByStatus(ProposalStatus.DRAFT)
                + proposalRepository.countByStatus(ProposalStatus.UNDER_REVIEW)
                + proposalRepository.countByStatus(ProposalStatus.REVISION_REQUIRED);

        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalProposals", totalProposals);
        stats.put("pendingReviews", pendingProposals);
        stats.put("approvedProposals", approvedProposals);
        stats.put("rejectedProposals", rejectedProposals);
        stats.put("totalStudents", totalStudents);
        stats.put("unpairedStudents", 0); // computed below if needed
        stats.put("totalSupervisors", totalSupervisors);
        stats.put("overloadedSupervisors", 0);
        stats.put("activeProjects", activeProjects);
        stats.put("completedProjects", completedProjects);
        stats.put("fyp1Students", 0);
        stats.put("fyp2Students", 0);
        stats.put("alerts", List.of());
        stats.put("recentActivities", List.of());
        return stats;
    }

    // ========== Announcements ==========

    public Map<String, Object> buildAnnouncementDto(Announcement ann) {
        Map<String, Object> dto = new LinkedHashMap<>();
        dto.put("announcementId", ann.getAnnouncementId());
        dto.put("title", ann.getTitle());
        dto.put("content", ann.getContent());
        dto.put("scope", ann.getScope() != null ? ann.getScope() : "ALL");
        dto.put("priority", ann.getPriority() != null ? ann.getPriority() : "NORMAL");
        dto.put("status", ann.getStatus().name());
        dto.put("publishAt", ann.getPublishAt() != null ? ann.getPublishAt().toString() : "");
        dto.put("expiresAt", ann.getExpiresAt() != null ? ann.getExpiresAt().toString() : null);
        dto.put("createdBy", ann.getCreatedBy() != null ? ann.getCreatedBy().getFullName() : "");
        dto.put("createdAt", ann.getCreatedAt() != null ? ann.getCreatedAt().toString() : "");
        dto.put("updatedAt", ann.getUpdatedAt() != null ? ann.getUpdatedAt().toString() : "");
        dto.put("viewCount", ann.getViewCount());
        return dto;
    }

    // ========== Proposals ==========

    /** Returns list of proposal DTOs matching ProposalForCommitteeReview */
    public List<Map<String, Object>> getProposalDtos(String status, Pageable pageable) {
        Page<Proposal> page;
        if (status != null && !status.isBlank()) {
            page = proposalRepository.findByStatus(ProposalStatus.valueOf(status), pageable);
        } else {
            page = proposalRepository.findAll(pageable);
        }
        return page.getContent().stream().map(this::buildProposalForCommitteeDto).collect(Collectors.toList());
    }

    public Map<String, Object> getProposalDto(Long proposalId) {
        Proposal proposal = proposalRepository.findById(proposalId)
                .orElseThrow(() -> new ResourceNotFoundException("Proposal not found"));
        return buildProposalForCommitteeDto(proposal);
    }

    public Map<String, Object> buildProposalForCommitteeDto(Proposal proposal) {
        UserAccount student = proposal.getStudent();
        StudentProfile sp = studentProfileRepository.findById(student.getUserId()).orElse(null);
        UserAccount supervisor = proposal.getSupervisor();

        List<ProposalVersion> versions = proposalVersionRepository.findByProposal_ProposalIdOrderByVersionNoDesc(proposal.getProposalId());
        List<ProposalReview> reviews = proposalReviewRepository.findByProposal_ProposalIdOrderByReviewedAtDesc(proposal.getProposalId());

        // AI analysis
        Map<String, Object> aiAnalysis = null;
        List<ProposalCheckResult> checks = proposalCheckResultRepository.findByProposal_ProposalIdOrderByCheckedAtDesc(proposal.getProposalId());
        if (!checks.isEmpty()) {
            ProposalCheckResult check = checks.get(0);
            aiAnalysis = new LinkedHashMap<>();
            aiAnalysis.put("overallScore", check.getOverallScore() != null ? check.getOverallScore() : 0);
            aiAnalysis.put("feasibilityScore", check.getFeasibilityScore() != null ? check.getFeasibilityScore() : 0);
            aiAnalysis.put("innovationScore", check.getInnovationScore() != null ? check.getInnovationScore() : 0);
            aiAnalysis.put("clarityScore", check.getClarityScore() != null ? check.getClarityScore() : 0);
            aiAnalysis.put("scopeScore", check.getScopeScore() != null ? check.getScopeScore() : 0);
            aiAnalysis.put("strengths", parseJsonArray(check.getStrengths()));
            aiAnalysis.put("weaknesses", parseJsonArray(check.getWeaknesses()));
            aiAnalysis.put("suggestions", parseJsonArray(check.getSuggestedImprovements()));
            aiAnalysis.put("plagiarismScore", check.getPlagiarismScore() != null ? check.getPlagiarismScore() : 0);
            aiAnalysis.put("analyzedAt", check.getCheckedAt() != null ? check.getCheckedAt().toString() : "");
        }

        // Review history
        List<Map<String, Object>> reviewHistory = reviews.stream().map(r -> {
            Map<String, Object> rDto = new LinkedHashMap<>();
            rDto.put("reviewId", r.getReviewId());
            rDto.put("reviewerName", r.getReviewer().getFullName());
            rDto.put("reviewerRole", "SUPERVISOR".equals(r.getReviewerRole()) ? "SUPERVISOR" : "COMMITTEE");
            rDto.put("decision", r.getDecision());
            rDto.put("feedback", r.getRemarks() != null ? r.getRemarks() : "");
            rDto.put("reviewedAt", r.getReviewedAt() != null ? r.getReviewedAt().toString() : "");
            return rDto;
        }).collect(Collectors.toList());

        // Parse content from latest version
        String abstractText = "";
        List<String> objectives = List.of();
        String methodology = "";
        if (!versions.isEmpty()) {
            try {
                @SuppressWarnings("unchecked")
                Map<String, Object> content = objectMapper.readValue(
                        versions.get(0).getContentText() != null ? versions.get(0).getContentText() : "{}", Map.class);
                abstractText = (String) content.getOrDefault("background", "");
                Object obj = content.get("objectives");
                if (obj instanceof List) {
                    @SuppressWarnings("unchecked")
                    List<String> list = (List<String>) obj;
                    objectives = list;
                }
                methodology = (String) content.getOrDefault("methodology", "");
            } catch (Exception ignored) {}
        }

        String proposalStatus = proposal.getStatus().name();
        if ("SUBMITTED".equals(proposalStatus)) proposalStatus = "PENDING_REVIEW";
        if ("REVISION_REQUIRED".equals(proposalStatus)) proposalStatus = "REVISION_REQUESTED";

        Map<String, Object> dto = new LinkedHashMap<>();
        dto.put("proposalId", proposal.getProposalId());
        dto.put("title", proposal.getTitle());
        dto.put("studentName", student.getFullName());
        dto.put("studentId", student.getMmuId());
        dto.put("studentEmail", student.getEmail());
        dto.put("programme", sp != null && sp.getProgramme() != null ? sp.getProgramme() : "");
        dto.put("cycle", "FYP1");
        dto.put("supervisorName", supervisor != null ? supervisor.getFullName() : "");
        dto.put("supervisorId", supervisor != null ? supervisor.getMmuId() : "");
        dto.put("submittedAt", proposal.getCreatedAt() != null ? proposal.getCreatedAt().toString() : "");
        dto.put("status", proposalStatus);
        dto.put("version", proposal.getCurrentVersion());
        dto.put("aiAnalysis", aiAnalysis);
        dto.put("reviewHistory", reviewHistory);
        dto.put("documentUrl", "");
        dto.put("abstract", abstractText);
        dto.put("objectives", objectives);
        dto.put("methodology", methodology);
        return dto;
    }

    // ========== Projects ==========

    /** Returns project overview DTOs matching ProjectOverview */
    public Map<String, Object> getProjectDtos(Long cycleId, Pageable pageable) {
        Page<Project> page;
        if (cycleId != null) {
            page = projectRepository.findAllByCycleId(cycleId, pageable);
        } else {
            page = projectRepository.findAll(pageable);
        }
        List<Map<String, Object>> dtos = page.getContent().stream().map(this::buildProjectOverviewDto).collect(Collectors.toList());
        return Map.of("content", dtos, "totalElements", page.getTotalElements(),
                "totalPages", page.getTotalPages(), "number", page.getNumber());
    }

    public Map<String, Object> getProjectDetailDto(Long projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));
        return buildProjectDetailDto(project);
    }

    /**
     * Flips Project.stage from FYP1 to FYP2. Idempotent — calling twice is a no-op.
     * Meeting numbering automatically restarts because counts are scoped per (student, fyp_phase).
     */
    @org.springframework.transaction.annotation.Transactional
    public Map<String, Object> advanceProjectPhase(Long projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));
        String stage = project.getStage();
        boolean alreadyFyp2 = stage != null && (stage.equalsIgnoreCase("FYP2") || stage.equalsIgnoreCase("FYP 2"));
        if (alreadyFyp2) {
            return Map.of("projectId", projectId, "stage", "FYP2", "changed", false);
        }
        project.setStage("FYP2");
        projectRepository.save(project);
        return Map.of("projectId", projectId, "stage", "FYP2", "changed", true);
    }

    public Map<String, Object> buildProjectOverviewDto(Project project) {
        UserAccount student = project.getStudent();
        UserAccount supervisor = project.getSupervisor();
        StudentProfile sp = student != null ? studentProfileRepository.findById(student.getUserId()).orElse(null) : null;

        String proposalStatus = "NOT_SUBMITTED";
        if (student != null) {
            Proposal proposal = proposalRepository.findByStudent_UserId(student.getUserId()).orElse(null);
            if (proposal != null) {
                proposalStatus = proposal.getStatus().name();
                if ("SUBMITTED".equals(proposalStatus)) proposalStatus = "PENDING_REVIEW";
                if ("REVISION_REQUIRED".equals(proposalStatus)) proposalStatus = "REVISION_REQUESTED";
            }
        }

        Map<String, Object> dto = new LinkedHashMap<>();
        dto.put("projectId", project.getProjectId());
        dto.put("title", project.getProjectTitle());
        dto.put("studentName", student != null ? student.getFullName() : "");
        dto.put("studentId", student != null ? student.getMmuId() : "");
        dto.put("studentEmail", student != null ? student.getEmail() : "");
        dto.put("programme", sp != null && sp.getProgramme() != null ? sp.getProgramme() : "");
        dto.put("cycle", "FYP1");
        dto.put("supervisorName", supervisor != null ? supervisor.getFullName() : null);
        dto.put("supervisorId", supervisor != null ? supervisor.getMmuId() : null);
        dto.put("pairingStatus", supervisor != null ? "PAIRED" : "UNPAIRED");
        dto.put("projectStatus", project.getStatus().name());
        dto.put("proposalStatus", proposalStatus);
        dto.put("progress", 0);
        dto.put("lastActivity", project.getUpdatedAt() != null ? project.getUpdatedAt().toString() : "");
        dto.put("riskLevel", "LOW");
        return dto;
    }

    public Map<String, Object> buildProjectDetailDto(Project project) {
        Map<String, Object> dto = buildProjectOverviewDto(project);
        dto.put("description", project.getDescription());
        dto.put("registeredAt", project.getRegisteredAt() != null ? project.getRegisteredAt().toString() : "");
        dto.put("milestones", List.of());
        dto.put("recentMeetings", List.of());
        dto.put("submissions", List.of());
        return dto;
    }

    // ========== Unpaired Students ==========

    public List<Map<String, Object>> getUnpairedStudentDtos(Long cycleId) {
        List<Project> projects = projectRepository.findUnpairedStudentsByCycle(cycleId);
        return projects.stream().map(p -> {
            UserAccount student = p.getStudent();
            StudentProfile sp = student != null ? studentProfileRepository.findById(student.getUserId()).orElse(null) : null;

            Map<String, Object> dto = new LinkedHashMap<>();
            dto.put("studentId", student != null ? student.getMmuId() : "");
            dto.put("userId", student != null ? student.getUserId().toString() : "");
            dto.put("fullName", student != null ? student.getFullName() : "");
            dto.put("email", student != null ? student.getEmail() : "");
            dto.put("programme", sp != null && sp.getProgramme() != null ? sp.getProgramme() : "");
            dto.put("cycle", "FYP1");
            dto.put("registeredAt", p.getRegisteredAt() != null ? p.getRegisteredAt().toString() : "");
            dto.put("requestsSent", 0);
            dto.put("requestsRejected", 0);
            dto.put("preferredAreas", sp != null ? parseJsonArray(sp.getInterests()) : List.of());
            return dto;
        }).collect(Collectors.toList());
    }

    // ========== Supervisor Loads ==========

    public List<Map<String, Object>> getSupervisorLoadDtos() {
        List<SupervisorProfile> profiles = supervisorProfileRepository.findAll();
        return profiles.stream().map(this::buildSupervisorLoadDto).collect(Collectors.toList());
    }

    public Map<String, Object> getSupervisorLoadDetailDto(Long userId) {
        SupervisorProfile profile = supervisorProfileRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Supervisor not found"));
        return buildSupervisorLoadDto(profile);
    }

    public Map<String, Object> buildSupervisorLoadDto(SupervisorProfile profile) {
        UserAccount user = userAccountRepository.findById(profile.getUserId()).orElse(null);
        List<Project> projects = projectRepository.findBySupervisor_UserId(profile.getUserId());

        List<Map<String, Object>> students = projects.stream().map(p -> {
            UserAccount student = p.getStudent();
            Map<String, Object> sDto = new LinkedHashMap<>();
            sDto.put("studentId", student != null ? student.getMmuId() : "");
            sDto.put("fullName", student != null ? student.getFullName() : "");
            sDto.put("cycle", "FYP1");
            sDto.put("projectTitle", p.getProjectTitle());
            sDto.put("progress", 0);
            sDto.put("riskLevel", "LOW");
            return sDto;
        }).collect(Collectors.toList());

        double utilization = profile.getSupervisionQuota() > 0
                ? (double) profile.getCurrentLoad() / profile.getSupervisionQuota() * 100 : 0;

        Map<String, Object> dto = new LinkedHashMap<>();
        dto.put("supervisorId", user != null ? user.getMmuId() : "");
        dto.put("userId", profile.getUserId().toString());
        dto.put("fullName", user != null ? user.getFullName() : "");
        dto.put("email", user != null ? user.getEmail() : "");
        dto.put("department", profile.getDepartment() != null ? profile.getDepartment() : "");
        dto.put("currentLoad", profile.getCurrentLoad());
        dto.put("maxCapacity", profile.getSupervisionQuota());
        dto.put("fyp1Students", projects.size());
        dto.put("fyp2Students", 0);
        dto.put("utilizationRate", Math.round(utilization));
        dto.put("isOverloaded", profile.getCurrentLoad() > profile.getSupervisionQuota());
        dto.put("expertise", parseJsonArray(profile.getExpertise()));
        dto.put("students", students);
        return dto;
    }

    // ========== Documents ==========

    public Map<String, Object> buildResourceDocumentDto(ResourceDocument doc) {
        Map<String, Object> dto = new LinkedHashMap<>();
        dto.put("documentId", doc.getResourceId());
        dto.put("title", doc.getTitle());
        dto.put("description", doc.getDescription());
        dto.put("category", doc.getCategory() != null ? doc.getCategory() : "OTHER");
        dto.put("visibility", doc.getVisibility() != null ? doc.getVisibility() : "PUBLIC");
        dto.put("fileName", doc.getFileName());
        dto.put("fileSize", doc.getFileSize());
        dto.put("fileUrl", doc.getStoragePath());
        dto.put("version", 1);
        dto.put("isActive", doc.getIsActive());
        dto.put("uploadedBy", doc.getUploadedBy() != null ? doc.getUploadedBy().getFullName() : "");
        dto.put("uploadedAt", doc.getPublishedAt() != null ? doc.getPublishedAt().toString() : "");
        dto.put("updatedAt", doc.getPublishedAt() != null ? doc.getPublishedAt().toString() : "");
        dto.put("downloadCount", doc.getDownloadCount());
        dto.put("versions", List.of());
        return dto;
    }

    // ========== Helpers ==========

    @SuppressWarnings("unchecked")
    private List<String> parseJsonArray(String json) {
        if (json == null || json.isBlank()) return List.of();
        try {
            return objectMapper.readValue(json, List.class);
        } catch (Exception e) {
            return List.of();
        }
    }
}
