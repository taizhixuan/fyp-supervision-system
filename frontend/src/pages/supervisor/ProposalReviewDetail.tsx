import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Brain,
  History,
  MessageSquare,
  ThumbsUp,
  RotateCcw,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { XCircle } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { ProposalContentSections } from '@/components/common/ProposalContentSections'
import { useProposalForReview, useSubmitSvProposalFeedback } from '@/lib/hooks/useSupervisor'
import { ROUTES } from '@/lib/constants/routes'
import { cn } from '@/lib/utils/cn'
import type { SvProposalStatus, SvProposalFeedback } from '@/types'

const statusConfig: Record<SvProposalStatus, { label: string; color: string; bgColor: string }> = {
  NOT_SUBMITTED: { label: 'Not Submitted', color: 'text-neutral-500', bgColor: 'bg-neutral-100' },
  DRAFT: { label: 'Draft', color: 'text-neutral-500', bgColor: 'bg-neutral-100' },
  SUBMITTED: { label: 'Submitted', color: 'text-info-600', bgColor: 'bg-info-50' },
  UNDER_REVIEW: { label: 'Under Review', color: 'text-warning-600', bgColor: 'bg-warning-50' },
  REVISION_REQUIRED: { label: 'Revision Required', color: 'text-orange-600', bgColor: 'bg-orange-50' },
  APPROVED: { label: 'Approved', color: 'text-success-600', bgColor: 'bg-success-50' },
  REJECTED: { label: 'Rejected', color: 'text-error-600', bgColor: 'bg-error-50' },
}

export function ProposalReviewDetail() {
  const { id } = useParams<{ id: string }>()
  const [feedbackContent, setFeedbackContent] = useState('')
  const [showVersionHistory, setShowVersionHistory] = useState(false)
  const [openVersionId, setOpenVersionId] = useState<string | number | null>(null)
  const [showFeedbackHistory, setShowFeedbackHistory] = useState(false)
  const [, setActionType] = useState<SvProposalFeedback['feedbackType'] | null>(null)

  const { data: proposal, isLoading } = useProposalForReview(Number(id))
  const submitFeedback = useSubmitSvProposalFeedback()

  const handleSubmitFeedback = async (type: SvProposalFeedback['feedbackType']) => {
    if (!proposal || !feedbackContent.trim()) return
    try {
      await submitFeedback.mutateAsync({
        proposalId: proposal.proposalId,
        content: feedbackContent,
        feedbackType: type,
      })
      setFeedbackContent('')
      setActionType(null)
    } catch (error) {
      console.error('Failed to submit feedback:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!proposal) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-neutral-900">Proposal not found</h2>
        <p className="text-neutral-600 mt-2">The proposal you're looking for doesn't exist.</p>
        <Link to={ROUTES.SUPERVISOR.PROPOSALS}>
          <Button className="mt-4">Back to Proposals</Button>
        </Link>
      </div>
    )
  }

  const status = statusConfig[proposal.status]
  // Supervisor is the first reviewer: they act only while the proposal awaits them
  // (SUBMITTED). Once approved it moves to the committee (UNDER_REVIEW).
  const canReview = proposal.status === 'SUBMITTED'

  return (
    <div className="space-y-3 lg:space-y-4">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to={ROUTES.SUPERVISOR.PROPOSALS}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Proposals
          </Button>
        </Link>
      </div>

      {/* Title and Status */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">{proposal.title}</h1>
          <p className="text-neutral-600 mt-1">
            by {proposal.studentName} | Version {proposal.version}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className={cn(
            'px-3 py-1.5 rounded-full text-sm font-medium',
            status.bgColor,
            status.color
          )}>
            {status.label}
          </span>
          {canReview && (
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                onClick={() => setActionType('REVISION_REQUEST')}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Request Revision
              </Button>
              <Button onClick={() => setActionType('APPROVAL')}>
                <ThumbsUp className="h-4 w-4 mr-2" />
                Approve
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Sidebar */}
        <div className="lg:col-span-1 space-y-3 lg:space-y-4">
          {/* AI Analysis */}
          {proposal.aiAnalysis && (
            <Card>
              <h3 className="font-semibold text-neutral-900 mb-4 flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary-500" />
                AI Analysis
              </h3>

              {/* Overall Score */}
              <div className="text-center mb-4">
                <div className={cn(
                  'inline-flex items-center justify-center w-20 h-20 rounded-full text-2xl font-bold',
                  proposal.aiAnalysis.overallScore >= 80 ? 'bg-success-100 text-success-700' :
                  proposal.aiAnalysis.overallScore >= 60 ? 'bg-warning-100 text-warning-700' :
                  'bg-error-100 text-error-700'
                )}>
                  {proposal.aiAnalysis.overallScore}
                </div>
                <p className="text-sm text-neutral-500 mt-2">Overall Score</p>
              </div>

              {/* Score Breakdown */}
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-neutral-600">Clarity</span>
                    <span className="font-medium">{proposal.aiAnalysis.clarityScore}%</span>
                  </div>
                  <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-500 rounded-full"
                      style={{ width: `${proposal.aiAnalysis.clarityScore}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-neutral-600">Feasibility</span>
                    <span className="font-medium">{proposal.aiAnalysis.feasibilityScore}%</span>
                  </div>
                  <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-500 rounded-full"
                      style={{ width: `${proposal.aiAnalysis.feasibilityScore}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-neutral-600">Originality</span>
                    <span className="font-medium">{proposal.aiAnalysis.originality}%</span>
                  </div>
                  <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-500 rounded-full"
                      style={{ width: `${proposal.aiAnalysis.originality}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Strengths & Weaknesses */}
              <div className="mt-4 pt-4 border-t border-neutral-200">
                {proposal.aiAnalysis.strengths.length > 0 && (
                  <div className="mb-3">
                    <p className="text-sm font-medium text-success-700 mb-1">Strengths</p>
                    <ul className="text-sm text-neutral-600 space-y-1">
                      {proposal.aiAnalysis.strengths.map((s, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-success-500 mt-0.5 flex-shrink-0" />
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {proposal.aiAnalysis.weaknesses.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-error-700 mb-1">Areas for Improvement</p>
                    <ul className="text-sm text-neutral-600 space-y-1">
                      {proposal.aiAnalysis.weaknesses.map((w, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 text-warning-500 mt-0.5 flex-shrink-0" />
                          {w}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <p className="text-xs text-neutral-400 mt-4">
                Analyzed on {new Date(proposal.aiAnalysis.analyzedAt).toLocaleDateString()}
              </p>
            </Card>
          )}

          {/* Version History */}
          {proposal.previousVersions.length > 0 && (
            <Card className="overflow-hidden">
              <button
                onClick={() => setShowVersionHistory(!showVersionHistory)}
                className="w-full p-4 flex items-center justify-between hover:bg-neutral-50"
              >
                <h3 className="font-semibold text-neutral-900 flex items-center gap-2">
                  <History className="h-5 w-5 text-neutral-400" />
                  Version History
                </h3>
                {showVersionHistory ? (
                  <ChevronUp className="h-5 w-5 text-neutral-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-neutral-400" />
                )}
              </button>
              {showVersionHistory && (
                <div className="px-4 pb-4">
                  <div className="space-y-2">
                    {proposal.previousVersions.map((version) => (
                      <div key={version.versionId}>
                        <button
                          type="button"
                          onClick={() =>
                            setOpenVersionId(openVersionId === version.versionId ? null : version.versionId)
                          }
                          className="w-full flex items-center justify-between p-2 bg-neutral-50 rounded-lg text-sm hover:bg-neutral-100"
                        >
                          <span>Version {version.version}</span>
                          <span className="flex items-center gap-2">
                            <span className={cn(
                              'px-2 py-0.5 rounded-full text-xs',
                              statusConfig[version.status].bgColor,
                              statusConfig[version.status].color
                            )}>
                              {statusConfig[version.status].label}
                            </span>
                            {openVersionId === version.versionId ? (
                              <ChevronUp className="h-4 w-4 text-neutral-400" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-neutral-400" />
                            )}
                          </span>
                        </button>
                        {openVersionId === version.versionId && version.content && (
                          <div className="mt-2">
                            <ProposalContentSections
                              content={version.content}
                              downloadPath={version.fileName ? `/supervisor/proposals/${proposal.proposalId}/attachment?versionId=${version.versionId}` : undefined}
                              fileName={version.fileName}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* Feedback History */}
          {proposal.feedbackHistory.length > 0 && (
            <Card className="overflow-hidden">
              <button
                onClick={() => setShowFeedbackHistory(!showFeedbackHistory)}
                className="w-full p-4 flex items-center justify-between hover:bg-neutral-50"
              >
                <h3 className="font-semibold text-neutral-900 flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-neutral-400" />
                  Feedback History ({proposal.feedbackHistory.length})
                </h3>
                {showFeedbackHistory ? (
                  <ChevronUp className="h-5 w-5 text-neutral-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-neutral-400" />
                )}
              </button>
              {showFeedbackHistory && (
                <div className="px-4 pb-4 space-y-3">
                  {proposal.feedbackHistory.map((feedback) => (
                    <div
                      key={feedback.feedbackId}
                      className="p-3 bg-neutral-50 rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-neutral-900">
                          {feedback.supervisorName}
                        </span>
                        <span className={cn(
                          'px-2 py-0.5 rounded-full text-xs',
                          feedback.feedbackType === 'APPROVAL' ? 'bg-success-100 text-success-700' :
                          feedback.feedbackType === 'REVISION_REQUEST' ? 'bg-warning-100 text-warning-700' :
                          feedback.feedbackType === 'REJECTION' ? 'bg-error-100 text-error-700' :
                          'bg-neutral-100 text-neutral-700'
                        )}>
                          {feedback.feedbackType.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-sm text-neutral-600">{feedback.content}</p>
                      <p className="text-xs text-neutral-400 mt-2">
                        {new Date(feedback.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}
        </div>

        {/* Right Column - Proposal Content */}
        <div className="lg:col-span-2 space-y-3 lg:space-y-4">
          <ProposalContentSections
            content={proposal.content}
            downloadPath={proposal.fileName ? `/supervisor/proposals/${proposal.proposalId}/attachment` : undefined}
            fileName={proposal.fileName}
          />

          {/* Feedback Form */}
          {canReview && (
            <Card className="bg-neutral-50">
              <h3 className="font-semibold text-neutral-900 mb-4 flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-neutral-400" />
                Provide Feedback
              </h3>
              <textarea
                value={feedbackContent}
                onChange={(e) => setFeedbackContent(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 mb-4"
                placeholder="Enter your feedback or comments..."
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  onClick={() => handleSubmitFeedback('COMMENT')}
                  disabled={!feedbackContent.trim() || submitFeedback.isPending}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Add Comment
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => handleSubmitFeedback('REVISION_REQUEST')}
                  disabled={!feedbackContent.trim() || submitFeedback.isPending}
                  className="text-warning-600 border-warning-300 hover:bg-warning-50"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Request Revision
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => handleSubmitFeedback('REJECTION')}
                  disabled={!feedbackContent.trim() || submitFeedback.isPending}
                  className="text-error-600 border-error-300 hover:bg-error-50"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
                <Button
                  onClick={() => handleSubmitFeedback('APPROVAL')}
                  disabled={submitFeedback.isPending}
                >
                  {submitFeedback.isPending ? (
                    <Spinner size="sm" className="mr-2" />
                  ) : (
                    <ThumbsUp className="h-4 w-4 mr-2" />
                  )}
                  Approve Proposal
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
