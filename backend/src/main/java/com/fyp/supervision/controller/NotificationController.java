package com.fyp.supervision.controller;

import com.fyp.supervision.entity.Notification;
import com.fyp.supervision.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<?> getNotifications(
            @AuthenticationPrincipal UserDetails user,
            Pageable pageable) {
        Long userId = Long.parseLong(user.getUsername());
        Page<Notification> page = notificationService.getNotifications(userId, pageable);
        List<Map<String, Object>> dtos = page.getContent().stream()
                .map(this::buildNotificationDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(Map.of("notifications", dtos, "total", page.getTotalElements()));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<?> getUnreadCount(@AuthenticationPrincipal UserDetails user) {
        Long userId = Long.parseLong(user.getUsername());
        long count = notificationService.getUnreadCount(userId);
        return ResponseEntity.ok(Map.of("count", count));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails user) {
        Long userId = Long.parseLong(user.getUsername());
        Notification notification = notificationService.markAsRead(id, userId);
        return ResponseEntity.ok(buildNotificationDto(notification));
    }

    @PutMapping("/mark-all-read")
    public ResponseEntity<?> markAllAsRead(@AuthenticationPrincipal UserDetails user) {
        Long userId = Long.parseLong(user.getUsername());
        notificationService.markAllAsRead(userId);
        return ResponseEntity.ok(Map.of("message", "All notifications marked as read."));
    }

    private Map<String, Object> buildNotificationDto(Notification n) {
        Map<String, Object> dto = new LinkedHashMap<>();
        dto.put("notificationId", n.getNotificationId());
        dto.put("userId", n.getUser() != null ? n.getUser().getUserId() : null);
        dto.put("type", n.getType());
        dto.put("title", n.getTitle());
        dto.put("message", n.getMessage());
        dto.put("targetRoute", n.getTargetRoute());
        dto.put("createdAt", n.getCreatedAt() != null ? n.getCreatedAt().toString() : "");
        dto.put("readAt", n.getReadAt() != null ? n.getReadAt().toString() : null);
        return dto;
    }
}
