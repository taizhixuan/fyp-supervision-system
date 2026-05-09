package com.fyp.supervision.controller.student;

import com.fyp.supervision.entity.MeetingLog;
import com.fyp.supervision.service.MeetingLogService;
import com.fyp.supervision.service.StudentAccessService;
import com.fyp.supervision.service.StudentService;
import lombok.RequiredArgsConstructor;
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
    private final StudentService studentService;
    private final StudentAccessService studentAccessService;

    @GetMapping
    public ResponseEntity<?> getLogs(
            @AuthenticationPrincipal UserDetails user,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String phase,
            Pageable pageable) {
        Long userId = Long.parseLong(user.getUsername());
        return ResponseEntity.ok(studentService.getLogsDto(userId, status, phase, pageable));
    }

    @GetMapping("/prefill")
    public ResponseEntity<?> getPrefill(
            @AuthenticationPrincipal UserDetails user,
            @RequestParam(required = false) Long meetingId) {
        Long userId = Long.parseLong(user.getUsername());
        return ResponseEntity.ok(meetingLogService.getPrefillData(userId, meetingId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getLog(@AuthenticationPrincipal UserDetails user, @PathVariable Long id) {
        Long userId = Long.parseLong(user.getUsername());
        return ResponseEntity.ok(studentService.getLogDto(userId, id));
    }

    @PostMapping
    public ResponseEntity<?> createLog(@AuthenticationPrincipal UserDetails user, @RequestBody Map<String, Object> data) {
        Long userId = Long.parseLong(user.getUsername());
        studentAccessService.requireActiveCycle(userId);
        MeetingLog log = meetingLogService.createLog(userId, data);
        return ResponseEntity.ok(studentService.buildMeetingLogDto(log));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateLog(@AuthenticationPrincipal UserDetails user, @PathVariable Long id, @RequestBody Map<String, Object> data) {
        Long userId = Long.parseLong(user.getUsername());
        studentAccessService.requireActiveCycle(userId);
        MeetingLog log = meetingLogService.updateLog(id, userId, data);
        return ResponseEntity.ok(studentService.buildMeetingLogDto(log));
    }

    @PostMapping("/{id}/submit")
    public ResponseEntity<?> submitLog(@AuthenticationPrincipal UserDetails user, @PathVariable Long id) {
        Long userId = Long.parseLong(user.getUsername());
        studentAccessService.requireActiveCycle(userId);
        MeetingLog log = meetingLogService.submitLog(id, userId);
        return ResponseEntity.ok(studentService.buildMeetingLogDto(log));
    }

    @PostMapping("/{id}/sign")
    public ResponseEntity<?> signLog(@AuthenticationPrincipal UserDetails user, @PathVariable Long id, @RequestBody Map<String, Object> data) {
        Long userId = Long.parseLong(user.getUsername());
        studentAccessService.requireActiveCycle(userId);
        MeetingLog log = meetingLogService.signLog(id, userId, data);
        return ResponseEntity.ok(studentService.buildMeetingLogDto(log));
    }
}
