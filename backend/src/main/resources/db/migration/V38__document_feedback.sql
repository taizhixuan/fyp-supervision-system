CREATE TABLE document_feedback (
    feedback_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    document_id BIGINT NOT NULL,
    supervisor_user_id BIGINT NOT NULL,
    content TEXT NOT NULL,
    annotated_file_path VARCHAR(500),
    annotated_file_name VARCHAR(255),
    annotated_file_size BIGINT,
    created_at DATETIME NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_doc_feedback_document FOREIGN KEY (document_id) REFERENCES project_document(document_id) ON DELETE CASCADE,
    CONSTRAINT fk_doc_feedback_supervisor FOREIGN KEY (supervisor_user_id) REFERENCES user_account(user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_doc_feedback_document ON document_feedback(document_id);
CREATE INDEX idx_doc_feedback_supervisor ON document_feedback(supervisor_user_id);
