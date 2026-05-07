import { useState } from 'react'
import { Link } from 'react-router-dom'
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
  Target,
  AlertTriangle,
} from 'lucide-react'
import { Card, Button, Badge, Spinner } from '@/components/ui'
import { useDeadlines } from '@/lib/hooks/useStudent'
import { ROUTES } from '@/lib/constants/routes'
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
              <CalendarDays className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Deadlines & Calendar</h1>
              <p className="text-stone-300 mt-0.5">Track important dates and submissions</p>
            </div>
          </div>
          <Link to={ROUTES.STUDENT.RESOURCES}>
            <Button
              variant="secondary"
              leftIcon={<FileText className="h-4 w-4" />}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              Resources
            </Button>
          </Link>
        </div>
      </div>

      {/* Urgent Alert */}
      {urgentCount > 0 && (
        <div className="bg-gradient-to-r from-error-50 to-error-100 border border-error-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-error-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-error-500/25">
              <AlertTriangle className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-error-900">
                {urgentCount} deadline{urgentCount > 1 ? 's' : ''} due within 7 days
              </p>
              <p className="text-sm text-error-700">
                Make sure to complete your submissions on time
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="relative overflow-hidden border-l-4 border-l-primary-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
              <Clock className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-primary-600">{upcomingDeadlines.length}</div>
              <p className="text-sm text-neutral-600">Upcoming</p>
            </div>
          </div>
        </Card>
        <Card className="relative overflow-hidden border-l-4 border-l-error-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-error-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="h-5 w-5 text-error-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-error-600">{urgentCount}</div>
              <p className="text-sm text-neutral-600">This Week</p>
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
                {deadlines.filter((d) => d.isCompleted).length}
              </div>
              <p className="text-sm text-neutral-600">Completed</p>
            </div>
          </div>
        </Card>
        <Card className="relative overflow-hidden border-l-4 border-l-amber-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <Target className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-amber-600">{deadlines.length}</div>
              <p className="text-sm text-neutral-600">Total</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters & View Toggle */}
      <Card className="bg-gradient-to-r from-stone-50 to-neutral-50 border-stone-200">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-stone-200 rounded-lg flex items-center justify-center">
              <Filter className="h-4 w-4 text-stone-600" />
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-stone-700 font-medium transition-all"
            >
              <option value="all">All Types</option>
              {Object.entries(typeConfig).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>
          </div>
          <div className="flex bg-stone-200/50 rounded-xl p-1.5 gap-1">
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                viewMode === 'list'
                  ? 'bg-white shadow-md text-stone-900'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-white/50'
              )}
            >
              <ListTodo className="h-4 w-4" />
              List
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                viewMode === 'calendar'
                  ? 'bg-white shadow-md text-stone-900'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-white/50'
              )}
            >
              <CalendarDays className="h-4 w-4" />
              Calendar
            </button>
          </div>
        </div>
      </Card>

      {viewMode === 'calendar' ? (
        /* Calendar View - Modern Design */
        <Card className="overflow-hidden p-0 border-0 shadow-lg">
          {/* Calendar Header */}
          <div className="bg-gradient-to-r from-stone-800 to-stone-900 px-6 py-5">
            <div className="flex items-center justify-between">
              <button
                onClick={() => navigateMonth(-1)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all duration-200 hover:scale-105"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div className="text-center">
                <h2 className="text-2xl font-bold text-white">
                  {currentDate.toLocaleDateString('en-MY', { month: 'long' })}
                </h2>
                <p className="text-stone-400 text-sm">{currentDate.getFullYear()}</p>
              </div>
              <button
                onClick={() => navigateMonth(1)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all duration-200 hover:scale-105"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
            {/* Today Button */}
            <div className="flex justify-center mt-4">
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-4 py-1.5 text-sm font-medium text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 rounded-full transition-all duration-200"
              >
                Today
              </button>
            </div>
          </div>

          {/* Calendar Body */}
          <div className="p-4 bg-white">
            {/* Day Headers */}
            <div className="grid grid-cols-7 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
                <div
                  key={day}
                  className={cn(
                    'text-center text-xs font-bold uppercase tracking-widest py-3',
                    i === 0 || i === 6 ? 'text-rose-400' : 'text-stone-400'
                  )}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1.5">
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
                      'relative min-h-[100px] p-2 rounded-xl transition-all duration-200 group cursor-pointer',
                      !isCurrentMonth && 'bg-stone-50/50',
                      isCurrentMonth && !isToday && 'bg-white hover:bg-stone-50 hover:shadow-md',
                      isToday && 'bg-gradient-to-br from-amber-400 to-amber-500 shadow-lg shadow-amber-500/30',
                      hasDeadlines && !isToday && 'ring-1 ring-inset ring-stone-200'
                    )}
                  >
                    {/* Date Number */}
                    <div className="flex items-center justify-between mb-2">
                      <span className={cn(
                        'inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold transition-all',
                        !isCurrentMonth && 'text-stone-300',
                        isCurrentMonth && !isToday && isWeekend && 'text-rose-400',
                        isCurrentMonth && !isToday && !isWeekend && 'text-stone-700 group-hover:bg-stone-200',
                        isToday && 'bg-white text-amber-600 shadow-sm'
                      )}>
                        {date.getDate()}
                      </span>
                      {/* Deadline Count Badge */}
                      {hasDeadlines && !isToday && (
                        <span className={cn(
                          'w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center',
                          hasUrgent ? 'bg-error-500 text-white' : 'bg-amber-500 text-white'
                        )}>
                          {dateDeadlines.length}
                        </span>
                      )}
                      {hasDeadlines && isToday && (
                        <span className="w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center bg-white text-amber-600">
                          {dateDeadlines.length}
                        </span>
                      )}
                    </div>

                    {/* Deadline Items */}
                    <div className="space-y-1">
                      {dateDeadlines.slice(0, 2).map((d) => {
                        const config = typeConfig[d.type as DeadlineType]
                        return (
                          <div
                            key={d.deadlineId}
                            className={cn(
                              'text-[10px] px-2 py-1 rounded-md truncate font-semibold transition-all',
                              isToday
                                ? 'bg-white/90 text-stone-700 shadow-sm'
                                : cn(config.color, 'hover:scale-[1.02]'),
                              d.isCompleted && 'opacity-50 line-through'
                            )}
                          >
                            {d.title}
                          </div>
                        )
                      })}
                      {dateDeadlines.length > 2 && (
                        <p className={cn(
                          'text-[10px] font-semibold text-center',
                          isToday ? 'text-white/80' : 'text-stone-400'
                        )}>
                          +{dateDeadlines.length - 2} more
                        </p>
                      )}
                    </div>

                    {/* Hover Effect Dot Indicators */}
                    {hasDeadlines && dateDeadlines.length <= 2 && (
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                        {dateDeadlines.map((d) => {
                          const config = typeConfig[d.type as DeadlineType]
                          const colorClass = config.color.split(' ')[0].replace('bg-', '').replace('-100', '-500')
                          return (
                            <span
                              key={d.deadlineId}
                              className={cn(
                                'w-1.5 h-1.5 rounded-full',
                                isToday ? 'bg-white/60' : `bg-${colorClass}`
                              )}
                              style={{
                                backgroundColor: isToday ? undefined :
                                  d.type === 'PROPOSAL' ? '#f59e0b' :
                                  d.type === 'REPORT' ? '#0ea5e9' :
                                  d.type === 'PRESENTATION' ? '#8b5cf6' :
                                  d.type === 'LOG' ? '#10b981' :
                                  d.type === 'MEETING' ? '#f43f5e' : '#78716c'
                              }}
                            />
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Legend */}
            <div className="mt-6 pt-4 border-t border-stone-100">
              <div className="flex flex-wrap items-center justify-center gap-4">
                {Object.entries(typeConfig).map(([key, config]) => (
                  <div key={key} className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{
                        backgroundColor:
                          key === 'PROPOSAL' ? '#f59e0b' :
                          key === 'REPORT' ? '#0ea5e9' :
                          key === 'PRESENTATION' ? '#8b5cf6' :
                          key === 'LOG' ? '#10b981' :
                          key === 'MEETING' ? '#f43f5e' : '#78716c'
                      }}
                    />
                    <span className="text-xs font-medium text-stone-600">{config.label}</span>
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
                <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                  <Clock className="h-4 w-4 text-amber-600" />
                </div>
                <h2 className="text-lg font-bold text-stone-800">Upcoming Deadlines</h2>
                <span className="px-2.5 py-0.5 bg-amber-100 text-amber-700 text-sm font-semibold rounded-full">
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
  const config = typeConfig[deadline.type as DeadlineType]
  const priority = priorityConfig[deadline.priority as keyof typeof priorityConfig]
  const Icon = config.icon
  const daysUntil = getDaysUntil(deadline.dueDate)
  const isOverdue = daysUntil < 0 && !deadline.isCompleted
  const isUrgent = daysUntil >= 0 && daysUntil <= 3 && !deadline.isCompleted

  return (
    <Card className={cn(
      'transition-all duration-200 hover:shadow-md group',
      deadline.isCompleted && 'opacity-70 bg-stone-50',
      isOverdue && 'border-l-4 border-l-error-500 bg-error-50/30',
      isUrgent && !isOverdue && 'border-l-4 border-l-amber-500 bg-amber-50/30',
      !deadline.isCompleted && !isOverdue && !isUrgent && 'border-l-4 border-l-stone-300 hover:border-l-amber-400'
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
            ? 'bg-amber-100 ring-2 ring-amber-200'
            : config.color.replace('text-', 'ring-').replace('-700', '-200') + ' ring-2'
        )}>
          {deadline.isCompleted ? (
            <CheckCircle className="h-6 w-6 text-success-600" />
          ) : (
            <Icon className={cn(
              'h-6 w-6',
              isOverdue && 'text-error-600',
              isUrgent && !isOverdue && 'text-amber-600'
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
            isUrgent && !isOverdue && 'bg-amber-100 text-amber-700',
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
