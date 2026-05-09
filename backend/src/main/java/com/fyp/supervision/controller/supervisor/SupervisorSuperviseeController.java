package com.fyp.supervision.controller.supervisor;

import com.fyp.supervision.service.SupervisorAccessService;
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
    private final SupervisorAccessService access;

    @GetMapping
    public ResponseEntity<?> getSupervisees(
            @AuthenticationPrincipal UserDetails user,
            @RequestParam(name = "scope", required = false, defaultValue = "active") String scope) {
        Long userId = Long.parseLong(user.getUsername());
        List<Map<String, Object>> supervisees = "past".equalsIgnoreCase(scope)
                ? supervisorService.getPastSuperviseeDtos(userId)
                : supervisorService.getSuperviseeDtos(userId);
        return ResponseEntity.ok(Map.of("supervisees", supervisees, "total", supervisees.size()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getSupervisee(@AuthenticationPrincipal UserDetails user, @PathVariable Long id) {
        Long userId = Long.parseLong(user.getUsername());
        access.requireOwnProject(userId, id);
        return ResponseEntity.ok(supervisorService.getSuperviseeDetailDto(id));
    }
}
