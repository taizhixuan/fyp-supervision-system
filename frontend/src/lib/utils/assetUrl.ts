/**
 * Resolve a backend-stored upload path (e.g. "uploads/profiles/123/uuid-foo.jpg")
 * into a URL the browser can fetch.
 *
 * - Empty/null → null (caller renders fallback / initials).
 * - Already absolute (http://, https://, blob:, data:) → returned as-is.
 * - Relative (no leading slash) → prefixed with "/" so it routes through the dev
 *   proxy ('/uploads' → :8080) in dev and through nginx in production. Both serve
 *   files at the same path under /uploads/**.
 */
export function assetUrl(path?: string | null): string | null {
  if (!path) return null
  const trimmed = path.trim()
  if (!trimmed) return null
  if (/^(https?:|blob:|data:)/i.test(trimmed)) return trimmed
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`
}
