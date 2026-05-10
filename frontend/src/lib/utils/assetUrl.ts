/**
 * Resolve a backend-stored upload path (e.g. "uploads/profiles/123/uuid-foo.jpg")
 * into a URL the browser can fetch.
 *
 * The backend runs under `server.servlet.context-path: /api`, so static
 * uploads are served at `/api/uploads/...`. We build the absolute URL against
 * `VITE_API_BASE_URL` (the same base the axios client uses), which already
 * includes the `/api` prefix — that way the URL works both in dev (no Vite
 * proxy needed) and in production (no nginx /uploads location needed).
 *
 * - Empty/null → null (caller renders fallback / initials).
 * - Already absolute (http://, https://, blob:, data:) → returned as-is.
 * - Relative path (with or without leading slash) → joined onto the API base.
 */
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) || 'http://localhost:8080/api'

export function assetUrl(path?: string | null): string | null {
  if (!path) return null
  const trimmed = path.trim()
  if (!trimmed) return null
  if (/^(https?:|blob:|data:)/i.test(trimmed)) return trimmed
  const base = API_BASE_URL.replace(/\/$/, '')
  const tail = trimmed.replace(/^\//, '')
  return `${base}/${tail}`
}
