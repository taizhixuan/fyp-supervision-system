-- V3: Proposal workflow tables

CREATE TABLE proposal (
    proposal_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    project_id BIGINT,
    student_user_id BIGINT NOT NULL,
    supervisor_user_id BIGINT,
    title VARCHAR(500),
    status ENUM('DRAFT','SUBMITTED','UNDER_REVIEW','REVISION_REQUIRED','APPROVED','REJECTED') NOT NULL DEFAULT 'DRAFT',
    current_version INT NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT NOW(),
    updated_at DATETIME NOT NULL DEFAULT NOW() ON UPDATE NOW(),
    CONSTRAINT fk_proposal_project FOREIGN KEY (project_id) REFERENCES project(project_id),
    CONSTRAINT fk_proposal_student FOREIGN KEY (student_user_id) REFERENCES user_account(user_id),
    CONSTRAINT fk_proposal_supervisor FOREIGN KEY (supervisor_user_id) REFERENCES user_account(user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE proposal_version (
    version_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    proposal_id BIGINT NOT NULL,
    version_no INT NOT NULL,
    content_text LONGTEXT,
    upload_file_path VARCHAR(500),
    file_name VARCHAR(255),
    created_at DATETIME NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_version_proposal FOREIGN KEY (proposal_id) REFERENCES proposal(proposal_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE proposal_check_result (
    check_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    version_id BIGINT NOT NULL,
    overall_score INT,
    feasibility_score INT,
    innovation_score INT,
    clarity_score INT,
    scope_score INT,
    issues_summary TEXT,
    missing_sections TEXT,
    suggested_improvements TEXT,
    strengths TEXT,
    weaknesses TEXT,
    plagiarism_score DECIMAL(5,2),
    checked_at DATETIME NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_check_version FOREIGN KEY (version_id) REFERENCES proposal_version(version_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE proposal_review (
    review_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    proposal_id BIGINT NOT NULL,
    reviewer_user_id BIGINT NOT NULL,
    reviewer_role VARCHAR(30) NOT NULL,
    decision VARCHAR(30) NOT NULL,
    remarks TEXT,
    internal_notes TEXT,
    reviewed_at DATETIME NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_review_proposal FOREIGN KEY (proposal_id) REFERENCES proposal(proposal_id) ON DELETE CASCADE,
    CONSTRAINT fk_review_user FOREIGN KEY (reviewer_user_id) REFERENCES user_account(user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_proposal_student ON proposal(student_user_id);
CREATE INDEX idx_proposal_status ON proposal(status);
CREATE INDEX idx_proposal_version_proposal ON proposal_version(proposal_id);
