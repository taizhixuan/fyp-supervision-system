# Task: Implement registration validation layers for FYP Supervision System

The system has four roles: STUDENT, SUPERVISOR, FYP_COMMITTEE, SYSADMIN.
Only STUDENT and SUPERVISOR can self-register. The other two are created by SYSADMIN.

The User entity already exists with at least these fields:
user_id, mmu_id, full_name, email, phone, password_hash, role, status, created_at.
The `status` field currently supports: ACTIVE, INACTIVE, SUSPENDED.

## What to build

Implement THREE registration validation layers on top of the existing register endpoint:

### Layer 1: Email OTP verification (for both Student and Supervisor)
- Add new user status values: PENDING_VERIFICATION, PENDING_APPROVAL
- After form submission, create user with status = PENDING_VERIFICATION
- Generate a 6-digit numeric OTP, hash it with BCrypt before storing
- OTP expires in 10 minutes, max 5 verification attempts
- Send OTP via Spring Mail (SMTP config from application.properties)
- Email template: simple HTML with the code, MMU FYP System branding, expiry notice
- Sender display name: "FYP Supervision System (no-reply)"
- New endpoint POST /api/auth/verify-otp with body { email, otp }
- New endpoint POST /api/auth/resend-otp with body { email } (rate limit: 1 request per 60 seconds per email)
- On successful verification:
    - If role = STUDENT → set status = ACTIVE
    - If role = SUPERVISOR → set status = PENDING_APPROVAL (Layer 3 takes over)

### Layer 2: Pre-imported MMU roster check
- New entity MmuRoster with fields:
  roster_id (PK), mmu_id (unique), full_name, role (STUDENT/SUPERVISOR),
  email (nullable), intake (nullable), is_active, imported_at, imported_by (FK to user)
- New admin-only endpoint POST /api/admin/roster/import
    - Accepts a CSV upload (multipart/form-data)
    - CSV columns: mmu_id, full_name, role, email, intake
    - Use OpenCSV for parsing
    - Strategy: deactivate all existing rows, then insert/update from CSV (upsert by mmu_id)
    - Return summary: total rows, inserted, updated, skipped (with reasons)
- New admin endpoint GET /api/admin/roster?role=&search=&page=&size= for the admin UI
- During registration, BEFORE creating the user, validate against roster:
    - mmu_id must exist with is_active = true
    - role on form must match role in roster
    - if roster.email is not null, it must match the submitted email (case-insensitive)
    - On any mismatch, return clear error message; do NOT create the user
- Provide a sample seed CSV at src/main/resources/seed/sample-roster.csv with ~10 mock students and ~5 mock supervisors

### Layer 3: Admin approval fallback for Supervisors
- After OTP verification, supervisor accounts go to status = PENDING_APPROVAL
- Supervisor cannot log in while in this status — login endpoint must reject with a specific error: "Your account is awaiting committee approval."
- New endpoints for FYP_COMMITTEE and SYSADMIN roles:
    - GET /api/admin/supervisor-approvals?status=PENDING_APPROVAL&page=&size=
    - POST /api/admin/supervisor-approvals/{userId}/approve
    - POST /api/admin/supervisor-approvals/{userId}/reject  (body: { reason })
- Approval action: status → ACTIVE, send notification email to supervisor
- Rejection action: status → INACTIVE, store rejection reason in a new column or audit log, send notification email
- Students skip this layer entirely — they go from PENDING_VERIFICATION straight to ACTIVE

## Files to create or modify

### Backend (Java)
- entity: User.java (update status enum), EmailVerification.java (new), MmuRoster.java (new)
- repository: EmailVerificationRepository, MmuRosterRepository
- service: AuthService (update register flow), OtpService, MailService, RosterService, SupervisorApprovalService
- controller: AuthController (update), OtpController, AdminRosterController, AdminApprovalController
- dto: RegisterRequest, OtpRequest, ResendOtpRequest, RosterImportResult, ApprovalRequest
- config: MailConfig, SecurityConfig (update endpoint authorization)
- exception: handle custom exceptions (RosterMismatchException, OtpExpiredException, etc.) with @RestControllerAdvice
- migration: Flyway script V2__add_otp_and_roster.sql with the new tables and status enum values

### Frontend (React)
- pages/Register.jsx — already exists, update to redirect to OTP page after submit
- pages/VerifyOtp.jsx (new) — 6-digit input, resend button with countdown, error display
- pages/admin/RosterManagement.jsx (new) — file upload form, last import metadata, paginated roster table with role/search filters
- pages/admin/SupervisorApprovals.jsx (new) — list of pending supervisors, approve/reject buttons, reason modal for rejection
- services/authApi.js — add verifyOtp, resendOtp
- services/adminApi.js — add importRoster, listRoster, listPendingSupervisors, approveSupervisor, rejectSupervisor

## Acceptance criteria
1. A student registers → gets OTP email → verifies → status ACTIVE → can log in.
2. A supervisor registers → gets OTP email → verifies → status PENDING_APPROVAL → login is blocked with the correct message → admin approves → status ACTIVE → can log in.
3. Registering with an MMU ID not in the roster fails with a clear error before any OTP is sent.
4. Registering with a roster MMU ID but wrong role fails with a clear error.
5. OTP expires after 10 minutes; entering wrong OTP 5 times locks that token.
6. Resending OTP within 60 seconds is rejected.
7. CSV import deactivates the old roster and reports row-level results.
8. All admin endpoints reject non-admin callers with 403.

## Constraints
- Use BCrypt for OTP hashing, same encoder as password.
- All timestamps in UTC, stored as DATETIME.
- All error responses follow this shape: { "error": "code", "message": "human readable" }
- Do NOT log raw OTPs or passwords anywhere.
- Write JUnit tests for OtpService (generation, hash match, expiry, attempt limit) and RosterService (validation logic).
- Keep code style consistent with the existing project (constructor injection, Lombok if already used).

## Deliverables
1. All code changes
2. Updated application.properties with placeholder SMTP config and comments
3. The Flyway migration script
4. The sample seed CSV
5. A short README section (REGISTRATION_VALIDATION.md) covering: how OTP works, how to import roster, how to approve supervisors, how to switch SMTP provider between Mailtrap and Gmail

