-- Dedupe marker so the meeting-reminder job fires at most one reminder per meeting.
ALTER TABLE meeting ADD COLUMN reminder_sent_at DATETIME NULL;
