import { useState } from 'react'
import {
  FileText,
  Search,
  Download,
  Shield,
  Clock,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Globe,
  Monitor,
  AlertTriangle,
  Eye,
  Edit,
  Trash2,
  Plus,
  Lock,
  Unlock,
  LogIn,
  LogOut,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import { useAuditLogs } from '@/lib/hooks/useAdmin'
import { cn } from '@/lib/utils/cn'
import type { AuditAction, AuditEntityType } from '@/types'

const actionConfig: Record<AuditAction, { label: string; icon: typeof Eye; color: string }> = {
  CREATE: { label: 'Create', icon: Plus, color: 'text-success-600' },
  READ: { label: 'Read', icon: Eye, color: 'text-info-600' },
  UPDATE: { label: 'Update', icon: Edit, color: 'text-warning-600' },
  DELETE: { label: 'Delete', icon: Trash2, color: 'text-error-600' },
  LOGIN: { label: 'Login', icon: LogIn, color: 'text-success-600' },
  LOGOUT: { label: 'Logout', icon: LogOut, color: 'text-neutral-600' },
  EXPORT: { label: 'Export', icon: Download, color: 'text-info-600' },
  IMPORT: { label: 'Import', icon: Plus, color: 'text-primary-600' },
  APPROVE: { label: 'Approve', icon: Shield, color: 'text-success-600' },
  REJECT: { label: 'Reject', icon: AlertTriangle, color: 'text-error-600' },
  LOCK: { label: 'Lock', icon: Lock, color: 'text-error-600' },
  UNLOCK: { label: 'Unlock', icon: Unlock, color: 'text-success-600' },
}

const entityTypeLabels: Record<AuditEntityType, string> = {
  USER: 'User',
  PROPOSAL: 'Proposal',
  PROJECT: 'Project',
  MEETING: 'Meeting',
  REPORT: 'Report',
  MILESTONE: 'Milestone',
  PARAMETER: 'Parameter',
  CYCLE: 'Cycle',
  DEADLINE: 'Deadline',
  INTEGRATION: 'Integration',
  BACKUP: 'Backup',
}

export function AuditLogs() {
  const [searchQuery, setSearchQuery] = useState('')
  const [actionFilter, setActionFilter] = useState<AuditAction | 'ALL'>('ALL')
  const [entityFilter, setEntityFilter] = useState<AuditEntityType | 'ALL'>('ALL')
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const [expandedLog, setExpandedLog] = useState<string | null>(null)
  const [page, setPage] = useState(1)

  const { data, isLoading, refetch } = useAuditLogs({
    action: actionFilter !== 'ALL' ? actionFilter : undefined,
    entityType: entityFilter !== 'ALL' ? entityFilter : undefined,
    startDate: dateRange.start || undefined,
    endDate: dateRange.end || undefined,
    page,
    limit: 20,
  })

  const filteredLogs = data?.logs.filter((log) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      log.userName.toLowerCase().includes(query) ||
      log.entityType.toLowerCase().includes(query) ||
      log.action.toLowerCase().includes(query) ||
      log.ipAddress?.toLowerCase().includes(query)
    )
  })

  const handleExport = () => {
    console.log('Exporting audit logs...')
    // Implement export functionality
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    )
  }

  const stats = {
    total: data?.total ?? 0,
    today: data?.logs.filter((l) => {
      const logDate = new Date(l.timestamp).toDateString()
      const today = new Date().toDateString()
      return logDate === today
    }).length ?? 0,
    security: data?.logs.filter((l) => ['LOGIN', 'LOGOUT', 'LOCK', 'UNLOCK'].includes(l.action)).length ?? 0,
    changes: data?.logs.filter((l) => ['CREATE', 'UPDATE', 'DELETE'].includes(l.action)).length ?? 0,
  }

  return (
    <div className="space-y-4 lg:space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
            <FileText className="h-7 w-7 text-primary-600" />
            Audit Logs
          </h1>
          <p className="text-neutral-600 mt-1">
            Track all system activities and user actions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="secondary" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-neutral-500">Total Logs</p>
          <p className="text-2xl font-bold text-neutral-900">{stats.total.toLocaleString()}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-neutral-500">Today</p>
          <p className="text-2xl font-bold text-info-600">{stats.today}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-neutral-500">Security Events</p>
          <p className="text-2xl font-bold text-warning-600">{stats.security}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-neutral-500">Data Changes</p>
          <p className="text-2xl font-bold text-success-600">{stats.changes}</p>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <Input
              type="text"
              placeholder="Search by user, entity, or IP..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value as AuditAction | 'ALL')}
            className="px-3 py-2 border border-neutral-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500"
          >
            <option value="ALL">All Actions</option>
            {Object.entries(actionConfig).map(([key, config]) => (
              <option key={key} value={key}>{config.label}</option>
            ))}
          </select>
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value as AuditEntityType | 'ALL')}
            className="px-3 py-2 border border-neutral-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500"
          >
            <option value="ALL">All Entities</option>
            {Object.entries(entityTypeLabels).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="w-36"
            />
            <span className="text-neutral-400">to</span>
            <Input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="w-36"
            />
          </div>
        </div>
      </Card>

      {/* Logs List */}
      <div className="space-y-2">
        {filteredLogs && filteredLogs.length > 0 ? (
          filteredLogs.map((log) => {
            const action = actionConfig[log.action]
            const ActionIcon = action?.icon || Eye
            const isExpanded = expandedLog === log.logId

            return (
              <Card key={log.logId} className="overflow-hidden">
                <div
                  className="p-4 cursor-pointer hover:bg-neutral-50 transition-colors"
                  onClick={() => setExpandedLog(isExpanded ? null : log.logId)}
                >
                  <div className="flex items-center gap-4">
                    {/* Action Icon */}
                    <div className={cn(
                      'p-2 rounded-lg',
                      log.action === 'DELETE' || log.action === 'LOCK' || log.action === 'REJECT' ? 'bg-error-50' :
                      log.action === 'CREATE' || log.action === 'APPROVE' || log.action === 'UNLOCK' || log.action === 'LOGIN' ? 'bg-success-50' :
                      log.action === 'UPDATE' ? 'bg-warning-50' :
                      'bg-neutral-100'
                    )}>
                      <ActionIcon className={cn('h-5 w-5', action?.color || 'text-neutral-600')} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-neutral-900">{log.userName}</span>
                        <span className={cn(
                          'px-2 py-0.5 rounded-full text-xs font-medium',
                          log.action === 'DELETE' || log.action === 'LOCK' || log.action === 'REJECT' ? 'bg-error-50 text-error-600' :
                          log.action === 'CREATE' || log.action === 'APPROVE' || log.action === 'UNLOCK' || log.action === 'LOGIN' ? 'bg-success-50 text-success-600' :
                          log.action === 'UPDATE' ? 'bg-warning-50 text-warning-600' :
                          'bg-neutral-100 text-neutral-600'
                        )}>
                          {action?.label || log.action}
                        </span>
                        <span className="text-neutral-500">
                          {entityTypeLabels[log.entityType] || log.entityType}
                        </span>
                        {log.entityName && (
                          <span className="text-neutral-900 font-medium truncate max-w-[200px]">
                            "{log.entityName}"
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-neutral-500">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                        {log.ipAddress && (
                          <span className="flex items-center gap-1">
                            <Globe className="h-3.5 w-3.5" />
                            {log.ipAddress}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Expand Icon */}
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5 text-neutral-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-neutral-400" />
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-neutral-200 bg-neutral-50">
                    <div className="pt-4 space-y-4">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-neutral-500">Log ID</p>
                          <p className="font-mono text-neutral-900">{log.logId}</p>
                        </div>
                        <div>
                          <p className="text-neutral-500">User ID</p>
                          <p className="font-mono text-neutral-900">{log.userId}</p>
                        </div>
                        <div>
                          <p className="text-neutral-500">Entity ID</p>
                          <p className="font-mono text-neutral-900">{log.entityId || '-'}</p>
                        </div>
                        <div>
                          <p className="text-neutral-500">Session ID</p>
                          <p className="font-mono text-neutral-900 truncate">{log.sessionId || '-'}</p>
                        </div>
                      </div>

                      {/* Device Info */}
                      {log.userAgent && (
                        <div>
                          <p className="text-sm text-neutral-500 mb-1">Device / Browser</p>
                          <div className="p-2 bg-white rounded border border-neutral-200 text-sm text-neutral-700 flex items-center gap-2">
                            <Monitor className="h-4 w-4 text-neutral-400" />
                            <span className="truncate">{log.userAgent}</span>
                          </div>
                        </div>
                      )}

                      {/* Changes */}
                      {log.changes && (
                        <div>
                          <p className="text-sm text-neutral-500 mb-2">Changes</p>
                          <div className="space-y-2">
                            {log.changes.before && (
                              <div className="p-3 bg-error-50 rounded-lg">
                                <p className="text-xs font-medium text-error-700 mb-1">Before</p>
                                <pre className="text-xs text-error-800 overflow-x-auto">
                                  {JSON.stringify(log.changes.before, null, 2)}
                                </pre>
                              </div>
                            )}
                            {log.changes.after && (
                              <div className="p-3 bg-success-50 rounded-lg">
                                <p className="text-xs font-medium text-success-700 mb-1">After</p>
                                <pre className="text-xs text-success-800 overflow-x-auto">
                                  {JSON.stringify(log.changes.after, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Additional Details */}
                      {log.details && (
                        <div>
                          <p className="text-sm text-neutral-500 mb-1">Additional Details</p>
                          <div className="p-3 bg-neutral-100 rounded-lg">
                            <pre className="text-xs text-neutral-700 overflow-x-auto">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            )
          })
        ) : (
          <Card className="p-12 text-center">
            <FileText className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-neutral-900">No audit logs found</h3>
            <p className="text-neutral-500 mt-1">
              {searchQuery || actionFilter !== 'ALL' || entityFilter !== 'ALL' || dateRange.start || dateRange.end
                ? 'Try adjusting your filters'
                : 'No activities have been logged yet'}
            </p>
          </Card>
        )}
      </div>

      {/* Pagination */}
      {data && data.logs.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-neutral-600">
              Showing {((page - 1) * 20) + 1} - {Math.min(page * 20, data.total)} of {data.total.toLocaleString()} logs
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="px-3 py-1 bg-neutral-100 rounded text-neutral-700">
                Page {page}
              </span>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page * 20 >= data.total}
              >
                Next
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
