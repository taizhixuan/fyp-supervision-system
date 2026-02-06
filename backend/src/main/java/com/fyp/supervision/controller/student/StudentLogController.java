package com.fyp.supervision.controller.student;

import com.fyp.supervision.entity.MeetingLog;
import com.fyp.supervision.service.MeetingLogService;
import com.fyp.supervision.service.StudentService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/student/logs")
@RequiredArgsConstructor
public class StudentLogController {

    private final StudentService studentService;
    private final MeetingLogService meetingLogService;

    @GetMapping
    public ResponseEntity<?> getLogs(
            @AuthenticationPrincipal UserDetails user,
            @RequestParam(required = false) String status,
            Pageable pageable) {
        Long userId = Long.parseLong(user.getUsername());
        return ResponseEntity.ok(studentService.getLogsDto(userId, status, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getLog(@PathVariable Long id) {
        return ResponseEntity.ok(studentService.getLogDto(id));
    }

    @PostMapping
    public ResponseEntity<?> createLog(@AuthenticationPrincipal UserDetails user, @RequestBody Map<String, Object> data) {
        Long userId = Long.parseLong(user.getUsername());
        MeetingLog log = meetingLogService.createLog(userId, data);
        return ResponseEntity.ok(studentService.buildMeetingLogDto(log));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateLog(@AuthenticationPrincipal UserDetails user, @PathVariable Long id, @RequestBody Map<String, Object> data) {
        Long userId = Long.parseLong(user.getUsername());
        MeetingLog log = meetingLogService.updateLog(id, userId, data);
        return ResponseEntity.ok(studentService.buildMeetingLogDto(log));
    }

    @PostMapping("/{id}/submit")
    public ResponseEntity<?> submitLog(@AuthenticationPrincipal UserDetails user, @PathVariable Long id) {
        Long userId = Long.parseLong(user.getUsername());
        MeetingLog log = meetingLogService.submitLog(id, userId);
        return ResponseEntity.ok(studentService.buildMeetingLogDto(log));
    }

    @PostMapping("/{id}/sign")
    public ResponseEntity<?> signLog(@AuthenticationPrincipal UserDetails user, @PathVariable Long id, @RequestBody Map<String, Object> data) {
        Long userId = Long.parseLong(user.getUsername());
        MeetingLog log = meetingLogService.signLog(id, userId, data);
        return ResponseEntity.ok(studentService.buildMeetingLogDto(log));
    }
}
