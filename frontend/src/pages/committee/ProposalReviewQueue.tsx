import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  FileText,
  Search,
  Filter,
  Clock,
  CheckCircle,
  XCircle,
  RotateCcw,
  ChevronRight,
  Sparkles,
  GraduationCap,
  User,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import { useCommitteeProposals } from '@/lib/hooks/useCommittee'
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

export function ProposalReviewQueue() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<CommitteeProposalStatus | 'ALL'>('ALL')
  const [cycleFilter, setCycleFilter] = useState<'FYP1' | 'FYP2' | 'ALL'>('ALL')

  const { data, isLoading } = useCommitteeProposals({
    status: statusFilter !== 'ALL' ? statusFilter : undefined,
    cycle: cycleFilter !== 'ALL' ? cycleFilter : undefined,
  })

  const filteredProposals = data?.proposals.filter((proposal) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      proposal.title.toLowerCase().includes(query) ||
      proposal.studentName.toLowerCase().includes(query) ||
      proposal.studentId.toLowerCase().includes(query) ||
      proposal.supervisorName.toLowerCase().includes(query)
    )
  })

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success-600'
    if (score >= 60) return 'text-warning-600'
    return 'text-error-600'
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    )
  }

  const pendingCount = data?.proposals.filter((p) => p.status === 'PENDING_REVIEW').length ?? 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
            <FileText className="h-7 w-7 text-primary-600" />
            Proposal Review Queue
          </h1>
          <p className="text-neutral-600 mt-1">
            Review and approve student project proposals
          </p>
        </div>
        {pendingCount > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-warning-50 border border-warning-200 rounded-lg">
            <Clock className="h-5 w-5 text-warning-600" />
            <span className="font-medium text-warning-700">
              {pendingCount} proposal{pendingCount > 1 ? 's' : ''} pending review
            </span>
          </div>
        )}
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <Input
              type="text"
              placeholder="Search by title, student, or supervisor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as CommitteeProposalStatus | 'ALL')}
              className="px-3 py-2 border border-neutral-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500"
            >
              <option value="ALL">All Status</option>
              <option value="PENDING_REVIEW">Pending Review</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="REVISION_REQUESTED">Revision Requested</option>
            </select>
            <select
              value={cycleFilter}
              onChange={(e) => setCycleFilter(e.target.value as 'FYP1' | 'FYP2' | 'ALL')}
              className="px-3 py-2 border border-neutral-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500"
            >
              <option value="ALL">All Cycles</option>
              <option value="FYP1">FYP1</option>
              <option value="FYP2">FYP2</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Status Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {(Object.keys(statusConfig) as CommitteeProposalStatus[]).map((status) => {
          const config = statusConfig[status]
          const count = data?.proposals.filter((p) => p.status === status).length ?? 0
          const Icon = config.icon
          return (
            <button
              key={status}
              onClick={() => setStatusFilter(statusFilter === status ? 'ALL' : status)}
              className={cn(
                'p-3 rounded-lg border transition-colors text-left',
                statusFilter === status
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-neutral-200 hover:bg-neutral-50'
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon className={cn('h-4 w-4', config.color)} />
                <span className="text-lg font-bold text-neutral-900">{count}</span>
              </div>
              <p className="text-xs text-neutral-500">{config.label}</p>
            </button>
          )
        })}
      </div>

      {/* Proposals List */}
      <div className="space-y-4">
        {filteredProposals && filteredProposals.length > 0 ? (
          filteredProposals.map((proposal) => {
            const status = statusConfig[proposal.status]
            const StatusIcon = status.icon

            return (
              <Link
                key={proposal.proposalId}
                to={ROUTES.COMMITTEE.PROPOSAL_DETAIL.replace(':id', String(proposal.proposalId))}
              >
                <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-start gap-4">
                    {/* Status Icon */}
                    <div className={cn('p-2 rounded-lg', status.bgColor)}>
                      <StatusIcon className={cn('h-5 w-5', status.color)} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-semibold text-neutral-900 line-clamp-1">
                            {proposal.title}
                          </h3>
                          <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-neutral-600">
                            <span className="flex items-center gap-1">
                              <GraduationCap className="h-4 w-4" />
                              {proposal.studentName} ({proposal.studentId})
                            </span>
                            <span className="flex items-center gap-1">
                              <User className="h-4 w-4" />
                              {proposal.supervisorName}
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-neutral-400 flex-shrink-0" />
                      </div>

                      {/* Tags & AI Score */}
                      <div className="flex flex-wrap items-center gap-2 mt-3">
                        <span className={cn(
                          'px-2 py-0.5 rounded-full text-xs font-medium',
                          status.bgColor,
                          status.color
                        )}>
                          {status.label}
                        </span>
                        <span className="px-2 py-0.5 bg-neutral-100 text-neutral-600 rounded-full text-xs font-medium">
                          {proposal.cycle}
                        </span>
                        <span className="px-2 py-0.5 bg-neutral-100 text-neutral-600 rounded-full text-xs font-medium">
                          {proposal.programme}
                        </span>
                        <span className="px-2 py-0.5 bg-neutral-100 text-neutral-600 rounded-full text-xs font-medium">
                          v{proposal.version}
                        </span>

                        {/* AI Score */}
                        {proposal.aiAnalysis && (
                          <span className="flex items-center gap-1 px-2 py-0.5 bg-accent-50 rounded-full text-xs font-medium">
                            <Sparkles className="h-3 w-3 text-accent-600" />
                            <span className={getScoreColor(proposal.aiAnalysis.overallScore)}>
                              AI Score: {proposal.aiAnalysis.overallScore}%
                            </span>
                          </span>
                        )}
                      </div>

                      {/* Submission Info */}
                      <div className="flex items-center gap-4 mt-2 text-xs text-neutral-500">
                        <span>
                          Submitted {new Date(proposal.submittedAt).toLocaleDateString('en-MY', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                        {proposal.reviewHistory.length > 0 && (
                          <span>{proposal.reviewHistory.length} review(s)</span>
                        )}
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
              {searchQuery || statusFilter !== 'ALL' || cycleFilter !== 'ALL'
                ? 'Try adjusting your filters'
                : 'No proposals have been submitted yet'}
            </p>
          </Card>
        )}
      </div>

      {/* Summary */}
      {data && data.proposals.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-neutral-600">
              Showing {filteredProposals?.length ?? 0} of {data.total} proposals
            </span>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-success-600">
                {data.proposals.filter((p) => p.status === 'APPROVED').length} approved
              </span>
              <span className="text-warning-600">
                {data.proposals.filter((p) => p.status === 'PENDING_REVIEW' || p.status === 'UNDER_REVIEW').length} pending
              </span>
              <span className="text-error-600">
                {data.proposals.filter((p) => p.status === 'REJECTED').length} rejected
              </span>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
