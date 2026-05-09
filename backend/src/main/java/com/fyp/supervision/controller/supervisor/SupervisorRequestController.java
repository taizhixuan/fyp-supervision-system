package com.fyp.supervision.controller.supervisor;

import com.fyp.supervision.entity.UserAccount;
import com.fyp.supervision.repository.UserAccountRepository;
import com.fyp.supervision.service.AuditService;
import com.fyp.supervision.service.SupervisorAccessService;
import com.fyp.supervision.service.SupervisorService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/supervisor/requests")
@RequiredArgsConstructor
public class SupervisorRequestController {
    private final SupervisorService supervisorService;
    private final SupervisorAccessService access;
    private final AuditService auditService;
    private final UserAccountRepository userAccountRepository;

    @GetMapping
    public ResponseEntity<?> getRequests(@AuthenticationPrincipal UserDetails user, @RequestParam(required = false) String status) {
        Long userId = Long.parseLong(user.getUsername());
        List<Map<String, Object>> requests = supervisorService.getRequestDtos(userId, status);
        return ResponseEntity.ok(Map.of("requests", requests, "total", requests.size()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getRequest(@AuthenticationPrincipal UserDetails user, @PathVariable Long id) {
        Long userId = Long.parseLong(user.getUsername());
        return ResponseEntity.ok(supervisorService.buildRequestDto(
                access.requireOwnRequest(userId, id)));
    }

    @PostMapping("/{id}/respond")
    public ResponseEntity<?> respondToRequest(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable Long id,
            HttpServletRequest httpRequest,
            @RequestBody Map<String, Object> data) {
        Long userId = Long.parseLong(user.getUsername());
        Object resp = supervisorService.respondToRequest(id, userId, data);
        // Audit AFTER the service committed — if it threw, we don't want to claim it
        // happened. Action name reflects the supervisor's choice.
        String action = "ACCEPT".equalsIgnoreCase(String.valueOf(data.get("action")))
                ? "REQUEST_ACCEPTED" : "REQUEST_REJECTED";
        UserAccount actor = userAccountRepository.findById(userId).orElse(null);
        auditService.record(actor, action, "SUPERVISOR_REQUEST", String.valueOf(id),
                "supervisor=" + (actor != null ? actor.getEmail() : userId), httpRequest);
        return ResponseEntity.ok(resp);
    }
}
