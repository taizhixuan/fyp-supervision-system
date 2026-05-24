import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Bell,
  Search,
  Check,
  CheckCheck,
  FileText,
  Clock,
  ChevronRight,
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
import { getNotificationDisplay, formatNotificationTime } from '@/lib/utils/notificationDisplay'
import type { CommitteeNotificationType, CommitteeNotification } from '@/types'

// Committee filter options align with the real backend types it receives.
const COMMITTEE_TYPE_OPTIONS: Array<{ value: CommitteeNotificationType; label: string }> = [
  { value: 'PROPOSAL', label: 'Proposals' },
  { value: 'DEADLINE', label: 'Deadlines' },
  { value: 'REGISTRATION_PENDING', label: 'Pending Registrations' },
  { value: 'ACCOUNT_APPROVED', label: 'Account Updates' },
  { value: 'CYCLE_STATUS', label: 'Cycle Updates' },
  { value: 'SYSTEM', label: 'System' },
]

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
    const t = String(notification.type)
    const id = notification.relatedEntityId
    if (t === 'PROPOSAL' || t.startsWith('PROPOSAL_')) {
      return id
        ? ROUTES.COMMITTEE.PROPOSAL_DETAIL.replace(':id', String(id))
        : ROUTES.COMMITTEE.PROPOSALS
    }
    if (t === 'REPORT_READY') {
      return id
        ? ROUTES.COMMITTEE.REPORT_DETAIL.replace(':id', String(id))
        : ROUTES.COMMITTEE.REPORTS_HISTORY
    }
    if (t === 'ANNOUNCEMENT_PUBLISHED' || t === 'ANNOUNCEMENT') {
      return ROUTES.COMMITTEE.ANNOUNCEMENTS
    }
    if (t === 'PAIRING_REQUEST') return ROUTES.COMMITTEE.PROJECTS
    return null
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-3 lg:space-y-4">
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
            variant="secondary"
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
            {COMMITTEE_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
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

      {/* Quick Stats — counts keyed to real backend types */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card
          className={cn(
            'p-4 cursor-pointer transition-colors',
            typeFilter === 'PROPOSAL' ? 'ring-2 ring-primary-500' : 'hover:bg-neutral-50',
          )}
          onClick={() => setTypeFilter(typeFilter === 'PROPOSAL' ? 'ALL' : 'PROPOSAL')}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-info-50 rounded-lg">
              <FileText className="h-5 w-5 text-info-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-neutral-900">
                {data?.notifications.filter((n) => n.type === 'PROPOSAL').length ?? 0}
              </p>
              <p className="text-xs text-neutral-500">Proposals</p>
            </div>
          </div>
        </Card>

        <Card
          className={cn(
            'p-4 cursor-pointer transition-colors',
            typeFilter === 'DEADLINE' ? 'ring-2 ring-primary-500' : 'hover:bg-neutral-50',
          )}
          onClick={() => setTypeFilter(typeFilter === 'DEADLINE' ? 'ALL' : 'DEADLINE')}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-warning-50 rounded-lg">
              <Clock className="h-5 w-5 text-warning-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-neutral-900">
                {data?.notifications.filter((n) => n.type === 'DEADLINE').length ?? 0}
              </p>
              <p className="text-xs text-neutral-500">Deadlines</p>
            </div>
          </div>
        </Card>

        <Card
          className={cn(
            'p-4 cursor-pointer transition-colors',
            typeFilter === 'REGISTRATION_PENDING' ? 'ring-2 ring-primary-500' : 'hover:bg-neutral-50',
          )}
          onClick={() => setTypeFilter(typeFilter === 'REGISTRATION_PENDING' ? 'ALL' : 'REGISTRATION_PENDING')}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-50 rounded-lg">
              <FileText className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-neutral-900">
                {data?.notifications.filter((n) => n.type === 'REGISTRATION_PENDING').length ?? 0}
              </p>
              <p className="text-xs text-neutral-500">Pending Users</p>
            </div>
          </div>
        </Card>

        <Card
          className={cn(
            'p-4 cursor-pointer transition-colors',
            readFilter === 'UNREAD' ? 'ring-2 ring-primary-500' : 'hover:bg-neutral-50',
          )}
          onClick={() => setReadFilter(readFilter === 'UNREAD' ? 'ALL' : 'UNREAD')}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-error-50 rounded-lg">
              <Bell className="h-5 w-5 text-error-600" />
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
            const { Icon, iconColor, iconBg, label } = getNotificationDisplay(
              notification.type as string,
              notification.title,
            )
            const link = getNotificationLink(notification)

            const content = (
              <Card
                className={cn(
                  'group p-4 transition-all',
                  !notification.isRead
                    ? 'bg-primary-50/40 border-l-4 border-l-primary-500'
                    : 'border-l-4 border-l-transparent',
                  link && 'hover:shadow-md hover:border-l-primary-400 cursor-pointer',
                )}
              >
                <div className="flex items-start gap-4">
                  <div className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
                    iconBg,
                  )}>
                    <Icon className={cn('h-5 w-5', iconColor)} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className={cn(
                            'text-neutral-900',
                            !notification.isRead ? 'font-semibold' : 'font-medium',
                          )}>
                            {notification.title}
                          </h3>
                          {!notification.isRead && (
                            <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-primary-500" />
                          )}
                        </div>
                        <p className="text-sm text-neutral-600 mt-0.5 line-clamp-2">
                          {notification.message}
                        </p>
                      </div>
                      {link && (
                        <ChevronRight className="h-5 w-5 text-neutral-300 group-hover:text-neutral-600 flex-shrink-0 transition-colors" />
                      )}
                    </div>

                    <div className="flex items-center gap-3 mt-2">
                      <span className={cn(
                        'px-2 py-0.5 rounded-full text-xs font-medium',
                        iconBg,
                        iconColor,
                      )}>
                        {label}
                      </span>
                      <span className="text-xs text-neutral-500">
                        {formatNotificationTime(notification.createdAt)}
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
          <Card className="text-center py-10">
            <Bell className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-neutral-900">No notifications</h3>
            <p className="text-neutral-500 mt-1">
              {searchQuery || typeFilter !== 'ALL' || readFilter !== 'ALL'
                ? 'Try adjusting your filters'
                : "You'll see new updates here when there's activity"}
            </p>
          </Card>
        )}
        {filteredNotifications && filteredNotifications.length > 0 && filteredNotifications.length < 4 && (
          <p className="text-center text-xs text-neutral-400 py-3">
            That's all for now. You'll see new updates here.
          </p>
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
