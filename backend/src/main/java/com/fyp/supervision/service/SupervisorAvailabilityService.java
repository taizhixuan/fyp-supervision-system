package com.fyp.supervision.service;

import com.fyp.supervision.entity.Meeting;
import com.fyp.supervision.entity.SupervisorAvailability;
import com.fyp.supervision.entity.UserAccount;
import com.fyp.supervision.enums.MeetingStatus;
import com.fyp.supervision.exception.BadRequestException;
import com.fyp.supervision.exception.ResourceNotFoundException;
import com.fyp.supervision.repository.MeetingRepository;
import com.fyp.supervision.repository.SupervisorAvailabilityRepository;
import com.fyp.supervision.repository.UserAccountRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

/**
 * Manages supervisors' weekly recurring availability and expands it into
 * concrete bookable slots for the student-side booking flow.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SupervisorAvailabilityService {

    private static final List<MeetingStatus> BLOCKING_STATUSES = List.of(
            MeetingStatus.PROPOSED, MeetingStatus.CONFIRMED, MeetingStatus.RESCHEDULED);

    private final SupervisorAvailabilityRepository availabilityRepository;
    private final MeetingRepository meetingRepository;
    private final UserAccountRepository userAccountRepository;

    /** Read the supervisor's weekly schedule (all entries, active or not). */
    public List<Map<String, Object>> listForSupervisor(Long supervisorUserId) {
        return availabilityRepository
                .findBySupervisor_UserIdOrderByDayOfWeekAscStartTimeAsc(supervisorUserId)
                .stream().map(this::toDto).toList();
    }

    /**
     * Replace the supervisor's full weekly schedule in one shot. Caller passes a
     * list of {dayOfWeek, startTime, endTime, slotDurationMinutes?} maps.
     */
    @Transactional
    public List<Map<String, Object>> replaceSchedule(Long supervisorUserId,
                                                     List<Map<String, Object>> entries) {
        UserAccount supervisor = userAccountRepository.findById(supervisorUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Supervisor not found"));

        if (entries == null) entries = List.of();

        List<SupervisorAvailability> next = new ArrayList<>(entries.size());
        for (Map<String, Object> e : entries) {
            DayOfWeek day = parseDayOfWeek(e.get("dayOfWeek"));
            LocalTime start = parseTime(e.get("startTime"), "startTime");
            LocalTime end = parseTime(e.get("endTime"), "endTime");
            int slotDur = parseSlotDuration(e.get("slotDurationMinutes"));
            if (!end.isAfter(start)) {
                throw new BadRequestException("endTime must be after startTime");
            }
            if (Duration.between(start, end).toMinutes() < slotDur) {
                throw new BadRequestException("Window is shorter than slot duration");
            }
            next.add(SupervisorAvailability.builder()
                    .supervisor(supervisor)
                    .dayOfWeek(day)
                    .startTime(start)
                    .endTime(end)
                    .slotDurationMinutes(slotDur)
                    .isActive(true)
                    .build());
        }

        availabilityRepository.deleteBySupervisor_UserId(supervisorUserId);
        availabilityRepository.flush();
        availabilityRepository.saveAll(next);

        return listForSupervisor(supervisorUserId);
    }

    /**
     * Expand the supervisor's weekly schedule into concrete bookable slots
     * between {@code from} (inclusive) and {@code to} (exclusive), masking out
     * slots already taken by a non-cancelled meeting.
     */
    public Map<String, Object> getAvailableSlots(Long supervisorUserId,
                                                  LocalDate from, LocalDate to) {
        if (from == null || to == null || !to.isAfter(from)) {
            throw new BadRequestException("Invalid date range");
        }
        if (Duration.between(from.atStartOfDay(), to.atStartOfDay()).toDays() > 60) {
            throw new BadRequestException("Date range too large (max 60 days)");
        }

        List<SupervisorAvailability> weekly = availabilityRepository
                .findBySupervisor_UserIdAndIsActiveTrueOrderByDayOfWeekAscStartTimeAsc(supervisorUserId);

        List<Meeting> takenMeetings = meetingRepository.findBlockingMeetingsForSupervisor(
                supervisorUserId,
                BLOCKING_STATUSES,
                from.atStartOfDay(),
                to.atStartOfDay());

        LocalDateTime now = LocalDateTime.now();

        // Build day-keyed map of slot lists
        Map<String, List<Map<String, Object>>> byDay = new LinkedHashMap<>();
        for (LocalDate d = from; d.isBefore(to); d = d.plusDays(1)) {
            String key = d.toString();
            List<Map<String, Object>> dailySlots = new ArrayList<>();
            DayOfWeek dow = d.getDayOfWeek();
            for (SupervisorAvailability w : weekly) {
                if (w.getDayOfWeek() != dow) continue;
                LocalTime t = w.getStartTime();
                int slotMin = w.getSlotDurationMinutes() == null ? 30 : w.getSlotDurationMinutes();
                while (!t.plusMinutes(slotMin).isAfter(w.getEndTime())) {
                    LocalDateTime slotStart = LocalDateTime.of(d, t);
                    LocalDateTime slotEnd = slotStart.plusMinutes(slotMin);
                    boolean past = slotEnd.isBefore(now) || slotEnd.isEqual(now);
                    boolean taken = !past && isTaken(slotStart, slotEnd, takenMeetings);
                    Map<String, Object> slot = new LinkedHashMap<>();
                    slot.put("start", slotStart.toString());
                    slot.put("end", slotEnd.toString());
                    slot.put("durationMinutes", slotMin);
                    slot.put("available", !past && !taken);
                    slot.put("past", past);
                    slot.put("taken", taken);
                    dailySlots.add(slot);
                    t = t.plusMinutes(slotMin);
                }
            }
            byDay.put(key, dailySlots);
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("from", from.toString());
        result.put("to", to.toString());
        result.put("supervisorUserId", supervisorUserId);
        result.put("slotsByDay", byDay);
        return result;
    }

    private boolean isTaken(LocalDateTime slotStart, LocalDateTime slotEnd, List<Meeting> meetings) {
        for (Meeting m : meetings) {
            LocalDateTime mStart = m.getConfirmedStartAt() != null
                    ? m.getConfirmedStartAt() : m.getProposedStartAt();
            if (mStart == null) continue;
            int dur = m.getDurationMinutes() == null ? 60 : m.getDurationMinutes();
            LocalDateTime mEnd = m.getConfirmedEndAt() != null
                    ? m.getConfirmedEndAt() : mStart.plusMinutes(dur);
            // overlap if mStart < slotEnd && mEnd > slotStart
            if (mStart.isBefore(slotEnd) && mEnd.isAfter(slotStart)) return true;
        }
        return false;
    }

    private Map<String, Object> toDto(SupervisorAvailability a) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("availabilityId", a.getAvailabilityId());
        m.put("dayOfWeek", a.getDayOfWeek().name());
        m.put("startTime", a.getStartTime().toString());
        m.put("endTime", a.getEndTime().toString());
        m.put("slotDurationMinutes", a.getSlotDurationMinutes());
        m.put("isActive", a.getIsActive());
        return m;
    }

    private DayOfWeek parseDayOfWeek(Object raw) {
        if (raw == null) throw new BadRequestException("dayOfWeek is required");
        try {
            return DayOfWeek.valueOf(Objects.toString(raw).trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new BadRequestException("Invalid dayOfWeek: " + raw);
        }
    }

    private LocalTime parseTime(Object raw, String field) {
        if (raw == null) throw new BadRequestException(field + " is required");
        try {
            String s = Objects.toString(raw).trim();
            // Accept "HH:mm" or "HH:mm:ss"
            return s.length() <= 5 ? LocalTime.parse(s + ":00") : LocalTime.parse(s);
        } catch (Exception ex) {
            throw new BadRequestException("Invalid " + field + " (expect HH:mm): " + raw);
        }
    }

    private int parseSlotDuration(Object raw) {
        if (raw == null) return 30;
        try {
            int v = (raw instanceof Number n) ? n.intValue() : Integer.parseInt(raw.toString());
            if (v < 15 || v > 240) {
                throw new BadRequestException("slotDurationMinutes must be 15-240");
            }
            return v;
        } catch (NumberFormatException ex) {
            throw new BadRequestException("Invalid slotDurationMinutes: " + raw);
        }
    }
}
