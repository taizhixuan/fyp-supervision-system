import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ClipboardList,
  Plus,
  Filter,
  Search,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  ChevronRight,
  PenLine,
  Lock,
  Download,
} from 'lucide-react'
import { Card, Button, Spinner } from '@/components/ui'
import { TaskSummaryBadges } from '@/components/meetingLog'
import { useMeetingLogList } from '@/lib/hooks/useMeetingLog'
import { ROUTES } from '@/lib/constants/routes'
import { cn } from '@/lib/utils/cn'
import type { MeetingLog } from '@/types/meetingLog'
import { MEETING_LOG_STATUS_CONFIG } from '@/types/meetingLog'

const statusFilterOptions: { value: string; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'SUBMITTED', label: 'Submitted' },
  { value: 'CORRECTION_REQUIRED', label: 'Corrections' },
  { value: 'SUPERVISOR_SIGNED', label: 'Awaiting Signature' },
  { value: 'LOCKED', label: 'Completed' },
]

export function MeetingLogList() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const { data, isLoading } = useMeetingLogList()
  const logs = data?.logs || []

  const filteredLogs = logs.filter((log) => {
    const matchesStatus = statusFilter === 'all' || log.status === statusFilter
    const matchesSearch =
      searchQuery === '' ||
      log.projectTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `Meeting ${log.meetingNumber}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.workDoneDetails.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesStatus && matchesSearch
  })

  // Stats
  const submittedCount = logs.filter((l) => l.status === 'SUBMITTED').length
  const awaitingSignatureCount = logs.filter((l) => l.status === 'SUPERVISOR_SIGNED').length
  const completedCount = logs.filter((l) => l.status === 'LOCKED').length

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" label="Loading meeting logs..." />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Gradient */}
      <div className="relative bg-gradient-to-br from-primary-800 via-primary-900 to-primary-950 rounded-2xl p-6 text-white overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary-500/5 rounded-full translate-y-1/2 -translate-x-1/2" />

        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/10 backdrop-blur rounded-xl flex items-center justify-center shadow-lg">
              <ClipboardList className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Meeting Logs</h1>
              <p className="text-primary-200 mt-0.5">MMU FCI Supervision Meeting Records</p>
            </div>
          </div>
          <Link to={ROUTES.STUDENT.MEETING_LOG_NEW}>
            <Button
              variant="primary"
              leftIcon={<Plus className="h-4 w-4" />}
              className="bg-white text-primary-900 hover:bg-primary-50 border-0 shadow-lg"
            >
              New Meeting Log
            </Button>
          </Link>
        </div>
      </div>

      {/* Alert for pending actions */}
      {awaitingSignatureCount > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/25">
              <PenLine className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-blue-900">
                {awaitingSignatureCount} log{awaitingSignatureCount > 1 ? 's' : ''} awaiting your signature
              </p>
              <p className="text-sm text-blue-700">
                Your supervisor has signed. Please review and add your signature to finalize.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="relative overflow-hidden border-l-4 border-l-primary-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
              <FileText className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-primary-600">{logs.length}</div>
              <p className="text-sm text-neutral-600">Total Logs</p>
            </div>
          </div>
        </Card>
        <Card className="relative overflow-hidden border-l-4 border-l-amber-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-amber-600">{submittedCount}</div>
              <p className="text-sm text-neutral-600">Pending Review</p>
            </div>
          </div>
        </Card>
        <Card className="relative overflow-hidden border-l-4 border-l-blue-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <PenLine className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">{awaitingSignatureCount}</div>
              <p className="text-sm text-neutral-600">Needs Signature</p>
            </div>
          </div>
        </Card>
        <Card className="relative overflow-hidden border-l-4 border-l-emerald-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <Lock className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-emerald-600">{completedCount}</div>
              <p className="text-sm text-neutral-600">Completed</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-gradient-to-r from-neutral-50 to-stone-50 border-neutral-200">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-neutral-400" />
            </div>
            <input
              type="text"
              placeholder="Search by project title, meeting number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-neutral-300 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-neutral-700 placeholder-neutral-400 transition-all"
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-neutral-200 rounded-lg flex items-center justify-center">
              <Filter className="h-4 w-4 text-neutral-600" />
            </div>
            <div className="flex flex-wrap gap-2">
              {statusFilterOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setStatusFilter(option.value)}
                  className={cn(
                    'px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200',
                    statusFilter === option.value
                      ? 'bg-primary-500 text-white shadow-md shadow-primary-500/25'
                      : 'bg-white text-neutral-600 hover:bg-neutral-100 border border-neutral-200'
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Logs List */}
      <div className="mt-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-neutral-100 rounded-lg flex items-center justify-center">
            <ClipboardList className="h-4 w-4 text-neutral-600" />
          </div>
          <h2 className="text-lg font-bold text-neutral-800">Meeting Log Entries</h2>
          <span className="px-2.5 py-0.5 bg-neutral-100 text-neutral-600 text-sm font-semibold rounded-full">
            {filteredLogs.length}
          </span>
        </div>

        <div className="flex flex-col gap-5">
          {filteredLogs.map((log) => (
            <MeetingLogCard key={log.logId} log={log} />
          ))}
        </div>
      </div>

      {/* Empty State */}
      {filteredLogs.length === 0 && (
        <Card className="text-center py-16 bg-gradient-to-br from-neutral-50 to-stone-50">
          <div className="w-16 h-16 bg-neutral-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ClipboardList className="h-8 w-8 text-neutral-400" />
          </div>
          <h3 className="text-lg font-semibold text-neutral-800 mb-2">No meeting logs found</h3>
          <p className="text-neutral-500 mb-6">
            {statusFilter === 'all'
              ? 'Start recording your supervision meetings'
              : 'No logs match the selected filter'}
          </p>
          <Link to={ROUTES.STUDENT.MEETING_LOG_NEW}>
            <Button variant="primary">Create First Meeting Log</Button>
          </Link>
        </Card>
      )}
    </div>
  )
}

interface MeetingLogCardProps {
  log: MeetingLog
}

function MeetingLogCard({ log }: MeetingLogCardProps) {
  const statusConfig = MEETING_LOG_STATUS_CONFIG[log.status]
  const hasSignatures = log.signatures.length > 0

  return (
    <Link to={ROUTES.STUDENT.MEETING_LOG_DETAIL.replace(':id', log.logId)}>
      <Card
        className={cn(
          'transition-all duration-200 hover:shadow-lg group p-5',
          log.status === 'CORRECTION_REQUIRED' && 'border-l-4 border-l-rose-500 bg-rose-50/30',
          log.status === 'LOCKED' && 'border-l-4 border-l-emerald-500',
          log.status === 'SUPERVISOR_SIGNED' && 'border-l-4 border-l-blue-500',
          log.status === 'SUBMITTED' && 'border-l-4 border-l-amber-500',
          log.status === 'DRAFT' && 'border-l-4 border-l-stone-300 hover:border-l-primary-400'
        )}
      >
        <div className="flex items-start gap-5">
          {/* Meeting Number Badge */}
          <div className="flex-shrink-0">
            <div className="w-20 bg-gradient-to-br from-primary-800 to-primary-900 rounded-xl p-3 text-center shadow-lg group-hover:scale-105 transition-transform">
              <p className="text-[10px] text-primary-300 font-semibold uppercase tracking-wider">
                Meeting
              </p>
              <p className="text-3xl font-bold text-white">{log.meetingNumber}</p>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-bold text-neutral-800 group-hover:text-primary-700 transition-colors line-clamp-1">
                  {log.projectTitle}
                </h3>
                <div className="flex items-center gap-3 text-sm text-neutral-500 mt-1">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {new Date(log.meetingDate).toLocaleDateString('en-MY', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                  <span
                    className={cn(
                      'px-2 py-0.5 rounded-full text-xs font-medium',
                      log.meetingMode === 'PHYSICAL'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-blue-100 text-blue-700'
                    )}
                  >
                    {log.meetingMode === 'PHYSICAL' ? 'Physical' : 'Online'}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-700">
                    {log.fypPhase}
                  </span>
                </div>
              </div>
              <div
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold text-sm',
                  statusConfig.bgColor,
                  statusConfig.color
                )}
              >
                {log.status === 'LOCKED' && <Lock className="h-4 w-4" />}
                {log.status === 'SUPERVISOR_SIGNED' && <PenLine className="h-4 w-4" />}
                {log.status === 'SUBMITTED' && <Clock className="h-4 w-4" />}
                {log.status === 'CORRECTION_REQUIRED' && <AlertCircle className="h-4 w-4" />}
                {log.status === 'DRAFT' && <FileText className="h-4 w-4" />}
                {statusConfig.label}
              </div>
            </div>

            {/* Tasks Summary */}
            <div className="mt-3">
              <TaskSummaryBadges tasks={log.tasks} />
            </div>

            {/* Work Done Preview */}
            {log.workDoneDetails && (
              <p className="mt-3 text-sm text-neutral-600 line-clamp-2 bg-neutral-50 rounded-lg p-3 border border-neutral-100">
                {log.workDoneDetails}
              </p>
            )}

            {/* Footer Info */}
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Signatures indicator */}
                {hasSignatures && (
                  <div className="flex items-center gap-1 text-xs text-neutral-500">
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                    <span>
                      {log.signatures.length} signature{log.signatures.length > 1 ? 's' : ''}
                    </span>
                  </div>
                )}
                {log.status === 'LOCKED' && (
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      // TODO: Trigger PDF download
                    }}
                    className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download PDF</span>
                  </button>
                )}
              </div>
              <div className="w-8 h-8 rounded-lg bg-neutral-100 group-hover:bg-primary-100 flex items-center justify-center transition-colors">
                <ChevronRight className="h-4 w-4 text-neutral-400 group-hover:text-primary-600 transition-colors" />
              </div>
            </div>

            {/* Correction Required Alert */}
            {log.status === 'CORRECTION_REQUIRED' && log.correctionReason && (
              <div className="mt-4 p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-rose-700 mb-1">Correction Required</p>
                  <p className="text-sm text-rose-600 line-clamp-2">{log.correctionReason}</p>
                </div>
              </div>
            )}

            {/* Awaiting Signature Alert */}
            {log.status === 'SUPERVISOR_SIGNED' && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-center gap-2">
                <PenLine className="h-4 w-4 text-blue-600 flex-shrink-0" />
                <p className="text-sm font-medium text-blue-700">
                  Supervisor has signed - Please add your signature to finalize
                </p>
              </div>
            )}
          </div>
        </div>
      </Card>
    </Link>
  )
}
