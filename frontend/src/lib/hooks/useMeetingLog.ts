import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import type {
  MeetingLog,
  MeetingLogStatus,
  CreateMeetingLogData,
  UpdateMeetingLogData,
  SignMeetingLogData,
  MeetingLogTask,
} from '@/types/meetingLog'
import { getDefaultTasks, MEETING_LOG_TASKS } from '@/types/meetingLog'

// Enable mock data in development mode (no backend needed)
const USE_MOCK_DATA = false

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

// ==================== Mock Data ====================
const MOCK_MEETING_LOGS: MeetingLog[] = [
  {
    logId: 'ml-001',
    projectId: 'proj-001',
    meetingId: 'meeting-001',
    meetingDate: '2025-01-20',
    meetingNumber: 1,
    meetingMode: 'PHYSICAL',
    projectTitle: 'AI-Powered FYP Supervision Management System',
    fypPhase: 'FYP1',
    student: {
      studentId: 'student-001',
      fullName: 'Ahmad bin Abdullah',
      matricNo: '1211234567',
      programme: 'Bachelor of Information Technology',
    },
    supervisor: {
      supervisorId: 'sup-001',
      fullName: 'Dr. Sarah Lee',
      title: 'Associate Professor',
    },
    tasks: [
      { taskCode: 'PLANNING', label: 'Planning', isSelected: true, details: 'Discussed project scope and timeline' },
      { taskCode: 'LITERATURE_REVIEW', label: 'Literature Review', isSelected: true, details: 'Reviewed 10 related papers' },
      { taskCode: 'REQUIREMENT_ANALYSIS', label: 'Requirement Analysis', isSelected: false },
      { taskCode: 'DESIGN_METHODOLOGY', label: 'Design & Methodology', isSelected: false },
      { taskCode: 'PROTOTYPE_POC', label: 'Prototype / Proof of Concept', isSelected: false },
      { taskCode: 'DRAFT_REPORT', label: 'Draft Report / Report Writing', isSelected: false },
    ],
    workDoneDetails: 'Completed initial project planning phase. Identified key requirements and reviewed existing literature on AI-powered academic supervision systems. Discussed potential technologies including React, Spring Boot, and PostgreSQL.',
    workToBeDone: 'Begin requirement analysis phase. Create detailed use case diagrams and system architecture document. Continue literature review focusing on machine learning approaches.',
    problemsAndSolutions: 'Initial challenge with scope definition - resolved by narrowing focus to MMU FCI specifically rather than generic university system.',
    supervisorComments: 'Good progress on initial planning. Please ensure the literature review covers recent publications (2022-2024). Consider exploring existing FYP management systems for reference.',
    status: 'LOCKED',
    signatures: [
      {
        signatureId: 'sig-001',
        signerUserId: 'sup-001',
        signerName: 'Dr. Sarah Lee',
        signerRole: 'SUPERVISOR',
        // SVG signature - "Dr. Sarah Lee"
        signatureImageUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMjAgNjBjNS0yMCAxNS0zNSAzMC0zNXMxNSAyMCAxMCAzNWMtNSAxMC0xNSAxNS0yMCAxMCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMWExYTFhIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPjxwYXRoIGQ9Ik02MCA0NWM1LTUgMTUtMTAgMjAtNXM1IDE1IDAgMjBjLTMgMy04IDUtMTIgMyIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMWExYTFhIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPjxwYXRoIGQ9Ik05MCA1MGMxMC01IDI1LTEwIDQwLTVzMjAgMTUgMTUgMjVjLTUgOC0xNSAxMC0yNSA4cy0xNS0xMC0xMC0xOGMzLTUgMTAtOCAxOC02IiBmaWxsPSJub25lIiBzdHJva2U9IiMxYTFhMWEiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+PHBhdGggZD0iTTE2MCA0NWM1LTMgMTUtNSAyMCAwczUgMTUgMCAyMGMtNSAzLTEwIDUtMTUgMCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMWExYTFhIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPjxwYXRoIGQ9Ik0xOTAgMzVjMCAxNSA1IDM1IDEwIDM1czEwLTUgMTUtMTUiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzFhMWExYSIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz48cGF0aCBkPSJNMjIwIDQ1YzUtNSAxNS0xMCAyMC01czUgMTUgMCAyMGMtMyA1LTEwIDUtMTUgMCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMWExYTFhIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPjxwYXRoIGQ9Ik0yNTUgNDVjNS01IDEwLTEwIDE1LTVzNSAxMCAwIDE1Yy01IDMtMTAgNS0xNSAwIiBmaWxsPSJub25lIiBzdHJva2U9IiMxYTFhMWEiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+PC9zdmc+',
        signatureSha256: 'abc123def456',
        signedAt: '2025-01-21T10:00:00Z',
      },
      {
        signatureId: 'sig-002',
        signerUserId: 'student-001',
        signerName: 'Ahmad bin Abdullah',
        signerRole: 'STUDENT',
        // SVG signature - "Ahmad"
        signatureImageUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjUwIiBoZWlnaHQ9IjgwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXRoIGQ9Ik0yMCA1MGMxMC0yNSAyMC0zNSAzNS0zMHMxNSAyMCA1IDM1Yy01IDgtMTUgMTItMjAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzFhMWExYSIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz48cGF0aCBkPSJNNjAgMjVjMCAyMCA1IDQwIDEwIDQwczEwLTEwIDEwLTI1IiBmaWxsPSJub25lIiBzdHJva2U9IiMxYTFhMWEiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+PHBhdGggZD0iTTgwIDM1YzAgMTUgMTAgMzAgMjAgMjVzMTAtMjAgMC0zMGMtNS01LTE1LTUtMjAgMHMtNSAxNSAwIDIwYzUgMyAxMCA1IDE1IDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzFhMWExYSIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz48cGF0aCBkPSJNMTMwIDMwYzUgMjAgMTAgMzUgMTUgMzVzMTAtMTUgMTAtMzBjMC0xMC01LTE1LTEwLTEwcy01IDE1IDAgMjBjMyAzIDggNSAxMiAwIiBmaWxsPSJub25lIiBzdHJva2U9IiMxYTFhMWEiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+PHBhdGggZD0iTTE3MCAyNWMwIDIwIDUgNDAgMTAgNDBzMTAtMTAgMTAtMjVjMC0xMC01LTE1LTEwLTEwcy01IDEwIDAgMTVjMyAzIDggNSAxMiAwIiBmaWxsPSJub25lIiBzdHJva2U9IiMxYTFhMWEiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+PHBhdGggZD0iTTIxMCAyNWMwIDIwIDUgNDAgMTAgNDBzMTAtMTAgMTAtMjUiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzFhMWExYSIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz48L3N2Zz4=',
        signatureSha256: 'xyz789ghi012',
        signedAt: '2025-01-21T11:00:00Z',
      },
    ],
    createdAt: '2025-01-20T09:00:00Z',
    updatedAt: '2025-01-21T11:00:00Z',
    submittedAt: '2025-01-20T16:00:00Z',
    lockedAt: '2025-01-21T11:00:00Z',
  },
  {
    logId: 'ml-002',
    projectId: 'proj-001',
    meetingId: 'meeting-002',
    meetingDate: '2025-01-27',
    meetingNumber: 2,
    meetingMode: 'ONLINE',
    projectTitle: 'AI-Powered FYP Supervision Management System',
    fypPhase: 'FYP1',
    student: {
      studentId: 'student-001',
      fullName: 'Ahmad bin Abdullah',
      matricNo: '1211234567',
      programme: 'Bachelor of Information Technology',
    },
    supervisor: {
      supervisorId: 'sup-001',
      fullName: 'Dr. Sarah Lee',
      title: 'Associate Professor',
    },
    tasks: [
      { taskCode: 'PLANNING', label: 'Planning', isSelected: false },
      { taskCode: 'LITERATURE_REVIEW', label: 'Literature Review', isSelected: true, details: 'Completed additional 5 papers on ML in education' },
      { taskCode: 'REQUIREMENT_ANALYSIS', label: 'Requirement Analysis', isSelected: true, details: 'Created use case diagrams' },
      { taskCode: 'DESIGN_METHODOLOGY', label: 'Design & Methodology', isSelected: true, details: 'Drafted system architecture' },
      { taskCode: 'PROTOTYPE_POC', label: 'Prototype / Proof of Concept', isSelected: false },
      { taskCode: 'DRAFT_REPORT', label: 'Draft Report / Report Writing', isSelected: false },
    ],
    workDoneDetails: 'Continued literature review with 5 additional papers on ML applications in education. Created initial use case diagrams for student, supervisor, and committee roles. Drafted preliminary system architecture showing frontend, backend, and database layers.',
    workToBeDone: 'Finalize use case diagrams. Begin database schema design. Start writing Chapter 1 (Introduction) of the proposal.',
    problemsAndSolutions: '',
    supervisorComments: 'Excellent progress! The use case diagrams look comprehensive. Please add more detail to the system architecture regarding API design.',
    status: 'SUPERVISOR_SIGNED',
    signatures: [
      {
        signatureId: 'sig-003',
        signerUserId: 'sup-001',
        signerName: 'Dr. Sarah Lee',
        signerRole: 'SUPERVISOR',
        // SVG signature that looks like handwritten "Dr. Sarah Lee"
        signatureImageUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMjAgNjBjNS0yMCAxNS0zNSAzMC0zNXMxNSAyMCAxMCAzNWMtNSAxMC0xNSAxNS0yMCAxMCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMWExYTFhIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPjxwYXRoIGQ9Ik02MCA0NWM1LTUgMTUtMTAgMjAtNXM1IDE1IDAgMjBjLTMgMy04IDUtMTIgMyIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMWExYTFhIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPjxwYXRoIGQ9Ik05MCA1MGMxMC01IDI1LTEwIDQwLTVzMjAgMTUgMTUgMjVjLTUgOC0xNSAxMC0yNSA4cy0xNS0xMC0xMC0xOGMzLTUgMTAtOCAxOC02IiBmaWxsPSJub25lIiBzdHJva2U9IiMxYTFhMWEiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+PHBhdGggZD0iTTE2MCA0NWM1LTMgMTUtNSAyMCAwczUgMTUgMCAyMGMtNSAzLTEwIDUtMTUgMCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMWExYTFhIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPjxwYXRoIGQ9Ik0xOTAgMzVjMCAxNSA1IDM1IDEwIDM1czEwLTUgMTUtMTUiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzFhMWExYSIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz48cGF0aCBkPSJNMjIwIDQ1YzUtNSAxNS0xMCAyMC01czUgMTUgMCAyMGMtMyA1LTEwIDUtMTUgMCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMWExYTFhIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPjxwYXRoIGQ9Ik0yNTUgNDVjNS01IDEwLTEwIDE1LTVzNSAxMCAwIDE1Yy01IDMtMTAgNS0xNSAwIiBmaWxsPSJub25lIiBzdHJva2U9IiMxYTFhMWEiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+PC9zdmc+',
        signatureSha256: 'def456ghi789',
        signedAt: '2025-01-28T14:00:00Z',
      },
    ],
    createdAt: '2025-01-27T10:00:00Z',
    updatedAt: '2025-01-28T14:00:00Z',
    submittedAt: '2025-01-27T17:00:00Z',
  },
  {
    logId: 'ml-003',
    projectId: 'proj-001',
    meetingDate: '2025-02-03',
    meetingNumber: 3,
    meetingMode: 'PHYSICAL',
    projectTitle: 'AI-Powered FYP Supervision Management System',
    fypPhase: 'FYP1',
    student: {
      studentId: 'student-001',
      fullName: 'Ahmad bin Abdullah',
      matricNo: '1211234567',
      programme: 'Bachelor of Information Technology',
    },
    supervisor: {
      supervisorId: 'sup-001',
      fullName: 'Dr. Sarah Lee',
      title: 'Associate Professor',
    },
    tasks: [
      { taskCode: 'PLANNING', label: 'Planning', isSelected: false },
      { taskCode: 'LITERATURE_REVIEW', label: 'Literature Review', isSelected: false },
      { taskCode: 'REQUIREMENT_ANALYSIS', label: 'Requirement Analysis', isSelected: true, details: 'Finalized all use cases' },
      { taskCode: 'DESIGN_METHODOLOGY', label: 'Design & Methodology', isSelected: true, details: 'Completed database ERD' },
      { taskCode: 'PROTOTYPE_POC', label: 'Prototype / Proof of Concept', isSelected: false },
      { taskCode: 'DRAFT_REPORT', label: 'Draft Report / Report Writing', isSelected: true, details: 'Chapter 1 draft completed' },
    ],
    workDoneDetails: 'Finalized all use case diagrams with detailed descriptions. Completed the Entity-Relationship Diagram for the database. Drafted Chapter 1 (Introduction) covering problem statement, objectives, and scope.',
    workToBeDone: 'Review and refine Chapter 1 based on feedback. Start Chapter 2 (Literature Review). Begin prototype development.',
    problemsAndSolutions: 'Meeting-Progress normalization was challenging - resolved after consulting additional resources on 3NF.',
    supervisorComments: '',
    status: 'SUBMITTED',
    signatures: [],
    createdAt: '2025-02-03T09:00:00Z',
    updatedAt: '2025-02-03T16:00:00Z',
    submittedAt: '2025-02-03T16:00:00Z',
  },
  {
    logId: 'ml-004',
    projectId: 'proj-001',
    meetingDate: '2025-02-05',
    meetingNumber: 4,
    meetingMode: 'ONLINE',
    projectTitle: 'AI-Powered FYP Supervision Management System',
    fypPhase: 'FYP1',
    student: {
      studentId: 'student-001',
      fullName: 'Ahmad bin Abdullah',
      matricNo: '1211234567',
      programme: 'Bachelor of Information Technology',
    },
    supervisor: {
      supervisorId: 'sup-001',
      fullName: 'Dr. Sarah Lee',
      title: 'Associate Professor',
    },
    tasks: getDefaultTasks(),
    workDoneDetails: '',
    workToBeDone: '',
    problemsAndSolutions: '',
    supervisorComments: '',
    status: 'DRAFT',
    signatures: [],
    createdAt: '2025-02-05T09:00:00Z',
    updatedAt: '2025-02-05T09:00:00Z',
  },
]

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
      if (USE_MOCK_DATA) {
        let filtered = [...MOCK_MEETING_LOGS]
        if (params?.status) {
          filtered = filtered.filter((log) => log.status === params.status)
        }
        return { logs: filtered, total: filtered.length }
      }
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
      if (USE_MOCK_DATA) {
        const log = MOCK_MEETING_LOGS.find((l) => l.logId === logId)
        if (!log) throw new Error('Meeting log not found')
        return log
      }
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
      if (USE_MOCK_DATA) {
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 500))
        const newLog: MeetingLog = {
          logId: `ml-${Date.now()}`,
          projectId: 'proj-001',
          meetingDate: logData.meetingDate,
          meetingNumber: logData.meetingNumber,
          meetingMode: logData.meetingMode,
          projectTitle: logData.projectTitle,
          fypPhase: logData.fypPhase,
          student: {
            studentId: 'student-001',
            fullName: 'Ahmad bin Abdullah',
            matricNo: '1211234567',
            programme: 'Bachelor of Information Technology',
          },
          supervisor: {
            supervisorId: 'sup-001',
            fullName: 'Dr. Sarah Lee',
            title: 'Associate Professor',
          },
          tasks: logData.tasks.map((t) => ({
            taskCode: t.taskCode,
            label: '',
            isSelected: t.isSelected,
            details: t.details,
          })) as MeetingLogTask[],
          workDoneDetails: logData.workDoneDetails,
          workToBeDone: logData.workToBeDone,
          problemsAndSolutions: logData.problemsAndSolutions || '',
          supervisorComments: '',
          status: logData.status,
          signatures: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          submittedAt: logData.status === 'SUBMITTED' ? new Date().toISOString() : undefined,
        }
        MOCK_MEETING_LOGS.push(newLog)
        return newLog
      }
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
      if (USE_MOCK_DATA) {
        await new Promise((resolve) => setTimeout(resolve, 500))
        const index = MOCK_MEETING_LOGS.findIndex((l) => l.logId === logId)
        if (index === -1) throw new Error('Meeting log not found')

        // Handle tasks update - need to add labels back
        const updatedTasks = logData.tasks
          ? logData.tasks.map((t) => ({
              ...t,
              label: MEETING_LOG_TASKS[t.taskCode],
            }))
          : MOCK_MEETING_LOGS[index].tasks

        MOCK_MEETING_LOGS[index] = {
          ...MOCK_MEETING_LOGS[index],
          ...logData,
          tasks: updatedTasks,
          updatedAt: new Date().toISOString(),
        }
        return MOCK_MEETING_LOGS[index]
      }
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
      if (USE_MOCK_DATA) {
        await new Promise((resolve) => setTimeout(resolve, 500))
        const index = MOCK_MEETING_LOGS.findIndex((l) => l.logId === logId)
        if (index === -1) throw new Error('Meeting log not found')
        MOCK_MEETING_LOGS[index].status = 'SUBMITTED'
        MOCK_MEETING_LOGS[index].submittedAt = new Date().toISOString()
        MOCK_MEETING_LOGS[index].updatedAt = new Date().toISOString()
        return MOCK_MEETING_LOGS[index]
      }
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
      if (USE_MOCK_DATA) {
        await new Promise((resolve) => setTimeout(resolve, 500))
        const index = MOCK_MEETING_LOGS.findIndex((l) => l.logId === logId)
        if (index === -1) throw new Error('Meeting log not found')

        const newSignature = {
          signatureId: `sig-${Date.now()}`,
          signerUserId: 'student-001',
          signerName: 'Ahmad bin Abdullah',
          signerRole: 'STUDENT' as const,
          signatureImageUrl: signatureData.signatureImageDataUrl,
          signatureSha256: signatureData.signatureSha256,
          signedAt: new Date().toISOString(),
        }
        MOCK_MEETING_LOGS[index].signatures.push(newSignature)
        MOCK_MEETING_LOGS[index].status = 'LOCKED'
        MOCK_MEETING_LOGS[index].lockedAt = new Date().toISOString()
        MOCK_MEETING_LOGS[index].updatedAt = new Date().toISOString()
        return MOCK_MEETING_LOGS[index]
      }
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
      if (USE_MOCK_DATA) {
        // Filter to show only submitted/pending logs for supervisor
        let filtered = MOCK_MEETING_LOGS.filter(
          (log) => log.status !== 'DRAFT'
        )
        if (params?.status) {
          filtered = filtered.filter((log) => log.status === params.status)
        }
        return { logs: filtered, total: filtered.length }
      }
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
      if (USE_MOCK_DATA) {
        const log = MOCK_MEETING_LOGS.find((l) => l.logId === logId)
        if (!log) throw new Error('Meeting log not found')
        return log
      }
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
      if (USE_MOCK_DATA) {
        await new Promise((resolve) => setTimeout(resolve, 500))
        const index = MOCK_MEETING_LOGS.findIndex((l) => l.logId === logId)
        if (index === -1) throw new Error('Meeting log not found')
        MOCK_MEETING_LOGS[index].supervisorComments = comments
        MOCK_MEETING_LOGS[index].updatedAt = new Date().toISOString()
        return MOCK_MEETING_LOGS[index]
      }
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
      if (USE_MOCK_DATA) {
        await new Promise((resolve) => setTimeout(resolve, 500))
        const index = MOCK_MEETING_LOGS.findIndex((l) => l.logId === logId)
        if (index === -1) throw new Error('Meeting log not found')
        MOCK_MEETING_LOGS[index].status = 'CORRECTION_REQUIRED'
        MOCK_MEETING_LOGS[index].correctionReason = reason
        MOCK_MEETING_LOGS[index].updatedAt = new Date().toISOString()
        return MOCK_MEETING_LOGS[index]
      }
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
      if (USE_MOCK_DATA) {
        await new Promise((resolve) => setTimeout(resolve, 500))
        const index = MOCK_MEETING_LOGS.findIndex((l) => l.logId === logId)
        if (index === -1) throw new Error('Meeting log not found')

        const newSignature = {
          signatureId: `sig-${Date.now()}`,
          signerUserId: 'sup-001',
          signerName: 'Dr. Sarah Lee',
          signerRole: 'SUPERVISOR' as const,
          signatureImageUrl: signatureData.signatureImageDataUrl,
          signatureSha256: signatureData.signatureSha256,
          signedAt: new Date().toISOString(),
        }
        MOCK_MEETING_LOGS[index].signatures.push(newSignature)
        MOCK_MEETING_LOGS[index].status = 'SUPERVISOR_SIGNED'
        MOCK_MEETING_LOGS[index].updatedAt = new Date().toISOString()
        return MOCK_MEETING_LOGS[index]
      }
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
