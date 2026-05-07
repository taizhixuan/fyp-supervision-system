-- V9: Seed data - default admin user, system parameters, active FYP cycle

-- Default admin user (password: Admin@123)
INSERT INTO user_account (mmu_id, email, password_hash, full_name, role, status, created_at, updated_at)
VALUES ('2001000003', 'admin@mmu.edu.my', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'System Administrator', 'SYSTEM_ADMIN', 'ACTIVE', NOW(), NOW());

-- Default supervisor user for testing (password: Test@123)
INSERT INTO user_account (mmu_id, email, password_hash, full_name, phone, role, status, created_at, updated_at)
VALUES ('2001000001', 'sarah.lee@mmu.edu.my', '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG', 'Dr. Sarah Lee', '012-3456789', 'SUPERVISOR', 'ACTIVE', NOW(), NOW());

INSERT INTO supervisor_profile (user_id, department, faculty, position, research_areas, expertise, supervision_quota, current_load, availability_status, bio, updated_at)
VALUES (2, 'Software Engineering', 'Faculty of Computing & Informatics', 'Senior Lecturer',
    '["Machine Learning","Natural Language Processing","Computer Vision"]',
    '["Python","TensorFlow","Deep Learning"]',
    8, 0, 'AVAILABLE', 'Experienced researcher in AI and machine learning.', NOW());

-- Default student user for testing (password: Test@123)
INSERT INTO user_account (mmu_id, email, password_hash, full_name, phone, role, status, created_at, updated_at)
VALUES ('1201234567', 'student@student.mmu.edu.my', '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG', 'Ahmad bin Abdullah', '011-2345678', 'STUDENT', 'ACTIVE', NOW(), NOW());

INSERT INTO student_profile (user_id, programme, specialisation, faculty, intake_year, expected_graduation, cgpa, fyp_status, interests, skills, updated_at)
VALUES (3, 'Bachelor of Computer Science (Hons)', 'Software Engineering', 'Faculty of Computing & Informatics',
    2021, '2025-06', 3.50, 'IN_PROGRESS',
    '["Artificial Intelligence","Web Development","Cloud Computing"]',
    '["Java","Python","React","TypeScript"]', NOW());

-- Default committee user for testing (password: Test@123)
INSERT INTO user_account (mmu_id, email, password_hash, full_name, role, status, created_at, updated_at)
VALUES ('2001000002', 'ahmad.razak@mmu.edu.my', '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG', 'Prof. Ahmad Razak', 'FYP_COMMITTEE', 'ACTIVE', NOW(), NOW());

-- Default FYP Cycle (ACTIVE)
INSERT INTO fyp_cycle (cycle_code, cycle_type, academic_year, semester, start_date, end_date, status, created_at, updated_at)
VALUES ('FYP-2024-2025-1', 'FYP1', '2024/2025', 1, '2024-09-01', '2025-01-31', 'ACTIVE', NOW(), NOW());

INSERT INTO fyp_cycle (cycle_code, cycle_type, academic_year, semester, start_date, end_date, status, created_at, updated_at)
VALUES ('FYP-2024-2025-2', 'FYP2', '2024/2025', 2, '2025-02-01', '2025-06-30', 'PLANNING', NOW(), NOW());

-- System Parameters
INSERT INTO system_parameter (param_key, param_value, param_type, category, label, description, default_value, is_editable) VALUES
('max_students_per_supervisor', '8', 'NUMBER', 'supervision', 'Max Students Per Supervisor', 'Maximum number of students a supervisor can supervise', '8', TRUE),
('session_timeout_minutes', '60', 'NUMBER', 'security', 'Session Timeout (minutes)', 'Session timeout in minutes', '60', TRUE),
('max_file_upload_size_mb', '50', 'NUMBER', 'storage', 'Max File Upload Size (MB)', 'Maximum file upload size in megabytes', '50', TRUE),
('proposal_max_versions', '10', 'NUMBER', 'proposal', 'Max Proposal Versions', 'Maximum number of proposal versions allowed', '10', TRUE),
('meeting_reminder_hours', '24', 'NUMBER', 'notification', 'Meeting Reminder Hours', 'Hours before meeting to send reminder', '24', TRUE),
('deadline_reminder_days', '7', 'NUMBER', 'notification', 'Deadline Reminder Days', 'Days before deadline to send reminder', '7', TRUE),
('system_name', 'FYP Supervision System', 'STRING', 'general', 'System Name', 'Name of the system', 'FYP Supervision System', TRUE),
('university_name', 'Multimedia University', 'STRING', 'general', 'University Name', 'Name of the university', 'Multimedia University', FALSE),
('faculty_name', 'Faculty of Computing & Informatics', 'STRING', 'general', 'Faculty Name', 'Name of the faculty', 'Faculty of Computing & Informatics', FALSE),
('ai_recommendation_enabled', 'true', 'BOOLEAN', 'ai', 'AI Recommendations', 'Enable AI-powered supervisor recommendations', 'true', TRUE),
('ai_proposal_analysis_enabled', 'true', 'BOOLEAN', 'ai', 'AI Proposal Analysis', 'Enable AI-powered proposal analysis', 'true', TRUE),
('ai_chatbot_enabled', 'true', 'BOOLEAN', 'ai', 'AI Chatbot', 'Enable AI-powered chatbot', 'true', TRUE);

-- Default deadlines for active cycle
INSERT INTO deadline (cycle_id, title, description, due_date, deadline_type, audience, reminder_days, is_extendable, created_at, updated_at) VALUES
(1, 'Supervisor Selection Deadline', 'Students must select a supervisor by this date', '2024-10-15', 'REGISTRATION', 'STUDENT', '[14, 7, 3, 1]', FALSE, NOW(), NOW()),
(1, 'Proposal Submission Deadline', 'Submit your FYP proposal for review', '2024-11-15', 'PROPOSAL', 'STUDENT', '[14, 7, 3, 1]', TRUE, NOW(), NOW()),
(1, 'Proposal Review Deadline', 'Complete all proposal reviews', '2024-12-01', 'PROPOSAL', 'SUPERVISOR', '[7, 3, 1]', FALSE, NOW(), NOW()),
(1, 'Final Report Submission', 'Submit final FYP1 report', '2025-01-15', 'REPORT', 'STUDENT', '[14, 7, 3, 1]', TRUE, NOW(), NOW());
