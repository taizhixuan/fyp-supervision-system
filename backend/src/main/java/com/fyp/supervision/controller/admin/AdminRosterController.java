package com.fyp.supervision.controller.admin;

import com.fyp.supervision.service.AdminRosterService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/admin/roster")
@RequiredArgsConstructor
public class AdminRosterController {

    private final AdminRosterService rosterService;

    @GetMapping("/students")
    public ResponseEntity<?> listStudents() {
        return ResponseEntity.ok(Map.of("entries", rosterService.listStudents()));
    }

    @GetMapping("/supervisors")
    public ResponseEntity<?> listSupervisors() {
        return ResponseEntity.ok(Map.of("entries", rosterService.listSupervisors()));
    }

    @PostMapping("/students/import")
    public ResponseEntity<?> importStudents(
            @AuthenticationPrincipal UserDetails user,
            @RequestParam("file") MultipartFile file) {
        Long uploadedBy = user != null ? Long.parseLong(user.getUsername()) : null;
        return ResponseEntity.ok(rosterService.importStudents(file, uploadedBy));
    }

    @PostMapping("/supervisors/import")
    public ResponseEntity<?> importSupervisors(
            @AuthenticationPrincipal UserDetails user,
            @RequestParam("file") MultipartFile file) {
        Long uploadedBy = user != null ? Long.parseLong(user.getUsername()) : null;
        return ResponseEntity.ok(rosterService.importSupervisors(file, uploadedBy));
    }

    @DeleteMapping("/students/{id}")
    public ResponseEntity<Void> deleteStudent(@PathVariable Long id) {
        rosterService.deleteStudent(id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/supervisors/{id}")
    public ResponseEntity<Void> deleteSupervisor(@PathVariable Long id) {
        rosterService.deleteSupervisor(id);
        return ResponseEntity.noContent().build();
    }
}
