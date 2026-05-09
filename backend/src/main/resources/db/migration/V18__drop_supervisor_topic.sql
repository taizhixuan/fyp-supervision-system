-- V18: revert the supervisor topic catalogue (V16). Spec UC4-UC7 is supervisor-first
-- (browse directory → request → propose), not topic-first.

ALTER TABLE project DROP FOREIGN KEY fk_project_topic;
ALTER TABLE project DROP INDEX idx_project_topic;
ALTER TABLE project DROP COLUMN topic_id;

DROP TABLE supervisor_topic;
