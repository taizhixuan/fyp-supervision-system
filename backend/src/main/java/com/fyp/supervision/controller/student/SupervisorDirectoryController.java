package com.fyp.supervision.controller.student;

import com.fyp.supervision.entity.SupervisorProfile;
import com.fyp.supervision.service.StudentService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/supervisors")
@RequiredArgsConstructor
public class SupervisorDirectoryController {
    private final StudentService studentService;

    @GetMapping
    public ResponseEntity<Page<SupervisorProfile>> listSupervisors(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String faculty,
            @RequestParam(required = false) Boolean availableOnly,
            Pageable pageable) {
        return ResponseEntity.ok(studentService.searchSupervisors(search, faculty, availableOnly, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<SupervisorProfile> getSupervisor(@PathVariable Long id) {
        return ResponseEntity.ok(studentService.getSupervisorDetail(id));
    }
}
