-- V6: Announcement, Notification, Deadline tables

CREATE TABLE announcement (
    announcement_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    created_by_user_id BIGINT NOT NULL,
    scope VARCHAR(50) NOT NULL,
    title VARCHAR(300) NOT NULL,
    content TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'NORMAL',
    status ENUM('DRAFT','PUBLISHED','ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    publish_at DATETIME,
    expires_at DATETIME,
    view_count INT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT NOW(),
    updated_at DATETIME NOT NULL DEFAULT NOW() ON UPDATE NOW(),
    CONSTRAINT fk_announcement_creator FOREIGN KEY (created_by_user_id) REFERENCES user_account(user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE announcement_audience (
    audience_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    announcement_id BIGINT NOT NULL,
    target_supervisor_user_id BIGINT,
    CONSTRAINT fk_audience_announcement FOREIGN KEY (announcement_id) REFERENCES announcement(announcement_id) ON DELETE CASCADE,
    CONSTRAINT fk_audience_supervisor FOREIGN KEY (target_supervisor_user_id) REFERENCES user_account(user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE notification (
    notification_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(300) NOT NULL,
    message TEXT NOT NULL,
    target_route VARCHAR(500),
    created_at DATETIME NOT NULL DEFAULT NOW(),
    read_at DATETIME,
    CONSTRAINT fk_notification_user FOREIGN KEY (user_id) REFERENCES user_account(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE deadline (
    deadline_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    cycle_id BIGINT,
    title VARCHAR(300) NOT NULL,
    description TEXT,
    due_date DATE NOT NULL,
    deadline_type VARCHAR(50),
    audience VARCHAR(50),
    notes TEXT,
    reminder_days TEXT,
    is_extendable BOOLEAN NOT NULL DEFAULT FALSE,
    extended_date DATE,
    created_at DATETIME NOT NULL DEFAULT NOW(),
    updated_at DATETIME NOT NULL DEFAULT NOW() ON UPDATE NOW(),
    CONSTRAINT fk_deadline_cycle FOREIGN KEY (cycle_id) REFERENCES fyp_cycle(cycle_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_notification_user ON notification(user_id);
CREATE INDEX idx_notification_read ON notification(read_at);
CREATE INDEX idx_announcement_status ON announcement(status);
CREATE INDEX idx_deadline_cycle ON deadline(cycle_id);
CREATE INDEX idx_deadline_due ON deadline(due_date);
