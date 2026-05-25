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
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import { useSupervisorMeetings } from '@/lib/hooks/useSupervisor'
import { ROUTES } from '@/lib/constants/routes'
import { cn } from '@/lib/utils/cn'
import type { MeetingStatus, MeetingType } from '@/types'

// Includes PROPOSED (the supervisor-created initial state) and PENDING (legacy/UI alias)
// because the backend MeetingStatus enum emits PROPOSED on POST /supervisor/meetings.
type MeetingStatusEx = MeetingStatus | 'PROPOSED'
const statusConfig: Record<MeetingStatusEx, { label: string; color: string; bgColor: string; borderColor: string; icon: typeof Clock }> = {
  PROPOSED: { label: 'Proposed', color: 'text-amber-600', bgColor: 'bg-amber-100', borderColor: 'border-l-amber-500', icon: Clock },
  PENDING: { label: 'Pending', color: 'text-amber-600', bgColor: 'bg-amber-100', borderColor: 'border-l-amber-500', icon: Clock },
  CONFIRMED: { label: 'Confirmed', color: 'text-emerald-600', bgColor: 'bg-emerald-100', borderColor: 'border-l-emerald-500', icon: CheckCircle },
  COMPLETED: { label: 'Completed', color: 'text-sky-600', bgColor: 'bg-sky-100', borderColor: 'border-l-sky-500', icon: CheckCircle },
  CANCELLED: { label: 'Cancelled', color: 'text-rose-600', bgColor: 'bg-rose-100', borderColor: 'border-l-rose-500', icon: XCircle },
  RESCHEDULED: { label: 'Rescheduled', color: 'text-violet-600', bgColor: 'bg-violet-100', borderColor: 'border-l-violet-500', icon: AlertCircle },
  NO_SHOW: { label: 'No Show', color: 'text-stone-600', bgColor: 'bg-stone-100', borderColor: 'border-l-stone-400', icon: AlertCircle },
}
const FALLBACK_STATUS = { label: 'Unknown', color: 'text-stone-600', bgColor: 'bg-stone-100', borderColor: 'border-l-stone-400', icon: Clock }

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
    <div className="space-y-3 lg:space-y-4">
      {/* Compact Header — title + stats + CTA inline */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-stone-800 via-stone-800 to-stone-900 p-3 sm:p-4 text-white shadow-md">
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

        <div className="relative flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex-shrink-0 w-9 h-9 bg-amber-500/20 rounded-lg flex items-center justify-center ring-1 ring-amber-500/30">
              <Calendar className="h-5 w-5 text-amber-400" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-white leading-tight">Meeting Management</h1>
              <p className="text-stone-300 text-xs">Schedule and manage meetings with your supervisees</p>
            </div>
          </div>
          <Link to={ROUTES.SUPERVISOR.MEETING_NEW}>
            <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-stone-900 font-semibold shadow whitespace-nowrap">
              <Plus className="h-3.5 w-3.5 mr-1" />
              Schedule
            </Button>
          </Link>
        </div>

        {/* Inline stats */}
        <div className="relative mt-3 grid grid-cols-4 gap-1.5 text-center">
          <div className={cn('rounded-md px-2 py-1.5 ring-1', (pendingMeetings?.length ?? 0) > 0 ? 'bg-amber-500/30 ring-amber-300/40' : 'bg-stone-700/40 ring-stone-600/40')}>
            <div className="text-base font-bold leading-none text-amber-300">{pendingMeetings?.length ?? 0}</div>
            <p className="text-[10px] text-stone-300 mt-0.5 uppercase tracking-wide">Pending</p>
          </div>
          <div className="bg-stone-700/40 rounded-md px-2 py-1.5 ring-1 ring-stone-600/40">
            <div className="text-base font-bold leading-none text-emerald-300">{upcomingMeetings?.length ?? 0}</div>
            <p className="text-[10px] text-stone-300 mt-0.5 uppercase tracking-wide">Upcoming</p>
          </div>
          <div className="bg-stone-700/40 rounded-md px-2 py-1.5 ring-1 ring-stone-600/40">
            <div className="text-base font-bold leading-none text-sky-300">
              {data?.meetings.filter((m) => m.status === 'COMPLETED').length ?? 0}
            </div>
            <p className="text-[10px] text-stone-300 mt-0.5 uppercase tracking-wide">Done</p>
          </div>
          <div className="bg-stone-700/40 rounded-md px-2 py-1.5 ring-1 ring-stone-600/40">
            <div className="text-base font-bold leading-none">{data?.total ?? 0}</div>
            <p className="text-[10px] text-stone-300 mt-0.5 uppercase tracking-wide">Total</p>
          </div>
        </div>
      </div>

      {/* Filters — compact */}
      <Card padding="sm">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex items-center gap-0.5 p-0.5 bg-stone-100 rounded-md">
            {filterOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setStatusFilter(option.value)}
                className={cn(
                  'px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap',
                  statusFilter === option.value
                    ? 'bg-stone-800 text-white shadow-sm'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-white'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 pointer-events-none" />
            <Input
              type="text"
              placeholder="Search by student or title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 border-stone-200 focus:ring-amber-500"
            />
          </div>
        </div>
      </Card>

      {/* Meeting List — 2-col grid */}
      {filteredMeetings && filteredMeetings.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
          {filteredMeetings.map((meeting) => {
            const status = statusConfig[meeting.status as MeetingStatusEx] ?? FALLBACK_STATUS
            const type = typeConfig[meeting.type] ?? { label: meeting.type, icon: Calendar }
            const StatusIcon = status.icon
            const TypeIcon = type.icon
            const meetingDate = meeting.confirmedDateTime || meeting.proposedDateTime

            return (
              <Link
                key={meeting.meetingId}
                to={ROUTES.SUPERVISOR.MEETING_DETAIL.replace(':id', String(meeting.meetingId))}
              >
                <Card padding="sm" className={cn(
                  'group hover:shadow-md transition-all cursor-pointer border-l-4',
                  status.borderColor,
                )}>
                  <div className="flex items-start gap-2.5">
                    {/* Date Badge — compact */}
                    <div className="w-12 bg-gradient-to-br from-stone-800 to-stone-900 rounded-md p-1.5 text-center shadow flex-shrink-0">
                      <p className="text-[8px] text-amber-400 font-semibold uppercase leading-none tracking-wider">
                        {new Date(meetingDate).toLocaleDateString('en-MY', { month: 'short' })}
                      </p>
                      <p className="text-xl font-bold text-white leading-tight mt-0.5">
                        {new Date(meetingDate).getDate()}
                      </p>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-sm text-stone-800 group-hover:text-amber-700 leading-tight truncate">{meeting.title}</h3>
                          <p className="text-[11px] text-stone-500 truncate">with {meeting.studentName}</p>
                        </div>
                        <span className={cn(
                          'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-semibold flex-shrink-0',
                          status.bgColor,
                          status.color
                        )}>
                          <StatusIcon className="h-3 w-3" />
                          {status.label}
                        </span>
                      </div>

                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px] text-stone-500">
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0 bg-stone-100 rounded-md">
                          <Clock className="h-3 w-3" />
                          {new Date(meetingDate).toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' })}
                          <span className="text-stone-400 mx-0.5">·</span>
                          {meeting.duration}m
                        </span>
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0 bg-stone-100 rounded-md">
                          <TypeIcon className="h-3 w-3" />
                          {type.label}
                        </span>
                        {meeting.location && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0 bg-stone-100 rounded-md truncate max-w-[120px]">
                            <MapPin className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{meeting.location}</span>
                          </span>
                        )}
                      </div>

                      {meeting.agenda && (
                        <p className="mt-1 text-[11px] text-stone-600 line-clamp-1 leading-snug">
                          <span className="font-medium text-amber-700">Agenda:</span> {meeting.agenda}
                        </p>
                      )}
                    </div>

                    <ChevronRight className="h-4 w-4 text-stone-300 group-hover:text-amber-500 transition-colors flex-shrink-0 mt-0.5" />
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>
      ) : (
        <Card className="text-center py-8">
          <Calendar className="h-10 w-10 text-stone-300 mx-auto mb-2" />
          <h3 className="font-medium text-stone-800 mb-1">No meetings found</h3>
          <p className="text-sm text-stone-500 mb-3">
            {searchQuery || statusFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'No meetings scheduled yet'}
          </p>
          <Link to={ROUTES.SUPERVISOR.MEETING_NEW}>
            <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-stone-900 font-semibold">
              <Plus className="h-3.5 w-3.5 mr-1" />
              Schedule a Meeting
            </Button>
          </Link>
        </Card>
      )}
    </div>
  )
}
