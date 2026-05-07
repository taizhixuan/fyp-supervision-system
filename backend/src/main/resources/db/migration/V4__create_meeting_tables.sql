-- V4: Meeting, Meeting Log, Meeting Log Signature tables

CREATE TABLE meeting (
    meeting_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    project_id BIGINT,
    requested_by_user_id BIGINT NOT NULL,
    title VARCHAR(300),
    meeting_type VARCHAR(50),
    proposed_start_at DATETIME,
    proposed_end_at DATETIME,
    confirmed_start_at DATETIME,
    confirmed_end_at DATETIME,
    platform VARCHAR(50),
    location VARCHAR(300),
    meeting_url VARCHAR(500),
    duration_minutes INT,
    agenda TEXT,
    notes TEXT,
    status ENUM('PROPOSED','CONFIRMED','COMPLETED','CANCELLED','RESCHEDULED') NOT NULL DEFAULT 'PROPOSED',
    cancel_reason TEXT,
    alternative_datetimes TEXT,
    created_at DATETIME NOT NULL DEFAULT NOW(),
    updated_at DATETIME NOT NULL DEFAULT NOW() ON UPDATE NOW(),
    CONSTRAINT fk_meeting_project FOREIGN KEY (project_id) REFERENCES project(project_id),
    CONSTRAINT fk_meeting_requester FOREIGN KEY (requested_by_user_id) REFERENCES user_account(user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE meeting_log (
    log_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    meeting_id BIGINT,
    project_id BIGINT NOT NULL,
    student_user_id BIGINT NOT NULL,
    supervisor_user_id BIGINT NOT NULL,
    meeting_date DATE,
    meeting_number INT,
    meeting_mode VARCHAR(20),
    fyp_phase VARCHAR(10),
    tasks_json TEXT,
    discussion_summary TEXT,
    work_done_details TEXT,
    work_to_be_done TEXT,
    problems_and_solutions TEXT,
    action_items TEXT,
    next_meeting_date DATE,
    supervisor_comments TEXT,
    correction_reason TEXT,
    status ENUM('DRAFT','SUBMITTED','CORRECTION_REQUIRED','SUPERVISOR_SIGNED','LOCKED') NOT NULL DEFAULT 'DRAFT',
    submitted_at DATETIME,
    locked_at DATETIME,
    created_at DATETIME NOT NULL DEFAULT NOW(),
    updated_at DATETIME NOT NULL DEFAULT NOW() ON UPDATE NOW(),
    CONSTRAINT fk_log_meeting FOREIGN KEY (meeting_id) REFERENCES meeting(meeting_id),
    CONSTRAINT fk_log_project FOREIGN KEY (project_id) REFERENCES project(project_id),
    CONSTRAINT fk_log_student FOREIGN KEY (student_user_id) REFERENCES user_account(user_id),
    CONSTRAINT fk_log_supervisor FOREIGN KEY (supervisor_user_id) REFERENCES user_account(user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE meeting_log_signature (
    signature_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    log_id BIGINT NOT NULL,
    signer_user_id BIGINT NOT NULL,
    signer_role VARCHAR(20) NOT NULL,
    signature_image_url TEXT,
    signature_sha256 VARCHAR(64),
    signed_at DATETIME NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_signature_log FOREIGN KEY (log_id) REFERENCES meeting_log(log_id) ON DELETE CASCADE,
    CONSTRAINT fk_signature_user FOREIGN KEY (signer_user_id) REFERENCES user_account(user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_meeting_project ON meeting(project_id);
CREATE INDEX idx_meeting_status ON meeting(status);
CREATE INDEX idx_meeting_log_project ON meeting_log(project_id);
CREATE INDEX idx_meeting_log_student ON meeting_log(student_user_id);
CREATE INDEX idx_meeting_log_status ON meeting_log(status);
