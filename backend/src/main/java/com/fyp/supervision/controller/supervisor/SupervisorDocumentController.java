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
@RequestMapping("/supervisor/documents")
@RequiredArgsConstructor
public class SupervisorDocumentController {
    private final SupervisorService supervisorService;

    @GetMapping
    public ResponseEntity<?> getDocuments(
            @AuthenticationPrincipal UserDetails user,
            @RequestParam(required = false) Long studentId,
            @RequestParam(required = false) String type) {
        Long userId = Long.parseLong(user.getUsername());
        List<Map<String, Object>> documents = supervisorService.getDocumentDtos(userId, studentId, type);
        return ResponseEntity.ok(Map.of("documents", documents, "total", documents.size()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getDocument(@PathVariable Long id) {
        return ResponseEntity.ok(supervisorService.getDocumentDetailDto(id));
    }

    @PostMapping("/{id}/feedback")
    public ResponseEntity<?> provideFeedback(@PathVariable Long id, @RequestBody Map<String, Object> data) {
        // Stub — document feedback not yet implemented
        return ResponseEntity.ok(Map.of("success", true));
    }
}
