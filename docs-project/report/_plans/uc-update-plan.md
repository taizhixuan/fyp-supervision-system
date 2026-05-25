# Plan — UC and Sequence Diagram updates against current implementation

> Scope: place each missing FYP2 feature into the existing UC catalogue
> by **extending** an existing UC where possible and **adding** a new
> UC only where the flow has no natural home. For every UC change,
> list the matching sequence diagram update so the design artefacts
> stay consistent.
>
> Source of truth for "what's implemented": chapters 5.5.7, 5.5.8,
> 5.5.10, 5.6, 5.8 and the Demo-Walkthrough (Sections 1–3).
>
> Source of truth for "what's already in design": chapter 3 UC1–UC33
> (full specs at lines 219–2230), Sequence Diagram §4.2.1–§4.2.33.

---

## 1. The 5 missing features mapped to UCs

| # | Feature | Decision | Where |
|---|---|---|---|
| 1 | Approved-roster auto-activation | **Extend UC1** + **Extend UC30** | Add A5 to UC1; add A3 to UC30 |
| 2 | Login throttle (5 fails → 15-min lockout) | **Extend UC1** | Add A6 to UC1 (or extend A4) |
| 3 | Web Push subscriptions | **Extend UC14** | Add "browser push" channel to UC14 |
| 4 | FYP1 pass tracking + 6-log compliance soft warning | **New UC34** | Cannot fit into UC30 cleanly — pass-tracking has its own page, its own state machine, and its own audit codes |
| 5 | Final-report grading workflow | **New UC35** | Cannot fit into UC22 (supervisee dashboard) — the rubric → SUBMITTED → FINALISED state machine spans supervisor + admin + student visibility |

**Bonus item discovered while planning** — the FYP cycle lifecycle
itself (PLANNING → ACTIVE → COMPLETED → ARCHIVED, placeholder backfill,
notification fan-out) is a major admin function and **has no UC at
all** in the current chapter 3. This is documented in Demo-Walkthrough
§3.1–§3.3 but is missing from the design. Recommended:

| 6 | Manage FYP Cycle Lifecycle | **New UC36** | Cycle creation/activation/closure with all the automatic side-effects (placeholder backfill, notifications). Could fold into UC31 (Configure System Parameters) but cycles are entities not parameters — UC36 is cleaner. |

**Net effect:** 3 UCs extended (small edits) + 3 new UCs (full
specifications). Smaller than 5 brand-new UCs.

---

## 2. Detailed extensions to existing UCs

Every change below uses `<mark>...</mark>` to match the
existing FYP2-highlight convention in chapter 3.

### 2.1 UC1 (Register and Log In) — extend

**File:** `chapter3.md:221-287` (Table 3.5)

**Add to "Alternative Path" cell:**

```
<mark>A5: Pre-approved roster match → during registration, the system
checks the (mmu_id, email) pair against approved_student_roster or
approved_supervisor_roster. If both fields match together, the
account is created with status ACTIVE immediately and the student
is auto-enrolled in the currently active FYP1 cycle (placeholder
Project row). The user can log in straight away without admin
review.</mark>

<mark>A6: Repeated failed login attempts → after five consecutive
failed password matches the system locks the account for fifteen
minutes. Subsequent attempts during the lockout window return a
"temporarily locked" message stating how long until the account
is usable again. A successful login resets the counter.</mark>
```

**Add to "Exceptional Path" cell:**

```
<mark>E4: Authenticated account marked PENDING/SUSPENDED/BLOCKED →
login is rejected with a status-specific message (e.g. "Your
account is pending approval"). The JWT filter also re-reads
account status on every authenticated request, so a status flip
takes effect on the user's next call.</mark>
```

### 2.2 UC14 (View Reminders and Notifications) — extend

**File:** `chapter3.md:1018-1074` (Table 3.18)

**Modify "Description" cell** to mention three channels:

```
System notifies student about meetings, deadlines, and announcements
through configured channels (<mark>in-app inbox, email, and browser
push</mark>), based on the student's notification preferences.
```

**Modify "Basic Path" step 3** to mention three channels:

```
System sends notification through each enabled channel (<mark>in-app,
email, browser push</mark>).
```

**Modify A1** to mention browser-push opt-in:

```
A1: Student opens notification preferences and customises which
categories (meetings, proposals, announcements, deadlines) and
channels (in-app / email / <mark>browser push, with VAPID
subscription handled at the browser level</mark>) to receive; the
system stores the preferences and applies them to subsequent
notifications.
```

### 2.3 UC30 (Manage User Accounts and Roles) — extend

**File:** `chapter3.md:2034-2090` (Table 3.35)

**Add to "Alternative Path" cell** (A3, after the existing A2):

```
<mark>A3: Admin uploads a pre-approved roster CSV (student or
supervisor side) → matching self-registrations bypass the PENDING
queue and become ACTIVE on first login. This decouples cohort
admission from registration and removes the one-by-one approval
load at the start of every cycle.</mark>

<mark>A4: Admin reviews the pending-registrations queue → for each
non-roster registration, admin clicks Approve (status flips to
ACTIVE, notification fires) or Reject (status flips to BLOCKED
with optional reason).</mark>
```

---

## 3. New UCs to add

Each new UC follows the existing chapter-3 9-row format (ID, Name,
Actors, Description, Pre-condition, Postcondition, Basic Path,
Alternative Path, Exceptional Path).

### 3.1 NEW UC34 — Track FYP1 Pass Outcome (Admin)

**Insert location:** after UC33 (`chapter3.md:2211`).

```
Use Case ID:    UC34
Use Case Name:  Track FYP1 Pass Outcome
Actors:         System Administrator
Description:    System Administrator records each student's FYP1
                pass-or-fail decision against an externally produced
                grade list (eBwise / Clic). The system surfaces the
                meeting-log compliance count as a non-blocking
                soft warning.
Pre-condition:  FYP1 cycle is ACTIVE or COMPLETED; admin is logged
                in.
Postcondition:  Each project's fyp1_passed flag is set; passed
                students will be promoted to the next ACTIVE FYP2
                cycle on their next login.
Basic Path:
  1. Admin opens FYP1 Pass Tracking page.
  2. System lists every project in the relevant cycle with a
     compliance badge (green when ≥6 LOCKED meeting logs for
     FYP1 phase, yellow when <6).
  3. Admin clicks Pass or Fail for each project.
  4. System writes Project.fyp1_passed and audit-records the
     decision (FYP1_PASSED / FYP1_FAILED).
Alternative Path:
  A1: Admin marks Pass when the badge is yellow → confirmation
      modal quotes the shortfall ("only 4 of 6 logs"); admin
      confirms or cancels.
  A2: Admin uploads a CSV of pass/fail decisions for batch
      processing (POST /admin/projects/fyp1-passed/import).
Exceptional Path:
  E1: Project has no supervisor or no Project row → system marks
      the row as ineligible.
```

### 3.2 NEW UC35 — Grade Final Report (Supervisor + Admin)

**Insert location:** after UC34.

```
Use Case ID:    UC35
Use Case Name:  Grade Final Report
Actors:         Supervisor (grader), System Administrator (finaliser),
                Student (reader of finalised grade)
Description:    Supervisor grades a student's FYP1 or FYP2 final
                report against a JSON rubric. The grade goes through
                DRAFT → SUBMITTED → FINALISED. Only FINALISED grades
                are visible to the student.
Pre-condition:  Project exists and student is paired; supervisor is
                the assigned supervisor for the project.
Postcondition:  FypGrade row exists per (project, phase, grader);
                FINALISED grade is visible to the student.
Basic Path:
  1. Supervisor opens the supervisee's grading page.
  2. Supervisor enters criterion marks against the rubric and
     optional remarks.
  3. System derives total_score (sum of numeric criterion marks)
     and letter_grade (MMU FCI scale).
  4. Supervisor saves as DRAFT or submits as SUBMITTED.
  5. Admin opens grade administration page and reviews submitted
     grades.
  6. Admin clicks Finalise → grade status flips to FINALISED;
     finalised_by and finalised_at are recorded.
  7. Student sees the FINALISED grade and the grader's remarks
     on their dashboard.
Alternative Path:
  A1: Supervisor saves as DRAFT and returns later → grade remains
      hidden from admin's submitted-queue and from the student.
  A2: Multiple graders (supervisor + examiner) → separate FypGrade
      rows per grader; UNIQUE (project_id, phase, grader_user_id)
      enforces one row per grader.
Exceptional Path:
  E1: A non-assigned supervisor attempts to grade the project →
      system rejects with "You are not the assigned supervisor"
      (per-row ownership check).
  E2: Grader edits a FINALISED grade → system rejects; admin must
      revert to SUBMITTED first (currently a manual DB action).
```

### 3.3 NEW UC36 — Manage FYP Cycle Lifecycle (Admin)

**Insert location:** after UC35.

```
Use Case ID:    UC36
Use Case Name:  Manage FYP Cycle Lifecycle
Actors:         System Administrator
Description:    System Administrator creates, activates, completes,
                and archives FYP cycles. Cycle activation triggers
                placeholder backfill for unenrolled students; cycle
                completion triggers notification fan-out and
                read-only mode for enrolled students.
Pre-condition:  Admin is logged in.
Postcondition:  Cycle status reflects the requested transition;
                downstream side effects (placeholder rows,
                notifications, write-mode gating) are applied.
Basic Path:
  1. Admin creates a new cycle with type (FYP1/FYP2), academic
     year, semester, start/end dates. Cycle status starts as
     PLANNING.
  2. Admin attaches deadlines to the cycle (proposal due, log
     compliance check, final report submission), each with reminder
     days.
  3. Admin activates the cycle. System:
     a. Demotes any other ACTIVE cycle of the same type to
        COMPLETED (with notification fan-out).
     b. For an FYP1 cycle, runs backfillFyp1Placeholders so every
        ACTIVE student without a Project row gets a placeholder one
        pinned to the new cycle.
  4. Cycle runs through the trimester. All student write endpoints
     work as normal.
  5. End of trimester: admin marks the cycle COMPLETED. System
     fans out notifications to every enrolled student and switches
     student write endpoints to read-only (the cycle-active gate
     begins to throw 403 with a friendly message).
  6. After the academic year closes, admin archives the cycle. It
     drops off default views but is preserved for record.
Alternative Path:
  A1: Stale-placeholder special case → a student whose previous
      placeholder cycle just COMPLETED and who never picked a
      supervisor has their placeholder re-pointed to the next
      ACTIVE FYP1 cycle automatically. The student is not punished
      for missing the previous cycle.
  A2: FYP1 → FYP2 promotion → after a passed student's FYP1
      cycle is COMPLETED and a new FYP2 cycle is ACTIVE, the
      student's Project.stage flips on next login (handled by
      AuthService).
Exceptional Path:
  E1: Two ACTIVE cycles of the same type would coexist → blocked
      by the invariant; admin must complete the existing one
      first.
  E2: Cycle activation fails after partial side-effect application
      → error logged and the partial state is rolled back.
```

---

## 4. Sequence Diagram updates needed

Each UC change has a matching sequence-diagram change. Same
rule: **extend** wherever an existing diagram exists, **add** for
new UCs.

### 4.1 Extensions to existing diagrams

| UC | Sequence Diagram §  | Change |
|---|---|---|
| UC1 | §4.2.1 | Add `alt` branch in the **Register** part: roster lookup → match → ACTIVE + auto-enrol vs no-match → PENDING. Add `alt` branch in the **Log In** part: failed-attempt counter → if ≥5 set `lockoutUntil`, otherwise increment. Add `alt` branch: account status check (PENDING/SUSPENDED/BLOCKED) → status-specific message. |
| UC14 | §4.2.14 | Add a third channel "Push" to the existing notification dispatch fan-out. Add a separate sub-flow for "Browser opts in to push" → `POST /notifications/push/subscribe` → backend stores `PUSH_SUBSCRIPTION` row. |
| UC30 | (existing diagram for UC30) | Add `alt` branch: admin uploads roster CSV → backend validates → matching future self-registrations auto-activate. Add a second `alt`: pending-registration approve/reject. |

### 4.2 New sequence diagrams to add

Three new diagrams in the Sequence Diagram doc. Each follows the
existing 9-actor template (User, FE, BE, AUTH, SVC, DB, AUD, NOTI,
plus AI for AI flows).

**§4.2.34 UC34 — Track FYP1 Pass Outcome.** Sequence:
- Admin opens pass-tracking page → `GET /admin/projects/fyp1-pass`
- BE loads projects with compliance count from `MeetingLogComplianceService`
- For each row: admin clicks Pass/Fail → `POST /admin/projects/{id}/fyp1-passed`
- BE updates `project.fyp1_passed`, audit-records the action
- (Alt: admin uploads CSV → `POST /admin/projects/fyp1-passed/import` → bulk update + audit per row)

**§4.2.35 UC35 — Grade Final Report.** Sequence:
- Supervisor opens grading page → `GET /supervisor/grades`
- Supervisor submits rubric → `POST /supervisor/grades` (status DRAFT or SUBMITTED)
- BE writes `fyp_grade` row, audit-records `GRADE_SUBMITTED`
- Admin opens admin grades page → `GET /admin/grades`
- Admin finalises → `POST /admin/grades/{gradeId}/finalise`
- BE flips status to FINALISED, audit-records `GRADE_FINALISED`
- Student opens dashboard → `GET /student/grades` returns only FINALISED rows

**§4.2.36 UC36 — Manage FYP Cycle Lifecycle.** Sequence:
- Admin creates cycle → `POST /admin/cycles`
- Admin activates → `POST /admin/cycles/{id}/activate`
- BE: `CycleLifecycleService.setCycleStatus(id, ACTIVE)` →
  - Demote other ACTIVE cycle of same type → COMPLETED + notification fan-out
  - `backfillFyp1Placeholders()` for FYP1 cycles
- Cycle runs through trimester
- Admin completes → `POST /admin/cycles/{id}/complete`
- BE: notification fan-out + status flips to COMPLETED + write endpoints become read-only
- (Alt) Admin archives → `POST /admin/cycles/{id}/archive`

---

## 5. ERD and Data Dictionary updates needed for these UC additions

The schema-sync work from the previous turn already covers the
entities used by the new UCs:

| New UC | Tables / columns it relies on | Status |
|---|---|---|
| UC1 A5 (roster) | `APPROVED_STUDENT_ROSTER`, `APPROVED_SUPERVISOR_ROSTER` | ✅ Added to ERD; ⏸️ data dictionary pending (the previous Edit failed mid-pass — needs re-execution) |
| UC1 A6 (throttle) | `USER_ACCOUNT.login_attempts`, `lockout_until` | ✅ Listed in ERD highlight section; ⏸️ data dictionary pending |
| UC14 push | `PUSH_SUBSCRIPTION` | ✅ Added to ERD; ⏸️ data dictionary pending |
| UC34 (FYP1 pass) | `PROJECT.fyp1_passed` | ✅ Listed in ERD highlight section; ⏸️ data dictionary pending |
| UC35 (grading) | `FYP_GRADE` | ✅ Added to ERD; ⏸️ data dictionary pending |
| UC36 (cycle lifecycle) | `FYP_CYCLE.cycle_type/status` (already exists), `PROJECT (cycle_id, student_user_id) UNIQUE` (V24) | ✅ Already in design; the highlight section needs to call out the V24 UNIQUE constraint |

The ERD additions from the previous turn are good — no further ERD
work is needed for the UC additions. The data dictionary needs the
8 new tables added (the work that stalled in the previous edit pass).

---

## 6. Functional requirements (chapter 3 §3.4) — recommendation

Same conservative call as before: **leave FRs as the FYP1 snapshot**
and add a single one-paragraph note at the top of §3.4 saying that
additional features added during FYP2 are documented as new UCs (UC34
–UC36) and in chapter 5. This keeps FR1–FR47 frozen as the
originally-examined baseline while still acknowledging the FYP2
additions.

---

## 7. Recommended execution order

1. **Finish the data-dictionary schema sync** that stalled in the
   previous pass (8 new tables) so the entity references in the new
   UCs land on a complete data dictionary.
2. **Extend UC1, UC14, UC30** in chapter 3 (3 small edits).
3. **Add UC34, UC35, UC36 specifications** to chapter 3 (3 new
   tables in the same format as existing UCs).
4. **Update the use-case-by-actor table** at chapter 3 lines 95–209
   so the new UCs appear in the Admin section.
5. **Extend UC1 and UC14 sequence diagrams** with the new `alt`
   branches.
6. **Add UC34, UC35, UC36 sequence diagrams** to the Sequence
   Diagram doc.
7. **Add the bridging note** to chapter 3 §3.4 preamble pointing to
   chapter 5 for FYP2 features.
8. **Add the bridging note** to the Sequence Diagram doc preamble
   noting that UC34–UC36 are FYP2 additions.

Estimated time: **~3 hours total**. Most of it is the 3 new UC
specifications and 3 new sequence diagrams; the extensions to UC1,
UC14, UC30 are 30 minutes combined.

---

## 8. Open questions

1. **UC36 (cycle lifecycle) — yes or no?** It is a major admin flow
   with no current UC. Adding it makes the design genuinely
   complete; not adding it leaves cycle management implicit. My
   recommendation: **add it**.
2. **Bridging note style** — same `<!-- UPDATED 2026-05-10 -->` HTML
   comment used in chapters 1, 2, 4, or as a one-paragraph
   `<mark>...</mark>` block in the §3.4 preamble? Recommendation:
   `<mark>` block to match chapter 3's existing FYP2 highlight
   convention.
3. **Use-case-by-actor table update** (chapter 3 lines 95–209) —
   should UC34, UC35, UC36 appear under the Admin actor only, or
   should UC35 (grading) also appear under Supervisor and Student
   (since both are involved)? Recommendation: list under all
   actors involved (matches the existing pattern of UC1 appearing
   under all four actors).

---

## 9. What this plan does NOT do

- Does not add new functional requirements (FR48+) — the FRs stay as
  the FYP1 snapshot per your earlier decision.
- Does not touch chapter 4 (architecture) — already current.
- Does not modify chapter 1 — already refreshed.
- Does not enumerate every action code in `AUDIT_LOG` (out of scope
  for this UC pass).
