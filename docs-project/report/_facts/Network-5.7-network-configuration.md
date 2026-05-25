# Facts — 5.7 Network Configuration

> Existing 5.7 in `chapter5.md:2263` is template-only (three empty
> sub-headings). This file is a fresh fact gather.
>
> **Honest status: there is no live faculty deployment.** The system
> has been built and tested entirely on the developer workstation
> through Docker Compose. CI runs verification only — no automated
> push to a server. The 5.7 prose should reflect this rather than
> manufacture a deployment that does not exist.

## Files involved

| Path | Role |
|---|---|
| `docker-compose.yml` | Production-style stack — six services on one bridge network |
| `docker-compose.override.yml` | Auto-merged dev override (Vite frontend, bind-mount source) |
| `backend/Dockerfile` | Multi-stage Maven 3.9 → Temurin JRE 17 |
| `frontend/Dockerfile` | Multi-stage Node 20 → nginx:alpine (production) |
| `frontend/Dockerfile.dev` | Single-stage Node 20 with Vite dev server |
| `frontend/nginx.conf` | SPA fallback, gzip, `/api → 404` |
| `ai-recommendation/Dockerfile`, `ai-proposal-analyzer/Dockerfile`, `ai-chatbot/Dockerfile` | gunicorn `--preload --workers 1 --threads 4 --timeout 180` |
| `backend/src/main/resources/application.yml` | Server port + context-path; env-driven AI URLs |
| `.github/workflows/ci.yml` | GitHub Actions: backend `mvn test`, frontend `npm ci && npm run lint && npm run build`. No deploy step. |
| `.env.example` | Sample env vars (`JWT_SECRET`, LLM keys, `VITE_API_BASE_URL`) for local dev |

> **Not present in the repo (deliberately noted):** no
> `docker-compose.prod.yml`, no `docker-compose.staging.yml`, no
> Kubernetes manifests, no Terraform/CloudFormation, no Vercel /
> Netlify / Render config, no `Makefile`, no shell deployment
> scripts, no live HTTPS / TLS configuration, no domain registration,
> no reverse proxy in front of nginx. Hosting is local-only.

## Hosting setup

Three runtime contexts exist:

1. **Local IDE-driven dev.** Backend run via `mvn spring-boot:run` from IntelliJ; frontend via `npm run dev` from a terminal; AI services via `python app.py` per service venv. Backend on `localhost:8080`, frontend on `localhost:3000`, MySQL on `localhost:3306` (a host installation). This is the everyday development setup.
2. **Local Compose stack.** `docker compose up --build` brings up all six containers on the user-defined bridge network `fyp-network`. The override file is auto-merged, so the frontend runs as a Vite dev container with HMR. This is the integration / demo setup.
3. **Production-style Compose stack.** Renaming or deleting `docker-compose.override.yml` falls back to the production frontend — the same Compose graph but with `nginx:alpine` serving the static SPA on port 80 (mapped to host 3000). This is the dress-rehearsal for a faculty deployment but is still run on the developer workstation.

Host operating system: **Windows 11 Home Single Language (build 10.0.26200)**. Container base images: `eclipse-temurin:17-jre` (Ubuntu) for the backend, `nginx:alpine` (Alpine) and `node:20-alpine` (Alpine) for the frontend, `python:3.11-slim` (Debian) for the three AI services, `mysql:8` (Oracle Linux) for the database. The compose stack is therefore tier-Linux on a Windows host.

A production move to a faculty Linux server would not require code changes — the same `docker-compose.yml` would run unmodified, with environment overrides supplied via shell or a sibling `.env` file. The HTTPS termination, domain routing, and reverse-proxy front layer would need to be added; none of those are checked into the repo today.

## Port configuration

Host-published ports, after compose merge:

| Host port | Container port | Service | Notes |
|---|---|---|---|
| **3000** | 80 | `frontend` (production nginx) | Replaced by 5173→3000 when the override is active |
| **5173** | 3000 | `frontend` (Vite dev container, when override is active) | Override uses Compose's `!override` directive on the `ports` key so this replaces the production mapping rather than merging with it |
| **8080** | 8080 | `backend` | Spring Boot context path is `/api`, so live URLs are `http://host:8080/api/...` |
| **3307** | 3306 | `db` | 3307 chosen so the container does not clash with a local MySQL on 3306 |
| **5001** | 5001 | `ai-recommendation` | Flask + gunicorn |
| **5002** | 5002 | `ai-proposal-analyzer` | Flask + gunicorn |
| **5003** | 5003 | `ai-chatbot` | Flask + gunicorn |

Internal-only addressing inside the `fyp-network` bridge uses the
compose service names: the backend reaches the AI services as
`http://ai-recommendation:5001`, `http://ai-proposal-analyzer:5002`,
`http://ai-chatbot:5003`, and the database as
`jdbc:mysql://db:3306/fyp_supervision`. The browser, by contrast,
reaches the backend through the host-published port; the API base URL
is baked into the production bundle at build time via the
`VITE_API_BASE_URL` build argument and is provided through Vite's
proxy in development.

The CORS allowlist in `CorsConfig.java` covers exactly the two
front-facing host ports — `http://localhost:3000` (production frontend)
and `http://localhost:5173` (dev override) — with credentials enabled
and a 3600-second preflight cache.

## Deployment process

### CI verification (`.github/workflows/ci.yml`)

GitHub Actions runs **two parallel jobs** on every push to any branch
and on every PR targeting `main`. Concurrency is grouped by ref so a
newer commit cancels in-flight runs:

| Job | Runs | Steps |
|---|---|---|
| `Backend (mvn test)` | `ubuntu-latest`, JDK 17 (Temurin) with Maven cache | `actions/checkout@v4` → `actions/setup-java@v4` → `mvn -B -ntp test` (working dir `backend/`); on failure, uploads `backend/target/surefire-reports/` as an artefact |
| `Frontend (build + lint)` | `ubuntu-latest`, Node 20 with npm cache | `actions/checkout@v4` → `actions/setup-node@v4` → `npm ci` → `npm run lint` (treated as a hard gate per project's `--max-warnings 0` policy) → `npm run build` (Vite-only, since `tsc` was deliberately removed; Vite still type-checks JSX and surfaces unresolved imports) |

There is **no deployment job**. The CI confirms that the code
compiles, tests pass, and lint is clean; it does not push artefacts
anywhere.

### Local deployment (the only deployment that exists)

`docker compose up --build` performs every step needed to stand up the
full stack on the developer workstation:

1. Compose builds the backend, frontend (or frontend.dev when the override is in place), and the three AI images.
2. The `db` service starts; the `mysqladmin ping` health-check loops every 10 seconds, with 5 retries, until MySQL is accepting connections.
3. The `backend` starts (`depends_on: db: service_healthy`); on first boot Flyway scans `classpath:db/migration` and applies V1 through V28 plus V30 and V31 in order. Subsequent boots only apply newly added scripts.
4. `ai-recommendation`, `ai-proposal-analyzer`, and `ai-chatbot` start in parallel — there is no health gate on them, so the backend can come up before they are ready (a deliberate choice, since the AI services degrade gracefully via `AiServiceClient` 503s).
5. `frontend` starts (`depends_on: backend`). When the dev override is present, Vite bind-mounts `./frontend → /app` and runs `npm run dev -- --host 0.0.0.0 --port 3000` with HMR; without the override, nginx serves the prebuilt static bundle on port 80.

Tearing down with `docker compose down` stops the containers but
preserves the named volumes (`mysql_data`, `upload_data`,
`recommendation_models`, `analyzer_models`, `chatbot_vector_store`).
A clean slate requires `docker compose down -v`.

### What a production deployment would need (not in scope)

If the project were to be deployed to a faculty Linux server, the
following pieces would need to be added — none of them exist in the
repo today:

- A reverse proxy (nginx, Caddy, or Traefik) terminating HTTPS in front of the backend and the static frontend bundle.
- A real TLS certificate (e.g. via Let's Encrypt / `certbot`) bound to a faculty domain.
- A production-grade `JWT_SECRET`, `MAIL_USERNAME` / `MAIL_PASSWORD`, `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY`, and at least one LLM API key, supplied through the host's environment (or a secret manager) rather than committed to the repo.
- A `docker-compose.prod.yml` overlay that hardens the database (no host port exposure, restricted credentials), removes the dev override, and pins image tags rather than rebuilding from source on every host.
- Backups for the `mysql_data` and `upload_data` volumes scheduled outside the application.
- Log shipping to a centralised collector if more than one host is involved.

These are all standard operational concerns that fall outside the FYP2
scope; the project has been carried to the point where the same
Compose graph would lift-and-shift onto such an environment, but the
operational layer above it is intentionally empty.

## Notable design choices

- **Local-only deployment is acknowledged, not hidden.** The decision was made early to keep the project portable and reproducible rather than to spend time provisioning a faculty server that the examiner may not have access to. The same Compose stack runs on any machine with Docker Desktop or Docker Engine installed.
- **CI verifies, does not deploy.** Treating CI as a verification gate (tests + lint + build) avoids the security exposure of stashing production credentials in GitHub Actions secrets when no production target exists.
- **Health-checks are scoped narrowly.** Only the database has a Compose-level health-check (`mysqladmin ping`); the AI services do not, because their `AiServiceClient` 503 path lets the backend tolerate a slow start.
- **Override file as the production / dev switch.** Renaming `docker-compose.override.yml` is the only step needed to flip the stack from dev (Vite HMR on 5173) to production (nginx static on 3000) — there is no second compose file to maintain.
- **Compose ports use `!override` deliberately.** Without it, Compose would merge the dev override's ports list with the production list, producing two competing host bindings.
- **HTTPS is conceptual, not configured.** All in-stack traffic is plain HTTP because everything runs on `localhost`. A faculty deployment would terminate HTTPS at a reverse proxy in front of nginx.
- **Email and push are off by default at the env layer.** The compose file passes `${MAIL_USERNAME:-}` and `${VAPID_PUBLIC_KEY:-}`, and `application.yml` defaults `app.email.enabled` and `app.push.enabled` to `false`, so the stack runs end-to-end with no secrets configured at all.
- **`AI_*_URL` env vars decouple compose from local-IDE dev.** The same backend JAR works against `http://localhost:5001-5003` (IDE-run AI services) and against `http://ai-recommendation:5001-5003` (compose service names) without code changes.

## Items to highlight when written up

- Three runtime contexts: IDE-driven dev, dev Compose with override, production-style Compose
- Host-published port table (3000, 5173, 8080, 3307, 5001–5003) with the 3307 and 5173 quirks called out
- CORS dual-origin allowlist (3000 + 5173) tied to the dev/prod split
- Internal addressing uses compose service names; the browser uses host ports
- CI is verification-only (tests, lint, build); there is no deployment job
- Boot sequence: db (with health-check) → backend (with Flyway) → AI services (parallel) → frontend
- Deployment-related items deliberately not implemented and worth listing as future work in 5.10: HTTPS termination, faculty server, image-tag pinning, prod compose overlay, scheduled backups
- The override file is the dev/prod switch; `!override` on `ports` is the gotcha that explains why it is there
- Email and push are env-gated to keep no-secrets startup possible
- No Maven wrapper, no Makefile, no shell deploy scripts — the entire deployment story is contained in two compose files plus six Dockerfiles
