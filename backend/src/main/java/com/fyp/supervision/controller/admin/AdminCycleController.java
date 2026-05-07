package com.fyp.supervision.controller.admin;

import com.fyp.supervision.entity.Deadline;
import com.fyp.supervision.entity.FypCycle;
import com.fyp.supervision.enums.CycleStatus;
import com.fyp.supervision.exception.ResourceNotFoundException;
import com.fyp.supervision.repository.DeadlineRepository;
import com.fyp.supervision.repository.FypCycleRepository;
import com.fyp.supervision.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin/cycles")
@RequiredArgsConstructor
public class AdminCycleController {
    private final FypCycleRepository cycleRepository;
    private final DeadlineRepository deadlineRepository;
    private final AdminService adminService;

    /**
     * Pre-trimester FYP1 timeline derived from the official workflow image.
     * Each entry is (title, deadlineType, audience, dayOffsetFromCycleStart).
     * Negative offsets = before cycle start (FYP1 begins about 6 weeks pre-trimester).
     */
    private static final Object[][] FYP1_TEMPLATE_DEADLINES = new Object[][] {
            { "Announcement of FYP1 Process",   "ANNOUNCEMENT",        "ALL",        -14 },
            { "FYP1 Briefing",                  "BRIEFING",            "STUDENT",      0 },
            { "Submission of Project Proposals","PROPOSAL_SUBMISSION", "SUPERVISOR",  14 },
            { "Acceptance of Project Proposals","PROPOSAL_ACCEPTANCE", "STUDENT",     29 },
            { "Student Confirmation to Project","STUDENT_CONFIRMATION","STUDENT",     30 },
            { "Manual Subject Registration Form","SUBJECT_REG_FORM",   "STUDENT",     30 },
            { "FYP Subject Registration in Clic","SUBJECT_REG_CLIC",   "STUDENT",     44 },
            { "Assignment of Moderators",       "MODERATOR_ASSIGNMENT","COMMITTEE",   77 },
            { "Interim Report Submission",      "INTERIM_REPORT",      "STUDENT",     91 },
    };

    /**
     * FYP2 timeline derived from the official workflow image (Mar/Apr → Jul).
     * Day 0 is start of FYP2 trimester (after Subject Registration in Clic).
     * Marking and Clic submissions are tracked here as informational deadlines —
     * the actual entry happens in eBwise/Clic, not in this system.
     */
    private static final Object[][] FYP2_TEMPLATE_DEADLINES = new Object[][] {
            { "Subject Registration for FYP2 (Clic)", "SUBJECT_REG_CLIC", "STUDENT",       7 },
            { "Meeting Logs Period Begins",            "MEETING_LOGS",     "STUDENT",      14 },
            { "Plagiarism Checking",                   "PLAGIARISM",       "STUDENT",      91 },
            { "Final Report Submission (Draft)",       "FINAL_REPORT",     "STUDENT",      98 },
            { "Poster Presentation Slot Allocation",   "POSTER_SLOTS",     "COMMITTEE",    98 },
            { "Poster Presentation & Evaluation",      "POSTER_EVAL",      "STUDENT",     105 },
            { "Feedback on Amendments / Corrections",  "FEEDBACK",         "SUPERVISOR",  112 },
            { "Final Soft Copy Report Submission",     "FINAL_SOFT_COPY",  "STUDENT",     112 },
            { "Enter Final Marks in Clic",             "MARK_ENTRY",       "SUPERVISOR",  112 },
    };

    private static Object[][] templateFor(String phase) {
        if ("FYP2".equalsIgnoreCase(phase)) return FYP2_TEMPLATE_DEADLINES;
        return FYP1_TEMPLATE_DEADLINES;
    }

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

    @GetMapping("/template")
    public ResponseEntity<?> getTemplate(@RequestParam(defaultValue = "FYP1") String phase) {
        if (!"FYP1".equalsIgnoreCase(phase) && !"FYP2".equalsIgnoreCase(phase)) {
            return ResponseEntity.ok(Map.of("phase", phase, "deadlines", List.of()));
        }
        String normalized = phase.toUpperCase();
        List<Map<String, Object>> deadlines = new ArrayList<>();
        for (Object[] row : templateFor(normalized)) {
            Map<String, Object> d = new LinkedHashMap<>();
            d.put("title", row[0]);
            d.put("deadlineType", row[1]);
            d.put("audience", row[2]);
            d.put("dayOffset", row[3]);
            deadlines.add(d);
        }
        return ResponseEntity.ok(Map.of("phase", normalized, "deadlines", deadlines));
    }

    @PostMapping("/from-template")
    public ResponseEntity<?> createFromTemplate(@RequestBody Map<String, Object> data) {
        String phase = data.get("phase") != null ? data.get("phase").toString().toUpperCase() : "FYP1";
        if (!"FYP1".equals(phase) && !"FYP2".equals(phase)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Phase must be FYP1 or FYP2"));
        }
        LocalDate startDate = LocalDate.parse((String) data.get("startDate"));
        LocalDate endDate = LocalDate.parse((String) data.get("endDate"));
        FypCycle cycle = FypCycle.builder()
                .cycleCode((String) data.get("cycleCode"))
                .cycleType(phase)
                .academicYear((String) data.get("academicYear"))
                .semester(data.get("semester") != null ? ((Number) data.get("semester")).intValue() : null)
                .startDate(startDate)
                .endDate(endDate)
                .status(CycleStatus.PLANNING)
                .build();
        FypCycle savedCycle = cycleRepository.save(cycle);

        int created = 0;
        for (Object[] row : templateFor(phase)) {
            int offset = ((Number) row[3]).intValue();
            LocalDate due = startDate.plusDays(offset);
            if (due.isAfter(endDate)) due = endDate;
            Deadline deadline = Deadline.builder()
                    .cycle(savedCycle)
                    .title((String) row[0])
                    .deadlineType((String) row[1])
                    .audience((String) row[2])
                    .dueDate(due)
                    .description("Auto-created from " + phase + " standard template")
                    .build();
            deadlineRepository.save(deadline);
            created++;
        }
        return ResponseEntity.ok(Map.of(
                "cycleId", savedCycle.getCycleId(),
                "deadlinesCreated", created,
                "phase", phase
        ));
    }
}
