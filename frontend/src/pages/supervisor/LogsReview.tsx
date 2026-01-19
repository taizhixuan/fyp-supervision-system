import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  FileText,
  Search,
  Clock,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  GraduationCap,
  Calendar,
  Filter,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import { useLogsForReview } from '@/lib/hooks/useSupervisor'
import { ROUTES } from '@/lib/constants/routes'
import { cn } from '@/lib/utils/cn'
import type { LogStatus } from '@/types'

const statusConfig: Record<LogStatus, { label: string; color: string; bgColor: string; icon: typeof Clock }> = {
  PENDING: { label: 'Pending Review', color: 'text-warning-600', bgColor: 'bg-warning-50', icon: Clock },
  APPROVED: { label: 'Approved', color: 'text-success-600', bgColor: 'bg-success-50', icon: CheckCircle },
  REVISION_REQUIRED: { label: 'Needs Revision', color: 'text-orange-600', bgColor: 'bg-orange-50', icon: AlertCircle },
  SIGNED: { label: 'Signed', color: 'text-primary-600', bgColor: 'bg-primary-50', icon: CheckCircle },
  LOCKED: { label: 'Locked', color: 'text-neutral-600', bgColor: 'bg-neutral-100', icon: CheckCircle },
}

const filterOptions = [
  { value: 'all', label: 'All Logs' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'SIGNED', label: 'Signed' },
]

export function LogsReview() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const { data, isLoading } = useLogsForReview()

  const filteredLogs = data?.logs
    .filter((log) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return (
          log.studentName.toLowerCase().includes(query) ||
          log.activities.toLowerCase().includes(query)
        )
      }
      return true
    })
    .filter((log) => {
      if (statusFilter === 'all') return true
      return log.status === statusFilter
    })
    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())

  const pendingCount = data?.logs.filter((l) => l.status === 'PENDING').length ?? 0

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
            <FileText className="h-7 w-7 text-primary-600" />
            Supervision Logs Review
          </h1>
          <p className="text-neutral-600 mt-1">
            Review and sign weekly supervision logs from your supervisees
          </p>
        </div>
        {pendingCount > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 bg-warning-50 border border-warning-200 rounded-lg">
            <Clock className="h-5 w-5 text-warning-600" />
            <span className="text-sm font-medium text-warning-700">
              {pendingCount} log{pendingCount > 1 ? 's' : ''} awaiting review
            </span>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Status Tabs */}
        <div className="flex items-center gap-1 p-1 bg-neutral-100 rounded-lg">
          {filterOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setStatusFilter(option.value)}
              className={cn(
                'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                statusFilter === option.value
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-600 hover:text-neutral-900'
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <Input
            type="text"
            placeholder="Search by student or content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Logs List */}
      <div className="space-y-4">
        {filteredLogs && filteredLogs.length > 0 ? (
          filteredLogs.map((log) => {
            const status = statusConfig[log.status]
            const StatusIcon = status.icon
            return (
              <Link
                key={log.logId}
                to={ROUTES.SUPERVISOR.LOG_DETAIL.replace(':id', String(log.logId))}
              >
                <Card className={cn(
                  'p-4 hover:shadow-md transition-shadow cursor-pointer',
                  log.status === 'PENDING' && 'border-l-4 border-l-warning-400'
                )}>
                  <div className="flex items-start gap-4">
                    {/* Week Badge */}
                    <div className="w-14 h-14 bg-primary-50 rounded-lg flex flex-col items-center justify-center flex-shrink-0">
                      <span className="text-xs text-primary-600 font-medium">Week</span>
                      <span className="text-xl font-bold text-primary-700">{log.weekNumber}</span>
                    </div>

                    {/* Log Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <GraduationCap className="h-4 w-4 text-neutral-400" />
                            <h3 className="font-semibold text-neutral-900">{log.studentName}</h3>
                          </div>
                          <p className="text-sm text-neutral-500">
                            {new Date(log.weekStartDate).toLocaleDateString('en-MY', {
                              day: 'numeric',
                              month: 'short',
                            })} - {new Date(log.weekEndDate).toLocaleDateString('en-MY', {
                              day: 'numeric',
                              month: 'short',
                            })}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium',
                            status.bgColor,
                            status.color
                          )}>
                            <StatusIcon className="h-3.5 w-3.5" />
                            {status.label}
                          </span>
                          <ChevronRight className="h-5 w-5 text-neutral-400" />
                        </div>
                      </div>

                      {/* Activities Preview */}
                      <p className="mt-2 text-sm text-neutral-600 line-clamp-2">{log.activities}</p>

                      {/* Stats */}
                      <div className="mt-2 flex items-center gap-4 text-xs text-neutral-500">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {log.hoursSpent} hours
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          Submitted {new Date(log.submittedAt).toLocaleDateString('en-MY', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            )
          })
        ) : (
          <Card className="p-12 text-center">
            <FileText className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-neutral-900">No logs found</h3>
            <p className="text-neutral-500 mt-1">
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'No supervision logs to review at the moment'}
            </p>
          </Card>
        )}
      </div>

      {/* Summary Stats */}
      {data && data.logs.length > 0 && (
        <Card className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-neutral-900">{data.total}</p>
              <p className="text-sm text-neutral-500">Total Logs</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-warning-600">{pendingCount}</p>
              <p className="text-sm text-neutral-500">Pending Review</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-success-600">
                {data.logs.filter((l) => l.status === 'APPROVED').length}
              </p>
              <p className="text-sm text-neutral-500">Approved</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-primary-600">
                {data.logs.filter((l) => l.status === 'SIGNED').length}
              </p>
              <p className="text-sm text-neutral-500">Signed</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
