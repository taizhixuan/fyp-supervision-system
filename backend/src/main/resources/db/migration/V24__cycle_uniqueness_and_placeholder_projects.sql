-- V24: Cycle module hardening.
-- (1) Allow placeholder Project rows for newly registered students who don't have a
--     supervisor or a confirmed title yet. project_title becomes nullable, and we
--     prevent duplicate placeholder rows per (cycle, student).
-- (2) Make sure project.status defaults safely (already ACTIVE in V2 — no change).

ALTER TABLE project MODIFY COLUMN project_title VARCHAR(500) NULL;

-- A student should not have two placeholder rows in the same cycle.
ALTER TABLE project ADD CONSTRAINT uq_project_cycle_student UNIQUE (cycle_id, student_user_id);
