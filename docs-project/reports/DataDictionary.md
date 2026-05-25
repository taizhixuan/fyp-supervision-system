# 4.3 Data Dictionary

This section describes all database tables used in the FYP Supervision System. Each table lists field names, data types, formats, sizes, and example values to guide development and ensure consistency across the system.

## Table 4.1: Data Dictionary for FYP Supervision System

---

### USER_ACCOUNT

| Table | Field Name | Data Type | Data Format | Field Size | Description | Example |
|-------|------------|-----------|-------------|------------|-------------|---------|
| USER_ACCOUNT | user_id | BIGINT | Numeric | 20 | System-generated unique user identifier (Primary Key) | 1001 |
| USER_ACCOUNT | mmu_id | VARCHAR | Alphanumeric | 20 | MMU ID / staff ID - unique login identifier (Unique Key) | "1211234567" |
| USER_ACCOUNT | email | VARCHAR | Email format | 100 | User email address | "john.doe@student.mmu.edu.my" |
| USER_ACCOUNT | full_name | VARCHAR | Text | 150 | User full name | "John Doe" |
| USER_ACCOUNT | phone | VARCHAR | Phone format | 20 | Contact number (optional) | "+60123456789" |
| USER_ACCOUNT | role | VARCHAR | Enumeration | 20 | User role in the system | <mark>"STUDENT", "SUPERVISOR", "FYP_COMMITTEE", "SYSTEM_ADMIN"</mark> |
| USER_ACCOUNT | status | VARCHAR | Enumeration | 15 | Account status | <mark>"PENDING", "ACTIVE", "SUSPENDED", "BLOCKED"</mark> |
| USER_ACCOUNT | last_login_at | DATETIME | YYYY-MM-DD HH:MM:SS | - | Timestamp of last login | "2025-01-15 14:30:00" |
| USER_ACCOUNT | created_at | DATETIME | YYYY-MM-DD HH:MM:SS | - | Account creation timestamp | "2024-09-01 09:00:00" |
| USER_ACCOUNT | updated_at | DATETIME | YYYY-MM-DD HH:MM:SS | - | Last update timestamp | "2025-01-10 16:45:00" |

---

### STUDENT_PROFILE

| Table | Field Name | Data Type | Data Format | Field Size | Description | Example |
|-------|------------|-----------|-------------|------------|-------------|---------|
| STUDENT_PROFILE | user_id | BIGINT | Numeric | 20 | Student's user ID - links to USER_ACCOUNT (Primary Key, Foreign Key) | 1001 |
| STUDENT_PROFILE | programme | VARCHAR | Text | 50 | Student programme code | "BCS", "BIT", "BSD" |
| STUDENT_PROFILE | specialisation | VARCHAR | Text | 100 | Student specialisation area | "Software Engineering", "Data Science" |
| STUDENT_PROFILE | cgpa | DECIMAL | Numeric (3,2) | 4 | Cumulative Grade Point Average | 3.75 |
| STUDENT_PROFILE | fyp_status | VARCHAR | Enumeration | 20 | Current FYP stage status | "Not Started", "FYP1", "FYP2", "Completed" |
| STUDENT_PROFILE | interests | TEXT | Text | 1000 | Research interests and keywords | "Machine Learning, Web Development, Mobile Apps" |
| STUDENT_PROFILE | updated_at | DATETIME | YYYY-MM-DD HH:MM:SS | - | Profile last update timestamp | "2025-01-12 10:30:00" |

---

### SUPERVISOR_PROFILE

| Table | Field Name | Data Type | Data Format | Field Size | Description | Example |
|-------|------------|-----------|-------------|------------|-------------|---------|
| SUPERVISOR_PROFILE | user_id | BIGINT | Numeric | 20 | Supervisor's user ID - links to USER_ACCOUNT (Primary Key, Foreign Key) | 2001 |
| <mark>SUPERVISOR_PROFILE</mark> | <mark>department</mark> | <mark>VARCHAR</mark> | <mark>Text</mark> | <mark>200</mark> | <mark>Department name</mark> | <mark>"Computing and Informatics"</mark> |
| <mark>SUPERVISOR_PROFILE</mark> | <mark>faculty</mark> | <mark>VARCHAR</mark> | <mark>Text</mark> | <mark>200</mark> | <mark>Faculty name</mark> | <mark>"Faculty of Computing and Informatics"</mark> |
| <mark>SUPERVISOR_PROFILE</mark> | <mark>position</mark> | <mark>VARCHAR</mark> | <mark>Text</mark> | <mark>100</mark> | <mark>Academic position / title</mark> | <mark>"Senior Lecturer", "Associate Professor"</mark> |
| SUPERVISOR_PROFILE | research_areas | TEXT | Text | 1000 | Research areas and expertise keywords | "Artificial Intelligence, Computer Vision, NLP" |
| <mark>SUPERVISOR_PROFILE</mark> | <mark>expertise</mark> | <mark>TEXT</mark> | <mark>Text</mark> | <mark>1000</mark> | <mark>Detailed expertise / skill keywords used for AI matching</mark> | <mark>"Deep Learning, MLOps, Computer Vision"</mark> |
| SUPERVISOR_PROFILE | supervision_quota | INT | Numeric | 3 | Maximum number of supervisees allowed | 8 |
| SUPERVISOR_PROFILE | current_load | INT | Numeric | 3 | Current number of assigned supervisees | 5 |
| SUPERVISOR_PROFILE | availability_status | VARCHAR | Enumeration | 20 | Supervisor availability for new students | "Available", "Not Available", "Limited" |
| SUPERVISOR_PROFILE | preferred_project_types | TEXT | Text | 500 | Preferred project categories/types | "Research-based, Application Development" |
| <mark>SUPERVISOR_PROFILE</mark> | <mark>bio</mark> | <mark>TEXT</mark> | <mark>Text</mark> | <mark>2000</mark> | <mark>Self-introduction / biography</mark> | <mark>"PhD in Computer Science with 10 years of research experience..."</mark> |
| <mark>SUPERVISOR_PROFILE</mark> | <mark>office_location</mark> | <mark>VARCHAR</mark> | <mark>Text</mark> | <mark>300</mark> | <mark>Physical office location</mark> | <mark>"Building A, Level 5, Room A5-12"</mark> |
| <mark>SUPERVISOR_PROFILE</mark> | <mark>office_hours</mark> | <mark>VARCHAR</mark> | <mark>Text</mark> | <mark>300</mark> | <mark>Consultation hours</mark> | <mark>"Mon/Wed 2pm-4pm"</mark> |
| <mark>SUPERVISOR_PROFILE</mark> | <mark>linkedin_url</mark> | <mark>VARCHAR</mark> | <mark>URL format</mark> | <mark>500</mark> | <mark>LinkedIn profile link (optional)</mark> | <mark>"https://www.linkedin.com/in/jane-doe"</mark> |
| <mark>SUPERVISOR_PROFILE</mark> | <mark>google_scholar_url</mark> | <mark>VARCHAR</mark> | <mark>URL format</mark> | <mark>500</mark> | <mark>Google Scholar profile link (optional)</mark> | <mark>"https://scholar.google.com/citations?user=xxx"</mark> |
| SUPERVISOR_PROFILE | updated_at | DATETIME | YYYY-MM-DD HH:MM:SS | - | Profile last update timestamp | "2025-01-08 11:20:00" |

---

### FYP_CYCLE

| Table | Field Name | Data Type | Data Format | Field Size | Description | Example |
|-------|------------|-----------|-------------|------------|-------------|---------|
| FYP_CYCLE | cycle_id | BIGINT | Numeric | 20 | Unique cycle identifier (Primary Key) | 1 |
| FYP_CYCLE | cycle_code | VARCHAR | Alphanumeric | 10 | Cycle label/code | "T2530", "T2630" |
| FYP_CYCLE | start_date | DATE | YYYY-MM-DD | - | Cycle start date | "2025-01-15" |
| FYP_CYCLE | end_date | DATE | YYYY-MM-DD | - | Cycle end date | "2025-12-31" |
| FYP_CYCLE | status | VARCHAR | Enumeration | 15 | Cycle status | <mark>"PLANNING", "ACTIVE", "COMPLETED", "ARCHIVED"</mark> |

---

### SUPERVISOR_REQUEST

| Table | Field Name | Data Type | Data Format | Field Size | Description | Example |
|-------|------------|-----------|-------------|------------|-------------|---------|
| SUPERVISOR_REQUEST | request_id | BIGINT | Numeric | 20 | Unique request identifier (Primary Key) | 5001 |
| SUPERVISOR_REQUEST | student_user_id | BIGINT | Numeric | 20 | Student who submitted the request (Foreign Key) | 1001 |
| SUPERVISOR_REQUEST | supervisor_user_id | BIGINT | Numeric | 20 | Supervisor receiving the request (Foreign Key) | 2001 |
| SUPERVISOR_REQUEST | topic_summary | TEXT | Text | 500 | Short topic/proposal summary | "AI-based Student Performance Prediction System" |
| SUPERVISOR_REQUEST | message | TEXT | Text | 2000 | Request message from student | "I am interested in your research area..." |
| SUPERVISOR_REQUEST | status | VARCHAR | Enumeration | 15 | Request status | <mark>"PENDING", "ACCEPTED", "REJECTED", "WITHDRAWN", "EXPIRED"</mark> |
| SUPERVISOR_REQUEST | submitted_at | DATETIME | YYYY-MM-DD HH:MM:SS | - | Timestamp when request was submitted | "2025-01-10 09:15:00" |
| SUPERVISOR_REQUEST | responded_at | DATETIME | YYYY-MM-DD HH:MM:SS | - | Timestamp when supervisor responded | "2025-01-12 14:30:00" |

---

### PROJECT

| Table | Field Name | Data Type | Data Format | Field Size | Description | Example |
|-------|------------|-----------|-------------|------------|-------------|---------|
| PROJECT | project_id | BIGINT | Numeric | 20 | Unique project identifier (Primary Key) | 3001 |
| PROJECT | cycle_id | BIGINT | Numeric | 20 | FYP cycle where project belongs (Foreign Key) | 1 |
| PROJECT | student_user_id | BIGINT | Numeric | 20 | Project owner - student (Foreign Key) | 1001 |
| PROJECT | supervisor_user_id | BIGINT | Numeric | 20 | Assigned supervisor (Foreign Key, nullable) | 2001 |
| PROJECT | project_title | VARCHAR | Text | 300 | Project title | "Intelligent FYP Supervision Management System" |
| <mark>PROJECT</mark> | <mark>description</mark> | <mark>TEXT</mark> | <mark>Text</mark> | <mark>5000</mark> | <mark>Project description / abstract</mark> | <mark>"This project develops an AI-assisted FYP supervision platform..."</mark> |
| PROJECT | specialisation | VARCHAR | Text | 100 | Specialisation/category alignment | "Software Engineering" |
| PROJECT | category | VARCHAR | Text | 50 | Project category/type | "Application Development", "Research" |
| PROJECT | stage | VARCHAR | Enumeration | 10 | Current FYP stage | "FYP1", "FYP2" |
| PROJECT | status | VARCHAR | Enumeration | 15 | Project status | <mark>"ACTIVE", "COMPLETED", "SUSPENDED", "DROPPED"</mark> |
| PROJECT | registered_at | DATETIME | YYYY-MM-DD HH:MM:SS | - | Registration timestamp | "2025-01-20 10:00:00" |
| PROJECT | updated_at | DATETIME | YYYY-MM-DD HH:MM:SS | - | Last update timestamp | "2025-01-25 15:30:00" |

---

### PROPOSAL

| Table | Field Name | Data Type | Data Format | Field Size | Description | Example |
|-------|------------|-----------|-------------|------------|-------------|---------|
| PROPOSAL | proposal_id | BIGINT | Numeric | 20 | Unique proposal identifier (Primary Key) | 4001 |
| PROPOSAL | project_id | BIGINT | Numeric | 20 | Related project (Foreign Key) | 3001 |
| PROPOSAL | student_user_id | BIGINT | Numeric | 20 | Proposal owner - student (Foreign Key) | 1001 |
| PROPOSAL | supervisor_user_id | BIGINT | Numeric | 20 | Assigned supervisor (Foreign Key, nullable) | 2001 |
| <mark>PROPOSAL</mark> | <mark>title</mark> | <mark>VARCHAR</mark> | <mark>Text</mark> | <mark>500</mark> | <mark>Proposal title (may evolve from project_title)</mark> | <mark>"AI-driven FYP Supervision Recommendation"</mark> |
| PROPOSAL | status | VARCHAR | Enumeration | 20 | Proposal status | "DRAFT", "SUBMITTED", "UNDER_REVIEW", "REVISION_REQUIRED", "APPROVED", "REJECTED" |
| <mark>PROPOSAL</mark> | <mark>current_version</mark> | <mark>INT</mark> | <mark>Numeric</mark> | <mark>3</mark> | <mark>Latest version number for this proposal</mark> | <mark>3</mark> |
| PROPOSAL | created_at | DATETIME | YYYY-MM-DD HH:MM:SS | - | Proposal creation timestamp | "2025-01-22 11:00:00" |
| PROPOSAL | updated_at | DATETIME | YYYY-MM-DD HH:MM:SS | - | Proposal last update timestamp | "2025-01-28 09:45:00" |

---

### PROPOSAL_VERSION

| Table | Field Name | Data Type | Data Format | Field Size | Description | Example |
|-------|------------|-----------|-------------|------------|-------------|---------|
| PROPOSAL_VERSION | version_id | BIGINT | Numeric | 20 | Unique version identifier (Primary Key) | 6001 |
| PROPOSAL_VERSION | proposal_id | BIGINT | Numeric | 20 | Parent proposal (Foreign Key) | 4001 |
| PROPOSAL_VERSION | version_no | INT | Numeric | 3 | Version number (sequential) | 1, 2, 3 |
| PROPOSAL_VERSION | content_text | TEXT | Text | 50000 | Proposal content in text format | "1. Introduction\n1.1 Background..." |
| PROPOSAL_VERSION | upload_file_path | VARCHAR | File path | 500 | Stored file path for uploaded document | "/uploads/proposals/4001/v1_proposal.pdf" |
| <mark>PROPOSAL_VERSION</mark> | <mark>file_name</mark> | <mark>VARCHAR</mark> | <mark>Text</mark> | <mark>255</mark> | <mark>Original uploaded file name</mark> | <mark>"FYP_Proposal_v1.pdf"</mark> |
| PROPOSAL_VERSION | created_at | DATETIME | YYYY-MM-DD HH:MM:SS | - | Version creation timestamp | "2025-01-22 11:15:00" |

---

### PROPOSAL_CHECK_RESULT

| Table | Field Name | Data Type | Data Format | Field Size | Description | Example |
|-------|------------|-----------|-------------|------------|-------------|---------|
| PROPOSAL_CHECK_RESULT | check_id | BIGINT | Numeric | 20 | Unique check result identifier (Primary Key) | 7001 |
| PROPOSAL_CHECK_RESULT | version_id | BIGINT | Numeric | 20 | Checked proposal version (Foreign Key, <mark>nullable for proposal-level checks</mark>) | 6001 |
| <mark>PROPOSAL_CHECK_RESULT</mark> | <mark>proposal_id</mark> | <mark>BIGINT</mark> | <mark>Numeric</mark> | <mark>20</mark> | <mark>Proposal directly checked (Foreign Key, nullable for version-level checks)</mark> | <mark>4001</mark> |
| <mark>PROPOSAL_CHECK_RESULT</mark> | <mark>checked_by</mark> | <mark>VARCHAR</mark> | <mark>Text</mark> | <mark>100</mark> | <mark>Source/identifier of the check (AI service name or user)</mark> | <mark>"AI_PROPOSAL_ANALYZER"</mark> |
| PROPOSAL_CHECK_RESULT | overall_score | INT | Numeric | 3 | Overall completeness/quality score (0-100) | 85 |
| <mark>PROPOSAL_CHECK_RESULT</mark> | <mark>feasibility_score</mark> | <mark>INT</mark> | <mark>Numeric</mark> | <mark>3</mark> | <mark>Feasibility sub-score (0-100)</mark> | <mark>80</mark> |
| <mark>PROPOSAL_CHECK_RESULT</mark> | <mark>innovation_score</mark> | <mark>INT</mark> | <mark>Numeric</mark> | <mark>3</mark> | <mark>Innovation sub-score (0-100)</mark> | <mark>78</mark> |
| <mark>PROPOSAL_CHECK_RESULT</mark> | <mark>clarity_score</mark> | <mark>INT</mark> | <mark>Numeric</mark> | <mark>3</mark> | <mark>Clarity sub-score (0-100)</mark> | <mark>90</mark> |
| <mark>PROPOSAL_CHECK_RESULT</mark> | <mark>scope_score</mark> | <mark>INT</mark> | <mark>Numeric</mark> | <mark>3</mark> | <mark>Scope sub-score (0-100)</mark> | <mark>82</mark> |
| PROPOSAL_CHECK_RESULT | issues_summary | TEXT | Text | 2000 | Summary of issues detected by AI | "Missing methodology section details" |
| PROPOSAL_CHECK_RESULT | missing_sections | TEXT | Text | 1000 | List of missing sections | "Literature Review, Timeline" |
| PROPOSAL_CHECK_RESULT | suggested_improvements | TEXT | Text | 3000 | AI-generated improvement suggestions | "Consider adding more specific objectives..." |
| <mark>PROPOSAL_CHECK_RESULT</mark> | <mark>strengths</mark> | <mark>TEXT</mark> | <mark>Text</mark> | <mark>2000</mark> | <mark>AI-detected strengths of the proposal</mark> | <mark>"Strong technical foundation; clear objectives"</mark> |
| <mark>PROPOSAL_CHECK_RESULT</mark> | <mark>weaknesses</mark> | <mark>TEXT</mark> | <mark>Text</mark> | <mark>2000</mark> | <mark>AI-detected weaknesses of the proposal</mark> | <mark>"Methodology lacks evaluation metrics"</mark> |
| <mark>PROPOSAL_CHECK_RESULT</mark> | <mark>remarks</mark> | <mark>TEXT</mark> | <mark>Text</mark> | <mark>2000</mark> | <mark>Additional remarks attached to the check result</mark> | <mark>"Run on submitted v3"</mark> |
<!-- The plagiarism_score column added in V10 was dropped in V31 (2026-05-10) because the analyser never produced a real signal for it. -->

| PROPOSAL_CHECK_RESULT | checked_at | DATETIME | YYYY-MM-DD HH:MM:SS | - | Timestamp of check | "2025-01-22 11:20:00" |

---

### PROPOSAL_REVIEW

| Table | Field Name | Data Type | Data Format | Field Size | Description | Example |
|-------|------------|-----------|-------------|------------|-------------|---------|
| PROPOSAL_REVIEW | review_id | BIGINT | Numeric | 20 | Unique review record identifier (Primary Key) | 8001 |
| PROPOSAL_REVIEW | proposal_id | BIGINT | Numeric | 20 | Proposal being reviewed (Foreign Key) | 4001 |
| PROPOSAL_REVIEW | reviewer_user_id | BIGINT | Numeric | 20 | Reviewer user ID (Foreign Key) | 2001 |
| PROPOSAL_REVIEW | reviewer_role | VARCHAR | Enumeration | 30 | Role of reviewer | <mark>"SUPERVISOR", "FYP_COMMITTEE"</mark> |
| PROPOSAL_REVIEW | decision | VARCHAR | Enumeration | 20 | Review decision | "APPROVE", "REJECT", "REQUEST_REVISION" |
| PROPOSAL_REVIEW | remarks | TEXT | Text | 3000 | Review comments and feedback | "Good proposal, minor revisions needed..." |
| <mark>PROPOSAL_REVIEW</mark> | <mark>internal_notes</mark> | <mark>TEXT</mark> | <mark>Text</mark> | <mark>3000</mark> | <mark>Internal reviewer notes (not shown to student)</mark> | <mark>"Coordinate with second supervisor on scope"</mark> |
| PROPOSAL_REVIEW | reviewed_at | DATETIME | YYYY-MM-DD HH:MM:SS | - | Review timestamp | "2025-01-30 16:00:00" |

---

### MEETING

| Table | Field Name | Data Type | Data Format | Field Size | Description | Example |
|-------|------------|-----------|-------------|------------|-------------|---------|
| MEETING | meeting_id | BIGINT | Numeric | 20 | Unique meeting identifier (Primary Key) | 9001 |
| MEETING | project_id | BIGINT | Numeric | 20 | Related project (Foreign Key) | 3001 |
| MEETING | requested_by_student_user_id | BIGINT | Numeric | 20 | Student who requested meeting (Foreign Key) | 1001 |
| MEETING | proposed_start_at | DATETIME | YYYY-MM-DD HH:MM:SS | - | Proposed meeting start time | "2025-02-01 10:00:00" |
| MEETING | proposed_end_at | DATETIME | YYYY-MM-DD HH:MM:SS | - | Proposed meeting end time | "2025-02-01 11:00:00" |
| MEETING | platform | VARCHAR | Enumeration | 30 | Meeting platform | "Microsoft Teams", "Zoom", "Face-to-face" |
| MEETING | agenda | TEXT | Text | 2000 | Meeting agenda | "1. Progress update\n2. Discussion on Chapter 2" |
| MEETING | status | VARCHAR | Enumeration | 15 | Meeting status | "PROPOSED", "CONFIRMED", "RESCHEDULED", "CANCELLED", "DONE" |
| MEETING | confirmed_start_at | DATETIME | YYYY-MM-DD HH:MM:SS | - | Confirmed meeting start time | "2025-02-01 10:30:00" |
| MEETING | confirmed_end_at | DATETIME | YYYY-MM-DD HH:MM:SS | - | Confirmed meeting end time | "2025-02-01 11:30:00" |
| MEETING | updated_at | DATETIME | YYYY-MM-DD HH:MM:SS | - | Last update timestamp | "2025-01-31 09:00:00" |

---

### MEETING_LOG

| Table | Field Name | Data Type | Data Format | Field Size | Description | Example |
|-------|------------|-----------|-------------|------------|-------------|---------|
| MEETING_LOG | log_id | BIGINT | Numeric | 20 | Unique meeting log identifier (Primary Key) | 10001 |
| MEETING_LOG | meeting_id | BIGINT | Numeric | 20 | Meeting reference (Foreign Key) | 9001 |
| MEETING_LOG | project_id | BIGINT | Numeric | 20 | Project reference - denormalised (Foreign Key) | 3001 |
| MEETING_LOG | discussion_summary | TEXT | Text | 5000 | Summary of meeting discussion | "Discussed project scope and methodology..." |
| MEETING_LOG | action_items | TEXT | Text | 3000 | Action items and next steps | "1. Complete literature review\n2. Draft Chapter 1" |
| MEETING_LOG | next_meeting_date | DATE | YYYY-MM-DD | - | Planned next meeting date | "2025-02-15" |
| MEETING_LOG | supervisor_comments | TEXT | Text | 2000 | Supervisor feedback/comments | "Good progress, continue with current pace" |
| MEETING_LOG | status | VARCHAR | Enumeration | 25 | Log status | <mark>"DRAFT", "SUBMITTED", "CORRECTION_REQUIRED", "SUPERVISOR_SIGNED", "LOCKED"</mark> |
| MEETING_LOG | submitted_at | DATETIME | YYYY-MM-DD HH:MM:SS | - | Submission timestamp | "2025-02-01 15:00:00" |
| MEETING_LOG | locked_at | DATETIME | YYYY-MM-DD HH:MM:SS | - | Lock timestamp when finalised | "2025-02-02 10:00:00" |

---

### MEETING_LOG_SIGNATURE

| Table | Field Name | Data Type | Data Format | Field Size | Description | Example |
|-------|------------|-----------|-------------|------------|-------------|---------|
| MEETING_LOG_SIGNATURE | signature_id | BIGINT | Numeric | 20 | Unique signature identifier (Primary Key) | 11001 |
| MEETING_LOG_SIGNATURE | log_id | BIGINT | Numeric | 20 | Meeting log being signed (Foreign Key) | 10001 |
| MEETING_LOG_SIGNATURE | signer_user_id | BIGINT | Numeric | 20 | User who signed (Foreign Key) | 1001 |
| MEETING_LOG_SIGNATURE | signer_role | VARCHAR | Enumeration | 15 | Role of signer | "STUDENT", "SUPERVISOR" |
| MEETING_LOG_SIGNATURE | signed_at | DATETIME | YYYY-MM-DD HH:MM:SS | - | Signature timestamp | "2025-02-01 16:30:00" |

---

### PROJECT_DOCUMENT

| Table | Field Name | Data Type | Data Format | Field Size | Description | Example |
|-------|------------|-----------|-------------|------------|-------------|---------|
| PROJECT_DOCUMENT | document_id | BIGINT | Numeric | 20 | Unique document identifier (Primary Key) | 12001 |
| PROJECT_DOCUMENT | project_id | BIGINT | Numeric | 20 | Related project (Foreign Key) | 3001 |
| PROJECT_DOCUMENT | uploaded_by_user_id | BIGINT | Numeric | 20 | User who uploaded document (Foreign Key) | 1001 |
| PROJECT_DOCUMENT | doc_type | VARCHAR | Enumeration | 20 | Document type | "PROPOSAL", "REPORT", "SLIDES", "OTHER" |
| PROJECT_DOCUMENT | phase | VARCHAR | Enumeration | 15 | FYP phase | "FYP1", "FYP2", "Interim", "Final" |
| PROJECT_DOCUMENT | version_no | INT | Numeric | 3 | Document version number | 1, 2, 3 |
| PROJECT_DOCUMENT | file_name | VARCHAR | Text | 255 | Original filename | "FYP1_Report_v2.pdf" |
| PROJECT_DOCUMENT | storage_path | VARCHAR | File path | 500 | Storage location path | "/uploads/documents/3001/report_v2.pdf" |
| PROJECT_DOCUMENT | uploaded_at | DATETIME | YYYY-MM-DD HH:MM:SS | - | Upload timestamp | "2025-03-15 14:20:00" |

---

### RESOURCE_DOCUMENT

| Table | Field Name | Data Type | Data Format | Field Size | Description | Example |
|-------|------------|-----------|-------------|------------|-------------|---------|
| RESOURCE_DOCUMENT | resource_id | BIGINT | Numeric | 20 | Unique resource identifier (Primary Key) | 13001 |
| RESOURCE_DOCUMENT | uploaded_by_admin_user_id | BIGINT | Numeric | 20 | Admin who published (Foreign Key) | 3001 |
| RESOURCE_DOCUMENT | category | VARCHAR | Enumeration | 20 | Resource category | "Template", "Handbook", "Rubric", "Other" |
| RESOURCE_DOCUMENT | title | VARCHAR | Text | 200 | Resource title | "FYP Proposal Template 2025" |
| RESOURCE_DOCUMENT | storage_path | VARCHAR | File path | 500 | Storage location path | "/resources/templates/proposal_template.docx" |
| RESOURCE_DOCUMENT | visibility | VARCHAR | Enumeration | 15 | Visibility scope | "ALL", "STUDENT", "SUPERVISOR", "ADMIN" |
| RESOURCE_DOCUMENT | is_active | BOOLEAN | True/False | 1 | Active/visible status | true, false |
| RESOURCE_DOCUMENT | published_at | DATETIME | YYYY-MM-DD HH:MM:SS | - | Publish timestamp | "2025-01-01 08:00:00" |

---

### DEADLINE

| Table | Field Name | Data Type | Data Format | Field Size | Description | Example |
|-------|------------|-----------|-------------|------------|-------------|---------|
| DEADLINE | deadline_id | BIGINT | Numeric | 20 | Unique deadline identifier (Primary Key) | 14001 |
| DEADLINE | cycle_id | BIGINT | Numeric | 20 | Related FYP cycle (Foreign Key) | 1 |
| DEADLINE | title | VARCHAR | Text | 200 | Deadline title | "FYP1 Proposal Submission" |
| DEADLINE | due_date | DATE | YYYY-MM-DD | - | Due date | "2025-02-28" |
| DEADLINE | audience | VARCHAR | Enumeration | 15 | Target audience | "STUDENT", "SUPERVISOR", "ALL" |
| DEADLINE | notes | TEXT | Text | 1000 | Additional notes | "Submit via online portal before 11:59 PM" |

---

### ANNOUNCEMENT

| Table | Field Name | Data Type | Data Format | Field Size | Description | Example |
|-------|------------|-----------|-------------|------------|-------------|---------|
| ANNOUNCEMENT | announcement_id | BIGINT | Numeric | 20 | Unique announcement identifier (Primary Key) | 15001 |
| ANNOUNCEMENT | created_by_user_id | BIGINT | Numeric | 20 | Creator/admin user ID (Foreign Key) | 3001 |
| ANNOUNCEMENT | scope | VARCHAR | Enumeration | 15 | Announcement scope | "ALL", "STUDENT", "SUPERVISOR", "CUSTOM" |
| ANNOUNCEMENT | title | VARCHAR | Text | 200 | Announcement title | "FYP1 Briefing Session" |
| ANNOUNCEMENT | content | TEXT | Text | 5000 | Announcement body content | "All FYP1 students are required to attend..." |
| ANNOUNCEMENT | publish_at | DATETIME | YYYY-MM-DD HH:MM:SS | - | Scheduled publish time | "2025-01-20 09:00:00" |
| ANNOUNCEMENT | created_at | DATETIME | YYYY-MM-DD HH:MM:SS | - | Created timestamp | "2025-01-18 14:00:00" |

---

### ANNOUNCEMENT_AUDIENCE

| Table | Field Name | Data Type | Data Format | Field Size | Description | Example |
|-------|------------|-----------|-------------|------------|-------------|---------|
| ANNOUNCEMENT_AUDIENCE | audience_id | BIGINT | Numeric | 20 | Unique audience row identifier (Primary Key) | 16001 |
| ANNOUNCEMENT_AUDIENCE | announcement_id | BIGINT | Numeric | 20 | Related announcement (Foreign Key) | 15001 |
| ANNOUNCEMENT_AUDIENCE | target_supervisor_user_id | BIGINT | Numeric | 20 | Targeted supervisor user ID for CUSTOM scope (Foreign Key) | 2001 |

---

### NOTIFICATION

| Table | Field Name | Data Type | Data Format | Field Size | Description | Example |
|-------|------------|-----------|-------------|------------|-------------|---------|
| NOTIFICATION | notification_id | BIGINT | Numeric | 20 | Unique notification identifier (Primary Key) | 17001 |
| NOTIFICATION | user_id | BIGINT | Numeric | 20 | Recipient user (Foreign Key) | 1001 |
| NOTIFICATION | type | VARCHAR | Enumeration | 15 | Notification type | "REQUEST", "PROPOSAL", "MEETING", "SYSTEM" |
| NOTIFICATION | title | VARCHAR | Text | 200 | Notification title | "New Meeting Request" |
| NOTIFICATION | message | TEXT | Text | 1000 | Notification message content | "Your supervisor has confirmed the meeting..." |
| NOTIFICATION | created_at | DATETIME | YYYY-MM-DD HH:MM:SS | - | Created timestamp | "2025-01-25 10:30:00" |
| NOTIFICATION | read_at | DATETIME | YYYY-MM-DD HH:MM:SS | - | Time notification was read | "2025-01-25 11:00:00" |

---

### CHAT_SESSION

| Table | Field Name | Data Type | Data Format | Field Size | Description | Example |
|-------|------------|-----------|-------------|------------|-------------|---------|
| CHAT_SESSION | session_id | BIGINT | Numeric | 20 | Unique chat session identifier (Primary Key) | 18001 |
| CHAT_SESSION | user_id | BIGINT | Numeric | 20 | User who started chat (Foreign Key) | 1001 |
| CHAT_SESSION | started_at | DATETIME | YYYY-MM-DD HH:MM:SS | - | Session start time | "2025-01-26 09:00:00" |
| CHAT_SESSION | ended_at | DATETIME | YYYY-MM-DD HH:MM:SS | - | Session end time | "2025-01-26 09:30:00" |

---

### CHAT_MESSAGE

| Table | Field Name | Data Type | Data Format | Field Size | Description | Example |
|-------|------------|-----------|-------------|------------|-------------|---------|
| CHAT_MESSAGE | message_id | BIGINT | Numeric | 20 | Unique chat message identifier (Primary Key) | 19001 |
| CHAT_MESSAGE | session_id | BIGINT | Numeric | 20 | Session reference (Foreign Key) | 18001 |
| CHAT_MESSAGE | sender | VARCHAR | Enumeration | 20 | Message sender type | <mark>"user", "assistant"</mark> |
| CHAT_MESSAGE | content | TEXT | Text | 5000 | Message text content | "What are the requirements for FYP proposal?" |
| CHAT_MESSAGE | confidence_score | DECIMAL | Numeric (4,3) | 5 | AI confidence score (0.000-1.000) | 0.925 |
| CHAT_MESSAGE | sent_at | DATETIME | YYYY-MM-DD HH:MM:SS | - | Sent timestamp | "2025-01-26 09:05:00" |

---

### SYSTEM_PARAMETER

| Table | Field Name | Data Type | Data Format | Field Size | Description | Example |
|-------|------------|-----------|-------------|------------|-------------|---------|
| SYSTEM_PARAMETER | param_id | BIGINT | Numeric | 20 | Unique parameter identifier (Primary Key) | 20001 |
| SYSTEM_PARAMETER | param_key | VARCHAR | Text | 100 | Unique configuration key (Unique Key) | "max_supervision_quota", "proposal_deadline_reminder_days" |
| SYSTEM_PARAMETER | param_value | VARCHAR | Text | 500 | Configuration value | "10", "7" |
| <mark>SYSTEM_PARAMETER</mark> | <mark>param_type</mark> | <mark>VARCHAR</mark> | <mark>Enumeration</mark> | <mark>50</mark> | <mark>Value type used for validation/UI</mark> | <mark>"INTEGER", "STRING", "BOOLEAN", "JSON"</mark> |
| <mark>SYSTEM_PARAMETER</mark> | <mark>category</mark> | <mark>VARCHAR</mark> | <mark>Text</mark> | <mark>100</mark> | <mark>Logical grouping for the admin UI</mark> | <mark>"Supervision", "Proposal", "Notifications"</mark> |
| <mark>SYSTEM_PARAMETER</mark> | <mark>label</mark> | <mark>VARCHAR</mark> | <mark>Text</mark> | <mark>200</mark> | <mark>Human-readable label shown in admin UI</mark> | <mark>"Maximum supervision quota per supervisor"</mark> |
| <mark>SYSTEM_PARAMETER</mark> | <mark>description</mark> | <mark>TEXT</mark> | <mark>Text</mark> | <mark>2000</mark> | <mark>Long description / help text</mark> | <mark>"Hard cap on supervisees a single supervisor can take..."</mark> |
| <mark>SYSTEM_PARAMETER</mark> | <mark>default_value</mark> | <mark>VARCHAR</mark> | <mark>Text</mark> | <mark>500</mark> | <mark>Factory default value</mark> | <mark>"8"</mark> |
| <mark>SYSTEM_PARAMETER</mark> | <mark>is_editable</mark> | <mark>BOOLEAN</mark> | <mark>Boolean</mark> | <mark>1</mark> | <mark>Whether admin may edit this parameter</mark> | <mark>true</mark> |
| <mark>SYSTEM_PARAMETER</mark> | <mark>validation_rules</mark> | <mark>TEXT</mark> | <mark>JSON/Text</mark> | <mark>1000</mark> | <mark>Validation rules as JSON (min/max/regex/enum)</mark> | <mark>"{\"min\":1,\"max\":15}"</mark> |
| SYSTEM_PARAMETER | updated_by_user_id | BIGINT | Numeric | 20 | Admin who last updated (Foreign Key) | 3001 |
| SYSTEM_PARAMETER | updated_at | DATETIME | YYYY-MM-DD HH:MM:SS | - | Update timestamp | "2025-01-05 12:00:00" |

---

### INTEGRATION_SETTING

| Table | Field Name | Data Type | Data Format | Field Size | Description | Example |
|-------|------------|-----------|-------------|------------|-------------|---------|
| INTEGRATION_SETTING | integration_id | BIGINT | Numeric | 20 | Unique integration identifier (Primary Key) | 21001 |
| INTEGRATION_SETTING | name | VARCHAR | Text | 200 | Integration name | "AI Service", "Email Gateway", "SSO Provider" |
| <mark>INTEGRATION_SETTING</mark> | <mark>integration_type</mark> | <mark>VARCHAR</mark> | <mark>Enumeration</mark> | <mark>50</mark> | <mark>Type/category of integration</mark> | <mark>"AI", "EMAIL", "SSO", "STORAGE"</mark> |
| <mark>INTEGRATION_SETTING</mark> | <mark>provider</mark> | <mark>VARCHAR</mark> | <mark>Text</mark> | <mark>100</mark> | <mark>Vendor / provider name</mark> | <mark>"OpenAI", "SendGrid", "MMU SSO"</mark> |
| <mark>INTEGRATION_SETTING</mark> | <mark>description</mark> | <mark>TEXT</mark> | <mark>Text</mark> | <mark>1000</mark> | <mark>Short description of what this integration is for</mark> | <mark>"Proposal AI analysis service"</mark> |
| INTEGRATION_SETTING | endpoint_url | VARCHAR | URL format | 500 | Endpoint address | "https://api.openai.com/v1/chat/completions" |
| <mark>INTEGRATION_SETTING</mark> | <mark>settings_json</mark> | <mark>TEXT</mark> | <mark>JSON/Text</mark> | <mark>5000</mark> | <mark>Provider-specific settings (auth, headers, options) as JSON</mark> | <mark>"{\"auth\":\"bearer\",\"timeout_ms\":15000}"</mark> |
| INTEGRATION_SETTING | status | VARCHAR | Enumeration | 30 | Integration status | "ACTIVE", "INACTIVE", "ERROR" |
| <mark>INTEGRATION_SETTING</mark> | <mark>last_tested_at</mark> | <mark>DATETIME</mark> | <mark>YYYY-MM-DD HH:MM:SS</mark> | <mark>-</mark> | <mark>Timestamp when admin last ran a connection test</mark> | <mark>"2026-04-20 09:30:00"</mark> |
| <mark>INTEGRATION_SETTING</mark> | <mark>last_test_result</mark> | <mark>VARCHAR</mark> | <mark>Enumeration</mark> | <mark>50</mark> | <mark>Result of the last connection test</mark> | <mark>"SUCCESS", "FAILED"</mark> |
| INTEGRATION_SETTING | updated_by_user_id | BIGINT | Numeric | 20 | Admin who last updated (Foreign Key) | 3001 |
| INTEGRATION_SETTING | updated_at | DATETIME | YYYY-MM-DD HH:MM:SS | - | Update timestamp | "2025-01-10 08:00:00" |

---

### AUDIT_LOG

| Table | Field Name | Data Type | Data Format | Field Size | Description | Example |
|-------|------------|-----------|-------------|------------|-------------|---------|
| AUDIT_LOG | audit_id | BIGINT | Numeric | 20 | Unique audit record identifier (Primary Key) | 22001 |
| AUDIT_LOG | user_id | BIGINT | Numeric | 20 | User who performed action (Foreign Key, nullable for system actions) | 1001 |
| AUDIT_LOG | action | VARCHAR | Enumeration | 100 | Action type — SCREAMING_CASE business event codes | <mark>"LOGIN_SUCCESS", "LOGIN_FAILURE", "LOGIN_LOCKOUT_TRIGGERED", "USER_APPROVED", "CYCLE_ACTIVATED", "GRADE_FINALISED", …</mark> |
| AUDIT_LOG | entity_name | VARCHAR | Text | 50 | Entity/table affected | "PROJECT", "PROPOSAL", "MEETING" |
| AUDIT_LOG | entity_id | BIGINT | Numeric | 20 | Affected record ID | 3001 |
| <mark>AUDIT_LOG</mark> | <mark>old_value</mark> | <mark>TEXT</mark> | <mark>JSON/Text</mark> | <mark>5000</mark> | <mark>Snapshot of the affected record before the change</mark> | <mark>"{\"status\":\"DRAFT\"}"</mark> |
| <mark>AUDIT_LOG</mark> | <mark>new_value</mark> | <mark>TEXT</mark> | <mark>JSON/Text</mark> | <mark>5000</mark> | <mark>Snapshot of the affected record after the change</mark> | <mark>"{\"status\":\"SUBMITTED\"}"</mark> |
| <mark>AUDIT_LOG</mark> | <mark>ip_address</mark> | <mark>VARCHAR</mark> | <mark>IPv4/IPv6</mark> | <mark>45</mark> | <mark>IP address of the request that caused the action</mark> | <mark>"203.0.113.42"</mark> |
| <mark>AUDIT_LOG</mark> | <mark>user_agent</mark> | <mark>VARCHAR</mark> | <mark>Text</mark> | <mark>500</mark> | <mark>User agent string of the originating request</mark> | <mark>"Mozilla/5.0 (Windows NT 10.0; Win64) Chrome/124"</mark> |
| AUDIT_LOG | created_at | DATETIME | YYYY-MM-DD HH:MM:SS | - | Timestamp of action | "2025-01-27 14:30:00" |
| AUDIT_LOG | details | TEXT | JSON/Text | 5000 | Extra details (before/after values, metadata) | "{\"old_status\": \"DRAFT\", \"new_status\": \"SUBMITTED\"}" |

---

<mark>### USER_NOTIFICATION_PREFERENCES</mark>

| Table | Field Name | Data Type | Data Format | Field Size | Description | Example |
|-------|------------|-----------|-------------|------------|-------------|---------|
| <mark>USER_NOTIFICATION_PREFERENCES</mark> | <mark>user_id</mark> | <mark>BIGINT</mark> | <mark>Numeric</mark> | <mark>20</mark> | <mark>Owning user (Primary Key, Foreign Key → USER_ACCOUNT)</mark> | <mark>1001</mark> |
| <mark>USER_NOTIFICATION_PREFERENCES</mark> | <mark>preferences_json</mark> | <mark>TEXT</mark> | <mark>JSON/Text</mark> | <mark>5000</mark> | <mark>Per-channel and per-category preferences as JSON</mark> | <mark>"{\"email\":true,\"in_app\":true,\"categories\":{\"meeting\":true,\"deadline\":true}}"</mark> |
| <mark>USER_NOTIFICATION_PREFERENCES</mark> | <mark>updated_at</mark> | <mark>DATETIME</mark> | <mark>YYYY-MM-DD HH:MM:SS</mark> | <mark>-</mark> | <mark>Last update timestamp</mark> | <mark>"2026-04-15 13:00:00"</mark> |

---

<mark>### GENERATED_REPORT</mark>

| Table | Field Name | Data Type | Data Format | Field Size | Description | Example |
|-------|------------|-----------|-------------|------------|-------------|---------|
| <mark>GENERATED_REPORT</mark> | <mark>report_id</mark> | <mark>BIGINT</mark> | <mark>Numeric</mark> | <mark>20</mark> | <mark>Unique report identifier (Primary Key)</mark> | <mark>30001</mark> |
| <mark>GENERATED_REPORT</mark> | <mark>report_type</mark> | <mark>VARCHAR</mark> | <mark>Enumeration</mark> | <mark>50</mark> | <mark>Type of report</mark> | <mark>"PAIRING_STATUS", "APPROVED_PROJECTS", "LOG_COMPLIANCE"</mark> |
| <mark>GENERATED_REPORT</mark> | <mark>title</mark> | <mark>VARCHAR</mark> | <mark>Text</mark> | <mark>500</mark> | <mark>Display title of the report</mark> | <mark>"Pairing Status — Cycle T2630"</mark> |
| <mark>GENERATED_REPORT</mark> | <mark>generated_by_user_id</mark> | <mark>BIGINT</mark> | <mark>Numeric</mark> | <mark>20</mark> | <mark>User who generated the report (Foreign Key)</mark> | <mark>4001</mark> |
| <mark>GENERATED_REPORT</mark> | <mark>generated_at</mark> | <mark>DATETIME</mark> | <mark>YYYY-MM-DD HH:MM:SS</mark> | <mark>-</mark> | <mark>Generation timestamp</mark> | <mark>"2026-04-25 10:00:00"</mark> |
| <mark>GENERATED_REPORT</mark> | <mark>format</mark> | <mark>VARCHAR</mark> | <mark>Enumeration</mark> | <mark>20</mark> | <mark>Output file format</mark> | <mark>"CSV", "PDF"</mark> |
| <mark>GENERATED_REPORT</mark> | <mark>file_path</mark> | <mark>VARCHAR</mark> | <mark>File path</mark> | <mark>500</mark> | <mark>Storage path of the generated file</mark> | <mark>"/exports/pairing_t2630_2026-04-25.csv"</mark> |
| <mark>GENERATED_REPORT</mark> | <mark>filters_json</mark> | <mark>TEXT</mark> | <mark>JSON/Text</mark> | <mark>5000</mark> | <mark>Filters used to produce the report</mark> | <mark>"{\"cycle\":\"T2630\",\"programme\":\"BCS\"}"</mark> |
| <mark>GENERATED_REPORT</mark> | <mark>expires_at</mark> | <mark>DATETIME</mark> | <mark>YYYY-MM-DD HH:MM:SS</mark> | <mark>-</mark> | <mark>Expiry time after which the file may be purged (nullable)</mark> | <mark>"2026-07-25 10:00:00"</mark> |

---

<mark>### EXPORT_CONFIG</mark>

| Table | Field Name | Data Type | Data Format | Field Size | Description | Example |
|-------|------------|-----------|-------------|------------|-------------|---------|
| <mark>EXPORT_CONFIG</mark> | <mark>config_id</mark> | <mark>BIGINT</mark> | <mark>Numeric</mark> | <mark>20</mark> | <mark>Unique export configuration identifier (Primary Key)</mark> | <mark>40001</mark> |
| <mark>EXPORT_CONFIG</mark> | <mark>name</mark> | <mark>VARCHAR</mark> | <mark>Text</mark> | <mark>200</mark> | <mark>Preset name shown in admin UI</mark> | <mark>"Weekly Approved Projects"</mark> |
| <mark>EXPORT_CONFIG</mark> | <mark>data_type</mark> | <mark>VARCHAR</mark> | <mark>Enumeration</mark> | <mark>50</mark> | <mark>Source data set</mark> | <mark>"PROJECTS", "PROPOSALS", "MEETING_LOGS"</mark> |
| <mark>EXPORT_CONFIG</mark> | <mark>format</mark> | <mark>VARCHAR</mark> | <mark>Enumeration</mark> | <mark>20</mark> | <mark>Output format</mark> | <mark>"CSV", "PDF"</mark> |
| <mark>EXPORT_CONFIG</mark> | <mark>include_headers</mark> | <mark>BOOLEAN</mark> | <mark>Boolean</mark> | <mark>1</mark> | <mark>Whether to include header row</mark> | <mark>true</mark> |
| <mark>EXPORT_CONFIG</mark> | <mark>date_format</mark> | <mark>VARCHAR</mark> | <mark>Text</mark> | <mark>50</mark> | <mark>Date format pattern used in the export</mark> | <mark>"yyyy-MM-dd"</mark> |
| <mark>EXPORT_CONFIG</mark> | <mark>fields_json</mark> | <mark>TEXT</mark> | <mark>JSON/Text</mark> | <mark>5000</mark> | <mark>Selected fields (and order) as JSON</mark> | <mark>"[\"project_id\",\"title\",\"supervisor\"]"</mark> |
| <mark>EXPORT_CONFIG</mark> | <mark>filters_json</mark> | <mark>TEXT</mark> | <mark>JSON/Text</mark> | <mark>5000</mark> | <mark>Filter criteria as JSON</mark> | <mark>"{\"status\":\"APPROVED\",\"cycle\":\"T2630\"}"</mark> |
| <mark>EXPORT_CONFIG</mark> | <mark>schedule_json</mark> | <mark>TEXT</mark> | <mark>JSON/Text</mark> | <mark>1000</mark> | <mark>Optional schedule (cron-like) as JSON</mark> | <mark>"{\"cron\":\"0 8 * * MON\"}"</mark> |
| <mark>EXPORT_CONFIG</mark> | <mark>last_export_path</mark> | <mark>VARCHAR</mark> | <mark>File path</mark> | <mark>500</mark> | <mark>Path of the most recent export file produced</mark> | <mark>"/exports/projects_2026-04-22.csv"</mark> |
| <mark>EXPORT_CONFIG</mark> | <mark>last_export_at</mark> | <mark>DATETIME</mark> | <mark>YYYY-MM-DD HH:MM:SS</mark> | <mark>-</mark> | <mark>Timestamp of the most recent run</mark> | <mark>"2026-04-22 08:00:00"</mark> |
| <mark>EXPORT_CONFIG</mark> | <mark>created_at</mark> | <mark>DATETIME</mark> | <mark>YYYY-MM-DD HH:MM:SS</mark> | <mark>-</mark> | <mark>Creation timestamp</mark> | <mark>"2026-04-01 09:00:00"</mark> |
| <mark>EXPORT_CONFIG</mark> | <mark>updated_at</mark> | <mark>DATETIME</mark> | <mark>YYYY-MM-DD HH:MM:SS</mark> | <mark>-</mark> | <mark>Last update timestamp</mark> | <mark>"2026-04-22 08:00:05"</mark> |

---

<mark>### MAINTENANCE_JOB</mark>

| Table | Field Name | Data Type | Data Format | Field Size | Description | Example |
|-------|------------|-----------|-------------|------------|-------------|---------|
| <mark>MAINTENANCE_JOB</mark> | <mark>job_id</mark> | <mark>BIGINT</mark> | <mark>Numeric</mark> | <mark>20</mark> | <mark>Unique job identifier (Primary Key)</mark> | <mark>50001</mark> |
| <mark>MAINTENANCE_JOB</mark> | <mark>job_type</mark> | <mark>VARCHAR</mark> | <mark>Enumeration</mark> | <mark>50</mark> | <mark>Maintenance job type</mark> | <mark>"BACKUP", "HEALTH_CHECK", "CLEANUP", "INTEGRITY_CHECK"</mark> |
| <mark>MAINTENANCE_JOB</mark> | <mark>status</mark> | <mark>VARCHAR</mark> | <mark>Enumeration</mark> | <mark>30</mark> | <mark>Current job status</mark> | <mark>"PENDING", "RUNNING", "COMPLETED", "FAILED"</mark> |
| <mark>MAINTENANCE_JOB</mark> | <mark>started_at</mark> | <mark>DATETIME</mark> | <mark>YYYY-MM-DD HH:MM:SS</mark> | <mark>-</mark> | <mark>Time the job started running (nullable)</mark> | <mark>"2026-04-28 02:00:00"</mark> |
| <mark>MAINTENANCE_JOB</mark> | <mark>completed_at</mark> | <mark>DATETIME</mark> | <mark>YYYY-MM-DD HH:MM:SS</mark> | <mark>-</mark> | <mark>Time the job finished (nullable)</mark> | <mark>"2026-04-28 02:08:00"</mark> |
| <mark>MAINTENANCE_JOB</mark> | <mark>message</mark> | <mark>TEXT</mark> | <mark>Text</mark> | <mark>2000</mark> | <mark>Human-readable status / error message</mark> | <mark>"Backup completed (812 MB)"</mark> |
| <mark>MAINTENANCE_JOB</mark> | <mark>result_json</mark> | <mark>TEXT</mark> | <mark>JSON/Text</mark> | <mark>5000</mark> | <mark>Structured result data for the job</mark> | <mark>"{\"size_mb\":812,\"path\":\"/backups/2026-04-28.sql.gz\"}"</mark> |
| <mark>MAINTENANCE_JOB</mark> | <mark>triggered_by_user_id</mark> | <mark>BIGINT</mark> | <mark>Numeric</mark> | <mark>20</mark> | <mark>Admin who triggered the job (Foreign Key, nullable for system runs)</mark> | <mark>3001</mark> |
| <mark>MAINTENANCE_JOB</mark> | <mark>created_at</mark> | <mark>DATETIME</mark> | <mark>YYYY-MM-DD HH:MM:SS</mark> | <mark>-</mark> | <mark>Job record creation timestamp</mark> | <mark>"2026-04-28 02:00:00"</mark> |

---

<mark>### DEADLINE_REMINDER_LOG (V17 — FYP2 addition)</mark>

| Table | Field Name | Data Type | Data Format | Field Size | Description | Example |
|-------|------------|-----------|-------------|------------|-------------|---------|
| <mark>DEADLINE_REMINDER_LOG</mark> | <mark>deadline_id</mark> | <mark>BIGINT</mark> | <mark>Numeric</mark> | <mark>20</mark> | <mark>Deadline reference (Composite Primary Key, Foreign Key → DEADLINE)</mark> | <mark>14001</mark> |
| <mark>DEADLINE_REMINDER_LOG</mark> | <mark>days_before</mark> | <mark>INT</mark> | <mark>Numeric</mark> | <mark>3</mark> | <mark>Reminder offset in days that has fired (Composite Primary Key)</mark> | <mark>7</mark> |
| <mark>DEADLINE_REMINDER_LOG</mark> | <mark>fired_at</mark> | <mark>DATETIME</mark> | <mark>YYYY-MM-DD HH:MM:SS</mark> | <mark>-</mark> | <mark>Timestamp the reminder was dispatched</mark> | <mark>"2026-04-21 09:00:00"</mark> |

---

<mark>### PASSWORD_RESET_TOKEN (V19, V21 — FYP2 addition)</mark>

| Table | Field Name | Data Type | Data Format | Field Size | Description | Example |
|-------|------------|-----------|-------------|------------|-------------|---------|
| <mark>PASSWORD_RESET_TOKEN</mark> | <mark>id</mark> | <mark>BIGINT</mark> | <mark>Numeric</mark> | <mark>20</mark> | <mark>Unique token row identifier (Primary Key)</mark> | <mark>60001</mark> |
| <mark>PASSWORD_RESET_TOKEN</mark> | <mark>user_id</mark> | <mark>BIGINT</mark> | <mark>Numeric</mark> | <mark>20</mark> | <mark>Token owner (Foreign Key, ON DELETE CASCADE)</mark> | <mark>1001</mark> |
| <mark>PASSWORD_RESET_TOKEN</mark> | <mark>token_hash</mark> | <mark>VARCHAR</mark> | <mark>Hex string</mark> | <mark>64</mark> | <mark>SHA-256 hex hash of the raw token (Unique Key). The raw token itself is sent only via email; only the hash is stored.</mark> | <mark>"6b3a..."</mark> |
| <mark>PASSWORD_RESET_TOKEN</mark> | <mark>expires_at</mark> | <mark>DATETIME</mark> | <mark>YYYY-MM-DD HH:MM:SS</mark> | <mark>-</mark> | <mark>Token expiry timestamp</mark> | <mark>"2026-04-22 11:00:00"</mark> |
| <mark>PASSWORD_RESET_TOKEN</mark> | <mark>used_at</mark> | <mark>DATETIME</mark> | <mark>YYYY-MM-DD HH:MM:SS</mark> | <mark>-</mark> | <mark>Timestamp the token was consumed (nullable)</mark> | <mark>"2026-04-22 10:35:00"</mark> |
| <mark>PASSWORD_RESET_TOKEN</mark> | <mark>created_at</mark> | <mark>DATETIME</mark> | <mark>YYYY-MM-DD HH:MM:SS</mark> | <mark>-</mark> | <mark>Token issuance timestamp</mark> | <mark>"2026-04-22 10:00:00"</mark> |

---

<mark>### PUSH_SUBSCRIPTION (V20 — FYP2 addition)</mark>

| Table | Field Name | Data Type | Data Format | Field Size | Description | Example |
|-------|------------|-----------|-------------|------------|-------------|---------|
| <mark>PUSH_SUBSCRIPTION</mark> | <mark>id</mark> | <mark>BIGINT</mark> | <mark>Numeric</mark> | <mark>20</mark> | <mark>Unique subscription identifier (Primary Key)</mark> | <mark>70001</mark> |
| <mark>PUSH_SUBSCRIPTION</mark> | <mark>user_id</mark> | <mark>BIGINT</mark> | <mark>Numeric</mark> | <mark>20</mark> | <mark>Subscribing user (Foreign Key, ON DELETE CASCADE)</mark> | <mark>1001</mark> |
| <mark>PUSH_SUBSCRIPTION</mark> | <mark>endpoint</mark> | <mark>VARCHAR</mark> | <mark>URL</mark> | <mark>500</mark> | <mark>Push gateway endpoint URL (Unique Key — uniquely identifies a browser/device subscription)</mark> | <mark>"https://fcm.googleapis.com/fcm/send/..."</mark> |
| <mark>PUSH_SUBSCRIPTION</mark> | <mark>p256dh</mark> | <mark>VARCHAR</mark> | <mark>Base64 string</mark> | <mark>255</mark> | <mark>Subscriber public key (P-256 ECDH)</mark> | <mark>"BL...="</mark> |
| <mark>PUSH_SUBSCRIPTION</mark> | <mark>auth_key</mark> | <mark>VARCHAR</mark> | <mark>Base64 string</mark> | <mark>255</mark> | <mark>Authentication secret used by the push protocol</mark> | <mark>"k8...="</mark> |
| <mark>PUSH_SUBSCRIPTION</mark> | <mark>user_agent</mark> | <mark>VARCHAR</mark> | <mark>Text</mark> | <mark>255</mark> | <mark>User agent string at subscription time (nullable)</mark> | <mark>"Mozilla/5.0 ..."</mark> |
| <mark>PUSH_SUBSCRIPTION</mark> | <mark>created_at</mark> | <mark>DATETIME</mark> | <mark>YYYY-MM-DD HH:MM:SS</mark> | <mark>-</mark> | <mark>Subscription creation timestamp</mark> | <mark>"2026-04-15 10:00:00"</mark> |
| <mark>PUSH_SUBSCRIPTION</mark> | <mark>last_used_at</mark> | <mark>DATETIME</mark> | <mark>YYYY-MM-DD HH:MM:SS</mark> | <mark>-</mark> | <mark>Last successful push delivery (nullable)</mark> | <mark>"2026-04-22 09:30:00"</mark> |

---

<mark>### APPROVED_STUDENT_ROSTER (V22, V23 — FYP2 addition)</mark>

| Table | Field Name | Data Type | Data Format | Field Size | Description | Example |
|-------|------------|-----------|-------------|------------|-------------|---------|
| <mark>APPROVED_STUDENT_ROSTER</mark> | <mark>roster_id</mark> | <mark>BIGINT</mark> | <mark>Numeric</mark> | <mark>20</mark> | <mark>Unique roster row identifier (Primary Key)</mark> | <mark>80001</mark> |
| <mark>APPROVED_STUDENT_ROSTER</mark> | <mark>mmu_id</mark> | <mark>VARCHAR</mark> | <mark>Alphanumeric</mark> | <mark>20</mark> | <mark>MMU ID of the pre-approved student (Unique Key)</mark> | <mark>"1211234567"</mark> |
| <mark>APPROVED_STUDENT_ROSTER</mark> | <mark>email</mark> | <mark>VARCHAR</mark> | <mark>Email format</mark> | <mark>255</mark> | <mark>Student email (Unique Key). Self-registration auto-activates only when both `mmu_id` and `email` match.</mark> | <mark>"alice@student.mmu.edu.my"</mark> |
| <mark>APPROVED_STUDENT_ROSTER</mark> | <mark>full_name</mark> | <mark>VARCHAR</mark> | <mark>Text</mark> | <mark>200</mark> | <mark>Pre-filled name (optional)</mark> | <mark>"Alice Tan"</mark> |
| <mark>APPROVED_STUDENT_ROSTER</mark> | <mark>programme</mark> | <mark>VARCHAR</mark> | <mark>Text</mark> | <mark>200</mark> | <mark>Pre-filled programme</mark> | <mark>"Bachelor of Computer Science (Hons.)"</mark> |
| <mark>APPROVED_STUDENT_ROSTER</mark> | <mark>specialisation</mark> | <mark>VARCHAR</mark> | <mark>Text</mark> | <mark>200</mark> | <mark>Pre-filled specialisation (added in V23)</mark> | <mark>"Software Engineering"</mark> |
| <mark>APPROVED_STUDENT_ROSTER</mark> | <mark>faculty</mark> | <mark>VARCHAR</mark> | <mark>Text</mark> | <mark>200</mark> | <mark>Pre-filled faculty</mark> | <mark>"FCI"</mark> |
| <mark>APPROVED_STUDENT_ROSTER</mark> | <mark>intake_year</mark> | <mark>INT</mark> | <mark>Numeric (4)</mark> | <mark>4</mark> | <mark>Pre-filled intake year</mark> | <mark>2024</mark> |
| <mark>APPROVED_STUDENT_ROSTER</mark> | <mark>uploaded_by</mark> | <mark>BIGINT</mark> | <mark>Numeric</mark> | <mark>20</mark> | <mark>Admin who uploaded the roster row (Foreign Key, ON DELETE SET NULL)</mark> | <mark>3001</mark> |
| <mark>APPROVED_STUDENT_ROSTER</mark> | <mark>uploaded_at</mark> | <mark>DATETIME</mark> | <mark>YYYY-MM-DD HH:MM:SS</mark> | <mark>-</mark> | <mark>Upload timestamp</mark> | <mark>"2026-03-01 09:00:00"</mark> |
| <mark>APPROVED_STUDENT_ROSTER</mark> | <mark>updated_at</mark> | <mark>DATETIME</mark> | <mark>YYYY-MM-DD HH:MM:SS</mark> | <mark>-</mark> | <mark>Last update timestamp</mark> | <mark>"2026-03-01 09:00:05"</mark> |

---

<mark>### APPROVED_SUPERVISOR_ROSTER (V22 — FYP2 addition)</mark>

| Table | Field Name | Data Type | Data Format | Field Size | Description | Example |
|-------|------------|-----------|-------------|------------|-------------|---------|
| <mark>APPROVED_SUPERVISOR_ROSTER</mark> | <mark>roster_id</mark> | <mark>BIGINT</mark> | <mark>Numeric</mark> | <mark>20</mark> | <mark>Unique roster row identifier (Primary Key)</mark> | <mark>80101</mark> |
| <mark>APPROVED_SUPERVISOR_ROSTER</mark> | <mark>mmu_id</mark> | <mark>VARCHAR</mark> | <mark>Alphanumeric</mark> | <mark>20</mark> | <mark>MMU ID of the pre-approved supervisor (Unique Key)</mark> | <mark>"2001234567"</mark> |
| <mark>APPROVED_SUPERVISOR_ROSTER</mark> | <mark>email</mark> | <mark>VARCHAR</mark> | <mark>Email format</mark> | <mark>255</mark> | <mark>Supervisor email (Unique Key)</mark> | <mark>"j.doe@mmu.edu.my"</mark> |
| <mark>APPROVED_SUPERVISOR_ROSTER</mark> | <mark>full_name</mark> | <mark>VARCHAR</mark> | <mark>Text</mark> | <mark>200</mark> | <mark>Pre-filled name</mark> | <mark>"Dr. Jane Doe"</mark> |
| <mark>APPROVED_SUPERVISOR_ROSTER</mark> | <mark>department</mark> | <mark>VARCHAR</mark> | <mark>Text</mark> | <mark>200</mark> | <mark>Pre-filled department</mark> | <mark>"Software Engineering"</mark> |
| <mark>APPROVED_SUPERVISOR_ROSTER</mark> | <mark>faculty</mark> | <mark>VARCHAR</mark> | <mark>Text</mark> | <mark>200</mark> | <mark>Pre-filled faculty</mark> | <mark>"FCI"</mark> |
| <mark>APPROVED_SUPERVISOR_ROSTER</mark> | <mark>position</mark> | <mark>VARCHAR</mark> | <mark>Text</mark> | <mark>100</mark> | <mark>Pre-filled academic position</mark> | <mark>"Senior Lecturer"</mark> |
| <mark>APPROVED_SUPERVISOR_ROSTER</mark> | <mark>uploaded_by</mark> | <mark>BIGINT</mark> | <mark>Numeric</mark> | <mark>20</mark> | <mark>Admin who uploaded the roster row (Foreign Key, ON DELETE SET NULL)</mark> | <mark>3001</mark> |
| <mark>APPROVED_SUPERVISOR_ROSTER</mark> | <mark>uploaded_at</mark> | <mark>DATETIME</mark> | <mark>YYYY-MM-DD HH:MM:SS</mark> | <mark>-</mark> | <mark>Upload timestamp</mark> | <mark>"2026-03-01 09:00:00"</mark> |
| <mark>APPROVED_SUPERVISOR_ROSTER</mark> | <mark>updated_at</mark> | <mark>DATETIME</mark> | <mark>YYYY-MM-DD HH:MM:SS</mark> | <mark>-</mark> | <mark>Last update timestamp</mark> | <mark>"2026-03-01 09:00:05"</mark> |

---

<mark>### ANNOUNCEMENT_ATTACHMENT (V26 — FYP2 addition)</mark>

| Table | Field Name | Data Type | Data Format | Field Size | Description | Example |
|-------|------------|-----------|-------------|------------|-------------|---------|
| <mark>ANNOUNCEMENT_ATTACHMENT</mark> | <mark>attachment_id</mark> | <mark>BIGINT</mark> | <mark>Numeric</mark> | <mark>20</mark> | <mark>Unique attachment identifier (Primary Key)</mark> | <mark>90001</mark> |
| <mark>ANNOUNCEMENT_ATTACHMENT</mark> | <mark>announcement_id</mark> | <mark>BIGINT</mark> | <mark>Numeric</mark> | <mark>20</mark> | <mark>Parent announcement (Foreign Key, ON DELETE CASCADE)</mark> | <mark>15001</mark> |
| <mark>ANNOUNCEMENT_ATTACHMENT</mark> | <mark>file_name</mark> | <mark>VARCHAR</mark> | <mark>Text</mark> | <mark>255</mark> | <mark>Original file name</mark> | <mark>"FYP_Briefing_Slides.pdf"</mark> |
| <mark>ANNOUNCEMENT_ATTACHMENT</mark> | <mark>file_path</mark> | <mark>VARCHAR</mark> | <mark>File path</mark> | <mark>500</mark> | <mark>Stored file path</mark> | <mark>"uploads/announcement/15001/abcd-briefing.pdf"</mark> |
| <mark>ANNOUNCEMENT_ATTACHMENT</mark> | <mark>file_size</mark> | <mark>BIGINT</mark> | <mark>Numeric</mark> | <mark>20</mark> | <mark>File size in bytes</mark> | <mark>1048576</mark> |
| <mark>ANNOUNCEMENT_ATTACHMENT</mark> | <mark>mime_type</mark> | <mark>VARCHAR</mark> | <mark>MIME</mark> | <mark>100</mark> | <mark>MIME type of the file</mark> | <mark>"application/pdf"</mark> |
| <mark>ANNOUNCEMENT_ATTACHMENT</mark> | <mark>uploaded_at</mark> | <mark>DATETIME</mark> | <mark>YYYY-MM-DD HH:MM:SS</mark> | <mark>-</mark> | <mark>Upload timestamp</mark> | <mark>"2026-04-01 10:00:00"</mark> |

---

<mark>### ANNOUNCEMENT_LINK (V26 — FYP2 addition)</mark>

| Table | Field Name | Data Type | Data Format | Field Size | Description | Example |
|-------|------------|-----------|-------------|------------|-------------|---------|
| <mark>ANNOUNCEMENT_LINK</mark> | <mark>link_id</mark> | <mark>BIGINT</mark> | <mark>Numeric</mark> | <mark>20</mark> | <mark>Unique link identifier (Primary Key)</mark> | <mark>91001</mark> |
| <mark>ANNOUNCEMENT_LINK</mark> | <mark>announcement_id</mark> | <mark>BIGINT</mark> | <mark>Numeric</mark> | <mark>20</mark> | <mark>Parent announcement (Foreign Key, ON DELETE CASCADE)</mark> | <mark>15001</mark> |
| <mark>ANNOUNCEMENT_LINK</mark> | <mark>label</mark> | <mark>VARCHAR</mark> | <mark>Text</mark> | <mark>200</mark> | <mark>Display label for the link</mark> | <mark>"Briefing Recording"</mark> |
| <mark>ANNOUNCEMENT_LINK</mark> | <mark>url</mark> | <mark>VARCHAR</mark> | <mark>URL</mark> | <mark>500</mark> | <mark>External URL</mark> | <mark>"https://teams.microsoft.com/recording/..."</mark> |

---

<mark>### FYP_GRADE (V30 — FYP2 addition)</mark>

| Table | Field Name | Data Type | Data Format | Field Size | Description | Example |
|-------|------------|-----------|-------------|------------|-------------|---------|
| <mark>FYP_GRADE</mark> | <mark>grade_id</mark> | <mark>BIGINT</mark> | <mark>Numeric</mark> | <mark>20</mark> | <mark>Unique grade identifier (Primary Key)</mark> | <mark>100001</mark> |
| <mark>FYP_GRADE</mark> | <mark>project_id</mark> | <mark>BIGINT</mark> | <mark>Numeric</mark> | <mark>20</mark> | <mark>Graded project (Foreign Key)</mark> | <mark>3001</mark> |
| <mark>FYP_GRADE</mark> | <mark>phase</mark> | <mark>VARCHAR</mark> | <mark>Enumeration</mark> | <mark>10</mark> | <mark>FYP phase the grade applies to</mark> | <mark>"FYP1", "FYP2"</mark> |
| <mark>FYP_GRADE</mark> | <mark>grader_user_id</mark> | <mark>BIGINT</mark> | <mark>Numeric</mark> | <mark>20</mark> | <mark>Grader user (Foreign Key)</mark> | <mark>2001</mark> |
| <mark>FYP_GRADE</mark> | <mark>grader_role</mark> | <mark>VARCHAR</mark> | <mark>Enumeration</mark> | <mark>20</mark> | <mark>Role that the grader played</mark> | <mark>"SUPERVISOR", "EXAMINER"</mark> |
| <mark>FYP_GRADE</mark> | <mark>rubric_json</mark> | <mark>TEXT</mark> | <mark>JSON/Text</mark> | <mark>5000</mark> | <mark>Rubric criteria → marks as JSON. Schema-flexible so the committee can change the rubric without DB migrations.</mark> | <mark>"{\"problem_statement\":18,\"methodology\":15}"</mark> |
| <mark>FYP_GRADE</mark> | <mark>total_score</mark> | <mark>DECIMAL</mark> | <mark>Numeric (5,2)</mark> | <mark>6</mark> | <mark>Sum of numeric criterion marks (derived)</mark> | <mark>78.50</mark> |
| <mark>FYP_GRADE</mark> | <mark>letter_grade</mark> | <mark>VARCHAR</mark> | <mark>Enumeration</mark> | <mark>5</mark> | <mark>MMU FCI letter grade derived from total_score</mark> | <mark>"A-", "B+", "C", "F"</mark> |
| <mark>FYP_GRADE</mark> | <mark>remarks</mark> | <mark>TEXT</mark> | <mark>Text</mark> | <mark>3000</mark> | <mark>Grader remarks visible to the student once finalised</mark> | <mark>"Strong methodology; expand evaluation."</mark> |
| <mark>FYP_GRADE</mark> | <mark>status</mark> | <mark>VARCHAR</mark> | <mark>Enumeration</mark> | <mark>20</mark> | <mark>Grade lifecycle status</mark> | <mark>"DRAFT", "SUBMITTED", "FINALISED"</mark> |
| <mark>FYP_GRADE</mark> | <mark>finalised_by_user_id</mark> | <mark>BIGINT</mark> | <mark>Numeric</mark> | <mark>20</mark> | <mark>Admin who locked the grade (Foreign Key, nullable)</mark> | <mark>3001</mark> |
| <mark>FYP_GRADE</mark> | <mark>finalised_at</mark> | <mark>DATETIME</mark> | <mark>YYYY-MM-DD HH:MM:SS</mark> | <mark>-</mark> | <mark>Time the grade was finalised (nullable)</mark> | <mark>"2026-06-15 16:00:00"</mark> |
| <mark>FYP_GRADE</mark> | <mark>created_at</mark> | <mark>DATETIME</mark> | <mark>YYYY-MM-DD HH:MM:SS</mark> | <mark>-</mark> | <mark>Created timestamp</mark> | <mark>"2026-06-10 10:00:00"</mark> |
| <mark>FYP_GRADE</mark> | <mark>updated_at</mark> | <mark>DATETIME</mark> | <mark>YYYY-MM-DD HH:MM:SS</mark> | <mark>-</mark> | <mark>Last update timestamp</mark> | <mark>"2026-06-15 16:00:00"</mark> |

> <mark>**Composite uniqueness:** `UNIQUE (project_id, phase, grader_user_id)` so one grader has at most one row per `(project, phase)`. Multiple graders (e.g. supervisor + examiner) get separate rows.</mark>

---

## Summary of Database Tables

| No. | Table Name | Description | Total Fields |
|-----|------------|-------------|--------------|
| 1 | USER_ACCOUNT | Stores all user accounts (students, supervisors, admins) | 10 |
| 2 | STUDENT_PROFILE | Extended profile information for students | 7 |
| 3 | SUPERVISOR_PROFILE | Extended profile information for supervisors | <mark>16</mark> |
| 4 | FYP_CYCLE | FYP academic cycles/terms | 5 |
| 5 | SUPERVISOR_REQUEST | Student requests to supervisors | 8 |
| 6 | PROJECT | FYP projects | <mark>12</mark> |
| 7 | PROPOSAL | Project proposals | <mark>9</mark> |
| 8 | PROPOSAL_VERSION | Versioned proposal content | <mark>7</mark> |
| 9 | PROPOSAL_CHECK_RESULT | AI-generated proposal check results | <mark>17</mark> |
| 10 | PROPOSAL_REVIEW | Proposal review records | <mark>8</mark> |
| 11 | MEETING | Meeting scheduling information | 11 |
| 12 | MEETING_LOG | Meeting log records | 10 |
| 13 | MEETING_LOG_SIGNATURE | Digital signatures for meeting logs | 5 |
| 14 | PROJECT_DOCUMENT | Project-related document uploads | 9 |
| 15 | RESOURCE_DOCUMENT | System resource documents | 8 |
| 16 | DEADLINE | FYP deadlines | 6 |
| 17 | ANNOUNCEMENT | System announcements | 7 |
| 18 | ANNOUNCEMENT_AUDIENCE | Custom announcement targeting | 3 |
| 19 | NOTIFICATION | User notifications | 7 |
| 20 | CHAT_SESSION | AI chatbot sessions | 4 |
| 21 | CHAT_MESSAGE | AI chatbot messages | 6 |
| 22 | SYSTEM_PARAMETER | System configuration parameters | <mark>12</mark> |
| 23 | INTEGRATION_SETTING | External integration settings | <mark>12</mark> |
| 24 | AUDIT_LOG | System audit trail | <mark>11</mark> |
| <mark>25</mark> | <mark>USER_NOTIFICATION_PREFERENCES</mark> | <mark>Per-user notification channel and category preferences (UC14)</mark> | <mark>3</mark> |
| <mark>26</mark> | <mark>GENERATED_REPORT</mark> | <mark>Persisted metadata of generated committee reports (UC29)</mark> | <mark>9</mark> |
| <mark>27</mark> | <mark>EXPORT_CONFIG</mark> | <mark>Reusable export presets used by reporting / data exchange (UC32)</mark> | <mark>13</mark> |
| <mark>28</mark> | <mark>MAINTENANCE_JOB</mark> | <mark>Tracks maintenance / cleanup jobs and outcomes (UC33)</mark> | <mark>9</mark> |
| <mark>29</mark> | <mark>DEADLINE_REMINDER_LOG</mark> | <mark>Idempotency record for the deadline-reminder dispatcher (UC14)</mark> | <mark>3</mark> |
| <mark>30</mark> | <mark>PASSWORD_RESET_TOKEN</mark> | <mark>Single-use SHA-256-hashed password-reset tokens (UC1)</mark> | <mark>6</mark> |
| <mark>31</mark> | <mark>PUSH_SUBSCRIPTION</mark> | <mark>Per-browser Web Push endpoints (UC14)</mark> | <mark>8</mark> |
| <mark>32</mark> | <mark>APPROVED_STUDENT_ROSTER</mark> | <mark>Pre-authorisation list — matching student self-registrations auto-activate (UC1, UC30)</mark> | <mark>11</mark> |
| <mark>33</mark> | <mark>APPROVED_SUPERVISOR_ROSTER</mark> | <mark>Pre-authorisation list — matching supervisor self-registrations auto-activate (UC1, UC30)</mark> | <mark>10</mark> |
| <mark>34</mark> | <mark>ANNOUNCEMENT_ATTACHMENT</mark> | <mark>File attachments on announcements (UC24)</mark> | <mark>7</mark> |
| <mark>35</mark> | <mark>ANNOUNCEMENT_LINK</mark> | <mark>External links on announcements (UC24)</mark> | <mark>4</mark> |
| <mark>36</mark> | <mark>FYP_GRADE</mark> | <mark>Final-report grading rubric and lifecycle (UC35)</mark> | <mark>14</mark> |

**Total Tables: <mark>36</mark>** <mark>(8 new tables added during FYP2 implementation, V17 / V19 / V20 / V22 / V23 / V26 / V30; the previous total of 24 from FYP1 plus 4 added with V11–V14 plus these 8 = 36)</mark>
**Total Fields: <mark>232</mark>** <mark>(8 new tables contribute 63 new fields; the V31 drop of `proposal_check_result.plagiarism_score` removes one)</mark>
