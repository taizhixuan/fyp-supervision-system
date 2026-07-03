import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { NOTIFICATION_QUERY_OPTIONS, invalidateAllNotifications } from './notificationCache'
import { apiClient } from '@/lib/api/client'
import type {
  SupervisorProfile,
  SvSupervisionRequest,
  Supervisee,
  ProposalForReview,
  SupervisorMeeting,
  SupervisionLogForReview,
  SuperviseeDocument,
  SupervisorAnnouncement,
  CreateSupervisorAnnouncementData,
  SupervisorDashboardStats,
  SupervisorNotification,
  RequestStatus,
  SvProposalFeedback,
} from '@/types'

// ============================================
// QUERY KEYS
// ============================================

export const supervisorKeys = {
  all: ['supervisor'] as const,
  profile: () => [...supervisorKeys.all, 'profile'] as const,
  dashboard: () => [...supervisorKeys.all, 'dashboard'] as const,
  requests: () => [...supervisorKeys.all, 'requests'] as const,
  request: (id: number) => [...supervisorKeys.requests(), id] as const,
  supervisees: () => [...supervisorKeys.all, 'supervisees'] as const,
  supervisee: (id: string) => [...supervisorKeys.supervisees(), id] as const,
  proposals: () => [...supervisorKeys.all, 'proposals'] as const,
  proposal: (id: number) => [...supervisorKeys.proposals(), id] as const,
  meetings: () => [...supervisorKeys.all, 'meetings'] as const,
  meeting: (id: number) => [...supervisorKeys.meetings(), id] as const,
  logs: () => [...supervisorKeys.all, 'logs'] as const,
  log: (id: number) => [...supervisorKeys.logs(), id] as const,
  documents: () => [...supervisorKeys.all, 'documents'] as const,
  document: (id: number) => [...supervisorKeys.documents(), id] as const,
  announcements: () => [...supervisorKeys.all, 'announcements'] as const,
  announcement: (id: number) => [...supervisorKeys.announcements(), id] as const,
  notifications: () => [...supervisorKeys.all, 'notifications'] as const,
  availability: () => [...supervisorKeys.all, 'availability'] as const,
}

export type AvailabilityEntry = {
  availabilityId?: number
  dayOfWeek: 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY'
  startTime: string // HH:mm
  endTime: string // HH:mm
  slotDurationMinutes: number
  isActive?: boolean
}

export function useSupervisorAvailability() {
  return useQuery({
    queryKey: supervisorKeys.availability(),
    queryFn: async () => {
      const { data } = await apiClient.get<{ entries: AvailabilityEntry[] }>(
        '/supervisor/availability'
      )
      return data.entries
    },
    staleTime: 60000,
  })
}

export function useSaveAvailability() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (entries: AvailabilityEntry[]) => {
      const { data } = await apiClient.put<{ entries: AvailabilityEntry[] }>(
        '/supervisor/availability',
        { entries }
      )
      return data.entries
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supervisorKeys.availability() })
    },
  })
}

// ============================================
// HOOKS
// ============================================

// Dashboard
export function useSupervisorDashboard() {
  return useQuery({
    queryKey: supervisorKeys.dashboard(),
    queryFn: async () => {
      const { data } = await apiClient.get<SupervisorDashboardStats>('/supervisor/dashboard')
      return data
    },
    staleTime: 30000,
  })
}

// Profile
export function useSupervisorProfile() {
  return useQuery({
    queryKey: supervisorKeys.profile(),
    queryFn: async () => {
      const { data } = await apiClient.get<SupervisorProfile>('/supervisor/profile')
      return data
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useUpdateSupervisorProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (profileData: Partial<SupervisorProfile>) => {
      const { data } = await apiClient.put<SupervisorProfile>('/supervisor/profile', profileData)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supervisorKeys.profile() })
    },
  })
}

// Requests
export function useSupervisionRequests(status?: RequestStatus) {
  return useQuery({
    queryKey: [...supervisorKeys.requests(), status],
    queryFn: async () => {
      const { data } = await apiClient.get<{ requests: SvSupervisionRequest[]; total: number }>(
        '/supervisor/requests',
        { params: { status } }
      )
      return data
    },
    staleTime: 30000,
  })
}

export function useSupervisionRequest(requestId: number) {
  return useQuery({
    queryKey: supervisorKeys.request(requestId),
    queryFn: async () => {
      const { data } = await apiClient.get<SvSupervisionRequest>(`/supervisor/requests/${requestId}`)
      return data
    },
    enabled: !!requestId,
  })
}

export function useRespondToRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      requestId,
      action,
      rejectionReason,
    }: {
      requestId: number
      action: 'ACCEPT' | 'REJECT'
      rejectionReason?: string
    }) => {
      const { data } = await apiClient.post(`/supervisor/requests/${requestId}/respond`, {
        action,
        rejectionReason,
      })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supervisorKeys.requests() })
      queryClient.invalidateQueries({ queryKey: supervisorKeys.dashboard() })
    },
  })
}

// Supervisees
export function useSupervisees() {
  return useQuery({
    queryKey: supervisorKeys.supervisees(),
    queryFn: async () => {
      const { data } = await apiClient.get<{ supervisees: Supervisee[]; total: number }>(
        '/supervisor/supervisees'
      )
      return data
    },
    staleTime: 60000,
  })
}

export function useSupervisee(superviseeId: string) {
  return useQuery({
    queryKey: supervisorKeys.supervisee(superviseeId),
    queryFn: async () => {
      const { data } = await apiClient.get<Supervisee>(`/supervisor/supervisees/${superviseeId}`)
      return data
    },
    enabled: !!superviseeId,
  })
}

// Proposals
export function useProposalsForReview() {
  return useQuery({
    queryKey: supervisorKeys.proposals(),
    queryFn: async () => {
      const { data } = await apiClient.get<{ proposals: ProposalForReview[]; total: number }>(
        '/supervisor/proposals'
      )
      return data
    },
    staleTime: 30000,
  })
}

export function useProposalForReview(proposalId: number) {
  return useQuery({
    queryKey: supervisorKeys.proposal(proposalId),
    queryFn: async () => {
      const { data } = await apiClient.get<ProposalForReview>(`/supervisor/proposals/${proposalId}`)
      return data
    },
    enabled: !!proposalId,
  })
}

export function useSubmitSvProposalFeedback() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      proposalId,
      content,
      feedbackType,
    }: {
      proposalId: number
      content: string
      feedbackType: SvProposalFeedback['feedbackType']
    }) => {
      const { data } = await apiClient.post(`/supervisor/proposals/${proposalId}/feedback`, {
        content,
        feedbackType,
      })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supervisorKeys.proposals() })
      queryClient.invalidateQueries({ queryKey: supervisorKeys.dashboard() })
    },
  })
}

// Meetings
export function useSupervisorMeetings(status?: string) {
  return useQuery({
    queryKey: [...supervisorKeys.meetings(), status],
    queryFn: async () => {
      const { data } = await apiClient.get<{ meetings: SupervisorMeeting[]; total: number }>(
        '/supervisor/meetings',
        { params: { status } }
      )
      return data
    },
    staleTime: 30000,
  })
}

export function useSupervisorMeeting(meetingId: number) {
  return useQuery({
    queryKey: supervisorKeys.meeting(meetingId),
    queryFn: async () => {
      const { data } = await apiClient.get<SupervisorMeeting>(`/supervisor/meetings/${meetingId}`)
      return data
    },
    enabled: !!meetingId,
  })
}

export function useRespondToMeeting() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      meetingId,
      action,
      confirmedDateTime,
      proposedDateTime,
      reason,
      notes,
    }: {
      meetingId: number
      action: 'CONFIRM' | 'RESCHEDULE' | 'CANCEL'
      confirmedDateTime?: string
      proposedDateTime?: string
      reason?: string
      notes?: string
    }) => {
      const { data } = await apiClient.post(`/supervisor/meetings/${meetingId}/respond`, {
        action,
        confirmedDateTime,
        proposedDateTime,
        reason,
        notes,
      })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supervisorKeys.meetings() })
      queryClient.invalidateQueries({ queryKey: supervisorKeys.dashboard() })
    },
  })
}

export function useSetMeetingLink() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      meetingId,
      meetingUrl,
      platform,
      location,
    }: {
      meetingId: number
      meetingUrl: string
      platform?: string
      location?: string
    }) => {
      const { data } = await apiClient.patch(`/supervisor/meetings/${meetingId}/link`, {
        meetingUrl,
        platform,
        location,
      })
      return data
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: supervisorKeys.meeting(vars.meetingId) })
      queryClient.invalidateQueries({ queryKey: supervisorKeys.meetings() })
    },
  })
}

export function useCreateMeeting() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (meetingData: Partial<SupervisorMeeting>) => {
      const { data } = await apiClient.post('/supervisor/meetings', meetingData)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supervisorKeys.meetings() })
    },
  })
}

export function useCompleteMeeting() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      meetingId,
      notes,
      actionItems,
    }: {
      meetingId: number
      notes: string
      actionItems?: string[]
    }) => {
      const { data } = await apiClient.post(`/supervisor/meetings/${meetingId}/complete`, {
        notes,
        actionItems,
      })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supervisorKeys.meetings() })
    },
  })
}

// Logs
export function useLogsForReview() {
  return useQuery({
    queryKey: supervisorKeys.logs(),
    queryFn: async () => {
      const { data } = await apiClient.get<{ logs: SupervisionLogForReview[]; total: number }>(
        '/supervisor/logs'
      )
      return data
    },
    staleTime: 30000,
  })
}

export function useLogForReview(logId: number) {
  return useQuery({
    queryKey: supervisorKeys.log(logId),
    queryFn: async () => {
      const { data } = await apiClient.get<SupervisionLogForReview>(`/supervisor/logs/${logId}`)
      return data
    },
    enabled: !!logId,
  })
}

export function useReviewLog() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      logId,
      action,
      comment,
    }: {
      logId: number
      action: 'APPROVE' | 'REQUEST_REVISION'
      comment?: string
    }) => {
      const { data } = await apiClient.post(`/supervisor/logs/${logId}/review`, {
        action,
        comment,
      })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supervisorKeys.logs() })
      queryClient.invalidateQueries({ queryKey: supervisorKeys.dashboard() })
    },
  })
}

export function useSignLog() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (logId: number) => {
      const { data } = await apiClient.post(`/supervisor/logs/${logId}/sign`)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supervisorKeys.logs() })
    },
  })
}

// Documents
export function useSuperviseeDocuments(filters?: { studentId?: string; type?: string }) {
  return useQuery({
    queryKey: [...supervisorKeys.documents(), filters],
    queryFn: async () => {
      const { data } = await apiClient.get<{ documents: SuperviseeDocument[]; total: number }>(
        '/supervisor/documents',
        { params: filters }
      )
      return data
    },
    staleTime: 60000,
  })
}

export function useSuperviseeDocument(documentId: number) {
  return useQuery({
    queryKey: supervisorKeys.document(documentId),
    queryFn: async () => {
      const { data } = await apiClient.get<SuperviseeDocument>(`/supervisor/documents/${documentId}`)
      return data
    },
    enabled: !!documentId,
  })
}

export function useSubmitDocumentFeedback() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      documentId,
      content,
      annotatedFile,
    }: {
      documentId: number
      content: string
      annotatedFile?: File
    }) => {
      const formData = new FormData()
      formData.append('content', content)
      if (annotatedFile) {
        formData.append('annotatedFile', annotatedFile)
      }
      const { data } = await apiClient.post(
        `/supervisor/documents/${documentId}/feedback`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      )
      return data
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: supervisorKeys.documents() })
      queryClient.invalidateQueries({ queryKey: supervisorKeys.document(variables.documentId) })
    },
  })
}

export function useDownloadSuperviseeDocument() {
  return useMutation({
    mutationFn: async ({ documentId, fileName }: { documentId: number; fileName: string }) => {
      const response = await apiClient.get(`/supervisor/documents/${documentId}/download`, {
        responseType: 'blob',
      })
      const blob = response.data as Blob
      const url = window.URL.createObjectURL(blob)
      const link = window.document.createElement('a')
      link.href = url
      link.download = fileName || 'document'
      window.document.body.appendChild(link)
      link.click()
      window.document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    },
  })
}

export function useDownloadFeedbackFile() {
  return useMutation({
    mutationFn: async ({ url, fileName }: { url: string; fileName: string }) => {
      const response = await apiClient.get(url, { responseType: 'blob' })
      const blob = response.data as Blob
      const objectUrl = window.URL.createObjectURL(blob)
      const link = window.document.createElement('a')
      link.href = objectUrl
      link.download = fileName || 'feedback-annotated'
      window.document.body.appendChild(link)
      link.click()
      window.document.body.removeChild(link)
      window.URL.revokeObjectURL(objectUrl)
    },
  })
}

// Announcements
export function useSupervisorAnnouncements() {
  return useQuery({
    queryKey: supervisorKeys.announcements(),
    queryFn: async () => {
      const { data } = await apiClient.get<{ announcements: SupervisorAnnouncement[]; total: number }>(
        '/supervisor/announcements'
      )
      return data
    },
    staleTime: 60000,
  })
}

export function useSupervisorAnnouncement(announcementId: number) {
  return useQuery({
    queryKey: supervisorKeys.announcement(announcementId),
    queryFn: async () => {
      const { data } = await apiClient.get<SupervisorAnnouncement>(
        `/supervisor/announcements/${announcementId}`
      )
      return data
    },
    enabled: !!announcementId,
  })
}

export function useCreateAnnouncement() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (
      announcementData: CreateSupervisorAnnouncementData,
    ) => {
      const { attachments, ...rest } = announcementData
      const formData = new FormData()
      formData.append('data', new Blob([JSON.stringify(rest)], { type: 'application/json' }))
      if (attachments && attachments.length > 0) {
        for (const file of attachments) {
          formData.append('files', file)
        }
      }
      const { data } = await apiClient.post('/supervisor/announcements', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supervisorKeys.announcements() })
    },
  })
}

export function useUpdateAnnouncement() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      announcementId,
      ...announcementData
    }: Partial<SupervisorAnnouncement> & { announcementId: number }) => {
      const { data } = await apiClient.put(
        `/supervisor/announcements/${announcementId}`,
        announcementData
      )
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supervisorKeys.announcements() })
    },
  })
}

export function useDeleteAnnouncement() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (announcementId: number) => {
      const { data } = await apiClient.delete(`/supervisor/announcements/${announcementId}`)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supervisorKeys.announcements() })
    },
  })
}

// Notifications
export function useSupervisorNotifications(limit: number = 10) {
  return useQuery({
    queryKey: [...supervisorKeys.notifications(), limit],
    queryFn: async () => {
      // Shared notification controller serves all roles at /notifications.
      // Per-role prefixes (/supervisor/notifications) were never wired on the
      // backend and would 500 with NoResourceFoundException.
      const { data } = await apiClient.get<{ notifications: SupervisorNotification[]; total: number }>(
        '/notifications',
        { params: { limit } }
      )
      return data
    },
    staleTime: 30000,
    ...NOTIFICATION_QUERY_OPTIONS,
  })
}

export function useSupervisorUnreadCount() {
  return useQuery({
    queryKey: [...supervisorKeys.notifications(), 'unread-count'],
    queryFn: async () => {
      const { data } = await apiClient.get<{ count: number }>('/notifications/unread-count')
      return data
    },
    staleTime: 30000,
    ...NOTIFICATION_QUERY_OPTIONS,
  })
}

export function useMarkSupervisorNotificationRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (notificationId: number) => {
      const { data } = await apiClient.put(`/notifications/${notificationId}/read`)
      return data
    },
    onSuccess: () => {
      invalidateAllNotifications(queryClient)
    },
  })
}
