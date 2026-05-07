-- V16: supervisor-led project topic catalogue + link from project to topic.
-- Real-world workflow: supervisors post topics → committee approves → students confirm.
-- Status transitions:
--   PENDING_REVIEW → APPROVED | REJECTED | REVISION_REQUIRED
--   REVISION_REQUIRED → PENDING_REVIEW (supervisor edits + resubmits)
--   APPROVED → WITHDRAWN (supervisor pulls topic before any student confirms)

CREATE TABLE supervisor_topic (
    topic_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    supervisor_user_id BIGINT NOT NULL,
    cycle_id BIGINT,
    title VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    research_area VARCHAR(200),
    slots INT NOT NULL DEFAULT 1,
    status ENUM('PENDING_REVIEW','APPROVED','REJECTED','REVISION_REQUIRED','WITHDRAWN') NOT NULL DEFAULT 'PENDING_REVIEW',
    feedback TEXT,
    reviewed_by_user_id BIGINT,
    reviewed_at DATETIME,
    created_at DATETIME NOT NULL DEFAULT NOW(),
    updated_at DATETIME NOT NULL DEFAULT NOW() ON UPDATE NOW(),
    CONSTRAINT fk_topic_supervisor FOREIGN KEY (supervisor_user_id) REFERENCES user_account(user_id),
    CONSTRAINT fk_topic_cycle FOREIGN KEY (cycle_id) REFERENCES fyp_cycle(cycle_id),
    CONSTRAINT fk_topic_reviewer FOREIGN KEY (reviewed_by_user_id) REFERENCES user_account(user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_topic_supervisor ON supervisor_topic(supervisor_user_id);
CREATE INDEX idx_topic_status ON supervisor_topic(status);
CREATE INDEX idx_topic_cycle ON supervisor_topic(cycle_id);

-- Link student's confirmed Project back to the SupervisorTopic they picked.
-- Existing projects keep topic_id = NULL (they came from the legacy free-form request flow).
ALTER TABLE project
    ADD COLUMN topic_id BIGINT NULL AFTER supervisor_user_id,
    ADD CONSTRAINT fk_project_topic FOREIGN KEY (topic_id) REFERENCES supervisor_topic(topic_id);

CREATE INDEX idx_project_topic ON project(topic_id);
