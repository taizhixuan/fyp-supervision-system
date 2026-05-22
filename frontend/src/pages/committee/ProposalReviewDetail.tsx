import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Download,
  GraduationCap,
  User,
  Clock,
  CheckCircle,
  XCircle,
  RotateCcw,
  Sparkles,
  Lightbulb,
  ThumbsUp,
  ThumbsDown,
  Send,
  ExternalLink,
  History,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { useCommitteeProposal, useSubmitCommitteeProposalReview } from '@/lib/hooks/useCommittee'
import { ROUTES } from '@/lib/constants/routes'
import { cn } from '@/lib/utils/cn'
import type { CommitteeProposalStatus } from '@/types'

const statusConfig: Record<CommitteeProposalStatus, { label: string; color: string; bgColor: string; icon: typeof Clock }> = {
  PENDING_REVIEW: { label: 'Pending Review', color: 'text-warning-600', bgColor: 'bg-warning-50', icon: Clock },
  UNDER_REVIEW: { label: 'Under Review', color: 'text-info-600', bgColor: 'bg-info-50', icon: Clock },
  APPROVED: { label: 'Approved', color: 'text-success-600', bgColor: 'bg-success-50', icon: CheckCircle },
  REJECTED: { label: 'Rejected', color: 'text-error-600', bgColor: 'bg-error-50', icon: XCircle },
  REVISION_REQUESTED: { label: 'Revision Requested', color: 'text-orange-600', bgColor: 'bg-orange-50', icon: RotateCcw },
}

export function ProposalReviewDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [selectedDecision, setSelectedDecision] = useState<'APPROVED' | 'REJECTED' | 'REVISION_REQUESTED' | null>(null)
  const [feedback, setFeedback] = useState('')
  const [internalNotes, setInternalNotes] = useState('')

  const { data: proposal, isLoading } = useCommitteeProposal(Number(id))
  const submitReview = useSubmitCommitteeProposalReview()

  const handleSubmitReview = async () => {
    if (!proposal || !selectedDecision || !feedback.trim()) return

    try {
      await submitReview.mutateAsync({
        proposalId: proposal.proposalId,
        decision: selectedDecision,
        feedback,
        internalNotes: internalNotes || undefined,
      })
      navigate(ROUTES.COMMITTEE.PROPOSALS)
    } catch (error) {
      console.error('Failed to submit review:', error)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success-600'
    if (score >= 60) return 'text-warning-600'
    return 'text-error-600'
  }

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-success-500'
    if (score >= 60) return 'bg-warning-500'
    return 'bg-error-500'
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
        <Link to={ROUTES.COMMITTEE.PROPOSALS}>
          <Button className="mt-4">Back to Proposals</Button>
        </Link>
      </div>
    )
  }

  const status = statusConfig[proposal.status]
  const StatusIcon = status.icon
  const canReview = proposal.status === 'PENDING_REVIEW' || proposal.status === 'UNDER_REVIEW'

  return (
    <div className="space-y-3 lg:space-y-4">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to={ROUTES.COMMITTEE.PROPOSALS}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Queue
          </Button>
        </Link>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Proposal Info */}
        <div className="lg:col-span-2 space-y-3 lg:space-y-4">
          {/* Proposal Header */}
          <Card>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className={cn(
                    'px-3 py-1 rounded-full text-sm font-medium',
                    status.bgColor,
                    status.color
                  )}>
                    <StatusIcon className="h-4 w-4 inline mr-1" />
                    {status.label}
                  </span>
                  <span className="px-2 py-1 bg-neutral-100 text-neutral-600 rounded-full text-xs font-medium">
                    {proposal.cycle}
                  </span>
                  <span className="px-2 py-1 bg-neutral-100 text-neutral-600 rounded-full text-xs font-medium">
                    Version {proposal.version}
                  </span>
                </div>
                <h1 className="text-xl font-bold text-neutral-900">{proposal.title}</h1>
                <p className="text-sm text-neutral-500 mt-1">
                  {proposal.programme} Programme
                </p>
              </div>
              <Button variant="secondary">
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            </div>

            {/* Student & Supervisor Info */}
            <div className="grid sm:grid-cols-2 gap-4 mt-6 pt-6 border-t">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                  <GraduationCap className="h-5 w-5 text-primary-600" />
                </div>
                <div>
                  <p className="font-medium text-neutral-900">{proposal.studentName}</p>
                  <p className="text-sm text-neutral-500">{proposal.studentId}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-accent-100 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-accent-600" />
                </div>
                <div>
                  <p className="font-medium text-neutral-900">{proposal.supervisorName}</p>
                  <p className="text-sm text-neutral-500">Supervisor</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Abstract & Content */}
          {proposal.abstract && (
            <Card>
              <h3 className="font-semibold text-neutral-900 mb-3">Abstract</h3>
              <p className="text-neutral-600 leading-relaxed">{proposal.abstract}</p>
            </Card>
          )}

          {proposal.objectives && proposal.objectives.length > 0 && (
            <Card>
              <h3 className="font-semibold text-neutral-900 mb-3">Objectives</h3>
              <ul className="space-y-2">
                {proposal.objectives.map((obj, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                      {index + 1}
                    </span>
                    <span className="text-neutral-600">{obj}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {proposal.methodology && (
            <Card>
              <h3 className="font-semibold text-neutral-900 mb-3">Methodology</h3>
              <p className="text-neutral-600">{proposal.methodology}</p>
            </Card>
          )}

          {/* AI Analysis */}
          {proposal.aiAnalysis && (
            <Card className="border-2 border-accent-200">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-5 w-5 text-accent-600" />
                <h3 className="font-semibold text-neutral-900">AI Analysis</h3>
                <span className="text-xs text-neutral-500">
                  Analyzed {new Date(proposal.aiAnalysis.analyzedAt).toLocaleDateString()}
                </span>
              </div>

              {/* Overall Score */}
              <div className="flex items-center gap-4 mb-6">
                <div className={cn(
                  'w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold',
                  getScoreBgColor(proposal.aiAnalysis.overallScore)
                )}>
                  {proposal.aiAnalysis.overallScore}
                </div>
                <div>
                  <p className="font-medium text-neutral-900">Overall Score</p>
                  <p className="text-sm text-neutral-500">
                    {proposal.aiAnalysis.overallScore >= 80 ? 'Strong proposal' :
                     proposal.aiAnalysis.overallScore >= 60 ? 'Needs improvement' : 'Significant concerns'}
                  </p>
                </div>
              </div>

              {/* Score Breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                {[
                  { label: 'Feasibility', score: proposal.aiAnalysis.feasibilityScore },
                  { label: 'Innovation', score: proposal.aiAnalysis.innovationScore },
                  { label: 'Clarity', score: proposal.aiAnalysis.clarityScore },
                  { label: 'Scope', score: proposal.aiAnalysis.scopeScore },
                ].map((item) => (
                  <div key={item.label} className="text-center">
                    <div className="relative w-16 h-16 mx-auto">
                      <svg className="w-16 h-16 transform -rotate-90">
                        <circle
                          className="text-neutral-200"
                          strokeWidth="4"
                          stroke="currentColor"
                          fill="transparent"
                          r="28"
                          cx="32"
                          cy="32"
                        />
                        <circle
                          className={getScoreColor(item.score)}
                          strokeWidth="4"
                          strokeDasharray={`${item.score * 1.76} 176`}
                          strokeLinecap="round"
                          stroke="currentColor"
                          fill="transparent"
                          r="28"
                          cx="32"
                          cy="32"
                        />
                      </svg>
                      <span className={cn(
                        'absolute inset-0 flex items-center justify-center text-sm font-semibold',
                        getScoreColor(item.score)
                      )}>
                        {item.score}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500 mt-1">{item.label}</p>
                  </div>
                ))}
              </div>

              {/* Strengths & Weaknesses */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <h4 className="flex items-center gap-2 font-medium text-success-700 mb-2">
                    <ThumbsUp className="h-4 w-4" />
                    Strengths
                  </h4>
                  <ul className="space-y-1">
                    {proposal.aiAnalysis.strengths.map((strength, index) => (
                      <li key={index} className="text-sm text-neutral-600 flex items-start gap-2">
                        <span className="text-success-500 mt-0.5">+</span>
                        {strength}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="flex items-center gap-2 font-medium text-error-700 mb-2">
                    <ThumbsDown className="h-4 w-4" />
                    Weaknesses
                  </h4>
                  <ul className="space-y-1">
                    {proposal.aiAnalysis.weaknesses.map((weakness, index) => (
                      <li key={index} className="text-sm text-neutral-600 flex items-start gap-2">
                        <span className="text-error-500 mt-0.5">-</span>
                        {weakness}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Suggestions */}
              {proposal.aiAnalysis.suggestions.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <h4 className="flex items-center gap-2 font-medium text-info-700 mb-2">
                    <Lightbulb className="h-4 w-4" />
                    Suggestions
                  </h4>
                  <ul className="space-y-1">
                    {proposal.aiAnalysis.suggestions.map((suggestion, index) => (
                      <li key={index} className="text-sm text-neutral-600 flex items-start gap-2">
                        <span className="text-info-500 mt-0.5">*</span>
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>
          )}

          {/* Review History */}
          {proposal.reviewHistory.length > 0 && (
            <Card>
              <h3 className="font-semibold text-neutral-900 mb-4 flex items-center gap-2">
                <History className="h-5 w-5 text-neutral-400" />
                Review History
              </h3>
              <div className="space-y-4">
                {proposal.reviewHistory.map((review) => (
                  <div key={review.reviewId} className="p-4 bg-neutral-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-neutral-900">{review.reviewerName}</span>
                        <span className={cn(
                          'px-2 py-0.5 rounded-full text-xs font-medium',
                          review.decision === 'APPROVED' ? 'bg-success-50 text-success-700' :
                          review.decision === 'REJECTED' ? 'bg-error-50 text-error-700' :
                          'bg-orange-50 text-orange-700'
                        )}>
                          {review.decision.replace('_', ' ')}
                        </span>
                      </div>
                      <span className="text-xs text-neutral-500">
                        {new Date(review.reviewedAt).toLocaleDateString('en-MY', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-neutral-600">{review.feedback}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Right Column - Review Form */}
        <div className="space-y-3 lg:space-y-4">
          {/* Quick Info */}
          <Card>
            <h3 className="font-semibold text-neutral-900 mb-4">Submission Info</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-neutral-500">Submitted</span>
                <span className="font-medium">
                  {new Date(proposal.submittedAt).toLocaleDateString('en-MY', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-500">Programme</span>
                <span className="font-medium">{proposal.programme}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-500">Cycle</span>
                <span className="font-medium">{proposal.cycle}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-500">Version</span>
                <span className="font-medium">{proposal.version}</span>
              </div>
            </div>

            <Button variant="secondary" className="w-full mt-4">
              <ExternalLink className="h-4 w-4 mr-2" />
              View Full Document
            </Button>
          </Card>

          {/* Review Form */}
          {canReview && (
            <Card>
              <h3 className="font-semibold text-neutral-900 mb-4">Submit Review</h3>

              {/* Decision Buttons */}
              <div className="space-y-2 mb-4">
                <button
                  onClick={() => setSelectedDecision('APPROVED')}
                  className={cn(
                    'w-full p-3 rounded-lg border-2 flex items-center gap-3 transition-colors',
                    selectedDecision === 'APPROVED'
                      ? 'border-success-500 bg-success-50'
                      : 'border-neutral-200 hover:bg-neutral-50'
                  )}
                >
                  <CheckCircle className={cn(
                    'h-5 w-5',
                    selectedDecision === 'APPROVED' ? 'text-success-600' : 'text-neutral-400'
                  )} />
                  <div className="text-left">
                    <p className="font-medium text-neutral-900">Approve</p>
                    <p className="text-xs text-neutral-500">Proposal meets requirements</p>
                  </div>
                </button>

                <button
                  onClick={() => setSelectedDecision('REVISION_REQUESTED')}
                  className={cn(
                    'w-full p-3 rounded-lg border-2 flex items-center gap-3 transition-colors',
                    selectedDecision === 'REVISION_REQUESTED'
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-neutral-200 hover:bg-neutral-50'
                  )}
                >
                  <RotateCcw className={cn(
                    'h-5 w-5',
                    selectedDecision === 'REVISION_REQUESTED' ? 'text-orange-600' : 'text-neutral-400'
                  )} />
                  <div className="text-left">
                    <p className="font-medium text-neutral-900">Request Revision</p>
                    <p className="text-xs text-neutral-500">Needs changes before approval</p>
                  </div>
                </button>

                <button
                  onClick={() => setSelectedDecision('REJECTED')}
                  className={cn(
                    'w-full p-3 rounded-lg border-2 flex items-center gap-3 transition-colors',
                    selectedDecision === 'REJECTED'
                      ? 'border-error-500 bg-error-50'
                      : 'border-neutral-200 hover:bg-neutral-50'
                  )}
                >
                  <XCircle className={cn(
                    'h-5 w-5',
                    selectedDecision === 'REJECTED' ? 'text-error-600' : 'text-neutral-400'
                  )} />
                  <div className="text-left">
                    <p className="font-medium text-neutral-900">Reject</p>
                    <p className="text-xs text-neutral-500">Does not meet requirements</p>
                  </div>
                </button>
              </div>

              {/* Feedback */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Feedback to Student *
                </label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                  placeholder="Provide constructive feedback..."
                />
              </div>

              {/* Internal Notes */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Internal Notes (Optional)
                </label>
                <textarea
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                  placeholder="Notes for committee only..."
                />
                <p className="text-xs text-neutral-500 mt-1">Not visible to student</p>
              </div>

              <Button
                onClick={handleSubmitReview}
                disabled={!selectedDecision || !feedback.trim() || submitReview.isPending}
                className="w-full"
              >
                {submitReview.isPending ? (
                  <Spinner size="sm" className="mr-2" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Submit Review
              </Button>
            </Card>
          )}

          {/* Already Reviewed */}
          {!canReview && (
            <Card className="bg-neutral-50">
              <div className="text-center">
                <StatusIcon className={cn('h-12 w-12 mx-auto mb-3', status.color)} />
                <h3 className="font-medium text-neutral-900">Proposal {status.label}</h3>
                <p className="text-sm text-neutral-500 mt-1">
                  This proposal has already been reviewed
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
