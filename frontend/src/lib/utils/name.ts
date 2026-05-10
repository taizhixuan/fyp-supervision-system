// Strips academic / honorific prefixes from a full name. Without this, names
// like "Dr. Tan Wei Ming" yield "Dr." for the first space-separated token,
// which surfaces as "Welcome back, Dr." in greetings or "D" as the avatar
// initial. Used for greetings and avatar fallbacks across the app.
const HONORIFIC_RE = /^(Dr\.?|Prof\.?|Mr\.?|Mrs\.?|Ms\.?|Mdm\.?|Datuk|Dato'?|Datin)\s+/i

export function stripHonorific(fullName?: string | null): string {
  if (!fullName) return ''
  return fullName.replace(HONORIFIC_RE, '').trim()
}

export function firstNameOf(fullName?: string | null): string | undefined {
  const stripped = stripHonorific(fullName)
  return stripped.split(' ')[0] || undefined
}

// Single-letter avatar fallback. Returns "?" if the name is empty after
// stripping honorifics, so the avatar never renders a blank circle.
export function avatarInitial(fullName?: string | null): string {
  const stripped = stripHonorific(fullName)
  return (stripped.charAt(0) || '?').toUpperCase()
}

// Two-letter initials for circular avatars (header user menu, profile cards).
// Strips honorifics first so "Dr. Tan Wei Ming" yields "TW", not "DT".
export function avatarInitials(fullName?: string | null): string {
  const stripped = stripHonorific(fullName)
  const initials = stripped
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase()
  return initials || '?'
}
