package com.fyp.supervision.controller.supervisor;

import com.fyp.supervision.service.SupervisorService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/supervisor/dashboard")
@RequiredArgsConstructor
public class SupervisorDashboardController {
    private final SupervisorService supervisorService;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getDashboard(@AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(supervisorService.getDashboard(Long.parseLong(user.getUsername())));
    }
}
