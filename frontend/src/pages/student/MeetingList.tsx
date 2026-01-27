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
  ChevronLeft,
  ChevronRight,
  CalendarCheck,
  Users,
  CheckCircle,
  AlertCircle,
  User,
  ArrowRight,
} from 'lucide-react'
import { Card, Button, Badge, Spinner, Modal } from '@/components/ui'
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
    platform: 'ZOOM',
    meetingLink: 'https://zoom.us/j/123456789',
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
    platform: 'ZOOM',
    status: 'COMPLETED',
    notes: 'Discussed project scope and timeline',
    createdAt: '2025-01-10',
    updatedAt: '2025-01-15',
  },
]

const statusConfig: Record<MeetingStatus, { label: string; variant: 'default' | 'success' | 'warning' | 'error'; color: string; bgColor: string; icon: typeof Clock }> = {
  PENDING: { label: 'Pending', variant: 'warning', color: 'text-amber-600', bgColor: 'bg-amber-100', icon: Clock },
  CONFIRMED: { label: 'Confirmed', variant: 'success', color: 'text-emerald-600', bgColor: 'bg-emerald-100', icon: CheckCircle },
  RESCHEDULED: { label: 'Rescheduled', variant: 'warning', color: 'text-orange-600', bgColor: 'bg-orange-100', icon: Calendar },
  CANCELLED: { label: 'Cancelled', variant: 'error', color: 'text-rose-600', bgColor: 'bg-rose-100', icon: AlertCircle },
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
    <div className="space-y-6">
      {/* Header with Gradient */}
      <div className="relative bg-gradient-to-br from-stone-800 via-stone-800 to-stone-900 rounded-2xl p-6 text-white overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-amber-500/5 rounded-full translate-y-1/2 -translate-x-1/2" />

        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-amber-500 rounded-xl flex items-center justify-center shadow-lg">
              <CalendarCheck className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Meetings</h1>
              <p className="text-stone-300 mt-0.5">Schedule and manage supervisor meetings</p>
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
                className="bg-amber-500 hover:bg-amber-600 border-0 shadow-lg shadow-amber-500/25"
              >
                Request Meeting
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="relative overflow-hidden border-l-4 border-l-sky-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-sky-100 rounded-lg flex items-center justify-center">
              <Calendar className="h-5 w-5 text-sky-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-sky-600">{upcomingMeetings.length}</div>
              <p className="text-sm text-neutral-600">Upcoming</p>
            </div>
          </div>
        </Card>
        <Card className="relative overflow-hidden border-l-4 border-l-emerald-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-emerald-600">
                {meetings.filter((m) => m.status === 'CONFIRMED').length}
              </div>
              <p className="text-sm text-neutral-600">Confirmed</p>
            </div>
          </div>
        </Card>
        <Card className="relative overflow-hidden border-l-4 border-l-amber-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-amber-600">
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
                    ? 'bg-amber-500 text-white shadow-md shadow-amber-500/25'
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
            <div className="w-8 h-8 bg-sky-100 rounded-lg flex items-center justify-center">
              <Calendar className="h-4 w-4 text-sky-600" />
            </div>
            <h2 className="text-lg font-bold text-stone-800">Upcoming Meetings</h2>
            <span className="px-2.5 py-0.5 bg-sky-100 text-sky-700 text-sm font-semibold rounded-full">
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
            <Button variant="primary" className="bg-amber-500 hover:bg-amber-600 border-0">
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
        isUpcoming && meeting.status === 'CONFIRMED' && 'border-l-4 border-l-emerald-500',
        isUpcoming && meeting.status === 'PENDING' && 'border-l-4 border-l-amber-500',
        meeting.status === 'CANCELLED' && 'border-l-4 border-l-rose-500 opacity-70',
        meeting.status === 'COMPLETED' && 'border-l-4 border-l-stone-300',
        !isUpcoming && meeting.status !== 'COMPLETED' && meeting.status !== 'CANCELLED' && 'border-l-4 border-l-stone-300'
      )}>
        <div className="flex flex-col sm:flex-row gap-5">
          {/* Date Box */}
          <div className="flex-shrink-0">
            <div className="w-20 bg-gradient-to-br from-stone-800 to-stone-900 rounded-xl p-3 text-center shadow-lg group-hover:scale-105 transition-transform">
              <p className="text-[10px] text-stone-400 font-semibold uppercase tracking-wider">
                {meetingDate.toLocaleDateString('en-MY', { month: 'short' })}
              </p>
              <p className="text-3xl font-bold text-white">
                {meetingDate.getDate()}
              </p>
              <p className="text-[10px] text-amber-400 font-semibold">
                {meetingDate.toLocaleDateString('en-MY', { weekday: 'short' })}
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-bold text-stone-800 group-hover:text-amber-700 transition-colors">
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
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-sky-100 text-sky-700'
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
            <div className="w-10 h-10 rounded-xl bg-stone-100 group-hover:bg-amber-100 flex items-center justify-center transition-colors">
              <ArrowRight className="h-5 w-5 text-stone-400 group-hover:text-amber-600 transition-colors" />
            </div>
          </div>
        </div>
      </Card>
    </Link>
  )
}
