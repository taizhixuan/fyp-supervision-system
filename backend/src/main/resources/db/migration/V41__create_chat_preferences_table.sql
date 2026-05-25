-- Per-student style preferences for the FYP Assistant chatbot. The student
-- sets these once from the chatbot header settings popover; the backend
-- injects them as a style directive in every turn's context so the assistant
-- adapts tone, length, and language to the student's preference.

CREATE TABLE chat_preferences (
    user_id         BIGINT      NOT NULL,
    response_length VARCHAR(20) NOT NULL DEFAULT 'BALANCED',
    tone            VARCHAR(20) NOT NULL DEFAULT 'NEUTRAL',
    language        VARCHAR(20) NOT NULL DEFAULT 'EN',
    updated_at      DATETIME    NOT NULL,
    PRIMARY KEY (user_id),
    CONSTRAINT fk_chat_pref_user FOREIGN KEY (user_id)
        REFERENCES user_account(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
