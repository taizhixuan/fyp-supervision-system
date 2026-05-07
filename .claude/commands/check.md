---
description: Pre-commit sanity — backend compile + frontend lint, in parallel
---

Run these two checks **in parallel** (single message with two Bash tool calls):

1. `cd backend; mvn compile -q` — verifies Lombok annotation processing, JPA entity validity, and that nothing imports a removed symbol.
2. `cd frontend; npm run lint` — ESLint with `--max-warnings 0`.

Report results compactly:
- If both pass: just say "backend compile OK, frontend lint OK".
- If either fails: paste the failing output (truncated to ~30 lines per failure) and suggest the fix.

Do NOT run `mvn clean` — that wipes `target/` and slows the next compile by ~30s.
Do NOT run the frontend `vite build` — `tsc` was removed from build because of pre-existing strict errors; lint is the canonical fast check.
