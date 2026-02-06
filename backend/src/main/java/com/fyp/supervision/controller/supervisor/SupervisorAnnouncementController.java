package com.fyp.supervision.controller.supervisor;

import com.fyp.supervision.entity.Announcement;
import com.fyp.supervision.entity.UserAccount;
import com.fyp.supervision.enums.AnnouncementStatus;
import com.fyp.supervision.exception.ResourceNotFoundException;
import com.fyp.supervision.repository.AnnouncementRepository;
import com.fyp.supervision.repository.UserAccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/supervisor/announcements")
@RequiredArgsConstructor
public class SupervisorAnnouncementController {
    private final AnnouncementRepository announcementRepository;
    private final UserAccountRepository userAccountRepository;

    @GetMapping
    public ResponseEntity<?> getAnnouncements(@AuthenticationPrincipal UserDetails user) {
        Long userId = Long.parseLong(user.getUsername());
        Page<Announcement> announcements = announcementRepository.findByCreatedBy_UserIdOrderByCreatedAtDesc(userId, Pageable.unpaged());
        return ResponseEntity.ok(Map.of("announcements", announcements.getContent()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Announcement> getAnnouncement(@PathVariable Long id) {
        return ResponseEntity.ok(announcementRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Announcement not found")));
    }

    @PostMapping
    public ResponseEntity<?> createAnnouncement(@AuthenticationPrincipal UserDetails user, @RequestBody Map<String, Object> data) {
        Long userId = Long.parseLong(user.getUsername());
        UserAccount creator = userAccountRepository.findById(userId).orElseThrow();

        Announcement announcement = Announcement.builder()
                .createdBy(creator)
                .scope("SUPERVISEES")
                .title((String) data.get("title"))
                .content((String) data.get("content"))
                .priority((String) data.getOrDefault("priority", "NORMAL"))
                .status(AnnouncementStatus.PUBLISHED)
                .publishAt(LocalDateTime.now())
                .build();

        Announcement saved = announcementRepository.save(announcement);
        return ResponseEntity.ok(Map.of("announcementId", saved.getAnnouncementId()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateAnnouncement(@PathVariable Long id, @RequestBody Map<String, Object> data) {
        Announcement announcement = announcementRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Announcement not found"));
        if (data.containsKey("title")) announcement.setTitle((String) data.get("title"));
        if (data.containsKey("content")) announcement.setContent((String) data.get("content"));
        if (data.containsKey("priority")) announcement.setPriority((String) data.get("priority"));
        announcementRepository.save(announcement);
        return ResponseEntity.ok(Map.of("success", true));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAnnouncement(@PathVariable Long id) {
        announcementRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
