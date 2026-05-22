import { Bell, Menu, Moon, Sun } from 'lucide-react'
import { DotBadge } from '@/components/ui'
import { UserMenu } from '@/components/common/UserMenu'
import { cn } from '@/lib/utils/cn'
import { useTheme } from '@/lib/theme/ThemeProvider'

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
  const { resolvedTheme, toggleTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  return (
    <header className="h-16 bg-white border-b border-neutral-200 px-4 lg:px-6 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-4">
        {showMenuButton && (
          <button
            type="button"
            onClick={onMenuClick}
            className="lg:hidden p-2 -ml-2 rounded-lg text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
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

      <div className="flex items-center gap-3">
        {/* Theme toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2.5 rounded-xl text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>

        {/* Notification Bell */}
        <button
          type="button"
          onClick={onNotificationClick}
          className={cn(
            'relative p-2.5 rounded-xl transition-all duration-200',
            unreadNotificationCount > 0
              ? 'bg-primary-50 text-primary-600 hover:bg-primary-100'
              : 'text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100'
          )}
          aria-label={`Notifications${unreadNotificationCount > 0 ? `, ${unreadNotificationCount} unread` : ''}`}
        >
          <DotBadge count={unreadNotificationCount} pulse={unreadNotificationCount > 0}>
            <Bell className={cn(
              'h-5 w-5 transition-transform',
              unreadNotificationCount > 0 && 'animate-[wiggle_1s_ease-in-out]'
            )} />
          </DotBadge>
        </button>

        {/* Divider */}
        <div className="h-8 w-px bg-neutral-200" />

        {/* User Menu */}
        <UserMenu />
      </div>
    </header>
  )
}
