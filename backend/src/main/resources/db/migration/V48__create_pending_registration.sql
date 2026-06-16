-- V48: pending registrations awaiting email-ownership proof. No user_account is
-- created until a 6-digit code emailed to the address is verified, so the email /
-- MMU ID stay free to register while unverified (a real student can't be locked
-- out by someone else's unverified attempt). The chosen password is stored
-- already-bcrypt'd; only the SHA-256 hex of the OTP is stored. One live row per
-- email — starting a new registration for that email purges the old row.

CREATE TABLE pending_registration (
    id                     BIGINT       NOT NULL AUTO_INCREMENT,
    email                  VARCHAR(255) NOT NULL,
    mmu_id                 VARCHAR(20)  NOT NULL,
    role                   VARCHAR(20)  NOT NULL,
    full_name              VARCHAR(200) NOT NULL,
    phone                  VARCHAR(30)  NULL,
    password_hash          VARCHAR(255) NOT NULL,
    specialisation         VARCHAR(200) NULL,
    intake_year            INT          NULL,
    privacy_notice_version VARCHAR(20)  NULL,
    terms_accepted_at      DATETIME     NOT NULL,
    otp_hash               VARCHAR(64)  NOT NULL,
    attempts               INT          NOT NULL DEFAULT 0,
    expires_at             DATETIME     NOT NULL,
    last_sent_at           DATETIME     NOT NULL,
    used_at                DATETIME     NULL,
    created_at             DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_pending_registration_email (email),
    KEY idx_pending_registration_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
