package com.fyp.supervision.service;

import com.fyp.supervision.enums.MeetingLogStatus;
import com.fyp.supervision.repository.MeetingLogRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MeetingLogComplianceServiceTest {

    @Mock
    MeetingLogRepository meetingLogRepository;

    @InjectMocks
    MeetingLogComplianceService service;

    @Test
    void requiredLogCount_isSixForBothPhases() {
        assertThat(service.requiredLogCount("FYP1")).isEqualTo(6);
        assertThat(service.requiredLogCount("FYP2")).isEqualTo(6);
    }

    @Test
    void completedLogCount_returnsZeroForNullInputs() {
        assertThat(service.completedLogCount(null, "FYP1")).isZero();
        assertThat(service.completedLogCount(1L, null)).isZero();
        assertThat(service.completedLogCount(1L, "")).isZero();
    }

    @Test
    void completedLogCount_queriesRepoWithLockedAndUppercasedPhase() {
        when(meetingLogRepository
                .countByStudent_UserIdAndStatusAndFypPhase(42L, MeetingLogStatus.LOCKED, "FYP1"))
                .thenReturn(4L);

        // Mixed-case + whitespace input should be normalised to "FYP1" before query.
        assertThat(service.completedLogCount(42L, " fyp1 ")).isEqualTo(4);
    }

    @Test
    void meetsMinimum_trueWhenAtOrAboveSix() {
        when(meetingLogRepository
                .countByStudent_UserIdAndStatusAndFypPhase(7L, MeetingLogStatus.LOCKED, "FYP1"))
                .thenReturn(6L);
        assertThat(service.meetsMinimum(7L, "FYP1")).isTrue();
    }

    @Test
    void meetsMinimum_falseWhenBelowSix() {
        when(meetingLogRepository
                .countByStudent_UserIdAndStatusAndFypPhase(8L, MeetingLogStatus.LOCKED, "FYP1"))
                .thenReturn(3L);
        assertThat(service.meetsMinimum(8L, "FYP1")).isFalse();
    }
}
