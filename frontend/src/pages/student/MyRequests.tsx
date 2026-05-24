import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Send,
  Calendar,
  MessageSquare,
  RotateCcw,
} from 'lucide-react'
import { Card, Button, Badge, Spinner, AlertBanner } from '@/components/ui'
import { Modal, ModalHeader, ModalTitle, ModalBody, ModalFooter } from '@/components/ui/Modal'
import { useSupervisionRequests, useWithdrawSupervisionRequest } from '@/lib/hooks/useStudent'
import { ROUTES } from '@/lib/constants/routes'
import { cn } from '@/lib/utils/cn'
import { formatDate } from '@/lib/utils/formatDate'
import type { SupervisionRequest, SupervisionRequestStatus } from '@/types'

// Sample data for design preview when the API hasn't loaded yet.
const SAMPLE_REQUESTS: SupervisionRequest[] = [
  {
    requestId: '1',
    studentId: '1',
    supervisorId: '1',
    supervisor: {
      supervisorId: '1',
      userId: '101',
      fullName: 'Dr. Sarah Lee Wei Lin',
      email: 'sarah.lee@mmu.edu.my',
      title: 'Associate Professor',
      department: 'Software Engineering',
      faculty: 'Faculty of Computing and Informatics',
      researchAreas: ['Artificial Intelligence', 'Machine Learning', 'NLP'],
      currentLoad: 5,
      maxCapacity: 8,
      isAcceptingStudents: true,
    },
    proposedTitle: 'AI-Powered Student Supervision System',
    topicDescription: 'Developing a web-based system that uses AI to enhance the FYP supervision process...',
    message: 'I am very interested in working with you on this AI project.',
    status: 'PENDING',
    submittedAt: '2025-01-15T10:30:00Z',
    expiresAt: '2025-02-15T10:30:00Z',
  },
  {
    requestId: '2',
    studentId: '1',
    supervisorId: '4',
    supervisor: {
      supervisorId: '4',
      userId: '104',
      fullName: 'Dr. Muhammad Hafiz',
      email: 'muhammad.hafiz@mmu.edu.my',
      title: 'Senior Lecturer',
      department: 'Software Engineering',
      faculty: 'Faculty of Computing and Informatics',
      researchAreas: ['Web Development', 'Cloud Computing', 'DevOps'],
      currentLoad: 4,
      maxCapacity: 8,
      isAcceptingStudents: true,
    },
    proposedTitle: 'Cloud-Based Learning Management System',
    topicDescription: 'Building a scalable LMS using microservices architecture...',
    status: 'ACCEPTED',
    submittedAt: '2025-01-10T14:00:00Z',
    respondedAt: '2025-01-12T09:15:00Z',
    responseMessage: 'I would be happy to supervise your project. Please schedule a meeting to discuss further.',
    expiresAt: '2025-02-10T14:00:00Z',
  },
  {
    requestId: '3',
    studentId: '1',
    supervisorId: '2',
    supervisor: {
      supervisorId: '2',
      userId: '102',
      fullName: 'Prof. Dr. Ahmad Razak',
      email: 'ahmad.razak@mmu.edu.my',
      title: 'Professor',
      department: 'Computer Science',
      faculty: 'Faculty of Computing and Informatics',
      researchAreas: ['Cybersecurity', 'Network Security', 'Blockchain'],
      currentLoad: 7,
      maxCapacity: 8,
      isAcceptingStudents: true,
    },
    proposedTitle: 'Blockchain-Based Voting System',
    topicDescription: 'Implementing a secure and transparent voting system using blockchain technology...',
    status: 'REJECTED',
    submittedAt: '2025-01-05T11:00:00Z',
    respondedAt: '2025-01-08T16:30:00Z',
    responseMessage: 'Thank you for your interest, but I have reached my supervision capacity for this semester.',
    expiresAt: '2025-02-05T11:00:00Z',
  },
]

const statusConfig: Record<SupervisionRequestStatus, { label: string; variant: 'default' | 'success' | 'warning' | 'error'; icon: typeof Clock }> = {
  PENDING: { label: 'Pending', variant: 'warning', icon: Clock },
  ACCEPTED: { label: 'Accepted', variant: 'success', icon: CheckCircle },
  REJECTED: { label: 'Rejected', variant: 'error', icon: XCircle },
  WITHDRAWN: { label: 'Withdrawn', variant: 'default', icon: RotateCcw },
  EXPIRED: { label: 'Expired', variant: 'default', icon: AlertCircle },
}

type StatusFilter = 'ALL' | 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'PAST'

const FILTER_LABELS: Record<StatusFilter, string> = {
  ALL: 'All',
  PENDING: 'Pending',
  ACCEPTED: 'Accepted',
  REJECTED: 'Rejected',
  PAST: 'Past',
}

export function MyRequests() {
  const [selectedRequest, setSelectedRequest] = useState<SupervisionRequest | null>(null)
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false)
  const [requestToWithdraw, setRequestToWithdraw] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')

  const { data, isLoading, error, errorUpdatedAt } = useSupervisionRequests()
  const withdrawRequest = useWithdrawSupervisionRequest()

  const requests = data?.requests || SAMPLE_REQUESTS

  const handleWithdraw = async () => {
    if (requestToWithdraw) {
      try {
        await withdrawRequest.mutateAsync(requestToWithdraw)
        setWithdrawModalOpen(false)
        setRequestToWithdraw(null)
      } catch {
        // Error handled by mutation
      }
    }
  }

  const counts = useMemo(() => ({
    pending: requests.filter((r) => r.status === 'PENDING').length,
    accepted: requests.filter((r) => r.status === 'ACCEPTED').length,
    rejected: requests.filter((r) => r.status === 'REJECTED').length,
    past: requests.filter((r) => ['WITHDRAWN', 'EXPIRED'].includes(r.status)).length,
  }), [requests])

  const filteredRequests = useMemo(() => {
    switch (statusFilter) {
      case 'PENDING': return requests.filter((r) => r.status === 'PENDING')
      case 'ACCEPTED': return requests.filter((r) => r.status === 'ACCEPTED')
      case 'REJECTED': return requests.filter((r) => r.status === 'REJECTED')
      case 'PAST': return requests.filter((r) => ['WITHDRAWN', 'EXPIRED'].includes(r.status))
      default: return requests
    }
  }, [requests, statusFilter])

  // When ALL is selected we keep the three logical groupings so the page
  // reads chronologically. Otherwise it's a single flat list under the chip.
  const showGrouped = statusFilter === 'ALL'
  const pendingRequests = filteredRequests.filter((r) => r.status === 'PENDING')
  const respondedRequests = filteredRequests.filter((r) => ['ACCEPTED', 'REJECTED'].includes(r.status))
  const otherRequests = filteredRequests.filter((r) => ['WITHDRAWN', 'EXPIRED'].includes(r.status))

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" label="Loading requests..." />
      </div>
    )
  }

  return (
    <div className="space-y-3 lg:space-y-4">
      {/* Header — managing existing requests is the page's primary job, so
          "Find Supervisor" is de-emphasised as a secondary outline. */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 leading-tight">My Supervision Requests</h1>
          <p className="text-xs text-neutral-600">Track and manage your supervision requests</p>
        </div>
        <Link to={ROUTES.STUDENT.SUPERVISORS}>
          <Button variant="secondary" size="sm" leftIcon={<Send className="h-4 w-4" />} className="whitespace-nowrap">
            Find Supervisor
          </Button>
        </Link>
      </div>

      {error && (
        <AlertBanner
          key={errorUpdatedAt}
          variant="error"
          title="Failed to load requests"
          description="Please try refreshing the page."
          dismissible
        />
      )}

      {/* Stat cards — tinted bg matches the number color so they scan as
          status indicators, and each one is also a filter chip. */}
      <div className="grid grid-cols-3 gap-2">
        <StatCard
          tone="warning"
          icon={Clock}
          value={counts.pending}
          label="Pending"
          active={statusFilter === 'PENDING'}
          onClick={() => setStatusFilter(statusFilter === 'PENDING' ? 'ALL' : 'PENDING')}
        />
        <StatCard
          tone="success"
          icon={CheckCircle}
          value={counts.accepted}
          label="Accepted"
          active={statusFilter === 'ACCEPTED'}
          onClick={() => setStatusFilter(statusFilter === 'ACCEPTED' ? 'ALL' : 'ACCEPTED')}
        />
        <StatCard
          tone="error"
          icon={XCircle}
          value={counts.rejected}
          label="Rejected"
          active={statusFilter === 'REJECTED'}
          onClick={() => setStatusFilter(statusFilter === 'REJECTED' ? 'ALL' : 'REJECTED')}
        />
      </div>

      {/* Filter chip row — explicit alternative to clicking the stat cards. */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-xs font-medium text-neutral-500 mr-1">Show:</span>
        {(Object.keys(FILTER_LABELS) as StatusFilter[]).map((key) => {
          const count =
            key === 'ALL' ? requests.length :
            key === 'PENDING' ? counts.pending :
            key === 'ACCEPTED' ? counts.accepted :
            key === 'REJECTED' ? counts.rejected :
            counts.past
          if (key === 'PAST' && count === 0) return null
          return (
            <button
              key={key}
              onClick={() => setStatusFilter(key)}
              className={cn(
                'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors',
                statusFilter === key
                  ? 'bg-primary-600 text-white'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200',
              )}
            >
              {FILTER_LABELS[key]}
              <span className={cn(
                'px-1 text-[10px] rounded',
                statusFilter === key ? 'bg-white/20' : 'bg-white text-neutral-500',
              )}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {filteredRequests.length === 0 ? (
        <Card className="text-center py-10">
          <Send className="h-10 w-10 text-neutral-300 mx-auto mb-2" />
          <h2 className="font-medium text-neutral-900 mb-1">
            {statusFilter === 'ALL' ? 'No requests yet' : `No ${FILTER_LABELS[statusFilter].toLowerCase()} requests`}
          </h2>
          <p className="text-sm text-neutral-500 mb-3">
            {statusFilter === 'ALL'
              ? 'Start by finding a supervisor and sending them a request'
              : 'Try switching to a different filter or browse supervisors'}
          </p>
          {statusFilter === 'ALL' && (
            <Link to={ROUTES.STUDENT.SUPERVISORS}>
              <Button variant="primary" size="sm">Browse Supervisors</Button>
            </Link>
          )}
        </Card>
      ) : showGrouped ? (
        <>
          {pendingRequests.length > 0 && (
            <RequestGroup
              icon={<Clock className="h-4 w-4 text-warning-600" />}
              title="Pending Requests"
              count={pendingRequests.length}
              tone="warning"
              requests={pendingRequests}
              onViewDetails={setSelectedRequest}
              onWithdraw={(id) => { setRequestToWithdraw(id); setWithdrawModalOpen(true) }}
            />
          )}
          {respondedRequests.length > 0 && (
            <RequestGroup
              icon={<MessageSquare className="h-4 w-4 text-info-600" />}
              title="Responded"
              count={respondedRequests.length}
              tone="info"
              requests={respondedRequests}
              onViewDetails={setSelectedRequest}
            />
          )}
          {otherRequests.length > 0 && (
            <RequestGroup
              icon={<RotateCcw className="h-4 w-4 text-stone-500" />}
              title="Past Requests"
              count={otherRequests.length}
              tone="neutral"
              requests={otherRequests}
              onViewDetails={setSelectedRequest}
            />
          )}
          {/* Bottom footer so a short list feels intentionally complete instead
              of empty whitespace running down the page. */}
          <p className="text-center text-xs text-neutral-400 py-3">
            That's all your requests.
          </p>
        </>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
            {filteredRequests.map((request) => (
              <RequestCard
                key={request.requestId}
                request={request}
                onViewDetails={() => setSelectedRequest(request)}
                onWithdraw={request.status === 'PENDING' ? () => {
                  setRequestToWithdraw(request.requestId)
                  setWithdrawModalOpen(true)
                } : undefined}
              />
            ))}
          </div>
          <p className="text-center text-xs text-neutral-400 py-3">
            That's all your {FILTER_LABELS[statusFilter].toLowerCase()} requests.
          </p>
        </>
      )}

      {/* Request Detail Modal */}
      <Modal isOpen={!!selectedRequest} onClose={() => setSelectedRequest(null)} size="lg">
        {selectedRequest && (
          <>
            <ModalHeader>
              <ModalTitle>Request Details</ModalTitle>
            </ModalHeader>
            <ModalBody>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Badge variant={statusConfig[selectedRequest.status].variant} size="lg">
                    {statusConfig[selectedRequest.status].label}
                  </Badge>
                  <span className="text-sm text-neutral-500">
                    Submitted {formatDate(selectedRequest.submittedAt)}
                  </span>
                </div>

                <Card className="bg-neutral-50">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                      <span className="text-lg font-bold text-primary-600">
                        {selectedRequest.supervisor.fullName
                          .split(' ')
                          .filter((n) => !['Dr.', 'Prof.'].includes(n))
                          .map((n) => n[0])
                          .join('')
                          .slice(0, 2)}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-neutral-900">
                        {selectedRequest.supervisor.fullName}
                      </h4>
                      <p className="text-sm text-neutral-600">
                        {selectedRequest.supervisor.title} • {selectedRequest.supervisor.department}
                      </p>
                    </div>
                  </div>
                </Card>

                <div>
                  <h4 className="text-sm font-medium text-neutral-700 mb-1">Proposed Title</h4>
                  <p className="text-neutral-900">{selectedRequest.proposedTitle}</p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-neutral-700 mb-1">Description</h4>
                  <p className="text-neutral-700 whitespace-pre-wrap">
                    {selectedRequest.topicDescription}
                  </p>
                </div>

                {selectedRequest.message && (
                  <div>
                    <h4 className="text-sm font-medium text-neutral-700 mb-1">Personal Message</h4>
                    <p className="text-neutral-700">{selectedRequest.message}</p>
                  </div>
                )}

                {selectedRequest.responseMessage && (
                  <div className={cn(
                    'p-4 rounded-lg',
                    selectedRequest.status === 'ACCEPTED' ? 'bg-success-50' : 'bg-error-50',
                  )}>
                    <h4 className={cn(
                      'text-sm font-medium mb-1',
                      selectedRequest.status === 'ACCEPTED' ? 'text-success-700' : 'text-error-700',
                    )}>
                      Supervisor Response
                    </h4>
                    <p className={cn(
                      selectedRequest.status === 'ACCEPTED' ? 'text-success-900' : 'text-error-900',
                    )}>
                      {selectedRequest.responseMessage}
                    </p>
                    {selectedRequest.respondedAt && (
                      <p className={cn(
                        'text-sm mt-2',
                        selectedRequest.status === 'ACCEPTED' ? 'text-success-600' : 'text-error-600',
                      )}>
                        Responded on {formatDate(selectedRequest.respondedAt)}
                      </p>
                    )}
                  </div>
                )}

                {selectedRequest.status === 'ACCEPTED' && (
                  <div className="pt-4 border-t border-neutral-200">
                    <Link to={ROUTES.STUDENT.MEETING_NEW}>
                      <Button variant="primary" className="w-full">
                        Schedule First Meeting
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </ModalBody>
          </>
        )}
      </Modal>

      <Modal
        isOpen={withdrawModalOpen}
        onClose={() => {
          setWithdrawModalOpen(false)
          setRequestToWithdraw(null)
        }}
        size="sm"
      >
        <ModalHeader>
          <ModalTitle>Withdraw Request</ModalTitle>
        </ModalHeader>
        <ModalBody>
          <p className="text-sm text-neutral-600">
            Are you sure you want to withdraw this supervision request? This action cannot be undone.
          </p>
        </ModalBody>
        <ModalFooter>
          <Button
            variant="ghost"
            onClick={() => {
              setWithdrawModalOpen(false)
              setRequestToWithdraw(null)
            }}
          >
            Cancel
          </Button>
          <Button variant="error" onClick={handleWithdraw} isLoading={withdrawRequest.isPending}>
            Withdraw Request
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}

interface StatCardProps {
  tone: 'warning' | 'success' | 'error'
  icon: typeof Clock
  value: number
  label: string
  active: boolean
  onClick: () => void
}

function StatCard({ tone, icon: Icon, value, label, active, onClick }: StatCardProps) {
  const toneStyles = {
    warning: { bg: 'bg-warning-50', border: 'border-warning-200', text: 'text-warning-700', icon: 'text-warning-600', activeRing: 'ring-warning-500' },
    success: { bg: 'bg-success-50', border: 'border-success-200', text: 'text-success-700', icon: 'text-success-600', activeRing: 'ring-success-500' },
    error: { bg: 'bg-error-50', border: 'border-error-200', text: 'text-error-700', icon: 'text-error-600', activeRing: 'ring-error-500' },
  }[tone]

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-xl border p-3 text-left transition-all hover:shadow-sm focus:outline-none focus:ring-2',
        toneStyles.bg,
        toneStyles.border,
        active && `ring-2 ${toneStyles.activeRing}`,
      )}
    >
      <div className="flex items-center justify-between">
        <div>
          <div className={cn('text-2xl font-bold leading-none', toneStyles.text)}>{value}</div>
          <p className="text-[11px] uppercase tracking-wide text-neutral-600 mt-1 font-medium">{label}</p>
        </div>
        <Icon className={cn('h-5 w-5', toneStyles.icon)} />
      </div>
    </button>
  )
}

interface RequestGroupProps {
  icon: React.ReactNode
  title: string
  count: number
  tone: 'warning' | 'info' | 'neutral'
  requests: SupervisionRequest[]
  onViewDetails: (request: SupervisionRequest) => void
  onWithdraw?: (id: string) => void
}

function RequestGroup({ icon, title, count, tone, requests, onViewDetails, onWithdraw }: RequestGroupProps) {
  const badgeClasses = {
    warning: 'bg-warning-100 text-warning-700',
    info: 'bg-info-100 text-info-700',
    neutral: 'bg-stone-100 text-stone-600',
  }[tone]
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <h2 className="text-sm font-bold text-neutral-800 uppercase tracking-wide">{title}</h2>
        <span className={cn('px-1.5 py-0 text-[10px] font-semibold rounded-full', badgeClasses)}>
          {count}
        </span>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
        {requests.map((request) => (
          <RequestCard
            key={request.requestId}
            request={request}
            onViewDetails={() => onViewDetails(request)}
            onWithdraw={onWithdraw && request.status === 'PENDING' ? () => onWithdraw(request.requestId) : undefined}
          />
        ))}
      </div>
    </div>
  )
}

interface RequestCardProps {
  request: SupervisionRequest
  onViewDetails: () => void
  onWithdraw?: () => void
}

function RequestCard({ request, onViewDetails, onWithdraw }: RequestCardProps) {
  const config = statusConfig[request.status]
  const StatusIcon = config.icon

  const daysRemaining = Math.ceil(
    (new Date(request.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  )

  return (
    <Card hover padding="sm" className="cursor-pointer" onClick={onViewDetails}>
      <div className="flex items-start gap-2.5">
        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-bold text-primary-600">
            {request.supervisor.fullName
              .split(' ')
              .filter((n) => !['Dr.', 'Prof.'].includes(n))
              .map((n) => n[0])
              .join('')
              .slice(0, 2)}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-sm text-neutral-900 leading-tight truncate">
                {request.supervisor.fullName}
              </h3>
              <p className="text-[11px] text-neutral-600 truncate">
                {request.supervisor.title} · {request.supervisor.department}
              </p>
            </div>
            <Badge variant={config.variant} size="sm" className="flex-shrink-0">
              <StatusIcon className="h-3 w-3 mr-0.5" />
              {config.label}
            </Badge>
          </div>

          <p className="mt-1.5 text-xs text-neutral-700 font-semibold line-clamp-1">
            {request.proposedTitle}
          </p>
          <p className="text-[11px] text-neutral-500 line-clamp-2 leading-snug">
            {request.topicDescription}
          </p>

          {/* Timeline — explicit labels so calendar/chat-bubble icons aren't
              ambiguous; full year so the date can't be misread. */}
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-neutral-500">
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Submitted {formatDate(request.submittedAt)}
            </span>
            {request.respondedAt && (
              <span className="inline-flex items-center gap-1">
                <MessageSquare className="h-3 w-3" />
                Responded {formatDate(request.respondedAt)}
              </span>
            )}
            {request.status === 'PENDING' && daysRemaining > 0 && (
              <span className={cn(
                'inline-flex items-center gap-1',
                daysRemaining <= 7 && 'text-warning-600 font-semibold',
              )}>
                <Clock className="h-3 w-3" />
                {daysRemaining}d left
              </span>
            )}
          </div>

          <div className="mt-2 flex gap-1.5" onClick={(e) => e.stopPropagation()}>
            <Button variant="secondary" size="sm" onClick={onViewDetails} className="whitespace-nowrap">
              Details
            </Button>
            {request.status === 'PENDING' && onWithdraw && (
              <Button variant="ghost" size="sm" onClick={onWithdraw} className="whitespace-nowrap">
                Withdraw
              </Button>
            )}
            {request.status === 'ACCEPTED' && (
              <Link to={ROUTES.STUDENT.MEETING_NEW}>
                <Button variant="primary" size="sm" className="whitespace-nowrap">
                  Schedule
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}
