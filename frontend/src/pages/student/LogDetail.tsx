import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  Edit,
  MessageSquare,
  Send,
} from 'lucide-react'
import { Card, Button, Badge, Spinner } from '@/components/ui'
import { useLogDetail } from '@/lib/hooks/useStudent'
import { ROUTES } from '@/lib/constants/routes'
import type { LogStatus } from '@/types'

// Sample data
const SAMPLE_LOG = {
  logId: '1',
  studentId: '1',
  supervisorId: '1',
  meetingId: '3',
  weekNumber: 4,
  activitiesCompleted: 'Completed literature review on AI-powered supervision systems. Reviewed 15 papers from IEEE and ACM databases. Drafted problem statement section with focus on Malaysian higher education context. Created annotated bibliography for reference management.',
  challengesFaced: 'Difficulty finding recent papers specifically on Malaysian higher education context. Most available research focuses on Western institutions. Also faced some challenges with understanding certain machine learning concepts in the papers.',
  plannedActivities: 'Start methodology chapter with focus on software development methodology selection. Schedule meeting with co-supervisor to discuss technical implementation approach. Begin preliminary system architecture design.',
  progressPercentage: 25,
  supervisorFeedback: 'Good progress on literature review. The problem statement is well-articulated. Consider expanding your search to include ASEAN region literature as there may be more relevant context. For the methodology chapter, I recommend looking into Agile methodologies given the iterative nature of your project. Please also prepare a draft of your system architecture for our next meeting.',
  status: 'APPROVED' as LogStatus,
  submittedAt: '2025-01-20T10:00:00Z',
  approvedAt: '2025-01-21T14:00:00Z',
  createdAt: '2025-01-20T10:00:00Z',
  updatedAt: '2025-01-21T14:00:00Z',
}

const statusConfig: Record<LogStatus, { label: string; variant: 'default' | 'success' | 'warning' | 'error'; description: string }> = {
  DRAFT: { label: 'Draft', variant: 'default', description: 'This log is saved as a draft' },
  PENDING: { label: 'Pending Review', variant: 'warning', description: 'Waiting for supervisor review' },
  APPROVED: { label: 'Approved', variant: 'success', description: 'Your log has been approved' },
  REVISION_REQUIRED: { label: 'Revision Required', variant: 'error', description: 'Please update based on feedback' },
}

export function LogDetail() {
  const { id } = useParams<{ id: string }>()

  const { data: log, isLoading } = useLogDetail(id || '')

  // Use sample data
  const displayLog = log || SAMPLE_LOG
  const status = statusConfig[displayLog.status]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" label="Loading log..." />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back Button */}
      <Link
        to={ROUTES.STUDENT.LOGS}
        className="inline-flex items-center gap-2 text-neutral-600 hover:text-primary-600 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Logs
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Week {displayLog.weekNumber} Log</h1>
          <p className="text-neutral-600 mt-1">
            {displayLog.submittedAt
              ? `Submitted on ${new Date(displayLog.submittedAt).toLocaleDateString('en-MY', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}`
              : `Created on ${new Date(displayLog.createdAt).toLocaleDateString('en-MY')}`}
          </p>
        </div>
        <Badge variant={status.variant} size="lg">{status.label}</Badge>
      </div>

      {/* Status Banner */}
      {displayLog.status === 'REVISION_REQUIRED' && (
        <Card className="bg-error-50 border-error-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-error-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-error-900">Revision Required</p>
              <p className="text-sm text-error-700 mt-1">
                Your supervisor has requested changes to this log. Please review the feedback and update accordingly.
              </p>
              <Link to={ROUTES.STUDENT.LOG_EDIT.replace(':id', displayLog.logId)}>
                <Button variant="error" size="sm" className="mt-3" leftIcon={<Edit className="h-4 w-4" />}>
                  Edit Log
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      )}

      {displayLog.status === 'APPROVED' && (
        <Card className="bg-success-50 border-success-200">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-success-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-success-900">Log Approved</p>
              <p className="text-sm text-success-700 mt-1">
                Your supervisor has approved this log on {new Date(displayLog.approvedAt!).toLocaleDateString('en-MY')}.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Log Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Progress */}
          <Card>
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">Overall Progress</h2>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="h-4 bg-neutral-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-500 rounded-full transition-all"
                    style={{ width: `${displayLog.progressPercentage}%` }}
                  />
                </div>
              </div>
              <span className="text-2xl font-bold text-primary-600">{displayLog.progressPercentage}%</span>
            </div>
            <p className="text-sm text-neutral-500 mt-2">Project completion as of Week {displayLog.weekNumber}</p>
          </Card>

          {/* Activities Completed */}
          <Card>
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">
              <CheckCircle className="h-5 w-5 inline mr-2 text-success-600" />
              Activities Completed
            </h2>
            <p className="text-neutral-700 whitespace-pre-wrap">{displayLog.activitiesCompleted}</p>
          </Card>

          {/* Challenges Faced */}
          {displayLog.challengesFaced && (
            <Card>
              <h2 className="text-lg font-semibold text-neutral-900 mb-4">
                <AlertCircle className="h-5 w-5 inline mr-2 text-warning-600" />
                Challenges Faced
              </h2>
              <p className="text-neutral-700 whitespace-pre-wrap">{displayLog.challengesFaced}</p>
            </Card>
          )}

          {/* Planned Activities */}
          <Card>
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">
              <Calendar className="h-5 w-5 inline mr-2 text-primary-600" />
              Planned Activities
            </h2>
            <p className="text-neutral-700 whitespace-pre-wrap">{displayLog.plannedActivities}</p>
          </Card>

          {/* Supervisor Feedback */}
          {displayLog.supervisorFeedback && (
            <Card className="border-primary-200 bg-primary-50">
              <h2 className="text-lg font-semibold text-primary-900 mb-4">
                <MessageSquare className="h-5 w-5 inline mr-2" />
                Supervisor Feedback
              </h2>
              <p className="text-primary-800 whitespace-pre-wrap">{displayLog.supervisorFeedback}</p>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Meta Info */}
          <Card>
            <h3 className="text-sm font-medium text-neutral-500 mb-3">Log Details</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-neutral-400" />
                <span className="text-neutral-600">Week {displayLog.weekNumber}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-neutral-400" />
                <span className="text-neutral-600">
                  {new Date(displayLog.createdAt).toLocaleDateString('en-MY')}
                </span>
              </div>
              {displayLog.meetingId && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-neutral-400" />
                  <Link
                    to={ROUTES.STUDENT.MEETING_DETAIL.replace(':id', displayLog.meetingId)}
                    className="text-primary-600 hover:underline"
                  >
                    View linked meeting
                  </Link>
                </div>
              )}
            </div>
          </Card>

          {/* Actions */}
          <Card>
            <h3 className="text-sm font-medium text-neutral-500 mb-3">Actions</h3>
            <div className="space-y-2">
              {['DRAFT', 'REVISION_REQUIRED'].includes(displayLog.status) && (
                <>
                  <Link to={ROUTES.STUDENT.LOG_EDIT.replace(':id', displayLog.logId)}>
                    <Button variant="primary" className="w-full" leftIcon={<Edit className="h-4 w-4" />}>
                      Edit Log
                    </Button>
                  </Link>
                  {displayLog.status === 'DRAFT' && (
                    <Button variant="secondary" className="w-full" leftIcon={<Send className="h-4 w-4" />}>
                      Submit for Review
                    </Button>
                  )}
                </>
              )}
              {displayLog.status === 'PENDING' && (
                <div className="text-center py-4">
                  <Clock className="h-8 w-8 text-warning-500 mx-auto mb-2" />
                  <p className="text-sm text-neutral-600">
                    Waiting for supervisor review
                  </p>
                </div>
              )}
              {displayLog.status === 'APPROVED' && (
                <Link to={ROUTES.STUDENT.LOG_NEW}>
                  <Button variant="secondary" className="w-full" leftIcon={<FileText className="h-4 w-4" />}>
                    Create Next Log
                  </Button>
                </Link>
              )}
            </div>
          </Card>

          {/* Timeline */}
          <Card>
            <h3 className="text-sm font-medium text-neutral-500 mb-3">Activity</h3>
            <div className="space-y-3 text-sm">
              {displayLog.approvedAt && (
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-success-500 mt-1.5" />
                  <div>
                    <p className="text-neutral-700">Approved</p>
                    <p className="text-neutral-400 text-xs">
                      {new Date(displayLog.approvedAt).toLocaleDateString('en-MY')}
                    </p>
                  </div>
                </div>
              )}
              {displayLog.submittedAt && (
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary-500 mt-1.5" />
                  <div>
                    <p className="text-neutral-700">Submitted</p>
                    <p className="text-neutral-400 text-xs">
                      {new Date(displayLog.submittedAt).toLocaleDateString('en-MY')}
                    </p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 rounded-full bg-neutral-300 mt-1.5" />
                <div>
                  <p className="text-neutral-700">Created</p>
                  <p className="text-neutral-400 text-xs">
                    {new Date(displayLog.createdAt).toLocaleDateString('en-MY')}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
