# FYP1 Examiner Q&A - System Requirements

## AI-Powered FYP Supervision Management System
**Comprehensive Preparation for Examiner Questions**

---

## Table of Contents

1. [Use Case & Actor Questions](#1-use-case--actor-questions)
2. [Database Design Questions](#2-database-design-questions)
3. [Data Dictionary Questions](#3-data-dictionary-questions)
4. [System Architecture Questions](#4-system-architecture-questions)
5. [Screen Design Questions](#5-screen-design-questions)
6. [Functional Requirements Questions](#6-functional-requirements-questions)
7. [Non-Functional Requirements Questions](#7-non-functional-requirements-questions)
8. [AI Features Questions](#8-ai-features-questions)
9. [Security & Authentication Questions](#9-security--authentication-questions)
10. [Workflow & Process Questions](#10-workflow--process-questions)

---

## 1. Use Case & Actor Questions

### Q1.1: "How many use cases does your system have?"

**Answer:**
> "The system has **33 use cases** organized across 4 actors:
> - **Student**: 15 use cases (UC1-UC15)
> - **Supervisor**: 9 use cases (UC16-UC24)
> - **FYP Committee**: 6 use cases (UC25-UC30)
> - **System Administrator**: 3 use cases (UC31-UC33)
>
> These use cases cover the complete FYP supervision lifecycle from student registration to final project completion."

---

### Q1.2: "What are the 4 actors and their responsibilities?"

**Answer:**
> "The system has 4 distinct actors:
>
> 1. **Student** - The primary user who:
>    - Submits FYP proposals and documents
>    - Requests supervisors using AI recommendations
>    - Schedules meetings and submits meeting logs
>    - Tracks project progress and milestones
>
> 2. **Supervisor** - Academic staff who:
>    - Reviews and responds to supervision requests
>    - Reviews student proposals and provides feedback
>    - Conducts and manages supervision meetings
>    - Signs and validates meeting logs
>
> 3. **FYP Committee** - Administrative body that:
>    - Publishes faculty-wide announcements
>    - Reviews and approves proposals at faculty level
>    - Monitors all FYP projects
>    - Generates reports and exports data
>
> 4. **System Administrator** - Technical administrator who:
>    - Manages user accounts and roles
>    - Configures system parameters
>    - Manages FYP cycles and deadlines"

---

### Q1.3: "Explain UC9 - Request Supervisor. How does the AI recommendation work?"

**Answer:**
> "UC9 - Request Supervisor has two pathways:
>
> 1. **Manual Selection**: Students can browse available supervisors, view their profiles, research areas, and current workload, then send a request directly.
>
> 2. **AI-Powered Recommendation**: The system uses Natural Language Processing to:
>    - Analyze the student's project title, description, and keywords
>    - Match against supervisor research areas and expertise
>    - Consider supervisor availability (current load vs. capacity)
>    - Generate a ranked list of recommended supervisors with match scores
>
> The AI recommendation helps students find suitable supervisors even if they don't know all faculty members' expertise areas. It uses semantic similarity rather than just keyword matching."

---

### Q1.4: "What is UC12 - Manage Meeting Log? Why is it important?"

**Answer:**
> "UC12 allows students to create and manage MMU FCI Meeting Logs - the official supervision record format.
>
> **Importance:**
> - Required documentation for FYP assessment
> - Proves supervision sessions occurred
> - Records progress, problems, and action items
> - Requires dual digital signatures (student + supervisor)
> - Creates an auditable trail of supervision activity
>
> **The log includes:**
> - 6 task categories (Planning, Literature Review, Requirements, Design, Prototype, Draft Report)
> - Work done and work to be done sections
> - Problems faced and solutions
> - Supervisor comments
> - SHA-256 verified digital signatures
>
> This replaces the paper-based log system with a secure, digital workflow."

---

### Q1.5: "How does UC19-UC21 handle the proposal and meeting log review workflow?"

**Answer:**
> "There's a structured approval workflow:
>
> **Proposal Review (UC19):**
> 1. Student submits proposal → Status: SUBMITTED
> 2. Supervisor reviews → Can: Approve, Request Revision, or Reject
> 3. If approved by supervisor → Goes to FYP Committee (UC27)
> 4. Committee gives final approval → Status: APPROVED
>
> **Meeting Log Review (UC21):**
> 1. Student creates log → Status: DRAFT
> 2. Student submits → Status: SUBMITTED
> 3. Supervisor reviews, adds comments
> 4. Supervisor can: Sign OR Request Correction
> 5. If signed by supervisor → Status: SUPERVISOR_SIGNED
> 6. Student counter-signs → Status: LOCKED (immutable)
>
> Both workflows ensure quality control through mandatory review steps."

---

### Q1.6: "What's the difference between UC25 and UC24?"

**Answer:**
> "These serve different audiences:
>
> - **UC24 (Supervisor - Publish Announcements)**: Supervisors can publish announcements visible only to their supervisees. Used for group-specific notices, deadline reminders, or instructions.
>
> - **UC25 (FYP Committee - Publish Announcements)**: Committee publishes faculty-wide announcements visible to ALL students and supervisors. Used for official notices, submission deadlines, presentation schedules.
>
> This creates a hierarchy: Committee → Faculty-wide, Supervisor → Their students only."

---

### Q1.7: "Does your system support FYP1 and FYP2?"

**Answer:**
> "Yes, the system fully supports both phases:
>
> - **FYP1**: Focus on proposal development, literature review, requirements analysis
> - **FYP2**: Focus on implementation, testing, final documentation
>
> Each student has a `fypPhase` field (FYP1 or FYP2) that:
> - Determines which milestones are shown
> - Affects document submission requirements
> - Is recorded in meeting logs
> - Influences deadline calculations
>
> Students transition from FYP1 to FYP2 after completing FYP1 requirements."

---

## 2. Database Design Questions

### Q2.1: "How many tables does your database have?"

**Answer:**
> "The database has **24 tables** organized into logical groups:
>
> | Category | Tables |
> |----------|--------|
> | User Management | USER_ACCOUNT, STUDENT_PROFILE, SUPERVISOR_PROFILE, COMMITTEE_MEMBER |
> | Core FYP | PROJECT, PROPOSAL, SUPERVISION |
> | Meetings & Logs | MEETING, MEETING_LOG, MEETING_LOG_TASK, MEETING_LOG_SIGNATURE |
> | Workflows | SUPERVISION_REQUEST, MEETING_REQUEST |
> | Documents | FYP_DOCUMENT, DOCUMENT_FEEDBACK |
> | Communication | ANNOUNCEMENT, NOTIFICATION |
> | Admin | FYP_CYCLE, MILESTONE, AUDIT_LOG, SYSTEM_PARAMETER |
> | Supporting | SUPERVISOR_RESEARCH_AREA, MEETING_LOG_FILE |
>
> This design supports all 33 use cases with proper normalization."

---

### Q2.2: "Explain the relationship between USER_ACCOUNT and role-specific tables."

**Answer:**
> "We use a **shared primary key** pattern for role extension:
>
> ```
> USER_ACCOUNT (base table)
>     ├── STUDENT_PROFILE (1:1, shares user_id)
>     ├── SUPERVISOR_PROFILE (1:1, shares user_id)
>     └── COMMITTEE_MEMBER (1:1, shares user_id)
> ```
>
> **Design rationale:**
> - `USER_ACCOUNT` stores common attributes: email, password, role, status
> - Role-specific tables store specialized data
> - `STUDENT_PROFILE`: matric_no, programme, intake, cgpa
> - `SUPERVISOR_PROFILE`: department, expertise, max_supervisees
> - `COMMITTEE_MEMBER`: position, access_level
>
> This avoids nullable columns in a single table and supports clean role-based queries."

---

### Q2.3: "How does the MEETING_LOG support the MMU FCI format?"

**Answer:**
> "The meeting log is stored across 4 related tables:
>
> 1. **MEETING_LOG** - Core log data:
>    - meeting_date, meeting_number, meeting_mode (ONLINE/PHYSICAL)
>    - work_done_details, work_to_be_done, problems_solutions
>    - supervisor_comments
>    - status (DRAFT → SUBMITTED → SUPERVISOR_SIGNED → LOCKED)
>
> 2. **MEETING_LOG_TASK** - 6 task categories:
>    - PLANNING, LITERATURE_REVIEW, REQUIREMENT_ANALYSIS
>    - DESIGN_METHODOLOGY, PROTOTYPE_POC, DRAFT_REPORT
>    - Each has is_selected (boolean) and task_details (text)
>
> 3. **MEETING_LOG_SIGNATURE** - Digital signatures:
>    - signer_user_id, signer_role (STUDENT/SUPERVISOR)
>    - signature_image_path (PNG), signature_sha256 (verification hash)
>    - signed_at timestamp
>
> 4. **MEETING_LOG_FILE** - Exported PDFs:
>    - file_path, file_sha256, generated_at
>
> This fully captures the official MMU FCI Meeting Log format digitally."

---

### Q2.4: "Is your database normalized? What normal form?"

**Answer:**
> "Yes, the database is designed to **Third Normal Form (3NF)**:
>
> **1NF**: All tables have atomic values, no repeating groups
> - Example: Research areas stored in separate SUPERVISOR_RESEARCH_AREA table, not comma-separated
>
> **2NF**: All non-key attributes depend on the entire primary key
> - Example: MEETING_LOG_TASK has composite key (log_id, task_code)
>
> **3NF**: No transitive dependencies
> - Example: Student programme name is in STUDENT_PROFILE, not duplicated in PROJECT
>
> **Strategic denormalization**: Some fields like `project_title` are cached in MEETING_LOG for PDF generation efficiency, but the source of truth remains the PROJECT table."

---

### Q2.5: "How do you handle the supervision relationship?"

**Answer:**
> "The SUPERVISION table creates a many-to-many relationship:
>
> ```
> STUDENT_PROFILE ←→ SUPERVISION ←→ SUPERVISOR_PROFILE
> ```
>
> **SUPERVISION table structure:**
> - supervision_id (PK)
> - student_id (FK → STUDENT_PROFILE)
> - supervisor_id (FK → SUPERVISOR_PROFILE)
> - project_id (FK → PROJECT)
> - supervision_role: MAIN_SUPERVISOR or CO_SUPERVISOR
> - status: ACTIVE, COMPLETED, TERMINATED
> - start_date, end_date
>
> **This supports:**
> - Multiple supervisors per student (main + co-supervisor)
> - Historical tracking (completed supervisions)
> - Role differentiation
> - Project association"

---

### Q2.6: "What referential integrity constraints exist?"

**Answer:**
> "Key foreign key relationships include:
>
> | Child Table | Foreign Key | Parent Table | On Delete |
> |-------------|-------------|--------------|-----------|
> | STUDENT_PROFILE | user_id | USER_ACCOUNT | CASCADE |
> | PROJECT | student_id | STUDENT_PROFILE | RESTRICT |
> | MEETING_LOG | project_id | PROJECT | RESTRICT |
> | MEETING_LOG_TASK | log_id | MEETING_LOG | CASCADE |
> | MEETING_LOG_SIGNATURE | log_id | MEETING_LOG | CASCADE |
> | SUPERVISION_REQUEST | student_id | STUDENT_PROFILE | CASCADE |
> | SUPERVISION_REQUEST | supervisor_id | SUPERVISOR_PROFILE | CASCADE |
>
> **Design decisions:**
> - CASCADE for dependent data (signatures with logs)
> - RESTRICT for important data (can't delete student with active project)
> - This prevents orphaned records and maintains data integrity."

---

### Q2.7: "How do you track changes to important records?"

**Answer:**
> "We use the AUDIT_LOG table for comprehensive tracking:
>
> **AUDIT_LOG structure:**
> - log_id, user_id (who made the change)
> - entity_type (MEETING_LOG, PROPOSAL, etc.)
> - entity_id (record identifier)
> - action_type (CREATE, UPDATE, DELETE, SIGN)
> - old_values, new_values (JSON diff)
> - ip_address, timestamp
>
> **Key audited actions:**
> - Signature additions (immutable once added)
> - Status transitions
> - Proposal submissions/approvals
> - User role changes
>
> This supports accountability and can help resolve disputes about when changes occurred."

---

## 3. Data Dictionary Questions

### Q3.1: "How many fields are in your database?"

**Answer:**
> "The database contains **169 fields** across 24 tables.
>
> **Largest tables by field count:**
> - STUDENT_PROFILE: 15 fields
> - SUPERVISOR_PROFILE: 12 fields
> - MEETING_LOG: 14 fields
> - PROJECT: 11 fields
>
> Each field has defined:
> - Data type and size
> - Constraints (PK, FK, NOT NULL, UNIQUE)
> - Default values where applicable
> - Example data for clarity"

---

### Q3.2: "What data types do you use for different purposes?"

**Answer:**
> "We use appropriate types for each use case:
>
> | Purpose | Data Type | Example |
> |---------|-----------|---------|
> | Primary Keys | BIGINT AUTO_INCREMENT | user_id, log_id |
> | Short Text | VARCHAR(50-100) | names, email |
> | Long Text | TEXT | descriptions, comments |
> | Dates | DATE | meeting_date |
> | Timestamps | TIMESTAMP | created_at |
> | Status Codes | ENUM | 'DRAFT','SUBMITTED','LOCKED' |
> | Boolean Flags | BOOLEAN | is_selected, is_read |
> | Currency/Decimal | DECIMAL(3,2) | CGPA (e.g., 3.75) |
> | Hash Values | CHAR(64) | SHA-256 hashes |
>
> ENUMs are used for fixed status values to ensure data integrity."

---

### Q3.3: "Give an example of a complete field definition."

**Answer:**
> "Here's the MEETING_LOG.status field:
>
> | Attribute | Value |
> |-----------|-------|
> | Field Name | status |
> | Data Type | ENUM |
> | Values | 'DRAFT','SUBMITTED','CORRECTION_REQUIRED','SUPERVISOR_SIGNED','LOCKED' |
> | Default | 'DRAFT' |
> | Nullable | NO |
> | Description | Current workflow status of the meeting log |
>
> **Valid transitions:**
> - DRAFT → SUBMITTED (student submits)
> - SUBMITTED → CORRECTION_REQUIRED (supervisor requests changes)
> - CORRECTION_REQUIRED → SUBMITTED (student resubmits)
> - SUBMITTED → SUPERVISOR_SIGNED (supervisor signs)
> - SUPERVISOR_SIGNED → LOCKED (student counter-signs)
>
> LOCKED is the final state and makes the record immutable."

---

### Q3.4: "How do you store signatures?"

**Answer:**
> "Signatures are stored in MEETING_LOG_SIGNATURE with:
>
> - **signature_image_path** (VARCHAR 500): Path to PNG file on server
> - **signature_sha256** (CHAR 64): Cryptographic hash of signature data
>
> **Why both?**
> - The image is for display in PDFs
> - The SHA-256 hash is for verification - if someone tries to swap the image, the hash won't match
>
> **Hash generation (frontend using Web Crypto API):**
> ```javascript
> const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
> const hashHex = Array.from(new Uint8Array(hashBuffer))
>   .map(b => b.toString(16).padStart(2, '0')).join('');
> ```
>
> This provides tamper-evidence for the digital signature."

---

## 4. System Architecture Questions

### Q4.1: "Describe your system architecture."

**Answer:**
> "The system uses a **3-layer architecture**:
>
> **Layer 1 - Client Layer:**
> - Web browsers (responsive design)
> - Future: Mobile apps
>
> **Layer 2 - Application Layer:**
> - **React SPA** (frontend): TypeScript, Tailwind CSS, TanStack Query
> - **Spring Boot** (backend): REST APIs, business logic, security
> - **Nginx**: Reverse proxy, static file serving, SSL termination
>
> **Layer 3 - Data & AI Layer:**
> - **MySQL 8.0**: Primary database
> - **Redis**: Session caching, rate limiting
> - **AI Microservices**: NLP for supervisor matching, document analysis
>
> **Communication:**
> - REST APIs (JSON over HTTPS)
> - JWT tokens for authentication
> - WebSocket for real-time notifications (future enhancement)"

---

### Q4.2: "Why did you choose React for frontend?"

**Answer:**
> "React was chosen for several reasons:
>
> 1. **Component-Based Architecture**: Reusable UI components (SignaturePad, MeetingLogForm, etc.)
> 2. **TypeScript Support**: Type safety reduces bugs, better IDE support
> 3. **Ecosystem**: Rich library ecosystem (TanStack Query, React Router, etc.)
> 4. **Performance**: Virtual DOM for efficient updates
> 5. **Team Familiarity**: Well-documented, large community
>
> **Key libraries used:**
> - TanStack Query: Server state management with caching
> - React Router: Client-side routing with lazy loading
> - Tailwind CSS: Utility-first styling
> - jspdf + html2canvas: PDF generation"

---

### Q4.3: "Why Spring Boot for backend?"

**Answer:**
> "Spring Boot is the planned backend framework because:
>
> 1. **Enterprise-Ready**: Built-in security, validation, transaction management
> 2. **JPA/Hibernate**: ORM for database operations
> 3. **Spring Security**: JWT authentication, role-based access control
> 4. **Maturity**: Well-tested, stable, extensive documentation
> 5. **University Ecosystem**: Common in Malaysian university projects
>
> **Note**: For FYP1, the backend is mocked in frontend. Spring Boot implementation is planned for FYP2.
>
> **Planned Spring Boot features:**
> - REST Controllers for all 33 use cases
> - Flyway for database migrations
> - Spring Security with JWT
> - Scheduled tasks for deadline reminders"

---

### Q4.4: "How do you handle authentication?"

**Answer:**
> "The system uses **JWT-based authentication**:
>
> **Login Flow:**
> 1. User submits email/password
> 2. Backend validates credentials against USER_ACCOUNT
> 3. Backend generates JWT containing: user_id, role, expiry
> 4. JWT stored in frontend (httpOnly cookie recommended)
>
> **Request Flow:**
> 1. Frontend includes JWT in Authorization header
> 2. Backend validates JWT signature and expiry
> 3. Role-based access control checks permissions
> 4. Request proceeds or returns 403 Forbidden
>
> **Role-Based Access:**
> - STUDENT: Access own data, submit requests
> - SUPERVISOR: Access supervisees' data, approve/sign
> - FYP_COMMITTEE: Access all projects, publish announcements
> - SYSTEM_ADMIN: Full system access"

---

### Q4.5: "How do AI microservices integrate?"

**Answer:**
> "AI features are implemented as separate microservices:
>
> **1. Supervisor Matching Service:**
> - Input: Project title, description, keywords
> - Process: NLP similarity matching with supervisor research areas
> - Output: Ranked list of supervisors with match scores
>
> **2. Document Analysis Service (planned):**
> - Input: Uploaded documents (proposals, reports)
> - Process: Structure checking, plagiarism detection
> - Output: Feedback suggestions
>
> **Integration Pattern:**
> - Main Spring Boot app calls AI services via REST
> - Responses cached in Redis to reduce repeated processing
> - Graceful fallback if AI service unavailable
>
> **Tech Stack (AI):**
> - Python FastAPI for API endpoints
> - Sentence Transformers for text embeddings
> - Scikit-learn for similarity calculations"

---

## 5. Screen Design Questions

### Q5.1: "How many screens does your system have?"

**Answer:**
> "The system has approximately **85 screens** across 4 portals:
>
> | Portal | Screens |
> |--------|---------|
> | Student Portal | ~25 screens |
> | Supervisor Portal | ~20 screens |
> | FYP Committee Portal | ~20 screens |
> | System Admin Portal | ~15 screens |
> | Common (Login, Settings) | ~5 screens |
>
> Each screen corresponds to specific use case flows and user tasks."

---

### Q5.2: "What is your screen naming convention?"

**Answer:**
> "Screens follow a consistent naming pattern:
>
> ```
> [Actor][Function][Action/State].tsx
> ```
>
> **Examples:**
> - `StudentDashboard.tsx` - Student's main dashboard
> - `MeetingLogCreate.tsx` - Create new meeting log
> - `MeetingLogDetail.tsx` - View meeting log details
> - `ProposalReview.tsx` - Supervisor reviewing proposal
> - `SuperviseeList.tsx` - List of supervisor's students
>
> **Route pattern:**
> ```
> /[role]/[resource]/[action]
> /student/meeting-logs/new
> /supervisor/proposals/:id/review
> ```"

---

### Q5.3: "Show me the student portal screen flow."

**Answer:**
> "The student portal has these main flows:
>
> **1. Dashboard Flow:**
> ```
> Dashboard → Quick Stats, Upcoming Meetings, Recent Activities
> ```
>
> **2. Proposal Flow:**
> ```
> Proposal Workspace → Edit Draft → Submit → View Feedback → Revise → Track Status
> ```
>
> **3. Supervisor Request Flow:**
> ```
> Supervisor List → View Profile → Send Request → Track Request Status
> ```
>
> **4. Meeting Flow:**
> ```
> Meeting List → View Details → Create Meeting Log → Submit Log → View Signed Log
> ```
>
> **5. Meeting Log Flow:**
> ```
> Log List → Create Log → Edit Draft → Submit → Wait for Supervisor → Counter-sign → View Locked Log
> ```
>
> **6. Document Flow:**
> ```
> Document List → Upload Document → View Feedback → Upload Revision
> ```"

---

### Q5.4: "How did you design the UI/UX?"

**Answer:**
> "The design follows several principles:
>
> **1. Consistency:**
> - Unified color scheme (primary blue, semantic colors for status)
> - Consistent component library (Button, Card, Badge, Input)
> - Same layout patterns across all portals
>
> **2. Clarity:**
> - Clear status indicators with color coding
> - Action buttons with appropriate prominence
> - Breadcrumbs for navigation context
>
> **3. Efficiency:**
> - Dashboard shows pending actions prominently
> - Quick actions for common tasks
> - Filters and search for long lists
>
> **4. Feedback:**
> - Loading states for all async operations
> - Toast notifications for actions
> - Error messages with recovery options
>
> **5. Accessibility:**
> - Semantic HTML elements
> - ARIA labels where needed
> - Keyboard navigation support"

---

## 6. Functional Requirements Questions

### Q6.1: "List the key functional requirements for students."

**Answer:**
> "**Student functional requirements:**
>
> | ID | Requirement | Use Case |
> |----|-------------|----------|
> | FR-S1 | Login with student credentials | UC1 |
> | FR-S2 | View and update personal profile | UC2 |
> | FR-S3 | Browse supervisor list with filters | UC9 |
> | FR-S4 | Get AI-powered supervisor recommendations | UC9 |
> | FR-S5 | Send supervision requests (max 3 pending) | UC9 |
> | FR-S6 | Create and edit FYP proposals | UC10 |
> | FR-S7 | Submit proposals for review | UC10 |
> | FR-S8 | View proposal feedback and revise | UC10 |
> | FR-S9 | Request supervision meetings | UC11 |
> | FR-S10 | Create MMU FCI meeting logs | UC12 |
> | FR-S11 | Submit meeting logs for supervisor review | UC12 |
> | FR-S12 | Sign meeting logs after supervisor approval | UC12 |
> | FR-S13 | Upload FYP documents | UC13 |
> | FR-S14 | View announcements | UC14 |
> | FR-S15 | Receive and manage notifications | UC15 |"

---

### Q6.2: "What are the supervisor functional requirements?"

**Answer:**
> "**Supervisor functional requirements:**
>
> | ID | Requirement | Use Case |
> |----|-------------|----------|
> | FR-V1 | View and respond to supervision requests | UC17 |
> | FR-V2 | Accept/reject requests with reasons | UC17 |
> | FR-V3 | View list of current supervisees | UC18 |
> | FR-V4 | Review student proposals section by section | UC19 |
> | FR-V5 | Approve proposals or request revisions | UC19 |
> | FR-V6 | Schedule supervision meetings | UC20 |
> | FR-V7 | View and respond to meeting requests | UC20 |
> | FR-V8 | Review submitted meeting logs | UC21 |
> | FR-V9 | Add comments to meeting logs | UC21 |
> | FR-V10 | Sign meeting logs with digital signature | UC21 |
> | FR-V11 | Request corrections on meeting logs | UC21 |
> | FR-V12 | Review student documents | UC23 |
> | FR-V13 | Provide document feedback | UC23 |
> | FR-V14 | Publish announcements to supervisees | UC24 |"

---

### Q6.3: "What is the maximum supervision capacity?"

**Answer:**
> "The system enforces supervision capacity limits:
>
> **Configuration:**
> - Each supervisor has `max_supervisees` field (default: 8)
> - Current load tracked in `current_supervisee_count`
>
> **Business rules:**
> - Students cannot send requests to supervisors at capacity
> - Supervisors can toggle `accepting_new_students` flag
> - Supervisors can adjust their capacity (within faculty limits)
> - System displays availability status (X/Y slots available)
>
> **Example:**
> If Dr. Ahmad has max_supervisees=8 and current_supervisee_count=6:
> - Displayed as: '6/8 students (2 slots available)'
> - Students can still send requests
> - When count reaches 8, no new requests accepted"

---

### Q6.4: "How many pending supervision requests can a student have?"

**Answer:**
> "Students are limited to **3 pending requests** at a time.
>
> **Rationale:**
> - Prevents students from spamming all supervisors
> - Ensures thoughtful supervisor selection
> - Reduces supervisor workload reviewing requests
>
> **Flow:**
> 1. Student has 3 pending requests
> 2. Cannot send more until one is resolved (accepted/rejected)
> 3. If rejected, slot opens for new request
> 4. If accepted, all other pending requests auto-withdrawn
>
> **Implementation:**
> ```sql
> SELECT COUNT(*) FROM SUPERVISION_REQUEST
> WHERE student_id = ? AND status = 'PENDING'
> -- Must be < 3 to allow new request
> ```"

---

### Q6.5: "What document types are supported?"

**Answer:**
> "The system supports multiple document categories:
>
> | Category | Types | Max Size |
> |----------|-------|----------|
> | Proposals | PDF, DOCX | 10MB |
> | Reports | PDF, DOCX | 20MB |
> | Presentations | PPTX, PDF | 50MB |
> | Source Code | ZIP | 100MB |
> | Meeting Logs | PDF (generated) | 2MB |
>
> **Document workflow:**
> 1. Student uploads document
> 2. Supervisor receives notification
> 3. Supervisor reviews and provides feedback
> 4. Student can upload revised version
> 5. Version history maintained
>
> **Storage:**
> - Files stored on server filesystem
> - Path stored in FYP_DOCUMENT.file_path
> - SHA-256 hash for integrity verification"

---

## 7. Non-Functional Requirements Questions

### Q7.1: "What are your performance requirements?"

**Answer:**
> "**Performance targets:**
>
> | Metric | Requirement |
> |--------|-------------|
> | Page Load Time | < 3 seconds |
> | API Response Time | < 500ms (90th percentile) |
> | PDF Generation | < 5 seconds |
> | Signature Capture | Real-time (< 16ms per frame) |
> | Concurrent Users | Support 200 concurrent |
> | Database Queries | < 100ms average |
>
> **Optimization strategies:**
> - React lazy loading for routes
> - TanStack Query caching (staleTime: 5 minutes)
> - Database indexing on frequently queried columns
> - CDN for static assets
> - Redis caching for session and frequent data"

---

### Q7.2: "How do you ensure security?"

**Answer:**
> "**Security measures:**
>
> **Authentication:**
> - BCrypt password hashing (cost factor 12)
> - JWT tokens with 1-hour expiry
> - Refresh token rotation
> - Account lockout after 5 failed attempts
>
> **Authorization:**
> - Role-based access control (RBAC)
> - Resource-level permissions (own data only)
> - API endpoint security annotations
>
> **Data Protection:**
> - HTTPS only (TLS 1.3)
> - SQL injection prevention (parameterized queries)
> - XSS prevention (React auto-escaping)
> - CSRF tokens for form submissions
>
> **Audit:**
> - All critical actions logged in AUDIT_LOG
> - IP address and timestamp recorded
> - Signature hash verification"

---

### Q7.3: "What about data backup and recovery?"

**Answer:**
> "**Backup strategy:**
>
> | Type | Frequency | Retention |
> |------|-----------|-----------|
> | Full Database | Daily | 30 days |
> | Transaction Logs | Hourly | 7 days |
> | File Uploads | Daily | 30 days |
> | Configuration | Weekly | 90 days |
>
> **Recovery objectives:**
> - RPO (Recovery Point Objective): 1 hour
> - RTO (Recovery Time Objective): 4 hours
>
> **Implementation:**
> - MySQL automated backups
> - File system snapshots
> - Off-site backup replication
> - Tested recovery procedures"

---

### Q7.4: "Is the system scalable?"

**Answer:**
> "**Scalability design:**
>
> **Horizontal scaling:**
> - Stateless API servers (can add more instances)
> - Session data in Redis (shared across instances)
> - Database read replicas for heavy queries
>
> **Vertical scaling:**
> - Optimized queries with proper indexing
> - Efficient caching strategies
> - Lazy loading and pagination
>
> **Capacity planning:**
> - Current: ~500 students/semester
> - Design target: 2000 students/semester
> - Architecture supports 10x growth with infrastructure scaling
>
> **Microservices approach:**
> - AI services can scale independently
> - PDF generation can be offloaded
> - Notification service can be queue-based"

---

### Q7.5: "What browsers do you support?"

**Answer:**
> "**Browser compatibility:**
>
> | Browser | Minimum Version |
> |---------|-----------------|
> | Chrome | 90+ |
> | Firefox | 88+ |
> | Safari | 14+ |
> | Edge | 90+ |
>
> **Key features requiring modern browsers:**
> - Web Crypto API (SHA-256 hashing)
> - Canvas API (signature capture)
> - CSS Grid/Flexbox (layout)
> - ES2020+ JavaScript features
>
> **Responsive design:**
> - Desktop: Full feature set
> - Tablet: Optimized layouts
> - Mobile: Read-focused (limited editing)
>
> **Testing:**
> - BrowserStack for cross-browser testing
> - Lighthouse for performance audits"

---

## 8. AI Features Questions

### Q8.1: "Explain how AI supervisor matching works."

**Answer:**
> "The AI matching system uses **semantic similarity**:
>
> **Step 1 - Data Preparation:**
> - Supervisor research areas stored as text vectors
> - Pre-computed embeddings using Sentence Transformers
>
> **Step 2 - Student Input:**
> - Project title, description, keywords combined
> - Converted to text embedding
>
> **Step 3 - Similarity Calculation:**
> - Cosine similarity between student and supervisor vectors
> - Score ranges 0-100%
>
> **Step 4 - Ranking:**
> - Supervisors ranked by match score
> - Filtered by availability (not at capacity)
> - Top 5 recommended to student
>
> **Example:**
> - Student project: 'Machine Learning for Stock Prediction'
> - Dr. Ahmad's areas: 'AI, Deep Learning, Financial Analytics'
> - Match score: 87%
> - Dr. Lee's areas: 'Networking, Security'
> - Match score: 12%"

---

### Q8.2: "What NLP techniques do you use?"

**Answer:**
> "**NLP pipeline:**
>
> 1. **Text Preprocessing:**
>    - Tokenization
>    - Stop word removal
>    - Lemmatization
>
> 2. **Embedding Generation:**
>    - Model: all-MiniLM-L6-v2 (Sentence Transformers)
>    - 384-dimensional vectors
>    - Pre-trained on large text corpus
>
> 3. **Similarity Metrics:**
>    - Cosine similarity for matching
>    - Weighted scoring with multiple factors
>
> 4. **Future enhancements:**
>    - Keyword extraction from proposals
>    - Document structure analysis
>    - Writing quality assessment"

---

### Q8.3: "Can the system work without AI features?"

**Answer:**
> "Yes, **AI is optional, not required**:
>
> **With AI disabled:**
> - Students browse supervisors manually
> - Filter by research area keywords
> - View supervisor profiles and availability
> - Send requests based on own research
>
> **Graceful degradation:**
> - If AI service is unavailable, system continues functioning
> - Manual browsing always available as fallback
> - Error message if AI recommendation fails
>
> **Configuration:**
> - SYSTEM_PARAMETER: ai_matching_enabled (boolean)
> - Can be toggled by administrator
> - Useful during maintenance or testing"

---

## 9. Security & Authentication Questions

### Q9.1: "How do you prevent unauthorized access to student data?"

**Answer:**
> "**Multi-layer protection:**
>
> **1. Authentication Layer:**
> - JWT verification on every request
> - Token expiry enforcement
> - Invalid token rejection
>
> **2. Authorization Layer:**
> - Role check (STUDENT, SUPERVISOR, etc.)
> - Resource ownership check
>
> **3. Query-Level Security:**
> ```java
> // Students can only access their own logs
> @Query('SELECT m FROM MeetingLog m WHERE m.studentId = :currentUserId')
> List<MeetingLog> findMyLogs(@Param('currentUserId') Long userId);
> ```
>
> **4. API Endpoint Security:**
> ```java
> @PreAuthorize('hasRole(\"SUPERVISOR\") and @securityService.isSupervising(#studentId)')
> public StudentData getStudentData(@PathVariable Long studentId) { ... }
> ```
>
> **Result:**
> - Supervisors only see their supervisees
> - Students only see their own data
> - Committee sees all (read-only for most)"

---

### Q9.2: "How are passwords stored?"

**Answer:**
> "Passwords use **BCrypt hashing**:
>
> **Storage:**
> - Never stored in plain text
> - BCrypt hash with cost factor 12
> - Salt automatically generated and included
>
> **Example:**
> ```
> Input: 'MyP@ssw0rd123'
> Stored: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/...'
> ```
>
> **Verification:**
> ```java
> BCrypt.checkpw(submittedPassword, storedHash)
> ```
>
> **Password policy:**
> - Minimum 8 characters
> - At least 1 uppercase, 1 lowercase, 1 number
> - No password reuse (last 5 passwords)
> - Force reset after 90 days (optional)"

---

### Q9.3: "How do you ensure meeting log integrity?"

**Answer:**
> "**Multiple integrity mechanisms:**
>
> **1. Signature Hash:**
> - SHA-256 hash of signature image data
> - Stored alongside signature image
> - Any tampering changes the hash
>
> **2. Immutable Status:**
> - Once LOCKED, record cannot be modified
> - Database trigger prevents updates
>
> **3. Audit Trail:**
> - All changes logged with timestamp
> - User ID and IP address recorded
> - Old and new values stored
>
> **4. Version Control:**
> - Log revision history maintained
> - Each submission creates new version
>
> **Verification process:**
> ```javascript
> function verifySignature(signature) {
>   const computedHash = sha256(signature.imageData);
>   return computedHash === signature.storedHash;
> }
> ```"

---

## 10. Workflow & Process Questions

### Q10.1: "Describe the complete proposal submission workflow."

**Answer:**
> "**Proposal lifecycle:**
>
> ```
> [DRAFT] Student creates proposal
>     ↓
> [SUBMITTED] Student submits for review
>     ↓
> [UNDER_REVIEW] Supervisor reviewing
>     ↓
>     ├── [REVISION_REQUIRED] Supervisor requests changes
>     │       ↓
>     │   [REVISED] Student makes changes
>     │       ↓
>     │   Back to [UNDER_REVIEW]
>     │
>     └── [APPROVED_BY_SUPERVISOR] Supervisor approves
>             ↓
>         [COMMITTEE_REVIEW] FYP Committee reviewing
>             ↓
>             ├── [COMMITTEE_REVISION] Committee requests changes
>             │       ↓
>             │   Back to revision cycle
>             │
>             └── [APPROVED] Final approval
>                     ↓
>                 Project registered
> ```
>
> **Key rules:**
> - Cannot skip supervisor to go directly to committee
> - Maximum 3 revision cycles before escalation
> - 7-day deadline for each review step"

---

### Q10.2: "Explain the meeting log signing workflow."

**Answer:**
> "**Meeting log dual-signature workflow:**
>
> ```
> [DRAFT] Student creates log
>     │
>     └── Student can edit freely
>             ↓
> [SUBMITTED] Student submits for supervisor review
>     │
>     └── Student cannot edit
>             ↓
> Supervisor reviews and adds comments
>     ↓
>     ├── [CORRECTION_REQUIRED] Supervisor requests changes
>     │       ↓
>     │   Student makes corrections → Back to [SUBMITTED]
>     │
>     └── Supervisor signs
>             ↓
> [SUPERVISOR_SIGNED] Awaiting student signature
>     │
>     └── Supervisor's signature locked
>             ↓
> Student reviews and counter-signs
>     ↓
> [LOCKED] Log is immutable
>     │
>     └── PDF can be exported
> ```
>
> **Signature sequence matters:**
> 1. Supervisor signs first (validates content)
> 2. Student counter-signs (acknowledges agreement)
> 3. Both signatures required for locked status"

---

### Q10.3: "What happens if a supervisor rejects a request?"

**Answer:**
> "**Rejection handling:**
>
> **Immediate effects:**
> 1. Request status → REJECTED
> 2. Student notified via email and in-app notification
> 3. Rejection reason displayed to student
> 4. Pending request count decremented (can send new request)
>
> **Student options:**
> 1. Improve proposal and request same supervisor again
> 2. Request a different supervisor
> 3. Use AI recommendation for alternatives
>
> **Data retention:**
> - Rejected requests kept for 90 days
> - Helps track patterns
> - Student can view rejection history
>
> **Supervisor view:**
> - Rejected requests moved to 'Handled' tab
> - Can see student's revised requests later"

---

### Q10.4: "How does the notification system work?"

**Answer:**
> "**Notification architecture:**
>
> **Trigger events:**
> | Event | Recipients |
> |-------|------------|
> | New supervision request | Supervisor |
> | Request accepted/rejected | Student |
> | Meeting log submitted | Supervisor |
> | Supervisor signed log | Student |
> | Proposal status change | Student |
> | New announcement | All targeted users |
> | Upcoming deadline | Affected students |
>
> **Delivery channels:**
> 1. In-app notifications (real-time)
> 2. Email notifications (configurable)
>
> **Notification table:**
> - notification_id, user_id, type, title, message
> - is_read, created_at
> - related_entity_type, related_entity_id
>
> **User preferences:**
> - Email frequency: Immediate / Daily digest / Weekly
> - Per-category toggles"

---

### Q10.5: "How do FYP cycles work?"

**Answer:**
> "**FYP Cycle management:**
>
> **Cycle structure:**
> - Academic year (e.g., 2024/2025)
> - Semester (1 or 2)
> - Start and end dates
> - Associated milestones
>
> **Milestones per cycle:**
> | FYP1 Milestones | FYP2 Milestones |
> |-----------------|-----------------|
> | Proposal submission | Progress report |
> | Supervisor assignment | Implementation |
> | Proposal defense | Final report |
> | | Final presentation |
>
> **System behavior:**
> - Active cycle determines current students
> - Deadlines calculated from cycle dates
> - Reports filtered by cycle
> - Historical data preserved across cycles
>
> **Admin controls:**
> - Create new cycles
> - Set milestone dates
> - Activate/deactivate cycles
> - Migrate students between cycles"

---

## Quick Reference Summary

### System Statistics
| Metric | Count |
|--------|-------|
| Use Cases | 33 |
| Database Tables | 24 |
| Database Fields | 169 |
| Screen Count | ~85 |
| Actor Types | 4 |

### Key Design Decisions
1. **Frontend-First**: React SPA with mock data for FYP1
2. **3NF Database**: Properly normalized with strategic denormalization
3. **JWT Auth**: Stateless authentication with role-based access
4. **Digital Signatures**: Canvas capture + SHA-256 verification
5. **AI Optional**: System works without AI features

### Technologies
| Layer | Technology |
|-------|------------|
| Frontend | React, TypeScript, Tailwind CSS |
| Backend (planned) | Spring Boot, Java |
| Database | MySQL 8.0 |
| Cache | Redis |
| AI | Python, Sentence Transformers |

---

*Document prepared for FYP1 Presentation - Requirements Q&A*
*Last updated: [Date]*
