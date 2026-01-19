import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  FileText,
  Search,
  Clock,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  GraduationCap,
  Brain,
  History,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import { useProposalsForReview } from '@/lib/hooks/useSupervisor'
import { ROUTES } from '@/lib/constants/routes'
import { cn } from '@/lib/utils/cn'
import type { ProposalStatus } from '@/types'

const statusConfig: Record<ProposalStatus, { label: string; color: string; bgColor: string; icon: typeof Clock }> = {
  NOT_SUBMITTED: { label: 'Not Submitted', color: 'text-neutral-500', bgColor: 'bg-neutral-100', icon: AlertCircle },
  DRAFT: { label: 'Draft', color: 'text-neutral-500', bgColor: 'bg-neutral-100', icon: FileText },
  SUBMITTED: { label: 'Submitted', color: 'text-info-600', bgColor: 'bg-info-50', icon: Clock },
  UNDER_REVIEW: { label: 'Under Review', color: 'text-warning-600', bgColor: 'bg-warning-50', icon: Clock },
  REVISION_REQUIRED: { label: 'Revision Required', color: 'text-orange-600', bgColor: 'bg-orange-50', icon: AlertCircle },
  APPROVED: { label: 'Approved', color: 'text-success-600', bgColor: 'bg-success-50', icon: CheckCircle },
  REJECTED: { label: 'Rejected', color: 'text-error-600', bgColor: 'bg-error-50', icon: AlertCircle },
}

const filterOptions = [
  { value: 'all', label: 'All Proposals' },
  { value: 'SUBMITTED', label: 'Submitted' },
  { value: 'UNDER_REVIEW', label: 'Under Review' },
  { value: 'REVISION_REQUIRED', label: 'Needs Revision' },
  { value: 'APPROVED', label: 'Approved' },
]

export function ProposalReviewQueue() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const { data, isLoading } = useProposalsForReview()

  const filteredProposals = data?.proposals
    .filter((proposal) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return (
          proposal.studentName.toLowerCase().includes(query) ||
          proposal.title.toLowerCase().includes(query)
        )
      }
      return true
    })
    .filter((proposal) => {
      if (statusFilter === 'all') return true
      return proposal.status === statusFilter
    })

  const pendingCount = data?.proposals.filter(
    (p) => p.status === 'SUBMITTED' || p.status === 'UNDER_REVIEW'
  ).length ?? 0

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
            <FileText className="h-7 w-7 text-primary-600" />
            Proposal Review
          </h1>
          <p className="text-neutral-600 mt-1">
            Review and provide feedback on student proposals
          </p>
        </div>
        {pendingCount > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 bg-warning-50 border border-warning-200 rounded-lg">
            <Clock className="h-5 w-5 text-warning-600" />
            <span className="text-sm font-medium text-warning-700">
              {pendingCount} proposal{pendingCount > 1 ? 's' : ''} awaiting review
            </span>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Status Tabs */}
        <div className="flex items-center gap-1 p-1 bg-neutral-100 rounded-lg overflow-x-auto">
          {filterOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setStatusFilter(option.value)}
              className={cn(
                'px-3 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap',
                statusFilter === option.value
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-600 hover:text-neutral-900'
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
            placeholder="Search by student or title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Proposal List */}
      <div className="space-y-4">
        {filteredProposals && filteredProposals.length > 0 ? (
          filteredProposals.map((proposal) => {
            const status = statusConfig[proposal.status]
            const StatusIcon = status.icon
            return (
              <Link
                key={proposal.proposalId}
                to={ROUTES.SUPERVISOR.PROPOSAL_DETAIL.replace(':id', String(proposal.proposalId))}
              >
                <Card className={cn(
                  'p-4 hover:shadow-md transition-shadow cursor-pointer',
                  (proposal.status === 'SUBMITTED' || proposal.status === 'UNDER_REVIEW') &&
                    'border-l-4 border-l-warning-400'
                )}>
                  <div className="flex items-start gap-4">
                    {/* Student Avatar */}
                    <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <GraduationCap className="h-6 w-6 text-primary-600" />
                    </div>

                    {/* Proposal Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-semibold text-neutral-900">{proposal.title}</h3>
                          <p className="text-sm text-neutral-500">
                            by {proposal.studentName} | Version {proposal.version}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium',
                            status.bgColor,
                            status.color
                          )}>
                            <StatusIcon className="h-3.5 w-3.5" />
                            {status.label}
                          </span>
                          <ChevronRight className="h-5 w-5 text-neutral-400" />
                        </div>
                      </div>

                      {/* AI Analysis Score (if available) */}
                      {proposal.aiAnalysis && (
                        <div className="mt-3 flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <Brain className="h-4 w-4 text-primary-500" />
                            <span className="text-sm text-neutral-600">AI Score:</span>
                            <span className={cn(
                              'text-sm font-semibold',
                              proposal.aiAnalysis.overallScore >= 80 ? 'text-success-600' :
                              proposal.aiAnalysis.overallScore >= 60 ? 'text-warning-600' : 'text-error-600'
                            )}>
                              {proposal.aiAnalysis.overallScore}/100
                            </span>
                          </div>
                          <div className="h-4 w-px bg-neutral-200" />
                          <div className="text-sm text-neutral-500">
                            Clarity: {proposal.aiAnalysis.clarityScore} |
                            Feasibility: {proposal.aiAnalysis.feasibilityScore}
                          </div>
                        </div>
                      )}

                      {/* Metadata */}
                      <div className="mt-3 flex items-center justify-between text-xs text-neutral-500">
                        <div className="flex items-center gap-4">
                          {proposal.previousVersions.length > 0 && (
                            <span className="flex items-center gap-1">
                              <History className="h-3.5 w-3.5" />
                              {proposal.previousVersions.length} revision{proposal.previousVersions.length > 1 ? 's' : ''}
                            </span>
                          )}
                          {proposal.feedbackHistory.length > 0 && (
                            <span>
                              {proposal.feedbackHistory.length} feedback{proposal.feedbackHistory.length > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                        <span>
                          Submitted {new Date(proposal.submittedAt).toLocaleDateString('en-MY', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            )
          })
        ) : (
          <Card className="p-12 text-center">
            <FileText className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-neutral-900">No proposals found</h3>
            <p className="text-neutral-500 mt-1">
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'No proposals to review at the moment'}
            </p>
          </Card>
        )}
      </div>

      {/* Summary Stats */}
      {data && data.proposals.length > 0 && (
        <Card className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-neutral-900">{data.total}</p>
              <p className="text-sm text-neutral-500">Total Proposals</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-info-600">
                {data.proposals.filter((p) => p.status === 'SUBMITTED').length}
              </p>
              <p className="text-sm text-neutral-500">Submitted</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-warning-600">
                {data.proposals.filter((p) => p.status === 'UNDER_REVIEW').length}
              </p>
              <p className="text-sm text-neutral-500">Under Review</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-600">
                {data.proposals.filter((p) => p.status === 'REVISION_REQUIRED').length}
              </p>
              <p className="text-sm text-neutral-500">Needs Revision</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-success-600">
                {data.proposals.filter((p) => p.status === 'APPROVED').length}
              </p>
              <p className="text-sm text-neutral-500">Approved</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
