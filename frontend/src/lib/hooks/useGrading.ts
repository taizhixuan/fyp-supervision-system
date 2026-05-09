import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'

/**
 * MMU FCI rubric — five fixed criteria summing to 100. The backend stores whatever
 * keys + values the form posts as JSON, so adding/removing criteria here doesn't
 * require a schema change.
 */
export const RUBRIC_CRITERIA = [
  { key: 'implementation', label: 'Implementation Quality', max: 25 },
  { key: 'documentation', label: 'Documentation Quality', max: 20 },
  { key: 'finalReport', label: 'Final Report Quality', max: 25 },
  { key: 'presentation', label: 'Presentation Quality', max: 15 },
  { key: 'innovation', label: 'Innovation & Originality', max: 15 },
] as const

export type GradeStatus = 'DRAFT' | 'SUBMITTED' | 'FINALISED'
export type GradePhase = 'FYP1' | 'FYP2'

export interface FypGrade {
  gradeId: number
  projectId: number
  phase: GradePhase
  graderUserId: number
  graderName: string
  graderRole: string
  rubric: Record<string, number>
  totalScore: number | null
  letterGrade: string | null
  remarks: string | null
  status: GradeStatus
  finalisedAt: string | null
  finalisedBy: string | null
  createdAt: string | null
  updatedAt: string | null
}

export interface SubmitGradePayload {
  projectId: number
  phase: GradePhase
  rubric: Record<string, number>
  remarks?: string
  status?: 'DRAFT' | 'SUBMITTED'
}

const gradeKeys = {
  all: ['grades'] as const,
  supervisor: () => [...gradeKeys.all, 'supervisor'] as const,
  student: () => [...gradeKeys.all, 'student'] as const,
  byProject: (projectId: number) => [...gradeKeys.all, 'project', projectId] as const,
  adminInbox: () => [...gradeKeys.all, 'admin'] as const,
}

// ---------- Supervisor ----------
export function useSupervisorGrades() {
  return useQuery({
    queryKey: gradeKeys.supervisor(),
    queryFn: async () => {
      const { data } = await apiClient.get<{ grades: FypGrade[]; total: number }>('/supervisor/grades')
      return data
    },
  })
}

export function useSubmitGrade() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: SubmitGradePayload) => {
      const { data } = await apiClient.post<FypGrade>('/supervisor/grades', payload)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: gradeKeys.supervisor() })
      qc.invalidateQueries({ queryKey: gradeKeys.adminInbox() })
    },
  })
}

// ---------- Student ----------
export function useStudentFinalisedGrades() {
  return useQuery({
    queryKey: gradeKeys.student(),
    queryFn: async () => {
      const { data } = await apiClient.get<{ grades: FypGrade[]; total: number }>('/student/grades')
      return data
    },
  })
}

// ---------- Admin ----------
export function useSubmittedGrades() {
  return useQuery({
    queryKey: gradeKeys.adminInbox(),
    queryFn: async () => {
      const { data } = await apiClient.get<{ grades: FypGrade[]; total: number }>(
        '/admin/grades?status=SUBMITTED',
      )
      return data
    },
  })
}

export function useGradesForProject(projectId: number, enabled = true) {
  return useQuery({
    queryKey: gradeKeys.byProject(projectId),
    queryFn: async () => {
      const { data } = await apiClient.get<{ grades: FypGrade[]; total: number }>(
        `/admin/grades/project/${projectId}`,
      )
      return data
    },
    enabled,
  })
}

export function useFinaliseGrade() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (gradeId: number) => {
      const { data } = await apiClient.post<FypGrade>(`/admin/grades/${gradeId}/finalise`)
      return data
    },
    onSuccess: (_, gradeId) => {
      qc.invalidateQueries({ queryKey: gradeKeys.adminInbox() })
      qc.invalidateQueries({ queryKey: gradeKeys.all })
      void gradeId
    },
  })
}
