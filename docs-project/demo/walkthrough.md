# Demo Walkthrough — FYP Supervision System

A practical guide for demonstrating the system to the supervisor.
Designed for a 30-minute live walkthrough but readable as
documentation. Every screen and feature mentioned here is implemented
and working as of the current build.

---

## 0. Before the demo starts

### Bring the stack up
From the project root:

```powershell
docker compose up --build
```

Wait until the logs settle (about 60 seconds on a warm cache). The
backend prints a long Spring Boot banner and finishes with
"Started SupervisionApplication in N seconds". Five other services
log similar startup lines.

### Where to open the browser

| What | URL |
|---|---|
| Frontend (development with Vite hot-reload) | http://localhost:5173 |
| Frontend (production build via nginx) | http://localhost:3000 |
| Backend health (just to prove it is alive) | http://localhost:8080/api/auth/me (returns 401 without a token — that is expected) |
| AI service health checks | http://localhost:5001/ai/health, :5002/ai/health, :5003/ai/health |

Default during the demo: use `http://localhost:5173` if the dev
override is in place (the `docker-compose.override.yml` file at the
repo root). Rename or delete that file to demo the production
nginx-served bundle on `:3000` instead.

### Test accounts (seeded in `V9__seed_data.sql`)

| Role | Email | Password |
|---|---|---|
| System Admin | `admin@mmu.edu.my` | `Admin@123` |
| Supervisor | `sarah.lee@mmu.edu.my` | `Test@123` |
| Student | `student@student.mmu.edu.my` | `Test@123` |
| FYP Committee | `ahmad.razak@mmu.edu.my` | `Test@123` |

Additional supervisors and students can be created by running the
seed scripts under `scripts/` (PowerShell) — `seed_supervisors.ps1`
adds five supervisors with research-area variety, and
`seed_students_and_logs.ps1` adds eight students paired with
meeting logs. Useful when the demo wants to show "many supervisors"
or "many students" rather than just the four defaults.

### A note on what is and is not configured

- **HTTPS is not configured.** Everything runs on plain HTTP because
  every container is on `localhost`. A production deployment would
  terminate HTTPS at a reverse proxy in front of nginx.
- **Email and push are off by default.** Password-reset emails and
  notification emails will not actually send unless `MAIL_USERNAME` /
  `MAIL_PASSWORD` and `APP_EMAIL_ENABLED=true` are set; Web Push is
  similarly gated on `APP_PUSH_ENABLED=true` and a VAPID keypair.
  In-app notifications work without either.
- **The remote LLM is optional.** The chatbot and the proposal
  analyzer's "detailed feedback" prose use a Groq / OpenAI API key
  if `GROQ_API_KEY` or `OPENAI_API_KEY` is set in `.env`. If neither
  is set, the chatbot falls back to extractive answers from the
  knowledge base, and the analyzer's prose feedback comes from the
  rule-based NLP layer alone. Numerical scores from the analyzer
  (clarity, structure, scope, innovation, overall) work either way.

---

## 1. Registration workflows

Two roles can self-register through the public sign-up form: students
and supervisors. FYP committee members and system administrators
**cannot** self-register — they have to be created by an existing
administrator through `/admin/users/new`. This is a deliberate
decision: the public registration form is locked to roles whose abuse
cannot escalate privileges.

### 1.1 Student registration

1. Open `http://localhost:5173/register`. The first screen asks the
   user to pick a role (STUDENT or SUPERVISOR).
2. Picking STUDENT reveals the student form. Required fields: full
   name, MMU ID (10 digits), email (must end with
   `@student.mmu.edu.my`), password (8–100 characters), specialisation
   (Software Engineering, Data Science, Cybersecurity, Game
   Development, or Information Systems), intake year (the four-digit
   calendar year the student joined the programme). Phone number is
   optional.
3. Submit. The backend validation runs in two layers — first the
   DTO-level Bean Validation (regex on MMU ID, regex on the email
   domain, length on the password), then the service-level pairing
   check that confirms students are using the `@student.mmu.edu.my`
   subdomain rather than the staff `@mmu.edu.my` one.
4. **Roster lookup.** The service then checks `approved_student_roster`
   for a row matching the submitted MMU ID *and* email. The lookup
   requires both fields to match together so that a leaked CSV row
   cannot unlock a different account.
   - **Match found**: account is created with `status = ACTIVE`
     immediately. The student is also enrolled into the currently
     active FYP1 cycle (a placeholder Project row is created — see
     Section 2 for what that means). The student can log in straight
     away.
   - **No match**: account is created with `status = PENDING`. The
     student sees the "Account pending approval" screen and cannot log
     in until an administrator reviews and approves them through
     `/admin/pending-registrations`.
5. The student lands on the dashboard on first login. Profile is
   partial — they can fill in CGPA, expected graduation, interests,
   skills, and a profile picture from `/student/profile`.

```
Public form  →  validation  →  roster lookup
                                 ├── match    → ACTIVE  + auto-enrol in active FYP1 cycle  → can log in
                                 └── no match → PENDING → wait for admin                     → cannot log in
```

### 1.2 Supervisor registration

The supervisor flow parallels the student flow with three differences:

1. The email must end with `@mmu.edu.my` and **not**
   `@student.mmu.edu.my`. Both the regex and the service-level pairing
   check enforce this.
2. There are no specialisation or intake-year fields. Supervisors
   instead get a default `supervisor_profile` row on creation
   (supervision quota of 8, availability `AVAILABLE`, no research
   areas yet) which they populate later from `/supervisor/profile`.
3. The roster check uses `approved_supervisor_roster` instead of
   `approved_student_roster`. The same auto-activate-on-match rule
   applies.

A newly active supervisor does **not** get a placeholder Project row —
Projects only exist on the student side. The supervisor simply becomes
visible in the student-facing supervisor directory once they have set
a research area and have remaining supervision quota.

### 1.3 The admin's role in registration

Two admin pages cover the registration pipeline:

| Page | What it does |
|---|---|
| `/admin/approved-roster` | Upload a CSV of pre-approved students or supervisors. Matching self-registrations are auto-activated and skip the PENDING queue entirely. Useful at the start of every trimester, when the FCI registrar provides the cohort list. |
| `/admin/pending-registrations` | Review every account with `status = PENDING`. Click **Approve** (status flips to `ACTIVE`, an in-app notification fires, the user can log in) or **Reject** (status flips to `BLOCKED` with an optional reason). |

Two further admin actions affect existing accounts:

- **Suspend** at `/admin/users/{id}` — sets `status = SUSPENDED`. The
  user keeps their JWT but the next request returns 401 because the
  JWT filter re-reads the live status from the database on every call.
  Suspension is reversible.
- **Block** — sets `status = BLOCKED`. Same effect as suspend, but
  conventionally used for permanent denial (compromised account,
  leaver).

### 1.4 What the user sees if they try to log in too early

- **`status = PENDING`**: login returns "Your account is pending
  approval." The login page shows this in a banner and the user is
  not redirected.
- **`status = SUSPENDED`** / **`BLOCKED`**: login returns "Your
  account has been suspended/blocked." Same banner treatment.
- **Five wrong passwords**: the account is locked for 15 minutes
  through the V27 throttle columns. Subsequent attempts return
  "Account temporarily locked after too many failed attempts. Try
  again in N minutes." The lockout window is independent of the
  account's status.

---

## 2. FYP cycle lifecycle and student situations

The FYP cycle is the load-bearing concept that ties every student's
journey together. Each academic semester is one `FypCycle` row, with
four possible statuses and a small set of automatic side-effects on
transitions.

### 2.1 Cycle states and transitions

| State | What it means | What admin can do |
|---|---|---|
| `PLANNING` | Cycle is created but not yet live. No students enrolled. | Activate, edit, delete |
| `ACTIVE` | The current cycle. Students enrol, supervisors accept requests, all writes work. | Complete, edit |
| `COMPLETED` | Admin has closed the cycle. Students see a "your cycle has ended" banner; write endpoints return 403; reads still work. | Archive |
| `ARCHIVED` | Older cycle kept for record. Hidden from default views. | (none — terminal) |

```
PLANNING ── activate ──→ ACTIVE ── complete ──→ COMPLETED ── archive ──→ ARCHIVED
```

There is one invariant the system enforces: **at most one ACTIVE
cycle per `cycle_type` (FYP1 or FYP2)**. Activating a new FYP1 cycle
automatically demotes any other ACTIVE FYP1 cycle to COMPLETED in the
same operation, with a notification fan-out to every student enrolled
in the demoted cycle.

### 2.2 What happens on each transition

**Activate (PLANNING → ACTIVE).** `CycleLifecycleService.setCycleStatus(id, ACTIVE)` runs:

1. Any other ACTIVE cycle of the same type is moved to COMPLETED
   (with notifications).
2. For an FYP1 cycle, `backfillFyp1Placeholders()` runs — every
   student with `status = ACTIVE` who does not already have a
   `Project` row gets a placeholder one (no supervisor, title
   `(Pending — awaiting supervisor)`) pinned to the new cycle. This
   guarantees that downstream queries that join through `Project`
   always return a row, even for a brand-new student.
3. Any student whose previous placeholder cycle just COMPLETED has
   their placeholder re-pointed to the newly active cycle (the
   "stale-placeholder special case").

**Complete (ACTIVE → COMPLETED).** Notifications fan out to every
enrolled student. `Project.status` is left intact. The visible effect
on the student side is that
`StudentAccessService.requireActiveCycle(userId)` — called at the top
of every student write endpoint — begins to throw `ForbiddenException`.
Reads stay open.

**Archive (COMPLETED → ARCHIVED).** Cosmetic; the cycle drops off
default lists.

### 2.3 Different student situations (the matrix)

| Situation | Student state | Cycle state | What the student sees |
|---|---|---|---|
| **A — Newly registered during ACTIVE FYP1** | Just activated, no Project yet | Some FYP1 cycle is ACTIVE | Placeholder Project created on the spot via `attachStudentToActiveFyp1`. Dashboard shows the new cycle, supervisor directory unlocked, can submit requests. |
| **B — Registered before any FYP1 cycle is ACTIVE** | Active student, no Project | No ACTIVE FYP1 yet | Dashboard shows "no active cycle" banner. Placeholder is created later, on the next FYP1 activation, automatically. |
| **C — Stale placeholder** | Has placeholder, never picked a supervisor, old FYP1 just COMPLETED | Old cycle COMPLETED, new cycle PLANNING or ACTIVE | Dashboard reports `cycleActive: true` (special case). Placeholder re-points to the next ACTIVE FYP1 the moment the admin activates it. The student is not punished for missing the previous cycle. |
| **D — Paired student, FYP1 cycle ends** | Has Project with supervisor and title | FYP1 cycle COMPLETED | All write endpoints return 403; the React app renders `LockedFeaturePage`. Reads still work. The student waits for the FYP1 result. |
| **E — Passed FYP1, FYP2 cycle ACTIVE** | `Project.fyp1_passed = true` | New FYP2 cycle is ACTIVE | On next login, `AuthService` flips `Project.stage` from FYP1 to FYP2. Dashboard header now reads "FYP2 · 2025/2026". Phase strip moves to step 2. Meeting-log compliance counter resets to 0/6 against the FYP2 phase. |
| **F — Failed FYP1** | `Project.fyp1_passed = false` | FYP1 cycle COMPLETED | Stays on FYP1 stage, can no longer write (cycle is COMPLETED), sees "FYP1 not passed" treatment on dashboard. Admin or committee handles re-enrolment manually. |
| **G — FYP1 result not yet decided** | `Project.fyp1_passed IS NULL`, cycle just COMPLETED | FYP1 cycle COMPLETED | Sees the `Fyp1ResultPendingPage` after login until admin marks the outcome. |
| **H — Student suspended mid-cycle** | `status = SUSPENDED` or `BLOCKED` | Any | Login returns "Your account has been suspended". Existing JWTs stop working on the next request because the JWT filter re-reads `user.status` every time. |

### 2.4 The FYP1 → FYP2 transition

This is the most-asked-about flow. Step by step:

1. End of FYP1 trimester. Admin closes the FYP1 cycle
   (`/admin/cycles/{id}/complete`). All FYP1 students switch to
   read-only mode.
2. Admin marks each student's FYP1 outcome at
   `/admin/fyp1-pass-tracking` — passed or failed. The page shows a
   coloured badge for each student's meeting-log compliance count
   (green ≥6, yellow <6); the admin can mark passed even when the
   badge is yellow, but the action triggers a confirmation modal that
   quotes the shortfall.
3. Admin creates and activates a new FYP2 cycle for the next
   semester.
4. On each passed student's next login, `AuthService.refreshFyp1Status`
   notices that `fyp1_passed = true` and there is an ACTIVE FYP2
   cycle, and flips `Project.stage` from `FYP1` to `FYP2`. The
   student now sees the FYP2 dashboard, with the meeting-log
   compliance counter reset against the FYP2 phase.
5. Failed students stay on FYP1. Their re-enrolment into the next
   FYP1 cycle is a manual administrative action (typically through the
   user-management page).

### 2.5 The "no active cycle" edge case

If no FYP1 cycle is currently ACTIVE — for example, between the end
of one cycle and the activation of the next — newly registered
students still get an account, but their dashboard shows a "no active
FYP cycle" banner and the supervisor directory is hidden. Their
placeholder Project row is created automatically on the next FYP1
activation; nothing is lost. This is the safe default behaviour and
does not require admin intervention.

---

## 3. The admin's full setup-to-close lifecycle

A trimester from the admin's point of view, in roughly the order
things happen. The per-screen reference for each admin page is in
Section 7; this section is the *operational* view.

### 3.1 Setup (before the trimester starts)

| Step | Where | What |
|---|---|---|
| 1 | `/admin/cycles/new` | Create the cycle row. Fill cycle code (e.g. `FYP-2025-2026-1`), cycle type (FYP1 or FYP2), academic year, semester, start date, end date. Status starts as `PLANNING`. |
| 2 | `/admin/deadlines/new` | Add the cycle's deadlines — supervisor selection, proposal submission, proposal review, final report submission. For each, pick the audience (STUDENT / SUPERVISOR / ALL), the type (REGISTRATION / PROPOSAL / REPORT), and a JSON array of reminder days (e.g. `[14, 7, 3, 1]`). |
| 3 | `/admin/approved-roster` | Upload CSVs of pre-approved students and supervisors from the FCI registrar. Matching self-registrations will be auto-activated. |
| 4 | `/admin/cycles/{id}/activate` | Activate the cycle when ready. Status becomes ACTIVE. Placeholder Projects are created for any pre-existing students; any older ACTIVE cycle of the same type is automatically demoted to COMPLETED. |

### 3.2 During the trimester (week-to-week)

| Page | When to use | Why |
|---|---|---|
| `/admin/dashboard` | Daily check | Live counts; AI service health pills; cycle status |
| `/admin/pending-registrations` | When a non-roster student or supervisor self-registers | Approve or reject — non-roster registrations land here for review |
| `/admin/users` | When a user reports a problem or needs to be suspended | Edit, suspend, block, change role; bulk-status updates for batch action |
| `/admin/audit-logs` | Periodic review (weekly or after a security event) | Filter by `LOGIN_LOCKOUT_TRIGGERED`, `LOGIN_REJECTED_LOCKED`, or by user; the trail is append-only |
| `/admin/maintenance` | When something needs to run | Backup the DB, restore a backup, clear cache, run the deadline-reminder dispatcher manually |
| `/admin/jobs` | After running a maintenance job | View job status (PENDING → RUNNING → COMPLETED / FAILED) and the `result_json` |
| `/admin/parameters` | When a runtime knob needs to change | Toggle `ai_recommendation_enabled`, change file-upload size limit, etc. — takes effect on the next request without a restart |
| `/admin/integrations` | Rare; for setting up SMTP, VAPID, or LLM keys | Test the connection from the page |

### 3.3 End of trimester (FYP1 specifically)

| Step | Where | What |
|---|---|---|
| 1 | `/admin/fyp1-pass-tracking` | Walk through every student. For each, see their meeting-log compliance count (green ≥6, yellow <6) and mark passed/failed. Yellow badges trigger a confirmation modal that quotes the shortfall. |
| 2 | (alternative) `POST /admin/projects/fyp1-passed/import` | Bulk CSV import for batch decisions sourced from external systems (eBwise, Clic). |
| 3 | `/admin/cycles/{id}/complete` | Mark the FYP1 cycle as COMPLETED. Notifications fan out to every enrolled student; their write endpoints become read-only. |
| 4 | `/admin/cycles/new` | Create the FYP2 cycle for the same cohort (or the next FYP1 cycle for the next cohort). |
| 5 | `/admin/cycles/{id}/activate` | Activate the new cycle. Auto-demotes any existing ACTIVE cycle of the same type. For FYP2 activation, passed students will be promoted to the new cycle on their next login automatically. |

### 3.4 Periodic and one-off maintenance

| Action | Trigger | Where |
|---|---|---|
| Re-run the deadline-reminder dispatcher | A scheduled tick was missed | `POST /admin/jobs/deadline-reminders/run` |
| Manual backup | Before a risky change | `POST /admin/maintenance/backup` — file lands in `uploads/backups/` |
| Restore a backup | Recovery scenario | `POST /admin/maintenance/restore/{backupId}` |
| Clear the application cache | Cache-related strangeness | `POST /admin/maintenance/clear-cache` |
| Re-index the chatbot vector store | After adding knowledge-base documents | Maintenance job, runs `build_knowledge_base.py` inside the container |
| Cleanup old notifications | Quarterly | `POST /admin/maintenance/cleanup` |

### 3.5 Reports and exports

These are mostly committee-side at `/committee/reports`, but the
admin can also configure recurring CSV exports at `/admin/exports`:

1. Pick a data type (users / projects / proposals / meetings / grades).
2. Pick fields, filters, and a schedule.
3. Run on demand with `POST /admin/export-configs/{id}/run` or wait
   for the schedule.
4. Download the produced CSV from
   `/admin/export-configs/{id}/download`.

### 3.6 What is automated and what is not

Automated (the system handles these without admin action):
- Placeholder Project creation when a student registers during an ACTIVE FYP1 cycle
- Placeholder backfill on FYP1 cycle activation
- Notification fan-out on cycle COMPLETED / ARCHIVED
- FYP1 → FYP2 stage promotion on the student's next login when both prerequisites are met
- Audit-log writes on every mutating admin call
- Deadline reminders (driven by `reminder_days` per deadline; idempotent through `deadline_reminder_log`)

Manual (admin still has to do these):
- Creating and activating cycles
- Approving non-roster registrations
- Marking FYP1 outcomes (the system surfaces the meeting-log compliance count but never auto-decides)
- Re-enrolling failed students into the next FYP1 cycle
- Triggering backups and restores

This split is deliberate — academic decisions stay in human hands,
while the surrounding bookkeeping is automated.

---

## 4. Student journey — the end-to-end flow

This is the longest demo and the one to lead with. Log in as
`student@student.mmu.edu.my` / `Test@123`.

### 1.1 Dashboard at first login

The student lands on `/student/dashboard`. The page shows:

- A welcome banner with the student's name, current FYP phase
  (FYP1 or FYP2), and the academic year (`FYP-2024-2025-1`).
- The trimester week tracker — `Week N of 14 · K weeks left`.
- The phase progression strip — `FYP1 → FYP2 → Complete`, with the
  current phase highlighted.
- A meeting-log compliance widget — `4 of 6 required logs` with a
  progress bar. The MMU FCI rule is six locked logs per phase; the
  widget makes the current count and the gap obvious.
- Cards for upcoming meetings, recent draft logs, recent documents,
  upcoming deadlines, and unread notifications.

Everything on this page comes from a single `GET /student/dashboard`
call so the landing screen never waits on multiple backend
round-trips.

**What this demonstrates:** the dashboard aggregates seven different
domain reads into one HTTP call, and the registration-status object
drives every feature gate the student sees throughout the app.

### 1.2 Profile

From the side navigation, click "My Profile" (`/student/profile`).
The student can edit personal details, upload a profile picture,
edit `interests` and `skills` arrays (used by the AI recommender),
and change their CGPA / expected graduation. Notable behaviours to
demonstrate:

- Click "Edit", upload a new picture in the modal, and **click
  "Cancel"**. The picture does not commit. This was a deliberate
  fix — the upload only persists when "Save Changes" is clicked.
- The header avatar in the top-right refreshes immediately when a
  new picture is saved (not on hard refresh).
- Email and MMU ID are read-only after registration.

### 1.3 Find a supervisor (manual + AI)

Two paths into the supervisor directory:

**Manual search** — `/supervisors`. Filter by department, faculty,
research area keywords, and availability. Each supervisor card shows
their photo, research areas, supervision quota, and the number of
free slots; supervisors at quota or marked `UNAVAILABLE` are visibly
greyed out.

**AI recommendations** — `/student/ai-recommendations`. Click
"Refresh recommendations". The page calls
`POST /student/recommendations/refresh`, which triggers the Flask
recommender to score every available supervisor against the
student's profile. The result is the top 10 with a per-supervisor
breakdown:

- A match score (0.00 – 1.00).
- The five score components — semantic, interest, skill, programme,
  availability — shown as a small breakdown so the student
  understands *why* the supervisor was ranked there.
- A locally-generated explanation sentence
  ("Strong topic alignment (semantic 0.74). Shared research areas
  (machine learning, natural language processing). 5 supervision
  slots free.")

If the AI service is not running, the page shows a
"Recommendation service is temporarily unavailable" banner instead of
a fake empty list — the backend explicitly propagates a 503.

**What this demonstrates:** the recommendation service is
deterministic (no XGBoost, no LLM in the hot path), the explanation
is grounded in the score breakdown, and the integration boundary is
honest about service outages.

### 1.4 Send a supervision request

From the supervisor's profile page, click "Request Supervision".
Fill in the proposed title and message, then submit. The student
side shows the request in `/student/my-requests` with status
`PENDING`. Behind the scenes:

- The request is created in `supervisor_request`.
- A notification fires for the target supervisor through
  `NotificationService.createNotification`.

Optionally: log in as `sarah.lee@mmu.edu.my` in another browser tab
and accept the request. Then go back to the student tab — the
supervisor card on the dashboard updates, the next features
(proposal, meetings, logs, documents) unlock.

### 1.5 Proposal authoring + AI analysis

After the supervisor accepts, the proposal area unlocks at
`/student/proposal`. The form follows the MMU FCI proposal template
with sections for Problem Statement, Objectives, Scope, and
Methodology. Two demo-worthy actions:

- **AI analyse**. Click "Analyse Proposal". The backend calls the
  Flask analyzer. The page renders five scores
  (clarity, structure, scope, innovation, overall — each on a 0–100
  scale), a list of detected missing sections, and prose feedback
  with strengths, weaknesses, and suggestions. If a Groq or OpenAI
  key is configured, the prose feedback is LLM-generated; otherwise
  it comes from the rule-based NLP layer.
- **Export to DOCX**. The page generates an MMU FCI-compliant Word
  document client-side (using `jspdf` + `docx`) so the student can
  save and submit through the official channel as well.

The proposal then goes through a state machine:
`DRAFT → SUBMITTED → UNDER_REVIEW → REVISION_REQUIRED / APPROVED / REJECTED`.

### 1.6 Meeting scheduling and the digital meeting log

The student can request a meeting at `/student/meetings/new`. Pick
a date, time, mode (online / on-campus / hybrid), platform, and
agenda. Once the supervisor confirms, both parties see the meeting
on their dashboard.

After the meeting, the student creates a **meeting log** at
`/student/meeting-logs/new`. The log captures the standard FCI form
fields:

- Meeting date, mode, FYP phase, meeting number.
- Tasks discussed (as a JSON list).
- Discussion summary, work done, work to be done, problems and
  solutions, action items.
- Next meeting date.

The log goes through a five-state lifecycle:
`DRAFT → SUBMITTED → SUPERVISOR_SIGNED → LOCKED`, with a
`CORRECTION_REQUIRED` branch back to `DRAFT` if the supervisor
needs revisions. **Both parties sign the log by drawing on a
canvas.** The PNG signature is stored alongside a SHA-256 hash, so
a verifier can later prove the captured signature was not altered
after the fact.

A locked log can be **exported to PDF** from the detail page — the
client-side `html2canvas` + `jspdf` pipeline produces a single-page
PDF that mirrors the FCI form layout.

### 1.7 Documents

`/student/documents` lets the student upload supporting documents
(progress reports, code archives, slides). Each upload is tied to a
project, has a `doc_type` and `phase`, and supports re-uploading
new versions while preserving the history.

### 1.8 Chatbot

Click the chatbot widget (bottom-right of the dashboard). The bot
answers procedural FYP questions ("when is the proposal due?",
"what should section 3 of the proposal contain?") via
retrieval-augmented generation over a 15-document knowledge base.
Each answer cites the source documents it pulled chunks from. The
thumbs-up / thumbs-down buttons on each assistant message persist
to `chat_message.feedback` (introduced in V28).

If the question is out of scope (top-1 cosine < 0.30), the bot
returns a fixed reply listing the supported topics rather than
hallucinating an answer.

### 1.9 What the student sees over time

- **Dashboard widgets update automatically** as supervisor accepts,
  proposal moves through review, meetings and logs accumulate.
- **Notifications** appear in the bell badge as the supervisor
  signs logs, the committee approves the proposal, and the admin
  publishes announcements.
- **The cycle-ended banner** appears once the admin marks the
  current cycle as `COMPLETED` — write actions then return a 403
  with a friendly "your cycle has ended" message rather than a raw
  error.

---

## 5. Supervisor journey

Log out, log in as `sarah.lee@mmu.edu.my` / `Test@123`.

### 2.1 Dashboard

`/supervisor/dashboard` shows:

- Pending supervision requests count.
- Active supervisees with their FYP phase.
- Upcoming meetings.
- Logs awaiting review.
- Proposals awaiting feedback.
- Unread notifications.

### 2.2 Profile + supervision quota

`/supervisor/profile` lets the supervisor edit:

- `supervision_quota` (default 8) — how many students they will accept.
- `availability_status` — `AVAILABLE` / `UNAVAILABLE`.
- `research_areas`, `expertise`, `preferred_project_types` (JSON arrays).
- `office_location`, `office_hours`, LinkedIn / Google Scholar links.

The student-facing directory reads `availableSlots = quota − load`
and `isAcceptingStudents = AVAILABLE && load < quota` so the
"Request Supervision" button greys out automatically when the
supervisor is full.

### 2.3 Request inbox — accept or reject

`/supervisor/requests` lists every incoming request. Click into one
and choose **Accept** or **Reject**:

- **Accept** increments `current_load`, refuses if the quota would
  be breached, creates a `Project` row that anchors every downstream
  feature for that student, and notifies the student.
- **Reject** records the supervisor's `responseMessage` and notifies
  the student so they can send a different request.

### 2.4 Supervisees list

`/supervisor/supervisees?scope=active|past` shows all current and
historical supervisees. Click a supervisee to see their full
project record — proposal status, meeting log compliance count,
documents uploaded, recent activity.

### 2.5 Proposal review

`/supervisor/proposals` is the proposal review queue. Click into a
proposal to see:

- The student's submitted text plus any uploaded PDF.
- The AI analysis result (same scores the student saw).
- A feedback form with three decision options: `APPROVED`,
  `REVISION_REQUIRED`, `REJECTED`.

The decision writes a `proposal_review` row and updates the
proposal's status; the student is notified.

### 2.6 Meeting management

`/supervisor/meetings` lists meeting requests. The supervisor can
**Confirm** the proposed time, **Suggest an alternative**, or
**Cancel** with a reason. Once a meeting reaches `COMPLETED`, the
student is prompted to file a meeting log.

### 2.7 Meeting log review and signing

`/supervisor/meeting-logs` shows logs awaiting supervisor action.
For each `SUBMITTED` log, the supervisor can:

- **Add comments** (`PUT /supervisor/meeting-logs/{id}/comments`).
- **Request correction** with a free-text reason — the log returns
  to `DRAFT` for the student to edit.
- **Sign** by drawing on the canvas — the log advances to
  `SUPERVISOR_SIGNED`, and the signature row + SHA-256 hash are
  written. The student then counter-signs to lock the log.

### 2.8 Documents review

`/supervisor/documents` lists every document the supervisees have
uploaded. The supervisor can download, leave feedback, or comment.

### 2.9 Announcements

`/supervisor/announcements` is an inbox-and-outbox view:

- The supervisor sees announcements they themselves created
  (`direction = SENT`) plus anything the committee or admin
  published (`direction = RECEIVED`).
- "Create announcement" opens a form that targets either *all
  supervisees* of this supervisor or *specific students* via the
  audience picker. Multipart attachments and external links are
  supported.

### 2.10 Grading (FYP1 / FYP2 final report)

`/supervisor/grades` lets the assigned supervisor enter a rubric
score for each of their supervisees, per phase. The rubric is
stored as JSON, the total score is derived from the criterion sum,
and the letter grade is computed against the MMU FCI scale
(≥80 A, ≥75 A−, …, < 40 F). The status flow is
`DRAFT → SUBMITTED → FINALISED`. Only FINALISED grades are visible
to the student.

---

## 6. FYP Committee oversight

Log in as `ahmad.razak@mmu.edu.my` / `Test@123`.

### 3.1 Dashboard

`/committee/dashboard` is a global oversight view:

- Active FYP1 and FYP2 project counts.
- Unpaired student count.
- Supervisor load distribution (who is full, who has slots).
- Proposal status distribution.
- Cycle deadline calendar.

Numbers come from real aggregation queries
(`ProjectRepository.countFyp1Projects()`,
`countFyp2Projects()`, `countUnpairedStudents()`) so they reflect
live data rather than placeholders.

### 3.2 Unpaired students

`/committee/unpaired-students` lists every student whose `Project`
row exists but has no supervisor — typically because they
registered after the cycle started or rejected several supervisor
responses. The committee can drill into each student to see their
profile and reach out.

### 3.3 Supervisor load

`/committee/supervisor-loads` shows every supervisor's current load
versus their quota. Useful for spotting unevenly-loaded supervisors
before the cycle gets too far in.

### 3.4 Proposal review queue

`/committee/proposals` shows the proposals the committee is
expected to oversee. The committee can view the AI analysis and
override or escalate a supervisor's review where needed.

### 3.5 Project drill-down

`/committee/projects/{id}` is the detailed view of any project — the
student profile, the supervisor profile, the proposal history, the
meeting count, the meeting-log compliance count, the grade history
once it is in.

### 3.6 Documents

`/committee/documents` is for official templates and guideline
files (the FCI proposal template, the meeting log template, etc.).
Upload, version, and publish.

### 3.7 Announcements

`/committee/announcements` lets the committee broadcast to the
whole faculty. The audience options are `ALL`, `FYP1`, `FYP2`,
`PROGRAMME_<X>`. Multipart attachments and external links work the
same as on the supervisor side.

### 3.8 Reports

`/committee/reports` is the report-generation page. Click "Generate
report", choose the type and the cycle, and the system writes a CSV
file under `uploads/reports/` and stores its metadata in
`generated_report` so it can be re-downloaded later. Two report
types are wired up: student-progress and supervisor-load.

---

## 7. System Administrator (per-screen reference)

Log in as `admin@mmu.edu.my` / `Admin@123`.

### 4.1 Dashboard

`/admin/dashboard` is a configuration-plane view. It shows:

- User counts by role and status.
- Active cycle and the next cycle.
- A live AI service health panel — three pills showing whether
  `ai-recommendation`, `ai-proposal-analyzer`, and `ai-chatbot` are
  reachable. Each pill is backed by a `GET /ai/health` call.
- Recent admin actions from the audit log.

### 4.2 User management

`/admin/users` lists every user. The admin can:

- Create users (`POST /admin/users`) including FYP committee and
  admin users that students and supervisors cannot self-register.
- Edit users.
- Change a user's status: `PENDING → ACTIVE → SUSPENDED → BLOCKED`.
  The change takes effect on the user's next request — the
  authentication filter re-reads `user.status` on every call.
- Bulk-status updates for batch admin work.

### 4.3 Pending registrations

`/admin/pending-registrations` is the queue of `PENDING`
self-registered students and supervisors. The admin can **Approve**
(transitions to `ACTIVE`) or **Reject** (transitions to `BLOCKED`
with an optional reason). Pre-approved users (those whose MMU ID
and email match a row in `approved_student_roster` /
`approved_supervisor_roster`) are auto-activated at registration and
do not appear here.

### 4.4 Approved roster

`/admin/approved-roster` lets the admin upload CSVs of pre-approved
students and supervisors so that matching self-registrations
auto-activate. Students and supervisors are managed separately
(separate tabs, separate CSV templates).

### 4.5 FYP cycle management

`/admin/cycles` is the FYP cycle CRUD.

- Each cycle has `cycle_code`, `cycle_type` (FYP1 / FYP2),
  `academic_year`, `semester`, and a `start_date` / `end_date`.
- Status flow: `PLANNING → ACTIVE → COMPLETED → ARCHIVED`.
- Activating a cycle automatically demotes any other cycle of the
  same type that was previously `ACTIVE`, and creates placeholder
  `Project` rows for every active student who does not yet have one.
- Marking a cycle `COMPLETED` notifies every enrolled student and
  switches their write endpoints to read-only mode.

### 4.6 Deadlines

`/admin/deadlines` is the per-cycle deadline calendar. Add deadlines
of type `REGISTRATION` / `PROPOSAL` / `REPORT` / etc.; specify the
audience (STUDENT / SUPERVISOR / ALL) and a JSON array of
reminder-days (e.g. `[14, 7, 3, 1]`). The reminder dispatcher
fires once per deadline+days_before pair, recorded in
`deadline_reminder_log` so it cannot fire twice.

### 4.7 FYP1 pass tracking

`/admin/fyp1-pass-tracking` is the page where the admin records
each student's FYP1 outcome (passed / failed). Notable details:

- Each row shows the student's name, supervisor, project title, and
  the meeting-log compliance count as a coloured badge — green when
  ≥6 logs, yellow when below.
- The admin can mark `PASSED` even when the badge is yellow, but
  the action triggers a confirmation modal that quotes the
  shortfall. This is a soft warning by design — academic judgement
  should not be overridden by a count.
- A CSV import path
  (`POST /admin/projects/fyp1-passed/import`) lets the admin
  upload a batch of decisions sourced from external systems.

### 4.8 System parameters

`/admin/parameters` lists the runtime-tunable settings — supervision
quotas, session timeout, file upload size limit, AI service toggles
(`ai_recommendation_enabled`, `ai_proposal_analysis_enabled`,
`ai_chatbot_enabled`), and so on. Toggling
`ai_recommendation_enabled` to `false` immediately stops
recommendations from being generated without restarting the
backend, because the parameter is read on each request rather than
at boot.

### 4.9 Integration settings

`/admin/integrations` lists third-party integration definitions
(SMTP mail, Web Push, Groq / OpenAI). The admin can edit endpoint
URLs and test the connection.

### 4.10 Audit logs

`/admin/audit-logs` is the append-only audit trail. Every mutating
admin call writes a row through `AuditService.record(...)` with the
actor, action code (SCREAMING_CASE — examples include
`USER_APPROVED`, `LOGIN_LOCKOUT_TRIGGERED`, `CYCLE_ACTIVATED`,
`GRADE_FINALISED`), entity name and id, IP address, and user agent.
The page supports filtering by user, action, entity, and date.

### 4.11 Data export

`/admin/exports` lets the admin define recurring exports — pick a
data type (users / projects / proposals / meetings / grades), a
format (CSV), and a schedule. Manual "Run now" downloads work
without the schedule.

### 4.12 Maintenance jobs

`/admin/maintenance` exposes asynchronous jobs:

- Backup the database to a file under `uploads/backups/`.
- Restore a backup.
- Cleanup old notifications, audit log entries, etc.
- Clear the AI cache.
- Re-index the chatbot vector store.
- Run the deadline-reminder dispatcher manually.

Each job writes a `maintenance_job` row in `PENDING`, runs in an
`@Async` method, and updates the row to `RUNNING` then `COMPLETED`
or `FAILED` with `result_json`. The page polls for status so the
admin sees progress without blocking.

---

## 8. AI features in one minute (the differentiators)

If the supervisor has limited time, point at these three:

| AI feature | What it does | What is honest about it |
|---|---|---|
| **Supervisor recommendation** (port 5001) | Ranks supervisors against a student's profile using a five-component weighted score (semantic 0.50, interest 0.18, skill 0.10, programme 0.07, availability 0.15). Embedding model is Sentence-BERT `BAAI/bge-base-en-v1.5` (768-dim). | No machine-learning training, no LLM in the request path, fully deterministic. Hard filter drops over-quota or unavailable supervisors before scoring. |
| **Proposal analyzer** (port 5002) | Three-stage pipeline: rule-based NLP scoring (Flesch-Kincaid, Gunning Fog, section coverage), fine-tuned DistilBERT chunk-and-averaged over 480-token windows, optional remote LLM for prose feedback. | Plagiarism field was removed because the analyzer never computed it. DistilBERT scores the full text rather than just the introduction. |
| **RAG chatbot** (port 5003) | Retrieval-augmented generation over a 15-document FCI knowledge base. FAISS vector index for retrieval, OpenAI-compatible LLM (Groq's `llama-3.3-70b-versatile` by default) for generation. | Out-of-scope cut-off at top-1 cosine 0.30 prevents hallucination. Reported confidence is a real product of similarity × generator-path multiplier. |

All three call paths go through the backend (`AiServiceClient`) so
the frontend never opens a connection to ports 5001/5002/5003
directly. AI service outages propagate as HTTP 503 with a banner,
not as silent empty results.

---

## 9. Cross-cutting features

These appear in every role and are easy to demo at any point.

### Notifications

The bell badge in the top bar shows unread count. Click it to open
the notification drawer; click "View all" for the full
notification page (`/notifications`). Notifications fire on
supervision-request responses, proposal-review decisions,
meeting-log signing, announcement publication, cycle status
changes, and grade finalisation.

`/notifications/preferences` lets each user pick channels
(in-app / email / push) per category. In-app is always on; email
and push are gated by the global `APP_EMAIL_ENABLED` and
`APP_PUSH_ENABLED` env flags.

### Profile picture

Every role has a profile page that supports image upload. Cancel
correctly does not commit the upload; the top-bar avatar refreshes
immediately on save.

### Announcement reading

Every role sees the latest announcements relevant to them on their
dashboard, with an "View all" link to the full list. Audience
filtering happens server-side, so a student only sees announcements
whose scope matches their cycle and programme.

### Locked features and cycle-ended state

When the admin marks a cycle `COMPLETED`, the student keeps full
read access but every write endpoint returns a friendly 403. The
React app reads this from the dashboard payload and renders a
`LockedFeaturePage` explaining why, rather than firing the request
and showing a raw error.

### Login security

- Five failed login attempts lock the account for 15 minutes; the
  message tells the user how long until the account is usable
  again.
- Passwords are hashed with BCrypt; password-reset tokens are
  emailed in raw form but stored only as their SHA-256 hash, so a
  database read does not yield a usable token.
- Spring Security maps each authenticated request to a single
  authority (`STUDENT` / `SUPERVISOR` / `FYP_COMMITTEE` /
  `SYSTEM_ADMIN`) and re-reads `user.status` on every call, so
  suspending an account ends the session on the user's next
  request.

---

## 10. Quick demo script (~20 minutes)

A condensed flow that touches registration, the cycle lifecycle, and
all four roles. If the supervisor has less time, the items marked
*(skip if short)* can be cut without breaking the narrative.

1. **0:00 — Stack overview** (1 min). Show `docker compose ps` — six
   services running. Open `http://localhost:5173`.
2. **1:00 — Registration** (2 min). Open `/register` in an incognito
   window. Walk through the role picker; show the email-domain
   constraint by trying a `@gmail.com` address (rejected). Skip the
   actual submission — the seeded accounts cover the rest.
3. **3:00 — Admin: cycle activation** (3 min). Log in as
   `admin@mmu.edu.my`. Open `/admin/cycles`. Show the current ACTIVE
   FYP1 cycle. Open `/admin/approved-roster` briefly to show the
   pre-approval CSV upload. Open `/admin/pending-registrations` (may
   be empty if all seed accounts are pre-approved).
4. **6:00 — Student dashboard** (2 min). Log in as
   `student@student.mmu.edu.my`. Point at the trimester-week tracker,
   the phase strip, the meeting-log compliance widget. Note the
   `cycleActive: true` state in the registration-status block.
5. **8:00 — AI recommendation** (3 min). Open
   `/student/ai-recommendations`, click "Refresh recommendations",
   walk through the score breakdown for the top match.
6. **11:00 — Proposal analysis** (2 min). Open the proposal page,
   click "Analyse Proposal", show the four scores and the prose
   feedback.
7. **13:00 — Meeting log signing** (2 min). Open a `SUBMITTED` log,
   draw a signature on the canvas, save. Show that the
   `signature_sha256` field is populated.
8. **15:00 — Supervisor switch** (2 min). Log in as
   `sarah.lee@mmu.edu.my`. Show the request inbox, accept a request,
   show the supervisee that just appeared.
9. **17:00 — Admin oversight + cycle close** (3 min). Back to admin.
   Show the AI health panel, the FYP1 pass-tracking page with the
   meeting-log compliance badge, the audit log filtering by
   `LOGIN_LOCKOUT_TRIGGERED`. *(skip if short)* Demonstrate the cycle
   COMPLETED transition by activating a second FYP1 cycle and
   pointing out that the previous one is now read-only.

---

## 11. If something goes wrong during the demo

| Symptom | Likely cause | Quick fix |
|---|---|---|
| Frontend shows "Network error" | Backend not yet up or context-path issue | Wait 15 seconds; refresh. Backend logs should show "Started SupervisionApplication" |
| AI recommendation page shows "service temporarily unavailable" | `ai-recommendation` container not yet ready (it pre-loads the embedding model) | Wait 30 seconds; refresh. The model is baked into the image but still has to load into memory |
| Login returns 401 silently | Account is `PENDING`, `SUSPENDED`, or `BLOCKED`, not `ACTIVE` | Check the user's status in `/admin/users`, transition to `ACTIVE` |
| MySQL won't start | Host port 3307 is in use | Stop the host MySQL service, or change the host port mapping in `docker-compose.yml` |
| Vite hot-reload not working | Windows inotify limitation | Already handled — `VITE_USE_POLLING=true` in the override file. If still broken, restart the frontend container |
| Profile picture doesn't appear | The `/uploads` proxy needs the dev override or the `assetUrl()` helper | Use `assetUrl(profileImagePath)` in code; in the browser, the image URL should be `http://localhost:8080/api/uploads/profiles/<userId>/<file>` |

---

## 12. What is *not* in scope (to pre-empt questions)

- **HTTPS termination** — not configured because everything runs on
  `localhost`. A faculty deployment would terminate HTTPS at a
  reverse proxy in front of nginx.
- **Plagiarism detection** — deliberately removed because the
  previous implementation hard-coded the value. A real signal would
  require Turnitin or a self-hosted similarity pipeline.
- **Real MMU FYP corpus calibration** — the recommender uses
  pretrained embeddings, the analyzer uses a small bundled training
  set, the chatbot uses 15 curated documents. None has been
  calibrated against historical MMU pairings or marked proposals.
- **Mobile app** — the SPA is responsive enough for tablet
  browsers, but no native mobile app exists.
- **Live faculty deployment** — the system has been built and
  tested entirely on the developer workstation; no faculty server
  hosts it today. The same `docker compose up --build` command
  would lift-and-shift onto a Linux server.

These items are tracked as future work in Section 5.10 of the
implementation chapter.
