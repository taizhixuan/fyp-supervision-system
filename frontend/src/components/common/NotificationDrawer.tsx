import { useNavigate } from 'react-router-dom'
import {
  Megaphone,
  Calendar,
  FileText,
  Settings,
  Mail,
  Bell,
  CalendarClock,
  UserCheck,
  UserPlus,
  GraduationCap,
  Lightbulb,
} from 'lucide-react'
import { Drawer, DrawerContent, DrawerFooter } from '@/components/ui/Drawer'
import { Button, Spinner } from '@/components/ui'
import { NotificationItem } from './NotificationItem'
import { useNotifications } from '@/lib/hooks/useNotifications'
import { useAuth } from '@/lib/auth/useAuth'
import { ROUTES } from '@/lib/constants/routes'

interface NotificationDrawerProps {
  isOpen: boolean
  onClose: () => void
}

export function NotificationDrawer({ isOpen, onClose }: NotificationDrawerProps) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const {
    notifications,
    isLoading,
    markAsRead,
    markAllAsRead,
    isMarkingAllRead,
    unreadCount,
  } = useNotifications(10)

  const viewAllRoute = (() => {
    switch (user?.role) {
      case 'STUDENT': return ROUTES.STUDENT.NOTIFICATIONS
      case 'SUPERVISOR': return ROUTES.SUPERVISOR.NOTIFICATIONS
      case 'FYP_COMMITTEE': return ROUTES.COMMITTEE.NOTIFICATIONS
      default: return null
    }
  })()

  const handleNotificationClick = (notificationId: number, targetRoute?: string) => {
    markAsRead(notificationId)
    if (targetRoute) {
      navigate(targetRoute)
      onClose()
    }
  }

  const handleViewAll = () => {
    if (!viewAllRoute) return
    navigate(viewAllRoute)
    onClose()
  }

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Notifications"
      size="md"
    >
      <DrawerContent className="p-0">
        {/* Mark all as read button */}
        {unreadCount > 0 && (
          <div className="px-4 py-2 border-b border-neutral-100">
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              isLoading={isMarkingAllRead}
              className="text-primary-600 hover:text-primary-700"
            >
              Mark all as read
            </Button>
          </div>
        )}

        {/* Notification list */}
        <div className="divide-y divide-neutral-100">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size="md" label="Loading notifications..." />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-neutral-500">
              <Bell className="h-12 w-12 mb-3 text-neutral-300" />
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <NotificationItem
                key={notification.notificationId}
                notification={notification}
                onClick={() =>
                  handleNotificationClick(
                    notification.notificationId,
                    notification.targetRoute
                  )
                }
              />
            ))
          )}
        </div>
      </DrawerContent>

      {notifications.length > 0 && viewAllRoute && (
        <DrawerFooter>
          <Button variant="secondary" className="w-full" onClick={handleViewAll}>
            View All Notifications
          </Button>
        </DrawerFooter>
      )}
    </Drawer>
  )
}

// Export icon getter for use in NotificationItem
export function getNotificationIcon(type: string) {
  const iconMap: Record<string, { Icon: typeof Bell; colorClass: string }> = {
    ANNOUNCEMENT: { Icon: Megaphone, colorClass: 'text-primary-500 bg-primary-50' },
    MEETING: { Icon: Calendar, colorClass: 'text-info-500 bg-info-50' },
    PROPOSAL: { Icon: FileText, colorClass: 'text-warning-500 bg-warning-50' },
    SYSTEM: { Icon: Settings, colorClass: 'text-neutral-500 bg-neutral-100' },
    REQUEST: { Icon: Mail, colorClass: 'text-accent-500 bg-accent-50' },
    DEADLINE: { Icon: CalendarClock, colorClass: 'text-warning-500 bg-warning-50' },
    REGISTRATION_PENDING: { Icon: UserPlus, colorClass: 'text-info-500 bg-info-50' },
    ACCOUNT_APPROVED: { Icon: UserCheck, colorClass: 'text-success-500 bg-success-50' },
    ACCOUNT_REJECTED: { Icon: UserCheck, colorClass: 'text-accent-500 bg-accent-50' },
    FYP1_RESULT: { Icon: GraduationCap, colorClass: 'text-primary-500 bg-primary-50' },
    TOPIC: { Icon: Lightbulb, colorClass: 'text-warning-500 bg-warning-50' },
    TOPIC_REVIEW: { Icon: Lightbulb, colorClass: 'text-warning-500 bg-warning-50' },
    TOPIC_CONFIRMED: { Icon: Lightbulb, colorClass: 'text-success-500 bg-success-50' },
  }

  return iconMap[type] || { Icon: Bell, colorClass: 'text-neutral-500 bg-neutral-100' }
}
