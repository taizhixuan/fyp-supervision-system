package com.fyp.supervision.controller.student;

import com.fyp.supervision.service.AccountDeletionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.locks.ReentrantLock;

@RestController
@RequestMapping("/student/me/deletion-request")
@RequiredArgsConstructor
public class StudentDeletionRequestController {

    private final AccountDeletionService accountDeletionService;

    // Per-user lock so a double-click can't create two PENDING requests via the
    // check-then-insert race. Held across the service call so the transaction commits
    // (and the PENDING row becomes visible) before the next request runs its check.
    private final ConcurrentHashMap<Long, ReentrantLock> requestLocks = new ConcurrentHashMap<>();

    @PostMapping
    public ResponseEntity<Map<String, Object>> request(
            @AuthenticationPrincipal UserDetails user,
            @RequestBody(required = false) Map<String, String> body) {
        Long userId = Long.parseLong(user.getUsername());
        String reason = body == null ? null : body.get("reason");
        ReentrantLock lock = requestLocks.computeIfAbsent(userId, k -> new ReentrantLock());
        lock.lock();
        try {
            return ResponseEntity.ok(accountDeletionService.requestDeletion(userId, reason));
        } finally {
            lock.unlock();
        }
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> own(@AuthenticationPrincipal UserDetails user) {
        Long userId = Long.parseLong(user.getUsername());
        Map<String, Object> req = accountDeletionService.getOwnRequest(userId);
        // Return 200 with empty body when there's no request — easier for the
        // SPA to render "no request" without treating it as an error.
        return ResponseEntity.ok(req == null ? Map.of() : req);
    }
}
