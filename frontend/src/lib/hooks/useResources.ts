import { useQuery } from '@tanstack/react-query'
import { resourcesApi, announcementsApi, systemApi } from '@/lib/api/resources'

// Enable mock data in development mode
const USE_MOCK_DATA = false

const MOCK_RESOURCES = [
  {
    resourceId: 1,
    category: 'HANDBOOK' as const,
    title: 'FYP Handbook 2024/2025',
    storagePath: '/resources/fyp-handbook.pdf',
    visibility: 'PUBLIC' as const,
    isActive: true,
    publishedAt: '2024-09-01T00:00:00Z',
  },
  {
    resourceId: 2,
    category: 'TEMPLATE' as const,
    title: 'Proposal Template',
    storagePath: '/resources/proposal-template.docx',
    visibility: 'STUDENT' as const,
    isActive: true,
    publishedAt: '2024-09-01T00:00:00Z',
  },
]

const MOCK_ANNOUNCEMENTS = [
  {
    announcementId: 1,
    title: 'FYP 1 Proposal Submission Deadline Extended',
    content: 'The deadline has been extended to March 15, 2025.',
    publishAt: '2025-01-15T10:00:00Z',
  },
  {
    announcementId: 2,
    title: 'New AI-Powered Supervisor Matching Feature',
    content: 'Students can now receive personalized supervisor recommendations.',
    publishAt: '2025-01-10T09:00:00Z',
  },
  {
    announcementId: 3,
    title: 'Supervision Log Submission Reminder',
    content: 'Students are reminded to submit their supervision logs within 48 hours after each meeting with their supervisor.',
    publishAt: '2025-01-05T14:00:00Z',
  },
]

export function useResources(category?: string) {
  return useQuery({
    queryKey: ['resources', category],
    queryFn: async () => {
      if (USE_MOCK_DATA) {
        const filtered = category
          ? MOCK_RESOURCES.filter(r => r.category === category)
          : MOCK_RESOURCES
        return { resources: filtered, total: filtered.length }
      }
      return resourcesApi.getResources({ category })
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useResourceCategories() {
  return useQuery({
    queryKey: ['resources', 'categories'],
    queryFn: async () => {
      if (USE_MOCK_DATA) {
        return { categories: ['HANDBOOK', 'TEMPLATE', 'RUBRIC', 'GUIDELINE'] }
      }
      return resourcesApi.getCategories()
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

export function useLatestAnnouncements(limit: number = 3) {
  return useQuery({
    queryKey: ['announcements', 'latest', limit],
    queryFn: async () => {
      if (USE_MOCK_DATA) {
        return { announcements: MOCK_ANNOUNCEMENTS.slice(0, limit) }
      }
      return announcementsApi.getLatest(limit)
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

export function usePublicSystemParameters() {
  return useQuery({
    queryKey: ['system', 'parameters', 'public'],
    queryFn: async () => {
      if (USE_MOCK_DATA) {
        return { parameters: [] }
      }
      return systemApi.getPublicParameters()
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}
