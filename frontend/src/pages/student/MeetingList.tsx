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

const statusConfig: Record<MeetingStatus, { label: string; variant: 'default' | 'success' | 'warning' | 'error' }> = {
  PENDING: { label: 'Pending', variant: 'warning' },
  CONFIRMED: { label: 'Confirmed', variant: 'success' },
  RESCHEDULED: { label: 'Rescheduled', variant: 'warning' },
  CANCELLED: { label: 'Cancelled', variant: 'error' },
  COMPLETED: { label: 'Completed', variant: 'default' },
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Meetings</h1>
          <p className="text-neutral-600 mt-1">Schedule and manage meetings with your supervisor</p>
        </div>
        <div className="flex gap-2">
          <Link to={ROUTES.STUDENT.MEETING_EXPORT}>
            <Button variant="secondary" leftIcon={<Download className="h-4 w-4" />}>
              Export
            </Button>
          </Link>
          <Link to={ROUTES.STUDENT.MEETING_NEW}>
            <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />}>
              Request Meeting
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-neutral-500" />
            <span className="text-sm font-medium text-neutral-700">Filter:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {['all', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                  statusFilter === status
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                )}
              >
                {status === 'all' ? 'All' : statusConfig[status as MeetingStatus]?.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="text-center">
          <div className="text-2xl font-bold text-primary-600">{upcomingMeetings.length}</div>
          <p className="text-sm text-neutral-600">Upcoming</p>
        </Card>
        <Card className="text-center">
          <div className="text-2xl font-bold text-success-600">
            {meetings.filter((m) => m.status === 'CONFIRMED').length}
          </div>
          <p className="text-sm text-neutral-600">Confirmed</p>
        </Card>
        <Card className="text-center">
          <div className="text-2xl font-bold text-warning-600">
            {meetings.filter((m) => m.status === 'PENDING').length}
          </div>
          <p className="text-sm text-neutral-600">Pending</p>
        </Card>
        <Card className="text-center">
          <div className="text-2xl font-bold text-neutral-600">{meetings.length}</div>
          <p className="text-sm text-neutral-600">Total</p>
        </Card>
      </div>

      {/* Upcoming Meetings */}
      {upcomingMeetings.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Upcoming Meetings</h2>
          <div className="space-y-3">
            {upcomingMeetings.map((meeting) => (
              <MeetingCard key={meeting.meetingId} meeting={meeting} />
            ))}
          </div>
        </div>
      )}

      {/* Past Meetings */}
      {pastMeetings.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Past Meetings</h2>
          <div className="space-y-3">
            {pastMeetings.map((meeting) => (
              <MeetingCard key={meeting.meetingId} meeting={meeting} />
            ))}
          </div>
        </div>
      )}

      {filteredMeetings.length === 0 && (
        <Card className="text-center py-12">
          <Calendar className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-neutral-900 mb-2">No meetings found</h3>
          <p className="text-neutral-500 mb-4">
            {statusFilter === 'all'
              ? 'Schedule your first meeting with your supervisor'
              : 'No meetings match the selected filter'}
          </p>
          <Link to={ROUTES.STUDENT.MEETING_NEW}>
            <Button variant="primary">Request Meeting</Button>
          </Link>
        </Card>
      )}
    </div>
  )
}

function MeetingCard({ meeting }: { meeting: Meeting }) {
  const config = statusConfig[meeting.status]
  const PlatformIcon = platformIcons[meeting.platform]
  const isUpcoming = new Date(meeting.scheduledAt) >= new Date()

  return (
    <Link to={ROUTES.STUDENT.MEETING_DETAIL.replace(':id', meeting.meetingId)}>
      <Card hover className={cn('transition-all', isUpcoming && meeting.status === 'CONFIRMED' && 'border-l-4 border-l-success-500')}>
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Date Box */}
          <div className="flex-shrink-0 w-16 text-center">
            <div className="bg-primary-100 rounded-lg p-2">
              <p className="text-xs text-primary-600 font-medium">
                {new Date(meeting.scheduledAt).toLocaleDateString('en-MY', { month: 'short' })}
              </p>
              <p className="text-2xl font-bold text-primary-700">
                {new Date(meeting.scheduledAt).getDate()}
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-neutral-900">{meeting.title}</h3>
                <p className="text-sm text-neutral-600">with {meeting.supervisor.fullName}</p>
              </div>
              <Badge variant={config.variant} size="sm">{config.label}</Badge>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-neutral-500">
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {new Date(meeting.scheduledAt).toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' })}
                {' • '}{meeting.duration} min
              </span>
              <span className="flex items-center gap-1">
                <PlatformIcon className="h-4 w-4" />
                {meeting.platform === 'IN_PERSON' ? meeting.location : meeting.platform.replace('_', ' ')}
              </span>
            </div>

            {meeting.agenda && (
              <p className="mt-2 text-sm text-neutral-600 line-clamp-1">{meeting.agenda}</p>
            )}
          </div>
        </div>
      </Card>
    </Link>
  )
}
