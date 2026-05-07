-- V7: Chat session and message tables

CREATE TABLE chat_session (
    session_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    started_at DATETIME NOT NULL DEFAULT NOW(),
    ended_at DATETIME,
    CONSTRAINT fk_chat_session_user FOREIGN KEY (user_id) REFERENCES user_account(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE chat_message (
    message_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    session_id BIGINT NOT NULL,
    sender VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    confidence_score DECIMAL(5,4),
    references_json TEXT,
    sent_at DATETIME NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_message_session FOREIGN KEY (session_id) REFERENCES chat_session(session_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_chat_session_user ON chat_session(user_id);
CREATE INDEX idx_chat_message_session ON chat_message(session_id);
