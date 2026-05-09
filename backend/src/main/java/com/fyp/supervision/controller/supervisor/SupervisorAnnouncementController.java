package com.fyp.supervision.controller.supervisor;

import com.fyp.supervision.entity.Announcement;
import com.fyp.supervision.exception.ResourceNotFoundException;
import com.fyp.supervision.repository.AnnouncementRepository;
import com.fyp.supervision.service.AnnouncementService;
import com.fyp.supervision.service.SupervisorService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/supervisor/announcements")
@RequiredArgsConstructor
public class SupervisorAnnouncementController {
    private final AnnouncementRepository announcementRepository;
    private final AnnouncementService announcementService;
    private final SupervisorService supervisorService;

    @GetMapping
    public ResponseEntity<?> getAnnouncements(@AuthenticationPrincipal UserDetails user) {
        Long userId = Long.parseLong(user.getUsername());
        // Inbox + outbox: own announcements + ones broadcast by committee/admin.
        // Each DTO carries a `direction` field ("SENT" or "RECEIVED") so the page can
        // mark ownership and hide Edit/Delete for received items.
        List<Map<String, Object>> announcements = announcementService.listForSupervisor(
                userId, PageRequest.of(0, 100));
        return ResponseEntity.ok(Map.of("announcements", announcements, "total", announcements.size()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getAnnouncement(@PathVariable Long id) {
        return ResponseEntity.ok(announcementService.get(id));
    }

    @PostMapping(consumes = {MediaType.MULTIPART_FORM_DATA_VALUE, MediaType.APPLICATION_JSON_VALUE})
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
        Announcement announcement = announcementRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Announcement not found"));
        if (data.containsKey("title")) announcement.setTitle((String) data.get("title"));
        if (data.containsKey("content")) announcement.setContent((String) data.get("content"));
        if (data.containsKey("priority")) announcement.setPriority((String) data.get("priority"));
        announcementRepository.save(announcement);
        return ResponseEntity.ok(announcementService.buildDto(announcement));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAnnouncement(@PathVariable Long id) {
        announcementService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
