import { useState } from 'react'
import {
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Bell,
  FileText,
  Users,
  Presentation,
  Filter,
  CalendarDays,
  ListTodo,
  AlertTriangle,
} from 'lucide-react'
import { Card, Badge, Spinner } from '@/components/ui'
import { useDeadlines } from '@/lib/hooks/useStudent'
import { cn } from '@/lib/utils/cn'
import type { Deadline } from '@/types'

// Sample data
const SAMPLE_DEADLINES: Deadline[] = [
  {
    deadlineId: '1',
    title: 'Proposal Submission',
    description: 'Submit final FYP proposal for committee review',
    dueDate: '2025-02-15T23:59:00Z',
    type: 'PROPOSAL',
    priority: 'HIGH',
    isCompleted: false,
    reminderSent: true,
    createdAt: '2024-09-01T00:00:00Z',
  },
  {
    deadlineId: '2',
    title: 'Weekly Log Submission',
    description: 'Submit supervision log for Week 5',
    dueDate: '2025-02-01T23:59:00Z',
    type: 'LOG',
    priority: 'MEDIUM',
    isCompleted: true,
    reminderSent: true,
    createdAt: '2024-09-01T00:00:00Z',
  },
  {
    deadlineId: '3',
    title: 'Mid-Semester Presentation',
    description: 'Present FYP progress to supervisor and committee',
    dueDate: '2025-03-15T14:00:00Z',
    type: 'PRESENTATION',
    priority: 'HIGH',
    isCompleted: false,
    reminderSent: false,
    createdAt: '2024-09-01T00:00:00Z',
  },
  {
    deadlineId: '4',
    title: 'Literature Review Draft',
    description: 'Submit draft of literature review chapter',
    dueDate: '2025-02-28T23:59:00Z',
    type: 'REPORT',
    priority: 'MEDIUM',
    isCompleted: false,
    reminderSent: false,
    createdAt: '2024-09-01T00:00:00Z',
  },
  {
    deadlineId: '5',
    title: 'Supervisor Meeting',
    description: 'Monthly progress meeting with Dr. Sarah Lee',
    dueDate: '2025-02-10T10:00:00Z',
    type: 'MEETING',
    priority: 'MEDIUM',
    isCompleted: false,
    reminderSent: true,
    createdAt: '2024-09-01T00:00:00Z',
  },
  {
    deadlineId: '6',
    title: 'Final Report Submission',
    description: 'Submit complete FYP final report',
    dueDate: '2025-05-31T23:59:00Z',
    type: 'REPORT',
    priority: 'HIGH',
    isCompleted: false,
    reminderSent: false,
    createdAt: '2024-09-01T00:00:00Z',
  },
  {
    deadlineId: '7',
    title: 'Final Presentation',
    description: 'Final FYP presentation and viva',
    dueDate: '2025-06-15T09:00:00Z',
    type: 'PRESENTATION',
    priority: 'HIGH',
    isCompleted: false,
    reminderSent: false,
    createdAt: '2024-09-01T00:00:00Z',
  },
]

type DeadlineType = 'PROPOSAL' | 'REPORT' | 'PRESENTATION' | 'LOG' | 'MEETING' | 'OTHER'

const typeConfig: Record<DeadlineType, { label: string; color: string; icon: typeof FileText }> = {
  PROPOSAL: { label: 'Proposal', color: 'bg-amber-100 text-amber-700', icon: FileText },
  REPORT: { label: 'Report', color: 'bg-sky-100 text-sky-700', icon: FileText },
  PRESENTATION: { label: 'Presentation', color: 'bg-violet-100 text-violet-700', icon: Presentation },
  LOG: { label: 'Log', color: 'bg-emerald-100 text-emerald-700', icon: FileText },
  MEETING: { label: 'Meeting', color: 'bg-rose-100 text-rose-700', icon: Users },
  OTHER: { label: 'Other', color: 'bg-stone-100 text-stone-700', icon: Calendar },
}

const priorityConfig = {
  HIGH: { label: 'High', color: 'bg-error-100 text-error-700' },
  MEDIUM: { label: 'Medium', color: 'bg-warning-100 text-warning-700' },
  LOW: { label: 'Low', color: 'bg-neutral-100 text-neutral-700' },
}

function getDaysUntil(date: string): number {
  const now = new Date()
  const deadline = new Date(date)
  const diff = deadline.getTime() - now.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

function getMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const daysInMonth = lastDay.getDate()
  const startingDay = firstDay.getDay()

  const days = []

  // Previous month days
  for (let i = startingDay - 1; i >= 0; i--) {
    const prevDate = new Date(year, month, -i)
    days.push({ date: prevDate, isCurrentMonth: false })
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({ date: new Date(year, month, i), isCurrentMonth: true })
  }

  // Next month days
  const remaining = 42 - days.length
  for (let i = 1; i <= remaining; i++) {
    days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false })
  }

  return days
}

export function DeadlineCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('list')
  const [typeFilter, setTypeFilter] = useState<string>('all')

  const { data, isLoading } = useDeadlines()

  // Use sample data
  const deadlines = data?.deadlines || SAMPLE_DEADLINES

  const filteredDeadlines = deadlines.filter((d) =>
    typeFilter === 'all' || d.type === typeFilter
  )

  const upcomingDeadlines = filteredDeadlines
    .filter((d) => !d.isCompleted && getDaysUntil(d.dueDate) >= 0)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())

  const pastDeadlines = filteredDeadlines
    .filter((d) => d.isCompleted || getDaysUntil(d.dueDate) < 0)
    .sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime())

  const urgentCount = upcomingDeadlines.filter((d) => getDaysUntil(d.dueDate) <= 7).length

  const monthDays = getMonthDays(currentDate.getFullYear(), currentDate.getMonth())

  const getDeadlinesForDate = (date: Date) => {
    return deadlines.filter((d) => {
      const deadlineDate = new Date(d.dueDate)
      return (
        deadlineDate.getDate() === date.getDate() &&
        deadlineDate.getMonth() === date.getMonth() &&
        deadlineDate.getFullYear() === date.getFullYear()
      )
    })
  }

  const navigateMonth = (direction: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1))
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" label="Loading deadlines..." />
      </div>
    )
  }

  const isCalendar = viewMode === 'calendar'

  return (
    <div className="space-y-3 lg:space-y-4">
      {/* Compact Header — single bar that holds title + stats + filter + view toggle */}
      <div className="relative bg-gradient-to-br from-primary-800 via-primary-900 to-primary-950 rounded-xl p-3 sm:p-4 text-white overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary-500/10 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />

        <div className="relative flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 bg-white/10 backdrop-blur rounded-lg flex items-center justify-center flex-shrink-0">
              <CalendarDays className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold leading-tight">Deadlines & Calendar</h1>
              <p className="text-primary-200 text-xs">Track important dates and submissions</p>
            </div>
          </div>

          {/* Filter + View toggle inline in the hero */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="hidden sm:flex items-center gap-1.5 text-primary-200">
              <Filter className="h-3.5 w-3.5" />
              <span className="text-xs">Type</span>
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-md border border-white/20 bg-white/10 text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-white/30 [&>option]:text-stone-700"
            >
              <option value="all">All Types</option>
              {Object.entries(typeConfig).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>
            <div className="flex bg-white/10 rounded-md p-0.5 gap-0.5">
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-all',
                  viewMode === 'list'
                    ? 'bg-white text-stone-900 shadow-sm'
                    : 'text-primary-100 hover:bg-white/10'
                )}
              >
                <ListTodo className="h-3.5 w-3.5" />
                List
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-all',
                  viewMode === 'calendar'
                    ? 'bg-white text-stone-900 shadow-sm'
                    : 'text-primary-100 hover:bg-white/10'
                )}
              >
                <CalendarDays className="h-3.5 w-3.5" />
                Cal
              </button>
            </div>
          </div>
        </div>

        {/* Inline stats row in hero — only when on Calendar view to save vertical space */}
        <div className="relative mt-3 grid grid-cols-4 gap-2 text-center">
          <div className="bg-white/10 rounded-md px-2 py-1.5">
            <div className="text-lg font-bold leading-none">{upcomingDeadlines.length}</div>
            <p className="text-[10px] text-primary-200 mt-0.5 uppercase tracking-wide">Upcoming</p>
          </div>
          <div className={cn('rounded-md px-2 py-1.5', urgentCount > 0 ? 'bg-error-500/30 ring-1 ring-error-300/50' : 'bg-white/10')}>
            <div className="text-lg font-bold leading-none">{urgentCount}</div>
            <p className="text-[10px] text-primary-200 mt-0.5 uppercase tracking-wide">This Week</p>
          </div>
          <div className="bg-white/10 rounded-md px-2 py-1.5">
            <div className="text-lg font-bold leading-none">{deadlines.filter((d) => d.isCompleted).length}</div>
            <p className="text-[10px] text-primary-200 mt-0.5 uppercase tracking-wide">Completed</p>
          </div>
          <div className="bg-white/10 rounded-md px-2 py-1.5">
            <div className="text-lg font-bold leading-none">{deadlines.length}</div>
            <p className="text-[10px] text-primary-200 mt-0.5 uppercase tracking-wide">Total</p>
          </div>
        </div>
      </div>

      {/* Urgent alert — only render when not the empty case AND when in list view (calendar shows urgency on cells) */}
      {urgentCount > 0 && !isCalendar && (
        <div className="flex items-center gap-3 bg-gradient-to-r from-error-50 to-error-100 border border-error-200 rounded-lg px-3 py-2 shadow-sm">
          <div className="w-8 h-8 bg-error-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="h-4 w-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-error-900">
              {urgentCount} deadline{urgentCount > 1 ? 's' : ''} due within 7 days
            </p>
            <p className="text-xs text-error-700">Make sure to complete your submissions on time</p>
          </div>
        </div>
      )}

      {isCalendar ? (
        /* Calendar View - Compact */
        <Card padding="none" className="overflow-hidden border-0 shadow-md">
          {/* Calendar Header — single tight row */}
          <div className="bg-gradient-to-r from-primary-800 to-primary-900 px-3 py-2.5 flex items-center justify-between gap-2">
            <button
              onClick={() => navigateMonth(-1)}
              className="p-1.5 rounded-md bg-white/10 hover:bg-white/20 text-white transition-colors"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-2 min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-white whitespace-nowrap">
                {currentDate.toLocaleDateString('en-MY', { month: 'long' })}{' '}
                <span className="text-primary-300 font-normal">{currentDate.getFullYear()}</span>
              </h2>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-primary-200 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors flex-shrink-0"
              >
                Today
              </button>
            </div>
            <button
              onClick={() => navigateMonth(1)}
              className="p-1.5 rounded-md bg-white/10 hover:bg-white/20 text-white transition-colors"
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Calendar Body — slimmer */}
          <div className="p-2 sm:p-3 bg-white">
            {/* Day Headers */}
            <div className="grid grid-cols-7">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
                <div
                  key={day}
                  className={cn(
                    'text-center text-[10px] font-bold uppercase tracking-wider py-1.5',
                    i === 0 || i === 6 ? 'text-rose-400' : 'text-stone-400'
                  )}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid — cells reduced from 100px → 64px */}
            <div className="grid grid-cols-7 gap-1">
              {monthDays.map(({ date, isCurrentMonth }, index) => {
                const dateDeadlines = getDeadlinesForDate(date)
                const isToday = date.toDateString() === new Date().toDateString()
                const hasDeadlines = dateDeadlines.length > 0
                const hasUrgent = dateDeadlines.some(d => !d.isCompleted && getDaysUntil(d.dueDate) <= 3 && getDaysUntil(d.dueDate) >= 0)
                const isWeekend = date.getDay() === 0 || date.getDay() === 6

                return (
                  <div
                    key={index}
                    className={cn(
                      'relative min-h-[64px] sm:min-h-[72px] p-1 rounded-md transition-colors group cursor-pointer',
                      !isCurrentMonth && 'bg-stone-50/50',
                      isCurrentMonth && !isToday && 'bg-white hover:bg-stone-50',
                      isToday && 'bg-gradient-to-br from-primary-700 to-primary-900 shadow-md shadow-primary-900/20',
                      hasDeadlines && !isToday && 'ring-1 ring-inset ring-stone-200'
                    )}
                  >
                    {/* Date Number */}
                    <div className="flex items-center justify-between">
                      <span className={cn(
                        'inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold',
                        !isCurrentMonth && 'text-stone-300',
                        isCurrentMonth && !isToday && isWeekend && 'text-rose-400',
                        isCurrentMonth && !isToday && !isWeekend && 'text-stone-700',
                        isToday && 'bg-white text-primary-700 shadow-sm'
                      )}>
                        {date.getDate()}
                      </span>
                      {hasDeadlines && (
                        <span className={cn(
                          'w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center',
                          isToday ? 'bg-white text-primary-700' :
                          hasUrgent ? 'bg-error-500 text-white' : 'bg-warning-500 text-white'
                        )}>
                          {dateDeadlines.length}
                        </span>
                      )}
                    </div>

                    {/* Deadline Items — show 1 (or 2 on sm+) */}
                    <div className="mt-1 space-y-0.5">
                      {dateDeadlines.slice(0, 2).map((d, i) => {
                        const config = typeConfig[d.type as DeadlineType] ?? typeConfig.OTHER
                        return (
                          <div
                            key={d.deadlineId}
                            className={cn(
                              'text-[9px] px-1 py-0.5 rounded truncate font-semibold leading-tight',
                              i === 1 && 'hidden sm:block',
                              isToday
                                ? 'bg-white/90 text-stone-700'
                                : config.color,
                              d.isCompleted && 'opacity-50 line-through'
                            )}
                          >
                            {d.title}
                          </div>
                        )
                      })}
                      {dateDeadlines.length > 2 && (
                        <p className={cn(
                          'text-[9px] font-semibold text-center hidden sm:block',
                          isToday ? 'text-white/80' : 'text-stone-400'
                        )}>
                          +{dateDeadlines.length - 2}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Legend — compact one-line */}
            <div className="mt-2 pt-2 border-t border-stone-100">
              <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
                {Object.entries(typeConfig).map(([key, config]) => (
                  <div key={key} className="flex items-center gap-1">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{
                        backgroundColor:
                          key === 'PROPOSAL' ? '#f59e0b' :
                          key === 'REPORT' ? '#0ea5e9' :
                          key === 'PRESENTATION' ? '#8b5cf6' :
                          key === 'LOG' ? '#10b981' :
                          key === 'MEETING' ? '#f43f5e' : '#78716c'
                      }}
                    />
                    <span className="text-[10px] font-medium text-stone-500">{config.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      ) : (
        /* List View */
        <div className="space-y-8">
          {/* Upcoming */}
          {upcomingDeadlines.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-warning-100 rounded-lg flex items-center justify-center">
                  <Clock className="h-4 w-4 text-warning-600" />
                </div>
                <h2 className="text-lg font-bold text-stone-800">Upcoming Deadlines</h2>
                <span className="px-2.5 py-0.5 bg-warning-100 text-warning-700 text-sm font-semibold rounded-full">
                  {upcomingDeadlines.length}
                </span>
              </div>
              <div className="space-y-3">
                {upcomingDeadlines.map((deadline) => (
                  <DeadlineCard key={deadline.deadlineId} deadline={deadline} />
                ))}
              </div>
            </div>
          )}

          {/* Completed / Past */}
          {pastDeadlines.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-stone-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-stone-500" />
                </div>
                <h2 className="text-lg font-bold text-stone-800">Past & Completed</h2>
                <span className="px-2.5 py-0.5 bg-stone-100 text-stone-600 text-sm font-semibold rounded-full">
                  {pastDeadlines.length}
                </span>
              </div>
              <div className="space-y-3">
                {pastDeadlines.map((deadline) => (
                  <DeadlineCard key={deadline.deadlineId} deadline={deadline} />
                ))}
              </div>
            </div>
          )}

          {filteredDeadlines.length === 0 && (
            <Card className="text-center py-16 bg-gradient-to-br from-stone-50 to-neutral-50">
              <div className="w-16 h-16 bg-stone-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-8 w-8 text-stone-400" />
              </div>
              <h3 className="text-lg font-semibold text-stone-800 mb-2">No deadlines found</h3>
              <p className="text-stone-500">
                No deadlines match the selected filter
              </p>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}

function DeadlineCard({ deadline }: { deadline: Deadline }) {
  const config = typeConfig[deadline.type as DeadlineType] ?? typeConfig.OTHER
  const priority = priorityConfig[deadline.priority as keyof typeof priorityConfig] ?? priorityConfig.LOW
  const Icon = config.icon
  const daysUntil = getDaysUntil(deadline.dueDate)
  const isOverdue = daysUntil < 0 && !deadline.isCompleted
  const isUrgent = daysUntil >= 0 && daysUntil <= 3 && !deadline.isCompleted

  return (
    <Card className={cn(
      'transition-all duration-200 hover:shadow-md group',
      deadline.isCompleted && 'opacity-70 bg-stone-50',
      isOverdue && 'border-l-4 border-l-error-500 bg-error-50/30',
      isUrgent && !isOverdue && 'border-l-4 border-l-warning-500 bg-warning-50/30',
      !deadline.isCompleted && !isOverdue && !isUrgent && 'border-l-4 border-l-stone-300 hover:border-l-primary-400'
    )}>
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={cn(
          'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105',
          deadline.isCompleted
            ? 'bg-success-100 ring-2 ring-success-200'
            : isOverdue
            ? 'bg-error-100 ring-2 ring-error-200'
            : isUrgent
            ? 'bg-warning-100 ring-2 ring-warning-200'
            : config.color.replace('text-', 'ring-').replace('-700', '-200') + ' ring-2'
        )}>
          {deadline.isCompleted ? (
            <CheckCircle className="h-6 w-6 text-success-600" />
          ) : (
            <Icon className={cn(
              'h-6 w-6',
              isOverdue && 'text-error-600',
              isUrgent && !isOverdue && 'text-warning-600'
            )} />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className={cn(
              'font-semibold text-stone-800',
              deadline.isCompleted && 'line-through text-stone-500'
            )}>
              {deadline.title}
            </h3>
            {deadline.reminderSent && (
              <div className="flex items-center gap-1 px-2 py-0.5 bg-primary-100 rounded-full">
                <Bell className="h-3 w-3 text-primary-600" />
                <span className="text-xs font-medium text-primary-600">Reminder</span>
              </div>
            )}
          </div>
          <p className="text-sm text-stone-500 line-clamp-1 mb-2">{deadline.description}</p>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={cn(config.color, 'font-semibold')} size="sm">{config.label}</Badge>
            <Badge className={cn(priority.color, 'font-semibold')} size="sm">{priority.label} Priority</Badge>
          </div>
        </div>

        {/* Due Date */}
        <div className="text-right flex-shrink-0">
          <div className={cn(
            'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold text-sm',
            isOverdue && 'bg-error-100 text-error-700',
            isUrgent && !isOverdue && 'bg-warning-100 text-warning-700',
            deadline.isCompleted && 'bg-success-100 text-success-700',
            !isOverdue && !isUrgent && !deadline.isCompleted && 'bg-stone-100 text-stone-700'
          )}>
            {deadline.isCompleted ? (
              <>
                <CheckCircle className="h-4 w-4" />
                Done
              </>
            ) : isOverdue ? (
              <>
                <AlertCircle className="h-4 w-4" />
                {Math.abs(daysUntil)}d overdue
              </>
            ) : daysUntil === 0 ? (
              <>
                <AlertTriangle className="h-4 w-4" />
                Today
              </>
            ) : daysUntil === 1 ? (
              <>
                <Clock className="h-4 w-4" />
                Tomorrow
              </>
            ) : (
              <>
                <Clock className="h-4 w-4" />
                {daysUntil}d left
              </>
            )}
          </div>
          <p className="text-xs text-stone-500 mt-1.5">
            {new Date(deadline.dueDate).toLocaleDateString('en-MY', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </p>
        </div>
      </div>
    </Card>
  )
}
