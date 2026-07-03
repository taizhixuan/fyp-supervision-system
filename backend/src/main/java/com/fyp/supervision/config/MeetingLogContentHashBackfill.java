package com.fyp.supervision.config;

import com.fyp.supervision.service.MeetingLogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

/**
 * On startup, backfill the whole-document SHA-256 for any meeting log that was locked
 * before that feature shipped, so existing logbooks also print the integrity fingerprint.
 * Idempotent and cheap: once the backlog is cleared it finds nothing to do.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class MeetingLogContentHashBackfill implements ApplicationRunner {

    private final MeetingLogService meetingLogService;

    @Override
    public void run(ApplicationArguments args) {
        try {
            int n = meetingLogService.backfillMissingContentHashes();
            if (n > 0) {
                log.info("Backfilled whole-document content hash for {} locked meeting log(s).", n);
            }
        } catch (Exception e) {
            log.warn("Meeting-log content-hash backfill skipped: {}", e.getMessage());
        }
    }
}
