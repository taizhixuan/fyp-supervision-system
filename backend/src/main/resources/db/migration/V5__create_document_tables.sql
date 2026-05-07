-- V5: Document tables

CREATE TABLE project_document (
    document_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    project_id BIGINT NOT NULL,
    uploaded_by_user_id BIGINT NOT NULL,
    title VARCHAR(300),
    description TEXT,
    doc_type VARCHAR(50),
    phase VARCHAR(20),
    version_no INT NOT NULL DEFAULT 1,
    file_name VARCHAR(255) NOT NULL,
    storage_path VARCHAR(500) NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(100),
    uploaded_at DATETIME NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_doc_project FOREIGN KEY (project_id) REFERENCES project(project_id),
    CONSTRAINT fk_doc_uploader FOREIGN KEY (uploaded_by_user_id) REFERENCES user_account(user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE resource_document (
    resource_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    uploaded_by_user_id BIGINT NOT NULL,
    category VARCHAR(100),
    title VARCHAR(300) NOT NULL,
    description TEXT,
    file_name VARCHAR(255),
    storage_path VARCHAR(500) NOT NULL,
    file_size BIGINT,
    visibility VARCHAR(30) DEFAULT 'ALL',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    download_count INT NOT NULL DEFAULT 0,
    published_at DATETIME NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_resource_uploader FOREIGN KEY (uploaded_by_user_id) REFERENCES user_account(user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_doc_project ON project_document(project_id);
CREATE INDEX idx_doc_type ON project_document(doc_type);
CREATE INDEX idx_resource_category ON resource_document(category);
CREATE INDEX idx_resource_visibility ON resource_document(visibility);
