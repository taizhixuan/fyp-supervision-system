-- V2: FYP Cycle, Project, Supervisor Request tables

CREATE TABLE fyp_cycle (
    cycle_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    cycle_code VARCHAR(50) NOT NULL UNIQUE,
    cycle_type VARCHAR(10),
    academic_year VARCHAR(20),
    semester INT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status ENUM('PLANNING','ACTIVE','COMPLETED','ARCHIVED') NOT NULL DEFAULT 'PLANNING',
    created_at DATETIME NOT NULL DEFAULT NOW(),
    updated_at DATETIME NOT NULL DEFAULT NOW() ON UPDATE NOW()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE project (
    project_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    cycle_id BIGINT,
    student_user_id BIGINT,
    supervisor_user_id BIGINT,
    project_title VARCHAR(500) NOT NULL,
    description TEXT,
    specialisation VARCHAR(200),
    category VARCHAR(100),
    stage VARCHAR(50),
    status ENUM('ACTIVE','COMPLETED','SUSPENDED','DROPPED') NOT NULL DEFAULT 'ACTIVE',
    registered_at DATETIME,
    updated_at DATETIME NOT NULL DEFAULT NOW() ON UPDATE NOW(),
    CONSTRAINT fk_project_cycle FOREIGN KEY (cycle_id) REFERENCES fyp_cycle(cycle_id),
    CONSTRAINT fk_project_student FOREIGN KEY (student_user_id) REFERENCES user_account(user_id),
    CONSTRAINT fk_project_supervisor FOREIGN KEY (supervisor_user_id) REFERENCES user_account(user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE supervisor_request (
    request_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    student_user_id BIGINT NOT NULL,
    supervisor_user_id BIGINT NOT NULL,
    proposed_title VARCHAR(500),
    topic_summary TEXT,
    message TEXT,
    response_message TEXT,
    status ENUM('PENDING','ACCEPTED','REJECTED','WITHDRAWN','EXPIRED') NOT NULL DEFAULT 'PENDING',
    submitted_at DATETIME NOT NULL DEFAULT NOW(),
    responded_at DATETIME,
    expires_at DATETIME,
    CONSTRAINT fk_request_student FOREIGN KEY (student_user_id) REFERENCES user_account(user_id),
    CONSTRAINT fk_request_supervisor FOREIGN KEY (supervisor_user_id) REFERENCES user_account(user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_project_student ON project(student_user_id);
CREATE INDEX idx_project_supervisor ON project(supervisor_user_id);
CREATE INDEX idx_project_cycle ON project(cycle_id);
CREATE INDEX idx_request_student ON supervisor_request(student_user_id);
CREATE INDEX idx_request_supervisor ON supervisor_request(supervisor_user_id);
CREATE INDEX idx_request_status ON supervisor_request(status);
