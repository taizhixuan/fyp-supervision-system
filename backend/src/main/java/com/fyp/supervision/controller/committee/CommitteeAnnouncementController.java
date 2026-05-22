package com.fyp.supervision.controller.committee;

import com.fyp.supervision.entity.Announcement;
import com.fyp.supervision.enums.AnnouncementStatus;
import com.fyp.supervision.exception.ResourceNotFoundException;
import com.fyp.supervision.repository.AnnouncementRepository;
import com.fyp.supervision.service.AnnouncementService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/committee/announcements")
@RequiredArgsConstructor
public class CommitteeAnnouncementController {
    private final AnnouncementRepository announcementRepository;
    private final AnnouncementService announcementService;

    @GetMapping
    public ResponseEntity<?> getAnnouncements(Pageable pageable) {
        List<Map<String, Object>> dtos = announcementService.listAllPublished(pageable);
        return ResponseEntity.ok(Map.of("announcements", dtos, "total", dtos.size()));
    }

    // No `consumes` restriction: Tomcat's CharacterEncodingFilter appends
    // `;charset=UTF-8` to multipart Content-Type after `setCharacterEncoding`
    // runs, which makes a strict matcher reject the augmented header. Branch on
    // which @RequestPart/@RequestBody is present instead.
    @PostMapping
    public ResponseEntity<?> createAnnouncement(
            @AuthenticationPrincipal UserDetails user,
            @RequestPart(value = "data", required = false) String dataJson,
            @RequestPart(value = "files", required = false) MultipartFile[] files,
            @RequestBody(required = false) Map<String, Object> jsonBody) {
        Long userId = Long.parseLong(user.getUsername());
        Map<String, Object> dto;
        if (dataJson != null && !dataJson.isBlank()) {
            dto = announcementService.createFromMultipart(userId, dataJson, files);
        } else if (jsonBody != null) {
            dto = announcementService.create(userId, jsonBody, null);
        } else {
            return ResponseEntity.badRequest().body(Map.of("message", "Missing announcement payload"));
        }
        return ResponseEntity.ok(dto);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateAnnouncement(@PathVariable Long id, @RequestBody Map<String, Object> data) {
        Announcement a = announcementRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Not found"));
        if (data.containsKey("title")) a.setTitle((String) data.get("title"));
        if (data.containsKey("content")) a.setContent((String) data.get("content"));
        if (data.containsKey("priority")) a.setPriority((String) data.get("priority"));
        announcementRepository.save(a);
        return ResponseEntity.ok(announcementService.buildDto(a));
    }

    @PostMapping("/{id}/archive")
    public ResponseEntity<?> archiveAnnouncement(@PathVariable Long id) {
        Announcement a = announcementRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Not found"));
        a.setStatus(AnnouncementStatus.ARCHIVED);
        announcementRepository.save(a);
        return ResponseEntity.ok(Map.of("success", true));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAnnouncement(@PathVariable Long id) {
        announcementService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
