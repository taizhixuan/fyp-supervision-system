-- V12: Generated report metadata (committee reports UC29)

CREATE TABLE generated_report (
    report_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    report_type VARCHAR(50) NOT NULL,
    title VARCHAR(500) NOT NULL,
    generated_by_user_id BIGINT NOT NULL,
    generated_at DATETIME NOT NULL DEFAULT NOW(),
    format VARCHAR(20) NOT NULL DEFAULT 'CSV',
    file_path VARCHAR(500),
    filters_json TEXT,
    expires_at DATETIME,
    CONSTRAINT fk_report_user FOREIGN KEY (generated_by_user_id) REFERENCES user_account(user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_report_generated_at ON generated_report(generated_at DESC);
CREATE INDEX idx_report_type ON generated_report(report_type);
