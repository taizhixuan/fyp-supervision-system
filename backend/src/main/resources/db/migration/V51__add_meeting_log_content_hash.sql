-- Whole-document integrity fingerprint for a locked meeting log. SHA-256 (lowercase
-- hex, 64 chars) computed server-side over the full log content plus both signature
-- hashes at lock time, and printed into the exported DOCX so an exported copy is
-- verifiable as unaltered, not just the signature images.
ALTER TABLE meeting_log ADD COLUMN content_hash VARCHAR(64) NULL AFTER locked_at;
