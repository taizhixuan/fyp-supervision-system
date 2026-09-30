/**
 * Use for any href built from stored, user-supplied data (announcement links,
 * meeting links, profile URLs, resources). React 18 doesn't block `javascript:`
 * URLs, so one saved as a "link" would run script in the viewer's session.
 * Returns undefined (a dead link) for anything that isn't http(s).
 */
export function safeHref(url?: string | null): string | undefined {
  if (!url) return undefined
  try {
    const parsed = new URL(url.trim())
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.href : undefined
  } catch {
    return undefined
  }
}
