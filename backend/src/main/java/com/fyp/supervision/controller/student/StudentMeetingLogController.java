package com.fyp.supervision.controller.student;

import com.fyp.supervision.entity.MeetingLog;
import com.fyp.supervision.exception.BadRequestException;
import com.fyp.supervision.exception.ResourceNotFoundException;
import com.fyp.supervision.repository.MeetingLogRepository;
import com.fyp.supervision.repository.UserAccountRepository;
import com.fyp.supervision.service.MeetingLogDocumentService;
import com.fyp.supervision.service.MeetingLogService;
import com.fyp.supervision.service.StudentAccessService;
import com.fyp.supervision.service.StudentService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/student/meeting-logs")
@RequiredArgsConstructor
public class StudentMeetingLogController {
    private final MeetingLogService meetingLogService;
    private final StudentService studentService;
    private final StudentAccessService studentAccessService;
    private final MeetingLogDocumentService meetingLogDocumentService;
    private final MeetingLogRepository meetingLogRepository;
    private final UserAccountRepository userAccountRepository;

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

    /** Single meeting log → DOCX. Any status is exportable. Ownership enforced. */
    @GetMapping("/{id}/export.docx")
    public ResponseEntity<byte[]> exportSingle(
            @AuthenticationPrincipal UserDetails user, @PathVariable Long id) throws Exception {
        Long userId = Long.parseLong(user.getUsername());
        MeetingLog log = meetingLogRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Meeting log not found"));
        if (log.getStudent() == null || !userId.equals(log.getStudent().getUserId())) {
            throw new ResourceNotFoundException("Meeting log not found");
        }
        byte[] bytes = meetingLogDocumentService.renderLog(log);
        String fileName = "MeetingLog_" + nz(log.getFypPhase(), "FYP1")
                + "_M" + (log.getMeetingNumber() == null ? "X" : log.getMeetingNumber())
                + "_" + nz(log.getStudent().getMmuId(), String.valueOf(userId)) + ".docx";
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + fileName + "\"")
                .contentType(MediaType.parseMediaType(
                        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"))
                .body(bytes);
    }

    /** All of the requesting student's meeting logs in the given phase → ZIP. */
    @GetMapping("/export.zip")
    public ResponseEntity<byte[]> exportBulk(
            @AuthenticationPrincipal UserDetails user,
            @RequestParam(name = "phase") String phase) throws Exception {
        Long userId = Long.parseLong(user.getUsername());
        String p = phase == null ? "" : phase.trim().toUpperCase();
        if (!p.equals("FYP1") && !p.equals("FYP2")) {
            throw new BadRequestException("phase must be FYP1 or FYP2");
        }
        List<MeetingLog> allForStudent = meetingLogRepository
                .findByStudent_UserIdAndFypPhaseOrderByCreatedAtDesc(
                        userId, p, org.springframework.data.domain.Pageable.unpaged())
                .getContent();
        String mmuId = userAccountRepository.findById(userId)
                .map(u -> u.getMmuId() == null ? String.valueOf(userId) : u.getMmuId())
                .orElse(String.valueOf(userId));
        byte[] zipBytes = meetingLogDocumentService.renderLogsAsZip(allForStudent, p, mmuId);
        String fileName = "MeetingLogs_" + p + "_" + mmuId + ".zip";
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + fileName + "\"")
                .contentType(MediaType.parseMediaType("application/zip"))
                .body(zipBytes);
    }

    private String nz(String s, String fallback) {
        return (s == null || s.isBlank()) ? fallback : s;
    }
}
