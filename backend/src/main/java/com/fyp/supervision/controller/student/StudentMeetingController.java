package com.fyp.supervision.controller.student;

import com.fyp.supervision.entity.Meeting;
import com.fyp.supervision.entity.Project;
import com.fyp.supervision.enums.MeetingStatus;
import com.fyp.supervision.exception.BadRequestException;
import com.fyp.supervision.exception.ResourceNotFoundException;
import com.fyp.supervision.repository.MeetingRepository;
import com.fyp.supervision.repository.ProjectRepository;
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

    @PostMapping
    public ResponseEntity<?> createMeeting(@AuthenticationPrincipal UserDetails user, @RequestBody Map<String, Object> data) {
        Long userId = Long.parseLong(user.getUsername());
        studentAccessService.requireActiveCycle(userId);
        Project project = projectRepository.findByStudent_UserId(userId)
                .orElseThrow(() -> new BadRequestException("No active project found."));

        Meeting meeting = Meeting.builder()
                .project(project)
                .requestedBy(project.getStudent())
                .title((String) data.get("title"))
                .agenda((String) data.get("agenda"))
                .platform((String) data.get("platform"))
                .location((String) data.get("location"))
                .durationMinutes(data.get("duration") != null ? ((Number) data.get("duration")).intValue() : 60)
                .status(MeetingStatus.PROPOSED)
                .build();

        if (data.get("proposedStartAt") != null) {
            meeting.setProposedStartAt(LocalDateTime.parse(data.get("proposedStartAt").toString()));
        }

        Meeting saved = meetingRepository.save(meeting);
        return ResponseEntity.ok(studentService.buildMeetingDto(saved));
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
     * Export the student's meetings. Always returns CSV; the frontend's format flag
     * is accepted for future PDF/ICAL support but not used yet (CSV opens in Excel
     * and any spreadsheet, so it's the safe default).
     */
    @PostMapping("/export")
    public ResponseEntity<byte[]> exportMeetings(
            @AuthenticationPrincipal UserDetails user,
            @RequestBody(required = false) Map<String, Object> params) {
        Long userId = Long.parseLong(user.getUsername());
        List<Meeting> meetings = meetingRepository.findAllByStudentUserId(userId);

        // Optional status filter
        String statusFilter = params != null ? (String) params.get("status") : null;
        if (statusFilter != null && !statusFilter.isBlank()) {
            MeetingStatus s;
            try { s = MeetingStatus.valueOf(statusFilter); }
            catch (IllegalArgumentException e) { throw new BadRequestException("Invalid status filter."); }
            meetings = meetings.stream().filter(m -> m.getStatus() == s).toList();
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

    private static String csvField(String raw) {
        if (raw == null) return "";
        String escaped = raw.replace("\"", "\"\"");
        if (escaped.contains(",") || escaped.contains("\n") || escaped.contains("\"")) {
            return "\"" + escaped + "\"";
        }
        return escaped;
    }
}
