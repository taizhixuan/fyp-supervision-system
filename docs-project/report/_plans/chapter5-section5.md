# Plan — Chapter 5.5: Key Modules and Features Developed

> **Framing.** Section 5.5 already exists in `chapter5.md` (lines 731–1217)
> as a nine-subsection draft. The user has flagged that the existing draft
> "looks AI-written" and that it must be brought up to date with the
> current codebase. This document is therefore a planning brief for a
> **rewrite**, not a fresh write — it identifies (a) where the existing
> draft drifts from the current code, (b) which modules are missing, and
> (c) how to restructure and re-tone the section.

---

## 1. Implemented modules confirmed in code

The 9-module split in the existing draft still maps cleanly to the code.
Items below cite the actual files so each subsection has something to
reference. Nothing in this list is fabricated — every path was opened
during the survey.

### 1.1 Authentication and account lifecycle
- `controller/AuthController.java` — `/auth/register`, `/auth/login`,
  `/auth/me`, `/auth/forgot-password`, `/auth/reset-password`,
  `/auth/verify-reset-token`, `/auth/change-password`.
- `service/AuthService.java` — login, registration, password reset,
  pending-account guard.
- `security/JwtTokenProvider.java`, `security/JwtAuthenticationFilter.java`,
  `security/SecurityConfig.java` — URL-prefix authority routing.
- Frontend: `pages/auth/{LoginPage,RegisterPage,ForgotPasswordPage,
  ResetPasswordPage,AccountPendingPage,AccountBlockedPage,
  Fyp1ResultPendingPage}.tsx`, `lib/api/client.ts` (Axios interceptors,
  401 → `/session-expired`).

### 1.2 Student workflow (twelve student controllers)
- `controller/student/StudentDashboardController.java`,
  `StudentProfileController.java`,
  `SupervisorDirectoryController.java`,
  `StudentRecommendationController.java`,
  `StudentSupervisionRequestController.java`,
  `StudentProposalController.java`,
  `StudentMeetingController.java`,
  `StudentMeetingLogController.java`,
  `StudentLogController.java`,
  `StudentDocumentController.java`,
  `StudentDeadlineController.java`,
  `StudentChatController.java`,
  `StudentGradeController.java`.
- `service/StudentService.java` — registration-status state machine,
  dashboard aggregation.
- `service/StudentAccessService.java` — `requireActiveCycle()` block on
  every student write endpoint when `Project.cycle.status` ∈ {COMPLETED,
  ARCHIVED}.
- Frontend: `pages/student/*.tsx` — 37 pages spanning the full FYP1
  journey, plus `<StudentFeatureGate>` / `<RegisteredOnlyLockGate>` /
  `<CycleActiveGate>`.

### 1.3 AI supervisor recommendation
- `ai-recommendation/app.py` (409 lines) — Flask :5001.
- **Algorithm change vs existing draft (drift):** the runtime is now a
  *deterministic, untrained* weighted score, not an XGBoost model. The
  module docstring (`app.py` lines 1–25) states explicitly: "no training,
  no LLM in hot path". Live formula:
  ```
  score = 0.50·cosine(student_emb, supervisor_emb)
        + 0.18·jaccard(student.interests, supervisor.researchAreas)
        + 0.10·jaccard(student.skills,    supervisor.expertise)
        + 0.07·programme_match
        + 0.15·availability_factor
  ```
- Embedding model: `BAAI/bge-base-en-v1.5` (768-dim) by default, with
  BGE prefix conventions ("query: …", "passage: …"). Falls back to any
  Sentence-BERT model via `REC_EMBED_MODEL` env.
- Hard filter: supervisors at capacity or marked `UNAVAILABLE` are
  dropped *before* scoring (not penalised after).
- Supervisor text includes recent supervised project titles, not just
  self-described expertise — explicit design choice in `_supervisor_text`.
- Explanation generator is local (no LLM) — built from the score
  breakdown in `_build_explanation`.
- Backend gateway: `service/AiServiceClient.getRecommendations(...)`
  posts to `${AI_RECOMMENDATION_URL}/ai/recommendations`.
- Frontend: `pages/student/AIRecommendations.tsx`,
  `pages/student/CompareSupervisors.tsx`.

### 1.4 Supervisor workflow (ten supervisor controllers + grading)
- `controller/supervisor/{SupervisorDashboardController,
  SupervisorProfileController, SupervisorRequestController,
  SupervisorSuperviseeController, SupervisorProposalController,
  SupervisorMeetingController, SupervisorMeetingLogController,
  SupervisorLogController, SupervisorDocumentController,
  SupervisorAnnouncementController, SupervisorGradeController}.java`.
- `service/SupervisorService.java`, `service/SupervisorAccessService.java`
  — ownership checks (`requireOwnRequest/Project/Proposal/Meeting/Log`).
- Quota and accept/reject logic in `SupervisorService` — increments
  `supervisor_profile.current_load` on accept; refuses on quota breach.
- Frontend: `pages/supervisor/*.tsx` (21 pages).

### 1.5 Proposal workflow + AI proposal analyzer
- Backend controllers (per role): `StudentProposalController`,
  `SupervisorProposalController`, `CommitteeProposalController`.
- `ai-proposal-analyzer/app.py` (439 lines) + `nlp_utils.py` (534 lines).
- **Pipeline (verified against `analyze_proposal` in `app.py`):**
  1. Always-on rule-based NLP — clarity (Flesch-Kincaid + Gunning Fog),
     structure (section-coverage check), scope, innovation (`nlp_utils`).
  2. Fine-tuned DistilBERT regression in `models/essay_scorer/`,
     **chunk-and-averaged** over 480-token windows with 96-token overlap
     (`predict_quality_score` lines 154–216) — replaces the earlier
     "first 400 words only" truncation.
  3. Optional remote LLM for "detailed strengths/weaknesses/suggestions"
     prose. Provider precedence: `LLM_API_KEY` → `GROQ_API_KEY` →
     `OPENAI_API_KEY` (lines 67–93). **NOT just OpenAI** as the existing
     draft says.
- **Plagiarism field has been deliberately removed** (see comment at
  `app.py` lines 14–17). The existing 5.5 draft does not mention this,
  but it should — it is a deliberate honesty decision.
- Backend persistence: `proposal`, `proposal_version` (append-only),
  `proposal_check_result`, `proposal_review`.

### 1.6 Meeting logs and digital signature
- `service/MeetingLogService.java` — DRAFT → SUBMITTED →
  SUPERVISOR_SIGNED → LOCKED state machine; `CORRECTION_REQUIRED` branch
  resets to DRAFT.
- `service/MeetingLogComplianceService.java` — counts LOCKED logs per
  phase against the FCI 6-log minimum.
- Signature: PNG data-URL stored in `signature_image_url`; SHA-256 hash
  in `signature_sha256` (Java `MessageDigest`).
- Frontend canvas + PDF export: `html2canvas` + `jspdf` in
  `pages/student/MeetingLogDetail.tsx`, `pages/student/LogDetail.tsx`,
  and the supervisor-side equivalents.

### 1.7 FYP committee oversight
- `controller/committee/{CommitteeDashboardController,
  CommitteeProjectController, CommitteeProposalController,
  CommitteeDocumentController, CommitteeAnnouncementController,
  CommitteeReportController}.java`.
- `service/CommitteeService.java` (dashboard aggregations),
  `service/CommitteeReportService.java` (CSV export to
  `uploads/reports/`, persisted as `generated_report` rows).
- Frontend: `pages/committee/*.tsx` (15 pages including `UnpairedStudents`,
  `SupervisorLoad`, `ReportsHistory`, `ReportsModule`).

### 1.8 System administration
- `controller/admin/{AdminDashboardController, AdminUserController,
  AdminCycleController, AdminDeadlineController, AdminParameterController,
  AdminIntegrationController, AdminAuditLogController,
  AdminExportController, AdminMaintenanceController, AdminProjectController,
  AdminGradeController, AdminJobController, AdminRosterController}.java`.
  **The existing draft says "nine controllers"; the actual count is
  thirteen.**
- `service/AdminService.java`, `service/AdminMaintenanceService.java`,
  `service/AdminExportService.java`, `service/AdminRosterService.java`.
- `service/CycleLifecycleService.java` — single source of truth for
  active-cycle lookups; activating an FYP1 cycle backfills placeholder
  `Project` rows for every active student; cycle COMPLETED/ARCHIVED
  triggers cycle-ended notifications via `NotificationService`.

### 1.9 AI chatbot (RAG)
- `ai-chatbot/app.py` (177 lines) + `rag_engine.py` (665 lines) +
  `build_knowledge_base.py`.
- 15 knowledge documents under `knowledge_base/` covering proposals,
  meeting logs, report writing, methodology, etc.
- **Generator path (drift vs existing draft):**
  - **Local Flan-T5 is OFF by default** (`app.py` lines 100–105). The
    existing draft implies it is the primary fallback — actually
    `USE_LOCAL_GEN=false` and the *extractive* path runs instead.
  - Provider precedence: same triple — `LLM_API_KEY` → `GROQ_API_KEY` →
    `OPENAI_API_KEY`. Default Groq model is
    `llama-3.3-70b-versatile`.
  - Confidence multiplier per generator path (`rag_engine.py` lines
    107–114): remote 1.00, flan_t5 0.70, extractive 0.55.
- Out-of-scope reply at top-1 cosine < 0.30 (`OUT_OF_SCOPE_THRESHOLD`).
- Intent classifier (twelve intents, weighted-keyword ranked) routes the
  fallback message — this is also missing from the existing draft.
- Backend: `service/AiServiceClient.chat(...)`, persistence in
  `chat_session` and `chat_message`.

---

## 2. Modules implemented but missing or under-covered in the existing 5.5

The existing draft buries or omits several first-class modules. The
rewrite should treat each as either its own subsection or a clearly
labelled segment under the closest existing one.

### 2.1 Cycle lifecycle and student-to-cycle attachment (currently absent)
- `service/CycleLifecycleService.java` is the spine of the cycle model —
  invariant (one ACTIVE cycle per type), placeholder backfill on FYP1
  activation, automatic notifications on COMPLETED/ARCHIVED, and the
  read-only gate that `StudentAccessService.requireActiveCycle` keys off.
- Worth pulling out because Chapter 4 spends real ink on the cycle/phase
  model and the existing 5.5 hides it inside "Admin".
- Suggested home: new short subsection 5.5.7 "Cycle Lifecycle and
  Read-Only Gating" between Committee and Admin.

### 2.2 FYP grading + FYP1 pass tracking (currently absent)
- `service/GradingService.java` — `FypGrade` per (project, phase, grader)
  with a JSON `rubricJson`, derived `totalScore`, and MMU FCI letter
  grade (A/A-/B+/.../F).
- Status flow DRAFT → SUBMITTED → FINALISED; only the assigned
  supervisor can write a SUPERVISOR-role grade; admin finalises.
- Frontend: `pages/admin/Fyp1PassTracking.tsx`,
  `pages/admin/AdminGrades.tsx`, `pages/supervisor/SupervisorGrades.tsx`,
  `pages/student/` reads grades via `StudentGradeController`.
- This is a real, working module and is conspicuously missing.

### 2.3 Meeting-log compliance (currently a paragraph, should be a half-page)
- `MeetingLogComplianceService` enforces the FCI 6-log minimum per phase,
  surfaces `meetingLogsCompleted` / `meetingLogsRequired` in DTOs, and is
  consumed by both the student dashboard widget and the admin pass-track
  soft-warning. Not blocking server-side — admin can still mark PASS, but
  the frontend confirms.

### 2.4 Announcements (currently absent as a module)
- `service/AnnouncementService.java` is the single source of truth for
  audience filtering (ALL, FYP1, FYP2, PROGRAMME_*, SPECIFIC_STUDENTS),
  multipart create with attachments, external links, and pagination.
- Used by `AnnouncementController` (student-facing, permitAll for the
  `latest` route), `SupervisorAnnouncementController`, and
  `CommitteeAnnouncementController`.
- Worth a short subsection because the audience filter is the
  load-bearing piece of correctness.

### 2.5 Notification system (currently mentioned only in passing)
- `service/NotificationService.java` (in-app),
  `service/EmailService.java` (SMTP),
  `service/PushService.java`,
  `service/NotificationPreferenceService.java`.
- `controller/NotificationController.java`,
  `controller/NotificationPreferenceController.java`.
- Frontend: `pages/{student,supervisor,admin,committee}/NotificationCenter.tsx`,
  `pages/student/NotificationSettings.tsx`.
- Multi-channel fan-out belongs in 5.5, not buried in committee/admin.

### 2.6 Audit logging (currently absent)
- `service/AuditService.java` — REQUIRES_NEW + try/catch so log writes
  never break the action being logged. Best-effort recording with
  `recordAnonymous` for pre-auth events (failed logins).
- `controller/admin/AdminAuditLogController.java` and
  `pages/admin/AuditLogs.tsx` consume it.
- Pairs naturally with the admin section (or stands alone as a short
  cross-cutting subsection).

---

## 3. Items in the existing draft that are inaccurate and must be corrected

These are factual errors in `chapter5.md` 5.5.\* — flag during rewrite.

| Existing claim | Actual code | Source |
|---|---|---|
| AI recommender uses XGBoost trained on synthetic labels with `models/xgb_model.pkl` and falls back to MiniLM cosine | Deterministic weighted score; **no training, no LLM in hot path**; embedding model is `BAAI/bge-base-en-v1.5` (768-dim), not `all-MiniLM-L6-v2`. The pkl file exists in `ai-recommendation/models/` as a leftover but is not used | `ai-recommendation/app.py:1–25,78–98,284–319` |
| Recommendation feature vector is 8-D, includes `currentLoad / quota`, `|interests ∩ areas|` etc. and produces `xgb.predict(features)` | Score is a 5-component weighted sum (semantic, interest-jaccard, skill-jaccard, programme, availability) and explanations are template-built locally | `ai-recommendation/app.py:284–319,239–278` |
| AI explanations use "OpenAI gpt-3.5-turbo when `OPENAI_API_KEY` is set" | Recommender has **no LLM call path at all** | `ai-recommendation/app.py` (search for `openai` returns nothing) |
| Proposal analyzer uses MiniLM + falls back to GPT-3.5 | Uses fine-tuned DistilBERT (chunk-and-averaged) plus an OpenAI-compatible LLM whose provider precedence is `LLM_API_KEY` → `GROQ_API_KEY` → `OPENAI_API_KEY` | `ai-proposal-analyzer/app.py:42–113,150–217` |
| Proposal analyzer "tokenize at max_length=512, run forward pass, softmax to 0–100" | Chunk-and-average over 480-token windows with stride 384, weighted by chunk length, raw logit clamped to [0,1] then ×100 | `ai-proposal-analyzer/app.py:154–216` |
| Chatbot generator is "Flan-T5 running locally" with optional OpenAI augmentation | Flan-T5 is OFF by default (`USE_LOCAL_GEN=false`); primary path is remote OpenAI-compatible LLM (Groq/OpenAI/OpenRouter); the local fallback is **extractive**, not Flan-T5 | `ai-chatbot/app.py:100–119`, `rag_engine.py:107–114` |
| "Nine admin controllers" | Thirteen: dashboard, user, cycle, deadline, parameter, integration, auditlog, export, maintenance, project, grade, job, roster | `controller/admin/` |
| `proposal_check_result` "with the V10 column proposal_id pointing back to the proposal" | True but the V-number reference is fragile prose; replace with a short statement of fact | `db/migration/V10__*.sql` |
| Plagiarism reported as a field of the analyzer | Removed deliberately; the docstring says so | `ai-proposal-analyzer/app.py:14–17` |

---

## 4. Tone problems in the existing draft (the "AI-written" feel)

The current 5.5 reads as AI-written for a few reasons. The rewrite must
fix them. Cross-check against `Project-info/CLAUDE.md` (the report's own
tone rules).

- **Bullet-pattern repetition.** Every subsection uses the same
  4-heading template (Technologies used / Functionality / Code snippet /
  Pseudocode / Integration). Vary it. Some modules need only two
  paragraphs; others need a flow diagram instead of pseudocode.
- **AI-tell phrases that already appear** (search `chapter5.md` lines
  731–1217):
  - "robust" / "comprehensive solution" — not in the section yet, but
    watch for them in the rewrite.
  - "leverage" — "leverages" appears in many files; do not reintroduce.
  - "It is important to note that" — absent; keep absent.
  - Marketing softeners like "graceful fallback", "never breaks",
    "dashboard never crashes" appear several times. Rewrite to plain
    description: *"the client returns an empty list so the page renders
    an empty state."*
- **Hedge density.** "may", "can", "could" appear too frequently — the
  CLAUDE.md rule is ≤ 2 per paragraph. Audit and trim.
- **Three-sentence parallel structure.** Each subsection's intro
  paragraph follows the same `<noun> supports <verb-phrase>; <noun>
  enforces <verb-phrase>; <noun> exposes <verb-phrase>` rhythm. Break
  it.
- **Pseudocode-as-decoration.** Some pseudocode blocks (e.g. the
  authenticated-request lifecycle in 5.5.1) restate what Spring Security
  does for any reader who already knows it. Replace with one sentence
  + a code snippet showing the actual filter.
- **Module-by-module preambles.** The boilerplate "**Technologies
  used:** Spring Boot service layer, JPA repositories, and React pages
  …" is filler. Cut it; weave the technology in where relevant.
- **British spelling slips.** Existing text mixes "organised" (UK) and
  "behavior" (US) — pass once for consistency. Chapters 1–4 use UK
  spelling.

---

## 5. Proposed 5.5 subsection plan (rewrite)

Eleven subsections, depth-balanced. Numbering kept conservative — drop
or merge if length runs over.

### 5.5.1 User authentication and access control — *short (~1 page)*
- Scope: register/login/me, JWT issuance, status gating, URL-prefix
  authority routing, password reset flow.
- Files: `AuthController`, `AuthService`, `JwtTokenProvider`,
  `JwtAuthenticationFilter`, `SecurityConfig`.
- Logic to highlight: account-status guard
  (`PENDING/ACTIVE/SUSPENDED/BLOCKED`) and the URL-prefix → authority
  table.
- Code snippet: `AuthService.login` (already in draft — keep, lightly
  rewrite).
- Figures: figure showing the URL → authority mapping table; login UI
  screenshot.

### 5.5.2 Student workflow and registration state machine — *medium (~1.5 pages)*
- Scope: state machine, paired vs unpaired gating, the dashboard
  payload that consolidates seven domain fetches.
- Files: `StudentService`, `StudentDashboardController`,
  `StudentAccessService`, frontend `<StudentFeatureGate>` and
  `<RegisteredOnlyLockGate>` and `<CycleActiveGate>`.
- Logic to highlight: server-side state guards on each transition.
- Code snippet: `MeetingLogService.createLog` (kept — accurate).
- Figures: state-transition diagram; student dashboard screenshot.

### 5.5.3 Supervisor discovery and AI recommendation — *detailed (~2.5 pages)*
- Scope: directory + filter + recommendation flow.
- Files: `SupervisorDirectoryController`, `StudentRecommendationController`,
  `AiServiceClient.getRecommendations`, `ai-recommendation/app.py`.
- **Algorithm to highlight (corrected):** the deterministic weighted
  score, the BGE prefix convention, the hard availability filter,
  past-supervised-titles signal, locally generated explanations.
- Pseudocode: rewrite to match actual code (5-component weighted sum,
  hard filter first).
- Figures: recommendation results page screenshot; small bar chart of
  the 5 score components for a sample top match.
- Worth detail because it is the project's first AI differentiator.

### 5.5.4 Supervisor workflow and ownership checks — *short (~1 page)*
- Scope: accept/reject, quota enforcement, supervisee dashboard, log
  signing.
- Files: `SupervisorService`, `SupervisorAccessService` (the
  centralised ownership checks added in this branch),
  `SupervisorRequestController` and friends.
- Logic to highlight: quota arithmetic on accept; the signed-log
  lifecycle.
- Code snippet: keep the existing `acceptRequest` pseudocode but trim
  marketing prose around it.

### 5.5.5 Proposal lifecycle and AI proposal analyzer — *detailed (~2.5 pages)*
- Scope: draft → submit → analyze → review → revise loop; the
  three-stage pipeline.
- Files: `StudentProposalController` / `SupervisorProposalController` /
  `CommitteeProposalController`, `ProposalDocumentService` (DOCX render),
  `ai-proposal-analyzer/app.py`, `nlp_utils.py`.
- **Algorithm to highlight (corrected):**
  1. Always-on rule-based NLP — list the metrics it actually computes
     (Flesch-Kincaid grade, Gunning Fog, section coverage, sentence
     length stats, citation count).
  2. Fine-tuned DistilBERT, *chunk-and-averaged* with overlap.
  3. Optional remote LLM for prose feedback only — cite the provider
     precedence chain.
  4. The deliberately-removed plagiarism field — say so plainly.
- Code snippet: `predict_quality_score` chunking loop (it shows the
  actual algorithm, not boilerplate).
- Figures: proposal analysis results screenshot; pipeline diagram.

### 5.5.6 Meeting logs, signatures, and FCI compliance — *medium (~1.5 pages)*
- Scope: log lifecycle, dual-signature SHA-256 anchor, 6-log minimum.
- Files: `MeetingLogService`, `MeetingLogComplianceService`,
  `MeetingLogSignatureRepository`.
- Logic to highlight: the lifecycle diagram (already in the draft —
  keep), the SHA-256 signature anchor, soft-warning policy on the
  6-log floor.
- Figures: signed log PDF export screenshot; lifecycle diagram.

### 5.5.7 Cycle lifecycle and read-only gating — *short (~1 page)* — *NEW*
- Scope: ACTIVE/COMPLETED/ARCHIVED cycle states; placeholder backfill
  on FYP1 activation; the `requireActiveCycle` write-block.
- Files: `CycleLifecycleService`, `StudentAccessService`,
  `AdminCycleController`, `pages/admin/CycleManagement.tsx`,
  `pages/student/LockedFeaturePage.tsx`.
- Logic to highlight: idempotent backfill, automatic notifications on
  cycle close, the soft-block UX vs hard-block server semantics.
- Figures: the cycle status state diagram; locked-feature page
  screenshot.

### 5.5.8 Announcements and audience filtering — *short (~1 page)* — *NEW*
- Scope: scope enum, audience filtering, multipart upload, attachments.
- Files: `AnnouncementService`, `AnnouncementController`,
  `Supervisor/CommitteeAnnouncementController`,
  `pages/{committee,supervisor}/CreateAnnouncement.tsx`.
- Logic to highlight: filter-then-paginate ordering (the bug fixed in
  this branch — `listForStudent` loads all, filters, then slices).
- Code snippet: the audience-filter guard; one screenshot of an
  announcement card.

### 5.5.9 Committee oversight and reporting — *short (~1 page)*
- Scope: aggregated dashboards, report generation (CSV).
- Files: `CommitteeService`, `CommitteeReportService`,
  `CommitteeReportController`.
- Logic to highlight: server-side aggregation rationale (correctness +
  one round-trip).
- Figures: committee dashboard screenshot; sample CSV header.

### 5.5.10 System administration, audit, and grading — *medium (~1.5 pages)*
- Scope: user CRUD, parameter editing, maintenance jobs, audit log,
  FYP grading and FYP1 pass tracking.
- Files: `AdminService`, `AdminMaintenanceService`, `AdminExportService`,
  `AuditService`, `GradingService`, the thirteen admin controllers, and
  `pages/admin/{Fyp1PassTracking,AdminGrades,AuditLogs,JobHistory,
  MaintenanceCenter,SystemParameters}.tsx`.
- Logic to highlight:
  1. Audit trail policy (`REQUIRES_NEW`, swallow on failure).
  2. Parameter-driven runtime behaviour (`system_parameter` re-read on
     each request).
  3. `@Async` job pattern.
  4. Grading rubric → letter grade mapping (the FCI scale).
- Figures: admin dashboard with health checks; audit log page; FYP1
  pass-tracking page with the soft-warning badge.

### 5.5.11 RAG chatbot and knowledge base — *detailed (~2 pages)*
- Scope: knowledge ingestion → FAISS index → retrieval → generation,
  intent routing, persistence.
- Files: `ai-chatbot/build_knowledge_base.py`, `rag_engine.py`,
  `app.py`, `StudentChatController`, `pages/student/Chatbot.tsx`.
- **Algorithm to highlight (corrected):**
  - Chunk + embed (`all-MiniLM-L6-v2`) into FAISS.
  - Retrieve top-5; out-of-scope cutoff at 0.30.
  - Generator path: remote LLM (Groq default) → optional Flan-T5 (off
    by default) → extractive — list the confidence multipliers.
  - Intent classifier (twelve intents, weighted-keyword ranked).
- Code snippet: `classify_intent` keyword-weighting block (small, real,
  illustrative).
- Figures: chatbot UI screenshot with a citation-bearing answer; small
  diagram of the retrieve → rerank → generate pipeline.

---

## 6. Suggested figures (consolidated)

| Figure | Source | Section |
|---|---|---|
| Login + JWT issuance flow | sequence diagram or screenshot | 5.5.1 |
| URL-prefix → authority table | text figure | 5.5.1 |
| Student state machine | new diagram | 5.5.2 |
| Student dashboard | screenshot | 5.5.2 |
| AI recommendation results | screenshot | 5.5.3 |
| Score-component breakdown | small bar chart | 5.5.3 |
| Supervisor request inbox | screenshot | 5.5.4 |
| Proposal analysis results | screenshot | 5.5.5 |
| Proposal-analysis pipeline diagram | new | 5.5.5 |
| Signed meeting log PDF export | screenshot | 5.5.6 |
| Meeting-log lifecycle | existing diagram | 5.5.6 |
| Cycle status state diagram | new | 5.5.7 |
| Locked-feature page | screenshot | 5.5.7 |
| Announcement card with audience badge | screenshot | 5.5.8 |
| Committee dashboard | screenshot | 5.5.9 |
| Admin dashboard + AI health check | screenshot | 5.5.10 |
| Audit log page | screenshot | 5.5.10 |
| FYP1 pass tracking | screenshot | 5.5.10 |
| Chatbot answer with references | screenshot | 5.5.11 |
| RAG retrieve→generate diagram | new | 5.5.11 |

---

## 7. Open questions — confirm before drafting

1. **Subsection count.** The existing draft uses 9 subsections. The
   plan above proposes 11 by promoting Cycle Lifecycle and Announcements
   to first-class. Acceptable, or fold them back into Admin / Committee?
2. **Grading depth.** The grading module is implemented end-to-end. Is
   the user comfortable having 5.5.10 cover both "system admin" and
   "FYP grading", or should grading get its own subsection?
3. **AI subsection ordering.** Recommendation comes early (5.5.3) so it
   sits next to supervisor discovery; Analyzer (5.5.5) sits next to
   Proposals; Chatbot ends the section (5.5.11). Confirm this ordering
   matches what Chapter 6 will reference.
4. **Pseudocode policy.** The user dislikes the AI-written feel. Should
   the rewrite drop pseudocode blocks entirely (in favour of one-line
   prose + a real code snippet), keep them only for AI modules, or keep
   them throughout?
5. **Plagiarism note.** Should the report acknowledge that plagiarism
   detection was scoped out (honest), or omit it (cleaner)? CLAUDE.md
   says don't soften technical facts — leaning toward acknowledge.
6. **The `xgb_model.pkl` artifact** still sits in
   `ai-recommendation/models/` even though it is unused. Worth a single
   sentence in 5.5.3 ("the artefact is preserved as a fallback hook
   …") or quietly ignore?

---

## 8. Recommended depth allocation

| Subsection | Depth | Pages |
|---|---|---|
| 5.5.1 Auth | short | ~1 |
| 5.5.2 Student | medium | ~1.5 |
| 5.5.3 Recommendation (AI) | **detailed** | ~2.5 |
| 5.5.4 Supervisor | short | ~1 |
| 5.5.5 Proposal + Analyzer (AI) | **detailed** | ~2.5 |
| 5.5.6 Meeting logs | medium | ~1.5 |
| 5.5.7 Cycle lifecycle | short | ~1 |
| 5.5.8 Announcements | short | ~1 |
| 5.5.9 Committee | short | ~1 |
| 5.5.10 Admin + Audit + Grading | medium | ~1.5 |
| 5.5.11 Chatbot (AI) | **detailed** | ~2 |
| **Total** | | **~16.5 pages** |

The three AI subsections take roughly 7 pages — about 42% of 5.5 — which
matches the project's positioning of AI as the differentiator. Non-AI
modules get short, even coverage so the section does not feel padded.

---

## 9. Rewrite checklist (apply during drafting)

- [ ] Delete the "Technologies used" preamble pattern; thread tooling
      into the relevant prose paragraph instead.
- [ ] Replace pseudocode blocks that restate framework behaviour with
      either a real code snippet or a single-paragraph explanation.
- [ ] Audit hedges (`may`, `can`, `could`) — at most two per paragraph.
- [ ] Pass for British spelling (organise, behaviour, centralise).
- [ ] Replace AI-tell phrases — see §4.
- [ ] Verify every claim against the cited file before writing it.
- [ ] Match Chapter 4 module headings where one exists.
- [ ] Retire the XGBoost / MiniLM / GPT-3.5-only references — see §3.
- [ ] Add Cycle Lifecycle, Announcements, Audit, Grading as first-class
      content.
- [ ] Vary sentence length and opening grammar across paragraphs.
