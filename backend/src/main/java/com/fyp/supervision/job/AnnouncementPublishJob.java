package com.fyp.supervision.job;

import com.fyp.supervision.service.AnnouncementService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Publishes scheduled announcements at their chosen time. Runs once a minute so an
 * announcement scheduled for a specific minute goes live (and its audience is notified)
 * within that minute rather than immediately at creation time.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AnnouncementPublishJob {

    private final AnnouncementService announcementService;

    /** Runs at the top of every minute. */
    @Scheduled(cron = "0 * * * * *", zone = "Asia/Kuala_Lumpur")
    public void runEveryMinute() {
        try {
            int published = announcementService.publishDueAnnouncements();
            if (published > 0) {
                log.info("Announcement publisher job published {} scheduled announcement(s)", published);
            }
        } catch (Exception e) {
            log.warn("Announcement publisher job failed: {}", e.getMessage());
        }
    }
}
