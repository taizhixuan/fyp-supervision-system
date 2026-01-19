import { Bell, Menu } from 'lucide-react'
import { DotBadge } from '@/components/ui'
import { UserMenu } from '@/components/common/UserMenu'
import { cn } from '@/lib/utils/cn'

interface TopBarProps {
  onMenuClick?: () => void
  onNotificationClick?: () => void
  unreadNotificationCount?: number
  showMenuButton?: boolean
}

export function TopBar({
  onMenuClick,
  onNotificationClick,
  unreadNotificationCount = 0,
  showMenuButton = true,
}: TopBarProps) {
  return (
    <header className="h-16 bg-white border-b border-neutral-200 px-4 lg:px-6 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-4">
        {showMenuButton && (
          <button
            type="button"
            onClick={onMenuClick}
            className="lg:hidden p-2 -ml-2 rounded-md text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
            aria-label="Toggle menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}

        {/* Logo */}
        <div className="flex items-center gap-2">
          <img
            src="/logo.svg"
            alt="FYP Supervision System"
            className="h-10 w-auto"
          />
          <span className="hidden sm:block font-semibold text-neutral-900">
            FYP Supervision System
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Notification Bell */}
        <button
          type="button"
          onClick={onNotificationClick}
          className={cn(
            'p-2 rounded-md text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors',
            unreadNotificationCount > 0 && 'text-primary-600'
          )}
          aria-label={`Notifications${unreadNotificationCount > 0 ? `, ${unreadNotificationCount} unread` : ''}`}
        >
          <DotBadge count={unreadNotificationCount}>
            <Bell className="h-5 w-5" />
          </DotBadge>
        </button>

        {/* User Menu */}
        <UserMenu />
      </div>
    </header>
  )
}
