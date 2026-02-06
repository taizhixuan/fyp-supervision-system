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
@RequestMapping("/supervisor/requests")
@RequiredArgsConstructor
public class SupervisorRequestController {
    private final SupervisorService supervisorService;

    @GetMapping
    public ResponseEntity<?> getRequests(@AuthenticationPrincipal UserDetails user, @RequestParam(required = false) String status) {
        Long userId = Long.parseLong(user.getUsername());
        List<Map<String, Object>> requests = supervisorService.getRequestDtos(userId, status);
        return ResponseEntity.ok(Map.of("requests", requests, "total", requests.size()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getRequest(@PathVariable Long id) {
        // Use the buildRequestDto from a loaded entity
        return ResponseEntity.ok(supervisorService.buildRequestDto(
                supervisorService.getRequestEntity(id)));
    }

    @PostMapping("/{id}/respond")
    public ResponseEntity<?> respondToRequest(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable Long id,
            @RequestBody Map<String, Object> data) {
        Long userId = Long.parseLong(user.getUsername());
        return ResponseEntity.ok(supervisorService.respondToRequest(id, userId, data));
    }
}
