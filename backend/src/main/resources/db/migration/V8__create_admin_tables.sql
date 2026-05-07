-- V8: System parameter, integration, audit log tables + indexes

CREATE TABLE system_parameter (
    param_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    param_key VARCHAR(100) NOT NULL UNIQUE,
    param_value VARCHAR(500),
    param_type VARCHAR(50),
    category VARCHAR(100),
    label VARCHAR(200),
    description TEXT,
    default_value VARCHAR(500),
    is_editable BOOLEAN NOT NULL DEFAULT TRUE,
    validation_rules TEXT,
    updated_by_user_id BIGINT,
    updated_at DATETIME NOT NULL DEFAULT NOW() ON UPDATE NOW(),
    CONSTRAINT fk_param_user FOREIGN KEY (updated_by_user_id) REFERENCES user_account(user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE integration_setting (
    integration_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    integration_type VARCHAR(50),
    provider VARCHAR(100),
    description TEXT,
    endpoint_url VARCHAR(500),
    settings_json TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'INACTIVE',
    last_tested_at DATETIME,
    last_test_result VARCHAR(50),
    updated_by_user_id BIGINT,
    updated_at DATETIME NOT NULL DEFAULT NOW() ON UPDATE NOW(),
    CONSTRAINT fk_integration_user FOREIGN KEY (updated_by_user_id) REFERENCES user_account(user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE audit_log (
    audit_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT,
    action VARCHAR(100) NOT NULL,
    entity_name VARCHAR(100),
    entity_id VARCHAR(50),
    old_value TEXT,
    new_value TEXT,
    details TEXT,
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    created_at DATETIME NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES user_account(user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_audit_user ON audit_log(user_id);
CREATE INDEX idx_audit_action ON audit_log(action);
CREATE INDEX idx_audit_entity ON audit_log(entity_name, entity_id);
CREATE INDEX idx_audit_created ON audit_log(created_at);
CREATE INDEX idx_param_category ON system_parameter(category);
