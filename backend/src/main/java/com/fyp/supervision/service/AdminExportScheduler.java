package com.fyp.supervision.service;

import com.fyp.supervision.entity.ExportConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Runs scheduled export configs whose nextRunAt is due. Fires every minute
 * (well below the smallest schedulable granularity in the UI, which is hourly).
 * Each due config is executed via AdminExportService.runInternal, which writes
 * the file, stamps lastExportAt, recomputes nextRunAt, and emits an audit log.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class AdminExportScheduler {

    private final AdminExportService adminExportService;

    @Scheduled(fixedDelay = 60_000, initialDelay = 30_000)
    public void processDueExports() {
        LocalDateTime now = LocalDateTime.now();
        List<ExportConfig> due = adminExportService.findDueConfigs(now);
        if (due.isEmpty()) return;
        log.info("Processing {} scheduled export(s)", due.size());
        for (ExportConfig config : due) {
            try {
                adminExportService.runInternal(config, null);
            } catch (Exception e) {
                log.warn("Scheduled export {} ({}) failed: {}",
                        config.getConfigId(), config.getName(), e.getMessage());
            }
        }
    }
}
