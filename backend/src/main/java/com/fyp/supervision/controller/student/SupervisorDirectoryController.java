package com.fyp.supervision.controller.student;

import com.fyp.supervision.service.StudentService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/supervisors")
@RequiredArgsConstructor
public class SupervisorDirectoryController {
    private final StudentService studentService;

    // The wire is 1-indexed both ways: the response returns `page` as
    // `Page.getNumber() + 1`, and the frontend (SupervisorDirectory.tsx) sends
    // `page=1&limit=6` to match. Don't bind Spring's Pageable here — its
    // resolver expects zero-indexed `page` + `size` and would silently misread
    // the request, returning an empty content slice with a non-zero total.
    @GetMapping
    public ResponseEntity<Map<String, Object>> listSupervisors(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String faculty,
            @RequestParam(required = false) Boolean availableOnly,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int limit) {
        int safePage = Math.max(1, page);
        int safeLimit = Math.min(Math.max(1, limit), 100);
        Pageable pageable = PageRequest.of(safePage - 1, safeLimit);
        return ResponseEntity.ok(studentService.searchSupervisorsDto(search, faculty, availableOnly, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getSupervisor(@PathVariable Long id) {
        return ResponseEntity.ok(studentService.getSupervisorDetailDto(id));
    }
}
