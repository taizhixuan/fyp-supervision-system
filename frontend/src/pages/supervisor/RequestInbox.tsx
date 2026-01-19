import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ClipboardList,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  ChevronRight,
  GraduationCap,
  BookOpen,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import { useSupervisionRequests } from '@/lib/hooks/useSupervisor'
import { ROUTES } from '@/lib/constants/routes'
import { cn } from '@/lib/utils/cn'
import type { RequestStatus } from '@/types'

const statusConfig: Record<RequestStatus, { label: string; color: string; bgColor: string; icon: typeof Clock }> = {
  PENDING: { label: 'Pending', color: 'text-warning-600', bgColor: 'bg-warning-50', icon: Clock },
  ACCEPTED: { label: 'Accepted', color: 'text-success-600', bgColor: 'bg-success-50', icon: CheckCircle },
  REJECTED: { label: 'Rejected', color: 'text-error-600', bgColor: 'bg-error-50', icon: XCircle },
  WITHDRAWN: { label: 'Withdrawn', color: 'text-neutral-600', bgColor: 'bg-neutral-100', icon: AlertCircle },
  EXPIRED: { label: 'Expired', color: 'text-neutral-500', bgColor: 'bg-neutral-100', icon: AlertCircle },
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
            <ClipboardList className="h-7 w-7 text-primary-600" />
            Supervision Requests
          </h1>
          <p className="text-neutral-600 mt-1">
            Review and respond to student supervision requests
          </p>
        </div>
        {pendingCount > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 bg-warning-50 border border-warning-200 rounded-lg">
            <Clock className="h-5 w-5 text-warning-600" />
            <span className="text-sm font-medium text-warning-700">
              {pendingCount} pending request{pendingCount > 1 ? 's' : ''} awaiting response
            </span>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Status Tabs */}
        <div className="flex items-center gap-1 p-1 bg-neutral-100 rounded-lg">
          {statusTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                activeTab === tab.value
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-600 hover:text-neutral-900'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <Input
            type="text"
            placeholder="Search by name, title, or area..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Request List */}
      <div className="space-y-4">
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
                  'p-4 hover:shadow-md transition-shadow cursor-pointer',
                  request.status === 'PENDING' && 'border-l-4 border-l-warning-400'
                )}>
                  <div className="flex items-start gap-4">
                    {/* Student Avatar */}
                    <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <GraduationCap className="h-6 w-6 text-primary-600" />
                    </div>

                    {/* Request Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-semibold text-neutral-900">{request.studentName}</h3>
                          <p className="text-sm text-neutral-500">
                            {request.studentProgram} | Year {request.studentYear}
                            {request.studentCGPA && ` | CGPA: ${request.studentCGPA.toFixed(2)}`}
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

                      {/* Proposed Project */}
                      <div className="mt-3">
                        <h4 className="font-medium text-neutral-800">{request.proposedTitle}</h4>
                        <p className="text-sm text-neutral-600 mt-1 line-clamp-2">
                          {request.projectDescription}
                        </p>
                      </div>

                      {/* Tags and Date */}
                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary-50 text-primary-700 rounded text-xs">
                            <BookOpen className="h-3 w-3" />
                            {request.researchArea}
                          </span>
                        </div>
                        <span className="text-xs text-neutral-500">
                          Submitted {new Date(request.submittedAt).toLocaleDateString('en-MY', {
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
            <ClipboardList className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-neutral-900">No requests found</h3>
            <p className="text-neutral-500 mt-1">
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
        <Card className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-neutral-900">{data.requests.length}</p>
              <p className="text-sm text-neutral-500">Total Requests</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-warning-600">
                {data.requests.filter((r) => r.status === 'PENDING').length}
              </p>
              <p className="text-sm text-neutral-500">Pending</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-success-600">
                {data.requests.filter((r) => r.status === 'ACCEPTED').length}
              </p>
              <p className="text-sm text-neutral-500">Accepted</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-error-600">
                {data.requests.filter((r) => r.status === 'REJECTED').length}
              </p>
              <p className="text-sm text-neutral-500">Rejected</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
