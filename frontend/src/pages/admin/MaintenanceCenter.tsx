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
  Play,
  Shield,
  Calendar,
  FileText,
  ChevronRight,
  History,
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
            <Wrench className="h-7 w-7 text-primary-600" />
            Maintenance Center
          </h1>
          <p className="text-neutral-600 mt-1">
            System backups, health checks, and maintenance operations
          </p>
        </div>
        <Link to={ROUTES.ADMIN.JOB_HISTORY}>
          <Button variant="outline">
            <History className="h-4 w-4 mr-2" />
            View Job History
          </Button>
        </Link>
      </div>

      {/* System Health Status */}
      <Card className={cn(
        'p-4 border-l-4',
        overallHealth === 'HEALTHY' ? 'border-l-success-500 bg-success-50' :
        overallHealth === 'DEGRADED' ? 'border-l-warning-500 bg-warning-50' :
        'border-l-error-500 bg-error-50'
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {overallHealth === 'HEALTHY' ? (
              <CheckCircle className="h-6 w-6 text-success-600" />
            ) : overallHealth === 'DEGRADED' ? (
              <AlertTriangle className="h-6 w-6 text-warning-600" />
            ) : (
              <XCircle className="h-6 w-6 text-error-600" />
            )}
            <div>
              <h3 className="font-semibold text-neutral-900">
                System Health: {overallHealth}
              </h3>
              <p className="text-sm text-neutral-600">
                {healthData?.checks.filter((c) => c.status === 'HEALTHY').length} of {healthData?.checks.length} services healthy
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetchHealth()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card
          className="p-6 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setShowBackupModal(true)}
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary-50 rounded-lg">
              <HardDrive className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <h3 className="font-semibold text-neutral-900">Create Backup</h3>
              <p className="text-sm text-neutral-500">Full or incremental backup</p>
            </div>
          </div>
        </Card>

        <Card
          className="p-6 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setShowRestoreModal(true)}
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-info-50 rounded-lg">
              <Upload className="h-6 w-6 text-info-600" />
            </div>
            <div>
              <h3 className="font-semibold text-neutral-900">Restore Backup</h3>
              <p className="text-sm text-neutral-500">Restore from backup point</p>
            </div>
          </div>
        </Card>

        <Card
          className="p-6 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setShowCleanupModal(true)}
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-warning-50 rounded-lg">
              <Trash2 className="h-6 w-6 text-warning-600" />
            </div>
            <div>
              <h3 className="font-semibold text-neutral-900">System Cleanup</h3>
              <p className="text-sm text-neutral-500">Clear temp files and logs</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Health Checks Detail */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-neutral-900 flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary-600" />
            Service Health Checks
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

        <div className="space-y-3">
          {healthData?.checks.map((check) => (
            <div
              key={check.checkId}
              className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg"
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
                  <h4 className="font-medium text-neutral-900">{check.name}</h4>
                  <p className="text-sm text-neutral-500">{check.message}</p>
                </div>
              </div>
              <div className="text-right">
                <span className={cn(
                  'px-2 py-0.5 rounded-full text-xs font-medium',
                  check.status === 'HEALTHY' ? 'bg-success-50 text-success-600' :
                  check.status === 'DEGRADED' ? 'bg-warning-50 text-warning-600' :
                  'bg-error-50 text-error-600'
                )}>
                  {check.status}
                </span>
                {check.responseTime && (
                  <p className="text-xs text-neutral-400 mt-1">{check.responseTime}ms</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Recent Backups */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-neutral-900 flex items-center gap-2">
            <Database className="h-5 w-5 text-primary-600" />
            Recent Backups
          </h3>
          <Button variant="ghost" size="sm" onClick={() => refetchBackups()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {backupsData?.backups && backupsData.backups.length > 0 ? (
          <div className="space-y-3">
            {backupsData.backups.slice(0, 5).map((backup) => (
              <div
                key={backup.backupId}
                className="flex items-center justify-between p-4 border border-neutral-200 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'p-2 rounded-lg',
                    backup.status === 'COMPLETED' ? 'bg-success-50' :
                    backup.status === 'IN_PROGRESS' ? 'bg-info-50' :
                    'bg-error-50'
                  )}>
                    {backup.status === 'COMPLETED' ? (
                      <CheckCircle className="h-5 w-5 text-success-600" />
                    ) : backup.status === 'IN_PROGRESS' ? (
                      <RefreshCw className="h-5 w-5 text-info-600 animate-spin" />
                    ) : (
                      <XCircle className="h-5 w-5 text-error-600" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-neutral-900">{backup.name}</h4>
                      <span className="px-2 py-0.5 bg-neutral-100 text-neutral-600 rounded text-xs">
                        {backup.type}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-sm text-neutral-500">
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
          <div className="text-center py-8 text-neutral-500">
            <Database className="h-8 w-8 mx-auto mb-2 text-neutral-300" />
            <p>No backups found</p>
          </div>
        )}
      </Card>

      {/* Scheduled Maintenance */}
      <Card className="p-6">
        <h3 className="font-semibold text-neutral-900 mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary-600" />
          Scheduled Maintenance
        </h3>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-50 rounded-lg">
                <HardDrive className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <h4 className="font-medium text-neutral-900">Daily Database Backup</h4>
                <p className="text-sm text-neutral-500">Every day at 3:00 AM</p>
              </div>
            </div>
            <span className="px-2 py-0.5 bg-success-50 text-success-600 rounded-full text-xs font-medium">
              Active
            </span>
          </div>

          <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-warning-50 rounded-lg">
                <Trash2 className="h-5 w-5 text-warning-600" />
              </div>
              <div>
                <h4 className="font-medium text-neutral-900">Weekly Cleanup</h4>
                <p className="text-sm text-neutral-500">Every Sunday at 2:00 AM</p>
              </div>
            </div>
            <span className="px-2 py-0.5 bg-success-50 text-success-600 rounded-full text-xs font-medium">
              Active
            </span>
          </div>

          <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-info-50 rounded-lg">
                <FileText className="h-5 w-5 text-info-600" />
              </div>
              <div>
                <h4 className="font-medium text-neutral-900">Monthly Full Backup</h4>
                <p className="text-sm text-neutral-500">1st of every month at 1:00 AM</p>
              </div>
            </div>
            <span className="px-2 py-0.5 bg-success-50 text-success-600 rounded-full text-xs font-medium">
              Active
            </span>
          </div>
        </div>
      </Card>

      {/* Backup Modal */}
      {showBackupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <Card className="w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">Create Backup</h2>
            <p className="text-sm text-neutral-600 mb-4">
              Select the type of backup to create:
            </p>

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => handleTriggerBackup('FULL')}
                disabled={triggerBackupMutation.isPending}
                className="w-full p-4 border border-neutral-200 rounded-lg text-left hover:bg-neutral-50 transition-colors"
              >
                <h4 className="font-medium text-neutral-900">Full Backup</h4>
                <p className="text-sm text-neutral-500">Complete system backup including all data and files</p>
              </button>

              <button
                type="button"
                onClick={() => handleTriggerBackup('INCREMENTAL')}
                disabled={triggerBackupMutation.isPending}
                className="w-full p-4 border border-neutral-200 rounded-lg text-left hover:bg-neutral-50 transition-colors"
              >
                <h4 className="font-medium text-neutral-900">Incremental Backup</h4>
                <p className="text-sm text-neutral-500">Only changes since last backup</p>
              </button>

              <button
                type="button"
                onClick={() => handleTriggerBackup('DATABASE')}
                disabled={triggerBackupMutation.isPending}
                className="w-full p-4 border border-neutral-200 rounded-lg text-left hover:bg-neutral-50 transition-colors"
              >
                <h4 className="font-medium text-neutral-900">Database Only</h4>
                <p className="text-sm text-neutral-500">Database backup without files</p>
              </button>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowBackupModal(false)}
                disabled={triggerBackupMutation.isPending}
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
          <Card className="w-full max-w-lg p-6">
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">Restore Backup</h2>

            {selectedBackup ? (
              <div className="space-y-4">
                <div className="p-4 bg-warning-50 border border-warning-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-warning-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-warning-800">Warning</h4>
                      <p className="text-sm text-warning-700 mt-1">
                        Restoring this backup will overwrite current data. This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-neutral-50 rounded-lg">
                  <h4 className="font-medium text-neutral-900">{selectedBackup.name}</h4>
                  <p className="text-sm text-neutral-500 mt-1">
                    Created: {new Date(selectedBackup.createdAt).toLocaleString()}
                  </p>
                  <p className="text-sm text-neutral-500">
                    Size: {formatBytes(selectedBackup.size)}
                  </p>
                </div>

                <div className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowRestoreModal(false)
                      setSelectedBackup(null)
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleRestore}
                    disabled={restoreBackupMutation.isPending}
                    className="bg-warning-600 hover:bg-warning-700"
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
                <p className="text-sm text-neutral-600 mb-4">
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
                      className="w-full p-4 border border-neutral-200 rounded-lg text-left hover:bg-neutral-50 transition-colors"
                    >
                      <h4 className="font-medium text-neutral-900">{backup.name}</h4>
                      <p className="text-sm text-neutral-500">
                        {new Date(backup.createdAt).toLocaleString()} • {formatBytes(backup.size)}
                      </p>
                    </button>
                  ))}
                <div className="flex justify-end pt-4">
                  <Button variant="outline" onClick={() => setShowRestoreModal(false)}>
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
          <Card className="w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">System Cleanup</h2>
            <p className="text-sm text-neutral-600 mb-4">
              Select items to clean up:
            </p>

            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3 border border-neutral-200 rounded-lg cursor-pointer hover:bg-neutral-50">
                <input
                  type="checkbox"
                  checked={cleanupOptions.clearTempFiles}
                  onChange={(e) => setCleanupOptions({ ...cleanupOptions, clearTempFiles: e.target.checked })}
                />
                <div>
                  <span className="font-medium text-neutral-900">Temporary Files</span>
                  <p className="text-sm text-neutral-500">Clear temporary uploads and cache files</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 border border-neutral-200 rounded-lg cursor-pointer hover:bg-neutral-50">
                <input
                  type="checkbox"
                  checked={cleanupOptions.clearOldLogs}
                  onChange={(e) => setCleanupOptions({ ...cleanupOptions, clearOldLogs: e.target.checked })}
                />
                <div>
                  <span className="font-medium text-neutral-900">Old Logs</span>
                  <p className="text-sm text-neutral-500">Clear logs older than {cleanupOptions.olderThanDays} days</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 border border-neutral-200 rounded-lg cursor-pointer hover:bg-neutral-50">
                <input
                  type="checkbox"
                  checked={cleanupOptions.clearExpiredSessions}
                  onChange={(e) => setCleanupOptions({ ...cleanupOptions, clearExpiredSessions: e.target.checked })}
                />
                <div>
                  <span className="font-medium text-neutral-900">Expired Sessions</span>
                  <p className="text-sm text-neutral-500">Remove expired user sessions</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 border border-neutral-200 rounded-lg cursor-pointer hover:bg-neutral-50">
                <input
                  type="checkbox"
                  checked={cleanupOptions.clearOrphanedFiles}
                  onChange={(e) => setCleanupOptions({ ...cleanupOptions, clearOrphanedFiles: e.target.checked })}
                />
                <div>
                  <span className="font-medium text-neutral-900">Orphaned Files</span>
                  <p className="text-sm text-neutral-500">Remove files not linked to any record</p>
                </div>
              </label>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setShowCleanupModal(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCleanup}
                disabled={runCleanupMutation.isPending || !Object.values(cleanupOptions).some(Boolean)}
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
