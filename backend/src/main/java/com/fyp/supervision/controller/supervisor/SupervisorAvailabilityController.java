package com.fyp.supervision.controller.supervisor;

import com.fyp.supervision.service.SupervisorAvailabilityService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/supervisor/availability")
@RequiredArgsConstructor
public class SupervisorAvailabilityController {

    private final SupervisorAvailabilityService service;

    @GetMapping
    public ResponseEntity<?> getOwn(@AuthenticationPrincipal UserDetails user) {
        Long userId = Long.parseLong(user.getUsername());
        return ResponseEntity.ok(Map.of("entries", service.listForSupervisor(userId)));
    }

    /**
     * Replace the full weekly schedule. Body: {entries: [{dayOfWeek, startTime,
     * endTime, slotDurationMinutes?}, ...]}.
     */
    @PutMapping
    public ResponseEntity<?> replace(
            @AuthenticationPrincipal UserDetails user,
            @RequestBody Map<String, Object> body) {
        Long userId = Long.parseLong(user.getUsername());
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> entries = (List<Map<String, Object>>) body.getOrDefault("entries", List.of());
        return ResponseEntity.ok(Map.of("entries", service.replaceSchedule(userId, entries)));
    }
}
