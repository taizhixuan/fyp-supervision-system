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
  Sparkles,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import { useProposalsForReview } from '@/lib/hooks/useSupervisor'
import { ROUTES } from '@/lib/constants/routes'
import { cn } from '@/lib/utils/cn'
import type { SvProposalStatus } from '@/types'

const statusConfig: Record<SvProposalStatus, { label: string; color: string; bgColor: string; borderColor: string; icon: typeof Clock }> = {
  NOT_SUBMITTED: { label: 'Not Submitted', color: 'text-stone-600', bgColor: 'bg-stone-100', borderColor: 'border-l-stone-400', icon: AlertCircle },
  DRAFT: { label: 'Draft', color: 'text-stone-600', bgColor: 'bg-stone-100', borderColor: 'border-l-stone-400', icon: FileText },
  SUBMITTED: { label: 'Submitted', color: 'text-sky-600', bgColor: 'bg-sky-100', borderColor: 'border-l-sky-500', icon: Clock },
  UNDER_REVIEW: { label: 'Under Review', color: 'text-amber-600', bgColor: 'bg-amber-100', borderColor: 'border-l-amber-500', icon: Clock },
  REVISION_REQUIRED: { label: 'Revision Required', color: 'text-orange-600', bgColor: 'bg-orange-100', borderColor: 'border-l-orange-500', icon: AlertCircle },
  APPROVED: { label: 'Approved', color: 'text-emerald-600', bgColor: 'bg-emerald-100', borderColor: 'border-l-emerald-500', icon: CheckCircle },
  REJECTED: { label: 'Rejected', color: 'text-rose-600', bgColor: 'bg-rose-100', borderColor: 'border-l-rose-500', icon: AlertCircle },
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
      {/* Header - Gradient Style */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-stone-800 via-stone-800 to-stone-900 p-6 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-stone-600/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-14 h-14 bg-amber-500/20 rounded-xl flex items-center justify-center ring-1 ring-amber-500/30">
              <FileText className="h-7 w-7 text-amber-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                Proposal Review
                <Sparkles className="h-5 w-5 text-amber-400" />
              </h1>
              <p className="text-stone-300 mt-1">
                Review and provide feedback on student proposals
              </p>
            </div>
          </div>
          {pendingCount > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 backdrop-blur-sm rounded-xl ring-1 ring-amber-500/30">
              <Clock className="h-5 w-5 text-amber-400" />
              <span className="text-sm font-semibold text-amber-200">
                {pendingCount} proposal{pendingCount > 1 ? 's' : ''} awaiting review
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4 p-4 bg-gradient-to-r from-stone-100 to-stone-50 rounded-xl">
        {/* Status Tabs */}
        <div className="flex items-center gap-1 p-1 bg-white rounded-lg shadow-sm overflow-x-auto">
          {filterOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setStatusFilter(option.value)}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-lg transition-all whitespace-nowrap',
                statusFilter === option.value
                  ? 'bg-stone-800 text-white shadow-sm'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <Input
            type="text"
            placeholder="Search by student or title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 border-stone-200 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* Proposal List */}
      <div className="flex flex-col gap-4">
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
                  'group p-5 hover:shadow-lg transition-all duration-300 cursor-pointer border-l-4',
                  status.borderColor,
                  (proposal.status === 'SUBMITTED' || proposal.status === 'UNDER_REVIEW') &&
                    'bg-amber-50/30',
                  'hover:scale-[1.01]'
                )}>
                  <div className="flex items-start gap-4">
                    {/* Student Avatar */}
                    <div className="w-14 h-14 bg-gradient-to-br from-amber-100 to-amber-200 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                      <GraduationCap className="h-7 w-7 text-amber-600" />
                    </div>

                    {/* Proposal Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-bold text-stone-800 group-hover:text-amber-700 transition-colors">{proposal.title}</h3>
                          <p className="text-sm text-stone-500">
                            by {proposal.studentName} | Version {proposal.version}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            'inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold',
                            status.bgColor,
                            status.color
                          )}>
                            <StatusIcon className="h-3.5 w-3.5" />
                            {status.label}
                          </span>
                          <ChevronRight className="h-5 w-5 text-stone-300 group-hover:text-amber-500 group-hover:translate-x-1 transition-all" />
                        </div>
                      </div>

                      {/* AI Analysis Score (if available) */}
                      {proposal.aiAnalysis && (
                        <div className="mt-3 flex items-center gap-4 p-2 bg-violet-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Brain className="h-4 w-4 text-violet-500" />
                            <span className="text-sm text-stone-600">AI Score:</span>
                            <span className={cn(
                              'text-sm font-bold',
                              proposal.aiAnalysis.overallScore >= 80 ? 'text-emerald-600' :
                              proposal.aiAnalysis.overallScore >= 60 ? 'text-amber-600' : 'text-rose-600'
                            )}>
                              {proposal.aiAnalysis.overallScore}/100
                            </span>
                          </div>
                          <div className="h-4 w-px bg-stone-200" />
                          <div className="text-sm text-stone-500">
                            Clarity: {proposal.aiAnalysis.clarityScore} |
                            Feasibility: {proposal.aiAnalysis.feasibilityScore}
                          </div>
                        </div>
                      )}

                      {/* Metadata */}
                      <div className="mt-3 flex items-center justify-between text-xs text-stone-500">
                        <div className="flex items-center gap-4">
                          {proposal.previousVersions.length > 0 && (
                            <span className="flex items-center gap-1 px-2 py-1 bg-stone-100 rounded-lg">
                              <History className="h-3.5 w-3.5" />
                              {proposal.previousVersions.length} revision{proposal.previousVersions.length > 1 ? 's' : ''}
                            </span>
                          )}
                          {proposal.feedbackHistory.length > 0 && (
                            <span className="px-2 py-1 bg-stone-100 rounded-lg">
                              {proposal.feedbackHistory.length} feedback{proposal.feedbackHistory.length > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                        <span className="flex items-center gap-1 text-stone-400">
                          <Clock className="h-3.5 w-3.5" />
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
            <div className="w-16 h-16 mx-auto bg-stone-100 rounded-full flex items-center justify-center mb-4">
              <FileText className="h-8 w-8 text-stone-400" />
            </div>
            <h3 className="text-lg font-semibold text-stone-800">No proposals found</h3>
            <p className="text-stone-500 mt-1">
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'No proposals to review at the moment'}
            </p>
          </Card>
        )}
      </div>

      {/* Summary Stats */}
      {data && data.proposals.length > 0 && (
        <Card className="overflow-hidden">
          <div className="p-4 bg-gradient-to-r from-stone-50 to-stone-100/50 border-b border-stone-200">
            <h3 className="font-semibold text-stone-800 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" />
              Proposal Summary
            </h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-5">
            <div className="text-center p-3 rounded-xl bg-stone-50">
              <p className="text-2xl font-bold text-stone-800">{data.total}</p>
              <p className="text-sm text-stone-500 font-medium">Total Proposals</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-sky-50">
              <p className="text-2xl font-bold text-sky-600">
                {data.proposals.filter((p) => p.status === 'SUBMITTED').length}
              </p>
              <p className="text-sm text-sky-700 font-medium">Submitted</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-amber-50">
              <p className="text-2xl font-bold text-amber-600">
                {data.proposals.filter((p) => p.status === 'UNDER_REVIEW').length}
              </p>
              <p className="text-sm text-amber-700 font-medium">Under Review</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-orange-50">
              <p className="text-2xl font-bold text-orange-600">
                {data.proposals.filter((p) => p.status === 'REVISION_REQUIRED').length}
              </p>
              <p className="text-sm text-orange-700 font-medium">Needs Revision</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-emerald-50">
              <p className="text-2xl font-bold text-emerald-600">
                {data.proposals.filter((p) => p.status === 'APPROVED').length}
              </p>
              <p className="text-sm text-emerald-700 font-medium">Approved</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
