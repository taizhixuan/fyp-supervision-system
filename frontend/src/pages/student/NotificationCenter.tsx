import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Bell,
  CheckCircle,
  AlertCircle,
  Calendar,
  MessageSquare,
  Settings,
  Check,
  CheckCheck,
  Filter,
} from 'lucide-react'
import { Card, Button, Badge, Spinner } from '@/components/ui'
import { useNotifications, useMarkNotificationRead, useMarkAllRead } from '@/lib/hooks/useStudent'
import { ROUTES } from '@/lib/constants/routes'
import { cn } from '@/lib/utils/cn'

type NotificationType = 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'MEETING' | 'DEADLINE' | 'FEEDBACK' | 'SYSTEM'

interface Notification {
  notificationId: number
  title: string
  message: string
  type: NotificationType | string
  isRead: boolean
  actionUrl?: string
  createdAt: string
}

const DEFAULT_TYPE_CONFIG = { label: 'Notification', color: 'text-neutral-600', bgColor: 'bg-neutral-100', icon: Bell }

// Sample data
const SAMPLE_NOTIFICATIONS: Notification[] = [
  {
    notificationId: 1,
    title: 'Meeting Confirmed',
    message: 'Your meeting with Dr. Sarah Lee on 25 Jan at 10:00 AM has been confirmed.',
    type: 'MEETING',
    isRead: false,
    actionUrl: '/student/meetings/1',
    createdAt: '2025-01-20T10:30:00Z',
  },
  {
    notificationId: 2,
    title: 'Proposal Feedback Available',
    message: 'Your supervisor has provided feedback on your proposal. Please review and make necessary revisions.',
    type: 'FEEDBACK',
    isRead: false,
    actionUrl: '/student/proposal/status',
    createdAt: '2025-01-19T14:00:00Z',
  },
  {
    notificationId: 3,
    title: 'Deadline Reminder',
    message: 'Proposal submission deadline is in 7 days. Make sure to submit your final version.',
    type: 'DEADLINE',
    isRead: false,
    actionUrl: '/student/deadlines',
    createdAt: '2025-01-18T09:00:00Z',
  },
  {
    notificationId: 4,
    title: 'Log Approved',
    message: 'Your supervision log for Week 4 has been approved by your supervisor.',
    type: 'SUCCESS',
    isRead: true,
    actionUrl: '/student/logs/1',
    createdAt: '2025-01-17T16:30:00Z',
  },
  {
    notificationId: 5,
    title: 'New Resource Available',
    message: 'A new template for literature review has been added to the resources hub.',
    type: 'INFO',
    isRead: true,
    actionUrl: '/student/resources',
    createdAt: '2025-01-16T11:00:00Z',
  },
  {
    notificationId: 6,
    title: 'System Maintenance',
    message: 'The system will undergo maintenance on Sunday 21 Jan from 2:00 AM to 4:00 AM.',
    type: 'SYSTEM',
    isRead: true,
    createdAt: '2025-01-15T10:00:00Z',
  },
  {
    notificationId: 7,
    title: 'Meeting Rescheduled',
    message: 'Your meeting originally scheduled for 20 Jan has been rescheduled to 25 Jan.',
    type: 'WARNING',
    isRead: true,
    actionUrl: '/student/meetings/1',
    createdAt: '2025-01-14T15:00:00Z',
  },
]

const typeConfig: Record<NotificationType, { label: string; color: string; bgColor: string; icon: typeof Bell }> = {
  INFO: { label: 'Info', color: 'text-info-600', bgColor: 'bg-info-100', icon: Bell },
  SUCCESS: { label: 'Success', color: 'text-success-600', bgColor: 'bg-success-100', icon: CheckCircle },
  WARNING: { label: 'Warning', color: 'text-warning-600', bgColor: 'bg-warning-100', icon: AlertCircle },
  ERROR: { label: 'Error', color: 'text-error-600', bgColor: 'bg-error-100', icon: AlertCircle },
  MEETING: { label: 'Meeting', color: 'text-primary-600', bgColor: 'bg-primary-100', icon: Calendar },
  DEADLINE: { label: 'Deadline', color: 'text-error-600', bgColor: 'bg-error-100', icon: Calendar },
  FEEDBACK: { label: 'Feedback', color: 'text-warning-600', bgColor: 'bg-warning-100', icon: MessageSquare },
  SYSTEM: { label: 'System', color: 'text-neutral-600', bgColor: 'bg-neutral-100', icon: Settings },
}

function formatTimeAgo(date: string): string {
  const now = new Date()
  const past = new Date(date)
  const diffMs = now.getTime() - past.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 60) return `${diffMins} minutes ago`
  if (diffHours < 24) return `${diffHours} hours ago`
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  return past.toLocaleDateString('en-MY')
}

export function NotificationCenter() {
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')

  const { data, isLoading } = useNotifications()
  const markRead = useMarkNotificationRead()
  const markAllRead = useMarkAllRead()

  // Use sample data
  const notifications = data?.notifications || SAMPLE_NOTIFICATIONS

  const filteredNotifications = notifications.filter((n) => {
    const matchesReadFilter = filter === 'all' || !n.isRead
    const matchesType = typeFilter === 'all' || n.type === typeFilter
    return matchesReadFilter && matchesType
  })

  const unreadCount = notifications.filter((n) => !n.isRead).length

  const handleMarkRead = async (id: number) => {
    try {
      await markRead.mutateAsync(id)
    } catch (err) {
      // Error handled by mutation
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await markAllRead.mutateAsync()
    } catch (err) {
      // Error handled by mutation
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" label="Loading notifications..." />
      </div>
    )
  }

  return (
    <div className="space-y-3 lg:space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 leading-tight">Notifications</h1>
          <p className="text-xs text-neutral-600">
            {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up!'}
          </p>
        </div>
        <div className="flex gap-1.5 flex-shrink-0">
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<CheckCheck className="h-4 w-4" />}
              onClick={handleMarkAllRead}
              isLoading={markAllRead.isPending}
              className="whitespace-nowrap"
            >
              Mark All Read
            </Button>
          )}
          <Link to={ROUTES.STUDENT.NOTIFICATION_SETTINGS}>
            <Button variant="secondary" size="sm" leftIcon={<Settings className="h-4 w-4" />} className="whitespace-nowrap">
              Settings
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <Card padding="sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex bg-neutral-100 rounded-md p-0.5">
            <button
              onClick={() => setFilter('all')}
              className={cn(
                'px-2.5 py-1 rounded text-xs font-medium transition-colors',
                filter === 'all' ? 'bg-white shadow-sm' : 'hover:bg-neutral-200'
              )}
            >
              All
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={cn(
                'px-2.5 py-1 rounded text-xs font-medium transition-colors inline-flex items-center gap-1.5',
                filter === 'unread' ? 'bg-white shadow-sm' : 'hover:bg-neutral-200'
              )}
            >
              Unread
              {unreadCount > 0 && (
                <Badge variant="primary" size="sm">{unreadCount}</Badge>
              )}
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <Filter className="h-4 w-4 text-neutral-500" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-md border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Types</option>
              {Object.entries(typeConfig).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Notifications List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
        {filteredNotifications.map((notification) => (
          <NotificationCard
            key={notification.notificationId}
            notification={notification}
            onMarkRead={() => handleMarkRead(notification.notificationId)}
          />
        ))}
      </div>

      {filteredNotifications.length === 0 && (
        <Card className="text-center py-8">
          <Bell className="h-10 w-10 text-neutral-300 mx-auto mb-2" />
          <h3 className="font-medium text-neutral-900 mb-1">No notifications</h3>
          <p className="text-sm text-neutral-500">
            {filter === 'unread'
              ? "You've read all your notifications"
              : "You don't have any notifications yet"}
          </p>
        </Card>
      )}
    </div>
  )
}

function NotificationCard({
  notification,
  onMarkRead,
}: {
  notification: Notification
  onMarkRead: () => void
}) {
  const config = typeConfig[notification.type as NotificationType] ?? DEFAULT_TYPE_CONFIG
  const Icon = config.icon

  const content = (
    <Card
      hover={!!notification.actionUrl}
      padding="sm"
      className={cn(
        'transition-all',
        !notification.isRead && 'border-l-4 border-l-primary-500 bg-primary-50/50'
      )}
    >
      <div className="flex items-start gap-2.5">
        {/* Icon */}
        <div className={cn('w-9 h-9 rounded-md flex items-center justify-center flex-shrink-0', config.bgColor)}>
          <Icon className={cn('h-4 w-4', config.color)} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className={cn(
                'text-sm text-neutral-900 leading-tight',
                !notification.isRead ? 'font-semibold' : 'font-medium'
              )}>
                {notification.title}
              </h3>
              <p className="text-xs text-neutral-600 mt-0.5 line-clamp-2 leading-snug">{notification.message}</p>
              <p className="text-[11px] text-neutral-400 mt-1">{formatTimeAgo(notification.createdAt)}</p>
            </div>

            {!notification.isRead && (
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onMarkRead()
                }}
                className="p-1 rounded-full hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600 flex-shrink-0"
                title="Mark as read"
              >
                <Check className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Unread indicator */}
        {!notification.isRead && (
          <div className="w-1.5 h-1.5 rounded-full bg-primary-500 flex-shrink-0 mt-2" />
        )}
      </div>
    </Card>
  )

  if (notification.actionUrl) {
    return <Link to={notification.actionUrl}>{content}</Link>
  }

  return content
}
