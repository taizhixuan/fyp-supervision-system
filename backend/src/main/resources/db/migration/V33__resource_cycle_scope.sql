-- V33: scope resource_document by specific cycle so a COMPLETED-cycle student
-- does not see resources committee uploaded against a newer cohort. NULL means
-- evergreen (general handbook, writing guides) — visible to every student.

ALTER TABLE resource_document
    ADD COLUMN cycle_id BIGINT NULL AFTER uploaded_by_user_id,
    ADD CONSTRAINT fk_resource_cycle
        FOREIGN KEY (cycle_id) REFERENCES fyp_cycle(cycle_id)
        ON DELETE SET NULL;

CREATE INDEX idx_resource_cycle_id ON resource_document(cycle_id);
