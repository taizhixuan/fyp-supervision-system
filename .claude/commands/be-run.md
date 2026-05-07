---
description: Run Spring Boot backend on :8080
---

Run `cd backend; mvn spring-boot:run` (in background so I can continue working).

Pre-flight:
- MySQL must be reachable. Either start it via `docker-compose up -d db` (host port 3307) or rely on a local install on 3306. Default `application.yml` points to 3306 — for the docker-compose db, set `DB_URL=jdbc:mysql://localhost:3307/fyp_supervision?...`.
- Flyway migrations run on startup; if you've added a new V<N>__*.sql, this is when it applies.
- JPA is `ddl-auto: validate` — startup will fail if entity fields don't match the schema.

Backend serves at http://localhost:8080/api (note the `/api` context-path).
