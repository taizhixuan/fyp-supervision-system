import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import type {
  FYPAnnouncement,
  CreateAnnouncementData,
  SubmitProposalReviewData,
  GeneralDocument,
  CommitteeUploadDocumentData,
  ProjectOverview,
  CommitteeProjectStatus,
  PairingStatus,
  UnpairedStudent,
  ProjectDetail,
  ReportConfig,
  GeneratedReport,
  CycleSummary,
} from '@/types'
import type { CycleStatus } from '@/types/committee'

// ============================================
// QUERY KEYS
// ============================================

export const committeeKeys = {
  all: ['committee'] as const,
  dashboard: () => [...committeeKeys.all, 'dashboard'] as const,
  alerts: () => [...committeeKeys.all, 'alerts'] as const,
  activities: () => [...committeeKeys.all, 'activities'] as const,
  announcements: () => [...committeeKeys.all, 'announcements'] as const,
  announcement: (id: number) => [...committeeKeys.announcements(), id] as const,
  proposals: () => [...committeeKeys.all, 'proposals'] as const,
  proposal: (id: number) => [...committeeKeys.proposals(), id] as const,
  documents: () => [...committeeKeys.all, 'documents'] as const,
  document: (id: number) => [...committeeKeys.documents(), id] as const,
  projects: () => [...committeeKeys.all, 'projects'] as const,
  project: (id: number) => [...committeeKeys.projects(), id] as const,
  unpairedStudents: () => [...committeeKeys.all, 'unpaired-students'] as const,
  supervisorLoads: () => [...committeeKeys.all, 'supervisor-loads'] as const,
  supervisorLoad: (id: string) => [...committeeKeys.supervisorLoads(), id] as const,
  reports: () => [...committeeKeys.all, 'reports'] as const,
  report: (id: number) => [...committeeKeys.reports(), id] as const,
  notifications: () => [...committeeKeys.all, 'notifications'] as const,
  unreadCount: () => [...committeeKeys.notifications(), 'unread'] as const,
}

// ============================================
// DASHBOARD HOOKS
// ============================================

export function useCommitteeDashboard() {
  return useQuery({
    queryKey: committeeKeys.dashboard(),
    queryFn: async () => {
      const { data } = await apiClient.get('/committee/dashboard')
      return data
    },
  })
}

// ============================================
// ANNOUNCEMENT HOOKS
// ============================================

export function useCommitteeAnnouncements() {
  return useQuery({
    queryKey: committeeKeys.announcements(),
    queryFn: async () => {
      const { data } = await apiClient.get('/committee/announcements')
      return data
    },
  })
}

export function useCommitteeAnnouncement(announcementId: number) {
  return useQuery({
    queryKey: committeeKeys.announcement(announcementId),
    queryFn: async () => {
      const { data } = await apiClient.get(`/committee/announcements/${announcementId}`)
      return data
    },
    enabled: !!announcementId,
  })
}

export function useCreateCommitteeAnnouncement() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: CreateAnnouncementData) => {
      // Always send multipart so the backend can parse files + JSON in one request.
      const { attachments, ...jsonPayload } = data
      const formData = new FormData()
      formData.append('data', new Blob([JSON.stringify(jsonPayload)], { type: 'application/json' }))
      if (attachments && attachments.length > 0) {
        for (const file of attachments) {
          formData.append('files', file)
        }
      }
      const { data: responseData } = await apiClient.post('/committee/announcements', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return responseData
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: committeeKeys.announcements() })
    },
  })
}

export function useUpdateCommitteeAnnouncement() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: Partial<FYPAnnouncement> & { announcementId: number }) => {
      const { announcementId, ...body } = data
      const { data: responseData } = await apiClient.put(`/committee/announcements/${announcementId}`, body)
      return responseData
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: committeeKeys.announcements() })
      queryClient.invalidateQueries({ queryKey: committeeKeys.announcement(variables.announcementId) })
    },
  })
}

export function useArchiveAnnouncement() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (announcementId: number) => {
      const { data } = await apiClient.post(`/committee/announcements/${announcementId}/archive`)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: committeeKeys.announcements() })
    },
  })
}

// ============================================
// PROPOSAL REVIEW HOOKS
// ============================================

export function useCommitteeProposals(filters?: { status?: string; cycle?: string; programme?: string }) {
  return useQuery({
    queryKey: [...committeeKeys.proposals(), filters],
    queryFn: async () => {
      const { data } = await apiClient.get('/committee/proposals', { params: filters })
      return data
    },
  })
}

export function useCommitteeProposal(proposalId: number) {
  return useQuery({
    queryKey: committeeKeys.proposal(proposalId),
    queryFn: async () => {
      const { data } = await apiClient.get(`/committee/proposals/${proposalId}`)
      return data
    },
    enabled: !!proposalId,
  })
}

export function useSubmitCommitteeProposalReview() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: SubmitProposalReviewData) => {
      const { proposalId, ...body } = data
      const { data: responseData } = await apiClient.post(`/committee/proposals/${proposalId}/review`, body)
      return responseData
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: committeeKeys.proposals() })
      queryClient.invalidateQueries({ queryKey: committeeKeys.proposal(variables.proposalId) })
      queryClient.invalidateQueries({ queryKey: committeeKeys.dashboard() })
    },
  })
}

// ============================================
// GENERAL DOCUMENTS HOOKS
// ============================================

export function useGeneralDocuments(filters?: { category?: string; visibility?: string }) {
  return useQuery({
    queryKey: [...committeeKeys.documents(), filters],
    queryFn: async () => {
      const { data } = await apiClient.get('/committee/documents', { params: filters })
      return data
    },
  })
}

export function useGeneralDocument(documentId: number) {
  return useQuery({
    queryKey: committeeKeys.document(documentId),
    queryFn: async () => {
      const { data } = await apiClient.get(`/committee/documents/${documentId}`)
      return data
    },
    enabled: !!documentId,
  })
}

export function useUploadGeneralDocument() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: CommitteeUploadDocumentData) => {
      const formData = new FormData()
      formData.append('file', data.file)
      formData.append('title', data.title)
      formData.append('category', data.category)
      formData.append('visibility', data.visibility)
      if (data.description) formData.append('description', data.description)
      if (data.changeNotes) formData.append('changeNotes', data.changeNotes)
      if (data.cycleScope) formData.append('cycleScope', data.cycleScope)
      const { data: responseData } = await apiClient.post('/committee/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return responseData
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: committeeKeys.documents() })
    },
  })
}

export function useUpdateGeneralDocument() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: { documentId: number; file?: File; changeNotes?: string } & Partial<GeneralDocument>) => {
      const { documentId, file, ...rest } = data
      const formData = new FormData()
      if (file) formData.append('file', file)
      Object.entries(rest).forEach(([key, value]) => {
        if (value !== undefined && value !== null) formData.append(key, String(value))
      })
      const { data: responseData } = await apiClient.put(`/committee/documents/${documentId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return responseData
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: committeeKeys.documents() })
      queryClient.invalidateQueries({ queryKey: committeeKeys.document(variables.documentId) })
    },
  })
}

export function useDeleteGeneralDocument() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (documentId: number) => {
      const { data } = await apiClient.delete(`/committee/documents/${documentId}`)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: committeeKeys.documents() })
    },
  })
}

// ============================================
// PROJECT & PAIRING HOOKS
// ============================================

export function useCommitteeCycles() {
  return useQuery({
    queryKey: [...committeeKeys.all, 'cycles'] as const,
    queryFn: async (): Promise<{ cycles: CycleSummary[]; total: number }> => {
      const { data } = await apiClient.get('/committee/cycles')
      return data
    },
    // Dropdown stays fresh without a manual refresh: poll 60s, treat as fresh for 30s.
    // Window-focus refetch is on by default.
    staleTime: 30_000,
    refetchInterval: 60_000,
  })
}

export function useProjectOverview(params: {
  cycleId?: number
  cycleStatus?: CycleStatus
  projectStatus?: CommitteeProjectStatus
  pairingStatus?: PairingStatus
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH'
  search?: string
  page?: number
  size?: number
} = {}) {
  return useQuery({
    queryKey: [...committeeKeys.projects(), params],
    queryFn: async () => {
      const { data } = await apiClient.get<{
        content?: ProjectOverview[]
        totalElements?: number
        totalPages?: number
        number?: number
        size?: number
      }>('/committee/projects', {
        params: {
          cycleId: params.cycleId,
          cycleStatus: params.cycleStatus,
          projectStatus: params.projectStatus,
          pairingStatus: params.pairingStatus,
          riskLevel: params.riskLevel,
          search: params.search || undefined,
          page: params.page ?? 0,
          size: params.size ?? 20,
        },
      })
      return {
        projects: data.content ?? [],
        total: data.totalElements ?? 0,
        totalPages: data.totalPages ?? 0,
        page: data.number ?? 0,
        size: data.size ?? (params.size ?? 20),
      }
    },
    placeholderData: (prev) => prev,
  })
}

export function useProjectDetail(projectId: number) {
  return useQuery({
    queryKey: committeeKeys.project(projectId),
    queryFn: async (): Promise<ProjectDetail | null> => {
      const { data } = await apiClient.get(`/committee/projects/${projectId}`)
      return data
    },
    enabled: !!projectId,
  })
}

export function useUnpairedStudents(cycleId?: number) {
  return useQuery({
    queryKey: [...committeeKeys.unpairedStudents(), cycleId],
    queryFn: async () => {
      const { data } = await apiClient.get('/committee/projects/unpaired-students', {
        params: { cycleId },
      })
      return data as { students: UnpairedStudent[] }
    },
  })
}

export function useSupervisorLoads() {
  return useQuery({
    queryKey: committeeKeys.supervisorLoads(),
    queryFn: async () => {
      const { data } = await apiClient.get('/committee/projects/supervisor-loads')
      return data
    },
  })
}

export function useSupervisorLoadDetail(supervisorId: string) {
  return useQuery({
    queryKey: committeeKeys.supervisorLoad(supervisorId),
    queryFn: async () => {
      const { data } = await apiClient.get(`/committee/projects/supervisor-loads/${supervisorId}`)
      return data
    },
    enabled: !!supervisorId,
  })
}

export function useExportProjects() {
  return useMutation({
    mutationFn: async (options: {
      format: 'CSV' | 'XLSX' | 'PDF'
      filters?: {
        cycleId?: number
        cycleStatus?: CycleStatus
        projectStatus?: CommitteeProjectStatus
        pairingStatus?: PairingStatus
        riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH'
        search?: string
      }
    }) => {
      const response = await apiClient.get('/committee/projects/export', {
        params: { format: options.format.toLowerCase(), ...(options.filters || {}) },
        responseType: 'blob',
      })
      const blob = response.data as Blob
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const disposition = response.headers['content-disposition'] as string | undefined
      const match = disposition?.match(/filename="?([^";]+)"?/i)
      a.download = match ? match[1]
        : `projects-${new Date().toISOString().slice(0, 10)}.${options.format.toLowerCase()}`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      return { success: true }
    },
  })
}

// ============================================
// REPORTS HOOKS
// ============================================

export function useGeneratedReports() {
  return useQuery({
    queryKey: committeeKeys.reports(),
    queryFn: async () => {
      const { data } = await apiClient.get('/committee/reports')
      return data
    },
  })
}

export function useGenerateReport() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (config: ReportConfig) => {
      const { data } = await apiClient.post('/committee/reports/generate', config)
      return data as GeneratedReport
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: committeeKeys.reports() })
    },
  })
}

export function useDownloadReport() {
  return useMutation({
    mutationFn: async (report: GeneratedReport) => {
      const response = await apiClient.get(`/committee/reports/${report.reportId}/download`, {
        responseType: 'blob',
      })
      const blob = response.data as Blob
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const disposition = response.headers['content-disposition'] as string | undefined
      const match = disposition?.match(/filename="?([^";]+)"?/i)
      a.download = match ? match[1]
        : `${report.title.replace(/[^a-z0-9-]+/gi, '_')}.${report.format.toLowerCase()}`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      return { success: true }
    },
  })
}

export function useDeleteReport() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (reportId: number) => {
      const { data } = await apiClient.delete(`/committee/reports/${reportId}`)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: committeeKeys.reports() })
    },
  })
}

// ============================================
// NOTIFICATION HOOKS
// ============================================

export function useCommitteeNotifications(limit = 50) {
  return useQuery({
    queryKey: [...committeeKeys.notifications(), limit],
    queryFn: async () => {
      const { data } = await apiClient.get('/notifications', { params: { limit } })
      return data
    },
  })
}

export function useCommitteeUnreadCount() {
  return useQuery({
    queryKey: committeeKeys.unreadCount(),
    queryFn: async () => {
      const { data } = await apiClient.get('/notifications/unread-count')
      return data
    },
  })
}

export function useMarkCommitteeNotificationRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (notificationId: number) => {
      const { data } = await apiClient.put(`/notifications/${notificationId}/read`)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: committeeKeys.notifications() })
      queryClient.invalidateQueries({ queryKey: committeeKeys.unreadCount() })
    },
  })
}

export function useMarkAllCommitteeNotificationsRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.put('/notifications/mark-all-read')
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: committeeKeys.notifications() })
      queryClient.invalidateQueries({ queryKey: committeeKeys.unreadCount() })
    },
  })
}
