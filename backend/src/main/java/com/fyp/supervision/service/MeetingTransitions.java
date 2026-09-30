package com.fyp.supervision.service;

import com.fyp.supervision.entity.Meeting;
import com.fyp.supervision.enums.MeetingStatus;
import com.fyp.supervision.exception.BadRequestException;

import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.util.Arrays;

/**
 * Status guards shared by the student and supervisor meeting endpoints, so a
 * COMPLETED / NO_SHOW / CANCELLED meeting can't be confirmed, cancelled or
 * rescheduled back to life from either side.
 */
public final class MeetingTransitions {

    /** Meetings still being negotiated or scheduled. */
    public static final MeetingStatus[] OPEN = {
            MeetingStatus.PROPOSED, MeetingStatus.RESCHEDULED, MeetingStatus.CONFIRMED };

    /** Meetings waiting for the other party to accept a proposed time. */
    public static final MeetingStatus[] AWAITING_RESPONSE = {
            MeetingStatus.PROPOSED, MeetingStatus.RESCHEDULED };

    private MeetingTransitions() {}

    public static void requireStatus(Meeting meeting, String action, MeetingStatus... allowed) {
        if (!Arrays.asList(allowed).contains(meeting.getStatus())) {
            throw new BadRequestException("Can't " + action + " a meeting that is "
                    + meeting.getStatus().name().toLowerCase().replace('_', ' ') + ".");
        }
    }

    public static LocalDateTime parseDateTime(Object raw, String field) {
        try {
            return LocalDateTime.parse(raw.toString());
        } catch (DateTimeParseException e) {
            throw new BadRequestException(field + " is not a valid date-time");
        }
    }
}
