package com.fyp.supervision.controller.admin;

import com.fyp.supervision.entity.FypCycle;
import com.fyp.supervision.enums.CycleStatus;
import com.fyp.supervision.exception.ResourceNotFoundException;
import com.fyp.supervision.repository.FypCycleRepository;
import com.fyp.supervision.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;

@RestController
@RequestMapping("/admin/cycles")
@RequiredArgsConstructor
public class AdminCycleController {
    private final FypCycleRepository cycleRepository;
    private final AdminService adminService;

    @GetMapping
    public ResponseEntity<?> getCycles() {
        return ResponseEntity.ok(adminService.getCycles());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getCycle(@PathVariable Long id) {
        return ResponseEntity.ok(adminService.getCycleDetail(id));
    }

    @PostMapping
    public ResponseEntity<?> createCycle(@RequestBody Map<String, Object> data) {
        FypCycle cycle = FypCycle.builder()
                .cycleCode((String) data.get("cycleCode"))
                .cycleType((String) data.get("cycleType"))
                .academicYear((String) data.get("academicYear"))
                .semester(data.get("semester") != null ? ((Number) data.get("semester")).intValue() : null)
                .startDate(LocalDate.parse((String) data.get("startDate")))
                .endDate(LocalDate.parse((String) data.get("endDate")))
                .status(CycleStatus.PLANNING)
                .build();
        FypCycle saved = cycleRepository.save(cycle);
        return ResponseEntity.ok(Map.of("cycleId", saved.getCycleId()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateCycle(@PathVariable Long id, @RequestBody Map<String, Object> data) {
        FypCycle cycle = cycleRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Not found"));
        if (data.containsKey("cycleCode")) cycle.setCycleCode((String) data.get("cycleCode"));
        if (data.containsKey("status")) cycle.setStatus(CycleStatus.valueOf((String) data.get("status")));
        if (data.containsKey("startDate")) cycle.setStartDate(LocalDate.parse((String) data.get("startDate")));
        if (data.containsKey("endDate")) cycle.setEndDate(LocalDate.parse((String) data.get("endDate")));
        cycleRepository.save(cycle);
        return ResponseEntity.ok(Map.of("success", true));
    }
}
