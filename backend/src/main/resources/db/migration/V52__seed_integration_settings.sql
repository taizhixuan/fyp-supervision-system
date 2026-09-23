-- V52: seed the integration_setting rows the code already gates on.
-- AiServiceClient checks the three AI rows by name and EmailService checks the
-- EMAIL type, but the table was never seeded, so the admin Integration Settings
-- page was empty and nothing could be switched off. Rows are ACTIVE so behaviour
-- is unchanged (the gates are fail-open when a row is missing).
-- The LLM Provider row stores the admin's runtime choice of LLM; "env" means
-- use whatever the AI containers were started with. API keys are never stored
-- here, they stay in env / secrets files.

INSERT INTO integration_setting (name, integration_type, provider, description, endpoint_url, settings_json, status)
SELECT * FROM (
    SELECT 'Email (SMTP)' AS name, 'EMAIL' AS integration_type, 'SMTP' AS provider,
           'Outgoing email for OTPs, password resets and notifications. Host and credentials come from MAIL_* env vars.' AS description,
           NULL AS endpoint_url, NULL AS settings_json, 'ACTIVE' AS status
    UNION ALL
    SELECT 'File Storage', 'STORAGE', 'Local volume',
           'Uploaded documents, profile images, reports and backups on the backend upload volume.',
           NULL, NULL, 'ACTIVE'
    UNION ALL
    SELECT 'Recommendation Service', 'AI', 'Local model: BGE-base',
           'Supervisor recommendations. Sentence-BERT embeddings plus a 5-part weighted score, runs fully offline.',
           NULL, NULL, 'ACTIVE'
    UNION ALL
    SELECT 'Proposal Analyzer', 'AI', 'Local model: DistilBERT',
           'Proposal scoring with a fine-tuned DistilBERT and rule-based NLP. Uses the LLM provider for feedback text when one is set.',
           NULL, NULL, 'ACTIVE'
    UNION ALL
    SELECT 'FYP Chatbot', 'AI', 'Local model: MiniLM + FAISS',
           'RAG assistant. Retrieval runs locally; answers are written by the LLM provider.',
           NULL, NULL, 'ACTIVE'
    UNION ALL
    SELECT 'LLM Provider', 'LLM', 'env',
           'Language model used by the chatbot and proposal analyzer. Local (Ollama) or cloud API (Groq, OpenAI, custom).',
           NULL, '{"provider":"env","model":"","baseUrl":""}', 'ACTIVE'
) AS seed
WHERE NOT EXISTS (SELECT 1 FROM integration_setting i WHERE i.name = seed.name);
