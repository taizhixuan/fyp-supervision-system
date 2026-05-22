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
  Users,
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
  PENDING: { label: 'Pending', variant: 'warning', color: 'text-warning-600', bgColor: 'bg-warning-100', icon: Clock },
  CONFIRMED: { label: 'Confirmed', variant: 'success', color: 'text-success-600', bgColor: 'bg-success-100', icon: CheckCircle },
  RESCHEDULED: { label: 'Rescheduled', variant: 'warning', color: 'text-warning-600', bgColor: 'bg-warning-100', icon: Calendar },
  CANCELLED: { label: 'Cancelled', variant: 'error', color: 'text-error-600', bgColor: 'bg-error-100', icon: AlertCircle },
  COMPLETED: { label: 'Completed', variant: 'default', color: 'text-stone-600', bgColor: 'bg-stone-100', icon: CheckCircle },
}

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

  const upcomingMeetings = filteredMeetings.filter(
    (m) => new Date(m.scheduledAt) >= new Date() && m.status !== 'CANCELLED'
  )

  const pastMeetings = filteredMeetings.filter(
    (m) => new Date(m.scheduledAt) < new Date() || m.status === 'COMPLETED'
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" label="Loading meetings..." />
      </div>
    )
  }

  return (
    <div className="space-y-4 lg:space-y-5">
      {/* Header with Gradient */}
      <div className="relative bg-gradient-to-br from-primary-800 via-primary-900 to-primary-950 rounded-2xl p-6 text-white overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary-500/5 rounded-full translate-y-1/2 -translate-x-1/2" />

        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/10 backdrop-blur rounded-xl flex items-center justify-center shadow-lg">
              <CalendarCheck className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Meetings</h1>
              <p className="text-primary-200 mt-0.5">Schedule and manage supervisor meetings</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link to={ROUTES.STUDENT.MEETING_EXPORT}>
              <Button
                variant="secondary"
                leftIcon={<Download className="h-4 w-4" />}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                Export
              </Button>
            </Link>
            <Link to={ROUTES.STUDENT.MEETING_NEW}>
              <Button
                variant="primary"
                leftIcon={<Plus className="h-4 w-4" />}
                className="bg-white text-primary-900 hover:bg-primary-50 border-0 shadow-lg"
              >
                Request Meeting
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="relative overflow-hidden border-l-4 border-l-info-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-info-100 rounded-lg flex items-center justify-center">
              <Calendar className="h-5 w-5 text-info-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-info-600">{upcomingMeetings.length}</div>
              <p className="text-sm text-neutral-600">Upcoming</p>
            </div>
          </div>
        </Card>
        <Card className="relative overflow-hidden border-l-4 border-l-success-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-success-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-success-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-success-600">
                {meetings.filter((m) => m.status === 'CONFIRMED').length}
              </div>
              <p className="text-sm text-neutral-600">Confirmed</p>
            </div>
          </div>
        </Card>
        <Card className="relative overflow-hidden border-l-4 border-l-warning-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-warning-100 rounded-lg flex items-center justify-center">
              <Clock className="h-5 w-5 text-warning-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-warning-600">
                {meetings.filter((m) => m.status === 'PENDING').length}
              </div>
              <p className="text-sm text-neutral-600">Pending</p>
            </div>
          </div>
        </Card>
        <Card className="relative overflow-hidden border-l-4 border-l-stone-400">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-stone-100 rounded-lg flex items-center justify-center">
              <Users className="h-5 w-5 text-stone-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-stone-600">{meetings.length}</div>
              <p className="text-sm text-neutral-600">Total</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-gradient-to-r from-primary-50 to-primary-100 border-primary-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
              <ClipboardList className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <h3 className="font-semibold text-primary-900">Supervision Logs</h3>
              <p className="text-sm text-primary-600">Record and manage your meeting logs in MMU FCI format</p>
            </div>
          </div>
          <Link to={ROUTES.STUDENT.MEETING_LOGS}>
            <Button
              variant="primary"
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              View Logs
            </Button>
          </Link>
        </div>
      </Card>

      {/* Filters */}
      <Card className="bg-gradient-to-r from-stone-50 to-neutral-50 border-stone-200">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-stone-200 rounded-lg flex items-center justify-center">
              <Filter className="h-4 w-4 text-stone-600" />
            </div>
            <span className="text-sm font-semibold text-stone-700">Filter:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {['all', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={cn(
                  'px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200',
                  statusFilter === status
                    ? 'bg-primary-500 text-white shadow-md shadow-primary-500/25'
                    : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
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
        <div className="mt-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-info-100 rounded-lg flex items-center justify-center">
              <Calendar className="h-4 w-4 text-info-600" />
            </div>
            <h2 className="text-lg font-bold text-stone-800">Upcoming Meetings</h2>
            <span className="px-2.5 py-0.5 bg-info-100 text-info-700 text-sm font-semibold rounded-full">
              {upcomingMeetings.length}
            </span>
          </div>
          <div className="flex flex-col gap-5">
            {upcomingMeetings.map((meeting) => (
              <MeetingCard key={meeting.meetingId} meeting={meeting} />
            ))}
          </div>
        </div>
      )}

      {/* Past Meetings */}
      {pastMeetings.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-stone-100 rounded-lg flex items-center justify-center">
              <Clock className="h-4 w-4 text-stone-500" />
            </div>
            <h2 className="text-lg font-bold text-stone-800">Past Meetings</h2>
            <span className="px-2.5 py-0.5 bg-stone-100 text-stone-600 text-sm font-semibold rounded-full">
              {pastMeetings.length}
            </span>
          </div>
          <div className="flex flex-col gap-5">
            {pastMeetings.map((meeting) => (
              <MeetingCard key={meeting.meetingId} meeting={meeting} />
            ))}
          </div>
        </div>
      )}

      {filteredMeetings.length === 0 && (
        <Card className="text-center py-16 bg-gradient-to-br from-stone-50 to-neutral-50">
          <div className="w-16 h-16 bg-stone-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Calendar className="h-8 w-8 text-stone-400" />
          </div>
          <h3 className="text-lg font-semibold text-stone-800 mb-2">No meetings found</h3>
          <p className="text-stone-500 mb-6">
            {statusFilter === 'all'
              ? 'Schedule your first meeting with your supervisor'
              : 'No meetings match the selected filter'}
          </p>
          <Link to={ROUTES.STUDENT.MEETING_NEW}>
            <Button variant="primary">
              Request Meeting
            </Button>
          </Link>
        </Card>
      )}
    </div>
  )
}

function MeetingCard({ meeting }: { meeting: Meeting }) {
  const config = statusConfig[meeting.status]
  const StatusIcon = config.icon
  const PlatformIcon = platformIcons[meeting.platform]
  const isUpcoming = new Date(meeting.scheduledAt) >= new Date()
  const meetingDate = new Date(meeting.scheduledAt)

  return (
    <Link to={ROUTES.STUDENT.MEETING_DETAIL.replace(':id', meeting.meetingId)}>
      <Card className={cn(
        'transition-all duration-200 hover:shadow-lg group p-5',
        isUpcoming && meeting.status === 'CONFIRMED' && 'border-l-4 border-l-success-500',
        isUpcoming && meeting.status === 'PENDING' && 'border-l-4 border-l-warning-500',
        meeting.status === 'CANCELLED' && 'border-l-4 border-l-error-500 opacity-70',
        meeting.status === 'COMPLETED' && 'border-l-4 border-l-stone-300',
        !isUpcoming && meeting.status !== 'COMPLETED' && meeting.status !== 'CANCELLED' && 'border-l-4 border-l-stone-300'
      )}>
        <div className="flex flex-col sm:flex-row gap-5">
          {/* Date Box */}
          <div className="flex-shrink-0">
            <div className="w-20 bg-gradient-to-br from-primary-800 to-primary-900 rounded-xl p-3 text-center shadow-lg group-hover:scale-105 transition-transform">
              <p className="text-[10px] text-primary-300 font-semibold uppercase tracking-wider">
                {meetingDate.toLocaleDateString('en-MY', { month: 'short' })}
              </p>
              <p className="text-3xl font-bold text-white">
                {meetingDate.getDate()}
              </p>
              <p className="text-[10px] text-primary-200 font-semibold">
                {meetingDate.toLocaleDateString('en-MY', { weekday: 'short' })}
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-bold text-stone-800 group-hover:text-primary-700 transition-colors">
                  {meeting.title}
                </h3>
                <p className="text-sm text-stone-500 flex items-center gap-1.5 mt-0.5">
                  <User className="h-3.5 w-3.5" />
                  with {meeting.supervisor.fullName}
                </p>
              </div>
              <div className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold text-sm',
                config.bgColor,
                config.color
              )}>
                <StatusIcon className="h-4 w-4" />
                {config.label}
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 rounded-lg text-sm text-stone-600 font-medium">
                <Clock className="h-4 w-4" />
                {meetingDate.toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' })}
                <span className="text-stone-400 mx-1">•</span>
                {meeting.duration} min
              </span>
              <span className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium',
                meeting.platform === 'IN_PERSON'
                  ? 'bg-success-100 text-success-700'
                  : 'bg-info-100 text-info-700'
              )}>
                <PlatformIcon className="h-4 w-4" />
                {meeting.platform === 'IN_PERSON' ? meeting.location : meeting.platform.replace('_', ' ')}
              </span>
            </div>

            {meeting.agenda && (
              <p className="mt-3 text-sm text-stone-600 line-clamp-1 bg-stone-50 rounded-lg p-3 border border-stone-100">
                {meeting.agenda}
              </p>
            )}

            {meeting.notes && meeting.status === 'COMPLETED' && (
              <p className="mt-3 text-sm text-stone-500 line-clamp-1 bg-stone-50 rounded-lg p-3 border border-stone-100">
                <span className="font-semibold">Notes:</span> {meeting.notes}
              </p>
            )}
          </div>

          {/* Arrow */}
          <div className="hidden sm:flex items-center">
            <div className="w-10 h-10 rounded-xl bg-stone-100 group-hover:bg-primary-100 flex items-center justify-center transition-colors">
              <ArrowRight className="h-5 w-5 text-stone-400 group-hover:text-primary-600 transition-colors" />
            </div>
          </div>
        </div>
      </Card>
    </Link>
  )
}
