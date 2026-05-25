# Plan — Design-doc updates against current implementation

> Scope: chapters 2, 3, 4, the ERD (`chapter3-ERD.md`), the Sequence
> Diagram doc, and the Data Dictionary. The current implementation
> (Spring Boot backend + 30 Flyway migrations + 3 AI services) is the
> source of truth. The user has asked to **plan first** — no edits
> until approved.
>
> Convention for this plan: **P1** = factually wrong, must fix.
> **P2** = incomplete, should fix. **P3** = stylistic / would be nice.

---

## A. Snapshot of where each artefact stands

| Artefact | Lines | What it covers | Drift severity |
|---|---|---|---|
| `chapter1.md` | 71 | Project overview, problem, objectives, deliverables, goals, Gantt | Already refreshed (one paragraph) on 2026-05-10 — **clean** |
| `chapter2.md` | 1027 | Background, literature review, related systems, proposed solution, tech selections | Mostly refreshed on 2026-05-10 (§§2.4.3, 2.4.5, 2.5) — **two stale lines remain** in §2.4.4 |
| `chapter3.md` | 2351 | Functional / non-functional requirements (FR1–FR47), use case specifications | **Several gaps** — newer modules (login throttle, password reset, push, grading, FYP1 pass tracking, approved roster) have no FR and no UC entry |
| `chapter4.md` | 608 | Subsystem and layered architecture, data dictionary cross-refs, sequence-diagram cross-refs | **Architecture diagram only half fixed**: AI tech labels updated on 2026-05-10 but the AI endpoint labels (`/recommendSupervisor` etc.) still show the old paths |
| `chapter3-ERD.md` | 432 | Mermaid ERD covering 24 entities | **Major drift** — missing 8 entities and ≥10 column additions from V15–V31; `plagiarism_score` still shown |
| `Sequence Diagram.md` | 2816 | 33 use-case sequence diagrams (UC1–UC33) | **Endpoint drift** in 4 places (`/recommendSupervisor`, `/analyzeProposal`, `/chatbotQuery`); no UCs for newer modules |
| `Data-Dictionary-Report.md` | 483 | 24 tables × ~169 fields | **Major drift** — same 8 missing tables as ERD; wrong role enums (`FYP_ADMIN`/`SYS_ADMIN`); wrong status enums; wrong sender enum; missing ~20 columns; `plagiarism_score` still listed |

---

## B. Itemised drift list

### B1. `chapter1.md` — clean

No further action. The 2026-05-10 refresh updated the AI feature
descriptions in §1.1 and added a `<!-- UPDATED -->` marker.

### B2. `chapter2.md` — two stale lines remain

**P1 — §2.4.4 Integration (line 900–901).**

```
- The Flask AI services will have endpoints such as /analyzeProposal,
  /recommendSupervisor and /chatbotQuery.
```

The actual Flask endpoints are `/ai/analyze-proposal`,
`/ai/recommendations`, and `/ai/chat`. These three paths are also
wrong in chapter 4 and the Sequence Diagram (see B4 and B6 below) —
the same fix has to land in all three places to stay consistent.

**Action.** Replace the three example endpoint paths with the live
ones in the same one-paragraph block.

### B3. `chapter3.md` — functional requirements and use-case gaps

The chapter currently catalogues FR1–FR47. Several FYP2 features that
are now in the implementation have no FR entry and no use case.
Whether these need to be added depends on academic supervisor
expectations (some supervisors prefer the FRs to remain a frozen
snapshot of the FYP1 design, others prefer them updated).

**P1 candidates** (features that are user-visible and should arguably
appear in the FRs even if FYP1 was already submitted):

| Implemented feature | Code anchor | Suggested FR |
|---|---|---|
| FYP1 pass tracking + soft-warning compliance check | `Fyp1PassTracking.tsx`, V15 `project.fyp1_passed`, `MeetingLogComplianceService` | Admin records FYP1 outcome; system surfaces meeting-log compliance count as a non-blocking warning |
| Final-report grading workflow | `GradingService`, V30 `fyp_grade`, `SupervisorGrades.tsx`, `AdminGrades.tsx` | Supervisor grades final report against rubric; admin finalises; student sees only finalised grades |
| Pre-approved roster (auto-activation) | V22/V23 `approved_*_roster`, `AdminRosterController` | Admin uploads CSV roster; matching self-registrations auto-activate |
| Announcement attachments + per-student targeting | V26 `announcement_attachment`, `announcement_link`, `target_student_user_id` | Supervisor / committee can attach files and external links and target specific students |
| Cycle lifecycle states | `CycleLifecycleService`, V24 placeholder constraints | Cycle ends ⇒ student write endpoints become read-only; admin closes/archives cycles |

**P2 candidates** (security / operational features that may not need
to be FRs but are worth a sentence):

- Login throttling (V27, 5 fails → 15-minute lockout)
- Password reset via single-use SHA-256-hashed token (V19/V21)
- Web Push notifications (V20 `push_subscription`, off by default)
- Chat-message thumbs feedback (V28)

**Action.** Two options:
1. **Conservative**: leave the FRs as the FYP1 snapshot; add a single
   short paragraph at the top of §3.4 noting that "additional
   FYP2-implemented features beyond the FR table are documented in
   chapter 5" with a cross-reference.
2. **Full**: add five new FRs (e.g. FR48–FR52) and the corresponding
   use cases UC34–UC38 in chapter 3. This is a bigger change and
   would also need matching sequence diagrams.

Recommended: **Option 1**. The FRs were committed in FYP1; touching
them risks confusion with what was originally examined.

### B4. `chapter4.md` — architecture diagram, second half

Already partly updated on 2026-05-10 (the AI service tech labels in
the mermaid block were corrected). Three more lines need fixing in
the same block:

**P1 — `chapter4.md` lines 103–105.**

```
AIClient -->|/recommendSupervisor| REC
AIClient -->|/analyzeProposal| PA
AIClient -->|/chatbotQuery| CB
```

Should be:

```
AIClient -->|POST /ai/recommendations| REC
AIClient -->|POST /ai/analyze-proposal| PA
AIClient -->|POST /ai/chat| CB
```

**P2 — Architecture-diagram-text inconsistency.** §4.1.4 (the System
Administrator subsection) describes the admin's responsibilities but
doesn't mention the FYP1 pass tracking page, the grading admin page,
the approved roster CSV upload, or the maintenance jobs page — all
of which are implemented and visible. A one-paragraph update would
bring it in line.

**P2 — Cross-references to the data dictionary.** §4.4 references
"the data dictionary in `Data-Dictionary-Report.md`" but does not
list the new tables. If the data dictionary is updated (B7 below),
chapter 4 should add a sentence noting that 36 tables are covered
across V1–V31.

### B5. `chapter3-ERD.md` — missing entities and columns

This is the biggest single piece of drift in the design artefacts.

**P1 — Missing entities (8).**

| Entity | Migration | Why it exists |
|---|---|---|
| `DEADLINE_REMINDER_LOG` | V17 | Idempotency record for the deadline reminder dispatcher (composite PK `(deadline_id, days_before)`) |
| `PASSWORD_RESET_TOKEN` | V19, V21 | Single-use password-reset tokens (SHA-256 hash only stored) |
| `PUSH_SUBSCRIPTION` | V20 | Web Push endpoints per browser/device |
| `APPROVED_STUDENT_ROSTER` | V22, V23 | Pre-authorisation list — student self-registrations auto-activate on match |
| `APPROVED_SUPERVISOR_ROSTER` | V22 | Same idea, supervisor side |
| `ANNOUNCEMENT_ATTACHMENT` | V26 | File attachments on announcements |
| `ANNOUNCEMENT_LINK` | V26 | External links on announcements |
| `FYP_GRADE` | V30 | Final-report grading rubric (one row per `(project, phase, grader)`) |

**P1 — Missing columns on existing entities.**

| Entity | Missing column(s) | Migration |
|---|---|---|
| `USER_ACCOUNT` | `password_hash`, `profile_image_path`, `login_attempts`, `lockout_until` | V1, V27 |
| `STUDENT_PROFILE` | `faculty`, `intake_year`, `expected_graduation`, `skills`, `bio`, `linkedin_url`, `github_url`, `portfolio_url` | V1 |
| `FYP_CYCLE` | `cycle_type`, `academic_year`, `semester`, `created_at`, `updated_at` | V2 |
| `SUPERVISOR_REQUEST` | `proposed_title`, `response_message`, `expires_at` | V2 |
| `PROJECT` | `fyp1_passed` | V15 |
| `MEETING` | `title`, `meeting_type`, `location`, `meeting_url`, `duration_minutes`, `notes`, `cancel_reason`, `alternative_datetimes`, `created_at` | V4 |
| `MEETING_LOG` | `student_user_id`, `supervisor_user_id`, `meeting_date`, `meeting_number`, `meeting_mode`, `fyp_phase`, `tasks_json`, `work_done_details`, `work_to_be_done`, `problems_and_solutions`, `correction_reason`, `created_at`, `updated_at` | V4 |
| `MEETING_LOG_SIGNATURE` | `signature_image_url`, `signature_sha256` | V4 |
| `ANNOUNCEMENT` | `priority`, `status`, `expires_at`, `view_count`, `updated_at` | V6 |
| `ANNOUNCEMENT_AUDIENCE` | `target_student_user_id` | V26 |
| `NOTIFICATION` | `target_route` | V6 |
| `CHAT_MESSAGE` | `references_json`, `feedback`, `feedback_at` | V7, V28 |
| `RESOURCE_DOCUMENT` | `description`, `file_name`, `file_size`, `download_count` | V5 |
| `DEADLINE` | `deadline_type`, `reminder_days`, `is_extendable`, `extended_date`, `created_at`, `updated_at` | V6 |

**P1 — Stale column to remove.**

`PROPOSAL_CHECK_RESULT.plagiarism_score` was dropped in V31. Both the
attribute table and the relationship paragraph at the top of the file
need to remove it.

**P1 — Missing relationships.**

```
USER_ACCOUNT ||--o{ PASSWORD_RESET_TOKEN : owns
USER_ACCOUNT ||--o{ PUSH_SUBSCRIPTION : owns
DEADLINE ||--o{ DEADLINE_REMINDER_LOG : has_fired
ANNOUNCEMENT ||--o{ ANNOUNCEMENT_ATTACHMENT : carries
ANNOUNCEMENT ||--o{ ANNOUNCEMENT_LINK : carries
USER_ACCOUNT ||--o{ ANNOUNCEMENT_AUDIENCE : addressed_to_student   (V26 added student targeting)
PROJECT ||--o{ FYP_GRADE : graded_by
USER_ACCOUNT ||--o{ FYP_GRADE : grades_as_grader
USER_ACCOUNT ||--o{ FYP_GRADE : finalises_as_admin
```

**Action.** One large edit to the mermaid block plus the
"Changes from FYP1 ERD (FYP2 update)" highlight section at the top.
The highlight section already exists — the new entities and columns
should be appended there with the same `<mark>...</mark>` styling
used for the V11–V14 round, so that the audit trail of "what FYP2
added" stays readable.

### B6. `Sequence Diagram.md` — endpoint paths and missing UCs

**P1 — Wrong AI endpoint paths (4 occurrences).**

| Line | Current | Should be |
|---|---|---|
| 319 | `REC->>AI: POST /recommendSupervisor` | `REC->>AI: POST /ai/recommendations` |
| 507 | `AIClient->>AI: POST /analyzeProposal` | `AIClient->>AI: POST /ai/analyze-proposal` |
| 529 | `AIClient->>AI: POST /analyzeProposal` | `AIClient->>AI: POST /ai/analyze-proposal` |
| 1262 | `AIClient->>AI: POST /chatbotQuery` | `AIClient->>AI: POST /ai/chat` |
| 1578 | `AIClient->>AI: POST /analyzeProposal` | `AIClient->>AI: POST /ai/analyze-proposal` |

**P2 — UC1 (Register and Log In) missing the modern flow steps.**

The current UC1 sequence covers register + login but does not cover:
- Login throttling (5-fail lockout) — should appear as an `alt`
  branch after credential validation.
- Password reset (forgot-password → email token → reset) — should
  arguably be its own use case (UC1A or UC34).
- Pre-approved roster auto-activation — the register branch
  unconditionally creates a `PENDING` user; in reality, a roster
  match flips it to `ACTIVE` immediately.

**P2 — Missing UCs for FYP2 features.** These have no sequence
diagram today:

| Suggested UC | Flow |
|---|---|
| UC34 — FYP1 Pass Tracking (Admin) | Admin opens pass-tracking page → sees compliance badge → marks pass/fail → confirmation modal if <6 logs → audit `FYP1_PASSED`/`FYP1_FAILED` |
| UC35 — Final-report Grading (Supervisor + Admin) | Supervisor submits rubric (DRAFT → SUBMITTED) → admin finalises (SUBMITTED → FINALISED) → student sees grade |
| UC36 — Approved Roster Upload (Admin) | Admin uploads CSV → matching self-registrations auto-activate |
| UC37 — Cycle Lifecycle (Admin) | Admin activates cycle → backfill placeholders + demote previous ACTIVE → notification fan-out |
| UC38 — Push Subscription (Browser + Backend) | Browser subscribes → backend stores endpoint + p256dh + auth_key → push fires through `PushService` |

**Action.** Two phases:
1. **P1 fix-pass**: search-and-replace the four endpoint paths.
2. **P2 expansion**: decide whether to add UC34–UC38. Same
   conservative-vs-full choice as B3. Recommended: add UC34 (pass
   tracking) and UC35 (grading) at minimum, since these are the
   two most user-visible new flows; defer the rest.

### B7. `Data-Dictionary-Report.md` — same scope as ERD plus enum drift

**P1 — Wrong role enum values (USER_ACCOUNT.role).**

```
"STUDENT", "SUPERVISOR", "FYP_ADMIN", "SYS_ADMIN"
```

Should be:

```
"STUDENT", "SUPERVISOR", "FYP_COMMITTEE", "SYSTEM_ADMIN"
```

Also `PROPOSAL_REVIEW.reviewer_role` carries the old `"FYP_ADMIN"`.

**P1 — Wrong status enum values.**

| Field | Current | Should be |
|---|---|---|
| `USER_ACCOUNT.status` | `"ACTIVE", "INACTIVE", "SUSPENDED"` | `"PENDING", "ACTIVE", "SUSPENDED", "BLOCKED"` |
| `FYP_CYCLE.status` | `"ACTIVE", "CLOSED", "UPCOMING"` | `"PLANNING", "ACTIVE", "COMPLETED", "ARCHIVED"` |
| `PROJECT.status` | `"DRAFT", "REGISTERED", "ACTIVE", "COMPLETED"` | `"ACTIVE", "COMPLETED", "SUSPENDED", "DROPPED"` |
| `SUPERVISOR_REQUEST.status` | `"PENDING", "ACCEPTED", "REJECTED"` | `"PENDING", "ACCEPTED", "REJECTED", "WITHDRAWN", "EXPIRED"` |
| `MEETING_LOG.status` | `"DRAFT", "SUBMITTED", "LOCKED"` | `"DRAFT", "SUBMITTED", "CORRECTION_REQUIRED", "SUPERVISOR_SIGNED", "LOCKED"` |
| `CHAT_MESSAGE.sender` | `"USER", "BOT", "SYSTEM"` | `"user", "assistant"` (lowercase, no SYSTEM) |
| `AUDIT_LOG.action` | `"CREATE", "UPDATE", "DELETE", "LOGIN", "LOGOUT"` | SCREAMING_CASE business events: `LOGIN_SUCCESS`, `LOGIN_FAILURE`, `LOGIN_LOCKOUT_TRIGGERED`, `USER_APPROVED`, `CYCLE_ACTIVATED`, `GRADE_FINALISED`, etc. |

**P1 — Stale column to remove.**

`PROPOSAL_CHECK_RESULT.plagiarism_score` (and the example value
`12.50`). Same as B5.

**P1 — Missing tables (same 8 as B5).**

`DEADLINE_REMINDER_LOG`, `PASSWORD_RESET_TOKEN`, `PUSH_SUBSCRIPTION`,
`APPROVED_STUDENT_ROSTER`, `APPROVED_SUPERVISOR_ROSTER`,
`ANNOUNCEMENT_ATTACHMENT`, `ANNOUNCEMENT_LINK`, `FYP_GRADE`.

**P1 — Missing columns (same set as B5).** See the table in B5.

**P1 — Total counts at the bottom of the file are stale.**

The summary says **"Total Tables: 28"** — should be **36**. Total
fields would also need recounting.

**Action.** Single large rewrite of the data dictionary. Suggested
structure:
1. Update every existing table's enum cells and add missing columns
   in the existing markdown tables.
2. Append eight new sections (one per missing table) at the bottom,
   wrapped in the same `<mark>...</mark>` highlight style used for the
   V11–V14 additions, so the audit trail of "what FYP2 added" stays
   visible.
3. Update the summary table at the bottom (table count 28 → 36;
   fields recount).

---

## C. Recommended execution order

If approved, the work should land in this sequence to minimise
re-rework when one document references another.

1. **Quick wins (single-line fixes)** — should land first because
   they're low-risk and unblock cross-references.
   - B2: chapter 2 §2.4.4 endpoint paths (1 paragraph)
   - B4 P1: chapter 4 architecture diagram endpoint labels (3 lines)
   - B6 P1: Sequence Diagram endpoint paths (4 occurrences)
   - B7 P1 enums: role / status / sender / action enum values across
     the data dictionary (~8 cells)

2. **Schema sync (matched pair)** — must land together so ERD and
   data dictionary stay consistent.
   - B5: ERD — drop `plagiarism_score`, add 8 new entities + ≥10
     column additions, add new relationships.
   - B7 schema: data dictionary — drop `plagiarism_score`, add 8
     new tables, add missing columns, fix totals.

3. **Optional expansions (decide first)** — these are bigger pieces
   that need explicit user approval before any edit.
   - B3 (option 2): add five new FRs to chapter 3.
   - B6 P2: add UC34–UC38 sequence diagrams.
   - B4 P2: extend chapter 4 §4.1.4 admin paragraph.

---

## D. Open questions before executing

1. **FRs and UCs** — do you want chapter 3 to stay as the FYP1-frozen
   snapshot, or should new FRs (FR48+) and UCs (UC34+) be added to
   reflect FYP2 features? **My recommendation: stay frozen, add a
   one-paragraph note pointing to chapter 5.**
2. **Highlight style** — the existing FYP2 additions in
   `chapter3-ERD.md` and `Data-Dictionary-Report.md` use
   `<mark>...</mark>` to call out new content. Should the new
   additions follow the same pattern, or use a different marker
   (e.g. `<!-- UPDATED 2026-05-10 -->` HTML comments as I used in
   chapters 1, 2, 4)?
3. **`AUDIT_LOG.action` enum** — the list of action codes is long.
   Do you want all known codes enumerated, or a representative
   sample (3–5) plus a "follows SCREAMING_CASE convention" note?
4. **Sequence Diagram UC1 expansion** — should login throttling and
   pre-approved roster activation be added as `alt` branches in the
   existing UC1 diagram, or written as separate sub-cases (UC1A,
   UC1B)?
5. **Plagiarism in the prose** — the rest of chapter 2 §2.3 / §2.5
   may still mention "plagiarism detection" in the literature
   review and the proposed-solution paragraph. Should those
   mentions be removed too, or left because the literature is real
   even though the implementation no longer claims to do it?

---

## E. Out of scope (will not be touched unless asked)

- Chapter 1 prose beyond the 2026-05-10 refresh.
- Use Case List (`UseCaseList.md`) — separate enumeration document;
  needs the same UC34–UC38 additions if option 2 of B3 is chosen.
- Chapter 5 (already fully rewritten 2026-05-10).
- Chapter 6 (testing) and Chapter 7 (conclusion) — not in current
  scope.

---

## F. Time estimate (rough)

- Quick wins only (recommended minimum): **~1 hour** of edits + verify.
- Quick wins + schema sync (recommended full): **~3 hours** including
  the ERD mermaid rewrite and the eight new data-dictionary tables.
- Quick wins + schema sync + UCs/FRs expansion: **~6 hours** including
  five new sequence diagrams and the FR additions.
