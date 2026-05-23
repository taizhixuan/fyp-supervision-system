package com.fyp.supervision.job;

import com.fyp.supervision.service.AdminMaintenanceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Cron-driven counterparts of the buttons on /admin/maintenance.
 *
 *   Daily DB backup   — every day at 03:00 (cron: sec min hour dom month dow)
 *   Weekly cleanup    — every Sunday at 02:00
 *   Monthly FULL backup — 1st of every month at 01:00
 *
 * Each job calls the same service used by the admin UI, so the resulting rows show
 * up in /admin/maintenance Job History indistinguishably from manual runs. userId
 * is null on purpose — the service tolerates it and the DTO labels it "System".
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class MaintenanceScheduledJobs {

    private final AdminMaintenanceService adminMaintenanceService;

    @Scheduled(cron = "0 0 3 * * *")
    public void dailyDatabaseBackup() {
        log.info("[maintenance] Scheduled DAILY database backup starting");
        Map<String, Object> result = adminMaintenanceService.createBackup(null, Map.of("type", "DATABASE"));
        log.info("[maintenance] DAILY backup result: {}", result);
    }

    @Scheduled(cron = "0 0 2 * * SUN")
    public void weeklyCleanup() {
        log.info("[maintenance] Scheduled WEEKLY cleanup starting");
        Map<String, Object> options = new LinkedHashMap<>();
        options.put("clearTempFiles", true);
        options.put("clearOldLogs", true);
        options.put("clearExpiredSessions", true);
        options.put("clearOrphanedFiles", false); // Conservative on auto runs — admin opts in.
        options.put("olderThanDays", 30);
        Map<String, Object> result = adminMaintenanceService.cleanup(null, options);
        log.info("[maintenance] WEEKLY cleanup result: {}", result);
    }

    @Scheduled(cron = "0 0 1 1 * *")
    public void monthlyFullBackup() {
        log.info("[maintenance] Scheduled MONTHLY full backup starting");
        Map<String, Object> result = adminMaintenanceService.createBackup(null, Map.of("type", "FULL"));
        log.info("[maintenance] MONTHLY backup result: {}", result);
    }
}
