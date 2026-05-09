package com.fyp.supervision.service;

import com.fyp.supervision.entity.*;
import com.fyp.supervision.enums.*;
import com.fyp.supervision.exception.BadRequestException;
import com.fyp.supervision.exception.ResourceNotFoundException;
import com.fyp.supervision.proposal.ProposalTemplateOptions;
import com.fyp.supervision.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.regex.Pattern;

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
    private final FypCycleRepository fypCycleRepository;
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
        if (updates.containsKey("specialisation")) profile.setSpecialisation((String) updates.get("specialisation"));
        if (updates.containsKey("intakeYear")) {
            Object iy = updates.get("intakeYear");
            if (iy instanceof Number n) profile.setIntakeYear(n.intValue());
            else if (iy instanceof String s && !s.isBlank()) {
                try { profile.setIntakeYear(Integer.parseInt(s.trim())); } catch (NumberFormatException ignored) {}
            } else if (iy == null) profile.setIntakeYear(null);
        }
        if (updates.containsKey("cgpa")) {
            Object cg = updates.get("cgpa");
            if (cg == null || (cg instanceof String s && s.isBlank())) {
                profile.setCgpa(null);
            } else {
                BigDecimal value;
                if (cg instanceof Number n) value = new BigDecimal(n.toString());
                else {
                    try { value = new BigDecimal(cg.toString().trim()); }
                    catch (NumberFormatException e) { throw new BadRequestException("CGPA must be a number"); }
                }
                if (value.compareTo(BigDecimal.ZERO) < 0 || value.compareTo(new BigDecimal("4.00")) > 0) {
                    throw new BadRequestException("CGPA must be between 0.00 and 4.00");
                }
                profile.setCgpa(value.setScale(2, RoundingMode.HALF_UP));
            }
        }
        if (updates.containsKey("expectedGraduation")) {
            Object eg = updates.get("expectedGraduation");
            if (eg == null || (eg instanceof String s && s.isBlank())) {
                profile.setExpectedGraduation(null);
            } else {
                String value = eg.toString().trim();
                if (!Pattern.matches("^\\d{4}-(0[1-9]|1[0-2])$", value)) {
                    throw new BadRequestException("Expected graduation must be in YYYY-MM format");
                }
                profile.setExpectedGraduation(value);
            }
        }
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

        // Upcoming deadlines — scope to the student's current phase (FYP1/FYP2)
        String stage = projectOpt.map(Project::getStage).filter(s -> s != null && !s.isBlank()).orElse("FYP1");
        String normalisedStage = stage.replace(" ", "").toUpperCase();
        List<Deadline> deadlines = deadlineRepository
                .findByCycle_CycleTypeAndDueDateAfterOrderByDueDateAsc(normalisedStage, LocalDate.now());
        if (deadlines.isEmpty()) {
            deadlines = deadlineRepository.findByDueDateAfterOrderByDueDateAsc(LocalDate.now());
        }
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

    /** Convenience: parse the latest ProposalVersion content JSON into a Map. */
    public Map<String, Object> getLatestProposalContent(Proposal proposal) {
        return proposalVersionRepository
                .findByProposal_ProposalIdOrderByVersionNoDesc(proposal.getProposalId())
                .stream()
                .findFirst()
                .map(v -> parseJsonMap(v.getContentText()))
                .orElseGet(Map::of);
    }

    @Transactional
    public Map<String, Object> createProposal(Long userId, Map<String, Object> data) {
        if (proposalRepository.findByStudent_UserId(userId).isPresent()) {
            throw new BadRequestException("You already have a proposal.");
        }
        validateProposalPayload(data);

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
        validateProposalPayload(data);

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

    /**
     * Cross-field validation aligned with the MMU FCI FYP Proposal Form.
     * Frontend has the same rules; backend enforces as the source of truth.
     */
    private void validateProposalPayload(Map<String, Object> data) {
        Object specObj = data.get("specialisation");
        if (specObj instanceof String spec && !spec.isBlank()) {
            if (!ProposalTemplateOptions.SPECIALISATIONS.contains(spec)) {
                throw new BadRequestException("Invalid specialisation: " + spec);
            }
            Object catObj = data.get("projectCategory");
            if (catObj instanceof String cat && !cat.isBlank()
                    && !ProposalTemplateOptions.CATEGORIES_BY_SPEC
                            .getOrDefault(spec, java.util.List.of()).contains(cat)) {
                throw new BadRequestException("Project category does not belong to specialisation '" + spec + "'.");
            }
            Object focusObj = data.get("projectFocus");
            if (focusObj instanceof String focus && !focus.isBlank()
                    && !ProposalTemplateOptions.FOCUS_BY_SPEC
                            .getOrDefault(spec, java.util.List.of()).contains(focus)) {
                throw new BadRequestException("Project focus does not belong to specialisation '" + spec + "'.");
            }
        }
        Object statusObj = data.get("projectStatus");
        if (statusObj instanceof String status && !status.isBlank()
                && !ProposalTemplateOptions.PROJECT_STATUS.contains(status)) {
            throw new BadRequestException("Invalid project status: " + status);
        }
        Object typeObj = data.get("projectType");
        if (typeObj instanceof String type && !type.isBlank()
                && !ProposalTemplateOptions.PROJECT_TYPE.contains(type)) {
            throw new BadRequestException("Invalid project type: " + type);
        }
        Object numObj = data.get("numberOfStudents");
        if (numObj instanceof String num && !num.isBlank()
                && !ProposalTemplateOptions.NUMBER_OF_STUDENTS.contains(num)) {
            throw new BadRequestException("Invalid number of students: " + num);
        }
        // Two-student project: student2 MMU ID must resolve and not point at the author.
        if ("Two".equals(data.get("numberOfStudents"))) {
            Object s2 = data.get("student2MmuId");
            if (s2 instanceof String s2id && !s2id.isBlank()) {
                userAccountRepository.findByMmuId(s2id.trim())
                        .orElseThrow(() -> new BadRequestException(
                                "Student 2 MMU ID not found: " + s2id));
            }
        }
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

    public Map<String, Object> getLogsDto(Long userId, String status, String phase, Pageable pageable) {
        boolean hasStatus = status != null && !status.isBlank();
        boolean hasPhase = phase != null && !phase.isBlank();
        Page<MeetingLog> page;
        if (hasStatus && hasPhase) {
            page = meetingLogRepository.findByStudent_UserIdAndStatusAndFypPhaseOrderByCreatedAtDesc(userId, MeetingLogStatus.valueOf(status), phase, pageable);
        } else if (hasStatus) {
            page = meetingLogRepository.findByStudent_UserIdAndStatusOrderByCreatedAtDesc(userId, MeetingLogStatus.valueOf(status), pageable);
        } else if (hasPhase) {
            page = meetingLogRepository.findByStudent_UserIdAndFypPhaseOrderByCreatedAtDesc(userId, phase, pageable);
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

    /** Backwards-compat overload (no phase filter). */
    public Map<String, Object> getLogsDto(Long userId, String status, Pageable pageable) {
        return getLogsDto(userId, status, null, pageable);
    }

    public Map<String, Object> getLogDto(Long logId) {
        MeetingLog log = meetingLogRepository.findById(logId)
                .orElseThrow(() -> new ResourceNotFoundException("Meeting log not found"));
        return buildMeetingLogDto(log);
    }

    // ========================= Documents =========================

    public Map<String, Object> getDocumentsDto(Long userId, String type, String phase, Pageable pageable) {
        boolean hasType = type != null && !type.isBlank();
        boolean hasPhase = phase != null && !phase.isBlank();
        Page<ProjectDocument> page;
        if (hasType && hasPhase) {
            page = projectDocumentRepository.findByProject_Student_UserIdAndDocTypeAndPhaseOrderByUploadedAtDesc(userId, type, phase, pageable);
        } else if (hasType) {
            page = projectDocumentRepository.findByProject_Student_UserIdAndDocTypeOrderByUploadedAtDesc(userId, type, pageable);
        } else if (hasPhase) {
            page = projectDocumentRepository.findByProject_Student_UserIdAndPhaseOrderByUploadedAtDesc(userId, phase, pageable);
        } else {
            page = projectDocumentRepository.findByProject_Student_UserIdOrderByUploadedAtDesc(userId, pageable);
        }

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
        Optional<Project> projectOpt = projectRepository.findByStudent_UserId(userId);
        String stage = projectOpt.map(Project::getStage).filter(s -> s != null && !s.isBlank()).orElse("FYP1");
        String normalisedStage = stage.replace(" ", "").toUpperCase();
        List<Deadline> deadlines = deadlineRepository
                .findByCycle_CycleTypeAndAudienceAndDueDateAfterOrderByDueDateAsc(normalisedStage, "STUDENT", LocalDate.now());
        if (deadlines.isEmpty()) {
            deadlines = deadlineRepository.findByCycle_CycleTypeAndDueDateAfterOrderByDueDateAsc(normalisedStage, LocalDate.now());
        }
        if (deadlines.isEmpty()) {
            deadlines = deadlineRepository.findByAudienceAndDueDateAfterOrderByDueDateAsc("STUDENT", LocalDate.now());
        }
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
        dto.put("specialisation", profile.getSpecialisation());
        dto.put("intakeYear", profile.getIntakeYear() != null ? profile.getIntakeYear() : null);
        dto.put("expectedGraduation", profile.getExpectedGraduation() != null ? profile.getExpectedGraduation() : "");
        dto.put("cgpa", profile.getCgpa() != null ? profile.getCgpa().doubleValue() : null);
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

        // Existing free-text fields (from JSON content)
        dto.put("title", p.getTitle() != null ? p.getTitle() : "");
        dto.put("problemStatement", latestContent.getOrDefault("problemStatement", ""));
        dto.put("objectives", latestContent.getOrDefault("objectives", List.of()));
        dto.put("scope", latestContent.getOrDefault("scope", ""));
        dto.put("methodology", latestContent.getOrDefault("methodology", ""));
        dto.put("expectedOutcomes", latestContent.getOrDefault("expectedOutcomes", List.of()));
        dto.put("timeline", latestContent.getOrDefault("timeline", null));
        dto.put("references", latestContent.getOrDefault("references", List.of()));

        // MMU FCI template-aligned fields (also stored in JSON content)
        dto.put("projectStatus", latestContent.getOrDefault("projectStatus", "Student-Proposed"));
        dto.put("projectType", latestContent.getOrDefault("projectType", null));
        dto.put("specialisation", latestContent.getOrDefault("specialisation", defaultStudentSpecialisation(p)));
        dto.put("projectCategory", latestContent.getOrDefault("projectCategory", null));
        dto.put("projectFocus", latestContent.getOrDefault("projectFocus", null));
        dto.put("numberOfStudents", latestContent.getOrDefault("numberOfStudents", "One"));
        dto.put("industryCollaboration", latestContent.getOrDefault("industryCollaboration", false));
        dto.put("industryCompanyName", latestContent.getOrDefault("industryCompanyName", null));
        dto.put("industryContactName", latestContent.getOrDefault("industryContactName", null));
        dto.put("industryContactPhone", latestContent.getOrDefault("industryContactPhone", null));
        dto.put("coSupervisorName", latestContent.getOrDefault("coSupervisorName", null));
        dto.put("student1Subtitle", latestContent.getOrDefault("student1Subtitle", null));
        dto.put("student1WorkDistribution", latestContent.getOrDefault("student1WorkDistribution", null));
        dto.put("student2MmuId", latestContent.getOrDefault("student2MmuId", null));
        dto.put("student2Subtitle", latestContent.getOrDefault("student2Subtitle", null));
        dto.put("student2WorkDistribution", latestContent.getOrDefault("student2WorkDistribution", null));

        // Autofilled blocks (read-only on the frontend)
        dto.put("supervisor", buildProposalSupervisorBlock(p));
        dto.put("student1", buildProposalStudentBlock(p.getStudent()));
        Object student2MmuId = latestContent.get("student2MmuId");
        if (student2MmuId instanceof String s2 && !s2.isBlank()) {
            UserAccount s2User = userAccountRepository.findByMmuId(s2.trim()).orElse(null);
            dto.put("student2", s2User != null ? buildProposalStudentBlock(s2User) : null);
        } else {
            dto.put("student2", null);
        }

        dto.put("status", p.getStatus().name());
        dto.put("version", p.getCurrentVersion());
        dto.put("submittedAt", p.getStatus() == ProposalStatus.SUBMITTED || p.getStatus() == ProposalStatus.UNDER_REVIEW || p.getStatus() == ProposalStatus.APPROVED ? p.getUpdatedAt().toString() : null);
        dto.put("fileUrl", fileUrl);
        dto.put("fileName", fileName);
        dto.put("createdAt", p.getCreatedAt() != null ? p.getCreatedAt().toString() : "");
        dto.put("updatedAt", p.getUpdatedAt() != null ? p.getUpdatedAt().toString() : "");
        return dto;
    }

    private String defaultStudentSpecialisation(Proposal p) {
        if (p.getStudent() == null) return null;
        return studentProfileRepository.findById(p.getStudent().getUserId())
                .map(StudentProfile::getSpecialisation)
                .orElse(null);
    }

    private Map<String, Object> buildProposalSupervisorBlock(Proposal p) {
        if (p.getSupervisor() == null) return null;
        UserAccount sup = p.getSupervisor();
        Map<String, Object> block = new LinkedHashMap<>();
        block.put("userId", sup.getUserId().toString());
        block.put("fullName", sup.getFullName());
        block.put("email", sup.getEmail());
        block.put("phone", sup.getPhone());
        SupervisorProfile sp = supervisorProfileRepository.findById(sup.getUserId()).orElse(null);
        block.put("position", sp != null ? sp.getPosition() : null);
        block.put("department", sp != null ? sp.getDepartment() : null);
        block.put("faculty", sp != null ? sp.getFaculty() : null);
        return block;
    }

    private Map<String, Object> buildProposalStudentBlock(UserAccount user) {
        if (user == null) return null;
        Map<String, Object> block = new LinkedHashMap<>();
        block.put("userId", user.getUserId().toString());
        block.put("studentId", user.getMmuId());
        block.put("fullName", user.getFullName());
        block.put("email", user.getEmail());
        block.put("phone", user.getPhone());
        StudentProfile sp = studentProfileRepository.findById(user.getUserId()).orElse(null);
        block.put("specialisation", sp != null ? sp.getSpecialisation() : null);
        block.put("intakeYear", sp != null ? sp.getIntakeYear() : null);
        return block;
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

        // Section 1: Tasks (parse JSON, add labels — labels depend on phase)
        dto.put("tasks", parseTasks(log.getTasksJson(), log.getFypPhase()));
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

    private static final Map<String, String> MEETING_LOG_TASK_LABELS_FYP1 = Map.of(
            "PLANNING", "Planning",
            "LITERATURE_REVIEW", "Literature Review",
            "REQUIREMENT_ANALYSIS", "Requirement Analysis",
            "DESIGN_METHODOLOGY", "Design & Methodology",
            "PROTOTYPE_POC", "Prototype / Proof of Concept",
            "DRAFT_REPORT", "Draft Report / Report Writing"
    );

    private static final Map<String, String> MEETING_LOG_TASK_LABELS_FYP2 = Map.ofEntries(
            Map.entry("BACKGROUND_STUDY", "Background Study"),
            Map.entry("IMPLEMENTATION", "Implementation"),
            Map.entry("TESTING", "Testing"),
            Map.entry("EVALUATION", "Evaluation"),
            Map.entry("COMMERCIALISATION_PROPOSAL", "Commercialisation Proposal"),
            Map.entry("RESEARCH_PAPER", "Research Paper"),
            Map.entry("DRAFT_REPORT", "Draft Report"),
            Map.entry("FINAL_REPORT", "Final Report")
    );

    private String labelForTask(String code, String phase) {
        Map<String, String> labels = "FYP2".equalsIgnoreCase(phase) ? MEETING_LOG_TASK_LABELS_FYP2 : MEETING_LOG_TASK_LABELS_FYP1;
        String label = labels.get(code);
        if (label != null) return label;
        // Fallback: try the other phase's map (handles edge case where phase string is missing/wrong on existing rows).
        Map<String, String> other = labels == MEETING_LOG_TASK_LABELS_FYP1 ? MEETING_LOG_TASK_LABELS_FYP2 : MEETING_LOG_TASK_LABELS_FYP1;
        return other.getOrDefault(code, code);
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> parseTasks(String tasksJson, String phase) {
        if (tasksJson == null || tasksJson.isBlank()) return List.of();
        try {
            List<Map<String, Object>> raw = new com.fasterxml.jackson.databind.ObjectMapper().readValue(tasksJson, List.class);
            List<Map<String, Object>> out = new ArrayList<>();
            for (Map<String, Object> t : raw) {
                String code = t.get("taskCode") != null ? t.get("taskCode").toString() : "";
                Map<String, Object> task = new LinkedHashMap<>();
                task.put("taskCode", code);
                task.put("label", labelForTask(code, phase));
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
        String type = doc.getDocType() != null && !doc.getDocType().isBlank() ? doc.getDocType() : "OTHER";
        dto.put("type", type);
        dto.put("phase", doc.getPhase() != null && !doc.getPhase().isBlank() ? doc.getPhase() : "FYP1");
        dto.put("fileName", doc.getFileName());
        dto.put("fileSize", doc.getFileSize() != null ? doc.getFileSize() : 0);
        dto.put("fileUrl", "/api/student/documents/" + doc.getDocumentId() + "/download");
        dto.put("downloadUrl", "/student/documents/" + doc.getDocumentId() + "/download");
        dto.put("mimeType", doc.getMimeType());
        dto.put("version", doc.getVersionNo() != null ? doc.getVersionNo() : 1);
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

        String stage = projectOpt.map(Project::getStage).filter(s -> s != null && !s.isBlank()).orElse("FYP1");
        String normalisedStage = stage.replace(" ", "").toUpperCase();
        FypCycle phaseCycle = projectOpt.map(Project::getCycle).orElse(null);
        if (phaseCycle == null || phaseCycle.getCycleType() == null
                || !phaseCycle.getCycleType().equalsIgnoreCase(normalisedStage)) {
            phaseCycle = fypCycleRepository.findAll().stream()
                    .filter(c -> c.getCycleType() != null && c.getCycleType().equalsIgnoreCase(normalisedStage))
                    .findFirst()
                    .orElse(phaseCycle);
        }

        reg.put("academicYear", phaseCycle != null ? phaseCycle.getAcademicYear() : null);
        reg.put("semester", phaseCycle != null ? phaseCycle.getSemester() : null);
        reg.put("cycle", normalisedStage);

        // "Paired" requires an actual supervisor assignment, not just a Project row.
        // CycleLifecycleService creates placeholder Projects with no supervisor when a
        // student joins an FYP1 cycle; those must NOT be treated as paired.
        Project project = projectOpt.orElse(null);
        boolean hasSupervisor = project != null && project.getSupervisor() != null;

        if (hasSupervisor) {
            // Real supervision pair — status now driven by proposal lifecycle.
            ProposalStatus proposalStatus = proposalRepository.findByStudent_UserId(userId)
                    .map(Proposal::getStatus)
                    .orElse(null);
            String status;
            if (proposalStatus == null
                    || proposalStatus == ProposalStatus.DRAFT
                    || proposalStatus == ProposalStatus.REVISION_REQUIRED) {
                status = "PROPOSAL_PENDING";
            } else if (proposalStatus == ProposalStatus.APPROVED) {
                status = "REGISTERED";
            } else {
                // SUBMITTED, UNDER_REVIEW, REJECTED
                status = "UNDER_REVIEW";
            }
            reg.put("status", status);
            reg.put("supervisorId", project.getSupervisor().getUserId().toString());
            SupervisorProfile sp = supervisorProfileRepository.findById(project.getSupervisor().getUserId()).orElse(null);
            reg.put("supervisor", sp != null ? buildSupervisorSummaryDto(sp) : null);
        } else {
            // No supervisor yet (placeholder project, or no project at all).
            boolean hasPendingRequest = supervisorRequestRepository.existsByStudent_UserIdAndStatus(userId, RequestStatus.PENDING);
            reg.put("status", hasPendingRequest ? "SUPERVISOR_PENDING" : "NOT_STARTED");
            reg.put("supervisorId", null);
            reg.put("supervisor", null);
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
