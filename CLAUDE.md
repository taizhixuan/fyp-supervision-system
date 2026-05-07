# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

Polyrepo-style monorepo with four runtime services orchestrated by Docker Compose:

```
backend/                  Spring Boot 3.2.5 REST API (Java 17 target)
frontend/                 React 18 + TypeScript + Vite SPA (see frontend/CLAUDE.md for app-level rules)
ai-recommendation/        Flask :5001 — XGBoost supervisor matcher
ai-proposal-analyzer/     Flask :5002 — DistilBERT proposal scorer
ai-chatbot/               Flask :5003 — FAISS + Flan-T5 RAG chatbot
docker-compose.yml        Production-style stack (db, backend, 3× AI, nginx-served frontend)
docker-compose.override.yml   Auto-merged: swaps frontend to Vite dev mode with HMR on :5173
Project-info/             Spec docs (Chapter 3/5/6, ERD, sequence diagrams) — reference, not code
```

## Common commands

### Full stack via Docker (recommended for integration work)
```powershell
docker-compose up --build              # Brings up db (3307→3306), backend (8080), frontend (5173 dev / 3000 prod), AI (5001-5003)
docker-compose logs -f backend         # Tail backend logs
docker-compose down -v                 # Stop and wipe MySQL volume (forces Flyway re-run on next up)
```
The `docker-compose.override.yml` is auto-loaded and replaces the production frontend with `Dockerfile.dev` running `vite --host 0.0.0.0`. Delete or rename it to test the nginx production build (port 3000).

### Backend (Spring Boot)
```powershell
cd backend
mvn clean compile                      # Quickest sanity check (Lombok + JPA validation)
mvn spring-boot:run                    # Run on :8080 with context-path /api
mvn test                               # JUnit (no test sources currently exist)
mvn clean package                      # Build target/supervision-1.0.0.jar
java -jar target/supervision-1.0.0.jar
```

### Frontend (React/Vite)
```powershell
cd frontend
npm install
npm run dev                            # Vite dev server on :3000 with /api proxy → :8080
npm run build                          # Production bundle to dist/ (vite build only — tsc was removed; pre-existing strict errors)
npm run lint                           # ESLint, --max-warnings 0
npm run preview                        # Preview the built bundle
```

### AI services (each is independent)
```powershell
cd ai-recommendation                   # or ai-proposal-analyzer / ai-chatbot
python -m venv venv ; .\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py                          # Flask app, port from FLASK_PORT env
python train_model.py                  # Re-train (recommendation/proposal-analyzer have one)
python build_knowledge_base.py         # ai-chatbot only — rebuild FAISS vector store
```

## Architecture

### Cross-service contract
- **Frontend ↔ Backend**: HTTP/JSON. Base URL controlled by `VITE_API_BASE_URL` (default `http://localhost:8080/api`). JWT bearer in `Authorization` header, token persisted in `localStorage` under key `access_token` (see `frontend/src/lib/api/client.ts`).
- **Backend ↔ AI**: Backend acts as gateway via `AiServiceClient`. AI URLs come from env: `AI_RECOMMENDATION_URL`, `AI_ANALYZER_URL`, `AI_CHATBOT_URL`. Frontend never calls Flask services directly.
- **Error envelope**: All backend errors return `{timestamp, status, error, message}` — `getApiErrorMessage()` in `frontend/src/lib/api/client.ts` reads `message` first, then `error`.
- **401 handling**: Axios response interceptor clears `access_token` and redirects to `/session-expired`, except on auth pages.

### Backend authority routing (`SecurityConfig.java`)
URL prefix → Spring Security authority. This is the **load-bearing convention** for adding endpoints:

| Path prefix | Authority |
|---|---|
| `/auth/register`, `/auth/login`, `/auth/forgot-password`, `/auth/reset-password`, `/auth/verify-reset-token`, `/announcements/latest`, `/system/parameters/public`, `/uploads/**` | permitAll |
| `/admin/**` | `SYSTEM_ADMIN` |
| `/committee/**` | `FYP_COMMITTEE` |
| `/supervisor/**` | `SUPERVISOR` |
| `/student/**` | `STUDENT` |
| `/supervisors/**` (note plural, no role prefix) | `STUDENT` — student-facing supervisor directory |

Controllers are organized in matching subpackages (`controller/admin/`, `controller/committee/`, `controller/student/`, `controller/supervisor/`). Endpoints in shared controllers (`AuthController`, `NotificationController`, `ResourceController`, `AnnouncementController`, `SystemController`) live at the root and are reachable by any authenticated user.

### Backend layer pattern
`controller/<role>/` → `service/` → `repository/` → `entity/`. Controllers return `Map<String, Object>` DTO shapes (not raw entities) keyed to match the TypeScript types in `frontend/src/types/`. Entity-graph fields use `@JsonIgnore` to break cycles. Build DTOs in the service, never serialize entities directly.

Key services: `AuthService`, `StudentService`, `SupervisorService`, `CommitteeService`, `AdminService`, `MeetingLogService`, `NotificationService`, `FileStorageService`, `AiServiceClient`, `AdminExportService`, `AdminMaintenanceService`, `CommitteeReportService`.

### Database / migrations
- MySQL 8 only. JPA `ddl-auto: validate` — schema is owned by Flyway, NOT Hibernate.
- Migrations: `backend/src/main/resources/db/migration/V1__…sql` through `V14__…sql`. Add new migrations as `V15__<description>.sql`; never edit an applied migration.
- Local Compose maps host **3307 → container 3306** (because dev machines often have a local MySQL on 3306).
- Nine domain enums in `enums/`: `UserRole`, `UserStatus`, `ProjectStatus`, `ProposalStatus`, `RequestStatus`, `MeetingStatus`, `MeetingLogStatus`, `AnnouncementStatus`, `CycleStatus`.

### Frontend architecture
The frontend has its own conventions in `frontend/CLAUDE.md` — read it before touching `frontend/src/`. Highlights that affect cross-cutting work:
- All API calls funnel through `src/lib/api/*`. Never `import axios` directly in pages.
- Routing: single `createBrowserRouter` in `src/app/router.tsx`. Auth pages eager, all role pages lazy. Role gating via `<ProtectedRoute allowedRoles={[...]}>`.
- Type barrel `src/types/index.ts` had role-name conflicts that were resolved by prefixing duplicates with `Sv`/`Committee`/`Admin`. When adding shared types, watch for name collisions across `student.ts` / `supervisor.ts` / `committee.ts` / `admin.ts`.
- Tailwind theme is brand-customized in `tailwind.config.js`; `Button` does not have a `variant="outline"` — use `variant="secondary"` instead.

## Environment-specific notes

- **Java toolchain on this machine is Java 25**, but `pom.xml` targets Java 17. Lombok must be ≥ 1.18.42 (already pinned in `pom.xml` `<lombok.version>`) for the annotation processor to work on JDK 25. The processor path is explicitly declared in `maven-compiler-plugin` — preserve that block.
- **Lombok + `@Builder`**: entity fields with default initializers must be annotated `@Builder.Default`, otherwise the builder silently zeroes them.
- **AI training environment**: use a CPython 3.12 venv (the MSYS2 Python in some dev setups can't compile ML wheels). `torch==2.5.1` on Windows — `torch 2.10.x` has a DLL init failure here.
- **Frontend Docker dev**: `VITE_USE_POLLING=true` is set in the override compose because Windows-mounted volumes don't propagate inotify events.
- **Shell**: PowerShell on Windows. Use `.\venv\Scripts\Activate.ps1`, `$env:VAR`, backtick line continuation. Bash is also available via WSL/git-bash if you prefer POSIX scripts.

## Adding a feature end-to-end

1. **DB**: write a new `V<N>__<desc>.sql` migration. Restart backend to apply.
2. **Entity / Repository**: add JPA entity with `@JsonIgnore` on back-references; add repository interface.
3. **Service**: business logic + DTO assembly. Return `Map<String, Object>` shapes that mirror the TS interface you'll write next.
4. **Controller**: place in the correct `controller/<role>/` subpackage so `SecurityConfig` authority rules apply automatically. For cross-role endpoints, put under a permitAll path and gate inside the method.
5. **Frontend types**: add to `frontend/src/types/<role>.ts` and re-export from `index.ts` (watch for naming collisions).
6. **Frontend API module**: add the call in `src/lib/api/<feature>.ts`. Use TanStack Query hooks in `src/lib/hooks/`.
7. **Page + route**: lazy-load in `src/app/router.tsx` under the correct `ProtectedRoute allowedRoles`.

## Commit & push policy (durable authorization)

After making substantive code changes in any task, **commit and push to the current branch without asking**. This is durable authorization — do not ask each time.

Rules:
- **Identity**: use the existing git config (`Httpsouls <taizhixuan@gmail.com>`). Do not pass `--author`. Do not add a `Co-Authored-By:` trailer. Do not add "🤖 Generated with Claude Code" or any similar marker.
- **Message style**: match the existing project commit style — short, lowercase, imperative. Look at `git log --oneline -10` before writing. Most commits in this repo are one line, often just `"update"` or `"update <file>: <thing>"`.
- **Don't sound like AI**: avoid `comprehensive`, `robust`, `seamless`, `leverage`, `implement`, `enhance`, `streamline`, `ensure`, `facilitate`, marketing adjectives, multi-paragraph bodies, section headers, and bullet lists. Don't summarize the diff in prose.
- **Good**: `add flyway migration deny rule`, `fix V15 typo`, `wire up /check command`, `tighten claude permissions`, `update`.
- **Bad**: `Implement comprehensive permission allowlist for improved security`, `Enhance the Flyway migration workflow with robust safeguards`.
- **Body**: usually skip it. Add a one-line body only when the *why* isn't obvious from the subject and would actually save someone time later.
- **Stage specific files** by name; don't `git add -A` (catches `.env`, IDE files, accidental large binaries).
- **Push** to the current tracking branch. Don't force-push (denied by `.claude/settings.json` anyway). If no upstream is set, push with `-u origin <branch>`.
- **When NOT to commit**: pure exploration/reading turns where no files changed; turns that only update docs the user said are temporary; turns where the user explicitly says "don't commit yet" or is mid-iteration.
- **One commit per task** is fine — don't split into many tiny commits unless the changes are genuinely independent.

If any of the above is genuinely ambiguous (e.g. mid-experiment, unclear branching), ask before committing. Otherwise just do it.

## Things to know before changing infra

- `docker-compose.override.yml` is auto-merged — if you add a `frontend` service block to the base file, the override's `!override` on `ports` will replace it; other keys merge.
- File uploads land in the `upload_data` named volume (`/app/uploads` in the backend container). Reports go to `uploads/reports/`, backups to `uploads/backups/`.
- AI model artifacts are persisted in named volumes (`recommendation_models`, `analyzer_models`, `chatbot_vector_store`) so retraining is not required on every `up`.
