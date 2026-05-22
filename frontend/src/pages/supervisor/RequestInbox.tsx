import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ClipboardList,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  ChevronRight,
  GraduationCap,
  BookOpen,
  Sparkles,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import { useSupervisionRequests } from '@/lib/hooks/useSupervisor'
import { ROUTES } from '@/lib/constants/routes'
import { cn } from '@/lib/utils/cn'
import type { RequestStatus } from '@/types'

const statusConfig: Record<RequestStatus, { label: string; color: string; bgColor: string; borderColor: string; icon: typeof Clock }> = {
  PENDING: { label: 'Pending', color: 'text-amber-600', bgColor: 'bg-amber-100', borderColor: 'border-l-amber-500', icon: Clock },
  ACCEPTED: { label: 'Accepted', color: 'text-emerald-600', bgColor: 'bg-emerald-100', borderColor: 'border-l-emerald-500', icon: CheckCircle },
  REJECTED: { label: 'Rejected', color: 'text-rose-600', bgColor: 'bg-rose-100', borderColor: 'border-l-rose-500', icon: XCircle },
  WITHDRAWN: { label: 'Withdrawn', color: 'text-stone-600', bgColor: 'bg-stone-100', borderColor: 'border-l-stone-500', icon: AlertCircle },
  EXPIRED: { label: 'Expired', color: 'text-stone-500', bgColor: 'bg-stone-100', borderColor: 'border-l-stone-400', icon: AlertCircle },
}

const statusTabs: { value: RequestStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All Requests' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'ACCEPTED', label: 'Accepted' },
  { value: 'REJECTED', label: 'Rejected' },
]

export function RequestInbox() {
  const [activeTab, setActiveTab] = useState<RequestStatus | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const { data, isLoading } = useSupervisionRequests(activeTab === 'all' ? undefined : activeTab)

  const filteredRequests = data?.requests.filter((request) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      request.studentName.toLowerCase().includes(query) ||
      request.proposedTitle.toLowerCase().includes(query) ||
      request.researchArea.toLowerCase().includes(query)
    )
  })

  const pendingCount = data?.requests.filter((r) => r.status === 'PENDING').length ?? 0

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-3 lg:space-y-4">
      {/* Compact Header — title + summary stats inline */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-stone-800 via-stone-800 to-stone-900 p-3 sm:p-4 text-white shadow-md">
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

        <div className="relative flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex-shrink-0 w-9 h-9 bg-amber-500/20 rounded-lg flex items-center justify-center ring-1 ring-amber-500/30">
              <ClipboardList className="h-5 w-5 text-amber-400" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-white leading-tight">Supervision Requests</h1>
              <p className="text-stone-300 text-xs">Review and respond to student supervision requests</p>
            </div>
          </div>
          {pendingCount > 0 && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/20 backdrop-blur-sm rounded-md ring-1 ring-amber-500/30 flex-shrink-0">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-xs font-semibold text-amber-200">
                {pendingCount} pending
              </span>
            </div>
          )}
        </div>

        {/* Inline stats */}
        {data && data.requests.length > 0 && (
          <div className="relative mt-3 grid grid-cols-4 gap-1.5 text-center">
            <div className="bg-stone-700/40 rounded-md px-2 py-1.5 ring-1 ring-stone-600/40">
              <div className="text-base font-bold leading-none">{data.requests.length}</div>
              <p className="text-[10px] text-stone-300 mt-0.5 uppercase tracking-wide">Total</p>
            </div>
            <div className={cn('rounded-md px-2 py-1.5 ring-1', pendingCount > 0 ? 'bg-amber-500/30 ring-amber-300/40' : 'bg-stone-700/40 ring-stone-600/40')}>
              <div className="text-base font-bold leading-none text-amber-300">
                {data.requests.filter((r) => r.status === 'PENDING').length}
              </div>
              <p className="text-[10px] text-stone-300 mt-0.5 uppercase tracking-wide">Pending</p>
            </div>
            <div className="bg-stone-700/40 rounded-md px-2 py-1.5 ring-1 ring-stone-600/40">
              <div className="text-base font-bold leading-none text-emerald-300">
                {data.requests.filter((r) => r.status === 'ACCEPTED').length}
              </div>
              <p className="text-[10px] text-stone-300 mt-0.5 uppercase tracking-wide">Accepted</p>
            </div>
            <div className="bg-stone-700/40 rounded-md px-2 py-1.5 ring-1 ring-stone-600/40">
              <div className="text-base font-bold leading-none text-rose-300">
                {data.requests.filter((r) => r.status === 'REJECTED').length}
              </div>
              <p className="text-[10px] text-stone-300 mt-0.5 uppercase tracking-wide">Rejected</p>
            </div>
          </div>
        )}
      </div>

      {/* Filters — compact single row */}
      <Card padding="sm">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex items-center gap-0.5 p-0.5 bg-stone-100 rounded-md">
            {statusTabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={cn(
                  'px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap',
                  activeTab === tab.value
                    ? 'bg-stone-800 text-white shadow-sm'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-white'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 pointer-events-none" />
            <Input
              type="text"
              placeholder="Search by name, title, or area..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 border-stone-200 focus:ring-amber-500"
            />
          </div>
        </div>
      </Card>

      {/* Request List — 2-column grid */}
      {filteredRequests && filteredRequests.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
          {filteredRequests.map((request) => {
            const status = statusConfig[request.status]
            const StatusIcon = status.icon
            return (
              <Link
                key={request.requestId}
                to={ROUTES.SUPERVISOR.REQUEST_DETAIL.replace(':id', String(request.requestId))}
              >
                <Card padding="sm" className={cn(
                  'group hover:shadow-md transition-all cursor-pointer border-l-4',
                  status.borderColor,
                )}>
                  <div className="flex items-start gap-2.5">
                    {/* Student Avatar */}
                    <div className="w-10 h-10 bg-gradient-to-br from-amber-100 to-amber-200 rounded-md flex items-center justify-center flex-shrink-0 shadow-sm">
                      <GraduationCap className="h-5 w-5 text-amber-600" />
                    </div>

                    {/* Request Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-sm text-stone-800 group-hover:text-amber-700 leading-tight truncate">{request.studentName}</h3>
                          <p className="text-[11px] text-stone-500 truncate">
                            {request.studentProgram} · Y{request.studentYear}
                            {request.studentCGPA && ` · ${request.studentCGPA.toFixed(2)}`}
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

                      <h4 className="text-xs font-semibold text-stone-700 mt-1.5 line-clamp-1">{request.proposedTitle}</h4>
                      <p className="text-[11px] text-stone-600 line-clamp-1 leading-snug">
                        {request.projectDescription}
                      </p>

                      <div className="mt-1.5 flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0 bg-sky-100 text-sky-700 rounded-md text-[10px] font-medium truncate">
                          <BookOpen className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{request.researchArea}</span>
                        </span>
                        <span className="text-[10px] text-stone-400 inline-flex items-center gap-0.5 flex-shrink-0">
                          <Clock className="h-3 w-3" />
                          {new Date(request.submittedAt).toLocaleDateString('en-MY', {
                            day: 'numeric',
                            month: 'short',
                            year: '2-digit',
                          })}
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
          <ClipboardList className="h-10 w-10 text-stone-300 mx-auto mb-2" />
          <h3 className="font-medium text-stone-800 mb-1">No requests found</h3>
          <p className="text-sm text-stone-500">
            {searchQuery
              ? 'Try adjusting your search query'
              : activeTab === 'all'
                ? "You don't have any supervision requests yet"
                : `No ${activeTab.toLowerCase()} requests`}
          </p>
        </Card>
      )}
    </div>
  )
}
