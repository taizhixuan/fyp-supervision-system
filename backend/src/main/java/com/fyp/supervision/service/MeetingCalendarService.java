package com.fyp.supervision.service;

import com.fyp.supervision.entity.Meeting;
import com.fyp.supervision.entity.Project;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * Builds RFC 5545 iCalendar (.ics) files for meetings. The same file imports into
 * Apple Calendar, Google Calendar and Outlook. Meeting times are stored as naive
 * Malaysia-local LocalDateTime, so every timestamp is converted to UTC ("...Z").
 */
@Service
public class MeetingCalendarService {

    static final ZoneId APP_ZONE = ZoneId.of("Asia/Kuala_Lumpur");
    private static final DateTimeFormatter UTC_STAMP =
            DateTimeFormatter.ofPattern("yyyyMMdd'T'HHmmss'Z'").withZone(ZoneOffset.UTC);
    private static final int DEFAULT_DURATION = 60;

    public byte[] buildIcsBytes(List<Meeting> meetings, String calendarName) {
        return buildIcs(meetings, calendarName).getBytes(StandardCharsets.UTF_8);
    }

    public String buildIcs(List<Meeting> meetings, String calendarName) {
        StringBuilder sb = new StringBuilder();
        line(sb, "BEGIN:VCALENDAR");
        line(sb, "VERSION:2.0");
        line(sb, "PRODID:-//FYP Supervision System//Meetings//EN");
        line(sb, "CALSCALE:GREGORIAN");
        line(sb, "METHOD:PUBLISH");
        line(sb, "X-WR-CALNAME:" + escape(calendarName));
        line(sb, "X-WR-TIMEZONE:" + APP_ZONE.getId());
        String dtStamp = UTC_STAMP.format(Instant.now());
        for (Meeting m : meetings) {
            LocalDateTime start = startOf(m);
            if (start == null) continue;
            appendEvent(sb, m, start, dtStamp);
        }
        line(sb, "END:VCALENDAR");
        return sb.toString();
    }

    private void appendEvent(StringBuilder sb, Meeting m, LocalDateTime start, String dtStamp) {
        line(sb, "BEGIN:VEVENT");
        line(sb, "UID:meeting-" + m.getMeetingId() + "@supervisi.me");
        line(sb, "DTSTAMP:" + dtStamp);
        line(sb, "DTSTART:" + toUtc(start));
        line(sb, "DTEND:" + toUtc(endOf(m, start)));
        line(sb, "SUMMARY:" + escape(m.getTitle() != null && !m.getTitle().isBlank() ? m.getTitle() : "FYP Meeting"));
        String description = describe(m);
        if (!description.isEmpty()) line(sb, "DESCRIPTION:" + escape(description));
        String location = locationOf(m);
        if (location != null) line(sb, "LOCATION:" + escape(location));
        if (m.getMeetingUrl() != null && !m.getMeetingUrl().isBlank()) {
            line(sb, "URL:" + m.getMeetingUrl().trim());
        }
        line(sb, "STATUS:" + statusOf(m));
        line(sb, "BEGIN:VALARM");
        line(sb, "ACTION:DISPLAY");
        line(sb, "DESCRIPTION:" + escape("Reminder: " + (m.getTitle() != null ? m.getTitle() : "FYP Meeting")));
        line(sb, "TRIGGER:-PT15M");
        line(sb, "END:VALARM");
        line(sb, "END:VEVENT");
    }

    static LocalDateTime startOf(Meeting m) {
        return m.getConfirmedStartAt() != null ? m.getConfirmedStartAt() : m.getProposedStartAt();
    }

    static LocalDateTime endOf(Meeting m, LocalDateTime start) {
        if (m.getConfirmedStartAt() != null && m.getConfirmedEndAt() != null
                && m.getConfirmedEndAt().isAfter(start)) {
            return m.getConfirmedEndAt();
        }
        int minutes = m.getDurationMinutes() != null && m.getDurationMinutes() > 0
                ? m.getDurationMinutes() : DEFAULT_DURATION;
        return start.plusMinutes(minutes);
    }

    static String toUtc(LocalDateTime local) {
        return UTC_STAMP.format(local.atZone(APP_ZONE).toInstant());
    }

    private static String statusOf(Meeting m) {
        if (m.getStatus() == null) return "TENTATIVE";
        return switch (m.getStatus()) {
            case CONFIRMED, COMPLETED -> "CONFIRMED";
            case CANCELLED -> "CANCELLED";
            default -> "TENTATIVE";
        };
    }

    private static String locationOf(Meeting m) {
        if (m.getLocation() != null && !m.getLocation().isBlank()) return m.getLocation().trim();
        if (m.getMeetingUrl() != null && !m.getMeetingUrl().isBlank()) return m.getMeetingUrl().trim();
        if (m.getPlatform() != null && !m.getPlatform().isBlank()) return m.getPlatform().trim();
        return null;
    }

    private static String describe(Meeting m) {
        StringBuilder d = new StringBuilder();
        Project p = m.getProject();
        if (p != null && p.getStudent() != null && p.getStudent().getFullName() != null) {
            d.append("Student: ").append(p.getStudent().getFullName()).append('\n');
        }
        if (p != null && p.getSupervisor() != null && p.getSupervisor().getFullName() != null) {
            d.append("Supervisor: ").append(p.getSupervisor().getFullName()).append('\n');
        }
        if (m.getMeetingUrl() != null && !m.getMeetingUrl().isBlank()) {
            d.append("Join: ").append(m.getMeetingUrl().trim()).append('\n');
        }
        if (m.getAgenda() != null && !m.getAgenda().isBlank()) {
            d.append('\n').append("Agenda:\n").append(m.getAgenda().trim());
        }
        return d.toString().trim();
    }

    static String escape(String raw) {
        if (raw == null) return "";
        return raw.replace("\\", "\\\\")
                .replace(";", "\\;")
                .replace(",", "\\,")
                .replace("\r\n", "\n")
                .replace("\r", "\n")
                .replace("\n", "\\n");
    }

    /** Appends a content line, folded at 75 octets (RFC 5545 §3.1) without splitting UTF-8 characters. */
    private static void line(StringBuilder sb, String content) {
        sb.append(fold(content)).append("\r\n");
    }

    static String fold(String content) {
        StringBuilder out = new StringBuilder();
        int octets = 0;
        int limit = 75;
        for (int i = 0; i < content.length(); ) {
            int cp = content.codePointAt(i);
            int len = new String(Character.toChars(cp)).getBytes(StandardCharsets.UTF_8).length;
            if (octets + len > limit) {
                out.append("\r\n ");
                octets = 1;
                limit = 75;
            }
            out.appendCodePoint(cp);
            octets += len;
            i += Character.charCount(cp);
        }
        return out.toString();
    }
}
