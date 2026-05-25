# Facts — 5.4 Database Implementation

> Existing 5.4 prose at `chapter5.md:720–1056`. Heavy drift to correct
> in the rewrite: claim of "fourteen Flyway scripts" (actual: thirty),
> "twenty-eight entities / twenty-six repositories" (actual: 36 / 35),
> "twenty-nine tables" (actual: 36), still mentions
> `plagiarism_score` (V31 dropped it), `chat_message.sender` documented
> as `USER`/`BOT` (actual: `user`/`assistant`), and the schema-by-domain
> table stops at V14 even though seventeen migrations have shipped
> since.

## Files involved

### Migration scripts — `backend/src/main/resources/db/migration/`

Thirty Flyway scripts, V1–V28 plus V30 and V31. **V29 was deliberately
skipped** during a planning revision; Flyway is happy with gaps in the
sequence as long as no skipped number reappears later. File-name
convention: `V<N>__<snake_case_description>.sql`.

| # | File | Purpose |
|---|---|---|
| V1 | `V1__create_user_tables.sql` | `user_account`, `student_profile`, `supervisor_profile` + four indexes |
| V2 | `V2__create_project_tables.sql` | `fyp_cycle`, `project`, `supervisor_request` + six indexes |
| V3 | `V3__create_proposal_tables.sql` | `proposal`, `proposal_version`, `proposal_check_result`, `proposal_review` + three indexes |
| V4 | `V4__create_meeting_tables.sql` | `meeting`, `meeting_log`, `meeting_log_signature` + five indexes |
| V5 | `V5__create_document_tables.sql` | `project_document`, `resource_document` + four indexes |
| V6 | `V6__create_announcement_notification_tables.sql` | `announcement`, `announcement_audience`, `notification`, `deadline` + five indexes |
| V7 | `V7__create_chat_tables.sql` | `chat_session`, `chat_message` + two indexes |
| V8 | `V8__create_admin_tables.sql` | `system_parameter`, `integration_setting`, `audit_log` + five indexes |
| V9 | `V9__seed_data.sql` | Demo accounts, two FYP cycles, twelve system parameters, four deadlines |
| V10 | `V10__add_ai_columns.sql` | `proposal_check_result`: add `proposal_id`, `checked_by`, `remarks`; relax `version_id` to NULL; add `idx_check_proposal` |
| V11 | `V11__create_user_notification_preferences.sql` | `user_notification_preferences` |
| V12 | `V12__create_generated_report_tables.sql` | `generated_report` + two indexes |
| V13 | `V13__create_export_config_tables.sql` | `export_config` + one index |
| V14 | `V14__create_maintenance_job_tables.sql` | `maintenance_job` + three indexes |
| V15 | `V15__add_fyp1_pass_flag.sql` | `project.fyp1_passed BOOLEAN NULL` + `idx_project_fyp1_passed` |
| V16 | `V16__create_supervisor_topic.sql` | `supervisor_topic` + `project.topic_id` FK (later reverted) |
| V17 | `V17__create_deadline_reminder_log.sql` | `deadline_reminder_log` (composite PK on `deadline_id, days_before`) |
| V18 | `V18__drop_supervisor_topic.sql` | Reverts V16 — drops `project.topic_id` and the `supervisor_topic` table |
| V19 | `V19__create_password_reset_tokens.sql` | `password_reset_token` (`token_hash CHAR(64)`, single live row per user) |
| V20 | `V20__create_push_subscriptions.sql` | `push_subscription` (one row per browser endpoint, unique on `endpoint`) |
| V21 | `V21__fix_password_reset_token_hash_type.sql` | `MODIFY COLUMN token_hash VARCHAR(64)` — entity mapped VARCHAR, V19 created CHAR, validate would refuse to boot |
| V22 | `V22__create_approved_roster_tables.sql` | `approved_student_roster`, `approved_supervisor_roster` (pre-authorisation lists) |
| V23 | `V23__add_specialisation_to_student_roster.sql` | `approved_student_roster.specialisation` |
| V24 | `V24__cycle_uniqueness_and_placeholder_projects.sql` | `project.project_title` → NULL allowed; `UNIQUE (cycle_id, student_user_id)` for placeholder rows |
| V25 | `V25__backfill_student_programme.sql` | Backfill `student_profile.programme`, `faculty`, `expected_graduation` from `specialisation`/`intake_year` |
| V26 | `V26__announcement_attachments_targets.sql` | `announcement_attachment`, `announcement_link`, `announcement_audience.target_student_user_id` |
| V27 | `V27__login_throttle_columns.sql` | `user_account.login_attempts INT NOT NULL DEFAULT 0`, `lockout_until DATETIME NULL` |
| V28 | `V28__chat_message_feedback.sql` | `chat_message.feedback VARCHAR(8)`, `feedback_at DATETIME` (assistant messages only) |
| V30 | `V30__fyp_grade_table.sql` | `fyp_grade` (one row per `(project, phase, grader)`; status `DRAFT → SUBMITTED → FINALISED`) |
| V31 | `V31__drop_proposal_plagiarism_score.sql` | `proposal_check_result` drops `plagiarism_score` (the analyzer never computed it) |

### Reference docs

- `Project-info/reports/Data-Dictionary-Report.md`
- `Project-info/reports/chapter3-ERD.md`

## Live database state

- Engine: **MySQL 8** (`mysql:8` image). Storage engine: **InnoDB**.
- Charset / collation: **`utf8mb4` / `utf8mb4_unicode_ci`** on every table.
- Schema name: `fyp_supervision`.
- Table count: **36** (counted from migration DDL excluding `supervisor_topic` which V16 created and V18 dropped).
- Plus Flyway's bookkeeping table `flyway_schema_history` (38 total visible).

## Tables grouped by domain

### Identity (V1)

| Table | PK | Notable columns | Notes |
|---|---|---|---|
| `user_account` | `user_id BIGINT AUTO_INCREMENT` | `mmu_id` UNIQUE, `email` UNIQUE, `password_hash` (BCrypt), `full_name`, `phone`, `role` ENUM, `status` ENUM, `profile_image_path`, `last_login_at`, **V27** `login_attempts INT DEFAULT 0`, **V27** `lockout_until` | One row per person; role + status drive auth |
| `student_profile` | `user_id` (FK to `user_account`) | `programme`, `specialisation`, `faculty`, `intake_year`, `expected_graduation`, `cgpa`, `fyp_status`, `interests` (JSON in TEXT), `skills` (JSON in TEXT), `bio`, `linkedin_url`, `github_url`, `portfolio_url` | One-to-one extension; cascade delete |
| `supervisor_profile` | `user_id` (FK to `user_account`) | `department`, `faculty`, `position`, `research_areas` (JSON in TEXT), `expertise` (JSON in TEXT), `supervision_quota INT NOT NULL DEFAULT 8`, `current_load INT NOT NULL DEFAULT 0`, `availability_status DEFAULT 'AVAILABLE'`, `preferred_project_types`, `office_location`, `office_hours`, `linkedin_url`, `google_scholar_url` | One-to-one extension; cascade delete |

Indexes: `idx_user_account_role`, `idx_user_account_status`, `idx_user_account_email`, `idx_user_account_mmu_id`.

### Cycle, project, request (V2 + V15 + V24)

| Table | Notable columns | Notes |
|---|---|---|
| `fyp_cycle` | `cycle_code` UNIQUE, `cycle_type` (FYP1/FYP2), `academic_year`, `semester INT`, `start_date`, `end_date`, `status` ENUM (`PLANNING`, `ACTIVE`, `COMPLETED`, `ARCHIVED`) | Invariant enforced in service: at most one ACTIVE per `cycle_type` |
| `project` | `cycle_id` FK, `student_user_id` FK, `supervisor_user_id` FK, `project_title` (nullable since **V24**), `description`, `specialisation`, `category`, `stage`, `status` ENUM (`ACTIVE`, `COMPLETED`, `SUSPENDED`, `DROPPED`), `registered_at`, **V15** `fyp1_passed BOOLEAN NULL` | **V24** `UNIQUE (cycle_id, student_user_id)` prevents duplicate placeholders |
| `supervisor_request` | `student_user_id` FK, `supervisor_user_id` FK, `proposed_title`, `topic_summary`, `message`, `response_message`, `status` ENUM (`PENDING`, `ACCEPTED`, `REJECTED`, `WITHDRAWN`, `EXPIRED`), `submitted_at`, `responded_at`, `expires_at` | Submission triggers a notification to the supervisor |

Indexes: `idx_project_student`, `idx_project_supervisor`, `idx_project_cycle`, `idx_project_fyp1_passed` (V15), `idx_request_student`, `idx_request_supervisor`, `idx_request_status`.

### Proposal workflow (V3, V10, V31)

| Table | Notable columns | Notes |
|---|---|---|
| `proposal` | `project_id` FK, `student_user_id` FK, `supervisor_user_id` FK, `title`, `status` ENUM (`DRAFT`, `SUBMITTED`, `UNDER_REVIEW`, `REVISION_REQUIRED`, `APPROVED`, `REJECTED`), `current_version INT DEFAULT 1` | Lifecycle anchor |
| `proposal_version` | `proposal_id` FK, `version_no INT`, `content_text LONGTEXT`, `upload_file_path`, `file_name`, `created_at` | Append-only version history; CASCADE on parent delete |
| `proposal_check_result` | `version_id` (nullable since **V10**), `proposal_id` FK (added **V10**), `overall_score INT`, `feasibility_score`, `innovation_score`, `clarity_score`, `scope_score`, `issues_summary`, `missing_sections`, `suggested_improvements`, `strengths`, `weaknesses`, `checked_by` (added **V10**), `remarks` (added **V10**), `checked_at` | **V31 dropped `plagiarism_score`** — the analyzer never computed it |
| `proposal_review` | `proposal_id` FK, `reviewer_user_id` FK, `reviewer_role`, `decision`, `remarks`, `internal_notes`, `reviewed_at` | One row per review action |

Indexes: `idx_proposal_student`, `idx_proposal_status`, `idx_proposal_version_proposal`, `idx_check_proposal` (V10).

### Meetings + signatures (V4)

| Table | Notable columns | Notes |
|---|---|---|
| `meeting` | `project_id` FK, `requested_by_user_id` FK, `title`, `meeting_type`, `proposed_start_at`, `proposed_end_at`, `confirmed_start_at`, `confirmed_end_at`, `platform`, `location`, `meeting_url`, `duration_minutes`, `agenda`, `notes`, `status` ENUM (`PROPOSED`, `CONFIRMED`, `COMPLETED`, `CANCELLED`, `RESCHEDULED`), `cancel_reason`, `alternative_datetimes` (JSON in TEXT) | Negotiation captured in `alternative_datetimes` |
| `meeting_log` | `meeting_id` FK, `project_id` FK, `student_user_id` FK, `supervisor_user_id` FK, `meeting_date`, `meeting_number INT`, `meeting_mode`, `fyp_phase`, `tasks_json`, `discussion_summary`, `work_done_details`, `work_to_be_done`, `problems_and_solutions`, `action_items`, `next_meeting_date`, `supervisor_comments`, `correction_reason`, `status` ENUM (`DRAFT`, `SUBMITTED`, `CORRECTION_REQUIRED`, `SUPERVISOR_SIGNED`, `LOCKED`), `submitted_at`, `locked_at` | FCI-form digitisation; six logs per phase is the soft compliance target |
| `meeting_log_signature` | `log_id` FK, `signer_user_id` FK, `signer_role`, `signature_image_url TEXT` (PNG data URL), `signature_sha256 VARCHAR(64)`, `signed_at` | SHA-256 of the bytes proves the stored image has not been altered |

Indexes: `idx_meeting_project`, `idx_meeting_status`, `idx_meeting_log_project`, `idx_meeting_log_student`, `idx_meeting_log_status`.

### Documents (V5)

| Table | Notable columns | Notes |
|---|---|---|
| `project_document` | `project_id` FK, `uploaded_by_user_id` FK, `title`, `description`, `doc_type`, `phase`, `version_no INT DEFAULT 1`, `file_name`, `storage_path`, `file_size BIGINT`, `mime_type`, `uploaded_at` | Per-project uploads |
| `resource_document` | `uploaded_by_user_id` FK, `category`, `title`, `description`, `file_name`, `storage_path`, `file_size`, `visibility VARCHAR(30) DEFAULT 'ALL'`, `is_active BOOLEAN DEFAULT TRUE`, `download_count INT DEFAULT 0`, `published_at` | Globally available templates/guides |

Indexes: `idx_doc_project`, `idx_doc_type`, `idx_resource_category`, `idx_resource_visibility`.

### Announcements + notifications + deadlines (V6 + V17 + V26)

| Table | Notable columns | Notes |
|---|---|---|
| `announcement` | `created_by_user_id` FK, `scope`, `title`, `content`, `priority DEFAULT 'NORMAL'`, `status` ENUM (`DRAFT`, `PUBLISHED`, `ARCHIVED`), `publish_at`, `expires_at`, `view_count INT DEFAULT 0` | Broadcast channel |
| `announcement_audience` | `announcement_id` FK CASCADE, `target_supervisor_user_id` FK, **V26** `target_student_user_id` FK | Used for `SPECIFIC_STUDENTS` and supervisor-targeted scopes |
| **V26** `announcement_attachment` | `announcement_id` FK CASCADE, `file_name`, `file_path`, `file_size BIGINT`, `mime_type`, `uploaded_at` | Multipart attachments |
| **V26** `announcement_link` | `announcement_id` FK CASCADE, `label`, `url` | External links |
| `notification` | `user_id` FK CASCADE, `type`, `title`, `message`, `target_route`, `created_at`, `read_at` | Per-user in-app notifications |
| `deadline` | `cycle_id` FK, `title`, `description`, `due_date DATE`, `deadline_type`, `audience`, `notes`, `reminder_days` (JSON like `[14, 7, 3, 1]`), `is_extendable BOOLEAN DEFAULT FALSE`, `extended_date` | One row per deadline; reminder dispatch is driven by `reminder_days` |
| **V17** `deadline_reminder_log` | Composite PK `(deadline_id, days_before)`, `fired_at` | Idempotent — prevents the same `(deadline, days_before)` reminder from firing twice |

Indexes: `idx_notification_user`, `idx_notification_read`, `idx_announcement_status`, `idx_deadline_cycle`, `idx_deadline_due`, `idx_aa_announcement`, `idx_al_announcement`.

### Chatbot persistence (V7 + V28)

| Table | Notable columns | Notes |
|---|---|---|
| `chat_session` | `user_id` FK CASCADE, `started_at`, `ended_at` | One row per conversation |
| `chat_message` | `session_id` FK CASCADE, `sender VARCHAR(20)` (live values: `'user'` / `'assistant'`, **not** `USER`/`BOT`), `content`, `confidence_score DECIMAL(5,4)`, `references_json` (citations from RAG), `sent_at`, **V28** `feedback VARCHAR(8)` (`'UP'`, `'DOWN'`, or NULL — assistant messages only), **V28** `feedback_at DATETIME` | V28 thumbs-up / thumbs-down persistence |

Indexes: `idx_chat_session_user`, `idx_chat_message_session`.

### Administration + audit (V8)

| Table | Notable columns | Notes |
|---|---|---|
| `system_parameter` | `param_key` UNIQUE, `param_value VARCHAR(500)`, `param_type` (`NUMBER` / `STRING` / `BOOLEAN`), `category`, `label`, `description`, `default_value`, `is_editable BOOLEAN DEFAULT TRUE`, `validation_rules`, `updated_by_user_id` FK | Read at request time, not boot — toggles take effect immediately |
| `integration_setting` | `name`, `integration_type`, `provider`, `description`, `endpoint_url`, `settings_json`, `status DEFAULT 'INACTIVE'`, `last_tested_at`, `last_test_result`, `updated_by_user_id` FK | Third-party integration definitions |
| `audit_log` | `user_id` FK (no cascade — keep history when user is deleted), `action`, `entity_name`, `entity_id`, `old_value TEXT`, `new_value TEXT`, `details TEXT`, `ip_address VARCHAR(45)`, `user_agent VARCHAR(500)`, `created_at` | Best-effort write via `AuditService` (REQUIRES_NEW) |

Indexes: `idx_audit_user`, `idx_audit_action`, `idx_audit_entity` (compound), `idx_audit_created`, `idx_param_category`.

### Operations + later additions (V11–V14, V19–V22, V30)

| Table | Origin | Notable columns | Notes |
|---|---|---|---|
| `user_notification_preferences` | V11 | `user_id` PK FK CASCADE, `preferences_json TEXT` | Per-user channel preferences |
| `generated_report` | V12 | `report_type`, `title`, `generated_by_user_id` FK, `format DEFAULT 'CSV'`, `file_path`, `filters_json`, `expires_at` | Committee report metadata |
| `export_config` | V13 | `name`, `data_type`, `format DEFAULT 'CSV'`, `include_headers`, `date_format`, `fields_json`, `filters_json`, `schedule_json`, `last_export_path`, `last_export_at` | Admin recurring exports |
| `maintenance_job` | V14 | `job_type`, `status DEFAULT 'PENDING'`, `started_at`, `completed_at`, `message`, `result_json`, `triggered_by_user_id` FK | Async job tracking |
| `password_reset_token` | V19 + V21 | `user_id` FK CASCADE, `token_hash VARCHAR(64) UNIQUE` (SHA-256), `expires_at`, `used_at`, `created_at` | Single-use tokens; only the hash is stored |
| `push_subscription` | V20 | `user_id` FK CASCADE, `endpoint VARCHAR(500) UNIQUE`, `p256dh`, `auth_key`, `user_agent`, `created_at`, `last_used_at` | One row per browser/device endpoint |
| `approved_student_roster` | V22 + V23 | `mmu_id` UNIQUE, `email` UNIQUE, `full_name`, `programme`, `specialisation` (V23), `faculty`, `intake_year`, `uploaded_by` FK SET NULL, `uploaded_at`, `updated_at` | Pre-authorisation list — registration auto-approved when matched |
| `approved_supervisor_roster` | V22 | `mmu_id` UNIQUE, `email` UNIQUE, `full_name`, `department`, `faculty`, `position`, `uploaded_by` FK SET NULL | Same idea, supervisor side |
| `fyp_grade` | V30 | `project_id` FK, `phase VARCHAR(10)`, `grader_user_id` FK, `grader_role`, `rubric_json TEXT`, `total_score DECIMAL(5,2)`, `letter_grade VARCHAR(5)`, `remarks`, `status DEFAULT 'DRAFT'`, `finalised_by_user_id` FK, `finalised_at`, `UNIQUE (project_id, phase, grader_user_id)` | One grade per `(project, phase, grader)`; multiple graders → multiple rows |

Indexes: `idx_report_generated_at` (DESC), `idx_report_type`, `idx_export_config_data_type`, `idx_maintenance_job_type`, `idx_maintenance_job_status`, `idx_maintenance_job_started` (DESC), `uk_password_reset_token_hash`, `idx_password_reset_user (user_id, used_at)`, `uk_push_subscription_endpoint`, `idx_push_subscription_user`, `idx_student_roster_email`, `idx_supervisor_roster_email`, `idx_grade_project`, `idx_grade_grader`, `idx_grade_status`.

### Reverted / superseded

- **`supervisor_topic`** (V16 → V18): supervisor-led topic catalogue with status `PENDING_REVIEW → APPROVED / REJECTED / REVISION_REQUIRED → WITHDRAWN`. V16 also added `project.topic_id`. V18 dropped both because the spec is supervisor-first (browse directory → request → propose) rather than topic-first. The migration trail preserves the abandoned attempt as a record of design history.

## Enums (kept in lock-step with `com.fyp.supervision.enums`)

| Java enum | DB column | Values |
|---|---|---|
| `UserRole` | `user_account.role` | `STUDENT`, `SUPERVISOR`, `FYP_COMMITTEE`, `SYSTEM_ADMIN` |
| `UserStatus` | `user_account.status` | `PENDING`, `ACTIVE`, `SUSPENDED`, `BLOCKED` |
| `CycleStatus` | `fyp_cycle.status` | `PLANNING`, `ACTIVE`, `COMPLETED`, `ARCHIVED` |
| `ProjectStatus` | `project.status` | `ACTIVE`, `COMPLETED`, `SUSPENDED`, `DROPPED` |
| `RequestStatus` | `supervisor_request.status` | `PENDING`, `ACCEPTED`, `REJECTED`, `WITHDRAWN`, `EXPIRED` |
| `ProposalStatus` | `proposal.status` | `DRAFT`, `SUBMITTED`, `UNDER_REVIEW`, `REVISION_REQUIRED`, `APPROVED`, `REJECTED` |
| `MeetingStatus` | `meeting.status` | `PROPOSED`, `CONFIRMED`, `COMPLETED`, `CANCELLED`, `RESCHEDULED` |
| `MeetingLogStatus` | `meeting_log.status` | `DRAFT`, `SUBMITTED`, `CORRECTION_REQUIRED`, `SUPERVISOR_SIGNED`, `LOCKED` |
| `AnnouncementStatus` | `announcement.status` | `DRAFT`, `PUBLISHED`, `ARCHIVED` |

Other enum-like columns are stored as `VARCHAR` (`fyp_grade.status`,
`maintenance_job.status`, `integration_setting.status`, etc.) because
the value sets evolve faster than the schema — the migrations document
the live values rather than constraining them.

## Auditing columns

Every transactional table carries a `created_at` and `updated_at`
column, both `DATETIME NOT NULL`. The `updated_at` column is declared
with `DEFAULT NOW() ON UPDATE NOW()` so InnoDB itself maintains the
modification timestamp on every row update — no application
participation required, and timestamps cannot drift between hosts.

Time-of-action columns (`last_login_at`, `submitted_at`,
`responded_at`, `locked_at`, `read_at`, `expires_at`,
`finalised_at`, `last_used_at`, `feedback_at`) are nullable
`DATETIME`s.

## Stored procedures, triggers, application-side rules

The schema **does not declare any custom stored procedures or
triggers**. Every business rule lives in the Spring Boot service layer
(`com.fyp.supervision.service.*`). The schema does lean on a small
number of native MySQL features:

- Implicit `ON UPDATE CURRENT_TIMESTAMP` on every `updated_at` column (used on at least 14 tables)
- `AUTO_INCREMENT` for surrogate primary keys
- `ON DELETE CASCADE` on dependent tables (proposal versions, check results, signatures, chat messages, notifications, audience entries, attachments, links, push subscriptions, password reset tokens)
- ENUM value enforcement (defence in depth against bad service-layer writes)
- UNIQUE business-key constraints (`mmu_id`, `email`, `cycle_code`, `param_key`, `endpoint`, `token_hash`, plus the cycle/student composite UQ on `project`)

## Seed data (V9)

- 4 demo users: `admin@mmu.edu.my` (`Admin@123`), `sarah.lee@mmu.edu.my`, `student@student.mmu.edu.my`, `ahmad.razak@mmu.edu.my` — all test accounts share password `Test@123`.
- 1 supervisor profile (Dr. Sarah Lee, FCI Senior Lecturer).
- 1 student profile (Bachelor of Computer Science, intake 2021).
- 2 FYP cycles: `FYP-2024-2025-1` (`FYP1`, ACTIVE), `FYP-2024-2025-2` (`FYP2`, PLANNING).
- 12 system parameters across `supervision`, `security`, `storage`, `proposal`, `notification`, `general`, `ai` categories.
- 4 default deadlines on the active FYP1 cycle.

## Schema vs. ORM contract

- **36 JPA entities** under `com.fyp.supervision.entity` (verified via `ls`).
- **35 Spring Data repositories** under `com.fyp.supervision.repository`.
- `spring.jpa.hibernate.ddl-auto: validate` — Hibernate compares entity model to live schema on startup and refuses to boot on drift. (V21 was needed because V19's `CHAR(64)` mismatched the entity's `String` mapping.)

## Tools used for database management

- **MySQL 8** (`mysql:8` Docker image) — runtime.
- **MySQL Workbench 8** — schema inspection, EER diagrams (basis for the ERD in `Project-info/ERD.md`), `EXPLAIN` runs on prospective indexes.
- **Flyway 10** (`flyway-core` + `flyway-mysql`) — embedded in the backend; on each startup, scans `classpath:db/migration` and applies missing scripts in `V*` order. `baseline-on-migrate: true` lets it attach to a pre-existing schema.
- **MySQL CLI inside the `db` container** — `docker compose exec db mysql -ufyp_user -pfyp_pass fyp_supervision` for emergency inspection.
- **Docker named volume `mysql_data`** — durable storage, survives `docker compose down`. Drop with `docker volume rm` to start clean.
- **Spring Data JPA + Hibernate validator** — second-line drift detector via `ddl-auto: validate`.
- **IntelliJ IDEA Database Tool Window** — used during entity authoring for live `SELECT` and JPA-skeleton generation.

## Notable design choices for the report

- **Schema is migration-owned, not Hibernate-owned.** `validate` is the only `ddl-auto` setting used; Hibernate cannot mutate the schema.
- **`utf8mb4` end-to-end** — Chinese, Tamil, emoji all serialise without truncation.
- **Surrogate `BIGINT AUTO_INCREMENT` primary keys everywhere** (one composite PK on `deadline_reminder_log`).
- **CASCADE only on dependent rows** (proposal versions, signatures, chat messages, push subs, etc.). "Reference-only" FKs (`audit_log.user_id`, `project.cycle_id`) deliberately do not cascade so deleting a user does not erase audit history.
- **Migration trail preserves design reversals.** V16 created `supervisor_topic`; V18 dropped it. The history is intact.
- **V31 honesty cleanup.** `proposal_check_result.plagiarism_score` was a hard-coded constant in the analyzer; rather than leave a permanently-fake field, the column was deleted.
- **V21 demonstrates the validate-mode contract.** V19 declared `token_hash CHAR(64)`; the entity mapped to `String` (VARCHAR), so Hibernate refused to boot. V21 converted the column.
- **Idempotent reminder log.** `deadline_reminder_log` has a composite PK `(deadline_id, days_before)`; a duplicate INSERT is a constraint violation rather than a duplicate email.
- **Pre-authorisation rosters (V22, V23)** decouple admin approval from registration — if an `mmu_id`/`email` matches a roster row, the new account auto-activates.
- **JSON-in-TEXT columns** are used where the shape is stable but evolving (rubric_json, preferences_json, fields_json, schedule_json, references_json). MySQL's native JSON type was not adopted because the application reads them as plain strings via Jackson.
- **Composite UNIQUE on `project` (`cycle_id`, `student_user_id`)** prevents two placeholder Project rows for the same student in the same cycle (V24).
- **ENUM choice vs VARCHAR.** Stable workflow states (auth, cycle, project, request, proposal, meeting, meeting log, announcement) use MySQL ENUM. Newer/looser states (`fyp_grade.status`, `maintenance_job.status`, `integration_setting.status`) use VARCHAR because the value set is still moving.

## Items to highlight when written up

- Correct migration count: **30 scripts**, V1–V28 + V30 + V31 (V29 deliberately skipped)
- Correct table count: **36 tables** + `flyway_schema_history`
- Correct ORM count: **36 entities**, **35 repositories**
- `ddl-auto: validate` is the binding contract; V21 is the example
- Drop the `plagiarism_score` reference (V31 removed it)
- Fix `chat_message.sender` documentation to `'user'` / `'assistant'` (not `USER` / `BOT`)
- Add the seven new tables that did not exist in the prior 5.4: `fyp_grade`, `password_reset_token`, `push_subscription`, `approved_student_roster`, `approved_supervisor_roster`, `announcement_attachment`, `announcement_link`, `deadline_reminder_log`
- Add the V15+ column additions: `project.fyp1_passed`, `project_title NULL`, project UNIQUE constraint, `user_account.login_attempts`/`lockout_until`, `chat_message.feedback`/`feedback_at`, `announcement_audience.target_student_user_id`
- Mention the V16/V18 supervisor_topic reversal as a design-history record
- ENUM vs VARCHAR rationale (stable workflow states vs moving value sets)
- Cascade policy: dependent rows cascade, reference-only FKs do not
- JSON-in-TEXT idiom for evolving but stable-shaped data
- Idempotent reminder log composite PK
- Pre-authorisation rosters for auto-approved registration
- Migration files double as design documentation (descriptive names, in-file comments explaining intent and gotchas)
