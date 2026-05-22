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
    <div className="space-y-3 lg:space-y-4">
      {/* Compact Header — title + stats inline */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-stone-800 via-stone-800 to-stone-900 p-3 sm:p-4 text-white shadow-md">
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

        <div className="relative flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex-shrink-0 w-9 h-9 bg-amber-500/20 rounded-lg flex items-center justify-center ring-1 ring-amber-500/30">
              <FileText className="h-5 w-5 text-amber-400" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-white leading-tight flex items-center gap-1.5">
                Proposal Review
                <Sparkles className="h-4 w-4 text-amber-400" />
              </h1>
              <p className="text-stone-300 text-xs">Review and provide feedback on student proposals</p>
            </div>
          </div>
          {pendingCount > 0 && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/20 backdrop-blur-sm rounded-md ring-1 ring-amber-500/30 flex-shrink-0">
              <Clock className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-xs font-semibold text-amber-200">
                {pendingCount} awaiting review
              </span>
            </div>
          )}
        </div>

        {/* Inline stats */}
        {data && data.proposals.length > 0 && (
          <div className="relative mt-3 grid grid-cols-5 gap-1.5 text-center">
            <div className="bg-stone-700/40 rounded-md px-2 py-1.5 ring-1 ring-stone-600/40">
              <div className="text-base font-bold leading-none">{data.total}</div>
              <p className="text-[10px] text-stone-300 mt-0.5 uppercase tracking-wide">Total</p>
            </div>
            <div className="bg-stone-700/40 rounded-md px-2 py-1.5 ring-1 ring-stone-600/40">
              <div className="text-base font-bold leading-none text-sky-300">
                {data.proposals.filter((p) => p.status === 'SUBMITTED').length}
              </div>
              <p className="text-[10px] text-stone-300 mt-0.5 uppercase tracking-wide">Submitted</p>
            </div>
            <div className={cn('rounded-md px-2 py-1.5 ring-1', pendingCount > 0 ? 'bg-amber-500/30 ring-amber-300/40' : 'bg-stone-700/40 ring-stone-600/40')}>
              <div className="text-base font-bold leading-none text-amber-300">
                {data.proposals.filter((p) => p.status === 'UNDER_REVIEW').length}
              </div>
              <p className="text-[10px] text-stone-300 mt-0.5 uppercase tracking-wide">Review</p>
            </div>
            <div className="bg-stone-700/40 rounded-md px-2 py-1.5 ring-1 ring-stone-600/40">
              <div className="text-base font-bold leading-none text-orange-300">
                {data.proposals.filter((p) => p.status === 'REVISION_REQUIRED').length}
              </div>
              <p className="text-[10px] text-stone-300 mt-0.5 uppercase tracking-wide">Revise</p>
            </div>
            <div className="bg-stone-700/40 rounded-md px-2 py-1.5 ring-1 ring-stone-600/40">
              <div className="text-base font-bold leading-none text-emerald-300">
                {data.proposals.filter((p) => p.status === 'APPROVED').length}
              </div>
              <p className="text-[10px] text-stone-300 mt-0.5 uppercase tracking-wide">Approved</p>
            </div>
          </div>
        )}
      </div>

      {/* Filters — compact */}
      <Card padding="sm">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex items-center gap-0.5 p-0.5 bg-stone-100 rounded-md overflow-x-auto">
            {filterOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setStatusFilter(option.value)}
                className={cn(
                  'px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap',
                  statusFilter === option.value
                    ? 'bg-stone-800 text-white shadow-sm'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-white'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 pointer-events-none" />
            <Input
              type="text"
              placeholder="Search by student or title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 border-stone-200 focus:ring-amber-500"
            />
          </div>
        </div>
      </Card>

      {/* Proposal List — 2-col grid */}
      {filteredProposals && filteredProposals.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
          {filteredProposals.map((proposal) => {
            const status = statusConfig[proposal.status]
            const StatusIcon = status.icon
            return (
              <Link
                key={proposal.proposalId}
                to={ROUTES.SUPERVISOR.PROPOSAL_DETAIL.replace(':id', String(proposal.proposalId))}
              >
                <Card padding="sm" className={cn(
                  'group hover:shadow-md transition-all cursor-pointer border-l-4',
                  status.borderColor,
                  (proposal.status === 'SUBMITTED' || proposal.status === 'UNDER_REVIEW') && 'bg-amber-50/30',
                )}>
                  <div className="flex items-start gap-2.5">
                    <div className="w-10 h-10 bg-gradient-to-br from-amber-100 to-amber-200 rounded-md flex items-center justify-center flex-shrink-0 shadow-sm">
                      <GraduationCap className="h-5 w-5 text-amber-600" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-sm text-stone-800 group-hover:text-amber-700 leading-tight truncate">{proposal.title}</h3>
                          <p className="text-[11px] text-stone-500 truncate">
                            by {proposal.studentName} · v{proposal.version}
                          </p>
                        </div>
                        <span className={cn(
                          'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-semibold flex-shrink-0',
                          status.bgColor,
                          status.color
                        )}>
                          <StatusIcon className="h-3 w-3" />
                          {status.label}
                        </span>
                      </div>

                      {proposal.aiAnalysis && (
                        <div className="mt-1.5 inline-flex items-center gap-1.5 px-1.5 py-0.5 bg-violet-50 rounded-md">
                          <Brain className="h-3 w-3 text-violet-500" />
                          <span className="text-[11px] text-stone-600">AI:</span>
                          <span className={cn(
                            'text-[11px] font-bold',
                            proposal.aiAnalysis.overallScore >= 80 ? 'text-emerald-600' :
                            proposal.aiAnalysis.overallScore >= 60 ? 'text-amber-600' : 'text-rose-600'
                          )}>
                            {proposal.aiAnalysis.overallScore}/100
                          </span>
                          <span className="text-[10px] text-stone-500">
                            · C{proposal.aiAnalysis.clarityScore} F{proposal.aiAnalysis.feasibilityScore}
                          </span>
                        </div>
                      )}

                      <div className="mt-1.5 flex items-center justify-between gap-2 text-[10px] text-stone-500">
                        <div className="flex items-center gap-1.5">
                          {proposal.previousVersions.length > 0 && (
                            <span className="inline-flex items-center gap-0.5 px-1 py-0 bg-stone-100 rounded">
                              <History className="h-3 w-3" />
                              {proposal.previousVersions.length}
                            </span>
                          )}
                          {proposal.feedbackHistory.length > 0 && (
                            <span className="px-1 py-0 bg-stone-100 rounded">
                              {proposal.feedbackHistory.length} fb
                            </span>
                          )}
                        </div>
                        <span className="inline-flex items-center gap-0.5 text-stone-400">
                          <Clock className="h-3 w-3" />
                          {new Date(proposal.submittedAt).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: '2-digit' })}
                        </span>
                      </div>
                    </div>

                    <ChevronRight className="h-4 w-4 text-stone-300 group-hover:text-amber-500 transition-colors flex-shrink-0 mt-0.5" />
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>
      ) : (
        <Card className="text-center py-8">
          <FileText className="h-10 w-10 text-stone-300 mx-auto mb-2" />
          <h3 className="font-medium text-stone-800 mb-1">No proposals found</h3>
          <p className="text-sm text-stone-500">
            {searchQuery || statusFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'No proposals to review at the moment'}
          </p>
        </Card>
      )}
    </div>
  )
}
