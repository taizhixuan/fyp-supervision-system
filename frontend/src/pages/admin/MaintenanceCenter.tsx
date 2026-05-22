import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Wrench,
  HardDrive,
  Database,
  RefreshCw,
  Trash2,
  Download,
  Upload,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Shield,
  Calendar,
  FileText,
  History,
  Sparkles,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import {
  useBackups,
  useSystemHealthChecks,
  useTriggerBackup,
  useRestoreBackup,
  useRunCleanup,
} from '@/lib/hooks/useAdmin'
import { ROUTES } from '@/lib/constants/routes'
import { cn } from '@/lib/utils/cn'
import type { BackupInfo, SystemHealthCheck, CleanupOptions } from '@/types'

export function MaintenanceCenter() {
  const [showBackupModal, setShowBackupModal] = useState(false)
  const [showRestoreModal, setShowRestoreModal] = useState(false)
  const [showCleanupModal, setShowCleanupModal] = useState(false)
  const [selectedBackup, setSelectedBackup] = useState<BackupInfo | null>(null)
  const [cleanupOptions, setCleanupOptions] = useState<CleanupOptions>({
    clearTempFiles: true,
    clearOldLogs: true,
    clearExpiredSessions: true,
    clearOrphanedFiles: false,
    olderThanDays: 30,
  })

  const { data: backupsData, isLoading: backupsLoading, refetch: refetchBackups } = useBackups()
  const { data: healthData, isLoading: healthLoading, refetch: refetchHealth } = useSystemHealthChecks()
  const triggerBackupMutation = useTriggerBackup()
  const restoreBackupMutation = useRestoreBackup()
  const runCleanupMutation = useRunCleanup()

  const handleTriggerBackup = async (type: 'FULL' | 'INCREMENTAL' | 'DATABASE') => {
    try {
      await triggerBackupMutation.mutateAsync({ type })
      setShowBackupModal(false)
      refetchBackups()
    } catch (error) {
      console.error('Failed to trigger backup:', error)
    }
  }

  const handleRestore = async () => {
    if (!selectedBackup) return
    try {
      await restoreBackupMutation.mutateAsync(selectedBackup.backupId)
      setShowRestoreModal(false)
      setSelectedBackup(null)
    } catch (error) {
      console.error('Failed to restore backup:', error)
    }
  }

  const handleCleanup = async () => {
    try {
      await runCleanupMutation.mutateAsync(cleanupOptions)
      setShowCleanupModal(false)
    } catch (error) {
      console.error('Failed to run cleanup:', error)
    }
  }

  const getHealthStatus = (checks: SystemHealthCheck[]) => {
    if (checks.some((c) => c.status === 'UNHEALTHY')) return 'UNHEALTHY'
    if (checks.some((c) => c.status === 'DEGRADED')) return 'DEGRADED'
    return 'HEALTHY'
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (backupsLoading || healthLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    )
  }

  const overallHealth = healthData?.checks ? getHealthStatus(healthData.checks) : 'UNKNOWN'

  return (
    <div className="space-y-3 lg:space-y-4">
      {/* Header */}
      <div className="relative bg-gradient-to-br from-stone-800 via-stone-800 to-stone-900 rounded-xl p-3 sm:p-4 text-white shadow-md overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-amber-500/20 rounded-xl flex items-center justify-center ring-1 ring-amber-500/30">
              <Wrench className="h-7 w-7 text-amber-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                Maintenance Center
                <Sparkles className="h-5 w-5 text-amber-400" />
              </h1>
              <p className="text-stone-300 text-xs">
                System backups, health checks, and maintenance operations
              </p>
            </div>
          </div>
          <Link to={ROUTES.ADMIN.JOB_HISTORY}>
            <Button variant="secondary" className="border-stone-600 text-white hover:bg-stone-700">
              <History className="h-4 w-4 mr-2" />
              View Job History
            </Button>
          </Link>
        </div>
      </div>

      {/* System Health Status */}
      <Card className={cn(
        'p-4 border-l-4 rounded-xl',
        overallHealth === 'HEALTHY' ? 'border-l-emerald-500 bg-gradient-to-r from-emerald-50 to-emerald-100 border-emerald-200' :
        overallHealth === 'DEGRADED' ? 'border-l-amber-500 bg-gradient-to-r from-amber-50 to-amber-100 border-amber-200' :
        'border-l-rose-500 bg-gradient-to-r from-rose-50 to-rose-100 border-rose-200'
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {overallHealth === 'HEALTHY' ? (
              <CheckCircle className="h-6 w-6 text-emerald-600" />
            ) : overallHealth === 'DEGRADED' ? (
              <AlertTriangle className="h-6 w-6 text-amber-600" />
            ) : (
              <XCircle className="h-6 w-6 text-rose-600" />
            )}
            <div>
              <h3 className="font-semibold text-stone-900">
                System Health: {overallHealth}
              </h3>
              <p className="text-sm text-stone-600">
                {healthData?.checks.filter((c) => c.status === 'HEALTHY').length} of {healthData?.checks.length} services healthy
              </p>
            </div>
          </div>
          <Button variant="secondary" size="sm" onClick={() => refetchHealth()} className="border-stone-300 hover:bg-white/50">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card
          className="cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-300 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 focus:outline-none focus:ring-2 focus:ring-amber-500"
          role="button"
          tabIndex={0}
          aria-label="Create backup"
          onClick={() => setShowBackupModal(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              setShowBackupModal(true)
            }
          }}
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-100 rounded-xl ring-1 ring-amber-200">
              <HardDrive className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <h3 className="font-semibold text-stone-900">Create Backup</h3>
              <p className="text-sm text-stone-500">Full or incremental backup</p>
            </div>
          </div>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-300 border-sky-200 bg-gradient-to-br from-sky-50 to-cyan-50 focus:outline-none focus:ring-2 focus:ring-sky-500"
          role="button"
          tabIndex={0}
          aria-label="Restore backup"
          onClick={() => setShowRestoreModal(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              setShowRestoreModal(true)
            }
          }}
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-sky-100 rounded-xl ring-1 ring-sky-200">
              <Upload className="h-6 w-6 text-sky-600" />
            </div>
            <div>
              <h3 className="font-semibold text-stone-900">Restore Backup</h3>
              <p className="text-sm text-stone-500">Restore from backup point</p>
            </div>
          </div>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-300 border-rose-200 bg-gradient-to-br from-rose-50 to-pink-50 focus:outline-none focus:ring-2 focus:ring-rose-500"
          role="button"
          tabIndex={0}
          aria-label="System cleanup"
          onClick={() => setShowCleanupModal(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              setShowCleanupModal(true)
            }
          }}
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-rose-100 rounded-xl ring-1 ring-rose-200">
              <Trash2 className="h-6 w-6 text-rose-600" />
            </div>
            <div>
              <h3 className="font-semibold text-stone-900">System Cleanup</h3>
              <p className="text-sm text-stone-500">Clear temp files and logs</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Health Checks Detail */}
      <Card className="border-stone-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-stone-900 flex items-center gap-2">
            <Shield className="h-5 w-5 text-amber-600" />
            Service Health Checks
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetchHealth()}
            disabled={healthLoading}
            className="hover:bg-stone-100"
          >
            <RefreshCw className={cn('h-4 w-4', healthLoading && 'animate-spin')} />
          </Button>
        </div>

        <div className="space-y-3">
          {healthData?.checks.map((check) => (
            <div
              key={check.checkId}
              className={cn(
                'flex items-center justify-between p-4 rounded-xl border-l-4',
                check.status === 'HEALTHY' ? 'bg-emerald-50/50 border-l-emerald-500' :
                check.status === 'DEGRADED' ? 'bg-amber-50/50 border-l-amber-500' :
                'bg-rose-50/50 border-l-rose-500'
              )}
            >
              <div className="flex items-center gap-3">
                {check.status === 'HEALTHY' ? (
                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                ) : check.status === 'DEGRADED' ? (
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-rose-600" />
                )}
                <div>
                  <h4 className="font-medium text-stone-900">{check.name}</h4>
                  <p className="text-sm text-stone-500">{check.message}</p>
                </div>
              </div>
              <div className="text-right">
                <span className={cn(
                  'px-3 py-1 rounded-xl text-xs font-medium',
                  check.status === 'HEALTHY' ? 'bg-emerald-100 text-emerald-700' :
                  check.status === 'DEGRADED' ? 'bg-amber-100 text-amber-700' :
                  'bg-rose-100 text-rose-700'
                )}>
                  {check.status}
                </span>
                {check.responseTime && (
                  <p className="text-xs text-stone-400 mt-1">{check.responseTime}ms</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Recent Backups */}
      <Card className="border-stone-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-stone-900 flex items-center gap-2">
            <Database className="h-5 w-5 text-amber-600" />
            Recent Backups
          </h3>
          <Button variant="ghost" size="sm" onClick={() => refetchBackups()} className="hover:bg-stone-100">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {backupsData?.backups && backupsData.backups.length > 0 ? (
          <div className="space-y-3">
            {backupsData.backups.slice(0, 5).map((backup) => (
              <div
                key={backup.backupId}
                className={cn(
                  'flex items-center justify-between p-4 border rounded-xl border-l-4',
                  backup.status === 'AVAILABLE' ? 'border-l-emerald-500 bg-emerald-50/30 border-emerald-200' :
                  'border-l-rose-500 bg-rose-50/30 border-rose-200'
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'p-2 rounded-xl',
                    backup.status === 'AVAILABLE' ? 'bg-emerald-100' : 'bg-rose-100'
                  )}>
                    {backup.status === 'AVAILABLE' ? (
                      <CheckCircle className="h-5 w-5 text-emerald-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-rose-600" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-stone-900">{backup.name}</h4>
                      <span className="px-2 py-0.5 bg-stone-100 text-stone-600 rounded-xl text-xs">
                        {backup.type}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-sm text-stone-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(backup.createdAt).toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <HardDrive className="h-3.5 w-3.5" />
                        {formatBytes(backup.size)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {backup.status === 'COMPLETED' && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => console.log('Download:', backup.backupId)}
                        className="hover:bg-stone-100"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedBackup(backup)
                          setShowRestoreModal(true)
                        }}
                        className="hover:bg-stone-100"
                      >
                        <Upload className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-stone-500">
            <Database className="h-8 w-8 mx-auto mb-2 text-stone-300" />
            <p>No backups found</p>
          </div>
        )}
      </Card>

      {/* Scheduled Maintenance */}
      <Card className="border-stone-200">
        <h3 className="font-semibold text-stone-900 mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5 text-amber-600" />
          Scheduled Maintenance
        </h3>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-50/50 to-orange-50/50 rounded-xl border border-amber-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-xl">
                <HardDrive className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h4 className="font-medium text-stone-900">Daily Database Backup</h4>
                <p className="text-sm text-stone-500">Every day at 3:00 AM</p>
              </div>
            </div>
            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-xl text-xs font-medium">
              Active
            </span>
          </div>

          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-rose-50/50 to-pink-50/50 rounded-xl border border-rose-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-rose-100 rounded-xl">
                <Trash2 className="h-5 w-5 text-rose-600" />
              </div>
              <div>
                <h4 className="font-medium text-stone-900">Weekly Cleanup</h4>
                <p className="text-sm text-stone-500">Every Sunday at 2:00 AM</p>
              </div>
            </div>
            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-xl text-xs font-medium">
              Active
            </span>
          </div>

          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-sky-50/50 to-cyan-50/50 rounded-xl border border-sky-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-sky-100 rounded-xl">
                <FileText className="h-5 w-5 text-sky-600" />
              </div>
              <div>
                <h4 className="font-medium text-stone-900">Monthly Full Backup</h4>
                <p className="text-sm text-stone-500">1st of every month at 1:00 AM</p>
              </div>
            </div>
            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-xl text-xs font-medium">
              Active
            </span>
          </div>
        </div>
      </Card>

      {/* Backup Modal */}
      {showBackupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <Card className="w-full max-w-md border-stone-200">
            <h2 className="text-lg font-semibold text-stone-900 mb-4">Create Backup</h2>
            <p className="text-sm text-stone-600 mb-4">
              Select the type of backup to create:
            </p>

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => handleTriggerBackup('FULL')}
                disabled={triggerBackupMutation.isPending}
                className="w-full p-4 border border-amber-200 rounded-xl text-left hover:bg-amber-50 transition-colors"
              >
                <h4 className="font-medium text-stone-900">Full Backup</h4>
                <p className="text-sm text-stone-500">Complete system backup including all data and files</p>
              </button>

              <button
                type="button"
                onClick={() => handleTriggerBackup('INCREMENTAL')}
                disabled={triggerBackupMutation.isPending}
                className="w-full p-4 border border-amber-200 rounded-xl text-left hover:bg-amber-50 transition-colors"
              >
                <h4 className="font-medium text-stone-900">Incremental Backup</h4>
                <p className="text-sm text-stone-500">Only changes since last backup</p>
              </button>

              <button
                type="button"
                onClick={() => handleTriggerBackup('DATABASE')}
                disabled={triggerBackupMutation.isPending}
                className="w-full p-4 border border-amber-200 rounded-xl text-left hover:bg-amber-50 transition-colors"
              >
                <h4 className="font-medium text-stone-900">Database Only</h4>
                <p className="text-sm text-stone-500">Database backup without files</p>
              </button>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="secondary"
                onClick={() => setShowBackupModal(false)}
                disabled={triggerBackupMutation.isPending}
                className="border-stone-300"
              >
                Cancel
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Restore Modal */}
      {showRestoreModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <Card className="w-full max-w-lg border-stone-200">
            <h2 className="text-lg font-semibold text-stone-900 mb-4">Restore Backup</h2>

            {selectedBackup ? (
              <div className="space-y-4">
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-amber-800">Warning</h4>
                      <p className="text-sm text-amber-700 mt-1">
                        Restoring this backup will overwrite current data. This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-stone-50 rounded-xl border border-stone-200">
                  <h4 className="font-medium text-stone-900">{selectedBackup.name}</h4>
                  <p className="text-sm text-stone-500 mt-1">
                    Created: {new Date(selectedBackup.createdAt).toLocaleString()}
                  </p>
                  <p className="text-sm text-stone-500">
                    Size: {formatBytes(selectedBackup.size)}
                  </p>
                </div>

                <div className="flex justify-end gap-3">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setShowRestoreModal(false)
                      setSelectedBackup(null)
                    }}
                    className="border-stone-300"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleRestore}
                    disabled={restoreBackupMutation.isPending}
                    className="bg-amber-600 hover:bg-amber-700"
                  >
                    {restoreBackupMutation.isPending ? (
                      <Spinner size="sm" className="mr-2" />
                    ) : (
                      <Upload className="h-4 w-4 mr-2" />
                    )}
                    Restore Backup
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-stone-600 mb-4">
                  Select a backup to restore:
                </p>
                {backupsData?.backups
                  .filter((b) => b.status === 'COMPLETED')
                  .slice(0, 5)
                  .map((backup) => (
                    <button
                      key={backup.backupId}
                      type="button"
                      onClick={() => setSelectedBackup(backup)}
                      className="w-full p-4 border border-sky-200 rounded-xl text-left hover:bg-sky-50 transition-colors"
                    >
                      <h4 className="font-medium text-stone-900">{backup.name}</h4>
                      <p className="text-sm text-stone-500">
                        {new Date(backup.createdAt).toLocaleString()} • {formatBytes(backup.size)}
                      </p>
                    </button>
                  ))}
                <div className="flex justify-end pt-4">
                  <Button variant="secondary" onClick={() => setShowRestoreModal(false)} className="border-stone-300">
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Cleanup Modal */}
      {showCleanupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <Card className="w-full max-w-md border-stone-200">
            <h2 className="text-lg font-semibold text-stone-900 mb-4">System Cleanup</h2>
            <p className="text-sm text-stone-600 mb-4">
              Select items to clean up:
            </p>

            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3 border border-rose-200 rounded-xl cursor-pointer hover:bg-rose-50 transition-colors">
                <input
                  type="checkbox"
                  checked={cleanupOptions.clearTempFiles}
                  onChange={(e) => setCleanupOptions({ ...cleanupOptions, clearTempFiles: e.target.checked })}
                  className="accent-rose-600"
                />
                <div>
                  <span className="font-medium text-stone-900">Temporary Files</span>
                  <p className="text-sm text-stone-500">Clear temporary uploads and cache files</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 border border-rose-200 rounded-xl cursor-pointer hover:bg-rose-50 transition-colors">
                <input
                  type="checkbox"
                  checked={cleanupOptions.clearOldLogs}
                  onChange={(e) => setCleanupOptions({ ...cleanupOptions, clearOldLogs: e.target.checked })}
                  className="accent-rose-600"
                />
                <div>
                  <span className="font-medium text-stone-900">Old Logs</span>
                  <p className="text-sm text-stone-500">Clear logs older than {cleanupOptions.olderThanDays} days</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 border border-rose-200 rounded-xl cursor-pointer hover:bg-rose-50 transition-colors">
                <input
                  type="checkbox"
                  checked={cleanupOptions.clearExpiredSessions}
                  onChange={(e) => setCleanupOptions({ ...cleanupOptions, clearExpiredSessions: e.target.checked })}
                  className="accent-rose-600"
                />
                <div>
                  <span className="font-medium text-stone-900">Expired Sessions</span>
                  <p className="text-sm text-stone-500">Remove expired user sessions</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 border border-rose-200 rounded-xl cursor-pointer hover:bg-rose-50 transition-colors">
                <input
                  type="checkbox"
                  checked={cleanupOptions.clearOrphanedFiles}
                  onChange={(e) => setCleanupOptions({ ...cleanupOptions, clearOrphanedFiles: e.target.checked })}
                  className="accent-rose-600"
                />
                <div>
                  <span className="font-medium text-stone-900">Orphaned Files</span>
                  <p className="text-sm text-stone-500">Remove files not linked to any record</p>
                </div>
              </label>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button variant="secondary" onClick={() => setShowCleanupModal(false)} className="border-stone-300">
                Cancel
              </Button>
              <Button
                onClick={handleCleanup}
                disabled={runCleanupMutation.isPending || !Object.values(cleanupOptions).some(Boolean)}
                className="bg-rose-600 hover:bg-rose-700"
              >
                {runCleanupMutation.isPending ? (
                  <Spinner size="sm" className="mr-2" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Run Cleanup
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
