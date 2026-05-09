-- V30: Final-report grading. One grade row per (project, phase, grader). The rubric
-- is stored as JSON (criterion -> marks) so the schema doesn't need to change every
-- time the committee tweaks the rubric. Status flow: DRAFT -> SUBMITTED -> FINALISED.
-- Only FINALISED grades are visible to the student.

CREATE TABLE fyp_grade (
    grade_id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    project_id            BIGINT       NOT NULL,
    phase                 VARCHAR(10)  NOT NULL,
    grader_user_id        BIGINT       NOT NULL,
    grader_role           VARCHAR(20)  NOT NULL,
    rubric_json           TEXT,
    total_score           DECIMAL(5,2),
    letter_grade          VARCHAR(5),
    remarks               TEXT,
    status                VARCHAR(20)  NOT NULL DEFAULT 'DRAFT',
    finalised_by_user_id  BIGINT,
    finalised_at          DATETIME,
    created_at            DATETIME     NOT NULL,
    updated_at            DATETIME     NOT NULL,
    CONSTRAINT fk_grade_project   FOREIGN KEY (project_id)           REFERENCES project(project_id),
    CONSTRAINT fk_grade_grader    FOREIGN KEY (grader_user_id)       REFERENCES user_account(user_id),
    CONSTRAINT fk_grade_finaliser FOREIGN KEY (finalised_by_user_id) REFERENCES user_account(user_id),
    -- One grader can leave only one row per (project, phase). Multiple graders
    -- (supervisor + examiner) get separate rows.
    CONSTRAINT uq_grade_project_phase_grader UNIQUE (project_id, phase, grader_user_id),
    INDEX idx_grade_project (project_id),
    INDEX idx_grade_grader (grader_user_id),
    INDEX idx_grade_status (status)
);
