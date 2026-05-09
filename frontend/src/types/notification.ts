export type NotificationType =
  | 'ANNOUNCEMENT'
  | 'MEETING'
  | 'PROPOSAL'
  | 'SYSTEM'
  | 'REQUEST'
  | 'DEADLINE'
  | 'REGISTRATION_PENDING'
  | 'ACCOUNT_APPROVED'
  | 'ACCOUNT_REJECTED'
  | 'FYP1_RESULT'
  | 'TOPIC'
  | 'TOPIC_REVIEW'
  | 'TOPIC_CONFIRMED'

export interface Notification {
  notificationId: number
  userId: number
  type: NotificationType | string
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
