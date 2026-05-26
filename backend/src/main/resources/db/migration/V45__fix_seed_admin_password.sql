-- V45: fix the seeded admin's password_hash so it actually matches "Admin@123"
-- as the V9 comment claimed. The hash baked into V9 is the well-known
-- bcrypt of the literal string "password" (a copy-paste from a Spring Security
-- example), so any fresh `docker compose down -v && up` would leave operators
-- unable to log in with the documented credentials.
--
-- Idempotent: only touches the admin if its password_hash is the legacy
-- tutorial hash, so re-running has no effect and admins who already changed
-- their password through Settings → Security are not affected.

UPDATE user_account
SET password_hash = '$2b$10$9ASYG1XoSVqDgQJKQdJE5eHYaElBW/L1r/2GJMHdG.53XmRNTctY.',
    login_attempts = 0,
    lockout_until  = NULL
WHERE email          = 'admin@mmu.edu.my'
  AND password_hash  = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';
