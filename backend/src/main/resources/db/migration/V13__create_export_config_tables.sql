-- V13: Admin export configuration (UC32)

CREATE TABLE export_config (
    config_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    data_type VARCHAR(50) NOT NULL,
    format VARCHAR(20) NOT NULL DEFAULT 'CSV',
    include_headers BOOLEAN NOT NULL DEFAULT TRUE,
    date_format VARCHAR(50) DEFAULT 'yyyy-MM-dd',
    fields_json TEXT,
    filters_json TEXT,
    schedule_json TEXT,
    last_export_path VARCHAR(500),
    last_export_at DATETIME,
    created_at DATETIME NOT NULL DEFAULT NOW(),
    updated_at DATETIME NOT NULL DEFAULT NOW() ON UPDATE NOW()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_export_config_data_type ON export_config(data_type);
