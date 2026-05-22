import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Bell,
  Check,
  Calendar,
  FileText,
  ClipboardList,
  FolderOpen,
  Settings,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { useSupervisorNotifications, useSupervisorUnreadCount, useMarkSupervisorNotificationRead } from '@/lib/hooks/useSupervisor'
import { ROUTES } from '@/lib/constants/routes'
import { cn } from '@/lib/utils/cn'
import type { SupervisorNotificationType } from '@/types'

const defaultNotificationConfig = { icon: Bell, color: 'text-stone-600', bgColor: 'bg-stone-100' }

const notificationConfig: Record<SupervisorNotificationType, { icon: typeof Bell; color: string; bgColor: string }> = {
  NEW_REQUEST: { icon: ClipboardList, color: 'text-amber-600', bgColor: 'bg-amber-50' },
  MEETING_REQUEST: { icon: Calendar, color: 'text-sky-600', bgColor: 'bg-sky-50' },
  MEETING_CONFIRMED: { icon: Calendar, color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
  MEETING_CANCELLED: { icon: Calendar, color: 'text-rose-600', bgColor: 'bg-rose-50' },
  LOG_SUBMITTED: { icon: FileText, color: 'text-violet-600', bgColor: 'bg-violet-50' },
  DOCUMENT_UPLOADED: { icon: FolderOpen, color: 'text-sky-600', bgColor: 'bg-sky-50' },
  PROPOSAL_SUBMITTED: { icon: FileText, color: 'text-amber-600', bgColor: 'bg-amber-50' },
  PROPOSAL_REVISED: { icon: FileText, color: 'text-rose-600', bgColor: 'bg-rose-50' },
  SYSTEM: { icon: Settings, color: 'text-stone-600', bgColor: 'bg-stone-100' },
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

        {/* Category stats inline */}
        {data && data.notifications.length > 0 && (
          <div className="relative mt-3 grid grid-cols-4 gap-1.5">
            {[
              { label: 'Requests', count: data.notifications.filter((n) => n.type === 'NEW_REQUEST').length, color: 'text-amber-300' },
              { label: 'Meetings', count: data.notifications.filter((n) => n.type.includes('MEETING')).length, color: 'text-sky-300' },
              { label: 'Logs', count: data.notifications.filter((n) => n.type === 'LOG_SUBMITTED').length, color: 'text-violet-300' },
              { label: 'Docs', count: data.notifications.filter((n) => n.type === 'DOCUMENT_UPLOADED').length, color: 'text-emerald-300' },
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
          {filteredNotifications.map((notification) => {
            const config = notificationConfig[notification.type] ?? defaultNotificationConfig
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
              >
                <Card
                  padding="sm"
                  hover
                  className={cn(
                    'transition-all',
                    !notification.isRead && 'border-l-4 border-l-amber-500 bg-amber-50/50'
                  )}
                >
                  <div className="flex items-start gap-2.5">
                    <div className={cn('w-9 h-9 rounded-md flex items-center justify-center flex-shrink-0', config.bgColor)}>
                      <Icon className={cn('h-4 w-4', config.color)} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h3 className={cn(
                            'text-sm leading-tight truncate',
                            notification.isRead ? 'text-stone-700 font-medium' : 'font-semibold text-stone-900'
                          )}>
                            {notification.title}
                          </h3>
                          <p className="text-xs text-stone-500 mt-0.5 line-clamp-2 leading-snug">
                            {notification.message}
                          </p>
                          <p className="text-[10px] text-stone-400 mt-0.5">
                            {formatTimeAgo(notification.createdAt)}
                          </p>
                        </div>
                        {!notification.isRead && (
                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              handleMarkAsRead(notification.notificationId)
                            }}
                            className="p-1 rounded hover:bg-stone-100 text-stone-400 hover:text-stone-600 flex-shrink-0"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {!notification.isRead && (
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0 mt-2" />
                    )}
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>
      ) : (
        <Card className="text-center py-8">
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
