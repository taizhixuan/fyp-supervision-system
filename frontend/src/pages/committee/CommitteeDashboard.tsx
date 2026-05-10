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
    <div className="space-y-6">
      {/* Header - Gradient Style */}
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
              <h1 className="text-2xl font-bold text-white">FYP Committee Dashboard</h1>
              <p className="text-stone-300 mt-1">
                Overview of FYP programme status and key metrics
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-stone-700/50 backdrop-blur-sm rounded-xl ring-1 ring-stone-600/30">
            <Calendar className="h-4 w-4 text-amber-400" />
            <span className="text-sm text-stone-200">
              {new Date().toLocaleDateString('en-MY', {
                weekday: 'long',
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {alerts && alerts.length > 0 && (
        <div className="space-y-3">
          {alerts.filter((a) => !a.isRead).slice(0, 3).map((alert) => (
            <div
              key={alert.alertId}
              className={cn(
                'flex items-start gap-3 p-4 rounded-xl border-l-4 shadow-sm',
                getAlertBg(alert.type),
                alert.type === 'URGENT' && 'border-l-rose-500',
                alert.type === 'WARNING' && 'border-l-amber-500',
                alert.type !== 'URGENT' && alert.type !== 'WARNING' && 'border-l-sky-500'
              )}
            >
              <div className={cn(
                'p-2 rounded-lg',
                alert.type === 'URGENT' && 'bg-rose-100',
                alert.type === 'WARNING' && 'bg-amber-100',
                alert.type !== 'URGENT' && alert.type !== 'WARNING' && 'bg-sky-100'
              )}>
                {getAlertIcon(alert.type)}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-stone-800">{alert.title}</p>
                <p className="text-sm text-stone-600 mt-0.5">{alert.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi) => (
          <Link key={kpi.label} to={kpi.link}>
            <Card
              className={cn(
                'group p-4 hover:shadow-lg transition-all duration-300 cursor-pointer border-l-4',
                kpi.borderColor,
                kpi.highlight && 'ring-2 ring-amber-400 bg-amber-50/30'
              )}
            >
              <div className="flex items-start justify-between">
                <div className={cn('p-2.5 rounded-xl shadow-sm', kpi.bgColor)}>
                  <kpi.icon className={cn('h-5 w-5', kpi.color)} />
                </div>
                {kpi.highlight && (
                  <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full">
                    <Sparkles className="h-3 w-3" />
                    Urgent
                  </span>
                )}
              </div>
              <p className="text-3xl font-bold text-stone-800 mt-3 group-hover:text-amber-700 transition-colors">{kpi.value}</p>
              <p className="text-sm text-stone-500 font-medium mt-1">{kpi.label}</p>
            </Card>
          </Link>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Statistics */}
        <div className="lg:col-span-2 space-y-6">
          {/* Student & Project Stats */}
          <Card className="overflow-hidden">
            <div className="p-4 bg-gradient-to-r from-stone-100 to-stone-50 border-b border-stone-200">
              <h3 className="font-semibold text-stone-800 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-amber-600" />
                Programme Statistics
              </h3>
            </div>
            <div className="p-6">
              <div className="grid sm:grid-cols-2 gap-6">
                {/* Students */}
                <div className="p-4 bg-stone-50 rounded-xl">
                  <h4 className="text-sm font-semibold text-stone-700 mb-3 flex items-center gap-2">
                    <Users className="h-4 w-4 text-stone-500" />
                    Students
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-stone-600">Total Students</span>
                      <span className="font-bold text-stone-800">{stats?.totalStudents ?? 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-stone-600">FYP1 Students</span>
                      <span className="font-bold text-sky-600">{stats?.fyp1Students ?? 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-stone-600">FYP2 Students</span>
                      <span className="font-bold text-violet-600">{stats?.fyp2Students ?? 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-stone-600">Unpaired</span>
                      <span className="font-bold text-rose-600">{stats?.unpairedStudents ?? 0}</span>
                    </div>
                  </div>
                </div>

                {/* Proposals */}
                <div className="p-4 bg-stone-50 rounded-xl">
                  <h4 className="text-sm font-semibold text-stone-700 mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-stone-500" />
                    Proposals
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-stone-600">Total Proposals</span>
                      <span className="font-bold text-stone-800">{stats?.totalProposals ?? 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-stone-600">Approved</span>
                      <span className="font-bold text-emerald-600">{stats?.approvedProposals ?? 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-stone-600">Pending Review</span>
                      <span className="font-bold text-amber-600">{stats?.pendingReviews ?? 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-stone-600">Rejected</span>
                      <span className="font-bold text-rose-600">{stats?.rejectedProposals ?? 0}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress Bars */}
              <div className="mt-6 pt-6 border-t border-stone-200">
                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-stone-600 font-medium">Proposal Approval Rate</span>
                      <span className="font-bold text-emerald-600">
                        {stats?.totalProposals
                          ? Math.round((stats.approvedProposals / stats.totalProposals) * 100)
                          : 0}%
                      </span>
                    </div>
                    <div className="h-3 bg-stone-100 rounded-full overflow-hidden shadow-inner">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all"
                        style={{
                          width: `${stats?.totalProposals
                            ? (stats.approvedProposals / stats.totalProposals) * 100
                            : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-stone-600 font-medium">Pairing Completion</span>
                      <span className="font-bold text-sky-600">
                        {stats?.totalStudents
                          ? Math.round(((stats.totalStudents - stats.unpairedStudents) / stats.totalStudents) * 100)
                          : 0}%
                      </span>
                    </div>
                    <div className="h-3 bg-stone-100 rounded-full overflow-hidden shadow-inner">
                      <div
                        className="h-full bg-gradient-to-r from-sky-400 to-sky-500 rounded-full transition-all"
                        style={{
                          width: `${stats?.totalStudents
                            ? ((stats.totalStudents - stats.unpairedStudents) / stats.totalStudents) * 100
                            : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Quick Actions */}
          <Card className="overflow-hidden">
            <div className="p-4 bg-gradient-to-r from-stone-100 to-stone-50 border-b border-stone-200">
              <h3 className="font-semibold text-stone-800">Quick Actions</h3>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {quickActions.map((action) => (
                  <Link key={action.label} to={action.href}>
                    <div className={cn(
                      'group flex flex-col items-center p-4 rounded-xl border border-stone-200 transition-all duration-300 text-center',
                      action.hoverBg,
                      'hover:shadow-md hover:border-stone-300'
                    )}>
                      <div className="p-2.5 bg-stone-100 rounded-xl group-hover:scale-110 transition-transform">
                        <action.icon className={cn('h-6 w-6', action.color)} />
                      </div>
                      <span className="text-sm font-medium text-stone-700 mt-2">{action.label}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </Card>

          {/* Supervisor Load Summary */}
          <Card className="overflow-hidden">
            <div className="p-4 bg-gradient-to-r from-stone-100 to-stone-50 border-b border-stone-200 flex items-center justify-between">
              <h3 className="font-semibold text-stone-800 flex items-center gap-2">
                <Users className="h-5 w-5 text-amber-600" />
                Supervisor Overview
              </h3>
              <Link to={ROUTES.COMMITTEE.SUPERVISOR_LOAD}>
                <Button variant="ghost" size="sm" className="text-stone-600 hover:text-amber-700">
                  View All <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
            <div className="p-4">
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-stone-100 rounded-xl">
                  <p className="text-3xl font-bold text-stone-800">{stats?.totalSupervisors ?? 0}</p>
                  <p className="text-sm text-stone-600 font-medium">Total Supervisors</p>
                </div>
                <div className="text-center p-4 bg-emerald-100 rounded-xl">
                  <p className="text-3xl font-bold text-emerald-700">
                    {(stats?.totalSupervisors ?? 0) - (stats?.overloadedSupervisors ?? 0)}
                  </p>
                  <p className="text-sm text-emerald-700 font-medium">Within Capacity</p>
                </div>
                <div className="text-center p-4 bg-rose-100 rounded-xl">
                  <p className="text-3xl font-bold text-rose-700">{stats?.overloadedSupervisors ?? 0}</p>
                  <p className="text-sm text-rose-700 font-medium">Overloaded</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column - Activity Feed */}
        <div className="space-y-6">
          {/* Recent Activity */}
          <Card className="overflow-hidden">
            <div className="p-4 bg-gradient-to-r from-stone-100 to-stone-50 border-b border-stone-200">
              <h3 className="font-semibold text-stone-800 flex items-center gap-2">
                <Activity className="h-5 w-5 text-amber-600" />
                Recent Activity
              </h3>
            </div>
            <div className="p-4 space-y-3">
              {recentActivities && recentActivities.length > 0 ? (
                recentActivities.slice(0, 6).map((activity) => (
                  <div key={activity.activityId} className="group flex items-start gap-3 p-2 rounded-lg hover:bg-stone-50 transition-colors">
                    <div className="p-2 bg-stone-100 rounded-lg group-hover:bg-white transition-colors">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-stone-800">{activity.title}</p>
                      <p className="text-xs text-stone-500 mt-0.5 truncate">{activity.description}</p>
                      <p className="text-xs text-stone-400 mt-1">
                        {new Date(activity.timestamp).toLocaleString('en-MY', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Activity className="h-6 w-6 text-stone-400" />
                  </div>
                  <p className="text-sm text-stone-500">No recent activity</p>
                </div>
              )}
            </div>
          </Card>

          {/* Upcoming Deadlines */}
          <Card className="overflow-hidden">
            <div className="p-4 bg-gradient-to-r from-stone-100 to-stone-50 border-b border-stone-200">
              <h3 className="font-semibold text-stone-800 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-amber-600" />
                Upcoming Deadlines
              </h3>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-3 p-3 bg-rose-50 rounded-xl border border-rose-100">
                <div className="w-14 h-14 bg-rose-100 rounded-xl flex flex-col items-center justify-center">
                  <p className="text-lg font-bold text-rose-700">31</p>
                  <p className="text-xs text-rose-600 font-medium">JAN</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-stone-800">FYP1 Proposal Deadline</p>
                  <p className="text-xs text-stone-500">All FYP1 proposals due</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl border border-amber-100">
                <div className="w-14 h-14 bg-amber-100 rounded-xl flex flex-col items-center justify-center">
                  <p className="text-lg font-bold text-amber-700">15</p>
                  <p className="text-xs text-amber-600 font-medium">FEB</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-stone-800">Pairing Completion</p>
                  <p className="text-xs text-stone-500">All students must be paired</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-sky-50 rounded-xl border border-sky-100">
                <div className="w-14 h-14 bg-sky-100 rounded-xl flex flex-col items-center justify-center">
                  <p className="text-lg font-bold text-sky-700">15</p>
                  <p className="text-xs text-sky-600 font-medium">MAR</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-stone-800">FYP2 Presentations</p>
                  <p className="text-xs text-stone-500">Final presentations begin</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
