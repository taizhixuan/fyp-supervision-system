package com.fyp.supervision.controller.student;

import com.fyp.supervision.service.StudentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/student/supervision-requests")
@RequiredArgsConstructor
public class StudentSupervisionRequestController {
    private final StudentService studentService;

    @GetMapping
    public ResponseEntity<?> getRequests(@AuthenticationPrincipal UserDetails user) {
        Long userId = Long.parseLong(user.getUsername());
        return ResponseEntity.ok(Map.of("requests", studentService.getSupervisionRequestDtos(userId)));
    }

    @PostMapping
    public ResponseEntity<?> createRequest(@AuthenticationPrincipal UserDetails user, @RequestBody Map<String, Object> data) {
        Long userId = Long.parseLong(user.getUsername());
        return ResponseEntity.ok(studentService.createSupervisionRequest(userId, data));
    }

    @PostMapping("/{id}/withdraw")
    public ResponseEntity<Void> withdrawRequest(@AuthenticationPrincipal UserDetails user, @PathVariable Long id) {
        Long userId = Long.parseLong(user.getUsername());
        studentService.withdrawSupervisionRequest(id, userId);
        return ResponseEntity.noContent().build();
    }
}
