package com.fyp.supervision.controller.supervisor;

import com.fyp.supervision.entity.Meeting;
import com.fyp.supervision.enums.MeetingStatus;
import com.fyp.supervision.exception.BadRequestException;
import com.fyp.supervision.repository.MeetingRepository;
import com.fyp.supervision.service.NotificationService;
import com.fyp.supervision.service.SupervisorAccessService;
import com.fyp.supervision.service.SupervisorService;
import lombok.RequiredArgsConstructor;
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

    @GetMapping
    public ResponseEntity<?> getMeetings(@AuthenticationPrincipal UserDetails user, @RequestParam(required = false) String status) {
        Long userId = Long.parseLong(user.getUsername());
        List<Map<String, Object>> meetings = supervisorService.getMeetingDtos(userId, status);
        return ResponseEntity.ok(Map.of("meetings", meetings, "total", meetings.size()));
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

    @PostMapping("/{id}/complete")
    public ResponseEntity<?> completeMeeting(@AuthenticationPrincipal UserDetails user, @PathVariable Long id, @RequestBody Map<String, Object> data) {
        Long userId = Long.parseLong(user.getUsername());
        Meeting meeting = access.requireOwnMeeting(userId, id);
        meeting.setStatus(MeetingStatus.COMPLETED);
        if (data.get("notes") != null) meeting.setNotes((String) data.get("notes"));
        meetingRepository.save(meeting);
        return ResponseEntity.ok(Map.of("success", true));
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
