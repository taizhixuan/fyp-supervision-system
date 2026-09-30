-- V55: per-user token version, embedded in every JWT as the "tv" claim.
-- Changing or resetting a password increments it, which invalidates every token
-- issued before the change (a stolen token no longer survives a password reset).
ALTER TABLE user_account
    ADD COLUMN token_version INT NOT NULL DEFAULT 0;
