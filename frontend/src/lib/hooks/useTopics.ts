import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'

export type TopicStatus =
  | 'PENDING_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'REVISION_REQUIRED'
  | 'WITHDRAWN'

export interface SupervisorTopic {
  topicId: number
  title: string
  description: string
  researchArea: string | null
  slots: number
  confirmedCount: number
  remainingSlots: number
  status: TopicStatus
  feedback?: string | null
  supervisorUserId: number | null
  supervisorName: string | null
  supervisorEmail: string | null
  supervisorDepartment: string | null
  cycleId: number | null
  createdAt: string | null
  reviewedAt: string | null
}

export const topicKeys = {
  all: ['topics'] as const,
  myList: () => [...topicKeys.all, 'mine'] as const,
  committeeQueue: (status: TopicStatus) => [...topicKeys.all, 'committee', status] as const,
  studentBrowse: (researchArea?: string, search?: string) =>
    [...topicKeys.all, 'student', researchArea ?? 'ALL', search ?? ''] as const,
}

// ===== Supervisor =====

export function useMyTopics() {
  return useQuery({
    queryKey: topicKeys.myList(),
    queryFn: async () => {
      const { data } = await apiClient.get<{ topics: SupervisorTopic[]; total: number }>('/supervisor/topics')
      return data
    },
  })
}

export interface TopicCreateInput {
  title: string
  description: string
  researchArea?: string | null
  slots: number
}

export function useCreateTopic() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: TopicCreateInput) => {
      const { data } = await apiClient.post<SupervisorTopic>('/supervisor/topics', input)
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: topicKeys.myList() }),
  })
}

export function useUpdateTopic() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ topicId, input }: { topicId: number; input: Partial<TopicCreateInput> }) => {
      const { data } = await apiClient.put<SupervisorTopic>(`/supervisor/topics/${topicId}`, input)
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: topicKeys.myList() }),
  })
}

export function useWithdrawTopic() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (topicId: number) => {
      const { data } = await apiClient.post<SupervisorTopic>(`/supervisor/topics/${topicId}/withdraw`)
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: topicKeys.myList() }),
  })
}

// ===== Committee =====

export function useCommitteeTopicQueue(status: TopicStatus = 'PENDING_REVIEW') {
  return useQuery({
    queryKey: topicKeys.committeeQueue(status),
    queryFn: async () => {
      const { data } = await apiClient.get<{ topics: SupervisorTopic[]; total: number }>('/committee/topics', {
        params: { status },
      })
      return data
    },
  })
}

export function useReviewTopic() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      topicId,
      decision,
      feedback,
    }: {
      topicId: number
      decision: 'APPROVED' | 'REJECTED' | 'REVISION_REQUIRED'
      feedback?: string
    }) => {
      const { data } = await apiClient.post(`/committee/topics/${topicId}/review`, { decision, feedback })
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: topicKeys.all }),
  })
}

// ===== Student =====

export function useApprovedTopics(filters?: { researchArea?: string; search?: string }) {
  return useQuery({
    queryKey: topicKeys.studentBrowse(filters?.researchArea, filters?.search),
    queryFn: async () => {
      const { data } = await apiClient.get<{ topics: SupervisorTopic[]; total: number }>('/student/topics', {
        params: {
          researchArea: filters?.researchArea && filters.researchArea !== 'ALL' ? filters.researchArea : undefined,
          search: filters?.search || undefined,
        },
      })
      return data
    },
  })
}

export function useConfirmTopic() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (topicId: number) => {
      const { data } = await apiClient.post<{
        projectId: number
        topicId: number
        supervisorUserId: number
        supervisorName: string
      }>(`/student/topics/${topicId}/confirm`)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: topicKeys.all })
    },
  })
}
