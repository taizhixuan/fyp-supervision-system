import { Link } from 'react-router-dom'
import {
  LayoutDashboard,
  FileText,
  Users,
  UserX,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Calendar,
  Megaphone,
  FolderOpen,
  BarChart3,
  ChevronRight,
  Bell,
  Activity,
  Sparkles,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { useCommitteeDashboard } from '@/lib/hooks/useCommittee'
import { ROUTES } from '@/lib/constants/routes'
import { cn } from '@/lib/utils/cn'

export function CommitteeDashboard() {
  const { data, isLoading } = useCommitteeDashboard()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    )
  }

  // Backend returns the stats fields at the top level alongside `alerts` and
  // `recentActivities`. The mock used a nested `{ stats: {...} }` shape that
  // the real API doesn't follow; reading `data.stats` left every widget at 0.
  const stats = data ?? null
  const alerts = data?.alerts ?? []
  const recentActivities = data?.recentActivities ?? []
  const upcomingDeadlines = data?.upcomingDeadlines ?? []

  const deadlineColors = ['rose', 'amber', 'sky', 'violet', 'emerald'] as const
  const parseDeadline = (d: { dueDate: string; title: string; description?: string }) => {
    const dt = new Date(d.dueDate)
    return {
      date: String(dt.getDate()),
      month: dt.toLocaleString('en-US', { month: 'short' }).toUpperCase(),
      title: d.title,
      desc: d.description ?? '',
    }
  }

  const kpiCards = [
    {
      label: 'Total Proposals',
      value: stats?.totalProposals ?? 0,
      icon: FileText,
      color: 'text-sky-600',
      bgColor: 'bg-sky-100',
      borderColor: 'border-l-sky-500',
      link: ROUTES.COMMITTEE.PROPOSALS,
    },
    {
      label: 'Pending Reviews',
      value: stats?.pendingReviews ?? 0,
      icon: Clock,
      color: 'text-amber-600',
      bgColor: 'bg-amber-100',
      borderColor: 'border-l-amber-500',
      link: ROUTES.COMMITTEE.PROPOSALS,
      highlight: (stats?.pendingReviews ?? 0) > 10,
    },
    {
      label: 'Unpaired Students',
      value: stats?.unpairedStudents ?? 0,
      icon: UserX,
      color: 'text-rose-600',
      bgColor: 'bg-rose-100',
      borderColor: 'border-l-rose-500',
      link: ROUTES.COMMITTEE.UNPAIRED_STUDENTS,
      highlight: (stats?.unpairedStudents ?? 0) > 0,
    },
    {
      label: 'Overloaded Supervisors',
      value: stats?.overloadedSupervisors ?? 0,
      icon: AlertTriangle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      borderColor: 'border-l-orange-500',
      link: ROUTES.COMMITTEE.SUPERVISOR_LOAD,
      highlight: (stats?.overloadedSupervisors ?? 0) > 0,
    },
  ]

  const quickActions = [
    { label: 'Review Proposals', icon: FileText, href: ROUTES.COMMITTEE.PROPOSALS, color: 'text-sky-600', hoverBg: 'hover:bg-sky-50' },
    { label: 'Manage Announcements', icon: Megaphone, href: ROUTES.COMMITTEE.ANNOUNCEMENTS, color: 'text-amber-600', hoverBg: 'hover:bg-amber-50' },
    { label: 'View Projects', icon: FolderOpen, href: ROUTES.COMMITTEE.PROJECTS, color: 'text-violet-600', hoverBg: 'hover:bg-violet-50' },
    { label: 'Generate Reports', icon: BarChart3, href: ROUTES.COMMITTEE.REPORTS, color: 'text-emerald-600', hoverBg: 'hover:bg-emerald-50' },
  ]

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'URGENT':
        return <AlertTriangle className="h-5 w-5 text-rose-600" />
      case 'WARNING':
        return <AlertTriangle className="h-5 w-5 text-amber-600" />
      default:
        return <Bell className="h-5 w-5 text-sky-600" />
    }
  }

  const getAlertBg = (type: string) => {
    switch (type) {
      case 'URGENT':
        return 'bg-rose-50 border-rose-200'
      case 'WARNING':
        return 'bg-amber-50 border-amber-200'
      default:
        return 'bg-sky-50 border-sky-200'
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'PROPOSAL_SUBMITTED':
        return <FileText className="h-4 w-4 text-sky-600" />
      case 'PROPOSAL_REVIEWED':
        return <CheckCircle className="h-4 w-4 text-emerald-600" />
      case 'STUDENT_PAIRED':
        return <Users className="h-4 w-4 text-violet-600" />
      case 'ANNOUNCEMENT_CREATED':
        return <Megaphone className="h-4 w-4 text-amber-600" />
      case 'DOCUMENT_UPLOADED':
        return <FolderOpen className="h-4 w-4 text-orange-600" />
      default:
        return <Activity className="h-4 w-4 text-stone-600" />
    }
  }

  return (
    <div className="space-y-3 lg:space-y-4">
      {/* Compact Header with KPIs inline */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-stone-800 via-stone-800 to-stone-900 p-3 sm:p-4 text-white shadow-md">
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

        <div className="relative flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex-shrink-0 w-9 h-9 bg-amber-500/20 rounded-lg flex items-center justify-center ring-1 ring-amber-500/30">
              <LayoutDashboard className="h-5 w-5 text-amber-400" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-white leading-tight">FYP Committee Dashboard</h1>
              <p className="text-stone-300 text-xs">Overview of FYP programme status and key metrics</p>
            </div>
          </div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-stone-700/50 backdrop-blur-sm rounded-md ring-1 ring-stone-600/30 flex-shrink-0">
            <Calendar className="h-3.5 w-3.5 text-amber-400" />
            <span className="text-xs text-stone-200 whitespace-nowrap">
              {new Date().toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>
        </div>

        {/* KPI chips inline */}
        <div className="relative mt-3 grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {kpiCards.map((kpi) => (
            <Link key={kpi.label} to={kpi.link}>
              <div className={cn(
                'flex items-center gap-2 rounded-md px-2 py-1.5 ring-1 transition-colors',
                kpi.highlight ? 'bg-amber-500/30 ring-amber-300/40 hover:bg-amber-500/40' : 'bg-stone-700/40 ring-stone-600/40 hover:bg-stone-700/60'
              )}>
                <div className={cn('p-1 rounded flex-shrink-0', kpi.bgColor)}>
                  <kpi.icon className={cn('h-3.5 w-3.5', kpi.color)} />
                </div>
                <div className="min-w-0">
                  <div className="text-base font-bold leading-none">{kpi.value}</div>
                  <p className="text-[10px] text-stone-300 truncate uppercase tracking-wide">{kpi.label}</p>
                </div>
                {kpi.highlight && <Sparkles className="h-3 w-3 text-amber-300 ml-auto flex-shrink-0" />}
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Alerts — compact inline strips */}
      {alerts && alerts.length > 0 && (
        <div className="space-y-1.5">
          {alerts.filter((a) => !a.isRead).slice(0, 3).map((alert) => (
            <div
              key={alert.alertId}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-md border',
                getAlertBg(alert.type),
              )}
            >
              {getAlertIcon(alert.type)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-stone-800 truncate">{alert.title}</p>
                <p className="text-xs text-stone-600 line-clamp-1">{alert.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Main two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Left — Programme stats + Quick actions + Supervisor overview */}
        <div className="lg:col-span-2 space-y-3">
          {/* Programme stats — compact */}
          <Card padding="sm">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-amber-600" />
              <h3 className="text-sm font-bold text-stone-800 uppercase tracking-wide">Programme Statistics</h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-stone-50 rounded-md p-2">
                <div className="flex items-center gap-1 text-[10px] font-semibold text-stone-500 uppercase tracking-wide mb-1">
                  <Users className="h-3 w-3" /> Students
                </div>
                <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-xs">
                  <span className="text-stone-600">Total</span>
                  <span className="font-bold text-stone-800 text-right">{stats?.totalStudents ?? 0}</span>
                  <span className="text-stone-600">FYP1</span>
                  <span className="font-bold text-sky-600 text-right">{stats?.fyp1Students ?? 0}</span>
                  <span className="text-stone-600">FYP2</span>
                  <span className="font-bold text-violet-600 text-right">{stats?.fyp2Students ?? 0}</span>
                  <span className="text-stone-600">Unpaired</span>
                  <span className="font-bold text-rose-600 text-right">{stats?.unpairedStudents ?? 0}</span>
                </div>
              </div>
              <div className="bg-stone-50 rounded-md p-2">
                <div className="flex items-center gap-1 text-[10px] font-semibold text-stone-500 uppercase tracking-wide mb-1">
                  <FileText className="h-3 w-3" /> Proposals
                </div>
                <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-xs">
                  <span className="text-stone-600">Total</span>
                  <span className="font-bold text-stone-800 text-right">{stats?.totalProposals ?? 0}</span>
                  <span className="text-stone-600">Approved</span>
                  <span className="font-bold text-emerald-600 text-right">{stats?.approvedProposals ?? 0}</span>
                  <span className="text-stone-600">Pending</span>
                  <span className="font-bold text-amber-600 text-right">{stats?.pendingReviews ?? 0}</span>
                  <span className="text-stone-600">Rejected</span>
                  <span className="font-bold text-rose-600 text-right">{stats?.rejectedProposals ?? 0}</span>
                </div>
              </div>
            </div>

            {/* Progress bars */}
            <div className="mt-2 grid grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="text-stone-600 font-medium">Approval Rate</span>
                  <span className="font-bold text-emerald-600">
                    {stats?.totalProposals ? Math.round((stats.approvedProposals / stats.totalProposals) * 100) : 0}%
                  </span>
                </div>
                <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${stats?.totalProposals ? (stats.approvedProposals / stats.totalProposals) * 100 : 0}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="text-stone-600 font-medium">Pairing Completion</span>
                  <span className="font-bold text-sky-600">
                    {stats?.totalStudents ? Math.round(((stats.totalStudents - stats.unpairedStudents) / stats.totalStudents) * 100) : 0}%
                  </span>
                </div>
                <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-sky-500 rounded-full"
                    style={{ width: `${stats?.totalStudents ? ((stats.totalStudents - stats.unpairedStudents) / stats.totalStudents) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Quick Actions — compact inline */}
          <Card padding="sm">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-violet-600" />
              <h3 className="text-sm font-bold text-stone-800 uppercase tracking-wide">Quick Actions</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {quickActions.map((action) => (
                <Link key={action.label} to={action.href}>
                  <div className={cn(
                    'group flex items-center gap-2 px-2.5 py-2 rounded-md border border-stone-200 transition-all',
                    action.hoverBg, 'hover:border-stone-300'
                  )}>
                    <action.icon className={cn('h-4 w-4', action.color)} />
                    <span className="text-xs font-semibold text-stone-700 truncate">{action.label}</span>
                  </div>
                </Link>
              ))}
            </div>
          </Card>

          {/* Supervisor Overview — compact */}
          <Card padding="sm">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-amber-600" />
                <h3 className="text-sm font-bold text-stone-800 uppercase tracking-wide">Supervisor Overview</h3>
              </div>
              <Link to={ROUTES.COMMITTEE.SUPERVISOR_LOAD}>
                <Button variant="ghost" size="sm" className="text-stone-600 hover:text-amber-700 whitespace-nowrap">
                  View All <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              <div className="text-center p-2 bg-stone-100 rounded-md">
                <p className="text-lg font-bold text-stone-800 leading-none">{stats?.totalSupervisors ?? 0}</p>
                <p className="text-[10px] text-stone-600 mt-0.5 uppercase tracking-wide">Total</p>
              </div>
              <div className="text-center p-2 bg-emerald-100 rounded-md">
                <p className="text-lg font-bold text-emerald-700 leading-none">
                  {(stats?.totalSupervisors ?? 0) - (stats?.overloadedSupervisors ?? 0)}
                </p>
                <p className="text-[10px] text-emerald-700 mt-0.5 uppercase tracking-wide">Capacity</p>
              </div>
              <div className="text-center p-2 bg-rose-100 rounded-md">
                <p className="text-lg font-bold text-rose-700 leading-none">{stats?.overloadedSupervisors ?? 0}</p>
                <p className="text-[10px] text-rose-700 mt-0.5 uppercase tracking-wide">Overloaded</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Right — Activity feed + deadlines */}
        <div className="space-y-3">
          <Card padding="sm">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-4 w-4 text-amber-600" />
              <h3 className="text-sm font-bold text-stone-800 uppercase tracking-wide">Recent Activity</h3>
            </div>
            <div className="divide-y divide-stone-100">
              {recentActivities && recentActivities.length > 0 ? (
                recentActivities.slice(0, 5).map((activity) => (
                  <div key={activity.activityId} className="py-1.5 flex items-start gap-2 hover:bg-stone-50/50 transition-colors">
                    <div className="p-1 bg-stone-100 rounded flex-shrink-0">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-stone-800 leading-tight truncate">{activity.title}</p>
                      <p className="text-[11px] text-stone-500 line-clamp-1">{activity.description}</p>
                      <p className="text-[10px] text-stone-400">
                        {new Date(activity.timestamp).toLocaleString('en-MY', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center">
                  <Activity className="h-8 w-8 text-stone-300 mx-auto mb-1" />
                  <p className="text-xs text-stone-500">No recent activity</p>
                </div>
              )}
            </div>
          </Card>

          <Card padding="sm">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-amber-600" />
              <h3 className="text-sm font-bold text-stone-800 uppercase tracking-wide">Upcoming Deadlines</h3>
            </div>
            <div className="space-y-1.5">
              {upcomingDeadlines.length > 0 ? (
                upcomingDeadlines.slice(0, 5).map((raw, idx) => {
                  const d = parseDeadline(raw)
                  const color = deadlineColors[idx % deadlineColors.length]
                  const palette: Record<typeof deadlineColors[number], { wrap: string; chip: string; date: string; month: string }> = {
                    rose: { wrap: 'bg-rose-50 border-rose-100', chip: 'bg-rose-100', date: 'text-rose-700', month: 'text-rose-600' },
                    amber: { wrap: 'bg-amber-50 border-amber-100', chip: 'bg-amber-100', date: 'text-amber-700', month: 'text-amber-600' },
                    sky: { wrap: 'bg-sky-50 border-sky-100', chip: 'bg-sky-100', date: 'text-sky-700', month: 'text-sky-600' },
                    violet: { wrap: 'bg-violet-50 border-violet-100', chip: 'bg-violet-100', date: 'text-violet-700', month: 'text-violet-600' },
                    emerald: { wrap: 'bg-emerald-50 border-emerald-100', chip: 'bg-emerald-100', date: 'text-emerald-700', month: 'text-emerald-600' },
                  }
                  const p = palette[color]
                  return (
                    <div key={raw.deadlineId} className={cn('flex items-center gap-2 p-2 rounded-md border', p.wrap)}>
                      <div className={cn('w-10 rounded-md p-1 text-center flex-shrink-0', p.chip)}>
                        <p className={cn('text-sm font-bold leading-none', p.date)}>{d.date}</p>
                        <p className={cn('text-[9px] font-medium leading-none mt-0.5', p.month)}>{d.month}</p>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-stone-800 leading-tight truncate">{d.title}</p>
                        <p className="text-[10px] text-stone-500 truncate">{d.desc}</p>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="py-6 text-center">
                  <Calendar className="h-8 w-8 text-stone-300 mx-auto mb-1" />
                  <p className="text-xs text-stone-500">No upcoming deadlines</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
