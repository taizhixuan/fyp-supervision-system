// Meetings module extensions shared by student + supervisor (and committee) views.

export type MeetingActionItemStatus = 'OPEN' | 'DONE'

export interface MeetingActionItem {
  actionItemId: number
  description: string
  status: MeetingActionItemStatus
  dueDate: string | null
  meetingId: number | null
  meetingTitle: string | null
  meetingDate: string | null
  createdAt: string | null
  completedAt: string | null
  completedByName: string | null
  overdue: boolean
}

/** GET /{role}/meetings/{id}/action-items */
export interface MeetingActionItemsResponse {
  items: MeetingActionItem[]
  carriedOver: MeetingActionItem[]
}

/** GET /student/action-items */
export interface ProjectActionItemsResponse {
  open: MeetingActionItem[]
  done: MeetingActionItem[]
  openCount: number
}

/** GET/POST /calendar/feed-token — `token` only present right after POST. */
export interface CalendarFeedStatus {
  enabled: boolean
  createdAt: string | null
  lastAccessedAt: string | null
  token?: string
}
