package com.fyp.supervision.controller.committee;

import com.fyp.supervision.enums.CycleStatus;
import com.fyp.supervision.repository.FypCycleRepository;
import com.fyp.supervision.service.CommitteeService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
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
    public ResponseEntity<?> getProjects(
            @RequestParam(required = false) Long cycleId,
            @RequestParam(required = false) String cycleStatus,
            @RequestParam(required = false) String projectStatus,
            @RequestParam(required = false) String pairingStatus,
            @RequestParam(required = false) String riskLevel,
            @RequestParam(required = false) String search,
            Pageable pageable) {

        // Default scope = ACTIVE cycles when caller passed no cycle filter at all.
        String effectiveCycleStatus = cycleStatus;
        if (cycleId == null && (cycleStatus == null || cycleStatus.isBlank())) {
            effectiveCycleStatus = "ACTIVE";
        }
        if ("ALL".equalsIgnoreCase(effectiveCycleStatus)) {
            effectiveCycleStatus = null;
        }

        Pageable effective = pageable.getSort().isSorted() ? pageable
                : org.springframework.data.domain.PageRequest.of(
                        pageable.getPageNumber(), pageable.getPageSize(),
                        Sort.by(Sort.Direction.DESC, "updatedAt"));

        return ResponseEntity.ok(committeeService.getProjectDtos(
                cycleId, effectiveCycleStatus, projectStatus, pairingStatus, riskLevel, search, effective));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getProject(@PathVariable Long id) {
        return ResponseEntity.ok(committeeService.getProjectDetailDto(id));
    }

    @GetMapping("/unpaired-students")
    public ResponseEntity<?> getUnpairedStudents(@RequestParam(required = false) Long cycleId) {
        if (cycleId != null) {
            List<Map<String, Object>> students = committeeService.getUnpairedStudentDtos(cycleId);
            return ResponseEntity.ok(Map.of("students", students));
        }
        // No cycleId → union across all ACTIVE cycles
        List<Map<String, Object>> students = fypCycleRepository
                .findFirstByStatusOrderByStartDateDesc(CycleStatus.ACTIVE)
                .map(c -> committeeService.getUnpairedStudentDtos(c.getCycleId()))
                .orElseGet(List::of);
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

    @PostMapping("/{id}/advance-phase")
    public ResponseEntity<?> advancePhase(@PathVariable Long id) {
        return ResponseEntity.ok(committeeService.advanceProjectPhase(id));
    }
}
