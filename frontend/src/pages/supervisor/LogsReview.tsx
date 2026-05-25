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
  DRAFT: { label: 'Draft', color: 'text-stone-600', bgColor: 'bg-stone-50', borderColor: 'border-l-stone-400', icon: Clock },
  SUBMITTED: { label: 'Awaiting Review', color: 'text-amber-600', bgColor: 'bg-amber-50', borderColor: 'border-l-amber-500', icon: Clock },
  PENDING: { label: 'Pending Review', color: 'text-amber-600', bgColor: 'bg-amber-50', borderColor: 'border-l-amber-500', icon: Clock },
  APPROVED: { label: 'Approved', color: 'text-emerald-600', bgColor: 'bg-emerald-50', borderColor: 'border-l-emerald-500', icon: CheckCircle },
  REVISION_REQUIRED: { label: 'Needs Revision', color: 'text-rose-600', bgColor: 'bg-rose-50', borderColor: 'border-l-rose-500', icon: AlertCircle },
  SUPERVISOR_SIGNED: { label: 'Signed', color: 'text-sky-600', bgColor: 'bg-sky-50', borderColor: 'border-l-sky-500', icon: CheckCircle },
  LOCKED: { label: 'Locked', color: 'text-stone-600', bgColor: 'bg-stone-100', borderColor: 'border-l-stone-500', icon: CheckCircle },
}

const FALLBACK_STATUS = { label: 'Unknown', color: 'text-stone-600', bgColor: 'bg-stone-100', borderColor: 'border-l-stone-400', icon: Clock }

const filterOptions = [
  { value: 'all', label: 'All Logs' },
  { value: 'SUBMITTED', label: 'Awaiting' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'SUPERVISOR_SIGNED', label: 'Signed' },
  { value: 'LOCKED', label: 'Locked' },
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

  const pendingCount =
    data?.logs.filter((l) => l.status === 'SUBMITTED' || l.status === 'PENDING').length ?? 0

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-3 lg:space-y-4">
      {/* Compact Header — title + stats inline */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-stone-800 via-stone-800 to-stone-900 p-3 sm:p-4 text-white shadow-md">
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

        <div className="relative flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex-shrink-0 w-9 h-9 bg-amber-500/20 rounded-lg flex items-center justify-center ring-1 ring-amber-500/30">
              <FileText className="h-5 w-5 text-amber-400" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-white leading-tight">Supervision Logs Review</h1>
              <p className="text-stone-300 text-xs">Review and sign weekly supervision logs</p>
            </div>
          </div>
          {pendingCount > 0 && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/20 backdrop-blur-sm rounded-md ring-1 ring-amber-500/30 flex-shrink-0">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-xs font-semibold text-amber-200">
                {pendingCount} awaiting review
              </span>
            </div>
          )}
        </div>

        {/* Inline stats */}
        {data && data.logs.length > 0 && (
          <div className="relative mt-3 grid grid-cols-4 gap-1.5 text-center">
            <div className="bg-stone-700/40 rounded-md px-2 py-1.5 ring-1 ring-stone-600/40">
              <div className="text-base font-bold leading-none">{data.total}</div>
              <p className="text-[10px] text-stone-300 mt-0.5 uppercase tracking-wide">Total</p>
            </div>
            <div className={cn('rounded-md px-2 py-1.5 ring-1', pendingCount > 0 ? 'bg-amber-500/30 ring-amber-300/40' : 'bg-stone-700/40 ring-stone-600/40')}>
              <div className="text-base font-bold leading-none text-amber-300">{pendingCount}</div>
              <p className="text-[10px] text-stone-300 mt-0.5 uppercase tracking-wide">Pending</p>
            </div>
            <div className="bg-stone-700/40 rounded-md px-2 py-1.5 ring-1 ring-stone-600/40">
              <div className="text-base font-bold leading-none text-emerald-300">
                {data.logs.filter((l) => l.status === 'APPROVED').length}
              </div>
              <p className="text-[10px] text-stone-300 mt-0.5 uppercase tracking-wide">Approved</p>
            </div>
            <div className="bg-stone-700/40 rounded-md px-2 py-1.5 ring-1 ring-stone-600/40">
              <div className="text-base font-bold leading-none text-sky-300">
                {data.logs.filter((l) => l.status === 'SUPERVISOR_SIGNED' || l.status === 'LOCKED').length}
              </div>
              <p className="text-[10px] text-stone-300 mt-0.5 uppercase tracking-wide">Signed</p>
            </div>
          </div>
        )}
      </div>

      {/* Filters — compact */}
      <Card padding="sm">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex items-center gap-0.5 p-0.5 bg-stone-100 rounded-md">
            {filterOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setStatusFilter(option.value)}
                className={cn(
                  'px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap',
                  statusFilter === option.value
                    ? 'bg-stone-800 text-white shadow-sm'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-white'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 pointer-events-none" />
            <Input
              type="text"
              placeholder="Search by student or content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 border-stone-200"
            />
          </div>
        </div>
      </Card>

      {/* Logs List — 2-col grid */}
      {filteredLogs && filteredLogs.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
          {filteredLogs.map((log) => {
            const status = statusConfig[log.status] ?? FALLBACK_STATUS
            const StatusIcon = status.icon
            const isPending = log.status === 'SUBMITTED' || log.status === 'PENDING'
            return (
              <Link
                key={log.logId}
                to={ROUTES.SUPERVISOR.LOG_DETAIL.replace(':id', String(log.logId))}
              >
                <Card padding="sm" className={cn(
                  'group hover:shadow-md transition-all cursor-pointer border-l-4',
                  status.borderColor,
                  isPending && 'bg-amber-50/30',
                )}>
                  <div className="flex items-start gap-2.5">
                    <div className="w-12 bg-gradient-to-br from-stone-800 to-stone-900 rounded-md p-1.5 text-center shadow flex-shrink-0">
                      <p className="text-[8px] text-stone-400 font-semibold uppercase leading-none">Week</p>
                      <p className="text-xl font-bold text-amber-400 leading-tight mt-0.5">{log.weekNumber}</p>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1">
                            <GraduationCap className="h-3.5 w-3.5 text-stone-400 flex-shrink-0" />
                            <h3 className="font-semibold text-sm text-stone-800 group-hover:text-amber-700 leading-tight truncate">{log.studentName}</h3>
                          </div>
                          <p className="text-[11px] text-stone-500 truncate">
                            {(() => {
                              const fmt = (s?: string) => {
                                if (!s) return null
                                const d = new Date(s)
                                return Number.isNaN(d.getTime())
                                  ? null
                                  : d.toLocaleDateString('en-MY', { day: 'numeric', month: 'short' })
                              }
                              const start = fmt(log.weekStartDate)
                              const end = fmt(log.weekEndDate)
                              return end ? `${start ?? '—'} – ${end}` : (start ?? '—')
                            })()}
                          </p>
                        </div>
                        <span className={cn(
                          'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-semibold flex-shrink-0',
                          status.bgColor,
                          status.color
                        )}>
                          <StatusIcon className="h-3 w-3" />
                          {status.label}
                        </span>
                      </div>

                      <p className="mt-1 text-[11px] text-stone-600 line-clamp-1 leading-snug">{log.activities}</p>

                      <div className="mt-1 flex items-center gap-2 text-[10px] text-stone-500">
                        <span className="inline-flex items-center gap-0.5">
                          <Clock className="h-3 w-3" />
                          {log.hoursSpent}h
                        </span>
                        <span className="inline-flex items-center gap-0.5">
                          <Calendar className="h-3 w-3" />
                          {new Date(log.submittedAt).toLocaleDateString('en-MY', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                    </div>

                    <ChevronRight className="h-4 w-4 text-stone-300 group-hover:text-amber-500 transition-colors flex-shrink-0 mt-0.5" />
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>
      ) : (
        <Card className="text-center py-8">
          <FileText className="h-10 w-10 text-stone-300 mx-auto mb-2" />
          <h3 className="font-medium text-stone-800 mb-1">No logs found</h3>
          <p className="text-sm text-stone-500">
            {searchQuery || statusFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'No supervision logs to review at the moment'}
          </p>
        </Card>
      )}
    </div>
  )
}
