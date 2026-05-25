/**
 * Helpers for round-tripping a <input type="datetime-local"> value with the
 * backend, which stores LocalDateTime (no timezone). The naive pattern
 * `new Date(value).toISOString()` shifts the value by the user's UTC offset
 * before the backend strips the offset — for Malaysia (UTC+8) this lands
 * meetings 8 hours earlier than the user picked. Skip the Date round-trip.
 */

/**
 * Convert a `datetime-local` form value ("YYYY-MM-DDTHH:mm") into the
 * ISO-8601 LOCAL string the backend's LocalDateTime.parse expects
 * ("YYYY-MM-DDTHH:mm:ss"). Returns the input unchanged if it already has
 * seconds.
 */
export function localDatetimeToLocalDateTime(value: string): string {
  if (!value) return value
  // "2026-05-27T14:00" → "2026-05-27T14:00:00"
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return `${value}:00`
  return value
}

/**
 * Convert a backend LocalDateTime ("YYYY-MM-DDTHH:mm[:ss]") into the value
 * shape a <input type="datetime-local"> expects ("YYYY-MM-DDTHH:mm"), with
 * no timezone shift.
 */
export function localDateTimeToInput(value?: string | null): string {
  if (!value) return ''
  const m = value.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/)
  return m ? `${m[1]}T${m[2]}` : ''
}
