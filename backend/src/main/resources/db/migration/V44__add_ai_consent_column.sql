-- PDPA: per-user consent for sending data to overseas LLM providers (Groq / OpenAI).
-- Tri-state column: NULL = not yet asked, TRUE = granted, FALSE = explicitly denied.
-- Read by the chatbot endpoint as a gate before any cross-border AI call.

ALTER TABLE chat_preferences
    ADD COLUMN ai_processing_consented BOOLEAN NULL AFTER language,
    ADD COLUMN ai_consent_decided_at   DATETIME NULL AFTER ai_processing_consented;
