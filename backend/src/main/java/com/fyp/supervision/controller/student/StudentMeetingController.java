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
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
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
    public ResponseEntity<?> getMeeting(@PathVariable Long id) {
        return ResponseEntity.ok(studentService.getMeetingDto(id));
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
}
