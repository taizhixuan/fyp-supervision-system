package com.fyp.supervision.job;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fyp.supervision.entity.Deadline;
import com.fyp.supervision.entity.DeadlineReminderLog;
import com.fyp.supervision.entity.Project;
import com.fyp.supervision.entity.UserAccount;
import com.fyp.supervision.enums.UserRole;
import com.fyp.supervision.enums.UserStatus;
import com.fyp.supervision.repository.DeadlineReminderLogRepository;
import com.fyp.supervision.repository.DeadlineRepository;
import com.fyp.supervision.repository.ProjectRepository;
import com.fyp.supervision.repository.UserAccountRepository;
import com.fyp.supervision.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Slf4j
@Component
@RequiredArgsConstructor
public class DeadlineReminderJob {

    private final DeadlineRepository deadlineRepository;
    private final DeadlineReminderLogRepository reminderLogRepository;
    private final UserAccountRepository userAccountRepository;
    private final ProjectRepository projectRepository;
    private final NotificationService notificationService;
    private final ObjectMapper objectMapper;

    @Scheduled(cron = "0 0 8 * * *", zone = "Asia/Kuala_Lumpur")
    public void runDaily() {
        log.info("Starting scheduled deadline reminder job");
        int fired = run();
        log.info("Deadline reminder job completed: {} reminder(s) fired", fired);
    }

    public int run() {
        LocalDate today = LocalDate.now();
        List<Deadline> upcoming = deadlineRepository.findByDueDateAfterOrderByDueDateAsc(today.minusDays(1));
        int totalFired = 0;
        for (Deadline deadline : upcoming) {
            try {
                totalFired += processDeadline(deadline, today);
            } catch (Exception ex) {
                log.warn("Failed processing deadline {}: {}", deadline.getDeadlineId(), ex.getMessage());
            }
        }
        return totalFired;
    }

    private int processDeadline(Deadline deadline, LocalDate today) {
        List<Integer> reminderDays = parseReminderDays(deadline.getReminderDays());
        if (reminderDays.isEmpty()) return 0;

        LocalDate effectiveDue = deadline.getExtendedDate() != null
                ? deadline.getExtendedDate()
                : deadline.getDueDate();
        if (effectiveDue == null) return 0;

        int fired = 0;
        for (Integer days : reminderDays) {
            if (days == null || days < 0) continue;
            LocalDate trigger = effectiveDue.minusDays(days);
            if (!trigger.equals(today)) continue;
            if (reminderLogRepository.existsByDeadlineIdAndDaysBefore(deadline.getDeadlineId(), days)) continue;

            List<UserAccount> recipients = resolveAudience(deadline);
            if (recipients.isEmpty()) {
                recordFired(deadline.getDeadlineId(), days);
                continue;
            }

            String title = "Deadline reminder: " + deadline.getTitle();
            String body = "Due in " + days + " day" + (days == 1 ? "" : "s")
                    + ": " + (deadline.getDescription() == null ? deadline.getTitle() : deadline.getDescription());

            for (UserAccount user : recipients) {
                String route = routeFor(user.getRole());
                try {
                    notificationService.createNotification(user.getUserId(), "DEADLINE", title, body, route);
                    fired++;
                } catch (Exception ex) {
                    log.warn("Failed to notify user {} about deadline {}: {}", user.getUserId(),
                            deadline.getDeadlineId(), ex.getMessage());
                }
            }
            recordFired(deadline.getDeadlineId(), days);
        }
        return fired;
    }

    private void recordFired(Long deadlineId, Integer daysBefore) {
        reminderLogRepository.save(DeadlineReminderLog.builder()
                .deadlineId(deadlineId)
                .daysBefore(daysBefore)
                .firedAt(LocalDateTime.now())
                .build());
    }

    private List<Integer> parseReminderDays(String json) {
        if (json == null || json.isBlank()) return Collections.emptyList();
        try {
            return objectMapper.readValue(json, new TypeReference<List<Integer>>() {});
        } catch (Exception e) {
            log.warn("Could not parse reminderDays json: {}", json);
            return Collections.emptyList();
        }
    }

    private List<UserAccount> resolveAudience(Deadline deadline) {
        String audience = deadline.getAudience() == null ? "ALL" : deadline.getAudience().toUpperCase();
        Set<Long> userIds = new HashSet<>();

        if (audience.equals("STUDENT") || audience.equals("ALL")) {
            String cycleType = deadline.getCycle() != null ? deadline.getCycle().getCycleType() : null;
            for (Project project : projectRepository.findAll()) {
                if (project.getStudent() == null) continue;
                if (cycleType != null && project.getStage() != null
                        && !normalise(project.getStage()).equalsIgnoreCase(cycleType)) {
                    continue;
                }
                userIds.add(project.getStudent().getUserId());
            }
        }

        if (audience.equals("SUPERVISOR") || audience.equals("ALL")) {
            userAccountRepository
                    .findByRoleAndStatus(UserRole.SUPERVISOR, UserStatus.ACTIVE, PageRequest.of(0, 1000))
                    .forEach(u -> userIds.add(u.getUserId()));
        }

        if (userIds.isEmpty()) return Collections.emptyList();
        return new ArrayList<>(userAccountRepository.findByUserIdIn(new ArrayList<>(userIds)));
    }

    private String normalise(String stage) {
        return stage == null ? "" : stage.replace(" ", "").toUpperCase();
    }

    private String routeFor(UserRole role) {
        return switch (role) {
            case STUDENT -> "/student/deadlines";
            case SUPERVISOR -> "/supervisor/dashboard";
            case FYP_COMMITTEE -> "/committee/dashboard";
            case SYSTEM_ADMIN -> "/admin/dashboard";
        };
    }
}
