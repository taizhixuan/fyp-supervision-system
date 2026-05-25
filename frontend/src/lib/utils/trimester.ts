/**
 * Compute "Week N of M" / weeks remaining inside an FYP cycle's date window. The
 * trimester length is derived from cycle.startDate → cycle.endDate (admin-configured)
 * rather than hard-coded to 14 weeks, since semester durations vary by intake.
 *
 * Cycle dates arrive as plain `YYYY-MM-DD` strings (backend `LocalDate`). They're
 * anchored to Asia/Kuala_Lumpur midnight (UTC+8), so day boundaries match what
 * MMU students see on the wall clock regardless of where the browser is.
 *
 * Returns null when either bound is missing so the dashboard can hide the widget.
 */
export interface TrimesterProgress {
  totalWeeks: number
  currentWeek: number
  weeksRemaining: number
  hasStarted: boolean
  hasEnded: boolean
}

const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000

/**
 * Parse `YYYY-MM-DD` as midnight in Kuala Lumpur (UTC+8). Full ISO strings with
 * an explicit time/offset are passed through untouched.
 */
function toKlInstant(value: string): number {
  return value.includes('T')
    ? new Date(value).getTime()
    : new Date(`${value}T00:00:00+08:00`).getTime()
}

export function trimesterProgress(
  startISO?: string | null,
  endISO?: string | null,
  now: Date = new Date(),
): TrimesterProgress | null {
  if (!startISO || !endISO) return null
  const start = toKlInstant(startISO)
  const end = toKlInstant(endISO)
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return null

  const nowMs = now.getTime()
  const totalWeeks = Math.max(1, Math.round((end - start) / MS_PER_WEEK))
  const hasStarted = nowMs >= start
  const hasEnded = nowMs >= end

  let currentWeek: number
  if (!hasStarted) currentWeek = 0
  else if (hasEnded) currentWeek = totalWeeks
  else currentWeek = Math.max(1, Math.min(totalWeeks, Math.ceil((nowMs - start) / MS_PER_WEEK)))

  const weeksRemaining = Math.max(0, totalWeeks - currentWeek)
  return { totalWeeks, currentWeek, weeksRemaining, hasStarted, hasEnded }
}
