package com.fyp.supervision.controller.supervisor;

import com.fyp.supervision.entity.MeetingLog;
import com.fyp.supervision.enums.MeetingLogStatus;
import com.fyp.supervision.repository.MeetingLogRepository;
import com.fyp.supervision.service.MeetingLogService;
import com.fyp.supervision.service.StudentService;
import com.fyp.supervision.service.SupervisorAccessService;
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
    private final MeetingLogService meetingLogService;
    private final MeetingLogRepository meetingLogRepository;
    // Reuses the canonical MMU MeetingLog DTO shape that the student side returns.
    private final StudentService studentService;
    private final SupervisorAccessService access;

    @GetMapping
    public ResponseEntity<?> getMeetingLogs(
            @AuthenticationPrincipal UserDetails user,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String phase) {
        Long userId = Long.parseLong(user.getUsername());
        boolean hasStatus = status != null && !status.isBlank();
        boolean hasPhase = phase != null && !phase.isBlank();
        List<MeetingLog> logs;
        if (hasStatus && hasPhase) {
            logs = meetingLogRepository.findBySupervisor_UserIdAndStatusAndFypPhaseOrderByCreatedAtDesc(userId, MeetingLogStatus.valueOf(status), phase);
        } else if (hasStatus) {
            logs = meetingLogRepository.findBySupervisor_UserIdAndStatusOrderByCreatedAtDesc(userId, MeetingLogStatus.valueOf(status));
        } else if (hasPhase) {
            logs = meetingLogRepository.findBySupervisor_UserIdAndFypPhaseOrderByCreatedAtDesc(userId, phase);
        } else {
            logs = meetingLogRepository.findBySupervisor_UserIdOrderByCreatedAtDesc(userId);
        }
        List<Map<String, Object>> dtos = logs.stream().map(studentService::buildMeetingLogDto).toList();
        return ResponseEntity.ok(Map.of("logs", dtos, "total", dtos.size()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getLog(@AuthenticationPrincipal UserDetails user, @PathVariable Long id) {
        Long userId = Long.parseLong(user.getUsername());
        return ResponseEntity.ok(studentService.buildMeetingLogDto(access.requireOwnLog(userId, id)));
    }

    @PutMapping("/{id}/comments")
    public ResponseEntity<?> addComments(@AuthenticationPrincipal UserDetails user, @PathVariable Long id, @RequestBody Map<String, Object> data) {
        Long userId = Long.parseLong(user.getUsername());
        var log = meetingLogService.addSupervisorComments(id, userId, (String) data.get("supervisorComments"));
        return ResponseEntity.ok(studentService.buildMeetingLogDto(log));
    }

    @PostMapping("/{id}/request-correction")
    public ResponseEntity<?> requestCorrection(@AuthenticationPrincipal UserDetails user, @PathVariable Long id, @RequestBody Map<String, Object> data) {
        Long userId = Long.parseLong(user.getUsername());
        var log = meetingLogService.requestCorrection(id, userId, (String) data.get("correctionReason"));
        return ResponseEntity.ok(studentService.buildMeetingLogDto(log));
    }

    @PostMapping("/{id}/sign")
    public ResponseEntity<?> signLog(@AuthenticationPrincipal UserDetails user, @PathVariable Long id, @RequestBody Map<String, Object> data) {
        Long userId = Long.parseLong(user.getUsername());
        var log = meetingLogService.signLog(id, userId, data);
        return ResponseEntity.ok(studentService.buildMeetingLogDto(log));
    }
}
