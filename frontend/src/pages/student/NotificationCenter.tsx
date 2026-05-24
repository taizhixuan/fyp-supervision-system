import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, Check, CheckCheck, ChevronRight, Filter, Settings } from 'lucide-react'
import { Card, Button, Badge, Spinner } from '@/components/ui'
import { useNotifications, useMarkNotificationRead, useMarkAllRead } from '@/lib/hooks/useStudent'
import { ROUTES } from '@/lib/constants/routes'
import { cn } from '@/lib/utils/cn'
import { getNotificationDisplay, formatNotificationTime } from '@/lib/utils/notificationDisplay'

interface Notification {
  notificationId: number
  title: string
  message: string
  type: string
  isRead: boolean
  actionUrl?: string
  createdAt: string
}

// Backend currently emits 9 types; the dropdown shows the ones a student
// actually encounters (other roles see different subsets).
const STUDENT_TYPE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'MEETING', label: 'Meeting' },
  { value: 'REQUEST', label: 'Supervision Request' },
  { value: 'PROPOSAL', label: 'Proposal' },
  { value: 'DEADLINE', label: 'Deadline' },
  { value: 'FYP1_RESULT', label: 'FYP1 Result' },
  { value: 'ACCOUNT_APPROVED', label: 'Account' },
  { value: 'CYCLE_STATUS', label: 'Cycle Update' },
  { value: 'SYSTEM', label: 'System' },
]

// Sample data — kept for design preview when the API returns nothing.
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
    title: 'Proposal Feedback Received',
    message: 'Your supervisor has provided feedback on your proposal. Please review and make revisions.',
    type: 'PROPOSAL',
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
    title: 'Supervision Request Accepted',
    message: 'Dr. Sarah Lee has accepted your supervision request!',
    type: 'REQUEST',
    isRead: true,
    actionUrl: '/student/requests',
    createdAt: '2025-01-17T16:30:00Z',
  },
  {
    notificationId: 5,
    title: 'Account approved',
    message: 'Your student account has been approved by the admin.',
    type: 'ACCOUNT_APPROVED',
    isRead: true,
    createdAt: '2025-01-16T11:00:00Z',
  },
]

export function NotificationCenter() {
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')

  const { data, isLoading } = useNotifications()
  const markRead = useMarkNotificationRead()
  const markAllRead = useMarkAllRead()

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
    } catch {
      // Error handled by mutation
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await markAllRead.mutateAsync()
    } catch {
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
                filter === 'all' ? 'bg-white shadow-sm' : 'hover:bg-neutral-200',
              )}
            >
              All
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={cn(
                'px-2.5 py-1 rounded text-xs font-medium transition-colors inline-flex items-center gap-1.5',
                filter === 'unread' ? 'bg-white shadow-sm' : 'hover:bg-neutral-200',
              )}
            >
              Unread
              {unreadCount > 0 && <Badge variant="primary" size="sm">{unreadCount}</Badge>}
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
              {STUDENT_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Notifications List */}
      {filteredNotifications.length > 0 ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
            {filteredNotifications.map((notification) => (
              <NotificationCard
                key={notification.notificationId}
                notification={notification}
                onMarkRead={() => handleMarkRead(notification.notificationId)}
              />
            ))}
          </div>
          {/* Soft hint when the list is short — gives the page a natural foot
              instead of a wall of whitespace below 1-2 cards. */}
          {filteredNotifications.length < 4 && (
            <p className="text-center text-xs text-neutral-400 py-3">
              That's all for now. You'll see new updates here.
            </p>
          )}
        </>
      ) : (
        <Card className="text-center py-10">
          <Bell className="h-10 w-10 text-neutral-300 mx-auto mb-2" />
          <h3 className="font-medium text-neutral-900 mb-1">
            {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
          </h3>
          <p className="text-sm text-neutral-500">
            {filter === 'unread'
              ? "You've read all your notifications"
              : "You'll see new updates here when supervisors, the committee, or the system sends one"}
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
  const { Icon, iconColor, iconBg, label } = getNotificationDisplay(notification.type, notification.title)
  const clickable = Boolean(notification.actionUrl)

  const content = (
    <Card
      hover={clickable}
      padding="sm"
      className={cn(
        'group transition-all h-full',
        !notification.isRead
          ? 'border-l-4 border-l-primary-500 bg-primary-50/40'
          : 'border-l-4 border-l-transparent',
        clickable && 'hover:shadow-md hover:border-l-primary-400',
      )}
    >
      <div className="flex items-start gap-2.5">
        <div className={cn('w-9 h-9 rounded-md flex items-center justify-center flex-shrink-0', iconBg)}>
          <Icon className={cn('h-4 w-4', iconColor)} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h3
                  className={cn(
                    'text-sm text-neutral-900 leading-tight truncate',
                    !notification.isRead ? 'font-semibold' : 'font-medium',
                  )}
                >
                  {notification.title}
                </h3>
                {!notification.isRead && (
                  <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-primary-500" />
                )}
              </div>
              <p className="text-xs text-neutral-600 mt-0.5 line-clamp-2 leading-snug">
                {notification.message}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className={cn('inline-flex items-center px-1.5 py-0 rounded text-[10px] font-medium', iconBg, iconColor)}>
                  {label}
                </span>
                <span className="text-[11px] text-neutral-400">
                  {formatNotificationTime(notification.createdAt)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-0.5 flex-shrink-0">
              {!notification.isRead && (
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    onMarkRead()
                  }}
                  className="p-1 rounded-full hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600"
                  title="Mark as read"
                >
                  <Check className="h-3.5 w-3.5" />
                </button>
              )}
              {clickable && (
                <ChevronRight className="h-4 w-4 text-neutral-300 group-hover:text-neutral-600 transition-colors" />
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  )

  if (notification.actionUrl) {
    return <Link to={notification.actionUrl} className="block h-full">{content}</Link>
  }
  return content
}
