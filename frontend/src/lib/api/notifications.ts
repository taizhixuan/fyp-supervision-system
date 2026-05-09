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

  getVapidPublicKey: async (): Promise<{ publicKey: string | null }> => {
    const response = await api.get('/notifications/push/vapid-public-key')
    return response.data
  },

  subscribePush: async (subscription: PushSubscriptionJSON): Promise<{ message: string }> => {
    const response = await api.post('/notifications/push/subscribe', {
      endpoint: subscription.endpoint,
      keys: subscription.keys,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    })
    return response.data
  },

  unsubscribePush: async (endpoint: string): Promise<{ message: string }> => {
    const response = await api.delete('/notifications/push/subscribe', {
      params: { endpoint },
    })
    return response.data
  },
}
