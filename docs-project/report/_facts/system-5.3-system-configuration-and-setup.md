# Facts — 5.3 System Configuration and Setup

> Existing 5.3 prose is at `chapter5.md:381–551`. Several drift items
> need correction in the rewrite (Flyway "V1–V10", `xgboost`/`faiss-cpu`
> still listed as host-venv requirements, claim that Spring uses
> `@PreAuthorize` for role checks when in fact `SecurityConfig` does it
> by URL prefix, claim of `react-scripts` as the predecessor toolchain
> when the project never used CRA, claim of "fat JAR" for the backend
> Docker build, no mention of the four extra `@Configuration` classes
> beyond `SecurityConfig`).

## Files involved

### Backend setup
| File | Role |
|---|---|
| `backend/src/main/resources/application.yml` | Default runtime config (server port, context path, datasource, JPA, Flyway, mail, JWT, AI URLs, push) |
| `backend/src/main/resources/application-dev.yml` | Dev profile overrides — `show-sql: true`, DEBUG logging |
| `backend/pom.xml` | Maven manifest (covered in 5.2 facts) |
| `backend/Dockerfile` | Multi-stage build: maven:3.9-eclipse-temurin-17 → eclipse-temurin:17-jre |
| `backend/src/main/java/com/fyp/supervision/config/SecurityConfig.java` | Spring Security filter chain, URL-prefix authority routing, BCrypt bean |
| `backend/src/main/java/com/fyp/supervision/config/CorsConfig.java` | CORS bean — allowed origins `localhost:3000` + `localhost:5173` |
| `backend/src/main/java/com/fyp/supervision/config/WebConfig.java` | Static resource handler for `/uploads/**` |
| `backend/src/main/java/com/fyp/supervision/config/AsyncConfig.java` | `@EnableAsync` + `emailExecutor` ThreadPool (core 2, max 4, queue 100) |
| `backend/src/main/java/com/fyp/supervision/config/FileStorageConfig.java` | `@PostConstruct` creates the upload directory if missing |
| `backend/src/main/java/com/fyp/supervision/config/JwtConfig.java` | JWT secret/expiry binding |
| `backend/src/main/java/com/fyp/supervision/security/JwtAuthenticationFilter.java` | Filter that extracts the bearer token, validates it, populates `SecurityContext` |
| `backend/src/main/java/com/fyp/supervision/security/JwtTokenProvider.java` | HS256 signing/verification (JJWT 0.12.5) |

### Frontend setup
| File | Role |
|---|---|
| `frontend/package.json` | npm scripts: `dev` → `vite`, `build` → `vite build`, `lint` → ESLint, `preview` → `vite preview` |
| `frontend/vite.config.ts` | Dev server port 3000, host true, polling watch on, proxies `/api` and `/uploads` to `:8080`, alias `@ → ./src` |
| `frontend/tsconfig.json` | TS strict, ES2020 target, `paths: { "@/*": ["src/*"] }`, `noEmit: true` |
| `frontend/.eslintrc.cjs` | ESLint 8 + `@typescript-eslint`, `react-hooks`, `react-refresh`, `unused-imports` plugins |
| `frontend/tailwind.config.js` | Brand theme — navy primary palette, coral accent, full semantic palettes, `Plus Jakarta Sans` + `JetBrains Mono` fonts, custom animations |
| `frontend/postcss.config.js` | `tailwindcss` + `autoprefixer` plugins |
| `frontend/index.html` | SPA shell — preconnects to Google Fonts, loads `Plus Jakarta Sans` (400/500/600/700), title `FYP Supervision System | MMU FCI`, `<script type="module" src="/src/main.tsx">` |
| `frontend/src/styles/globals.css` | Tailwind base/components/utilities + CSS-variable theme |
| `frontend/src/app/providers.tsx` | `QueryClientProvider` (staleTime 60 s, retry 1, no refetch on focus) wrapping `AuthProvider` and `ToastProvider` |
| `frontend/src/app/router.tsx` | `createBrowserRouter` — auth eager, role pages lazy |
| `frontend/src/lib/api/client.ts` | Axios instance with JWT interceptor + 401 → `/session-expired` redirect; `withCredentials: true`; `Content-Type: application/json` |
| `frontend/src/components/ui/` | Hand-built UI kit: `AlertBanner`, `Badge`, `Button`, `Card`, `Drawer`, `Input`, `Modal`, `Pagination`, `Spinner`, `Toast`, `index.ts` |
| `frontend/Dockerfile` | Multi-stage: node:20-alpine → nginx:alpine; accepts `VITE_API_BASE_URL` build arg |
| `frontend/Dockerfile.dev` | Single-stage node:20-alpine running `vite --host 0.0.0.0 --port 3000` |
| `frontend/nginx.conf` | SPA fallback `try_files`, `/api` returns 404, gzip on |

### Shared / build
| File | Role |
|---|---|
| `docker-compose.yml` | Production-style stack |
| `docker-compose.override.yml` | Auto-loaded dev override — frontend → Vite container with HMR, VITE_USE_POLLING=true |
| `.env.example` | Template — `JWT_SECRET`, `JWT_EXPIRY_MS`, LLM provider chain (`GROQ_API_KEY`, `OPENAI_API_KEY`, `LLM_API_KEY`/`LLM_BASE_URL`/`LLM_MODEL`), `VITE_API_BASE_URL`, optional `DB_URL`/`DB_USER`/`DB_PASS` |
| `ai-recommendation/Dockerfile`, `ai-proposal-analyzer/Dockerfile`, `ai-chatbot/Dockerfile` | gunicorn `--preload --workers 1 --threads 4 --timeout 180 app:app` |

> **No Maven wrapper** (`mvnw`) is present at `backend/`. The build relies
> on the developer or the Docker builder image to provide Maven.

## Backend setup — concrete config

### `application.yml` (full)

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
    driver-class-name: com.mysql.cj.jdbc.Driver
    hikari:
      maximum-pool-size: 10
      minimum-idle: 5

  jpa:
    hibernate:
      ddl-auto: validate
    show-sql: false
    properties:
      hibernate:
        dialect: org.hibernate.dialect.MySQLDialect
        format_sql: true

  flyway:
    enabled: true
    locations: classpath:db/migration
    baseline-on-migrate: true

  servlet:
    multipart:
      max-file-size: 50MB
      max-request-size: 50MB

  jackson:
    serialization:
      write-dates-as-timestamps: false
    default-property-inclusion: non_null

  mail:
    host: ${MAIL_HOST:smtp.gmail.com}
    port: ${MAIL_PORT:587}
    username: ${MAIL_USERNAME:}
    password: ${MAIL_PASSWORD:}
    properties:
      mail:
        smtp:
          auth: true
          starttls:
            enable: true

app:
  jwt:
    secret: ${JWT_SECRET:dev-secret-key-must-be-at-least-32-characters-long-for-hs256}
    expiry-ms: ${JWT_EXPIRY_MS:86400000}
  file:
    upload-dir: ${FILE_UPLOAD_DIR:./uploads}
  ai:
    recommendation-url: ${AI_RECOMMENDATION_URL:http://localhost:5001}
    analyzer-url: ${AI_ANALYZER_URL:http://localhost:5002}
    chatbot-url: ${AI_CHATBOT_URL:http://localhost:5003}
  email:
    enabled: ${APP_EMAIL_ENABLED:false}
    from: ${APP_EMAIL_FROM:fyp-noreply@mmu.edu.my}
    app-base-url: ${APP_BASE_URL:http://localhost:3000}
  push:
    enabled: ${APP_PUSH_ENABLED:false}
    vapid:
      public-key: ${VAPID_PUBLIC_KEY:}
      private-key: ${VAPID_PRIVATE_KEY:}
      subject: ${VAPID_SUBJECT:mailto:fyp-noreply@mmu.edu.my}

logging:
  level:
    com.fyp.supervision: INFO
    org.springframework.security: INFO
```

### `application-dev.yml` (full)

```yaml
spring:
  jpa:
    show-sql: true

logging:
  level:
    com.fyp.supervision: DEBUG
    org.springframework.security: DEBUG
```

### `@Configuration` classes

| Class | Responsibility |
|---|---|
| `SecurityConfig` | `SecurityFilterChain` — stateless sessions, CSRF off, URL-prefix `requestMatchers` map prefixes to authorities (`/admin/**` → `SYSTEM_ADMIN`, `/committee/**` → `FYP_COMMITTEE`, `/supervisor/**` → `SUPERVISOR`, `/student/**` → `STUDENT`, `/supervisors/**` → `STUDENT`); injects `JwtAuthenticationFilter` before `UsernamePasswordAuthenticationFilter`. Defines `BCryptPasswordEncoder` and `AuthenticationManager` beans. `@EnableMethodSecurity` is on but `@PreAuthorize` is **not** the primary RBAC mechanism. |
| `CorsConfig` | `CorsConfigurationSource` allowing origins `http://localhost:3000` (production frontend host) and `http://localhost:5173` (dev override Vite); methods GET/POST/PUT/DELETE/OPTIONS; all headers; credentials on; max-age 3600 s. |
| `WebConfig` | Implements `WebMvcConfigurer` — registers a static resource handler that maps `/uploads/**` to `file:${app.file.upload-dir}/`. This is what backs the `/uploads/**` permitAll route. |
| `AsyncConfig` | `@EnableAsync` plus a named `ThreadPoolTaskExecutor` bean `emailExecutor` (corePoolSize 2, maxPoolSize 4, queueCapacity 100, threadNamePrefix `email-`). Used by `EmailService` for async sends. |
| `FileStorageConfig` | `@PostConstruct` — resolves `${app.file.upload-dir}` to an absolute path and runs `Files.createDirectories(...)` so a fresh container always has the directory. |
| `JwtConfig` | Binds `app.jwt.secret` and `app.jwt.expiry-ms` for use by `JwtTokenProvider`. |

### Backend Dockerfile

```dockerfile
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn package -DskipTests -B

FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
RUN mkdir -p /app/uploads
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

The build stage warms the dependency cache via `mvn dependency:go-offline`
before copying the source, so a source-only edit reuses the dependency
layer. The runtime stage is a minimal JRE image; `mkdir -p /app/uploads`
ensures the mount point exists even before the named volume is attached.
The produced JAR is a Spring Boot **executable JAR** (with the custom
launcher), not a plain shaded fat JAR — semantically equivalent for the
report's purposes.

## Frontend setup — concrete config

### `vite.config.ts` (full)

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
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
  },
})
```

Notes:
- `host: true` listens on `0.0.0.0` so the dev container's port mapping works.
- `watch.usePolling` is gated on `VITE_USE_POLLING=true` (set by the dev override) — Windows-mounted volumes do not propagate inotify.
- `/uploads` is also proxied so `<img src="/uploads/profiles/...">` resolves the same way in dev as in production nginx.

### `tsconfig.json` (full)

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

`noEmit: true` confirms TypeScript is type-check only; Vite is the bundler.

### `package.json` scripts

```json
"scripts": {
  "dev":     "vite",
  "build":   "vite build",
  "lint":    "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
  "preview": "vite preview"
}
```

`build` runs Vite only. `tsc` is **not** in the build pipeline.

### App composition

- `src/main.tsx` (entry) → `<React.StrictMode>` → `<App />`
- `src/app/providers.tsx`:
  ```ts
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  })
  ```
  Wraps `<QueryClientProvider>` → `<AuthProvider>` → `<ToastProvider>` → `{children}`.
- `src/app/router.tsx`: `createBrowserRouter`. Auth pages eager. Role pages (student / supervisor / committee / admin) are `lazy`-loaded.

### Axios client (`src/lib/api/client.ts`)

- Base URL: `import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'`
- `withCredentials: true`, `Content-Type: application/json`
- Request interceptor: read `localStorage.getItem('access_token')` and attach as `Authorization: Bearer ...`
- Response interceptor: on 401, remove the token, redirect to `/session-expired` unless already on `/login`/`/register`/`/forgot-password`/`/reset-password`/`/`
- Helper `getApiErrorMessage(error)` extracts `data.message → data.error → error.message → "An unexpected error occurred"`

### UI kit

Hand-built primitives only — no external component library. Files in
`src/components/ui/`:
`AlertBanner`, `Badge`, `Button`, `Card`, `Drawer`, `Input`, `Modal`,
`Pagination`, `Spinner`, `Toast`. Re-exported from `index.ts`.

### Theme

Two layers of styling primitives:

1. `tailwind.config.js` — extends Tailwind with the brand palette
   (`primary` 50–950 navy, `accent` 400–600 coral, neutrals, full
   `success`/`warning`/`error`/`info` palettes), font stack
   (`Plus Jakarta Sans`, `JetBrains Mono`), and custom animations
   (`fade-in`, `fade-in-up`, `slide-in-right`, `slide-in-up`,
   `float-slow`, `drift`, `spin-slow`).
2. `src/styles/globals.css` — `@tailwind base/components/utilities` plus
   a `:root` block exporting the same palette as CSS variables
   (`--color-primary-900: #1e3a5f`, `--color-accent-500: #ef4444`,
   `--color-success-500: #22c55e`, etc.) for components that need raw
   hex (e.g., the canvas signature pen).

### `index.html`

- Loads `Plus Jakarta Sans` (400/500/600/700) from Google Fonts with `preconnect`.
- Title: `FYP Supervision System | MMU FCI`.
- Meta description present.
- Single root: `<div id="root">` and `<script type="module" src="/src/main.tsx">`.

### Frontend Dockerfile (production)

```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG VITE_API_BASE_URL=http://localhost:8080/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### `nginx.conf`

```
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    location / { try_files $uri $uri/ /index.html; }

    location /api { return 404; }

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
}
```

`/api` returns 404 because the SPA in production talks to the backend at
the host-published port (the API base URL is baked into the bundle).
nginx exists only to serve the static SPA assets and the `/index.html`
fallback for client-side routes.

### Frontend Dockerfile.dev

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
EXPOSE 3000
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3000"]
```

The dev override mounts the host source and stomps the in-image `node_modules` with an anonymous volume.

## Build tools and package managers (current state)

| Tool | Version | Tier | How invoked |
|---|---|---|---|
| Maven | 3.9 (image `maven:3.9-eclipse-temurin-17`) | Backend | `mvn dependency:go-offline -B` then `mvn package -DskipTests -B` inside the build stage; `mvn clean compile` for local sanity, `mvn test` for unit tests, `mvn spring-boot:run` for IDE-driven local runs |
| npm | 10 (bundled with Node 20) | Frontend | `npm ci` for reproducible installs, `npm run dev` / `build` / `lint` / `preview` |
| Vite | 7.3.x | Frontend bundler | `npm run dev`, `npm run build`. Replaces nothing — the project never used CRA/`react-scripts` |
| pip | bundled with Python 3.11 | AI services | Inside Dockerfiles: `pip install --no-cache-dir -r requirements.txt`. On the host: a CPython 3.12 venv per service for offline training |
| Docker | 24 | All | `docker compose up --build` builds every image, runs Flyway, mounts volumes, exposes ports |
| Docker Compose | v2 | All | The override file is auto-merged |
| Git | 2.40+ | All | Single-author workflow on `main`; commit style is short imperative |

> **Drift in existing 5.3.3**: claims Vite "replaces the older
> `react-scripts` toolchain" — this is wrong; the project never used
> CRA. Also says the host venv installs `xgboost` and `faiss-cpu` —
> `xgboost` is gone, and `faiss-cpu` is only needed by the chatbot
> service.

## Boot sequence (Compose `up --build`)

1. `db` starts; `mysqladmin ping` health check loops every 10 s.
2. `backend` starts (`depends_on: db: service_healthy`); on first boot, Flyway scans `classpath:db/migration` and applies V1–V28+V30+V31; on subsequent boots, only newly added scripts.
3. `ai-recommendation`, `ai-proposal-analyzer`, `ai-chatbot` start in parallel — no health gate.
4. `frontend` starts after `backend` (`depends_on: backend`).
5. The dev override container additionally bind-mounts `./frontend → /app` and runs Vite with HMR.

## Notable design choices for the report

- **Single `application.yml` with env-var fallbacks** runs identically against `localhost` (IDE-driven dev) and against the Compose service names (`db`, `ai-recommendation`, etc.). No separate "docker" profile is required.
- **`spring.jpa.hibernate.ddl-auto: validate`** couples backend boot to the Flyway migration set. Drift is a startup error.
- **CORS allows both `localhost:3000` and `localhost:5173`** so the production frontend (nginx on 3000) and the Vite dev override (5173) work without re-configuration.
- **`/uploads/**` static handler** is the load-bearing piece for profile pictures, announcement attachments, and signed log PDFs — backed by a mount-point created at boot in `FileStorageConfig`.
- **Async `emailExecutor` thread pool** keeps SMTP latency off the request path; named threads aid log triage.
- **Vite 7 with polling-watch in dev** is required for Windows bind-mounts (inotify is not propagated).
- **`@/* → src/*` alias mirrored in both `tsconfig.json` and `vite.config.ts`** so type-check time and bundle time agree.
- **TanStack Query defaults** (60 s stale, 1 retry, no refocus refetch) avoid stampedes when a user tabs back to the dashboard.
- **Hand-built UI kit instead of Material UI / shadcn / Bootstrap** — ten primitive components in `src/components/ui/`, themed entirely through the Tailwind config and `globals.css`.
- **Production nginx is content-only** (`/api` returns 404) — the SPA reaches the backend through the host-published port directly.
- **`.env.example` advertises the LLM provider chain** (Groq / OpenAI / generic) so local devs can pick one without reading source.

## Items to highlight when written up

- `application.yml` is one file with env fallbacks; no profile sprawl
- Six `@Configuration` beans cover security, CORS, web (uploads), async, file-storage init, and JWT
- CORS allows both 3000 (prod) and 5173 (dev override) — explains the dual-port deployment without a re-config step
- HikariCP pool sized 5–10 for a small-cohort workload
- 50 MB multipart limit chosen to allow large proposal PDFs
- Backend Dockerfile uses `mvn dependency:go-offline` so source-only edits reuse the dep layer
- Frontend production image is `node:20-alpine` build → `nginx:alpine` serve; nginx serves only static assets
- `tsc` is not in the frontend build (only Vite); ESLint with `--max-warnings 0` is the gate
- `@/* → src/*` alias is configured in both `tsconfig.json` and `vite.config.ts`
- TanStack Query defaults: 60 s staleTime, 1 retry, `refetchOnWindowFocus: false`
- Tailwind 3.4 brand theme + a parallel set of CSS variables in `globals.css` for non-Tailwind consumers
- `index.html` preconnects to Google Fonts and loads `Plus Jakarta Sans`
- Drift items to correct: V1–V10 → V1–V28+V30+V31; "react-scripts predecessor" claim → never used CRA; host-venv `xgboost`/`faiss-cpu` claim → only `faiss-cpu`, only for the chatbot; "fat JAR" → Spring Boot executable JAR
