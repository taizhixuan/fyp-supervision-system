# FYP Supervision System

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
![Java](https://img.shields.io/badge/Java-17-007396?logo=openjdk&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2.5-6DB33F?logo=springboot&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-AI%20services-000000?logo=flask&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-8-4479A1?logo=mysql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)

Previously deployed at `app.supervisi.me` on a DigitalOcean droplet behind Caddy with Let's Encrypt HTTPS. That instance has been taken down, so there is no public demo right now — the stack runs locally with `docker-compose up --build` (see Getting Started).

## What It Does

A single platform for running Final Year Projects. Students find a supervisor, submit proposals, book meetings, keep meeting logs, and manage documents in one place instead of spreading it across email, spreadsheets, and forms.

It also has three AI features: supervisor recommendations from your project topic, automated proposal analysis, and a chatbot for common FYP questions.

## Screenshots

Captured from the deployed stack.

![Landing page](docs/screenshots/landing.png)

| Sign in | Register |
|---|---|
| ![Login page](docs/screenshots/login.png) | ![Registration page](docs/screenshots/register.png) |

## Prerequisites

- Java 17+
- Node.js 18+ and npm
- Docker and Docker Compose
- MySQL 8 (only if you run the database outside Docker)
- A Groq or OpenAI API key for the chatbot and the proposal analyzer's optional LLM pass. The supervisor-recommendation engine runs locally and needs no key.

## Getting Started

### 1. Clone

```bash
git clone <repository-url>
cd fyp-supervision-system
```

### 2. Environment variables

```bash
cp .env.example .env
```

Set in `.env`:

- `JWT_SECRET`: at least 32 characters. Don't ship the default.
- `GROQ_API_KEY` or `OPENAI_API_KEY`: LLM key for the chatbot and the proposal analyzer's optional LLM pass (Groq is the default provider).
- `VITE_API_BASE_URL`: backend API base URL for the frontend, e.g. `http://localhost:8080/api`.
- `DB_URL`, `DB_USER`, `DB_PASS`: database connection.
- Email (optional): set `APP_EMAIL_ENABLED=true` plus `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`, and `APP_EMAIL_FROM` to send real email. Left at `false`, verification codes and reset links are written to the backend log instead. See `.env.example`.

### 3. Run with Docker Compose

```bash
docker-compose up --build
```

`docker-compose.override.yml` is auto-merged, so the default run uses the Vite dev server with hot reload:

- MySQL on host port 3307 (container 3306; the offset avoids clashing with a local MySQL on 3306)
- Backend API on 8080 (context path `/api`)
- Frontend dev on 5173 (Vite, HMR). Rename or remove `docker-compose.override.yml` for the nginx production build on 3000.
- AI recommendation on 5001, proposal analyzer on 5002, chatbot on 5003

To run the frontend on the host instead: `cd frontend && npm run dev` with `VITE_API_BASE_URL=http://localhost:8080/api`.

### 4. Run services individually

Backend:

```bash
cd backend
mvn clean install
mvn spring-boot:run
```

Runs on `http://localhost:8080/api`.

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Runs on `http://localhost:3000`.

AI services:

```bash
cd ai-recommendation  # or ai-proposal-analyzer, ai-chatbot
pip install -r requirements.txt
python app.py
```

## Configuration

### Database

MySQL 8. Docker Compose sets it up automatically. For local development, create the database first:

```sql
CREATE DATABASE fyp_supervision;
```

Then set `DB_URL`, `DB_USER`, `DB_PASS` (env vars, or `backend/src/main/resources/application.yml`).

### File uploads

Uploads go to `./uploads` (backend) or `/app/uploads` (Docker). Configure with the `FILE_UPLOAD_DIR` env var or `app.file.upload-dir` in `application.yml`.

### JWT

- `JWT_SECRET`: signing key
- `JWT_EXPIRY_MS`: token lifetime in ms (default 24h)

### Email

SMTP email (verification codes, notifications, password reset) is off by default.

- `APP_EMAIL_ENABLED`: `true` to send, `false` to log codes and links instead
- `MAIL_HOST`, `MAIL_PORT`: SMTP server (e.g. `smtp.gmail.com:587`, or a relay like Brevo on 2525)
- `MAIL_USERNAME`, `MAIL_PASSWORD`: credentials
- `APP_EMAIL_FROM`: sender address
- `APP_BASE_URL`: base URL used in email links

### CORS

When the frontend and backend run on different origins, the backend allows the frontend origin. In production, match the CORS origins and cookie/same-site settings to your deployment.

## API

Base URL `http://localhost:8080/api`. Main prefixes:

- `/auth/*`: login, register + email verification, password reset
- `/student/*`, `/supervisor/*`, `/committee/*`, `/admin/*`: role endpoints
- `/supervisors/*`: student-facing supervisor directory
- `/announcements/*`: announcements (audience-filtered per student)
- `/notifications/*`: notifications
- `/resources/*`: resource documents

Access is derived from the URL prefix in `SecurityConfig` (e.g. `/student/**` needs the `STUDENT` role).

## Development

Backend: `cd backend && mvn spring-boot:run`. Migrations use Flyway, under `backend/src/main/resources/db/migration/`.

Frontend: `cd frontend && npm run dev` (Vite HMR).

Tests and lint:

```bash
cd backend && mvn test
cd frontend && npm run lint
```

## Building for Production

Backend:

```bash
cd backend
mvn clean package
java -jar target/supervision-1.0.0.jar
```

Frontend:

```bash
cd frontend
npm run build
```

Output goes to `frontend/dist/`.

## Troubleshooting

**Database connection:** check MySQL is running, the credentials match `.env`/`application.yml`, and the database exists.

**Port in use:** stop whatever holds the port, or change it in `docker-compose.yml`.

**AI services:** check `GROQ_API_KEY` (or `OPENAI_API_KEY`) is set (only the chatbot and proposal analyzer need it), the services are up, and their logs with `docker-compose logs ai-recommendation`.

**File uploads:** make sure the upload directory exists and is writable, and check the 50MB size limit in `application.yml`.

## License

[MIT](LICENSE). Originally built as a Final Year Project at MMU FCI.
