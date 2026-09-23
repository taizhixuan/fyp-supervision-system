package com.fyp.supervision.service;

import com.fyp.supervision.entity.Meeting;
import com.fyp.supervision.entity.MeetingActionItem;
import com.fyp.supervision.entity.Project;
import com.fyp.supervision.entity.UserAccount;
import com.fyp.supervision.exception.BadRequestException;
import com.fyp.supervision.exception.ForbiddenException;
import com.fyp.supervision.exception.ResourceNotFoundException;
import com.fyp.supervision.repository.MeetingActionItemRepository;
import com.fyp.supervision.repository.UserAccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.util.*;

/**
 * Action items agreed in meetings. They belong to the project, not just the meeting,
 * so anything still OPEN shows up again on the next meeting ("carried over").
 */
@Service
@RequiredArgsConstructor
public class ActionItemService {

    private static final int MAX_LENGTH = 500;

    private final MeetingActionItemRepository repository;
    private final UserAccountRepository userAccountRepository;
    private final NotificationService notificationService;

    @Transactional
    public List<MeetingActionItem> createForMeeting(Meeting meeting, Collection<String> descriptions, Long createdByUserId) {
        if (descriptions == null || descriptions.isEmpty()) return List.of();
        UserAccount creator = createdByUserId != null ? userAccountRepository.findById(createdByUserId).orElse(null) : null;
        List<MeetingActionItem> saved = new ArrayList<>();
        for (String raw : descriptions) {
            String d = clean(raw);
            if (d == null) continue;
            saved.add(repository.save(MeetingActionItem.builder()
                    .project(meeting.getProject())
                    .meeting(meeting)
                    .description(d)
                    .createdBy(creator)
                    .build()));
        }
        return saved;
    }

    @Transactional
    public MeetingActionItem addToMeeting(Meeting meeting, Map<String, Object> data, Long createdByUserId) {
        String d = clean(data.get("description") == null ? null : data.get("description").toString());
        if (d == null) throw new BadRequestException("description is required");
        MeetingActionItem item = MeetingActionItem.builder()
                .project(meeting.getProject())
                .meeting(meeting)
                .description(d)
                .dueDate(parseDate(data.get("dueDate")))
                .createdBy(createdByUserId != null ? userAccountRepository.findById(createdByUserId).orElse(null) : null)
                .build();
        MeetingActionItem saved = repository.save(item);
        Project p = meeting.getProject();
        if (p != null && p.getStudent() != null) {
            notificationService.createNotification(p.getStudent().getUserId(), "MEETING",
                    "New action item", "Your supervisor added an action item: " + d,
                    "/student/meetings/" + meeting.getMeetingId());
        }
        return saved;
    }

    /** Items raised in this meeting, plus OPEN items from other meetings of the same project. */
    public Map<String, Object> forMeeting(Meeting meeting) {
        Long projectId = meeting.getProject().getProjectId();
        List<Map<String, Object>> fromMeeting = repository.findByMeeting_MeetingIdOrderByCreatedAtAsc(meeting.getMeetingId())
                .stream().map(this::toDto).toList();
        List<Map<String, Object>> carriedOver = repository
                .findByProject_ProjectIdAndStatusOrderByCreatedAtAsc(projectId, MeetingActionItem.OPEN).stream()
                .filter(i -> i.getMeeting() == null || !i.getMeeting().getMeetingId().equals(meeting.getMeetingId()))
                .map(this::toDto).toList();
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("items", fromMeeting);
        result.put("carriedOver", carriedOver);
        return result;
    }

    /** All items of a project, open first (oldest first), then done (latest first). */
    public Map<String, Object> forProject(Long projectId) {
        List<MeetingActionItem> all = repository.findByProject_ProjectIdOrderByCreatedAtDesc(projectId);
        List<Map<String, Object>> open = all.stream().filter(i -> MeetingActionItem.OPEN.equals(i.getStatus()))
                .sorted(Comparator.comparing(MeetingActionItem::getCreatedAt))
                .map(this::toDto).toList();
        List<Map<String, Object>> done = all.stream().filter(i -> MeetingActionItem.DONE.equals(i.getStatus()))
                .sorted(Comparator.comparing(MeetingActionItem::getCompletedAt,
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .limit(20)
                .map(this::toDto).toList();
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("open", open);
        result.put("done", done);
        result.put("openCount", open.size());
        return result;
    }

    public List<String> descriptionsForMeeting(Long meetingId) {
        return repository.findByMeeting_MeetingIdOrderByCreatedAtAsc(meetingId).stream()
                .map(MeetingActionItem::getDescription).toList();
    }

    /** Both parties of the project may tick an item off or reopen it. */
    @Transactional
    public MeetingActionItem setStatus(Long itemId, Long userId, Object statusRaw) {
        MeetingActionItem item = requireParticipant(itemId, userId);
        String status = statusRaw == null ? "" : statusRaw.toString().trim().toUpperCase();
        if (!MeetingActionItem.OPEN.equals(status) && !MeetingActionItem.DONE.equals(status)) {
            throw new BadRequestException("status must be OPEN or DONE");
        }
        if (status.equals(item.getStatus())) return item;
        item.setStatus(status);
        if (MeetingActionItem.DONE.equals(status)) {
            item.setCompletedAt(LocalDateTime.now());
            item.setCompletedBy(userAccountRepository.findById(userId).orElse(null));
            Project p = item.getProject();
            // Tell the supervisor when the student closes one.
            if (p.getSupervisor() != null && p.getStudent() != null && userId.equals(p.getStudent().getUserId())) {
                notificationService.createNotification(p.getSupervisor().getUserId(), "MEETING",
                        "Action item completed",
                        p.getStudent().getFullName() + " completed: " + item.getDescription(),
                        item.getMeeting() != null ? "/supervisor/meetings/" + item.getMeeting().getMeetingId() : "/supervisor/meetings");
            }
        } else {
            item.setCompletedAt(null);
            item.setCompletedBy(null);
        }
        return repository.save(item);
    }

    @Transactional
    public void delete(Long itemId, Long supervisorUserId) {
        MeetingActionItem item = repository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Action item not found"));
        Project p = item.getProject();
        if (p.getSupervisor() == null || !supervisorUserId.equals(p.getSupervisor().getUserId())) {
            throw new ForbiddenException("You can only delete action items of your own supervisees.");
        }
        repository.delete(item);
    }

    public MeetingActionItem requireParticipant(Long itemId, Long userId) {
        MeetingActionItem item = repository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Action item not found"));
        Project p = item.getProject();
        boolean isStudent = p.getStudent() != null && userId.equals(p.getStudent().getUserId());
        boolean isSupervisor = p.getSupervisor() != null && userId.equals(p.getSupervisor().getUserId());
        if (!isStudent && !isSupervisor) {
            throw new ForbiddenException("You can only update action items of your own project.");
        }
        return item;
    }

    public Map<String, Object> toDto(MeetingActionItem i) {
        Map<String, Object> dto = new LinkedHashMap<>();
        dto.put("actionItemId", i.getActionItemId());
        dto.put("description", i.getDescription());
        dto.put("status", i.getStatus());
        dto.put("dueDate", i.getDueDate() != null ? i.getDueDate().toString() : null);
        Meeting m = i.getMeeting();
        dto.put("meetingId", m != null ? m.getMeetingId() : null);
        dto.put("meetingTitle", m != null ? m.getTitle() : null);
        LocalDateTime when = m == null ? null : (m.getConfirmedStartAt() != null ? m.getConfirmedStartAt() : m.getProposedStartAt());
        dto.put("meetingDate", when != null ? when.toString() : null);
        dto.put("createdAt", i.getCreatedAt() != null ? i.getCreatedAt().toString() : null);
        dto.put("completedAt", i.getCompletedAt() != null ? i.getCompletedAt().toString() : null);
        dto.put("completedByName", i.getCompletedBy() != null ? i.getCompletedBy().getFullName() : null);
        dto.put("overdue", MeetingActionItem.OPEN.equals(i.getStatus()) && i.getDueDate() != null
                && i.getDueDate().isBefore(LocalDate.now()));
        return dto;
    }

    /** Accepts a list or a newline-separated string (the supervisor complete modal sends a list). */
    public static List<String> parseDescriptions(Object raw) {
        if (raw == null) return List.of();
        List<String> out = new ArrayList<>();
        if (raw instanceof Collection<?> c) {
            for (Object o : c) if (o != null) out.add(o.toString());
        } else {
            out.addAll(Arrays.asList(raw.toString().split("\\r?\\n")));
        }
        return out.stream().map(ActionItemService::clean).filter(Objects::nonNull).toList();
    }

    private static String clean(String raw) {
        if (raw == null) return null;
        String d = raw.trim().replaceFirst("^[-*•]\\s*", "").trim();
        if (d.isEmpty()) return null;
        return d.length() > MAX_LENGTH ? d.substring(0, MAX_LENGTH) : d;
    }

    private static LocalDate parseDate(Object raw) {
        if (raw == null || raw.toString().isBlank()) return null;
        try {
            return LocalDate.parse(raw.toString().substring(0, Math.min(10, raw.toString().length())));
        } catch (DateTimeParseException e) {
            throw new BadRequestException("dueDate must be YYYY-MM-DD");
        }
    }
}
