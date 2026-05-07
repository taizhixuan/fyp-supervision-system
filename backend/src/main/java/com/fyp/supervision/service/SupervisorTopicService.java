package com.fyp.supervision.service;

import com.fyp.supervision.entity.FypCycle;
import com.fyp.supervision.entity.Project;
import com.fyp.supervision.entity.SupervisorProfile;
import com.fyp.supervision.entity.SupervisorTopic;
import com.fyp.supervision.entity.UserAccount;
import com.fyp.supervision.enums.CycleStatus;
import com.fyp.supervision.enums.ProjectStatus;
import com.fyp.supervision.enums.TopicStatus;
import com.fyp.supervision.exception.BadRequestException;
import com.fyp.supervision.exception.ResourceNotFoundException;
import com.fyp.supervision.repository.FypCycleRepository;
import com.fyp.supervision.repository.ProjectRepository;
import com.fyp.supervision.repository.SupervisorProfileRepository;
import com.fyp.supervision.repository.SupervisorTopicRepository;
import com.fyp.supervision.repository.UserAccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SupervisorTopicService {

    private final SupervisorTopicRepository topicRepository;
    private final UserAccountRepository userRepository;
    private final FypCycleRepository cycleRepository;
    private final SupervisorProfileRepository supervisorProfileRepository;
    private final ProjectRepository projectRepository;
    private final NotificationService notificationService;

    @Transactional
    public Map<String, Object> create(Long supervisorUserId, Map<String, Object> data) {
        UserAccount supervisor = userRepository.findById(supervisorUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Supervisor not found"));

        String title = stringOrThrow(data, "title", "Title is required");
        String description = stringOrThrow(data, "description", "Description is required");
        Integer slots = data.get("slots") != null ? ((Number) data.get("slots")).intValue() : 1;
        if (slots < 1) throw new BadRequestException("Slots must be at least 1");

        FypCycle cycle = activeFyp1Cycle();

        SupervisorTopic topic = SupervisorTopic.builder()
                .supervisor(supervisor)
                .cycle(cycle)
                .title(title.trim())
                .description(description.trim())
                .researchArea(data.get("researchArea") != null ? data.get("researchArea").toString() : null)
                .slots(slots)
                .status(TopicStatus.PENDING_REVIEW)
                .build();
        SupervisorTopic saved = topicRepository.save(topic);
        return buildDto(saved);
    }

    public List<Map<String, Object>> listMine(Long supervisorUserId) {
        return topicRepository.findBySupervisor_UserIdOrderByCreatedAtDesc(supervisorUserId)
                .stream().map(this::buildDto).collect(Collectors.toList());
    }

    public Map<String, Object> getOne(Long topicId, Long requestingUserId) {
        SupervisorTopic topic = topicRepository.findById(topicId)
                .orElseThrow(() -> new ResourceNotFoundException("Topic not found"));
        if (requestingUserId != null && !topic.getSupervisor().getUserId().equals(requestingUserId)) {
            throw new BadRequestException("You can only view your own topics");
        }
        return buildDto(topic);
    }

    @Transactional
    public Map<String, Object> update(Long topicId, Long supervisorUserId, Map<String, Object> data) {
        SupervisorTopic topic = topicRepository.findById(topicId)
                .orElseThrow(() -> new ResourceNotFoundException("Topic not found"));
        if (!topic.getSupervisor().getUserId().equals(supervisorUserId)) {
            throw new BadRequestException("You can only edit your own topics");
        }
        if (topic.getStatus() != TopicStatus.PENDING_REVIEW && topic.getStatus() != TopicStatus.REVISION_REQUIRED) {
            throw new BadRequestException("Topic can only be edited while pending review or awaiting revision");
        }
        if (data.containsKey("title")) topic.setTitle(((String) data.get("title")).trim());
        if (data.containsKey("description")) topic.setDescription(((String) data.get("description")).trim());
        if (data.containsKey("researchArea")) topic.setResearchArea((String) data.get("researchArea"));
        if (data.containsKey("slots")) {
            int slots = ((Number) data.get("slots")).intValue();
            if (slots < 1) throw new BadRequestException("Slots must be at least 1");
            topic.setSlots(slots);
        }
        // Resubmitting from REVISION_REQUIRED puts it back in the queue.
        if (topic.getStatus() == TopicStatus.REVISION_REQUIRED) {
            topic.setStatus(TopicStatus.PENDING_REVIEW);
            topic.setFeedback(null);
        }
        topicRepository.save(topic);
        return buildDto(topic);
    }

    @Transactional
    public Map<String, Object> withdraw(Long topicId, Long supervisorUserId) {
        SupervisorTopic topic = topicRepository.findById(topicId)
                .orElseThrow(() -> new ResourceNotFoundException("Topic not found"));
        if (!topic.getSupervisor().getUserId().equals(supervisorUserId)) {
            throw new BadRequestException("You can only withdraw your own topics");
        }
        if (topic.getStatus() == TopicStatus.WITHDRAWN) {
            throw new BadRequestException("Topic is already withdrawn");
        }
        // Only allow withdraw before any student confirms.
        long confirmed = projectRepository.countByTopicId(topicId);
        if (confirmed > 0) {
            throw new BadRequestException("Cannot withdraw topic — students have already confirmed");
        }
        topic.setStatus(TopicStatus.WITHDRAWN);
        topicRepository.save(topic);
        return buildDto(topic);
    }

    /**
     * Committee review: flip topic status and notify supervisor.
     */
    @Transactional
    public Map<String, Object> review(Long topicId, Long reviewerUserId, String decision, String feedback) {
        SupervisorTopic topic = topicRepository.findById(topicId)
                .orElseThrow(() -> new ResourceNotFoundException("Topic not found"));
        if (topic.getStatus() != TopicStatus.PENDING_REVIEW) {
            throw new BadRequestException("Topic is not pending review");
        }
        TopicStatus next;
        String notifTitle;
        String notifBody;
        switch (decision == null ? "" : decision.toUpperCase()) {
            case "APPROVED":
                next = TopicStatus.APPROVED;
                notifTitle = "Your topic was approved";
                notifBody = "\"" + topic.getTitle() + "\" was approved by the FYP committee.";
                break;
            case "REJECTED":
                next = TopicStatus.REJECTED;
                notifTitle = "Your topic was rejected";
                notifBody = "\"" + topic.getTitle() + "\" was rejected. " + (feedback != null ? feedback : "");
                break;
            case "REVISION_REQUIRED":
                next = TopicStatus.REVISION_REQUIRED;
                notifTitle = "Topic revision requested";
                notifBody = "Please revise \"" + topic.getTitle() + "\". " + (feedback != null ? feedback : "");
                break;
            default:
                throw new BadRequestException("Decision must be APPROVED, REJECTED, or REVISION_REQUIRED");
        }
        topic.setStatus(next);
        topic.setFeedback(feedback);
        topic.setReviewedBy(userRepository.findById(reviewerUserId).orElse(null));
        topic.setReviewedAt(LocalDateTime.now());
        topicRepository.save(topic);
        notificationService.createNotification(
                topic.getSupervisor().getUserId(),
                "TOPIC_REVIEW",
                notifTitle,
                notifBody,
                "/supervisor/topics"
        );
        return buildDto(topic);
    }

    public List<Map<String, Object>> listByStatus(TopicStatus status) {
        return topicRepository.findByStatusOrderByCreatedAtAsc(status)
                .stream().map(this::buildDto).collect(Collectors.toList());
    }

    /**
     * Approved topics with remaining-slot counts for student browsing.
     */
    public List<Map<String, Object>> listApprovedForStudents() {
        return topicRepository.findByStatusOrderByCreatedAtDesc(TopicStatus.APPROVED).stream()
                .map(this::buildStudentBrowseDto)
                .collect(Collectors.toList());
    }

    /**
     * Student commits to an approved topic. Creates a Project row pairing them with the supervisor.
     * Idempotency: a student with an existing Project cannot pick a second one.
     */
    @Transactional
    public Map<String, Object> confirm(Long studentUserId, Long topicId) {
        SupervisorTopic topic = topicRepository.findById(topicId)
                .orElseThrow(() -> new ResourceNotFoundException("Topic not found"));
        if (topic.getStatus() != TopicStatus.APPROVED) {
            throw new BadRequestException("Topic is not approved");
        }
        long confirmed = projectRepository.countByTopicId(topicId);
        if (confirmed >= topic.getSlots()) {
            throw new BadRequestException("This topic has no remaining slots");
        }
        // One project per student.
        if (projectRepository.findByStudent_UserId(studentUserId).isPresent()) {
            throw new BadRequestException("You already have a paired project");
        }
        UserAccount student = userRepository.findById(studentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found"));

        Project project = Project.builder()
                .student(student)
                .supervisor(topic.getSupervisor())
                .topic(topic)
                .cycle(topic.getCycle())
                .projectTitle(topic.getTitle())
                .description(topic.getDescription())
                .specialisation(topic.getResearchArea())
                .stage("FYP1")
                .status(ProjectStatus.ACTIVE)
                .registeredAt(LocalDateTime.now())
                .build();
        Project saved = projectRepository.save(project);

        notificationService.createNotification(
                topic.getSupervisor().getUserId(),
                "TOPIC_CONFIRMED",
                "Student confirmed your topic",
                student.getFullName() + " has paired with you on \"" + topic.getTitle() + "\".",
                "/supervisor/supervisees"
        );

        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("projectId", saved.getProjectId());
        resp.put("topicId", topicId);
        resp.put("supervisorUserId", topic.getSupervisor().getUserId());
        resp.put("supervisorName", topic.getSupervisor().getFullName());
        return resp;
    }

    public Map<String, Object> buildDto(SupervisorTopic topic) {
        UserAccount supervisor = topic.getSupervisor();
        SupervisorProfile profile = supervisor != null
                ? supervisorProfileRepository.findById(supervisor.getUserId()).orElse(null)
                : null;
        long confirmed = projectRepository.countByTopicId(topic.getTopicId());

        Map<String, Object> dto = new LinkedHashMap<>();
        dto.put("topicId", topic.getTopicId());
        dto.put("title", topic.getTitle());
        dto.put("description", topic.getDescription());
        dto.put("researchArea", topic.getResearchArea());
        dto.put("slots", topic.getSlots());
        dto.put("confirmedCount", confirmed);
        dto.put("remainingSlots", Math.max(0, topic.getSlots() - confirmed));
        dto.put("status", topic.getStatus().name());
        dto.put("feedback", topic.getFeedback());
        dto.put("supervisorUserId", supervisor != null ? supervisor.getUserId() : null);
        dto.put("supervisorName", supervisor != null ? supervisor.getFullName() : null);
        dto.put("supervisorEmail", supervisor != null ? supervisor.getEmail() : null);
        dto.put("supervisorDepartment", profile != null ? profile.getDepartment() : null);
        dto.put("cycleId", topic.getCycle() != null ? topic.getCycle().getCycleId() : null);
        dto.put("createdAt", topic.getCreatedAt() != null ? topic.getCreatedAt().toString() : null);
        dto.put("reviewedAt", topic.getReviewedAt() != null ? topic.getReviewedAt().toString() : null);
        return dto;
    }

    private Map<String, Object> buildStudentBrowseDto(SupervisorTopic topic) {
        Map<String, Object> dto = buildDto(topic);
        dto.remove("feedback");
        return dto;
    }

    private FypCycle activeFyp1Cycle() {
        return cycleRepository.findAll().stream()
                .filter(c -> c.getStatus() == CycleStatus.ACTIVE
                        && c.getCycleType() != null
                        && c.getCycleType().equalsIgnoreCase("FYP1"))
                .findFirst()
                .orElse(null);
    }

    private String stringOrThrow(Map<String, Object> data, String key, String message) {
        Object v = data.get(key);
        if (v == null || v.toString().isBlank()) throw new BadRequestException(message);
        return v.toString();
    }
}
