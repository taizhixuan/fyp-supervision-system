package com.fyp.supervision.controller.committee;

import com.fyp.supervision.entity.FypCycle;
import com.fyp.supervision.repository.FypCycleRepository;
import com.fyp.supervision.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/committee/cycles")
@RequiredArgsConstructor
public class CommitteeCycleController {

    private final FypCycleRepository fypCycleRepository;
    private final ProjectRepository projectRepository;

    @GetMapping
    public ResponseEntity<?> listCycles() {
        List<FypCycle> cycles = fypCycleRepository.findAllOrderedForDropdown();
        List<Map<String, Object>> out = cycles.stream().map(c -> {
            long count = projectRepository.findAllByCycleId(c.getCycleId(),
                    org.springframework.data.domain.PageRequest.of(0, 1)).getTotalElements();
            Map<String, Object> dto = new LinkedHashMap<>();
            dto.put("cycleId", c.getCycleId());
            dto.put("cycleCode", c.getCycleCode());
            dto.put("cycleType", c.getCycleType());
            dto.put("academicYear", c.getAcademicYear());
            dto.put("semester", c.getSemester());
            dto.put("startDate", c.getStartDate() != null ? c.getStartDate().toString() : null);
            dto.put("endDate", c.getEndDate() != null ? c.getEndDate().toString() : null);
            dto.put("status", c.getStatus() != null ? c.getStatus().name() : null);
            dto.put("projectCount", count);
            return dto;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(Map.of("cycles", out, "total", out.size()));
    }
}
