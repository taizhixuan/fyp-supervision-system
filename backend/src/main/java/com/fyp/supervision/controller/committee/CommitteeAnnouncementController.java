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
        // Include scheduled (not-yet-published) announcements so the committee can see and
        // manage what they have queued for a future publish time.
        List<Map<String, Object>> dtos = announcementService.listForStaff(pageable);
        return ResponseEntity.ok(Map.of("announcements", dtos, "total", dtos.size()));
    }

    // Multipart-only. The frontend always sends FormData with a `data` JSON part
    // + optional `files`. Mixing @RequestBody with @RequestPart interacts badly
    // with Tomcat's CharacterEncodingFilter (it appends `;charset=UTF-8` to the
    // multipart Content-Type), and Spring then can't find a converter for the
    // augmented header → HttpMediaTypeNotSupportedException 500.
    @PostMapping
    public ResponseEntity<?> createAnnouncement(
            @AuthenticationPrincipal UserDetails user,
            @RequestPart(value = "data") String dataJson,
            @RequestPart(value = "files", required = false) MultipartFile[] files) {
        Long userId = Long.parseLong(user.getUsername());
        Map<String, Object> dto = announcementService.createFromMultipart(userId, dataJson, files);
        return ResponseEntity.ok(dto);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getAnnouncement(@PathVariable Long id) {
        return ResponseEntity.ok(announcementService.get(id));
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
