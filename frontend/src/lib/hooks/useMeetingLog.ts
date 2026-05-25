import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import type {
  MeetingLog,
  MeetingLogStatus,
  CreateMeetingLogData,
  UpdateMeetingLogData,
  SignMeetingLogData,
} from '@/types/meetingLog'

// Query Keys
export const meetingLogKeys = {
  all: ['meetingLogs'] as const,
  lists: () => [...meetingLogKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) => [...meetingLogKeys.lists(), filters] as const,
  details: () => [...meetingLogKeys.all, 'detail'] as const,
  detail: (id: string) => [...meetingLogKeys.details(), id] as const,
  prefill: (meetingId?: string) => [...meetingLogKeys.all, 'prefill', meetingId ?? null] as const,
  supervisorLists: () => [...meetingLogKeys.all, 'supervisor', 'list'] as const,
  supervisorList: (filters?: Record<string, unknown>) =>
    [...meetingLogKeys.supervisorLists(), filters] as const,
}

export interface MeetingLogPrefill {
  meetingNumber: number
  projectTitle: string
  fypPhase: 'FYP1' | 'FYP2'
  meetingId?: number
  meetingDate?: string
  meetingMode?: 'ONLINE' | 'PHYSICAL'
}

export function useMeetingLogPrefill(meetingId?: string) {
  return useQuery({
    queryKey: meetingLogKeys.prefill(meetingId),
    queryFn: async () => {
      const { data } = await apiClient.get<MeetingLogPrefill>('/student/meeting-logs/prefill', {
        params: meetingId ? { meetingId } : undefined,
      })
      return data
    },
  })
}

// ==================== Student Hooks ====================

interface MeetingLogListParams {
  status?: MeetingLogStatus
  page?: number
  limit?: number
  [key: string]: unknown
}

export function useMeetingLogList(params?: MeetingLogListParams) {
  return useQuery({
    queryKey: meetingLogKeys.list(params),
    queryFn: async () => {
      const { data } = await apiClient.get<{
        logs: MeetingLog[]
        total: number
      }>('/student/meeting-logs', { params })
      return data
    },
  })
}

export function useMeetingLogDetail(logId: string) {
  return useQuery({
    queryKey: meetingLogKeys.detail(logId),
    queryFn: async () => {
      const { data } = await apiClient.get<MeetingLog>(`/student/meeting-logs/${logId}`)
      return data
    },
    enabled: !!logId,
  })
}

export function useCreateMeetingLog() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (logData: CreateMeetingLogData & { status: 'DRAFT' | 'SUBMITTED' }) => {
      const { data } = await apiClient.post<MeetingLog>('/student/meeting-logs', logData)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: meetingLogKeys.lists() })
    },
  })
}

export function useUpdateMeetingLog() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      logId,
      logData,
    }: {
      logId: string
      logData: UpdateMeetingLogData
    }) => {
      const { data } = await apiClient.put<MeetingLog>(
        `/student/meeting-logs/${logId}`,
        logData
      )
      return data
    },
    onSuccess: (_, { logId }) => {
      queryClient.invalidateQueries({ queryKey: meetingLogKeys.detail(logId) })
      queryClient.invalidateQueries({ queryKey: meetingLogKeys.lists() })
    },
  })
}

export function useSubmitMeetingLog() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (logId: string) => {
      const { data } = await apiClient.post<MeetingLog>(
        `/student/meeting-logs/${logId}/submit`
      )
      return data
    },
    onSuccess: (_, logId) => {
      queryClient.invalidateQueries({ queryKey: meetingLogKeys.detail(logId) })
      queryClient.invalidateQueries({ queryKey: meetingLogKeys.lists() })
    },
  })
}

export function useSignMeetingLog() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      logId,
      signatureData,
    }: {
      logId: string
      signatureData: SignMeetingLogData
    }) => {
      const { data } = await apiClient.post<MeetingLog>(
        `/student/meeting-logs/${logId}/sign`,
        signatureData
      )
      return data
    },
    onSuccess: (_, { logId }) => {
      queryClient.invalidateQueries({ queryKey: meetingLogKeys.detail(logId) })
      queryClient.invalidateQueries({ queryKey: meetingLogKeys.lists() })
    },
  })
}

// ==================== Supervisor Hooks ====================

export function useSupervisorMeetingLogList(params?: MeetingLogListParams) {
  return useQuery({
    queryKey: meetingLogKeys.supervisorList(params),
    queryFn: async () => {
      const { data } = await apiClient.get<{
        logs: MeetingLog[]
        total: number
      }>('/supervisor/meeting-logs', { params })
      return data
    },
  })
}

export function useSupervisorMeetingLogDetail(logId: string) {
  return useQuery({
    queryKey: [...meetingLogKeys.detail(logId), 'supervisor'],
    queryFn: async () => {
      const { data } = await apiClient.get<MeetingLog>(
        `/supervisor/meeting-logs/${logId}`
      )
      return data
    },
    enabled: !!logId,
  })
}

export function useAddSupervisorComments() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      logId,
      comments,
    }: {
      logId: string
      comments: string
    }) => {
      const { data } = await apiClient.put<MeetingLog>(
        `/supervisor/meeting-logs/${logId}/comments`,
        { supervisorComments: comments }
      )
      return data
    },
    onSuccess: (_, { logId }) => {
      queryClient.invalidateQueries({ queryKey: meetingLogKeys.detail(logId) })
    },
  })
}

export function useRequestMeetingLogCorrection() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      logId,
      reason,
    }: {
      logId: string
      reason: string
    }) => {
      const { data } = await apiClient.post<MeetingLog>(
        `/supervisor/meeting-logs/${logId}/request-correction`,
        { correctionReason: reason }
      )
      return data
    },
    onSuccess: (_, { logId }) => {
      queryClient.invalidateQueries({ queryKey: meetingLogKeys.detail(logId) })
      queryClient.invalidateQueries({ queryKey: meetingLogKeys.supervisorLists() })
    },
  })
}

export function useSupervisorSignMeetingLog() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      logId,
      signatureData,
    }: {
      logId: string
      signatureData: SignMeetingLogData
    }) => {
      const { data } = await apiClient.post<MeetingLog>(
        `/supervisor/meeting-logs/${logId}/sign`,
        signatureData
      )
      return data
    },
    onSuccess: (_, { logId }) => {
      queryClient.invalidateQueries({ queryKey: meetingLogKeys.detail(logId) })
      queryClient.invalidateQueries({ queryKey: meetingLogKeys.supervisorLists() })
    },
  })
}

/**
 * Download one meeting log as a populated MMU FCI .docx file.
 * Triggers a browser download via an in-memory blob URL.
 */
export function useExportMeetingLog() {
  return useMutation({
    mutationFn: async (logId: string | number) => {
      const response = await apiClient.get(
        `/student/meeting-logs/${logId}/export.docx`,
        { responseType: 'blob' },
      )
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const disp = (response.headers as Record<string, string>)['content-disposition'] || ''
      const match = disp.match(/filename="?([^";]+)"?/i)
      a.download = match?.[1] || `MeetingLog_${logId}.docx`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
      return true
    },
  })
}

/**
 * Download all of the student's logs for the given phase as a zipped bundle.
 */
export function useExportMeetingLogsBulk() {
  return useMutation({
    mutationFn: async (phase: 'FYP1' | 'FYP2') => {
      const response = await apiClient.get('/student/meeting-logs/export.zip', {
        params: { phase },
        responseType: 'blob',
      })
      const blob = new Blob([response.data], { type: 'application/zip' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const disp = (response.headers as Record<string, string>)['content-disposition'] || ''
      const match = disp.match(/filename="?([^";]+)"?/i)
      a.download = match?.[1] || `MeetingLogs_${phase}.zip`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
      return true
    },
  })
}
