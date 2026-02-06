package com.fyp.supervision.controller.committee;

import com.fyp.supervision.entity.Project;
import com.fyp.supervision.enums.CycleStatus;
import com.fyp.supervision.exception.ResourceNotFoundException;
import com.fyp.supervision.repository.FypCycleRepository;
import com.fyp.supervision.repository.ProjectRepository;
import com.fyp.supervision.repository.SupervisorProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/committee/projects")
@RequiredArgsConstructor
public class CommitteeProjectController {
    private final ProjectRepository projectRepository;
    private final FypCycleRepository fypCycleRepository;
    private final SupervisorProfileRepository supervisorProfileRepository;

    @GetMapping
    public ResponseEntity<Page<Project>> getProjects(
            @RequestParam(required = false) Long cycle,
            Pageable pageable) {
        if (cycle != null) {
            return ResponseEntity.ok(projectRepository.findAllByCycleId(cycle, pageable));
        }
        return ResponseEntity.ok(projectRepository.findAll(pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Project> getProject(@PathVariable Long id) {
        return ResponseEntity.ok(projectRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Not found")));
    }

    @GetMapping("/unpaired-students")
    public ResponseEntity<?> getUnpairedStudents() {
        var activeCycle = fypCycleRepository.findByStatus(CycleStatus.ACTIVE).orElse(null);
        if (activeCycle == null) return ResponseEntity.ok(Map.of("students", List.of()));
        return ResponseEntity.ok(Map.of("students", projectRepository.findUnpairedStudentsByCycle(activeCycle.getCycleId())));
    }

    @GetMapping("/supervisor-loads")
    public ResponseEntity<?> getSupervisorLoads() {
        return ResponseEntity.ok(Map.of("supervisors", supervisorProfileRepository.findAll()));
    }

    @GetMapping("/supervisor-loads/{id}")
    public ResponseEntity<?> getSupervisorLoad(@PathVariable Long id) {
        return ResponseEntity.ok(supervisorProfileRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Not found")));
    }
}
