package com.fyp.supervision.job;

import com.fyp.supervision.entity.Meeting;
import com.fyp.supervision.entity.Project;
import com.fyp.supervision.enums.MeetingStatus;
import com.fyp.supervision.repository.MeetingRepository;
import com.fyp.supervision.service.NotificationService;
import com.fyp.supervision.service.SystemParameterService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * Notifies the student and supervisor before a confirmed meeting. The lead time is
 * admin-tunable via the meeting_reminder_hours system parameter (default 24 hours).
 * Each meeting is reminded at most once (dedupe via Meeting.reminderSentAt).
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class MeetingReminderJob {

    private static final DateTimeFormatter WHEN = DateTimeFormatter.ofPattern("EEE d MMM, h:mm a");

    private final MeetingRepository meetingRepository;
    private final NotificationService notificationService;
    private final SystemParameterService systemParameters;

    /** Runs at the top of every hour. */
    @Scheduled(cron = "0 0 * * * *", zone = "Asia/Kuala_Lumpur")
    public void runHourly() {
        int fired = run();
        if (fired > 0) {
            log.info("Meeting reminder job fired {} notification(s)", fired);
        }
    }

    public int run() {
        int hours = systemParameters.getInt("meeting_reminder_hours", 24);
        if (hours <= 0) {
            return 0;
        }
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime to = now.plusHours(hours);
        List<Meeting> due = meetingRepository.findDueForReminder(MeetingStatus.CONFIRMED, now, to);

        int fired = 0;
        for (Meeting meeting : due) {
            try {
                fired += remind(meeting);
                meeting.setReminderSentAt(LocalDateTime.now());
                meetingRepository.save(meeting);
            } catch (Exception ex) {
                log.warn("Failed to send meeting reminder for meeting {}: {}",
                        meeting.getMeetingId(), ex.getMessage());
            }
        }
        return fired;
    }

    private int remind(Meeting meeting) {
        Project project = meeting.getProject();
        if (project == null) {
            return 0;
        }
        String title = "Upcoming meeting reminder";
        String when = meeting.getConfirmedStartAt() != null ? meeting.getConfirmedStartAt().format(WHEN) : "soon";
        String label = (meeting.getTitle() == null || meeting.getTitle().isBlank())
                ? "your supervision meeting" : "\"" + meeting.getTitle() + "\"";
        String body = "You have " + label + " scheduled for " + when + ".";

        int count = 0;
        if (project.getStudent() != null) {
            notificationService.createNotification(project.getStudent().getUserId(),
                    "MEETING", title, body, "/student/meetings");
            count++;
        }
        if (project.getSupervisor() != null) {
            notificationService.createNotification(project.getSupervisor().getUserId(),
                    "MEETING", title, body, "/supervisor/meetings");
            count++;
        }
        return count;
    }
}
