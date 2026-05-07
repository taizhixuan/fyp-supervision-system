-- V1: User account and profile tables

CREATE TABLE user_account (
    user_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    mmu_id VARCHAR(20) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(200) NOT NULL,
    phone VARCHAR(30),
    role ENUM('STUDENT','SUPERVISOR','FYP_COMMITTEE','SYSTEM_ADMIN') NOT NULL,
    status ENUM('PENDING','ACTIVE','SUSPENDED','BLOCKED') NOT NULL DEFAULT 'PENDING',
    profile_image_path VARCHAR(500),
    last_login_at DATETIME,
    created_at DATETIME NOT NULL DEFAULT NOW(),
    updated_at DATETIME NOT NULL DEFAULT NOW() ON UPDATE NOW()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE student_profile (
    user_id BIGINT PRIMARY KEY,
    programme VARCHAR(200),
    specialisation VARCHAR(200),
    faculty VARCHAR(200),
    intake_year INT,
    expected_graduation VARCHAR(20),
    cgpa DECIMAL(4,2),
    fyp_status VARCHAR(50),
    interests TEXT,
    skills TEXT,
    bio TEXT,
    linkedin_url VARCHAR(500),
    github_url VARCHAR(500),
    portfolio_url VARCHAR(500),
    updated_at DATETIME NOT NULL DEFAULT NOW() ON UPDATE NOW(),
    CONSTRAINT fk_student_user FOREIGN KEY (user_id) REFERENCES user_account(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE supervisor_profile (
    user_id BIGINT PRIMARY KEY,
    department VARCHAR(200),
    faculty VARCHAR(200),
    position VARCHAR(100),
    research_areas TEXT,
    expertise TEXT,
    supervision_quota INT NOT NULL DEFAULT 8,
    current_load INT NOT NULL DEFAULT 0,
    availability_status VARCHAR(30) DEFAULT 'AVAILABLE',
    preferred_project_types TEXT,
    bio TEXT,
    office_location VARCHAR(300),
    office_hours VARCHAR(300),
    linkedin_url VARCHAR(500),
    google_scholar_url VARCHAR(500),
    updated_at DATETIME NOT NULL DEFAULT NOW() ON UPDATE NOW(),
    CONSTRAINT fk_supervisor_user FOREIGN KEY (user_id) REFERENCES user_account(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_user_account_role ON user_account(role);
CREATE INDEX idx_user_account_status ON user_account(status);
CREATE INDEX idx_user_account_email ON user_account(email);
CREATE INDEX idx_user_account_mmu_id ON user_account(mmu_id);
