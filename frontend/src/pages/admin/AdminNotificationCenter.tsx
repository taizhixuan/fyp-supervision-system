import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, CheckCheck, Filter } from 'lucide-react'
import { Card, Button, Badge, Spinner } from '@/components/ui'
import { NotificationItem } from '@/components/common/NotificationItem'
import { useNotifications } from '@/lib/hooks/useNotifications'
import { cn } from '@/lib/utils/cn'

export function AdminNotificationCenter() {
  const navigate = useNavigate()
  const [readFilter, setReadFilter] = useState<'all' | 'unread'>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')

  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    isMarkingAllRead,
  } = useNotifications(50)

  const distinctTypes = useMemo(
    () => Array.from(new Set(notifications.map((n) => n.type))).sort(),
    [notifications]
  )

  const filtered = notifications.filter((n) => {
    const matchesRead = readFilter === 'all' || !n.readAt
    const matchesType = typeFilter === 'all' || n.type === typeFilter
    return matchesRead && matchesType
  })

  const handleClick = (notificationId: number, targetRoute?: string) => {
    markAsRead(notificationId)
    if (targetRoute) navigate(targetRoute)
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
      {/* Compact hero */}
      <div className="relative bg-gradient-to-br from-stone-800 via-stone-800 to-stone-900 rounded-xl p-3 sm:p-4 text-white shadow-md overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="relative flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex-shrink-0 w-9 h-9 bg-amber-500/20 rounded-lg flex items-center justify-center ring-1 ring-amber-500/30">
              <Bell className="h-5 w-5 text-amber-400" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-white leading-tight">Notifications</h1>
              <p className="text-stone-300 text-xs">{unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}</p>
            </div>
          </div>
          {unreadCount > 0 && (
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<CheckCheck className="h-3.5 w-3.5" />}
              onClick={markAllAsRead}
              isLoading={isMarkingAllRead}
              className="border-stone-600 text-white hover:bg-stone-700"
            >
              Mark All Read
            </Button>
          )}
        </div>
      </div>

      <Card padding="sm">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex bg-neutral-100 rounded-md p-0.5">
            <button
              type="button"
              onClick={() => setReadFilter('all')}
              className={cn(
                'px-2.5 py-1 rounded text-xs font-medium transition-colors',
                readFilter === 'all' ? 'bg-white shadow-sm' : 'hover:bg-neutral-200'
              )}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setReadFilter('unread')}
              className={cn(
                'px-2.5 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1',
                readFilter === 'unread' ? 'bg-white shadow-sm' : 'hover:bg-neutral-200'
              )}
            >
              Unread
              {unreadCount > 0 && (
                <Badge variant="primary" size="sm">{unreadCount}</Badge>
              )}
            </button>
          </div>

          {distinctTypes.length > 0 && (
            <div className="flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-neutral-500" />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-2.5 h-8 rounded-md border border-neutral-300 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="all">All Types</option>
                {distinctTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </Card>

      {filtered.length === 0 ? (
        <Card className="text-center py-8">
          <Bell className="h-10 w-10 text-neutral-300 mx-auto mb-2" />
          <h3 className="text-sm font-medium text-neutral-900 mb-0.5">No notifications</h3>
          <p className="text-xs text-neutral-500">
            {readFilter === 'unread'
              ? "You've read all your notifications"
              : "You don't have any notifications yet"}
          </p>
        </Card>
      ) : (
        <Card className="p-0 overflow-hidden">
          <div className="divide-y divide-neutral-100">
            {filtered.map((notification) => (
              <NotificationItem
                key={notification.notificationId}
                notification={notification}
                onClick={() => handleClick(notification.notificationId, notification.targetRoute)}
              />
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
