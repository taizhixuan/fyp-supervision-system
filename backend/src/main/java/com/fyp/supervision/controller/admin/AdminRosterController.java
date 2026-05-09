package com.fyp.supervision.controller.admin;

import com.fyp.supervision.service.AdminRosterService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin/roster")
@RequiredArgsConstructor
@Slf4j
public class AdminRosterController {

    private final AdminRosterService rosterService;

    @GetMapping("/students")
    public ResponseEntity<?> listStudents() {
        try {
            List<Map<String, Object>> entries = rosterService.listStudents();
            Map<String, Object> body = new HashMap<>();
            body.put("entries", entries != null ? entries : List.of());
            return ResponseEntity.ok(body);
        } catch (Exception ex) {
            log.error("List student roster failed", ex);
            throw new RuntimeException("List student roster failed: "
                    + ex.getClass().getSimpleName() + " — " + ex.getMessage(), ex);
        }
    }

    @GetMapping("/supervisors")
    public ResponseEntity<?> listSupervisors() {
        try {
            List<Map<String, Object>> entries = rosterService.listSupervisors();
            Map<String, Object> body = new HashMap<>();
            body.put("entries", entries != null ? entries : List.of());
            return ResponseEntity.ok(body);
        } catch (Exception ex) {
            log.error("List supervisor roster failed", ex);
            throw new RuntimeException("List supervisor roster failed: "
                    + ex.getClass().getSimpleName() + " — " + ex.getMessage(), ex);
        }
    }

    @PostMapping("/students/import")
    public ResponseEntity<?> importStudents(
            @AuthenticationPrincipal UserDetails user,
            @RequestParam("file") MultipartFile file) {
        Long uploadedBy = user != null ? Long.parseLong(user.getUsername()) : null;
        try {
            return ResponseEntity.ok(rosterService.importStudents(file, uploadedBy));
        } catch (Exception ex) {
            log.error("Import student roster failed", ex);
            throw ex;
        }
    }

    @PostMapping("/supervisors/import")
    public ResponseEntity<?> importSupervisors(
            @AuthenticationPrincipal UserDetails user,
            @RequestParam("file") MultipartFile file) {
        Long uploadedBy = user != null ? Long.parseLong(user.getUsername()) : null;
        try {
            return ResponseEntity.ok(rosterService.importSupervisors(file, uploadedBy));
        } catch (Exception ex) {
            log.error("Import supervisor roster failed", ex);
            throw ex;
        }
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
