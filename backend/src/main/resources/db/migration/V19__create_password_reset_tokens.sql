-- V19: single-use password reset tokens. Raw token is sent to the user via email;
-- only the SHA-256 hex of it is stored, so a DB read does not yield usable tokens.
-- One live token per user; issuing a new one purges old rows for that user.

CREATE TABLE password_reset_token (
    id          BIGINT       NOT NULL AUTO_INCREMENT,
    user_id     BIGINT       NOT NULL,
    token_hash  CHAR(64)     NOT NULL,
    expires_at  DATETIME     NOT NULL,
    used_at     DATETIME     NULL,
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_password_reset_token_hash (token_hash),
    KEY idx_password_reset_user (user_id, used_at),
    CONSTRAINT fk_password_reset_user
        FOREIGN KEY (user_id) REFERENCES user_account(user_id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
