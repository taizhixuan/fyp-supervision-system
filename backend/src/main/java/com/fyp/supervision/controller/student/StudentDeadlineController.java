package com.fyp.supervision.controller.student;

import com.fyp.supervision.entity.Deadline;
import com.fyp.supervision.service.StudentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/student")
@RequiredArgsConstructor
public class StudentDeadlineController {
    private final StudentService studentService;

    @GetMapping("/deadlines")
    public ResponseEntity<?> getDeadlines(@AuthenticationPrincipal UserDetails user) {
        Long userId = Long.parseLong(user.getUsername());
        List<Deadline> deadlines = studentService.getDeadlines(userId);
        return ResponseEntity.ok(Map.of("deadlines", deadlines));
    }

    @GetMapping("/registration")
    public ResponseEntity<?> getRegistration(@AuthenticationPrincipal UserDetails user) {
        Long userId = Long.parseLong(user.getUsername());
        Map<String, Object> dashboard = studentService.getDashboard(userId);
        return ResponseEntity.ok(dashboard.get("registrationStatus"));
    }

    @GetMapping("/notification-preferences")
    public ResponseEntity<?> getNotificationPreferences(@AuthenticationPrincipal UserDetails user) {
        // Return default preferences
        return ResponseEntity.ok(Map.of(
            "email", Map.of("enabled", true, "meetingReminders", true, "deadlineReminders", true, "proposalUpdates", true, "supervisorMessages", true, "systemAnnouncements", true),
            "push", Map.of("enabled", true, "meetingReminders", true, "deadlineReminders", true, "proposalUpdates", true, "supervisorMessages", true, "systemAnnouncements", true),
            "inApp", Map.of("enabled", true, "meetingReminders", true, "deadlineReminders", true, "proposalUpdates", true, "supervisorMessages", true, "systemAnnouncements", true),
            "quiet", Map.of("enabled", false, "startTime", "22:00", "endTime", "08:00")
        ));
    }

    @PutMapping("/notification-preferences")
    public ResponseEntity<?> updateNotificationPreferences(@AuthenticationPrincipal UserDetails user, @RequestBody Map<String, Object> prefs) {
        // Placeholder — store preferences in future
        return ResponseEntity.ok(prefs);
    }
}
