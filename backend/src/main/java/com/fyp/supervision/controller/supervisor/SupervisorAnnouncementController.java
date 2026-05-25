package com.fyp.supervision.controller.supervisor;

import com.fyp.supervision.entity.Announcement;
import com.fyp.supervision.exception.ResourceNotFoundException;
import com.fyp.supervision.repository.AnnouncementRepository;
import com.fyp.supervision.service.AnnouncementService;
import com.fyp.supervision.service.SupervisorService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
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

    // Multipart-only endpoint. The frontend always sends FormData with a `data`
    // JSON part + optional `files`. We avoid both `consumes` matchers and a
    // `@RequestBody` companion arg because either path interacts badly with
    // Tomcat's CharacterEncodingFilter appending `;charset=UTF-8` to the
    // Content-Type — Spring then can't find a converter for
    // `multipart/form-data;...;charset=UTF-8` and throws
    // HttpMediaTypeNotSupportedException (500).
    @PostMapping
    public ResponseEntity<?> createAnnouncement(
            @AuthenticationPrincipal UserDetails user,
            @RequestPart(value = "data") String dataJson,
            @RequestPart(value = "files", required = false) MultipartFile[] files) {
        Long userId = Long.parseLong(user.getUsername());
        Map<String, Object> dto = announcementService.createFromMultipart(userId, dataJson, files);
        return ResponseEntity.ok(dto);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateAnnouncement(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable Long id,
            @RequestBody Map<String, Object> data) {
        Long userId = Long.parseLong(user.getUsername());
        Announcement announcement = requireOwnAnnouncement(userId, id);
        if (data.containsKey("title")) announcement.setTitle((String) data.get("title"));
        if (data.containsKey("content")) announcement.setContent((String) data.get("content"));
        if (data.containsKey("priority")) announcement.setPriority((String) data.get("priority"));
        announcementRepository.save(announcement);
        return ResponseEntity.ok(announcementService.buildDto(announcement));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAnnouncement(
            @AuthenticationPrincipal UserDetails user, @PathVariable Long id) {
        Long userId = Long.parseLong(user.getUsername());
        requireOwnAnnouncement(userId, id);
        announcementService.delete(id);
        return ResponseEntity.noContent().build();
    }

    private Announcement requireOwnAnnouncement(Long supervisorUserId, Long announcementId) {
        Announcement announcement = announcementRepository.findById(announcementId)
                .orElseThrow(() -> new ResourceNotFoundException("Announcement not found"));
        if (announcement.getCreatedBy() == null
                || !supervisorUserId.equals(announcement.getCreatedBy().getUserId())) {
            throw new com.fyp.supervision.exception.BadRequestException(
                    "You can only modify announcements you created.");
        }
        return announcement;
    }
}
