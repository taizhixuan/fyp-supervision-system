import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Calendar,
  Clock,
  Video,
  MapPin,
  Plus,
  Filter,
  Download,
  CalendarCheck,
  CheckCircle,
  AlertCircle,
  User,
  ArrowRight,
  ClipboardList,
} from 'lucide-react'
import { Card, Button, Spinner } from '@/components/ui'
import { useMeetingList } from '@/lib/hooks/useStudent'
import { ROUTES } from '@/lib/constants/routes'
import { cn } from '@/lib/utils/cn'
import type { Meeting, MeetingStatus } from '@/types'

// Sample data
const SAMPLE_MEETINGS: Meeting[] = [
  {
    meetingId: '1',
    studentId: '1',
    supervisorId: '1',
    supervisor: { supervisorId: '1', userId: '101', fullName: 'Dr. Sarah Lee Wei Lin', email: 'sarah.lee@mmu.edu.my', title: 'Associate Professor', department: 'Software Engineering', faculty: 'FCI', researchAreas: [], currentLoad: 5, maxCapacity: 8, isAcceptingStudents: true },
    title: 'Weekly Progress Review',
    agenda: 'Discuss proposal progress and next steps',
    scheduledAt: '2025-01-25T10:00:00Z',
    duration: 60,
    platform: 'MICROSOFT_TEAMS',
    meetingLink: 'https://teams.microsoft.com/l/meetup-join/19%3ameeting_123456789',
    status: 'CONFIRMED',
    createdAt: '2025-01-15',
    updatedAt: '2025-01-15',
  },
  {
    meetingId: '2',
    studentId: '1',
    supervisorId: '1',
    supervisor: { supervisorId: '1', userId: '101', fullName: 'Dr. Sarah Lee Wei Lin', email: 'sarah.lee@mmu.edu.my', title: 'Associate Professor', department: 'Software Engineering', faculty: 'FCI', researchAreas: [], currentLoad: 5, maxCapacity: 8, isAcceptingStudents: true },
    title: 'Proposal Review Meeting',
    scheduledAt: '2025-02-01T14:00:00Z',
    duration: 45,
    platform: 'IN_PERSON',
    location: 'Room 3.12, FCI Building',
    status: 'PENDING',
    createdAt: '2025-01-18',
    updatedAt: '2025-01-18',
  },
  {
    meetingId: '3',
    studentId: '1',
    supervisorId: '1',
    supervisor: { supervisorId: '1', userId: '101', fullName: 'Dr. Sarah Lee Wei Lin', email: 'sarah.lee@mmu.edu.my', title: 'Associate Professor', department: 'Software Engineering', faculty: 'FCI', researchAreas: [], currentLoad: 5, maxCapacity: 8, isAcceptingStudents: true },
    title: 'Initial Consultation',
    scheduledAt: '2025-01-15T10:00:00Z',
    duration: 30,
    platform: 'MICROSOFT_TEAMS',
    meetingLink: 'https://teams.microsoft.com/l/meetup-join/19%3ameeting_987654321',
    status: 'COMPLETED',
    notes: 'Discussed project scope and timeline',
    createdAt: '2025-01-10',
    updatedAt: '2025-01-15',
  },
]

const statusConfig: Record<MeetingStatus, { label: string; variant: 'default' | 'success' | 'warning' | 'error'; color: string; bgColor: string; icon: typeof Clock }> = {
  PROPOSED: { label: 'Awaiting Response', variant: 'warning', color: 'text-warning-600', bgColor: 'bg-warning-100', icon: Clock },
  PENDING: { label: 'Pending', variant: 'warning', color: 'text-warning-600', bgColor: 'bg-warning-100', icon: Clock },
  CONFIRMED: { label: 'Confirmed', variant: 'success', color: 'text-success-600', bgColor: 'bg-success-100', icon: CheckCircle },
  RESCHEDULED: { label: 'Rescheduled', variant: 'warning', color: 'text-warning-600', bgColor: 'bg-warning-100', icon: Calendar },
  CANCELLED: { label: 'Cancelled', variant: 'error', color: 'text-error-600', bgColor: 'bg-error-100', icon: AlertCircle },
  COMPLETED: { label: 'Completed', variant: 'default', color: 'text-stone-600', bgColor: 'bg-stone-100', icon: CheckCircle },
  NO_SHOW: { label: 'No Show', variant: 'default', color: 'text-stone-600', bgColor: 'bg-stone-100', icon: AlertCircle },
}
const FALLBACK_STATUS = { label: 'Unknown', variant: 'default' as const, color: 'text-stone-600', bgColor: 'bg-stone-100', icon: Clock }

const platformIcons = {
  ZOOM: Video,
  GOOGLE_MEET: Video,
  MICROSOFT_TEAMS: Video,
  IN_PERSON: MapPin,
  OTHER: Video,
}

export function MeetingList() {
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const { data, isLoading } = useMeetingList()

  // Use sample data
  const meetings = data?.meetings || SAMPLE_MEETINGS

  const filteredMeetings = meetings.filter(
    (m) => statusFilter === 'all' || m.status === statusFilter
  )

  // Categorisation: upcoming = future scheduled time AND still active.
  // past = scheduled in the past OR resolved (COMPLETED / CANCELLED).
  // Meetings with no scheduledAt yet (e.g. a fresh PROPOSED without a time)
  // surface in upcoming so the user notices them.
  const now = new Date()
  const upcomingMeetings = filteredMeetings.filter((m) => {
    if (m.status === 'CANCELLED' || m.status === 'COMPLETED') return false
    if (!m.scheduledAt) return true
    const when = new Date(m.scheduledAt)
    return !Number.isNaN(when.getTime()) && when >= now
  })
  const pastMeetings = filteredMeetings.filter((m) => {
    if (m.status === 'COMPLETED' || m.status === 'CANCELLED') return true
    if (!m.scheduledAt) return false
    const when = new Date(m.scheduledAt)
    return !Number.isNaN(when.getTime()) && when < now
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" label="Loading meetings..." />
      </div>
    )
  }

  return (
    <div className="space-y-3 lg:space-y-4">
      {/* Compact hero: title + stats + actions all in one band */}
      <div className="relative bg-gradient-to-br from-primary-800 via-primary-900 to-primary-950 rounded-xl p-3 sm:p-4 text-white overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary-500/10 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />

        <div className="relative flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 bg-white/10 backdrop-blur rounded-lg flex items-center justify-center flex-shrink-0">
              <CalendarCheck className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold leading-tight">Meetings</h1>
              <p className="text-primary-200 text-xs">Schedule and manage supervisor meetings</p>
            </div>
          </div>
          <div className="flex gap-1.5 flex-shrink-0">
            <Link to={ROUTES.STUDENT.MEETING_LOGS}>
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<ClipboardList className="h-3.5 w-3.5" />}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 whitespace-nowrap"
              >
                Logs
              </Button>
            </Link>
            <Link to={ROUTES.STUDENT.MEETING_EXPORT}>
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<Download className="h-3.5 w-3.5" />}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 whitespace-nowrap"
              >
                Export
              </Button>
            </Link>
            <Link to={ROUTES.STUDENT.MEETING_NEW}>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Plus className="h-3.5 w-3.5" />}
                className="bg-white text-primary-900 hover:bg-primary-50 border-0 shadow whitespace-nowrap"
              >
                Request
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats inline */}
        <div className="relative mt-3 grid grid-cols-4 gap-2 text-center">
          <div className={cn('rounded-md px-2 py-1.5', upcomingMeetings.length > 0 ? 'bg-info-500/30 ring-1 ring-info-300/50' : 'bg-white/10')}>
            <div className="text-lg font-bold leading-none">{upcomingMeetings.length}</div>
            <p className="text-[10px] text-primary-200 mt-0.5 uppercase tracking-wide">Upcoming</p>
          </div>
          <div className="bg-white/10 rounded-md px-2 py-1.5">
            <div className="text-lg font-bold leading-none">{meetings.filter((m) => m.status === 'CONFIRMED').length}</div>
            <p className="text-[10px] text-primary-200 mt-0.5 uppercase tracking-wide">Confirmed</p>
          </div>
          <div className="bg-white/10 rounded-md px-2 py-1.5">
            <div className="text-lg font-bold leading-none">{meetings.filter((m) => m.status === 'PENDING').length}</div>
            <p className="text-[10px] text-primary-200 mt-0.5 uppercase tracking-wide">Pending</p>
          </div>
          <div className="bg-white/10 rounded-md px-2 py-1.5">
            <div className="text-lg font-bold leading-none">{meetings.length}</div>
            <p className="text-[10px] text-primary-200 mt-0.5 uppercase tracking-wide">Total</p>
          </div>
        </div>
      </div>

      {/* Filters — single compact row */}
      <Card padding="sm">
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="h-4 w-4 text-stone-500 flex-shrink-0" />
          <span className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider">Filter</span>
          <div className="flex flex-wrap gap-1">
            {['all', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={cn(
                  'px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap',
                  statusFilter === status
                    ? 'bg-primary-500 text-white'
                    : 'bg-neutral-100 text-stone-600 hover:bg-neutral-200'
                )}
              >
                {status === 'all' ? 'All' : statusConfig[status as MeetingStatus]?.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Upcoming Meetings */}
      {upcomingMeetings.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-4 w-4 text-info-600" />
            <h2 className="text-sm font-bold text-stone-800 uppercase tracking-wide">Upcoming Meetings</h2>
            <span className="px-1.5 py-0 bg-info-100 text-info-700 text-[10px] font-semibold rounded-full">
              {upcomingMeetings.length}
            </span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
            {upcomingMeetings.map((meeting) => (
              <MeetingCard key={meeting.meetingId} meeting={meeting} />
            ))}
          </div>
        </div>
      )}

      {/* Past Meetings */}
      {pastMeetings.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-stone-500" />
            <h2 className="text-sm font-bold text-stone-800 uppercase tracking-wide">Past Meetings</h2>
            <span className="px-1.5 py-0 bg-stone-100 text-stone-600 text-[10px] font-semibold rounded-full">
              {pastMeetings.length}
            </span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
            {pastMeetings.map((meeting) => (
              <MeetingCard key={meeting.meetingId} meeting={meeting} />
            ))}
          </div>
        </div>
      )}

      {filteredMeetings.length === 0 && (
        <Card className="text-center py-8">
          <Calendar className="h-10 w-10 text-stone-300 mx-auto mb-2" />
          <h3 className="font-medium text-stone-800 mb-1">No meetings found</h3>
          <p className="text-sm text-stone-500 mb-3">
            {statusFilter === 'all'
              ? 'Schedule your first meeting with your supervisor'
              : 'No meetings match the selected filter'}
          </p>
          <Link to={ROUTES.STUDENT.MEETING_NEW}>
            <Button variant="primary" size="sm">
              Request Meeting
            </Button>
          </Link>
        </Card>
      )}
    </div>
  )
}

function MeetingCard({ meeting }: { meeting: Meeting }) {
  const config = statusConfig[meeting.status] ?? FALLBACK_STATUS
  const StatusIcon = config.icon
  const PlatformIcon = platformIcons[meeting.platform]
  const isUpcoming = new Date(meeting.scheduledAt) >= new Date()
  const meetingDate = new Date(meeting.scheduledAt)
  const isPendingLike = meeting.status === 'PENDING' || meeting.status === 'PROPOSED'

  return (
    <Link to={ROUTES.STUDENT.MEETING_DETAIL.replace(':id', meeting.meetingId)}>
      <Card
        padding="sm"
        className={cn(
          'transition-all hover:shadow-md group',
          isUpcoming && meeting.status === 'CONFIRMED' && 'border-l-4 border-l-success-500',
          isUpcoming && isPendingLike && 'border-l-4 border-l-warning-500',
          meeting.status === 'CANCELLED' && 'border-l-4 border-l-error-500 opacity-70',
          meeting.status === 'COMPLETED' && 'border-l-4 border-l-stone-300',
          !isUpcoming && meeting.status !== 'COMPLETED' && meeting.status !== 'CANCELLED' && 'border-l-4 border-l-stone-300'
        )}
      >
        <div className="flex items-start gap-2.5">
          {/* Date Box — compact */}
          <div className="w-12 bg-gradient-to-br from-primary-800 to-primary-900 rounded-md p-1.5 text-center shadow flex-shrink-0">
            <p className="text-[8px] text-primary-300 font-semibold uppercase leading-none tracking-wider">
              {meetingDate.toLocaleDateString('en-MY', { month: 'short' })}
            </p>
            <p className="text-xl font-bold text-white leading-tight mt-0.5">
              {meetingDate.getDate()}
            </p>
            <p className="text-[8px] text-primary-200 font-semibold leading-none">
              {meetingDate.toLocaleDateString('en-MY', { weekday: 'short' })}
            </p>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-sm text-stone-800 group-hover:text-primary-700 transition-colors leading-tight truncate">
                  {meeting.title}
                </h3>
                <p className="text-[11px] text-stone-500 inline-flex items-center gap-0.5 mt-0.5 truncate">
                  <User className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{meeting.supervisor.fullName}</span>
                </p>
              </div>
              <div className={cn(
                'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md font-semibold text-[11px] flex-shrink-0',
                config.bgColor,
                config.color
              )}>
                <StatusIcon className="h-3 w-3" />
                {config.label}
              </div>
            </div>

            <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px]">
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-stone-100 rounded-md text-stone-600 font-medium">
                <Clock className="h-3 w-3" />
                {meetingDate.toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' })}
                <span className="text-stone-400">·</span>
                {meeting.duration}m
              </span>
              <span className={cn(
                'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md font-medium truncate max-w-[200px]',
                meeting.platform === 'IN_PERSON'
                  ? 'bg-success-100 text-success-700'
                  : 'bg-info-100 text-info-700'
              )}>
                <PlatformIcon className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">
                  {meeting.platform === 'IN_PERSON' ? meeting.location : meeting.platform.replace('_', ' ')}
                </span>
              </span>
            </div>

            {meeting.agenda && (
              <p className="mt-1.5 text-[11px] text-stone-600 line-clamp-1 leading-snug">
                <span className="font-semibold text-stone-500">Agenda:</span> {meeting.agenda}
              </p>
            )}

            {meeting.notes && meeting.status === 'COMPLETED' && (
              <p className="mt-1 text-[11px] text-stone-500 line-clamp-1 leading-snug">
                <span className="font-semibold">Notes:</span> {meeting.notes}
              </p>
            )}
          </div>

          <ArrowRight className="h-4 w-4 text-stone-300 group-hover:text-primary-600 transition-colors flex-shrink-0 mt-0.5" />
        </div>
      </Card>
    </Link>
  )
}
