import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Video,
  Users,
  CheckCircle,
  XCircle,
  GraduationCap,
  Mail,
  FileText,
  MessageSquare,
  ExternalLink,
  Copy,
  Check,
  Share2,
  Link2,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import { useSupervisorMeeting, useRespondToMeeting, useCompleteMeeting } from '@/lib/hooks/useSupervisor'
import { ROUTES } from '@/lib/constants/routes'
import { cn } from '@/lib/utils/cn'
import {
  detectPlatformFromUrl,
  getPlatformInfo,
  buildMeetingShareMailto,
} from '@/lib/utils/meetingPlatform'
import type { SvMeetingStatus, MeetingType } from '@/types'

const statusConfig: Record<SvMeetingStatus, { label: string; color: string; bgColor: string }> = {
  PENDING: { label: 'Pending Confirmation', color: 'text-warning-600', bgColor: 'bg-warning-50' },
  CONFIRMED: { label: 'Confirmed', color: 'text-success-600', bgColor: 'bg-success-50' },
  COMPLETED: { label: 'Completed', color: 'text-primary-600', bgColor: 'bg-primary-50' },
  CANCELLED: { label: 'Cancelled', color: 'text-error-600', bgColor: 'bg-error-50' },
  RESCHEDULED: { label: 'Rescheduled', color: 'text-info-600', bgColor: 'bg-info-50' },
  NO_SHOW: { label: 'No Show', color: 'text-neutral-600', bgColor: 'bg-neutral-100' },
}

const typeConfig: Record<MeetingType, { label: string; icon: typeof MapPin }> = {
  IN_PERSON: { label: 'In Person', icon: MapPin },
  ONLINE: { label: 'Online', icon: Video },
  HYBRID: { label: 'Hybrid', icon: Users },
}

export function MeetingDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [showRescheduleModal, setShowRescheduleModal] = useState(false)
  const [showCompleteModal, setShowCompleteModal] = useState(false)
  const [rescheduleDate, setRescheduleDate] = useState('')
  const [rescheduleTime, setRescheduleTime] = useState('')
  const [meetingNotes, setMeetingNotes] = useState('')
  const [actionItems, setActionItems] = useState('')
  const [linkCopied, setLinkCopied] = useState(false)

  const { data: meeting, isLoading } = useSupervisorMeeting(Number(id))
  const respondMutation = useRespondToMeeting()
  const completeMutation = useCompleteMeeting()

  const handleConfirm = async (selectedDateTime?: string) => {
    if (!meeting) return
    const dateTime = selectedDateTime || meeting.proposedDateTime
    try {
      await respondMutation.mutateAsync({
        meetingId: meeting.meetingId,
        action: 'CONFIRM',
        confirmedDateTime: dateTime,
      })
    } catch (error) {
      console.error('Failed to confirm meeting:', error)
    }
  }

  const handleReschedule = async () => {
    if (!meeting || !rescheduleDate || !rescheduleTime) return
    const newDateTime = `${rescheduleDate}T${rescheduleTime}:00Z`
    try {
      await respondMutation.mutateAsync({
        meetingId: meeting.meetingId,
        action: 'RESCHEDULE',
        confirmedDateTime: newDateTime,
      })
      setShowRescheduleModal(false)
    } catch (error) {
      console.error('Failed to reschedule meeting:', error)
    }
  }

  const handleCancel = async () => {
    if (!meeting) return
    if (!confirm('Are you sure you want to cancel this meeting?')) return
    try {
      await respondMutation.mutateAsync({
        meetingId: meeting.meetingId,
        action: 'CANCEL',
      })
    } catch (error) {
      console.error('Failed to cancel meeting:', error)
    }
  }

  const handleComplete = async () => {
    if (!meeting) return
    try {
      await completeMutation.mutateAsync({
        meetingId: meeting.meetingId,
        notes: meetingNotes,
        actionItems: actionItems.split('\n').filter((item) => item.trim()),
      })
      setShowCompleteModal(false)
    } catch (error) {
      console.error('Failed to complete meeting:', error)
    }
  }

  const handleCopyLink = async (url: string) => {
    await navigator.clipboard.writeText(url)
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2000)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!meeting) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-neutral-900">Meeting not found</h2>
        <p className="text-neutral-600 mt-2">The meeting you're looking for doesn't exist.</p>
        <Link to={ROUTES.SUPERVISOR.MEETINGS}>
          <Button className="mt-4">Back to Meetings</Button>
        </Link>
      </div>
    )
  }

  const status = statusConfig[meeting.status]
  const type = typeConfig[meeting.type]
  const TypeIcon = type.icon
  const meetingDate = meeting.confirmedDateTime || meeting.proposedDateTime
  const canRespond = meeting.status === 'PENDING'
  const canComplete = meeting.status === 'CONFIRMED' && new Date(meetingDate) <= new Date()
  const canCancel = meeting.status === 'PENDING' || meeting.status === 'CONFIRMED'

  // Platform detection for online/hybrid meetings
  const detectedPlatform = meeting.meetingUrl
    ? meeting.onlinePlatform || detectPlatformFromUrl(meeting.meetingUrl)
    : null
  const platformInfo = detectedPlatform ? getPlatformInfo(detectedPlatform) : null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to={ROUTES.SUPERVISOR.MEETINGS}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Meetings
          </Button>
        </Link>
      </div>

      {/* Status Banner */}
      <div className={cn('p-4 rounded-lg flex items-center justify-between', status.bgColor)}>
        <div className="flex items-center gap-3">
          <Calendar className={cn('h-6 w-6', status.color)} />
          <div>
            <p className={cn('font-semibold', status.color)}>{status.label}</p>
            <p className="text-sm text-neutral-600">
              {meeting.requestedBy === 'SUPERVISOR' ? 'You' : meeting.studentName} requested this meeting
            </p>
          </div>
        </div>
        {canRespond && (
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={() => setShowRescheduleModal(true)}
              disabled={respondMutation.isPending}
            >
              Reschedule
            </Button>
            <Button
              onClick={() => handleConfirm()}
              disabled={respondMutation.isPending}
            >
              {respondMutation.isPending ? (
                <Spinner size="sm" className="mr-2" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Confirm
            </Button>
          </div>
        )}
        {canComplete && (
          <Button onClick={() => setShowCompleteModal(true)}>
            <CheckCircle className="h-4 w-4 mr-2" />
            Mark as Complete
          </Button>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-1 space-y-6">
          {/* Student Info */}
          <Card>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <GraduationCap className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="font-semibold text-neutral-900">{meeting.studentName}</h3>
              <p className="text-sm text-neutral-500">Supervisee</p>
            </div>
            <div className="mt-4 pt-4 border-t border-neutral-200">
              <Button variant="secondary" className="w-full">
                <Mail className="h-4 w-4 mr-2" />
                Send Email
              </Button>
            </div>
          </Card>

          {/* Meeting Details */}
          <Card>
            <h3 className="font-semibold text-neutral-900 mb-4">Meeting Details</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-neutral-400" />
                <div>
                  <p className="text-sm font-medium text-neutral-900">
                    {new Date(meetingDate).toLocaleDateString('en-MY', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {meeting.status === 'PENDING' ? 'Proposed date' : 'Confirmed date'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-neutral-400" />
                <div>
                  <p className="text-sm font-medium text-neutral-900">
                    {new Date(meetingDate).toLocaleTimeString('en-MY', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                  <p className="text-xs text-neutral-500">{meeting.duration} minutes</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <TypeIcon className="h-5 w-5 text-neutral-400" />
                <div>
                  <p className="text-sm font-medium text-neutral-900">{type.label}</p>
                  {meeting.location && (
                    <p className="text-xs text-neutral-500">{meeting.location}</p>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Cancellation Reason (only when CANCELLED) */}
          {meeting.status === 'CANCELLED' && meeting.cancelReason && (
            <Card className="border-l-4 border-l-error-500 bg-error-50/30">
              <h3 className="font-semibold text-neutral-900 mb-2 flex items-center gap-2">
                <XCircle className="h-5 w-5 text-error-600" />
                Cancellation Reason
              </h3>
              <p className="text-sm text-neutral-700 whitespace-pre-wrap">{meeting.cancelReason}</p>
            </Card>
          )}

          {/* Online Meeting Link Card */}
          {meeting.meetingUrl && (
            <Card>
              <h3 className="font-semibold text-neutral-900 mb-3 flex items-center gap-2">
                <Video className="h-5 w-5 text-neutral-400" />
                Online Meeting
              </h3>

              {/* Platform Badge */}
              {platformInfo && (
                <div className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium mb-3', platformInfo.bgColor, platformInfo.color)}>
                  <Video className="h-3 w-3" />
                  {platformInfo.label}
                </div>
              )}

              {/* Join Button */}
              <a
                href={meeting.meetingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
              >
                <Video className="h-4 w-4" />
                Join Online Meeting
                <ExternalLink className="h-3 w-3" />
              </a>

              {/* Link Actions */}
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => handleCopyLink(meeting.meetingUrl!)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 border border-neutral-200 rounded-lg text-xs font-medium text-neutral-600 hover:bg-neutral-50 transition-colors"
                >
                  {linkCopied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-success-500" />
                      <span className="text-success-600">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      Copy Link
                    </>
                  )}
                </button>
                <a
                  href={buildMeetingShareMailto({
                    title: meeting.title,
                    dateTime: meetingDate,
                    duration: meeting.duration,
                    meetingUrl: meeting.meetingUrl,
                    platform: detectedPlatform || 'OTHER',
                    agenda: meeting.agenda,
                  })}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 border border-neutral-200 rounded-lg text-xs font-medium text-neutral-600 hover:bg-neutral-50 transition-colors"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  Share via Email
                </a>
              </div>

              {/* Meeting URL display */}
              <div className="mt-3 p-2 bg-neutral-50 rounded border border-neutral-200">
                <p className="text-xs text-neutral-500 truncate flex items-center gap-1">
                  <Link2 className="h-3 w-3 flex-shrink-0" />
                  {meeting.meetingUrl}
                </p>
              </div>
            </Card>
          )}

          {/* Alternative Times (if pending) */}
          {canRespond && meeting.alternativeDateTimes && meeting.alternativeDateTimes.length > 0 && (
            <Card>
              <h3 className="font-semibold text-neutral-900 mb-4">Alternative Times</h3>
              <div className="space-y-2">
                {meeting.alternativeDateTimes.map((dt, index) => (
                  <button
                    key={index}
                    onClick={() => handleConfirm(dt)}
                    className="w-full p-3 text-left bg-neutral-50 hover:bg-primary-50 rounded-lg transition-colors"
                  >
                    <p className="text-sm font-medium text-neutral-900">
                      {new Date(dt).toLocaleDateString('en-MY', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                      })}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {new Date(dt).toLocaleTimeString('en-MY', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </button>
                ))}
              </div>
            </Card>
          )}

          {/* Actions */}
          {canCancel && (
            <Card>
              <h3 className="font-semibold text-neutral-900 mb-4">Actions</h3>
              <div className="space-y-2">
                {canRespond && (
                  <Button
                    variant="secondary"
                    className="w-full"
                    onClick={() => setShowRescheduleModal(true)}
                  >
                    Reschedule
                  </Button>
                )}
                <Button
                  variant="secondary"
                  className="w-full text-error-600 border-error-300 hover:bg-error-50"
                  onClick={handleCancel}
                  disabled={respondMutation.isPending}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancel Meeting
                </Button>
              </div>
            </Card>
          )}
        </div>

        {/* Right Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Meeting Title */}
          <Card>
            <h2 className="text-xl font-semibold text-neutral-900">{meeting.title}</h2>
          </Card>

          {/* Agenda */}
          {meeting.agenda && (
            <Card>
              <h3 className="font-semibold text-neutral-900 mb-3 flex items-center gap-2">
                <FileText className="h-5 w-5 text-neutral-400" />
                Agenda
              </h3>
              <p className="text-neutral-600 whitespace-pre-wrap">{meeting.agenda}</p>
            </Card>
          )}

          {/* Meeting Notes (if completed) */}
          {meeting.notes && (
            <Card>
              <h3 className="font-semibold text-neutral-900 mb-3 flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-neutral-400" />
                Meeting Notes
              </h3>
              <p className="text-neutral-600 whitespace-pre-wrap">{meeting.notes}</p>
            </Card>
          )}

          {/* Action Items (if completed) */}
          {meeting.actionItems && meeting.actionItems.length > 0 && (
            <Card>
              <h3 className="font-semibold text-neutral-900 mb-3">Action Items</h3>
              <ul className="space-y-2">
                {meeting.actionItems.map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-neutral-600">
                    <CheckCircle className="h-4 w-4 text-success-500 mt-0.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>

      {/* Reschedule Modal */}
      {showRescheduleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">Reschedule Meeting</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">New Date</label>
                <Input
                  type="date"
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">New Time</label>
                <Input
                  type="time"
                  value={rescheduleTime}
                  onChange={(e) => setRescheduleTime(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="secondary" onClick={() => setShowRescheduleModal(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleReschedule}
                disabled={!rescheduleDate || !rescheduleTime || respondMutation.isPending}
              >
                {respondMutation.isPending ? <Spinner size="sm" className="mr-2" /> : null}
                Confirm Reschedule
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Complete Meeting Modal */}
      {showCompleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">Complete Meeting</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Meeting Notes</label>
                <textarea
                  value={meetingNotes}
                  onChange={(e) => setMeetingNotes(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter meeting summary and notes..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Action Items (one per line)
                </label>
                <textarea
                  value={actionItems}
                  onChange={(e) => setActionItems(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter action items..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="secondary" onClick={() => setShowCompleteModal(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleComplete}
                disabled={completeMutation.isPending}
              >
                {completeMutation.isPending ? <Spinner size="sm" className="mr-2" /> : null}
                Complete Meeting
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
