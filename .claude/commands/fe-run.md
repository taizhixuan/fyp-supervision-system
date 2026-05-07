---
description: Run Vite dev server for frontend on :3000
---

Run `cd frontend; npm run dev` (in background so I can continue working).

If `node_modules` is missing or stale, run `npm install` first.

Vite serves at http://localhost:3000 with `/api` proxied to http://localhost:8080. JWT token persists in `localStorage` under key `access_token` — use DevTools → Application → Local Storage to inspect.

Note: when running standalone (not via docker-compose), `VITE_USE_POLLING` is not needed — that's only required inside the Docker mounted volume.
