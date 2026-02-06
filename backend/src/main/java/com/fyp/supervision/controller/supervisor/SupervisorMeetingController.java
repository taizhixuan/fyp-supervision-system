package com.fyp.supervision.controller.supervisor;

import com.fyp.supervision.entity.Meeting;
import com.fyp.supervision.enums.MeetingStatus;
import com.fyp.supervision.exception.ResourceNotFoundException;
import com.fyp.supervision.repository.MeetingRepository;
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
    private final MeetingRepository meetingRepository;

    @GetMapping
    public ResponseEntity<?> getMeetings(@AuthenticationPrincipal UserDetails user, @RequestParam(required = false) String status) {
        Long userId = Long.parseLong(user.getUsername());
        List<Map<String, Object>> meetings = supervisorService.getMeetingDtos(userId, status);
        return ResponseEntity.ok(Map.of("meetings", meetings, "total", meetings.size()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getMeeting(@PathVariable Long id) {
        Meeting meeting = meetingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Meeting not found"));
        return ResponseEntity.ok(supervisorService.buildSupervisorMeetingDto(meeting));
    }

    @PostMapping("/{id}/respond")
    public ResponseEntity<?> respondToMeeting(@PathVariable Long id, @RequestBody Map<String, Object> data) {
        Meeting meeting = meetingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Meeting not found"));
        String action = (String) data.get("action");
        if ("CONFIRM".equalsIgnoreCase(action)) {
            meeting.setStatus(MeetingStatus.CONFIRMED);
            if (data.get("confirmedDateTime") != null) {
                meeting.setConfirmedStartAt(LocalDateTime.parse(data.get("confirmedDateTime").toString()));
            }
        } else {
            meeting.setStatus(MeetingStatus.CANCELLED);
        }
        if (data.get("notes") != null) meeting.setNotes((String) data.get("notes"));
        meetingRepository.save(meeting);
        return ResponseEntity.ok(Map.of("success", true));
    }

    @PostMapping("/{id}/complete")
    public ResponseEntity<?> completeMeeting(@PathVariable Long id, @RequestBody Map<String, Object> data) {
        Meeting meeting = meetingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Meeting not found"));
        meeting.setStatus(MeetingStatus.COMPLETED);
        if (data.get("notes") != null) meeting.setNotes((String) data.get("notes"));
        meetingRepository.save(meeting);
        return ResponseEntity.ok(Map.of("success", true));
    }
}
