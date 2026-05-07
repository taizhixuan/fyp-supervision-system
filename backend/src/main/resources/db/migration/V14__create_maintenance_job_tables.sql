-- V14: Maintenance jobs (UC33)

CREATE TABLE maintenance_job (
    job_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    job_type VARCHAR(50) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    started_at DATETIME,
    completed_at DATETIME,
    message TEXT,
    result_json TEXT,
    triggered_by_user_id BIGINT,
    created_at DATETIME NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_maintenance_user FOREIGN KEY (triggered_by_user_id) REFERENCES user_account(user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_maintenance_job_type ON maintenance_job(job_type);
CREATE INDEX idx_maintenance_job_status ON maintenance_job(status);
CREATE INDEX idx_maintenance_job_started ON maintenance_job(started_at DESC);
