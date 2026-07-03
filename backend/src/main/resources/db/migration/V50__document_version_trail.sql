-- Real version trail for project documents.
-- version_group ties every revision of a logical document together (NULL = legacy standalone doc).
-- is_latest marks the current revision; document lists show only is_latest = TRUE.
ALTER TABLE project_document
    ADD COLUMN version_group VARCHAR(36) NULL,
    ADD COLUMN is_latest BOOLEAN NOT NULL DEFAULT TRUE;

CREATE INDEX idx_document_version_group ON project_document (version_group);
