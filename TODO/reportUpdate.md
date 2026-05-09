# Task: Update FYP report to reflect registration validation implementation

## Context
The FYP Supervision System backend was just updated with three new registration validation layers:
1. Email OTP verification (with EMAIL_VERIFICATION table)
2. Pre-imported MMU roster check (with MMU_ROSTER table)
3. Admin approval fallback for Supervisor accounts (new USER status values)

The report (Chapters 3 and 4) was written before these features and needs to be updated so the design documentation matches the implementation.

## Files to update
- /report/Chapter3-Requirements.md     (UC1, UC30)
- /report/Chapter4-Design.md           (sequence diagram, ERD description)
- /report/Data-Dictionary-Report.md    (add two tables, update USER.status)
- /report/diagrams/registration-sequence.mmd   (Mermaid source for sequence diagram)
- /report/diagrams/erd.mmd                     (Mermaid source for ERD)

## Constraints
- Do NOT create new use cases. Extend UC1 and UC30 only.
- Match the existing tone, formatting, and table style of each file. Pull the style from surrounding sections.
- Academic register, slight ESL-academic feel, vary sentence rhythm. Avoid AI-sounding phrases like "leverage", "seamlessly", "robust", "comprehensive solution".
- Do not invent new fields. Use exactly the schema below.
- Preserve existing markdown structure (headings, table syntax, mark/highlight tags if used).

## What to change

### 1. Data-Dictionary-Report.md
Add two new table sections in the same format as the existing entries.

EMAIL_VERIFICATION fields:
- verification_id BIGINT PK
- user_id BIGINT FK → USER.user_id
- email VARCHAR(150)
- otp_hash VARCHAR(255)  (BCrypt hash)
- expires_at DATETIME
- attempts INT default 0
- is_used BOOLEAN default false
- created_at DATETIME

MMU_ROSTER fields:
- roster_id BIGINT PK
- mmu_id VARCHAR(20) UNIQUE
- full_name VARCHAR(150)
- role VARCHAR(20) enum: STUDENT, SUPERVISOR
- email VARCHAR(150) nullable
- intake VARCHAR(20) nullable
- is_active BOOLEAN default true
- imported_at DATETIME
- imported_by BIGINT FK → USER.user_id

Also update the USER table entry: the `status` field must include the new values PENDING_VERIFICATION and PENDING_APPROVAL alongside the existing ACTIVE, INACTIVE, SUSPENDED.

### 2. Chapter3-Requirements.md — UC1 (Register and Log In)

Update the existing UC1 table. Specifically:
- Pre-condition: add that the MMU ID must be present in the active MMU roster
- Postcondition: distinguish Student (ACTIVE) vs Supervisor (PENDING_APPROVAL) outcomes
- Basic Path: replace with the 9-step flow that includes roster validation, OTP send, OTP verification, role-based status assignment, and login
- Alternative Path: add A5 (supervisor pending approval blocks login) and A6 (resend OTP with cooldown)
- Exceptional Path: add E4 (roster mismatch), E5 (OTP expired or attempts exhausted), E6 (email gateway unavailable rolls back account creation)

Do NOT create UC34 or any new use case.

### 3. Chapter3-Requirements.md — UC30 (Manage User Accounts and Roles)

Extend the existing UC30 by appending:
- Description: include managing the MMU roster import, and reviewing supervisor accounts in PENDING_APPROVAL
- Basic Path: add steps for importing the roster CSV, and approving or rejecting supervisor accounts (with reason)
- Alternative Path: re-importing roster deactivates previous entries; rejection requires a reason that is stored and emailed
- Exceptional Path: malformed CSV or duplicate IDs aborts the import with row-level error report

### 4. Chapter4-Design.md — Sequence diagram for registration

Replace the current registration sequence diagram. Use Mermaid syntax in /report/diagrams/registration-sequence.mmd.

Lifelines: User, WebUI, AuthController, RosterService, UserRepository, OtpService, MailService, Database, EmailGateway

Flow: form submit → roster validation → create user as PENDING_VERIFICATION → generate and store OTP → send via email gateway. Then verification: enter OTP → check expiry/attempts → on success, Student becomes ACTIVE, Supervisor becomes PENDING_APPROVAL with a notification to the FYP Committee.

Use Mermaid `alt` blocks for the roster mismatch case and the role-based status branching at the end.

In Chapter4-Design.md itself, replace the embedded image reference with a reference to the new diagram, and add 2-3 sentences below the diagram that walk the reader through the main path.

### 5. Chapter4-Design.md — ERD update

Update /report/diagrams/erd.mmd (Mermaid erDiagram syntax) to add:
- EMAIL_VERIFICATION entity with all fields above
- MMU_ROSTER entity with all fields above
- Relationship: USER ||--o{ EMAIL_VERIFICATION (one user has zero-or-many OTP records over time)
- MMU_ROSTER has no FK relationship to USER. Mention this explicitly in the surrounding paragraph in Chapter4-Design.md so it doesn't look like an oversight — it's a reference table consulted during registration, not joined.

Also update the USER entity in the ERD to reflect the expanded status enum.

## Acceptance criteria
- All five files updated with no broken markdown.
- UC1 and UC30 read consistently with each other and with the data dictionary field names.
- Mermaid diagrams render without syntax errors (verify by parsing).
- No new use case sections created.
- Tone matches surrounding text in each file (run a quick check of the sentence style of nearby paragraphs and stay close to that).
- A short changelog at the top of each file or in a CHANGES.md noting which sections were modified and why.

## Order of work
1. Update Data-Dictionary-Report.md first (source of truth for field names)
2. Update Mermaid diagrams (depends on field names)
3. Update Chapter4-Design.md prose around the diagrams
4. Update Chapter3-Requirements.md (UC1 and UC30)
5. Final pass: cross-check that every field name and status value mentioned in UC1, UC30, sequence diagram, and ERD matches the data dictionary exactly.

Start by listing the exact lines or sections you will modify in each file, then make the edits one file at a time. Pause after each file and show me the diff before moving on.
