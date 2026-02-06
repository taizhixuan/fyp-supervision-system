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
@RequestMapping("/supervisor/logs")
@RequiredArgsConstructor
public class SupervisorLogController {
    private final SupervisorService supervisorService;
    private final MeetingLogService meetingLogService;

    @GetMapping
    public ResponseEntity<?> getLogs(@AuthenticationPrincipal UserDetails user) {
        Long userId = Long.parseLong(user.getUsername());
        List<MeetingLog> logs = supervisorService.getMeetingLogs(userId, null);
        return ResponseEntity.ok(Map.of("logs", logs));
    }

    @GetMapping("/{id}")
    public ResponseEntity<MeetingLog> getLog(@PathVariable Long id) {
        return ResponseEntity.ok(meetingLogService.getLog(id));
    }

    @PostMapping("/{id}/review")
    public ResponseEntity<?> reviewLog(@AuthenticationPrincipal UserDetails user, @PathVariable Long id, @RequestBody Map<String, Object> data) {
        Long userId = Long.parseLong(user.getUsername());
        String action = (String) data.get("action");
        if ("SIGN".equalsIgnoreCase(action)) {
            return ResponseEntity.ok(meetingLogService.signLog(id, userId, data));
        }
        return ResponseEntity.ok(Map.of("success", true));
    }

    @PostMapping("/{id}/sign")
    public ResponseEntity<?> signLog(@AuthenticationPrincipal UserDetails user, @PathVariable Long id) {
        Long userId = Long.parseLong(user.getUsername());
        return ResponseEntity.ok(meetingLogService.signLog(id, userId, Map.of()));
    }
}
