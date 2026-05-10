import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { User, Settings, LogOut, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { useAuth } from '@/lib/auth/useAuth'
import { ROUTES } from '@/lib/constants/routes'
import { avatarInitials } from '@/lib/utils/name'

export function UserMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close menu on escape
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  const handleLogout = async () => {
    setIsOpen(false)
    await logout()
    navigate(ROUTES.LOGIN)
  }

  const getRoleDisplayName = (role: string): string => {
    switch (role) {
      case 'STUDENT':
        return 'Student'
      case 'SUPERVISOR':
        return 'Supervisor'
      case 'FYP_COMMITTEE':
        return 'FYP Committee'
      case 'SYSTEM_ADMIN':
        return 'System Admin'
      default:
        return role
    }
  }

  // Delegates to shared util so honorific prefixes ("Dr.", "Prof." …) are
  // stripped before initials, matching BasicProfilePage and the avatar
  // helpers used across admin pages.
  const getInitials = (name: string): string => avatarInitials(name)

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors',
          'hover:bg-neutral-100',
          isOpen && 'bg-neutral-100'
        )}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-medium">
          {user ? getInitials(user.fullName) : <User className="h-4 w-4" />}
        </div>

        {/* Name (hidden on mobile) */}
        <div className="hidden sm:block text-left">
          <p className="text-sm font-medium text-neutral-900 line-clamp-1">
            {user?.fullName || 'User'}
          </p>
          <p className="text-xs text-neutral-500">
            {user ? getRoleDisplayName(user.role) : ''}
          </p>
        </div>

        <ChevronDown
          className={cn(
            'h-4 w-4 text-neutral-400 transition-transform hidden sm:block',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div
          className={cn(
            'absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-neutral-200',
            'animate-fade-in origin-top-right z-50'
          )}
          role="menu"
        >
          {/* User info */}
          <div className="px-4 py-3 border-b border-neutral-100">
            <p className="text-sm font-medium text-neutral-900 truncate">
              {user?.fullName}
            </p>
            <p className="text-xs text-neutral-500 truncate">{user?.email}</p>
          </div>

          {/* Menu items */}
          <div className="py-1">
            <Link
              to={ROUTES.SETTINGS}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
              role="menuitem"
            >
              <Settings className="h-4 w-4 text-neutral-400" />
              Account Settings
            </Link>
          </div>

          {/* Logout */}
          <div className="border-t border-neutral-100 py-1">
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-2 text-sm text-error-600 hover:bg-error-50 transition-colors"
              role="menuitem"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
