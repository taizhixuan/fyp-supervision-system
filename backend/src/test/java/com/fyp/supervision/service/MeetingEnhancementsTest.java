package com.fyp.supervision.service;

import com.fyp.supervision.controller.student.StudentMeetingController;
import com.fyp.supervision.entity.Meeting;
import com.fyp.supervision.entity.Project;
import com.fyp.supervision.enums.MeetingStatus;
import com.fyp.supervision.exception.BadRequestException;
import com.fyp.supervision.job.MeetingGapAlertJob;
import com.fyp.supervision.repository.MeetingRepository;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/** Pure-logic checks for action items, log drafts, the gap alert and the export filter. */
class MeetingEnhancementsTest {

    @Test
    void parseDescriptions_acceptsListOrLinesAndStripsBullets() {
        assertThat(ActionItemService.parseDescriptions(List.of("  Finish ERD ", "", "- Draft chapter 3")))
                .containsExactly("Finish ERD", "Draft chapter 3");
        assertThat(ActionItemService.parseDescriptions("• Fix login\n\n* Add tests\r\nDeploy"))
                .containsExactly("Fix login", "Add tests", "Deploy");
        assertThat(ActionItemService.parseDescriptions(null)).isEmpty();
    }

    @Test
    void logDraft_usesNotesAndBulletsActionItems() {
        Meeting m = new Meeting();
        m.setTitle("Week 5");
        m.setNotes("  Reviewed the ERD. ");
        assertThat(MeetingLogDraftService.workDoneFromNotes(m)).isEqualTo("Reviewed the ERD.");
        assertThat(MeetingLogDraftService.bullets(List.of("A", " ", "B"))).isEqualTo("- A\n- B");

        m.setNotes(null);
        m.setAgenda("1. Demo");
        assertThat(MeetingLogDraftService.workDoneFromNotes(m)).startsWith("Discussed: Week 5.").contains("1. Demo");
    }

    @Test
    void daysSinceLastMeeting_fallsBackToRegistrationDate() {
        MeetingRepository repo = mock(MeetingRepository.class);
        Project p = new Project();
        p.setProjectId(1L);
        p.setRegisteredAt(LocalDateTime.now().minusDays(30));
        when(repo.findMaxConfirmedStartAtByProjectAndStatus(1L, MeetingStatus.COMPLETED)).thenReturn(Optional.empty());
        assertThat(MeetingGapAlertJob.daysSinceLastMeeting(p, repo)).isEqualTo(30L);

        when(repo.findMaxConfirmedStartAtByProjectAndStatus(1L, MeetingStatus.COMPLETED))
                .thenReturn(Optional.of(LocalDateTime.now().minusDays(4)));
        assertThat(MeetingGapAlertJob.daysSinceLastMeeting(p, repo)).isEqualTo(4L);
    }

    @Test
    void exportRange_handlesPresetsAndCustom() {
        LocalDate today = LocalDate.now();
        assertThat(StudentMeetingController.exportRange(Map.of("dateRange", "all"))).isNull();
        assertThat(StudentMeetingController.exportRange(Map.of("dateRange", "last_3_months")))
                .containsExactly(today.minusMonths(3), today);
        assertThat(StudentMeetingController.exportRange(Map.of("dateRange", "custom",
                "startDate", "2026-01-01", "endDate", "2026-02-01")))
                .containsExactly(LocalDate.of(2026, 1, 1), LocalDate.of(2026, 2, 1));
        assertThatThrownBy(() -> StudentMeetingController.exportRange(Map.of("dateRange", "custom",
                "startDate", "2026-03-01", "endDate", "2026-02-01")))
                .isInstanceOf(BadRequestException.class);
    }
}
