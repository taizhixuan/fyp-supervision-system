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
} from 'lucide-react'
import { Card, Button, Badge, Spinner, Input } from '@/components/ui'
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

const statusConfig: Record<LogStatus, { label: string; variant: 'default' | 'success' | 'warning' | 'error'; icon: typeof Clock }> = {
  DRAFT: { label: 'Draft', variant: 'default', icon: FileText },
  PENDING: { label: 'Pending Review', variant: 'warning', icon: Clock },
  APPROVED: { label: 'Approved', variant: 'success', icon: CheckCircle },
  REVISION_REQUIRED: { label: 'Revision Required', variant: 'error', icon: AlertCircle },
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Supervision Logs</h1>
          <p className="text-neutral-600 mt-1">Track your weekly progress and activities</p>
        </div>
        <Link to={ROUTES.STUDENT.LOG_NEW}>
          <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />}>
            New Log Entry
          </Button>
        </Link>
      </div>

      {/* Alert for pending submission */}
      {draftCount > 0 && (
        <Card className="bg-warning-50 border-warning-200">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-warning-600 flex-shrink-0" />
            <div>
              <p className="font-medium text-warning-900">
                You have {draftCount} draft log{draftCount > 1 ? 's' : ''} pending submission
              </p>
              <p className="text-sm text-warning-700">
                Remember to submit your weekly log before the deadline
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="text-center">
          <div className="text-2xl font-bold text-primary-600">{logs.length}</div>
          <p className="text-sm text-neutral-600">Total Logs</p>
        </Card>
        <Card className="text-center">
          <div className="text-2xl font-bold text-success-600">{approvedCount}</div>
          <p className="text-sm text-neutral-600">Approved</p>
        </Card>
        <Card className="text-center">
          <div className="text-2xl font-bold text-warning-600">{pendingCount}</div>
          <p className="text-sm text-neutral-600">Pending</p>
        </Card>
        <Card className="text-center">
          <div className="text-2xl font-bold text-neutral-600">{draftCount}</div>
          <p className="text-sm text-neutral-600">Drafts</p>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="h-4 w-4" />}
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-neutral-500" />
            <div className="flex flex-wrap gap-2">
              {['all', 'DRAFT', 'PENDING', 'APPROVED', 'REVISION_REQUIRED'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                    statusFilter === status
                      ? 'bg-primary-100 text-primary-700'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  )}
                >
                  {status === 'all' ? 'All' : statusConfig[status as LogStatus]?.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Logs List */}
      <div className="space-y-3">
        {filteredLogs.map((log) => (
          <LogCard key={log.logId} log={log} />
        ))}
      </div>

      {filteredLogs.length === 0 && (
        <Card className="text-center py-12">
          <FileText className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-neutral-900 mb-2">No logs found</h3>
          <p className="text-neutral-500 mb-4">
            {statusFilter === 'all'
              ? 'Start tracking your weekly progress'
              : 'No logs match the selected filter'}
          </p>
          <Link to={ROUTES.STUDENT.LOG_NEW}>
            <Button variant="primary">Create First Log</Button>
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
      <Card hover className={cn(
        'transition-all',
        log.status === 'REVISION_REQUIRED' && 'border-l-4 border-l-error-500'
      )}>
        <div className="flex items-start gap-4">
          {/* Week Badge */}
          <div className="flex-shrink-0 w-16 text-center">
            <div className="bg-primary-100 rounded-lg p-2">
              <p className="text-xs text-primary-600 font-medium">WEEK</p>
              <p className="text-2xl font-bold text-primary-700">{log.weekNumber}</p>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-neutral-900">Week {log.weekNumber} Log</h3>
                <p className="text-sm text-neutral-500">
                  {log.submittedAt
                    ? `Submitted ${new Date(log.submittedAt).toLocaleDateString('en-MY')}`
                    : `Created ${new Date(log.createdAt).toLocaleDateString('en-MY')}`}
                </p>
              </div>
              <Badge variant={config.variant} size="sm">
                <StatusIcon className="h-3 w-3 mr-1" />
                {config.label}
              </Badge>
            </div>

            {/* Activities Summary */}
            {log.activitiesCompleted && (
              <p className="mt-2 text-sm text-neutral-600 line-clamp-2">
                {log.activitiesCompleted}
              </p>
            )}

            {/* Progress & Meta */}
            <div className="mt-3 flex items-center gap-4">
              {/* Progress Bar */}
              <div className="flex items-center gap-2 flex-1">
                <div className="flex-1 h-2 bg-neutral-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-500 rounded-full transition-all"
                    style={{ width: `${log.progressPercentage}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-neutral-600">
                  {log.progressPercentage}%
                </span>
              </div>

              {log.meetingId && (
                <span className="text-xs text-neutral-400 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Meeting linked
                </span>
              )}

              <ChevronRight className="h-4 w-4 text-neutral-400" />
            </div>

            {/* Supervisor Feedback Preview */}
            {log.supervisorFeedback && log.status === 'APPROVED' && (
              <div className="mt-3 p-2 bg-success-50 rounded text-xs text-success-700">
                <strong>Feedback:</strong> {log.supervisorFeedback.slice(0, 100)}
                {log.supervisorFeedback.length > 100 && '...'}
              </div>
            )}

            {log.status === 'REVISION_REQUIRED' && (
              <div className="mt-3 p-2 bg-error-50 rounded text-xs text-error-700">
                <AlertCircle className="h-3 w-3 inline mr-1" />
                Revision required - Check supervisor feedback
              </div>
            )}
          </div>
        </div>
      </Card>
    </Link>
  )
}
