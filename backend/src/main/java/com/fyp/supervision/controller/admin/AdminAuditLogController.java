package com.fyp.supervision.controller.admin;

import com.fyp.supervision.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/admin/audit-logs")
@RequiredArgsConstructor
public class AdminAuditLogController {
    private final AdminService adminService;
    private final com.fyp.supervision.repository.AuditLogRepository auditLogRepository;

    /**
     * The action / entity values actually recorded (USER_APPROVED, LOGIN_SUCCESS,
     * USER_ACCOUNT, ...), so the filter dropdowns offer values that match rows.
     */
    @GetMapping("/filters")
    public ResponseEntity<?> getFilterOptions() {
        return ResponseEntity.ok(java.util.Map.of(
                "actions", auditLogRepository.findDistinctActions(),
                "entityTypes", auditLogRepository.findDistinctEntityNames()));
    }

    @GetMapping
    public ResponseEntity<?> getAuditLogs(
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String entityType,
            @RequestParam(required = false) Long performedBy,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dateTo,
            Pageable pageable) {
        return ResponseEntity.ok(adminService.getAuditLogs(action, entityType, performedBy, dateFrom, dateTo, pageable));
    }
}
