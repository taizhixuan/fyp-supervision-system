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
  Sparkles,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import { useSupervisorMeetings } from '@/lib/hooks/useSupervisor'
import { ROUTES } from '@/lib/constants/routes'
import { cn } from '@/lib/utils/cn'
import type { MeetingStatus, MeetingType } from '@/types'

const statusConfig: Record<MeetingStatus, { label: string; color: string; bgColor: string; borderColor: string; icon: typeof Clock }> = {
  PENDING: { label: 'Pending', color: 'text-amber-600', bgColor: 'bg-amber-100', borderColor: 'border-l-amber-500', icon: Clock },
  CONFIRMED: { label: 'Confirmed', color: 'text-emerald-600', bgColor: 'bg-emerald-100', borderColor: 'border-l-emerald-500', icon: CheckCircle },
  COMPLETED: { label: 'Completed', color: 'text-sky-600', bgColor: 'bg-sky-100', borderColor: 'border-l-sky-500', icon: CheckCircle },
  CANCELLED: { label: 'Cancelled', color: 'text-rose-600', bgColor: 'bg-rose-100', borderColor: 'border-l-rose-500', icon: XCircle },
  RESCHEDULED: { label: 'Rescheduled', color: 'text-violet-600', bgColor: 'bg-violet-100', borderColor: 'border-l-violet-500', icon: AlertCircle },
  NO_SHOW: { label: 'No Show', color: 'text-stone-600', bgColor: 'bg-stone-100', borderColor: 'border-l-stone-400', icon: AlertCircle },
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
    <div className="space-y-4 lg:space-y-5">
      {/* Header - Gradient Style */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-stone-800 via-stone-800 to-stone-900 p-6 text-white shadow-xl">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-stone-600/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-14 h-14 bg-amber-500/20 rounded-xl flex items-center justify-center ring-1 ring-amber-500/30">
              <Calendar className="h-7 w-7 text-amber-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Meeting Management</h1>
              <p className="text-stone-300 mt-1">Schedule and manage meetings with your supervisees</p>
            </div>
          </div>
          <Link to={ROUTES.SUPERVISOR.MEETING_NEW}>
            <Button className="bg-amber-500 hover:bg-amber-600 text-stone-900 font-semibold shadow-lg">
              <Plus className="h-4 w-4 mr-2" />
              Schedule Meeting
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="group p-4 hover:shadow-lg transition-all duration-300 border-l-4 border-l-amber-500 hover:scale-[1.02]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-100 rounded-xl group-hover:scale-110 transition-transform">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-stone-800">{pendingMeetings?.length ?? 0}</p>
              <p className="text-xs text-stone-500 font-medium">Pending Approval</p>
            </div>
          </div>
          {(pendingMeetings?.length ?? 0) > 0 && (
            <div className="mt-2 flex items-center gap-1 text-xs text-amber-600 font-medium">
              <Sparkles className="h-3 w-3" />
              <span>Needs attention</span>
            </div>
          )}
        </Card>
        <Card className="group p-4 hover:shadow-lg transition-all duration-300 border-l-4 border-l-emerald-500 hover:scale-[1.02]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-100 rounded-xl group-hover:scale-110 transition-transform">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-stone-800">{upcomingMeetings?.length ?? 0}</p>
              <p className="text-xs text-stone-500 font-medium">Upcoming</p>
            </div>
          </div>
        </Card>
        <Card className="group p-4 hover:shadow-lg transition-all duration-300 border-l-4 border-l-sky-500 hover:scale-[1.02]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-sky-100 rounded-xl group-hover:scale-110 transition-transform">
              <Calendar className="h-5 w-5 text-sky-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-stone-800">
                {data?.meetings.filter((m) => m.status === 'COMPLETED').length ?? 0}
              </p>
              <p className="text-xs text-stone-500 font-medium">Completed</p>
            </div>
          </div>
        </Card>
        <Card className="group p-4 hover:shadow-lg transition-all duration-300 border-l-4 border-l-stone-500 hover:scale-[1.02]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-stone-100 rounded-xl group-hover:scale-110 transition-transform">
              <Users className="h-5 w-5 text-stone-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-stone-800">{data?.total ?? 0}</p>
              <p className="text-xs text-stone-500 font-medium">Total Meetings</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 p-4 bg-gradient-to-r from-stone-100 to-stone-50 rounded-xl">
        {/* Status Tabs */}
        <div className="flex items-center gap-1 p-1 bg-white rounded-lg shadow-sm">
          {filterOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setStatusFilter(option.value)}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-lg transition-all',
                statusFilter === option.value
                  ? 'bg-stone-800 text-white shadow-sm'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <Input
            type="text"
            placeholder="Search by student or title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 border-stone-200 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* Meeting List */}
      <div className="flex flex-col gap-4">
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
                  'group p-5 hover:shadow-lg transition-all duration-300 cursor-pointer border-l-4',
                  status.borderColor,
                  'hover:scale-[1.01]'
                )}>
                  <div className="flex items-start gap-4">
                    {/* Date Badge */}
                    <div className="w-16 h-16 bg-gradient-to-br from-stone-800 to-stone-900 rounded-xl flex flex-col items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-105 transition-transform">
                      <span className="text-xs text-amber-400 font-medium uppercase tracking-wider">
                        {new Date(meetingDate).toLocaleDateString('en-MY', { month: 'short' })}
                      </span>
                      <span className="text-2xl font-bold text-white">
                        {new Date(meetingDate).getDate()}
                      </span>
                    </div>

                    {/* Meeting Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-bold text-stone-800 group-hover:text-amber-700 transition-colors">{meeting.title}</h3>
                          <p className="text-sm text-stone-500">with {meeting.studentName}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold',
                            status.bgColor,
                            status.color
                          )}>
                            <StatusIcon className="h-3.5 w-3.5" />
                            {status.label}
                          </span>
                          <ChevronRight className="h-5 w-5 text-stone-300 group-hover:text-amber-500 group-hover:translate-x-1 transition-all" />
                        </div>
                      </div>

                      {/* Details */}
                      <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-stone-500">
                        <span className="flex items-center gap-1.5 px-2.5 py-1 bg-stone-100 rounded-lg">
                          <Clock className="h-4 w-4 text-stone-400" />
                          {new Date(meetingDate).toLocaleTimeString('en-MY', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                          {' '}({meeting.duration} min)
                        </span>
                        <span className="flex items-center gap-1.5 px-2.5 py-1 bg-stone-100 rounded-lg">
                          <TypeIcon className="h-4 w-4 text-stone-400" />
                          {type.label}
                        </span>
                        {meeting.location && (
                          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-stone-100 rounded-lg">
                            <MapPin className="h-4 w-4 text-stone-400" />
                            {meeting.location}
                          </span>
                        )}
                        <span className="text-xs text-stone-400">
                          Requested by {meeting.requestedBy === 'SUPERVISOR' ? 'you' : 'student'}
                        </span>
                      </div>

                      {/* Agenda Preview */}
                      {meeting.agenda && (
                        <p className="mt-3 text-sm text-stone-600 line-clamp-1 bg-amber-50/50 px-3 py-2 rounded-lg border border-amber-100">
                          <span className="font-medium text-amber-700">Agenda:</span> {meeting.agenda}
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
            <div className="w-16 h-16 mx-auto bg-stone-100 rounded-full flex items-center justify-center mb-4">
              <Calendar className="h-8 w-8 text-stone-400" />
            </div>
            <h3 className="text-lg font-semibold text-stone-800">No meetings found</h3>
            <p className="text-stone-500 mt-1">
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'No meetings scheduled yet'}
            </p>
            <Link to={ROUTES.SUPERVISOR.MEETING_NEW}>
              <Button className="mt-4 bg-amber-500 hover:bg-amber-600 text-stone-900 font-semibold">
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
