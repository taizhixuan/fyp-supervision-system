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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
            <LayoutDashboard className="h-7 w-7 text-primary-600" />
            System Dashboard
          </h1>
          <p className="text-neutral-600 mt-1">
            Monitor system health and manage administrative tasks
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-neutral-500">
          <Clock className="h-4 w-4" />
          <span>Uptime: {stats?.systemUptime}</span>
        </div>
      </div>

      {/* System Alerts */}
      {alerts && alerts.filter((a) => !a.isResolved).length > 0 && (
        <div className="space-y-2">
          {alerts
            .filter((a) => !a.isResolved)
            .map((alert) => (
              <Card
                key={alert.alertId}
                className={cn(
                  'p-4 border-l-4',
                  alert.type === 'ERROR'
                    ? 'border-l-error-500 bg-error-50'
                    : alert.type === 'WARNING'
                    ? 'border-l-warning-500 bg-warning-50'
                    : 'border-l-info-500 bg-info-50'
                )}
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle
                    className={cn(
                      'h-5 w-5 flex-shrink-0',
                      alert.type === 'ERROR'
                        ? 'text-error-600'
                        : alert.type === 'WARNING'
                        ? 'text-warning-600'
                        : 'text-info-600'
                    )}
                  />
                  <div className="flex-1">
                    <h4 className="font-medium text-neutral-900">{alert.title}</h4>
                    <p className="text-sm text-neutral-600 mt-0.5">{alert.message}</p>
                    <p className="text-xs text-neutral-500 mt-1">Source: {alert.source}</p>
                  </div>
                </div>
              </Card>
            ))}
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to={ROUTES.ADMIN.USERS}>
          <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-500">Total Users</p>
                <p className="text-2xl font-bold text-neutral-900">{stats?.totalUsers}</p>
                <p className="text-xs text-success-600 mt-1">
                  {stats?.activeUsers} active
                </p>
              </div>
              <div className="p-3 bg-primary-50 rounded-lg">
                <Users className="h-6 w-6 text-primary-600" />
              </div>
            </div>
          </Card>
        </Link>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-500">Active Projects</p>
              <p className="text-2xl font-bold text-neutral-900">{stats?.activeProjects}</p>
              <p className="text-xs text-neutral-500 mt-1">
                of {stats?.totalProjects} total
              </p>
            </div>
            <div className="p-3 bg-info-50 rounded-lg">
              <FolderKanban className="h-6 w-6 text-info-600" />
            </div>
          </div>
        </Card>

        <Link to={ROUTES.ADMIN.USERS}>
          <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-500">Pending Approvals</p>
                <p className="text-2xl font-bold text-warning-600">{stats?.pendingApprovals}</p>
                <p className="text-xs text-warning-600 mt-1">Requires action</p>
              </div>
              <div className="p-3 bg-warning-50 rounded-lg">
                <Shield className="h-6 w-6 text-warning-600" />
              </div>
            </div>
          </Card>
        </Link>

        <Link to={ROUTES.ADMIN.MAINTENANCE}>
          <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-500">Last Backup</p>
                <p className="text-lg font-bold text-neutral-900">
                  {stats?.lastBackup
                    ? new Date(stats.lastBackup).toLocaleDateString()
                    : 'Never'}
                </p>
                <p className="text-xs text-neutral-500 mt-1">
                  {stats?.lastBackup &&
                    new Date(stats.lastBackup).toLocaleTimeString()}
                </p>
              </div>
              <div className="p-3 bg-success-50 rounded-lg">
                <Database className="h-6 w-6 text-success-600" />
              </div>
            </div>
          </Card>
        </Link>
      </div>

      {/* System Resources & Health Checks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Resources */}
        <Card className="p-6">
          <h3 className="font-semibold text-neutral-900 mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary-600" />
            System Resources
          </h3>

          <div className="space-y-4">
            {/* CPU Usage */}
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="flex items-center gap-2 text-neutral-600">
                  <Cpu className="h-4 w-4" />
                  CPU Usage
                </span>
                <span className={cn(
                  'font-medium',
                  (stats?.cpuUsage || 0) > 80 ? 'text-error-600' :
                  (stats?.cpuUsage || 0) > 60 ? 'text-warning-600' : 'text-success-600'
                )}>
                  {stats?.cpuUsage}%
                </span>
              </div>
              <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    (stats?.cpuUsage || 0) > 80 ? 'bg-error-500' :
                    (stats?.cpuUsage || 0) > 60 ? 'bg-warning-500' : 'bg-success-500'
                  )}
                  style={{ width: `${stats?.cpuUsage || 0}%` }}
                />
              </div>
            </div>

            {/* Memory Usage */}
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="flex items-center gap-2 text-neutral-600">
                  <Activity className="h-4 w-4" />
                  Memory Usage
                </span>
                <span className={cn(
                  'font-medium',
                  (stats?.memoryUsage || 0) > 80 ? 'text-error-600' :
                  (stats?.memoryUsage || 0) > 60 ? 'text-warning-600' : 'text-success-600'
                )}>
                  {stats?.memoryUsage}%
                </span>
              </div>
              <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    (stats?.memoryUsage || 0) > 80 ? 'bg-error-500' :
                    (stats?.memoryUsage || 0) > 60 ? 'bg-warning-500' : 'bg-success-500'
                  )}
                  style={{ width: `${stats?.memoryUsage || 0}%` }}
                />
              </div>
            </div>

            {/* Storage Usage */}
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="flex items-center gap-2 text-neutral-600">
                  <HardDrive className="h-4 w-4" />
                  Storage
                </span>
                <span className={cn(
                  'font-medium',
                  getStoragePercentage() > 80 ? 'text-error-600' :
                  getStoragePercentage() > 60 ? 'text-warning-600' : 'text-success-600'
                )}>
                  {formatBytes(stats?.storageUsed || 0)} / {formatBytes(stats?.storageTotal || 0)}
                </span>
              </div>
              <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    getStoragePercentage() > 80 ? 'bg-error-500' :
                    getStoragePercentage() > 60 ? 'bg-warning-500' : 'bg-success-500'
                  )}
                  style={{ width: `${getStoragePercentage()}%` }}
                />
              </div>
            </div>

            {/* Database Size */}
            <div className="pt-2 border-t border-neutral-200">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-neutral-600">
                  <Database className="h-4 w-4" />
                  Database Size
                </span>
                <span className="font-medium text-neutral-900">
                  {formatBytes(stats?.databaseSize || 0)}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Health Checks */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-neutral-900 flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary-600" />
              Service Health
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetchHealth()}
              disabled={healthLoading}
            >
              <RefreshCw className={cn('h-4 w-4', healthLoading && 'animate-spin')} />
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
                  className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {check.status === 'HEALTHY' ? (
                      <CheckCircle className="h-5 w-5 text-success-600" />
                    ) : check.status === 'DEGRADED' ? (
                      <AlertTriangle className="h-5 w-5 text-warning-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-error-600" />
                    )}
                    <div>
                      <p className="font-medium text-neutral-900">{check.name}</p>
                      <p className="text-xs text-neutral-500">{check.message}</p>
                    </div>
                  </div>
                  {check.responseTime && (
                    <span className="text-xs text-neutral-500">{check.responseTime}ms</span>
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
        <Card className="p-6">
          <h3 className="font-semibold text-neutral-900 mb-4 flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary-600" />
            Quick Actions
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <Link to={ROUTES.ADMIN.USERS}>
              <Button variant="outline" className="w-full justify-start">
                <Users className="h-4 w-4 mr-2" />
                Manage Users
              </Button>
            </Link>
            <Link to={ROUTES.ADMIN.PARAMETERS}>
              <Button variant="outline" className="w-full justify-start">
                <Settings className="h-4 w-4 mr-2" />
                System Settings
              </Button>
            </Link>
            <Link to={ROUTES.ADMIN.CYCLES}>
              <Button variant="outline" className="w-full justify-start">
                <Calendar className="h-4 w-4 mr-2" />
                FYP Cycles
              </Button>
            </Link>
            <Link to={ROUTES.ADMIN.DEADLINES}>
              <Button variant="outline" className="w-full justify-start">
                <Clock className="h-4 w-4 mr-2" />
                Deadlines
              </Button>
            </Link>
            <Link to={ROUTES.ADMIN.INTEGRATIONS}>
              <Button variant="outline" className="w-full justify-start">
                <Activity className="h-4 w-4 mr-2" />
                Integrations
              </Button>
            </Link>
            <Link to={ROUTES.ADMIN.MAINTENANCE}>
              <Button variant="outline" className="w-full justify-start">
                <HardDrive className="h-4 w-4 mr-2" />
                Maintenance
              </Button>
            </Link>
            <Link to={ROUTES.ADMIN.AUDIT_LOGS}>
              <Button variant="outline" className="w-full justify-start">
                <FileText className="h-4 w-4 mr-2" />
                Audit Logs
              </Button>
            </Link>
            <Link to={ROUTES.ADMIN.EXPORT_CONFIG}>
              <Button variant="outline" className="w-full justify-start">
                <Database className="h-4 w-4 mr-2" />
                Export Data
              </Button>
            </Link>
          </div>
        </Card>

        {/* Recent Activity */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-neutral-900 flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary-600" />
              Recent Activity
            </h3>
            <Link to={ROUTES.ADMIN.AUDIT_LOGS}>
              <Button variant="ghost" size="sm">
                View All
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>

          <div className="space-y-3">
            {recentActivity?.map((activity) => (
              <div
                key={activity.activityId}
                className="flex items-start gap-3 p-3 bg-neutral-50 rounded-lg"
              >
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Activity className="h-4 w-4 text-primary-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-900">{activity.action}</p>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    {activity.targetType}: {activity.targetName}
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-neutral-400">
                    <span>{activity.performedBy}</span>
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
