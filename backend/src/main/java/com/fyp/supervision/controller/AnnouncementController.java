package com.fyp.supervision.controller;

import com.fyp.supervision.entity.AnnouncementAttachment;
import com.fyp.supervision.enums.UserRole;
import com.fyp.supervision.repository.UserAccountRepository;
import com.fyp.supervision.service.AnnouncementService;
import com.fyp.supervision.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/announcements")
@RequiredArgsConstructor
public class AnnouncementController {

    private final AnnouncementService announcementService;
    private final FileStorageService fileStorageService;
    private final UserAccountRepository userAccountRepository;

    @GetMapping("/latest")
    public ResponseEntity<?> getLatestAnnouncements(
            @AuthenticationPrincipal UserDetails user,
            @RequestParam(defaultValue = "5") int limit) {
        List<Map<String, Object>> dtos;
        if (isStudent(user)) {
            dtos = announcementService.latestForStudent(Long.parseLong(user.getUsername()), limit);
        } else {
            dtos = announcementService.listAllPublished(Pageable.ofSize(Math.max(1, limit)));
        }
        return ResponseEntity.ok(Map.of("announcements", dtos));
    }

    // The wire is 1-indexed both ways: callers send `page=1&limit=20` to match
    // the convention used by SupervisorDirectoryController. Don't bind Spring's
    // Pageable here — its resolver expects zero-indexed `page` + `size` and
    // would silently misread the request, returning an empty content slice
    // with a non-zero total.
    @GetMapping
    public ResponseEntity<?> getAnnouncements(
            @AuthenticationPrincipal UserDetails user,
            @RequestParam(required = false) String scope,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int limit) {
        int safePage = Math.max(1, page);
        int safeLimit = Math.min(Math.max(1, limit), 100);
        Pageable pageable = PageRequest.of(safePage - 1, safeLimit);
        if (isStudent(user)) {
            Page<Map<String, Object>> pg = announcementService.listForStudent(
                    Long.parseLong(user.getUsername()), pageable);
            return ResponseEntity.ok(Map.of(
                    "announcements", pg.getContent(),
                    "total", pg.getTotalElements()));
        }
        List<Map<String, Object>> dtos = announcementService.listAllPublished(pageable);
        return ResponseEntity.ok(Map.of("announcements", dtos, "total", dtos.size()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getAnnouncement(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable Long id) {
        Long userId = parseUserId(user);
        return ResponseEntity.ok(announcementService.getForUser(id, userId));
    }

    @PostMapping("/{id}/read")
    public ResponseEntity<?> markRead(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable Long id) {
        Long userId = parseUserId(user);
        boolean inserted = announcementService.recordRead(id, userId);
        return ResponseEntity.ok(Map.of("ok", true, "firstRead", inserted));
    }

    @PostMapping("/mark-all-read")
    public ResponseEntity<?> markAllRead(
            @AuthenticationPrincipal UserDetails user,
            @RequestBody Map<String, Object> body) {
        Long userId = parseUserId(user);
        Object idsRaw = body == null ? null : body.get("announcementIds");
        List<Long> ids = new java.util.ArrayList<>();
        if (idsRaw instanceof List<?> list) {
            for (Object o : list) {
                if (o == null) continue;
                try {
                    if (o instanceof Number n) ids.add(n.longValue());
                    else ids.add(Long.parseLong(o.toString()));
                } catch (NumberFormatException ignored) {
                    // skip malformed ids — partial success is better than a 400 here
                }
            }
        }
        int newly = announcementService.markAllRead(userId, ids);
        return ResponseEntity.ok(Map.of("ok", true, "newlyMarked", newly));
    }

    @GetMapping("/{id}/attachments/{attachmentId}")
    public ResponseEntity<Resource> downloadAttachment(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable Long id,
            @PathVariable Long attachmentId) {
        AnnouncementAttachment att = announcementService.loadAttachment(id, attachmentId, parseUserId(user));
        Resource resource = fileStorageService.loadFile(att.getFilePath());
        String contentType = att.getMimeType() != null ? att.getMimeType() : MediaType.APPLICATION_OCTET_STREAM_VALUE;
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + att.getFileName() + "\"")
                .body(resource);
    }

    private boolean isStudent(UserDetails user) {
        if (user == null) return false;
        try {
            Long userId = Long.parseLong(user.getUsername());
            return userAccountRepository.findById(userId)
                    .map(u -> u.getRole() == UserRole.STUDENT)
                    .orElse(false);
        } catch (NumberFormatException e) {
            return false;
        }
    }

    private Long parseUserId(UserDetails user) {
        if (user == null) return null;
        try {
            return Long.parseLong(user.getUsername());
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
