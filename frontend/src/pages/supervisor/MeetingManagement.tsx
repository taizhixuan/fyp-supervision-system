import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Calendar,
  Search,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronRight,
  MapPin,
  Video,
  Users,
  Filter,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import { useSupervisorMeetings } from '@/lib/hooks/useSupervisor'
import { ROUTES } from '@/lib/constants/routes'
import { cn } from '@/lib/utils/cn'
import type { MeetingStatus, MeetingType } from '@/types'

const statusConfig: Record<MeetingStatus, { label: string; color: string; bgColor: string; icon: typeof Clock }> = {
  PENDING: { label: 'Pending', color: 'text-warning-600', bgColor: 'bg-warning-50', icon: Clock },
  CONFIRMED: { label: 'Confirmed', color: 'text-success-600', bgColor: 'bg-success-50', icon: CheckCircle },
  COMPLETED: { label: 'Completed', color: 'text-primary-600', bgColor: 'bg-primary-50', icon: CheckCircle },
  CANCELLED: { label: 'Cancelled', color: 'text-error-600', bgColor: 'bg-error-50', icon: XCircle },
  RESCHEDULED: { label: 'Rescheduled', color: 'text-info-600', bgColor: 'bg-info-50', icon: AlertCircle },
  NO_SHOW: { label: 'No Show', color: 'text-neutral-600', bgColor: 'bg-neutral-100', icon: AlertCircle },
}

const typeConfig: Record<MeetingType, { label: string; icon: typeof MapPin }> = {
  IN_PERSON: { label: 'In Person', icon: MapPin },
  ONLINE: { label: 'Online', icon: Video },
  HYBRID: { label: 'Hybrid', icon: Users },
}

const filterOptions = [
  { value: 'all', label: 'All Meetings' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'COMPLETED', label: 'Completed' },
]

export function MeetingManagement() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')

  const { data, isLoading } = useSupervisorMeetings(statusFilter === 'all' ? undefined : statusFilter)

  const filteredMeetings = data?.meetings.filter((meeting) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      meeting.studentName.toLowerCase().includes(query) ||
      meeting.title.toLowerCase().includes(query)
    )
  })

  const upcomingMeetings = filteredMeetings?.filter(
    (m) => m.status === 'CONFIRMED' && new Date(m.confirmedDateTime!) > new Date()
  )
  const pendingMeetings = filteredMeetings?.filter((m) => m.status === 'PENDING')

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
            <Calendar className="h-7 w-7 text-primary-600" />
            Meeting Management
          </h1>
          <p className="text-neutral-600 mt-1">
            Schedule and manage meetings with your supervisees
          </p>
        </div>
        <Link to={ROUTES.SUPERVISOR.MEETING_NEW}>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Schedule Meeting
          </Button>
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-warning-50 rounded-lg">
              <Clock className="h-5 w-5 text-warning-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900">{pendingMeetings?.length ?? 0}</p>
              <p className="text-xs text-neutral-500">Pending Approval</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-success-50 rounded-lg">
              <CheckCircle className="h-5 w-5 text-success-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900">{upcomingMeetings?.length ?? 0}</p>
              <p className="text-xs text-neutral-500">Upcoming</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-50 rounded-lg">
              <Calendar className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900">
                {data?.meetings.filter((m) => m.status === 'COMPLETED').length ?? 0}
              </p>
              <p className="text-xs text-neutral-500">Completed</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-neutral-100 rounded-lg">
              <Users className="h-5 w-5 text-neutral-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900">{data?.total ?? 0}</p>
              <p className="text-xs text-neutral-500">Total Meetings</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Status Tabs */}
        <div className="flex items-center gap-1 p-1 bg-neutral-100 rounded-lg">
          {filterOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setStatusFilter(option.value)}
              className={cn(
                'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                statusFilter === option.value
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-600 hover:text-neutral-900'
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <Input
            type="text"
            placeholder="Search by student or title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Meeting List */}
      <div className="space-y-4">
        {filteredMeetings && filteredMeetings.length > 0 ? (
          filteredMeetings.map((meeting) => {
            const status = statusConfig[meeting.status]
            const type = typeConfig[meeting.type]
            const StatusIcon = status.icon
            const TypeIcon = type.icon
            const meetingDate = meeting.confirmedDateTime || meeting.proposedDateTime

            return (
              <Link
                key={meeting.meetingId}
                to={ROUTES.SUPERVISOR.MEETING_DETAIL.replace(':id', String(meeting.meetingId))}
              >
                <Card className={cn(
                  'p-4 hover:shadow-md transition-shadow cursor-pointer',
                  meeting.status === 'PENDING' && 'border-l-4 border-l-warning-400'
                )}>
                  <div className="flex items-start gap-4">
                    {/* Date Badge */}
                    <div className="w-14 h-14 bg-primary-50 rounded-lg flex flex-col items-center justify-center flex-shrink-0">
                      <span className="text-xs text-primary-600 font-medium">
                        {new Date(meetingDate).toLocaleDateString('en-MY', { month: 'short' })}
                      </span>
                      <span className="text-xl font-bold text-primary-700">
                        {new Date(meetingDate).getDate()}
                      </span>
                    </div>

                    {/* Meeting Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-semibold text-neutral-900">{meeting.title}</h3>
                          <p className="text-sm text-neutral-500">with {meeting.studentName}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium',
                            status.bgColor,
                            status.color
                          )}>
                            <StatusIcon className="h-3.5 w-3.5" />
                            {status.label}
                          </span>
                          <ChevronRight className="h-5 w-5 text-neutral-400" />
                        </div>
                      </div>

                      {/* Details */}
                      <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-neutral-500">
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {new Date(meetingDate).toLocaleTimeString('en-MY', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                          {' '}({meeting.duration} min)
                        </span>
                        <span className="flex items-center gap-1">
                          <TypeIcon className="h-4 w-4" />
                          {type.label}
                        </span>
                        {meeting.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {meeting.location}
                          </span>
                        )}
                        <span className="text-xs">
                          Requested by {meeting.requestedBy === 'SUPERVISOR' ? 'you' : 'student'}
                        </span>
                      </div>

                      {/* Agenda Preview */}
                      {meeting.agenda && (
                        <p className="mt-2 text-sm text-neutral-600 line-clamp-1">
                          Agenda: {meeting.agenda}
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              </Link>
            )
          })
        ) : (
          <Card className="p-12 text-center">
            <Calendar className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-neutral-900">No meetings found</h3>
            <p className="text-neutral-500 mt-1">
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'No meetings scheduled yet'}
            </p>
            <Link to={ROUTES.SUPERVISOR.MEETING_NEW}>
              <Button className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Schedule a Meeting
              </Button>
            </Link>
          </Card>
        )}
      </div>
    </div>
  )
}
