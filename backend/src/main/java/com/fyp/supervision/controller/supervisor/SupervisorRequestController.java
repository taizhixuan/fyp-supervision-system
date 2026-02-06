package com.fyp.supervision.controller.supervisor;

import com.fyp.supervision.entity.SupervisorRequest;
import com.fyp.supervision.exception.ResourceNotFoundException;
import com.fyp.supervision.repository.SupervisorRequestRepository;
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
    private final SupervisorRequestRepository supervisorRequestRepository;

    @GetMapping
    public ResponseEntity<?> getRequests(@AuthenticationPrincipal UserDetails user, @RequestParam(required = false) String status) {
        Long userId = Long.parseLong(user.getUsername());
        List<SupervisorRequest> requests = supervisorService.getRequests(userId, status);
        return ResponseEntity.ok(Map.of("requests", requests));
    }

    @GetMapping("/{id}")
    public ResponseEntity<SupervisorRequest> getRequest(@PathVariable Long id) {
        return ResponseEntity.ok(supervisorRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Request not found")));
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
