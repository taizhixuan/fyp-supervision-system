-- V56: ShedLock's lock table. Each @Scheduled job takes a named lock here before it
-- runs, so with more than one backend instance a job (reminders, publishing,
-- expiry, backups) runs once instead of once per instance.
CREATE TABLE shedlock (
    name       VARCHAR(64)  NOT NULL,
    lock_until TIMESTAMP(3) NOT NULL,
    locked_at  TIMESTAMP(3) NOT NULL,
    locked_by  VARCHAR(255) NOT NULL,
    PRIMARY KEY (name)
);
