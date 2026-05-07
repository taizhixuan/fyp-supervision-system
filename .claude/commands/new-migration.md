---
description: Scaffold the next Flyway migration file
---

Find the highest existing `V<N>__*.sql` in `backend/src/main/resources/db/migration/`, then create `V<N+1>__$ARGUMENTS.sql` with a brief comment header describing the change.

Constraints:
- NEVER edit any existing `V*.sql` file. Applied migrations are immutable.
- Use snake_case for the description (e.g. `add_user_avatar_column`, not `AddUserAvatar`).
- The migration must be idempotent-safe where possible (`CREATE TABLE IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS` on MySQL 8).
- After writing the file, remind me to run the backend (`cd backend; mvn spring-boot:run`) so Flyway picks it up, or to restart the docker-compose backend service.
