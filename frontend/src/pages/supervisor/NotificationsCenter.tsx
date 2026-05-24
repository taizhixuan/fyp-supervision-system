import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, Check, ChevronRight } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { useSupervisorNotifications, useSupervisorUnreadCount, useMarkSupervisorNotificationRead } from '@/lib/hooks/useSupervisor'
import { ROUTES } from '@/lib/constants/routes'
import { cn } from '@/lib/utils/cn'
import { getNotificationDisplay, formatNotificationTime } from '@/lib/utils/notificationDisplay'

// The backend's NotificationService emits 9 generic types (REQUEST, PROPOSAL,
// MEETING, ...). The supervisor frontend used to expect role-specific types
// like NEW_REQUEST which never matched — that's why every icon was a bell.
// We route by the actual type now and let title keywords differentiate
// "Accepted" vs "Declined" etc. via getNotificationDisplay().
type SupervisorNotificationLike = {
  type: string
  title?: string
  relatedEntityId?: number
  relatedEntityType?: string
}

const getNotificationLink = (n: SupervisorNotificationLike): string => {
  const t = n.type
  const title = (n.title ?? '').toLowerCase()
  // REQUEST → supervisor's inbox of supervision requests
  if (t === 'REQUEST' || t === 'NEW_REQUEST') {
    return n.relatedEntityId
      ? ROUTES.SUPERVISOR.REQUEST_DETAIL.replace(':id', String(n.relatedEntityId))
      : ROUTES.SUPERVISOR.REQUESTS
  }
  // MEETING covers logs too (meeting-log lifecycle notifications use type=MEETING)
  if (t === 'MEETING' || t.startsWith('MEETING_')) {
    if (title.includes('log')) {
      return n.relatedEntityId
        ? ROUTES.SUPERVISOR.LOG_DETAIL.replace(':id', String(n.relatedEntityId))
        : ROUTES.SUPERVISOR.LOGS
    }
    return n.relatedEntityId
      ? ROUTES.SUPERVISOR.MEETING_DETAIL.replace(':id', String(n.relatedEntityId))
      : ROUTES.SUPERVISOR.MEETINGS
  }
  if (t === 'LOG_SUBMITTED') {
    return n.relatedEntityId
      ? ROUTES.SUPERVISOR.LOG_DETAIL.replace(':id', String(n.relatedEntityId))
      : ROUTES.SUPERVISOR.LOGS
  }
  if (t === 'DOCUMENT_UPLOADED') {
    return n.relatedEntityId
      ? ROUTES.SUPERVISOR.DOCUMENT_DETAIL.replace(':id', String(n.relatedEntityId))
      : ROUTES.SUPERVISOR.DOCUMENTS
  }
  if (t === 'PROPOSAL' || t.startsWith('PROPOSAL_')) {
    return n.relatedEntityId
      ? ROUTES.SUPERVISOR.PROPOSAL_DETAIL.replace(':id', String(n.relatedEntityId))
      : ROUTES.SUPERVISOR.PROPOSALS
  }
  return ROUTES.SUPERVISOR.DASHBOARD
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-3 lg:space-y-4">
      {/* Compact Header — title + filters + category stats inline */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-stone-800 via-stone-800 to-stone-900 p-3 sm:p-4 text-white shadow-md">
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

        <div className="relative flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex-shrink-0 w-9 h-9 bg-amber-500/20 rounded-lg flex items-center justify-center ring-1 ring-amber-500/30">
              <Bell className="h-5 w-5 text-amber-400" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-white leading-tight">Notifications</h1>
              <p className="text-stone-300 text-xs">Stay updated with supervisees' activities</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={() => setFilter('all')}
              className={cn(
                'px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap',
                filter === 'all' ? 'bg-white text-stone-900' : 'bg-white/10 text-stone-200 hover:bg-white/20'
              )}
            >
              All
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={cn(
                'px-2.5 py-1 text-xs font-medium rounded-md transition-colors inline-flex items-center gap-1 whitespace-nowrap',
                filter === 'unread' ? 'bg-white text-stone-900' : 'bg-white/10 text-stone-200 hover:bg-white/20'
              )}
            >
              Unread
              {(unreadData?.count ?? 0) > 0 && (
                <span className={cn(
                  'px-1 py-0 text-[10px] font-bold rounded',
                  filter === 'unread' ? 'bg-amber-400 text-stone-900' : 'bg-amber-300/30 text-amber-200'
                )}>
                  {unreadData?.count}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Category stats inline — keyed to the real backend types
            (REQUEST, MEETING, PROPOSAL, DEADLINE). */}
        {data && data.notifications.length > 0 && (
          <div className="relative mt-3 grid grid-cols-4 gap-1.5">
            {[
              { label: 'Requests', count: data.notifications.filter((n) => n.type === 'REQUEST').length, color: 'text-amber-300' },
              { label: 'Meetings', count: data.notifications.filter((n) => n.type === 'MEETING').length, color: 'text-sky-300' },
              { label: 'Proposals', count: data.notifications.filter((n) => n.type === 'PROPOSAL').length, color: 'text-violet-300' },
              { label: 'Deadlines', count: data.notifications.filter((n) => n.type === 'DEADLINE').length, color: 'text-emerald-300' },
            ].map((c) => (
              <div key={c.label} className="bg-stone-700/40 rounded-md px-2 py-1.5 ring-1 ring-stone-600/40 text-center">
                <div className={cn('text-base font-bold leading-none', c.color)}>{c.count}</div>
                <p className="text-[10px] text-stone-300 mt-0.5 uppercase tracking-wide">{c.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Notifications List — 2-col grid */}
      {filteredNotifications && filteredNotifications.length > 0 ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
            {filteredNotifications.map((notification) => {
              const { Icon, iconColor, iconBg, label } = getNotificationDisplay(notification.type, notification.title)
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
                  className="block h-full"
                >
                  <Card
                    padding="sm"
                    hover
                    className={cn(
                      'group transition-all h-full',
                      !notification.isRead
                        ? 'border-l-4 border-l-amber-500 bg-amber-50/50'
                        : 'border-l-4 border-l-transparent',
                      'hover:shadow-md',
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
                              <h3 className={cn(
                                'text-sm leading-tight truncate',
                                notification.isRead ? 'text-stone-700 font-medium' : 'font-semibold text-stone-900',
                              )}>
                                {notification.title}
                              </h3>
                              {!notification.isRead && (
                                <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-amber-500" />
                              )}
                            </div>
                            <p className="text-xs text-stone-500 mt-0.5 line-clamp-2 leading-snug">
                              {notification.message}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={cn('inline-flex items-center px-1.5 py-0 rounded text-[10px] font-medium', iconBg, iconColor)}>
                                {label}
                              </span>
                              <span className="text-[11px] text-stone-400">
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
                                  handleMarkAsRead(notification.notificationId)
                                }}
                                className="p-1 rounded hover:bg-stone-100 text-stone-400 hover:text-stone-600"
                                title="Mark as read"
                              >
                                <Check className="h-3.5 w-3.5" />
                              </button>
                            )}
                            <ChevronRight className="h-4 w-4 text-stone-300 group-hover:text-stone-600 transition-colors" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              )
            })}
          </div>
          {filteredNotifications.length < 4 && (
            <p className="text-center text-xs text-stone-400 py-3">
              That's all for now. You'll see new updates here.
            </p>
          )}
        </>
      ) : (
        <Card className="text-center py-10">
          <Bell className="h-10 w-10 text-stone-300 mx-auto mb-2" />
          <h3 className="font-medium text-stone-800 mb-1">
            {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
          </h3>
          <p className="text-sm text-stone-500">
            {filter === 'unread'
              ? "You're all caught up!"
              : 'Notifications about your supervisees will appear here'}
          </p>
        </Card>
      )}
    </div>
  )
}
