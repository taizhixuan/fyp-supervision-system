package com.fyp.supervision.notification;

public enum NotificationCategory {
    MEETING_REMINDERS("meetingReminders"),
    DEADLINE_REMINDERS("deadlineReminders"),
    PROPOSAL_UPDATES("proposalUpdates"),
    SUPERVISOR_MESSAGES("supervisorMessages"),
    SYSTEM_ANNOUNCEMENTS("systemAnnouncements");

    private final String prefKey;

    NotificationCategory(String prefKey) {
        this.prefKey = prefKey;
    }

    public String prefKey() {
        return prefKey;
    }
}
