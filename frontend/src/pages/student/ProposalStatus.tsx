import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  FileText,
  MessageSquare,
  User,
  Edit,
} from 'lucide-react'
import { Card, Button, Badge, Spinner } from '@/components/ui'
import { useCurrentProposal, useProposalFeedback, useProjectRegistration } from '@/lib/hooks/useStudent'
import { ROUTES } from '@/lib/constants/routes'
import { cn } from '@/lib/utils/cn'
import type { ProposalStatus as ProposalStatusType } from '@/types'

const statusConfig: Record<ProposalStatusType, { label: string; color: string; icon: typeof Clock; description: string }> = {
  DRAFT: { label: 'Draft', color: 'bg-neutral-100 text-neutral-700', icon: FileText, description: 'Your proposal is in draft mode. Complete all sections and submit for review.' },
  SUBMITTED: { label: 'Submitted', color: 'bg-primary-100 text-primary-700', icon: Clock, description: 'Your proposal has been submitted and is waiting for review.' },
  UNDER_REVIEW: { label: 'Under Review', color: 'bg-warning-100 text-warning-700', icon: Clock, description: 'Your proposal is being reviewed by your supervisor and the committee.' },
  REVISION_REQUIRED: { label: 'Revision Required', color: 'bg-error-100 text-error-700', icon: AlertCircle, description: 'Your proposal requires revisions based on feedback received.' },
  APPROVED: { label: 'Approved', color: 'bg-success-100 text-success-700', icon: CheckCircle, description: 'Congratulations! Your proposal has been approved.' },
  REJECTED: { label: 'Rejected', color: 'bg-error-100 text-error-700', icon: XCircle, description: 'Your proposal has been rejected. Please consult with your supervisor.' },
}

const sectionStatusColors = {
  OK: 'bg-success-100 text-success-700',
  NEEDS_IMPROVEMENT: 'bg-warning-100 text-warning-700',
  MISSING: 'bg-error-100 text-error-700',
}

export function ProposalStatus() {
  const { data: proposal, isLoading: loadingProposal } = useCurrentProposal()
  const { data: feedbackData, isLoading: loadingFeedback } = useProposalFeedback()
  const { data: registration } = useProjectRegistration()

  const feedback = feedbackData?.feedback ?? []
  const timeline = registration?.timeline ?? []

  if (loadingProposal || loadingFeedback) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" label="Loading status..." />
      </div>
    )
  }

  if (!proposal) {
    return (
      <div className="space-y-6">
        <Link
          to={ROUTES.STUDENT.PROPOSAL}
          className="inline-flex items-center gap-2 text-neutral-600 hover:text-primary-600 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Proposal
        </Link>
        <Card className="text-center py-12">
          <FileText className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
          <h2 className="text-lg font-medium text-neutral-900 mb-2">No proposal yet</h2>
          <p className="text-neutral-500 mb-4">
            Once you start your proposal, its review status and timeline will appear here.
          </p>
          <Link to={ROUTES.STUDENT.PROPOSAL}>
            <Button variant="primary">Go to Proposal Workspace</Button>
          </Link>
        </Card>
      </div>
    )
  }

  const currentProposal = proposal
  const status = statusConfig[currentProposal.status]
  const StatusIcon = status.icon

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link
        to={ROUTES.STUDENT.PROPOSAL}
        className="inline-flex items-center gap-2 text-neutral-600 hover:text-primary-600 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Proposal
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Proposal Status</h1>
        <p className="text-neutral-600 mt-1">Track the progress of your proposal</p>
      </div>

      {/* Status Card */}
      <Card className={cn('border-2', currentProposal.status === 'APPROVED' ? 'border-success-300 bg-success-50' : currentProposal.status === 'REVISION_REQUIRED' ? 'border-warning-300 bg-warning-50' : '')}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className={cn('w-14 h-14 rounded-full flex items-center justify-center', status.color)}>
            <StatusIcon className="h-7 w-7" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-xl font-semibold text-neutral-900">{status.label}</h2>
              <Badge className={status.color}>{currentProposal.status.replace(/_/g, ' ')}</Badge>
            </div>
            <p className="text-neutral-600">{status.description}</p>
            <p className="text-sm text-neutral-500 mt-2">
              Version {currentProposal.version} • Last updated {new Date(currentProposal.updatedAt).toLocaleDateString('en-MY')}
            </p>
          </div>
          {['DRAFT', 'REVISION_REQUIRED'].includes(currentProposal.status) && (
            <Link to={ROUTES.STUDENT.PROPOSAL}>
              <Button variant="primary" leftIcon={<Edit className="h-4 w-4" />}>
                Edit Proposal
              </Button>
            </Link>
          )}
        </div>
      </Card>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Feedback Section */}
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-lg font-semibold text-neutral-900">Review Feedback</h3>

          {feedback.length === 0 ? (
            <Card className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-neutral-300 mx-auto mb-3" />
              <p className="text-neutral-500">No feedback received yet</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {feedback.map((fb) => (
                <Card key={fb.feedbackId}>
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
                      fb.reviewerType === 'SUPERVISOR' ? 'bg-primary-100' : 'bg-warning-100'
                    )}>
                      <User className={cn(
                        'h-5 w-5',
                        fb.reviewerType === 'SUPERVISOR' ? 'text-primary-600' : 'text-warning-600'
                      )} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div>
                          <h4 className="font-medium text-neutral-900">{fb.reviewerName}</h4>
                          <p className="text-sm text-neutral-500">
                            {fb.reviewerType === 'SUPERVISOR' ? 'Supervisor' : 'FYP Committee'}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge
                            variant={fb.status === 'APPROVED' ? 'success' : fb.status === 'REJECTED' ? 'error' : 'warning'}
                            size="sm"
                          >
                            {fb.status.replace(/_/g, ' ')}
                          </Badge>
                          <p className="text-xs text-neutral-400 mt-1">
                            {new Date(fb.createdAt).toLocaleDateString('en-MY')}
                          </p>
                        </div>
                      </div>

                      <p className="text-neutral-700 mb-4">{fb.comments}</p>

                      {/* Detailed Feedback */}
                      {fb.detailedFeedback && fb.detailedFeedback.length > 0 && (
                        <div className="space-y-2 pt-4 border-t border-neutral-200">
                          <h5 className="text-sm font-medium text-neutral-700">Section Feedback</h5>
                          {fb.detailedFeedback.map((section, index) => (
                            <div key={index} className="flex items-start gap-3 p-3 bg-neutral-50 rounded-lg">
                              <Badge className={sectionStatusColors[section.status]} size="sm">
                                {section.status.replace(/_/g, ' ')}
                              </Badge>
                              <div className="flex-1">
                                <p className="font-medium text-neutral-900">{section.section}</p>
                                {section.comment && (
                                  <p className="text-sm text-neutral-600 mt-1">{section.comment}</p>
                                )}
                                {section.suggestions && section.suggestions.length > 0 && (
                                  <ul className="mt-2 text-sm text-neutral-600 space-y-1">
                                    {section.suggestions.map((suggestion, i) => (
                                      <li key={i} className="flex items-start gap-2">
                                        <span className="text-primary-600">•</span>
                                        {suggestion}
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Timeline Sidebar */}
        <div>
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">Activity Timeline</h3>
          <Card>
            {timeline.length === 0 ? (
              <p className="text-sm text-neutral-500 text-center py-6">
                No activity recorded yet.
              </p>
            ) : (
            <div className="relative">
              {/* Timeline Line */}
              <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-neutral-200" />

              <div className="space-y-4">
                {timeline.map((event) => (
                  <div key={event.eventId} className="relative flex gap-4 pl-8">
                    {/* Dot */}
                    <div
                      className={cn(
                        'absolute left-0 w-6 h-6 rounded-full flex items-center justify-center',
                        event.type === 'SUBMISSION'
                          ? 'bg-primary-100'
                          : event.type === 'FEEDBACK'
                          ? 'bg-warning-100'
                          : 'bg-neutral-100'
                      )}
                    >
                      {event.type === 'SUBMISSION' ? (
                        <FileText className="h-3 w-3 text-primary-600" />
                      ) : event.type === 'FEEDBACK' ? (
                        <MessageSquare className="h-3 w-3 text-warning-600" />
                      ) : (
                        <Clock className="h-3 w-3 text-neutral-600" />
                      )}
                    </div>

                    <div className="flex-1 pb-4">
                      <p className="font-medium text-neutral-900 text-sm">{event.title}</p>
                      <p className="text-xs text-neutral-500 mt-0.5">{event.description}</p>
                      <p className="text-xs text-neutral-400 mt-1">
                        {new Date(event.timestamp).toLocaleDateString('en-MY', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
