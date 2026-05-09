-- V23: Add specialisation column to approved_student_roster.
ALTER TABLE approved_student_roster
    ADD COLUMN specialisation VARCHAR(200) AFTER programme;
