import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  FileText,
  CheckCircle,
  AlertCircle,
  GraduationCap,
  Calendar,
  MessageSquare,
  PenTool,
  RotateCcw,
  Download,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { useLogForReview, useReviewLog, useSignLog } from '@/lib/hooks/useSupervisor'
import { ROUTES } from '@/lib/constants/routes'
import { cn } from '@/lib/utils/cn'
import type { SvLogStatus } from '@/types'

const statusConfig: Record<SvLogStatus, { label: string; color: string; bgColor: string }> = {
  PENDING: { label: 'Pending Review', color: 'text-warning-600', bgColor: 'bg-warning-50' },
  APPROVED: { label: 'Approved', color: 'text-success-600', bgColor: 'bg-success-50' },
  REVISION_REQUIRED: { label: 'Needs Revision', color: 'text-orange-600', bgColor: 'bg-orange-50' },
  SIGNED: { label: 'Signed', color: 'text-primary-600', bgColor: 'bg-primary-50' },
  LOCKED: { label: 'Locked', color: 'text-neutral-600', bgColor: 'bg-neutral-100' },
}

export function LogDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [comment, setComment] = useState('')
  const [showSignModal, setShowSignModal] = useState(false)

  const { data: log, isLoading } = useLogForReview(Number(id))
  const reviewMutation = useReviewLog()
  const signMutation = useSignLog()

  const handleApprove = async () => {
    if (!log) return
    try {
      await reviewMutation.mutateAsync({
        logId: log.logId,
        action: 'APPROVE',
        comment: comment || undefined,
      })
      setComment('')
    } catch (error) {
      console.error('Failed to approve log:', error)
    }
  }

  const handleRequestRevision = async () => {
    if (!log || !comment.trim()) {
      alert('Please provide a comment explaining what revisions are needed.')
      return
    }
    try {
      await reviewMutation.mutateAsync({
        logId: log.logId,
        action: 'REQUEST_REVISION',
        comment,
      })
      setComment('')
    } catch (error) {
      console.error('Failed to request revision:', error)
    }
  }

  const handleSign = async () => {
    if (!log) return
    try {
      await signMutation.mutateAsync(log.logId)
      setShowSignModal(false)
    } catch (error) {
      console.error('Failed to sign log:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!log) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-neutral-900">Log not found</h2>
        <p className="text-neutral-600 mt-2">The supervision log you're looking for doesn't exist.</p>
        <Link to={ROUTES.SUPERVISOR.LOGS}>
          <Button className="mt-4">Back to Logs</Button>
        </Link>
      </div>
    )
  }

  const status = statusConfig[log.status]
  const canReview = log.status === 'PENDING'
  const canSign = log.status === 'APPROVED' && !log.supervisorSignedAt

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to={ROUTES.SUPERVISOR.LOGS}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Logs
          </Button>
        </Link>
      </div>

      {/* Status Banner */}
      <div className={cn('p-4 rounded-lg flex items-center justify-between', status.bgColor)}>
        <div className="flex items-center gap-3">
          <FileText className={cn('h-6 w-6', status.color)} />
          <div>
            <p className={cn('font-semibold', status.color)}>{status.label}</p>
            <p className="text-sm text-neutral-600">
              Week {log.weekNumber} | {log.studentName}
            </p>
          </div>
        </div>
        {canSign && (
          <Button onClick={() => setShowSignModal(true)}>
            <PenTool className="h-4 w-4 mr-2" />
            Sign Log
          </Button>
        )}
        {log.supervisorSignedAt && (
          <span className="text-sm text-success-600 flex items-center gap-1">
            <CheckCircle className="h-4 w-4" />
            Signed on {new Date(log.supervisorSignedAt).toLocaleDateString()}
          </span>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Student Info */}
          <Card className="p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <GraduationCap className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="font-semibold text-neutral-900">{log.studentName}</h3>
              <p className="text-sm text-neutral-500">Supervisee</p>
            </div>
          </Card>

          {/* Week Info */}
          <Card className="p-6">
            <h3 className="font-semibold text-neutral-900 mb-4">Log Information</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-neutral-500">Week</span>
                <span className="font-medium">Week {log.weekNumber}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-500">Period</span>
                <span className="font-medium">
                  {new Date(log.weekStartDate).toLocaleDateString('en-MY', {
                    day: 'numeric',
                    month: 'short',
                  })} - {new Date(log.weekEndDate).toLocaleDateString('en-MY', {
                    day: 'numeric',
                    month: 'short',
                  })}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-500">Hours Spent</span>
                <span className="font-medium">{log.hoursSpent} hours</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-500">Submitted</span>
                <span className="font-medium">
                  {new Date(log.submittedAt).toLocaleDateString('en-MY', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>
          </Card>

          {/* Attachments */}
          {log.attachments && log.attachments.length > 0 && (
            <Card className="p-6">
              <h3 className="font-semibold text-neutral-900 mb-4">Attachments</h3>
              <div className="space-y-2">
                {log.attachments.map((attachment) => (
                  <div
                    key={attachment.attachmentId}
                    className="flex items-center justify-between p-2 bg-neutral-50 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-neutral-400" />
                      <span className="text-sm text-neutral-700 truncate">
                        {attachment.fileName}
                      </span>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Right Column - Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Activities */}
          <Card className="p-6">
            <h3 className="font-semibold text-neutral-900 mb-3 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-neutral-400" />
              Activities This Week
            </h3>
            <p className="text-neutral-600 whitespace-pre-wrap">{log.activities}</p>
          </Card>

          {/* Progress Summary */}
          <Card className="p-6">
            <h3 className="font-semibold text-neutral-900 mb-3">Progress Summary</h3>
            <p className="text-neutral-600 whitespace-pre-wrap">{log.progressSummary}</p>
          </Card>

          {/* Challenges */}
          {log.challenges && (
            <Card className="p-6">
              <h3 className="font-semibold text-neutral-900 mb-3 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-warning-500" />
                Challenges Encountered
              </h3>
              <p className="text-neutral-600 whitespace-pre-wrap">{log.challenges}</p>
            </Card>
          )}

          {/* Next Week Plan */}
          <Card className="p-6">
            <h3 className="font-semibold text-neutral-900 mb-3">Plan for Next Week</h3>
            <p className="text-neutral-600 whitespace-pre-wrap">{log.nextWeekPlan}</p>
          </Card>

          {/* Supervisor Comment (if any) */}
          {log.supervisorComment && (
            <Card className="p-6 bg-primary-50">
              <h3 className="font-semibold text-primary-900 mb-3 flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Your Previous Comment
              </h3>
              <p className="text-primary-800 whitespace-pre-wrap">{log.supervisorComment}</p>
            </Card>
          )}

          {/* Review Form */}
          {canReview && (
            <Card className="p-6 bg-neutral-50">
              <h3 className="font-semibold text-neutral-900 mb-4 flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-neutral-400" />
                Review This Log
              </h3>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 mb-4"
                placeholder="Add your comments or feedback (required for revision request)..."
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={handleApprove}
                  disabled={reviewMutation.isPending}
                >
                  {reviewMutation.isPending ? (
                    <Spinner size="sm" className="mr-2" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  Approve Log
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleRequestRevision}
                  disabled={reviewMutation.isPending || !comment.trim()}
                  className="text-warning-600 border-warning-300 hover:bg-warning-50"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Request Revision
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Sign Modal */}
      {showSignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <PenTool className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-neutral-900">Sign Supervision Log</h3>
              <p className="text-neutral-600 mt-2">
                By signing, you confirm that you have reviewed this log and the information is accurate.
              </p>
            </div>
            <div className="bg-neutral-50 p-4 rounded-lg mb-6 text-sm">
              <p className="text-neutral-700">
                <strong>Student:</strong> {log.studentName}
              </p>
              <p className="text-neutral-700">
                <strong>Week:</strong> {log.weekNumber} ({new Date(log.weekStartDate).toLocaleDateString()} - {new Date(log.weekEndDate).toLocaleDateString()})
              </p>
              <p className="text-neutral-700">
                <strong>Hours:</strong> {log.hoursSpent} hours
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setShowSignModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleSign} disabled={signMutation.isPending}>
                {signMutation.isPending ? (
                  <Spinner size="sm" className="mr-2" />
                ) : (
                  <PenTool className="h-4 w-4 mr-2" />
                )}
                Sign Log
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
