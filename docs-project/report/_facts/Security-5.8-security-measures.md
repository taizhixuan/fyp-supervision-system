# Facts — 5.8 Security Measures

> Existing 5.8 in `chapter5.md:2444` is template-only (three empty
> sub-headings). Fresh fact gather, no drift to compare against.

## Files involved

| Path | Role |
|---|---|
| `backend/src/main/java/com/fyp/supervision/config/SecurityConfig.java` | `SecurityFilterChain`, BCrypt bean, AuthenticationManager bean, URL-prefix authority routing |
| `backend/src/main/java/com/fyp/supervision/config/CorsConfig.java` | Dual-origin CORS (`localhost:3000` + `localhost:5173`), credentials enabled |
| `backend/src/main/java/com/fyp/supervision/security/JwtTokenProvider.java` | HS256 issue/parse/validate via JJWT 0.12.5 |
| `backend/src/main/java/com/fyp/supervision/security/JwtAuthenticationFilter.java` | `OncePerRequestFilter` extracting `Authorization: Bearer <token>` and populating `SecurityContext` |
| `backend/src/main/java/com/fyp/supervision/security/UserDetailsServiceImpl.java` | `loadUserByUsername` / `loadUserById`; sets the `enabled` flag from `status == ACTIVE` |
| `backend/src/main/java/com/fyp/supervision/security/CurrentUser.java` | `@AuthenticationPrincipal` resolver helper |
| `backend/src/main/java/com/fyp/supervision/service/AuthService.java` | Login throttle (5 failures → 15-minute lockout), password reset (single-use SHA-256 hash), pre-approved roster lookup, role/domain pairing check |
| `backend/src/main/java/com/fyp/supervision/service/StudentAccessService.java` | `requireActiveCycle(userId)` write-block at the top of every student write endpoint |
| `backend/src/main/java/com/fyp/supervision/service/SupervisorAccessService.java` | Per-row ownership checks (`requireOwnRequest` / `requireOwnProject` / `requireOwnProposal` / `requireOwnMeeting` / `requireOwnLog`) |
| `backend/src/main/java/com/fyp/supervision/service/AuditService.java` | Single entry point for `audit_log` writes; `REQUIRES_NEW` propagation + try/catch + X-Forwarded-For aware IP capture |
| `backend/src/main/java/com/fyp/supervision/service/FileStorageService.java` | Multipart upload — UUID-prefixed filename, path-traversal check, per-entity directory under `${app.file.upload-dir}` |
| `backend/src/main/java/com/fyp/supervision/exception/GlobalExceptionHandler.java` | `@RestControllerAdvice` — uniform error envelope, exception → HTTP status mapping |
| `backend/src/main/java/com/fyp/supervision/exception/{ResourceNotFoundException,BadRequestException,ConflictException,ForbiddenException,AiServiceUnavailableException}.java` | Typed exception classes raised by the service layer |
| `backend/src/main/java/com/fyp/supervision/dto/auth/*.java` | Bean Validation annotations on auth DTOs |
| `backend/src/main/resources/application.yml` | Logging baseline (`com.fyp.supervision: INFO`, `org.springframework.security: INFO`), 50 MB multipart limit, Hikari pool |
| `backend/src/main/resources/application-dev.yml` | Dev profile bumps both loggers to `DEBUG` |
| `frontend/src/lib/api/client.ts` | Axios JWT interceptor + 401 → `/session-expired` redirect |
| `db/migration/V19__create_password_reset_tokens.sql`, `V21__fix_password_reset_token_hash_type.sql` | Single-use password reset token table (SHA-256 hash only) |
| `db/migration/V27__login_throttle_columns.sql` | `user_account.login_attempts`, `lockout_until` |

## Input validation

### Bean Validation on DTOs (`spring-boot-starter-validation`)

`AuthController` and every other controller method that accepts a body
applies `@Valid` to the DTO. Validation failures throw
`MethodArgumentNotValidException`, which `GlobalExceptionHandler`
converts to HTTP 400 with a comma-joined list of field error messages.

`RegisterRequest` (the strictest DTO):

| Field | Constraint |
|---|---|
| `role` | `@NotBlank` |
| `fullName` | `@NotBlank` + `@Size(max = 200)` |
| `mmuId` | `@NotBlank` + `@Pattern(regexp = "^\\d{10}$")` — exactly 10 digits |
| `email` | `@NotBlank` + `@Email` + `@Pattern(regexp = "^[A-Za-z0-9._%+-]+@(student\\.mmu\\.edu\\.my\|mmu\\.edu\\.my)$")` — must end with `@student.mmu.edu.my` or `@mmu.edu.my` |
| `phone` | optional |
| `password` | `@NotBlank` + `@Size(min = 8, max = 100)` |
| `specialisation` | `@Size(max = 200)` (student-only) |
| `intakeYear` | optional Integer (student-only) |

`AuthService.register` adds a second-tier check: students must use
`@student.mmu.edu.my` and supervisors must use `@mmu.edu.my` (and not
the student subdomain). This is in addition to the regex above —
defence in depth, since the regex alone permits any of the two
subdomains for any role.

`LoginRequest`: `identifier` and `password` are both `@NotBlank`.
Other auth DTOs (`ChangePasswordRequest`, `ForgotPasswordRequest`,
`ResetPasswordRequest`, `UpdateProfileRequest`) carry the same
shape — `@NotBlank` on required fields, `@Size`/`@Email`/`@Pattern`
where the field's contract demands it.

### File upload validation

`FileStorageService.storeFile(file, entity, userId)` is the single
entry point for multipart writes. Three guards apply:

1. **Path-traversal guard.** The cleaned filename is rejected if it
   contains `..` (`if (originalFilename.contains("..")) throw new BadRequestException("Invalid file path.");`).
2. **UUID-prefixed storage name.** The on-disk filename is
   `<UUID>-<originalFilename>`, so two uploads of the same name from
   the same user never collide and the URL cannot be guessed from the
   original name.
3. **Per-entity, per-user directory.** Files land under
   `uploads/<entity>/<userId>/<storedFilename>`. The configured root
   is enforced by `FileStorageConfig`, which calls
   `Files.createDirectories(...)` on `@PostConstruct`.

Spring multipart limits are set in `application.yml` to
`max-file-size: 50MB` and `max-request-size: 50MB`. Exceeding either
raises `MaxUploadSizeExceededException`, which the global handler
maps to HTTP 400 with the message
"File size exceeds the maximum allowed size."

### Database-side validation (defence in depth)

- **`UNIQUE` business-key constraints** on `user_account.mmu_id`,
  `user_account.email`, `fyp_cycle.cycle_code`,
  `system_parameter.param_key`, `password_reset_token.token_hash`,
  `push_subscription.endpoint`, plus the composite
  `project (cycle_id, student_user_id)` introduced in V24.
  Concurrent writes that violate one are surfaced as a duplicate-key
  exception, which `AuthService.register` catches and translates into
  HTTP 409 ("Email is already registered." / "MMU ID is already
  registered.").
- **`ENUM` columns** on `user_account.role`, `user_account.status`,
  `proposal.status`, `meeting.status`, `meeting_log.status`,
  `supervisor_request.status`, `fyp_cycle.status`, `project.status`,
  `announcement.status`. Inserts of unknown values are rejected by
  the database before they reach the persistence cache.

## Encryption and hashing

| Mechanism | Algorithm | Where |
|---|---|---|
| Password storage | BCrypt (default cost 10) | `BCryptPasswordEncoder` bean in `SecurityConfig`; written by `AuthService.register` and `AuthService.changePassword`; verified by `AuthService.login` |
| JWT signature | HMAC-SHA256 (HS256) | `JwtTokenProvider` via `Keys.hmacShaKeyFor(jwtConfig.getSecret().getBytes(StandardCharsets.UTF_8))`; secret from `JWT_SECRET` env var |
| Password reset tokens | SHA-256 (only hex hash stored) | `AuthService.forgotPassword` generates a `SecureRandom` token, sends raw via email, stores `MessageDigest.getInstance("SHA-256")` hex in `password_reset_token.token_hash` (UNIQUE) |
| Meeting log signatures | SHA-256 of the PNG bytes | `MeetingLogService` writes `signature_sha256 VARCHAR(64)` alongside `signature_image_url` so a verifier can detect post-hoc image substitution |
| Web Push payload signing | VAPID (ECDSA on P-256) | `nl.martijndwars:web-push 5.1.1` + `bouncycastle:bcprov-jdk18on 1.78`; keys from `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY`, off by default |
| TLS / HTTPS | not configured | All in-stack traffic is plain HTTP because everything runs on `localhost`; a faculty deployment would terminate HTTPS at a reverse proxy in front of nginx (see Section 5.7.3 / 5.10) |

## Role-based access control (RBAC)

### URL-prefix routing — primary mechanism

`SecurityConfig.securityFilterChain` declares the routing once:

```
/auth/{register,login,forgot-password,reset-password,verify-reset-token},
/announcements/latest, /system/parameters/public, /uploads/**   → permitAll
/admin/**                                                        → SYSTEM_ADMIN
/committee/**                                                    → FYP_COMMITTEE
/supervisor/**                                                   → SUPERVISOR
/student/**                                                      → STUDENT
/supervisors/**                                                  → STUDENT (student-facing supervisor directory)
anyRequest()                                                     → authenticated
```

Adding a controller to `controller/admin/` therefore restricts it to
`SYSTEM_ADMIN` automatically — no per-method `@PreAuthorize` for the
role check. `@EnableMethodSecurity` is on, but `@PreAuthorize` is
reserved for finer per-row checks (see below).

### JWT filter pipeline

`JwtAuthenticationFilter` extends `OncePerRequestFilter` and is
inserted before `UsernamePasswordAuthenticationFilter`:

1. Read `Authorization: Bearer <token>` header.
2. `tokenProvider.validateToken(jwt)` — verifies HS256 signature and expiry; returns false on any `JwtException`.
3. `tokenProvider.getUserIdFromToken(jwt)` — extracts `sub` claim as Long.
4. `userDetailsService.loadUserById(userId)` — loads the live `UserAccount` row (every request, no cache).
5. Build `UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities())` and put it into `SecurityContextHolder`.

`UserDetailsServiceImpl.buildUserDetails` constructs a Spring `User`
with `enabled = (status == ACTIVE)`, so a status flip to `SUSPENDED`
or `BLOCKED` immediately blocks the next request even though the
already-issued JWT is still cryptographically valid.

Authority granted: a single `SimpleGrantedAuthority` with the
**bare** `UserRole` name (e.g. `SYSTEM_ADMIN`). Spring's
`hasAuthority(...)` matchers in `SecurityConfig` therefore use
`SYSTEM_ADMIN` directly (no `ROLE_` prefix).

### Per-row ownership — secondary mechanism

URL-prefix routing decides who can hit an endpoint; per-row checks
decide which row of the resource they can act on. Three services
encapsulate them:

| Service | Method | Throws |
|---|---|---|
| `SupervisorAccessService` | `requireOwnRequest(requestId, supervisorUserId)`, `requireOwnProject`, `requireOwnProposal`, `requireOwnMeeting`, `requireOwnLog` | `ForbiddenException("You can only access your own X.")` |
| `StudentService` | `getMeetingDto(userId, meetingId)`, `getLogDto(userId, logId)` — same idempotent pattern | `ForbiddenException` |
| `GradingService` | `submitGrade(...)` enforces "only the assigned supervisor can write a SUPERVISOR-role grade for this project" | `ForbiddenException("You are not the assigned supervisor for this project.")` |

These checks were added during the test-and-fix sweep that closed the
cross-supervisor and cross-student data leaks documented in the audit
log.

### Per-cycle write-block

`StudentAccessService.requireActiveCycle(userId)` is called at the top
of every student write endpoint (proposals, meetings, meeting logs,
documents, supervision requests). It throws `ForbiddenException` with
a user-facing message when `Project.cycle.status ∈ {COMPLETED,
ARCHIVED}`. Reads stay open. The frontend reads `cycleActive` from
the dashboard payload and renders `LockedFeaturePage` rather than
firing the request, so the 403 is the safety net rather than the
primary UX.

### Account-status guards (three layers)

- `AuthService.login` rejects `PENDING`, `SUSPENDED`, `BLOCKED` with a per-status message.
- `UserDetailsServiceImpl.buildUserDetails` sets `enabled = false` for any non-`ACTIVE` status; Spring then short-circuits the request before the controller runs.
- `JwtAuthenticationFilter` re-loads the user on every request, so a status change takes effect on the next call.

### Login throttling (V27)

`AuthService.login` is annotated
`@Transactional(noRollbackFor = { BadCredentialsException.class, BadRequestException.class })`
so the failed-attempt increment survives the thrown exception. The
constants are inlined:

```java
private static final int MAX_FAILED_LOGIN_ATTEMPTS = 5;
private static final int LOCKOUT_WINDOW_MINUTES = 15;
```

Flow on a failed password match:

1. `attempts = (loginAttempts ?? 0) + 1`.
2. If `attempts >= 5`: set `loginAttempts = 0` and `lockoutUntil = now() + 15 min`; record `LOGIN_LOCKOUT_TRIGGERED` audit event.
3. Otherwise: persist the new `loginAttempts`; record `LOGIN_FAILURE`.

Subsequent attempts during the lockout window short-circuit with
"Account temporarily locked after too many failed attempts. Try again
in N minutes." and an audit event `LOGIN_REJECTED_LOCKED`. A
successful login resets both columns.

### Frontend half of the contract

`frontend/src/lib/api/client.ts`:

- Reads the JWT from `localStorage` on every request and attaches
  `Authorization: Bearer <token>`.
- Response interceptor: on HTTP 401, removes the cached token and
  redirects to `/session-expired` — except on the open auth pages
  (`/login`, `/register`, `/forgot-password`, `/reset-password`, `/`)
  so the user is never trapped in a redirect loop.
- `withCredentials: true` is set so the cookie-based fallback would
  work behind a proxy, although the current deployment uses the
  bearer token only.

## Error handling and logging

### Uniform error envelope

`GlobalExceptionHandler.buildResponse` shapes every non-2xx response
identically:

```json
{
  "timestamp": "2026-05-10T14:30:21.123",
  "status": 404,
  "error": "Not Found",
  "message": "Project not found"
}
```

Exception → status mapping:

| Exception | HTTP status | Handler note |
|---|---|---|
| `ResourceNotFoundException` | 404 | Service-layer "not found" |
| `BadRequestException` | 400 | Service-layer guards |
| `ConflictException` | 409 | Quota / unique-key violations |
| `BadCredentialsException` (Spring) | 401 | Message replaced with "Invalid credentials. Please try again." so the response cannot leak which of {user exists, password wrong} was true |
| `AccessDeniedException` (Spring) | 403 | URL-prefix authority mismatch; message replaced with generic "You do not have permission to perform this action." |
| `ForbiddenException` | 403 | Per-row ownership or cycle gate; message preserved (it is user-facing) |
| `MethodArgumentNotValidException` | 400 | Field errors concatenated with `, ` |
| `MaxUploadSizeExceededException` | 400 | Multipart > 50 MB |
| `Exception` (catch-all) | 500 | Stack trace logged at ERROR; client receives `<ClassName>: <message>` so the React toast can show something useful |

Frontend `getApiErrorMessage()` reads `data.message → data.error →
error.message → "An unexpected error occurred"`, so the same envelope
feeds both the toast UI and the Axios error fallback.

### Application logging

- **Library:** Logback via Spring Boot's default starter; SLF4J
  facade (`@Slf4j` from Lombok on every service / filter / handler).
- **Baseline levels** in `application.yml`:
  ```yaml
  logging:
    level:
      com.fyp.supervision: INFO
      org.springframework.security: INFO
  ```
- **Dev profile** (`application-dev.yml`) bumps both to `DEBUG`, and
  `spring.jpa.show-sql: true` echoes every Hibernate query to the
  log.
- **What is logged:** authentication failures (`log.error` in
  `JwtAuthenticationFilter` for unhandled exceptions, `log.warn` in
  `JwtTokenProvider.validateToken` for invalid JWTs); AI-service
  outages (`log.warn` in `AiServiceClient` for each transport
  failure); audit-write failures (`log.warn` in `AuditService`);
  unhandled controller exceptions (`log.error("Unhandled exception")`
  with full stack trace).
- **What is *not* logged:** raw passwords, JWT contents, password
  reset tokens (the SHA-256 hash is the only persisted artefact),
  signature image bytes.

### Audit log

`AuditService` is the single entry point for `audit_log` writes:

```java
@Transactional(propagation = Propagation.REQUIRES_NEW)
public void record(UserAccount actor, String action, String entityName,
                   String entityId, String details, HttpServletRequest request) {
    try {
        AuditLog log = AuditLog.builder()
            .user(actor)
            .action(action)
            .entityName(entityName)
            .entityId(entityId)
            .details(truncate(details, 4000))
            .ipAddress(request != null ? clientIp(request) : null)
            .userAgent(request != null ? truncate(request.getHeader("User-Agent"), 500) : null)
            .build();
        auditLogRepository.save(log);
    } catch (Exception e) {
        AuditService.log.warn("Audit log write failed for action={}: {}", action, e.getMessage());
    }
}
```

Notable behaviours:

- **`REQUIRES_NEW` propagation + try/catch** — an audit-write failure must never break the action being logged.
- **`recordAnonymous(...)`** overload covers pre-authentication events such as failed logins.
- **`@Async recordAsync(...)`** for hot paths where audit latency matters.
- **`X-Forwarded-For` honoured** in `clientIp(...)` — first hop only — so the IP captured behind a reverse proxy is the original client.
- **Action codes are SCREAMING_CASE** strings; downstream filtering groups by `action`. Examples observed in the codebase: `LOGIN_SUCCESS`, `LOGIN_FAILURE`, `LOGIN_LOCKOUT_TRIGGERED`, `LOGIN_REJECTED_LOCKED`, `USER_APPROVED`, `USER_REJECTED`, `CYCLE_ACTIVATED`, `GRADE_FINALISED`.
- **Entity name + id pair** lets the audit page filter by either column independently; an `INDEX (entity_name, entity_id)` covers compound lookups.
- **Per-row size caps**: `details` truncated to 4000 chars, `user_agent` to 500 chars — keeps row size predictable.

The `AdminAuditLogController` (`GET /admin/audit-logs`) and the React
page at `pages/admin/AuditLogs.tsx` consume the trail.

## Notable design choices for the report

- **URL-prefix is the RBAC mechanism, not `@PreAuthorize`.** Adding a controller to the right subpackage is the only step needed for role gating.
- **Three layers of account-status enforcement** (login, `UserDetailsServiceImpl.enabled`, JWT filter re-read) so a status flip takes effect immediately even with an unexpired token in the field.
- **Login throttling is transaction-aware.** `noRollbackFor` keeps the failed-attempt increment from being rolled back by the thrown `BadCredentialsException`.
- **Password reset tokens never live in the database in plaintext** — only the SHA-256 hex hash is persisted, so a database read does not yield a usable token.
- **File uploads are content-agnostic but path-safe.** No MIME-type allowlist (any file the user can attach), but path traversal is rejected and the on-disk name is UUID-prefixed.
- **CSRF disabled.** Stateless JWT + bearer header in `Authorization` rather than a cookie removes the CSRF surface.
- **Sessions are stateless.** No `JSESSIONID`, no server-side session store; logout is a no-op on the server.
- **Generic 401 message on bad login.** "Invalid credentials. Please try again." — does not disclose whether the user exists.
- **Generic 403 message on URL-prefix mismatch** — does not disclose what the missing role is.
- **Audit log writes are best-effort.** A failure in the audit pipeline never breaks the user action; the failure itself is logged at WARN.
- **Email and push are off by default.** No SMTP credentials and no VAPID keypair are required to run the stack end-to-end; flipping `APP_EMAIL_ENABLED` / `APP_PUSH_ENABLED` to `true` after supplying secrets activates them.
- **HTTPS is conceptual at this stage.** All traffic is HTTP on localhost. A faculty deployment would terminate HTTPS at a reverse proxy in front of nginx — see Section 5.7.3 and 5.10.

## Items to highlight when written up

- Bean Validation on every DTO (regex for MMU ID, regex for MMU email domains, password 8–100, etc.) — backed up by service-layer pairing checks (student vs supervisor email subdomain)
- File upload guards: path traversal check, UUID-prefixed name, per-entity dir, 50 MB Spring multipart limit
- BCrypt for passwords, HS256 for JWTs, SHA-256 for password-reset tokens and meeting-log signatures, VAPID for push (off by default)
- HTTPS not configured at the application layer — explicit acknowledgement, faculty deployment would terminate at a reverse proxy
- URL-prefix RBAC table (already in 5.6.2 — repeat it here in security framing) plus per-row ownership service trio (`SupervisorAccessService`, `StudentAccessService.getMeetingDto/getLogDto`, `GradingService` per-supervisor check)
- Three-layer account-status enforcement (login + `enabled` + JWT-filter re-read)
- Login throttling: 5 failures → 15-minute lockout; `noRollbackFor` keeps the increment alive across the thrown exception; three audit codes (LOGIN_FAILURE / LOGIN_LOCKOUT_TRIGGERED / LOGIN_REJECTED_LOCKED)
- Password reset tokens stored as SHA-256 hash only; raw token sent via email
- CSRF disabled (stateless JWT) — explain why
- Uniform error envelope; 401 message rewritten to avoid user-existence disclosure; 403 message rewritten to avoid role disclosure
- Logback baseline INFO; dev profile DEBUG; what is and is not logged
- AuditService design — REQUIRES_NEW + try/catch, X-Forwarded-For honoured, SCREAMING_CASE action codes, 4000-char detail cap
