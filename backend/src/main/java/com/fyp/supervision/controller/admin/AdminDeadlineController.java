package com.fyp.supervision.controller.admin;

import com.fyp.supervision.entity.Deadline;
import com.fyp.supervision.exception.ResourceNotFoundException;
import com.fyp.supervision.repository.DeadlineRepository;
import com.fyp.supervision.repository.FypCycleRepository;
import com.fyp.supervision.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;

@RestController
@RequestMapping("/admin/deadlines")
@RequiredArgsConstructor
public class AdminDeadlineController {
    private final DeadlineRepository deadlineRepository;
    private final FypCycleRepository cycleRepository;
    private final AdminService adminService;

    @GetMapping
    public ResponseEntity<?> getDeadlines(@RequestParam(required = false) Long cycleId) {
        return ResponseEntity.ok(adminService.getDeadlines(cycleId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getDeadline(@PathVariable Long id) {
        return ResponseEntity.ok(adminService.getDeadlineDetail(id));
    }

    @PostMapping
    public ResponseEntity<?> createDeadline(@RequestBody Map<String, Object> data) {
        Deadline deadline = Deadline.builder()
                .title((String) data.get("title"))
                .description((String) data.get("description"))
                .dueDate(LocalDate.parse((String) data.get("dueDate")))
                .deadlineType((String) data.get("deadlineType"))
                .audience((String) data.get("audience"))
                .build();
        if (data.get("cycleId") != null) {
            cycleRepository.findById(Long.valueOf(data.get("cycleId").toString())).ifPresent(deadline::setCycle);
        }
        if (data.get("reminderDays") != null) {
            try {
                deadline.setReminderDays(new com.fasterxml.jackson.databind.ObjectMapper()
                        .writeValueAsString(data.get("reminderDays")));
            } catch (Exception ignored) {}
        }
        Deadline saved = deadlineRepository.save(deadline);
        return ResponseEntity.ok(Map.of("deadlineId", saved.getDeadlineId()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateDeadline(@PathVariable Long id, @RequestBody Map<String, Object> data) {
        Deadline d = deadlineRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Not found"));
        if (data.containsKey("title")) d.setTitle((String) data.get("title"));
        if (data.containsKey("dueDate")) d.setDueDate(LocalDate.parse((String) data.get("dueDate")));
        if (data.containsKey("description")) d.setDescription((String) data.get("description"));
        if (data.containsKey("deadlineType")) d.setDeadlineType((String) data.get("deadlineType"));
        deadlineRepository.save(d);
        return ResponseEntity.ok(Map.of("success", true));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDeadline(@PathVariable Long id) {
        deadlineRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
