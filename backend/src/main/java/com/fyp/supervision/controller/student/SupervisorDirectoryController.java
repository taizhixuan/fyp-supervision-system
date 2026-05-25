package com.fyp.supervision.controller.student;

import com.fyp.supervision.exception.BadRequestException;
import com.fyp.supervision.service.StudentService;
import com.fyp.supervision.service.SupervisorAvailabilityService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.Map;

@RestController
@RequestMapping("/supervisors")
@RequiredArgsConstructor
public class SupervisorDirectoryController {
    private final StudentService studentService;
    private final SupervisorAvailabilityService availabilityService;

    // The wire is 1-indexed both ways: the response returns `page` as
    // `Page.getNumber() + 1`, and the frontend (SupervisorDirectory.tsx) sends
    // `page=1&limit=6` to match. Don't bind Spring's Pageable here — its
    // resolver expects zero-indexed `page` + `size` and would silently misread
    // the request, returning an empty content slice with a non-zero total.
    @GetMapping
    public ResponseEntity<Map<String, Object>> listSupervisors(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String faculty,
            @RequestParam(required = false) String researchArea,
            @RequestParam(required = false) Boolean availableOnly,
            @RequestParam(required = false) String sort,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int limit) {
        int safePage = Math.max(1, page);
        int safeLimit = Math.min(Math.max(1, limit), 100);
        Pageable pageable = PageRequest.of(safePage - 1, safeLimit, resolveSort(sort));
        return ResponseEntity.ok(studentService.searchSupervisorsDto(search, faculty, researchArea, availableOnly, pageable));
    }

    private Sort resolveSort(String sort) {
        // Whitelist sort keys — we sort on SupervisorProfile (root). For name
        // sort we join through user.fullName via a property path Spring Data
        // resolves automatically.
        if (sort == null || sort.isBlank()) return Sort.by(Sort.Direction.ASC, "user.fullName");
        return switch (sort) {
            case "name_desc" -> Sort.by(Sort.Direction.DESC, "user.fullName");
            case "load_asc" -> Sort.by(Sort.Direction.ASC, "currentLoad");
            case "load_desc" -> Sort.by(Sort.Direction.DESC, "currentLoad");
            default -> Sort.by(Sort.Direction.ASC, "user.fullName");
        };
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getSupervisor(@PathVariable Long id) {
        return ResponseEntity.ok(studentService.getSupervisorDetailDto(id));
    }

    /**
     * Concrete bookable slots for the supervisor, expanded from their weekly
     * recurring availability and masking out taken meetings. Dates as ISO
     * (yyyy-MM-dd); `to` is exclusive. Default = next 14 days from today.
     */
    @GetMapping("/{id}/available-slots")
    public ResponseEntity<Map<String, Object>> getAvailableSlots(
            @PathVariable Long id,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to) {
        LocalDate fromDate = parseDate(from, LocalDate.now());
        LocalDate toDate = parseDate(to, fromDate.plusDays(14));
        return ResponseEntity.ok(availabilityService.getAvailableSlots(id, fromDate, toDate));
    }

    private LocalDate parseDate(String raw, LocalDate fallback) {
        if (raw == null || raw.isBlank()) return fallback;
        try {
            return LocalDate.parse(raw.trim());
        } catch (DateTimeParseException e) {
            throw new BadRequestException("Invalid date (expected yyyy-MM-dd): " + raw);
        }
    }
}
