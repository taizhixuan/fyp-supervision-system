package com.fyp.supervision.controller.student;

import com.fyp.supervision.service.PersonalDataExportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.Map;

@RestController
@RequestMapping("/student/me")
@RequiredArgsConstructor
public class StudentDataExportController {

    private final PersonalDataExportService personalDataExportService;

    /**
     * Returns the student's complete personal-data record as JSON for download
     * (PDPA right of access). Audited.
     */
    @GetMapping("/data-export")
    public ResponseEntity<Map<String, Object>> exportData(@AuthenticationPrincipal UserDetails user) {
        Long userId = Long.parseLong(user.getUsername());
        Map<String, Object> payload = personalDataExportService.exportForStudent(userId);
        String filename = "fyp-personal-data-" + userId + "-" + LocalDate.now() + ".json";
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.APPLICATION_JSON)
                .body(payload);
    }
}
