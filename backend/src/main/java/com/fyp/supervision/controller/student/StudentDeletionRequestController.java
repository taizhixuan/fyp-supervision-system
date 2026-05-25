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

@RestController
@RequestMapping("/student/me/deletion-request")
@RequiredArgsConstructor
public class StudentDeletionRequestController {

    private final AccountDeletionService accountDeletionService;

    @PostMapping
    public ResponseEntity<Map<String, Object>> request(
            @AuthenticationPrincipal UserDetails user,
            @RequestBody(required = false) Map<String, String> body) {
        Long userId = Long.parseLong(user.getUsername());
        String reason = body == null ? null : body.get("reason");
        return ResponseEntity.ok(accountDeletionService.requestDeletion(userId, reason));
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
