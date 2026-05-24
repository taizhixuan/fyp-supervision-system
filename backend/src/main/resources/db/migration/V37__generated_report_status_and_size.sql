-- V37: generated_report adds status (sync default COMPLETED) and file_size (bytes)
ALTER TABLE generated_report
  ADD COLUMN file_size BIGINT NULL AFTER file_path,
  ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'COMPLETED' AFTER file_size;

CREATE INDEX idx_report_status ON generated_report(status);
