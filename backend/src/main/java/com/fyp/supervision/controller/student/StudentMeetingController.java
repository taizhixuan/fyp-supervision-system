package com.fyp.supervision.controller.student;

import com.fyp.supervision.entity.Meeting;
import com.fyp.supervision.entity.Project;
import com.fyp.supervision.enums.MeetingStatus;
import com.fyp.supervision.exception.BadRequestException;
import com.fyp.supervision.exception.ResourceNotFoundException;
import com.fyp.supervision.repository.MeetingRepository;
import com.fyp.supervision.repository.ProjectRepository;
import com.fyp.supervision.service.ActionItemService;
import com.fyp.supervision.service.MeetingCalendarService;
import com.fyp.supervision.service.NotificationService;
import com.fyp.supervision.service.StudentAccessService;
import com.fyp.supervision.service.StudentService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/student/meetings")
@RequiredArgsConstructor
public class StudentMeetingController {
    private final MeetingRepository meetingRepository;
    private final ProjectRepository projectRepository;
    private final StudentService studentService;
    private final StudentAccessService studentAccessService;
    private final NotificationService notificationService;
    private final MeetingCalendarService meetingCalendarService;
    private final ActionItemService actionItemService;

    @GetMapping
    public ResponseEntity<?> getMeetings(
            @AuthenticationPrincipal UserDetails user,
            @RequestParam(required = false) String status,
            Pageable pageable) {
        Long userId = Long.parseLong(user.getUsername());
        return ResponseEntity.ok(studentService.getMeetingsDto(userId, status, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getMeeting(@AuthenticationPrincipal UserDetails user, @PathVariable Long id) {
        Long userId = Long.parseLong(user.getUsername());
        return ResponseEntity.ok(studentService.getMeetingDto(userId, id));
    }

    /** Single meeting as an .ics file (Apple Calendar / any calendar app). */
    @GetMapping("/{id}/calendar.ics")
    public ResponseEntity<byte[]> getMeetingIcs(@AuthenticationPrincipal UserDetails user, @PathVariable Long id) {
        Long userId = Long.parseLong(user.getUsername());
        studentService.getMeetingDto(userId, id); // ownership check
        Meeting meeting = meetingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Meeting not found"));
        return icsResponse(meetingCalendarService.buildIcsBytes(List.of(meeting), "FYP Meeting"),
                "meeting-" + id + ".ics");
    }

    /** Action items raised in this meeting + items still open from earlier meetings. */
    @GetMapping("/{id}/action-items")
    public ResponseEntity<?> getMeetingActionItems(@AuthenticationPrincipal UserDetails user, @PathVariable Long id) {
        Long userId = Long.parseLong(user.getUsername());
        studentService.getMeetingDto(userId, id); // ownership check
        Meeting meeting = meetingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Meeting not found"));
        return ResponseEntity.ok(actionItemService.forMeeting(meeting));
    }

    @PostMapping
    public ResponseEntity<?> createMeeting(@AuthenticationPrincipal UserDetails user, @RequestBody Map<String, Object> data) {
        Long userId = Long.parseLong(user.getUsername());
        studentAccessService.requireActiveCycle(userId);
        Project project = projectRepository.findByStudent_UserId(userId)
                .orElseThrow(() -> new BadRequestException("No active project found."));

        int durationMinutes = 60;
        Object durationRaw = data.get("duration");
        if (durationRaw instanceof Number n) {
            durationMinutes = n.intValue();
        } else if (durationRaw != null) {
            try {
                durationMinutes = Integer.parseInt(durationRaw.toString().trim());
            } catch (NumberFormatException e) {
                throw new BadRequestException("duration must be a number");
            }
        }

        Meeting meeting = Meeting.builder()
                .project(project)
                .requestedBy(project.getStudent())
                .title((String) data.get("title"))
                .agenda((String) data.get("agenda"))
                .platform((String) data.get("platform"))
                .location((String) data.get("location"))
                .durationMinutes(durationMinutes)
                .status(MeetingStatus.PROPOSED)
                .build();

        if (data.get("proposedStartAt") != null) {
            try {
                meeting.setProposedStartAt(LocalDateTime.parse(data.get("proposedStartAt").toString()));
            } catch (java.time.format.DateTimeParseException e) {
                throw new BadRequestException("proposedStartAt is not a valid date-time");
            }
        }

        Meeting saved = meetingRepository.save(meeting);
        return ResponseEntity.ok(studentService.buildMeetingDto(saved));
    }

    /**
     * Student responds to a supervisor-proposed/rescheduled meeting.
     * action ∈ {ACCEPT, DECLINE, RESCHEDULE}.
     */
    @PostMapping("/{id}/respond")
    public ResponseEntity<?> respond(@AuthenticationPrincipal UserDetails user, @PathVariable Long id, @RequestBody Map<String, Object> data) {
        Long userId = Long.parseLong(user.getUsername());
        studentAccessService.requireActiveCycle(userId);
        Meeting meeting = meetingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Meeting not found"));
        if (meeting.getProject() == null || meeting.getProject().getStudent() == null
                || !userId.equals(meeting.getProject().getStudent().getUserId())) {
            throw new BadRequestException("You can only respond to your own meetings.");
        }
        String action = data.get("action") == null ? "" : data.get("action").toString().toUpperCase();
        Long supervisorUserId = meeting.getProject().getSupervisor() != null
                ? meeting.getProject().getSupervisor().getUserId() : null;
        String supRoute = "/supervisor/meetings/" + id;

        switch (action) {
            case "ACCEPT" -> {
                LocalDateTime start = meeting.getProposedStartAt();
                if (start == null) throw new BadRequestException("Meeting has no proposed time to accept.");
                meeting.setStatus(MeetingStatus.CONFIRMED);
                meeting.setConfirmedStartAt(start);
                if (meeting.getDurationMinutes() != null) {
                    meeting.setConfirmedEndAt(start.plusMinutes(meeting.getDurationMinutes()));
                }
                if (supervisorUserId != null) {
                    notificationService.createNotification(supervisorUserId, "MEETING",
                            "Student accepted meeting",
                            "Student accepted: " + meeting.getTitle(), supRoute);
                }
            }
            case "DECLINE" -> {
                String reason = data.get("reason") == null ? "" : data.get("reason").toString().trim();
                if (reason.isEmpty()) throw new BadRequestException("reason is required when declining");
                meeting.setStatus(MeetingStatus.CANCELLED);
                meeting.setCancelReason(reason);
                if (supervisorUserId != null) {
                    notificationService.createNotification(supervisorUserId, "MEETING",
                            "Student declined meeting",
                            "Student declined: " + meeting.getTitle(), supRoute);
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
                if (supervisorUserId != null) {
                    notificationService.createNotification(supervisorUserId, "MEETING",
                            "Student proposed a new time",
                            "Student proposed reschedule: " + meeting.getTitle(), supRoute);
                }
            }
            default -> throw new BadRequestException("Invalid action: must be ACCEPT, DECLINE or RESCHEDULE");
        }
        meetingRepository.save(meeting);
        return ResponseEntity.ok(studentService.buildMeetingDto(meeting));
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<Void> cancelMeeting(@AuthenticationPrincipal UserDetails user, @PathVariable Long id, @RequestBody(required = false) Map<String, Object> data) {
        Long userId = Long.parseLong(user.getUsername());
        studentAccessService.requireActiveCycle(userId);
        Meeting meeting = meetingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Meeting not found"));
        if (meeting.getProject() == null || meeting.getProject().getStudent() == null
                || !userId.equals(meeting.getProject().getStudent().getUserId())) {
            throw new BadRequestException("You can only cancel your own meetings.");
        }

        String reason = data != null && data.get("reason") != null ? ((String) data.get("reason")).trim() : "";
        if (reason.isEmpty()) {
            throw new BadRequestException("Cancellation reason is required.");
        }
        if (reason.length() > 500) {
            throw new BadRequestException("Cancellation reason must be 500 characters or fewer.");
        }

        meeting.setStatus(MeetingStatus.CANCELLED);
        meeting.setCancelReason(reason);
        meetingRepository.save(meeting);
        return ResponseEntity.noContent().build();
    }

    /**
     * Export the student's meetings. format=ICAL returns an .ics calendar file;
     * anything else returns CSV (opens in Excel and any spreadsheet).
     */
    @PostMapping("/export")
    public ResponseEntity<byte[]> exportMeetings(
            @AuthenticationPrincipal UserDetails user,
            @RequestBody(required = false) Map<String, Object> params) {
        Long userId = Long.parseLong(user.getUsername());
        List<Meeting> meetings = meetingRepository.findAllByStudentUserId(userId);

        // Optional status filter ("PENDING" is the UI's name for PROPOSED)
        String statusFilter = params != null && params.get("status") != null ? params.get("status").toString() : null;
        if (statusFilter != null && !statusFilter.isBlank() && !"all".equalsIgnoreCase(statusFilter)) {
            String normalised = "PENDING".equalsIgnoreCase(statusFilter) ? "PROPOSED" : statusFilter.toUpperCase();
            MeetingStatus s;
            try { s = MeetingStatus.valueOf(normalised); }
            catch (IllegalArgumentException e) { throw new BadRequestException("Invalid status filter."); }
            meetings = meetings.stream().filter(m -> m.getStatus() == s).toList();
        }

        // Optional date range on the meeting's start (confirmed, else proposed)
        LocalDate[] range = exportRange(params);
        if (range != null) {
            LocalDate from = range[0], to = range[1];
            meetings = meetings.stream().filter(m -> {
                LocalDateTime start = m.getConfirmedStartAt() != null ? m.getConfirmedStartAt() : m.getProposedStartAt();
                if (start == null) return false;
                LocalDate d = start.toLocalDate();
                return (from == null || !d.isBefore(from)) && (to == null || !d.isAfter(to));
            }).toList();
        }

        String format = params != null && params.get("format") != null ? params.get("format").toString() : "CSV";
        if ("ICAL".equalsIgnoreCase(format)) {
            return icsResponse(meetingCalendarService.buildIcsBytes(meetings, "FYP Meetings"),
                    "meetings-" + LocalDate.now() + ".ics");
        }

        boolean includeAgenda = params == null || !Boolean.FALSE.equals(params.get("includeAgenda"));
        boolean includeNotes  = params == null || !Boolean.FALSE.equals(params.get("includeNotes"));

        StringBuilder csv = new StringBuilder();
        csv.append("Meeting ID,Title,Status,Proposed Start,Confirmed Start,Platform,Location,Duration (min)");
        if (includeAgenda) csv.append(",Agenda");
        if (includeNotes) csv.append(",Notes");
        csv.append('\n');

        for (Meeting m : meetings) {
            csv.append(m.getMeetingId()).append(',')
               .append(csvField(m.getTitle())).append(',')
               .append(m.getStatus().name()).append(',')
               .append(m.getProposedStartAt() != null ? m.getProposedStartAt().toString() : "").append(',')
               .append(m.getConfirmedStartAt() != null ? m.getConfirmedStartAt().toString() : "").append(',')
               .append(csvField(m.getPlatform())).append(',')
               .append(csvField(m.getLocation())).append(',')
               .append(m.getDurationMinutes() != null ? m.getDurationMinutes() : "");
            if (includeAgenda) csv.append(',').append(csvField(m.getAgenda()));
            if (includeNotes)  csv.append(',').append(csvField(m.getNotes()));
            csv.append('\n');
        }

        byte[] body = csv.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8);
        String fileName = "meetings-" + LocalDate.now() + ".csv";
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body(body);
    }

    /**
     * dateRange: all | this_month | last_3_months | last_6_months | custom (startDate/endDate,
     * either may be blank). Returns null for "no date filter".
     */
    public static LocalDate[] exportRange(Map<String, Object> params) {
        if (params == null || params.get("dateRange") == null) return null;
        LocalDate today = LocalDate.now();
        return switch (params.get("dateRange").toString()) {
            case "this_month" -> new LocalDate[]{today.withDayOfMonth(1), today.withDayOfMonth(today.lengthOfMonth())};
            case "last_3_months" -> new LocalDate[]{today.minusMonths(3), today};
            case "last_6_months" -> new LocalDate[]{today.minusMonths(6), today};
            case "custom" -> {
                LocalDate from = parseDate(params.get("startDate"), "startDate");
                LocalDate to = parseDate(params.get("endDate"), "endDate");
                if (from != null && to != null && to.isBefore(from)) {
                    throw new BadRequestException("endDate must be on or after startDate.");
                }
                yield (from == null && to == null) ? null : new LocalDate[]{from, to};
            }
            default -> null;
        };
    }

    private static LocalDate parseDate(Object raw, String field) {
        if (raw == null || raw.toString().isBlank()) return null;
        try {
            return LocalDate.parse(raw.toString().substring(0, Math.min(10, raw.toString().length())));
        } catch (java.time.format.DateTimeParseException e) {
            throw new BadRequestException(field + " must be YYYY-MM-DD.");
        }
    }

    private static ResponseEntity<byte[]> icsResponse(byte[] body, String fileName) {
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
                .contentType(MediaType.parseMediaType("text/calendar; charset=UTF-8"))
                .body(body);
    }

    private static String csvField(String raw) {
        if (raw == null) return "";
        String escaped = raw.replace("\"", "\"\"");
        if (escaped.contains(",") || escaped.contains("\n") || escaped.contains("\"")) {
            return "\"" + escaped + "\"";
        }
        return escaped;
    }
}
