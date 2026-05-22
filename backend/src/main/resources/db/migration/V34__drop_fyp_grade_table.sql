-- V34: Drop fyp_grade. Final-report grading was removed in favour of admin-only
-- FYP1 pass tracking. Only the admin marks pass/fail at /admin/fyp1-pass; passed
-- students automatically advance to FYP2 on their next login when an FYP2 cycle is
-- active. There are no other tables that reference fyp_grade.

DROP TABLE IF EXISTS fyp_grade;
