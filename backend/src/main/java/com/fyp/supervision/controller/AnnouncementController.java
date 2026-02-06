package com.fyp.supervision.controller;

import com.fyp.supervision.entity.Announcement;
import com.fyp.supervision.enums.AnnouncementStatus;
import com.fyp.supervision.repository.AnnouncementRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

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
        List<Map<String, Object>> dtos = announcements.stream()
                .map(this::buildAnnouncementDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(Map.of("announcements", dtos));
    }

    @GetMapping
    public ResponseEntity<?> getAnnouncements(
            @RequestParam(required = false) String scope,
            Pageable pageable) {
        Page<Announcement> page = announcementRepository.findByStatusOrderByCreatedAtDesc(
                AnnouncementStatus.PUBLISHED, pageable);
        List<Map<String, Object>> dtos = page.getContent().stream()
                .map(this::buildAnnouncementDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(Map.of("announcements", dtos, "total", page.getTotalElements()));
    }

    private Map<String, Object> buildAnnouncementDto(Announcement a) {
        Map<String, Object> dto = new LinkedHashMap<>();
        dto.put("announcementId", a.getAnnouncementId());
        dto.put("scope", a.getScope() != null ? a.getScope() : "ALL");
        dto.put("title", a.getTitle());
        dto.put("content", a.getContent());
        dto.put("priority", a.getPriority() != null ? a.getPriority() : "NORMAL");
        dto.put("publishAt", a.getPublishAt() != null ? a.getPublishAt().toString() : "");
        dto.put("createdAt", a.getCreatedAt() != null ? a.getCreatedAt().toString() : "");
        return dto;
    }
}
