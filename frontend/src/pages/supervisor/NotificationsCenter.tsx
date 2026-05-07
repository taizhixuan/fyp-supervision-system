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
  Sparkles,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { useSupervisorNotifications, useSupervisorUnreadCount, useMarkSupervisorNotificationRead } from '@/lib/hooks/useSupervisor'
import { ROUTES } from '@/lib/constants/routes'
import { cn } from '@/lib/utils/cn'
import type { SupervisorNotificationType } from '@/types'

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
    <div className="space-y-6">
      {/* Header - Gradient Style */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-stone-800 via-stone-800 to-stone-900 p-6 text-white shadow-xl">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-stone-600/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-14 h-14 bg-amber-500/20 rounded-xl flex items-center justify-center ring-1 ring-amber-500/30">
              <Bell className="h-7 w-7 text-amber-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">
                Notifications
              </h1>
              <p className="text-stone-300 mt-1">
                Stay updated with your supervisees' activities
              </p>
            </div>
          </div>
          {(unreadData?.count ?? 0) > 0 && (
            <div className="flex items-center gap-2 bg-stone-700/50 backdrop-blur-sm rounded-xl px-4 py-3 ring-1 ring-stone-600/50">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-400" />
                <span className="text-sm font-medium text-white">
                  <span className="text-amber-400 font-bold">{unreadData?.count}</span> unread notification{(unreadData?.count ?? 0) > 1 ? 's' : ''}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setFilter('all')}
          className={cn(
            'px-4 py-2 text-sm font-medium rounded-lg transition-all',
            filter === 'all'
              ? 'bg-stone-800 text-white shadow-md'
              : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
          )}
        >
          All Notifications
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={cn(
            'px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2',
            filter === 'unread'
              ? 'bg-stone-800 text-white shadow-md'
              : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
          )}
        >
          Unread
          {(unreadData?.count ?? 0) > 0 && (
            <span className={cn(
              'px-2 py-0.5 text-xs font-bold rounded-full',
              filter === 'unread' ? 'bg-amber-400 text-stone-900' : 'bg-amber-100 text-amber-700'
            )}>
              {unreadData?.count}
            </span>
          )}
        </button>
      </div>

      {/* Notifications List */}
      <Card className="overflow-hidden">
        <div className="divide-y divide-stone-100">
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
                    'flex items-start gap-4 p-4 transition-all duration-200 group',
                    !notification.isRead
                      ? 'bg-amber-50/50 hover:bg-amber-50'
                      : 'hover:bg-stone-50'
                  )}
                >
                  {/* Icon */}
                  <div className={cn(
                    'p-2.5 rounded-xl flex-shrink-0 transition-transform group-hover:scale-110',
                    config.bgColor
                  )}>
                    <Icon className={cn('h-5 w-5', config.color)} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className={cn(
                          'text-sm',
                          notification.isRead ? 'text-stone-700' : 'font-semibold text-stone-900'
                        )}>
                          {notification.title}
                        </h3>
                        <p className="text-sm text-stone-500 mt-0.5">
                          {notification.message}
                        </p>
                      </div>
                      {!notification.isRead && (
                        <span className="w-2.5 h-2.5 bg-amber-500 rounded-full flex-shrink-0 mt-1.5 ring-2 ring-amber-200" />
                      )}
                    </div>
                    <p className="text-xs text-stone-400 mt-1.5">
                      {formatTimeAgo(notification.createdAt)}
                    </p>
                  </div>

                  {/* Mark as Read Button */}
                  {!notification.isRead && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-stone-200 text-stone-600"
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
              <div className="w-16 h-16 mx-auto bg-stone-100 rounded-full flex items-center justify-center mb-4">
                <Bell className="h-8 w-8 text-stone-400" />
              </div>
              <h3 className="text-lg font-semibold text-stone-800">
                {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
              </h3>
              <p className="text-stone-500 mt-1">
                {filter === 'unread'
                  ? "You're all caught up!"
                  : 'Notifications about your supervisees will appear here'}
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Notification Categories Summary */}
      {data && data.notifications.length > 0 && (
        <Card className="overflow-hidden">
          <div className="p-4 border-b border-stone-200 bg-gradient-to-r from-stone-50 to-stone-100/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-violet-100 rounded-lg">
                <Sparkles className="h-5 w-5 text-violet-600" />
              </div>
              <h3 className="font-semibold text-stone-800">By Category</h3>
            </div>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                {
                  label: 'Requests',
                  count: data.notifications.filter((n) => n.type === 'NEW_REQUEST').length,
                  icon: ClipboardList,
                  color: 'text-amber-600',
                  bgColor: 'bg-amber-100',
                },
                {
                  label: 'Meetings',
                  count: data.notifications.filter((n) => n.type.includes('MEETING')).length,
                  icon: Calendar,
                  color: 'text-sky-600',
                  bgColor: 'bg-sky-100',
                },
                {
                  label: 'Logs',
                  count: data.notifications.filter((n) => n.type === 'LOG_SUBMITTED').length,
                  icon: FileText,
                  color: 'text-violet-600',
                  bgColor: 'bg-violet-100',
                },
                {
                  label: 'Documents',
                  count: data.notifications.filter((n) => n.type === 'DOCUMENT_UPLOADED').length,
                  icon: FolderOpen,
                  color: 'text-emerald-600',
                  bgColor: 'bg-emerald-100',
                },
              ].map((category) => (
                <div key={category.label} className="flex items-center gap-3 p-3 rounded-xl bg-stone-50/50 hover:bg-stone-50 transition-colors">
                  <div className={cn('p-2 rounded-lg', category.bgColor)}>
                    <category.icon className={cn('h-5 w-5', category.color)} />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-stone-800">{category.count}</p>
                    <p className="text-xs text-stone-500 font-medium">{category.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
