package com.fyp.supervision.controller.student;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fyp.supervision.entity.UserNotificationPreferences;
import com.fyp.supervision.repository.UserNotificationPreferencesRepository;
import com.fyp.supervision.service.StudentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/student")
@RequiredArgsConstructor
public class StudentDeadlineController {
    private final StudentService studentService;
    private final UserNotificationPreferencesRepository notificationPreferencesRepository;
    private final ObjectMapper objectMapper;

    private static Map<String, Object> defaultPreferences() {
        Map<String, Object> prefs = new LinkedHashMap<>();
        prefs.put("email", Map.of("enabled", true, "meetingReminders", true, "deadlineReminders", true, "proposalUpdates", true, "supervisorMessages", true, "systemAnnouncements", true));
        prefs.put("push", Map.of("enabled", true, "meetingReminders", true, "deadlineReminders", true, "proposalUpdates", true, "supervisorMessages", true, "systemAnnouncements", true));
        prefs.put("inApp", Map.of("enabled", true, "meetingReminders", true, "deadlineReminders", true, "proposalUpdates", true, "supervisorMessages", true, "systemAnnouncements", true));
        prefs.put("quiet", Map.of("enabled", false, "startTime", "22:00", "endTime", "08:00"));
        return prefs;
    }

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
        return notificationPreferencesRepository.findById(userId)
                .map(prefs -> {
                    if (prefs.getPreferencesJson() == null || prefs.getPreferencesJson().isBlank()) {
                        return defaultPreferences();
                    }
                    try {
                        return objectMapper.readValue(prefs.getPreferencesJson(), new TypeReference<Map<String, Object>>() {});
                    } catch (Exception e) {
                        return defaultPreferences();
                    }
                })
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.ok(defaultPreferences()));
    }

    @PutMapping("/notification-preferences")
    public ResponseEntity<?> updateNotificationPreferences(@AuthenticationPrincipal UserDetails user, @RequestBody Map<String, Object> prefs) {
        Long userId = Long.parseLong(user.getUsername());
        try {
            String json = objectMapper.writeValueAsString(prefs);
            UserNotificationPreferences entity = notificationPreferencesRepository.findById(userId)
                    .orElse(UserNotificationPreferences.builder().userId(userId).build());
            entity.setPreferencesJson(json);
            entity.setUpdatedAt(LocalDateTime.now());
            notificationPreferencesRepository.save(entity);
            return ResponseEntity.ok(prefs);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid preferences format"));
        }
    }
}
