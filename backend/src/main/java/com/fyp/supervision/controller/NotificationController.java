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

import java.util.Map;

@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<Page<Notification>> getNotifications(
            @AuthenticationPrincipal UserDetails user,
            Pageable pageable) {
        Long userId = Long.parseLong(user.getUsername());
        return ResponseEntity.ok(notificationService.getNotifications(userId, pageable));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<?> getUnreadCount(@AuthenticationPrincipal UserDetails user) {
        Long userId = Long.parseLong(user.getUsername());
        long count = notificationService.getUnreadCount(userId);
        return ResponseEntity.ok(Map.of("count", count));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<Notification> markAsRead(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails user) {
        Long userId = Long.parseLong(user.getUsername());
        Notification notification = notificationService.markAsRead(id, userId);
        return ResponseEntity.ok(notification);
    }

    @PutMapping("/mark-all-read")
    public ResponseEntity<?> markAllAsRead(@AuthenticationPrincipal UserDetails user) {
        Long userId = Long.parseLong(user.getUsername());
        notificationService.markAllAsRead(userId);
        return ResponseEntity.ok(Map.of("message", "All notifications marked as read."));
    }
}
