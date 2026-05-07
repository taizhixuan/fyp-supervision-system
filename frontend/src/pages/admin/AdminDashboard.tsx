import { Link } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  HardDrive,
  Cpu,
  Database,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Activity,
  Settings,
  Calendar,
  FileText,
  Shield,
  ChevronRight,
  RefreshCw,
  Sparkles,
  UserPlus,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { useAdminDashboard, useSystemHealthChecks } from '@/lib/hooks/useAdmin'
import { ROUTES } from '@/lib/constants/routes'
import { cn } from '@/lib/utils/cn'

export function AdminDashboard() {
  const { data, isLoading } = useAdminDashboard()
  const { data: healthData, isLoading: healthLoading, refetch: refetchHealth } = useSystemHealthChecks()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    )
  }

  const { stats, alerts, recentActivity } = data || {}

  const formatBytes = (gb: number) => {
    return `${gb.toFixed(1)} GB`
  }

  const getStoragePercentage = () => {
    if (!stats) return 0
    return Math.round((stats.storageUsed / stats.storageTotal) * 100)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-stone-800 via-stone-800 to-stone-900 p-6 text-white shadow-xl">
        <div className="absolute -right-10 -top-10 h-40 w-40 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute -left-10 -bottom-10 h-40 w-40 bg-stone-500/20 rounded-full blur-3xl" />
        <div className="relative">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-amber-500/20 rounded-xl flex items-center justify-center ring-1 ring-amber-500/30">
                <LayoutDashboard className="h-7 w-7 text-amber-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  System Dashboard
                  <Sparkles className="h-5 w-5 text-amber-400" />
                </h1>
                <p className="text-stone-300 mt-1">
                  Monitor system health and manage administrative tasks
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm bg-stone-700/50 px-4 py-2 rounded-xl border border-stone-600/50">
              <Clock className="h-4 w-4 text-amber-400" />
              <span className="text-stone-200">Uptime: {stats?.systemUptime}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Pending registrations CTA — surfaces the queue without relying on the bell or sidebar */}
      {(stats?.pendingApprovals ?? 0) > 0 && (
        <Link to={ROUTES.ADMIN.PENDING_REGISTRATIONS} className="block">
          <Card className="p-4 border-l-4 border-l-orange-500 bg-orange-50/80 hover:bg-orange-50 hover:shadow-md transition-all">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
                  <UserPlus className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-stone-900">
                    {stats?.pendingApprovals} registration{stats?.pendingApprovals === 1 ? '' : 's'} awaiting review
                  </h4>
                  <p className="text-sm text-stone-600 mt-0.5">
                    New signups are gated until you approve them in the registration queue.
                  </p>
                </div>
              </div>
              <Button variant="primary" size="sm" rightIcon={<ChevronRight className="h-4 w-4" />}>
                Review queue
              </Button>
            </div>
          </Card>
        </Link>
      )}

      {/* System Alerts */}
      {alerts && alerts.filter((a) => !a.isResolved).length > 0 && (
        <div className="space-y-3">
          {alerts
            .filter((a) => !a.isResolved)
            .map((alert) => (
              <Card
                key={alert.alertId}
                className={cn(
                  'p-4 border-l-4 shadow-sm hover:shadow-md transition-shadow',
                  alert.type === 'ERROR'
                    ? 'border-l-rose-500 bg-rose-50/80'
                    : alert.type === 'WARNING'
                    ? 'border-l-amber-500 bg-amber-50/80'
                    : 'border-l-sky-500 bg-sky-50/80'
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                    alert.type === 'ERROR'
                      ? 'bg-rose-100'
                      : alert.type === 'WARNING'
                      ? 'bg-amber-100'
                      : 'bg-sky-100'
                  )}>
                    <AlertTriangle
                      className={cn(
                        'h-5 w-5',
                        alert.type === 'ERROR'
                          ? 'text-rose-600'
                          : alert.type === 'WARNING'
                          ? 'text-amber-600'
                          : 'text-sky-600'
                      )}
                    />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-stone-900">{alert.title}</h4>
                    <p className="text-sm text-stone-600 mt-0.5">{alert.message}</p>
                    <p className="text-xs text-stone-500 mt-1">Source: {alert.source}</p>
                  </div>
                </div>
              </Card>
            ))}
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to={ROUTES.ADMIN.USERS}>
          <Card className="p-5 hover:shadow-lg hover:scale-[1.02] transition-all duration-300 cursor-pointer border-l-4 border-l-amber-500 group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-stone-500 font-medium">Total Users</p>
                <p className="text-2xl font-bold text-stone-900 mt-1">{stats?.totalUsers}</p>
                <p className="text-xs text-emerald-600 mt-1 font-medium">
                  {stats?.activeUsers} active
                </p>
              </div>
              <div className="p-3 bg-amber-50 rounded-xl group-hover:bg-amber-100 transition-colors">
                <Users className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </Card>
        </Link>

        <Card className="p-5 border-l-4 border-l-sky-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-stone-500 font-medium">Active Projects</p>
              <p className="text-2xl font-bold text-stone-900 mt-1">{stats?.activeProjects}</p>
              <p className="text-xs text-stone-500 mt-1">
                of {stats?.totalProjects} total
              </p>
            </div>
            <div className="p-3 bg-sky-50 rounded-xl">
              <FolderKanban className="h-6 w-6 text-sky-600" />
            </div>
          </div>
        </Card>

        <Link to={ROUTES.ADMIN.PENDING_REGISTRATIONS}>
          <Card className="p-5 hover:shadow-lg hover:scale-[1.02] transition-all duration-300 cursor-pointer border-l-4 border-l-orange-500 group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-stone-500 font-medium">Pending Approvals</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">{stats?.pendingApprovals}</p>
                <p className="text-xs text-orange-600 mt-1 font-medium">Requires action</p>
              </div>
              <div className="p-3 bg-orange-50 rounded-xl group-hover:bg-orange-100 transition-colors">
                <Shield className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </Card>
        </Link>

        <Link to={ROUTES.ADMIN.MAINTENANCE}>
          <Card className="p-5 hover:shadow-lg hover:scale-[1.02] transition-all duration-300 cursor-pointer border-l-4 border-l-emerald-500 group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-stone-500 font-medium">Last Backup</p>
                <p className="text-lg font-bold text-stone-900 mt-1">
                  {stats?.lastBackup
                    ? new Date(stats.lastBackup).toLocaleDateString()
                    : 'Never'}
                </p>
                <p className="text-xs text-stone-500 mt-1">
                  {stats?.lastBackup &&
                    new Date(stats.lastBackup).toLocaleTimeString()}
                </p>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl group-hover:bg-emerald-100 transition-colors">
                <Database className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </Card>
        </Link>
      </div>

      {/* System Resources & Health Checks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Resources */}
        <Card className="p-6 shadow-sm hover:shadow-md transition-shadow">
          <h3 className="font-semibold text-stone-900 mb-5 flex items-center gap-2">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
              <Activity className="h-5 w-5 text-amber-600" />
            </div>
            <span>System Resources</span>
          </h3>

          <div className="space-y-5">
            {/* CPU Usage */}
            <div className="p-3 bg-stone-50 rounded-xl">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="flex items-center gap-2 text-stone-600 font-medium">
                  <Cpu className="h-4 w-4 text-stone-500" />
                  CPU Usage
                </span>
                <span className={cn(
                  'font-semibold px-2 py-0.5 rounded-lg text-xs',
                  (stats?.cpuUsage || 0) > 80 ? 'text-rose-700 bg-rose-100' :
                  (stats?.cpuUsage || 0) > 60 ? 'text-amber-700 bg-amber-100' : 'text-emerald-700 bg-emerald-100'
                )}>
                  {stats?.cpuUsage}%
                </span>
              </div>
              <div className="h-2.5 bg-stone-200 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-500',
                    (stats?.cpuUsage || 0) > 80 ? 'bg-rose-500' :
                    (stats?.cpuUsage || 0) > 60 ? 'bg-amber-500' : 'bg-emerald-500'
                  )}
                  style={{ width: `${stats?.cpuUsage || 0}%` }}
                />
              </div>
            </div>

            {/* Memory Usage */}
            <div className="p-3 bg-stone-50 rounded-xl">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="flex items-center gap-2 text-stone-600 font-medium">
                  <Activity className="h-4 w-4 text-stone-500" />
                  Memory Usage
                </span>
                <span className={cn(
                  'font-semibold px-2 py-0.5 rounded-lg text-xs',
                  (stats?.memoryUsage || 0) > 80 ? 'text-rose-700 bg-rose-100' :
                  (stats?.memoryUsage || 0) > 60 ? 'text-amber-700 bg-amber-100' : 'text-emerald-700 bg-emerald-100'
                )}>
                  {stats?.memoryUsage}%
                </span>
              </div>
              <div className="h-2.5 bg-stone-200 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-500',
                    (stats?.memoryUsage || 0) > 80 ? 'bg-rose-500' :
                    (stats?.memoryUsage || 0) > 60 ? 'bg-amber-500' : 'bg-emerald-500'
                  )}
                  style={{ width: `${stats?.memoryUsage || 0}%` }}
                />
              </div>
            </div>

            {/* Storage Usage */}
            <div className="p-3 bg-stone-50 rounded-xl">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="flex items-center gap-2 text-stone-600 font-medium">
                  <HardDrive className="h-4 w-4 text-stone-500" />
                  Storage
                </span>
                <span className={cn(
                  'font-semibold px-2 py-0.5 rounded-lg text-xs',
                  getStoragePercentage() > 80 ? 'text-rose-700 bg-rose-100' :
                  getStoragePercentage() > 60 ? 'text-amber-700 bg-amber-100' : 'text-emerald-700 bg-emerald-100'
                )}>
                  {formatBytes(stats?.storageUsed || 0)} / {formatBytes(stats?.storageTotal || 0)}
                </span>
              </div>
              <div className="h-2.5 bg-stone-200 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-500',
                    getStoragePercentage() > 80 ? 'bg-rose-500' :
                    getStoragePercentage() > 60 ? 'bg-amber-500' : 'bg-emerald-500'
                  )}
                  style={{ width: `${getStoragePercentage()}%` }}
                />
              </div>
            </div>

            {/* Meeting-Progress Size */}
            <div className="pt-3 border-t border-stone-200">
              <div className="flex items-center justify-between text-sm p-3 bg-gradient-to-r from-stone-100 to-stone-50 rounded-xl">
                <span className="flex items-center gap-2 text-stone-600 font-medium">
                  <Database className="h-4 w-4 text-violet-500" />
                  Database Size
                </span>
                <span className="font-semibold text-stone-900 bg-violet-100 text-violet-700 px-2 py-0.5 rounded-lg text-xs">
                  {formatBytes(stats?.databaseSize || 0)}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Health Checks */}
        <Card className="p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-stone-900 flex items-center gap-2">
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                <Shield className="h-5 w-5 text-emerald-600" />
              </div>
              <span>Service Health</span>
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetchHealth()}
              disabled={healthLoading}
              className="hover:bg-stone-100"
            >
              <RefreshCw className={cn('h-4 w-4 text-stone-600', healthLoading && 'animate-spin')} />
            </Button>
          </div>

          {healthLoading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : (
            <div className="space-y-3">
              {healthData?.checks.map((check) => (
                <div
                  key={check.checkId}
                  className={cn(
                    'flex items-center justify-between p-4 rounded-xl border transition-all hover:shadow-sm',
                    check.status === 'HEALTHY' ? 'bg-emerald-50/50 border-emerald-200' :
                    check.status === 'DEGRADED' ? 'bg-amber-50/50 border-amber-200' :
                    'bg-rose-50/50 border-rose-200'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'w-9 h-9 rounded-lg flex items-center justify-center',
                      check.status === 'HEALTHY' ? 'bg-emerald-100' :
                      check.status === 'DEGRADED' ? 'bg-amber-100' :
                      'bg-rose-100'
                    )}>
                      {check.status === 'HEALTHY' ? (
                        <CheckCircle className="h-5 w-5 text-emerald-600" />
                      ) : check.status === 'DEGRADED' ? (
                        <AlertTriangle className="h-5 w-5 text-amber-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-rose-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-stone-900">{check.name}</p>
                      <p className="text-xs text-stone-500">{check.message}</p>
                    </div>
                  </div>
                  {check.responseTime && (
                    <span className="text-xs font-medium text-stone-500 bg-stone-100 px-2 py-1 rounded-lg">
                      {check.responseTime}ms
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card className="p-6 shadow-sm hover:shadow-md transition-shadow">
          <h3 className="font-semibold text-stone-900 mb-5 flex items-center gap-2">
            <div className="w-10 h-10 bg-stone-100 rounded-xl flex items-center justify-center">
              <Settings className="h-5 w-5 text-stone-600" />
            </div>
            <span>Quick Actions</span>
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <Link to={ROUTES.ADMIN.USERS}>
              <Button variant="secondary" className="w-full justify-start hover:bg-amber-50 hover:border-amber-300 hover:text-amber-700 transition-colors">
                <Users className="h-4 w-4 mr-2" />
                Manage Users
              </Button>
            </Link>
            <Link to={ROUTES.ADMIN.PENDING_REGISTRATIONS}>
              <Button variant="secondary" className="w-full justify-start hover:bg-orange-50 hover:border-orange-300 hover:text-orange-700 transition-colors">
                <UserPlus className="h-4 w-4 mr-2" />
                Registration Queue
              </Button>
            </Link>
            <Link to={ROUTES.ADMIN.PARAMETERS}>
              <Button variant="secondary" className="w-full justify-start hover:bg-sky-50 hover:border-sky-300 hover:text-sky-700 transition-colors">
                <Settings className="h-4 w-4 mr-2" />
                System Settings
              </Button>
            </Link>
            <Link to={ROUTES.ADMIN.CYCLES}>
              <Button variant="secondary" className="w-full justify-start hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 transition-colors">
                <Calendar className="h-4 w-4 mr-2" />
                FYP Cycles
              </Button>
            </Link>
            <Link to={ROUTES.ADMIN.DEADLINES}>
              <Button variant="secondary" className="w-full justify-start hover:bg-orange-50 hover:border-orange-300 hover:text-orange-700 transition-colors">
                <Clock className="h-4 w-4 mr-2" />
                Deadlines
              </Button>
            </Link>
            <Link to={ROUTES.ADMIN.INTEGRATIONS}>
              <Button variant="secondary" className="w-full justify-start hover:bg-violet-50 hover:border-violet-300 hover:text-violet-700 transition-colors">
                <Activity className="h-4 w-4 mr-2" />
                Integrations
              </Button>
            </Link>
            <Link to={ROUTES.ADMIN.MAINTENANCE}>
              <Button variant="secondary" className="w-full justify-start hover:bg-rose-50 hover:border-rose-300 hover:text-rose-700 transition-colors">
                <HardDrive className="h-4 w-4 mr-2" />
                Maintenance
              </Button>
            </Link>
            <Link to={ROUTES.ADMIN.AUDIT_LOGS}>
              <Button variant="secondary" className="w-full justify-start hover:bg-stone-100 hover:border-stone-400 hover:text-stone-700 transition-colors">
                <FileText className="h-4 w-4 mr-2" />
                Audit Logs
              </Button>
            </Link>
            <Link to={ROUTES.ADMIN.EXPORT_CONFIG}>
              <Button variant="secondary" className="w-full justify-start hover:bg-teal-50 hover:border-teal-300 hover:text-teal-700 transition-colors">
                <Database className="h-4 w-4 mr-2" />
                Export Data
              </Button>
            </Link>
          </div>
        </Card>

        {/* Recent Activity */}
        <Card className="p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-stone-900 flex items-center gap-2">
              <div className="w-10 h-10 bg-sky-100 rounded-xl flex items-center justify-center">
                <Activity className="h-5 w-5 text-sky-600" />
              </div>
              <span>Recent Activity</span>
            </h3>
            <Link to={ROUTES.ADMIN.AUDIT_LOGS}>
              <Button variant="ghost" size="sm" className="text-stone-600 hover:text-amber-700 hover:bg-amber-50">
                View All
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>

          <div className="space-y-3">
            {recentActivity?.map((activity, index) => (
              <div
                key={activity.activityId}
                className="flex items-start gap-3 p-4 bg-gradient-to-r from-stone-50 to-transparent rounded-xl border border-stone-100 hover:border-stone-200 transition-colors"
              >
                <div className={cn(
                  'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0',
                  index % 4 === 0 ? 'bg-amber-100' :
                  index % 4 === 1 ? 'bg-emerald-100' :
                  index % 4 === 2 ? 'bg-sky-100' : 'bg-violet-100'
                )}>
                  <Activity className={cn(
                    'h-4 w-4',
                    index % 4 === 0 ? 'text-amber-600' :
                    index % 4 === 1 ? 'text-emerald-600' :
                    index % 4 === 2 ? 'text-sky-600' : 'text-violet-600'
                  )} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-stone-900">{activity.action}</p>
                  <p className="text-xs text-stone-500 mt-0.5">
                    {activity.targetType}: {activity.targetName}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5 text-xs text-stone-400">
                    <span className="font-medium">{activity.performedBy}</span>
                    <span>•</span>
                    <span>{new Date(activity.timestamp).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
