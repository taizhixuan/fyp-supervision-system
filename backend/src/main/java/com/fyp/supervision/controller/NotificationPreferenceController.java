package com.fyp.supervision.controller;

import com.fyp.supervision.service.NotificationPreferenceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/notifications/preferences")
@RequiredArgsConstructor
public class NotificationPreferenceController {

    private final NotificationPreferenceService preferenceService;

    @GetMapping
    public ResponseEntity<?> get(@AuthenticationPrincipal UserDetails user) {
        Long userId = Long.parseLong(user.getUsername());
        return ResponseEntity.ok(preferenceService.loadPreferences(userId));
    }

    @PutMapping
    public ResponseEntity<?> update(@AuthenticationPrincipal UserDetails user,
                                    @RequestBody Map<String, Object> prefs) {
        Long userId = Long.parseLong(user.getUsername());
        try {
            return ResponseEntity.ok(preferenceService.savePreferences(userId, prefs));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid preferences format"));
        }
    }
}
