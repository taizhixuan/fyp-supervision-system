-- V15: pass-fail flag on project, sourced from external systems (eBwise/Clic).
-- NULL = not yet decided, TRUE = passed FYP1, FALSE = failed FYP1.
-- A passed student can advance to FYP2 on next login (reuses Project.stage flip).

ALTER TABLE project
    ADD COLUMN fyp1_passed BOOLEAN NULL DEFAULT NULL AFTER stage;

CREATE INDEX idx_project_fyp1_passed ON project(fyp1_passed);
