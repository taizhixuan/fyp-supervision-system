package com.fyp.supervision.controller;

import com.fyp.supervision.entity.Notification;
import com.fyp.supervision.entity.PushSubscription;
import com.fyp.supervision.entity.UserAccount;
import com.fyp.supervision.exception.BadRequestException;
import com.fyp.supervision.exception.ResourceNotFoundException;
import com.fyp.supervision.repository.PushSubscriptionRepository;
import com.fyp.supervision.repository.UserAccountRepository;
import com.fyp.supervision.service.NotificationService;
import com.fyp.supervision.service.PushService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final PushService pushService;
    private final PushSubscriptionRepository pushSubscriptionRepository;
    private final UserAccountRepository userAccountRepository;

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

    @GetMapping("/push/vapid-public-key")
    public ResponseEntity<Map<String, Object>> getVapidPublicKey() {
        Map<String, Object> body = new HashMap<>();
        body.put("publicKey", pushService.getPublicKey());
        return ResponseEntity.ok(body);
    }

    @PostMapping("/push/subscribe")
    @Transactional
    public ResponseEntity<?> subscribePush(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody Map<String, Object> payload) {
        Long userId = Long.parseLong(userDetails.getUsername());
        UserAccount user = userAccountRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Object endpointObj = payload.get("endpoint");
        if (!(endpointObj instanceof String) || ((String) endpointObj).isBlank()) {
            throw new BadRequestException("endpoint is required");
        }
        String endpoint = (String) endpointObj;

        Object keysObj = payload.get("keys");
        if (!(keysObj instanceof Map)) {
            throw new BadRequestException("keys is required");
        }
        @SuppressWarnings("unchecked")
        Map<String, Object> keys = (Map<String, Object>) keysObj;
        Object p256dh = keys.get("p256dh");
        Object auth = keys.get("auth");
        if (!(p256dh instanceof String) || !(auth instanceof String)) {
            throw new BadRequestException("keys.p256dh and keys.auth are required");
        }
        Object userAgentObj = payload.get("userAgent");
        String userAgent = userAgentObj instanceof String ? (String) userAgentObj : null;

        PushSubscription sub = pushSubscriptionRepository.findByEndpoint(endpoint)
                .orElseGet(PushSubscription::new);
        sub.setUser(user);
        sub.setEndpoint(endpoint);
        sub.setP256dh((String) p256dh);
        sub.setAuthKey((String) auth);
        sub.setUserAgent(userAgent);
        pushSubscriptionRepository.save(sub);

        return ResponseEntity.ok(Map.of("message", "Subscribed."));
    }

    @DeleteMapping("/push/subscribe")
    @Transactional
    public ResponseEntity<?> unsubscribePush(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam("endpoint") String endpoint) {
        Long userId = Long.parseLong(userDetails.getUsername());
        pushSubscriptionRepository.findByEndpoint(endpoint).ifPresent(sub -> {
            if (sub.getUser() != null && sub.getUser().getUserId().equals(userId)) {
                pushSubscriptionRepository.delete(sub);
            }
        });
        return ResponseEntity.ok(Map.of("message", "Unsubscribed."));
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
        // `isRead` mirrors readAt for frontends that template on it (supervisor/
        // student centers filter on n.isRead). Without this, mark-as-read appears
        // to do nothing even though the row gets updated server-side.
        dto.put("isRead", n.getReadAt() != null);
        return dto;
    }
}
