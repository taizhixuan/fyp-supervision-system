Below is a **complete “ERD Table Dictionary”**  **Appendix F: Database Design (ERD Tables)**.
(Format: **one data dictionary table per entity** with field, type, key/constraints, null, description.)

---

# Appendix F — Database Tables (ERD Data Dictionary)

## F.1 USER_ACCOUNT

| Field         | Type     | Key / Constraints | Null | Description                                        |
| ------------- | -------- | ----------------- | ---- | -------------------------------------------------- |
| user_id       | BIGINT   | **PK**            | No   | System-generated unique user identifier            |
| mmu_id        | VARCHAR  | **UK**            | No   | MMU ID / staff ID (unique login identifier)        |
| email         | VARCHAR  |                   | No   | User email address                                 |
| full_name     | VARCHAR  |                   | No   | User full name                                     |
| phone         | VARCHAR  |                   | Yes  | Contact number                                     |
| role          | VARCHAR  |                   | No   | Role: STUDENT / SUPERVISOR / FYP_ADMIN / SYS_ADMIN |
| status        | VARCHAR  |                   | No   | Account status: ACTIVE / INACTIVE / SUSPENDED      |
| last_login_at | DATETIME |                   | Yes  | Last login timestamp                               |
| created_at    | DATETIME |                   | No   | Account creation timestamp                         |
| updated_at    | DATETIME |                   | No   | Last update timestamp                              |

---

## F.2 STUDENT_PROFILE

| Field          | Type     | Key / Constraints                     | Null | Description                                              |
| -------------- | -------- | ------------------------------------- | ---- | -------------------------------------------------------- |
| user_id        | BIGINT   | **PK**, **FK → USER_ACCOUNT.user_id** | No   | Student’s user ID (same as account ID)                   |
| programme      | VARCHAR  |                                       | Yes  | Student programme (e.g., BCS)                            |
| specialisation | VARCHAR  |                                       | Yes  | Specialisation (e.g., Software Engineering)              |
| cgpa           | DECIMAL  |                                       | Yes  | CGPA value                                               |
| fyp_status     | VARCHAR  |                                       | Yes  | FYP status (e.g., Not Started / FYP1 / FYP2 / Completed) |
| interests      | TEXT     |                                       | Yes  | Research interests / keywords                            |
| updated_at     | DATETIME |                                       | Yes  | Profile last update                                      |

---

## F.3 SUPERVISOR_PROFILE

| Field                   | Type     | Key / Constraints                     | Null | Description                               |
| ----------------------- | -------- | ------------------------------------- | ---- | ----------------------------------------- |
| user_id                 | BIGINT   | **PK**, **FK → USER_ACCOUNT.user_id** | No   | Supervisor’s user ID (same as account ID) |
| research_areas          | TEXT     |                                       | Yes  | Research areas / expertise keywords       |
| supervision_quota       | INT      |                                       | No   | Max number of supervisees allowed         |
| current_load            | INT      |                                       | No   | Current number of supervisees assigned    |
| availability_status     | VARCHAR  |                                       | Yes  | Available / Not Available / Limited       |
| preferred_project_types | TEXT     |                                       | Yes  | Preferred project category/types          |
| updated_at              | DATETIME |                                       | Yes  | Profile last update                       |

---

## F.4 FYP_CYCLE

| Field      | Type    | Key / Constraints | Null | Description                |
| ---------- | ------- | ----------------- | ---- | -------------------------- |
| cycle_id   | BIGINT  | **PK**            | No   | Unique cycle identifier    |
| cycle_code | VARCHAR |                   | No   | Cycle label (e.g., T2530)  |
| start_date | DATE    |                   | No   | Cycle start date           |
| end_date   | DATE    |                   | No   | Cycle end date             |
| status     | VARCHAR |                   | No   | ACTIVE / CLOSED / UPCOMING |

---

## F.5 SUPERVISOR_REQUEST

| Field              | Type     | Key / Constraints             | Null | Description                    |
| ------------------ | -------- | ----------------------------- | ---- | ------------------------------ |
| request_id         | BIGINT   | **PK**                        | No   | Unique request identifier      |
| student_user_id    | BIGINT   | **FK → USER_ACCOUNT.user_id** | No   | Student sender                 |
| supervisor_user_id | BIGINT   | **FK → USER_ACCOUNT.user_id** | No   | Supervisor receiver            |
| topic_summary      | TEXT     |                               | Yes  | Short topic/proposal summary   |
| message            | TEXT     |                               | Yes  | Request message                |
| status             | VARCHAR  |                               | No   | PENDING / ACCEPTED / REJECTED  |
| submitted_at       | DATETIME |                               | No   | Time student submitted request |
| responded_at       | DATETIME |                               | Yes  | Time supervisor responded      |

---

## F.6 PROJECT

| Field              | Type     | Key / Constraints             | Null | Description                                   |
| ------------------ | -------- | ----------------------------- | ---- | --------------------------------------------- |
| project_id         | BIGINT   | **PK**                        | No   | Unique project identifier                     |
| cycle_id           | BIGINT   | **FK → FYP_CYCLE.cycle_id**   | No   | Cycle where project belongs                   |
| student_user_id    | BIGINT   | **FK → USER_ACCOUNT.user_id** | No   | Project owner (student)                       |
| supervisor_user_id | BIGINT   | **FK → USER_ACCOUNT.user_id** | Yes  | Assigned supervisor (nullable until assigned) |
| project_title      | VARCHAR  |                               | No   | Project title                                 |
| specialisation     | VARCHAR  |                               | Yes  | Specialisation/category alignment             |
| category           | VARCHAR  |                               | Yes  | Project category/type                         |
| stage              | VARCHAR  |                               | No   | FYP1 / FYP2                                   |
| status             | VARCHAR  |                               | No   | DRAFT / REGISTERED / ACTIVE / COMPLETED       |
| registered_at      | DATETIME |                               | Yes  | Registration timestamp                        |
| updated_at         | DATETIME |                               | Yes  | Last update                                   |

---

## F.7 PROPOSAL

| Field              | Type     | Key / Constraints             | Null | Description                                                                |
| ------------------ | -------- | ----------------------------- | ---- | -------------------------------------------------------------------------- |
| proposal_id        | BIGINT   | **PK**                        | No   | Unique proposal identifier                                                 |
| project_id         | BIGINT   | **FK → PROJECT.project_id**   | No   | Related project                                                            |
| student_user_id    | BIGINT   | **FK → USER_ACCOUNT.user_id** | No   | Proposal owner (student)                                                   |
| supervisor_user_id | BIGINT   | **FK → USER_ACCOUNT.user_id** | Yes  | Supervisor (if assigned)                                                   |
| status             | VARCHAR  |                               | No   | DRAFT / SUBMITTED / UNDER_REVIEW / REVISION_REQUIRED / APPROVED / REJECTED |
| created_at         | DATETIME |                               | No   | Proposal created timestamp                                                 |
| updated_at         | DATETIME |                               | Yes  | Proposal last update                                                       |

---

## F.8 PROPOSAL_VERSION

| Field            | Type     | Key / Constraints             | Null | Description                             |
| ---------------- | -------- | ----------------------------- | ---- | --------------------------------------- |
| version_id       | BIGINT   | **PK**                        | No   | Unique version identifier               |
| proposal_id      | BIGINT   | **FK → PROPOSAL.proposal_id** | No   | Parent proposal                         |
| version_no       | INT      |                               | No   | Version number (1,2,3,…)                |
| content_text     | TEXT     |                               | Yes  | Proposal content (text form)            |
| upload_file_path | VARCHAR  |                               | Yes  | Stored file path (PDF/DOCX) if uploaded |
| created_at       | DATETIME |                               | No   | Version creation time                   |

---

## F.9 PROPOSAL_CHECK_RESULT

| Field                  | Type     | Key / Constraints                    | Null | Description                        |
| ---------------------- | -------- | ------------------------------------ | ---- | ---------------------------------- |
| check_id               | BIGINT   | **PK**                               | No   | Unique check result identifier     |
| version_id             | BIGINT   | **FK → PROPOSAL_VERSION.version_id** | No   | Checked proposal version           |
| overall_score          | INT      |                                      | Yes  | Overall completeness/quality score |
| issues_summary         | TEXT     |                                      | Yes  | Summary of issues detected         |
| missing_sections       | TEXT     |                                      | Yes  | Missing sections list              |
| suggested_improvements | TEXT     |                                      | Yes  | Suggestions generated by AI        |
| checked_at             | DATETIME |                                      | No   | Time of check                      |

---

## F.10 PROPOSAL_REVIEW

| Field            | Type     | Key / Constraints             | Null | Description                         |
| ---------------- | -------- | ----------------------------- | ---- | ----------------------------------- |
| review_id        | BIGINT   | **PK**                        | No   | Unique review record identifier     |
| proposal_id      | BIGINT   | **FK → PROPOSAL.proposal_id** | No   | Proposal being reviewed             |
| reviewer_user_id | BIGINT   | **FK → USER_ACCOUNT.user_id** | No   | Reviewer (supervisor/admin)         |
| reviewer_role    | VARCHAR  |                               | No   | SUPERVISOR / FYP_ADMIN              |
| decision         | VARCHAR  |                               | No   | APPROVE / REJECT / REQUEST_REVISION |
| remarks          | TEXT     |                               | Yes  | Review comments                     |
| reviewed_at      | DATETIME |                               | No   | Review timestamp                    |

---

## F.11 MEETING

| Field                        | Type     | Key / Constraints             | Null | Description                                           |
| ---------------------------- | -------- | ----------------------------- | ---- | ----------------------------------------------------- |
| meeting_id                   | BIGINT   | **PK**                        | No   | Unique meeting identifier                             |
| project_id                   | BIGINT   | **FK → PROJECT.project_id**   | No   | Related project                                       |
| requested_by_student_user_id | BIGINT   | **FK → USER_ACCOUNT.user_id** | No   | Student who requested                                 |
| proposed_start_at            | DATETIME |                               | Yes  | Proposed start time                                   |
| proposed_end_at              | DATETIME |                               | Yes  | Proposed end time                                     |
| platform                     | VARCHAR  |                               | Yes  | Teams / Zoom / Face-to-face                           |
| agenda                       | TEXT     |                               | Yes  | Meeting agenda                                        |
| status                       | VARCHAR  |                               | No   | PROPOSED / CONFIRMED / RESCHEDULED / CANCELLED / DONE |
| confirmed_start_at           | DATETIME |                               | Yes  | Confirmed start time                                  |
| confirmed_end_at             | DATETIME |                               | Yes  | Confirmed end time                                    |
| updated_at                   | DATETIME |                               | Yes  | Last update                                           |

---

## F.12 MEETING_LOG

| Field               | Type     | Key / Constraints           | Null | Description                                       |
| ------------------- | -------- | --------------------------- | ---- | ------------------------------------------------- |
| log_id              | BIGINT   | **PK**                      | No   | Unique meeting log identifier                     |
| meeting_id          | BIGINT   | **FK → MEETING.meeting_id** | No   | Meeting reference                                 |
| project_id          | BIGINT   | **FK → PROJECT.project_id** | No   | Project reference (denormalised for quick access) |
| discussion_summary  | TEXT     |                             | Yes  | Summary of discussion                             |
| action_items        | TEXT     |                             | Yes  | Action items / next steps                         |
| next_meeting_date   | DATE     |                             | Yes  | Planned next meeting date                         |
| supervisor_comments | TEXT     |                             | Yes  | Supervisor feedback/comments                      |
| status              | VARCHAR  |                             | No   | DRAFT / SUBMITTED / LOCKED                        |
| submitted_at        | DATETIME |                             | Yes  | Submission time                                   |
| locked_at           | DATETIME |                             | Yes  | Lock timestamp (finalised log)                    |

---

## F.13 MEETING_LOG_SIGNATURE

| Field          | Type     | Key / Constraints             | Null | Description                 |
| -------------- | -------- | ----------------------------- | ---- | --------------------------- |
| signature_id   | BIGINT   | **PK**                        | No   | Unique signature identifier |
| log_id         | BIGINT   | **FK → MEETING_LOG.log_id**   | No   | Meeting log signed          |
| signer_user_id | BIGINT   | **FK → USER_ACCOUNT.user_id** | No   | Signer user                 |
| signer_role    | VARCHAR  |                               | No   | STUDENT / SUPERVISOR        |
| signed_at      | DATETIME |                               | No   | Signature timestamp         |

---

## F.14 PROJECT_DOCUMENT

| Field               | Type     | Key / Constraints             | Null | Description                        |
| ------------------- | -------- | ----------------------------- | ---- | ---------------------------------- |
| document_id         | BIGINT   | **PK**                        | No   | Unique document identifier         |
| project_id          | BIGINT   | **FK → PROJECT.project_id**   | No   | Related project                    |
| uploaded_by_user_id | BIGINT   | **FK → USER_ACCOUNT.user_id** | No   | Uploader                           |
| doc_type            | VARCHAR  |                               | No   | PROPOSAL / REPORT / SLIDES / OTHER |
| phase               | VARCHAR  |                               | Yes  | FYP1 / FYP2 / Interim / Final      |
| version_no          | INT      |                               | Yes  | Document version number            |
| file_name           | VARCHAR  |                               | No   | Original filename                  |
| storage_path        | VARCHAR  |                               | No   | Storage location/path              |
| uploaded_at         | DATETIME |                               | No   | Upload timestamp                   |

---

## F.15 RESOURCE_DOCUMENT

| Field                     | Type     | Key / Constraints             | Null | Description                          |
| ------------------------- | -------- | ----------------------------- | ---- | ------------------------------------ |
| resource_id               | BIGINT   | **PK**                        | No   | Unique resource identifier           |
| uploaded_by_admin_user_id | BIGINT   | **FK → USER_ACCOUNT.user_id** | No   | Admin who published                  |
| category                  | VARCHAR  |                               | Yes  | Template / Handbook / Rubric / Other |
| title                     | VARCHAR  |                               | No   | Resource title                       |
| storage_path              | VARCHAR  |                               | No   | Storage location/path                |
| visibility                | VARCHAR  |                               | No   | ALL / STUDENT / SUPERVISOR / ADMIN   |
| is_active                 | BOOLEAN  |                               | No   | True if active/visible               |
| published_at              | DATETIME |                               | Yes  | Publish time                         |

---

## F.16 DEADLINE

| Field       | Type    | Key / Constraints           | Null | Description                |
| ----------- | ------- | --------------------------- | ---- | -------------------------- |
| deadline_id | BIGINT  | **PK**                      | No   | Unique deadline identifier |
| cycle_id    | BIGINT  | **FK → FYP_CYCLE.cycle_id** | No   | Related cycle              |
| title       | VARCHAR |                             | No   | Deadline title             |
| due_date    | DATE    |                             | No   | Due date                   |
| audience    | VARCHAR |                             | No   | STUDENT / SUPERVISOR / ALL |
| notes       | TEXT    |                             | Yes  | Additional notes           |

---

## F.17 ANNOUNCEMENT

| Field              | Type     | Key / Constraints             | Null | Description                         |
| ------------------ | -------- | ----------------------------- | ---- | ----------------------------------- |
| announcement_id    | BIGINT   | **PK**                        | No   | Unique announcement identifier      |
| created_by_user_id | BIGINT   | **FK → USER_ACCOUNT.user_id** | No   | Creator (admin)                     |
| scope              | VARCHAR  |                               | No   | ALL / STUDENT / SUPERVISOR / CUSTOM |
| title              | VARCHAR  |                               | No   | Announcement title                  |
| content            | TEXT     |                               | No   | Announcement body content           |
| publish_at         | DATETIME |                               | Yes  | Scheduled publish time              |
| created_at         | DATETIME |                               | No   | Created timestamp                   |

---

## F.18 ANNOUNCEMENT_AUDIENCE

| Field                     | Type   | Key / Constraints                     | Null | Description                                        |
| ------------------------- | ------ | ------------------------------------- | ---- | -------------------------------------------------- |
| audience_id               | BIGINT | **PK**                                | No   | Unique audience row identifier                     |
| announcement_id           | BIGINT | **FK → ANNOUNCEMENT.announcement_id** | No   | Related announcement                               |
| target_supervisor_user_id | BIGINT | **FK → USER_ACCOUNT.user_id**         | No   | Targeted supervisor user ID (for CUSTOM targeting) |

---

## F.19 NOTIFICATION

| Field           | Type     | Key / Constraints             | Null | Description                           |
| --------------- | -------- | ----------------------------- | ---- | ------------------------------------- |
| notification_id | BIGINT   | **PK**                        | No   | Unique notification identifier        |
| user_id         | BIGINT   | **FK → USER_ACCOUNT.user_id** | No   | Recipient user                        |
| type            | VARCHAR  |                               | No   | REQUEST / PROPOSAL / MEETING / SYSTEM |
| title           | VARCHAR  |                               | No   | Notification title                    |
| message         | TEXT     |                               | No   | Notification message content          |
| created_at      | DATETIME |                               | No   | Created timestamp                     |
| read_at         | DATETIME |                               | Yes  | Time notification was read            |

---

## F.20 CHAT_SESSION

| Field      | Type     | Key / Constraints             | Null | Description                    |
| ---------- | -------- | ----------------------------- | ---- | ------------------------------ |
| session_id | BIGINT   | **PK**                        | No   | Unique chat session identifier |
| user_id    | BIGINT   | **FK → USER_ACCOUNT.user_id** | No   | User who started chat          |
| started_at | DATETIME |                               | No   | Session start time             |
| ended_at   | DATETIME |                               | Yes  | Session end time               |

---

## F.21 CHAT_MESSAGE

| Field            | Type     | Key / Constraints                | Null | Description                         |
| ---------------- | -------- | -------------------------------- | ---- | ----------------------------------- |
| message_id       | BIGINT   | **PK**                           | No   | Unique chat message identifier      |
| session_id       | BIGINT   | **FK → CHAT_SESSION.session_id** | No   | Session reference                   |
| sender           | VARCHAR  |                                  | No   | USER / BOT / SYSTEM                 |
| content          | TEXT     |                                  | No   | Message text                        |
| confidence_score | DECIMAL  |                                  | Yes  | AI confidence score (if applicable) |
| sent_at          | DATETIME |                                  | No   | Sent timestamp                      |

---

## F.22 SYSTEM_PARAMETER

| Field              | Type     | Key / Constraints             | Null | Description                 |
| ------------------ | -------- | ----------------------------- | ---- | --------------------------- |
| param_id           | BIGINT   | **PK**                        | No   | Unique parameter identifier |
| param_key          | VARCHAR  | **UK**                        | No   | Unique configuration key    |
| param_value        | VARCHAR  |                               | No   | Configuration value         |
| updated_by_user_id | BIGINT   | **FK → USER_ACCOUNT.user_id** | Yes  | Admin who updated           |
| updated_at         | DATETIME |                               | Yes  | Update timestamp            |

---

## F.23 INTEGRATION_SETTING

| Field              | Type     | Key / Constraints             | Null | Description                                        |
| ------------------ | -------- | ----------------------------- | ---- | -------------------------------------------------- |
| integration_id     | BIGINT   | **PK**                        | No   | Unique integration identifier                      |
| name               | VARCHAR  |                               | No   | Integration name (e.g., AI Service, Email Gateway) |
| endpoint_url       | VARCHAR  |                               | Yes  | Endpoint address                                   |
| status             | VARCHAR  |                               | No   | ENABLED / DISABLED                                 |
| updated_by_user_id | BIGINT   | **FK → USER_ACCOUNT.user_id** | Yes  | Admin who updated                                  |
| updated_at         | DATETIME |                               | Yes  | Update timestamp                                   |

---

## F.24 AUDIT_LOG

| Field       | Type     | Key / Constraints             | Null | Description                                    |
| ----------- | -------- | ----------------------------- | ---- | ---------------------------------------------- |
| audit_id    | BIGINT   | **PK**                        | No   | Unique audit record identifier                 |
| user_id     | BIGINT   | **FK → USER_ACCOUNT.user_id** | Yes  | User who performed action                      |
| action      | VARCHAR  |                               | No   | Action type (CREATE/UPDATE/DELETE/LOGIN/etc.)  |
| entity_name | VARCHAR  |                               | No   | Entity/table affected                          |
| entity_id   | BIGINT   |                               | Yes  | Affected record ID                             |
| created_at  | DATETIME |                               | No   | Timestamp of action                            |
| details     | TEXT     |                               | Yes  | Extra details (before/after summary, metadata) |

---

