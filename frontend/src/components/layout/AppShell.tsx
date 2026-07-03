import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { TopBar } from './TopBar'
import { SideNav } from './SideNav'
import { NotificationDrawer } from '@/components/common/NotificationDrawer'
import { PrivacyConsentGate } from '@/components/common/PrivacyConsentGate'
import { useAuth } from '@/lib/auth/useAuth'
import { useNotifications } from '@/lib/hooks/useNotifications'
import { cn } from '@/lib/utils/cn'

export function AppShell() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState(false)

  const { user } = useAuth()
  const { unreadCount } = useNotifications()

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Sidebar */}
      <SideNav
        userRole={user.role}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* Main content area */}
      <div
        className={cn(
          'lg:ml-64 transition-all duration-300',
          isSidebarCollapsed && 'lg:ml-20'
        )}
      >
        {/* Top bar */}
        <TopBar
          onMenuClick={() => setIsMobileMenuOpen(true)}
          onNotificationClick={() => setIsNotificationDrawerOpen(true)}
          unreadNotificationCount={unreadCount}
        />

        {/* Page content */}
        <main className="p-3 sm:p-4 lg:p-5">
          <Outlet />
        </main>
      </div>

      {/* Notification drawer */}
      <NotificationDrawer
        isOpen={isNotificationDrawerOpen}
        onClose={() => setIsNotificationDrawerOpen(false)}
      />

      {/* Blocks the app when PRIVACY_NOTICE_VERSION has been bumped past what the user accepted. */}
      <PrivacyConsentGate />
    </div>
  )
}
