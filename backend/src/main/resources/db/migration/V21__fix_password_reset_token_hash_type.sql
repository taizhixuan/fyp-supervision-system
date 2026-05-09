-- V21: V19 created token_hash as CHAR(64); the entity maps to VARCHAR(64),
-- which makes Hibernate ddl-auto=validate refuse to start. Convert in place.

ALTER TABLE password_reset_token
    MODIFY COLUMN token_hash VARCHAR(64) NOT NULL;
