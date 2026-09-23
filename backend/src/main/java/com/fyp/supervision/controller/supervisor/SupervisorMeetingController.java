package com.fyp.supervision.controller.supervisor;

import com.fyp.supervision.entity.Meeting;
import com.fyp.supervision.enums.MeetingStatus;
import com.fyp.supervision.exception.BadRequestException;
import com.fyp.supervision.repository.MeetingRepository;
import com.fyp.supervision.service.ActionItemService;
import com.fyp.supervision.service.MeetingCalendarService;
import com.fyp.supervision.service.MeetingLogDraftService;
import com.fyp.supervision.service.NotificationService;
import com.fyp.supervision.service.SupervisorAccessService;
import com.fyp.supervision.service.SupervisorService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/supervisor/meetings")
@RequiredArgsConstructor
public class SupervisorMeetingController {
    private final SupervisorService supervisorService;
    private final SupervisorAccessService access;
    private final MeetingRepository meetingRepository;
    private final NotificationService notificationService;
    private final MeetingCalendarService meetingCalendarService;
    private final ActionItemService actionItemService;
    private final MeetingLogDraftService meetingLogDraftService;

    @GetMapping
    public ResponseEntity<?> getMeetings(@AuthenticationPrincipal UserDetails user, @RequestParam(required = false) String status) {
        Long userId = Long.parseLong(user.getUsername());
        List<Map<String, Object>> meetings = supervisorService.getMeetingDtos(userId, status);
        return ResponseEntity.ok(Map.of("meetings", meetings, "total", meetings.size()));
    }

    /** All upcoming proposed/confirmed meetings as one .ics calendar file. */
    @GetMapping("/calendar.ics")
    public ResponseEntity<byte[]> getScheduleIcs(@AuthenticationPrincipal UserDetails user) {
        Long userId = Long.parseLong(user.getUsername());
        LocalDateTime now = LocalDateTime.now();
        List<Meeting> upcoming = meetingRepository.findBySupervisorUserId(userId).stream()
                .filter(m -> m.getStatus() == MeetingStatus.PROPOSED
                        || m.getStatus() == MeetingStatus.CONFIRMED
                        || m.getStatus() == MeetingStatus.RESCHEDULED)
                .filter(m -> {
                    LocalDateTime start = m.getConfirmedStartAt() != null ? m.getConfirmedStartAt() : m.getProposedStartAt();
                    return start != null && !start.isBefore(now.minusDays(1));
                })
                .toList();
        return icsResponse(meetingCalendarService.buildIcsBytes(upcoming, "FYP Supervision Meetings"),
                "my-meetings-" + now.toLocalDate() + ".ics");
    }

    /** Single meeting as an .ics file (Apple Calendar / any calendar app). */
    @GetMapping("/{id}/calendar.ics")
    public ResponseEntity<byte[]> getMeetingIcs(@AuthenticationPrincipal UserDetails user, @PathVariable Long id) {
        Long userId = Long.parseLong(user.getUsername());
        Meeting meeting = access.requireOwnMeeting(userId, id);
        return icsResponse(meetingCalendarService.buildIcsBytes(List.of(meeting), "FYP Meeting"),
                "meeting-" + id + ".ics");
    }

    private static ResponseEntity<byte[]> icsResponse(byte[] body, String fileName) {
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
                .contentType(MediaType.parseMediaType("text/calendar; charset=UTF-8"))
                .body(body);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getMeeting(@AuthenticationPrincipal UserDetails user, @PathVariable Long id) {
        Long userId = Long.parseLong(user.getUsername());
        Meeting meeting = access.requireOwnMeeting(userId, id);
        return ResponseEntity.ok(supervisorService.buildSupervisorMeetingDto(meeting));
    }

    @PostMapping
    public ResponseEntity<?> createMeeting(
            @AuthenticationPrincipal UserDetails user,
            @RequestBody Map<String, Object> data) {
        Long userId = Long.parseLong(user.getUsername());
        Map<String, Object> dto = supervisorService.createMeeting(userId, data);
        return ResponseEntity.ok(dto);
    }

    /**
     * Supervisor responds to a meeting. action ∈ {CONFIRM, CANCEL, RESCHEDULE}.
     * RESCHEDULE moves status back to PROPOSED with the supervisor's suggested
     * time + reason; the student is notified to accept or counter.
     */
    @PostMapping("/{id}/respond")
    public ResponseEntity<?> respondToMeeting(@AuthenticationPrincipal UserDetails user, @PathVariable Long id, @RequestBody Map<String, Object> data) {
        Long userId = Long.parseLong(user.getUsername());
        Meeting meeting = access.requireOwnMeeting(userId, id);
        String action = data.get("action") == null ? "" : data.get("action").toString().toUpperCase();
        Long studentUserId = (meeting.getProject() != null && meeting.getProject().getStudent() != null)
                ? meeting.getProject().getStudent().getUserId() : null;
        String detailRoute = "/student/meetings/" + id;

        switch (action) {
            case "CONFIRM" -> {
                meeting.setStatus(MeetingStatus.CONFIRMED);
                if (data.get("confirmedDateTime") != null) {
                    meeting.setConfirmedStartAt(LocalDateTime.parse(data.get("confirmedDateTime").toString()));
                } else if (meeting.getProposedStartAt() != null) {
                    meeting.setConfirmedStartAt(meeting.getProposedStartAt());
                }
                if (meeting.getConfirmedStartAt() != null && meeting.getDurationMinutes() != null) {
                    meeting.setConfirmedEndAt(meeting.getConfirmedStartAt()
                            .plusMinutes(meeting.getDurationMinutes()));
                }
                if (studentUserId != null) {
                    notificationService.createNotification(studentUserId, "MEETING",
                            "Meeting confirmed",
                            "Your supervisor confirmed: " + meeting.getTitle(),
                            detailRoute);
                }
            }
            case "CANCEL" -> {
                meeting.setStatus(MeetingStatus.CANCELLED);
                if (data.get("reason") != null) meeting.setCancelReason(data.get("reason").toString());
                if (studentUserId != null) {
                    notificationService.createNotification(studentUserId, "MEETING",
                            "Meeting cancelled",
                            "Your supervisor cancelled: " + meeting.getTitle(),
                            detailRoute);
                }
            }
            case "RESCHEDULE" -> {
                if (data.get("proposedDateTime") == null) {
                    throw new BadRequestException("proposedDateTime is required for RESCHEDULE");
                }
                meeting.setProposedStartAt(LocalDateTime.parse(data.get("proposedDateTime").toString()));
                meeting.setConfirmedStartAt(null);
                meeting.setConfirmedEndAt(null);
                meeting.setStatus(MeetingStatus.RESCHEDULED);
                if (data.get("reason") != null) meeting.setNotes(data.get("reason").toString());
                if (studentUserId != null) {
                    notificationService.createNotification(studentUserId, "MEETING",
                            "Meeting reschedule proposed",
                            "Supervisor proposed a new time for: " + meeting.getTitle(),
                            detailRoute);
                }
            }
            default -> throw new BadRequestException("Invalid action: must be CONFIRM, CANCEL or RESCHEDULE");
        }
        if (data.get("notes") != null) meeting.setNotes((String) data.get("notes"));
        meetingRepository.save(meeting);
        return ResponseEntity.ok(Map.of("success", true));
    }

    /**
     * Marks the meeting as held. Action items from the modal become trackable items, and
     * the student gets a pre-filled DRAFT meeting log (AI-polished in the background when
     * an LLM is configured).
     */
    @PostMapping("/{id}/complete")
    public ResponseEntity<?> completeMeeting(@AuthenticationPrincipal UserDetails user, @PathVariable Long id, @RequestBody Map<String, Object> data) {
        Long userId = Long.parseLong(user.getUsername());
        Meeting meeting = access.requireOwnMeeting(userId, id);
        if (meeting.getStatus() != MeetingStatus.CONFIRMED) {
            throw new BadRequestException("Only confirmed meetings can be marked as completed.");
        }
        meeting.setStatus(MeetingStatus.COMPLETED);
        if (data.get("notes") != null) meeting.setNotes((String) data.get("notes"));
        meetingRepository.save(meeting);

        List<String> items = ActionItemService.parseDescriptions(data.get("actionItems"));
        actionItemService.createForMeeting(meeting, items, userId);

        Long draftLogId = meetingLogDraftService.createDraftFromMeeting(meeting, items)
                .map(com.fyp.supervision.entity.MeetingLog::getLogId).orElse(null);
        if (draftLogId != null && meeting.getNotes() != null && !meeting.getNotes().isBlank()) {
            meetingLogDraftService.enhanceWithAiSummary(draftLogId, meeting.getMeetingId(), items);
        }
        Map<String, Object> body = new java.util.LinkedHashMap<>();
        body.put("success", true);
        body.put("actionItemsCreated", items.size());
        body.put("draftLogId", draftLogId);
        return ResponseEntity.ok(body);
    }

    /** The student did not turn up to a confirmed meeting that has already started. */
    @PostMapping("/{id}/no-show")
    public ResponseEntity<?> markNoShow(@AuthenticationPrincipal UserDetails user, @PathVariable Long id,
                                        @RequestBody(required = false) Map<String, Object> data) {
        Long userId = Long.parseLong(user.getUsername());
        Meeting meeting = access.requireOwnMeeting(userId, id);
        if (meeting.getStatus() != MeetingStatus.CONFIRMED) {
            throw new BadRequestException("Only confirmed meetings can be marked as a no-show.");
        }
        LocalDateTime start = meeting.getConfirmedStartAt() != null ? meeting.getConfirmedStartAt() : meeting.getProposedStartAt();
        if (start != null && start.isAfter(LocalDateTime.now())) {
            throw new BadRequestException("You can only mark a no-show after the meeting start time.");
        }
        String reason = data != null && data.get("reason") != null ? data.get("reason").toString().trim() : "";
        if (reason.length() > 500) throw new BadRequestException("Reason must be 500 characters or fewer.");
        meeting.setStatus(MeetingStatus.NO_SHOW);
        if (!reason.isEmpty()) meeting.setNotes(reason);
        meetingRepository.save(meeting);

        if (meeting.getProject() != null && meeting.getProject().getStudent() != null) {
            notificationService.createNotification(meeting.getProject().getStudent().getUserId(), "MEETING",
                    "Meeting marked as missed",
                    "Your supervisor marked \"" + meeting.getTitle() + "\" as a no-show."
                            + (reason.isEmpty() ? "" : " Note: " + reason)
                            + " Please request a new meeting.",
                    "/student/meetings/" + id);
        }
        return ResponseEntity.ok(Map.of("success", true));
    }

    @GetMapping("/{id}/action-items")
    public ResponseEntity<?> getActionItems(@AuthenticationPrincipal UserDetails user, @PathVariable Long id) {
        Long userId = Long.parseLong(user.getUsername());
        Meeting meeting = access.requireOwnMeeting(userId, id);
        return ResponseEntity.ok(actionItemService.forMeeting(meeting));
    }

    @PostMapping("/{id}/action-items")
    public ResponseEntity<?> addActionItem(@AuthenticationPrincipal UserDetails user, @PathVariable Long id,
                                           @RequestBody Map<String, Object> data) {
        Long userId = Long.parseLong(user.getUsername());
        Meeting meeting = access.requireOwnMeeting(userId, id);
        return ResponseEntity.ok(actionItemService.toDto(actionItemService.addToMeeting(meeting, data, userId)));
    }

    /**
     * Add or update meeting URL/platform AFTER the meeting is confirmed —
     * supervisors often confirm a slot first and create the link (Teams/Zoom)
     * just before the meeting. Doesn't change status.
     */
    @PatchMapping("/{id}/link")
    public ResponseEntity<?> setMeetingLink(@AuthenticationPrincipal UserDetails user, @PathVariable Long id, @RequestBody Map<String, Object> data) {
        Long userId = Long.parseLong(user.getUsername());
        Meeting meeting = access.requireOwnMeeting(userId, id);
        String url = data.get("meetingUrl") == null ? null : data.get("meetingUrl").toString().trim();
        if (url == null || url.isEmpty()) {
            throw new BadRequestException("meetingUrl is required");
        }
        meeting.setMeetingUrl(url);
        if (data.get("platform") != null) meeting.setPlatform(data.get("platform").toString());
        if (data.get("location") != null) meeting.setLocation(data.get("location").toString());
        meetingRepository.save(meeting);
        Long studentUserId = (meeting.getProject() != null && meeting.getProject().getStudent() != null)
                ? meeting.getProject().getStudent().getUserId() : null;
        if (studentUserId != null) {
            notificationService.createNotification(studentUserId, "MEETING",
                    "Meeting link added",
                    "Your supervisor added a meeting link for: " + meeting.getTitle(),
                    "/student/meetings/" + id);
        }
        return ResponseEntity.ok(supervisorService.buildSupervisorMeetingDto(meeting));
    }
}
