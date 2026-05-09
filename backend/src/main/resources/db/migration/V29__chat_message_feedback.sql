-- V28: Add a thumbs feedback column on assistant chat messages.
-- Stores NULL (no feedback yet), 'UP', or 'DOWN'. Only assistant messages
-- can be flagged; the API enforces sender = 'assistant' before writing.
--
-- Used by the chatbot UI's thumbs up/down buttons (frontend) so that the
-- click actually persists, instead of being a local-only no-op.

ALTER TABLE chat_message
    ADD COLUMN feedback VARCHAR(8) NULL,
    ADD COLUMN feedback_at DATETIME NULL;
