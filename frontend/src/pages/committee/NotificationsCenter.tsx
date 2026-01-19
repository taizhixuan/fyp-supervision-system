import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Bell,
  Search,
  Check,
  CheckCheck,
  Filter,
  FileText,
  Users,
  AlertTriangle,
  Clock,
  ChevronRight,
  Megaphone,
  Settings,
  Trash2,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import {
  useCommitteeNotifications,
  useCommitteeUnreadCount,
  useMarkCommitteeNotificationRead,
  useMarkAllCommitteeNotificationsRead,
} from '@/lib/hooks/useCommittee'
import { ROUTES } from '@/lib/constants/routes'
import { cn } from '@/lib/utils/cn'
import type { CommitteeNotificationType, CommitteeNotification } from '@/types'

const notificationTypeConfig: Record<
  CommitteeNotificationType,
  { label: string; icon: typeof Bell; color: string; bgColor: string }
> = {
  PROPOSAL_SUBMITTED: {
    label: 'Proposal Submitted',
    icon: FileText,
    color: 'text-info-600',
    bgColor: 'bg-info-50',
  },
  PROPOSAL_REVISION: {
    label: 'Proposal Revision',
    icon: FileText,
    color: 'text-warning-600',
    bgColor: 'bg-warning-50',
  },
  STUDENT_UNPAIRED_ALERT: {
    label: 'Unpaired Student',
    icon: Users,
    color: 'text-error-600',
    bgColor: 'bg-error-50',
  },
  SUPERVISOR_OVERLOAD: {
    label: 'Supervisor Overload',
    icon: AlertTriangle,
    color: 'text-warning-600',
    bgColor: 'bg-warning-50',
  },
  DEADLINE_REMINDER: {
    label: 'Deadline Reminder',
    icon: Clock,
    color: 'text-warning-600',
    bgColor: 'bg-warning-50',
  },
  SYSTEM_ALERT: {
    label: 'System Alert',
    icon: AlertTriangle,
    color: 'text-error-600',
    bgColor: 'bg-error-50',
  },
  REPORT_READY: {
    label: 'Report Ready',
    icon: FileText,
    color: 'text-success-600',
    bgColor: 'bg-success-50',
  },
}

// Fallback config for unknown types
const defaultConfig = {
  label: 'Notification',
  icon: Bell,
  color: 'text-neutral-600',
  bgColor: 'bg-neutral-100',
}

export function NotificationsCenter() {
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<CommitteeNotificationType | 'ALL'>('ALL')
  const [readFilter, setReadFilter] = useState<'ALL' | 'UNREAD' | 'READ'>('ALL')

  const { data, isLoading } = useCommitteeNotifications()
  const { data: unreadCount } = useCommitteeUnreadCount()
  const markReadMutation = useMarkCommitteeNotificationRead()
  const markAllReadMutation = useMarkAllCommitteeNotificationsRead()

  const filteredNotifications = data?.notifications.filter((notification) => {
    if (typeFilter !== 'ALL' && notification.type !== typeFilter) return false
    if (readFilter === 'UNREAD' && notification.isRead) return false
    if (readFilter === 'READ' && !notification.isRead) return false
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      notification.title.toLowerCase().includes(query) ||
      notification.message.toLowerCase().includes(query)
    )
  })

  const handleMarkRead = async (notificationId: number) => {
    try {
      await markReadMutation.mutateAsync(notificationId)
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await markAllReadMutation.mutateAsync()
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error)
    }
  }

  const getNotificationLink = (notification: CommitteeNotification): string | null => {
    switch (notification.type) {
      case 'PROPOSAL_SUBMITTED':
        return notification.metadata?.proposalId
          ? ROUTES.COMMITTEE.PROPOSAL_DETAIL.replace(':id', String(notification.metadata.proposalId))
          : ROUTES.COMMITTEE.PROPOSALS
      case 'PAIRING_REQUEST':
        return ROUTES.COMMITTEE.PROJECTS
      case 'REPORT_READY':
        return notification.metadata?.reportId
          ? ROUTES.COMMITTEE.REPORT_DETAIL.replace(':id', String(notification.metadata.reportId))
          : ROUTES.COMMITTEE.REPORTS_HISTORY
      case 'ANNOUNCEMENT_PUBLISHED':
        return ROUTES.COMMITTEE.ANNOUNCEMENTS
      default:
        return null
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
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
            {unreadCount?.count ? (
              <span className="px-2 py-0.5 bg-error-500 text-white rounded-full text-sm font-medium">
                {unreadCount.count}
              </span>
            ) : null}
          </h1>
          <p className="text-neutral-600 mt-1">
            Stay updated with proposals, system alerts, and reminders
          </p>
        </div>
        {unreadCount?.count ? (
          <Button
            variant="outline"
            onClick={handleMarkAllRead}
            disabled={markAllReadMutation.isPending}
          >
            <CheckCheck className="h-4 w-4 mr-2" />
            Mark All Read
          </Button>
        ) : null}
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <Input
              type="text"
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as CommitteeNotificationType | 'ALL')}
            className="px-3 py-2 border border-neutral-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500"
          >
            <option value="ALL">All Types</option>
            {Object.entries(notificationTypeConfig).map(([value, config]) => (
              <option key={value} value={value}>
                {config.label}
              </option>
            ))}
          </select>
          <select
            value={readFilter}
            onChange={(e) => setReadFilter(e.target.value as 'ALL' | 'UNREAD' | 'READ')}
            className="px-3 py-2 border border-neutral-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500"
          >
            <option value="ALL">All</option>
            <option value="UNREAD">Unread</option>
            <option value="READ">Read</option>
          </select>
        </div>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card
          className={cn(
            'p-4 cursor-pointer transition-colors',
            typeFilter === 'PROPOSAL_SUBMITTED' ? 'ring-2 ring-primary-500' : 'hover:bg-neutral-50'
          )}
          onClick={() => setTypeFilter(typeFilter === 'PROPOSAL_SUBMITTED' ? 'ALL' : 'PROPOSAL_SUBMITTED')}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-info-50 rounded-lg">
              <FileText className="h-5 w-5 text-info-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-neutral-900">
                {data?.notifications.filter((n) => n.type === 'PROPOSAL_SUBMITTED').length ?? 0}
              </p>
              <p className="text-xs text-neutral-500">Proposals</p>
            </div>
          </div>
        </Card>

        <Card
          className={cn(
            'p-4 cursor-pointer transition-colors',
            typeFilter === 'DEADLINE_REMINDER' ? 'ring-2 ring-primary-500' : 'hover:bg-neutral-50'
          )}
          onClick={() => setTypeFilter(typeFilter === 'DEADLINE_REMINDER' ? 'ALL' : 'DEADLINE_REMINDER')}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-warning-50 rounded-lg">
              <Clock className="h-5 w-5 text-warning-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-neutral-900">
                {data?.notifications.filter((n) => n.type === 'DEADLINE_REMINDER').length ?? 0}
              </p>
              <p className="text-xs text-neutral-500">Reminders</p>
            </div>
          </div>
        </Card>

        <Card
          className={cn(
            'p-4 cursor-pointer transition-colors',
            typeFilter === 'SYSTEM_ALERT' ? 'ring-2 ring-primary-500' : 'hover:bg-neutral-50'
          )}
          onClick={() => setTypeFilter(typeFilter === 'SYSTEM_ALERT' ? 'ALL' : 'SYSTEM_ALERT')}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-error-50 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-error-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-neutral-900">
                {data?.notifications.filter((n) => n.type === 'SYSTEM_ALERT').length ?? 0}
              </p>
              <p className="text-xs text-neutral-500">Alerts</p>
            </div>
          </div>
        </Card>

        <Card
          className={cn(
            'p-4 cursor-pointer transition-colors',
            readFilter === 'UNREAD' ? 'ring-2 ring-primary-500' : 'hover:bg-neutral-50'
          )}
          onClick={() => setReadFilter(readFilter === 'UNREAD' ? 'ALL' : 'UNREAD')}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-50 rounded-lg">
              <Bell className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-neutral-900">{unreadCount?.count ?? 0}</p>
              <p className="text-xs text-neutral-500">Unread</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Notifications List */}
      <div className="space-y-2">
        {filteredNotifications && filteredNotifications.length > 0 ? (
          filteredNotifications.map((notification) => {
            const config = notificationTypeConfig[notification.type] || defaultConfig
            const Icon = config.icon
            const link = getNotificationLink(notification)

            const content = (
              <Card
                className={cn(
                  'p-4 transition-colors',
                  !notification.isRead && 'bg-primary-50/30 border-l-4 border-l-primary-500',
                  link && 'hover:shadow-md cursor-pointer'
                )}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
                    config.bgColor
                  )}>
                    <Icon className={cn('h-5 w-5', config.color)} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className={cn(
                          'font-medium text-neutral-900',
                          !notification.isRead && 'font-semibold'
                        )}>
                          {notification.title}
                        </h3>
                        <p className="text-sm text-neutral-600 mt-0.5 line-clamp-2">
                          {notification.message}
                        </p>
                      </div>
                      {link && <ChevronRight className="h-5 w-5 text-neutral-400 flex-shrink-0" />}
                    </div>

                    <div className="flex items-center gap-3 mt-2">
                      <span className={cn(
                        'px-2 py-0.5 rounded-full text-xs font-medium',
                        config.bgColor,
                        config.color
                      )}>
                        {config.label}
                      </span>
                      <span className="text-xs text-neutral-500">
                        {formatTime(notification.createdAt)}
                      </span>
                      {!notification.isRead && (
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleMarkRead(notification.notificationId)
                          }}
                          className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1"
                        >
                          <Check className="h-3.5 w-3.5" />
                          Mark read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            )

            if (link) {
              return (
                <Link key={notification.notificationId} to={link} onClick={() => {
                  if (!notification.isRead) handleMarkRead(notification.notificationId)
                }}>
                  {content}
                </Link>
              )
            }

            return <div key={notification.notificationId}>{content}</div>
          })
        ) : (
          <Card className="p-12 text-center">
            <Bell className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-neutral-900">No notifications</h3>
            <p className="text-neutral-500 mt-1">
              {searchQuery || typeFilter !== 'ALL' || readFilter !== 'ALL'
                ? 'Try adjusting your filters'
                : "You're all caught up!"}
            </p>
          </Card>
        )}
      </div>

      {/* Summary */}
      {data && data.notifications.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-neutral-600">
              Showing {filteredNotifications?.length ?? 0} of {data.total} notifications
            </span>
            <span className="text-neutral-500">
              {data.notifications.filter((n) => !n.isRead).length} unread
            </span>
          </div>
        </Card>
      )}
    </div>
  )
}
