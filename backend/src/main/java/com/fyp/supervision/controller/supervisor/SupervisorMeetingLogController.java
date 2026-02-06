package com.fyp.supervision.controller.supervisor;

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
        List<Map<String, Object>> logs = supervisorService.getLogDtos(userId, status);
        return ResponseEntity.ok(Map.of("logs", logs, "total", logs.size()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getLog(@PathVariable Long id) {
        return ResponseEntity.ok(supervisorService.buildLogForReviewDto(meetingLogService.getLog(id)));
    }

    @PutMapping("/{id}/comments")
    public ResponseEntity<?> addComments(@AuthenticationPrincipal UserDetails user, @PathVariable Long id, @RequestBody Map<String, Object> data) {
        Long userId = Long.parseLong(user.getUsername());
        var log = meetingLogService.addSupervisorComments(id, userId, (String) data.get("supervisorComments"));
        return ResponseEntity.ok(supervisorService.buildLogForReviewDto(log));
    }

    @PostMapping("/{id}/request-correction")
    public ResponseEntity<?> requestCorrection(@AuthenticationPrincipal UserDetails user, @PathVariable Long id, @RequestBody Map<String, Object> data) {
        Long userId = Long.parseLong(user.getUsername());
        var log = meetingLogService.requestCorrection(id, userId, (String) data.get("correctionReason"));
        return ResponseEntity.ok(supervisorService.buildLogForReviewDto(log));
    }

    @PostMapping("/{id}/sign")
    public ResponseEntity<?> signLog(@AuthenticationPrincipal UserDetails user, @PathVariable Long id, @RequestBody Map<String, Object> data) {
        Long userId = Long.parseLong(user.getUsername());
        var log = meetingLogService.signLog(id, userId, data);
        return ResponseEntity.ok(supervisorService.buildLogForReviewDto(log));
    }
}
