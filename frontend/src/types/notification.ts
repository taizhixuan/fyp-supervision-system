export type NotificationType =
  | 'ANNOUNCEMENT'
  | 'MEETING'
  | 'PROPOSAL'
  | 'SYSTEM'
  | 'REQUEST'

export interface Notification {
  notificationId: number
  userId: number
  type: NotificationType
  title: string
  message: string
  targetRoute?: string
  createdAt: string
  readAt?: string
}

export interface NotificationListResponse {
  notifications: Notification[]
  total: number
  unreadCount: number
}

export interface UnreadCountResponse {
  count: number
}
