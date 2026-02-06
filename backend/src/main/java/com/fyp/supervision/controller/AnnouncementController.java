package com.fyp.supervision.controller;

import com.fyp.supervision.entity.Announcement;
import com.fyp.supervision.enums.AnnouncementStatus;
import com.fyp.supervision.repository.AnnouncementRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/announcements")
@RequiredArgsConstructor
public class AnnouncementController {

    private final AnnouncementRepository announcementRepository;

    @GetMapping("/latest")
    public ResponseEntity<?> getLatestAnnouncements(@RequestParam(defaultValue = "5") int limit) {
        List<Announcement> announcements = announcementRepository.findTop5ByStatusOrderByCreatedAtDesc(AnnouncementStatus.PUBLISHED);
        if (announcements.size() > limit) {
            announcements = announcements.subList(0, limit);
        }
        return ResponseEntity.ok(Map.of("announcements", announcements));
    }

    @GetMapping
    public ResponseEntity<Page<Announcement>> getAnnouncements(
            @RequestParam(required = false) String scope,
            Pageable pageable) {
        Page<Announcement> announcements = announcementRepository.findByStatusOrderByCreatedAtDesc(
                AnnouncementStatus.PUBLISHED, pageable);
        return ResponseEntity.ok(announcements);
    }
}
