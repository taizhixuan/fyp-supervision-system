package com.fyp.supervision.service;

import com.fyp.supervision.entity.Meeting;
import com.fyp.supervision.enums.MeetingStatus;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class MeetingCalendarServiceTest {

    private final MeetingCalendarService service = new MeetingCalendarService();

    private Meeting meeting(Long id, MeetingStatus status) {
        Meeting m = new Meeting();
        m.setMeetingId(id);
        m.setTitle("Progress review");
        m.setStatus(status);
        return m;
    }

    @Test
    void convertsMalaysiaLocalTimeToUtc() {
        Meeting m = meeting(7L, MeetingStatus.CONFIRMED);
        m.setConfirmedStartAt(LocalDateTime.of(2026, 5, 30, 14, 0));
        m.setDurationMinutes(45);

        String ics = service.buildIcs(List.of(m), "My meetings");

        assertThat(ics).contains("UID:meeting-7@supervisi.me");
        assertThat(ics).contains("DTSTART:20260530T060000Z");
        assertThat(ics).contains("DTEND:20260530T064500Z");
        assertThat(ics).contains("STATUS:CONFIRMED");
        assertThat(ics).startsWith("BEGIN:VCALENDAR\r\n").endsWith("END:VCALENDAR\r\n");
    }

    @Test
    void fallsBackToProposedStartAndDefaultDuration() {
        Meeting m = meeting(8L, MeetingStatus.PROPOSED);
        m.setProposedStartAt(LocalDateTime.of(2026, 6, 1, 9, 30));

        String ics = service.buildIcs(List.of(m), "x");

        assertThat(ics).contains("DTSTART:20260601T013000Z");
        assertThat(ics).contains("DTEND:20260601T023000Z");
        assertThat(ics).contains("STATUS:TENTATIVE");
    }

    @Test
    void cancelledMeetingIsMarkedCancelledAndUntimedMeetingIsSkipped() {
        Meeting cancelled = meeting(9L, MeetingStatus.CANCELLED);
        cancelled.setProposedStartAt(LocalDateTime.of(2026, 6, 2, 10, 0));
        Meeting untimed = meeting(10L, MeetingStatus.PROPOSED);

        String ics = service.buildIcs(List.of(cancelled, untimed), "x");

        assertThat(ics).contains("STATUS:CANCELLED");
        assertThat(ics).doesNotContain("meeting-10@");
    }

    @Test
    void escapesSpecialCharacters() {
        assertThat(MeetingCalendarService.escape("a,b;c\\d\ne"))
                .isEqualTo("a\\,b\\;c\\\\d\\ne");
    }

    @Test
    void foldsLongLinesAt75Octets() {
        String folded = MeetingCalendarService.fold("DESCRIPTION:" + "é".repeat(100));
        for (String part : folded.split("\r\n")) {
            assertThat(part.getBytes(StandardCharsets.UTF_8).length).isLessThanOrEqualTo(75);
        }
        assertThat(folded.replace("\r\n ", "")).isEqualTo("DESCRIPTION:" + "é".repeat(100));
    }
}
