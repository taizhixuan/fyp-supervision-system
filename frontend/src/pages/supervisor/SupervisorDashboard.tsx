import { Link } from 'react-router-dom'
import {
  Users,
  ClipboardList,
  Calendar,
  FileText,
  FolderOpen,
  Megaphone,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  ArrowRight,
  Bell,
  LayoutDashboard,
  Sparkles,
  ChevronRight,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { useSupervisorDashboard, useSupervisorProfile } from '@/lib/hooks/useSupervisor'
import { ROUTES } from '@/lib/constants/routes'
import { cn } from '@/lib/utils/cn'
import { firstNameOf } from '@/lib/utils/name'

export function SupervisorDashboard() {
  const { data: stats, isLoading: statsLoading } = useSupervisorDashboard()
  const { data: profile, isLoading: profileLoading } = useSupervisorProfile()

  if (statsLoading || profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    )
  }

  const quickStats = [
    {
      label: 'Supervisees',
      value: stats?.totalSupervisees ?? 0,
      icon: Users,
      color: 'text-sky-600',
      bgColor: 'bg-sky-100',
      borderColor: 'border-l-sky-500',
      href: ROUTES.SUPERVISOR.SUPERVISEES,
    },
    {
      label: 'Upcoming Meetings',
      value: stats?.upcomingMeetings ?? 0,
      icon: Calendar,
      color: 'text-violet-600',
      bgColor: 'bg-violet-100',
      borderColor: 'border-l-violet-500',
      href: ROUTES.SUPERVISOR.MEETINGS,
    },
    {
      label: 'Logs to Review',
      value: stats?.pendingLogReviews ?? 0,
      icon: FileText,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100',
      borderColor: 'border-l-emerald-500',
      href: ROUTES.SUPERVISOR.LOGS,
      urgent: (stats?.pendingLogReviews ?? 0) > 3,
    },
    {
      label: 'Proposals to Review',
      value: stats?.proposalsToReview ?? 0,
      icon: FolderOpen,
      color: 'text-rose-600',
      bgColor: 'bg-rose-100',
      borderColor: 'border-l-rose-500',
      href: ROUTES.SUPERVISOR.PROPOSALS,
    },
    {
      label: 'Documents to Review',
      value: stats?.documentsToReview ?? 0,
      icon: FolderOpen,
      color: 'text-stone-600',
      bgColor: 'bg-stone-100',
      borderColor: 'border-l-stone-500',
      href: ROUTES.SUPERVISOR.DOCUMENTS,
    },
  ]

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low':
        return 'bg-emerald-500'
      case 'medium':
        return 'bg-amber-500'
      case 'high':
        return 'bg-orange-500'
      case 'critical':
        return 'bg-rose-500'
      default:
        return 'bg-stone-500'
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'REQUEST':
        return ClipboardList
      case 'MEETING':
        return Calendar
      case 'LOG':
        return FileText
      case 'DOCUMENT':
        return FolderOpen
      case 'PROPOSAL':
        return FileText
      case 'ANNOUNCEMENT':
        return Megaphone
      default:
        return Bell
    }
  }

  return (
    <div className="space-y-3 lg:space-y-4">
      {/* Compact Welcome Header — stats inline */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-stone-800 via-stone-800 to-stone-900 p-3 sm:p-4 text-white shadow-md">
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

        <div className="relative flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex-shrink-0 w-9 h-9 bg-amber-500/20 rounded-lg flex items-center justify-center ring-1 ring-amber-500/30">
              <LayoutDashboard className="h-5 w-5 text-amber-400" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-white leading-tight">
                Welcome back, {firstNameOf(profile?.fullName) ?? 'Supervisor'}
              </h1>
              <p className="text-stone-300 text-xs">
                <span className="text-amber-400 font-semibold">{stats?.pendingRequests ?? 0}</span> pending · <span className="text-amber-400 font-semibold">{stats?.pendingLogReviews ?? 0}</span> logs to review
              </p>
            </div>
          </div>
          <div className="bg-stone-700/50 backdrop-blur-sm rounded-md px-2.5 py-1 ring-1 ring-stone-600/50 flex-shrink-0">
            <p className="text-[10px] text-stone-400 uppercase tracking-wider">Slots</p>
            <p className="text-sm font-bold text-white leading-none">
              <span className="text-amber-400">{profile?.availableSlots ?? 0}</span>
              <span className="text-stone-500 mx-0.5">/</span>
              <span>{profile?.maxSupervisionQuota ?? 0}</span>
            </p>
          </div>
        </div>

        {/* Inline stat chips */}
        <div className="relative mt-3 grid grid-cols-3 sm:grid-cols-5 gap-1.5">
          {quickStats.map((stat) => (
            <Link key={stat.label} to={stat.href}>
              <div className={cn(
                'flex items-center gap-2 bg-stone-700/40 hover:bg-stone-700/60 ring-1 ring-stone-600/40 rounded-md px-2 py-1.5 transition-colors',
                stat.urgent && 'bg-amber-500/30 ring-amber-300/40'
              )}>
                <div className={cn('p-1 rounded-md flex-shrink-0', stat.bgColor)}>
                  <stat.icon className={cn('h-3.5 w-3.5', stat.color)} />
                </div>
                <div className="min-w-0">
                  <p className="text-base font-bold leading-none">{stat.value}</p>
                  <p className="text-[10px] text-stone-300 truncate uppercase tracking-wide">{stat.label}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Two-column layout: Supervisee status + Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Supervisee Status */}
        <Card padding="sm" className="lg:col-span-1">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-4 w-4 text-sky-600" />
            <h2 className="text-sm font-bold text-stone-800 uppercase tracking-wide">Supervisee Status</h2>
          </div>
          <div className="space-y-1">
            {[
              { label: 'In Progress', value: stats?.superviseesByStatus.inProgress ?? 0, Icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { label: 'Not Started', value: stats?.superviseesByStatus.notStarted ?? 0, Icon: Clock, color: 'text-stone-600', bg: 'bg-stone-50' },
              { label: 'Completed', value: stats?.superviseesByStatus.completed ?? 0, Icon: CheckCircle, color: 'text-sky-600', bg: 'bg-sky-50' },
              { label: 'On Hold', value: stats?.superviseesByStatus.onHold ?? 0, Icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' },
            ].map(({ label, value, Icon, color, bg }) => (
              <div key={label} className={cn('flex items-center justify-between px-2 py-1.5 rounded-md', bg)}>
                <div className="flex items-center gap-1.5">
                  <Icon className={cn('h-3.5 w-3.5', color)} />
                  <span className="text-xs font-medium text-stone-700">{label}</span>
                </div>
                <span className={cn('text-sm font-bold', color)}>{value}</span>
              </div>
            ))}
          </div>

          <div className="mt-2 pt-2 border-t border-stone-200">
            <h3 className="text-[10px] font-semibold text-stone-500 mb-1 uppercase tracking-wide">Risk Distribution</h3>
            <div className="flex items-center gap-0.5 h-3 rounded-full overflow-hidden bg-stone-100">
              {Object.entries(stats?.superviseesByRisk ?? {}).map(([risk, count]) => (
                count > 0 && (
                  <div
                    key={risk}
                    className={cn('h-full', getRiskColor(risk))}
                    style={{ width: `${(count / (stats?.totalSupervisees ?? 1)) * 100}%` }}
                    title={`${risk}: ${count}`}
                  />
                )
              ))}
            </div>
            <div className="flex items-center justify-between mt-1.5 text-[10px]">
              <span className="inline-flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /><span className="font-medium text-emerald-700">L {stats?.superviseesByRisk.low ?? 0}</span></span>
              <span className="inline-flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-amber-500" /><span className="font-medium text-amber-700">M {stats?.superviseesByRisk.medium ?? 0}</span></span>
              <span className="inline-flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-orange-500" /><span className="font-medium text-orange-700">H {stats?.superviseesByRisk.high ?? 0}</span></span>
              <span className="inline-flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-rose-500" /><span className="font-medium text-rose-700">C {stats?.superviseesByRisk.critical ?? 0}</span></span>
            </div>
          </div>
        </Card>

        {/* Recent Activity */}
        <Card padding="sm" className="lg:col-span-2">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-amber-600" />
              <h2 className="text-sm font-bold text-stone-800 uppercase tracking-wide">Recent Activity</h2>
            </div>
            <Link to={ROUTES.SUPERVISOR.NOTIFICATIONS}>
              <Button variant="ghost" size="sm" className="text-stone-600 hover:text-amber-600 hover:bg-amber-50 whitespace-nowrap">
                View All <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </Link>
          </div>
          <div className="divide-y divide-stone-100">
            {stats?.recentActivity.slice(0, 5).map((activity) => {
              const Icon = getActivityIcon(activity.type)
              return (
                <div key={activity.activityId} className="py-1.5 flex items-start gap-2 hover:bg-stone-50/50 transition-colors group">
                  <div className={cn(
                    'p-1.5 rounded-md flex-shrink-0',
                    activity.actionRequired ? 'bg-amber-100' : 'bg-stone-100'
                  )}>
                    <Icon className={cn(
                      'h-3.5 w-3.5',
                      activity.actionRequired ? 'text-amber-600' : 'text-stone-500'
                    )} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-stone-800 leading-tight truncate">{activity.title}</p>
                        <p className="text-[11px] text-stone-600 line-clamp-1 leading-snug">{activity.description}</p>
                      </div>
                      {activity.actionRequired && (
                        <Sparkles className="h-3 w-3 text-amber-600 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-[10px] text-stone-400 inline-flex items-center gap-0.5 mt-0.5">
                      <Clock className="h-2.5 w-2.5" />
                      {new Date(activity.timestamp).toLocaleDateString('en-MY', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-stone-300 group-hover:text-amber-500 transition-colors flex-shrink-0 mt-1" />
                </div>
              )
            })}
            {(!stats?.recentActivity || stats.recentActivity.length === 0) && (
              <div className="py-6 text-center">
                <Bell className="h-8 w-8 text-stone-300 mx-auto mb-1" />
                <p className="text-xs text-stone-500">No recent activity</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Quick Actions — compact horizontal pills */}
      <Card padding="sm">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-4 w-4 text-violet-600" />
          <h2 className="text-sm font-bold text-stone-800 uppercase tracking-wide">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {[
            { to: ROUTES.SUPERVISOR.TOPICS, Icon: ClipboardList, label: 'My Topics', color: 'amber' },
            { to: ROUTES.SUPERVISOR.LOGS, Icon: FileText, label: 'Review Logs', color: 'emerald' },
            { to: ROUTES.SUPERVISOR.MEETING_NEW, Icon: Calendar, label: 'Schedule', color: 'violet' },
            { to: ROUTES.SUPERVISOR.ANNOUNCEMENT_NEW, Icon: Megaphone, label: 'Announce', color: 'sky' },
          ].map(({ to, Icon, label, color }) => (
            <Link key={to} to={to} className="group">
              <div className={cn(
                'flex items-center gap-2 px-2.5 py-2 rounded-md border border-stone-200 transition-all',
                `hover:border-${color}-300 hover:bg-${color}-50/50`
              )}>
                <div className={cn('p-1.5 rounded-md', `bg-${color}-100`)}>
                  <Icon className={cn('h-4 w-4', `text-${color}-600`)} />
                </div>
                <span className="text-xs font-semibold text-stone-700">{label}</span>
              </div>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  )
}
