---
description: Start full stack via docker-compose and tail backend logs
---

Start the full stack:
1. Run `docker-compose up -d` from the repo root (brings up db, backend, frontend in Vite dev mode, and all 3 AI services).
2. Run `docker-compose ps` to confirm services are healthy.
3. Tail backend logs with `docker-compose logs -f backend` (run in background so I can keep working).

Notes:
- `docker-compose.override.yml` is auto-merged — frontend runs in Vite dev mode on **:5173** (not 3000).
- MySQL is exposed on host port **3307** (not 3306) to avoid colliding with a local MySQL.
- If db container fails to come up, check that nothing else is bound to 3307.
