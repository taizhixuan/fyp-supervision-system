package com.fyp.supervision.controller.supervisor;

import com.fyp.supervision.entity.MeetingLog;
import com.fyp.supervision.service.MeetingLogService;
import com.fyp.supervision.service.SupervisorService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/supervisor/meeting-logs")
@RequiredArgsConstructor
public class SupervisorMeetingLogController {
    private final SupervisorService supervisorService;
    private final MeetingLogService meetingLogService;

    @GetMapping
    public ResponseEntity<?> getMeetingLogs(@AuthenticationPrincipal UserDetails user, @RequestParam(required = false) String status) {
        Long userId = Long.parseLong(user.getUsername());
        List<MeetingLog> logs = supervisorService.getMeetingLogs(userId, status);
        return ResponseEntity.ok(Map.of("logs", logs));
    }

    @GetMapping("/{id}")
    public ResponseEntity<MeetingLog> getLog(@PathVariable Long id) {
        return ResponseEntity.ok(meetingLogService.getLog(id));
    }

    @PutMapping("/{id}/comments")
    public ResponseEntity<MeetingLog> addComments(@AuthenticationPrincipal UserDetails user, @PathVariable Long id, @RequestBody Map<String, Object> data) {
        Long userId = Long.parseLong(user.getUsername());
        return ResponseEntity.ok(meetingLogService.addSupervisorComments(id, userId, (String) data.get("supervisorComments")));
    }

    @PostMapping("/{id}/request-correction")
    public ResponseEntity<MeetingLog> requestCorrection(@AuthenticationPrincipal UserDetails user, @PathVariable Long id, @RequestBody Map<String, Object> data) {
        Long userId = Long.parseLong(user.getUsername());
        return ResponseEntity.ok(meetingLogService.requestCorrection(id, userId, (String) data.get("correctionReason")));
    }

    @PostMapping("/{id}/sign")
    public ResponseEntity<MeetingLog> signLog(@AuthenticationPrincipal UserDetails user, @PathVariable Long id, @RequestBody Map<String, Object> data) {
        Long userId = Long.parseLong(user.getUsername());
        return ResponseEntity.ok(meetingLogService.signLog(id, userId, data));
    }
}
