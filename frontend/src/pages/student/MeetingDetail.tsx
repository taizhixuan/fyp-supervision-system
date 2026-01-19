import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Calendar,
  Clock,
  Video,
  MapPin,
  User,
  ExternalLink,
  XCircle,
  Edit,
  FileText,
} from 'lucide-react'
import { Card, Button, Badge, Spinner, Modal, AlertBanner } from '@/components/ui'
import { useMeetingDetail, useCancelMeeting } from '@/lib/hooks/useStudent'
import { ROUTES } from '@/lib/constants/routes'
import { cn } from '@/lib/utils/cn'
import type { MeetingStatus } from '@/types'

// Sample data
const SAMPLE_MEETING = {
  meetingId: '1',
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
    researchAreas: ['AI', 'ML'],
    currentLoad: 5,
    maxCapacity: 8,
    isAcceptingStudents: true,
  },
  title: 'Weekly Progress Review',
  agenda: 'Discuss proposal progress and methodology refinements. Review timeline and next milestones.',
  scheduledAt: '2025-01-25T10:00:00Z',
  duration: 60,
  platform: 'ZOOM' as const,
  meetingLink: 'https://zoom.us/j/123456789',
  status: 'CONFIRMED' as MeetingStatus,
  notes: undefined,
  createdAt: '2025-01-15T10:00:00Z',
  updatedAt: '2025-01-18T14:30:00Z',
}

const statusConfig: Record<MeetingStatus, { label: string; variant: 'default' | 'success' | 'warning' | 'error'; description: string }> = {
  PENDING: { label: 'Pending', variant: 'warning', description: 'Waiting for supervisor confirmation' },
  CONFIRMED: { label: 'Confirmed', variant: 'success', description: 'Meeting confirmed by supervisor' },
  RESCHEDULED: { label: 'Rescheduled', variant: 'warning', description: 'Meeting has been rescheduled' },
  CANCELLED: { label: 'Cancelled', variant: 'error', description: 'Meeting was cancelled' },
  COMPLETED: { label: 'Completed', variant: 'default', description: 'Meeting has been completed' },
}

export function MeetingDetail() {
  const { id } = useParams<{ id: string }>()
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelReason, setCancelReason] = useState('')

  const { data: meeting, isLoading } = useMeetingDetail(id || '')
  const cancelMeeting = useCancelMeeting()

  // Use sample data
  const displayMeeting = meeting || SAMPLE_MEETING
  const status = statusConfig[displayMeeting.status]

  const handleCancel = async () => {
    try {
      await cancelMeeting.mutateAsync({ meetingId: id!, reason: cancelReason })
      setShowCancelModal(false)
    } catch (err) {
      // Error handled by mutation
    }
  }

  const isUpcoming = new Date(displayMeeting.scheduledAt) > new Date()
  const canCancel = isUpcoming && ['PENDING', 'CONFIRMED'].includes(displayMeeting.status)
  const canCreateLog = displayMeeting.status === 'COMPLETED'

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" label="Loading meeting..." />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back Button */}
      <Link
        to={ROUTES.STUDENT.MEETINGS}
        className="inline-flex items-center gap-2 text-neutral-600 hover:text-primary-600 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Meetings
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">{displayMeeting.title}</h1>
          <p className="text-neutral-600 mt-1">with {displayMeeting.supervisor.fullName}</p>
        </div>
        <Badge variant={status.variant} size="lg">{status.label}</Badge>
      </div>

      {/* Status Banner */}
      {displayMeeting.status === 'CONFIRMED' && isUpcoming && (
        <AlertBanner
          variant="success"
          title="Meeting Confirmed"
          description={`Your meeting is scheduled for ${new Date(displayMeeting.scheduledAt).toLocaleDateString('en-MY', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })} at ${new Date(displayMeeting.scheduledAt).toLocaleTimeString('en-MY', {
            hour: '2-digit',
            minute: '2-digit',
          })}`}
        />
      )}

      {displayMeeting.status === 'PENDING' && (
        <AlertBanner
          variant="warning"
          title="Awaiting Confirmation"
          description="Your meeting request is pending. Your supervisor will confirm the meeting soon."
        />
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Meeting Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">Meeting Details</h2>

            <div className="space-y-4">
              {/* Date & Time */}
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
                  <Calendar className="h-5 w-5 text-primary-600" />
                </div>
                <div>
                  <p className="font-medium text-neutral-900">
                    {new Date(displayMeeting.scheduledAt).toLocaleDateString('en-MY', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                  <p className="text-sm text-neutral-600">
                    {new Date(displayMeeting.scheduledAt).toLocaleTimeString('en-MY', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>

              {/* Duration */}
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-warning-100 flex items-center justify-center flex-shrink-0">
                  <Clock className="h-5 w-5 text-warning-600" />
                </div>
                <div>
                  <p className="font-medium text-neutral-900">{displayMeeting.duration} minutes</p>
                  <p className="text-sm text-neutral-600">Duration</p>
                </div>
              </div>

              {/* Platform */}
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-success-100 flex items-center justify-center flex-shrink-0">
                  {displayMeeting.platform === 'IN_PERSON' ? (
                    <MapPin className="h-5 w-5 text-success-600" />
                  ) : (
                    <Video className="h-5 w-5 text-success-600" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-neutral-900">
                    {displayMeeting.platform === 'IN_PERSON' ? 'In Person' : displayMeeting.platform.replace('_', ' ')}
                  </p>
                  {displayMeeting.platform === 'IN_PERSON' && displayMeeting.location && (
                    <p className="text-sm text-neutral-600">{displayMeeting.location}</p>
                  )}
                  {displayMeeting.meetingLink && displayMeeting.status === 'CONFIRMED' && (
                    <a
                      href={displayMeeting.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-primary-600 hover:underline mt-1"
                    >
                      Join Meeting <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Agenda */}
          {displayMeeting.agenda && (
            <Card>
              <h2 className="text-lg font-semibold text-neutral-900 mb-4">Agenda</h2>
              <p className="text-neutral-700 whitespace-pre-wrap">{displayMeeting.agenda}</p>
            </Card>
          )}

          {/* Notes (for completed meetings) */}
          {displayMeeting.notes && (
            <Card>
              <h2 className="text-lg font-semibold text-neutral-900 mb-4">Meeting Notes</h2>
              <p className="text-neutral-700 whitespace-pre-wrap">{displayMeeting.notes}</p>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Supervisor */}
          <Card>
            <h3 className="text-sm font-medium text-neutral-500 mb-3">Supervisor</h3>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                <span className="text-lg font-bold text-primary-600">
                  {displayMeeting.supervisor.fullName
                    .split(' ')
                    .filter((n) => !['Dr.', 'Prof.'].includes(n))
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)}
                </span>
              </div>
              <div>
                <p className="font-medium text-neutral-900">{displayMeeting.supervisor.fullName}</p>
                <p className="text-sm text-neutral-500">{displayMeeting.supervisor.email}</p>
              </div>
            </div>
          </Card>

          {/* Actions */}
          <Card>
            <h3 className="text-sm font-medium text-neutral-500 mb-3">Actions</h3>
            <div className="space-y-2">
              {displayMeeting.meetingLink && displayMeeting.status === 'CONFIRMED' && isUpcoming && (
                <a
                  href={displayMeeting.meetingLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Button variant="primary" className="w-full" leftIcon={<Video className="h-4 w-4" />}>
                    Join Meeting
                  </Button>
                </a>
              )}

              {canCreateLog && (
                <Link to={`${ROUTES.STUDENT.LOG_NEW}?meetingId=${displayMeeting.meetingId}`}>
                  <Button variant="secondary" className="w-full" leftIcon={<FileText className="h-4 w-4" />}>
                    Create Log
                  </Button>
                </Link>
              )}

              {canCancel && (
                <Button
                  variant="ghost"
                  className="w-full text-error-600 hover:bg-error-50"
                  leftIcon={<XCircle className="h-4 w-4" />}
                  onClick={() => setShowCancelModal(true)}
                >
                  Cancel Meeting
                </Button>
              )}
            </div>
          </Card>

          {/* Timeline */}
          <Card>
            <h3 className="text-sm font-medium text-neutral-500 mb-3">Activity</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 rounded-full bg-neutral-300 mt-1.5" />
                <div>
                  <p className="text-neutral-700">Meeting {displayMeeting.status.toLowerCase()}</p>
                  <p className="text-neutral-400 text-xs">
                    {new Date(displayMeeting.updatedAt).toLocaleDateString('en-MY')}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 rounded-full bg-neutral-300 mt-1.5" />
                <div>
                  <p className="text-neutral-700">Request sent</p>
                  <p className="text-neutral-400 text-xs">
                    {new Date(displayMeeting.createdAt).toLocaleDateString('en-MY')}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Cancel Modal */}
      <Modal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        title="Cancel Meeting"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-neutral-600">
            Are you sure you want to cancel this meeting? Your supervisor will be notified.
          </p>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Reason (Optional)
            </label>
            <textarea
              className="w-full px-4 py-3 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
              rows={3}
              placeholder="Let your supervisor know why you're cancelling..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setShowCancelModal(false)}>
              Keep Meeting
            </Button>
            <Button
              variant="error"
              onClick={handleCancel}
              isLoading={cancelMeeting.isPending}
            >
              Cancel Meeting
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
