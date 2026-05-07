-- V11: User notification preferences (per-user settings for notification channels)

CREATE TABLE user_notification_preferences (
    user_id BIGINT PRIMARY KEY,
    preferences_json TEXT,
    updated_at DATETIME NOT NULL DEFAULT NOW() ON UPDATE NOW(),
    CONSTRAINT fk_notif_prefs_user FOREIGN KEY (user_id) REFERENCES user_account(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
