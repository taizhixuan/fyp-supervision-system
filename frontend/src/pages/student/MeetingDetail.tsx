import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Calendar,
  Clock,
  Video,
  MapPin,
  ExternalLink,
  XCircle,
  FileText,
  Copy,
  Check,
  Link2,
  User,
  Mail,
  Building,
  CheckCircle,
  RefreshCw,
  X,
  MessageSquare,
  ClipboardList,
  Bell,
  Sparkles,
} from 'lucide-react'
import { Card, Button, Spinner, Modal } from '@/components/ui'
import { useMeetingDetail, useCancelMeeting, useStudentRespondToMeeting } from '@/lib/hooks/useStudent'
import { localDatetimeToLocalDateTime } from '@/lib/utils/datetimeLocal'
import { ROUTES } from '@/lib/constants/routes'
import { cn } from '@/lib/utils/cn'
import { detectPlatformFromUrl, getPlatformInfo } from '@/lib/utils/meetingPlatform'
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
  platform: 'MICROSOFT_TEAMS' as const,
  meetingLink: 'https://teams.microsoft.com/l/meetup-join/19%3ameeting_123456789',
  status: 'CONFIRMED' as MeetingStatus,
  notes: undefined,
  cancelReason: undefined as string | undefined,
  createdAt: '2025-01-15T10:00:00Z',
  updatedAt: '2025-01-18T14:30:00Z',
}

const statusConfig: Record<MeetingStatus, {
  label: string
  variant: 'default' | 'success' | 'warning' | 'error'
  description: string
  icon: React.ReactNode
  bgGradient: string
  iconBg: string
}> = {
  PENDING: {
    label: 'Pending Confirmation',
    variant: 'warning',
    description: 'Waiting for supervisor confirmation',
    icon: <Clock className="h-5 w-5" />,
    bgGradient: 'from-warning-500 to-warning-600',
    iconBg: 'bg-warning-100 text-warning-600'
  },
  CONFIRMED: {
    label: 'Confirmed',
    variant: 'success',
    description: 'Meeting confirmed by supervisor',
    icon: <CheckCircle className="h-5 w-5" />,
    bgGradient: 'from-success-500 to-success-600',
    iconBg: 'bg-success-100 text-success-600'
  },
  RESCHEDULED: {
    label: 'Rescheduled',
    variant: 'warning',
    description: 'Meeting has been rescheduled',
    icon: <RefreshCw className="h-5 w-5" />,
    bgGradient: 'from-info-500 to-info-600',
    iconBg: 'bg-info-100 text-info-600'
  },
  CANCELLED: {
    label: 'Cancelled',
    variant: 'error',
    description: 'Meeting was cancelled',
    icon: <X className="h-5 w-5" />,
    bgGradient: 'from-error-500 to-error-600',
    iconBg: 'bg-error-100 text-error-600'
  },
  COMPLETED: {
    label: 'Completed',
    variant: 'default',
    description: 'Meeting has been completed',
    icon: <Check className="h-5 w-5" />,
    bgGradient: 'from-neutral-500 to-neutral-600',
    iconBg: 'bg-neutral-100 text-neutral-600'
  },
  PROPOSED: {
    label: 'Awaiting Response',
    variant: 'warning',
    description: 'Waiting for supervisor confirmation',
    icon: <Clock className="h-5 w-5" />,
    bgGradient: 'from-warning-500 to-warning-600',
    iconBg: 'bg-warning-100 text-warning-600'
  },
  NO_SHOW: {
    label: 'No Show',
    variant: 'default',
    description: 'Meeting was missed',
    icon: <X className="h-5 w-5" />,
    bgGradient: 'from-neutral-500 to-neutral-600',
    iconBg: 'bg-neutral-100 text-neutral-600'
  },
}
const MEETING_STATUS_FALLBACK = {
  label: 'Unknown',
  variant: 'default' as const,
  description: '',
  icon: <Clock className="h-5 w-5" />,
  bgGradient: 'from-neutral-500 to-neutral-600',
  iconBg: 'bg-neutral-100 text-neutral-600',
}

// Countdown helper
function getTimeRemaining(targetDate: Date) {
  const now = new Date()
  const diff = targetDate.getTime() - now.getTime()

  if (diff <= 0) return null

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

  return { days, hours, minutes, total: diff }
}

export function MeetingDetail() {
  const { id } = useParams<{ id: string }>()
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [linkCopied, setLinkCopied] = useState(false)
  const [countdown, setCountdown] = useState<ReturnType<typeof getTimeRemaining>>(null)

  const { data: meeting, isLoading } = useMeetingDetail(id || '')
  const cancelMeeting = useCancelMeeting()
  const respondMutation = useStudentRespondToMeeting()
  const [reschedDateTime, setReschedDateTime] = useState('')
  const [reschedReason, setReschedReason] = useState('')
  const [showReschedModal, setShowReschedModal] = useState(false)
  const [showDeclineModal, setShowDeclineModal] = useState(false)
  const [declineReason, setDeclineReason] = useState('')
  const [actionError, setActionError] = useState<string | null>(null)

  const handleAccept = async () => {
    setActionError(null)
    try {
      await respondMutation.mutateAsync({ meetingId: id!, action: 'ACCEPT' })
    } catch (err: any) {
      setActionError(err?.response?.data?.message || err?.message || 'Failed to accept.')
    }
  }
  const handleDeclineSubmit = async () => {
    setActionError(null)
    try {
      await respondMutation.mutateAsync({ meetingId: id!, action: 'DECLINE', reason: declineReason })
      setShowDeclineModal(false)
      setDeclineReason('')
    } catch (err: any) {
      setActionError(err?.response?.data?.message || err?.message || 'Failed to decline.')
    }
  }
  const handleReschedSubmit = async () => {
    setActionError(null)
    try {
      await respondMutation.mutateAsync({
        meetingId: id!,
        action: 'RESCHEDULE',
        proposedDateTime: localDatetimeToLocalDateTime(reschedDateTime),
        reason: reschedReason,
      })
      setShowReschedModal(false)
      setReschedDateTime('')
      setReschedReason('')
    } catch (err: any) {
      setActionError(err?.response?.data?.message || err?.message || 'Failed to reschedule.')
    }
  }

  // Use sample data
  const displayMeeting = meeting || SAMPLE_MEETING
  const status = statusConfig[displayMeeting.status] ?? MEETING_STATUS_FALLBACK

  // Countdown timer
  useEffect(() => {
    const targetDate = new Date(displayMeeting.scheduledAt)
    const updateCountdown = () => setCountdown(getTimeRemaining(targetDate))
    updateCountdown()
    const interval = setInterval(updateCountdown, 60000) // Update every minute
    return () => clearInterval(interval)
  }, [displayMeeting.scheduledAt])

  const handleCancel = async () => {
    try {
      await cancelMeeting.mutateAsync({ meetingId: id!, reason: cancelReason })
      setShowCancelModal(false)
    } catch (err) {
      // Error handled by mutation
    }
  }

  const handleCopyLink = async () => {
    if (displayMeeting.meetingLink) {
      await navigator.clipboard.writeText(displayMeeting.meetingLink)
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
    }
  }

  const isUpcoming = new Date(displayMeeting.scheduledAt) > new Date()
  const canCancel = isUpcoming && ['PENDING', 'PROPOSED', 'RESCHEDULED', 'CONFIRMED'].includes(displayMeeting.status)
  const canCreateLog = displayMeeting.status === 'COMPLETED'
  const meetingDate = new Date(displayMeeting.scheduledAt)

  // Platform detection
  const detectedPlatform = displayMeeting.meetingLink ? detectPlatformFromUrl(displayMeeting.meetingLink) : null
  const platformInfo = detectedPlatform ? getPlatformInfo(detectedPlatform) : null

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" label="Loading meeting..." />
      </div>
    )
  }

  return (
    <div className="space-y-3 lg:space-y-4">
      {/* Back Button */}
      <Link
        to={ROUTES.STUDENT.MEETINGS}
        className="inline-flex items-center gap-2 text-neutral-600 hover:text-primary-600 transition-colors group"
      >
        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
        Back to Meetings
      </Link>

      {/* Response Required: supervisor proposed a new time (status RESCHEDULED
          always needs the student's response regardless of original initiator;
          PROPOSED only when supervisor is the one who made the proposal). */}
      {(displayMeeting.status === 'RESCHEDULED' ||
        (displayMeeting.status === 'PROPOSED' && displayMeeting.initiatedBy === 'SUPERVISOR')) && (
        <Card className="border-amber-200 bg-amber-50">
          <h3 className="font-semibold text-amber-900">Action needed: respond to this meeting</h3>
          <p className="mt-1 text-sm text-amber-800">
            Your supervisor proposed{' '}
            {displayMeeting.proposedStartAt
              ? new Date(displayMeeting.proposedStartAt).toLocaleString('en-MY', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : 'a meeting time'}
            . Accept, decline, or propose a new time.
          </p>
          {actionError && (
            <p className="mt-2 text-sm text-rose-700">{actionError}</p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="primary" onClick={handleAccept} isLoading={respondMutation.isPending}>
              Accept
            </Button>
            <Button variant="secondary" onClick={() => setShowReschedModal(true)}>
              Reschedule
            </Button>
            <Button
              variant="secondary"
              onClick={() => setShowDeclineModal(true)}
              className="!border-rose-300 !text-rose-700 hover:!bg-rose-50"
            >
              Decline
            </Button>
          </div>
        </Card>
      )}

      {/* Hero Header */}
      <div className={cn(
        'relative rounded-2xl overflow-hidden bg-gradient-to-r p-6 text-white',
        `bg-gradient-to-r ${status.bgGradient}`
      )}>
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />

        <div className="relative">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium">
                  {status.icon}
                  {status.label}
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2">{displayMeeting.title}</h1>
              <p className="text-white/80 flex items-center gap-2">
                <User className="h-4 w-4" />
                with {displayMeeting.supervisor.fullName}
              </p>
            </div>

            {/* Countdown / Date Display */}
            {isUpcoming && countdown && displayMeeting.status !== 'CANCELLED' ? (
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center min-w-[200px]">
                <p className="text-white/80 text-xs uppercase tracking-wider mb-2">Starts In</p>
                <div className="flex justify-center gap-3">
                  {countdown.days > 0 && (
                    <div>
                      <div className="text-3xl font-bold">{countdown.days}</div>
                      <div className="text-xs text-white/70">days</div>
                    </div>
                  )}
                  <div>
                    <div className="text-3xl font-bold">{countdown.hours}</div>
                    <div className="text-xs text-white/70">hrs</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold">{countdown.minutes}</div>
                    <div className="text-xs text-white/70">min</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center">
                <p className="text-white/80 text-xs uppercase tracking-wider mb-1">
                  {displayMeeting.status === 'COMPLETED' ? 'Held On' : 'Scheduled'}
                </p>
                <p className="text-xl font-bold">
                  {meetingDate.toLocaleDateString('en-MY', { day: 'numeric', month: 'short' })}
                </p>
                <p className="text-white/80 text-sm">
                  {meetingDate.toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            )}
          </div>

          {/* Quick Info Bar */}
          <div className="flex flex-wrap gap-4 mt-6 pt-4 border-t border-white/20">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-white/70" />
              <span>{meetingDate.toLocaleDateString('en-MY', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-white/70" />
              <span>{displayMeeting.duration} minutes</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              {displayMeeting.platform === 'IN_PERSON' ? (
                <MapPin className="h-4 w-4 text-white/70" />
              ) : (
                <Video className="h-4 w-4 text-white/70" />
              )}
              <span>
                {displayMeeting.platform === 'IN_PERSON'
                  ? displayMeeting.location || 'In Person'
                  : platformInfo?.label || displayMeeting.platform.replace('_', ' ')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-3 lg:space-y-4">
          {/* Join Meeting CTA (for confirmed upcoming meetings) */}
          {displayMeeting.meetingLink && displayMeeting.status === 'CONFIRMED' && isUpcoming && (
            <Card className="bg-gradient-to-r from-primary-50 to-primary-100 border-primary-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    'w-14 h-14 rounded-xl flex items-center justify-center shadow-lg',
                    platformInfo?.bgColor || 'bg-primary-100'
                  )}>
                    <Video className={cn('h-7 w-7', platformInfo?.color || 'text-primary-600')} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-neutral-900">Ready to Join?</h3>
                    <p className="text-sm text-neutral-600">
                      {platformInfo?.label || 'Online'} meeting • {displayMeeting.duration} min
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyLink}
                    className={cn(
                      'p-2.5 rounded-lg border transition-all',
                      linkCopied
                        ? 'bg-success-100 border-success-200 text-success-600'
                        : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                    )}
                    title="Copy link"
                  >
                    {linkCopied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                  </button>
                  <a href={displayMeeting.meetingLink} target="_blank" rel="noopener noreferrer">
                    <Button
                      variant="primary"
                      className="shadow-lg shadow-primary-500/25"
                      rightIcon={<ExternalLink className="h-4 w-4" />}
                    >
                      Join Meeting
                    </Button>
                  </a>
                </div>
              </div>
              {/* Meeting Link Display */}
              <div className="mt-4 flex items-center gap-2 p-2 bg-white/60 rounded-lg">
                <Link2 className="h-4 w-4 text-neutral-400 flex-shrink-0" />
                <span className="text-sm text-neutral-600 truncate flex-1">{displayMeeting.meetingLink}</span>
              </div>
            </Card>
          )}

          {/* Agenda Card */}
          <Card>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                <ClipboardList className="h-5 w-5 text-primary-600" />
              </div>
              <h2 className="text-lg font-semibold text-neutral-900">Meeting Agenda</h2>
            </div>
            {displayMeeting.agenda ? (
              <div className="bg-neutral-50 rounded-xl p-4">
                <p className="text-neutral-700 whitespace-pre-wrap leading-relaxed">{displayMeeting.agenda}</p>
              </div>
            ) : (
              <div className="bg-neutral-50 rounded-xl p-6 text-center">
                <MessageSquare className="h-10 w-10 text-neutral-300 mx-auto mb-2" />
                <p className="text-neutral-500">No agenda specified for this meeting</p>
              </div>
            )}
          </Card>

          {/* Meeting Notes (for completed meetings) */}
          {displayMeeting.status === 'COMPLETED' && (
            <Card>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-primary-600" />
                </div>
                <h2 className="text-lg font-semibold text-neutral-900">Meeting Notes</h2>
              </div>
              {displayMeeting.notes ? (
                <div className="bg-neutral-50 rounded-xl p-4">
                  <p className="text-neutral-700 whitespace-pre-wrap leading-relaxed">{displayMeeting.notes}</p>
                </div>
              ) : (
                <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl p-6 text-center border border-primary-100">
                  <Sparkles className="h-10 w-10 text-primary-400 mx-auto mb-3" />
                  <p className="text-neutral-600 mb-3">No notes added yet for this meeting</p>
                  <Link to={`${ROUTES.STUDENT.LOG_NEW}?meetingId=${displayMeeting.meetingId}`}>
                    <Button variant="secondary" size="sm" leftIcon={<FileText className="h-4 w-4" />}>
                      Create Supervision Log
                    </Button>
                  </Link>
                </div>
              )}
            </Card>
          )}

          {/* Status Info Card */}
          <Card className={cn(
            'border-l-4',
            (displayMeeting.status === 'PENDING' || displayMeeting.status === 'PROPOSED' || displayMeeting.status === 'RESCHEDULED') && 'border-l-warning-500 bg-warning-50/50',
            displayMeeting.status === 'CONFIRMED' && 'border-l-success-500 bg-success-50/50',
            displayMeeting.status === 'CANCELLED' && 'border-l-error-500 bg-error-50/50',
            displayMeeting.status === 'COMPLETED' && 'border-l-neutral-500 bg-neutral-50/50',
            displayMeeting.status === 'RESCHEDULED' && 'border-l-info-500 bg-info-50/50'
          )}>
            <div className="flex items-start gap-4">
              <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', status.iconBg)}>
                {status.icon}
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900">{status.label}</h3>
                <p className="text-sm text-neutral-600 mt-0.5">{status.description}</p>
                {displayMeeting.status === 'CANCELLED' && displayMeeting.cancelReason && (
                  <div className="mt-2 p-2 bg-white rounded-lg">
                    <p className="text-sm text-neutral-600">
                      <span className="font-medium">Reason:</span> {displayMeeting.cancelReason}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-3 lg:space-y-4">
          {/* Supervisor Card */}
          <Card className="overflow-hidden">
            <div className="bg-gradient-to-r from-primary-500 to-primary-600 -m-5 mb-4 p-4">
              <h3 className="text-sm font-medium text-white/80">Supervisor</h3>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center shadow-lg">
                <span className="text-xl font-bold text-primary-700">
                  {displayMeeting.supervisor.fullName
                    .split(' ')
                    .filter((n) => !['Dr.', 'Prof.'].includes(n))
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-neutral-900 truncate">{displayMeeting.supervisor.fullName}</p>
                <p className="text-sm text-neutral-500">{displayMeeting.supervisor.title}</p>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 text-sm text-neutral-600">
                <Mail className="h-4 w-4 text-neutral-400" />
                <span className="truncate">{displayMeeting.supervisor.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-neutral-600">
                <Building className="h-4 w-4 text-neutral-400" />
                <span className="truncate">{displayMeeting.supervisor.department}</span>
              </div>
            </div>
          </Card>

          {/* Actions Card */}
          <Card>
            <h3 className="text-sm font-medium text-neutral-500 mb-4">Quick Actions</h3>
            <div className="space-y-2">
              {displayMeeting.meetingLink && displayMeeting.status === 'CONFIRMED' && isUpcoming && (
                <a href={displayMeeting.meetingLink} target="_blank" rel="noopener noreferrer" className="block">
                  <Button
                    variant="primary"
                    className="w-full bg-gradient-to-r from-primary-600 to-primary-700 shadow-md"
                    leftIcon={<Video className="h-4 w-4" />}
                  >
                    Join Meeting
                  </Button>
                </a>
              )}

              {canCreateLog && (
                <Link to={`${ROUTES.STUDENT.LOG_NEW}?meetingId=${displayMeeting.meetingId}`} className="block">
                  <Button variant="secondary" className="w-full" leftIcon={<FileText className="h-4 w-4" />}>
                    Create Supervision Log
                  </Button>
                </Link>
              )}

              <Link to={ROUTES.STUDENT.MEETING_NEW} className="block">
                <Button variant="ghost" className="w-full" leftIcon={<Calendar className="h-4 w-4" />}>
                  Schedule New Meeting
                </Button>
              </Link>

              {canCancel && (
                <Button
                  variant="ghost"
                  className="w-full text-error-600 hover:bg-error-50 hover:text-error-700"
                  leftIcon={<XCircle className="h-4 w-4" />}
                  onClick={() => setShowCancelModal(true)}
                >
                  Cancel Meeting
                </Button>
              )}
            </div>
          </Card>

          {/* Activity Timeline */}
          <Card>
            <h3 className="text-sm font-medium text-neutral-500 mb-4">Activity Timeline</h3>
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-neutral-200" />

              <div className="space-y-4">
                {/* Current Status */}
                <div className="flex items-start gap-3 relative">
                  <div className={cn(
                    'w-4 h-4 rounded-full border-2 bg-white z-10',
                    displayMeeting.status === 'CONFIRMED' && 'border-success-500',
                    (displayMeeting.status === 'PENDING' || displayMeeting.status === 'PROPOSED') && 'border-warning-500',
                    displayMeeting.status === 'CANCELLED' && 'border-error-500',
                    displayMeeting.status === 'COMPLETED' && 'border-neutral-500',
                    displayMeeting.status === 'RESCHEDULED' && 'border-info-500'
                  )} />
                  <div className="flex-1 -mt-0.5">
                    <p className="text-sm font-medium text-neutral-900">
                      Meeting {displayMeeting.status.toLowerCase().replace('_', ' ')}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {new Date(displayMeeting.updatedAt).toLocaleDateString('en-MY', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>

                {/* Request Created */}
                <div className="flex items-start gap-3 relative">
                  <div className="w-4 h-4 rounded-full border-2 border-neutral-300 bg-white z-10" />
                  <div className="flex-1 -mt-0.5">
                    <p className="text-sm font-medium text-neutral-700">Request created</p>
                    <p className="text-xs text-neutral-500">
                      {new Date(displayMeeting.createdAt).toLocaleDateString('en-MY', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Reminder Card */}
          {isUpcoming && displayMeeting.status === 'CONFIRMED' && countdown && countdown.days <= 1 && (
            <Card className="bg-gradient-to-br from-warning-50 to-warning-100 border-warning-200">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-warning-100 flex items-center justify-center flex-shrink-0">
                  <Bell className="h-5 w-5 text-warning-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-warning-900">Meeting Soon!</h4>
                  <p className="text-sm text-warning-700 mt-0.5">
                    Don't forget to prepare for your meeting {countdown.hours > 0 ? `in ${countdown.hours}h ${countdown.minutes}m` : `in ${countdown.minutes} minutes`}
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Cancel Modal */}
      <Modal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        size="md"
      >
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-error-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="h-8 w-8 text-error-600" />
            </div>
            <h2 className="text-xl font-bold text-neutral-900">Cancel Meeting?</h2>
            <p className="text-neutral-600 mt-1">Your supervisor will be notified of this cancellation</p>
          </div>

          <div className="bg-neutral-50 rounded-xl p-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
                <Calendar className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <p className="font-medium text-neutral-900">{displayMeeting.title}</p>
                <p className="text-sm text-neutral-500">
                  {meetingDate.toLocaleDateString('en-MY', { weekday: 'short', day: 'numeric', month: 'short' })} at {meetingDate.toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Reason for cancellation <span className="text-error-600">*</span>
            </label>
            <textarea
              className="w-full px-4 py-3 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              rows={3}
              placeholder="Let your supervisor know why you're cancelling..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              maxLength={500}
              required
            />
            <p className="mt-1 text-xs text-neutral-500 text-right">
              {cancelReason.length}/500
            </p>
          </div>

          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => setShowCancelModal(false)} className="flex-1">
              Keep Meeting
            </Button>
            <Button
              variant="danger"
              onClick={handleCancel}
              isLoading={cancelMeeting.isPending}
              disabled={cancelReason.trim().length === 0}
              className="flex-1"
            >
              Cancel Meeting
            </Button>
          </div>
        </div>
      </Modal>

      {/* Reschedule Modal */}
      <Modal isOpen={showReschedModal} onClose={() => setShowReschedModal(false)} size="md">
        <div className="p-6">
          <h2 className="mb-2 text-xl font-bold text-neutral-900">Propose a new time</h2>
          <p className="mb-4 text-sm text-neutral-600">Your supervisor will be notified.</p>
          <label className="mb-1 block text-sm font-medium text-neutral-700">New date &amp; time</label>
          <input
            type="datetime-local"
            value={reschedDateTime}
            onChange={(e) => setReschedDateTime(e.target.value)}
            className="mb-4 w-full rounded-md border border-neutral-300 px-3 py-2"
          />
          <label className="mb-1 block text-sm font-medium text-neutral-700">Reason (optional)</label>
          <textarea
            value={reschedReason}
            onChange={(e) => setReschedReason(e.target.value)}
            rows={3}
            className="mb-4 w-full resize-none rounded-md border border-neutral-300 px-3 py-2"
            placeholder="e.g., I have a class conflict at that time…"
          />
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => setShowReschedModal(false)} className="flex-1">
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleReschedSubmit}
              isLoading={respondMutation.isPending}
              disabled={!reschedDateTime}
              className="flex-1"
            >
              Propose new time
            </Button>
          </div>
        </div>
      </Modal>

      {/* Decline Modal */}
      <Modal isOpen={showDeclineModal} onClose={() => setShowDeclineModal(false)} size="md">
        <div className="p-6">
          <h2 className="mb-2 text-xl font-bold text-neutral-900">Decline meeting</h2>
          <p className="mb-4 text-sm text-neutral-600">Tell your supervisor briefly why.</p>
          <textarea
            value={declineReason}
            onChange={(e) => setDeclineReason(e.target.value)}
            rows={3}
            className="mb-4 w-full resize-none rounded-md border border-neutral-300 px-3 py-2"
            placeholder="Reason for declining…"
          />
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => setShowDeclineModal(false)} className="flex-1">
              Keep
            </Button>
            <Button
              variant="danger"
              onClick={handleDeclineSubmit}
              isLoading={respondMutation.isPending}
              disabled={!declineReason.trim()}
              className="flex-1"
            >
              Decline
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
