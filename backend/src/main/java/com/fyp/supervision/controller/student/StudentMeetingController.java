package com.fyp.supervision.controller.student;

import com.fyp.supervision.entity.Meeting;
import com.fyp.supervision.enums.MeetingStatus;
import com.fyp.supervision.exception.BadRequestException;
import com.fyp.supervision.exception.ResourceNotFoundException;
import com.fyp.supervision.repository.MeetingRepository;
import com.fyp.supervision.repository.ProjectRepository;
import com.fyp.supervision.entity.Project;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
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

    @GetMapping
    public ResponseEntity<Page<Meeting>> getMeetings(
            @AuthenticationPrincipal UserDetails user,
            @RequestParam(required = false) String status,
            Pageable pageable) {
        Long userId = Long.parseLong(user.getUsername());
        if (status != null && !status.isBlank()) {
            return ResponseEntity.ok(meetingRepository.findByStudentUserIdAndStatus(userId, MeetingStatus.valueOf(status), pageable));
        }
        return ResponseEntity.ok(meetingRepository.findByStudentUserId(userId, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Meeting> getMeeting(@PathVariable Long id) {
        return ResponseEntity.ok(meetingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Meeting not found")));
    }

    @PostMapping
    public ResponseEntity<?> createMeeting(@AuthenticationPrincipal UserDetails user, @RequestBody Map<String, Object> data) {
        Long userId = Long.parseLong(user.getUsername());
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
        return ResponseEntity.ok(saved);
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<Void> cancelMeeting(@AuthenticationPrincipal UserDetails user, @PathVariable Long id, @RequestBody(required = false) Map<String, Object> data) {
        Meeting meeting = meetingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Meeting not found"));
        meeting.setStatus(MeetingStatus.CANCELLED);
        if (data != null && data.get("reason") != null) {
            meeting.setCancelReason((String) data.get("reason"));
        }
        meetingRepository.save(meeting);
        return ResponseEntity.noContent().build();
    }
}
