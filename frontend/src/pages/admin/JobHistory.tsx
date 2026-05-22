import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  History,
  Search,
  ArrowLeft,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  HardDrive,
  Trash2,
  Database,
  Mail,
  FileText,
  Pause,
  Calendar,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import { useMaintenanceJobs } from '@/lib/hooks/useAdmin'
import { ROUTES } from '@/lib/constants/routes'
import { cn } from '@/lib/utils/cn'

const jobTypeConfig: Record<string, { label: string; icon: typeof HardDrive; color: string }> = {
  BACKUP: { label: 'Backup', icon: HardDrive, color: 'text-primary-600' },
  RESTORE: { label: 'Restore', icon: Database, color: 'text-info-600' },
  CLEANUP: { label: 'Cleanup', icon: Trash2, color: 'text-warning-600' },
  EMAIL_SYNC: { label: 'Email Sync', icon: Mail, color: 'text-accent-600' },
  REPORT_GENERATION: { label: 'Report', icon: FileText, color: 'text-success-600' },
  DATA_MIGRATION: { label: 'Migration', icon: Database, color: 'text-neutral-600' },
}

const jobStatusConfig: Record<string, { label: string; color: string; bgColor: string; icon: typeof CheckCircle }> = {
  PENDING: { label: 'Pending', color: 'text-neutral-600', bgColor: 'bg-neutral-100', icon: Clock },
  RUNNING: { label: 'Running', color: 'text-info-600', bgColor: 'bg-info-50', icon: RefreshCw },
  COMPLETED: { label: 'Completed', color: 'text-success-600', bgColor: 'bg-success-50', icon: CheckCircle },
  FAILED: { label: 'Failed', color: 'text-error-600', bgColor: 'bg-error-50', icon: XCircle },
  CANCELLED: { label: 'Cancelled', color: 'text-warning-600', bgColor: 'bg-warning-50', icon: Pause },
}

export function JobHistory() {
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('ALL')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const [expandedJob, setExpandedJob] = useState<string | null>(null)

  const { data, isLoading, refetch } = useMaintenanceJobs()

  const filteredJobs = data?.jobs.filter((job) => {
    if (typeFilter !== 'ALL' && job.type !== typeFilter) return false
    if (statusFilter !== 'ALL' && job.status !== statusFilter) return false
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      job.name.toLowerCase().includes(query) ||
      job.type.toLowerCase().includes(query)
    )
  })

  const formatDuration = (startedAt: string, completedAt?: string) => {
    if (!completedAt) return 'In progress...'
    const start = new Date(startedAt).getTime()
    const end = new Date(completedAt).getTime()
    const durationMs = end - start

    if (durationMs < 1000) return `${durationMs}ms`
    if (durationMs < 60000) return `${Math.round(durationMs / 1000)}s`
    if (durationMs < 3600000) return `${Math.round(durationMs / 60000)}m ${Math.round((durationMs % 60000) / 1000)}s`
    return `${Math.round(durationMs / 3600000)}h ${Math.round((durationMs % 3600000) / 60000)}m`
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    )
  }

  const stats = {
    total: data?.jobs.length ?? 0,
    completed: data?.jobs.filter((j) => j.status === 'COMPLETED').length ?? 0,
    failed: data?.jobs.filter((j) => j.status === 'FAILED').length ?? 0,
    running: data?.jobs.filter((j) => j.status === 'RUNNING').length ?? 0,
  }

  return (
    <div className="space-y-3 lg:space-y-4">
      {/* Back */}
      <Link to={ROUTES.ADMIN.MAINTENANCE} className="inline-flex items-center gap-1 text-xs text-neutral-600 hover:text-amber-700">
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Maintenance
      </Link>

      {/* Compact hero with inline stat chips */}
      <div className="relative bg-gradient-to-br from-stone-800 via-stone-800 to-stone-900 rounded-xl p-3 sm:p-4 text-white shadow-md overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="relative flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex-shrink-0 w-9 h-9 bg-amber-500/20 rounded-lg flex items-center justify-center ring-1 ring-amber-500/30">
              <History className="h-5 w-5 text-amber-400" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-white leading-tight">Job History</h1>
              <p className="text-stone-300 text-xs">View maintenance job execution history and logs</p>
            </div>
          </div>
          <Button variant="secondary" size="sm" onClick={() => refetch()} className="border-stone-600 text-white hover:bg-stone-700">
            <RefreshCw className="h-3.5 w-3.5 mr-1" />
            Refresh
          </Button>
        </div>

        {/* Stat chips */}
        <div className="relative mt-3 grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {[
            { label: 'Total', value: stats.total, color: 'text-stone-200' },
            { label: 'Completed', value: stats.completed, color: 'text-emerald-300' },
            { label: 'Failed', value: stats.failed, color: 'text-rose-300' },
            { label: 'Running', value: stats.running, color: 'text-sky-300' },
          ].map((chip) => (
            <div key={chip.label} className="bg-stone-700/40 ring-1 ring-stone-600/40 rounded-md px-2 py-1.5">
              <div className={cn('text-base font-bold leading-none', chip.color)}>{chip.value}</div>
              <p className="text-[10px] text-stone-300 truncate uppercase tracking-wide">{chip.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <Card padding="sm">
        <div className="flex flex-col lg:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <Input
              type="text"
              placeholder="Search jobs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-neutral-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500"
          >
            <option value="ALL">All Types</option>
            {Object.entries(jobTypeConfig).map(([key, config]) => (
              <option key={key} value={key}>{config.label}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-neutral-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500"
          >
            <option value="ALL">All Status</option>
            {Object.entries(jobStatusConfig).map(([key, config]) => (
              <option key={key} value={key}>{config.label}</option>
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

      {/* Jobs List */}
      <div className="space-y-3">
        {filteredJobs && filteredJobs.length > 0 ? (
          filteredJobs.map((job) => {
            const type = jobTypeConfig[job.type] || jobTypeConfig.BACKUP
            const status = jobStatusConfig[job.status]
            const TypeIcon = type.icon
            const StatusIcon = status.icon
            const isExpanded = expandedJob === job.jobId

            return (
              <Card key={job.jobId} className="overflow-hidden">
                <div
                  className="p-4 cursor-pointer hover:bg-neutral-50 transition-colors"
                  onClick={() => setExpandedJob(isExpanded ? null : job.jobId)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        'p-2 rounded-lg',
                        job.status === 'RUNNING' ? 'bg-info-50' :
                        job.status === 'COMPLETED' ? 'bg-success-50' :
                        job.status === 'FAILED' ? 'bg-error-50' :
                        'bg-neutral-100'
                      )}>
                        {job.status === 'RUNNING' ? (
                          <RefreshCw className={cn('h-5 w-5', type.color, 'animate-spin')} />
                        ) : (
                          <TypeIcon className={cn('h-5 w-5', type.color)} />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-neutral-900">{job.name}</h3>
                          <span className={cn(
                            'px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1',
                            status.bgColor,
                            status.color
                          )}>
                            <StatusIcon className="h-3 w-3" />
                            {status.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-neutral-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {new Date(job.startedAt).toLocaleString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {formatDuration(job.startedAt, job.completedAt)}
                          </span>
                          {job.triggeredBy && (
                            <span>by {job.triggeredBy}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {job.progress !== undefined && job.status === 'RUNNING' && (
                        <div className="w-24">
                          <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-info-500 rounded-full transition-all"
                              style={{ width: `${job.progress}%` }}
                            />
                          </div>
                          <p className="text-xs text-neutral-500 text-center mt-1">{job.progress}%</p>
                        </div>
                      )}
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-neutral-400" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-neutral-400" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-neutral-200 bg-neutral-50">
                    <div className="pt-4 space-y-4">
                      {/* Job Details */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-neutral-500">Job ID</p>
                          <p className="font-mono text-neutral-900">{job.jobId}</p>
                        </div>
                        <div>
                          <p className="text-neutral-500">Type</p>
                          <p className="text-neutral-900">{type.label}</p>
                        </div>
                        <div>
                          <p className="text-neutral-500">Started</p>
                          <p className="text-neutral-900">{new Date(job.startedAt).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-neutral-500">Completed</p>
                          <p className="text-neutral-900">
                            {job.completedAt ? new Date(job.completedAt).toLocaleString() : '-'}
                          </p>
                        </div>
                      </div>

                      {/* Error Message */}
                      {job.status === 'FAILED' && job.error && (
                        <div className="p-3 bg-error-50 border border-error-200 rounded-lg">
                          <h4 className="font-medium text-error-800 mb-1">Error</h4>
                          <p className="text-sm text-error-700 font-mono">{job.error}</p>
                        </div>
                      )}

                      {/* Job Output / Logs */}
                      {job.output && (
                        <div>
                          <h4 className="font-medium text-neutral-900 mb-2">Output</h4>
                          <div className="p-3 bg-neutral-900 text-neutral-100 rounded-lg font-mono text-xs overflow-x-auto">
                            <pre>{job.output}</pre>
                          </div>
                        </div>
                      )}

                      {/* Metadata */}
                      {job.metadata && (
                        <div>
                          <h4 className="font-medium text-neutral-900 mb-2">Details</h4>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                            {Object.entries(job.metadata).map(([key, value]) => (
                              <div key={key} className="p-2 bg-white rounded border border-neutral-200">
                                <p className="text-neutral-500 text-xs">{key}</p>
                                <p className="text-neutral-900 font-medium">{String(value)}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      {job.status === 'RUNNING' && (
                        <div className="flex justify-end">
                          <Button variant="secondary" size="sm">
                            <Pause className="h-4 w-4 mr-1" />
                            Cancel Job
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            )
          })
        ) : (
          <Card className="text-center py-8">
            <History className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
            <h3 className="font-medium text-neutral-900">No jobs found</h3>
            <p className="text-neutral-500 mt-1">
              {searchQuery || typeFilter !== 'ALL' || statusFilter !== 'ALL'
                ? 'Try adjusting your filters'
                : 'No maintenance jobs have been run yet'}
            </p>
          </Card>
        )}
      </div>

      {/* Pagination */}
      {filteredJobs && filteredJobs.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-neutral-600">
              Showing {filteredJobs.length} of {data?.jobs.length} jobs
            </span>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" disabled>
                Previous
              </Button>
              <Button variant="secondary" size="sm" disabled>
                Next
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
