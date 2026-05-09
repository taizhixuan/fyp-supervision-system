package com.fyp.supervision.controller.student;

import com.fyp.supervision.service.GradingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/student/grades")
@RequiredArgsConstructor
public class StudentGradeController {
    private final GradingService gradingService;

    /** Student-facing read — only FINALISED grades are visible. */
    @GetMapping
    public ResponseEntity<?> myGrades(@AuthenticationPrincipal UserDetails user) {
        Long uid = Long.parseLong(user.getUsername());
        List<Map<String, Object>> grades = gradingService.listForStudent(uid);
        return ResponseEntity.ok(Map.of("grades", grades, "total", grades.size()));
    }
}
