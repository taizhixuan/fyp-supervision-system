package com.fyp.supervision.controller.student;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/student/logs")
@RequiredArgsConstructor
public class StudentLogController {

    @GetMapping
    public ResponseEntity<?> getLogs(@AuthenticationPrincipal UserDetails user) {
        // Alias for meeting logs — redirects to meeting log controller
        return ResponseEntity.ok(Map.of("logs", List.of()));
    }
}
