-- Per-user consent capture for PDPA compliance. Recorded at registration
-- when the user ticks the "I have read and agree to the Privacy Notice"
-- checkbox. The version string lets us re-prompt users if the policy
-- materially changes; defaults are nullable for backwards-compatibility
-- with existing seeded accounts that pre-date this column.

ALTER TABLE user_account
    ADD COLUMN terms_accepted_at        DATETIME    NULL AFTER updated_at,
    ADD COLUMN privacy_notice_version   VARCHAR(20) NULL AFTER terms_accepted_at;
