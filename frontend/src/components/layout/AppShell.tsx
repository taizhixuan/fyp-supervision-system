import { useState } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import { TopBar } from './TopBar'
import { SideNav } from './SideNav'
import { NotificationDrawer } from '@/components/common/NotificationDrawer'
import { PrivacyConsentGate } from '@/components/common/PrivacyConsentGate'
import { useAuth } from '@/lib/auth/useAuth'
import { useNotifications } from '@/lib/hooks/useNotifications'
import { ROUTES } from '@/lib/constants/routes'
import { cn } from '@/lib/utils/cn'

export function AppShell() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState(false)

  const { user } = useAuth()
  const { unreadCount } = useNotifications()
  const location = useLocation()

  if (!user) {
    return null
  }

  // Floating "Ask AI" button — student only, hidden on the chatbot page itself
  const showAssistantFab =
    user.role === 'STUDENT' && !location.pathname.startsWith('/student/chatbot')

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

      {/* Floating FYP Assistant button (student only) */}
      {showAssistantFab && (
        <Link
          to={ROUTES.STUDENT.CHATBOT}
          className="group fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 pl-3 pr-4 py-3 rounded-full bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 text-white shadow-2xl shadow-primary-900/40 ring-1 ring-white/20 hover:shadow-primary-900/50 hover:-translate-y-0.5 transition-all"
          aria-label="Open FYP Assistant"
        >
          <span className="relative flex items-center justify-center w-8 h-8 rounded-full bg-white/15 ring-1 ring-white/30">
            <span className="absolute inset-0 rounded-full bg-primary-300/40 animate-ping opacity-60" />
            <Sparkles className="relative h-4 w-4" />
          </span>
          <span className="hidden sm:inline text-sm font-semibold">Ask FYP Assistant</span>
        </Link>
      )}
    </div>
  )
}
