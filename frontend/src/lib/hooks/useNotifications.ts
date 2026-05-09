import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notificationsApi } from '@/lib/api/notifications'
import type { Notification } from '@/types'

// Enable mock data in development mode
const USE_MOCK_DATA = false

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    notificationId: 1,
    userId: 'mock-student-001',
    type: 'MEETING',
    title: 'Meeting Confirmed',
    message: 'Your meeting with Dr. Sarah Lee on 25 Jan at 10:00 AM has been confirmed.',
    isRead: false,
    createdAt: '2025-01-20T10:30:00Z',
  },
  {
    notificationId: 2,
    userId: 'mock-student-001',
    type: 'PROPOSAL',
    title: 'Proposal Feedback Available',
    message: 'Your supervisor has provided feedback on your proposal. Please review.',
    isRead: false,
    createdAt: '2025-01-19T14:00:00Z',
  },
  {
    notificationId: 3,
    userId: 'mock-student-001',
    type: 'ANNOUNCEMENT',
    title: 'Deadline Reminder',
    message: 'Proposal submission deadline is in 7 days. Make sure to submit on time.',
    isRead: true,
    createdAt: '2025-01-18T09:00:00Z',
  },
]

export function useNotifications(limit: number = 10) {
  const queryClient = useQueryClient()

  // Fetch notifications
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['notifications', limit],
    queryFn: async () => {
      if (USE_MOCK_DATA) {
        return { notifications: MOCK_NOTIFICATIONS.slice(0, limit), total: MOCK_NOTIFICATIONS.length }
      }
      return notificationsApi.getNotifications({ limit })
    },
    staleTime: 30000, // 30 seconds
  })

  // Fetch unread count
  const { data: unreadData } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      if (USE_MOCK_DATA) {
        return { count: MOCK_NOTIFICATIONS.filter(n => !n.isRead).length }
      }
      return notificationsApi.getUnreadCount()
    },
    staleTime: 30000,
    refetchInterval: USE_MOCK_DATA ? false : 60000, // Don't refetch in mock mode
  })

  // Mark single as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: number) => notificationsApi.markAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: notificationsApi.markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  const notifications = data?.notifications ?? []
  const unreadCount = unreadData?.count ?? 0

  const markAsRead = (notificationId: number) => {
    markAsReadMutation.mutate(notificationId)
  }

  const markAllAsRead = () => {
    markAllAsReadMutation.mutate()
  }

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    refetch,
    markAsRead,
    markAllAsRead,
    isMarkingRead: markAsReadMutation.isPending,
    isMarkingAllRead: markAllAsReadMutation.isPending,
  }
}

// Hook for getting notification icon based on type
export function getNotificationIcon(type: Notification['type']) {
  switch (type) {
    case 'ANNOUNCEMENT':
      return { icon: 'Megaphone', color: 'text-primary-500' }
    case 'MEETING':
      return { icon: 'Calendar', color: 'text-info-500' }
    case 'PROPOSAL':
      return { icon: 'FileText', color: 'text-warning-500' }
    case 'SYSTEM':
      return { icon: 'Settings', color: 'text-neutral-500' }
    case 'REQUEST':
      return { icon: 'Mail', color: 'text-accent-500' }
    case 'DEADLINE':
      return { icon: 'CalendarClock', color: 'text-warning-500' }
    case 'REGISTRATION_PENDING':
      return { icon: 'UserPlus', color: 'text-info-500' }
    case 'ACCOUNT_APPROVED':
      return { icon: 'UserCheck', color: 'text-success-500' }
    case 'ACCOUNT_REJECTED':
      return { icon: 'UserCheck', color: 'text-accent-500' }
    case 'FYP1_RESULT':
      return { icon: 'GraduationCap', color: 'text-primary-500' }
    case 'TOPIC':
    case 'TOPIC_REVIEW':
    case 'TOPIC_CONFIRMED':
      return { icon: 'Lightbulb', color: 'text-warning-500' }
    default:
      return { icon: 'Bell', color: 'text-neutral-500' }
  }
}

// Format relative time
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return 'Just now'
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`
  }

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`
  }

  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`
  }

  return date.toLocaleDateString()
}
