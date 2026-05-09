import { useState } from 'react'
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
import type { SupervisionRequest, SupervisionRequestStatus } from '@/types'

// Sample data for design preview
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
    responseMessage: 'Thank you for your interest, but I have reached my supervision capacity for this semester. I recommend reaching out to Dr. Lisa Wong who also works on related topics.',
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

export function MyRequests() {
  const [selectedRequest, setSelectedRequest] = useState<SupervisionRequest | null>(null)
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false)
  const [requestToWithdraw, setRequestToWithdraw] = useState<string | null>(null)

  const { data, isLoading, error } = useSupervisionRequests()
  const withdrawRequest = useWithdrawSupervisionRequest()

  // Use sample data if no API data available
  const requests = data?.requests || SAMPLE_REQUESTS

  const handleWithdraw = async () => {
    if (requestToWithdraw) {
      try {
        await withdrawRequest.mutateAsync(requestToWithdraw)
        setWithdrawModalOpen(false)
        setRequestToWithdraw(null)
      } catch (err) {
        // Error handled by mutation
      }
    }
  }

  const pendingRequests = requests.filter((r) => r.status === 'PENDING')
  const respondedRequests = requests.filter((r) => ['ACCEPTED', 'REJECTED'].includes(r.status))
  const otherRequests = requests.filter((r) => ['WITHDRAWN', 'EXPIRED'].includes(r.status))

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" label="Loading requests..." />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">My Supervision Requests</h1>
          <p className="text-neutral-600 mt-1">
            Track and manage your supervision requests
          </p>
        </div>
        <Link to={ROUTES.STUDENT.SUPERVISORS}>
          <Button variant="primary" leftIcon={<Send className="h-4 w-4" />}>
            Find Supervisor
          </Button>
        </Link>
      </div>

      {error && (
        <AlertBanner
          variant="error"
          title="Failed to load requests"
          description="Please try refreshing the page."
          dismissible
        />
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="text-center">
          <div className="text-2xl font-bold text-warning-600">{pendingRequests.length}</div>
          <p className="text-sm text-neutral-600">Pending</p>
        </Card>
        <Card className="text-center">
          <div className="text-2xl font-bold text-success-600">
            {requests.filter((r) => r.status === 'ACCEPTED').length}
          </div>
          <p className="text-sm text-neutral-600">Accepted</p>
        </Card>
        <Card className="text-center">
          <div className="text-2xl font-bold text-error-600">
            {requests.filter((r) => r.status === 'REJECTED').length}
          </div>
          <p className="text-sm text-neutral-600">Rejected</p>
        </Card>
        <Card className="text-center">
          <div className="text-2xl font-bold text-neutral-600">{requests.length}</div>
          <p className="text-sm text-neutral-600">Total</p>
        </Card>
      </div>

      {requests.length === 0 ? (
        <Card className="text-center py-12">
          <Send className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
          <h2 className="text-lg font-medium text-neutral-900 mb-2">
            No requests yet
          </h2>
          <p className="text-neutral-500 mb-4">
            Start by finding a supervisor and sending them a request
          </p>
          <Link to={ROUTES.STUDENT.SUPERVISORS}>
            <Button variant="primary">Browse Supervisors</Button>
          </Link>
        </Card>
      ) : (
        <>
          {/* Pending Requests */}
          {pendingRequests.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-neutral-900 mb-4">
                Pending Requests ({pendingRequests.length})
              </h2>
              <div className="space-y-4">
                {pendingRequests.map((request) => (
                  <RequestCard
                    key={request.requestId}
                    request={request}
                    onViewDetails={() => setSelectedRequest(request)}
                    onWithdraw={() => {
                      setRequestToWithdraw(request.requestId)
                      setWithdrawModalOpen(true)
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Responded Requests */}
          {respondedRequests.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-neutral-900 mb-4">
                Responded ({respondedRequests.length})
              </h2>
              <div className="space-y-4">
                {respondedRequests.map((request) => (
                  <RequestCard
                    key={request.requestId}
                    request={request}
                    onViewDetails={() => setSelectedRequest(request)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Other Requests */}
          {otherRequests.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-neutral-900 mb-4">
                Past Requests ({otherRequests.length})
              </h2>
              <div className="space-y-4">
                {otherRequests.map((request) => (
                  <RequestCard
                    key={request.requestId}
                    request={request}
                    onViewDetails={() => setSelectedRequest(request)}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Request Detail Modal */}
      <Modal
        isOpen={!!selectedRequest}
        onClose={() => setSelectedRequest(null)}
        size="lg"
      >
        {selectedRequest && (
          <>
            <ModalHeader>
              <ModalTitle>Request Details</ModalTitle>
            </ModalHeader>
            <ModalBody>
              <div className="space-y-4">
                {/* Status */}
                <div className="flex items-center justify-between">
                  <Badge
                    variant={statusConfig[selectedRequest.status].variant}
                    size="lg"
                  >
                    {statusConfig[selectedRequest.status].label}
                  </Badge>
                  <span className="text-sm text-neutral-500">
                    Submitted {new Date(selectedRequest.submittedAt).toLocaleDateString('en-MY')}
                  </span>
                </div>

                {/* Supervisor */}
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

                {/* Project Info */}
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

                {/* Response */}
                {selectedRequest.responseMessage && (
                  <div className={cn(
                    'p-4 rounded-lg',
                    selectedRequest.status === 'ACCEPTED' ? 'bg-success-50' : 'bg-error-50'
                  )}>
                    <h4 className={cn(
                      'text-sm font-medium mb-1',
                      selectedRequest.status === 'ACCEPTED' ? 'text-success-700' : 'text-error-700'
                    )}>
                      Supervisor Response
                    </h4>
                    <p className={cn(
                      selectedRequest.status === 'ACCEPTED' ? 'text-success-900' : 'text-error-900'
                    )}>
                      {selectedRequest.responseMessage}
                    </p>
                    {selectedRequest.respondedAt && (
                      <p className={cn(
                        'text-sm mt-2',
                        selectedRequest.status === 'ACCEPTED' ? 'text-success-600' : 'text-error-600'
                      )}>
                        Responded on {new Date(selectedRequest.respondedAt).toLocaleDateString('en-MY')}
                      </p>
                    )}
                  </div>
                )}

                {/* Actions for accepted requests */}
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

      {/* Withdraw Confirmation Modal */}
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
          <Button
            variant="error"
            onClick={handleWithdraw}
            isLoading={withdrawRequest.isPending}
          >
            Withdraw Request
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}

// Request Card Component
interface RequestCardProps {
  request: SupervisionRequest
  onViewDetails: () => void
  onWithdraw?: () => void
}

function RequestCard({ request, onViewDetails, onWithdraw }: RequestCardProps) {
  const config = statusConfig[request.status]
  const StatusIcon = config.icon

  const daysRemaining = Math.ceil(
    (new Date(request.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  )

  return (
    <Card hover className="cursor-pointer" onClick={onViewDetails}>
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Supervisor Avatar */}
        <div className="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
          <span className="text-lg font-bold text-primary-600">
            {request.supervisor.fullName
              .split(' ')
              .filter((n) => !['Dr.', 'Prof.'].includes(n))
              .map((n) => n[0])
              .join('')
              .slice(0, 2)}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-neutral-900">
                {request.supervisor.fullName}
              </h3>
              <p className="text-sm text-neutral-600">
                {request.supervisor.title} • {request.supervisor.department}
              </p>
            </div>
            <Badge variant={config.variant} size="sm">
              <StatusIcon className="h-3 w-3 mr-1" />
              {config.label}
            </Badge>
          </div>

          <p className="mt-2 text-sm text-neutral-700 font-medium">
            {request.proposedTitle}
          </p>
          <p className="mt-1 text-sm text-neutral-500 line-clamp-2">
            {request.topicDescription}
          </p>

          {/* Timeline */}
          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-neutral-500">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Submitted {new Date(request.submittedAt).toLocaleDateString('en-MY')}
            </span>
            {request.status === 'PENDING' && daysRemaining > 0 && (
              <span className={cn(
                'flex items-center gap-1',
                daysRemaining <= 7 && 'text-warning-600'
              )}>
                <Clock className="h-3 w-3" />
                Expires in {daysRemaining} days
              </span>
            )}
            {request.respondedAt && (
              <span className="flex items-center gap-1">
                <MessageSquare className="h-3 w-3" />
                Responded {new Date(request.respondedAt).toLocaleDateString('en-MY')}
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="mt-3 flex gap-2" onClick={(e) => e.stopPropagation()}>
            <Button variant="secondary" size="sm" onClick={onViewDetails}>
              View Details
            </Button>
            {request.status === 'PENDING' && onWithdraw && (
              <Button variant="ghost" size="sm" onClick={onWithdraw}>
                Withdraw
              </Button>
            )}
            {request.status === 'ACCEPTED' && (
              <Link to={ROUTES.STUDENT.MEETING_NEW}>
                <Button variant="primary" size="sm">
                  Schedule Meeting
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}
