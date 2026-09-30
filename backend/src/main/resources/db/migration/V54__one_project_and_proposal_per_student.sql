-- V54: data-safety constraints found in the backend audit.
--   * One project and one proposal per student. The code looks both up with an
--     Optional-returning findByStudent_UserId, so a second row (double-click, or a
--     registration racing a cycle activation) turned every later lookup into a 500.
--   * One pending registration per email, for the same reason (findByEmail).
--   * Recount supervisor_profile.current_load from live projects. It used to only
--     ever be incremented, so it drifted upward across cohorts; the app now keeps it
--     as a recount of supervised projects whose cycle is not COMPLETED/ARCHIVED.

ALTER TABLE project
    ADD CONSTRAINT uq_project_student UNIQUE (student_user_id);

ALTER TABLE proposal
    ADD CONSTRAINT uq_proposal_student UNIQUE (student_user_id);

ALTER TABLE pending_registration
    ADD CONSTRAINT uq_pending_registration_email UNIQUE (email);

UPDATE supervisor_profile sp
SET sp.current_load = (
    SELECT COUNT(*)
    FROM project p
    LEFT JOIN fyp_cycle c ON c.cycle_id = p.cycle_id
    WHERE p.supervisor_user_id = sp.user_id
      AND (c.cycle_id IS NULL OR c.status NOT IN ('COMPLETED', 'ARCHIVED'))
);
