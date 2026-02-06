package com.fyp.supervision.controller.student;

import com.fyp.supervision.service.StudentService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/supervisors")
@RequiredArgsConstructor
public class SupervisorDirectoryController {
    private final StudentService studentService;

    @GetMapping
    public ResponseEntity<Map<String, Object>> listSupervisors(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String faculty,
            @RequestParam(required = false) Boolean availableOnly,
            Pageable pageable) {
        return ResponseEntity.ok(studentService.searchSupervisorsDto(search, faculty, availableOnly, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getSupervisor(@PathVariable Long id) {
        return ResponseEntity.ok(studentService.getSupervisorDetailDto(id));
    }
}
