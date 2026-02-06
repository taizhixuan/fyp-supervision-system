package com.fyp.supervision.controller.supervisor;

import com.fyp.supervision.service.SupervisorService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/supervisor/profile")
@RequiredArgsConstructor
public class SupervisorProfileController {
    private final SupervisorService supervisorService;

    @GetMapping
    public ResponseEntity<?> getProfile(@AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(supervisorService.getProfileDto(Long.parseLong(user.getUsername())));
    }

    @PutMapping
    public ResponseEntity<?> updateProfile(@AuthenticationPrincipal UserDetails user, @RequestBody Map<String, Object> updates) {
        return ResponseEntity.ok(supervisorService.updateProfile(Long.parseLong(user.getUsername()), updates));
    }

    @GetMapping("/audit-log")
    public ResponseEntity<?> getAuditLog(@AuthenticationPrincipal UserDetails user) {
        // Audit log stub — returns empty list for now
        return ResponseEntity.ok(Map.of("entries", List.of(), "total", 0));
    }
}
