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
  Sparkles,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import { useLogsForReview } from '@/lib/hooks/useSupervisor'
import { ROUTES } from '@/lib/constants/routes'
import { cn } from '@/lib/utils/cn'
import type { LogStatus } from '@/types'

const statusConfig: Record<LogStatus, { label: string; color: string; bgColor: string; borderColor: string; icon: typeof Clock }> = {
  PENDING: { label: 'Pending Review', color: 'text-amber-600', bgColor: 'bg-amber-50', borderColor: 'border-l-amber-500', icon: Clock },
  APPROVED: { label: 'Approved', color: 'text-emerald-600', bgColor: 'bg-emerald-50', borderColor: 'border-l-emerald-500', icon: CheckCircle },
  REVISION_REQUIRED: { label: 'Needs Revision', color: 'text-rose-600', bgColor: 'bg-rose-50', borderColor: 'border-l-rose-500', icon: AlertCircle },
  SIGNED: { label: 'Signed', color: 'text-sky-600', bgColor: 'bg-sky-50', borderColor: 'border-l-sky-500', icon: CheckCircle },
  LOCKED: { label: 'Locked', color: 'text-stone-600', bgColor: 'bg-stone-100', borderColor: 'border-l-stone-500', icon: CheckCircle },
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
      {/* Header - Gradient Style */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-stone-800 via-stone-800 to-stone-900 p-6 text-white shadow-xl">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-stone-600/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-14 h-14 bg-amber-500/20 rounded-xl flex items-center justify-center ring-1 ring-amber-500/30">
              <FileText className="h-7 w-7 text-amber-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                Supervision Logs Review
              </h1>
              <p className="text-stone-300 mt-1">
                Review and sign weekly supervision logs from your supervisees
              </p>
            </div>
          </div>
          {pendingCount > 0 && (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-500/20 backdrop-blur-sm rounded-xl ring-1 ring-amber-500/30">
              <Sparkles className="h-5 w-5 text-amber-400" />
              <span className="text-sm font-medium text-amber-100">
                {pendingCount} log{pendingCount > 1 ? 's' : ''} awaiting review
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 p-4 bg-stone-100 rounded-xl">
        {/* Status Tabs */}
        <div className="flex items-center gap-1 p-1 bg-white rounded-lg shadow-sm">
          {filterOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setStatusFilter(option.value)}
              className={cn(
                'px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200',
                statusFilter === option.value
                  ? 'bg-stone-800 text-white shadow-sm'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <Input
            type="text"
            placeholder="Search by student or content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-white border-stone-200"
          />
        </div>
      </div>

      {/* Logs List */}
      <div className="flex flex-col gap-5">
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
                  'group p-4 hover:shadow-lg transition-all duration-300 cursor-pointer border-l-4',
                  status.borderColor,
                  log.status === 'PENDING' && 'ring-1 ring-amber-200 bg-amber-50/30'
                )}>
                  <div className="flex items-start gap-4">
                    {/* Week Badge */}
                    <div className="w-14 h-14 bg-gradient-to-br from-stone-800 to-stone-900 rounded-xl flex flex-col items-center justify-center flex-shrink-0 shadow-md group-hover:scale-105 transition-transform">
                      <span className="text-xs text-stone-400 font-medium">Week</span>
                      <span className="text-xl font-bold text-amber-400">{log.weekNumber}</span>
                    </div>

                    {/* Log Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <GraduationCap className="h-4 w-4 text-stone-400" />
                            <h3 className="font-semibold text-stone-800 group-hover:text-amber-700 transition-colors">{log.studentName}</h3>
                          </div>
                          <p className="text-sm text-stone-500">
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
                          <ChevronRight className="h-5 w-5 text-stone-300 group-hover:text-amber-500 group-hover:translate-x-1 transition-all" />
                        </div>
                      </div>

                      {/* Activities Preview */}
                      <p className="mt-2 text-sm text-stone-600 line-clamp-2">{log.activities}</p>

                      {/* Stats */}
                      <div className="mt-2 flex items-center gap-4 text-xs text-stone-500">
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
            <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="h-8 w-8 text-stone-400" />
            </div>
            <h3 className="text-lg font-semibold text-stone-800">No logs found</h3>
            <p className="text-stone-500 mt-1">
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'No supervision logs to review at the moment'}
            </p>
          </Card>
        )}
      </div>

      {/* Summary Stats */}
      {data && data.logs.length > 0 && (
        <Card className="p-5 overflow-hidden">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-stone-100 rounded-lg">
              <Filter className="h-5 w-5 text-stone-600" />
            </div>
            <h3 className="font-semibold text-stone-800">Summary Statistics</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-stone-100 text-center">
              <p className="text-2xl font-bold text-stone-800">{data.total}</p>
              <p className="text-sm text-stone-500 font-medium">Total Logs</p>
            </div>
            <div className="p-4 rounded-xl bg-amber-100 text-center">
              <p className="text-2xl font-bold text-amber-700">{pendingCount}</p>
              <p className="text-sm text-amber-600 font-medium">Pending Review</p>
            </div>
            <div className="p-4 rounded-xl bg-emerald-100 text-center">
              <p className="text-2xl font-bold text-emerald-700">
                {data.logs.filter((l) => l.status === 'APPROVED').length}
              </p>
              <p className="text-sm text-emerald-600 font-medium">Approved</p>
            </div>
            <div className="p-4 rounded-xl bg-sky-100 text-center">
              <p className="text-2xl font-bold text-sky-700">
                {data.logs.filter((l) => l.status === 'SIGNED').length}
              </p>
              <p className="text-sm text-sky-600 font-medium">Signed</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
