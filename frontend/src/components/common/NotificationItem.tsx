import {
  Megaphone,
  Calendar,
  FileText,
  Settings,
  Mail,
  Bell,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { formatRelativeTime } from '@/lib/hooks/useNotifications'
import type { Notification } from '@/types'

interface NotificationItemProps {
  notification: Notification
  onClick?: () => void
}

export function NotificationItem({ notification, onClick }: NotificationItemProps) {
  const { Icon, colorClass } = getNotificationIcon(notification.type)
  const isUnread = !notification.readAt

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full flex items-start gap-3 p-4 text-left transition-colors hover:bg-neutral-50',
        isUnread && 'bg-primary-50/30'
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center',
          colorClass
        )}
      >
        <Icon className="h-5 w-5" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p
            className={cn(
              'text-sm line-clamp-1',
              isUnread ? 'font-semibold text-neutral-900' : 'font-medium text-neutral-700'
            )}
          >
            {notification.title}
          </p>
          {isUnread && (
            <span className="flex-shrink-0 w-2 h-2 mt-1.5 rounded-full bg-primary-500" />
          )}
        </div>
        <p className="text-sm text-neutral-600 line-clamp-2 mt-0.5">
          {notification.message}
        </p>
        <p className="text-xs text-neutral-400 mt-1">
          {formatRelativeTime(notification.createdAt)}
        </p>
      </div>
    </button>
  )
}

function getNotificationIcon(type: string) {
  const iconMap: Record<string, { Icon: typeof Bell; colorClass: string }> = {
    ANNOUNCEMENT: { Icon: Megaphone, colorClass: 'text-primary-500 bg-primary-50' },
    MEETING: { Icon: Calendar, colorClass: 'text-info-500 bg-info-50' },
    PROPOSAL: { Icon: FileText, colorClass: 'text-warning-500 bg-warning-50' },
    SYSTEM: { Icon: Settings, colorClass: 'text-neutral-500 bg-neutral-100' },
    REQUEST: { Icon: Mail, colorClass: 'text-accent-500 bg-accent-50' },
  }

  return iconMap[type] || { Icon: Bell, colorClass: 'text-neutral-500 bg-neutral-100' }
}
