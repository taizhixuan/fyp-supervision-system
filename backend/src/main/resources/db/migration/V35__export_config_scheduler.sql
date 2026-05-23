-- V35: scheduler tracking for export_config
-- next_run_at is recomputed on save (when schedule.enabled) and after each run.
-- created_by surfaces who configured the export in audit/list views.

ALTER TABLE export_config
    ADD COLUMN next_run_at DATETIME NULL AFTER last_export_at,
    ADD COLUMN created_by_user_id BIGINT NULL AFTER next_run_at;

ALTER TABLE export_config
    ADD CONSTRAINT fk_export_config_created_by
    FOREIGN KEY (created_by_user_id) REFERENCES user_account(user_id);

CREATE INDEX idx_export_config_next_run ON export_config(next_run_at);
