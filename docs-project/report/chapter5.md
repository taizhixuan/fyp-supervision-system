# Project 2: Implementation

## Chapter 5

*For Software Engineering OR Information Systems*

---

## Chapter 5: Implementation

The purpose of the implementation chapter is to give the reader a clear picture of how you developed your system.

---

## 5.1 Deployment

The FYP Supervision System runs as a containerised multi-tier web
application. A single-page React frontend talks to a transactional REST
backend, which in turn owns the relational database and brokers calls
to three independent AI microservices. The implementation scope covers
every functional area committed to in Chapter 4: authentication and
account management, the student proposal and milestone workflow, the
supervisor review and meeting workflow, the FYP committee oversight and
assignment workflow, and the system administrator configuration
workflow. Every persona therefore has an end-to-end path from login to
dashboard to feature completion, and every stored entity is reached
through a typed REST endpoint rather than direct database access from
the browser.

The system is composed of six deployable units. Five run unchanged
between development and production; the frontend swaps between a
Vite dev container and an nginx production container depending on
whether the dev override file is present.

Table 5.1 — Compose services, technologies, and host port mapping.

| Unit | Technology | Host port → container | Objective served |
|---|---|---|---|
| `db` | MySQL 8 | **3307** → 3306 | Persist all transactional data (users, projects, proposals, meetings, logs, audit trail) |
| `backend` | Spring Boot 3.2.5 REST API on Temurin JRE 17 | 8080 → 8080 | Centralise business rules, authentication, file storage, and orchestration of the AI calls |
| `ai-recommendation` | Flask 3.0 + Sentence-BERT (`BAAI/bge-base-en-v1.5`) | 5001 → 5001 | Rank supervisors against a student profile using a deterministic five-component weighted score |
| `ai-proposal-analyzer` | Flask 3.0 + fine-tuned DistilBERT + rule-based NLP | 5002 → 5002 | Score proposal quality and produce structured strengths/weaknesses feedback |
| `ai-chatbot` | Flask 3.0 + FAISS + remote LLM (Groq/OpenAI; Flan-T5 opt-in) | 5003 → 5003 | Answer procedural FYP questions via retrieval-augmented generation over a 15-document knowledge base |
| `frontend` | React 18 SPA — production: Node 20 build → `nginx:alpine`; development: Vite 7 dev server | **3000** → 80 (prod) / **5173** → 3000 (dev override) | Provide the role-aware user interface for all four personas |

The six services share a single user-defined bridge network,
`fyp-network`. Inter-service traffic uses the compose service names as
hostnames — the backend reaches the AI services as
`http://ai-recommendation:5001`, `http://ai-proposal-analyzer:5002`,
and `http://ai-chatbot:5003`. The browser, by contrast, talks to the
backend through the host-published port; the API base URL is baked into
the production bundle at build time via the `VITE_API_BASE_URL` build
argument and is provided through Vite's proxy in development.

Two host-port choices are deliberate. MySQL is published on **3307**
rather than 3306 so that the container does not clash with a local
MySQL installation on the developer machine. The frontend's dev
override publishes Vite on **5173** rather than the production 3000 so
that both stacks can in principle run side by side; the override file
also marks the port list with Compose's `!override` directive because
otherwise Compose would merge — rather than replace — the production
port mapping.

Persistent state is held in five named volumes:

| Volume | Mount point | Purpose |
|---|---|---|
| `mysql_data` | `/var/lib/mysql` (on `db`) | MySQL data files |
| `upload_data` | `/app/uploads` (on `backend`) | Profile pictures, announcement attachments, proposal PDFs, generated reports, backups |
| `recommendation_models` | `/app/models` (on `ai-recommendation`) | Embedding-model artefacts |
| `analyzer_models` | `/app/models` (on `ai-proposal-analyzer`) | Fine-tuned DistilBERT weights for the proposal scorer |
| `chatbot_vector_store` | `/app/vector_store` (on `ai-chatbot`) | FAISS index plus JSON metadata sidecar for the knowledge base |

A rebuild of any image preserves these volumes. Deliberate teardown
requires `docker compose down -v`. The chatbot's image build also runs
`build_knowledge_base.py` when the index is absent, so a fresh volume
fills itself on the next service start without manual intervention.

The dev override file (`docker-compose.override.yml`) is auto-merged on
`docker compose up` and swaps the frontend to a Vite container that
bind-mounts `./frontend` into `/app` and runs `npm run dev` with hot
module reload. `VITE_USE_POLLING=true` is set because Windows-mounted
volumes do not propagate `inotify` events. Renaming or deleting the
override file falls back to the production nginx build.

A single `docker compose up --build` therefore provisions the database,
applies every Flyway migration on first start (`V1` through `V27`),
builds and starts the Spring Boot fat JAR, brings up the three Flask
services with their model weights already baked into the images, and
either serves the static React bundle through nginx or runs Vite in
watch mode. The development experience and the production rollout are
the same Compose graph; the only moving part is which frontend
container is in use.

Mapping the modules back to the project's original objectives:

- **Streamline supervisor matching** — `ai-recommendation` plus the
  `/student/recommendations` endpoint in the backend, with the
  filterable directory at `/supervisors` as the manual-search
  alternative.
- **Support proposal authoring and review** — the `Proposal`,
  `ProposalVersion`, `ProposalCheckResult`, and `ProposalReview`
  entities in the backend, with quality scoring delegated to
  `ai-proposal-analyzer`.
- **Digitise meeting logs and progress tracking** — `MeetingLogService`
  and the `meeting_log` and `meeting_log_signature` tables, with the
  six-log compliance count surfaced through `MeetingLogComplianceService`.
- **Provide committee-level oversight** — the committee module (six
  controllers) backed by `CommitteeService` and `CommitteeReportService`
  for assignments, evaluations, dashboard rollups, and CSV report
  exports.
- **Give administrators control over the platform** — the admin module
  (twelve controllers covering users, cycles, deadlines, parameters,
  integrations, audit logs, exports, maintenance jobs, projects with
  FYP1 pass tracking, job history, and the approved-students and
  approved-supervisors rosters).
- **Deliver always-available student support** — the `ai-chatbot`
  service, surfaced through the chatbot widget on the student
  dashboard.

In short, the deployment is one Compose stack containing four runtime
languages (Java, Python, TypeScript, SQL) but a single coherent
product, with each container responsible for exactly one tier of the
architecture.

---

## 5.2 Development Environment

This section documents the tooling that was used to build, run, and
maintain the system. The environment was kept consistent with the
production deployment described in Section 5.1 so that local
development would not diverge from how the system is shipped, and so
that a feature working in IntelliJ on the developer machine would also
work inside the Compose stack.

### 5.2.1 Programming Languages Used

Four languages are used across the codebase, each chosen for the tier
it serves.

**Java 17** is the language target for the Spring Boot backend,
declared in `backend/pom.xml` as `<java.version>17</java.version>` and
reinforced by an explicit `<source>17</source><target>17</target>`
block on the `maven-compiler-plugin`. Java 17 was selected because it
is the LTS baseline that Spring Boot 3.x supports, and pinning the
bytecode level to 17 keeps the produced JAR portable across any
JDK 17+ runtime. The development machine itself runs JDK 25; this
combination forced an explicit pin of Lombok to 1.18.42 in the Maven
annotation processor path, since earlier Lombok releases fail on
JDK 25's annotation-processing model.

**Python 3.11** is the runtime for all three Flask AI microservices.
Each AI Dockerfile is built `FROM python:3.11-slim`, which keeps the
image small and matches the wheels published for `torch==2.5.1` and
`faiss-cpu==1.9.0.post1`. A separate CPython 3.12 virtual environment
is used on the host for offline model training, because the MSYS2
Python build present on the development machine could not compile the
C extensions required by `torch` and `faiss`; the trained artefacts
are then mounted into the 3.11 containers through the Docker named
volumes described in Section 5.1.

**TypeScript 5.3.3** is used for the React SPA. TypeScript was
preferred over plain JavaScript because the frontend exchanges more
than forty distinct DTO shapes with the backend, and a typed contract
reduces the rate of integration regressions when the backend evolves.
The compiler is configured in `frontend/tsconfig.json` with
`strict: true`, `noUnusedLocals: true`, `noUnusedParameters: true`,
and the `@/* → src/*` path alias that is mirrored in
`vite.config.ts`. `tsc` itself is not in the build pipeline —
`npm run build` runs Vite only — while type-checking happens at edit
time inside the IDE and lint enforcement runs through
`npm run lint --max-warnings 0`.

**SQL (MySQL 8 dialect)** is used to author the Flyway migration
scripts under `backend/src/main/resources/db/migration/`. The schema
currently spans **thirty migrations**, V1 through V28 plus V30 and
V31 (V29 was deliberately skipped during a planning revision). Every
schema change since V1 is captured in this directory; the repository
is the canonical record of the database structure.

### 5.2.2 Frameworks and Libraries

The framework stack is summarised below by tier. Versions are taken
directly from `pom.xml`, `package.json`, and the AI services'
`requirements.txt` files.

**Backend (Spring Boot 3.2.5).** The backend pulls in the standard
starter set — `spring-boot-starter-web` for the embedded Tomcat and
Spring MVC layer, `spring-boot-starter-data-jpa` for Hibernate-backed
persistence, `spring-boot-starter-security` for authentication and
BCrypt password hashing, `spring-boot-starter-validation` for Bean
Validation on incoming DTOs, and `spring-boot-starter-mail` for the
SMTP layer that powers `EmailService`. JWT tokens are issued and
verified through `io.jsonwebtoken:jjwt-api/impl/jackson` 0.12.5.
Persistence ties together `mysql-connector-j` (runtime scope) and
`flyway-core` plus `flyway-mysql` for versioned migrations. Lombok
1.18.42 reduces entity boilerplate; it is `optional` on the dependency
graph and is excluded from the packaged JAR by the
`spring-boot-maven-plugin`. Two specialised libraries handle
non-trivial concerns: `org.apache.poi:poi-ooxml` 5.2.5 backs the DOCX
rendering in `ProposalDocumentService`, and the pair
`nl.martijndwars:web-push` 5.1.1 with
`org.bouncycastle:bcprov-jdk18on` 1.78 implements the VAPID-signed
Web Push pipeline used by `PushService`. Test dependencies are
`spring-boot-starter-test` (JUnit 5 + Mockito + Spring Test) and
`spring-security-test`.

**Frontend (React 18.2 + Vite 7).** UI is built on `react` and
`react-dom` 18.2, routed by `react-router-dom` 6.21. Server state is
held in `@tanstack/react-query` 5.17 with retries and background
refetching; the underlying HTTP client is `axios` 1.6, wrapped in
`src/lib/api/client.ts` with a JWT interceptor and a 401 →
`/session-expired` redirect. Forms use `react-hook-form` 7.49 with
`zod` 3.22 schemas via `@hookform/resolvers`. Styling is
`tailwindcss` 3.4 with `tailwind-merge` and `clsx` for conditional
class composition; the brand theme in `tailwind.config.js` defines a
navy primary palette (`#1e3a5f` at the 900 weight), a coral accent,
full-range semantic palettes for success, warning, error, and info, a
`Plus Jakarta Sans` plus `JetBrains Mono` font stack, and a small set
of custom keyframe animations (`fade-in-up`, `slide-in-right`,
`float-slow`, `drift`). Icons come from `lucide-react` 0.312. Three
client-side document libraries — `jspdf` 4.1, `html2canvas` 1.4, and
`docx` 9.5 — produce the PDF and Word exports for signed meeting logs
and proposals. Linting is enforced by `eslint` 8.57.1 with
`@typescript-eslint`, `react-hooks`, `react-refresh`, and
`unused-imports` plugins; the lint script gates on `--max-warnings 0`.

**AI services (Flask 3.0).** All three services share an HTTP layer
(`flask` 3.0.0 + `flask-cors` 4.0.0 + `gunicorn` 21.2.0) and a
numerical core (`numpy` 1.26.4, with `sentence-transformers` 3.3.1 in
the recommendation and chatbot services). Beyond that, the three
services diverge by purpose:

- `ai-recommendation` runs only the embedding stack — there is no
  XGBoost dependency and no `joblib`, because the runtime is the
  deterministic five-component weighted scorer described in
  Section 5.5.3 rather than a trained model.
- `ai-proposal-analyzer` adds `transformers` 4.47.1 + `torch` 2.5.1 for
  the fine-tuned DistilBERT regression head, `scikit-learn` 1.4.0 +
  `pandas` 2.1.4 for offline training-data preparation, and
  `openai` 1.54.5 + `httpx` 0.27.2 for the optional remote LLM that
  produces structured strengths/weaknesses prose.
- `ai-chatbot` adds `sentence-transformers` 3.3.1, `faiss-cpu`
  1.9.0.post1 for vector retrieval, `transformers` 4.47.1 + `torch`
  2.5.1 for the opt-in local Flan-T5 generator, and the same
  `openai` 1.54.5 + `httpx` 0.27.2 client for the default remote-LLM
  path.

`torch` is pinned to 2.5.1 because torch 2.10.x fails with a DLL
initialisation error on the Windows development machine. The
OpenAI-compatible client follows the same provider precedence chain in
both analyzer and chatbot: `LLM_API_KEY` (any compatible endpoint) →
`GROQ_API_KEY` (Groq's `llama-3.3-70b-versatile` by default) →
`OPENAI_API_KEY` (`gpt-3.5-turbo` by default).

### 5.2.3 IDEs and Tools

- **IntelliJ IDEA** — primary editor for the Spring Boot backend.
  Selected for its Maven and JPA tooling: in-IDE Hibernate validation
  against the live schema, run configurations for the embedded
  application server, and the database tool window for live schema
  inspection. The repository carries an `.idea/` directory with
  `codeStyles/`, `dbnavigator.xml`, `inspectionProfiles/`, and a
  versioned `vcs.xml`, which confirms IntelliJ as the active backend
  IDE rather than a convention-only choice.
- **Visual Studio Code** — secondary editor used for the frontend
  (TypeScript), the AI services (Python), the SQL migrations, and
  Markdown documentation. The TypeScript, Tailwind CSS IntelliSense,
  ESLint, and Python extensions were enabled. No `.vscode/` directory
  is checked into the repository, so editor settings remain
  per-developer.
- **MySQL Workbench** — used for ad-hoc inspection of the schema
  during migration authoring, for verifying that a freshly applied
  Flyway migration produced the intended DDL, and for `EXPLAIN`-ing
  prospective indexed queries. Workbench's reverse-engineered EER
  diagrams provided the visual reference for the ERD documented in
  `Project-info/ERD.md`.
- **Postman** — used to exercise REST endpoints during development
  before the frontend hooks were wired up. No collection is committed;
  this is a personal-workflow tool rather than a project artefact.
- **Docker Desktop 24** with **Docker Compose v2** — runs the
  six-service Compose stack on the developer workstation and provides
  the same Linux container runtime that a production host would use.
- **Git Bash** and **PowerShell** — Bash for POSIX-style scripts and
  the Linux-targeted Dockerfiles, PowerShell for Windows-native tasks.
  The `scripts/` directory contains ten PowerShell scripts that drive
  the real HTTP API: four seeding scripts (`seed_supervisors.ps1`,
  `seed_students_and_logs.ps1`, `cleanup_cycles.ps1`,
  `smoke_supervisors.ps1`) and five verification scripts
  (`verify_audit.ps1`, `verify_audit_extended.ps1`,
  `verify_students.ps1`, `verify_supervisors.ps1`,
  `verify_throttle.ps1`). They double as a smoke-test harness for
  end-to-end flows.

### 5.2.4 Version Control System

The project is tracked with **Git** and hosted on **GitHub** at
`https://github.com/taizhixuan/fyp-supervision-system.git`. The
default branch is `main`; long-lived feature branches are not used
because the project is single-author, and the trade-off of skipping
pull-request review was made deliberately. Commit messages follow a
short, lowercase, imperative style. 

The repository's `.gitignore` excludes `node_modules/`, `target/`,
`dist/`, `frontend/.vite/`, `frontend/build/`, `*.class`, `*.jar`,
`*.war`, every `.env` family file, IDE artefacts, OS junk files, the
AI services' Python virtual environments, and the `**/models/` and
`**/vector_store/` directories that hold trained model weights and the
FAISS index. Trained AI artefacts are not committed; they are produced
by the per-service scripts and are mounted into the containers through
the Docker named volumes `recommendation_models`, `analyzer_models`,
and `chatbot_vector_store` so that rebuilding an image does not
invalidate them.

### 5.2.5 Operating System Used

Development was carried out on **Windows 11 Home Single Language
(build 10.0.26200)** as the host operating system. To preserve parity
with a production Linux server, every long-running service runs inside
a Linux container:

- The backend image is built from `maven:3.9-eclipse-temurin-17` and
  runs on `eclipse-temurin:17-jre`, which is Ubuntu-based.
- The frontend production image is built from `node:20-alpine` and
  served by `nginx:alpine`; the development override container uses
  the same Node base.
- All three AI services are built `FROM python:3.11-slim`, a
  Debian-based image kept deliberately small.
- The database runs on the official `mysql:8` image.

This split — Windows 11 for the developer workstation, Linux
containers for every runtime component — means that the system's
behaviour does not depend on any host-specific path, file system, or
package manager. The Compose file that runs locally is the same
artefact that would run on a faculty Linux server.

<!--
self-check 5.2 (rewrite, 2026-05-10)
- Drift corrected vs prior draft:
  * Python 3.11 (not 3.12) for AI containers; 3.12 retained as host venv role only.
  * 30 Flyway migrations V1–V28+V30+V31 (not "V1–V10"); V29 explicitly noted as skipped.
  * ai-recommendation: removed XGBoost and joblib from the dependency list (verified
    against requirements.txt).
  * Added missing backend deps: spring-boot-starter-mail, poi-ooxml 5.2.5,
    web-push 5.1.1, bouncycastle 1.78, spring-boot-starter-test, spring-security-test.
  * Added missing AI deps: openai 1.54.5, httpx 0.27.2, pandas 2.1.4.
  * Frontend: TypeScript 5.3.3, Vite 7, ESLint 8 + plugins, brand-customised
    Tailwind theme, tsc-not-in-build now stated.
  * IntelliJ IDEA promoted to primary backend IDE (evidence: .idea/ in repo);
    VS Code framed as secondary (no .vscode/ in repo).
  * Chatbot Flan-T5 framed as opt-in local generator, not the primary path
    (consistent with 5.5.11).
  * scripts/ ten-script PowerShell harness now mentioned.
- Tone pass:
  * British spelling: organise, behaviour, deliberately, optimised — checked.
  * AI-tells avoided: no "leverage", "robust", "comprehensive", "seamless",
    "delve", "It is important to note", "This section will explore".
  * Hedge density (may/can/could): each paragraph ≤ 2.
  * Sentence length varied; opening grammar varied across paragraphs.
  * No three-sentence parallel structure.
  * Kept the bullet structure where it carried real content (5.2.3 IDEs,
    5.2.5 OS containers); used flowing paragraphs for the framework prose
    in 5.2.2 to break the previous list-only feel.
- Cross-references: 5.1 (deployment), 5.5.3 (recommendation algorithm),
  5.5.11 (chatbot generator), and docs-project/ERD.md for the EER diagram.
- Outstanding: none from facts file.
-->



---

## 5.3 System Configuration and Setup

This section describes how each tier was configured to run, both during
local development and inside the Docker Compose stack described in
Section 5.1. Concrete configuration values are taken from
`backend/src/main/resources/application.yml`, `frontend/vite.config.ts`,
the per-service `Dockerfile`s, and the six `@Configuration` classes
under `backend/src/main/java/com/fyp/supervision/config/`.

### 5.3.1 Backend Setup

**Server configuration.** The backend is a Spring Boot 3.2.5 application
running on an embedded Apache Tomcat server. The HTTP port is 8080 and
a context path of `/api` is applied, so every endpoint is reachable at
`http://<host>:8080/api/...`. This decision keeps the frontend's API
base URL (`VITE_API_BASE_URL=http://localhost:8080/api`) and the Vite
dev-server proxy rule (`'/api' → http://localhost:8080`) consistent
with the deployed URL shape.

**Application properties.** A single `application.yml` carries the
runtime configuration; environment variables override every default so
that the same JAR behaves correctly whether it is launched from the
IDE against `localhost` or from inside Compose against the
service-name hostnames (`db`, `ai-recommendation`, etc.). An abridged
view:

```yaml
server:
  port: 8080
  servlet:
    context-path: /api
spring:
  datasource:
    url: ${DB_URL:jdbc:mysql://localhost:3306/fyp_supervision?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC}
    username: ${DB_USER:fyp_user}
    password: ${DB_PASS:fyp_pass}
    hikari:
      maximum-pool-size: 10
      minimum-idle: 5
  jpa:
    hibernate:
      ddl-auto: validate
  flyway:
    enabled: true
    baseline-on-migrate: true
  servlet:
    multipart:
      max-file-size: 50MB
      max-request-size: 50MB
app:
  jwt:
    secret: ${JWT_SECRET:...}
    expiry-ms: ${JWT_EXPIRY_MS:86400000}
  ai:
    recommendation-url: ${AI_RECOMMENDATION_URL:http://localhost:5001}
    analyzer-url:       ${AI_ANALYZER_URL:http://localhost:5002}
    chatbot-url:        ${AI_CHATBOT_URL:http://localhost:5003}
```

A small `application-dev.yml` overlay flips `spring.jpa.show-sql` on
and lifts the `com.fyp.supervision` and `org.springframework.security`
log levels to `DEBUG` when the `dev` profile is active.

Two policy choices are encoded in this file. First,
`spring.jpa.hibernate.ddl-auto` is set to `validate` rather than
`update` — the schema is owned by Flyway, and Hibernate refuses to
start if the live tables do not match the entity model. Second, the
JWT secret, the AI service URLs, mail credentials, and the VAPID push
keys are all read from environment variables, so a single artefact
serves both local dev and Docker deployment without rebuilds.

**Configuration beans.** Six `@Configuration` classes live under
`backend/src/main/java/com/fyp/supervision/config/`, each with a
narrow responsibility:

- `SecurityConfig` builds the `SecurityFilterChain`. Sessions are
  stateless, CSRF is disabled, and `requestMatchers(...)` map URL
  prefixes directly to authorities (`/admin/**` → `SYSTEM_ADMIN`,
  `/committee/**` → `FYP_COMMITTEE`, `/supervisor/**` → `SUPERVISOR`,
  `/student/**` → `STUDENT`, `/supervisors/**` → `STUDENT` for the
  student-facing supervisor directory). `JwtAuthenticationFilter` is
  inserted before `UsernamePasswordAuthenticationFilter`, and
  `BCryptPasswordEncoder` plus `AuthenticationManager` are exposed as
  beans here. `@EnableMethodSecurity` is on, but URL-prefix routing —
  not `@PreAuthorize` — does the role gating; method-level
  annotations are reserved for the finer ownership checks discussed
  in Section 5.5.4.
- `CorsConfig` allows two origins, `http://localhost:3000`
  (production frontend host) and `http://localhost:5173` (the Vite
  dev override container), with credentials enabled and a 3600-second
  preflight cache. Without the second origin, the dev override would
  fail CORS the moment a developer hot-reloaded the SPA.
- `WebConfig` registers a static resource handler that maps
  `/uploads/**` to `file:${app.file.upload-dir}/`. This is what backs
  the `/uploads/**` `permitAll` rule and lets `<img src="/uploads/profiles/...">`
  resolve at the browser without any controller in between.
- `AsyncConfig` enables `@Async` and exposes a named
  `ThreadPoolTaskExecutor` (`emailExecutor`, core size 2, max 4,
  queue 100, thread prefix `email-`) that `EmailService` uses to keep
  SMTP latency off the request path.
- `FileStorageConfig` resolves `${app.file.upload-dir}` to an absolute
  path on `@PostConstruct` and runs `Files.createDirectories(...)`,
  so a fresh container always has the directory before the first
  upload arrives.
- `JwtConfig` binds `app.jwt.secret` and `app.jwt.expiry-ms` for
  `JwtTokenProvider`.

**Database server setup.** The system uses **MySQL 8** as the
relational database. In the Compose stack the database runs as the
`db` service, which publishes 3306 inside the network and 3307 on the
host (3307 was chosen to avoid clashing with any local MySQL
installation on the developer machine). The container is provisioned
with database `fyp_supervision`, user `fyp_user`, and password
`fyp_pass`, and its data directory is persisted to the named volume
`mysql_data`. A `mysqladmin ping` health check gates the backend's
start, so the Spring application will not attempt to connect until
the database is accepting connections. On first start, Flyway runs
the thirty migration scripts under `classpath:db/migration` (V1
through V28 plus V30 and V31 — V29 was deliberately skipped) to
create every table, index, and seed row; on subsequent starts,
`baseline-on-migrate: true` allows Flyway to attach to a pre-existing
schema without erroring.

**File storage.** Uploaded files — proposal PDFs, supporting
documents, profile pictures, signed log exports, generated reports —
are written under `${FILE_UPLOAD_DIR}`, which resolves to
`/app/uploads` inside the container and is backed by the `upload_data`
named volume. The directory survives container rebuilds, and the
static resource handler in `WebConfig` exposes it under `/uploads/**`
so that a browser fetches any file directly without involving a
controller.

### 5.3.2 Frontend Setup

**Framework configuration.** The frontend is a Vite 7 project running
React 18 in TypeScript. In development it serves on port 3000
(`npm run dev`) with two proxy rules, both pointed at
`http://localhost:8080`:

```ts
// vite.config.ts
server: {
  host: true,
  port: 3000,
  watch: {
    usePolling: process.env.VITE_USE_POLLING === 'true',
    interval: 300,
  },
  proxy: {
    '/api':     { target: 'http://localhost:8080', changeOrigin: true },
    '/uploads': { target: 'http://localhost:8080', changeOrigin: true },
  },
}
```

The `/api` proxy removes CORS friction during day-to-day development,
and the `/uploads` proxy lets `<img src="/uploads/profiles/...">`
resolve through the dev server in the same way nginx serves it in
production. `host: true` listens on `0.0.0.0` so the dev-override
container's published port works, and the polling watcher is enabled
when `VITE_USE_POLLING=true` because Windows-mounted volumes do not
propagate inotify events.

A path alias `@ → ./src` is configured in `vite.config.ts` and is
mirrored in `tsconfig.json` (`paths: { "@/*": ["src/*"] }`), so
imports such as `@/components/ui/Button` resolve identically at
type-check time and at bundle time.

**App composition.** The application is composed inside `src/app/`.
`router.tsx` declares every route through `createBrowserRouter` —
auth pages are eager, role pages are lazy-loaded — and `providers.tsx`
wraps the tree with `QueryClientProvider`, `AuthProvider`, and
`ToastProvider`. The TanStack Query client is created with three
deliberate defaults:

```ts
new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})
```

A 60-second `staleTime` keeps repeat dashboard renders cheap, the
single retry catches transient backend hiccups without amplifying
outages, and disabling `refetchOnWindowFocus` avoids the request
stampede that would otherwise hit the backend every time the user
tabs back.

`AuthProvider` reads the JWT from `localStorage` (key `access_token`)
on mount; the Axios interceptor in `src/lib/api/client.ts` attaches
it to every outgoing request as `Authorization: Bearer <token>`; and
the response interceptor clears the token on a 401 and redirects to
`/session-expired`, except on the open auth pages, so the user is
never stranded on a half-authenticated screen.

**UI component integration.** Rather than adopting a heavyweight
component library such as Material UI or shadcn/ui, the project ships
its own small UI kit under `src/components/ui/` — ten primitives
covering `AlertBanner`, `Badge`, `Button`, `Card`, `Drawer`, `Input`,
`Modal`, `Pagination`, `Spinner`, and `Toast`. The trade-off was
deliberate: the design system is small enough that hand-rolled
primitives are cheaper than fighting another library's defaults, and
they can be themed entirely through `tailwind.config.js`. The
Tailwind theme defines the brand palette (navy primary at `#1e3a5f`,
coral accent at `#ef4444`, full semantic palettes for success,
warning, error, and info), the font stack (`Plus Jakarta Sans` for
the body, `JetBrains Mono` for code), and a small set of custom
keyframe animations. A parallel set of CSS variables in
`src/styles/globals.css` exposes the same palette as raw hex values
for components that cannot consume Tailwind classes — the canvas
signature pen on the meeting-log page is one example. Conditional
class composition uses `clsx` and `tailwind-merge`; forms use
`react-hook-form` with `zod` schemas; PostCSS and Autoprefixer handle
browser compatibility for the produced CSS bundle.

`index.html` preconnects to Google Fonts and loads `Plus Jakarta Sans`
(weights 400 / 500 / 600 / 700) before the React bundle mounts, so
the SPA never flashes the system font on first render.

### 5.3.3 Build Tools and Package Managers

Each tier carries its own canonical build tool. All of them are
invoked identically inside Docker images and on a developer
workstation, so the artefact built by `docker compose up --build` is
the same artefact that an examiner would build by running
`mvn package` and `npm run build` directly.

- **Maven 3.9** (backend) — provided by the
  `maven:3.9-eclipse-temurin-17` builder image, with no Maven wrapper
  checked into the repository. The backend `Dockerfile` warms the
  dependency cache through `mvn dependency:go-offline -B` before the
  source is copied, so a source-only edit reuses the dep layer rather
  than re-downloading every Spring Boot transitive on each build.
  `mvn clean compile` is the quickest local sanity check;
  `mvn package -DskipTests` produces the runnable Spring Boot
  executable JAR; `mvn test` runs the JUnit suite. The `pom.xml`
  pins the Java compiler source/target to 17 and explicitly registers
  Lombok 1.18.42 in the annotation-processor path so that compilation
  succeeds on the JDK 25 host.
- **npm 10** (frontend, bundled with Node 20) — `npm ci` installs
  from the committed `package-lock.json` for reproducible builds,
  `npm run dev` starts the Vite dev server, `npm run build` produces
  the production bundle into `dist/`, and `npm run preview` serves it
  back for verification. `tsc` is deliberately not in the build
  pipeline — the codebase carries a small set of pre-existing
  strict-mode errors that are tracked separately, so the build runs
  Vite alone, and `npm run lint`
  (`eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0`)
  is the actual CI gate.
- **Vite 7** (frontend bundler) — fast hot-module reload during
  development and tree-shaken ES modules in production. The project
  was bootstrapped on Vite from the first commit; no predecessor
  toolchain (such as Create React App) was used.
- **pip with virtualenv** (AI services) — each service has its own
  `requirements.txt`. Inside Docker the dependencies are installed
  during the image build through
  `pip install --no-cache-dir -r requirements.txt`. Outside Docker, a
  CPython 3.12 virtual environment per service is used for offline
  model training; the heavyweight wheels (`torch==2.5.1` for the
  analyzer and chatbot, `faiss-cpu==1.9.0.post1` for the chatbot)
  need this venv because the MSYS2 Python on the development machine
  cannot compile their C extensions.
- **Docker 24** with **Docker Compose v2** — orchestrates the
  six-service stack. A single `docker compose up --build` builds
  every image, applies Flyway migrations, mounts the named volumes
  listed in Section 5.1, and exposes the host ports. The
  `docker-compose.override.yml` file is auto-merged on the same
  command and replaces the production frontend with a Vite container
  that bind-mounts the host source for hot-module reload.
- **Git** — version-control tool for all of the above; usage is
  described in Section 5.2.4.

Production image builds illustrate the same separation. The backend
Dockerfile is a multi-stage build that produces an executable JAR in
the Maven stage and copies it into a slim `eclipse-temurin:17-jre`
runtime stage. The frontend Dockerfile is also multi-stage:
`node:20-alpine` builds the static `dist/` bundle (with
`VITE_API_BASE_URL` injected as a build arg), and `nginx:alpine`
serves it on port 80. The accompanying `nginx.conf` is intentionally
small: `try_files $uri $uri/ /index.html` provides the SPA fallback,
gzip is enabled for the common text-like MIME types, and
`location /api { return 404; }` is a deliberate dead end — the
production SPA reaches the backend through the host-published port
(`http://localhost:8080/api`) baked in at build time, not through an
nginx proxy.

<!--
self-check 5.3 (rewrite, 2026-05-10)
- Drift corrected vs prior draft:
  * Flyway range stated as V1–V28+V30+V31 (not "V1 through V10");
    V29 noted as deliberately skipped.
  * RBAC framing corrected: URL-prefix requestMatchers in SecurityConfig
    do role gating, not @PreAuthorize. @EnableMethodSecurity is on but
    @PreAuthorize is reserved for ownership checks (cross-ref to 5.5.4).
  * "Vite replaces react-scripts" claim removed — project never used CRA.
  * Host venv claim narrowed: only torch (analyzer + chatbot) and
    faiss-cpu (chatbot only) need the venv; xgboost reference dropped
    (not a current dependency).
  * "Fat JAR" replaced with the more accurate "Spring Boot executable JAR".
  * Five extra @Configuration classes added (CorsConfig, WebConfig,
    AsyncConfig, FileStorageConfig, JwtConfig) alongside SecurityConfig,
    each with its specific responsibility.
- Added (new in this rewrite):
  * `application-dev.yml` overlay (DEBUG logging, show-sql).
  * CORS dual-origin rationale (3000 prod + 5173 dev override).
  * WebConfig static resource handler for /uploads/**.
  * AsyncConfig emailExecutor pool sizing.
  * FileStorageConfig PostConstruct directory creation.
  * vite.config.ts host:true rationale + polling-watch tied to
    Windows inotify limitation.
  * TanStack Query defaults (60 s stale, retry 1, no refocus refetch)
    with the rationale per knob.
  * Hand-built UI kit primitives enumerated.
  * Two-layer styling explanation (Tailwind theme + globals.css CSS
    variables for non-Tailwind consumers).
  * index.html Google Fonts preconnect for Plus Jakarta Sans.
  * Backend Dockerfile dep-cache warming via mvn dependency:go-offline.
  * nginx.conf /api -> 404 explained as deliberate (SPA hits backend
    via host port baked in at build time).
- Tone pass:
  * British spelling: organise, behaviour, deliberately, optimised.
  * AI-tells avoided: no leverage / robust / seamless / comprehensive /
    delve / "It is important to note" / "This section will explore".
  * Hedge density (may/can/could): each paragraph ≤ 2.
  * Sentence length varied; no three-sentence parallel structure.
  * Paragraph + bullet mix preserved where lists carry real content.
- Cross-references: Section 5.1 (compose stack), Section 5.2.4 (git),
  Section 5.5.4 (per-row ownership checks).
- Outstanding: none from facts file.
-->


---

## 5.4 Database Implementation

The persistent layer of the FYP Supervision System runs on **MySQL 8**
with the **InnoDB** storage engine. Every table is created with
`utf8mb4` and `utf8mb4_unicode_ci` so that names, emails, proposal
prose, and chat messages can carry non-Latin characters and emoji
without loss. The schema itself is not declared at runtime by
Hibernate; it is built up from a sequence of Flyway migration scripts
checked into the same repository as the Java sources and applied
automatically when the backend starts. The practical effect is that a
clean MySQL instance can be brought to the current schema with a
single `mvn spring-boot:run`, and the schema at any point in the
project's history is reproducible from `git checkout`.

Figure 5.4 Database tier in the deployed Compose stack.

### 5.4.1 Database Schema Design

**Relational model.** The schema follows third normal form. Each
real-world entity — user, project, proposal, meeting, and so on — is
given exactly one canonical table and a surrogate
`BIGINT AUTO_INCREMENT` primary key, with relationships expressed
through foreign keys rather than nested data. This was a deliberate
choice over a document-oriented store because the workflows are
heavily relational: a single project ties together a student, a
supervisor, an FYP cycle, a chain of proposal versions, dozens of
meeting logs, an audit trail, and an FYP1 pass-or-fail flag. Joins
of this shape are easier to reason about, index, and query
consistently in SQL than they would be in nested JSON.

**The migration history as a design record.** The schema arrived
through thirty-eight Flyway scripts at the time of writing (V1
through V28, then V30 through V39; V29 was skipped during planning
and the gap is documented in the script catalogue rather than
silently renumbered). The first eight scripts lay down the original
domains — identity, cycle, proposal, meetings, documents,
communications, chat, administration. Later scripts split into two
waves: V10 through V31 round out the original feature set
(notification preferences, export configurations, password reset,
push subscriptions, pre-authorisation rosters, login throttling,
chatbot feedback), and V32 onwards capture the second-iteration
changes made once the original modules were already in use
(cycle-scoped announcements and resources, per-user announcement
read tracking, asynchronous report generation, document feedback,
and the supervisor weekly availability that powers the slot-based
meeting booking added in Section 5.5.6).

Three entries are worth highlighting because they show the migration
trail acting as a design diary. V16 introduced a supervisor-led
topic catalogue but was reverted by V18 once the FYP1 workflow was
re-grounded in the supervisor-first request flow. V21 widened
`password_reset_token.token_hash` from `CHAR(64)` to `VARCHAR(64)`
because the entity field mapped to a Java `String` and Hibernate's
schema validator refused to start until the column matched. V30
created an `fyp_grade` table for examiner-driven final-report
scoring, which V34 then dropped in favour of the leaner admin-only
FYP1 pass-tracking flow now in use. Each correction lives in its
own migration rather than rewriting an earlier one, and the
abandoned attempts are part of the history.

Figure 5.5 Flyway migration scripts under `db/migration/`.

**Domain typing through `ENUM`.** Workflow states that are stable and
finite are stored as MySQL `ENUM` columns rather than free-text
strings. Storage is reduced to a single byte per row, and unknown
literals are rejected by the database before reaching the
persistence-layer cache. A representative example is
`meeting_log.status`, which carries the values `DRAFT`, `SUBMITTED`,
`CORRECTION_REQUIRED`, `SUPERVISOR_SIGNED`, and `LOCKED`. Each value
maps directly to a constant in the matching Java enum under
`com.fyp.supervision.enums`, so any drift between the database
definition and the application code is caught at compile time. Newer
status sets whose values are still evolving — `maintenance_job.status`,
`integration_setting.status`, `generated_report.status` — are kept
as `VARCHAR` so that adding a value does not require yet another
migration.

**Foreign keys and ownership semantics.** Referential integrity is
enforced by named `CONSTRAINT fk_*` declarations. The schema
distinguishes two kinds of relationship. Dependent rows that have no
meaning apart from their parent — proposal versions, signatures, chat
messages, audience entries, push subscriptions — carry
`ON DELETE CASCADE` so that deleting the parent removes them
atomically. Reference-only links such as `audit_log.user_id`,
`project.cycle_id`, and the roster `uploaded_by` columns deliberately
omit the cascade, because removing a user must not erase their audit
history. Uniqueness constraints sit on business identifiers
(`user_account.mmu_id` and `email`, `fyp_cycle.cycle_code`,
`system_parameter.param_key`, the composite
`(cycle_id, student_user_id)` on `project`) so duplicate registrations
are caught at the storage layer rather than only in the service.

**Timestamps and JSON columns.** Every transactional table carries a
`created_at` and an `updated_at`, both `DATETIME NOT NULL`. The
`updated_at` column is declared `DEFAULT NOW() ON UPDATE NOW()`, which
means InnoDB itself refreshes it on every row change and the
application never needs to set it manually. A second pattern worth
noting is that several columns hold JSON serialised as plain `TEXT` —
`tasks_json`, `rubric_json`, the supervisor profile's
`research_areas`, the student profile's `skills`, and a handful of
others. The application reads them through Jackson and never queries
inside them through SQL. The loose typing is intentional: it allows
the document shape to evolve (when the meeting-log task vocabulary
changes, or when the AI analyzer adds a new finding category, for
example) without requiring yet another schema change.

**Indexing.** Beyond the implicit indexes on primary keys and unique
columns, every foreign key column carries an explicit secondary
index, and the columns that drive dashboard filtering (user role and
status, project and meeting status, notification read flag, audit
entity) carry their own. The indexes were not chosen against
synthetic benchmarks but against the repeated reads the dashboards
actually perform — "all proposals for this student", "all unread
notifications for this user", "all meeting logs in this project
sorted by date". With the indexes in place, those queries resolve as
index range scans rather than full-table scans.

**Hibernate as the second pair of eyes.** The application is started
with `spring.jpa.hibernate.ddl-auto: validate`. On every boot,
Hibernate compares its thirty-eight `@Entity` classes (served by
thirty-seven Spring Data repositories) against the live schema and
refuses to serve traffic if the two disagree. Drift between the SQL
migrations and the Java entity model is therefore caught at
deployment time, not at request time. The V21 episode described
earlier — and a near-identical pattern when the Phase 2
`supervisor_availability` table was added in V39 with a `DayOfWeek`
column that needed `columnDefinition = "VARCHAR(10)"` to satisfy the
validator — are exactly this guard kicking in.

Figure 5.6 Hibernate schema-validation passing on backend startup.

### 5.4.2 SQL Database Tables

The database `fyp_supervision` currently contains thirty-eight
application tables plus Flyway's bookkeeping table
`flyway_schema_history`. Rather than enumerate every column, the
tables are grouped here by the domain they implement, with the
representative table of each group listed. The full data dictionary
is provided in Appendix B, and the reverse-engineered EER diagram in
Figure 5.7 gives a visual overview of how the domains relate.

| Domain | Representative tables | Notes |
|---|---|---|
| Identity and profiles | `user_account`, `student_profile`, `supervisor_profile` | One canonical user row plus a one-to-one profile extension per role |
| FYP cycle and matching | `fyp_cycle`, `project`, `supervisor_request` | `project` is the central anchor; placeholder rows allowed before pairing |
| Proposal workflow | `proposal`, `proposal_version`, `proposal_check_result`, `proposal_review` | Versioned content with AI rubric scores attached |
| Meetings, logs, availability | `meeting`, `meeting_log`, `meeting_log_signature`, `supervisor_availability` | Scheduling, the formal MMU FCI log, digital signatures, and the weekly recurring slots added in V39 |
| Documents | `project_document`, `resource_document`, `document_feedback` | Per-project uploads, a shared resource library, and supervisor feedback rows added in V38 |
| Communications | `announcement`, `announcement_audience`, `announcement_read`, `notification`, `deadline` | Audience targeting in a separate join table; V36 added per-user read tracking |
| Chatbot | `chat_session`, `chat_message` | RAG citations stored as JSON-in-`TEXT` |
| Administration and audit | `system_parameter`, `integration_setting`, `audit_log` | Audit log is append-only with no cascade on the user FK |
| Operations and security | `password_reset_token`, `push_subscription`, `approved_*_roster`, `generated_report`, `export_config` | Reset tokens stored only as SHA-256 hashes; reports run asynchronously with a status column added in V37 |

Figure 5.7 Reverse-engineered EER diagram in MySQL Workbench.

A single example shows how the design patterns described in 5.4.1
land in a real table. The definition of `user_account`, abbreviated
to the columns that matter for the discussion:

```sql
CREATE TABLE user_account (
  user_id          BIGINT       AUTO_INCREMENT PRIMARY KEY,
  mmu_id           VARCHAR(20)  UNIQUE NOT NULL,
  email            VARCHAR(255) UNIQUE NOT NULL,
  password_hash    VARCHAR(255) NOT NULL,
  full_name        VARCHAR(255) NOT NULL,
  role             ENUM('STUDENT','SUPERVISOR','FYP_COMMITTEE','SYSTEM_ADMIN') NOT NULL,
  status           ENUM('PENDING','ACTIVE','SUSPENDED','BLOCKED') NOT NULL DEFAULT 'PENDING',
  last_login_at    DATETIME,
  login_attempts   INT          NOT NULL DEFAULT 0,
  lockout_until    DATETIME,
  created_at       DATETIME     NOT NULL DEFAULT NOW(),
  updated_at       DATETIME     NOT NULL DEFAULT NOW() ON UPDATE NOW()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

The surrogate primary key, the `UNIQUE` business identifiers, the
`ENUM`-typed status columns, the `DEFAULT NOW() ON UPDATE NOW()`
timestamps, and the explicit `InnoDB` engine declaration here form
the same template that repeats, with small adjustments, across the
rest of the schema. The two columns added by V27 — `login_attempts`
and `lockout_until` — also illustrate how feature-driven migrations
extend an existing table rather than spawning new ones.

Figure 5.8 The `user_account` table inspected in MySQL Workbench.

**Seed data (V9).** A seed migration brings the database up to a
demonstrable state on a fresh install. It creates a system
administrator, a supervisor (`sarah.lee@mmu.edu.my`), a student
(`student@student.mmu.edu.my`), and a committee member, all sharing
the password `Test@123`, along with two FYP cycles and the twelve
system parameters that the dashboards expect to find. A freshly
cloned repository can therefore be brought up to a fully populated
login screen without any manual data entry.

### 5.4.3 Stored Procedures, Triggers, and Database-Side Logic

No custom stored procedures or triggers were declared. Business logic
was kept in the Spring Boot service layer
(`com.fyp.supervision.service.*`) so that every behaviour is testable
in plain JUnit and visible during code review — there is nothing that
fires "invisibly" inside the database. The decision also keeps the
application portable: if the deployment target ever shifted from
MySQL to PostgreSQL, no procedural SQL would need to be rewritten.

The schema does, however, lean on a small set of built-in MySQL
features to enforce invariants at the storage layer. The
`ON UPDATE CURRENT_TIMESTAMP` clause on every `updated_at` column
behaves as a row-level trigger maintained by InnoDB itself, so
modification timestamps cannot drift between hosts. `AUTO_INCREMENT`
on the surrogate primary keys removes the need for an
application-side identifier generator. `ON DELETE CASCADE` ensures
that dependent rows — signatures, chat messages, audience entries,
password reset tokens — are removed atomically with their parent. As
a final guard, `deadline_reminder_log` uses a composite primary key
`(deadline_id, days_before)`, which makes the reminder dispatcher's
"did I already fire this?" check a primary-key lookup and causes a
duplicate insertion to raise a constraint violation rather than
produce a duplicate notification.

If the project later needs to offload heavy aggregation — nightly
recomputation of supervisor workload statistics, for instance — adding
scheduled MySQL events or stored procedures would be straightforward.
None have been required so far. The dashboards remain fast enough on
the indexed queries described in 5.4.1.

### 5.4.4 Tools Used for Database Management

The day-to-day database work was carried out with a focused toolset
rather than a large platform. **MySQL Workbench 8** served as the
primary graphical client. It was used for ad-hoc inspection of the
schema, for verifying that each Flyway migration produced the
intended DDL, and for running `EXPLAIN` on prospective queries.
Workbench's reverse-engineered EER diagram, shown in Figure 5.7,
became the visual reference for the ERD documented in
`Project-info/reports/chapter3-ERD.md`.

**Flyway 10**, embedded in the Spring Boot backend through
`flyway-core` and `flyway-mysql`, is the migration runner. On every
boot it scans `classpath:db/migration`, compares the discovered
scripts against `flyway_schema_history`, and applies anything missing
in `V*` order. The `baseline-on-migrate: true` setting allows Flyway
to attach to a pre-existing database without erroring, which mattered
during the early prototyping phase when the schema was sometimes
refreshed by hand. The `V<N>__<snake_case_description>.sql` naming
convention keeps the history human-readable.

Several supporting tools rounded out the workflow. The MySQL CLI
inside the `db` Compose container (`docker compose exec db mysql
-ufyp_user -pfyp_pass fyp_supervision`) was used for emergency
inspection and for verifying seed data after a fresh boot. The Docker
named volume `mysql_data` provides the durable storage layer, so that
the database survives container restarts but can be discarded with
`docker volume rm` when a clean slate is required. **IntelliJ IDEA**'s
Database Tool Window was used during entity authoring to preview live
tables and run quick `SELECT` statements without leaving the editor;
the same window also generates JPA entity skeletons that were then
refined into the `@Entity` classes under `com.fyp.supervision.entity`.
Finally, the Hibernate validator described in 5.4.1 serves as the
second line of defence at every backend boot — if any column drifts
from its entity mapping, the application refuses to start rather than
returning silent garbage at request time.

Figure 5.9 IntelliJ IDEA Database Tool Window with `meeting_log` open.

<!--
self-check 5.4 (rewrite + state sync, 2026-05-25)
- Length: cut from ~430 lines (3,500 words, heavy enumeration) to
  ~290 lines (~2,300 words). Replaced the 28-row migration table with
  a short narrative; replaced the 36-table enumeration with a 9-row
  domain summary table; collapsed the 25+ named index list into one
  sentence; merged the 6 bulleted tool descriptions into two short
  paragraphs. Remaining length comes mostly from the
  `user_account` example block and the screenshot capture guide.
- State sync (counts verified against the repo on 2026-05-25):
  * Migrations: 38 scripts (V1–V28 then V30–V39, V29 deliberately
    skipped). Confirmed via `ls db/migration/V*.sql | wc -l`.
  * Tables: 38 application tables + `flyway_schema_history`. Net
    change from the previous "36" claim is +3 added
    (`announcement_read` V36, `document_feedback` V38,
    `supervisor_availability` V39) -1 dropped (`fyp_grade` V30 → V34).
  * Entities: 38 `@Entity` classes; repositories: 37 interfaces under
    `com.fyp.supervision.repository`. Confirmed via `ls`.
  * Second-wave migrations V32–V39 narrated: announcement cycle
    scoping (V32), resource cycle scoping (V33), drop fyp_grade
    (V34), export_config scheduler (V35), announcement_read (V36),
    generated_report status/size (V37), document_feedback (V38),
    supervisor_availability (V39 — Phase 2 slot-based booking).
- Technical content preserved: V16/V18 reversion, V21 validate-contract
  catch, V39 DayOfWeek columnDefinition catch (mirror of V21), ENUM
  rationale, FK cascade semantics, JSON-in-TEXT idiom, the
  user_account example block, V9 seed users, idempotent
  deadline_reminder_log composite PK.
- Detail moved to: ERD (Figure 5.7), Appendix B (full data dictionary).
- Figures inserted (placeholders for screenshots):
  * Figure 5.4 — database tier in the Compose stack
  * Figure 5.5 — Flyway migration scripts in IDE tree
  * Figure 5.6 — Hibernate schema-validation pass at backend startup
  * Figure 5.7 — Workbench EER diagram
  * Figure 5.8 — user_account inspected in Workbench
  * Figure 5.9 — IntelliJ DB Tool Window with meeting_log
- Tone pass:
  * British spelling: organise, behaviour, defence — checked.
  * AI tells avoided: no leverage / robust / seamless / comprehensive /
    delve / "It is important to note".
  * Hedging count: ≤ 2 per paragraph.
  * Sentence opening grammar varied; no three-sentence parallel block.
- See "Figure list — screenshots to capture" below for the shot list.
-->

**Figure list — screenshots to capture (do this when ready):**

- **Figure 5.4** — Compose stack overview, with the `db` service
  highlighted. Take from `docker compose ps` or the Docker Desktop
  side panel.
- **Figure 5.5** — IntelliJ project tree expanded to
  `backend/src/main/resources/db/migration/` so the V1…V31 file
  sequence is visible.
- **Figure 5.6** — Backend startup log showing
  `Successfully validated 38 migrations`,
  `Current version of schema 'fyp_supervision': 39`, and
  `Started FypSupervisionApplication`. Crop the relevant lines from
  the run console.
- **Figure 5.7** — MySQL Workbench → Database → Reverse Engineer →
  the resulting EER diagram of `fyp_supervision`. Use the auto-layout
  view at "Fit page".
- **Figure 5.8** — In Workbench, right-click `user_account` →
  *Alter Table* (or *Table Inspector* → Columns tab) so the column
  types and constraints are visible.
- **Figure 5.9** — IntelliJ Database Tool Window with
  `fyp_supervision.meeting_log` selected and the data tab showing a
  few rows. Captures both the schema panel on the left and the rows
  on the right.

---

## 5.5 Key Modules and Features Developed

The implementation is grouped into eleven modules: authentication; the
four role-scoped workflows (student, supervisor, FYP committee,
administrator); the three AI services (supervisor recommendation,
proposal analyzer, RAG chatbot); and three cross-cutting modules
(cycle lifecycle, announcements, system administration). Each
subsection names the controllers and services that anchor the
module, the algorithm or guard doing the real work, and a short code
excerpt where the code reads better than prose. The AI subsections
run longer because the algorithm itself is the main contribution.

### 5.5.1 User Authentication and Access Control

Authentication is owned by `AuthService`, `JwtTokenProvider`,
`JwtAuthenticationFilter`, and `SecurityConfig`. Tokens are HS256
JWTs signed with `JJWT`; passwords are hashed with BCrypt; sessions
are stateless. Controllers read the acting user through
`@AuthenticationPrincipal UserAccount`, never via
`SecurityContextHolder`.

Two choices keep the auth surface small. Only students and
supervisors can self-register — committee and admin accounts are
provisioned by an administrator, so the public form cannot be abused
to enrol a privileged role. New accounts land in `PENDING` status,
and the login path rejects any non-`ACTIVE` account, making admin
review a hard gate rather than a soft hint.

```java
public LoginResponse login(LoginRequest request) {
    String identifier = request.getIdentifier().toLowerCase().trim();
    UserAccount user = userAccountRepository.findByEmailOrMmuId(identifier)
            .orElseThrow(() -> new BadCredentialsException("Invalid credentials."));
    if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
        throw new BadCredentialsException("Invalid credentials.");
    }
    if (user.getStatus() == UserStatus.PENDING)
        throw new BadRequestException("Your account is pending approval.");
    if (user.getStatus() == UserStatus.SUSPENDED || user.getStatus() == UserStatus.BLOCKED)
        throw new BadRequestException("Your account has been " + user.getStatus().name().toLowerCase() + ".");
    user.setLastLoginAt(LocalDateTime.now());
    userAccountRepository.save(user);
    String token = jwtTokenProvider.generateToken(user.getUserId(), user.getEmail(), user.getRole().name());
    return new LoginResponse(token, UserDto.fromEntity(user));
}
```

Authorisation is URL-prefix based and is configured once in
`SecurityConfig`. Endpoints inherit their authority from the package
tree, so a controller dropped into `controller/admin/` is restricted
to `SYSTEM_ADMIN` with no per-method annotation. The student-facing
supervisor directory is the one exception: its plural prefix
`/supervisors/**` marks it as readable by students rather than by
supervisors. Per-row checks (a supervisor seeing only their own
request) live in `SupervisorAccessService` because they depend on
entity ownership, not on the URL.

Table 5.2 — URL-prefix authority routing.

| URL prefix | Authority required |
|---|---|
| `/admin/**` | `SYSTEM_ADMIN` |
| `/committee/**` | `FYP_COMMITTEE` |
| `/supervisor/**` | `SUPERVISOR` |
| `/student/**` | `STUDENT` |
| `/supervisors/**` (student-facing supervisor directory) | `STUDENT` |
| `/auth/login`, `/auth/register`, `/auth/forgot-password`, `/auth/reset-password`, `/auth/verify-reset-token`, `/announcements/latest`, `/system/parameters/public`, `/uploads/**` | permitAll |

The frontend half of the contract is the React `AuthProvider`: the
JWT lives in `localStorage` under `access_token`, an Axios
interceptor in `lib/api/client.ts` attaches it to every outgoing
request, and a 401 response redirects to `/session-expired` instead
of rendering against stale data.

### 5.5.2 Student Workflow Module

The student tier is the largest role-scoped module. Eleven
controllers sit under `/student/**` and one under `/supervisors/**`,
covering the dashboard, profile, supervisor directory, AI
recommendations, supervision requests, proposals, meetings, meeting
logs, supervision logs, documents, deadlines, and the chatbot. The
business logic concentrates in `StudentService`, with
`MeetingLogService`, `StudentAccessService`, and
`CycleLifecycleService` handling cross-cutting concerns.

The student progresses through an explicit state machine that the
backend enforces at every transition:

```
REGISTERED → SEARCHING_SUPERVISOR → REQUEST_SUBMITTED
          → SUPERVISOR_ASSIGNED   → PROPOSAL_DRAFT
          → PROPOSAL_SUBMITTED    → PROPOSAL_APPROVED
          → MEETINGS_AND_LOGS     → FINAL_SUBMISSION
```

Transitions are guarded in the service layer rather than the
controller. `StudentService.createProposal` and
`MeetingLogService.createLog` both look up
`projectRepository.findByStudent_UserId(userId)` and refuse if no
`Project` row exists; that row, created the moment a supervisor
accepts a request, anchors every subsequent operation.

```java
@Transactional
public MeetingLog createLog(Long userId, Map<String, Object> data) {
    Project project = projectRepository.findByStudent_UserId(userId)
        .orElseThrow(() -> new BadRequestException(
            "No project found. You need an active project to create meeting logs."));
    MeetingLog log = MeetingLog.builder()
        .project(project)
        .student(project.getStudent())
        .supervisor(project.getSupervisor())
        .meetingDate(...).meetingNumber(...).meetingMode(...).fypPhase(...)
        .tasksJson(toJson(data.get("tasks")))
        .workDoneDetails((String) data.get("workDoneDetails"))
        .workToBeDone((String) data.get("workToBeDone"))
        .problemsAndSolutions((String) data.get("problemsAndSolutions"))
        .status(MeetingLogStatus.DRAFT)
        .build();
    return meetingLogRepository.save(log);
}
```

`GET /student/dashboard` is the busiest endpoint in the module. In a
single transaction it assembles the profile, registration state, the
next five meetings, five most recent draft logs, five latest
documents, next five deadlines, the trimester-week tracker, the
meeting-log compliance count, and the unread notification count —
one round-trip instead of seven. The payload also exposes
`cycleActive`, which the React feature gates (`<StudentFeatureGate>`,
`<RegisteredOnlyLockGate>`, `<CycleActiveGate>`) read to decide
whether to render a working page or a `LockedFeaturePage`.

Submitting a meeting log fires
`NotificationService.createNotification` for the supervisor; progress
moves from the student tier into the supervisor tier without either
side polling.

### 5.5.3 Supervisor Discovery and AI Recommendation

Two complementary endpoints sit on top of the supervisor directory.
`GET /supervisors` returns a filterable list (by department, faculty,
availability, research keywords) for students who already know what
they are looking for. `POST /student/recommendations` is the AI path
for students who would rather have the system rank supervisors
against their own profile.

The recommendation service runs in a separate Flask process at port
5001. The runtime is a deterministic, untrained weighted score with
no machine-learning training and no large-language-model call in the
request path. An earlier prototype used XGBoost over synthetic match
labels, but it was replaced because synthetic data inflated reported
accuracy without measuring real recommendation quality, and because
a transparent weighted score is auditable in a way an XGBoost
prediction is not.

The score combines five components:

```
score(student, supervisor) =
      0.50 · cosine( embed(studentText), embed(supervisorText) )
    + 0.18 · jaccard( student.interests, supervisor.researchAreas )
    + 0.10 · jaccard( student.skills,    supervisor.expertise )
    + 0.07 · programmeMatch
    + 0.15 · availabilityFactor
```

Embeddings come from a pretrained Sentence-BERT model
(`BAAI/bge-base-en-v1.5`, 768-dim by default, swappable via
`REC_EMBED_MODEL`). The BGE family expects "query: …" and "passage:
…" prefixes for best retrieval quality, so the service prepends them
when the model name contains "bge". The supervisor profile passed to
the embedding model goes beyond self-described expertise: it
includes up to six recent supervised project titles, each clipped to
160 characters, so a student whose interests align with a
supervisor's actual past work outranks one who only matches a
free-text "research areas" field.

A hard filter runs before scoring. Supervisors marked `UNAVAILABLE`
or already at quota are dropped from the candidate set rather than
ranked low — being absent is more honest than ranking ninth out of
ten with a 0.05 score.

```python
def _is_acceptable(supervisor: dict) -> bool:
    status = str(supervisor.get("availabilityStatus") or "").upper()
    if status == "UNAVAILABLE":
        return False
    load = int(supervisor.get("currentLoad") or 0)
    quota = int(supervisor.get("supervisionQuota") or 8)
    return load < quota
```

Explanations are generated locally from the score breakdown — no
LLM call. `_build_explanation` composes a sentence describing
semantic strength ("strong topic alignment (semantic 0.74)"), shared
research areas, shared skills, programme overlap, and free
supervision slots. Removing the LLM dependency keeps the endpoint
cheap and means recommendations remain available when no external
API key is configured.

The Spring side is a thin gateway: `AiServiceClient.getRecommendations`
POSTs to `${AI_RECOMMENDATION_URL}/ai/recommendations` and returns
the parsed JSON to `StudentRecommendationController`. A failed HTTP
call returns an empty list rather than throwing, and
`pages/student/AIRecommendations.tsx` renders an empty-state view.
The same JSON feeds `pages/student/CompareSupervisors.tsx`, which
lays the top matches out side by side with their score components.

### 5.5.4 Supervisor Workflow Module

The eleven supervisor controllers mirror the inverse of the student
journey. Dashboard, profile (with supervision quota, availability
status, preferred project types), the request inbox, the supervisee
list, the proposal review queue, meeting scheduling with weekly
availability publishing (see 5.5.6), meeting-log review and signing,
documents, and supervisee-targeted announcements all sit under
`/supervisor/**`. `SupervisorService` carries the main logic;
`SupervisorAccessService` centralises per-row ownership checks
(`requireOwnRequest`, `requireOwnProject`, `requireOwnProposal`,
`requireOwnMeeting`, `requireOwnLog`) that were previously
duplicated across controllers and at one point allowed
cross-supervisor access to log details.

Quota arithmetic runs when a supervisor accepts a request: the
service increments `supervisor_profile.current_load`, checks it
against `supervision_quota`, and refuses with `ConflictException` if
the quota would be breached. The DTO also exposes a derived
`availableSlots` (`max(0, quota − load)`) and an `isAcceptingStudents`
flag (`availabilityStatus == AVAILABLE && load < quota`), so the
React directory can disable the "Request Supervision" button without
a second round-trip.

```
acceptRequest(requestId, supervisorUserId):
    request <- SupervisorRequest.findById(requestId)
    require request.supervisor.userId == supervisorUserId
    require request.status == PENDING
    profile <- SupervisorProfile.findById(supervisorUserId)
    require profile.currentLoad < profile.supervisionQuota
    request.status      <- ACCEPTED
    request.respondedAt <- now()
    profile.currentLoad <- profile.currentLoad + 1
    project <- Project(student=request.student,
                       supervisor=request.supervisor,
                       cycle=activeFyp1Cycle,
                       status=ACTIVE,
                       registeredAt=now())
    save(request); save(profile); save(project)
    notify(request.student.userId, REQUEST,
           "Supervision request accepted",
           "/student/supervisors")
```

The meeting-log signature lifecycle sits in 5.5.6 alongside its
SHA-256 anchor.

Acceptance creates the `Project` row that anchors every downstream
feature for that student — proposals, meetings, logs, documents.
Rejection sends a notification carrying the supervisor's
`responseMessage` so the student knows why and is free to send a
different request. The frontend supervisor pages under
`pages/supervisor/` consume the same DTO shapes; their feature gates
are simpler than the student side because no cycle-active block
applies to supervisors.

### 5.5.5 Proposal Lifecycle and AI Proposal Analyzer

The proposal module spans three controllers (one per role), four
entity types (`Proposal`, `ProposalVersion`, `ProposalCheckResult`,
`ProposalReview`), `FileStorageService` for PDF uploads,
`ProposalDocumentService` for DOCX rendering, and the Flask analyzer
on port 5002.

The lifecycle is append-only on the version side. Each submission
creates a fresh `proposal_version` snapshotting the text and file
path; the `Proposal` row's `status` advances through
`DRAFT → SUBMITTED → UNDER_REVIEW → REVISION_REQUIRED / APPROVED / REJECTED`.
The analyzer fires on submission and writes a
`proposal_check_result` row whose foreign key — since V10 — points
back to the proposal so both the student and supervisor pages read
the same scored result rather than re-scoring on each view.

The analyzer pipeline has three stages:

1. **Rule-based NLP**, always on. `nlp_utils.analyze_proposal_nlp`
   computes Flesch-Kincaid grade, Flesch reading ease, Gunning Fog,
   sentence-length statistics, lexical diversity, section coverage
   (problem statement, objectives, scope, methodology), and a
   citation count, returning four sub-scores — clarity, structure,
   scope, innovation — each on a 0–100 scale. It runs on every
   request and never depends on a model file.

2. **Fine-tuned DistilBERT**, when `models/essay_scorer/` is present.
   The model produces an overall 0–100 quality score. Tokenisation
   was the implementation detail that mattered: DistilBERT-base has
   a 512-token context window, and the earlier version of the
   service truncated each proposal to the first ~400 words and
   scored only that prefix. The current version chunks the token
   sequence into 480-token windows with a 384-token stride (≈25%
   overlap, so a section heading is not split across two windows),
   runs each chunk through the model, and returns a length-weighted
   average. A 3,000-word proposal is now scored on the full text.

```python
def predict_quality_score(text):
    if quality_model is None or quality_tokenizer is None:
        return None
    encoding = quality_tokenizer(text, add_special_tokens=False, return_tensors=None)
    token_ids = encoding["input_ids"]
    chunks = _chunk_token_ids(token_ids)              # 480-token windows, stride 384
    weighted_sum, total_weight = 0.0, 0
    for chunk in chunks:
        ids = quality_tokenizer.build_inputs_with_special_tokens(chunk)[:QUALITY_MAX_TOKENS]
        attention = [1] * len(ids) + [0] * (QUALITY_MAX_TOKENS - len(ids))
        ids = ids + [quality_tokenizer.pad_token_id] * (QUALITY_MAX_TOKENS - len(ids))
        with torch.no_grad():
            out = quality_model(input_ids=torch.tensor([ids]),
                                attention_mask=torch.tensor([attention]))
        score01 = max(0.0, min(1.0, out.logits.squeeze().item()))
        weighted_sum += score01 * len(chunk)
        total_weight += len(chunk)
    return round((weighted_sum / total_weight) * 100, 1)
```

3. **Optional remote LLM** for "detailed strengths, weaknesses, and
   suggestions" prose. Provider precedence is `LLM_API_KEY` (any
   OpenAI-compatible endpoint) → `GROQ_API_KEY` (default
   `llama-3.3-70b-versatile`) → `OPENAI_API_KEY` (default
   `gpt-3.5-turbo`). With no key the analyzer falls back to the NLP
   pipeline's own short feedback strings. Output is constrained to a
   four-key JSON schema (`detailed_strengths`, `detailed_weaknesses`,
   `detailed_suggestions`, `summary`); a JSON-extraction helper
   strips code-fenced or prose-prefixed responses because most
   non-OpenAI providers ignore `response_format=json_object`.

### 5.5.6 Meetings, Meeting Logs, Digital Signatures and FCI Compliance

The module covers the meeting lifecycle from scheduling through the
formal MMU FCI log. Four services do the work:
`MeetingLogService`, `SupervisorAvailabilityService`,
`MeetingLogDocumentService`, and `MeetingLogComplianceService`.

**Scheduling.** A supervisor publishes weekly recurring timeslots
through `PUT /supervisor/availability`. The `supervisor_availability`
table (V39) stores one row per
`(supervisor_user_id, day_of_week, start_time, end_time)` window
with a `slot_duration_minutes` value defaulting to 30. The student
calls `GET /supervisors/{id}/available-slots?from&to`, which expands
the weekly schedule into concrete `LocalDateTime` slots for the
requested date range and masks out any slot already taken by a
meeting in status `PROPOSED`, `CONFIRMED`, or `RESCHEDULED`. The
student picks a single slot and submits via
`POST /student/meetings`; the meeting is created `PROPOSED` with
`initiatedBy = STUDENT`. Either side can respond — student via
`/student/meetings/{id}/respond` (ACCEPT / DECLINE / RESCHEDULE),
supervisor via `/supervisor/meetings/{id}/respond` (CONFIRM / CANCEL
/ RESCHEDULE) — and every transition fires an in-app notification.
For an `ONLINE` or `HYBRID` meeting, the supervisor can attach the
URL later through `PATCH /supervisor/meetings/{id}/link` without
changing status — the time is confirmed first and the Teams or Zoom
link is generated only when the meeting is imminent.

**The meeting log.** A log captures the meeting date, mode, FYP
phase, a JSON list of tasks discussed, a free-text discussion
summary, problems and solutions, action items, and the next meeting
date. Both parties sign by drawing on an HTML5 canvas; the rendered
PNG is stored as a data URL in `signature_image_url`, and a SHA-256
hash of the bytes lives separately in `signature_sha256`. The hash
is computed in Java via `MessageDigest` at the moment of signing —
substitute a different image into `signature_image_url` and the hash
no longer matches.

The log lifecycle is enforced by `MeetingLogService` and visualised
on the frontend with status badges:

```
DRAFT
  └─ student edits freely, may delete
  └─ student submits         → SUBMITTED   (notify supervisor)
SUBMITTED
  ├─ supervisor returns      → CORRECTION_REQUIRED (with reason; back to DRAFT on edit)
  └─ supervisor signs        → SUPERVISOR_SIGNED   (signature row + SHA-256)
SUPERVISOR_SIGNED
  └─ student counter-signs   → LOCKED              (immutable, exportable as DOCX)
```

**DOCX export.** A locked log exports as a Word document matching
the official MMU FCI template. `MeetingLogDocumentService` renders
it server-side with Apache POI: load
`templates/meeting-log-fyp1.docx` (or `-fyp2` per the log's phase),
substitute the trimester header placeholders, fill the participant
table, tick the meeting-mode and tasks checkboxes, write the
work-done and work-to-be-done sections at 11-point, and embed both
signatures as inline pictures. Single log via
`GET /student/meeting-logs/{id}/export.docx`; bulk via
`GET /student/meeting-logs/export.zip?phase=FYP1`, which zips every
log for the requesting student under one phase. The renderer also
handles cross-run text replacement, so placeholders that Word has
split across multiple `<w:r>` elements (a common quirk of edited
templates) are still substituted correctly.

`MeetingLogComplianceService` is the single point that counts logs.
The MMU FCI rule is that an FYP1 student should produce at least six
locked meeting logs across the trimester, and the same minimum
applies to FYP2. Compliance is the count of `LOCKED` logs filtered
by `fypPhase`, surfaced through the dashboard payload
(`meetingLogsCompleted`, `meetingLogsRequired`) as a progress widget
on the student dashboard and a coloured badge on the admin
pass-tracking page. The check is not a hard server-side block — an
administrator can still mark a project PASSED with five logs, but
the frontend confirms with a modal that quotes the shortfall.
Academic judgement should not be overridden by an arithmetic count,
but the count should be impossible to miss.

### 5.5.7 Cycle Lifecycle and Read-Only Gating

`CycleLifecycleService` is the spine of the FYP cycle model. The
invariant is at most one `ACTIVE` cycle per `cycleType` (FYP1,
FYP2); activating a cycle automatically moves any other cycle of the
same type to `COMPLETED`. FYP1 activation also runs
`backfillFyp1Placeholders`, which idempotently attaches every active
student without a `Project` row to a placeholder project pinned to
the new cycle. The placeholder carries no supervisor and a fixed
title (`(Pending — awaiting supervisor)`) so that downstream
queries joining through `Project` always return a row, even for a
brand-new student.

```
FypCycle.status: PLANNING → ACTIVE → COMPLETED → ARCHIVED
                          └─────────────────────┘
                          (only one ACTIVE per cycleType)
```

When an admin transitions a cycle to `COMPLETED` or `ARCHIVED`, the
service fires a notification to every enrolled student via
`NotificationService`, and `Project.status` is left intact. The
visible effect on the student side is that
`StudentAccessService.requireActiveCycle(userId)` — called at the
top of every student write endpoint (proposals, meetings, meeting
logs, documents, supervision requests) — starts throwing
`ForbiddenException` with a user-facing message. Reads stay open.
The frontend reads `cycleActive` from the dashboard payload and
renders `LockedFeaturePage` for write pages, so the student sees a
consistent "your FYP cycle has ended" screen rather than an
arbitrary 403.

One subtle case made it into the service. A student who registered,
was placed in a cycle that has now `COMPLETED`, and never picked a
supervisor must not be locked out forever — they should join the
next active FYP1 cycle when one opens.
`buildRegistrationStatus` reports such a student as
`cycleActive: true`, and `backfillFyp1Placeholders` re-points the
placeholder project to the new cycle on activation. The rule is not
"cycle COMPLETED ⇒ read-only" but "cycle COMPLETED *and* the student
already has progress in it ⇒ read-only".

Admin-side cycle management is `AdminCycleController` and
`pages/admin/CycleManagement.tsx`. Activating a cycle calls
`CycleLifecycleService.setCycleStatus(id, ACTIVE)`; closing one
calls the same method with `COMPLETED`. The notification fan-out is
implicit, so the controller never opens a notification call of its
own.

### 5.5.8 Announcements and Audience Filtering

Announcements are the broadcast channel. `AnnouncementService` is
the single source of truth for queries, audience filtering,
multipart attachment storage, and external links, shared across
`AnnouncementController` (public `latest` route),
`SupervisorAnnouncementController`, and
`CommitteeAnnouncementController`.

An announcement carries a `scope` enum (`ALL`, `FYP1`, `FYP2`,
`PROGRAMME_<X>`, `SPECIFIC_STUDENTS`); the audience for the
targeted-student case is materialised as `announcement_audience`
rows. Each row also carries an optional `cycle_id` (V32) so that a
broadcast can be tied to one specific FYP1 or FYP2 cohort —
necessary when several FYP1 cycles run in sequence, so a student
whose cycle has ended does not keep receiving content broadcast to
the next cohort. Visibility is computed in code rather than SQL
because it depends on `Project.cycle.cycleId`,
`Project.cycle.cycleType`, and `StudentProfile.programme`, none of
which a single JPQL predicate resolves cleanly. The trade-off is
that the service loads all `PUBLISHED` announcements, applies the
predicate in memory, and slices for pagination afterwards — fine for
the announcement volume the system actually carries, with a comment
in the code marking the line at which a JPQL predicate becomes
worthwhile.

Read state lives in `announcement_read` (V36). The composite
primary key `(user_id, announcement_id)` makes a duplicate "mark as
read" insert a no-op, and `announcement.view_count` now represents
unique readers rather than raw page views: `AnnouncementService`
increments it only on the first insert per user.

```java
public Page<Map<String, Object>> listForStudent(Long studentUserId, Pageable pageable) {
    StudentContext ctx = loadStudentContext(studentUserId);
    List<Map<String, Object>> visible = announcementRepository
            .findByStatusOrderByCreatedAtDesc(AnnouncementStatus.PUBLISHED, Pageable.unpaged())
            .getContent().stream()
            .filter(a -> matchesAudience(a, ctx))
            .map(this::buildDto)
            .toList();
    int from = Math.min((int) pageable.getOffset(), visible.size());
    int to = Math.min(from + pageable.getPageSize(), visible.size());
    return new PageImpl<>(visible.subList(from, to), pageable, visible.size());
}
```

The filter-then-paginate ordering matters. An earlier version
paginated first and filtered after, so a page reported `total = 10`
while rendering only the four rows that survived the audience check —
visibly broken in the UI. Moving the slice to after the filter
fixed it.

For supervisors, the same service computes an inbox-and-outbox view:
the supervisor sees announcements they themselves authored
(`direction = SENT`) plus anything published by the committee or
admin (`direction = RECEIVED`). The frontend uses `direction` to
render a "Sent" or "From committee" badge and to hide Edit and
Delete on the received ones. Other supervisors' announcements are
excluded.

Attachments are uploaded multipart and routed through
`FileStorageService`, which writes them under
`uploads/announcement/<announcementId>/`. Static serving of
`/uploads/**` is `permitAll` in `SecurityConfig`, so attachments
resolve directly through the same proxy that serves profile
pictures.

### 5.5.9 FYP Committee Oversight and Reporting

The committee module gives faculty coordinators a read-mostly
cross-cutting view. `CommitteeDashboardController` serves cycle-level
counts: active FYP1 and FYP2 projects, unpaired students, proposal
status distribution, supervisor-load distribution, and the deadline
calendar. `CommitteeProjectController` and
`CommitteeProposalController` provide drill-down and the ability to
override or escalate a review. `CommitteeAnnouncementController`
broadcasts to all students, all supervisors, or a specific cycle via
the audience filter in 5.5.8. `CommitteeReportController` and
`CommitteeReportService` produce CSV exports of student progress and
supervisor load, persisted as `generated_report` rows under
`uploads/reports/` so downloads are auditable rather than transient.

Most committee endpoints are aggregation queries over the `project`,
`proposal`, and `meeting_log` tables, shaped into a frontend-friendly
DTO. The aggregations sit server-side rather than asking the React
app to fetch raw entities and aggregate in the browser, for two
reasons: one network round-trip instead of three or four, and the
rule for "active project this cycle" stays defined in one place
(`ProjectRepository.countFyp1Projects()`, `countFyp2Projects()`,
`countUnpairedStudents()`) rather than being re-implemented client-side.

Broadcasts use `NotificationService.createNotification` in a fan-out
loop, one row per targeted user. The bell badge in the React top bar
surfaces the unread count via `GET /notifications/unread-count`,
polled on a five-second interval. Report generation runs through a
small asynchronous pipeline (V37): a row is inserted into
`generated_report` with `status = PENDING`, the service kicks off
the CSV export in an `@Async` method, and the row is updated to
`COMPLETED` with the path, `file_size`, and filter JSON once the
file is written under `uploads/reports/`. A coordinator can
re-download the same report later without re-running the query.

### 5.5.10 System Administration, Audit Logging, and FYP1 Pass Tracking

The admin module is the configuration plane. Twelve controllers
cover the dashboard, user CRUD with status changes
(`PENDING → ACTIVE → SUSPENDED → BLOCKED`), cycles, deadlines,
runtime parameters, integration settings, audit logs, recurring data
exports, maintenance jobs, projects (with FYP1 pass tracking), job
history, and the approved-student and approved-supervisor rosters.
`AdminService` handles the high-frequency CRUD,
`AdminMaintenanceService` runs asynchronous jobs, and
`AdminExportService` handles scheduled exports.

Three patterns recur across the module.

*Audit every mutating call.* `AuditService.record(...)` writes to
`audit_log` with actor, action (`SCREAMING_CASE`), entity name,
entity id, JSON details, IP address, and user agent. It is
annotated `REQUIRES_NEW` and wraps the save in a `try/catch` that
swallows exceptions with a `WARN` log line — an audit-write failure
must never break the action being logged. A separate
`recordAnonymous(...)` overload covers pre-authentication events
such as failed logins.

*Parameter-driven behaviour.* The `system_parameter` table is read
on each request rather than at boot, so toggling
`ai_recommendation_enabled` to `false` stops recommendations
immediately without a restart. Public parameters are exposed through
`/system/parameters/public` (permitAll) so the frontend can decide
whether to render an AI button at all.

*Background jobs.* `AdminMaintenanceService` writes a
`maintenance_job` row in `PENDING`, kicks off the actual work in an
`@Async` method, and updates the row to `RUNNING` and then
`COMPLETED` or `FAILED` with `result_json`, so the React
`MaintenanceCenter` polls status without blocking. The same pattern
drives the AI vector-store rebuild and backups.

FYP1 pass tracking is a small but high-stakes submodule. The
`Project.fyp1_passed` column (V15, nullable `BOOLEAN`) records
whether a student has cleared FYP1 and is therefore eligible for
FYP2. The admin sets the flag via
`POST /admin/projects/{id}/fyp1-passed`, the dashboard reads it via
`GET /admin/projects/fyp1-pass`, and a CSV bulk-import endpoint
applies a whole cohort's results in one call. An earlier design
held a full `fyp_grade` table with a rubric and a finalisation
workflow (V30), but V34 dropped it once the pass-flag model proved
sufficient for the FYP1 → FYP2 advancement decision the committee
actually needed. The matching frontend page is
`pages/admin/Fyp1PassTracking.tsx`.

The admin dashboard closes with a small live-status panel that calls
`AiServiceClient.is*ServiceHealthy()` for each of the three Flask
services (`GET /ai/health` against `:5001` / `:5002` / `:5003`), so
an admin sees AI uptime without leaving the page. Suspension or
blocking takes effect immediately because the JWT filter re-reads
`user.status` on every request rather than trusting the token
alone.

### 5.5.11 RAG Chatbot and Knowledge Base

The chatbot answers procedural FYP questions ("when is the proposal
due?", "what should section 3 of the proposal contain?", "how do I
request a different supervisor?") by retrieval-augmented generation
over a 15-document knowledge base under `ai-chatbot/knowledge_base/`.
The documents cover the FYP overview, proposal writing, meeting
logs, report writing, timeline planning, methodology, literature
review, technical writing, presentations, common pitfalls,
technology guidance, supervisor selection, MMU FCI procedures,
testing and evaluation, and an FAQ.

Ingestion is offline. `build_knowledge_base.py` chunks each document
into overlapping passages, embeds each chunk with
`all-MiniLM-L6-v2`, and writes the FAISS index plus a JSON metadata
sidecar to `vector_store/`. That directory is a named volume
(`chatbot_vector_store`) in the Compose stack, so a service restart
does not require re-ingestion.

`RAGEngine` answers in three steps: embed the message with the same
model used at ingestion, retrieve the top-five chunks from FAISS,
pass them to a generator. The generator has three paths.

Table 5.3 — RAG chatbot generator paths.

| Path | Used when | Confidence multiplier |
|---|---|---|
| Remote LLM | An OpenAI-compatible API key is configured | 1.00 |
| Local Flan-T5 | `USE_LOCAL_GEN=true` and no remote LLM | 0.70 |
| Extractive | No LLM available; the retrieved chunks are returned directly | 0.55 |

Local Flan-T5 is **off by default** (`USE_LOCAL_GEN=false`); the
model was a long-standing quality bottleneck, and the extractive
path produces a more honest answer than a paraphrased one. Provider
precedence for the remote LLM is the same triple as the proposal
analyzer (`LLM_API_KEY` → `GROQ_API_KEY` → `OPENAI_API_KEY`), with
Groq's `llama-3.3-70b-versatile` as the Groq default.

A retrieval-confidence cut-off prevents hallucination on
out-of-scope questions. When the top-1 cosine similarity falls
below `OUT_OF_SCOPE_THRESHOLD = 0.30`, the service skips generation
and returns a fixed reply listing the supported topics. The final
reported confidence is the top-1 similarity multiplied by the
generator path's multiplier, clipped to `[0, 1]` — replacing an
earlier hard-coded constant that overstated how grounded the answer
was.

Twelve intent labels (proposal, meeting_log, report, timeline,
methodology, testing, technology, presentation, supervisor,
literature, procedure, general) are recognised by a weighted-keyword
classifier that ranks longer, more specific phrases ahead of generic
ones. The intent feeds the response prefix on the extractive path
and is logged for analytics.

The Spring side is `StudentChatController`, calling
`AiServiceClient.chat(...)` against `${AI_CHATBOT_URL}/ai/chat`.
Each user message and bot reply is persisted to `chat_session` and
`chat_message`, with `references_json` recording which knowledge-base
chunks the answer drew from. A failed HTTP call returns a fixed
fallback ("The AI assistant is currently unavailable…") rather than
an exception, so the chat widget never breaks the dashboard. The
chatbot can be disabled globally by flipping `ai_chatbot_enabled` in
`system_parameter`, in which case the controller short-circuits
before the HTTP call.

---

## 5.6 APIs and Integration

This section describes the REST API surface that the backend exposes
to the frontend, the boundary the backend uses to reach the three
Flask AI services and external providers, and the JWT-based
authentication scheme that gates every authenticated route. Four
subsections cover internal and third-party APIs, the endpoint
catalogue, payload shape, and the authentication mechanism.

### 5.6.1 Description of Internal APIs or Third-Party APIs Used

The backend exposes a single internal REST API mounted under the
context path `/api`, served by 47 Spring controllers. All routes are
JSON in / JSON out except for five multipart upload paths
(announcement create, project document upload, profile image upload,
roster CSV import, FYP1-pass CSV import) and three binary download
paths (committee CSV report, proposal DOCX export, project document
download). The frontend never bypasses this layer: every browser
request lands on the backend, which in turn fans out to the AI
services or third-party providers as needed.

Three internal AI services run alongside the backend in the same
Compose stack and are reached only through the `AiServiceClient`
gateway.

Table 5.4 — Internal AI services reachable through `AiServiceClient`.

| Service | Internal URL | Purpose |
|---|---|---|
| `ai-recommendation` | `${AI_RECOMMENDATION_URL}/ai/recommendations` and `/ai/health` | Deterministic five-component supervisor matching (see Section 5.5.3) |
| `ai-proposal-analyzer` | `${AI_ANALYZER_URL}/ai/analyze-proposal` and `/ai/health` | Fine-tuned DistilBERT chunk-and-average plus optional remote LLM (Section 5.5.5) |
| `ai-chatbot` | `${AI_CHATBOT_URL}/ai/chat` and `/ai/health` | Retrieval-augmented generation over a 15-document knowledge base (Section 5.5.11) |

`AiServiceClient` wraps each call in a `try`/`catch` around
`RestTemplate` and converts transport failures and non-2xx responses
into a typed `AiServiceUnavailableException`, which the controllers
translate into HTTP 503 rather than persisting an empty placeholder.
An AI outage therefore produces a banner saying "service temporarily
unavailable" rather than a silent zero-score row in the analysis
history.

Beyond the in-stack services, four third-party integrations are
wired in.

Table 5.5 — Third-party integrations and default state.

| Integration | Library / endpoint | Default state | Used for |
|---|---|---|---|
| Remote LLM (Groq / OpenAI / OpenAI-compatible) | OpenAI Python SDK 1.54.5 + `httpx` 0.27.2 in the analyzer and chatbot containers; precedence `LLM_API_KEY → GROQ_API_KEY → OPENAI_API_KEY` | Off unless an API key is set | Detailed strengths/weaknesses prose for the analyzer; primary generator path for the chatbot |
| SMTP mail | `spring-boot-starter-mail` against `MAIL_HOST` / `MAIL_PORT` (defaults `smtp.gmail.com:587`) with STARTTLS | Off (`APP_EMAIL_ENABLED=false`) | Password-reset emails and opt-in notification emails |
| Web Push (VAPID) | `nl.martijndwars:web-push 5.1.1` + `bouncycastle:bcprov-jdk18on 1.78`, signed with `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` | Off (`APP_PUSH_ENABLED=false`) | Browser push notifications via per-device `push_subscription` rows |
| Google Fonts | `<link rel="preconnect">` + `<link rel="stylesheet">` to `fonts.googleapis.com` for `Plus Jakarta Sans` (400 / 500 / 600 / 700) | Build-time only | Frontend typography |

The two off-by-default backend integrations keep the local stack
runnable with no secrets configured. Flipping the env variables to
`true` once SMTP credentials and a VAPID keypair are supplied
activates them without code changes.

### 5.6.2 API Endpoints Implemented

The endpoint surface is partitioned along the same URL-prefix lines
as the security configuration described in Section 5.3.1. The full
list contains roughly 130 routes; the per-controller breakdown is in
Section 5.5.

Table 5.6 — Controller tiers with representative endpoints.

| Tier | URL prefix | Controllers | Representative endpoints |
|---|---|---|---|
| Auth | `/auth` | `AuthController` | `POST /auth/register`, `POST /auth/login`, `GET /auth/me`, `POST /auth/forgot-password`, `POST /auth/reset-password`, `GET /auth/verify-reset-token`, `PUT /auth/change-password`, `PUT /auth/update-profile`, `POST /auth/profile-image` |
| Shared | `/announcements`, `/notifications`, `/notifications/preferences`, `/resources`, `/system` | `AnnouncementController`, `NotificationController`, `NotificationPreferenceController`, `ResourceController`, `SystemController` | `GET /announcements/latest`, `GET /notifications`, `GET /notifications/unread-count`, `POST /notifications/push/subscribe`, `GET /resources`, `GET /system/parameters/public` |
| Student | `/student/**`, `/supervisors/**` | 12 controllers (dashboard, profile, supervisor directory, recommendations, supervision-requests, proposal, meetings, meeting-logs, logs, documents, deadlines, chat) | `GET /student/dashboard`, `GET /supervisors`, `GET /supervisors/{id}`, `GET /supervisors/{id}/available-slots`, `POST /student/supervision-requests`, `POST /student/proposal/submit`, `POST /student/proposal/analyze`, `POST /student/meetings`, `POST /student/meetings/{id}/respond`, `GET /student/meeting-logs/{id}/export.docx`, `POST /student/meeting-logs/{id}/sign`, `POST /student/chat` |
| Supervisor | `/supervisor/**` | 11 controllers (dashboard, profile, requests, supervisees, proposals, meetings, meeting-logs, logs, documents, announcements, availability) | `GET /supervisor/dashboard`, `POST /supervisor/requests/{id}/respond`, `PUT /supervisor/availability`, `POST /supervisor/meetings/{id}/respond`, `PATCH /supervisor/meetings/{id}/link`, `POST /supervisor/proposals/{id}/feedback`, `POST /supervisor/meeting-logs/{id}/sign`, `POST /supervisor/announcements` (multipart) |
| Committee | `/committee/**` | 7 controllers (dashboard, announcements, proposals, projects, documents, reports, cycles) | `GET /committee/dashboard`, `POST /committee/proposals/{id}/review`, `GET /committee/projects/unpaired-students`, `POST /committee/reports/generate` |
| Admin | `/admin/**` | 12 controllers (dashboard, users, cycles, deadlines, parameters, integrations, audit-logs, export-configs, maintenance, projects, jobs, roster) | `GET /admin/dashboard`, `POST /admin/users/{id}/approve`, `POST /admin/cycles/{id}/activate`, `GET /admin/audit-logs`, `POST /admin/maintenance/backup`, `POST /admin/projects/{id}/fyp1-passed`, `POST /admin/projects/fyp1-passed/import`, `POST /admin/roster/students/import` |

Five conventions hold across the entire surface:

1. **Pagination uses Spring `Pageable`** on most list endpoints. The
   announcement list and a small number of public-facing routes use
   instead a 1-indexed `page` plus an explicit `limit`, because
   Spring's default zero-indexed `page` plus `size` confused the React
   caller during the first integration pass and the explicit form is
   closer to what the UI expects.
2. **Multipart-or-JSON announcements.**
   `SupervisorAnnouncementController.create` and
   `CommitteeAnnouncementController.create` declare
   `consumes = { multipart/form-data, application/json }`, so the same
   endpoint accepts either a JSON body (no attachments) or a multipart
   envelope (announcement + files + links).
3. **Static uploads served by a `WebConfig` resource handler** mapping
   `/uploads/**` to `file:${app.file.upload-dir}/`, with `permitAll`
   in the security chain. This is what backs
   `<img src="/uploads/profiles/...">` and the announcement-attachment
   download.
4. **Audit on writes.** Every mutating admin call writes an
   `audit_log` row through `AuditService.record(...)`. The propagation
   is `REQUIRES_NEW` and the save is wrapped in `try`/`catch` so an
   audit-write failure never breaks the user-facing action.
5. **AI failures surface as HTTP 503.** When `AiServiceClient` raises
   `AiServiceUnavailableException`, the controller returns 503 to the
   frontend rather than a 200 with an empty result; the React page
   shows a "service temporarily unavailable" banner that is distinct
   from a generic 500.

### 5.6.3 JSON / XML Payload Structure

Every request and response is JSON. The system does not produce or
consume XML. Payloads follow three project-wide conventions: ISO-8601
strings for all dates and timestamps
(`spring.jackson.serialization.write-dates-as-timestamps: false`),
null fields omitted (`default-property-inclusion: non_null`), and DTO
keys mirroring the corresponding TypeScript interface in
`frontend/src/types/<role>.ts` so that the typed contract spans both
ends of the wire.

The login flow illustrates the request and response shape.
`POST /auth/login` accepts:

```json
{
  "identifier": "aisyah@student.mmu.edu.my",
  "password": "Aisyah@2024",
  "rememberMe": false
}
```

`identifier` accepts either an MMU ID or an email — `AuthService.login`
resolves both through `findByEmailOrMmuId(...)`. The response on a
successful login is:

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMiIsImVtYWlsIjoiYWlzeWFoQHN0dWRlbnQubW11LmVkdS5teSIsInJvbGUiOiJTVFVERU5UIiwiaWF0IjoxNzMyMDAwMDAwLCJleHAiOjE3MzIwODY0MDB9.<signature>",
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

`currentPhase` and `fyp1Passed` carry `@JsonInclude(NON_NULL)` and are
emitted only when the caller is a STUDENT with an attached `Project`;
for other roles they are absent rather than null. The frontend uses
this fact to gate the FYP1-result-pending screen during the post-FYP1
transition.

The student dashboard endpoint demonstrates the project's preference
for one large aggregated payload over several small ones:

```json
{
  "profile": { /* UserDto + StudentProfile fields */ },
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
  "upcomingMeetings": [/* up to five */],
  "recentLogs": [/* up to five draft logs */],
  "recentDocuments": [/* up to five */],
  "upcomingDeadlines": [/* up to five */],
  "unreadNotifications": 3
}
```

Bundling the seven dashboard fields into a single response keeps the
landing page to one network round-trip and lets the React feature
gates (`<StudentFeatureGate>`, `<RegisteredOnlyLockGate>`,
`<CycleActiveGate>`) read `cycleActive`, `supervisorAssigned`, and
`status` from the same source of truth as the dashboard widgets — a
pattern documented in Section 5.5.2.

The proposal-analysis pass-through illustrates how an internal AI
call leaves the backend looking the same as a self-contained endpoint.
The student page calls `POST /student/proposal/analyze`; the backend
assembles the proposal text plus its detected sections and posts to
the analyzer; the analyzer returns a JSON object with the four NLP
component scores, the DistilBERT-derived `overall_score`, and the
LLM-derived prose fields:

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
  "summary": "Two-to-three-sentence overall assessment from the LLM."
}
```

The backend persists the response into `proposal_check_result` and
forwards it to the React page. If the analyzer is unreachable, the
backend returns 503 instead of writing an all-zero row.

Every non-2xx response on the backend is shaped by
`GlobalExceptionHandler.buildResponse` into a uniform error envelope:

```json
{
  "timestamp": "2026-05-10T14:30:21.123",
  "status": 404,
  "error": "Not Found",
  "message": "Project not found"
}
```

Table 5.7 — Exception types and their HTTP-status mapping.

| Exception | HTTP status | Source |
|---|---|---|
| `ResourceNotFoundException` | 404 | service-layer "not found" |
| `BadRequestException` | 400 | service-layer guards |
| `ConflictException` | 409 | quota or unique-key violations |
| `BadCredentialsException` | 401 | login failure (message replaced with "Invalid credentials. Please try again.") |
| `AccessDeniedException` | 403 | URL-prefix authority mismatch |
| `ForbiddenException` | 403 | per-row ownership or cycle gate |
| `MethodArgumentNotValidException` | 400 | `@Valid` failures (concatenated as a comma-joined message) |
| `MaxUploadSizeExceededException` | 400 | multipart > 50 MB |
| `Exception` (catch-all) | 500 | logged with stack trace; client receives `<ClassName>: <message>` |

The frontend's `getApiErrorMessage()` reads `data.message` →
`data.error` → `error.message` → `"An unexpected error occurred"`, so
the same envelope feeds both the toast UI and the Axios error
fallback.

### 5.6.4 Authentication Mechanisms

The system uses **stateless JSON Web Tokens** signed with **HS256**
through the `io.jsonwebtoken:jjwt` library version 0.12.5. There is
no server-side session store, no refresh-token endpoint, and no OAuth2
flow — `POST /auth/login` issues a single bearer token which the
client carries on every subsequent request.

`JwtTokenProvider.generateToken(userId, email, role)` produces a
token with the following claims.

Table 5.8 — JWT claims emitted by `JwtTokenProvider`.

| Claim | Source | Notes |
|---|---|---|
| `sub` (subject) | `userId` as a string | Used by `JwtAuthenticationFilter` to look up the `UserAccount` |
| `email` | `user.email` | Informational only; the filter does not trust it |
| `role` | `user.role.name()` | Mirrors the `UserRole` enum |
| `iat` | now | Issued-at |
| `exp` | now + `JWT_EXPIRY_MS` | Default 86 400 000 ms (24 hours) |

`JwtAuthenticationFilter` is inserted before
`UsernamePasswordAuthenticationFilter` in the security chain. On each
request, it parses the `Authorization: Bearer <token>` header, calls
`JwtTokenProvider.validateToken(...)`, looks up the `UserAccount` by
id, and populates `SecurityContextHolder` with a
`UsernamePasswordAuthenticationToken` carrying the authority
`ROLE_<UserRole.name()>`. The filter re-reads `user.status` on every
request rather than trusting the role embedded in the token —
suspending or blocking an account therefore terminates active sessions
on their next call without waiting for the token to expire.

Three additional guards layer on top of the basic JWT contract:

- **Account-status gate.** `AuthService.login` rejects accounts whose
  status is `PENDING`, `SUSPENDED`, or `BLOCKED` with a friendly
  per-status message, and the JWT filter applies the same check on
  every authenticated request.
- **Login throttling (V27).** `user_account.login_attempts` increments
  on each failed authentication; once the threshold is reached,
  `lockout_until` is set and further attempts return a "your account
  has been temporarily locked" message until the timestamp elapses.
  Successful login resets both columns.
- **Single-use password reset (V19, V21).** `POST /auth/forgot-password`
  issues a token whose SHA-256 hash is stored in
  `password_reset_token`. The raw token is sent to the user via
  email; only the hash exists in the database, so a database read does
  not yield a usable token. `POST /auth/reset-password` consumes it,
  and `GET /auth/verify-reset-token?token=…` is a cheap pre-check used
  by the React reset page to render an "expired link" view before the
  user starts typing.

The frontend half of the contract is small. The Axios client in
`frontend/src/lib/api/client.ts` reads the token from `localStorage`
on every request and attaches it as `Authorization: Bearer <token>`.
The response interceptor catches HTTP 401, removes the cached token,
and redirects to `/session-expired` — except on the open auth pages
(`/login`, `/register`, `/forgot-password`, `/reset-password`, `/`),
so the user is never trapped in a redirect loop on a public route.
Logout is therefore stateless on the server side: `POST /auth/logout`
returns 204 and the client simply discards the token.

<!--
self-check 5.6 (rewrite, 2026-05-10)
- Existing 5.6 was a four-stub template (no prose); this is a fresh draft.
- Content covered per faculty template:
  * 5.6.1 Internal vs third-party APIs — 47 controllers + AiServiceClient
    gateway + 4 third-party integrations table.
  * 5.6.2 Endpoint catalogue — tier-by-tier table + 5 cross-cutting
    conventions.
  * 5.6.3 JSON payload shape — 4 concrete payloads (login req/res,
    dashboard, analyzer pass-through, error envelope) + exception →
    status mapping table.
  * 5.6.4 Auth mechanism — JWT claims table, filter behaviour, three
    extra guards (status gate, throttling V27, password reset V19/V21),
    frontend Axios contract.
- Drift items vs facts file: none — this is a fresh write.
- Cross-references: §5.3.1 (security config), §5.5.2 (dashboard payload),
  §5.5.3 (recommendation), §5.5.5 (proposal analyzer), §5.5.11 (chatbot),
  §5.5 (full per-controller endpoint listing).
- Tone pass:
  * British spelling: organise, behaviour, deliberately — checked.
  * AI-tells avoided: no leverage / robust / seamless / comprehensive /
    delve / "It is important to note" / "This section will explore".
  * Hedge density (may/can/could): each paragraph ≤ 2.
  * Sentence length varied; opening grammar varied across paragraphs.
  * Tables used where they help (tier inventory, third-party integrations,
    JWT claims, exception mapping) without becoming the section's
    only content.
- Outstanding: none from facts file.
-->

---

## 5.7 Network Configuration

This section describes how the system is hosted, how its host-published
ports are mapped, and how it is deployed in practice. The project has
been carried to the point where the same Compose graph that runs on the
developer workstation would lift-and-shift onto a faculty Linux server,
but the operational layer above it (HTTPS termination, domain routing,
secret management) has not been provisioned and is treated as future
work in Section 5.10.

### 5.7.1 Hosting Setup

The system has been built and tested entirely on the developer
workstation. Three runtime contexts are used during development; none
of them is a live faculty deployment.

The first context is **IDE-driven dev**: the backend is run from
IntelliJ via `mvn spring-boot:run`, the frontend via `npm run dev`
from a terminal, the three AI services via `python app.py` inside
their per-service virtual environments, and MySQL through a host
installation on `localhost:3306`. This is the everyday development
loop — fastest to iterate, but it requires the developer to start
each tier individually.

The second context is the **dev Compose stack**, started with
`docker compose up --build`. The auto-merged `docker-compose.override.yml`
swaps the production frontend for a Vite container that bind-mounts
`./frontend → /app` and runs the dev server with hot-module reload on
port 5173. Everything else — the backend, the database, the three AI
services — runs as containers exactly as they would in production.
This is the demo and integration-testing setup.

The third context is the **production-style Compose stack**. Renaming
or deleting `docker-compose.override.yml` causes Compose to load only
the base file; the frontend then runs as `nginx:alpine` serving the
prebuilt static SPA on port 80, mapped to host port 3000. This is the
dress-rehearsal for a faculty deployment, but it still runs on the
developer workstation.

The host operating system is **Windows 11 Home Single Language (build
10.0.26200)**; every long-running service runs inside a Linux
container. The base images are `eclipse-temurin:17-jre` for the
backend, `nginx:alpine` and `node:20-alpine` for the frontend,
`python:3.11-slim` for the three AI services, and the official
`mysql:8` image for the database. The Compose stack is therefore
tier-Linux on a Windows host, and a move to a faculty Linux server
would not require any application-level changes — the same
`docker-compose.yml` would run unmodified, with the host environment
supplying overrides through shell variables or a sibling `.env`
file.

### 5.7.2 Port Configuration

Six containers expose host-published ports after the Compose merge,
each binding chosen for a specific reason.

Table 5.9 — Host-published ports across the Compose stack.

| Host port | Container port | Service | Notes |
|---|---|---|---|
| **3000** | 80 | `frontend` (production nginx) | Replaced by `5173 → 3000` when the dev override is active |
| **5173** | 3000 | `frontend` (Vite dev container, when override is active) | The override marks its `ports` list with Compose's `!override` directive so the dev mapping replaces the production mapping rather than merging with it |
| **8080** | 8080 | `backend` (Spring Boot) | Context path is `/api`, so live URLs are `http://host:8080/api/...` |
| **3307** | 3306 | `db` (MySQL 8) | Host port 3307 is chosen so the container does not clash with a local MySQL on 3306 — a common state on the developer machine |
| **5001** | 5001 | `ai-recommendation` | Flask + gunicorn |
| **5002** | 5002 | `ai-proposal-analyzer` | Flask + gunicorn |
| **5003** | 5003 | `ai-chatbot` | Flask + gunicorn |

Internal addressing inside the user-defined bridge network
`fyp-network` uses the Compose service names. The backend reaches the
AI services as `http://ai-recommendation:5001`,
`http://ai-proposal-analyzer:5002`, and `http://ai-chatbot:5003`, and
the database as
`jdbc:mysql://db:3306/fyp_supervision?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC`.
The browser, by contrast, reaches the backend through the
host-published port — the API base URL is baked into the production
bundle at build time via the `VITE_API_BASE_URL` build argument and is
provided through Vite's proxy in development. This split keeps the
frontend container free of any backend-discovery logic.

The CORS allowlist in `CorsConfig.java` covers exactly the two
front-facing host ports — `http://localhost:3000` (production
frontend) and `http://localhost:5173` (dev override) — with
credentials enabled and a 3600-second preflight cache. Without the
second origin, the dev override would fail CORS the moment a
developer hot-reloaded the SPA, which is why both are listed.

The same env-driven mapping decouples the backend from local-IDE dev:
the same JAR works against `http://localhost:5001-5003` (when the AI
services are run from a venv on the host) and against
`http://ai-recommendation:5001-5003` (inside Compose) without any
code change.

### 5.7.3 Deployment to Server or Live Environment

The project does not currently target a live faculty server. The
deployment story is therefore in two parts: the local Compose
deployment that does exist, and the CI verification pipeline that
guards every push.

**Local Compose deployment.** A single `docker compose up --build`
command performs every step needed to stand up the full stack on the
developer workstation:

1. Compose builds the backend, the frontend (or `Dockerfile.dev` when the override is in place), and the three AI images.
2. The `db` service starts; the `mysqladmin ping` health check loops every 10 seconds with five retries until MySQL is accepting connections.
3. The `backend` starts (`depends_on: db: service_healthy`); on first boot Flyway scans `classpath:db/migration` and applies V1 through V28 plus V30 through V39 in order (V29 was skipped). Subsequent boots only apply newly added scripts.
4. The three AI services start in parallel — there is no health gate on them, since the backend tolerates a slow start through the `AiServiceClient` 503 path described in Section 5.6.1.
5. The `frontend` starts (`depends_on: backend`). With the override present, Vite serves the bind-mounted source with hot-module reload; without the override, nginx serves the prebuilt static bundle.

Tearing down with `docker compose down` stops the containers but
preserves the named volumes (`mysql_data`, `upload_data`,
`recommendation_models`, `analyzer_models`, `chatbot_vector_store`).
A clean slate requires `docker compose down -v`.

**Continuous integration.** A single GitHub Actions workflow at
`.github/workflows/ci.yml` runs on every push to any branch and on
every pull request targeting `main`. Concurrency is grouped by ref
so a newer commit cancels the in-flight run. Two jobs run in
parallel on `ubuntu-latest`.

Table 5.10 — CI jobs and their steps.

| Job | Steps |
|---|---|
| `Backend (mvn test)` | `actions/checkout@v4` → `actions/setup-java@v4` (JDK 17 Temurin, Maven cache) → `mvn -B -ntp test` in `backend/`. On failure, `backend/target/surefire-reports/` is uploaded as an artefact for triage. |
| `Frontend (build + lint)` | `actions/checkout@v4` → `actions/setup-node@v4` (Node 20, npm cache keyed on `frontend/package-lock.json`) → `npm ci` → `npm run lint` (a hard gate per the project's `--max-warnings 0` policy) → `npm run build` (Vite-only; `tsc` was deliberately removed, but Vite still type-checks JSX and surfaces unresolved imports). |

The pipeline is verification-only. There is no deployment job, no
`docker push`, no SSH step, no artefact promotion to a server. This
was a deliberate choice: stashing production credentials in GitHub
Actions secrets when there is no production target would create
exposure for no operational benefit. CI confirms that the code
compiles, tests pass, and lint is clean; physical deployment remains
manual.

**What a faculty-server deployment would still require.** Several
operational concerns sit outside the FYP2 implementation scope and
are listed here for completeness — none of them is in the repository
today:

- A reverse proxy (nginx, Caddy, or Traefik) terminating HTTPS in front of the backend and the static frontend bundle, typically bound to a faculty subdomain.
- A real TLS certificate (for example, via Let's Encrypt and `certbot`).
- Production-grade secrets — `JWT_SECRET`, `MAIL_USERNAME` / `MAIL_PASSWORD`, `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY`, and at least one LLM API key — supplied through the host's environment or a secret manager rather than committed to the repository.
- A `docker-compose.prod.yml` overlay that pins image tags rather than rebuilding from source, removes the dev override, and hardens the database (no host port exposure, restricted credentials).
- Scheduled backups of the `mysql_data` and `upload_data` volumes.
- Log shipping to a centralised collector if more than one host is involved.

These items are revisited in Section 5.10 as future work. The
project deliberately stops at the point where the same Compose graph
would lift-and-shift onto such an environment, with the operational
layer above it left empty.

<!--
self-check 5.7 (rewrite, 2026-05-10)
- Existing 5.7 was a three-stub template (no prose); this is a fresh draft.
- Honest framing: the report does not invent a live faculty deployment.
  Local Compose + CI verification only. The "what production would need"
  block makes this an explicit choice and routes follow-up to 5.10.
- Content covered per faculty template:
  * 5.7.1 Hosting setup — three runtime contexts (IDE-dev, dev Compose,
    production-style Compose); host OS + container base images.
  * 5.7.2 Port configuration — full host-published port table with the
    3307 (avoid local MySQL) and 5173 (Vite override) quirks; internal
    Compose-name addressing; CORS dual-origin tied to the two host ports.
  * 5.7.3 Deployment process — local Compose boot sequence (steps 1–5);
    CI verification matrix (backend mvn test, frontend lint+build, no
    deploy job); explicit list of what a faculty-server deployment would
    still need.
- Tone pass:
  * British spelling: organise, behaviour, deliberately, centralised.
  * AI-tells avoided: no leverage / robust / seamless / comprehensive /
    delve / "It is important to note" / "This section will explore".
  * Hedge density (may/can/could): each paragraph ≤ 2.
  * Sentence length varied; opening grammar varied across paragraphs.
  * Tables used for the port mapping and the CI matrix; flowing prose
    elsewhere.
- Cross-references: §5.1 (compose stack), §5.6.1 (AiServiceClient 503
  path), §5.10 (future work — production hardening).
- Outstanding: none from facts file.
-->

---

## 5.8 Security Measures

This section describes the security controls that the implementation
puts in place: input validation at the wire and at the service layer,
encryption and hashing for the four classes of secret the system
holds, the URL-prefix and per-row mechanisms that enforce role-based
access, and the error-handling and logging conventions that make
suspicious behaviour visible without leaking information through the
HTTP response. Items that the implementation deliberately does not
provide — primarily HTTPS termination — are stated plainly and
deferred to Section 5.10.

### 5.8.1 Input Validation, Encryption, HTTPS Configuration

**Bean Validation on every DTO.** Spring Boot's
`spring-boot-starter-validation` is enabled across all controllers,
and every controller method that accepts a body applies `@Valid` to
the DTO. Failures throw `MethodArgumentNotValidException`, which the
global exception handler converts into HTTP 400 with a comma-joined
list of field error messages. `RegisterRequest` carries the
strictest contract.

Table 5.11 — `RegisterRequest` field-level validation constraints.

| Field | Constraint |
|---|---|
| `role` | `@NotBlank` |
| `fullName` | `@NotBlank` and `@Size(max = 200)` |
| `mmuId` | `@NotBlank` and `@Pattern(regexp = "^\\d{10}$")` — exactly 10 digits |
| `email` | `@NotBlank`, `@Email`, and `@Pattern(regexp = "^[A-Za-z0-9._%+-]+@(student\\.mmu\\.edu\\.my\|mmu\\.edu\\.my)$")` |
| `password` | `@NotBlank` and `@Size(min = 8, max = 100)` |
| `specialisation` | `@Size(max = 200)` (student-only) |
| `intakeYear` | optional `Integer` (student-only) |

`AuthService.register` adds a service-layer pairing check on top of
the email regex: students must use `@student.mmu.edu.my` and
supervisors must use `@mmu.edu.my` (and not the student subdomain).
This is defence in depth — the regex alone permits either subdomain
for either role, but the service rejects mismatched pairings before a
row is written. Other auth DTOs (`LoginRequest`, `ChangePasswordRequest`,
`ForgotPasswordRequest`, `ResetPasswordRequest`,
`UpdateProfileRequest`) follow the same shape, with `@NotBlank` on
required fields and `@Size`/`@Email`/`@Pattern` where the field's
contract requires them.

**File upload validation.** `FileStorageService.storeFile(file,
entity, userId)` is the single entry point for multipart writes and
applies three guards:

1. **Path-traversal rejection.** The cleaned filename is rejected if
   it contains `..` (`if (originalFilename.contains("..")) throw new BadRequestException("Invalid file path.");`).
2. **UUID-prefixed storage name.** The on-disk file is written as
   `<UUID>-<originalFilename>`, so two uploads of the same name from
   the same user never collide and the URL cannot be guessed from the
   original name.
3. **Per-entity, per-user directory.** Files land under
   `uploads/<entity>/<userId>/<storedFilename>` — the configured root
   is established by `FileStorageConfig.@PostConstruct`, which calls
   `Files.createDirectories(...)` on boot.

The Spring multipart limits in `application.yml` are
`max-file-size: 50MB` and `max-request-size: 50MB`. Exceeding either
raises `MaxUploadSizeExceededException`, which the global handler maps
to HTTP 400 with the message "File size exceeds the maximum allowed
size."

**Database-side validation.** Two layers of database constraints back
the application checks. `UNIQUE` business-key constraints on
`user_account.mmu_id`, `user_account.email`, `fyp_cycle.cycle_code`,
`system_parameter.param_key`, `password_reset_token.token_hash`,
`push_subscription.endpoint`, and the composite `(cycle_id,
student_user_id)` on `project` (introduced in V24) catch concurrent
duplicates that the application's pre-checks miss. `ENUM` columns on
`user_account.role`, `user_account.status`, `proposal.status`,
`meeting.status`, `meeting_log.status`, `supervisor_request.status`,
`fyp_cycle.status`, `project.status`, and `announcement.status`
reject inserts of unknown values before the row reaches Hibernate's
persistence cache.

**Encryption and hashing.** Four classes of secret are held by the
system, each with a different algorithm.

Table 5.12 — Encryption and hashing across the four secret classes.

| Material | Algorithm | Where |
|---|---|---|
| User passwords | BCrypt at default cost 10 | `BCryptPasswordEncoder` bean in `SecurityConfig`; written by `AuthService.register` and `AuthService.changePassword`; verified by `AuthService.login` |
| JWT signature | HMAC-SHA256 (HS256) | `JwtTokenProvider` via `Keys.hmacShaKeyFor(secret.getBytes(UTF_8))`; secret read from `JWT_SECRET` env var |
| Password reset tokens | SHA-256 (only the hex hash is stored) | `AuthService.forgotPassword` generates a `SecureRandom` token, sends the raw value via email, persists the SHA-256 hex hash in `password_reset_token.token_hash` (UNIQUE) |
| Meeting log signatures | SHA-256 of the PNG bytes | `MeetingLogService` writes `signature_sha256 VARCHAR(64)` alongside `signature_image_url` so a verifier can later detect post-hoc image substitution |
| Web Push payload signing | VAPID (ECDSA on P-256) | `nl.martijndwars:web-push 5.1.1` + `bouncycastle:bcprov-jdk18on 1.78`; keys from `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY`; off by default |

A password-reset token therefore never lives in the database in a
usable form: the user holds the raw value (in their email), and the
database holds only its SHA-256 hex hash.

**HTTPS configuration.** All in-stack traffic is plain HTTP because
every container runs on `localhost`. The implementation does not
configure TLS at the application layer — a faculty deployment would
terminate HTTPS at a reverse proxy in front of nginx, as discussed in
Section 5.7.3 and revisited in Section 5.10. Within the current
Compose stack, the development browser, the React build, the Spring
backend, and the three Flask AI services all communicate over plain
HTTP on the bridge network `fyp-network`.

### 5.8.2 Role-Based Access Control (RBAC)

The RBAC implementation has two complementary layers. URL-prefix
routing decides who can hit an endpoint; per-row ownership checks
decide which row of the resource they can act on. Account-status
guards and the V27 login throttle sit alongside both.

**URL-prefix routing — primary mechanism.**
`SecurityConfig.securityFilterChain` declares the routing once. The
authority required for each prefix is repeated here from Section
5.3.1 because it is the single most important access control in the
system.

Table 5.13 — URL-prefix authority required by `SecurityConfig`.

| URL prefix | Authority required |
|---|---|
| `/auth/register`, `/auth/login`, `/auth/forgot-password`, `/auth/reset-password`, `/auth/verify-reset-token`, `/announcements/latest`, `/system/parameters/public`, `/uploads/**` | permitAll |
| `/admin/**` | `SYSTEM_ADMIN` |
| `/committee/**` | `FYP_COMMITTEE` |
| `/supervisor/**` | `SUPERVISOR` |
| `/student/**` | `STUDENT` |
| `/supervisors/**` | `STUDENT` (student-facing supervisor directory) |
| Everything else | authenticated |

Adding a controller to `controller/admin/` therefore restricts it to
`SYSTEM_ADMIN` automatically, with no per-method `@PreAuthorize`
required for the role check. `@EnableMethodSecurity` is enabled in
the configuration, but `@PreAuthorize` is reserved for the per-row
ownership checks described below.

**JWT filter pipeline.** `JwtAuthenticationFilter` extends
`OncePerRequestFilter` and is inserted before
`UsernamePasswordAuthenticationFilter`. On each request it parses
`Authorization: Bearer <token>`, calls
`tokenProvider.validateToken(jwt)`, extracts the `sub` claim as the
user id, calls `userDetailsService.loadUserById(userId)` to load the
live `UserAccount`, and populates `SecurityContextHolder` with a
`UsernamePasswordAuthenticationToken` carrying a single
`SimpleGrantedAuthority` whose value is the bare `UserRole` name (for
example `SYSTEM_ADMIN`, with no `ROLE_` prefix). The matchers in
`SecurityConfig` use `hasAuthority(...)` accordingly.

`UserDetailsServiceImpl.buildUserDetails` constructs a Spring `User`
with `enabled = (status == ACTIVE)`, so a status flip from `ACTIVE`
to `SUSPENDED` or `BLOCKED` blocks the next request even though the
JWT in the user's browser is still cryptographically valid. The
filter loads the user record on every request rather than trusting
the role embedded in the token — a deliberate trade against the
slight database cost so that suspension and blocking take effect
immediately.

**Per-row ownership — secondary mechanism.** Two services
encapsulate the per-row checks that the URL prefix cannot express.

Table 5.14 — Per-row ownership helpers.

| Service | Method | Throws |
|---|---|---|
| `SupervisorAccessService` | `requireOwnRequest`, `requireOwnProject`, `requireOwnProposal`, `requireOwnMeeting`, `requireOwnLog` | `ForbiddenException("You can only access your own X.")` |
| `StudentService` | `getMeetingDto(userId, meetingId)`, `getLogDto(userId, logId)` | `ForbiddenException` |

These checks were added during the test-and-fix sweep that closed
the cross-supervisor and cross-student data leaks recorded in the
audit log.

**Per-cycle write-block.**
`StudentAccessService.requireActiveCycle(userId)` is called at the
top of every student write endpoint (proposals, meetings, meeting
logs, documents, supervision requests). It throws `ForbiddenException`
with a user-facing message when `Project.cycle.status` is `COMPLETED`
or `ARCHIVED`. Reads stay open. The frontend reads `cycleActive`
from the dashboard payload and renders `LockedFeaturePage` rather
than firing the request, so the 403 acts as the safety net rather
than the primary user-experience touchpoint.

**Account-status enforcement is layered three deep.**
`AuthService.login` rejects `PENDING`, `SUSPENDED`, and `BLOCKED`
with a friendly per-status message; `UserDetailsServiceImpl`
short-circuits the request through the Spring `enabled` flag for any
non-`ACTIVE` status; and the JWT filter re-loads the user on every
request. The combination ensures that an administrator's status flip
takes effect on the user's next call without waiting for the token
to expire.

**Login throttling (V27).** `AuthService.login` is annotated
`@Transactional(noRollbackFor = { BadCredentialsException.class, BadRequestException.class })`
so that the failed-attempt increment survives the thrown exception
that would otherwise roll back the transaction. The constants are
inlined in the service:

```java
private static final int MAX_FAILED_LOGIN_ATTEMPTS = 5;
private static final int LOCKOUT_WINDOW_MINUTES = 15;
```

On a failed password match, the service increments `loginAttempts`
and audit-records `LOGIN_FAILURE`. When the counter reaches the
threshold, it resets to zero, sets `lockoutUntil = now() + 15 min`,
and records `LOGIN_LOCKOUT_TRIGGERED`. Subsequent attempts during
the lockout window short-circuit with the message "Account
temporarily locked after too many failed attempts. Try again in N
minutes." and an audit entry of `LOGIN_REJECTED_LOCKED`. A
successful login resets both columns.

**Frontend half of the contract.** The Axios client in
`frontend/src/lib/api/client.ts` reads the JWT from `localStorage` on
every request and attaches it as `Authorization: Bearer <token>`.
The response interceptor catches HTTP 401, removes the cached token,
and redirects to `/session-expired` — except on the open auth pages
(`/login`, `/register`, `/forgot-password`, `/reset-password`, `/`),
so the user is never trapped in a redirect loop on a public route.

### 5.8.3 Error Handling and Logging

**Uniform error envelope.** Every non-2xx response on the backend is
shaped by `GlobalExceptionHandler.buildResponse` into the same JSON
object:

```json
{
  "timestamp": "2026-05-10T14:30:21.123",
  "status": 404,
  "error": "Not Found",
  "message": "Project not found"
}
```

Table 5.15 — Exception → HTTP status, with handler notes on
disclosure-avoidance rewrites.

| Exception | HTTP status | Handler note |
|---|---|---|
| `ResourceNotFoundException` | 404 | Service-layer "not found" |
| `BadRequestException` | 400 | Service-layer guards |
| `ConflictException` | 409 | Quota or unique-key violations |
| `BadCredentialsException` (Spring) | 401 | Message replaced with "Invalid credentials. Please try again." so the response cannot disclose which of {user exists, password wrong} was true |
| `AccessDeniedException` (Spring) | 403 | URL-prefix authority mismatch; message replaced with the generic "You do not have permission to perform this action." so the response cannot disclose which role the route required |
| `ForbiddenException` | 403 | Per-row ownership or cycle gate; the original message is preserved because it is intended to be user-facing |
| `MethodArgumentNotValidException` | 400 | Field error messages joined with ", " |
| `MaxUploadSizeExceededException` | 400 | Multipart > 50 MB |
| `Exception` (catch-all) | 500 | Stack trace logged at ERROR; client receives `<ClassName>: <message>` so the React toast can show something useful |

The frontend's `getApiErrorMessage()` reads `data.message` →
`data.error` → `error.message` → `"An unexpected error occurred"`,
so the same envelope feeds both the toast UI and the Axios error
fallback.

**Application logging.** Logging uses Logback through Spring Boot's
default starter, with the SLF4J facade exposed by Lombok's `@Slf4j`
annotation on every service, filter, and handler. The baseline in
`application.yml` is:

```yaml
logging:
  level:
    com.fyp.supervision: INFO
    org.springframework.security: INFO
```

The `dev` profile (`application-dev.yml`) bumps both loggers to
`DEBUG` and flips `spring.jpa.show-sql: true` so every Hibernate query
is echoed to the log.

What is logged: authentication failures (`log.warn` in
`JwtTokenProvider.validateToken` for invalid JWTs and `log.error` in
`JwtAuthenticationFilter` for unhandled exceptions during
authentication), AI-service outages (`log.warn` in `AiServiceClient`
for each transport failure), audit-write failures (`log.warn` in
`AuditService`), and unhandled controller exceptions (`log.error` with
the full stack trace from the global handler). What is *not* logged:
raw passwords, JWT contents, password-reset tokens (only their SHA-256
hex hash exists in the database, and even the hash is not written to
log), and signature image bytes.

**Audit log.** `AuditService` is the single entry point for
`audit_log` writes:

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

Three behaviours are worth noting. The propagation is `REQUIRES_NEW`
so the audit write runs in its own transaction and the user-facing
action is not rolled back when the audit pipeline fails; the `try`/`catch`
swallows any audit-side failure with a `WARN` log line for the same
reason. The `clientIp(...)` helper honours `X-Forwarded-For` (first
hop only), so the IP captured behind a reverse proxy is the original
client rather than the proxy. Action codes follow a stable
SCREAMING_CASE convention — examples seen in the codebase include
`LOGIN_SUCCESS`, `LOGIN_FAILURE`, `LOGIN_LOCKOUT_TRIGGERED`,
`LOGIN_REJECTED_LOCKED`, `USER_APPROVED`, `USER_REJECTED`,
`CYCLE_ACTIVATED`, and `FYP1_PASS_SET` — so downstream filtering
groups by `action` cleanly. A `recordAnonymous(...)` overload covers
pre-authentication events (notably failed logins where no
`UserAccount` is yet attached to the security context), and an
`@Async recordAsync(...)` variant is available for hot paths where
audit latency matters.

The admin audit page (`GET /admin/audit-logs`, served through
`AdminAuditLogController` and rendered by `pages/admin/AuditLogs.tsx`)
exposes the trail to administrators, with the compound index
`(entity_name, entity_id)` covering its filter dropdowns.

<!--
self-check 5.8 (rewrite, 2026-05-10)
- Existing 5.8 was a three-stub template (no prose); this is a fresh draft.
- Content covered per faculty template:
  * 5.8.1 Input validation, encryption, HTTPS — Bean Validation table for
    RegisterRequest, service-layer pairing check, file upload guards (3),
    DB UNIQUE/ENUM defence in depth, encryption-and-hashing table covering
    the four secret classes + VAPID, explicit "HTTPS not configured" with
    forward reference to 5.7.3 / 5.10.
  * 5.8.2 RBAC — URL-prefix table + JWT filter pipeline (with bare-name
    authority quirk) + UserDetailsServiceImpl.enabled gate + per-row
    ownership trio + per-cycle write-block + three-layer status guard +
    login throttling (V27 with noRollbackFor explanation) + frontend
    Axios contract.
  * 5.8.3 Error handling and logging — uniform error envelope, exception
    -> status table with the disclosure-avoidance notes on 401 and 403,
    Logback INFO baseline + dev DEBUG + show-sql, what is and is not
    logged list, AuditService code excerpt with the three behavioural
    notes (REQUIRES_NEW, X-Forwarded-For, SCREAMING_CASE actions).
- Cross-references: §5.3.1 (security config table), §5.5.4 (per-row
  ownership origin), §5.7.3 (HTTPS termination), §5.10 (production
  hardening as future work), §5.4.1 (UNIQUE / ENUM columns), V27 / V19 /
  V21 migrations.
- Tone pass:
  * British spelling: organise, behaviour, deliberately, centralised.
  * AI-tells avoided: no leverage / robust / seamless / comprehensive /
    delve / "It is important to note" / "This section will explore".
  * Hedge density (may/can/could): each paragraph ≤ 2.
  * Sentence length varied; opening grammar varied across paragraphs.
  * Tables placed where they help (DTO contract, encryption, URL prefix,
    per-row ownership, exception mapping); flowing prose elsewhere.
- Outstanding: none from facts file.
-->

---

## 5.9 Challenges Encountered and Solutions

The implementation surfaced a number of concrete technical
problems, each of which shaped the final design and carries a
transferable lesson. Five are covered here, chosen to span the
project's main risk areas: the authorisation model, the cross-tier
contract between the React frontend and the Spring backend, the
Spring transaction model, the honesty of the three AI services, and
the host-environment quirks of running a Linux container stack on a
Windows workstation. Each challenge in 5.9.1 maps to the matching
solution in 5.9.2 by number.

### 5.9.1 Challenges Encountered

**Challenge 1 — Authorisation bypass on by-id endpoints.** End-to-end
sweep testing revealed that several `GET /<role>/<resource>/{id}`
endpoints loaded the target row without checking that the requesting
user owned it. A student could read another student's meeting log
by guessing the id, and a supervisor could read a request directed
at a different supervisor. The URL-prefix authority routing in
`SecurityConfig` had granted the right *role* the right *to call*
the endpoint, but it could not express the row-level "and only when
this row belongs to you" predicate that the per-resource access rule
actually required.

**Challenge 2 — Cross-tier contract drift between React and Spring.**
The frontend, the Spring backend, and the three Flask AI services
evolved at different speeds, and a class of subtle integration
defects appeared at the seams. Two examples stand out. First,
`GET /announcements?page=1&limit=10` returned an empty list because
Spring's default `Pageable` resolver expects zero-indexed `page` plus
`size`, while the React caller was sending one-indexed `page` plus
`limit`; Spring silently rendered "page index 1 with the default
page size" instead of erroring. Second,
`AnnouncementService.listForStudent` originally paginated the
`PUBLISHED` rows and then applied the per-student audience filter,
producing a page that reported `total = 10` but rendered only the
four cards that survived the filter.

**Challenge 3 — Spring transaction rollback discarded the
login-throttle counter.** Login throttling was added in V27 with two
new columns, `login_attempts` and `lockout_until`, and matching
service-level logic that increments the counter on each failed
authentication and locks the account at five failures. In the first
implementation the counter never advanced past one, and the lockout
threshold was unreachable. The cause sat at the intersection of
Spring and Hibernate: `AuthService.login` is `@Transactional`, and
on a failed password match it incremented `loginAttempts` and then
threw `BadCredentialsException`. Spring's default rollback policy
treats every `RuntimeException` as a rollback signal, which discarded
the increment together with the exception.

**Challenge 4 — AI services were reporting signals the runtime did
not actually compute.** Two of the AI services carried an
uncalibrated component. The recommender reported a "match accuracy"
number based on synthetic XGBoost training data with no calibration
against real student-supervisor pairings, and the chatbot used a
small local Flan-T5 model whose paraphrased answers were judged
shallow. In each case the user interface displayed the number as if
it were a real signal, which risked misleading both students and
supervisors during academic decisions.

**Challenge 5 — Windows-host quirks of the AI and frontend
toolchains.** The development workstation runs Windows 11 with JDK 25
and a Linux-container backend, and several toolchain combinations
that work on a "clean" Linux host fail on this configuration.
PyTorch 2.10.x raises a Windows DLL initialisation error on import.
Lombok versions before 1.18.42 fail under JDK 25's annotation
processor. The Vite dev server, when run inside a container with the
host source bind-mounted, does not pick up file changes because
Windows-mounted volumes do not propagate `inotify` events. None of
these are project bugs, but each would have stalled development if
not addressed.

### 5.9.2 Solutions

**Solution 1 — Centralised per-row ownership service.** Per-row
ownership checks were extracted into a small set of service-layer
helpers. `SupervisorAccessService` exposes five methods
(`requireOwnRequest`, `requireOwnProject`, `requireOwnProposal`,
`requireOwnMeeting`, `requireOwnLog`), each of which loads the
target row and throws `ForbiddenException("You can only access your
own X.")` when the supervisor on the row does not match the
authenticated user. The student side took the same shape through
`StudentService.getMeetingDto(userId, meetingId)` and
`StudentService.getLogDto(userId, logId)`. The previously-vulnerable
controllers were rewired to call these helpers as the first
statement in the handler. The lesson — that URL-prefix routing
guards the role and per-row checks guard the row — became the
two-layer RBAC model documented in Section 5.8.2.

**Solution 2 — Explicit pagination contract and filter-then-paginate
ordering.** The pagination drift was fixed by replacing the
`Pageable` binding on the affected endpoints with explicit
`@RequestParam("page")` and `@RequestParam("limit")`, then building
`PageRequest.of(safePage - 1, safeLimit)` inside the controller; the
frontend's one-indexed convention is preserved on the wire, and the
zero-indexed conversion happens in one place. The filter-ordering
defect was fixed by rewriting `AnnouncementService.listForStudent`
to load every `PUBLISHED` row, apply the audience filter in memory,
and only then slice the result. The implementation comment notes the
trade-off: cycle-volume of announcements is small enough that a full
load is acceptable, and a JPQL predicate becomes worthwhile only if
the volume grows. Both fixes are visible in commits `c3282dd` and
`69b59a7`.

**Solution 3 — `noRollbackFor` on the login transaction.**
`AuthService.login` was annotated
`@Transactional(noRollbackFor = { BadCredentialsException.class, BadRequestException.class })`
so that the failed-attempt increment commits even though the
exception escapes the method. The same annotation also keeps the
`LOGIN_FAILURE` and `LOGIN_LOCKOUT_TRIGGERED` audit-log writes alive
across the thrown exception. A PowerShell verifier script
(`scripts/verify_throttle.ps1`) now exercises the throttle
end-to-end against the live HTTP API and confirms that the counter
reaches the threshold and that the lockout window is honoured. The
lesson — that throwing inside a `@Transactional` method silently
discards every state change in the same transaction unless the
exception is listed in `noRollbackFor` — is documented inline in the
`AuthService` source.

**Solution 4 — Replace fake signals with honest, defensible ones.**
Each affected AI component was rewritten to compute only what it
could defend. The recommender's XGBoost path was deleted in favour
of a deterministic five-component weighted score (semantic, interest
jaccard, skill jaccard, programme, availability) whose explanation
card lists the components that contributed to the rank, and the
embedding model was upgraded from `all-MiniLM-L6-v2` to
`BAAI/bge-base-en-v1.5` (768-dim) so that recent supervised project
titles also feed the semantic comparison.
The chatbot's local Flan-T5 path was demoted to opt-in via
`USE_LOCAL_GEN=false`, and an OpenAI-compatible client was wired in
with provider precedence `LLM_API_KEY → GROQ_API_KEY →
OPENAI_API_KEY`; reported confidence is now `top1_cosine ×
multiplier_per_path` rather than a hard-coded constant, and an
out-of-scope cut-off at top-1 cosine 0.30 prevents the model from
hallucinating on unrelated questions. AI-service unavailability now
propagates as HTTP 503 through `AiServiceClient` rather than as a
silent zero-score row, so an outage is visible to the user as a
"service temporarily unavailable" banner rather than as a misleading
empty result.

**Solution 5 — Pin versions, swap to a CPython venv, and turn on
polling-watch.** Each Windows-host quirk was addressed at the
narrowest possible layer. `torch==2.5.1` is pinned in both
`ai-proposal-analyzer/requirements.txt` and
`ai-chatbot/requirements.txt`, with the reason recorded in the
project CLAUDE.md so the pin is not removed by a casual upgrade.
Lombok is pinned to 1.18.42 in `pom.xml` and registered explicitly
in the `maven-compiler-plugin`'s `<annotationProcessorPaths>` block,
so the build picks up the JDK 25-compatible annotation processor.
Heavy ML wheels (`torch`, `faiss-cpu`) are installed into a clean
CPython 3.12 virtual environment per service for offline training,
because the MSYS2 Python that ships with Git Bash on Windows lacks
the C toolchain to build them; inside Docker the same wheels come
prebuilt for `python:3.11-slim`. The Vite hot-reload defect was
solved by setting `VITE_USE_POLLING=true` in
`docker-compose.override.yml` and reading it inside `vite.config.ts`
as `watch: { usePolling: process.env.VITE_USE_POLLING === 'true', interval: 300 }`.
None of these is a heroic fix on its own, but together they made
the development loop fast enough to keep iterating.

<!--
self-check 5.9 (rewrite, 2026-05-10)
- Existing 5.9 was a two-stub template; this is a fresh draft.
- Sourcing rule honoured: every challenge is grounded in the
  Challenges-5.9 facts file, which itself cites real commits and
  migrations. No fabricated challenges.
- Five challenge-and-solution pairs, numbered 1-5 for direct
  cross-reference between 5.9.1 and 5.9.2:
  1. Authorisation bypass → SupervisorAccessService + StudentService
     ownership helpers (Categories C1+C2).
  2. Cross-tier contract drift → explicit pagination + filter-then-
     paginate (Categories A1+A2).
  3. Login-throttle increment lost to rollback → noRollbackFor
     (Category B1).
  4. Fake AI signals → deterministic recommender, chatbot generator
     demotion (Categories D2+D3+D4).
  5. Windows-host quirks → torch/Lombok pin, CPython venv, polling
     watch (Categories F1+F2+F3+F4).
- Cross-references: Section 5.6 (pagination convention), Section
  5.5.3 (recommender), Section 5.5.5 (analyzer), Section 5.5.11
  (chatbot), Section 5.8.2 (per-row ownership and login throttling),
  V27 / V31 migrations.
- Tone pass:
  * British spelling: organise, behaviour, deliberately, centralised.
  * AI-tells avoided: no leverage / robust / seamless / comprehensive /
    delve / "It is important to note" / "This section will explore".
  * Hedge density (may/can/could): each paragraph ≤ 2.
  * Sentence length varied; opening grammar varied across paragraphs.
  * Bold sub-headings on each item provide scannable structure
    without flattening the prose into a list.
- Outstanding: none. The 5.9 facts file holds eight further
  candidate items (categories E, G, H, plus the rest of A/B/D/F)
  if more breadth is wanted later.
-->

---

## 5.10 Summary

This chapter has documented how the FYP Supervision System was
built: the deployment shape and development environment (Sections
5.1 and 5.2), the configuration of each tier (5.3), the relational
schema (5.4), the eleven feature modules (5.5), the API surface and
integration boundary (5.6 and 5.7), the security controls (5.8), and
the technical challenges that shaped the final design (5.9).
Chapter 6 covers testing; Chapter 7 closes with a reflection on the
project as a whole.

### Alignment with the design

The implementation tracks the four-subsystem decomposition presented
in Section 4.1 closely. The student subsystem (4.1.1) maps to eleven
`/student/**` controllers plus the `/supervisors/**` directory, the
supervisor subsystem (4.1.2) to the eleven `/supervisor/**`
controllers, the FYP committee subsystem (4.1.3) to the seven
`/committee/**` controllers, and the system administrator subsystem
(4.1.4) to the twelve `/admin/**` controllers. Each subsystem owns
the same workflow it owned at design time, and the URL-prefix
authority routing in `SecurityConfig` enforces the boundary at the
HTTP layer rather than scattering role checks through method
annotations.

Three AI services were specified in Chapter 4 — supervisor
recommendation, proposal analysis, and the FYP chatbot — and three
Flask services have been implemented at ports 5001, 5002, and 5003,
mediated through the backend's `AiServiceClient` so that the React
frontend never opens a connection to them directly. The three
algorithms have shifted in form during implementation: the
recommender is now a deterministic five-component weighted score
rather than the XGBoost regression sketched in the design, the
proposal analyzer adds a chunk-and-average pass over a fine-tuned
DistilBERT regression head on top of the rule-based NLP layer, and
the chatbot defaults to a remote OpenAI-compatible LLM with the local
Flan-T5 path retained as an opt-in fallback. Each shift was
explained in the matching subsection of 5.5 and was driven by
honesty about what the runtime can defensibly compute.

The relational schema in Section 5.4 follows the third-normal-form
design committed to in Section 4.4 (the data dictionary), implemented
across thirty-eight Flyway migrations under
`backend/src/main/resources/db/migration/`. The thirty-eight tables
map one-to-one onto the thirty-eight JPA entities under
`com.fyp.supervision.entity`, with `spring.jpa.hibernate.ddl-auto:
validate` keeping the entity model and the live schema in lock-step
on every backend boot.

### Pending and future improvements

Several items sit outside the FYP2 implementation scope and are
listed here as a direct handoff for any continuation of the project.

**Operational deployment.** The system has been built and tested on
the developer workstation through Docker Compose. A faculty-server
deployment would still need a reverse proxy terminating HTTPS, a
real TLS certificate bound to a faculty domain, production secrets
supplied through a secret manager rather than a sibling `.env` file,
a `docker-compose.prod.yml` overlay that pins image tags and hardens
the database, scheduled backups for the `mysql_data` and
`upload_data` named volumes, and centralised log shipping. None of
these are in the repository today; the project deliberately stops at
the point where the same Compose graph would lift-and-shift onto
such an environment.

**Verification depth.** The continuous-integration pipeline at
`.github/workflows/ci.yml` runs the backend test target and the
frontend build plus lint on every push. The JUnit suite under
`backend/src/test/` currently covers `AuthService` (login throttle),
`MeetingLogDocumentService` (DOCX render), `MeetingLogComplianceService`
(six-log minimum), `AnnouncementService` (audience filter),
`CycleLifecycleService`, `StudentAccessService`, and
`ProjectProgressService` — fifty-three tests in total at the time of
writing. The PowerShell scripts under `scripts/` (five `verify_*.ps1`
and four seed scripts) cover the end-to-end flows for audit,
students, supervisors, login throttling, and supervisor seeding, but
they exercise the live HTTP API rather than acting as unit tests.
Broadening the JUnit layer to cover the supervisor request,
proposal, and access-control services would harden regression catch
rate without changing the runtime architecture.

**AI model maturation.** All three AI services rely on pretrained
or rule-based components rather than models fine-tuned on real MMU
FYP data. The recommendation service is deterministic by design and
its weights (0.50 / 0.18 / 0.10 / 0.07 / 0.15) are configurable
through environment variables, but no calibration study has been
run against historical pairings. The proposal analyzer's DistilBERT
head was trained on the bundled `training_set.tsv` dataset; a
higher-quality analyzer would require a labelled corpus of past
MMU FCI proposals. The chatbot's knowledge base contains fifteen
curated documents that mirror the FCI handbook; expanding it with
real Q&A from past cycles would lift retrieval quality at the same
RAG cost.

**Notifications and email.** SMTP mail and Web Push are off by
default through `APP_EMAIL_ENABLED=false` and `APP_PUSH_ENABLED=false`
to keep the local stack runnable without secrets. A faculty
deployment would need to supply MMU-issued SMTP credentials and a
VAPID keypair; the per-user `user_notification_preferences` table
already lets students and supervisors choose their channel, so the
delivery side activates with no further code change.

**Operational tunability.** The login-throttle threshold (5 failed
attempts) and lockout window (15 minutes) are inlined as `static
final` constants in `AuthService`. Both are reasonable defaults but
should arguably move to `system_parameter` so an administrator can
adjust them without a redeploy. The same applies to the
six-meeting-log compliance floor in `MeetingLogComplianceService`
and the `OUT_OF_SCOPE_THRESHOLD = 0.30` cut-off in the chatbot's
`RAGEngine`.

**Cycle automation.** Cycle activation, completion, and archival
are administrator-driven actions today. A scheduled job that flips
a cycle to `COMPLETED` automatically when its `end_date` has passed
(with a configurable grace period) would remove a class of manual
intervention; the existing `AdminJobController.runDeadlineReminders`
endpoint demonstrates the pattern that such a job would follow.

These items together form the natural roadmap from a working FYP2
demonstration to a system that could host a full cycle of MMU FCI
students. The implementation in this chapter has been kept honest
about which of those items are present today and which are
deliberately deferred, and Chapter 6 takes the same posture toward
testing.

<!--
self-check 5.10 (rewrite, 2026-05-10)
- Existing 5.10 was a two-bullet stub; this is a fresh draft.
- Content covered per faculty template:
  * Alignment with design — four subsystems from §4.1.1–4.1.4 mapped
    to the controller groups in §5.5; three AI services from Chapter 4
    mapped to the three Flask services with the algorithm-shift notes
    (XGBoost → deterministic, DistilBERT chunk-and-average added,
    chatbot remote LLM as default with Flan-T5 demoted to opt-in);
    schema follows §4.4 with V16/V18 and V31 reversals called out as
    design history.
  * Pending and future improvements — five themed blocks: operational
    deployment (HTTPS / reverse proxy / prod overlay / backups /
    log shipping), verification depth (empty JUnit suite, ps1 verify
    scripts), AI model maturation (no real MMU corpus calibration),
    notifications/email (off by default), operational tunability
    (static final constants → DB parameters), cycle automation
    (scheduled COMPLETED flip).
- Cross-references: §4.1.1–4.1.4 (subsystem decomposition), §4.4 (data
  dictionary), §5.1 (deployment), §5.4 (schema), §5.5 (modules and
  algorithm shifts), §5.6 (API surface), §5.7.3 (deployment reality),
  §5.8 (security), Chapter 6 (testing), Chapter 7 (conclusion).
- Tone pass:
  * British spelling: organise, behaviour, deliberately, centralised,
    finalised — checked.
  * AI-tells avoided: no leverage / robust / seamless / comprehensive /
    delve / "It is important to note" / "This section will explore".
  * Hedge density (may/can/could): each paragraph ≤ 2.
  * Sentence length varied; opening grammar varied across paragraphs.
  * No three-sentence parallel structure; bold sub-headings used to
    structure the future-work block without converting it into a list.
- Outstanding: none. The pending-improvements block is grounded in
  facts already established in §5.5, §5.7, and §5.8 — no fabrication.
-->

---

*THE END*
