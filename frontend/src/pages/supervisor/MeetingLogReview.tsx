import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ClipboardList,
  Search,
  Clock,
  AlertCircle,
  ChevronRight,
  GraduationCap,
  Calendar,
  PenLine,
  Lock,
  Sparkles,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { useSupervisorMeetingLogList } from '@/lib/hooks/useMeetingLog'
import { ROUTES } from '@/lib/constants/routes'
import { cn } from '@/lib/utils/cn'
import type { MeetingLogStatus } from '@/types/meetingLog'
import { MEETING_LOG_STATUS_CONFIG } from '@/types/meetingLog'

const statusIcons: Record<MeetingLogStatus, typeof Clock> = {
  DRAFT: Clock,
  SUBMITTED: Clock,
  CORRECTION_REQUIRED: AlertCircle,
  SUPERVISOR_SIGNED: PenLine,
  LOCKED: Lock,
}

const filterOptions = [
  { value: 'all', label: 'All Logs' },
  { value: 'SUBMITTED', label: 'Pending Review' },
  { value: 'SUPERVISOR_SIGNED', label: 'Awaiting Student' },
  { value: 'LOCKED', label: 'Completed' },
]

export function MeetingLogReview() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const { data, isLoading } = useSupervisorMeetingLogList()

  const filteredLogs = data?.logs
    .filter((log) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return (
          log.student.fullName.toLowerCase().includes(query) ||
          log.projectTitle.toLowerCase().includes(query)
        )
      }
      return true
    })
    .filter((log) => {
      if (statusFilter === 'all') return true
      return log.status === statusFilter
    })
    .sort((a, b) => {
      // Sort by meeting number descending
      return b.meetingNumber - a.meetingNumber
    })

  const pendingCount = data?.logs.filter((l) => l.status === 'SUBMITTED').length ?? 0
  const awaitingStudentCount = data?.logs.filter((l) => l.status === 'SUPERVISOR_SIGNED').length ?? 0

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" label="Loading meeting logs..." />
      </div>
    )
  }

  return (
    <div className="space-y-3 lg:space-y-4">
      {/* Compact Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary-800 via-primary-800 to-primary-900 p-3 sm:p-4 text-white shadow-md">
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

        <div className="relative flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex-shrink-0 w-9 h-9 bg-primary-500/20 rounded-lg flex items-center justify-center ring-1 ring-primary-500/30">
              <ClipboardList className="h-5 w-5 text-primary-200" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-white leading-tight">Meeting Logs Review</h1>
              <p className="text-primary-200 text-xs">Review and sign MMU FCI supervision meeting logs</p>
            </div>
          </div>
          {pendingCount > 0 && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/20 backdrop-blur-sm rounded-md ring-1 ring-amber-500/30 flex-shrink-0">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-xs font-semibold text-amber-200">
                {pendingCount} awaiting
              </span>
            </div>
          )}
        </div>

        {/* Inline stats */}
        <div className="relative mt-3 grid grid-cols-4 gap-1.5 text-center">
          <div className={cn('rounded-md px-2 py-1.5 ring-1', pendingCount > 0 ? 'bg-amber-500/30 ring-amber-300/40' : 'bg-primary-700/40 ring-primary-600/40')}>
            <div className="text-base font-bold leading-none text-amber-300">{pendingCount}</div>
            <p className="text-[10px] text-primary-200 mt-0.5 uppercase tracking-wide">Pending</p>
          </div>
          <div className="bg-primary-700/40 rounded-md px-2 py-1.5 ring-1 ring-primary-600/40">
            <div className="text-base font-bold leading-none text-blue-300">{awaitingStudentCount}</div>
            <p className="text-[10px] text-primary-200 mt-0.5 uppercase tracking-wide">Awaiting</p>
          </div>
          <div className="bg-primary-700/40 rounded-md px-2 py-1.5 ring-1 ring-primary-600/40">
            <div className="text-base font-bold leading-none text-emerald-300">
              {data?.logs.filter((l) => l.status === 'LOCKED').length ?? 0}
            </div>
            <p className="text-[10px] text-primary-200 mt-0.5 uppercase tracking-wide">Done</p>
          </div>
          <div className="bg-primary-700/40 rounded-md px-2 py-1.5 ring-1 ring-primary-600/40">
            <div className="text-base font-bold leading-none">{data?.total ?? 0}</div>
            <p className="text-[10px] text-primary-200 mt-0.5 uppercase tracking-wide">Total</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card padding="sm">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex items-center gap-0.5 p-0.5 bg-neutral-100 rounded-md">
            {filterOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setStatusFilter(option.value)}
                className={cn(
                  'px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap',
                  statusFilter === option.value
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-white'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 pointer-events-none" />
            <Input
              type="text"
              placeholder="Search by student or project..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 border-neutral-200"
            />
          </div>
        </div>
      </Card>

      {/* Logs List — 2-col grid */}
      {filteredLogs && filteredLogs.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
          {filteredLogs.map((log) => {
            const statusConfig = MEETING_LOG_STATUS_CONFIG[log.status]
            const StatusIcon = statusIcons[log.status]
            const isActionRequired = log.status === 'SUBMITTED'

            return (
              <Link
                key={log.logId}
                to={ROUTES.SUPERVISOR.MEETING_LOG_DETAIL?.replace(':id', log.logId) || `/supervisor/meeting-logs/${log.logId}`}
              >
                <Card
                  padding="sm"
                  className={cn(
                    'group hover:shadow-md transition-all cursor-pointer border-l-4',
                    isActionRequired && 'bg-amber-50/30 border-l-amber-500',
                    log.status === 'SUPERVISOR_SIGNED' && 'border-l-blue-500',
                    log.status === 'LOCKED' && 'border-l-emerald-500',
                    log.status === 'CORRECTION_REQUIRED' && 'border-l-rose-500',
                  )}
                >
                  <div className="flex items-start gap-2.5">
                    <div className="w-12 bg-gradient-to-br from-primary-700 to-primary-900 rounded-md p-1.5 text-center shadow flex-shrink-0">
                      <p className="text-[8px] text-primary-300 font-semibold uppercase leading-none">Mtg</p>
                      <p className="text-xl font-bold text-white leading-tight mt-0.5">{log.meetingNumber}</p>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1">
                            <GraduationCap className="h-3.5 w-3.5 text-neutral-400 flex-shrink-0" />
                            <h3 className="font-semibold text-sm text-neutral-800 group-hover:text-primary-700 leading-tight truncate">
                              {log.student.fullName}
                            </h3>
                          </div>
                          <p className="text-[11px] text-neutral-500 truncate">
                            {log.student.matricNo} · {log.projectTitle}
                          </p>
                        </div>
                        <Badge variant={statusConfig.variant} size="sm">
                          <StatusIcon className="h-3 w-3 mr-0.5" />
                          {statusConfig.label}
                        </Badge>
                      </div>

                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px]">
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0 bg-neutral-100 rounded-md text-neutral-600">
                          <Calendar className="h-3 w-3" />
                          {new Date(log.meetingDate).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: '2-digit' })}
                        </span>
                        <span className={cn(
                          'px-1.5 py-0 rounded-md',
                          log.meetingMode === 'PHYSICAL' ? 'bg-emerald-100 text-emerald-700' : 'bg-sky-100 text-sky-700'
                        )}>
                          {log.meetingMode === 'PHYSICAL' ? 'In-Person' : 'Online'}
                        </span>
                        <span className="text-neutral-500">{log.fypPhase}</span>
                      </div>

                      <div className="mt-1 flex items-center gap-1 flex-wrap">
                        {log.tasks.filter(t => t.isSelected).slice(0, 3).map((task) => (
                          <span
                            key={task.taskCode}
                            className="px-1 py-0 bg-primary-100 text-primary-700 text-[10px] rounded"
                          >
                            {task.taskCode.replace('_', ' ')}
                          </span>
                        ))}
                        {log.tasks.filter(t => t.isSelected).length > 3 && (
                          <span className="px-1 py-0 bg-neutral-100 text-neutral-600 text-[10px] rounded">
                            +{log.tasks.filter(t => t.isSelected).length - 3}
                          </span>
                        )}
                      </div>

                      {isActionRequired && (
                        <div className="mt-1 inline-flex items-center gap-1 text-amber-700 text-[11px] font-medium">
                          <PenLine className="h-3 w-3" />
                          Review &amp; sign required
                        </div>
                      )}
                    </div>

                    <ChevronRight className="h-4 w-4 text-neutral-300 group-hover:text-primary-500 transition-colors flex-shrink-0 mt-0.5" />
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>
      ) : (
        <Card className="text-center py-8">
          <ClipboardList className="h-10 w-10 text-neutral-300 mx-auto mb-2" />
          <h3 className="font-medium text-neutral-800 mb-1">No meeting logs found</h3>
          <p className="text-sm text-neutral-500">
            {searchQuery || statusFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'No meeting logs to review at the moment'}
          </p>
        </Card>
      )}
    </div>
  )
}
