import type { Meeting, SupervisorMeeting } from '@/types'

/**
 * "Add to calendar" helpers for Google Calendar and Outlook web. Apple Calendar (and any
 * other app) uses the backend-generated .ics file instead.
 *
 * Backend meeting times are naive Malaysia-local strings ("2026-05-30T14:00"). Parsing them
 * with `new Date()` would apply the browser's zone, so they are converted to UTC by hand
 * (Malaysia is a fixed UTC+8 with no DST).
 */
const APP_UTC_OFFSET_HOURS = 8

export interface CalendarEvent {
  title: string
  start: string
  durationMinutes?: number
  description?: string
  location?: string
}

/** Naive Malaysia-local date-time → Date (UTC instant). Strings with an explicit zone pass through. */
export function parseAppDateTime(value: string): Date | null {
  if (!value) return null
  if (/(Z|[+-]\d{2}:?\d{2})$/.test(value)) {
    const d = new Date(value)
    return Number.isNaN(d.getTime()) ? null : d
  }
  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?/)
  if (!m) return null
  const [, y, mo, d, h, mi, s] = m
  return new Date(Date.UTC(+y, +mo - 1, +d, +h - APP_UTC_OFFSET_HOURS, +mi, s ? +s : 0))
}

function eventRange(evt: CalendarEvent): { start: Date; end: Date } | null {
  const start = parseAppDateTime(evt.start)
  if (!start) return null
  const minutes = evt.durationMinutes && evt.durationMinutes > 0 ? evt.durationMinutes : 60
  return { start, end: new Date(start.getTime() + minutes * 60_000) }
}

/** Date → "YYYYMMDDTHHMMSSZ" (Google's dates= format). */
function toCompactUtc(d: Date): string {
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

/** Date → "YYYY-MM-DDTHH:MM:SSZ" (Outlook's startdt/enddt format). */
function toIsoUtc(d: Date): string {
  return d.toISOString().replace(/\.\d{3}/, '')
}

export function buildGoogleCalendarUrl(evt: CalendarEvent): string | null {
  const range = eventRange(evt)
  if (!range) return null
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: evt.title,
    dates: `${toCompactUtc(range.start)}/${toCompactUtc(range.end)}`,
  })
  if (evt.description) params.set('details', evt.description)
  if (evt.location) params.set('location', evt.location)
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

/** `live` = personal Outlook.com / Hotmail, `office` = Microsoft 365 work or school account. */
export function buildOutlookCalendarUrl(evt: CalendarEvent, host: 'live' | 'office'): string | null {
  const range = eventRange(evt)
  if (!range) return null
  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: evt.title,
    startdt: toIsoUtc(range.start),
    enddt: toIsoUtc(range.end),
  })
  if (evt.description) params.set('body', evt.description)
  if (evt.location) params.set('location', evt.location)
  return `https://outlook.${host}.com/calendar/0/deeplink/compose?${params.toString()}`
}

function describe(parts: Array<[string, string | undefined | null]>, agenda?: string): string {
  const lines = parts.filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`)
  if (agenda?.trim()) lines.push('', 'Agenda:', agenda.trim())
  return lines.join('\n')
}

export function studentMeetingToCalendarEvent(m: Meeting): CalendarEvent {
  const start = m.confirmedStartAt || m.scheduledAt || m.proposedStartAt || ''
  return {
    title: m.title || 'FYP Meeting',
    start,
    durationMinutes: m.duration,
    location: m.location || m.meetingLink || undefined,
    description: describe(
      [
        ['Supervisor', m.supervisor?.fullName],
        ['Join', m.meetingLink],
      ],
      m.agenda,
    ),
  }
}

export function supervisorMeetingToCalendarEvent(m: SupervisorMeeting): CalendarEvent {
  return {
    title: m.title || 'FYP Meeting',
    start: m.confirmedDateTime || m.proposedDateTime || '',
    durationMinutes: m.duration,
    location: m.location || m.meetingUrl || undefined,
    description: describe(
      [
        ['Student', m.studentName],
        ['Join', m.meetingUrl],
      ],
      m.agenda,
    ),
  }
}
