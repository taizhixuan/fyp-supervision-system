import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import type {
  CalendarFeedStatus,
  MeetingActionItem,
  MeetingActionItemStatus,
  MeetingActionItemsResponse,
  ProjectActionItemsResponse,
} from '@/types'

type MeetingRole = 'student' | 'supervisor'

export const meetingExtrasKeys = {
  all: ['meeting-extras'] as const,
  meetingActionItems: (role: MeetingRole, meetingId: string | number) =>
    [...meetingExtrasKeys.all, 'action-items', role, String(meetingId)] as const,
  studentActionItems: () => [...meetingExtrasKeys.all, 'action-items', 'student', 'project'] as const,
  calendarFeed: () => [...meetingExtrasKeys.all, 'calendar-feed'] as const,
}

// ==================== Action items ====================

export function useMeetingActionItems(role: MeetingRole, meetingId: string | number | undefined) {
  return useQuery({
    queryKey: meetingExtrasKeys.meetingActionItems(role, meetingId ?? ''),
    queryFn: async () => {
      const { data } = await apiClient.get<MeetingActionItemsResponse>(`/${role}/meetings/${meetingId}/action-items`)
      return data
    },
    enabled: !!meetingId,
  })
}

export function useStudentActionItems() {
  return useQuery({
    queryKey: meetingExtrasKeys.studentActionItems(),
    queryFn: async () => {
      const { data } = await apiClient.get<ProjectActionItemsResponse>('/student/action-items')
      return data
    },
  })
}

export function useSetActionItemStatus(role: MeetingRole) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ actionItemId, status }: { actionItemId: number; status: MeetingActionItemStatus }) => {
      const { data } = await apiClient.patch<MeetingActionItem>(`/${role}/action-items/${actionItemId}`, { status })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...meetingExtrasKeys.all, 'action-items'] })
    },
  })
}

export function useAddActionItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ meetingId, description, dueDate }: { meetingId: number; description: string; dueDate?: string }) => {
      const { data } = await apiClient.post<MeetingActionItem>(`/supervisor/meetings/${meetingId}/action-items`, {
        description,
        dueDate: dueDate || null,
      })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...meetingExtrasKeys.all, 'action-items'] })
      queryClient.invalidateQueries({ queryKey: ['supervisor', 'meetings'] })
    },
  })
}

export function useDeleteActionItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (actionItemId: number) => {
      await apiClient.delete(`/supervisor/action-items/${actionItemId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...meetingExtrasKeys.all, 'action-items'] })
      queryClient.invalidateQueries({ queryKey: ['supervisor', 'meetings'] })
    },
  })
}

// ==================== No-show ====================

export function useMarkNoShow() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ meetingId, reason }: { meetingId: number; reason?: string }) => {
      const { data } = await apiClient.post(`/supervisor/meetings/${meetingId}/no-show`, { reason: reason || '' })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supervisor', 'meetings'] })
    },
  })
}

// ==================== Calendar subscription feed ====================

export function useCalendarFeedStatus() {
  return useQuery({
    queryKey: meetingExtrasKeys.calendarFeed(),
    queryFn: async () => {
      const { data } = await apiClient.get<CalendarFeedStatus>('/calendar/feed-token')
      return data
    },
  })
}

export function useRotateCalendarFeed() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post<CalendarFeedStatus>('/calendar/feed-token')
      return data
    },
    onSuccess: (data) => {
      // Keep the raw token out of the cache; the card holds it in local state.
      queryClient.setQueryData(meetingExtrasKeys.calendarFeed(), { ...data, token: undefined })
    },
  })
}

export function useRevokeCalendarFeed() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      await apiClient.delete('/calendar/feed-token')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: meetingExtrasKeys.calendarFeed() })
    },
  })
}

/** Absolute feed URL for a raw token, resolved against the API base (works for relative bases too). */
export function calendarFeedUrl(token: string): string {
  const base = (apiClient.defaults.baseURL || '/api').replace(/\/$/, '')
  return new URL(`${base}/calendar/feed/${token}.ics`, window.location.origin).toString()
}
