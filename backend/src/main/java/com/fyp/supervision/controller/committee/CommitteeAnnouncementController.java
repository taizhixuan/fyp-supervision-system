package com.fyp.supervision.controller.committee;

import com.fyp.supervision.entity.Announcement;
import com.fyp.supervision.entity.UserAccount;
import com.fyp.supervision.enums.AnnouncementStatus;
import com.fyp.supervision.exception.ResourceNotFoundException;
import com.fyp.supervision.repository.AnnouncementRepository;
import com.fyp.supervision.repository.UserAccountRepository;
import com.fyp.supervision.service.CommitteeService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/committee/announcements")
@RequiredArgsConstructor
public class CommitteeAnnouncementController {
    private final AnnouncementRepository announcementRepository;
    private final UserAccountRepository userAccountRepository;
    private final CommitteeService committeeService;

    @GetMapping
    public ResponseEntity<?> getAnnouncements(Pageable pageable) {
        Page<Announcement> page = announcementRepository.findByStatusOrderByCreatedAtDesc(AnnouncementStatus.PUBLISHED, pageable);
        List<Map<String, Object>> dtos = page.getContent().stream()
                .map(committeeService::buildAnnouncementDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(Map.of("announcements", dtos, "total", page.getTotalElements()));
    }

    @PostMapping
    public ResponseEntity<?> createAnnouncement(@AuthenticationPrincipal UserDetails user, @RequestBody Map<String, Object> data) {
        Long userId = Long.parseLong(user.getUsername());
        UserAccount creator = userAccountRepository.findById(userId).orElseThrow();
        Announcement announcement = Announcement.builder()
                .createdBy(creator)
                .scope((String) data.getOrDefault("scope", "ALL"))
                .title((String) data.get("title"))
                .content((String) data.get("content"))
                .priority((String) data.getOrDefault("priority", "NORMAL"))
                .status(AnnouncementStatus.PUBLISHED)
                .publishAt(LocalDateTime.now())
                .build();
        Announcement saved = announcementRepository.save(announcement);
        return ResponseEntity.ok(committeeService.buildAnnouncementDto(saved));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateAnnouncement(@PathVariable Long id, @RequestBody Map<String, Object> data) {
        Announcement a = announcementRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Not found"));
        if (data.containsKey("title")) a.setTitle((String) data.get("title"));
        if (data.containsKey("content")) a.setContent((String) data.get("content"));
        announcementRepository.save(a);
        return ResponseEntity.ok(Map.of("success", true));
    }

    @PostMapping("/{id}/archive")
    public ResponseEntity<?> archiveAnnouncement(@PathVariable Long id) {
        Announcement a = announcementRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Not found"));
        a.setStatus(AnnouncementStatus.ARCHIVED);
        announcementRepository.save(a);
        return ResponseEntity.ok(Map.of("success", true));
    }
}
