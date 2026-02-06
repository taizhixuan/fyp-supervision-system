```mermaid

erDiagram

  USER_ACCOUNT {
    BIGINT user_id PK
    VARCHAR mmu_id UK
    VARCHAR email
    VARCHAR full_name
    VARCHAR phone
    VARCHAR role
    VARCHAR status
    DATETIME last_login_at
    DATETIME created_at
    DATETIME updated_at
  }

  STUDENT_PROFILE {
    BIGINT user_id PK
    VARCHAR programme
    VARCHAR specialisation
    DECIMAL cgpa
    VARCHAR fyp_status
    TEXT interests
    DATETIME updated_at
  }

  SUPERVISOR_PROFILE {
    BIGINT user_id PK
    TEXT research_areas
    INT supervision_quota
    INT current_load
    VARCHAR availability_status
    TEXT preferred_project_types
    DATETIME updated_at
  }

  FYP_CYCLE {
    BIGINT cycle_id PK
    VARCHAR cycle_code
    DATE start_date
    DATE end_date
    VARCHAR status
  }

  SUPERVISOR_REQUEST {
    BIGINT request_id PK
    BIGINT student_user_id FK
    BIGINT supervisor_user_id FK
    TEXT topic_summary
    TEXT message
    VARCHAR status
    DATETIME submitted_at
    DATETIME responded_at
  }

  PROJECT {
    BIGINT project_id PK
    BIGINT cycle_id FK
    BIGINT student_user_id FK
    BIGINT supervisor_user_id FK
    VARCHAR project_title
    VARCHAR specialisation
    VARCHAR category
    VARCHAR stage
    VARCHAR status
    DATETIME registered_at
    DATETIME updated_at
  }

  PROPOSAL {
    BIGINT proposal_id PK
    BIGINT project_id FK
    BIGINT student_user_id FK
    BIGINT supervisor_user_id FK
    VARCHAR status
    DATETIME created_at
    DATETIME updated_at
  }

  PROPOSAL_VERSION {
    BIGINT version_id PK
    BIGINT proposal_id FK
    INT version_no
    TEXT content_text
    VARCHAR upload_file_path
    DATETIME created_at
  }

  PROPOSAL_CHECK_RESULT {
    BIGINT check_id PK
    BIGINT version_id FK
    INT overall_score
    TEXT issues_summary
    TEXT missing_sections
    TEXT suggested_improvements
    DATETIME checked_at
  }

  PROPOSAL_REVIEW {
    BIGINT review_id PK
    BIGINT proposal_id FK
    BIGINT reviewer_user_id FK
    VARCHAR reviewer_role
    VARCHAR decision
    TEXT remarks
    DATETIME reviewed_at
  }

  MEETING {
    BIGINT meeting_id PK
    BIGINT project_id FK
    BIGINT requested_by_student_user_id FK
    DATETIME proposed_start_at
    DATETIME proposed_end_at
    VARCHAR platform
    TEXT agenda
    VARCHAR status
    DATETIME confirmed_start_at
    DATETIME confirmed_end_at
    DATETIME updated_at
  }

  MEETING_LOG {
    BIGINT log_id PK
    BIGINT meeting_id FK
    BIGINT project_id FK
    TEXT discussion_summary
    TEXT action_items
    DATE next_meeting_date
    TEXT supervisor_comments
    VARCHAR status
    DATETIME submitted_at
    DATETIME locked_at
  }

  MEETING_LOG_SIGNATURE {
    BIGINT signature_id PK
    BIGINT log_id FK
    BIGINT signer_user_id FK
    VARCHAR signer_role
    DATETIME signed_at
  }

  PROJECT_DOCUMENT {
    BIGINT document_id PK
    BIGINT project_id FK
    BIGINT uploaded_by_user_id FK
    VARCHAR doc_type
    VARCHAR phase
    INT version_no
    VARCHAR file_name
    VARCHAR storage_path
    DATETIME uploaded_at
  }

  RESOURCE_DOCUMENT {
    BIGINT resource_id PK
    BIGINT uploaded_by_admin_user_id FK
    VARCHAR category
    VARCHAR title
    VARCHAR storage_path
    VARCHAR visibility
    BOOLEAN is_active
    DATETIME published_at
  }

  DEADLINE {
    BIGINT deadline_id PK
    BIGINT cycle_id FK
    VARCHAR title
    DATE due_date
    VARCHAR audience
    TEXT notes
  }

  ANNOUNCEMENT {
    BIGINT announcement_id PK
    BIGINT created_by_user_id FK
    VARCHAR scope
    VARCHAR title
    TEXT content
    DATETIME publish_at
    DATETIME created_at
  }

  ANNOUNCEMENT_AUDIENCE {
    BIGINT audience_id PK
    BIGINT announcement_id FK
    BIGINT target_supervisor_user_id FK
  }

  NOTIFICATION {
    BIGINT notification_id PK
    BIGINT user_id FK
    VARCHAR type
    VARCHAR title
    TEXT message
    DATETIME created_at
    DATETIME read_at
  }

  CHAT_SESSION {
    BIGINT session_id PK
    BIGINT user_id FK
    DATETIME started_at
    DATETIME ended_at
  }

  CHAT_MESSAGE {
    BIGINT message_id PK
    BIGINT session_id FK
    VARCHAR sender
    TEXT content
    DECIMAL confidence_score
    DATETIME sent_at
  }

  SYSTEM_PARAMETER {
    BIGINT param_id PK
    VARCHAR param_key UK
    VARCHAR param_value
    BIGINT updated_by_user_id FK
    DATETIME updated_at
  }

  INTEGRATION_SETTING {
    BIGINT integration_id PK
    VARCHAR name
    VARCHAR endpoint_url
    VARCHAR status
    BIGINT updated_by_user_id FK
    DATETIME updated_at
  }

  AUDIT_LOG {
    BIGINT audit_id PK
    BIGINT user_id FK
    VARCHAR action
    VARCHAR entity_name
    BIGINT entity_id
    DATETIME created_at
    TEXT details
  }

    %% Relationships (Crow's Foot)

  %% User and role profiles (optional one-to-one)
  USER_ACCOUNT ||--o| STUDENT_PROFILE : has
  USER_ACCOUNT ||--o| SUPERVISOR_PROFILE : has

  %% Cycle and project (one cycle has many projects)
  FYP_CYCLE ||--o{ PROJECT : contains

  %% Student and supervisor linked to projects (one student/supervisor can have many projects)
  STUDENT_PROFILE ||--o{ PROJECT : owns
  SUPERVISOR_PROFILE ||--o{ PROJECT : supervises

  %% Supervisor requests (student submits, supervisor receives)
  STUDENT_PROFILE ||--o{ SUPERVISOR_REQUEST : submits
  SUPERVISOR_PROFILE ||--o{ SUPERVISOR_REQUEST : receives

  %% Proposal workflow
  PROJECT ||--o{ PROPOSAL : has
  PROPOSAL ||--o{ PROPOSAL_VERSION : versions
  PROPOSAL_VERSION ||--o{ PROPOSAL_CHECK_RESULT : produces

  %% Proposal reviews (a proposal can have many reviews; a user can perform many reviews)
  PROPOSAL ||--o{ PROPOSAL_REVIEW : has
  USER_ACCOUNT ||--o{ PROPOSAL_REVIEW : performs

  %% Meetings and logs
  PROJECT ||--o{ MEETING : schedules
  MEETING ||--|| MEETING_LOG : records
  MEETING_LOG ||--o{ MEETING_LOG_SIGNATURE : has
  USER_ACCOUNT ||--o{ MEETING_LOG_SIGNATURE : signs

  %% Project documents
  PROJECT ||--o{ PROJECT_DOCUMENT : stores
  USER_ACCOUNT ||--o{ PROJECT_DOCUMENT : uploads

  %% Resources and deadlines
  USER_ACCOUNT ||--o{ RESOURCE_DOCUMENT : publishes
  FYP_CYCLE ||--o{ DEADLINE : defines

  %% Announcements
  USER_ACCOUNT ||--o{ ANNOUNCEMENT : creates
  ANNOUNCEMENT ||--o{ ANNOUNCEMENT_AUDIENCE : targets
  SUPERVISOR_PROFILE ||--o{ ANNOUNCEMENT_AUDIENCE : addressed_to

  %% Notifications
  USER_ACCOUNT ||--o{ NOTIFICATION : receives

  %% Chatbot sessions and messages
  USER_ACCOUNT ||--o{ CHAT_SESSION : starts
  CHAT_SESSION ||--o{ CHAT_MESSAGE : contains

  %% System configuration
  USER_ACCOUNT ||--o{ SYSTEM_PARAMETER : updates
  USER_ACCOUNT ||--o{ INTEGRATION_SETTING : updates

  %% Audit logging
  USER_ACCOUNT ||--o{ AUDIT_LOG : causes
  ```
  
