// Single source of truth for date rendering across the app.
// Absolute format: "23 May 2026" — day-first, three-letter month, four-digit year.
// Relative format: "Just now", "12m ago", "3h ago", "Yesterday", "3d ago", then absolute.

function parse(value: string | Date | undefined | null): Date | null {
  if (!value) return null
  const d = value instanceof Date ? value : new Date(value)
  return isNaN(d.getTime()) ? null : d
}

export function formatDate(value: string | Date | undefined | null): string {
  const d = parse(value)
  if (!d) return ''
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function formatDateTime(value: string | Date | undefined | null): string {
  const d = parse(value)
  if (!d) return ''
  const date = d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
  const time = d.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  })
  return `${date}, ${time}`
}

export function formatRelativeDate(value: string | Date | undefined | null): string {
  const d = parse(value)
  if (!d) return ''
  const diffSec = Math.floor((Date.now() - d.getTime()) / 1000)
  if (diffSec < 60) return 'Just now'
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDay = Math.floor(diffHr / 24)
  if (diffDay === 1) return 'Yesterday'
  if (diffDay < 7) return `${diffDay} days ago`
  return formatDate(d)
}
