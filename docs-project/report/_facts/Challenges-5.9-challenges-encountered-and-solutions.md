# Facts — 5.9 Challenges Encountered and Solutions

> **Source rule.** The faculty template forbids inventing challenges
> for 5.9. Every item in this catalogue is sourced from one of:
> (a) a real commit on `main` (citation = short SHA), (b) a
> migration script that fixes a previous one, (c) a code comment
> that explains *why* the implementation took an unusual shape,
> or (d) a drift item already collected in the earlier facts files.
>
> The user can pick three to six of these for the report; not every
> item needs to be drafted.

---

## Category A — Cross-tier contract drift

The frontend, backend, and AI services evolved at different speeds.
Several commits are evidence of the contract slipping at the seams.

### A1. Pagination shape disagreement (1-indexed `page + limit` vs Spring's `Pageable`)

- **Symptom.** `GET /announcements?page=1&limit=10` returned zero items in the UI even though there were ten published rows. The supervisor directory had the same complaint.
- **Root cause.** Spring's default `Pageable` resolver expects `page` (zero-indexed) and `size`. The React caller was sending `page=1` (one-indexed) and `limit=10`, which Spring silently translated to "page index 1 with the default page size", producing a different slice than the UI expected.
- **Fix.** Replace `Pageable` binding with explicit `@RequestParam("page")` and `@RequestParam("limit")` on the affected endpoints, then build `PageRequest.of(safePage - 1, safeLimit)` in the controller.
- **Evidence.** Commits `c3282dd fix supervisor directory pagination: accept 1-indexed page + limit` and `69b59a7 fix student auth bypass on log/meeting GET-by-id; align announcements pagination`. Also referenced in the 5.6 facts file under "five conventions."

### A2. Audience filter ran *after* pagination on the announcement list

- **Symptom.** Page 1 reported `total = 10` but rendered only four cards because the audience filter dropped six rows after the slice.
- **Root cause.** `AnnouncementService.listForStudent` originally fetched a paged result then applied the audience predicate, so the `total` was the unfiltered page size, not the filtered size.
- **Fix.** Load all `PUBLISHED` announcements, apply the audience filter in memory, then slice. The implementation comment explicitly notes the trade-off: "Announcement volume per cycle is low enough that loading all PUBLISHED rows here is fine; switch to a JPQL predicate if it ever grows out of hand."
- **Evidence.** `AnnouncementService.listForStudent` in `backend/src/main/java/com/fyp/supervision/service/AnnouncementService.java`, plus the 5.5.8 prose in chapter5.md.

### A3. Frontend / backend enum drift after a backend rename

- **Symptom.** Pages crashed with `Cannot read properties of undefined (reading 'icon')` when the backend introduced a new enum value (e.g. an `ANNOUNCEMENT_SCOPE` value the frontend's lookup table did not know about).
- **Fix.** Two-pronged: align the frontend enum to the backend DTO, and add a `FALLBACK_*` config object so unknown enum values render with a neutral default instead of throwing.
- **Evidence.** Commits `166ffcf align frontend enums to backend dto`, `b6efef6 fallback configs for unknown enum values`, `c5f35b3 align committee status enums and fix project list shape`.

### A4. Meeting-log DTO shape mismatch

- **Symptom.** Supervisor meeting-log pages broke after a backend refactor.
- **Fix.** Introduce a canonical DTO for meeting logs that both the student and supervisor controllers serialise; cast `meetingId` from `String` to `Long` at the controller boundary (Jackson was deserialising it as a string in one path).
- **Evidence.** Commits `cbd96bf use canonical dto for supervisor meeting logs`, `4d08471 fix meeting log dto shape`, `fc8954a fix string meetingId cast in createLog`.

### A5. Profile image URL did not resolve

- **Symptom.** Uploaded profile pictures showed as broken images. Backend returned a relative path like `uploads/profiles/12/abcd-photo.jpg`; the browser tried to fetch that against the frontend origin (`http://localhost:3000/uploads/...`) and got a 404.
- **Two fixes, in order.** First, add `/uploads` to the Vite dev proxy so `<img src="/uploads/...">` would forward to the backend in development. Second, write `assetUrl()` (`frontend/src/lib/utils/assetUrl.ts`) to prepend the API base URL so the same path resolves under the backend's `/api` context path in production too.
- **Evidence.** Commits `730c53e fix profile image display: vite proxy /uploads + assetUrl helper` and `1c5d979 asset URLs: route through API base so /uploads resolves under backend's /api context`.

---

## Category B — Spring / Hibernate transactional edge cases

These three problems came from running code inside `@Transactional`
methods that interacted badly with rollback or session state.

### B1. Login-throttle increment lost to transaction rollback (V27 followup)

- **Symptom.** The new `loginAttempts` counter never advanced past 1; the lockout threshold was unreachable. The throttle "did nothing."
- **Root cause.** `AuthService.login` is `@Transactional`. On a failed password match, the service incremented `user.loginAttempts` and then threw `BadCredentialsException`. Spring's default rollback policy treats every `RuntimeException` as a rollback signal, so the increment was discarded together with the exception.
- **Fix.** Annotate the method `@Transactional(noRollbackFor = { BadCredentialsException.class, BadRequestException.class })`. The increment is now committed even though the exception escapes the method.
- **Evidence.** Commits `f64e1b0 add login throttle: lock account after 5 failed attempts for 15 min` and `121b6ee fix login throttle: noRollbackFor BadCredentials so attempt counter persists`. Verifier script: `scripts/verify_throttle.ps1`.

### B2. Hibernate session poisoning when querying inside an exception catch

- **Symptom.** After certain failure paths in `CycleLifecycleService.savePlaceholder`, every subsequent JPA call in the same request threw "Session is closed."
- **Root cause.** The catch block was running another query against the same Hibernate session that had just thrown — once a Hibernate session has thrown a constraint-violation exception, the session is poisoned and must not be reused.
- **Fix.** Stop querying inside the catch. The follow-up commit moved the placeholder attach to a post-commit hook (`TransactionSynchronizationManager`) so the placeholder is created in a fresh transaction after the parent commit succeeds.
- **Evidence.** Commits `6123242 fix: don't query inside savePlaceholder catch (poisons hibernate session)` and `c5e5915 fix: defer placeholder attach to after-commit (avoids fk lock deadlock)`.

### B3. Cycle activate / complete returned 500 because both ran in one transaction

- **Symptom.** Activating a cycle while another cycle of the same `cycleType` was already `ACTIVE` produced a 500 error rather than the expected "previous cycle moved to COMPLETED" outcome.
- **Root cause.** The activation logic and the implicit demotion of the old `ACTIVE` cycle ran inside a single transaction; an FK lock on the project rows that referenced both cycles prevented the demotion from completing.
- **Fix.** Split the lifecycle steps into separate transactions through `@Transactional(propagation = REQUIRES_NEW)` and rewrite the status-change calls as direct `UPDATE`/`DELETE` statements where Hibernate's dirty-checking otherwise loaded the entire cycle graph.
- **Evidence.** Commits `17dc816 fix cycle activate/complete 500 + modal focus thief stealing input focus`, `1aed2a8 isolate cycle lifecycle txns to fix 500 on complete/activate`, `092d132 rewrite cycle status changes + delete as direct UPDATE/DELETE`.

---

## Category C — Authorisation bypass discoveries during testing

End-to-end testing revealed that several "by-id" endpoints loaded the
target row without checking that the requesting user owned it. Two
commits closed a cluster of these.

### C1. Student-side auth bypass on log / meeting GET-by-id

- **Symptom.** A student could `GET /student/logs/{id}` for a log belonging to a different student and read the response.
- **Fix.** Introduce ownership checks (`getMeetingDto(userId, meetingId)` and `getLogDto(userId, logId)` in `StudentService`) that load the row and throw `ForbiddenException` if the requesting user is not the student on the row.
- **Evidence.** Commit `69b59a7 fix student auth bypass on log/meeting GET-by-id; align announcements pagination`.

### C2. Supervisor-side auth bypass on multiple by-id endpoints

- **Symptom.** A supervisor could `GET /supervisor/requests/{id}` for a request directed at a different supervisor.
- **Fix.** Centralise the per-row checks in a new `SupervisorAccessService` with five methods (`requireOwnRequest`, `requireOwnProject`, `requireOwnProposal`, `requireOwnMeeting`, `requireOwnLog`), each loading the entity and throwing `ForbiddenException("You can only access your own X.")` if the supervisor on the row does not match. Wire the checks into all six previously-vulnerable controllers.
- **Evidence.** Commit `7a5d8e0 supervisor: fix auth bypass on by-id endpoints; fix detail/announcements/logs/notifications crashes`.

These two findings are why 5.8.2 frames per-row ownership as a
secondary mechanism on top of URL-prefix routing — the URL prefix
guards the role, but only the per-row check guards the row.

---

## Category D — AI service evolution (replacing fake signals with honest ones)

Three significant pivots happened in the AI services. Each replaced a
stand-in or untrustworthy component with something the runtime can
defensibly compute, and each is recorded in commit history and in the
in-code docstrings.

### D1. XGBoost recommender dropped in favour of a deterministic weighted scorer

- **Symptom.** The recommendation service was reporting "match accuracy" numbers based on synthetic training data; the score had no calibration against real student-supervisor pairings.
- **Fix.** Remove `xgboost` and `joblib` from the requirements, delete the training pipeline, and replace the scoring path with a deterministic five-component weighted score (semantic, interest jaccard, skill jaccard, programme, availability). Upgrade the embedding model from `all-MiniLM-L6-v2` to `BAAI/bge-base-en-v1.5` (768-dim) at the same time. Add the past-supervised-project-titles signal.
- **Evidence.** Commits `9804db1 ai-recommendation: drop xgboost, embedding-based scorer with 503 propagation`, `acc0bb2 ai-recommendation: skill match, past project titles, bge-base embedder`, `4e77e49 ai-recommendation frontend: components breakdown, 503 banner, drop fake success-rate`. The decision is also documented in `ai-recommendation/CLAUDE.md` ("Synthetic training data and the XGBoost model are gone. Don't reintroduce.").

### D2. Plagiarism score dropped from the proposal analyzer (V31)

- **Symptom.** The proposal analyzer was reporting a "plagiarism: 85" field on every proposal regardless of content. The frontend rendered it as a real plagiarism check.
- **Fix.** Drop the column in V31 and remove the field from every API surface. The system does not produce a plagiarism signal it cannot defend.
- **Evidence.** Migration `V31__drop_proposal_plagiarism_score.sql` plus commit `1e74d91 ai-proposal-analyzer: drop fake plagiarism, groq, chunked scoring, 503 propagation`. The migration's own comment explains the reasoning.

### D3. Chatbot generator demoted Flan-T5, added Groq-first remote LLM

- **Symptom.** The local Flan-T5 (`google/flan-t5-small`) was the default generator path and produced shallow paraphrases that the user rated low.
- **Fix.** Set `USE_LOCAL_GEN=false` by default. Wire an OpenAI-compatible LLM client with provider precedence `LLM_API_KEY → GROQ_API_KEY → OPENAI_API_KEY` so Groq's `llama-3.3-70b-versatile` is used by default when an API key is configured, and a third "extractive" fallback emits the retrieved chunks when no LLM is available. Replace the hard-coded confidence value with `top1_cosine × multiplier_per_path` so the reported confidence reflects the path that produced the answer. Add an out-of-scope cut-off at top-1 cosine 0.30.
- **Evidence.** Commits `47a051f ai-chatbot: groq-first remote llm, configurable via env`, `b110a78 ai-chatbot: real confidence, scope threshold, feedback, personalised ctx`. Documented in 5.5.11 of chapter5.md.

### D4. AI services degrade as 503 rather than as a fake empty result

- **Symptom.** When an AI service was down, the backend returned a 200 with an empty list / a zeroed `proposal_check_result` row. The user saw "no recommendations" with no indication that this meant "service down" rather than "no matches."
- **Fix.** Throw a typed `AiServiceUnavailableException` from `AiServiceClient`, map it to HTTP 503 in the controller, and render a "service temporarily unavailable" banner on the frontend distinct from the generic error path.
- **Evidence.** Same commits as D1 (`9804db1`) and D2 (`1e74d91`); also `0e5bb34` for the banner remount on `errorUpdatedAt`.

### D5. Empty env vars from Docker Compose `${VAR:-}` substitution

- **Symptom.** AI services crashed during initialisation when an unset env var was passed through Compose. `${VAR:-}` evaluates to the empty string when `VAR` is unset in the host shell, so `int(os.environ["VAR"])` raised on the first read.
- **Fix.** Treat unset *and empty* as missing throughout the AI services. Each `_env_int / _env_float / _env_str` helper checks `raw and raw.strip()` and falls back to the default if either fails.
- **Evidence.** Commit `57a24cd ai services: type validation + score rounding + empty-env tolerance`. Implementation visible at the top of `ai-recommendation/app.py`.

---

## Category E — Frontend UX problems caught during sweep testing

End-to-end click-through testing surfaced UX defects that the
component library hid. Several are notable enough to mention.

### E1. AlertBanner X button did nothing; banner stayed forever

- **Symptom.** The dismiss icon on every error banner was decorative — clicking it did not hide the banner. Several mutation-error banners stayed visible after the underlying mutation reset because they were tied to `mutation.isSuccess` (which never flips back).
- **Root cause.** `AlertBanner` had no internal `hidden` state. Parents that did not pass `onDismiss` therefore had no way to make the X work.
- **Fix.** Add internal `hidden` state in `AlertBanner` (`useState`), reset it when the message text changes, expose an `autoDismissMs` prop with a `setTimeout` that fires `dismiss()` automatically, and have parents wire `onDismiss={() => mutation.reset()}` so a successful retry can re-show a fresh banner. Query-error banners use `key={errorUpdatedAt}` to remount on each failed fetch.
- **Evidence.** Commits `f47e636 alert banner self-dismiss + auto-timeout; stage profile picture until Save Changes`, `2c4d225 wire auto-dismiss + mutation reset on remaining banner sites`, `6d5a71b alert banner: reset hidden when message changes; dismissible+reset on supervisor log-review errors`, `0e5bb34 alert banners: dismissible on log-review fallback; remount query-error banners per errorUpdatedAt`.

### E2. Profile image committed before "Save Changes"

- **Symptom.** Uploading a new profile picture in the Edit Profile modal committed it to the backend immediately. Clicking "Cancel" still left the new image saved.
- **Fix.** Stage the selected image in `selectedImage` / `imagePreview` local state in `StudentProfile.tsx` and `BasicProfilePage.tsx`. Upload only when the user clicks "Save Changes". Rename the modal's button to "Use This Picture" so it reads as a stage action rather than a commit.
- **Evidence.** Commit `f47e636 alert banner self-dismiss + auto-timeout; stage profile picture until Save Changes`.

### E3. Header avatar did not refresh after a successful upload

- **Symptom.** The top-bar `UserMenu` continued to show the old initials (or no image) after the user uploaded a new profile picture; the new image only appeared on a hard refresh.
- **Fix.** Have `UserMenu` read from `useUserProfile()` (a TanStack Query hook) rather than the AuthContext, and have the upload mutation invalidate `['auth', 'me']` so the cache refetches automatically.
- **Evidence.** Commit `df34268 header avatar: render uploaded image and refresh on upload`.

### E4. Modal focus thief stole input focus during cycle activation

- **Symptom.** Activating a cycle from the admin dashboard would yank focus into a secondary modal that opened underneath, breaking the activation form.
- **Fix.** Same commit as the cycle 500 fix (`17dc816 fix cycle activate/complete 500 + modal focus thief stealing input focus`).

---

## Category F — Tooling and environment quirks

Each of these is documented in either CLAUDE.md or an in-code
comment, and explains a non-obvious choice the implementation had to
make.

### F1. PyTorch 2.10 fails with a DLL initialisation error on Windows

- **Symptom.** Importing `torch` after `pip install torch==2.10.0` raised a Windows DLL load failure on the development machine.
- **Fix.** Pin `torch==2.5.1` in both `ai-proposal-analyzer/requirements.txt` and `ai-chatbot/requirements.txt`. Documented in CLAUDE.md and in the analyzer's Dockerfile.

### F2. Lombok versions before 1.18.42 fail under JDK 25

- **Symptom.** The host JDK is Java 25 (the LTS choice for the surrounding system), but the project compiles to Java 17 bytecode for Spring Boot 3.x. The annotation processor in older Lombok releases throws on JDK 25.
- **Fix.** Pin `lombok.version=1.18.42` in `pom.xml` and register Lombok explicitly in the `maven-compiler-plugin`'s `<annotationProcessorPaths>` block. Removing the explicit registration would cause the compile to fail.

### F3. MSYS2 Python on Windows cannot compile `torch` / `faiss-cpu` wheels

- **Symptom.** The MSYS2 Python that ships with Git Bash on Windows lacks the C toolchain to build the heavy ML wheels.
- **Fix.** Use a clean CPython 3.12 virtual environment per AI service for offline training and host-side tooling. Inside Docker the AI services use `python:3.11-slim`, which has prebuilt wheels available.

### F4. Vite dev server does not pick up file changes inside a Windows-mounted volume

- **Symptom.** Editing a file on the host did not trigger a hot-module reload inside the dev container.
- **Root cause.** Windows-mounted volumes do not propagate `inotify` events to the Linux container.
- **Fix.** Set `VITE_USE_POLLING=true` in `docker-compose.override.yml` and read it in `vite.config.ts` (`watch: { usePolling: process.env.VITE_USE_POLLING === 'true', interval: 300 }`). The polling interval was tuned to 300 ms as a balance between latency and CPU.

### F5. Compose `ports:` merges across files, breaking the dev override

- **Symptom.** Without explicit handling, the dev override's `5173:3000` mapping would be merged with — not replace — the production `3000:80` mapping, leaving both bindings live and the wrong one winning.
- **Fix.** Use Compose's `!override` directive on the override file's `ports` key (`ports: !override`). The dev mapping then replaces the production mapping cleanly.

### F6. Email server domain restriction on registration

- **Symptom.** Anyone could register with any email address, turning the public registration form into an open enrolment.
- **Fix.** Two-layer check. The DTO enforces the regex
  `^[A-Za-z0-9._%+-]+@(student\.mmu\.edu\.my|mmu\.edu\.my)$`. The
  service-layer pairing check then enforces that students must use
  `@student.mmu.edu.my` and supervisors must use `@mmu.edu.my` (and
  not the student subdomain). Pre-approved roster lookup
  (V22 / V23) is the third layer that decides whether a registration
  is auto-activated or queued for admin review.
- **Evidence.** Commit `96f1719 restrict register to mmu emails + admin csv roster auto-approval`.

---

## Category G — Schema evolution mistakes corrected by later migrations

Three migrations exist *because* an earlier one was wrong or
incomplete. The migration trail preserves them as evidence rather
than rewriting history.

### G1. V21 fixes V19's CHAR(64) vs entity String mismatch

- **What V19 declared.** `password_reset_token.token_hash CHAR(64) NOT NULL`.
- **What the entity mapped.** A Java `String` field, which Hibernate expects to back a `VARCHAR` column.
- **Symptom.** With `spring.jpa.hibernate.ddl-auto: validate`, the application refused to start ("Schema validation failure").
- **Fix.** V21 issues `ALTER TABLE password_reset_token MODIFY COLUMN token_hash VARCHAR(64) NOT NULL`. The lesson is documented in V21's own comment: "the entity maps to VARCHAR(64), which makes Hibernate ddl-auto=validate refuse to start."

### G2. V18 reverts V16's supervisor-topic catalogue

- **What V16 added.** A `supervisor_topic` table plus a `project.topic_id` foreign key, intended to support a "supervisors post topics → committee approves → students confirm" flow.
- **Why it was removed.** The FYP1 use cases (UC4–UC7) are supervisor-first (browse directory → request → propose), not topic-first. Implementing the topic catalogue introduced UI complexity that did not match the spec.
- **Fix.** V18 drops the foreign key, the index, and the table. The commit `4dd1faf revert to supervisor-first flow and gate locked features` finishes the revert on the frontend side. The migration trail intentionally preserves both V16 and V18 rather than squashing them, so the design history is visible.

### G3. V29 was deliberately skipped (Flyway checksum collision)

- **What happened.** A V29 migration was authored locally but never landed on `main`; meanwhile a different V29 was applied to a developer machine. To avoid a checksum collision when pulling the upstream V29, the local change was renumbered to V30.
- **Fix.** Skip V29 in the canonical sequence. Flyway tolerates gaps as long as no skipped number is later added back.
- **Evidence.** Commit `4c86b26 fix flyway checksum: revert chat to V28, move fyp_grade to V30`.

---

## Category H — Single-author workflow gaps

Two operational gaps fall out of the single-author project structure
documented in 5.2.4 and are worth acknowledging in 5.9 or 5.10.

### H1. JUnit suite is empty until late in the project

- **Symptom.** `mvn test` was a no-op; CI ran the build target but did not exercise any backend logic.
- **Mitigation.** Commit `731105f add unit tests for the four load-bearing services (26 tests)` adds JUnit coverage for the four most security-critical services (`AuthService`, `MeetingLogService`, `GradingService`, plus one access-control service). Other services rely on the `verify_*.ps1` PowerShell scripts that walk the live HTTP API instead.

### H2. Commit messages drift from informative to "update" in the early history

- **Symptom.** The first ~20 commits in the project history are titled `update`, `update RegisterPage.tsx`, etc., making `git log --oneline` hard to read.
- **Mitigation.** From commit `c7a80ce` onwards, the convention shifted to short, lowercase, imperative, and topic-prefixed messages
  (e.g. `committee: compute unpaired/fyp1/fyp2 stats`, `ai-recommendation: drop xgboost, embedding-based scorer with 503 propagation`). Documented in CLAUDE.md as the project's commit policy.

---

## Items to highlight when written up

Pick three to six of the items above for the prose draft. The most
"reportable" combinations (each with a clear technical problem, a
concrete fix, and a one-line lesson) are:

- **A1 + A2 + A3** as a single paragraph on cross-tier contract drift (pagination, filter ordering, enum drift).
- **B1 + B2** as a paragraph on Spring/Hibernate transactional edge cases.
- **C1 + C2** as a paragraph on URL-prefix routing being insufficient on its own — the per-row ownership service was the lesson.
- **D1 + D2** as a paragraph on choosing honest signals over impressive-looking but uncomputed ones (the XGBoost / plagiarism / Flan-T5 cleanup).
- **F1 + F2 + F4** as a paragraph on Windows-host quirks the deployment had to account for.
- **G1 + G2 + G3** as a paragraph on what the migration trail records about decisions that were tried and changed.
- **E1** stands alone as a frontend-UX example of the kind of defect that only emerges from sweep testing rather than unit tests.

The faculty template treats 5.9.1 (challenges) and 5.9.2 (solutions)
as separate sub-headings; structurally, each item above maps to one
challenge + one solution paragraph.
