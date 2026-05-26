-- V46: fix the seeded test users' password_hash so they actually match "Test@123"
-- as the V9 comments claimed. The three test accounts (supervisor, student,
-- committee) all share the same wrong bcrypt hash from the V9 copy-paste — a
-- single targeted UPDATE catches all of them.
--
-- Affected rows:
--   sarah.lee@mmu.edu.my       (SUPERVISOR)
--   student@student.mmu.edu.my (STUDENT)
--   ahmad.razak@mmu.edu.my     (FYP_COMMITTEE)
--
-- Idempotent: scoped to rows still carrying the broken seed hash, so re-running
-- is a no-op and users who have changed their password through Settings →
-- Security are not affected.

UPDATE user_account
SET password_hash = '$2b$10$XFwjn.CdVNjmVvNAdqagreaXeRcIrGycQmypq22JvnA7ed8W2qrWG',
    login_attempts = 0,
    lockout_until  = NULL
WHERE password_hash = '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG';
