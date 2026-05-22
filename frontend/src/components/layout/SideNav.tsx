import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  User,
  Users,
  FileText,
  Calendar,
  FolderOpen,
  Settings,
  ChevronLeft,
  Megaphone,
  ClipboardList,
  BarChart3,
  Wrench,
  Link2,
  UserCog,
  UserPlus,
  Award,
  Bell,
  Clock,
  Download,
  Shield,
  Sparkles,
  Send,
  Inbox,
  Lock,
  ShieldCheck,
  Library,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { ROUTES } from '@/lib/constants/routes'
import { useStudentRegistrationGate } from '@/lib/hooks/useStudentRegistrationGate'
import type { UserRole } from '@/types'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
}

// Routes the StudentFeatureGate locks until a supervisor is assigned (UC10/UC11/UC12).
const STUDENT_GATED_HREFS: ReadonlySet<string> = new Set<string>([
  ROUTES.STUDENT.PROPOSAL,
  ROUTES.STUDENT.MEETINGS,
  ROUTES.STUDENT.MEETING_LOGS,
  ROUTES.STUDENT.DOCUMENTS,
])

// Once the student is REGISTERED, the supervisor-discovery flow is no longer relevant —
// these items render with a lock icon and the routes themselves render LockedFeaturePage
// via RegisteredOnlyLockGate.
const STUDENT_POST_REGISTRATION_LOCKED_HREFS: ReadonlySet<string> = new Set<string>([
  ROUTES.STUDENT.SUPERVISORS,
  ROUTES.STUDENT.RECOMMENDATIONS,
  ROUTES.STUDENT.MY_REQUESTS,
])

const studentNavItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: ROUTES.STUDENT.DASHBOARD,
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    label: 'My Profile',
    href: ROUTES.STUDENT.PROFILE,
    icon: <User className="h-5 w-5" />,
  },
  {
    label: 'Find Supervisor',
    href: ROUTES.STUDENT.SUPERVISORS,
    icon: <Users className="h-5 w-5" />,
  },
  {
    label: 'AI Recommendations',
    href: ROUTES.STUDENT.RECOMMENDATIONS,
    icon: <Sparkles className="h-5 w-5" />,
  },
  {
    label: 'My Requests',
    href: ROUTES.STUDENT.MY_REQUESTS,
    icon: <Send className="h-5 w-5" />,
  },
  {
    label: 'Proposal',
    href: ROUTES.STUDENT.PROPOSAL,
    icon: <FileText className="h-5 w-5" />,
  },
  {
    label: 'Meetings',
    href: ROUTES.STUDENT.MEETINGS,
    icon: <Calendar className="h-5 w-5" />,
  },
  {
    label: 'Meeting Logs',
    href: ROUTES.STUDENT.MEETING_LOGS,
    icon: <ClipboardList className="h-5 w-5" />,
  },
  {
    label: 'Documents',
    href: ROUTES.STUDENT.DOCUMENTS,
    icon: <FolderOpen className="h-5 w-5" />,
  },
  {
    label: 'Announcements',
    href: ROUTES.STUDENT.ANNOUNCEMENTS,
    icon: <Megaphone className="h-5 w-5" />,
  },
  {
    label: 'Resources',
    href: ROUTES.STUDENT.RESOURCES,
    icon: <Library className="h-5 w-5" />,
  },
  {
    label: 'Deadlines',
    href: ROUTES.STUDENT.DEADLINES,
    icon: <Clock className="h-5 w-5" />,
  },
]

const supervisorNavItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: ROUTES.SUPERVISOR.DASHBOARD,
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    label: 'My Profile',
    href: ROUTES.SUPERVISOR.PROFILE,
    icon: <User className="h-5 w-5" />,
  },
  {
    label: 'Supervision Requests',
    href: ROUTES.SUPERVISOR.REQUESTS,
    icon: <Inbox className="h-5 w-5" />,
  },
  {
    label: 'Supervisees',
    href: ROUTES.SUPERVISOR.SUPERVISEES,
    icon: <Users className="h-5 w-5" />,
  },
  {
    label: 'Proposals',
    href: ROUTES.SUPERVISOR.PROPOSALS,
    icon: <FileText className="h-5 w-5" />,
  },
  {
    label: 'Meetings',
    href: ROUTES.SUPERVISOR.MEETINGS,
    icon: <Calendar className="h-5 w-5" />,
  },
  {
    label: 'Meeting Logs',
    href: ROUTES.SUPERVISOR.MEETING_LOGS,
    icon: <ClipboardList className="h-5 w-5" />,
  },
  {
    label: 'Documents',
    href: ROUTES.SUPERVISOR.DOCUMENTS,
    icon: <FolderOpen className="h-5 w-5" />,
  },
  {
    label: 'Announcements',
    href: ROUTES.SUPERVISOR.ANNOUNCEMENTS,
    icon: <Megaphone className="h-5 w-5" />,
  },
  {
    label: 'Notifications',
    href: ROUTES.SUPERVISOR.NOTIFICATIONS,
    icon: <Bell className="h-5 w-5" />,
  },
]

const committeeNavItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: ROUTES.COMMITTEE.DASHBOARD,
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    label: 'My Profile',
    href: ROUTES.COMMITTEE.PROFILE,
    icon: <User className="h-5 w-5" />,
  },
  {
    label: 'Announcements',
    href: ROUTES.COMMITTEE.ANNOUNCEMENTS,
    icon: <Megaphone className="h-5 w-5" />,
  },
  {
    label: 'Proposals',
    href: ROUTES.COMMITTEE.PROPOSALS,
    icon: <FileText className="h-5 w-5" />,
  },
  {
    label: 'Documents',
    href: ROUTES.COMMITTEE.DOCUMENTS,
    icon: <FolderOpen className="h-5 w-5" />,
  },
  {
    label: 'Projects',
    href: ROUTES.COMMITTEE.PROJECTS,
    icon: <Users className="h-5 w-5" />,
  },
  {
    label: 'Reports',
    href: ROUTES.COMMITTEE.REPORTS,
    icon: <BarChart3 className="h-5 w-5" />,
  },
  {
    label: 'Notifications',
    href: ROUTES.COMMITTEE.NOTIFICATIONS,
    icon: <Bell className="h-5 w-5" />,
  },
]

const adminNavItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: ROUTES.ADMIN.DASHBOARD,
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    label: 'My Profile',
    href: ROUTES.ADMIN.PROFILE,
    icon: <User className="h-5 w-5" />,
  },
  {
    label: 'Pending Registrations',
    href: ROUTES.ADMIN.PENDING_REGISTRATIONS,
    icon: <UserPlus className="h-5 w-5" />,
  },
  {
    label: 'Approved Roster',
    href: ROUTES.ADMIN.APPROVED_ROSTER,
    icon: <ShieldCheck className="h-5 w-5" />,
  },
  {
    label: 'Users',
    href: ROUTES.ADMIN.USERS,
    icon: <UserCog className="h-5 w-5" />,
  },
  {
    label: 'FYP1 Pass Tracking',
    href: ROUTES.ADMIN.FYP1_PASS,
    icon: <Award className="h-5 w-5" />,
  },
  {
    label: 'Parameters',
    href: ROUTES.ADMIN.PARAMETERS,
    icon: <Settings className="h-5 w-5" />,
  },
  {
    label: 'FYP Cycles',
    href: ROUTES.ADMIN.CYCLES,
    icon: <Calendar className="h-5 w-5" />,
  },
  {
    label: 'Deadlines',
    href: ROUTES.ADMIN.DEADLINES,
    icon: <Clock className="h-5 w-5" />,
  },
  {
    label: 'Integrations',
    href: ROUTES.ADMIN.INTEGRATIONS,
    icon: <Link2 className="h-5 w-5" />,
  },
  {
    label: 'Export',
    href: ROUTES.ADMIN.EXPORT_CONFIG,
    icon: <Download className="h-5 w-5" />,
  },
  {
    label: 'Maintenance',
    href: ROUTES.ADMIN.MAINTENANCE,
    icon: <Wrench className="h-5 w-5" />,
  },
  {
    label: 'Audit Logs',
    href: ROUTES.ADMIN.AUDIT_LOGS,
    icon: <Shield className="h-5 w-5" />,
  },
  {
    label: 'Notifications',
    href: ROUTES.ADMIN.NOTIFICATIONS,
    icon: <Bell className="h-5 w-5" />,
  },
]

const getNavItemsForRole = (role: UserRole): NavItem[] => {
  switch (role) {
    case 'STUDENT':
      return studentNavItems
    case 'SUPERVISOR':
      return supervisorNavItems
    case 'FYP_COMMITTEE':
      return committeeNavItems
    case 'SYSTEM_ADMIN':
      return adminNavItems
    default:
      return []
  }
}

interface SideNavProps {
  userRole: UserRole
  isOpen: boolean
  onClose?: () => void
  isCollapsed?: boolean
  onToggleCollapse?: () => void
}

export function SideNav({
  userRole,
  isOpen,
  onClose,
  isCollapsed = false,
  onToggleCollapse,
}: SideNavProps) {
  const navItems = getNavItemsForRole(userRole)
  const studentGate = useStudentRegistrationGate()
  const showPreSupervisorLocks = userRole === 'STUDENT' && !studentGate.supervisorAssigned
  // Discovery routes lock either when the student is already registered OR when their
  // enrolled cycle has ended (read-only mode — no point browsing supervisors).
  const showPostRegistrationLocks =
    userRole === 'STUDENT' && (studentGate.isRegistered || studentGate.cycleActive === false)

  const commonNavItems: NavItem[] = [
    {
      label: 'Account Settings',
      href: ROUTES.SETTINGS,
      icon: <Settings className="h-5 w-5" />,
    },
  ]

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 h-screen bg-white border-r border-neutral-200 z-50 lg:z-30',
          'transition-all duration-300 ease-in-out',
          'flex flex-col',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          isCollapsed ? 'lg:w-20' : 'w-64'
        )}
      >
        {/* Logo area (for mobile) */}
        <div className="h-16 border-b border-neutral-200 px-4 flex items-center justify-between lg:hidden">
          <span className="font-semibold text-neutral-900">Menu</span>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-md text-neutral-600 hover:bg-neutral-100"
            aria-label="Close menu"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        </div>

        {/* Collapse toggle (desktop only) */}
        {onToggleCollapse && (
          <div className="hidden lg:flex h-12 px-4 items-center justify-end border-b border-neutral-100">
            <button
              type="button"
              onClick={onToggleCollapse}
              className="p-1.5 rounded-md text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors"
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <ChevronLeft
                className={cn(
                  'h-4 w-4 transition-transform duration-200',
                  isCollapsed && 'rotate-180'
                )}
              />
            </button>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const lockedPreSupervisor = showPreSupervisorLocks && STUDENT_GATED_HREFS.has(item.href)
              const lockedPostRegistration = showPostRegistrationLocks && STUDENT_POST_REGISTRATION_LOCKED_HREFS.has(item.href)
              const locked = lockedPreSupervisor || lockedPostRegistration
              const lockReason = lockedPostRegistration
                ? 'already paired with a supervisor'
                : 'pair with a supervisor first'
              return (
                <li key={item.href}>
                  <NavLink
                    to={item.href}
                    onClick={onClose}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-primary-50 text-primary-700'
                          : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900',
                        locked && 'opacity-50'
                      )
                    }
                    title={isCollapsed ? item.label : locked ? `${item.label} (locked — ${lockReason})` : undefined}
                  >
                    <span className="flex-shrink-0">{item.icon}</span>
                    {!isCollapsed && (
                      <span className="flex-1 flex items-center justify-between">
                        <span>{item.label}</span>
                        {locked && <Lock className="h-3.5 w-3.5 text-neutral-400" />}
                      </span>
                    )}
                  </NavLink>
                </li>
              )
            })}
          </ul>

          {/* Separator */}
          <div className="my-4 border-t border-neutral-200" />

          {/* Common navigation */}
          <ul className="space-y-1">
            {commonNavItems.map((item) => (
              <li key={item.href}>
                <NavLink
                  to={item.href}
                  onClick={onClose}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                    )
                  }
                  title={isCollapsed ? item.label : undefined}
                >
                  <span className="flex-shrink-0">{item.icon}</span>
                  {!isCollapsed && <span>{item.label}</span>}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </>
  )
}
