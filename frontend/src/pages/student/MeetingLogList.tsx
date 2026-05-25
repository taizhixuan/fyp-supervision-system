import { useState, type MouseEvent } from 'react'
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
import { useMeetingLogList, useExportMeetingLogsBulk } from '@/lib/hooks/useMeetingLog'
import { useStudentDashboard } from '@/lib/hooks/useStudent'
import { ROUTES } from '@/lib/constants/routes'
import { cn } from '@/lib/utils/cn'
import { downloadMeetingLogPdf } from '@/lib/utils/pdfGenerator'
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
  const [phaseFilter, setPhaseFilter] = useState<string>('all')
  const [exportOpen, setExportOpen] = useState(false)

  const { data, isLoading } = useMeetingLogList(phaseFilter !== 'all' ? { phase: phaseFilter } : undefined)
  const bulkExport = useExportMeetingLogsBulk()
  const logs = data?.logs || []

  // FCI compliance: ≥ 6 LOCKED logs per phase. Read from the dashboard payload so we
  // don't issue a second backend request just for the count.
  const { data: dashboard } = useStudentDashboard()
  const reg = dashboard?.registrationStatus
  const logsCompleted = reg?.meetingLogsCompleted ?? 0
  const logsRequired = reg?.meetingLogsRequired ?? 6
  const phaseLabel = (reg?.cycle ?? 'FYP1').toUpperCase()
  const meetsMin = logsCompleted >= logsRequired
  const logsRemaining = Math.max(0, logsRequired - logsCompleted)

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

  const handleBulkExport = async (phase: 'FYP1' | 'FYP2') => {
    setExportOpen(false)
    try {
      await bulkExport.mutateAsync(phase)
    } catch {
      // error surfaced via mutation state
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" label="Loading meeting logs..." />
      </div>
    )
  }

  return (
    <div className="space-y-3 lg:space-y-4">
      {/* Compact hero with title, compliance progress, stats, and primary CTA all on one strip */}
      <div className="relative bg-gradient-to-br from-primary-800 via-primary-900 to-primary-950 rounded-xl p-3 sm:p-4 text-white overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary-500/10 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />

        <div className="relative flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 bg-white/10 backdrop-blur rounded-lg flex items-center justify-center flex-shrink-0">
              <ClipboardList className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold leading-tight">Meeting Logs</h1>
              <p className="text-primary-200 text-xs">MMU FCI Supervision Meeting Records</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Compliance progress */}
            <div className={cn(
              'flex items-center gap-2 px-2.5 py-1 rounded-md text-xs font-semibold',
              meetsMin ? 'bg-success-500/30 ring-1 ring-success-300/50' : 'bg-warning-500/30 ring-1 ring-warning-300/50'
            )}>
              {meetsMin ? <CheckCircle className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
              <span>
                {logsCompleted}/{logsRequired} {phaseLabel}
                {!meetsMin && ` · ${logsRemaining} left`}
              </span>
            </div>
            <Link to={ROUTES.STUDENT.MEETING_LOG_NEW}>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Plus className="h-3.5 w-3.5" />}
                className="bg-white text-primary-900 hover:bg-primary-50 border-0 shadow whitespace-nowrap"
              >
                New Log
              </Button>
            </Link>
            <div className="relative">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setExportOpen((v) => !v)}
                isLoading={bulkExport.isPending}
                leftIcon={<Download className="h-3.5 w-3.5" />}
                className="whitespace-nowrap"
              >
                Export All
              </Button>
              {exportOpen && (
                <div className="absolute right-0 z-10 mt-1 w-40 rounded-md border border-stone-200 bg-white shadow-lg">
                  <button
                    className="w-full px-3 py-2 text-left text-sm hover:bg-stone-50"
                    onClick={() => handleBulkExport('FYP1')}
                  >
                    All FYP1 Logs
                  </button>
                  <button
                    className="w-full px-3 py-2 text-left text-sm hover:bg-stone-50"
                    onClick={() => handleBulkExport('FYP2')}
                  >
                    All FYP2 Logs
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats inline */}
        <div className="relative mt-3 grid grid-cols-4 gap-2 text-center">
          <div className="bg-white/10 rounded-md px-2 py-1.5">
            <div className="text-lg font-bold leading-none">{logs.length}</div>
            <p className="text-[10px] text-primary-200 mt-0.5 uppercase tracking-wide">Total</p>
          </div>
          <div className="bg-white/10 rounded-md px-2 py-1.5">
            <div className="text-lg font-bold leading-none">{submittedCount}</div>
            <p className="text-[10px] text-primary-200 mt-0.5 uppercase tracking-wide">Pending</p>
          </div>
          <div className={cn('rounded-md px-2 py-1.5', awaitingSignatureCount > 0 ? 'bg-info-500/30 ring-1 ring-info-300/50' : 'bg-white/10')}>
            <div className="text-lg font-bold leading-none">{awaitingSignatureCount}</div>
            <p className="text-[10px] text-primary-200 mt-0.5 uppercase tracking-wide">Sign</p>
          </div>
          <div className="bg-white/10 rounded-md px-2 py-1.5">
            <div className="text-lg font-bold leading-none">{completedCount}</div>
            <p className="text-[10px] text-primary-200 mt-0.5 uppercase tracking-wide">Done</p>
          </div>
        </div>
      </div>

      {/* Inline action alert only when needs signature */}
      {awaitingSignatureCount > 0 && (
        <div className="flex items-center gap-2.5 bg-info-50 border border-info-200 rounded-lg px-3 py-2">
          <PenLine className="h-4 w-4 text-info-600 flex-shrink-0" />
          <p className="text-xs sm:text-sm text-info-800 flex-1">
            <span className="font-semibold">{awaitingSignatureCount} log{awaitingSignatureCount > 1 ? 's' : ''}</span> awaiting your signature — review &amp; sign to finalize.
          </p>
        </div>
      )}

      {/* Filters — compact single card */}
      <Card padding="sm">
        <div className="flex flex-col lg:flex-row gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by project title, meeting number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="h-4 w-4 text-neutral-500 flex-shrink-0" />
            <div className="flex flex-wrap gap-1">
              {statusFilterOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setStatusFilter(option.value)}
                  className={cn(
                    'px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap',
                    statusFilter === option.value
                      ? 'bg-primary-500 text-white'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider ml-1">Phase</span>
            <div className="flex gap-1">
              {[
                { value: 'all', label: 'All' },
                { value: 'FYP1', label: 'FYP1' },
                { value: 'FYP2', label: 'FYP2' },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setPhaseFilter(option.value)}
                  className={cn(
                    'px-2 py-1 rounded-md text-xs font-medium transition-colors',
                    phaseFilter === option.value
                      ? 'bg-primary-100 text-primary-700 ring-1 ring-primary-300'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
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
      <div>
        <div className="flex items-center gap-2 mb-2">
          <ClipboardList className="h-4 w-4 text-neutral-600" />
          <h2 className="text-sm font-bold text-neutral-800 uppercase tracking-wide">Meeting Log Entries</h2>
          <span className="px-1.5 py-0 bg-neutral-100 text-neutral-600 text-[10px] font-semibold rounded-full">
            {filteredLogs.length}
          </span>
        </div>

        {filteredLogs.length === 0 ? (
          <Card className="text-center py-8">
            <ClipboardList className="h-10 w-10 text-neutral-300 mx-auto mb-2" />
            <h3 className="font-medium text-neutral-800 mb-1">No meeting logs found</h3>
            <p className="text-sm text-neutral-500 mb-3">
              {statusFilter === 'all'
                ? 'Start recording your supervision meetings'
                : 'No logs match the selected filter'}
            </p>
            <Link to={ROUTES.STUDENT.MEETING_LOG_NEW}>
              <Button variant="primary" size="sm">Create First Meeting Log</Button>
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
            {filteredLogs.map((log) => (
              <MeetingLogCard key={log.logId} log={log} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

interface MeetingLogCardProps {
  log: MeetingLog
}

function MeetingLogCard({ log }: MeetingLogCardProps) {
  const statusConfig = MEETING_LOG_STATUS_CONFIG[log.status]
  const hasSignatures = log.signatures.length > 0
  const [isPdfDownloading, setIsPdfDownloading] = useState(false)

  const handleDownloadPdf = async (e: MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (isPdfDownloading) return
    setIsPdfDownloading(true)
    try {
      await downloadMeetingLogPdf(log)
    } catch (err) {
      console.error('Failed to generate PDF:', err)
    } finally {
      setIsPdfDownloading(false)
    }
  }

  return (
    <Link to={ROUTES.STUDENT.MEETING_LOG_DETAIL.replace(':id', log.logId)}>
      <Card
        padding="sm"
        className={cn(
          'transition-all hover:shadow-md group',
          log.status === 'CORRECTION_REQUIRED' && 'border-l-4 border-l-error-500 bg-error-50/30',
          log.status === 'LOCKED' && 'border-l-4 border-l-success-500',
          log.status === 'SUPERVISOR_SIGNED' && 'border-l-4 border-l-info-500',
          log.status === 'SUBMITTED' && 'border-l-4 border-l-warning-500',
          log.status === 'DRAFT' && 'border-l-4 border-l-stone-300 hover:border-l-primary-400'
        )}
      >
        <div className="flex items-start gap-2.5">
          {/* Meeting Number Badge — compact */}
          <div className="w-12 bg-gradient-to-br from-primary-800 to-primary-900 rounded-md p-1.5 text-center shadow flex-shrink-0">
            <p className="text-[8px] text-primary-300 font-semibold uppercase tracking-wider leading-none">
              Mtg
            </p>
            <p className="text-xl font-bold text-white leading-tight mt-0.5">{log.meetingNumber}</p>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-sm text-neutral-800 group-hover:text-primary-700 transition-colors line-clamp-1 leading-tight">
                  {log.projectTitle}
                </h3>
                <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-neutral-500 mt-0.5">
                  <span className="inline-flex items-center gap-0.5">
                    <Calendar className="h-3 w-3" />
                    {new Date(log.meetingDate).toLocaleDateString('en-MY', {
                      day: 'numeric',
                      month: 'short',
                      year: '2-digit',
                    })}
                  </span>
                  <span
                    className={cn(
                      'px-1.5 py-0 rounded-full text-[10px] font-medium',
                      log.meetingMode === 'PHYSICAL'
                        ? 'bg-success-100 text-success-700'
                        : 'bg-info-100 text-info-700'
                    )}
                  >
                    {log.meetingMode === 'PHYSICAL' ? 'Physical' : 'Online'}
                  </span>
                  <span className="px-1.5 py-0 rounded-full text-[10px] font-medium bg-primary-100 text-primary-700">
                    {log.fypPhase}
                  </span>
                  {hasSignatures && (
                    <span className="inline-flex items-center gap-0.5 text-success-600">
                      <CheckCircle className="h-3 w-3" />
                      {log.signatures.length}
                    </span>
                  )}
                </div>
              </div>
              <div
                className={cn(
                  'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md font-semibold text-[11px] flex-shrink-0',
                  statusConfig.bgColor,
                  statusConfig.color
                )}
              >
                {log.status === 'LOCKED' && <Lock className="h-3 w-3" />}
                {log.status === 'SUPERVISOR_SIGNED' && <PenLine className="h-3 w-3" />}
                {log.status === 'SUBMITTED' && <Clock className="h-3 w-3" />}
                {log.status === 'CORRECTION_REQUIRED' && <AlertCircle className="h-3 w-3" />}
                {log.status === 'DRAFT' && <FileText className="h-3 w-3" />}
                {statusConfig.label}
              </div>
            </div>

            {/* Tasks Summary */}
            <div className="mt-1.5">
              <TaskSummaryBadges tasks={log.tasks} />
            </div>

            {/* Work Done Preview — shrunk */}
            {log.workDoneDetails && (
              <p className="mt-1.5 text-xs text-neutral-600 line-clamp-1 leading-snug">
                {log.workDoneDetails}
              </p>
            )}

            {/* Inline action alerts only when actually present */}
            {log.status === 'CORRECTION_REQUIRED' && log.correctionReason && (
              <div className="mt-1.5 px-2 py-1 bg-error-50 border border-error-100 rounded-md flex items-start gap-1.5">
                <AlertCircle className="h-3 w-3 text-error-600 flex-shrink-0 mt-0.5" />
                <p className="text-[11px] text-error-700 line-clamp-1">
                  <span className="font-semibold">Correction:</span> {log.correctionReason}
                </p>
              </div>
            )}
            {log.status === 'SUPERVISOR_SIGNED' && (
              <div className="mt-1.5 px-2 py-1 bg-info-50 border border-info-100 rounded-md flex items-center gap-1.5">
                <PenLine className="h-3 w-3 text-info-600 flex-shrink-0" />
                <p className="text-[11px] font-medium text-info-700">
                  Awaiting your signature
                </p>
              </div>
            )}

            {log.status === 'LOCKED' && (
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={isPdfDownloading}
                className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-primary-600 hover:text-primary-700 disabled:opacity-60 disabled:cursor-wait"
              >
                <Download className="h-3 w-3" />
                <span>{isPdfDownloading ? 'Generating PDF…' : 'Download PDF'}</span>
              </button>
            )}
          </div>

          <ChevronRight className="h-4 w-4 text-neutral-300 group-hover:text-primary-600 transition-colors flex-shrink-0 mt-0.5" />
        </div>
      </Card>
    </Link>
  )
}
