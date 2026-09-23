package com.fyp.supervision.job;

import com.fyp.supervision.entity.Project;
import com.fyp.supervision.enums.MeetingStatus;
import com.fyp.supervision.repository.MeetingRepository;
import com.fyp.supervision.repository.ProjectRepository;
import com.fyp.supervision.service.NotificationService;
import com.fyp.supervision.service.SystemParameterService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * Daily check for paired projects (ACTIVE cycle) that have gone quiet: no conducted
 * meeting for meeting_gap_alert_days (default 21) and nothing proposed or confirmed
 * ahead. Nudges both the supervisor and the student. Repeats at most weekly per
 * project (Project.meetingGapAlertedAt). The committee sees the same gap as
 * daysSinceLastMeeting on its project views.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class MeetingGapAlertJob {

    static final int REPEAT_DAYS = 7;
    private static final List<MeetingStatus> SCHEDULED =
            List.of(MeetingStatus.PROPOSED, MeetingStatus.CONFIRMED, MeetingStatus.RESCHEDULED);

    private final ProjectRepository projectRepository;
    private final MeetingRepository meetingRepository;
    private final NotificationService notificationService;
    private final SystemParameterService systemParameters;

    @Scheduled(cron = "0 0 9 * * *", zone = "Asia/Kuala_Lumpur")
    public void runDaily() {
        int alerted = run();
        if (alerted > 0) {
            log.info("Meeting gap alert job flagged {} project(s)", alerted);
        }
    }

    public int run() {
        int threshold = systemParameters.getInt("meeting_gap_alert_days", 21);
        if (threshold <= 0) return 0;
        LocalDateTime now = LocalDateTime.now();
        int alerted = 0;
        for (Project project : projectRepository.findPairedInActiveCycle()) {
            try {
                Long days = daysSinceLastMeeting(project, meetingRepository);
                if (days == null || days < threshold) continue;
                if (project.getMeetingGapAlertedAt() != null
                        && project.getMeetingGapAlertedAt().isAfter(now.minusDays(REPEAT_DAYS))) continue;
                if (meetingRepository.countUpcomingByProject(project.getProjectId(), SCHEDULED, now) > 0) continue;

                String studentName = project.getStudent().getFullName();
                notificationService.createNotification(project.getSupervisor().getUserId(), "MEETING",
                        "No recent meeting with " + studentName,
                        "You haven't had a meeting with " + studentName + " in " + days
                                + " days and none is scheduled. Consider booking one.",
                        "/supervisor/meetings/new");
                notificationService.createNotification(project.getStudent().getUserId(), "MEETING",
                        "Time to meet your supervisor",
                        "It has been " + days + " days since your last supervision meeting. "
                                + "Request a meeting to stay on track with your meeting logs.",
                        "/student/meetings/new");
                projectRepository.markMeetingGapAlerted(project.getProjectId(), now);
                alerted++;
            } catch (Exception ex) {
                log.warn("Meeting gap check failed for project {}: {}", project.getProjectId(), ex.getMessage());
            }
        }
        return alerted;
    }

    /**
     * Days since the last COMPLETED meeting, or since the project was registered (or the
     * cycle started) when no meeting has happened yet. Null when there is no baseline.
     */
    public static Long daysSinceLastMeeting(Project project, MeetingRepository meetingRepository) {
        LocalDate baseline = meetingRepository
                .findMaxConfirmedStartAtByProjectAndStatus(project.getProjectId(), MeetingStatus.COMPLETED)
                .map(LocalDateTime::toLocalDate)
                .orElse(null);
        if (baseline == null && project.getRegisteredAt() != null) baseline = project.getRegisteredAt().toLocalDate();
        if (baseline == null && project.getCycle() != null) baseline = project.getCycle().getStartDate();
        if (baseline == null) return null;
        return Math.max(0, ChronoUnit.DAYS.between(baseline, LocalDate.now()));
    }
}
