package com.fyp.supervision.controller.admin;

import com.fyp.supervision.service.AccountDeletionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin/deletion-requests")
@RequiredArgsConstructor
public class AdminDeletionRequestController {

    private final AccountDeletionService accountDeletionService;

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> list(
            @RequestParam(name = "pendingOnly", required = false, defaultValue = "false") boolean pendingOnly) {
        return ResponseEntity.ok(accountDeletionService.listAll(pendingOnly));
    }

    @PostMapping("/{requestId}/approve")
    public ResponseEntity<Map<String, Object>> approve(
            @AuthenticationPrincipal UserDetails admin,
            @PathVariable Long requestId,
            @RequestBody(required = false) Map<String, String> body) {
        Long adminId = Long.parseLong(admin.getUsername());
        String note = body == null ? null : body.get("note");
        return ResponseEntity.ok(accountDeletionService.approve(requestId, adminId, note));
    }

    @PostMapping("/{requestId}/reject")
    public ResponseEntity<Map<String, Object>> reject(
            @AuthenticationPrincipal UserDetails admin,
            @PathVariable Long requestId,
            @RequestBody(required = false) Map<String, String> body) {
        Long adminId = Long.parseLong(admin.getUsername());
        String note = body == null ? null : body.get("note");
        return ResponseEntity.ok(accountDeletionService.reject(requestId, adminId, note));
    }
}
