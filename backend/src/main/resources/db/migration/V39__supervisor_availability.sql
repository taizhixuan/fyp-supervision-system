-- V39: Supervisor weekly availability — recurring weekly timeslots the supervisor
-- publishes so students can pick from real options instead of guessing times.

CREATE TABLE supervisor_availability (
    availability_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    supervisor_user_id BIGINT NOT NULL,
    day_of_week VARCHAR(10) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    slot_duration_minutes INT NOT NULL DEFAULT 30,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT NOW(),
    updated_at DATETIME NOT NULL DEFAULT NOW() ON UPDATE NOW(),
    CONSTRAINT fk_supavail_user FOREIGN KEY (supervisor_user_id)
        REFERENCES user_account(user_id) ON DELETE CASCADE,
    CONSTRAINT chk_supavail_day CHECK (day_of_week IN
        ('MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY','SUNDAY')),
    CONSTRAINT chk_supavail_time CHECK (end_time > start_time),
    CONSTRAINT chk_supavail_slot CHECK (slot_duration_minutes BETWEEN 15 AND 240)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_supavail_user ON supervisor_availability(supervisor_user_id);
CREATE INDEX idx_supavail_day ON supervisor_availability(day_of_week);
