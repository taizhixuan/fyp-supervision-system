import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'

// Enable mock data in development mode (no backend needed)
const USE_MOCK_DATA = import.meta.env.DEV

import type {
  StudentProfile,
  UpdateStudentProfileData,
  StudentDashboardData,
  SupervisorSummary,
  SupervisorDetail,
  SupervisorRecommendation,
  RecommendationFilters,
  SupervisionRequest,
  CreateSupervisionRequestData,
  Proposal,
  ProposalVersion,
  ProposalFeedback,
  CreateProposalData,
  UpdateProposalData,
  ProposalAnalysisResult,
  ProjectRegistration,
  Meeting,
  CreateMeetingData,
  MeetingSlot,
  SupervisionLog,
  CreateLogData,
  UpdateLogData,
  FYPDocument,
  DocumentVersion,
  UploadDocumentData,
  Deadline,
  NotificationPreferences,
  ChatMessage,
  ChatSession,
  Resource,
} from '@/types'

// Query Keys
export const studentKeys = {
  all: ['student'] as const,
  dashboard: () => [...studentKeys.all, 'dashboard'] as const,
  profile: () => [...studentKeys.all, 'profile'] as const,
  supervisors: () => [...studentKeys.all, 'supervisors'] as const,
  supervisorList: (filters?: Record<string, unknown>) => [...studentKeys.supervisors(), 'list', filters] as const,
  supervisorDetail: (id: string) => [...studentKeys.supervisors(), 'detail', id] as const,
  recommendations: (filters?: RecommendationFilters) => [...studentKeys.all, 'recommendations', filters] as const,
  requests: () => [...studentKeys.all, 'requests'] as const,
  requestList: () => [...studentKeys.requests(), 'list'] as const,
  proposal: () => [...studentKeys.all, 'proposal'] as const,
  proposalCurrent: () => [...studentKeys.proposal(), 'current'] as const,
  proposalVersions: () => [...studentKeys.proposal(), 'versions'] as const,
  proposalFeedback: () => [...studentKeys.proposal(), 'feedback'] as const,
  proposalAnalysis: () => [...studentKeys.proposal(), 'analysis'] as const,
  registration: () => [...studentKeys.all, 'registration'] as const,
  meetings: () => [...studentKeys.all, 'meetings'] as const,
  meetingList: (filters?: Record<string, unknown>) => [...studentKeys.meetings(), 'list', filters] as const,
  meetingDetail: (id: string) => [...studentKeys.meetings(), 'detail', id] as const,
  meetingSlots: (supervisorId: string, date: string) => [...studentKeys.meetings(), 'slots', supervisorId, date] as const,
  logs: () => [...studentKeys.all, 'logs'] as const,
  logList: (filters?: Record<string, unknown>) => [...studentKeys.logs(), 'list', filters] as const,
  logDetail: (id: string) => [...studentKeys.logs(), 'detail', id] as const,
  documents: () => [...studentKeys.all, 'documents'] as const,
  documentList: (filters?: Record<string, unknown>) => [...studentKeys.documents(), 'list', filters] as const,
  documentDetail: (id: string) => [...studentKeys.documents(), 'detail', id] as const,
  documentVersions: (id: string) => [...studentKeys.documents(), 'versions', id] as const,
  deadlines: () => [...studentKeys.all, 'deadlines'] as const,
  notificationPrefs: () => [...studentKeys.all, 'notificationPrefs'] as const,
  chatSession: () => [...studentKeys.all, 'chat'] as const,
}

// ==================== Mock Data ====================
const MOCK_DASHBOARD: StudentDashboardData = {
  profile: {
    userId: 'mock-student-001',
    studentId: '1211234567',
    fullName: 'Ahmad bin Abdullah',
    email: 'student@mmu.edu.my',
    programCode: 'BIT',
    programName: 'Bachelor of Information Technology',
    faculty: 'Faculty of Computing and Informatics',
    intakeYear: 2021,
    expectedGraduation: '2025-06',
    cgpa: 3.45,
    skills: ['Python', 'React', 'Machine Learning'],
    researchInterests: ['AI', 'Web Development'],
    createdAt: '2024-09-01T00:00:00Z',
    updatedAt: '2025-01-20T00:00:00Z',
  },
  registrationStatus: {
    registrationId: 'reg-001',
    studentId: 'mock-student-001',
    academicYear: '2024/2025',
    semester: 2,
    cycle: 'FYP1',
    status: 'PROPOSAL_PENDING',
    nextSteps: [],
    timeline: [],
  },
  upcomingMeetings: [],
  pendingLogs: [],
  recentDocuments: [],
  upcomingDeadlines: [],
  notifications: { unreadCount: 3 },
  quickStats: { totalMeetings: 5, completedLogs: 3, documentsUploaded: 8 },
}

const MOCK_PROFILE: StudentProfile = MOCK_DASHBOARD.profile

const MOCK_SUPERVISORS: SupervisorSummary[] = [
  {
    supervisorId: 'sup-001',
    userId: 'user-sup-001',
    fullName: 'Dr. Sarah Lee',
    email: 'sarah.lee@mmu.edu.my',
    title: 'Associate Professor',
    department: 'Software Engineering',
    faculty: 'Faculty of Computing and Informatics',
    researchAreas: ['Machine Learning', 'Data Mining', 'AI'],
    currentLoad: 8,
    maxCapacity: 12,
    isAcceptingStudents: true,
  },
  {
    supervisorId: 'sup-002',
    userId: 'user-sup-002',
    fullName: 'Dr. Ahmad Rizal',
    email: 'ahmad.rizal@mmu.edu.my',
    title: 'Senior Lecturer',
    department: 'Computer Science',
    faculty: 'Faculty of Computing and Informatics',
    researchAreas: ['Cybersecurity', 'Network Security', 'IoT'],
    currentLoad: 10,
    maxCapacity: 10,
    isAcceptingStudents: false,
  },
  {
    supervisorId: 'sup-003',
    userId: 'user-sup-003',
    fullName: 'Dr. Lisa Wong',
    email: 'lisa.wong@mmu.edu.my',
    title: 'Senior Lecturer',
    department: 'Information Systems',
    faculty: 'Faculty of Computing and Informatics',
    researchAreas: ['Web Development', 'Cloud Computing', 'DevOps'],
    currentLoad: 6,
    maxCapacity: 10,
    isAcceptingStudents: true,
  },
]

// ==================== Dashboard ====================
export function useStudentDashboard() {
  return useQuery({
    queryKey: studentKeys.dashboard(),
    queryFn: async () => {
      if (USE_MOCK_DATA) return MOCK_DASHBOARD
      const { data } = await apiClient.get<StudentDashboardData>('/student/dashboard')
      return data
    },
  })
}

// ==================== Profile ====================
export function useStudentProfile() {
  return useQuery({
    queryKey: studentKeys.profile(),
    queryFn: async () => {
      if (USE_MOCK_DATA) return MOCK_PROFILE
      const { data } = await apiClient.get<StudentProfile>('/student/profile')
      return data
    },
  })
}

export function useUpdateStudentProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (profileData: UpdateStudentProfileData) => {
      const { data } = await apiClient.put<StudentProfile>('/student/profile', profileData)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studentKeys.profile() })
      queryClient.invalidateQueries({ queryKey: studentKeys.dashboard() })
    },
  })
}

// ==================== Supervisors ====================
interface SupervisorListParams {
  search?: string
  faculty?: string
  researchArea?: string
  availableOnly?: boolean
  page?: number
  limit?: number
}

export function useSupervisorList(params?: SupervisorListParams) {
  return useQuery({
    queryKey: studentKeys.supervisorList(params),
    queryFn: async () => {
      if (USE_MOCK_DATA) {
        return {
          supervisors: MOCK_SUPERVISORS,
          total: MOCK_SUPERVISORS.length,
          page: 1,
          totalPages: 1,
        }
      }
      const { data } = await apiClient.get<{
        supervisors: SupervisorSummary[]
        total: number
        page: number
        totalPages: number
      }>('/supervisors', { params })
      return data
    },
  })
}

export function useSupervisorDetail(supervisorId: string) {
  return useQuery({
    queryKey: studentKeys.supervisorDetail(supervisorId),
    queryFn: async () => {
      const { data } = await apiClient.get<SupervisorDetail>(`/supervisors/${supervisorId}`)
      return data
    },
    enabled: !!supervisorId,
  })
}

// ==================== AI Recommendations ====================
export function useSupervisorRecommendations(filters?: RecommendationFilters) {
  return useQuery({
    queryKey: studentKeys.recommendations(filters),
    queryFn: async () => {
      const { data } = await apiClient.get<{
        recommendations: SupervisorRecommendation[]
        generatedAt: string
      }>('/student/recommendations', { params: filters })
      return data
    },
  })
}

export function useRefreshRecommendations() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post<{
        recommendations: SupervisorRecommendation[]
        generatedAt: string
      }>('/student/recommendations/refresh')
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studentKeys.recommendations() })
    },
  })
}

// ==================== Supervision Requests ====================
export function useSupervisionRequests() {
  return useQuery({
    queryKey: studentKeys.requestList(),
    queryFn: async () => {
      const { data } = await apiClient.get<{
        requests: SupervisionRequest[]
      }>('/student/supervision-requests')
      return data
    },
  })
}

export function useCreateSupervisionRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (requestData: CreateSupervisionRequestData) => {
      const { data } = await apiClient.post<SupervisionRequest>('/student/supervision-requests', requestData)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studentKeys.requestList() })
      queryClient.invalidateQueries({ queryKey: studentKeys.dashboard() })
    },
  })
}

export function useWithdrawSupervisionRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (requestId: string) => {
      await apiClient.post(`/student/supervision-requests/${requestId}/withdraw`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studentKeys.requestList() })
    },
  })
}

// ==================== Proposal ====================
export function useCurrentProposal() {
  return useQuery({
    queryKey: studentKeys.proposalCurrent(),
    queryFn: async () => {
      const { data } = await apiClient.get<Proposal>('/student/proposal')
      return data
    },
  })
}

export function useProposalVersions() {
  return useQuery({
    queryKey: studentKeys.proposalVersions(),
    queryFn: async () => {
      const { data } = await apiClient.get<{
        versions: ProposalVersion[]
      }>('/student/proposal/versions')
      return data
    },
  })
}

export function useProposalFeedback() {
  return useQuery({
    queryKey: studentKeys.proposalFeedback(),
    queryFn: async () => {
      const { data } = await apiClient.get<{
        feedback: ProposalFeedback[]
      }>('/student/proposal/feedback')
      return data
    },
  })
}

export function useCreateProposal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (proposalData: CreateProposalData) => {
      const { data } = await apiClient.post<Proposal>('/student/proposal', proposalData)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studentKeys.proposal() })
      queryClient.invalidateQueries({ queryKey: studentKeys.dashboard() })
    },
  })
}

export function useUpdateProposal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (proposalData: UpdateProposalData) => {
      const { data } = await apiClient.put<Proposal>('/student/proposal', proposalData)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studentKeys.proposal() })
    },
  })
}

export function useSubmitProposal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post<Proposal>('/student/proposal/submit')
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studentKeys.proposal() })
      queryClient.invalidateQueries({ queryKey: studentKeys.dashboard() })
      queryClient.invalidateQueries({ queryKey: studentKeys.registration() })
    },
  })
}

export function useUploadProposalFile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      const { data } = await apiClient.post<Proposal>('/student/proposal/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studentKeys.proposal() })
    },
  })
}

// ==================== AI Proposal Analysis ====================
export function useProposalAnalysis() {
  return useQuery({
    queryKey: studentKeys.proposalAnalysis(),
    queryFn: async () => {
      const { data } = await apiClient.get<ProposalAnalysisResult>('/student/proposal/analysis')
      return data
    },
  })
}

export function useAnalyzeProposal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post<ProposalAnalysisResult>('/student/proposal/analyze')
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studentKeys.proposalAnalysis() })
    },
  })
}

// ==================== Registration Status ====================
export function useProjectRegistration() {
  return useQuery({
    queryKey: studentKeys.registration(),
    queryFn: async () => {
      const { data } = await apiClient.get<ProjectRegistration>('/student/registration')
      return data
    },
  })
}

// ==================== Meetings ====================
interface MeetingListParams {
  status?: string
  from?: string
  to?: string
  page?: number
  limit?: number
}

export function useMeetingList(params?: MeetingListParams) {
  return useQuery({
    queryKey: studentKeys.meetingList(params),
    queryFn: async () => {
      const { data } = await apiClient.get<{
        meetings: Meeting[]
        total: number
      }>('/student/meetings', { params })
      return data
    },
  })
}

export function useMeetingDetail(meetingId: string) {
  return useQuery({
    queryKey: studentKeys.meetingDetail(meetingId),
    queryFn: async () => {
      const { data } = await apiClient.get<Meeting>(`/student/meetings/${meetingId}`)
      return data
    },
    enabled: !!meetingId,
  })
}

export function useSupervisorAvailableSlots(supervisorId: string, date: string) {
  return useQuery({
    queryKey: studentKeys.meetingSlots(supervisorId, date),
    queryFn: async () => {
      const { data } = await apiClient.get<{
        slots: MeetingSlot[]
      }>(`/supervisors/${supervisorId}/availability`, { params: { date } })
      return data
    },
    enabled: !!supervisorId && !!date,
  })
}

export function useCreateMeeting() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (meetingData: CreateMeetingData) => {
      const { data } = await apiClient.post<Meeting>('/student/meetings', meetingData)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studentKeys.meetings() })
      queryClient.invalidateQueries({ queryKey: studentKeys.dashboard() })
    },
  })
}

export function useCancelMeeting() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ meetingId, reason }: { meetingId: string; reason?: string }) => {
      await apiClient.post(`/student/meetings/${meetingId}/cancel`, { reason })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studentKeys.meetings() })
    },
  })
}

interface ExportMeetingsParams {
  format: 'PDF' | 'CSV' | 'ICAL'
  dateRange?: string
  startDate?: string
  endDate?: string
  status?: string
  includeNotes?: boolean
  includeAgenda?: boolean
}

export function useExportMeetings() {
  return useMutation({
    mutationFn: async (params: ExportMeetingsParams) => {
      const { data } = await apiClient.post<Blob>('/student/meetings/export', params, {
        responseType: 'blob',
      })
      return data
    },
  })
}

// ==================== Supervision Logs ====================
interface LogListParams {
  status?: string
  page?: number
  limit?: number
}

export function useLogList(params?: LogListParams) {
  return useQuery({
    queryKey: studentKeys.logList(params),
    queryFn: async () => {
      const { data } = await apiClient.get<{
        logs: SupervisionLog[]
        total: number
      }>('/student/logs', { params })
      return data
    },
  })
}

export function useLogDetail(logId: string) {
  return useQuery({
    queryKey: studentKeys.logDetail(logId),
    queryFn: async () => {
      const { data } = await apiClient.get<SupervisionLog>(`/student/logs/${logId}`)
      return data
    },
    enabled: !!logId,
  })
}

export function useCreateLog() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (logData: CreateLogData) => {
      const { data } = await apiClient.post<SupervisionLog>('/student/logs', logData)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studentKeys.logs() })
      queryClient.invalidateQueries({ queryKey: studentKeys.dashboard() })
    },
  })
}

export function useUpdateLog() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ logId, logData }: { logId: string; logData: UpdateLogData }) => {
      const { data } = await apiClient.put<SupervisionLog>(`/student/logs/${logId}`, logData)
      return data
    },
    onSuccess: (_, { logId }) => {
      queryClient.invalidateQueries({ queryKey: studentKeys.logDetail(logId) })
      queryClient.invalidateQueries({ queryKey: studentKeys.logList() })
    },
  })
}

export function useSubmitLog() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (logId: string) => {
      const { data } = await apiClient.post<SupervisionLog>(`/student/logs/${logId}/submit`)
      return data
    },
    onSuccess: (_, logId) => {
      queryClient.invalidateQueries({ queryKey: studentKeys.logDetail(logId) })
      queryClient.invalidateQueries({ queryKey: studentKeys.logList() })
      queryClient.invalidateQueries({ queryKey: studentKeys.dashboard() })
    },
  })
}

export function useSignLog() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (logId: string) => {
      const { data } = await apiClient.post<SupervisionLog>(`/student/logs/${logId}/sign`)
      return data
    },
    onSuccess: (_, logId) => {
      queryClient.invalidateQueries({ queryKey: studentKeys.logDetail(logId) })
      queryClient.invalidateQueries({ queryKey: studentKeys.logList() })
    },
  })
}

export function useUploadLogAttachment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ logId, file }: { logId: string; file: File }) => {
      const formData = new FormData()
      formData.append('file', file)
      const { data } = await apiClient.post<SupervisionLog>(`/student/logs/${logId}/attachment`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return data
    },
    onSuccess: (_, { logId }) => {
      queryClient.invalidateQueries({ queryKey: studentKeys.logDetail(logId) })
    },
  })
}

// ==================== Documents ====================
interface DocumentListParams {
  type?: string
  phase?: string
  page?: number
  limit?: number
}

export function useDocumentList(params?: DocumentListParams) {
  return useQuery({
    queryKey: studentKeys.documentList(params),
    queryFn: async () => {
      const { data } = await apiClient.get<{
        documents: FYPDocument[]
        total: number
      }>('/student/documents', { params })
      return data
    },
  })
}

export function useDocumentDetail(documentId: string) {
  return useQuery({
    queryKey: studentKeys.documentDetail(documentId),
    queryFn: async () => {
      const { data } = await apiClient.get<FYPDocument>(`/student/documents/${documentId}`)
      return data
    },
    enabled: !!documentId,
  })
}

export function useDocumentVersions(documentId: string) {
  return useQuery({
    queryKey: studentKeys.documentVersions(documentId),
    queryFn: async () => {
      const { data } = await apiClient.get<{
        versions: DocumentVersion[]
      }>(`/student/documents/${documentId}/versions`)
      return data
    },
    enabled: !!documentId,
  })
}

export function useUploadDocument() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (uploadData: UploadDocumentData) => {
      const formData = new FormData()
      formData.append('title', uploadData.title)
      formData.append('type', uploadData.type)
      formData.append('phase', uploadData.phase)
      if (uploadData.description) {
        formData.append('description', uploadData.description)
      }
      formData.append('file', uploadData.file)
      const { data } = await apiClient.post<FYPDocument>('/student/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studentKeys.documents() })
      queryClient.invalidateQueries({ queryKey: studentKeys.dashboard() })
    },
  })
}

export function useDeleteDocument() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (documentId: string) => {
      await apiClient.delete(`/student/documents/${documentId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studentKeys.documents() })
    },
  })
}

// ==================== Deadlines ====================
export function useDeadlines() {
  return useQuery({
    queryKey: studentKeys.deadlines(),
    queryFn: async () => {
      const { data } = await apiClient.get<{
        deadlines: Deadline[]
      }>('/student/deadlines')
      return data
    },
  })
}

// ==================== Notification Preferences ====================
export function useNotificationPreferences() {
  return useQuery({
    queryKey: studentKeys.notificationPrefs(),
    queryFn: async () => {
      const { data } = await apiClient.get<NotificationPreferences>('/student/notification-preferences')
      return data
    },
  })
}

export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (prefs: NotificationPreferences) => {
      const { data } = await apiClient.put<NotificationPreferences>('/student/notification-preferences', prefs)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studentKeys.notificationPrefs() })
    },
  })
}

// ==================== Chatbot ====================
export function useChatSession() {
  return useQuery({
    queryKey: studentKeys.chatSession(),
    queryFn: async () => {
      const { data } = await apiClient.get<ChatSession>('/student/chat')
      return data
    },
  })
}

export function useSendChatMessage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (message: string) => {
      const { data } = await apiClient.post<ChatMessage>('/student/chat', { message })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studentKeys.chatSession() })
    },
  })
}

export function useClearChatSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      await apiClient.delete('/student/chat')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studentKeys.chatSession() })
    },
  })
}

// Alias for chatbot page
export function useChatbot() {
  return useSendChatMessage()
}

// ==================== Notifications ====================
interface Notification {
  notificationId: string
  title: string
  message: string
  type: string
  isRead: boolean
  actionUrl?: string
  createdAt: string
}

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    notificationId: '1',
    title: 'Meeting Confirmed',
    message: 'Your meeting with Dr. Sarah Lee on 25 Jan at 10:00 AM has been confirmed.',
    type: 'MEETING',
    isRead: false,
    actionUrl: '/student/meetings/1',
    createdAt: '2025-01-20T10:30:00Z',
  },
  {
    notificationId: '2',
    title: 'Proposal Feedback Available',
    message: 'Your supervisor has provided feedback on your proposal.',
    type: 'FEEDBACK',
    isRead: false,
    createdAt: '2025-01-19T14:00:00Z',
  },
  {
    notificationId: '3',
    title: 'Deadline Reminder',
    message: 'Proposal submission deadline is in 7 days.',
    type: 'DEADLINE',
    isRead: true,
    createdAt: '2025-01-18T09:00:00Z',
  },
]

export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      if (USE_MOCK_DATA) {
        return { notifications: MOCK_NOTIFICATIONS, total: MOCK_NOTIFICATIONS.length }
      }
      const { data } = await apiClient.get<{
        notifications: Notification[]
        total: number
      }>('/notifications')
      return data
    },
  })
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (notificationId: string) => {
      await apiClient.put(`/notifications/${notificationId}/read`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

export function useMarkAllRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      await apiClient.put('/notifications/mark-all-read')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

// ==================== Resources ====================
export function useResources(category?: string) {
  return useQuery({
    queryKey: ['resources', category],
    queryFn: async () => {
      const { data } = await apiClient.get<{
        resources: Resource[]
        total: number
      }>('/resources', { params: { category } })
      return data
    },
  })
}

export function useResourceDetail(resourceId: string) {
  return useQuery({
    queryKey: ['resources', 'detail', resourceId],
    queryFn: async () => {
      const { data } = await apiClient.get<Resource>(`/resources/${resourceId}`)
      return data
    },
    enabled: !!resourceId,
  })
}
