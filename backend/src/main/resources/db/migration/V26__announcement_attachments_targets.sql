-- V26: Announcement attachments + external links + per-student targeting.
-- Supports the supervisor/committee "create announcement with files & links"
-- flow and the supervisor SPECIFIC_STUDENTS scope.

CREATE TABLE announcement_attachment (
    attachment_id   BIGINT AUTO_INCREMENT PRIMARY KEY,
    announcement_id BIGINT       NOT NULL,
    file_name       VARCHAR(255) NOT NULL,
    file_path       VARCHAR(500) NOT NULL,
    file_size       BIGINT       NOT NULL,
    mime_type       VARCHAR(100),
    uploaded_at     DATETIME     NOT NULL,
    CONSTRAINT fk_aa_announcement FOREIGN KEY (announcement_id)
        REFERENCES announcement(announcement_id) ON DELETE CASCADE,
    INDEX idx_aa_announcement (announcement_id)
);

CREATE TABLE announcement_link (
    link_id         BIGINT AUTO_INCREMENT PRIMARY KEY,
    announcement_id BIGINT       NOT NULL,
    label           VARCHAR(200) NOT NULL,
    url             VARCHAR(500) NOT NULL,
    CONSTRAINT fk_al_announcement FOREIGN KEY (announcement_id)
        REFERENCES announcement(announcement_id) ON DELETE CASCADE,
    INDEX idx_al_announcement (announcement_id)
);

ALTER TABLE announcement_audience
    ADD COLUMN target_student_user_id BIGINT NULL,
    ADD CONSTRAINT fk_aa_target_student FOREIGN KEY (target_student_user_id)
        REFERENCES user_account(user_id);
