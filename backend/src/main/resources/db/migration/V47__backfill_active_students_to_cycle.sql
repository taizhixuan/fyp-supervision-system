-- V47: backfill placeholder projects for active students who don't have one.
--
-- Background: the admin User Management approval flow had a logic gap — when an
-- admin approved a PENDING student, no Project row was created to link the
-- student to the active FYP1 cycle. The Project linkage is what
-- /admin/cycles, /admin/users?cycleId=N, and every per-cycle count rely on,
-- so those students appeared in User Management but not in any cycle view.
--
-- The controller bug is fixed in the same release (AdminUserController.approveRegistration
-- now also attaches inline when no transaction is active). This migration
-- backfills the gap for students already in the database.
--
-- Rules:
--   * Only ACTIVE STUDENT accounts.
--   * Only if no Project row exists for the student yet.
--   * Attach to the single active FYP1 cycle. If none is active, skip the row —
--     the placeholder will be created on the next cycle activation by
--     CycleLifecycleService.backfillFyp1Placeholders, or by the controller fix
--     on the next admin-approval action.

INSERT INTO project (cycle_id, student_user_id, project_title, status, registered_at, updated_at)
SELECT c.cycle_id, u.user_id, NULL, 'ACTIVE', NOW(), NOW()
FROM user_account u
CROSS JOIN fyp_cycle c
WHERE u.role = 'STUDENT'
  AND u.status = 'ACTIVE'
  AND c.cycle_type = 'FYP1'
  AND c.status = 'ACTIVE'
  AND NOT EXISTS (
      SELECT 1 FROM project p WHERE p.student_user_id = u.user_id
  );
