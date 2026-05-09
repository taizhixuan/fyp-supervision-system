-- V27: Login throttling — track consecutive failed attempts per account and lock the
-- account for a short window after N failures. Both columns nullable-friendly:
-- login_attempts defaults to 0, lockout_until is NULL when not currently locked.

ALTER TABLE user_account
    ADD COLUMN login_attempts INT NOT NULL DEFAULT 0,
    ADD COLUMN lockout_until  DATETIME NULL;
