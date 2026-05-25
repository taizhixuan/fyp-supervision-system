import { NavLink } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
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
  Bot,
  Send,
  Inbox,
  Lock,
  ShieldCheck,
  Library,
  Trash2,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { ROUTES } from '@/lib/constants/routes'
import { assetUrl } from '@/lib/utils/assetUrl'
import { useStudentRegistrationGate } from '@/lib/hooks/useStudentRegistrationGate'
import { useAuth } from '@/lib/auth/useAuth'
import { apiClient } from '@/lib/api/client'
import type { UserRole } from '@/types'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
  badgeKey?: BadgeKey
}

interface NavGroup {
  label: string
  items: NavItem[]
}

type NavSchema = { kind: 'flat'; items: NavItem[] } | { kind: 'grouped'; groups: NavGroup[]; topItems: NavItem[] }

type BadgeKey =
  | 'notifications'
  | 'adminPendingRegs'
  | 'supervisorPendingReqs'
  | 'supervisorProposalsPending'
  | 'committeeProposalsPending'
  | 'studentRequestsPending'

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

// Student groups mirror the lock semantics: discovery routes lock once paired, and
// the FYP-work routes lock until paired. Putting them under explicit headers tells the
// student why some items grey out together.
const studentTopItems: NavItem[] = [
  { label: 'Dashboard', href: ROUTES.STUDENT.DASHBOARD, icon: <LayoutDashboard className="h-5 w-5" /> },
  { label: 'My Profile', href: ROUTES.STUDENT.PROFILE, icon: <User className="h-5 w-5" /> },
  { label: 'Notifications', href: ROUTES.STUDENT.NOTIFICATIONS, icon: <Bell className="h-5 w-5" />, badgeKey: 'notifications' },
  { label: 'FYP Assistant', href: ROUTES.STUDENT.CHATBOT, icon: <Bot className="h-5 w-5" /> },
]

const studentNavGroups: NavGroup[] = [
  {
    label: 'Find Supervisor',
    items: [
      { label: 'Find Supervisor', href: ROUTES.STUDENT.SUPERVISORS, icon: <Users className="h-5 w-5" /> },
      { label: 'AI Recommendations', href: ROUTES.STUDENT.RECOMMENDATIONS, icon: <Sparkles className="h-5 w-5" /> },
      { label: 'My Requests', href: ROUTES.STUDENT.MY_REQUESTS, icon: <Send className="h-5 w-5" />, badgeKey: 'studentRequestsPending' },
    ],
  },
  {
    label: 'My FYP',
    items: [
      { label: 'Proposal', href: ROUTES.STUDENT.PROPOSAL, icon: <FileText className="h-5 w-5" /> },
      { label: 'Meetings', href: ROUTES.STUDENT.MEETINGS, icon: <Calendar className="h-5 w-5" /> },
      { label: 'Meeting Logs', href: ROUTES.STUDENT.MEETING_LOGS, icon: <ClipboardList className="h-5 w-5" /> },
      { label: 'Documents', href: ROUTES.STUDENT.DOCUMENTS, icon: <FolderOpen className="h-5 w-5" /> },
    ],
  },
  {
    label: 'Information',
    items: [
      { label: 'Announcements', href: ROUTES.STUDENT.ANNOUNCEMENTS, icon: <Megaphone className="h-5 w-5" /> },
      { label: 'Resources', href: ROUTES.STUDENT.RESOURCES, icon: <Library className="h-5 w-5" /> },
      { label: 'Deadlines', href: ROUTES.STUDENT.DEADLINES, icon: <Clock className="h-5 w-5" /> },
    ],
  },
]

// Supervisor groups split inbound work (requests/proposals to review) from the
// people-and-meetings work, so the daily worklist sits visually together at the top.
const supervisorTopItems: NavItem[] = [
  { label: 'Dashboard', href: ROUTES.SUPERVISOR.DASHBOARD, icon: <LayoutDashboard className="h-5 w-5" /> },
  { label: 'My Profile', href: ROUTES.SUPERVISOR.PROFILE, icon: <User className="h-5 w-5" /> },
  { label: 'Notifications', href: ROUTES.SUPERVISOR.NOTIFICATIONS, icon: <Bell className="h-5 w-5" />, badgeKey: 'notifications' },
]

const supervisorNavGroups: NavGroup[] = [
  {
    label: 'Inbox',
    items: [
      { label: 'Supervision Requests', href: ROUTES.SUPERVISOR.REQUESTS, icon: <Inbox className="h-5 w-5" />, badgeKey: 'supervisorPendingReqs' },
      { label: 'Proposals', href: ROUTES.SUPERVISOR.PROPOSALS, icon: <FileText className="h-5 w-5" />, badgeKey: 'supervisorProposalsPending' },
    ],
  },
  {
    label: 'My Students',
    items: [
      { label: 'Supervisees', href: ROUTES.SUPERVISOR.SUPERVISEES, icon: <Users className="h-5 w-5" /> },
      { label: 'Meetings', href: ROUTES.SUPERVISOR.MEETINGS, icon: <Calendar className="h-5 w-5" /> },
      { label: 'My Availability', href: ROUTES.SUPERVISOR.AVAILABILITY, icon: <Clock className="h-5 w-5" /> },
      { label: 'Meeting Logs', href: ROUTES.SUPERVISOR.MEETING_LOGS, icon: <ClipboardList className="h-5 w-5" /> },
      { label: 'Documents', href: ROUTES.SUPERVISOR.DOCUMENTS, icon: <FolderOpen className="h-5 w-5" /> },
    ],
  },
  {
    label: 'Outbound',
    items: [
      { label: 'Announcements', href: ROUTES.SUPERVISOR.ANNOUNCEMENTS, icon: <Megaphone className="h-5 w-5" /> },
    ],
  },
]

// Committee has only 5 work items so the grouping is light: "Review" (queue work)
// vs "Insights" (read-only overview).
const committeeTopItems: NavItem[] = [
  { label: 'Dashboard', href: ROUTES.COMMITTEE.DASHBOARD, icon: <LayoutDashboard className="h-5 w-5" /> },
  { label: 'My Profile', href: ROUTES.COMMITTEE.PROFILE, icon: <User className="h-5 w-5" /> },
  { label: 'Notifications', href: ROUTES.COMMITTEE.NOTIFICATIONS, icon: <Bell className="h-5 w-5" />, badgeKey: 'notifications' },
]

const committeeNavGroups: NavGroup[] = [
  {
    label: 'Review',
    items: [
      { label: 'Proposals', href: ROUTES.COMMITTEE.PROPOSALS, icon: <FileText className="h-5 w-5" />, badgeKey: 'committeeProposalsPending' },
      { label: 'Documents', href: ROUTES.COMMITTEE.DOCUMENTS, icon: <FolderOpen className="h-5 w-5" /> },
      { label: 'Announcements', href: ROUTES.COMMITTEE.ANNOUNCEMENTS, icon: <Megaphone className="h-5 w-5" /> },
    ],
  },
  {
    label: 'Insights',
    items: [
      { label: 'Projects', href: ROUTES.COMMITTEE.PROJECTS, icon: <Users className="h-5 w-5" /> },
      { label: 'Reports', href: ROUTES.COMMITTEE.REPORTS, icon: <BarChart3 className="h-5 w-5" /> },
    ],
  },
]

// Admin nav is grouped — 15+ flat items is hard to scan in a real-life faculty admin
// console. The split mirrors the lifecycle: get users in, run the academic cycle, then
// operate the platform.
const adminTopItems: NavItem[] = [
  { label: 'Dashboard', href: ROUTES.ADMIN.DASHBOARD, icon: <LayoutDashboard className="h-5 w-5" /> },
  { label: 'My Profile', href: ROUTES.ADMIN.PROFILE, icon: <User className="h-5 w-5" /> },
  { label: 'Notifications', href: ROUTES.ADMIN.NOTIFICATIONS, icon: <Bell className="h-5 w-5" />, badgeKey: 'notifications' },
]

const adminNavGroups: NavGroup[] = [
  {
    label: 'Onboarding',
    items: [
      { label: 'Pending Registrations', href: ROUTES.ADMIN.PENDING_REGISTRATIONS, icon: <UserPlus className="h-5 w-5" />, badgeKey: 'adminPendingRegs' },
      { label: 'Approved Roster', href: ROUTES.ADMIN.APPROVED_ROSTER, icon: <ShieldCheck className="h-5 w-5" /> },
      { label: 'Users', href: ROUTES.ADMIN.USERS, icon: <UserCog className="h-5 w-5" /> },
    ],
  },
  {
    label: 'Academic',
    items: [
      { label: 'FYP1 Pass Tracking', href: ROUTES.ADMIN.FYP1_PASS, icon: <Award className="h-5 w-5" /> },
      { label: 'FYP Cycles', href: ROUTES.ADMIN.CYCLES, icon: <Calendar className="h-5 w-5" /> },
      { label: 'Deadlines', href: ROUTES.ADMIN.DEADLINES, icon: <Clock className="h-5 w-5" /> },
      { label: 'Parameters', href: ROUTES.ADMIN.PARAMETERS, icon: <Settings className="h-5 w-5" /> },
    ],
  },
  {
    label: 'Operations',
    items: [
      { label: 'Integrations', href: ROUTES.ADMIN.INTEGRATIONS, icon: <Link2 className="h-5 w-5" /> },
      { label: 'Export', href: ROUTES.ADMIN.EXPORT_CONFIG, icon: <Download className="h-5 w-5" /> },
      { label: 'Maintenance', href: ROUTES.ADMIN.MAINTENANCE, icon: <Wrench className="h-5 w-5" /> },
      { label: 'Audit Logs', href: ROUTES.ADMIN.AUDIT_LOGS, icon: <Shield className="h-5 w-5" /> },
      { label: 'Deletion Requests', href: ROUTES.ADMIN.DELETION_REQUESTS, icon: <Trash2 className="h-5 w-5" /> },
    ],
  },
]

const getNavSchemaForRole = (role: UserRole): NavSchema => {
  switch (role) {
    case 'STUDENT':
      return { kind: 'grouped', topItems: studentTopItems, groups: studentNavGroups }
    case 'SUPERVISOR':
      return { kind: 'grouped', topItems: supervisorTopItems, groups: supervisorNavGroups }
    case 'FYP_COMMITTEE':
      return { kind: 'grouped', topItems: committeeTopItems, groups: committeeNavGroups }
    case 'SYSTEM_ADMIN':
      return { kind: 'grouped', topItems: adminTopItems, groups: adminNavGroups }
    default:
      return { kind: 'flat', items: [] }
  }
}

// Sidebar count badges. Each query is gated to the role that owns the endpoint so it
// never fires a 403 for the wrong role. Counts refresh on a slow interval so they don't
// fall stale, but never aggressively enough to thrash.
function useSidebarBadges(role: UserRole): Record<BadgeKey, number> {
  const notifications = useQuery({
    queryKey: ['sidebar-badge', 'notifications'],
    queryFn: async () => {
      const { data } = await apiClient.get<{ count: number }>('/notifications/unread-count')
      return data?.count ?? 0
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  })

  const adminPending = useQuery({
    queryKey: ['sidebar-badge', 'admin-pending-registrations'],
    queryFn: async () => {
      const { data } = await apiClient.get<{ total: number }>('/admin/users/pending')
      return data?.total ?? 0
    },
    enabled: role === 'SYSTEM_ADMIN',
    staleTime: 30_000,
    refetchInterval: 60_000,
  })

  const supervisorPending = useQuery({
    queryKey: ['sidebar-badge', 'supervisor-pending-requests'],
    queryFn: async () => {
      const { data } = await apiClient.get<{ total: number }>('/supervisor/requests', {
        params: { status: 'PENDING' },
      })
      return data?.total ?? 0
    },
    enabled: role === 'SUPERVISOR',
    staleTime: 30_000,
    refetchInterval: 60_000,
  })

  // Supervisor proposal queue — pending review = anything not yet APPROVED / REJECTED.
  // The list endpoint doesn't accept a status filter, so we count client-side.
  const supervisorProposals = useQuery({
    queryKey: ['sidebar-badge', 'supervisor-pending-proposals'],
    queryFn: async () => {
      const { data } = await apiClient.get<{ proposals: { status: string }[] }>('/supervisor/proposals')
      const pendingSet = new Set(['SUBMITTED', 'UNDER_REVIEW', 'REVISION_REQUIRED'])
      return (data?.proposals ?? []).filter((p) => pendingSet.has(p.status)).length
    },
    enabled: role === 'SUPERVISOR',
    staleTime: 30_000,
    refetchInterval: 60_000,
  })

  const committeeProposals = useQuery({
    queryKey: ['sidebar-badge', 'committee-pending-proposals'],
    queryFn: async () => {
      const { data } = await apiClient.get<{ total: number }>('/committee/proposals', {
        params: { status: 'PENDING_REVIEW' },
      })
      return data?.total ?? 0
    },
    enabled: role === 'FYP_COMMITTEE',
    staleTime: 30_000,
    refetchInterval: 60_000,
  })

  const studentRequests = useQuery({
    queryKey: ['sidebar-badge', 'student-pending-requests'],
    queryFn: async () => {
      const { data } = await apiClient.get<{ requests: { status: string }[] }>('/student/supervision-requests')
      return (data?.requests ?? []).filter((r) => r.status === 'PENDING').length
    },
    enabled: role === 'STUDENT',
    staleTime: 30_000,
    refetchInterval: 60_000,
  })

  return {
    notifications: notifications.data ?? 0,
    adminPendingRegs: adminPending.data ?? 0,
    supervisorPendingReqs: supervisorPending.data ?? 0,
    supervisorProposalsPending: supervisorProposals.data ?? 0,
    committeeProposalsPending: committeeProposals.data ?? 0,
    studentRequestsPending: studentRequests.data ?? 0,
  }
}

const ROLE_LABEL: Record<UserRole, string> = {
  STUDENT: 'Student',
  SUPERVISOR: 'Supervisor',
  FYP_COMMITTEE: 'FYP Committee',
  SYSTEM_ADMIN: 'System Admin',
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
  const schema = getNavSchemaForRole(userRole)
  const badges = useSidebarBadges(userRole)
  const studentGate = useStudentRegistrationGate()
  const { user } = useAuth()
  const showPreSupervisorLocks = userRole === 'STUDENT' && !studentGate.supervisorAssigned
  // Discovery routes lock either when the student is already registered OR when their
  // enrolled cycle has ended (read-only mode — no point browsing supervisors).
  const showPostRegistrationLocks =
    userRole === 'STUDENT' && (studentGate.isRegistered || studentGate.cycleActive === false)

  const renderItem = (item: NavItem) => {
    const lockedPreSupervisor = showPreSupervisorLocks && STUDENT_GATED_HREFS.has(item.href)
    const lockedPostRegistration = showPostRegistrationLocks && STUDENT_POST_REGISTRATION_LOCKED_HREFS.has(item.href)
    const locked = lockedPreSupervisor || lockedPostRegistration
    const lockReason = lockedPostRegistration ? 'already paired with a supervisor' : 'pair with a supervisor first'
    const badge = item.badgeKey ? badges[item.badgeKey] : 0
    return (
      <li key={item.href}>
        <NavLink
          to={item.href}
          onClick={onClose}
          className={({ isActive }) =>
            cn(
              'group relative flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary-50 text-primary-700'
                : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900',
              locked && 'opacity-50'
            )
          }
          title={isCollapsed ? item.label : locked ? `${item.label} (locked — ${lockReason})` : undefined}
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-primary-600" aria-hidden="true" />
              )}
              <span className="relative flex-shrink-0">
                {item.icon}
                {isCollapsed && badge > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-accent-500 text-white text-[10px] font-semibold flex items-center justify-center">
                    {badge > 99 ? '99+' : badge}
                  </span>
                )}
              </span>
              {!isCollapsed && (
                <span className="flex-1 flex items-center justify-between gap-2">
                  <span className="truncate">{item.label}</span>
                  {locked && <Lock className="h-3.5 w-3.5 text-neutral-400 flex-shrink-0" />}
                  {!locked && badge > 0 && (
                    <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-accent-500 text-white text-xs font-semibold flex items-center justify-center flex-shrink-0">
                      {badge > 99 ? '99+' : badge}
                    </span>
                  )}
                </span>
              )}
            </>
          )}
        </NavLink>
      </li>
    )
  }

  const renderItems = (items: NavItem[]) => <ul className="space-y-1">{items.map(renderItem)}</ul>

  const renderGroup = (group: NavGroup) => (
    <div key={group.label} className="mt-4 first:mt-0">
      {!isCollapsed && (
        <h3 className="px-3 mb-1 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
          {group.label}
        </h3>
      )}
      {isCollapsed && <div className="mx-3 my-2 border-t border-neutral-200" aria-hidden="true" />}
      {renderItems(group.items)}
    </div>
  )

  const commonNavItems: NavItem[] = [
    { label: 'Account Settings', href: ROUTES.SETTINGS, icon: <Settings className="h-5 w-5" /> },
  ]

  const userInitials = user?.fullName
    ? user.fullName
        .split(' ')
        .filter((n) => !['Dr.', 'Prof.', 'Mr.', 'Ms.', 'Mrs.'].includes(n))
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : '?'
  const userAvatar = assetUrl(user?.profileImagePath)

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
          {schema.kind === 'flat' && renderItems(schema.items)}
          {schema.kind === 'grouped' && (
            <div className="space-y-1">
              {renderItems(schema.topItems)}
              {schema.groups.map(renderGroup)}
            </div>
          )}

          {/* Separator */}
          <div className="my-4 border-t border-neutral-200" />

          {/* Common navigation */}
          {renderItems(commonNavItems)}
        </nav>

        {/* User profile chip — pinned at the bottom so the active account is always
            visible without opening the top-bar dropdown. */}
        {user && (
          <NavLink
            to={ROUTES.SETTINGS}
            onClick={onClose}
            className={cn(
              'border-t border-neutral-200 p-3 flex items-center gap-3 hover:bg-neutral-50 transition-colors',
              isCollapsed && 'justify-center'
            )}
            title={isCollapsed ? `${user.fullName} (${ROLE_LABEL[userRole]})` : undefined}
          >
            {userAvatar ? (
              <img
                src={userAvatar}
                alt={user.fullName}
                className="h-9 w-9 rounded-full object-cover flex-shrink-0 ring-1 ring-neutral-200"
              />
            ) : (
              <div className="h-9 w-9 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-semibold flex-shrink-0">
                {userInitials}
              </div>
            )}
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-neutral-900 truncate">{user.fullName}</p>
                <p className="text-xs text-neutral-500 truncate">{ROLE_LABEL[userRole]}</p>
              </div>
            )}
          </NavLink>
        )}
      </aside>
    </>
  )
}
