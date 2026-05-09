package com.fyp.supervision.controller.admin;

import com.fyp.supervision.entity.Deadline;
import com.fyp.supervision.entity.FypCycle;
import com.fyp.supervision.enums.CycleStatus;
import com.fyp.supervision.exception.BadRequestException;
import com.fyp.supervision.exception.ConflictException;
import com.fyp.supervision.exception.ResourceNotFoundException;
import com.fyp.supervision.repository.DeadlineRepository;
import com.fyp.supervision.repository.FypCycleRepository;
import com.fyp.supervision.repository.ProjectRepository;
import com.fyp.supervision.repository.UserAccountRepository;
import com.fyp.supervision.service.AdminService;
import com.fyp.supervision.service.AuditService;
import com.fyp.supervision.service.CycleLifecycleService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin/cycles")
@RequiredArgsConstructor
@Slf4j
public class AdminCycleController {
    private final FypCycleRepository cycleRepository;
    private final DeadlineRepository deadlineRepository;
    private final ProjectRepository projectRepository;
    private final AdminService adminService;
    private final CycleLifecycleService cycleLifecycleService;
    private final AuditService auditService;
    private final UserAccountRepository userAccountRepository;

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

    /** Trivial marker to confirm the backend is running this build. */
    @GetMapping("/_meta")
    public ResponseEntity<?> meta() {
        return ResponseEntity.ok(Map.of(
                "module", "AdminCycleController",
                "build", "cycle-direct-update-2026-05-10"
        ));
    }

    @GetMapping
    public ResponseEntity<?> getCycles(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String type) {
        return ResponseEntity.ok(adminService.getCycles(status, type));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getCycle(@PathVariable Long id) {
        return ResponseEntity.ok(adminService.getCycleDetail(id));
    }

    @PostMapping
    @Transactional
    public ResponseEntity<?> createCycle(@RequestBody Map<String, Object> data) {
        String cycleCode = stringField(data, "cycleCode");
        String cycleType = normaliseCycleType(stringField(data, "cycleType"));
        if (cycleCode == null || cycleCode.isBlank()) {
            throw new BadRequestException("cycleCode is required.");
        }
        if (cycleRepository.existsByCycleCode(cycleCode)) {
            throw new ConflictException("Cycle code is already in use.");
        }
        LocalDate startDate = parseDate(data.get("startDate"), "startDate");
        LocalDate endDate = parseDate(data.get("endDate"), "endDate");
        if (startDate == null || endDate == null) {
            throw new BadRequestException("startDate and endDate are required.");
        }
        if (endDate.isBefore(startDate)) {
            throw new BadRequestException("endDate must be on or after startDate.");
        }

        FypCycle cycle = FypCycle.builder()
                .cycleCode(cycleCode)
                .cycleType(cycleType)
                .academicYear(stringField(data, "academicYear"))
                .semester(intField(data, "semester"))
                .startDate(startDate)
                .endDate(endDate)
                .status(CycleStatus.PLANNING)
                .build();
        FypCycle saved = cycleRepository.save(cycle);
        return ResponseEntity.ok(Map.of("cycleId", saved.getCycleId()));
    }

    @PutMapping("/{id}")
    @Transactional
    public ResponseEntity<?> updateCycle(@PathVariable Long id, @RequestBody Map<String, Object> data) {
        FypCycle cycle = cycleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cycle not found"));

        if (data.containsKey("cycleCode")) {
            String code = stringField(data, "cycleCode");
            if (code != null && !code.isBlank() && !code.equals(cycle.getCycleCode())) {
                if (cycleRepository.existsByCycleCode(code)) {
                    throw new ConflictException("Cycle code is already in use.");
                }
                cycle.setCycleCode(code);
            }
        }
        if (data.containsKey("cycleType")) cycle.setCycleType(normaliseCycleType(stringField(data, "cycleType")));
        if (data.containsKey("academicYear")) cycle.setAcademicYear(stringField(data, "academicYear"));
        if (data.containsKey("semester")) cycle.setSemester(intField(data, "semester"));
        if (data.containsKey("startDate")) {
            LocalDate sd = parseDate(data.get("startDate"), "startDate");
            if (sd != null) cycle.setStartDate(sd);
        }
        if (data.containsKey("endDate")) {
            LocalDate ed = parseDate(data.get("endDate"), "endDate");
            if (ed != null) cycle.setEndDate(ed);
        }
        if (cycle.getEndDate().isBefore(cycle.getStartDate())) {
            throw new BadRequestException("endDate must be on or after startDate.");
        }
        cycleRepository.save(cycle);
        if (data.containsKey("status")) {
            CycleStatus next = parseStatus(stringField(data, "status"));
            validateTransition(cycle, next);
            cycleLifecycleService.setCycleStatus(cycle.getCycleId(), next);
            return ResponseEntity.ok(Map.of("cycleId", cycle.getCycleId(), "status", next.name()));
        }
        return ResponseEntity.ok(Map.of(
                "cycleId", cycle.getCycleId(),
                "status", cycle.getStatus().name()
        ));
    }

    @PostMapping("/{id}/activate")
    public ResponseEntity<?> activateCycle(@PathVariable Long id,
                                           @AuthenticationPrincipal UserDetails admin,
                                           HttpServletRequest httpRequest) {
        log.info("Activate cycle {} requested", id);
        FypCycle cycle = cycleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cycle not found"));
        validateTransition(cycle, CycleStatus.ACTIVE);
        // Direct UPDATE — bypasses entity merge/flush so no commit-time surprises.
        cycleLifecycleService.activateCycleAtomically(cycle.getCycleId(), cycle.getCycleType());

        int attached = 0;
        try {
            FypCycle refreshed = cycleRepository.findById(id).orElse(null);
            if (refreshed != null) {
                attached = cycleLifecycleService.backfillFyp1Placeholders(refreshed);
            }
        } catch (Exception ex) {
            log.warn("Backfill after activating cycle {} failed", id, ex);
        }
        auditService.record(adminFromPrincipal(admin), "CYCLE_ACTIVATED", "FYP_CYCLE",
                String.valueOf(id),
                cycle.getCycleType() + " " + cycle.getAcademicYear() + " — " + attached + " students attached",
                httpRequest);
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("cycleId", id);
        body.put("status", CycleStatus.ACTIVE.name());
        body.put("studentsAttached", attached);
        return ResponseEntity.ok(body);
    }

    @PostMapping("/{id}/complete")
    public ResponseEntity<?> completeCycle(@PathVariable Long id,
                                           @AuthenticationPrincipal UserDetails admin,
                                           HttpServletRequest httpRequest) {
        log.info("Complete cycle {} requested", id);
        FypCycle cycle = cycleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cycle not found"));
        validateTransition(cycle, CycleStatus.COMPLETED);
        cycleLifecycleService.setCycleStatus(id, CycleStatus.COMPLETED);
        auditService.record(adminFromPrincipal(admin), "CYCLE_COMPLETED", "FYP_CYCLE",
                String.valueOf(id),
                cycle.getCycleType() + " " + cycle.getAcademicYear(), httpRequest);
        return ResponseEntity.ok(Map.of("cycleId", id, "status", CycleStatus.COMPLETED.name()));
    }

    @PostMapping("/{id}/archive")
    public ResponseEntity<?> archiveCycle(@PathVariable Long id,
                                          @AuthenticationPrincipal UserDetails admin,
                                          HttpServletRequest httpRequest) {
        log.info("Archive cycle {} requested", id);
        FypCycle cycle = cycleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cycle not found"));
        validateTransition(cycle, CycleStatus.ARCHIVED);
        cycleLifecycleService.setCycleStatus(id, CycleStatus.ARCHIVED);
        auditService.record(adminFromPrincipal(admin), "CYCLE_ARCHIVED", "FYP_CYCLE",
                String.valueOf(id),
                cycle.getCycleType() + " " + cycle.getAcademicYear(), httpRequest);
        return ResponseEntity.ok(Map.of("cycleId", id, "status", CycleStatus.ARCHIVED.name()));
    }

    /** Resolve the admin principal to a UserAccount (for audit-log actor field). */
    private com.fyp.supervision.entity.UserAccount adminFromPrincipal(UserDetails principal) {
        if (principal == null) return null;
        try {
            return userAccountRepository.findById(Long.parseLong(principal.getUsername())).orElse(null);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCycle(@PathVariable Long id) {
        log.info("Delete cycle {} requested", id);
        FypCycle cycle = cycleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cycle not found"));
        if (cycle.getStatus() != CycleStatus.PLANNING && cycle.getStatus() != CycleStatus.ARCHIVED) {
            throw new BadRequestException(
                    "Only PLANNING or ARCHIVED cycles can be deleted. Complete and archive the cycle first.");
        }
        long projectCount = projectRepository.countByCycle_CycleId(id);
        if (projectCount > 0) {
            throw new BadRequestException(
                    "Cannot delete a cycle that has " + projectCount
                            + " project(s) attached. Detach or archive them first.");
        }
        try {
            cycleLifecycleService.deleteCycleAtomically(id);
        } catch (DataIntegrityViolationException ex) {
            log.warn("Delete cycle {} blocked by integrity constraint", id, ex);
            throw new BadRequestException(
                    "Cannot delete cycle: it is still referenced by other records.");
        }
        return ResponseEntity.noContent().build();
    }

    /**
     * Pre-flight validation only — does not mutate. The actual write happens via the
     * direct UPDATE in {@code CycleLifecycleService}, which avoids JPA dirty-checking
     * and commit-time flush failures.
     */
    private void validateTransition(FypCycle cycle, CycleStatus next) {
        CycleStatus current = cycle.getStatus();
        if (current == next) return;
        boolean allowed = switch (current) {
            case PLANNING -> next == CycleStatus.ACTIVE || next == CycleStatus.COMPLETED || next == CycleStatus.ARCHIVED;
            case ACTIVE -> next == CycleStatus.COMPLETED || next == CycleStatus.PLANNING;
            case COMPLETED -> next == CycleStatus.ARCHIVED || next == CycleStatus.ACTIVE;
            case ARCHIVED -> false;
        };
        if (!allowed) {
            throw new BadRequestException("Cannot transition cycle from " + current + " to " + next + ".");
        }
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
    @Transactional
    public ResponseEntity<?> createFromTemplate(@RequestBody Map<String, Object> data) {
        String phase = data.get("phase") != null ? data.get("phase").toString().toUpperCase() : "FYP1";
        if (!"FYP1".equals(phase) && !"FYP2".equals(phase)) {
            throw new BadRequestException("Phase must be FYP1 or FYP2.");
        }
        String cycleCode = stringField(data, "cycleCode");
        if (cycleCode == null || cycleCode.isBlank()) {
            throw new BadRequestException("cycleCode is required.");
        }
        if (cycleRepository.existsByCycleCode(cycleCode)) {
            throw new ConflictException("Cycle code is already in use.");
        }
        LocalDate startDate = parseDate(data.get("startDate"), "startDate");
        LocalDate endDate = parseDate(data.get("endDate"), "endDate");
        if (startDate == null || endDate == null) {
            throw new BadRequestException("startDate and endDate are required.");
        }
        if (endDate.isBefore(startDate)) {
            throw new BadRequestException("endDate must be on or after startDate.");
        }

        FypCycle cycle = FypCycle.builder()
                .cycleCode(cycleCode)
                .cycleType(phase)
                .academicYear(stringField(data, "academicYear"))
                .semester(intField(data, "semester"))
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

    private static String stringField(Map<String, Object> data, String key) {
        Object v = data.get(key);
        return v == null ? null : v.toString();
    }

    private static Integer intField(Map<String, Object> data, String key) {
        Object v = data.get(key);
        if (v == null) return null;
        if (v instanceof Number n) return n.intValue();
        try {
            return Integer.parseInt(v.toString());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private static LocalDate parseDate(Object value, String fieldName) {
        if (value == null) return null;
        String s = value.toString();
        if (s.isBlank()) return null;
        try {
            // Accept either ISO date (2025-09-01) or full ISO datetime (2025-09-01T00:00:00.000Z).
            int t = s.indexOf('T');
            return LocalDate.parse(t < 0 ? s : s.substring(0, t));
        } catch (DateTimeParseException e) {
            throw new BadRequestException(fieldName + " must be a valid ISO date (YYYY-MM-DD).");
        }
    }

    private static CycleStatus parseStatus(String value) {
        if (value == null) throw new BadRequestException("status is required.");
        try {
            return CycleStatus.valueOf(value.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Unknown cycle status: " + value);
        }
    }

    private static String normaliseCycleType(String value) {
        if (value == null) return null;
        String upper = value.trim().toUpperCase();
        if (!"FYP1".equals(upper) && !"FYP2".equals(upper)) {
            throw new BadRequestException("cycleType must be FYP1 or FYP2.");
        }
        return upper;
    }
}
