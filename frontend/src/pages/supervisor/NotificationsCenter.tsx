import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Bell,
  Check,
  CheckCheck,
  Calendar,
  FileText,
  ClipboardList,
  FolderOpen,
  Settings,
  Megaphone,
  Mail,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { useSupervisorNotifications, useSupervisorUnreadCount, useMarkSupervisorNotificationRead } from '@/lib/hooks/useSupervisor'
import { ROUTES } from '@/lib/constants/routes'
import { cn } from '@/lib/utils/cn'
import type { SupervisorNotificationType } from '@/types'

const notificationConfig: Record<SupervisorNotificationType, { icon: typeof Bell; color: string; bgColor: string }> = {
  NEW_REQUEST: { icon: ClipboardList, color: 'text-primary-600', bgColor: 'bg-primary-50' },
  MEETING_REQUEST: { icon: Calendar, color: 'text-info-600', bgColor: 'bg-info-50' },
  MEETING_CONFIRMED: { icon: Calendar, color: 'text-success-600', bgColor: 'bg-success-50' },
  MEETING_CANCELLED: { icon: Calendar, color: 'text-error-600', bgColor: 'bg-error-50' },
  LOG_SUBMITTED: { icon: FileText, color: 'text-warning-600', bgColor: 'bg-warning-50' },
  DOCUMENT_UPLOADED: { icon: FolderOpen, color: 'text-accent-600', bgColor: 'bg-accent-50' },
  PROPOSAL_SUBMITTED: { icon: FileText, color: 'text-primary-600', bgColor: 'bg-primary-50' },
  PROPOSAL_REVISED: { icon: FileText, color: 'text-orange-600', bgColor: 'bg-orange-50' },
  SYSTEM: { icon: Settings, color: 'text-neutral-600', bgColor: 'bg-neutral-100' },
}

const getNotificationLink = (notification: { type: SupervisorNotificationType; relatedEntityId?: number; relatedEntityType?: string }): string => {
  switch (notification.type) {
    case 'NEW_REQUEST':
      return notification.relatedEntityId
        ? ROUTES.SUPERVISOR.REQUEST_DETAIL.replace(':id', String(notification.relatedEntityId))
        : ROUTES.SUPERVISOR.REQUESTS
    case 'MEETING_REQUEST':
    case 'MEETING_CONFIRMED':
    case 'MEETING_CANCELLED':
      return notification.relatedEntityId
        ? ROUTES.SUPERVISOR.MEETING_DETAIL.replace(':id', String(notification.relatedEntityId))
        : ROUTES.SUPERVISOR.MEETINGS
    case 'LOG_SUBMITTED':
      return notification.relatedEntityId
        ? ROUTES.SUPERVISOR.LOG_DETAIL.replace(':id', String(notification.relatedEntityId))
        : ROUTES.SUPERVISOR.LOGS
    case 'DOCUMENT_UPLOADED':
      return notification.relatedEntityId
        ? ROUTES.SUPERVISOR.DOCUMENT_DETAIL.replace(':id', String(notification.relatedEntityId))
        : ROUTES.SUPERVISOR.DOCUMENTS
    case 'PROPOSAL_SUBMITTED':
    case 'PROPOSAL_REVISED':
      return notification.relatedEntityId
        ? ROUTES.SUPERVISOR.PROPOSAL_DETAIL.replace(':id', String(notification.relatedEntityId))
        : ROUTES.SUPERVISOR.PROPOSALS
    default:
      return ROUTES.SUPERVISOR.DASHBOARD
  }
}

export function NotificationsCenter() {
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  const { data, isLoading } = useSupervisorNotifications(50)
  const { data: unreadData } = useSupervisorUnreadCount()
  const markAsRead = useMarkSupervisorNotificationRead()

  const filteredNotifications = data?.notifications.filter((n) => {
    if (filter === 'unread') return !n.isRead
    return true
  })

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      await markAsRead.mutateAsync(notificationId)
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`

    return date.toLocaleDateString('en-MY', { day: 'numeric', month: 'short' })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
            <Bell className="h-7 w-7 text-primary-600" />
            Notifications
          </h1>
          <p className="text-neutral-600 mt-1">
            Stay updated with your supervisees' activities
          </p>
        </div>
        {(unreadData?.count ?? 0) > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 bg-primary-50 border border-primary-200 rounded-lg">
            <Bell className="h-5 w-5 text-primary-600" />
            <span className="text-sm font-medium text-primary-700">
              {unreadData?.count} unread notification{(unreadData?.count ?? 0) > 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <Button
          variant={filter === 'all' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          All
        </Button>
        <Button
          variant={filter === 'unread' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setFilter('unread')}
        >
          Unread ({unreadData?.count ?? 0})
        </Button>
      </div>

      {/* Notifications List */}
      <Card className="divide-y divide-neutral-100">
        {filteredNotifications && filteredNotifications.length > 0 ? (
          filteredNotifications.map((notification) => {
            const config = notificationConfig[notification.type]
            const Icon = config.icon
            const link = getNotificationLink(notification)

            return (
              <Link
                key={notification.notificationId}
                to={link}
                onClick={() => {
                  if (!notification.isRead) {
                    handleMarkAsRead(notification.notificationId)
                  }
                }}
                className={cn(
                  'flex items-start gap-4 p-4 hover:bg-neutral-50 transition-colors',
                  !notification.isRead && 'bg-primary-50/50'
                )}
              >
                {/* Icon */}
                <div className={cn('p-2 rounded-lg flex-shrink-0', config.bgColor)}>
                  <Icon className={cn('h-5 w-5', config.color)} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className={cn(
                        'text-sm',
                        notification.isRead ? 'text-neutral-700' : 'font-medium text-neutral-900'
                      )}>
                        {notification.title}
                      </h3>
                      <p className="text-sm text-neutral-500 mt-0.5">
                        {notification.message}
                      </p>
                    </div>
                    {!notification.isRead && (
                      <span className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0 mt-2" />
                    )}
                  </div>
                  <p className="text-xs text-neutral-400 mt-1">
                    {formatTimeAgo(notification.createdAt)}
                  </p>
                </div>

                {/* Mark as Read Button */}
                {!notification.isRead && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-shrink-0"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleMarkAsRead(notification.notificationId)
                    }}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                )}
              </Link>
            )
          })
        ) : (
          <div className="p-12 text-center">
            <Bell className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-neutral-900">
              {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
            </h3>
            <p className="text-neutral-500 mt-1">
              {filter === 'unread'
                ? "You're all caught up!"
                : 'Notifications about your supervisees will appear here'}
            </p>
          </div>
        )}
      </Card>

      {/* Notification Categories Summary */}
      {data && data.notifications.length > 0 && (
        <Card className="p-4">
          <h3 className="font-semibold text-neutral-900 mb-4">By Category</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                label: 'Requests',
                count: data.notifications.filter((n) => n.type === 'NEW_REQUEST').length,
                icon: ClipboardList,
                color: 'text-primary-600',
              },
              {
                label: 'Meetings',
                count: data.notifications.filter((n) => n.type.includes('MEETING')).length,
                icon: Calendar,
                color: 'text-info-600',
              },
              {
                label: 'Logs',
                count: data.notifications.filter((n) => n.type === 'LOG_SUBMITTED').length,
                icon: FileText,
                color: 'text-warning-600',
              },
              {
                label: 'Documents',
                count: data.notifications.filter((n) => n.type === 'DOCUMENT_UPLOADED').length,
                icon: FolderOpen,
                color: 'text-accent-600',
              },
            ].map((category) => (
              <div key={category.label} className="flex items-center gap-3">
                <category.icon className={cn('h-5 w-5', category.color)} />
                <div>
                  <p className="text-lg font-semibold text-neutral-900">{category.count}</p>
                  <p className="text-xs text-neutral-500">{category.label}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
