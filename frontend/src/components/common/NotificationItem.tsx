import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { getNotificationDisplay, formatNotificationTime } from '@/lib/utils/notificationDisplay'
import type { Notification } from '@/types'

interface NotificationItemProps {
  notification: Notification
  onClick?: () => void
}

export function NotificationItem({ notification, onClick }: NotificationItemProps) {
  const { Icon, iconColor, iconBg } = getNotificationDisplay(notification.type, notification.title)
  const isUnread = !notification.readAt
  const clickable = Boolean(notification.targetRoute || onClick)

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group w-full flex items-start gap-3 p-4 text-left transition-colors',
        isUnread
          ? 'bg-primary-50/50 border-l-4 border-l-primary-500 hover:bg-primary-50'
          : 'border-l-4 border-l-transparent hover:bg-neutral-50',
      )}
    >
      <div
        className={cn(
          'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center',
          iconBg,
          iconColor,
        )}
      >
        <Icon className="h-5 w-5" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p
            className={cn(
              'text-sm line-clamp-1',
              isUnread ? 'font-semibold text-neutral-900' : 'font-medium text-neutral-700',
            )}
          >
            {notification.title}
          </p>
          {isUnread && (
            <span className="flex-shrink-0 w-2 h-2 mt-1.5 rounded-full bg-primary-500" />
          )}
        </div>
        <p className="text-sm text-neutral-600 line-clamp-2 mt-0.5">{notification.message}</p>
        <p className="text-xs text-neutral-400 mt-1">{formatNotificationTime(notification.createdAt)}</p>
      </div>

      {clickable && (
        <ChevronRight className="flex-shrink-0 h-4 w-4 mt-3 text-neutral-300 group-hover:text-neutral-500 transition-colors" />
      )}
    </button>
  )
}
