package com.fyp.supervision.job;

import com.fyp.supervision.entity.SupervisorRequest;
import com.fyp.supervision.enums.RequestStatus;
import com.fyp.supervision.repository.SupervisorRequestRepository;
import com.fyp.supervision.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.javacrumbs.shedlock.spring.annotation.SchedulerLock;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

/**
 * Moves PENDING supervision requests past their expiresAt (14 days after submission,
 * set in SupervisorRequest.onCreate) to EXPIRED and tells the student, so requests
 * a supervisor never answered don't sit in both inboxes forever.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SupervisionRequestExpiryJob {

    private final SupervisorRequestRepository supervisorRequestRepository;
    private final NotificationService notificationService;

    @Scheduled(cron = "0 30 7 * * *", zone = "Asia/Kuala_Lumpur")
    @SchedulerLock(name = "SupervisionRequestExpiryJob.runDaily", lockAtMostFor = "PT30M")
    public void runDaily() {
        int expired = run();
        if (expired > 0) {
            log.info("Supervision request expiry job expired {} request(s)", expired);
        }
    }

    public int run() {
        LocalDateTime now = LocalDateTime.now();
        int expired = 0;
        for (SupervisorRequest request : supervisorRequestRepository
                .findByStatusAndExpiresAtBefore(RequestStatus.PENDING, now)) {
            try {
                request.setStatus(RequestStatus.EXPIRED);
                request.setRespondedAt(now);
                supervisorRequestRepository.save(request);
                expired++;
                String supervisorName = request.getSupervisorUser() != null
                        ? request.getSupervisorUser().getFullName() : "the supervisor";
                notificationService.createNotification(
                        request.getStudent().getUserId(), "REQUEST",
                        "Supervision Request Expired",
                        "Your request to " + supervisorName + " expired without a response. "
                                + "You can send a new request to another supervisor.",
                        "/student/supervisors");
            } catch (Exception e) {
                log.warn("Could not expire supervision request {}: {}", request.getRequestId(), e.getMessage());
            }
        }
        return expired;
    }
}
