package com.fyp.supervision.service;

import com.fyp.supervision.enums.MeetingLogStatus;
import com.fyp.supervision.repository.MeetingLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/**
 * Compliance helpers for the FCI rule "minimum 6 completed meeting logs per FYP phase".
 * A log is "completed" when it reaches MeetingLogStatus.LOCKED — both supervisor and
 * student have signed and the log is immutable.
 *
 * <p>Phase scoping is by {@link com.fyp.supervision.entity.MeetingLog#getFypPhase()}
 * ("FYP1" / "FYP2"); each Project flips its stage in place when a student progresses,
 * so the same Project can carry both FYP1 and FYP2 logs and they remain partitioned by
 * phase string. There is no FK to FypCycle today and we don't need one.
 */
@Service
@RequiredArgsConstructor
public class MeetingLogComplianceService {

    private static final int MIN_LOGS_PER_PHASE = 6;

    private final MeetingLogRepository meetingLogRepository;

    public int requiredLogCount(String fypPhase) {
        // Both FYP1 and FYP2 require 6. If this rule diverges, branch here.
        return MIN_LOGS_PER_PHASE;
    }

    public int completedLogCount(Long studentUserId, String fypPhase) {
        if (studentUserId == null || fypPhase == null || fypPhase.isBlank()) return 0;
        return (int) meetingLogRepository.countByStudent_UserIdAndStatusAndFypPhase(
                studentUserId, MeetingLogStatus.LOCKED, fypPhase.trim().toUpperCase());
    }

    public boolean meetsMinimum(Long studentUserId, String fypPhase) {
        return completedLogCount(studentUserId, fypPhase) >= requiredLogCount(fypPhase);
    }
}
