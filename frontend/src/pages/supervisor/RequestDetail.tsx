import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Clock,
  CheckCircle,
  XCircle,
  GraduationCap,
  Mail,
  BookOpen,
  FileText,
  MessageSquare,
  AlertTriangle,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { useSupervisionRequest, useRespondToRequest, useSupervisorProfile } from '@/lib/hooks/useSupervisor'
import { ROUTES } from '@/lib/constants/routes'
import { cn } from '@/lib/utils/cn'
import type { RequestStatus } from '@/types'

const statusConfig: Record<RequestStatus, { label: string; color: string; bgColor: string; icon: typeof Clock }> = {
  PENDING: { label: 'Pending Review', color: 'text-warning-600', bgColor: 'bg-warning-50', icon: Clock },
  ACCEPTED: { label: 'Accepted', color: 'text-success-600', bgColor: 'bg-success-50', icon: CheckCircle },
  REJECTED: { label: 'Rejected', color: 'text-error-600', bgColor: 'bg-error-50', icon: XCircle },
  WITHDRAWN: { label: 'Withdrawn', color: 'text-neutral-600', bgColor: 'bg-neutral-100', icon: AlertTriangle },
  EXPIRED: { label: 'Expired', color: 'text-neutral-500', bgColor: 'bg-neutral-100', icon: AlertTriangle },
}

export function RequestDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')

  const { data: request, isLoading } = useSupervisionRequest(Number(id))
  const { data: profile } = useSupervisorProfile()
  const respondMutation = useRespondToRequest()

  const handleAccept = async () => {
    if (!request) return
    try {
      await respondMutation.mutateAsync({
        requestId: request.requestId,
        action: 'ACCEPT',
      })
      navigate(ROUTES.SUPERVISOR.REQUESTS)
    } catch (error) {
      console.error('Failed to accept request:', error)
    }
  }

  const handleReject = async () => {
    if (!request) return
    try {
      await respondMutation.mutateAsync({
        requestId: request.requestId,
        action: 'REJECT',
        rejectionReason,
      })
      setShowRejectModal(false)
      navigate(ROUTES.SUPERVISOR.REQUESTS)
    } catch (error) {
      console.error('Failed to reject request:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!request) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-neutral-900">Request not found</h2>
        <p className="text-neutral-600 mt-2">The request you're looking for doesn't exist.</p>
        <Link to={ROUTES.SUPERVISOR.REQUESTS}>
          <Button className="mt-4">Back to Requests</Button>
        </Link>
      </div>
    )
  }

  const status = statusConfig[request.status]
  const StatusIcon = status.icon
  const canRespond = request.status === 'PENDING'
  const hasAvailableSlots = (profile?.availableSlots ?? 0) > 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to={ROUTES.SUPERVISOR.REQUESTS}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Requests
          </Button>
        </Link>
      </div>

      {/* Status Banner */}
      <div className={cn('p-4 rounded-lg flex items-center justify-between', status.bgColor)}>
        <div className="flex items-center gap-3">
          <StatusIcon className={cn('h-6 w-6', status.color)} />
          <div>
            <p className={cn('font-semibold', status.color)}>{status.label}</p>
            <p className="text-sm text-neutral-600">
              Submitted on {new Date(request.submittedAt).toLocaleDateString('en-MY', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>
        </div>
        {canRespond && (
          <div className="flex items-center gap-2">
            {!hasAvailableSlots && (
              <span className="text-sm text-warning-600 mr-2">
                No available slots
              </span>
            )}
            <Button
              variant="secondary"
              onClick={() => setShowRejectModal(true)}
              disabled={respondMutation.isPending}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Reject
            </Button>
            <Button
              onClick={handleAccept}
              disabled={respondMutation.isPending || !hasAvailableSlots}
            >
              {respondMutation.isPending ? (
                <Spinner size="sm" className="mr-2" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Accept
            </Button>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Student Info */}
        <div className="lg:col-span-1 space-y-6">
          {/* Student Profile Card */}
          <Card className="p-6">
            <div className="text-center">
              <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <GraduationCap className="h-10 w-10 text-primary-600" />
              </div>
              <h2 className="text-xl font-semibold text-neutral-900">{request.studentName}</h2>
              <p className="text-neutral-600">{request.studentProgram}</p>
            </div>

            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-500">Student ID</span>
                <span className="text-sm font-medium">{request.studentId}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-500">Year</span>
                <span className="text-sm font-medium">Year {request.studentYear}</span>
              </div>
              {request.studentCGPA && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-500">CGPA</span>
                  <span className={cn(
                    'text-sm font-medium',
                    request.studentCGPA >= 3.5 ? 'text-success-600' :
                    request.studentCGPA >= 3.0 ? 'text-primary-600' :
                    request.studentCGPA >= 2.5 ? 'text-warning-600' : 'text-error-600'
                  )}>
                    {request.studentCGPA.toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2 pt-2">
                <Mail className="h-4 w-4 text-neutral-400" />
                <a
                  href={`mailto:${request.studentEmail}`}
                  className="text-sm text-primary-600 hover:underline"
                >
                  {request.studentEmail}
                </a>
              </div>
            </div>
          </Card>

          {/* Research Area */}
          <Card className="p-6">
            <h3 className="font-semibold text-neutral-900 mb-3 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-neutral-400" />
              Research Area
            </h3>
            <span className="inline-block px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm">
              {request.researchArea}
            </span>
          </Card>

          {/* Response Details (if responded) */}
          {request.respondedAt && (
            <Card className="p-6">
              <h3 className="font-semibold text-neutral-900 mb-3">Response Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500">Responded on</span>
                  <span className="font-medium">
                    {new Date(request.respondedAt).toLocaleDateString('en-MY', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                {request.rejectionReason && (
                  <div className="pt-2 border-t border-neutral-200">
                    <p className="text-neutral-500 mb-1">Rejection Reason</p>
                    <p className="text-neutral-700">{request.rejectionReason}</p>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>

        {/* Right Column - Project Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Proposed Project */}
          <Card className="p-6">
            <h3 className="font-semibold text-neutral-900 mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-neutral-400" />
              Proposed Project
            </h3>
            <h4 className="text-lg font-medium text-neutral-800 mb-3">{request.proposedTitle}</h4>
            <p className="text-neutral-600 whitespace-pre-wrap">{request.projectDescription}</p>
          </Card>

          {/* Motivation */}
          <Card className="p-6">
            <h3 className="font-semibold text-neutral-900 mb-4 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-neutral-400" />
              Motivation
            </h3>
            <p className="text-neutral-600 whitespace-pre-wrap">{request.motivation}</p>
          </Card>

          {/* Attachments */}
          {request.attachments && request.attachments.length > 0 && (
            <Card className="p-6">
              <h3 className="font-semibold text-neutral-900 mb-4">Attachments</h3>
              <div className="space-y-2">
                {request.attachments.map((attachment) => (
                  <div
                    key={attachment.attachmentId}
                    className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-neutral-400" />
                      <div>
                        <p className="text-sm font-medium text-neutral-900">{attachment.fileName}</p>
                        <p className="text-xs text-neutral-500">
                          {(attachment.fileSize / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      View
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Quick Actions */}
          {canRespond && (
            <Card className="p-6 bg-neutral-50">
              <h3 className="font-semibold text-neutral-900 mb-4">Actions</h3>
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={handleAccept}
                  disabled={respondMutation.isPending || !hasAvailableSlots}
                  className="flex-1 sm:flex-none"
                >
                  {respondMutation.isPending ? (
                    <Spinner size="sm" className="mr-2" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  Accept Request
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setShowRejectModal(true)}
                  disabled={respondMutation.isPending}
                  className="flex-1 sm:flex-none"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject Request
                </Button>
              </div>
              {!hasAvailableSlots && (
                <p className="text-sm text-warning-600 mt-3">
                  <AlertTriangle className="h-4 w-4 inline mr-1" />
                  You have no available supervision slots. Please update your quota or complete existing supervisions.
                </p>
              )}
            </Card>
          )}
        </div>
      </div>

      {/* Rejection Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">Reject Request</h3>
            <p className="text-neutral-600 mb-4">
              Please provide a reason for rejecting this supervision request. This will be shared with the student.
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 mb-4"
              placeholder="Enter rejection reason..."
            />
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setShowRejectModal(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleReject}
                disabled={!rejectionReason.trim() || respondMutation.isPending}
                className="bg-error-600 hover:bg-error-700"
              >
                {respondMutation.isPending ? (
                  <Spinner size="sm" className="mr-2" />
                ) : null}
                Confirm Rejection
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
