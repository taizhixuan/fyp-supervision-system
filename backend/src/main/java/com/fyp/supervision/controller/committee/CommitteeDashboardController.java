package com.fyp.supervision.controller.committee;

import com.fyp.supervision.service.CommitteeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/committee/dashboard")
@RequiredArgsConstructor
public class CommitteeDashboardController {
    private final CommitteeService committeeService;

    @GetMapping
    public ResponseEntity<?> getDashboard() {
        return ResponseEntity.ok(committeeService.getDashboard());
    }
}
