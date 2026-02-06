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
@RequestMapping("/supervisor/supervisees")
@RequiredArgsConstructor
public class SupervisorSuperviseeController {
    private final SupervisorService supervisorService;

    @GetMapping
    public ResponseEntity<?> getSupervisees(@AuthenticationPrincipal UserDetails user) {
        Long userId = Long.parseLong(user.getUsername());
        List<Map<String, Object>> supervisees = supervisorService.getSuperviseeDtos(userId);
        return ResponseEntity.ok(Map.of("supervisees", supervisees, "total", supervisees.size()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getSupervisee(@PathVariable Long id) {
        return ResponseEntity.ok(supervisorService.getSuperviseeDetailDto(id));
    }
}
