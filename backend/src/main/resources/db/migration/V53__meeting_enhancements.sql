-- V53: meetings module extensions.
--   * NO_SHOW meeting status (supervisor marks a confirmed meeting the student missed)
--   * meeting_action_item: trackable action items that carry across meetings
--   * calendar_feed_token: per-user secret for the webcal subscription feed (hash only)
--   * project.meeting_gap_alerted_at: dedupe for the "no meeting in N days" alert job
--   * meeting_gap_alert_days system parameter (0 disables the alert)

ALTER TABLE meeting
    MODIFY COLUMN status ENUM('PROPOSED','CONFIRMED','COMPLETED','CANCELLED','RESCHEDULED','NO_SHOW')
        NOT NULL DEFAULT 'PROPOSED';

CREATE TABLE meeting_action_item (
    action_item_id       BIGINT       NOT NULL AUTO_INCREMENT,
    project_id           BIGINT       NOT NULL,
    meeting_id           BIGINT       NULL,
    description          VARCHAR(500) NOT NULL,
    status               VARCHAR(20)  NOT NULL DEFAULT 'OPEN',
    due_date             DATE         NULL,
    created_by_user_id   BIGINT       NULL,
    completed_by_user_id BIGINT       NULL,
    completed_at         DATETIME     NULL,
    created_at           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (action_item_id),
    KEY idx_action_item_project_status (project_id, status),
    KEY idx_action_item_meeting (meeting_id),
    CONSTRAINT fk_action_item_project FOREIGN KEY (project_id) REFERENCES project (project_id) ON DELETE CASCADE,
    CONSTRAINT fk_action_item_meeting FOREIGN KEY (meeting_id) REFERENCES meeting (meeting_id) ON DELETE SET NULL,
    CONSTRAINT fk_action_item_created_by FOREIGN KEY (created_by_user_id) REFERENCES user_account (user_id) ON DELETE SET NULL,
    CONSTRAINT fk_action_item_completed_by FOREIGN KEY (completed_by_user_id) REFERENCES user_account (user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE calendar_feed_token (
    user_id          BIGINT      NOT NULL,
    token_hash       VARCHAR(64) NOT NULL,
    created_at       DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_accessed_at DATETIME    NULL,
    PRIMARY KEY (user_id),
    UNIQUE KEY uk_calendar_feed_token_hash (token_hash),
    CONSTRAINT fk_calendar_feed_token_user FOREIGN KEY (user_id) REFERENCES user_account (user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE project
    ADD COLUMN meeting_gap_alerted_at DATETIME NULL;

INSERT INTO system_parameter (param_key, param_value, param_type, category, label, description, default_value, is_editable)
SELECT 'meeting_gap_alert_days', '21', 'NUMBER', 'notification', 'Meeting Gap Alert (days)',
       'Alert the supervisor and student when a paired project has had no conducted meeting for this many days and nothing is scheduled. 0 disables the alert.',
       '21', TRUE
WHERE NOT EXISTS (SELECT 1 FROM system_parameter WHERE param_key = 'meeting_gap_alert_days');
