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
    <div className="space-y-4 lg:space-y-5">
      {/* Header - Gradient Style */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-800 via-primary-800 to-primary-900 p-6 text-white shadow-xl">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary-600/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-14 h-14 bg-primary-500/20 rounded-xl flex items-center justify-center ring-1 ring-primary-500/30">
              <ClipboardList className="h-7 w-7 text-primary-200" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                Meeting Logs Review
              </h1>
              <p className="text-primary-200 mt-1">
                Review and sign MMU FCI supervision meeting logs
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

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-amber-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-amber-600">{pendingCount}</div>
              <p className="text-sm text-neutral-600">Pending Review</p>
            </div>
          </div>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <PenLine className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">{awaitingStudentCount}</div>
              <p className="text-sm text-neutral-600">Awaiting Student</p>
            </div>
          </div>
        </Card>
        <Card className="border-l-4 border-l-emerald-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <Lock className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-emerald-600">
                {data?.logs.filter((l) => l.status === 'LOCKED').length ?? 0}
              </div>
              <p className="text-sm text-neutral-600">Completed</p>
            </div>
          </div>
        </Card>
        <Card className="border-l-4 border-l-neutral-400">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-neutral-100 rounded-lg flex items-center justify-center">
              <ClipboardList className="h-5 w-5 text-neutral-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-neutral-600">{data?.total ?? 0}</div>
              <p className="text-sm text-neutral-600">Total Logs</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-neutral-50">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 p-1 bg-white rounded-lg shadow-sm">
            {filterOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setStatusFilter(option.value)}
                className={cn(
                  'px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200',
                  statusFilter === option.value
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
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
              placeholder="Search by student or project..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-white border-neutral-200"
            />
          </div>
        </div>
      </Card>

      {/* Logs List */}
      <div className="flex flex-col gap-4">
        {filteredLogs && filteredLogs.length > 0 ? (
          filteredLogs.map((log) => {
            const statusConfig = MEETING_LOG_STATUS_CONFIG[log.status]
            const StatusIcon = statusIcons[log.status]
            const isActionRequired = log.status === 'SUBMITTED'

            return (
              <Link
                key={log.logId}
                to={ROUTES.SUPERVISOR.MEETING_LOG_DETAIL?.replace(':id', log.logId) || `/supervisor/meeting-logs/${log.logId}`}
              >
                <Card
                  className={cn(
                    'group p-5 hover:shadow-lg transition-all duration-300 cursor-pointer border-l-4',
                    isActionRequired && 'ring-1 ring-amber-200 bg-amber-50/30 border-l-amber-500',
                    log.status === 'SUPERVISOR_SIGNED' && 'border-l-blue-500',
                    log.status === 'LOCKED' && 'border-l-emerald-500',
                    log.status === 'CORRECTION_REQUIRED' && 'border-l-rose-500'
                  )}
                >
                  <div className="flex items-start gap-4">
                    {/* Meeting Number Badge */}
                    <div className="w-16 h-16 bg-gradient-to-br from-primary-700 to-primary-900 rounded-xl flex flex-col items-center justify-center flex-shrink-0 shadow-md group-hover:scale-105 transition-transform">
                      <span className="text-xs text-primary-300 font-medium">Meeting</span>
                      <span className="text-2xl font-bold text-white">#{log.meetingNumber}</span>
                    </div>

                    {/* Log Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <GraduationCap className="h-4 w-4 text-neutral-400" />
                            <h3 className="font-semibold text-neutral-800 group-hover:text-primary-700 transition-colors">
                              {log.student.fullName}
                            </h3>
                          </div>
                          <p className="text-sm text-neutral-500 mt-0.5">
                            {log.student.matricNo} • {log.projectTitle}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={statusConfig.variant} size="sm">
                            <StatusIcon className="h-3.5 w-3.5 mr-1" />
                            {statusConfig.label}
                          </Badge>
                          <ChevronRight className="h-5 w-5 text-neutral-300 group-hover:text-primary-500 group-hover:translate-x-1 transition-all" />
                        </div>
                      </div>

                      {/* Meeting Info */}
                      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                        <span className="flex items-center gap-1.5 px-2.5 py-1 bg-neutral-100 rounded-lg text-neutral-600">
                          <Calendar className="h-4 w-4" />
                          {new Date(log.meetingDate).toLocaleDateString('en-MY', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                        <span className={cn(
                          'px-2.5 py-1 rounded-lg text-sm',
                          log.meetingMode === 'PHYSICAL' ? 'bg-emerald-100 text-emerald-700' : 'bg-sky-100 text-sky-700'
                        )}>
                          {log.meetingMode === 'PHYSICAL' ? 'In-Person' : 'Online'}
                        </span>
                        <span className="text-neutral-500">
                          {log.fypPhase}
                        </span>
                      </div>

                      {/* Tasks Summary */}
                      <div className="mt-3 flex items-center gap-2">
                        <span className="text-xs text-neutral-500">Tasks:</span>
                        <div className="flex gap-1">
                          {log.tasks.filter(t => t.isSelected).slice(0, 3).map((task) => (
                            <span
                              key={task.taskCode}
                              className="px-2 py-0.5 bg-primary-100 text-primary-700 text-xs rounded-full"
                            >
                              {task.taskCode.replace('_', ' ')}
                            </span>
                          ))}
                          {log.tasks.filter(t => t.isSelected).length > 3 && (
                            <span className="px-2 py-0.5 bg-neutral-100 text-neutral-600 text-xs rounded-full">
                              +{log.tasks.filter(t => t.isSelected).length - 3} more
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action hint for pending logs */}
                      {isActionRequired && (
                        <div className="mt-3 flex items-center gap-2 text-amber-700 text-sm font-medium">
                          <PenLine className="h-4 w-4" />
                          <span>Review and sign required</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </Link>
            )
          })
        ) : (
          <Card className="p-12 text-center">
            <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ClipboardList className="h-8 w-8 text-neutral-400" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-800">No meeting logs found</h3>
            <p className="text-neutral-500 mt-1">
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'No meeting logs to review at the moment'}
            </p>
          </Card>
        )}
      </div>
    </div>
  )
}
