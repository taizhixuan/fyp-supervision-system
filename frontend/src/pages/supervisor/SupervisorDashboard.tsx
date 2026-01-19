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
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { useSupervisorDashboard, useSupervisorProfile } from '@/lib/hooks/useSupervisor'
import { ROUTES } from '@/lib/constants/routes'
import { cn } from '@/lib/utils/cn'

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
      color: 'text-primary-600',
      bgColor: 'bg-primary-50',
      href: ROUTES.SUPERVISOR.SUPERVISEES,
    },
    {
      label: 'Pending Requests',
      value: stats?.pendingRequests ?? 0,
      icon: ClipboardList,
      color: 'text-warning-600',
      bgColor: 'bg-warning-50',
      href: ROUTES.SUPERVISOR.REQUESTS,
      urgent: (stats?.pendingRequests ?? 0) > 0,
    },
    {
      label: 'Upcoming Meetings',
      value: stats?.upcomingMeetings ?? 0,
      icon: Calendar,
      color: 'text-info-600',
      bgColor: 'bg-info-50',
      href: ROUTES.SUPERVISOR.MEETINGS,
    },
    {
      label: 'Logs to Review',
      value: stats?.pendingLogReviews ?? 0,
      icon: FileText,
      color: 'text-accent-600',
      bgColor: 'bg-accent-50',
      href: ROUTES.SUPERVISOR.LOGS,
      urgent: (stats?.pendingLogReviews ?? 0) > 3,
    },
    {
      label: 'Proposals to Review',
      value: stats?.proposalsToReview ?? 0,
      icon: FolderOpen,
      color: 'text-success-600',
      bgColor: 'bg-success-50',
      href: ROUTES.SUPERVISOR.PROPOSALS,
    },
    {
      label: 'Documents to Review',
      value: stats?.documentsToReview ?? 0,
      icon: FolderOpen,
      color: 'text-neutral-600',
      bgColor: 'bg-neutral-100',
      href: ROUTES.SUPERVISOR.DOCUMENTS,
    },
  ]

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low':
        return 'bg-success-500'
      case 'medium':
        return 'bg-warning-500'
      case 'high':
        return 'bg-orange-500'
      case 'critical':
        return 'bg-error-500'
      default:
        return 'bg-neutral-500'
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
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">
            Welcome back, {profile?.fullName?.split(' ')[0] ?? 'Supervisor'}
          </h1>
          <p className="text-neutral-600 mt-1">
            You have {stats?.pendingRequests ?? 0} pending requests and {stats?.pendingLogReviews ?? 0} logs awaiting review.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-neutral-500">
          <span>Slots available:</span>
          <span className="font-semibold text-primary-600">
            {profile?.availableSlots ?? 0} / {profile?.maxSupervisionQuota ?? 0}
          </span>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {quickStats.map((stat) => (
          <Link key={stat.label} to={stat.href}>
            <Card className={cn(
              'p-4 hover:shadow-md transition-shadow cursor-pointer',
              stat.urgent && 'ring-2 ring-warning-400'
            )}>
              <div className="flex items-center gap-3">
                <div className={cn('p-2 rounded-lg', stat.bgColor)}>
                  <stat.icon className={cn('h-5 w-5', stat.color)} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-neutral-900">{stat.value}</p>
                  <p className="text-xs text-neutral-500">{stat.label}</p>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Supervisee Status Distribution */}
        <Card className="lg:col-span-1">
          <div className="p-4 border-b border-neutral-200">
            <h2 className="font-semibold text-neutral-900">Supervisee Status</h2>
          </div>
          <div className="p-4 space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-success-500" />
                  <span className="text-sm text-neutral-600">In Progress</span>
                </div>
                <span className="font-semibold">{stats?.superviseesByStatus.inProgress ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-neutral-400" />
                  <span className="text-sm text-neutral-600">Not Started</span>
                </div>
                <span className="font-semibold">{stats?.superviseesByStatus.notStarted ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary-500" />
                  <span className="text-sm text-neutral-600">Completed</span>
                </div>
                <span className="font-semibold">{stats?.superviseesByStatus.completed ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-warning-500" />
                  <span className="text-sm text-neutral-600">On Hold</span>
                </div>
                <span className="font-semibold">{stats?.superviseesByStatus.onHold ?? 0}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-neutral-200">
              <h3 className="text-sm font-medium text-neutral-700 mb-3">Risk Distribution</h3>
              <div className="flex items-center gap-1 h-4 rounded-full overflow-hidden bg-neutral-100">
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
              <div className="flex items-center justify-between mt-2 text-xs text-neutral-500">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-success-500" />
                  <span>Low ({stats?.superviseesByRisk.low ?? 0})</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-warning-500" />
                  <span>Med ({stats?.superviseesByRisk.medium ?? 0})</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-orange-500" />
                  <span>High ({stats?.superviseesByRisk.high ?? 0})</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-error-500" />
                  <span>Crit ({stats?.superviseesByRisk.critical ?? 0})</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
            <h2 className="font-semibold text-neutral-900">Recent Activity</h2>
            <Link to={ROUTES.SUPERVISOR.NOTIFICATIONS}>
              <Button variant="ghost" size="sm">
                View All
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
          <div className="divide-y divide-neutral-100">
            {stats?.recentActivity.map((activity) => {
              const Icon = getActivityIcon(activity.type)
              return (
                <div key={activity.activityId} className="p-4 flex items-start gap-3">
                  <div className={cn(
                    'p-2 rounded-lg',
                    activity.actionRequired ? 'bg-warning-50' : 'bg-neutral-100'
                  )}>
                    <Icon className={cn(
                      'h-4 w-4',
                      activity.actionRequired ? 'text-warning-600' : 'text-neutral-500'
                    )} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-neutral-900">{activity.title}</p>
                        <p className="text-sm text-neutral-600">{activity.description}</p>
                      </div>
                      {activity.actionRequired && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-warning-100 text-warning-700 rounded-full whitespace-nowrap">
                          Action Required
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-neutral-400 mt-1">
                      {new Date(activity.timestamp).toLocaleDateString('en-MY', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              )
            })}
            {(!stats?.recentActivity || stats.recentActivity.length === 0) && (
              <div className="p-8 text-center text-neutral-500">
                No recent activity
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <div className="p-4 border-b border-neutral-200">
          <h2 className="font-semibold text-neutral-900">Quick Actions</h2>
        </div>
        <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link to={ROUTES.SUPERVISOR.REQUESTS}>
            <Button variant="outline" className="w-full justify-start">
              <ClipboardList className="h-4 w-4 mr-2" />
              Review Requests
            </Button>
          </Link>
          <Link to={ROUTES.SUPERVISOR.LOGS}>
            <Button variant="outline" className="w-full justify-start">
              <FileText className="h-4 w-4 mr-2" />
              Review Logs
            </Button>
          </Link>
          <Link to={ROUTES.SUPERVISOR.MEETING_NEW}>
            <Button variant="outline" className="w-full justify-start">
              <Calendar className="h-4 w-4 mr-2" />
              Schedule Meeting
            </Button>
          </Link>
          <Link to={ROUTES.SUPERVISOR.ANNOUNCEMENT_NEW}>
            <Button variant="outline" className="w-full justify-start">
              <Megaphone className="h-4 w-4 mr-2" />
              Post Announcement
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  )
}
