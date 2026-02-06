package com.fyp.supervision.controller.committee;

import com.fyp.supervision.enums.CycleStatus;
import com.fyp.supervision.repository.FypCycleRepository;
import com.fyp.supervision.service.CommitteeService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/committee/projects")
@RequiredArgsConstructor
public class CommitteeProjectController {
    private final CommitteeService committeeService;
    private final FypCycleRepository fypCycleRepository;

    @GetMapping
    public ResponseEntity<?> getProjects(@RequestParam(required = false) Long cycle, Pageable pageable) {
        return ResponseEntity.ok(committeeService.getProjectDtos(cycle, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getProject(@PathVariable Long id) {
        return ResponseEntity.ok(committeeService.getProjectDetailDto(id));
    }

    @GetMapping("/unpaired-students")
    public ResponseEntity<?> getUnpairedStudents() {
        var activeCycle = fypCycleRepository.findByStatus(CycleStatus.ACTIVE).orElse(null);
        if (activeCycle == null) return ResponseEntity.ok(Map.of("students", List.of()));
        List<Map<String, Object>> students = committeeService.getUnpairedStudentDtos(activeCycle.getCycleId());
        return ResponseEntity.ok(Map.of("students", students));
    }

    @GetMapping("/supervisor-loads")
    public ResponseEntity<?> getSupervisorLoads() {
        List<Map<String, Object>> loads = committeeService.getSupervisorLoadDtos();
        return ResponseEntity.ok(Map.of("supervisors", loads));
    }

    @GetMapping("/supervisor-loads/{id}")
    public ResponseEntity<?> getSupervisorLoad(@PathVariable Long id) {
        return ResponseEntity.ok(committeeService.getSupervisorLoadDetailDto(id));
    }
}
