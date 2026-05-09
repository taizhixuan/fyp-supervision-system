-- V22: Approved roster tables for student/supervisor pre-authorisation.
-- When a row exists here, the matching self-registration is auto-approved
-- (status set to ACTIVE) instead of going through the admin queue.

CREATE TABLE approved_student_roster (
    roster_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    mmu_id VARCHAR(20) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(200),
    programme VARCHAR(200),
    faculty VARCHAR(200),
    intake_year INT,
    uploaded_by BIGINT,
    uploaded_at DATETIME NOT NULL DEFAULT NOW(),
    updated_at DATETIME NOT NULL DEFAULT NOW() ON UPDATE NOW(),
    CONSTRAINT fk_student_roster_uploader FOREIGN KEY (uploaded_by) REFERENCES user_account(user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE approved_supervisor_roster (
    roster_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    mmu_id VARCHAR(20) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(200),
    department VARCHAR(200),
    faculty VARCHAR(200),
    position VARCHAR(100),
    uploaded_by BIGINT,
    uploaded_at DATETIME NOT NULL DEFAULT NOW(),
    updated_at DATETIME NOT NULL DEFAULT NOW() ON UPDATE NOW(),
    CONSTRAINT fk_supervisor_roster_uploader FOREIGN KEY (uploaded_by) REFERENCES user_account(user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_student_roster_email ON approved_student_roster(email);
CREATE INDEX idx_supervisor_roster_email ON approved_supervisor_roster(email);
