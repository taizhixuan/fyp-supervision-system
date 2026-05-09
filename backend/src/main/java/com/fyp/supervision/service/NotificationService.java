package com.fyp.supervision.service;

import com.fyp.supervision.entity.Notification;
import com.fyp.supervision.entity.UserAccount;
import com.fyp.supervision.exception.ResourceNotFoundException;
import com.fyp.supervision.notification.NotificationCategory;
import com.fyp.supervision.repository.NotificationRepository;
import com.fyp.supervision.repository.UserAccountRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserAccountRepository userAccountRepository;
    private final NotificationPreferenceService preferenceService;
    private final EmailService emailService;

    public void createNotification(Long userId, String type, String title, String message, String targetRoute) {
        UserAccount user = userAccountRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        NotificationCategory category = preferenceService.mapTypeToCategory(type);

        if (preferenceService.shouldDeliverInApp(userId, category)) {
            Notification notification = Notification.builder()
                    .user(user)
                    .type(type)
                    .title(title)
                    .message(message)
                    .targetRoute(targetRoute)
                    .build();
            notificationRepository.save(notification);
        } else {
            log.debug("In-app notification skipped by preferences: user={} type={}", userId, type);
        }

        if (preferenceService.shouldDeliverEmail(userId, category)) {
            emailService.sendNotificationEmail(
                    user.getEmail(),
                    user.getFullName(),
                    type,
                    title,
                    message,
                    targetRoute
            );
        }
    }

    public Page<Notification> getNotifications(Long userId, Pageable pageable) {
        return notificationRepository.findByUser_UserIdOrderByCreatedAtDesc(userId, pageable);
    }

    public long getUnreadCount(Long userId) {
        return notificationRepository.countByUser_UserIdAndReadAtIsNull(userId);
    }

    @Transactional
    public Notification markAsRead(Long notificationId, Long userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found"));
        if (!notification.getUser().getUserId().equals(userId)) {
            throw new ResourceNotFoundException("Notification not found");
        }
        notification.setReadAt(LocalDateTime.now());
        return notificationRepository.save(notification);
    }

    @Transactional
    public void markAllAsRead(Long userId) {
        notificationRepository.markAllAsRead(userId);
    }
}
