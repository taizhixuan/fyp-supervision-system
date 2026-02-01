# Coding Implementation Plan — FYP Supervision System

> **Purpose**: This prompt instructs Claude Code to read the entire repository and project documentation, then produce a complete, actionable coding implementation plan that turns the existing frontend-only SPA into a fully functional end-to-end system.

---

## Role

You are a senior full-stack engineer acting as technical lead for this project. Your job is to produce a **coding implementation plan** — not a report, not a thesis chapter, not a design document. Every section you write must be something a developer can pick up and start building from.

---

## Context

| Aspect | Current state |
|--------|--------------|
| **Frontend** | Fully implemented React SPA — 92+ pages across 4 roles (Student, Supervisor, FYP Committee, System Admin), reusable UI component library, routing, form validation, and API client scaffolding. All screen designs are coded. |
| **Backend** | Does not exist. The frontend points at `http://localhost:8080/api` via Axios with JWT bearer-token interceptors, but nothing is running there. |
| **Database** | Does not exist. Data models are implied by the TypeScript types in `frontend/src/types/`. |
| **AI services** | Do not exist. The frontend has pages for Supervisor Recommendation, Proposal Analysis, and a Chatbot — all need backing services. |
| **Documentation** | A `project-info/` folder may contain use-case tables, an ERD, sequence diagrams, and other requirements artifacts. If this folder exists, treat it as the authoritative source of truth for scope. If it does not exist, derive scope from the frontend code and TypeScript types. |

---

## Step 0 — Repository and documentation audit

Before writing anything, you **must** do the following (in order):

1. **Map the repository structure.** List every top-level directory and the purpose of each.
2. **Catalogue the frontend.**
   - Tech stack: React 18, TypeScript (strict), Vite, Tailwind CSS, React Router v6, TanStack Query, Axios, React Hook Form + Zod, Lucide icons.
   - Page inventory: list every page file under `frontend/src/pages/` grouped by role.
   - API client layer: read `frontend/src/lib/api/` — note every endpoint the frontend already expects.
   - Type definitions: read every file in `frontend/src/types/` — these are the closest thing to a data model.
   - Hooks: read `frontend/src/lib/hooks/` — note what data-fetching patterns exist.
   - Auth: read `frontend/src/lib/auth/` — note the auth context, token storage (`localStorage.access_token`), and the 401-redirect interceptor.
3. **Read `project-info/`** (if it exists).
   - Use-case list and use-case tables → these define scope.
   - ERD → this defines the database schema.
   - Sequence diagrams → these define API flows and the tables each flow touches.
   - Any other artifacts.
4. **Identify every gap** between what the frontend expects and what currently exists. Categorize gaps as: backend API, database, AI service, file storage, auth infrastructure, deployment infrastructure.
5. **Summarize conflicts.** If the frontend types contradict the ERD or use-case docs, list each conflict and state which source you will follow (prefer `project-info/` when it exists, otherwise prefer frontend types).

---

## Step 1 — Target architecture

Define the target system as a set of deployable services:

| Service | Technology | Responsibility |
|---------|-----------|---------------|
| **frontend** | React SPA (existing) | All UI — served as static files or via Vite dev server |
| **api** | Java 17+ / Spring Boot 3 | REST API, business logic, auth, file handling |
| **db** | MySQL 8 | Persistent storage |
| **ai-recommendation** | Python / Flask | Supervisor recommendation engine |
| **ai-proposal-analyzer** | Python / Flask | Proposal quality analysis |
| **ai-chatbot** | Python / Flask | FYP Q&A chatbot |

For each service, specify:
- How it communicates with other services (protocol, base path, auth mechanism).
- What port it runs on in development.
- What environment variables it needs.

Keep the architecture minimal. Do not add services, queues, caches, or infrastructure that the use cases do not require.

---

## Step 2 — Repository layout

Propose an **exact** folder/file tree for the new code that will be added to this repository. The frontend already exists — do not reorganize it. Focus on:

1. **Spring Boot backend** — standard Maven/Gradle project layout with packages for:
   - `config` (security, CORS, Swagger, etc.)
   - `auth` (JWT filter, provider, login/register controllers)
   - `user`, `student`, `supervisor`, `committee`, `admin` (domain modules — each with controller, service, repository, DTO, entity)
   - `proposal`, `meeting`, `log`, `document`, `announcement`, `notification`, `deadline`, `chatbot` (feature modules)
   - `ai` (REST clients that call Flask services)
   - `storage` (file upload/download abstraction)
   - `common` (base entity, exception handler, pagination, audit)
2. **Flask AI microservices** — one folder per service, each with its own `requirements.txt`, `app.py`, and a simple `Dockerfile`.
3. **Database migrations** — `db/migration/` with Flyway-style versioned SQL files.
4. **Docker Compose** — root-level `docker-compose.yml` that starts all services.
5. **API specification** — location for the OpenAPI spec (can be auto-generated from Spring Boot annotations).

---

## Step 3 — Database schema

Using the ERD from `project-info/` (or, if unavailable, the TypeScript types in `frontend/src/types/`), produce:

1. **A complete table list.** For each table:
   - Table name
   - Purpose (one sentence)
   - Columns: name, type, constraints (PK, FK, NOT NULL, UNIQUE, DEFAULT)
   - Foreign-key relationships (which table, which column, cascade behavior)
2. **Flyway migration plan.** Break the schema into ordered migrations:
   - `V1__create_users_and_roles.sql`
   - `V2__create_student_supervisor_profiles.sql`
   - `V3__create_supervision_requests.sql`
   - `V4__create_proposals.sql`
   - `V5__create_meetings_and_logs.sql`
   - `V6__create_documents.sql`
   - `V7__create_announcements_and_notifications.sql`
   - `V8__create_deadlines_and_cycles.sql`
   - `V9__create_ai_results.sql`
   - `V10__create_audit_and_system.sql`
   - (adjust numbering and grouping based on actual ERD)
3. **Seed data.** Define what reference data is inserted on first run: roles, a default admin user, sample FYP cycle, default system parameters.

---

## Step 4 — API contract

For **every** module listed below, define the REST endpoints. Use this exact format per endpoint:

```
[METHOD] /api/[path]
  Auth: [role(s) or PUBLIC]
  Request body / params: [fields]
  Response: [fields]
  Tables: [which tables are read/written]
  Errors: [list of error cases with HTTP status codes]
```

### Modules (must cover all frontend pages):

1. **Authentication** — register, login, logout, refresh token, forgot/reset password, get current user, change password, update profile
2. **User management** (admin) — CRUD users, filter/search, activate/suspend/block
3. **Student profile** — get/update own profile, profile image upload
4. **Supervisor profile** — get/update own profile, set availability and quota
5. **Supervisor discovery** (student) — list/search/filter supervisors, get supervisor detail
6. **AI supervisor recommendation** (student) — request recommendations, get results
7. **Supervision requests** — student creates/withdraws, supervisor accepts/rejects, list by role
8. **Proposals** — CRUD, submit, versioning, file upload, get analysis, supervisor review, committee review
9. **AI proposal analysis** — trigger analysis, get results
10. **Project registration** — get registration status, timeline events
11. **Meetings** — create/confirm/reschedule/cancel/complete, list by role, get available slots
12. **Supervision logs** — CRUD, submit, supervisor sign, lock, list by role
13. **Documents** — upload, download, list, version history, supervisor feedback
14. **Announcements** — create (supervisor/committee), list, mark viewed
15. **Notifications** — list, get unread count, mark read, mark all read, notification preferences
16. **Deadlines** (committee/admin) — CRUD deadlines and FYP cycles
17. **Resources** (committee) — CRUD resources and categories
18. **System settings** (admin) — system parameters, integration settings, export config
19. **Audit logs** (admin) — query audit trail
20. **AI chatbot** — send message, get session history

Cross-cutting concerns to address in this section:
- Pagination format (page, size, sort → content, totalElements, totalPages)
- Standard error response format (`{ timestamp, status, error, message, path }`)
- File upload pattern (multipart/form-data, max size, allowed types)
- How the frontend's existing Axios interceptor maps to the backend's auth filter

---

## Step 5 — Implementation roadmap

This is the core deliverable. Organize work into **milestones** (M1 through M8, or however many are needed). For each milestone:

### Format per milestone:

```
### M[n]: [Milestone name]
Objective: [One sentence — what is demonstrable at the end]

Backend tasks:
- [ ] ...

Database tasks:
- [ ] ...

Frontend integration tasks:
- [ ] ...  (wiring real API calls, removing mock data, handling loading/error states)

AI service tasks:  (if applicable)
- [ ] ...

Deliverables:
- [ ] [What a user can do end-to-end after this milestone]

Dependencies:
- Requires M[x] to be complete because [reason]
```

### Recommended milestone sequence:

1. **M1 — Project scaffolding + database + auth**
   Spring Boot project, Docker Compose, MySQL, Flyway migrations, JWT auth (register, login, get-me), CORS config, first frontend-to-backend login flow working.

2. **M2 — User and profile management**
   Student/supervisor profiles, admin user CRUD, profile image upload.

3. **M3 — Supervisor discovery + supervision requests**
   Browse/search supervisors, send/accept/reject requests, link student-supervisor.

4. **M4 — Proposals + AI analysis**
   Proposal CRUD, versioning, file upload, Flask proposal-analyzer service, store and display analysis results.

5. **M5 — Meetings + scheduling**
   Availability, slot booking, confirm/reschedule/cancel, supervisor meeting management.

6. **M6 — Supervision logs + documents**
   Log CRUD, sign, lock flow, document upload/download/versioning, supervisor feedback.

7. **M7 — Announcements + notifications + deadlines + resources**
   All communication and timeline features, notification preferences.

8. **M8 — AI recommendation + chatbot + admin tools + polish**
   Flask recommendation service, Flask chatbot service, system settings, audit logs, export, final integration testing.

Adjust this sequence based on what the actual artifacts dictate, but always minimize rework by building auth and data foundations first.

---

## Step 6 — Frontend-backend integration details

For each of these integration points, explain the exact implementation approach:

1. **API client configuration** — how `frontend/src/lib/api/client.ts` connects to the backend, CORS setup, environment variables (`VITE_API_BASE_URL`).
2. **Authentication flow** — login → store token in `localStorage` → attach via Axios interceptor → 401 handling → redirect to `/session-expired`. Detail what the backend JWT filter does on each request.
3. **Token refresh** (if implementing) — when, how, and what happens if the refresh fails.
4. **File upload** — multipart form-data from frontend, how the backend stores the file, how the frontend gets a download URL.
5. **AI service integration** — frontend calls backend → backend calls Flask → Flask returns result → backend stores result → backend returns to frontend. Include the exact request/response flow for each AI feature.
6. **Real-time considerations** — if any feature needs polling or WebSocket (e.g., notifications), specify the approach. If polling is sufficient, say so.
7. **Form validation alignment** — the frontend uses Zod schemas; the backend uses Jakarta Bean Validation. Note any fields where validation rules must match.

---

## Step 7 — Testing plan

### Backend
- Unit tests: service layer with mocked repositories (JUnit 5 + Mockito).
- Integration tests: controller tests with `@SpringBootTest` + Testcontainers (MySQL).
- What to test first: auth endpoints, then CRUD for each module.

### Database
- Flyway migration verification: migrations run cleanly on a fresh database.
- Seed data verification.

### AI services
- Each Flask service has at least one test with a sample payload that returns a valid response.

### End-to-end smoke tests (manual or scripted)
Define 3–5 scenarios that prove the system works:

1. **Student registration to proposal submission:**
   Register → login → update profile → browse supervisors → send request → supervisor accepts → create proposal → submit → AI analysis generated → view results.

2. **Supervisor review cycle:**
   Supervisor logs in → views request inbox → accepts student → reviews proposal → provides feedback → student revises → supervisor approves.

3. **Meeting and log workflow:**
   Student requests meeting → supervisor confirms → meeting completed → student creates log → supervisor signs → log locked.

4. **Committee oversight:**
   Committee member logs in → views all proposals → reviews and decides → posts announcement → manages deadlines.

5. **Admin operations:**
   Admin logs in → creates user accounts → configures system parameters → views audit logs.

---

## Step 8 — Deployment

### Development (local)
- `docker-compose.yml` that starts: MySQL (port 3306), Spring Boot API (port 8080), three Flask services (ports 5001–5003).
- Frontend runs separately via `npm run dev` on port 3000 (Vite dev server with proxy or CORS).
- Commands to start everything from scratch:
  ```
  docker-compose up -d
  cd frontend && npm install && npm run dev
  ```
- Environment variables list (every variable, its purpose, and its default value).

### Production notes (brief)
- Frontend: build static files (`npm run build`), serve via Nginx or CDN.
- Backend: Docker image, reverse proxy (Nginx), persistent volume for uploaded files.
- Database: managed MySQL instance or Docker with a named volume.
- AI services: Docker images behind the API server (not exposed publicly).
- HTTPS, environment-specific configs, log aggregation — mention but do not design in detail.

---

## Step 9 — Risks and assumptions

List engineering risks (not project-management risks). For each:

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Example: Frontend types may not match the final DB schema | API contract breaks, frontend crashes | Define DTOs as the contract; map entities to DTOs in the service layer; never expose entities directly |
| ... | ... | ... |

List assumptions you made (e.g., "No existing database exists," "File storage is local filesystem for MVP," "Email sending is out of scope for the first version").

---

## Output rules

- **Be specific.** Every endpoint has a path, method, and role. Every table has columns. Every migration has a filename.
- **Be implementation-ready.** A developer should be able to start coding from your plan without asking clarifying questions.
- **Do not invent scope.** Only plan features that the frontend pages and project documentation require. If the frontend has a page for it, plan the backend for it. If neither the frontend nor docs mention it, do not add it.
- **Do not pad.** No motivational text, no "this is important because," no summaries of what you are about to do. Just the plan.
- **Flag conflicts.** If the TypeScript types disagree with the ERD, or if a frontend page implies a feature not mentioned in use cases, call it out and state your decision.
- **State assumptions.** Whenever you make a judgment call (e.g., choosing Flyway over Liquibase, choosing local file storage over S3), state it as an explicit assumption so the developer can override it.

---

## Execution

Read the entire repository and all available documentation now. Then produce the complete coding implementation plan following the structure above (Steps 1–9). Do not ask for clarification — make reasonable assumptions and document them.
