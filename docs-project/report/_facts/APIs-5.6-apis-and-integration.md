# Facts — 5.6 APIs and Integration

> Existing 5.6 in `chapter5.md:1923` is template-only (four empty
> sub-headings). This file is a fresh fact gather; nothing to compare
> against.

## Files involved

### Backend (Spring Boot)
| Path | Role |
|---|---|
| `backend/src/main/java/com/fyp/supervision/controller/**/*.java` | 47 REST controllers; URL prefix → role mapping in `SecurityConfig` |
| `backend/src/main/java/com/fyp/supervision/dto/auth/*.java` | Auth DTOs: `LoginRequest`, `LoginResponse`, `RegisterRequest`, `ChangePasswordRequest`, `ForgotPasswordRequest`, `ResetPasswordRequest`, `UpdateProfileRequest` |
| `backend/src/main/java/com/fyp/supervision/dto/common/UserDto.java` | Shared user DTO returned by `/auth/login`, `/auth/me`, `/auth/update-profile` |
| `backend/src/main/java/com/fyp/supervision/security/JwtAuthenticationFilter.java` | Per-request token extraction + `SecurityContext` population |
| `backend/src/main/java/com/fyp/supervision/security/JwtTokenProvider.java` | HS256 issue/parse/validate via JJWT 0.12.5 |
| `backend/src/main/java/com/fyp/supervision/config/SecurityConfig.java` | URL-prefix authority routing |
| `backend/src/main/java/com/fyp/supervision/config/CorsConfig.java` | CORS allowlist for `localhost:3000` and `localhost:5173` |
| `backend/src/main/java/com/fyp/supervision/exception/GlobalExceptionHandler.java` | `@RestControllerAdvice` — uniform error envelope |
| `backend/src/main/java/com/fyp/supervision/service/AiServiceClient.java` | `RestTemplate`-based gateway to the three Flask services |

### Frontend (React)
| Path | Role |
|---|---|
| `frontend/src/lib/api/client.ts` | Axios instance, JWT interceptor, 401 → `/session-expired`, `getApiErrorMessage()` reader |
| `frontend/src/lib/api/auth.ts`, `notifications.ts`, `resources.ts` | Per-feature API modules |
| `frontend/src/lib/hooks/use*.ts` | TanStack Query wrappers per role/feature |

### AI services (Flask)
| Path | Role |
|---|---|
| `ai-recommendation/app.py` | `GET /ai/health`, `POST /ai/recommendations` |
| `ai-proposal-analyzer/app.py` | `GET /ai/health`, `POST /ai/analyze-proposal` |
| `ai-chatbot/app.py` | `GET /ai/health`, `POST /ai/chat` |

## Endpoint inventory (backend)

URL prefix mapping (from `SecurityConfig.java`):

| Prefix | Required authority |
|---|---|
| `/auth/register`, `/auth/login`, `/auth/forgot-password`, `/auth/reset-password`, `/auth/verify-reset-token`, `/announcements/latest`, `/system/parameters/public`, `/uploads/**` | permitAll |
| `/admin/**` | `SYSTEM_ADMIN` |
| `/committee/**` | `FYP_COMMITTEE` |
| `/supervisor/**` | `SUPERVISOR` |
| `/student/**` | `STUDENT` |
| `/supervisors/**` (plural — student-facing supervisor directory) | `STUDENT` |
| Everything else | authenticated |

All paths are mounted under the Spring `server.servlet.context-path:
/api`, so the live URL is always `http://<host>:8080/api/<path>`.

### Auth (`AuthController`, `/auth/**`)

| Method | Path | Auth | Body / Query | Returns |
|---|---|---|---|---|
| POST | `/auth/register` | permitAll | `RegisterRequest` (validated) | 201 `MessageResponse` |
| POST | `/auth/login` | permitAll | `LoginRequest` | `LoginResponse` |
| POST | `/auth/logout` | authenticated | — | 204 (stateless: client discards token) |
| GET | `/auth/me` | authenticated | — | `UserDto` |
| PUT | `/auth/change-password` | authenticated | `ChangePasswordRequest` | `MessageResponse` |
| PUT | `/auth/update-profile` | authenticated | `UpdateProfileRequest` | `UserDto` |
| POST | `/auth/profile-image` | authenticated | multipart `file` | `{ imageUrl: string }` |
| POST | `/auth/forgot-password` | permitAll | `ForgotPasswordRequest` | `MessageResponse` |
| POST | `/auth/reset-password` | permitAll | `ResetPasswordRequest` | `MessageResponse` |
| GET | `/auth/verify-reset-token?token=…` | permitAll | — | `{ valid: boolean }` |

### Shared cross-role (root controllers)

| Controller | Path prefix | Endpoints |
|---|---|---|
| `AnnouncementController` | `/announcements` | `GET /latest` (permitAll), `GET /` (paged), `GET /{id}`, `GET /{id}/attachments/{attachmentId}` |
| `NotificationController` | `/notifications` | `GET /` (paged), `GET /unread-count`, `PUT /{id}/read`, `PUT /mark-all-read`, `GET /push/vapid-public-key`, `POST /push/subscribe`, `DELETE /push/subscribe` |
| `NotificationPreferenceController` | `/notifications/preferences` | `GET /`, `PUT /` |
| `ResourceController` | `/resources` | `GET /`, `GET /categories`, `GET /{id}`, `GET /{id}/download` |
| `SystemController` | `/system` | `GET /parameters/public` (permitAll) |

### Student tier (`/student/**`, `/supervisors/**`)

| Controller | Endpoints |
|---|---|
| `StudentDashboardController` | `GET /student/dashboard` |
| `StudentProfileController` | `GET /student/profile`, `PUT /student/profile`, `POST /student/profile/image` |
| `SupervisorDirectoryController` (plural prefix) | `GET /supervisors`, `GET /supervisors/{id}` |
| `StudentRecommendationController` | `GET /student/recommendations`, `POST /student/recommendations/refresh` |
| `StudentSupervisionRequestController` | `GET /student/supervision-requests`, `POST /student/supervision-requests`, `POST /student/supervision-requests/{id}/withdraw` |
| `StudentProposalController` | `GET /student/proposal`, `POST /student/proposal`, `PUT /student/proposal`, `POST /student/proposal/submit`, `GET /student/proposal/versions`, `GET /student/proposal/feedback`, `GET /student/proposal/analysis`, `GET /student/proposal/export.docx`, `POST /student/proposal/analyze` |
| `StudentMeetingController` | `GET /student/meetings`, `POST /student/meetings`, `GET /student/meetings/{id}`, `PUT /student/meetings/{id}`, `POST /student/meetings/{id}/cancel` |
| `StudentMeetingLogController` | `GET /student/meeting-logs`, `POST /student/meeting-logs`, `GET /student/meeting-logs/prefill`, `GET /student/meeting-logs/{id}`, `PUT /student/meeting-logs/{id}`, `POST /student/meeting-logs/{id}/submit`, `POST /student/meeting-logs/{id}/sign` |
| `StudentLogController` | `GET /student/logs`, `POST /student/logs`, `GET /student/logs/{id}`, `PUT /student/logs/{id}`, `POST /student/logs/{id}/submit`, `POST /student/logs/{id}/sign` |
| `StudentDocumentController` | `GET /student/documents`, `POST /student/documents` (multipart), `GET /student/documents/{id}`, `GET /student/documents/{id}/download`, `DELETE /student/documents/{id}` |
| `StudentDeadlineController` (root `/student`) | `GET /student/deadlines`, `GET /student/registration`, `GET /student/notification-preferences`, `PUT /student/notification-preferences` |
| `StudentChatController` | `GET /student/chat` (history), `POST /student/chat` (message), `POST /student/chat/feedback/{messageId}` |
| `StudentGradeController` | `GET /student/grades` |

### Supervisor tier (`/supervisor/**`)

| Controller | Endpoints |
|---|---|
| `SupervisorDashboardController` | `GET /supervisor/dashboard` |
| `SupervisorProfileController` | `GET /supervisor/profile`, `PUT /supervisor/profile`, `POST /supervisor/profile/image` |
| `SupervisorRequestController` | `GET /supervisor/requests`, `GET /supervisor/requests/{id}`, `POST /supervisor/requests/{id}/respond` |
| `SupervisorSuperviseeController` | `GET /supervisor/supervisees?scope=active|past`, `GET /supervisor/supervisees/{id}` |
| `SupervisorProposalController` | `GET /supervisor/proposals`, `GET /supervisor/proposals/{id}`, `POST /supervisor/proposals/{id}/feedback` |
| `SupervisorMeetingController` | `GET /supervisor/meetings`, `GET /supervisor/meetings/{id}`, `POST /supervisor/meetings/{id}/respond`, `POST /supervisor/meetings/{id}/complete` |
| `SupervisorMeetingLogController` | `GET /supervisor/meeting-logs`, `GET /supervisor/meeting-logs/{id}`, `PUT /supervisor/meeting-logs/{id}/comments`, `POST /supervisor/meeting-logs/{id}/request-correction`, `POST /supervisor/meeting-logs/{id}/sign` |
| `SupervisorLogController` | `GET /supervisor/logs`, `GET /supervisor/logs/{id}`, `POST /supervisor/logs/{id}/review`, `POST /supervisor/logs/{id}/sign` |
| `SupervisorDocumentController` | `GET /supervisor/documents`, `GET /supervisor/documents/{id}`, `GET /supervisor/documents/{id}/download`, `POST /supervisor/documents/{id}/feedback` |
| `SupervisorAnnouncementController` | `GET /supervisor/announcements`, `GET /supervisor/announcements/{id}`, `POST /supervisor/announcements` (multipart **or** JSON), `PUT /supervisor/announcements/{id}`, `DELETE /supervisor/announcements/{id}` |
| `SupervisorGradeController` | `GET /supervisor/grades`, `POST /supervisor/grades` |

### Committee tier (`/committee/**`)

| Controller | Endpoints |
|---|---|
| `CommitteeDashboardController` | `GET /committee/dashboard` |
| `CommitteeAnnouncementController` | `GET /committee/announcements`, `POST /committee/announcements` (multipart **or** JSON), `PUT /committee/announcements/{id}`, `POST /committee/announcements/{id}/archive`, `DELETE /committee/announcements/{id}` |
| `CommitteeProposalController` | `GET /committee/proposals`, `GET /committee/proposals/{id}`, `POST /committee/proposals/{id}/review` |
| `CommitteeProjectController` | `GET /committee/projects`, `GET /committee/projects/{id}`, `GET /committee/projects/unpaired-students`, `GET /committee/projects/supervisor-loads`, `GET /committee/projects/supervisor-loads/{id}`, `POST /committee/projects/{id}/advance-phase` |
| `CommitteeDocumentController` | `GET /committee/documents`, `POST /committee/documents` (multipart), `GET /committee/documents/{id}`, `DELETE /committee/documents/{id}` |
| `CommitteeReportController` | `GET /committee/reports`, `POST /committee/reports/generate`, `GET /committee/reports/{id}/download`, `DELETE /committee/reports/{id}` |

### Admin tier (`/admin/**`)

| Controller | Endpoints |
|---|---|
| `AdminDashboardController` | `GET /admin/dashboard` |
| `AdminUserController` | `GET /admin/users`, `POST /admin/users`, `GET /admin/users/{id}`, `PUT /admin/users/{id}`, `DELETE /admin/users/{id}`, `PUT /admin/users/bulk-status`, `GET /admin/users/pending`, `POST /admin/users/{id}/approve`, `POST /admin/users/{id}/reject` |
| `AdminCycleController` | `GET /admin/cycles`, `POST /admin/cycles`, `GET /admin/cycles/_meta`, `GET /admin/cycles/template`, `POST /admin/cycles/from-template`, `GET /admin/cycles/{id}`, `PUT /admin/cycles/{id}`, `POST /admin/cycles/{id}/activate`, `POST /admin/cycles/{id}/complete`, `POST /admin/cycles/{id}/archive`, `DELETE /admin/cycles/{id}` |
| `AdminDeadlineController` | `GET /admin/deadlines`, `POST /admin/deadlines`, `GET /admin/deadlines/{id}`, `PUT /admin/deadlines/{id}`, `DELETE /admin/deadlines/{id}` |
| `AdminParameterController` | `GET /admin/parameters`, `GET /admin/parameters/{id}`, `PUT /admin/parameters/{id}` |
| `AdminIntegrationController` | `GET /admin/integrations`, `GET /admin/integrations/{id}`, `PUT /admin/integrations/{id}`, `POST /admin/integrations/{id}/test` |
| `AdminAuditLogController` | `GET /admin/audit-logs` |
| `AdminExportController` | `GET /admin/export-configs`, `POST /admin/export-configs`, `PUT /admin/export-configs/{id}`, `DELETE /admin/export-configs/{id}`, `POST /admin/export-configs/{id}/run`, `GET /admin/export-configs/{id}/download` |
| `AdminMaintenanceController` | `GET /admin/maintenance/jobs`, `GET /admin/maintenance/backups`, `GET /admin/maintenance/backups/download`, `GET /admin/maintenance/health-checks`, `POST /admin/maintenance/backup`, `POST /admin/maintenance/restore/{id}`, `POST /admin/maintenance/cleanup`, `POST /admin/maintenance/clear-cache` |
| `AdminProjectController` | `GET /admin/projects`, `GET /admin/projects/fyp1-pass`, `POST /admin/projects/{id}/fyp1-passed`, `POST /admin/projects/fyp1-passed/import` |
| `AdminGradeController` | `GET /admin/grades`, `GET /admin/grades/project/{projectId}`, `POST /admin/grades/{gradeId}/finalise` |
| `AdminRosterController` | `GET /admin/roster/students`, `GET /admin/roster/supervisors`, `POST /admin/roster/students/import` (multipart CSV), `POST /admin/roster/supervisors/import` (multipart CSV), `DELETE /admin/roster/students/{id}`, `DELETE /admin/roster/supervisors/{id}` |
| `AdminJobController` | `POST /admin/jobs/deadline-reminders/run` |

**Endpoint count:** roughly 130 routes across 47 controllers, including
multipart upload routes (announcement create, document upload, profile
image, roster CSV import).

## JSON payload examples

### `POST /auth/register`
Request:
```json
{
  "role": "STUDENT",
  "fullName": "Aisyah binti Rahman",
  "mmuId": "1201234567",
  "email": "aisyah@student.mmu.edu.my",
  "phone": "+60123456789",
  "password": "Aisyah@2024",
  "specialisation": "Software Engineering",
  "intakeYear": 2024
}
```
Validation: `mmuId` is exactly 10 digits;
`email` matches `^[A-Za-z0-9._%+-]+@(student\.mmu\.edu\.my|mmu\.edu\.my)$`;
`password` is 8–100 chars; `fullName` ≤ 200; `specialisation` is one of
Software Engineering / Data Science / Cybersecurity / Game Development /
Information Systems (student-only); `intakeYear` is the four-digit
calendar year (student-only).

Response (201):
```json
{ "message": "Registration successful. Awaiting administrator approval." }
```

### `POST /auth/login`
Request:
```json
{ "identifier": "aisyah@student.mmu.edu.my", "password": "Aisyah@2024", "rememberMe": false }
```
`identifier` is either MMU ID or email — `AuthService` resolves both.

Response (200):
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiJ9...",
  "user": {
    "userId": 12,
    "mmuId": "1201234567",
    "email": "aisyah@student.mmu.edu.my",
    "fullName": "Aisyah binti Rahman",
    "role": "STUDENT",
    "status": "ACTIVE",
    "profileImagePath": "uploads/profiles/12/abcd-photo.jpg",
    "lastLoginAt": "2026-05-10T14:30:21"
  },
  "currentPhase": "FYP1",
  "fyp1Passed": null
}
```
`currentPhase` and `fyp1Passed` are `@JsonInclude(NON_NULL)` — only emitted for STUDENT role with a project.

### `GET /student/dashboard`
Returns one large aggregated payload; key fields (per `StudentService.buildDashboard`):
```json
{
  "profile": { ... UserDto + StudentProfile fields ... },
  "registrationStatus": {
    "status": "PROPOSAL_PENDING",
    "supervisorAssigned": true,
    "isRegistered": false,
    "cycleActive": true,
    "cycleStatus": "ACTIVE",
    "trimesterStartDate": "2024-09-01",
    "trimesterEndDate": "2025-01-31",
    "meetingLogsCompleted": 4,
    "meetingLogsRequired": 6,
    "fyp1Passed": null,
    "fyp1ResultDecidedAt": null
  },
  "upcomingMeetings": [ ... ],
  "recentLogs": [ ... ],
  "recentDocuments": [ ... ],
  "upcomingDeadlines": [ ... ],
  "unreadNotifications": 3
}
```

### `POST /student/recommendations/refresh`
Request: `{}`. The backend assembles the full student profile and the
list of supervisors with their `pastProjectTitles` and posts to the
Flask service.

Response (passed through from the recommender):
```json
{
  "recommendations": [
    {
      "supervisorId": 7,
      "supervisorName": "Dr. Sarah Lee",
      "matchScore": 0.78,
      "components": {
        "semantic": 0.74,
        "interest": 0.50,
        "skill": 0.33,
        "programme": 1.0,
        "availability": 0.625
      },
      "matchAreas": ["machine learning", "natural language processing"],
      "explanation": "Strong topic alignment (semantic 0.74). Shared research areas (machine learning, natural language processing). 5 supervision slots free."
    }
  ],
  "generatedAt": "2026-05-10T14:30:21Z",
  "totalCandidates": 18,
  "eligibleCandidates": 12
}
```

### `POST /student/proposal/analyze`
Request: server-side; the backend reads the proposal text and posts:
```json
{
  "text": "...full proposal text...",
  "sections": { "problemStatement": "...", "objectives": "...", "scope": "...", "methodology": "..." }
}
```
Response (passed through from analyzer):
```json
{
  "overall_score": 78.4,
  "feasibility_score": 76.0,
  "innovation_score": 72.0,
  "clarity_score": 81.0,
  "scope_score": 79.0,
  "structure_score": 82.0,
  "issues_summary": "...",
  "missing_sections": [],
  "suggested_improvements": ["..."],
  "strengths": ["..."],
  "weaknesses": ["..."],
  "detailed_strengths": ["..."],
  "detailed_weaknesses": ["..."],
  "detailed_suggestions": ["..."],
  "summary": "Two-to-three sentence overall assessment from the LLM."
}
```

### `POST /student/chat`
Request:
```json
{
  "message": "When is the proposal due?",
  "sessionHistory": [ { "role": "user", "content": "..." }, { "role": "assistant", "content": "..." } ],
  "context": null
}
```
Response (passed through from chatbot):
```json
{
  "reply": "FYP1 proposals are due by the published deadline...",
  "references": [
    { "title": "Proposal Writing", "snippet": "...", "score": 0.71 }
  ],
  "confidence": 0.71
}
```

### Error envelope (every non-2xx response)
Built by `GlobalExceptionHandler.buildResponse`:
```json
{
  "timestamp": "2026-05-10T14:30:21.123",
  "status": 404,
  "error": "Not Found",
  "message": "Project not found"
}
```

| Exception | HTTP status | Mapped from |
|---|---|---|
| `ResourceNotFoundException` | 404 | service-layer "not found" |
| `BadRequestException` | 400 | service-layer guards |
| `ConflictException` | 409 | quota / unique violations |
| `BadCredentialsException` | 401 | login failures (message replaced with "Invalid credentials. Please try again.") |
| `AccessDeniedException` | 403 | Spring Security URL-prefix mismatch |
| `ForbiddenException` | 403 | service-layer ownership / cycle gate |
| `MethodArgumentNotValidException` | 400 | `@Valid` failures, fields concatenated as `, `-joined message |
| `MaxUploadSizeExceededException` | 400 | multipart > 50 MB |
| `Exception` (catch-all) | 500 | logged with stack trace; client gets `<ClassName>: <message>` |

The frontend's `getApiErrorMessage()` reads `response.data.message` →
`response.data.error` → `error.message`, so the same envelope serves
both the toast UI and the Axios fallback path.

## Authentication mechanism

- **Scheme:** stateless **JWT (HS256)** via `io.jsonwebtoken:jjwt` 0.12.5.
- **Issued by:** `JwtTokenProvider.generateToken(userId, email, role)` on a successful `/auth/login`.
- **Token claims:** `subject = userId.toString()`, `email`, `role`, `iat`, `exp`. Default expiry 24 h (`JWT_EXPIRY_MS=86400000`).
- **Validation:** `JwtAuthenticationFilter` runs before `UsernamePasswordAuthenticationFilter`, parses the `Authorization: Bearer <token>` header, calls `validateToken(...)`, looks up the `UserAccount` by id, and populates `SecurityContextHolder` with a `UsernamePasswordAuthenticationToken` carrying `ROLE_<UserRole.name()>` authorities.
- **Stateless logout:** `POST /auth/logout` returns 204 with no server-side state change; the client simply discards the token.
- **Account-status guards:** `AuthService.login` rejects `PENDING`, `SUSPENDED`, `BLOCKED`. The JWT filter additionally re-reads `user.status` on every request, so suspending an account terminates active sessions on their next call.
- **Login throttling (V27):** `user_account.login_attempts` increments on each failure; after the threshold, `lockout_until` is set and further attempts return a friendly "account locked" message until it elapses.
- **Token storage (frontend):** `localStorage` under key `access_token`. The Axios interceptor in `lib/api/client.ts` attaches `Authorization: Bearer ${token}` to every outgoing request and on a 401 clears the token and redirects to `/session-expired` (unless on an open auth page).
- **Password reset (V19, V21):** `POST /auth/forgot-password` issues a single-use token whose SHA-256 hash is stored in `password_reset_token`. The raw token is emailed; `POST /auth/reset-password` consumes it. `GET /auth/verify-reset-token?token=…` is a cheap pre-check used by the React reset page.
- **Profile image upload:** `POST /auth/profile-image` accepts a single multipart `file`; `FileStorageService` writes it under `uploads/profiles/<userId>/<uuid>-<filename>`.

## Internal API design

- **Base URL:** `http://<host>:8080/api` (Spring `server.servlet.context-path: /api`).
- **Media types:** JSON in / JSON out for almost every route. Five categories use multipart: announcement create (supervisor + committee), document upload (student + committee), profile image upload, roster CSV import, FYP1-passed CSV import. Three categories return binary: report download (CSV), proposal export (DOCX), document download (any MIME).
- **Pagination:** Spring `Pageable` consumed on most list endpoints. Convention: 1-indexed `page` + explicit `limit` for the announcements and a few public-facing lists (because Spring's default 0-indexed `page` + `size` confused the frontend); other lists use Spring's defaults.
- **DTO contract:** controllers return `Map<String, Object>` whose keys mirror the TypeScript interfaces in `frontend/src/types/<role>.ts`. Entities are never serialised directly; back-references on entities carry `@JsonIgnore` to break cycles. Jackson is configured with `default-property-inclusion: non_null` and ISO-8601 dates.
- **Error envelope:** uniform `{timestamp, status, error, message}` shape across every error path (see GlobalExceptionHandler above).
- **CORS:** `localhost:3000` (production frontend) and `localhost:5173` (Vite dev override) with credentials enabled. Methods: GET/POST/PUT/DELETE/OPTIONS. Max-age 3600.
- **Audit:** every mutating admin call writes an `audit_log` row through `AuditService.record(actor, action, entityName, entityId, details, request)`. `REQUIRES_NEW` propagation + try/catch ensures audit failures never break the user-facing action.
- **Async paths:** `EmailService` runs on the named `emailExecutor` thread pool; `AdminMaintenanceService` jobs run on `@Async` so the controller returns immediately and the React `MaintenanceCenter` polls `GET /admin/maintenance/jobs`.

## Third-party integrations

| Integration | Used by | Endpoint / library | Notes |
|---|---|---|---|
| AI recommendation service (internal Flask) | `AiServiceClient.getRecommendations` | `${AI_RECOMMENDATION_URL}/ai/recommendations` and `/ai/health` | Deterministic weighted scorer; failure → 503 (no fake empty list) |
| AI proposal analyzer (internal Flask) | `AiServiceClient.analyzeProposal` | `${AI_ANALYZER_URL}/ai/analyze-proposal` and `/ai/health` | DistilBERT chunk-and-average + optional remote LLM; failure → 503 |
| AI chatbot (internal Flask) | `AiServiceClient.chat` | `${AI_CHATBOT_URL}/ai/chat` and `/ai/health` | RAG over FAISS; failure → 503 |
| Remote LLM (Groq / OpenAI / OpenAI-compatible) | analyzer + chatbot Flask services | OpenAI Python SDK `1.54.5` + `httpx` `0.27.2`; provider precedence `LLM_API_KEY → GROQ_API_KEY → OPENAI_API_KEY` | Defaults: Groq `llama-3.3-70b-versatile`, OpenAI `gpt-3.5-turbo` |
| SMTP mail | `EmailService` | `spring-boot-starter-mail` against `MAIL_HOST` / `MAIL_PORT` (defaults `smtp.gmail.com:587`) with STARTTLS | Off by default (`APP_EMAIL_ENABLED=false`); used for password reset, notification emails |
| Web Push (VAPID) | `PushService` | `nl.martijndwars:web-push 5.1.1` + `bouncycastle:bcprov-jdk18on 1.78`; signed with VAPID keypair from env | Off by default (`APP_PUSH_ENABLED=false`); per-browser `push_subscription` rows |
| Google Fonts | Frontend `index.html` | `<link rel="preconnect">` + `<link rel="stylesheet">` to `fonts.googleapis.com` for `Plus Jakarta Sans` (400/500/600/700) | Build-time only |
| Docker named volumes | All services | `mysql_data`, `upload_data`, `recommendation_models`, `analyzer_models`, `chatbot_vector_store` | Survive image rebuilds |

The Spring backend is the **only** code path that talks to the AI
services. The frontend never opens a connection to ports 5001 / 5002 /
5003 directly — every AI call goes through `/api/student/...` or
`/api/admin/maintenance/health-checks` and is mediated by
`AiServiceClient`.

## AI service endpoints (Flask)

### `GET /ai/health` (all three services)
Returns service-specific JSON. Recommender includes embed model name,
weights, `top_k`. Analyzer includes whether DistilBERT is loaded and
the LLM provider. Chatbot includes `rag_ready`, `local_gen_loaded`,
and the LLM provider block.

### `POST /ai/recommendations` (recommendation, port 5001)
Request:
```json
{
  "studentProfile": { "programme": "...", "specialisation": "...", "interests": ["..."], "skills": ["..."], "bio": "..." },
  "supervisorProfiles": [
    {
      "userId": 7,
      "fullName": "Dr. Sarah Lee",
      "department": "Software Engineering",
      "faculty": "Faculty of Computing & Informatics",
      "researchAreas": ["..."],
      "expertise": ["..."],
      "preferredProjectTypes": ["..."],
      "bio": "...",
      "currentLoad": 3,
      "supervisionQuota": 8,
      "availabilityStatus": "AVAILABLE",
      "pastProjectTitles": ["..."]
    }
  ]
}
```

### `POST /ai/analyze-proposal` (analyzer, port 5002)
Request: see `POST /student/proposal/analyze` upstream payload above. Response includes the four NLP component scores, the DistilBERT-derived `overall_score`, and the LLM-derived prose fields.

### `POST /ai/chat` (chatbot, port 5003)
Request: see `POST /student/chat` upstream payload above. Response includes `reply`, `references`, `confidence`.

## Notable design choices

- **URL prefix is the RBAC mechanism.** Adding a controller to `controller/admin/` automatically restricts it to `SYSTEM_ADMIN` — no `@PreAuthorize` annotation needed for the role check.
- **Three "shared" controllers** sit at the root (`AnnouncementController`, `NotificationController`, `ResourceController`) and rely on `anyRequest().authenticated()`.
- **Plural `/supervisors/**` deliberately reads as STUDENT** — a directory of supervisors that students browse, not the supervisor's own area.
- **Multipart-or-JSON announcements.** `SupervisorAnnouncementController.create` and `CommitteeAnnouncementController.create` declare `consumes = { multipart/form-data, application/json }` so the same endpoint accepts either a JSON body (no attachments) or a multipart envelope (announcement + files + links).
- **Stateless JWT, no refresh token.** A 24-hour expiry was judged enough for the dev/demo cycle; a refresh-token endpoint can be added later without breaking the existing surface.
- **AI service failures propagate as 503**, not as fake empty results, so the frontend can show a "service temporarily unavailable" banner that is distinct from a generic error.
- **Health-checks are explicit.** `AdminDashboardController` calls `AiServiceClient.is*ServiceHealthy()` for each Flask service so the admin sees live up/down status without leaving the page.
- **Audit log is best-effort.** `AuditService` writes with `REQUIRES_NEW` propagation and swallows exceptions — an audit-log failure never breaks the action being logged.
- **Push and email are off by default** to keep the local dev stack runnable without secrets; flipping the env vars `APP_EMAIL_ENABLED`/`APP_PUSH_ENABLED` to `true` activates the integrations once VAPID and SMTP credentials are supplied.

## Items to highlight when written up

- 47 controllers, ~130 endpoints, mounted under `/api`
- URL-prefix authority routing replaces per-method `@PreAuthorize` for the role check
- Stateless JWT (HS256, 24-hour expiry, JJWT 0.12.5); status re-read on every request; account lockout via V27 columns
- Five multipart upload routes; three binary download routes
- Single error envelope for every non-2xx response
- AI gateway through `AiServiceClient` with explicit 503 propagation on service failure
- Three internal Flask services + remote LLM provider chain (LLM_API_KEY → GROQ_API_KEY → OPENAI_API_KEY)
- SMTP mail and VAPID Web Push gated by env (off by default)
- CORS dual-origin allowlist (3000 + 5173) tied to the deployment shape from 5.1
- DTO-as-Map convention — keys mirror TypeScript interfaces in `frontend/src/types/`
- Frontend Axios interceptor handles 401 → `/session-expired` redirect
- Drift to fix in the existing 5.6 template: the four sub-headings exist with no content; the rewrite needs to add the endpoint table, the JSON payloads, and the JWT description
