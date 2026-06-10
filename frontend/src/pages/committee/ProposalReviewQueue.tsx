import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  FileText,
  Search,
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
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import { useCommitteeProposals } from '@/lib/hooks/useCommittee'
import { ROUTES } from '@/lib/constants/routes'
import { cn } from '@/lib/utils/cn'
import type { CommitteeProposalStatus, ProposalForCommitteeReview } from '@/types'

interface CommitteeProposalsResponse {
  proposals: ProposalForCommitteeReview[]
  total: number
}

const statusConfig: Record<CommitteeProposalStatus, { label: string; color: string; bgColor: string; borderColor: string; icon: typeof Clock }> = {
  PENDING_REVIEW: { label: 'Pending Review', color: 'text-amber-600', bgColor: 'bg-amber-100', borderColor: 'border-l-amber-500', icon: Clock },
  UNDER_REVIEW: { label: 'Under Review', color: 'text-sky-600', bgColor: 'bg-sky-100', borderColor: 'border-l-sky-500', icon: Clock },
  APPROVED: { label: 'Approved', color: 'text-emerald-600', bgColor: 'bg-emerald-100', borderColor: 'border-l-emerald-500', icon: CheckCircle },
  REJECTED: { label: 'Rejected', color: 'text-rose-600', bgColor: 'bg-rose-100', borderColor: 'border-l-rose-500', icon: XCircle },
  REVISION_REQUESTED: { label: 'Revision Requested', color: 'text-orange-600', bgColor: 'bg-orange-100', borderColor: 'border-l-orange-500', icon: RotateCcw },
}

export function ProposalReviewQueue() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<CommitteeProposalStatus | 'ALL'>('ALL')
  const [cycleFilter, setCycleFilter] = useState<'FYP1' | 'FYP2' | 'ALL'>('ALL')

  const { data: rawData, isLoading } = useCommitteeProposals({
    status: statusFilter !== 'ALL' ? statusFilter : undefined,
    cycle: cycleFilter !== 'ALL' ? cycleFilter : undefined,
  })
  const data = rawData as CommitteeProposalsResponse | undefined

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
    if (score >= 80) return 'text-emerald-600'
    if (score >= 60) return 'text-amber-600'
    return 'text-rose-600'
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
    <div className="space-y-3 lg:space-y-4">
      {/* Header - Gradient Style */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-stone-800 via-stone-800 to-stone-900 p-3 sm:p-4 text-white shadow-md">
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
        <div className="pointer-events-none hidden" />

        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-9 h-9 bg-amber-500/20 rounded-lg flex items-center justify-center ring-1 ring-amber-500/30">
              <FileText className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-white leading-tight">Proposal Review Queue</h1>
              <p className="text-stone-300 text-xs">
                Review and approve student project proposals
              </p>
            </div>
          </div>
          {pendingCount > 0 && (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-500/20 backdrop-blur-sm rounded-xl ring-1 ring-amber-500/30">
              <Sparkles className="h-5 w-5 text-amber-400" />
              <span className="text-sm font-medium text-amber-100">
                {pendingCount} proposal{pendingCount > 1 ? 's' : ''} pending review
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4 bg-gradient-to-r from-stone-100 to-stone-50">
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
              className="px-3 py-2 border border-stone-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 bg-white"
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
              className="px-3 py-2 border border-stone-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 bg-white"
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
                'p-3 rounded-xl border transition-all duration-300 text-left',
                statusFilter === status
                  ? 'border-amber-500 bg-amber-50 shadow-sm'
                  : 'border-stone-200 hover:bg-stone-50 hover:border-stone-300'
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon className={cn('h-4 w-4', config.color)} />
                <span className="text-lg font-bold text-stone-800">{count}</span>
              </div>
              <p className="text-xs text-stone-500 font-medium">{config.label}</p>
            </button>
          )
        })}
      </div>

      {/* Proposals List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
        {filteredProposals && filteredProposals.length > 0 ? (
          filteredProposals.map((proposal) => {
            const status = statusConfig[proposal.status]
            if (!status) return null
            const StatusIcon = status.icon

            return (
              <Link
                key={proposal.proposalId}
                to={ROUTES.COMMITTEE.PROPOSAL_DETAIL.replace(':id', String(proposal.proposalId))}
              >
                <Card className={cn(
                  'group p-4 hover:shadow-lg transition-all duration-300 cursor-pointer border-l-4',
                  status.borderColor
                )}>
                  <div className="flex items-start gap-4">
                    {/* Status Icon */}
                    <div className={cn('p-2 rounded-lg', status.bgColor)}>
                      <StatusIcon className={cn('h-5 w-5', status.color)} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-semibold text-stone-800 line-clamp-1 group-hover:text-amber-700 transition-colors">
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
                        <ChevronRight className="h-5 w-5 text-stone-300 group-hover:text-amber-500 group-hover:translate-x-1 transition-all flex-shrink-0" />
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
          <Card className="text-center py-8">
            <div className="hidden">
              <FileText className="h-8 w-8 text-stone-400" />
            </div>
            <h3 className="font-medium text-stone-800">No proposals found</h3>
            <p className="text-stone-500 mt-1">
              {searchQuery || statusFilter !== 'ALL' || cycleFilter !== 'ALL'
                ? 'Try adjusting your filters'
                : 'No proposals have been submitted yet'}
            </p>
          </Card>
        )}
      </div>

      {/* Summary */}
      {data && data.proposals.length > 0 && (
        <Card className="p-4 bg-gradient-to-r from-stone-100 to-stone-50">
          <div className="flex items-center justify-between">
            <span className="text-sm text-stone-600 font-medium">
              Showing {filteredProposals?.length ?? 0} of {data.total} proposals
            </span>
            <div className="flex items-center gap-4 text-sm font-medium">
              <span className="text-emerald-600">
                {data.proposals.filter((p) => p.status === 'APPROVED').length} approved
              </span>
              <span className="text-amber-600">
                {data.proposals.filter((p) => p.status === 'PENDING_REVIEW' || p.status === 'UNDER_REVIEW').length} pending
              </span>
              <span className="text-rose-600">
                {data.proposals.filter((p) => p.status === 'REJECTED').length} rejected
              </span>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
