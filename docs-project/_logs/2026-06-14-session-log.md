# Session Log — 2026-06-14

## Headline

Deep bug-audit of the **Java backend** and fixed everything it surfaced. A
multi-agent hunt over the ~20k-LOC backend found **30 real bugs + 1 disputed**
(access-control/IDOR, SSRF, a session-revocation gap, several data-integrity
and concurrency races, and a long tail of input-validation 500s). All were
fixed, compiled clean, and shipped to the live droplet in two deploys
(`6d7382b` the fixes, `74d5754` a follow-up 404 handler). No schema/Flyway
changes, so `ddl-auto: validate` passed unchanged; frontend untouched.

## What was done

### The hunt (multi-agent workflow)
- 16 finder agents — 12 by functional area (auth, student, supervisor,
  committee, admin, meetings/logs, announcements, proposals/docs, cycle/jobs,
  files/AI, etc.) plus 4 cross-cutting sweeps (IDOR/authz, NPE/unboxing,
  transactions/concurrency, JPA/entity integrity).
- Findings triaged/deduped to **31 unique**, then each put through a **2-voter
  adversarial panel** (one confirm lens, one refute lens, both reading the real
  code). Result: **30 confirmed, 1 disputed, 0 rejected** (~79 agents total).

### Fixes shipped (commit `6d7382b`, 32 files)
Critical
- **Proposal-feedback IDOR** — `SupervisorProposalController.provideFeedback`
  skipped the `requireOwnProposal` guard its sibling GET uses; any supervisor
  could approve/reject another supervisor's student's proposal. Added the
  controller guard + a defence-in-depth owner check in the service.
- **Gated uploads served publicly** — `/uploads/**` static handler exposed
  `resources/`, `documents/`, `reports/`, `backups/`, `exports/` with no auth,
  bypassing the visibility gates. Narrowed `WebConfig` + `SecurityConfig` to
  `/uploads/profiles/**` only; everything else now goes through the
  authenticated download endpoints. Verified the frontend loads all non-avatar
  files via gated blob endpoints, so nothing broke.

High
- **JWT ignores account status** — `JwtAuthenticationFilter` now rejects
  BLOCKED/SUSPENDED/anonymised users per request (`isEnabled()`); previously a
  blocked user kept full access for the 24 h token TTL.
- **Meeting-log signature forgery** — `MeetingLogService.signLog` checked role +
  status but not ownership; added per-row owner checks for both signer roles.
- **Announcement audience bypass** — by-id read (`getForUser`) and attachment
  download (`loadAttachment`) now run the same `matchesAudience` gate as the
  list view; recipient list no longer leaked to non-authors.
- **Proposal edit after submission** — `updateProposal` now blocks edits unless
  DRAFT/REVISION_REQUIRED.
- **Double-accept supervisor reassignment** — `respondToRequest` rejects a second
  accept on an already-paired student; `currentLoad` now uses an atomic
  `incrementCurrentLoad` (no lost update).
- **deleteUser opaque 500** — FK `RESTRICT` made deleting any onboarded user
  throw `DataIntegrityViolationException` → 500. Added a handler returning a
  clean **409** (kept RESTRICT; it's deliberate data protection).
- **Orphan sweeper deleted live exports** — added `export_config.last_export_path`
  to the referenced-columns set and `exports` to the skip-dirs.
- **DeadlineReminderJob** — `LazyInitializationException` in the scheduled thread
  silently killed all student reminders; and the candidate query filtered on
  `dueDate`, missing extended deadlines. One `JOIN FETCH` query on the effective
  date fixed both (no transaction wrapper, so no readOnly/poisoning side-effects).

Medium
- **SSRF** in `AdminIntegrationController.testIntegration` — added scheme allowlist,
  internal-address block (loopback/link-local/site-local/metadata), redirects
  disabled, connection closed in `finally`.
- **Two-ACTIVE-cycle invariant** — editing status to ACTIVE via the generic PUT now
  routes through `activateCycleAtomically` (with demotion), like `/activate`.
- **Chat global lock** — `sendMessage` was `synchronized` on the singleton, so one
  slow AI call blocked all users; replaced with a per-user lock around only the
  session find-or-create, plus connect/read timeouts on the AI `RestTemplate`.
- **Non-supervisor request target** — `createSupervisionRequest` now validates the
  target is an ACTIVE SUPERVISOR.

Low (input hardening + small races)
- Several controllers hard-cast / parsed untrusted `Map<String,Object>` payloads
  → NPE/ClassCast/NumberFormat → 500. Hardened to **400** (StudentService,
  StudentMeetingController, SupervisorService, CommitteeService, AdminUser/
  Project/Parameter/Deadline controllers, MeetingLogService).
- Atomic `viewCount` increment; per-row `REQUIRES_NEW` cycle backfill via a new
  `CyclePlaceholderWriter` (one failing student no longer poisons the batch);
  profile-image type/size validation (closes a stored-XSS vector since avatars
  are public); per-user lock on deletion requests; `is_editable` enforced on
  parameter PUT; `reviewProposal` made `@Transactional`.

Disputed (1): `reviewProposal` not transactional — the named triggers can't
actually throw, but the review-insert/status-flip atomicity gap is real and
cheap, so it was wrapped anyway.

### Verification
`mvn clean compile` → BUILD SUCCESS. Full suite **52 tests, 0 failures**.

### Deploys
- `6d7382b` pushed to `develop`, deployed via `./redeploy.sh` (backend-only
  rebuild; `pom.xml` untouched so the Maven dependency layer stayed cached; the
  2 GB swap absorbed the build spike, no OOM). Verified: backend up in 27 s, app
  + API `200`, `/uploads/resources/**` and `/uploads/backups/**` now `403`, a
  real `/uploads/profiles/...` image still `200`.
- Follow-up: a request for a *missing* static file returned **500** because the
  catch-all `@ExceptionHandler(Exception.class)` swallowed Spring's
  `NoResourceFoundException`. Pre-existing, not from this change. Added a
  `NoResourceFoundException → 404` handler (`74d5754`), redeployed. Verified
  missing profile → `404`, gated path → `403`, app/API `200`.

## Problems hit and fixed

1. **Prod DB query blocked.** Trying to fetch a sample `profile_image_path` from
   the live MySQL was denied by the safety classifier (reading the DB root
   password + user PII). Switched to `find` over the uploads volume inside the
   backend container instead — proved real avatars serve `200` with no DB access
   and no PII.
2. **SSH passphrase quirk.** Key passphrase is the literal `""`; ran the
   non-interactive deploy with an askpass helper printing `""` and
   `SSH_ASKPASS_REQUIRE=force`. Temp helper deleted after each run.
3. **Two judgment calls** worth recording:
   - `deleteUser`: surfaced a clean 409 rather than building soft-delete — the FK
     RESTRICT is intentional (the PDPA flow already anonymises on the
     deletion-request path).
   - Duplicate-pending deletion-request race: used an in-process per-user lock
     (correct for the single-instance droplet) instead of a Flyway migration, to
     avoid index-creation risk on the live DB. A DB unique constraint is the
     durable fix if it ever scales to multiple instances.

## State at end of session

- Code: `develop` at `74d5754`, pushed. Backend only; no schema/migration/
  frontend changes.
- Live droplet: redeployed twice, serving both commits. All 30 fixes + the 404
  handler are live and verified (`app`/`api` `200`, gated uploads `403`, avatars
  `200`, missing static `404`). All 9 services Up.
- No follow-up required. Optional later: a DB unique constraint for deletion
  requests if the deployment ever goes multi-instance.
