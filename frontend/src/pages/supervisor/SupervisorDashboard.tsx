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
    <div className="space-y-6">
      {/* Welcome Header - Gradient Style */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-stone-800 via-stone-800 to-stone-900 p-6 text-white shadow-xl">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-stone-600/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-14 h-14 bg-amber-500/20 rounded-xl flex items-center justify-center ring-1 ring-amber-500/30">
              <LayoutDashboard className="h-7 w-7 text-amber-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">
                Welcome back, {firstNameOf(profile?.fullName) ?? 'Supervisor'}
              </h1>
              <p className="text-stone-300 mt-1">
                You have <span className="text-amber-400 font-semibold">{stats?.pendingRequests ?? 0}</span> pending requests and <span className="text-amber-400 font-semibold">{stats?.pendingLogReviews ?? 0}</span> logs awaiting review.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-stone-700/50 backdrop-blur-sm rounded-xl px-4 py-3 ring-1 ring-stone-600/50">
            <div className="text-center">
              <p className="text-xs text-stone-400 uppercase tracking-wider">Slots Available</p>
              <p className="text-xl font-bold text-white mt-0.5">
                <span className="text-amber-400">{profile?.availableSlots ?? 0}</span>
                <span className="text-stone-500 mx-1">/</span>
                <span>{profile?.maxSupervisionQuota ?? 0}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {quickStats.map((stat) => (
          <Link key={stat.label} to={stat.href}>
            <Card className={cn(
              'group p-4 hover:shadow-lg transition-all duration-300 cursor-pointer border-l-4 hover:scale-[1.02]',
              stat.borderColor,
              stat.urgent && 'ring-2 ring-amber-400 bg-amber-50/50'
            )}>
              <div className="flex items-center gap-3">
                <div className={cn('p-2.5 rounded-xl transition-colors', stat.bgColor, 'group-hover:scale-110 transition-transform')}>
                  <stat.icon className={cn('h-5 w-5', stat.color)} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-stone-800">{stat.value}</p>
                  <p className="text-xs text-stone-500 font-medium">{stat.label}</p>
                </div>
              </div>
              {stat.urgent && (
                <div className="mt-2 flex items-center gap-1 text-xs text-amber-600 font-medium">
                  <Sparkles className="h-3 w-3" />
                  <span>Needs attention</span>
                </div>
              )}
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Supervisee Status Distribution */}
        <Card className="lg:col-span-1 overflow-hidden">
          <div className="p-4 border-b border-stone-200 bg-gradient-to-r from-stone-50 to-stone-100/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-sky-100 rounded-lg">
                <Users className="h-5 w-5 text-sky-600" />
              </div>
              <h2 className="font-semibold text-stone-800">Supervisee Status</h2>
            </div>
          </div>
          <div className="p-5 space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/50 hover:bg-emerald-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-emerald-100">
                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                  </div>
                  <span className="text-sm font-medium text-stone-700">In Progress</span>
                </div>
                <span className="text-lg font-bold text-emerald-600">{stats?.superviseesByStatus.inProgress ?? 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50/50 hover:bg-stone-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-stone-200">
                    <Clock className="h-4 w-4 text-stone-500" />
                  </div>
                  <span className="text-sm font-medium text-stone-700">Not Started</span>
                </div>
                <span className="text-lg font-bold text-stone-600">{stats?.superviseesByStatus.notStarted ?? 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-sky-50/50 hover:bg-sky-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-sky-100">
                    <CheckCircle className="h-4 w-4 text-sky-600" />
                  </div>
                  <span className="text-sm font-medium text-stone-700">Completed</span>
                </div>
                <span className="text-lg font-bold text-sky-600">{stats?.superviseesByStatus.completed ?? 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50/50 hover:bg-amber-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-amber-100">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                  </div>
                  <span className="text-sm font-medium text-stone-700">On Hold</span>
                </div>
                <span className="text-lg font-bold text-amber-600">{stats?.superviseesByStatus.onHold ?? 0}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-stone-200">
              <h3 className="text-sm font-semibold text-stone-700 mb-3">Risk Distribution</h3>
              <div className="flex items-center gap-0.5 h-5 rounded-full overflow-hidden bg-stone-100 shadow-inner">
                {Object.entries(stats?.superviseesByRisk ?? {}).map(([risk, count]) => (
                  count > 0 && (
                    <div
                      key={risk}
                      className={cn('h-full transition-all', getRiskColor(risk))}
                      style={{ width: `${(count / (stats?.totalSupervisees ?? 1)) * 100}%` }}
                      title={`${risk}: ${count}`}
                    />
                  )
                ))}
              </div>
              <div className="flex items-center justify-between mt-3 text-xs">
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-50">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="font-medium text-emerald-700">{stats?.superviseesByRisk.low ?? 0}</span>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-amber-50">
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="font-medium text-amber-700">{stats?.superviseesByRisk.medium ?? 0}</span>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-orange-50">
                  <div className="w-2 h-2 rounded-full bg-orange-500" />
                  <span className="font-medium text-orange-700">{stats?.superviseesByRisk.high ?? 0}</span>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-rose-50">
                  <div className="w-2 h-2 rounded-full bg-rose-500" />
                  <span className="font-medium text-rose-700">{stats?.superviseesByRisk.critical ?? 0}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Recent Activity */}
        <Card className="lg:col-span-2 overflow-hidden">
          <div className="p-4 border-b border-stone-200 bg-gradient-to-r from-stone-50 to-stone-100/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Bell className="h-5 w-5 text-amber-600" />
              </div>
              <h2 className="font-semibold text-stone-800">Recent Activity</h2>
            </div>
            <Link to={ROUTES.SUPERVISOR.NOTIFICATIONS}>
              <Button variant="ghost" size="sm" className="text-stone-600 hover:text-amber-600 hover:bg-amber-50">
                View All
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
          <div className="divide-y divide-stone-100">
            {stats?.recentActivity.map((activity) => {
              const Icon = getActivityIcon(activity.type)
              return (
                <div key={activity.activityId} className="p-4 flex items-start gap-4 hover:bg-stone-50/50 transition-colors group">
                  <div className={cn(
                    'p-2.5 rounded-xl transition-transform group-hover:scale-110',
                    activity.actionRequired ? 'bg-amber-100' : 'bg-stone-100'
                  )}>
                    <Icon className={cn(
                      'h-5 w-5',
                      activity.actionRequired ? 'text-amber-600' : 'text-stone-500'
                    )} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-stone-800">{activity.title}</p>
                        <p className="text-sm text-stone-600 mt-0.5">{activity.description}</p>
                      </div>
                      {activity.actionRequired && (
                        <span className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-amber-100 text-amber-700 rounded-full whitespace-nowrap">
                          <Sparkles className="h-3 w-3" />
                          Action Required
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-stone-400 mt-2 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(activity.timestamp).toLocaleDateString('en-MY', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-stone-300 group-hover:text-amber-500 transition-colors" />
                </div>
              )
            })}
            {(!stats?.recentActivity || stats.recentActivity.length === 0) && (
              <div className="p-12 text-center">
                <div className="w-12 h-12 mx-auto bg-stone-100 rounded-full flex items-center justify-center mb-3">
                  <Bell className="h-6 w-6 text-stone-400" />
                </div>
                <p className="text-stone-500 font-medium">No recent activity</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="overflow-hidden">
        <div className="p-4 border-b border-stone-200 bg-gradient-to-r from-stone-50 to-stone-100/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-violet-100 rounded-lg">
              <Sparkles className="h-5 w-5 text-violet-600" />
            </div>
            <h2 className="font-semibold text-stone-800">Quick Actions</h2>
          </div>
        </div>
        <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link to={ROUTES.SUPERVISOR.TOPICS} className="group">
            <div className="p-4 rounded-xl border-2 border-stone-200 hover:border-amber-300 hover:bg-amber-50/50 transition-all flex flex-col items-center gap-3 text-center">
              <div className="p-3 bg-amber-100 rounded-xl group-hover:scale-110 transition-transform">
                <ClipboardList className="h-6 w-6 text-amber-600" />
              </div>
              <span className="text-sm font-semibold text-stone-700 group-hover:text-amber-700">My Topics</span>
            </div>
          </Link>
          <Link to={ROUTES.SUPERVISOR.LOGS} className="group">
            <div className="p-4 rounded-xl border-2 border-stone-200 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all flex flex-col items-center gap-3 text-center">
              <div className="p-3 bg-emerald-100 rounded-xl group-hover:scale-110 transition-transform">
                <FileText className="h-6 w-6 text-emerald-600" />
              </div>
              <span className="text-sm font-semibold text-stone-700 group-hover:text-emerald-700">Review Logs</span>
            </div>
          </Link>
          <Link to={ROUTES.SUPERVISOR.MEETING_NEW} className="group">
            <div className="p-4 rounded-xl border-2 border-stone-200 hover:border-violet-300 hover:bg-violet-50/50 transition-all flex flex-col items-center gap-3 text-center">
              <div className="p-3 bg-violet-100 rounded-xl group-hover:scale-110 transition-transform">
                <Calendar className="h-6 w-6 text-violet-600" />
              </div>
              <span className="text-sm font-semibold text-stone-700 group-hover:text-violet-700">Schedule Meeting</span>
            </div>
          </Link>
          <Link to={ROUTES.SUPERVISOR.ANNOUNCEMENT_NEW} className="group">
            <div className="p-4 rounded-xl border-2 border-stone-200 hover:border-sky-300 hover:bg-sky-50/50 transition-all flex flex-col items-center gap-3 text-center">
              <div className="p-3 bg-sky-100 rounded-xl group-hover:scale-110 transition-transform">
                <Megaphone className="h-6 w-6 text-sky-600" />
              </div>
              <span className="text-sm font-semibold text-stone-700 group-hover:text-sky-700">Post Announcement</span>
            </div>
          </Link>
        </div>
      </Card>
    </div>
  )
}
