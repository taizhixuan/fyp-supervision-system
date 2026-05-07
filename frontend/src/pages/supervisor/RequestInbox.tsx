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
    <div className="space-y-6">
      {/* Header - Gradient Style */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-stone-800 via-stone-800 to-stone-900 p-6 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-stone-600/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-14 h-14 bg-amber-500/20 rounded-xl flex items-center justify-center ring-1 ring-amber-500/30">
              <ClipboardList className="h-7 w-7 text-amber-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Supervision Requests</h1>
              <p className="text-stone-300 mt-1">Review and respond to student supervision requests</p>
            </div>
          </div>
          {pendingCount > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 backdrop-blur-sm rounded-xl ring-1 ring-amber-500/30">
              <Sparkles className="h-5 w-5 text-amber-400" />
              <span className="text-sm font-semibold text-amber-200">
                {pendingCount} pending request{pendingCount > 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 p-4 bg-gradient-to-r from-stone-100 to-stone-50 rounded-xl">
        {/* Status Tabs */}
        <div className="flex items-center gap-1 p-1 bg-white rounded-lg shadow-sm">
          {statusTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-lg transition-all',
                activeTab === tab.value
                  ? 'bg-stone-800 text-white shadow-sm'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <Input
            type="text"
            placeholder="Search by name, title, or area..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 border-stone-200 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* Request List */}
      <div className="flex flex-col gap-4">
        {filteredRequests && filteredRequests.length > 0 ? (
          filteredRequests.map((request) => {
            const status = statusConfig[request.status]
            const StatusIcon = status.icon
            return (
              <Link
                key={request.requestId}
                to={ROUTES.SUPERVISOR.REQUEST_DETAIL.replace(':id', String(request.requestId))}
              >
                <Card className={cn(
                  'group p-5 hover:shadow-lg transition-all duration-300 cursor-pointer border-l-4',
                  status.borderColor,
                  'hover:scale-[1.01]'
                )}>
                  <div className="flex items-start gap-4">
                    {/* Student Avatar */}
                    <div className="w-14 h-14 bg-gradient-to-br from-amber-100 to-amber-200 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                      <GraduationCap className="h-7 w-7 text-amber-600" />
                    </div>

                    {/* Request Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-bold text-stone-800 group-hover:text-amber-700 transition-colors">{request.studentName}</h3>
                          <p className="text-sm text-stone-500">
                            {request.studentProgram} | Year {request.studentYear}
                            {request.studentCGPA && ` | CGPA: ${request.studentCGPA.toFixed(2)}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold',
                            status.bgColor,
                            status.color
                          )}>
                            <StatusIcon className="h-3.5 w-3.5" />
                            {status.label}
                          </span>
                          <ChevronRight className="h-5 w-5 text-stone-300 group-hover:text-amber-500 group-hover:translate-x-1 transition-all" />
                        </div>
                      </div>

                      {/* Proposed Project */}
                      <div className="mt-3">
                        <h4 className="font-semibold text-stone-700">{request.proposedTitle}</h4>
                        <p className="text-sm text-stone-600 mt-1 line-clamp-2">
                          {request.projectDescription}
                        </p>
                      </div>

                      {/* Tags and Date */}
                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-sky-100 text-sky-700 rounded-lg text-xs font-medium">
                            <BookOpen className="h-3 w-3" />
                            {request.researchArea}
                          </span>
                        </div>
                        <span className="text-xs text-stone-400 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(request.submittedAt).toLocaleDateString('en-MY', {
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
              <ClipboardList className="h-8 w-8 text-stone-400" />
            </div>
            <h3 className="text-lg font-semibold text-stone-800">No requests found</h3>
            <p className="text-stone-500 mt-1">
              {searchQuery
                ? 'Try adjusting your search query'
                : activeTab === 'all'
                  ? "You don't have any supervision requests yet"
                  : `No ${activeTab.toLowerCase()} requests`}
            </p>
          </Card>
        )}
      </div>

      {/* Summary Stats */}
      {data && data.requests.length > 0 && (
        <Card className="overflow-hidden">
          <div className="p-4 bg-gradient-to-r from-stone-50 to-stone-100/50 border-b border-stone-200">
            <h3 className="font-semibold text-stone-800">Request Summary</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-5">
            <div className="text-center p-3 rounded-xl bg-stone-50">
              <p className="text-2xl font-bold text-stone-800">{data.requests.length}</p>
              <p className="text-sm text-stone-500 font-medium">Total</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-amber-50">
              <p className="text-2xl font-bold text-amber-600">
                {data.requests.filter((r) => r.status === 'PENDING').length}
              </p>
              <p className="text-sm text-amber-700 font-medium">Pending</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-emerald-50">
              <p className="text-2xl font-bold text-emerald-600">
                {data.requests.filter((r) => r.status === 'ACCEPTED').length}
              </p>
              <p className="text-sm text-emerald-700 font-medium">Accepted</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-rose-50">
              <p className="text-2xl font-bold text-rose-600">
                {data.requests.filter((r) => r.status === 'REJECTED').length}
              </p>
              <p className="text-sm text-rose-700 font-medium">Rejected</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
