package com.fyp.supervision.controller.student;

import com.fyp.supervision.service.NotificationPreferenceService;
import com.fyp.supervision.service.StudentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/student")
@RequiredArgsConstructor
public class StudentDeadlineController {
    private final StudentService studentService;
    private final NotificationPreferenceService preferenceService;

    @GetMapping("/deadlines")
    public ResponseEntity<?> getDeadlines(@AuthenticationPrincipal UserDetails user) {
        Long userId = Long.parseLong(user.getUsername());
        return ResponseEntity.ok(studentService.getDeadlinesDto(userId));
    }

    @GetMapping("/registration")
    public ResponseEntity<?> getRegistration(@AuthenticationPrincipal UserDetails user) {
        Long userId = Long.parseLong(user.getUsername());
        Map<String, Object> dashboard = studentService.getDashboard(userId);
        return ResponseEntity.ok(dashboard.get("registrationStatus"));
    }

    @GetMapping("/notification-preferences")
    public ResponseEntity<?> getNotificationPreferences(@AuthenticationPrincipal UserDetails user) {
        Long userId = Long.parseLong(user.getUsername());
        return ResponseEntity.ok(preferenceService.loadPreferences(userId));
    }

    @PutMapping("/notification-preferences")
    public ResponseEntity<?> updateNotificationPreferences(@AuthenticationPrincipal UserDetails user,
                                                           @RequestBody Map<String, Object> prefs) {
        Long userId = Long.parseLong(user.getUsername());
        try {
            return ResponseEntity.ok(preferenceService.savePreferences(userId, prefs));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid preferences format"));
        }
    }
}
