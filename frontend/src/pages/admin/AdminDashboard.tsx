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
  UserPlus,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { useAdminDashboard, useSystemHealthChecks } from '@/lib/hooks/useAdmin'
import { ROUTES } from '@/lib/constants/routes'
import { cn } from '@/lib/utils/cn'
import type { SystemAlert, RecentAdminActivity, SystemHealthCheck } from '@/types'

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

  const formatBytes = (gb: number) => `${gb.toFixed(1)} GB`

  const getStoragePercentage = () => {
    if (!stats) return 0
    return Math.round((stats.storageUsed / stats.storageTotal) * 100)
  }

  const kpiChips = [
    {
      label: 'Users',
      value: stats?.totalUsers ?? 0,
      sub: `${stats?.activeUsers ?? 0} active`,
      icon: Users,
      color: 'text-amber-300',
      link: ROUTES.ADMIN.USERS,
    },
    {
      label: 'Projects',
      value: stats?.activeProjects ?? 0,
      sub: `of ${stats?.totalProjects ?? 0}`,
      icon: FolderKanban,
      color: 'text-sky-300',
    },
    {
      label: 'Pending',
      value: stats?.pendingApprovals ?? 0,
      sub: 'review queue',
      icon: Shield,
      color: 'text-orange-300',
      link: ROUTES.ADMIN.PENDING_REGISTRATIONS,
      highlight: (stats?.pendingApprovals ?? 0) > 0,
    },
    {
      label: 'Backup',
      value: stats?.lastBackup ? new Date(stats.lastBackup).toLocaleDateString('en-MY', { day: 'numeric', month: 'short' }) : '—',
      sub: stats?.lastBackup ? new Date(stats.lastBackup).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'never',
      icon: Database,
      color: 'text-emerald-300',
      link: ROUTES.ADMIN.MAINTENANCE,
    },
  ]

  const quickActions = [
    { label: 'Manage Users', icon: Users, href: ROUTES.ADMIN.USERS, color: 'text-amber-600', hoverBg: 'hover:bg-amber-50' },
    { label: 'Registration Queue', icon: UserPlus, href: ROUTES.ADMIN.PENDING_REGISTRATIONS, color: 'text-orange-600', hoverBg: 'hover:bg-orange-50' },
    { label: 'System Settings', icon: Settings, href: ROUTES.ADMIN.PARAMETERS, color: 'text-sky-600', hoverBg: 'hover:bg-sky-50' },
    { label: 'FYP Cycles', icon: Calendar, href: ROUTES.ADMIN.CYCLES, color: 'text-emerald-600', hoverBg: 'hover:bg-emerald-50' },
    { label: 'Deadlines', icon: Clock, href: ROUTES.ADMIN.DEADLINES, color: 'text-orange-600', hoverBg: 'hover:bg-orange-50' },
    { label: 'Integrations', icon: Activity, href: ROUTES.ADMIN.INTEGRATIONS, color: 'text-violet-600', hoverBg: 'hover:bg-violet-50' },
    { label: 'Maintenance', icon: HardDrive, href: ROUTES.ADMIN.MAINTENANCE, color: 'text-rose-600', hoverBg: 'hover:bg-rose-50' },
    { label: 'Audit Logs', icon: FileText, href: ROUTES.ADMIN.AUDIT_LOGS, color: 'text-stone-700', hoverBg: 'hover:bg-stone-100' },
  ]

  return (
    <div className="space-y-3 lg:space-y-4">
      {/* Compact hero with inline KPI chips */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-stone-800 via-stone-800 to-stone-900 p-3 sm:p-4 text-white shadow-md">
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

        <div className="relative flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex-shrink-0 w-9 h-9 bg-amber-500/20 rounded-lg flex items-center justify-center ring-1 ring-amber-500/30">
              <LayoutDashboard className="h-5 w-5 text-amber-400" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-white leading-tight">System Dashboard</h1>
              <p className="text-stone-300 text-xs">Monitor system health and manage administrative tasks</p>
            </div>
          </div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-stone-700/50 backdrop-blur-sm rounded-md ring-1 ring-stone-600/30 flex-shrink-0">
            <Clock className="h-3.5 w-3.5 text-amber-400" />
            <span className="text-xs text-stone-200 whitespace-nowrap">Uptime: {stats?.systemUptime}</span>
          </div>
        </div>

        {/* KPI chips inline */}
        <div className="relative mt-3 grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {kpiChips.map((kpi) => {
            const inner = (
              <div className={cn(
                'flex items-center gap-2 rounded-md px-2 py-1.5 ring-1 transition-colors',
                kpi.highlight ? 'bg-amber-500/30 ring-amber-300/40 hover:bg-amber-500/40' : 'bg-stone-700/40 ring-stone-600/40 hover:bg-stone-700/60'
              )}>
                <kpi.icon className={cn('h-3.5 w-3.5 flex-shrink-0', kpi.color)} />
                <div className="min-w-0">
                  <div className="text-base font-bold leading-none">{kpi.value}</div>
                  <p className="text-[10px] text-stone-300 truncate uppercase tracking-wide">{kpi.sub}</p>
                </div>
              </div>
            )
            return kpi.link ? (
              <Link key={kpi.label} to={kpi.link}>{inner}</Link>
            ) : (
              <div key={kpi.label}>{inner}</div>
            )
          })}
        </div>
      </div>

      {/* Pending registrations strip */}
      {(stats?.pendingApprovals ?? 0) > 0 && (
        <Link to={ROUTES.ADMIN.PENDING_REGISTRATIONS} className="block">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-orange-200 bg-orange-50 hover:bg-orange-100/70 transition-colors">
            <UserPlus className="h-4 w-4 text-orange-600 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-stone-800 truncate">
                {stats?.pendingApprovals} registration{stats?.pendingApprovals === 1 ? '' : 's'} awaiting review
              </p>
              <p className="text-xs text-stone-600 line-clamp-1">New signups are gated until you approve them in the queue.</p>
            </div>
            <ChevronRight className="h-4 w-4 text-orange-600 flex-shrink-0" />
          </div>
        </Link>
      )}

      {/* System Alerts — compact inline strips */}
      {alerts && alerts.filter((a: SystemAlert) => !a.isResolved).length > 0 && (
        <div className="space-y-1.5">
          {alerts.filter((a: SystemAlert) => !a.isResolved).map((alert: SystemAlert) => (
            <div
              key={alert.alertId}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-md border',
                alert.type === 'ERROR' ? 'bg-rose-50 border-rose-200' :
                alert.type === 'WARNING' ? 'bg-amber-50 border-amber-200' : 'bg-sky-50 border-sky-200'
              )}
            >
              <AlertTriangle className={cn(
                'h-4 w-4 flex-shrink-0',
                alert.type === 'ERROR' ? 'text-rose-600' :
                alert.type === 'WARNING' ? 'text-amber-600' : 'text-sky-600'
              )} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-stone-800 truncate">{alert.title}</p>
                <p className="text-xs text-stone-600 line-clamp-1">{alert.message}</p>
              </div>
              <span className="text-[10px] text-stone-500 hidden sm:inline">{alert.source}</span>
            </div>
          ))}
        </div>
      )}

      {/* Main two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Left — Resources + Quick Actions */}
        <div className="lg:col-span-2 space-y-3">
          {/* System Resources */}
          <Card padding="sm">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-4 w-4 text-amber-600" />
              <h3 className="text-sm font-bold text-stone-800 uppercase tracking-wide">System Resources</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {/* CPU */}
              <div className="bg-stone-50 rounded-md p-2">
                <div className="flex items-center justify-between text-[11px] mb-1.5">
                  <span className="flex items-center gap-1 text-stone-600 font-medium">
                    <Cpu className="h-3 w-3 text-stone-500" /> CPU
                  </span>
                  <span className={cn(
                    'font-bold',
                    (stats?.cpuUsage || 0) > 80 ? 'text-rose-600' :
                    (stats?.cpuUsage || 0) > 60 ? 'text-amber-600' : 'text-emerald-600'
                  )}>{stats?.cpuUsage}%</span>
                </div>
                <div className="h-1.5 bg-stone-200 rounded-full overflow-hidden">
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

              {/* Memory */}
              <div className="bg-stone-50 rounded-md p-2">
                <div className="flex items-center justify-between text-[11px] mb-1.5">
                  <span className="flex items-center gap-1 text-stone-600 font-medium">
                    <Activity className="h-3 w-3 text-stone-500" /> Memory
                  </span>
                  <span className={cn(
                    'font-bold',
                    (stats?.memoryUsage || 0) > 80 ? 'text-rose-600' :
                    (stats?.memoryUsage || 0) > 60 ? 'text-amber-600' : 'text-emerald-600'
                  )}>{stats?.memoryUsage}%</span>
                </div>
                <div className="h-1.5 bg-stone-200 rounded-full overflow-hidden">
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

              {/* Storage */}
              <div className="bg-stone-50 rounded-md p-2">
                <div className="flex items-center justify-between text-[11px] mb-1.5">
                  <span className="flex items-center gap-1 text-stone-600 font-medium">
                    <HardDrive className="h-3 w-3 text-stone-500" /> Storage
                  </span>
                  <span className={cn(
                    'font-bold',
                    getStoragePercentage() > 80 ? 'text-rose-600' :
                    getStoragePercentage() > 60 ? 'text-amber-600' : 'text-emerald-600'
                  )}>{getStoragePercentage()}%</span>
                </div>
                <div className="h-1.5 bg-stone-200 rounded-full overflow-hidden">
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
            </div>

            <div className="mt-2 grid grid-cols-2 gap-1.5 text-[11px]">
              <div className="flex items-center justify-between bg-stone-50 rounded-md px-2 py-1.5">
                <span className="flex items-center gap-1 text-stone-600 font-medium">
                  <HardDrive className="h-3 w-3 text-stone-500" /> Disk
                </span>
                <span className="font-semibold text-stone-800">{formatBytes(stats?.storageUsed || 0)} / {formatBytes(stats?.storageTotal || 0)}</span>
              </div>
              <div className="flex items-center justify-between bg-stone-50 rounded-md px-2 py-1.5">
                <span className="flex items-center gap-1 text-stone-600 font-medium">
                  <Database className="h-3 w-3 text-violet-500" /> Database
                </span>
                <span className="font-semibold text-violet-700">{formatBytes(stats?.databaseSize || 0)}</span>
              </div>
            </div>
          </Card>

          {/* Quick Actions */}
          <Card padding="sm">
            <div className="flex items-center gap-2 mb-2">
              <Settings className="h-4 w-4 text-stone-600" />
              <h3 className="text-sm font-bold text-stone-800 uppercase tracking-wide">Quick Actions</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {quickActions.map((action) => (
                <Link key={action.label} to={action.href}>
                  <div className={cn(
                    'group flex items-center gap-2 px-2.5 py-2 rounded-md border border-stone-200 transition-all',
                    action.hoverBg, 'hover:border-stone-300'
                  )}>
                    <action.icon className={cn('h-4 w-4 flex-shrink-0', action.color)} />
                    <span className="text-xs font-semibold text-stone-700 truncate">{action.label}</span>
                  </div>
                </Link>
              ))}
            </div>
          </Card>

          {/* Recent Activity */}
          <Card padding="sm">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-sky-600" />
                <h3 className="text-sm font-bold text-stone-800 uppercase tracking-wide">Recent Activity</h3>
              </div>
              <Link to={ROUTES.ADMIN.AUDIT_LOGS}>
                <Button variant="ghost" size="sm" className="text-stone-600 hover:text-amber-700 whitespace-nowrap">
                  View All <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
                </Button>
              </Link>
            </div>
            <div className="divide-y divide-stone-100">
              {recentActivity && recentActivity.length > 0 ? (
                recentActivity.slice(0, 6).map((activity: RecentAdminActivity, index: number) => (
                  <div key={activity.activityId} className="py-1.5 flex items-start gap-2 hover:bg-stone-50/50 transition-colors">
                    <div className={cn(
                      'p-1 rounded flex-shrink-0',
                      index % 4 === 0 ? 'bg-amber-100' :
                      index % 4 === 1 ? 'bg-emerald-100' :
                      index % 4 === 2 ? 'bg-sky-100' : 'bg-violet-100'
                    )}>
                      <Activity className={cn(
                        'h-3 w-3',
                        index % 4 === 0 ? 'text-amber-600' :
                        index % 4 === 1 ? 'text-emerald-600' :
                        index % 4 === 2 ? 'text-sky-600' : 'text-violet-600'
                      )} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-stone-800 leading-tight truncate">{activity.action}</p>
                      <p className="text-[11px] text-stone-500 line-clamp-1">{activity.targetType}: {activity.targetName}</p>
                      <p className="text-[10px] text-stone-400">
                        <span className="font-medium">{activity.performedBy}</span> • {new Date(activity.timestamp).toLocaleString('en-MY', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
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
        </div>

        {/* Right — Service Health */}
        <div className="space-y-3">
          <Card padding="sm">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-stone-800 uppercase tracking-wide">Service Health</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => refetchHealth()}
                disabled={healthLoading}
                className="hover:bg-stone-100 px-1.5"
              >
                <RefreshCw className={cn('h-3.5 w-3.5 text-stone-600', healthLoading && 'animate-spin')} />
              </Button>
            </div>

            {healthLoading ? (
              <div className="flex justify-center py-6">
                <Spinner />
              </div>
            ) : (
              <div className="space-y-1.5">
                {healthData?.checks.map((check: SystemHealthCheck) => (
                  <div
                    key={check.checkId}
                    className={cn(
                      'flex items-center gap-2 px-2 py-1.5 rounded-md border',
                      check.status === 'HEALTHY' ? 'bg-emerald-50/60 border-emerald-200' :
                      check.status === 'DEGRADED' ? 'bg-amber-50/60 border-amber-200' :
                      'bg-rose-50/60 border-rose-200'
                    )}
                  >
                    <div className={cn(
                      'p-1 rounded flex-shrink-0',
                      check.status === 'HEALTHY' ? 'bg-emerald-100' :
                      check.status === 'DEGRADED' ? 'bg-amber-100' : 'bg-rose-100'
                    )}>
                      {check.status === 'HEALTHY' ? (
                        <CheckCircle className="h-3 w-3 text-emerald-600" />
                      ) : check.status === 'DEGRADED' ? (
                        <AlertTriangle className="h-3 w-3 text-amber-600" />
                      ) : (
                        <XCircle className="h-3 w-3 text-rose-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-stone-800 leading-tight truncate">{check.name}</p>
                      <p className="text-[10px] text-stone-500 line-clamp-1">{check.message}</p>
                    </div>
                    {check.responseTime && (
                      <span className="text-[10px] font-medium text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded">
                        {check.responseTime}ms
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
