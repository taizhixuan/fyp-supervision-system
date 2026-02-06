package com.fyp.supervision.controller.student;

import com.fyp.supervision.service.StudentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/student/dashboard")
@RequiredArgsConstructor
public class StudentDashboardController {
    private final StudentService studentService;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getDashboard(@AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(studentService.getDashboard(Long.parseLong(user.getUsername())));
    }
}
