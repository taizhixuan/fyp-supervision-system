package com.fyp.supervision.controller.student;

import com.fyp.supervision.entity.MeetingLog;
import com.fyp.supervision.service.MeetingLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/student/meeting-logs")
@RequiredArgsConstructor
public class StudentMeetingLogController {
    private final MeetingLogService meetingLogService;

    @GetMapping
    public ResponseEntity<Page<MeetingLog>> getLogs(
            @AuthenticationPrincipal UserDetails user,
            @RequestParam(required = false) String status,
            Pageable pageable) {
        Long userId = Long.parseLong(user.getUsername());
        return ResponseEntity.ok(meetingLogService.getStudentLogs(userId, status, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<MeetingLog> getLog(@PathVariable Long id) {
        return ResponseEntity.ok(meetingLogService.getLog(id));
    }

    @PostMapping
    public ResponseEntity<MeetingLog> createLog(@AuthenticationPrincipal UserDetails user, @RequestBody Map<String, Object> data) {
        Long userId = Long.parseLong(user.getUsername());
        return ResponseEntity.ok(meetingLogService.createLog(userId, data));
    }

    @PutMapping("/{id}")
    public ResponseEntity<MeetingLog> updateLog(@AuthenticationPrincipal UserDetails user, @PathVariable Long id, @RequestBody Map<String, Object> data) {
        Long userId = Long.parseLong(user.getUsername());
        return ResponseEntity.ok(meetingLogService.updateLog(id, userId, data));
    }

    @PostMapping("/{id}/submit")
    public ResponseEntity<MeetingLog> submitLog(@AuthenticationPrincipal UserDetails user, @PathVariable Long id) {
        Long userId = Long.parseLong(user.getUsername());
        return ResponseEntity.ok(meetingLogService.submitLog(id, userId));
    }

    @PostMapping("/{id}/sign")
    public ResponseEntity<MeetingLog> signLog(@AuthenticationPrincipal UserDetails user, @PathVariable Long id, @RequestBody Map<String, Object> data) {
        Long userId = Long.parseLong(user.getUsername());
        return ResponseEntity.ok(meetingLogService.signLog(id, userId, data));
    }
}
