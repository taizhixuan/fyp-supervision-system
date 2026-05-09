CREATE TABLE deadline_reminder_log (
    deadline_id BIGINT NOT NULL,
    days_before INT NOT NULL,
    fired_at DATETIME NOT NULL,
    PRIMARY KEY (deadline_id, days_before),
    CONSTRAINT fk_drl_deadline FOREIGN KEY (deadline_id) REFERENCES deadline(deadline_id) ON DELETE CASCADE
);
