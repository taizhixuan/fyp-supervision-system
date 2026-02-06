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
| USER_ACCOUNT | role | VARCHAR | Enumeration | 20 | User role in the system | "STUDENT", "SUPERVISOR", "FYP_ADMIN", "SYS_ADMIN" |
| USER_ACCOUNT | status | VARCHAR | Enumeration | 15 | Account status | "ACTIVE", "INACTIVE", "SUSPENDED" |
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
| SUPERVISOR_PROFILE | research_areas | TEXT | Text | 1000 | Research areas and expertise keywords | "Artificial Intelligence, Computer Vision, NLP" |
| SUPERVISOR_PROFILE | supervision_quota | INT | Numeric | 3 | Maximum number of supervisees allowed | 8 |
| SUPERVISOR_PROFILE | current_load | INT | Numeric | 3 | Current number of assigned supervisees | 5 |
| SUPERVISOR_PROFILE | availability_status | VARCHAR | Enumeration | 20 | Supervisor availability for new students | "Available", "Not Available", "Limited" |
| SUPERVISOR_PROFILE | preferred_project_types | TEXT | Text | 500 | Preferred project categories/types | "Research-based, Application Development" |
| SUPERVISOR_PROFILE | updated_at | DATETIME | YYYY-MM-DD HH:MM:SS | - | Profile last update timestamp | "2025-01-08 11:20:00" |

---

### FYP_CYCLE

| Table | Field Name | Data Type | Data Format | Field Size | Description | Example |
|-------|------------|-----------|-------------|------------|-------------|---------|
| FYP_CYCLE | cycle_id | BIGINT | Numeric | 20 | Unique cycle identifier (Primary Key) | 1 |
| FYP_CYCLE | cycle_code | VARCHAR | Alphanumeric | 10 | Cycle label/code | "T2530", "T2630" |
| FYP_CYCLE | start_date | DATE | YYYY-MM-DD | - | Cycle start date | "2025-01-15" |
| FYP_CYCLE | end_date | DATE | YYYY-MM-DD | - | Cycle end date | "2025-12-31" |
| FYP_CYCLE | status | VARCHAR | Enumeration | 15 | Cycle status | "ACTIVE", "CLOSED", "UPCOMING" |

---

### SUPERVISOR_REQUEST

| Table | Field Name | Data Type | Data Format | Field Size | Description | Example |
|-------|------------|-----------|-------------|------------|-------------|---------|
| SUPERVISOR_REQUEST | request_id | BIGINT | Numeric | 20 | Unique request identifier (Primary Key) | 5001 |
| SUPERVISOR_REQUEST | student_user_id | BIGINT | Numeric | 20 | Student who submitted the request (Foreign Key) | 1001 |
| SUPERVISOR_REQUEST | supervisor_user_id | BIGINT | Numeric | 20 | Supervisor receiving the request (Foreign Key) | 2001 |
| SUPERVISOR_REQUEST | topic_summary | TEXT | Text | 500 | Short topic/proposal summary | "AI-based Student Performance Prediction System" |
| SUPERVISOR_REQUEST | message | TEXT | Text | 2000 | Request message from student | "I am interested in your research area..." |
| SUPERVISOR_REQUEST | status | VARCHAR | Enumeration | 15 | Request status | "PENDING", "ACCEPTED", "REJECTED" |
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
| PROJECT | specialisation | VARCHAR | Text | 100 | Specialisation/category alignment | "Software Engineering" |
| PROJECT | category | VARCHAR | Text | 50 | Project category/type | "Application Development", "Research" |
| PROJECT | stage | VARCHAR | Enumeration | 10 | Current FYP stage | "FYP1", "FYP2" |
| PROJECT | status | VARCHAR | Enumeration | 15 | Project status | "DRAFT", "REGISTERED", "ACTIVE", "COMPLETED" |
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
| PROPOSAL | status | VARCHAR | Enumeration | 20 | Proposal status | "DRAFT", "SUBMITTED", "UNDER_REVIEW", "REVISION_REQUIRED", "APPROVED", "REJECTED" |
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
| PROPOSAL_VERSION | created_at | DATETIME | YYYY-MM-DD HH:MM:SS | - | Version creation timestamp | "2025-01-22 11:15:00" |

---

### PROPOSAL_CHECK_RESULT

| Table | Field Name | Data Type | Data Format | Field Size | Description | Example |
|-------|------------|-----------|-------------|------------|-------------|---------|
| PROPOSAL_CHECK_RESULT | check_id | BIGINT | Numeric | 20 | Unique check result identifier (Primary Key) | 7001 |
| PROPOSAL_CHECK_RESULT | version_id | BIGINT | Numeric | 20 | Checked proposal version (Foreign Key) | 6001 |
| PROPOSAL_CHECK_RESULT | overall_score | INT | Numeric | 3 | Overall completeness/quality score (0-100) | 85 |
| PROPOSAL_CHECK_RESULT | issues_summary | TEXT | Text | 2000 | Summary of issues detected by AI | "Missing methodology section details" |
| PROPOSAL_CHECK_RESULT | missing_sections | TEXT | Text | 1000 | List of missing sections | "Literature Review, Timeline" |
| PROPOSAL_CHECK_RESULT | suggested_improvements | TEXT | Text | 3000 | AI-generated improvement suggestions | "Consider adding more specific objectives..." |
| PROPOSAL_CHECK_RESULT | checked_at | DATETIME | YYYY-MM-DD HH:MM:SS | - | Timestamp of check | "2025-01-22 11:20:00" |

---

### PROPOSAL_REVIEW

| Table | Field Name | Data Type | Data Format | Field Size | Description | Example |
|-------|------------|-----------|-------------|------------|-------------|---------|
| PROPOSAL_REVIEW | review_id | BIGINT | Numeric | 20 | Unique review record identifier (Primary Key) | 8001 |
| PROPOSAL_REVIEW | proposal_id | BIGINT | Numeric | 20 | Proposal being reviewed (Foreign Key) | 4001 |
| PROPOSAL_REVIEW | reviewer_user_id | BIGINT | Numeric | 20 | Reviewer user ID (Foreign Key) | 2001 |
| PROPOSAL_REVIEW | reviewer_role | VARCHAR | Enumeration | 15 | Role of reviewer | "SUPERVISOR", "FYP_ADMIN" |
| PROPOSAL_REVIEW | decision | VARCHAR | Enumeration | 20 | Review decision | "APPROVE", "REJECT", "REQUEST_REVISION" |
| PROPOSAL_REVIEW | remarks | TEXT | Text | 3000 | Review comments and feedback | "Good proposal, minor revisions needed..." |
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
| MEETING_LOG | status | VARCHAR | Enumeration | 15 | Log status | "DRAFT", "SUBMITTED", "LOCKED" |
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
| CHAT_MESSAGE | sender | VARCHAR | Enumeration | 10 | Message sender type | "USER", "BOT", "SYSTEM" |
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
| SYSTEM_PARAMETER | updated_by_user_id | BIGINT | Numeric | 20 | Admin who last updated (Foreign Key) | 3001 |
| SYSTEM_PARAMETER | updated_at | DATETIME | YYYY-MM-DD HH:MM:SS | - | Update timestamp | "2025-01-05 12:00:00" |

---

### INTEGRATION_SETTING

| Table | Field Name | Data Type | Data Format | Field Size | Description | Example |
|-------|------------|-----------|-------------|------------|-------------|---------|
| INTEGRATION_SETTING | integration_id | BIGINT | Numeric | 20 | Unique integration identifier (Primary Key) | 21001 |
| INTEGRATION_SETTING | name | VARCHAR | Text | 100 | Integration name | "AI Service", "Email Gateway", "SSO Provider" |
| INTEGRATION_SETTING | endpoint_url | VARCHAR | URL format | 500 | Endpoint address | "https://api.openai.com/v1/chat/completions" |
| INTEGRATION_SETTING | status | VARCHAR | Enumeration | 15 | Integration status | "ENABLED", "DISABLED" |
| INTEGRATION_SETTING | updated_by_user_id | BIGINT | Numeric | 20 | Admin who last updated (Foreign Key) | 3001 |
| INTEGRATION_SETTING | updated_at | DATETIME | YYYY-MM-DD HH:MM:SS | - | Update timestamp | "2025-01-10 08:00:00" |

---

### AUDIT_LOG

| Table | Field Name | Data Type | Data Format | Field Size | Description | Example |
|-------|------------|-----------|-------------|------------|-------------|---------|
| AUDIT_LOG | audit_id | BIGINT | Numeric | 20 | Unique audit record identifier (Primary Key) | 22001 |
| AUDIT_LOG | user_id | BIGINT | Numeric | 20 | User who performed action (Foreign Key, nullable for system actions) | 1001 |
| AUDIT_LOG | action | VARCHAR | Enumeration | 20 | Action type | "CREATE", "UPDATE", "DELETE", "LOGIN", "LOGOUT" |
| AUDIT_LOG | entity_name | VARCHAR | Text | 50 | Entity/table affected | "PROJECT", "PROPOSAL", "MEETING" |
| AUDIT_LOG | entity_id | BIGINT | Numeric | 20 | Affected record ID | 3001 |
| AUDIT_LOG | created_at | DATETIME | YYYY-MM-DD HH:MM:SS | - | Timestamp of action | "2025-01-27 14:30:00" |
| AUDIT_LOG | details | TEXT | JSON/Text | 5000 | Extra details (before/after values, metadata) | "{\"old_status\": \"DRAFT\", \"new_status\": \"SUBMITTED\"}" |

---

## Summary of Database Tables

| No. | Table Name | Description | Total Fields |
|-----|------------|-------------|--------------|
| 1 | USER_ACCOUNT | Stores all user accounts (students, supervisors, admins) | 10 |
| 2 | STUDENT_PROFILE | Extended profile information for students | 7 |
| 3 | SUPERVISOR_PROFILE | Extended profile information for supervisors | 7 |
| 4 | FYP_CYCLE | FYP academic cycles/terms | 5 |
| 5 | SUPERVISOR_REQUEST | Student requests to supervisors | 8 |
| 6 | PROJECT | FYP projects | 11 |
| 7 | PROPOSAL | Project proposals | 7 |
| 8 | PROPOSAL_VERSION | Versioned proposal content | 6 |
| 9 | PROPOSAL_CHECK_RESULT | AI-generated proposal check results | 7 |
| 10 | PROPOSAL_REVIEW | Proposal review records | 7 |
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
| 22 | SYSTEM_PARAMETER | System configuration parameters | 5 |
| 23 | INTEGRATION_SETTING | External integration settings | 6 |
| 24 | AUDIT_LOG | System audit trail | 7 |

**Total Tables: 24**
**Total Fields: 169**
