package com.fyp.supervision.controller.admin;

import com.fyp.supervision.job.DeadlineReminderJob;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/admin/jobs")
@RequiredArgsConstructor
public class AdminJobController {

    private final DeadlineReminderJob deadlineReminderJob;

    @PostMapping("/deadline-reminders/run")
    public ResponseEntity<?> runDeadlineReminders() {
        int fired = deadlineReminderJob.run();
        return ResponseEntity.ok(Map.of(
                "status", "ok",
                "fired", fired
        ));
    }
}
