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

  const { stats, alerts, recentActivities } = data || {
    stats: null,
    alerts: [],
    recentActivities: [],
  }

  const kpiCards = [
    {
      label: 'Total Proposals',
      value: stats?.totalProposals ?? 0,
      icon: FileText,
      color: 'text-primary-600',
      bgColor: 'bg-primary-50',
      link: ROUTES.COMMITTEE.PROPOSALS,
    },
    {
      label: 'Pending Reviews',
      value: stats?.pendingReviews ?? 0,
      icon: Clock,
      color: 'text-warning-600',
      bgColor: 'bg-warning-50',
      link: ROUTES.COMMITTEE.PROPOSALS,
      highlight: (stats?.pendingReviews ?? 0) > 10,
    },
    {
      label: 'Unpaired Students',
      value: stats?.unpairedStudents ?? 0,
      icon: UserX,
      color: 'text-error-600',
      bgColor: 'bg-error-50',
      link: ROUTES.COMMITTEE.UNPAIRED_STUDENTS,
      highlight: (stats?.unpairedStudents ?? 0) > 0,
    },
    {
      label: 'Overloaded Supervisors',
      value: stats?.overloadedSupervisors ?? 0,
      icon: AlertTriangle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      link: ROUTES.COMMITTEE.SUPERVISOR_LOAD,
      highlight: (stats?.overloadedSupervisors ?? 0) > 0,
    },
  ]

  const quickActions = [
    { label: 'Review Proposals', icon: FileText, href: ROUTES.COMMITTEE.PROPOSALS, color: 'text-primary-600' },
    { label: 'Manage Announcements', icon: Megaphone, href: ROUTES.COMMITTEE.ANNOUNCEMENTS, color: 'text-info-600' },
    { label: 'View Projects', icon: FolderOpen, href: ROUTES.COMMITTEE.PROJECTS, color: 'text-accent-600' },
    { label: 'Generate Reports', icon: BarChart3, href: ROUTES.COMMITTEE.REPORTS, color: 'text-success-600' },
  ]

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'URGENT':
        return <AlertTriangle className="h-5 w-5 text-error-600" />
      case 'WARNING':
        return <AlertTriangle className="h-5 w-5 text-warning-600" />
      default:
        return <Bell className="h-5 w-5 text-info-600" />
    }
  }

  const getAlertBg = (type: string) => {
    switch (type) {
      case 'URGENT':
        return 'bg-error-50 border-error-200'
      case 'WARNING':
        return 'bg-warning-50 border-warning-200'
      default:
        return 'bg-info-50 border-info-200'
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'PROPOSAL_SUBMITTED':
        return <FileText className="h-4 w-4 text-primary-600" />
      case 'PROPOSAL_REVIEWED':
        return <CheckCircle className="h-4 w-4 text-success-600" />
      case 'STUDENT_PAIRED':
        return <Users className="h-4 w-4 text-info-600" />
      case 'ANNOUNCEMENT_CREATED':
        return <Megaphone className="h-4 w-4 text-warning-600" />
      case 'DOCUMENT_UPLOADED':
        return <FolderOpen className="h-4 w-4 text-accent-600" />
      default:
        return <Activity className="h-4 w-4 text-neutral-600" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
            <LayoutDashboard className="h-7 w-7 text-primary-600" />
            FYP Committee Dashboard
          </h1>
          <p className="text-neutral-600 mt-1">
            Overview of FYP programme status and key metrics
          </p>
        </div>
        <div className="text-sm text-neutral-500">
          {new Date().toLocaleDateString('en-MY', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </div>
      </div>

      {/* Alerts */}
      {alerts && alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.filter((a) => !a.isRead).slice(0, 3).map((alert) => (
            <div
              key={alert.alertId}
              className={cn(
                'flex items-start gap-3 p-4 rounded-lg border',
                getAlertBg(alert.type)
              )}
            >
              {getAlertIcon(alert.type)}
              <div className="flex-1">
                <p className="font-medium text-neutral-900">{alert.title}</p>
                <p className="text-sm text-neutral-600 mt-0.5">{alert.message}</p>
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
                'p-4 hover:shadow-md transition-shadow cursor-pointer',
                kpi.highlight && 'ring-2 ring-warning-400'
              )}
            >
              <div className="flex items-start justify-between">
                <div className={cn('p-2 rounded-lg', kpi.bgColor)}>
                  <kpi.icon className={cn('h-5 w-5', kpi.color)} />
                </div>
                {kpi.highlight && (
                  <span className="px-2 py-0.5 bg-warning-100 text-warning-700 text-xs font-medium rounded-full">
                    Attention
                  </span>
                )}
              </div>
              <p className="text-2xl font-bold text-neutral-900 mt-3">{kpi.value}</p>
              <p className="text-sm text-neutral-500 mt-1">{kpi.label}</p>
            </Card>
          </Link>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Statistics */}
        <div className="lg:col-span-2 space-y-6">
          {/* Student & Project Stats */}
          <Card className="p-6">
            <h3 className="font-semibold text-neutral-900 mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-neutral-400" />
              Programme Statistics
            </h3>
            <div className="grid sm:grid-cols-2 gap-6">
              {/* Students */}
              <div>
                <h4 className="text-sm font-medium text-neutral-700 mb-3">Students</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-600">Total Students</span>
                    <span className="font-semibold">{stats?.totalStudents ?? 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-600">FYP1 Students</span>
                    <span className="font-semibold text-info-600">{stats?.fyp1Students ?? 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-600">FYP2 Students</span>
                    <span className="font-semibold text-accent-600">{stats?.fyp2Students ?? 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-600">Unpaired</span>
                    <span className="font-semibold text-error-600">{stats?.unpairedStudents ?? 0}</span>
                  </div>
                </div>
              </div>

              {/* Proposals */}
              <div>
                <h4 className="text-sm font-medium text-neutral-700 mb-3">Proposals</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-600">Total Proposals</span>
                    <span className="font-semibold">{stats?.totalProposals ?? 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-600">Approved</span>
                    <span className="font-semibold text-success-600">{stats?.approvedProposals ?? 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-600">Pending Review</span>
                    <span className="font-semibold text-warning-600">{stats?.pendingReviews ?? 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-600">Rejected</span>
                    <span className="font-semibold text-error-600">{stats?.rejectedProposals ?? 0}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Bars */}
            <div className="mt-6 pt-6 border-t">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-neutral-600">Proposal Approval Rate</span>
                    <span className="font-medium">
                      {stats?.totalProposals
                        ? Math.round((stats.approvedProposals / stats.totalProposals) * 100)
                        : 0}%
                    </span>
                  </div>
                  <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-success-500 rounded-full transition-all"
                      style={{
                        width: `${stats?.totalProposals
                          ? (stats.approvedProposals / stats.totalProposals) * 100
                          : 0}%`,
                      }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-neutral-600">Pairing Completion</span>
                    <span className="font-medium">
                      {stats?.totalStudents
                        ? Math.round(((stats.totalStudents - stats.unpairedStudents) / stats.totalStudents) * 100)
                        : 0}%
                    </span>
                  </div>
                  <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-500 rounded-full transition-all"
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
          </Card>

          {/* Quick Actions */}
          <Card className="p-6">
            <h3 className="font-semibold text-neutral-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {quickActions.map((action) => (
                <Link key={action.label} to={action.href}>
                  <div className="flex flex-col items-center p-4 rounded-lg border border-neutral-200 hover:border-primary-300 hover:bg-primary-50/50 transition-colors text-center">
                    <action.icon className={cn('h-6 w-6 mb-2', action.color)} />
                    <span className="text-sm font-medium text-neutral-700">{action.label}</span>
                  </div>
                </Link>
              ))}
            </div>
          </Card>

          {/* Supervisor Load Summary */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-neutral-900 flex items-center gap-2">
                <Users className="h-5 w-5 text-neutral-400" />
                Supervisor Overview
              </h3>
              <Link to={ROUTES.COMMITTEE.SUPERVISOR_LOAD}>
                <Button variant="ghost" size="sm">
                  View All <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-neutral-50 rounded-lg">
                <p className="text-2xl font-bold text-neutral-900">{stats?.totalSupervisors ?? 0}</p>
                <p className="text-sm text-neutral-500">Total Supervisors</p>
              </div>
              <div className="text-center p-4 bg-success-50 rounded-lg">
                <p className="text-2xl font-bold text-success-600">
                  {(stats?.totalSupervisors ?? 0) - (stats?.overloadedSupervisors ?? 0)}
                </p>
                <p className="text-sm text-neutral-500">Within Capacity</p>
              </div>
              <div className="text-center p-4 bg-error-50 rounded-lg">
                <p className="text-2xl font-bold text-error-600">{stats?.overloadedSupervisors ?? 0}</p>
                <p className="text-sm text-neutral-500">Overloaded</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column - Activity Feed */}
        <div className="space-y-6">
          {/* Recent Activity */}
          <Card className="p-6">
            <h3 className="font-semibold text-neutral-900 mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5 text-neutral-400" />
              Recent Activity
            </h3>
            <div className="space-y-4">
              {recentActivities && recentActivities.length > 0 ? (
                recentActivities.slice(0, 6).map((activity) => (
                  <div key={activity.activityId} className="flex items-start gap-3">
                    <div className="p-1.5 bg-neutral-100 rounded-full">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-900">{activity.title}</p>
                      <p className="text-xs text-neutral-500 mt-0.5 truncate">{activity.description}</p>
                      <p className="text-xs text-neutral-400 mt-1">
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
                <p className="text-sm text-neutral-500 text-center py-4">No recent activity</p>
              )}
            </div>
          </Card>

          {/* Upcoming Deadlines */}
          <Card className="p-6">
            <h3 className="font-semibold text-neutral-900 mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-neutral-400" />
              Upcoming Deadlines
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-error-50 rounded-lg">
                <div className="text-center">
                  <p className="text-lg font-bold text-error-600">31</p>
                  <p className="text-xs text-error-600">JAN</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-900">FYP1 Proposal Deadline</p>
                  <p className="text-xs text-neutral-500">All FYP1 proposals due</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-warning-50 rounded-lg">
                <div className="text-center">
                  <p className="text-lg font-bold text-warning-600">15</p>
                  <p className="text-xs text-warning-600">FEB</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-900">Pairing Completion</p>
                  <p className="text-xs text-neutral-500">All students must be paired</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-info-50 rounded-lg">
                <div className="text-center">
                  <p className="text-lg font-bold text-info-600">15</p>
                  <p className="text-xs text-info-600">MAR</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-900">FYP2 Presentations</p>
                  <p className="text-xs text-neutral-500">Final presentations begin</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
