-- Per-user read tracking for announcements. (user_id, announcement_id) is the
-- primary key so a duplicate insert is a no-op semantically — application code
-- treats absence-of-row as "unread" and presence as "read".
--
-- view_count on the announcement table now represents UNIQUE readers, not raw
-- page views: AnnouncementService increments it only on the first insert here.

CREATE TABLE announcement_read (
    user_id BIGINT NOT NULL,
    announcement_id BIGINT NOT NULL,
    read_at DATETIME NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, announcement_id),
    CONSTRAINT fk_announcement_read_user
        FOREIGN KEY (user_id) REFERENCES user_account(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_announcement_read_announcement
        FOREIGN KEY (announcement_id) REFERENCES announcement(announcement_id) ON DELETE CASCADE,
    INDEX idx_announcement_read_user (user_id),
    INDEX idx_announcement_read_announcement (announcement_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
