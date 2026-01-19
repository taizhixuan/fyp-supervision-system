import { api } from './client'
import type { Notification, NotificationListResponse, UnreadCountResponse } from '@/types'

export const notificationsApi = {
  /**
   * Get paginated list of notifications
   */
  getNotifications: async (params?: {
    page?: number
    limit?: number
  }): Promise<NotificationListResponse> => {
    const response = await api.get('/notifications', { params })
    return response.data
  },

  /**
   * Get unread notification count
   */
  getUnreadCount: async (): Promise<UnreadCountResponse> => {
    const response = await api.get('/notifications/unread-count')
    return response.data
  },

  /**
   * Mark a single notification as read
   */
  markAsRead: async (notificationId: number): Promise<Notification> => {
    const response = await api.put(`/notifications/${notificationId}/read`)
    return response.data
  },

  /**
   * Mark all notifications as read
   */
  markAllAsRead: async (): Promise<{ message: string }> => {
    const response = await api.put('/notifications/mark-all-read')
    return response.data
  },
}
