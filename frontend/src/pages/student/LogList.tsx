import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  FileText,
  Plus,
  Filter,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Search,
  ChevronRight,
  ClipboardList,
  Edit3,
  MessageSquare,
  AlertTriangle,
  BookOpen,
} from 'lucide-react'
import { Card, Button, Spinner } from '@/components/ui'
import { useLogList } from '@/lib/hooks/useStudent'
import { ROUTES } from '@/lib/constants/routes'
import { cn } from '@/lib/utils/cn'
import type { SupervisionLog, LogStatus } from '@/types'

// Sample data
const SAMPLE_LOGS: SupervisionLog[] = [
  {
    logId: '1',
    studentId: '1',
    supervisorId: '1',
    meetingId: '3',
    weekNumber: 4,
    activitiesCompleted: 'Completed literature review on AI-powered supervision systems. Drafted problem statement section.',
    challengesFaced: 'Difficulty finding recent papers on Malaysian higher education context.',
    plannedActivities: 'Start methodology chapter. Schedule meeting with co-supervisor.',
    progressPercentage: 25,
    supervisorFeedback: 'Good progress on literature review. Consider expanding search to ASEAN region.',
    status: 'APPROVED',
    submittedAt: '2025-01-20T10:00:00Z',
    approvedAt: '2025-01-21T14:00:00Z',
    createdAt: '2025-01-20T10:00:00Z',
    updatedAt: '2025-01-21T14:00:00Z',
  },
  {
    logId: '2',
    studentId: '1',
    supervisorId: '1',
    meetingId: '2',
    weekNumber: 3,
    activitiesCompleted: 'Set up development environment. Created initial project structure.',
    challengesFaced: 'Version compatibility issues with dependencies.',
    plannedActivities: 'Complete database schema design. Start backend API development.',
    progressPercentage: 15,
    supervisorFeedback: 'Ensure proper documentation of setup process.',
    status: 'APPROVED',
    submittedAt: '2025-01-13T10:00:00Z',
    approvedAt: '2025-01-14T09:00:00Z',
    createdAt: '2025-01-13T10:00:00Z',
    updatedAt: '2025-01-14T09:00:00Z',
  },
  {
    logId: '3',
    studentId: '1',
    supervisorId: '1',
    weekNumber: 5,
    activitiesCompleted: 'Started methodology chapter. Researched software development methodologies.',
    challengesFaced: 'Unsure which methodology best suits the project.',
    plannedActivities: 'Finalize methodology selection. Begin system requirements.',
    progressPercentage: 30,
    status: 'PENDING',
    submittedAt: '2025-01-27T10:00:00Z',
    createdAt: '2025-01-27T10:00:00Z',
    updatedAt: '2025-01-27T10:00:00Z',
  },
  {
    logId: '4',
    studentId: '1',
    supervisorId: '1',
    weekNumber: 6,
    activitiesCompleted: '',
    challengesFaced: '',
    plannedActivities: '',
    progressPercentage: 30,
    status: 'DRAFT',
    createdAt: '2025-02-01T10:00:00Z',
    updatedAt: '2025-02-01T10:00:00Z',
  },
]

const statusConfig: Record<LogStatus, { label: string; variant: 'default' | 'success' | 'warning' | 'error'; icon: typeof Clock; color: string; bgColor: string }> = {
  DRAFT: { label: 'Draft', variant: 'default', icon: Edit3, color: 'text-stone-600', bgColor: 'bg-stone-100' },
  PENDING: { label: 'Pending Review', variant: 'warning', icon: Clock, color: 'text-warning-600', bgColor: 'bg-warning-100' },
  APPROVED: { label: 'Approved', variant: 'success', icon: CheckCircle, color: 'text-success-600', bgColor: 'bg-success-100' },
  REVISION_REQUIRED: { label: 'Revision Required', variant: 'error', icon: AlertCircle, color: 'text-error-600', bgColor: 'bg-error-100' },
}

export function LogList() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const { data, isLoading } = useLogList()

  // Use sample data
  const logs = data?.logs || SAMPLE_LOGS

  const filteredLogs = logs.filter((log) => {
    const matchesStatus = statusFilter === 'all' || log.status === statusFilter
    const matchesSearch = searchQuery === '' ||
      log.activitiesCompleted.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.plannedActivities.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `Week ${log.weekNumber}`.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesStatus && matchesSearch
  })

  const pendingCount = logs.filter((l) => l.status === 'PENDING').length
  const draftCount = logs.filter((l) => l.status === 'DRAFT').length
  const approvedCount = logs.filter((l) => l.status === 'APPROVED').length

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" label="Loading logs..." />
      </div>
    )
  }

  return (
    <div className="space-y-3 lg:space-y-4">
      {/* Header with Gradient */}
      <div className="relative bg-gradient-to-br from-primary-800 via-primary-900 to-primary-950 rounded-2xl p-6 text-white overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary-500/5 rounded-full translate-y-1/2 -translate-x-1/2" />

        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/10 backdrop-blur rounded-xl flex items-center justify-center shadow-lg">
              <ClipboardList className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Supervision Logs</h1>
              <p className="text-primary-200 mt-0.5">Track your weekly progress and activities</p>
            </div>
          </div>
          <Link to={ROUTES.STUDENT.LOG_NEW}>
            <Button
              variant="primary"
              leftIcon={<Plus className="h-4 w-4" />}
              className="bg-white text-primary-900 hover:bg-primary-50 border-0 shadow-lg"
            >
              New Log Entry
            </Button>
          </Link>
        </div>
      </div>

      {/* Alert for pending submission */}
      {draftCount > 0 && (
        <div className="bg-gradient-to-r from-warning-50 to-warning-100 border border-warning-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-warning-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-warning-500/25">
              <AlertTriangle className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-warning-900">
                You have {draftCount} draft log{draftCount > 1 ? 's' : ''} pending submission
              </p>
              <p className="text-sm text-warning-700">
                Remember to submit your weekly log before the deadline
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
              <BookOpen className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-primary-600">{logs.length}</div>
              <p className="text-sm text-neutral-600">Total Logs</p>
            </div>
          </div>
        </Card>
        <Card className="relative overflow-hidden border-l-4 border-l-success-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-success-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-success-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-success-600">{approvedCount}</div>
              <p className="text-sm text-neutral-600">Approved</p>
            </div>
          </div>
        </Card>
        <Card className="relative overflow-hidden border-l-4 border-l-warning-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-warning-100 rounded-lg flex items-center justify-center">
              <Clock className="h-5 w-5 text-warning-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-warning-600">{pendingCount}</div>
              <p className="text-sm text-neutral-600">Pending</p>
            </div>
          </div>
        </Card>
        <Card className="relative overflow-hidden border-l-4 border-l-stone-400">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-stone-100 rounded-lg flex items-center justify-center">
              <Edit3 className="h-5 w-5 text-stone-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-stone-600">{draftCount}</div>
              <p className="text-sm text-neutral-600">Drafts</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-gradient-to-r from-stone-50 to-neutral-50 border-stone-200">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-stone-400" />
            </div>
            <input
              type="text"
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-stone-700 placeholder-stone-400 transition-all"
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-stone-200 rounded-lg flex items-center justify-center">
              <Filter className="h-4 w-4 text-stone-600" />
            </div>
            <div className="flex flex-wrap gap-2">
              {['all', 'DRAFT', 'PENDING', 'APPROVED', 'REVISION_REQUIRED'].map((status) => {
                const config = status !== 'all' ? statusConfig[status as LogStatus] : null
                return (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={cn(
                      'px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200',
                      statusFilter === status
                        ? 'bg-primary-500 text-white shadow-md shadow-primary-500/25'
                        : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
                    )}
                  >
                    {status === 'all' ? 'All' : config?.label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </Card>

      {/* Logs List */}
      <div className="mt-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-stone-100 rounded-lg flex items-center justify-center">
            <FileText className="h-4 w-4 text-stone-600" />
          </div>
          <h2 className="text-lg font-bold text-stone-800">Log Entries</h2>
          <span className="px-2.5 py-0.5 bg-stone-100 text-stone-600 text-sm font-semibold rounded-full">
            {filteredLogs.length}
          </span>
        </div>
        <div className="flex flex-col gap-5">
          {filteredLogs.map((log) => (
            <LogCard key={log.logId} log={log} />
          ))}
        </div>
      </div>

      {filteredLogs.length === 0 && (
        <Card className="text-center py-16 bg-gradient-to-br from-stone-50 to-neutral-50">
          <div className="w-16 h-16 bg-stone-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileText className="h-8 w-8 text-stone-400" />
          </div>
          <h3 className="text-lg font-semibold text-stone-800 mb-2">No logs found</h3>
          <p className="text-stone-500 mb-6">
            {statusFilter === 'all'
              ? 'Start tracking your weekly progress'
              : 'No logs match the selected filter'}
          </p>
          <Link to={ROUTES.STUDENT.LOG_NEW}>
            <Button variant="primary">
              Create First Log
            </Button>
          </Link>
        </Card>
      )}
    </div>
  )
}

function LogCard({ log }: { log: SupervisionLog }) {
  const config = statusConfig[log.status]
  const StatusIcon = config.icon

  return (
    <Link to={ROUTES.STUDENT.LOG_DETAIL.replace(':id', log.logId)}>
      <Card className={cn(
        'transition-all duration-200 hover:shadow-lg group p-5',
        log.status === 'REVISION_REQUIRED' && 'border-l-4 border-l-error-500 bg-error-50/30',
        log.status === 'APPROVED' && 'border-l-4 border-l-success-500',
        log.status === 'PENDING' && 'border-l-4 border-l-warning-500',
        log.status === 'DRAFT' && 'border-l-4 border-l-stone-300 hover:border-l-primary-400'
      )}>
        <div className="flex items-start gap-5">
          {/* Week Badge */}
          <div className="flex-shrink-0">
            <div className="w-20 bg-gradient-to-br from-primary-800 to-primary-900 rounded-xl p-3 text-center shadow-lg group-hover:scale-105 transition-transform">
              <p className="text-[10px] text-primary-300 font-semibold uppercase tracking-wider">Week</p>
              <p className="text-3xl font-bold text-white">{log.weekNumber}</p>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-bold text-stone-800 group-hover:text-primary-700 transition-colors">
                  Week {log.weekNumber} Progress Log
                </h3>
                <p className="text-sm text-stone-500 flex items-center gap-1.5 mt-0.5">
                  <Calendar className="h-3.5 w-3.5" />
                  {log.submittedAt
                    ? `Submitted ${new Date(log.submittedAt).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })}`
                    : `Created ${new Date(log.createdAt).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })}`}
                </p>
              </div>
              <div className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold text-sm',
                config.bgColor,
                config.color
              )}>
                <StatusIcon className="h-4 w-4" />
                {config.label}
              </div>
            </div>

            {/* Activities Summary */}
            {log.activitiesCompleted && (
              <p className="mt-3 text-sm text-stone-600 line-clamp-2 bg-stone-50 rounded-lg p-3 border border-stone-100">
                {log.activitiesCompleted}
              </p>
            )}

            {/* Progress & Meta */}
            <div className="mt-4 flex items-center gap-4">
              {/* Progress Bar */}
              <div className="flex items-center gap-3 flex-1">
                <div className="flex-1 h-2.5 bg-stone-200 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      log.progressPercentage >= 75 ? 'bg-success-500' :
                      log.progressPercentage >= 50 ? 'bg-warning-500' :
                      log.progressPercentage >= 25 ? 'bg-info-500' : 'bg-stone-400'
                    )}
                    style={{ width: `${log.progressPercentage}%` }}
                  />
                </div>
                <span className={cn(
                  'text-sm font-bold px-2 py-0.5 rounded',
                  log.progressPercentage >= 75 ? 'bg-success-100 text-success-700' :
                  log.progressPercentage >= 50 ? 'bg-warning-100 text-warning-700' :
                  log.progressPercentage >= 25 ? 'bg-info-100 text-info-700' : 'bg-stone-100 text-stone-600'
                )}>
                  {log.progressPercentage}%
                </span>
              </div>

              {log.meetingId && (
                <span className="text-xs text-stone-500 flex items-center gap-1 px-2 py-1 bg-stone-100 rounded-lg">
                  <Calendar className="h-3 w-3" />
                  Meeting linked
                </span>
              )}

              <div className="w-8 h-8 rounded-lg bg-stone-100 group-hover:bg-primary-100 flex items-center justify-center transition-colors">
                <ChevronRight className="h-4 w-4 text-stone-400 group-hover:text-primary-600 transition-colors" />
              </div>
            </div>

            {/* Supervisor Feedback Preview */}
            {log.supervisorFeedback && log.status === 'APPROVED' && (
              <div className="mt-4 p-3 bg-success-50 border border-success-100 rounded-xl flex items-start gap-2">
                <MessageSquare className="h-4 w-4 text-success-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-success-700 mb-1">Supervisor Feedback</p>
                  <p className="text-sm text-success-600">
                    {log.supervisorFeedback.slice(0, 100)}
                    {log.supervisorFeedback.length > 100 && '...'}
                  </p>
                </div>
              </div>
            )}

            {log.status === 'REVISION_REQUIRED' && (
              <div className="mt-4 p-3 bg-error-50 border border-error-100 rounded-xl flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-error-600 flex-shrink-0" />
                <p className="text-sm font-medium text-error-700">
                  Revision required - Check supervisor feedback
                </p>
              </div>
            )}
          </div>
        </div>
      </Card>
    </Link>
  )
}
