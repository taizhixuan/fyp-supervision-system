-- V10: Add AI-related columns to proposal_check_result

ALTER TABLE proposal_check_result
    ADD COLUMN proposal_id BIGINT NULL AFTER version_id,
    ADD COLUMN checked_by VARCHAR(100) NULL AFTER proposal_id,
    ADD COLUMN remarks TEXT NULL AFTER suggested_improvements,
    MODIFY COLUMN version_id BIGINT NULL,
    MODIFY COLUMN plagiarism_score INT NULL,
    ADD CONSTRAINT fk_check_proposal FOREIGN KEY (proposal_id) REFERENCES proposal(proposal_id) ON DELETE CASCADE;

CREATE INDEX idx_check_proposal ON proposal_check_result(proposal_id);
