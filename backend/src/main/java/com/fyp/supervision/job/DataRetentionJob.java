package com.fyp.supervision.job;

import com.fyp.supervision.entity.ChatSession;
import com.fyp.supervision.repository.ChatSessionRepository;
import com.fyp.supervision.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Enforces the retention windows stated in the Privacy Notice.
 * Runs daily at 04:00 KL time.
 *
 *  - notifications older than `app.retention.notification-days` are deleted
 *  - ended chat sessions older than `app.retention.chat-session-days` are deleted
 *    (cascades to chat_message via OneToMany orphanRemoval)
 *
 * Open chat sessions are never purged here; they end when the student clicks
 * Clear / starts a new session, at which point the cross-session memory
 * summariser captures whatever was worth keeping.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DataRetentionJob {

    private final NotificationRepository notificationRepository;
    private final ChatSessionRepository chatSessionRepository;

    @Value("${app.retention.notification-days:180}")
    private int notificationDays;

    @Value("${app.retention.chat-session-days:180}")
    private int chatSessionDays;

    @Scheduled(cron = "0 0 4 * * *", zone = "Asia/Kuala_Lumpur")
    @Transactional
    public void purgeOldData() {
        purgeNotifications();
        purgeEndedChatSessions();
    }

    private void purgeNotifications() {
        LocalDateTime cutoff = LocalDateTime.now().minusDays(notificationDays);
        int purged = notificationRepository.deleteByCreatedAtBefore(cutoff);
        if (purged > 0) {
            log.info("[retention] Purged {} notifications older than {} days (cutoff {})", purged, notificationDays, cutoff);
        }
    }

    private void purgeEndedChatSessions() {
        LocalDateTime cutoff = LocalDateTime.now().minusDays(chatSessionDays);
        List<ChatSession> stale = chatSessionRepository.findByEndedAtNotNullAndEndedAtBefore(cutoff);
        if (!stale.isEmpty()) {
            chatSessionRepository.deleteAll(stale);
            log.info("[retention] Purged {} ended chat sessions older than {} days (cutoff {})", stale.size(), chatSessionDays, cutoff);
        }
    }
}
