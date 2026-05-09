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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Notifications</h1>
          <p className="text-neutral-600 mt-1">
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            leftIcon={<CheckCheck className="h-4 w-4" />}
            onClick={markAllAsRead}
            isLoading={isMarkingAllRead}
          >
            Mark All Read
          </Button>
        )}
      </div>

      <Card>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex bg-neutral-100 rounded-lg p-1">
            <button
              type="button"
              onClick={() => setReadFilter('all')}
              className={cn(
                'px-4 py-2 rounded text-sm font-medium transition-colors',
                readFilter === 'all' ? 'bg-white shadow-sm' : 'hover:bg-neutral-200'
              )}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setReadFilter('unread')}
              className={cn(
                'px-4 py-2 rounded text-sm font-medium transition-colors flex items-center gap-2',
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
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-neutral-500" />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-4 py-2 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
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
        <Card className="text-center py-12">
          <Bell className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-neutral-900 mb-2">No notifications</h3>
          <p className="text-neutral-500">
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
