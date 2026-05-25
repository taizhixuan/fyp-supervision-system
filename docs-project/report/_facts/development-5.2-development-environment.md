# Facts — 5.2 Development Environment

> Existing 5.2 prose is at `chapter5.md:128–266`. Several claims have
> drifted from the current code (Python 3.12 vs the actual 3.11,
> "V1-V10" vs the actual V1-V28 + V30 + V31, XGBoost in
> `ai-recommendation/requirements.txt` which is no longer listed,
> `joblib` which is also no longer listed, Flan-T5 framed as the chatbot
> generator). This file captures the **current** environment so a
> refresh can correct the drift.

## Files involved

| File | Role |
|---|---|
| `backend/pom.xml` | Maven manifest — Spring Boot 3.2.5, Java 17 target, dependency versions |
| `backend/src/main/resources/application.yml` | Runtime config |
| `backend/src/main/resources/application-dev.yml` | Dev profile overrides (`show-sql`, DEBUG logging) |
| `backend/src/main/resources/db/migration/V*.sql` | 30 Flyway scripts (V1–V28, V30, V31; V29 deliberately skipped) |
| `frontend/package.json` | NPM manifest — React 18, Vite 7, TypeScript 5.3, Tailwind 3.4 |
| `frontend/tsconfig.json` | TS strict mode, ES2020 target, `@/* → src/*` path alias |
| `frontend/.eslintrc.cjs` | ESLint 8 with `@typescript-eslint`, `react-hooks`, `unused-imports` plugins |
| `frontend/tailwind.config.js` | Brand theme (navy `#1e3a5f`, coral `#ef4444`, success/warning/error/info palettes), `Plus Jakarta Sans` + `JetBrains Mono` font stack, custom animations |
| `frontend/postcss.config.js` | Tailwind + Autoprefixer pipeline |
| `frontend/vite.config.ts` | Dev server port 3000, `/api` and `/uploads` proxied to `:8080`, polling-watch on |
| `ai-recommendation/requirements.txt` | flask 3.0.0, flask-cors 4.0.0, gunicorn 21.2.0, numpy 1.26.4, sentence-transformers 3.3.1 |
| `ai-proposal-analyzer/requirements.txt` | flask 3.0.0, flask-cors 4.0.0, openai 1.54.5, httpx 0.27.2, gunicorn 21.2.0, transformers 4.47.1, torch 2.5.1, numpy 1.26.4, scikit-learn 1.4.0, pandas 2.1.4 |
| `ai-chatbot/requirements.txt` | flask 3.0.0, flask-cors 4.0.0, openai 1.54.5, httpx 0.27.2, gunicorn 21.2.0, sentence-transformers 3.3.1, faiss-cpu 1.9.0.post1, transformers 4.47.1, torch 2.5.1, numpy 1.26.4 |
| `.gitignore` | Excludes `node_modules/`, `target/`, `dist/`, `frontend/.vite/`, `*.class`, `*.jar`, `*.war`, `.env` files, build outputs |
| `.git/config` | Remote = `https://github.com/taizhixuan/fyp-supervision-system.git`, default branch = `main` |
| `.idea/` | IntelliJ IDEA project metadata (codeStyles, dbnavigator, vcs, workspace) — confirms IntelliJ is in active use |
| `scripts/*.ps1` | PowerShell-based seed and verify scripts (10 total): `seed_supervisors.ps1`, `seed_students_and_logs.ps1`, `cleanup_cycles.ps1`, `smoke_supervisors.ps1`, `verify_audit.ps1`, `verify_audit_extended.ps1`, `verify_grading.ps1`, `verify_students.ps1`, `verify_supervisors.ps1`, `verify_throttle.ps1` |
| `README.md` | Top-level project README |
| `.env.example` | Sample env file for local dev |

> No `.vscode/` directory exists in the repo — VS Code use is not
> evidenced by a checked-in workspace, only by convention.

## Programming languages (current, verified)

| Language | Version target | Where it is set | Used for |
|---|---|---|---|
| Java | **17** (compile + runtime) | `pom.xml` `<java.version>17</java.version>`; `maven-compiler-plugin` `<source>17</source><target>17</target>` | Backend (`com.fyp.supervision.*`) |
| Python | **3.11** (Docker images) | `python:3.11-slim` in all three AI Dockerfiles | Flask AI services |
| TypeScript | **5.3.3** | `frontend/package.json` `devDependencies."typescript": "^5.3.3"` | React SPA |
| SQL (MySQL 8 dialect) | n/a | `backend/src/main/resources/db/migration/V*.sql` | 30 Flyway scripts (V1–V28, V30, V31) |

> **Drift in existing 5.2.1**: it says "Python 3.12" and "ten Flyway
> migration scripts (V1 through V10)". Both are wrong — actual is
> Python 3.11 and 30 scripts (V1–V28, V30, V31; V29 was skipped, likely
> aborted during authoring).

## Backend dependencies (full, from `pom.xml`)

Parent: `spring-boot-starter-parent:3.2.5`. Properties: `java.version=17`,
`jjwt.version=0.12.5`, `lombok.version=1.18.42`.

| GroupId / ArtifactId | Version | Scope | Purpose |
|---|---|---|---|
| `org.springframework.boot:spring-boot-starter-web` | (managed) | compile | Embedded Tomcat + Spring MVC |
| `org.springframework.boot:spring-boot-starter-data-jpa` | (managed) | compile | Hibernate-backed JPA |
| `org.springframework.boot:spring-boot-starter-security` | (managed) | compile | Auth, RBAC, BCrypt |
| `org.springframework.boot:spring-boot-starter-validation` | (managed) | compile | Bean Validation |
| `org.springframework.boot:spring-boot-starter-mail` | (managed) | compile | SMTP for `EmailService` |
| `org.apache.poi:poi-ooxml` | 5.2.5 | compile | DOCX generation in `ProposalDocumentService` |
| `com.mysql:mysql-connector-j` | (managed) | runtime | MySQL JDBC |
| `org.flywaydb:flyway-core` | (managed) | compile | Migration runner |
| `org.flywaydb:flyway-mysql` | (managed) | compile | MySQL-specific support |
| `io.jsonwebtoken:jjwt-api` | 0.12.5 | compile | JWT API |
| `io.jsonwebtoken:jjwt-impl` | 0.12.5 | runtime | JWT impl |
| `io.jsonwebtoken:jjwt-jackson` | 0.12.5 | runtime | JWT Jackson serializer |
| `org.projectlombok:lombok` | (managed via `<annotationProcessorPaths>` pin to 1.18.42) | optional | `@Data`, `@Builder`, `@RequiredArgsConstructor` |
| `com.fasterxml.jackson.core:jackson-databind` | (managed) | compile | JSON serialisation |
| `nl.martijndwars:web-push` | 5.1.1 | compile | Web Push notifications via `PushService` |
| `org.bouncycastle:bcprov-jdk18on` | 1.78 | compile | Crypto for VAPID web-push signing |
| `org.springframework.boot:spring-boot-starter-test` | (managed) | test | JUnit 5 + Mockito + Spring Test |
| `org.springframework.security:spring-security-test` | (managed) | test | Security test utilities |

Build plugins:

- `maven-compiler-plugin` — Java 17 source/target; explicit Lombok 1.18.42 in `<annotationProcessorPaths>` because the host JDK is Java 25 and earlier Lombok versions fail.
- `spring-boot-maven-plugin` — produces the runnable fat JAR; excludes Lombok from the packaged JAR (annotation-processing only).

> **Drift in existing 5.2.2**: missing `spring-boot-starter-mail`,
> `poi-ooxml`, `web-push`, `bcprov-jdk18on`, `spring-boot-starter-test`,
> `spring-security-test`. Also doesn't mention the `spring-boot-maven-plugin`
> Lombok exclusion.

## Frontend dependencies (full, from `package.json`)

```
"name": "fyp-supervision-system-frontend"
"version": "1.0.0"
"type": "module"
```

Scripts:
- `dev` → `vite`
- `build` → `vite build`
- `lint` → `eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0`
- `preview` → `vite preview`

Runtime dependencies:

| Package | Version | Purpose |
|---|---|---|
| `react` | ^18.2.0 | UI runtime |
| `react-dom` | ^18.2.0 | DOM renderer |
| `react-router-dom` | ^6.21.3 | Client-side routing |
| `@tanstack/react-query` | ^5.17.19 | Server-state cache |
| `axios` | ^1.6.7 | HTTP client (wrapped in `lib/api/client.ts`) |
| `react-hook-form` | ^7.49.3 | Form state |
| `@hookform/resolvers` | ^3.3.4 | Bridge for Zod resolver |
| `zod` | ^3.22.4 | Form schema validation |
| `clsx` | ^2.1.0 | Conditional className composition |
| `tailwind-merge` | ^2.2.1 | Resolves conflicting Tailwind classes |
| `lucide-react` | ^0.312.0 | Icon set |
| `jspdf` | ^4.1.0 | Client-side PDF generation (signed log export) |
| `html2canvas` | ^1.4.1 | DOM → canvas for jsPDF capture |
| `docx` | ^9.5.1 | Client-side DOCX generation (proposal export) |

Dev dependencies:

| Package | Version | Purpose |
|---|---|---|
| `vite` | ^7.3.1 | Bundler / dev server |
| `@vitejs/plugin-react` | ^4.2.1 | React Fast Refresh |
| `typescript` | ^5.3.3 | Compiler (no build emit; type-checking only) |
| `@types/node` / `@types/react` / `@types/react-dom` | ^20.11.6 / ^18.2.48 / ^18.2.18 | Type definitions |
| `tailwindcss` | ^3.4.1 | Utility-first CSS |
| `postcss` | ^8.4.33 | CSS pipeline |
| `autoprefixer` | ^10.4.17 | Vendor-prefix transforms |
| `eslint` | ^8.57.1 | Linter |
| `@typescript-eslint/eslint-plugin` / `@typescript-eslint/parser` | ^7.18.0 | TS-aware lint rules |
| `eslint-plugin-react-hooks` | ^4.6.2 | Hook rules |
| `eslint-plugin-react-refresh` | ^0.4.26 | Fast-refresh boundary lint |
| `eslint-plugin-unused-imports` | ^3.2.0 | Unused-import autofix |

`tsconfig.json` highlights:
- `target: ES2020`, `module: ESNext`, `moduleResolution: bundler`
- `strict: true`, `noUnusedLocals: true`, `noUnusedParameters: true`,
  `noFallthroughCasesInSwitch: true`
- `jsx: react-jsx`, `useDefineForClassFields: true`
- `paths: { "@/*": ["src/*"] }` — used via Vite alias too
- `noEmit: true` — Vite handles the build, `tsc` is type-check only

`tailwind.config.js` highlights:
- Custom palettes: `primary` (navy, 50–950, brand colour at `900: #1e3a5f`),
  `accent` (coral 400–600), `neutral` (warm gray), full ranges for
  `success`, `warning`, `error`, `info`
- Fonts: `Plus Jakarta Sans` (sans), `JetBrains Mono` (mono)
- Custom font sizes: `display`, `h1`–`h4`, `body-lg`, `body`, `body-sm`,
  `caption`
- Custom shadows / radii / animations (`fade-in`, `fade-in-up`,
  `slide-in-right`, `slide-in-up`, `float-slow`, `drift`, `spin-slow`)

`.eslintrc.cjs` posture:
- Extends `eslint:recommended`, `@typescript-eslint/recommended`,
  `react-hooks/recommended`
- Catches `unused-imports/no-unused-imports` as **error**
- Off: `no-explicit-any`, `ban-ts-comment`, `react-refresh/only-export-components`,
  most TS strictness rules — pragmatic posture for a single-author SPA
- Active: `no-empty` (with `allowEmptyCatch`), `no-constant-condition`

> **Drift in existing 5.2.2**: doesn't mention TypeScript 5.3 explicitly,
> ESLint 8.57.1 + plugins, Vite 7, the brand-customised Tailwind theme,
> or that `tsc` is **not** in the build pipeline.

## AI service dependencies (verbatim from each `requirements.txt`)

`ai-recommendation/requirements.txt` (5 lines):
```
flask==3.0.0
flask-cors==4.0.0
gunicorn==21.2.0
numpy==1.26.4
sentence-transformers==3.3.1
```

`ai-proposal-analyzer/requirements.txt` (10 lines):
```
flask==3.0.0
flask-cors==4.0.0
openai==1.54.5
httpx==0.27.2
gunicorn==21.2.0
transformers==4.47.1
torch==2.5.1
numpy==1.26.4
scikit-learn==1.4.0
pandas==2.1.4
```

`ai-chatbot/requirements.txt` (10 lines):
```
flask==3.0.0
flask-cors==4.0.0
openai==1.54.5
httpx==0.27.2
gunicorn==21.2.0
sentence-transformers==3.3.1
faiss-cpu==1.9.0.post1
transformers==4.47.1
torch==2.5.1
numpy==1.26.4
```

> **Drift in existing 5.2.2 AI-services list:**
> - Lists `xgboost==2.1.3` for `ai-recommendation` — not present in the
>   live `requirements.txt`. The XGBoost path was removed alongside the
>   move to the deterministic weighted scorer.
> - Lists `joblib==1.4.2` — also not present in any of the three
>   requirements.txt files.
> - Lists `scikit-learn 1.4` against the recommendation service —
>   actually it is only in `ai-proposal-analyzer`.
> - Frames Flan-T5 as the chatbot's primary generator — actually
>   off-by-default; primary path is the OpenAI-compatible LLM
>   (`openai==1.54.5` with `httpx==0.27.2`, provider chain
>   `LLM_API_KEY → GROQ_API_KEY → OPENAI_API_KEY`).
> - Doesn't mention `openai==1.54.5` or `httpx==0.27.2` at all, even
>   though both are common to analyzer and chatbot.
> - Doesn't mention `pandas==2.1.4` (used by analyzer training data).

## IDEs and tools

- **IntelliJ IDEA** — present and active (`.idea/` is checked in,
  contains `codeStyles/`, `dbnavigator.xml`, `inspectionProfiles/`,
  `vcs.xml`, `workspace.xml`). Used for backend (Maven, JPA, Hibernate
  validation, Flyway integration).
- **MySQL Workbench** — used for ad-hoc schema inspection and verifying
  migrations. Not committed; convention only.
- **Postman** — convention only; no collection in the repo.
- **Docker Desktop 24 + Docker Compose v2** — runs the six-service
  stack on the developer machine.
- **Git Bash + PowerShell** — Bash for POSIX scripts and Linux-targeted
  Dockerfiles, PowerShell for Windows-native scripts under `scripts/`.
- **Visual Studio Code** — convention only; no `.vscode/` workspace
  exists in the repo. The frontend, AI services, and migrations are
  edited in either VS Code or IntelliJ depending on the developer's
  preference.
- **Claude Code** — used as an AI pair-programming assistant during
  development (refactors, migrations, type cleanup).
- **PowerShell scripts in `scripts/`** — testing harness:
  `seed_supervisors.ps1`, `seed_students_and_logs.ps1`,
  `cleanup_cycles.ps1`, `smoke_supervisors.ps1`, plus six `verify_*.ps1`
  scripts that walk real HTTP flows for audit, grading, students,
  supervisors, throttling.

## Version control

- **Git** with remote `https://github.com/taizhixuan/fyp-supervision-system.git`.
- Default branch: `main`. No long-lived feature branches; commits land
  directly on `main` because the project is single-author.
- Recent commit shape (verified via `git log --oneline -5`):
  - `57a24cd ai services: type validation + score rounding + empty-env tolerance`
  - `0e5bb34 alert banners: dismissible on log-review fallback; remount query-error banners per errorUpdatedAt`
  - `6d5a71b alert banner: reset hidden when message changes; dismissible+reset on supervisor log-review errors`
  - Style is short, lowercase, imperative.
- `.gitignore` excludes `node_modules/`, `target/`, `dist/`,
  `frontend/.vite/`, `frontend/build/`, `*.class`, `*.jar`, `*.war`,
  `.env` family files, IDE artefacts, OS junk, AI venvs, model
  artefacts under `**/models/` and `**/vector_store/` (these are
  rebuilt or mounted via Docker named volumes).

## Operating system

Host OS: **Windows 11 Home Single Language, build 10.0.26200**.

All long-running services run inside Linux containers built from these
base images:

| Service | Base image | Runtime image |
|---|---|---|
| `backend` | `maven:3.9-eclipse-temurin-17` | `eclipse-temurin:17-jre` (Ubuntu) |
| `frontend` (prod) | `node:20-alpine` (build) | `nginx:alpine` |
| `frontend` (dev override) | `node:20-alpine` | (same — dev server stays) |
| `ai-recommendation` | `python:3.11-slim` | (same) |
| `ai-proposal-analyzer` | `python:3.11-slim` | (same) |
| `ai-chatbot` | `python:3.11-slim` | (same) |
| `db` | `mysql:8` | (same) |

> **Drift in existing 5.2.5**: claims AI services are on `python:3.12-slim`.
> Actually `python:3.11-slim` in all three Dockerfiles. The 3.12 reference
> in 5.2.1 also conflates the host venv (3.12, used during local
> training) with the container runtime (3.11, used in production).

## Notable design choices for the report

- **Java 17 target on a Java 25 host** is a deliberate decision —
  Spring Boot 3.x supports Java 17 LTS, and pinning the bytecode
  version keeps the JAR portable. Lombok 1.18.42 is the lowest version
  that works on JDK 25's annotation processor model.
- **Maven manages most version numbers** through the Spring Boot BOM;
  only JJWT, POI, web-push, and bouncycastle are explicitly pinned.
- **Frontend `tsc` is removed from the build pipeline** — `npm run
  build` runs Vite only. This was a pragmatic call: the codebase still
  carries pre-existing strict-mode errors that are tracked separately
  rather than blocking the build. `npm run lint` runs ESLint with
  `--max-warnings 0` and is the actual gate.
- **PostCSS + Autoprefixer + Tailwind 3.4** is the styling pipeline;
  the brand theme lives in `tailwind.config.js` rather than CSS
  variables, so colour tokens are typed at the Tailwind class level.
- **`@/* → src/*` path alias** is configured in both `tsconfig.json`
  and `vite.config.ts` so imports resolve identically at type-check
  time and at bundle time.
- **AI services pin `torch==2.5.1`** because torch 2.10.x has a DLL
  initialisation failure on the Windows dev machine.
- **AI services use OpenAI-compatible client (`openai==1.54.5` +
  `httpx==0.27.2`)** with provider precedence `LLM_API_KEY →
  GROQ_API_KEY → OPENAI_API_KEY`. Same chain in both analyzer and
  chatbot.
- **MMU FCI scripts under `scripts/`** are PowerShell-only because the
  dev shell on Windows is PowerShell; they walk the real HTTP API
  rather than touching the database directly so they double as
  end-to-end smoke tests.
- **Single-author git workflow** — no PR review, no feature branches.
  This is documented in CLAUDE.md as a deliberate trade-off.

## Items to highlight when written up

- Java 17 backend, Python 3.11 AI services, TypeScript 5.3 frontend,
  MySQL 8 database (correcting 3.12 / V1–V10 drifts)
- **Spring Boot 3.2.5** with the full starter set: web, data-jpa,
  security, validation, mail
- POI 5.2.5 for DOCX export, web-push 5.1.1 + bouncycastle 1.78 for
  push notifications, JJWT 0.12.5 for HS256 tokens, Lombok 1.18.42
  pinned through `<annotationProcessorPaths>`
- React 18 + Vite 7 + TypeScript 5.3 + Tailwind 3.4 with the brand
  theme; ESLint 8 with the unused-imports plugin gating the build
- AI runtime: Flask 3 + gunicorn 21 + sentence-transformers 3.3.1 +
  transformers 4.47.1 + torch 2.5.1 + faiss-cpu 1.9.0 + openai 1.54.5
- **30 Flyway migrations**, V1–V28 + V30 + V31 (V29 deliberately
  skipped); migration cadence has continued well past the V14 line in
  5.4.1
- IntelliJ IDEA used for backend (`.idea/` checked in); VS Code by
  convention for frontend / AI / docs
- Git on GitHub (`taizhixuan/fyp-supervision-system`), `main` branch,
  short imperative commit style
- Windows 11 host + Linux containers; identical compose graph runs in
  dev and on a faculty Linux server
- Ten PowerShell verify/seed scripts in `scripts/` walk real HTTP
  flows — useful as both seed harness and smoke suite
