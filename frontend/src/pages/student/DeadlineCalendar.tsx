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
  PROPOSAL: { label: 'Proposal', color: 'bg-primary-100 text-primary-700', icon: FileText },
  REPORT: { label: 'Report', color: 'bg-info-100 text-info-700', icon: FileText },
  PRESENTATION: { label: 'Presentation', color: 'bg-warning-100 text-warning-700', icon: Presentation },
  LOG: { label: 'Log', color: 'bg-success-100 text-success-700', icon: FileText },
  MEETING: { label: 'Meeting', color: 'bg-error-100 text-error-700', icon: Users },
  OTHER: { label: 'Other', color: 'bg-neutral-100 text-neutral-700', icon: Calendar },
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Deadlines & Calendar</h1>
          <p className="text-neutral-600 mt-1">Track important dates and submissions</p>
        </div>
        <div className="flex gap-2">
          <Link to={ROUTES.STUDENT.RESOURCES}>
            <Button variant="secondary" leftIcon={<FileText className="h-4 w-4" />}>
              Resources
            </Button>
          </Link>
        </div>
      </div>

      {/* Urgent Alert */}
      {urgentCount > 0 && (
        <Card className="bg-error-50 border-error-200">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-error-600 flex-shrink-0" />
            <div>
              <p className="font-medium text-error-900">
                {urgentCount} deadline{urgentCount > 1 ? 's' : ''} due within 7 days
              </p>
              <p className="text-sm text-error-700">
                Make sure to complete your submissions on time
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="text-center">
          <div className="text-2xl font-bold text-primary-600">{upcomingDeadlines.length}</div>
          <p className="text-sm text-neutral-600">Upcoming</p>
        </Card>
        <Card className="text-center">
          <div className="text-2xl font-bold text-error-600">{urgentCount}</div>
          <p className="text-sm text-neutral-600">This Week</p>
        </Card>
        <Card className="text-center">
          <div className="text-2xl font-bold text-success-600">
            {deadlines.filter((d) => d.isCompleted).length}
          </div>
          <p className="text-sm text-neutral-600">Completed</p>
        </Card>
        <Card className="text-center">
          <div className="text-2xl font-bold text-neutral-600">{deadlines.length}</div>
          <p className="text-sm text-neutral-600">Total</p>
        </Card>
      </div>

      {/* Filters & View Toggle */}
      <Card>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-neutral-500" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Types</option>
              {Object.entries(typeConfig).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>
          </div>
          <div className="flex bg-neutral-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'px-4 py-2 rounded text-sm font-medium transition-colors',
                viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-neutral-200'
              )}
            >
              List View
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={cn(
                'px-4 py-2 rounded text-sm font-medium transition-colors',
                viewMode === 'calendar' ? 'bg-white shadow-sm' : 'hover:bg-neutral-200'
              )}
            >
              Calendar View
            </button>
          </div>
        </div>
      </Card>

      {viewMode === 'calendar' ? (
        /* Calendar View */
        <Card>
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigateMonth(-1)}
              className="p-2 rounded-lg hover:bg-neutral-100"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h2 className="text-lg font-semibold">
              {currentDate.toLocaleDateString('en-MY', { month: 'long', year: 'numeric' })}
            </h2>
            <button
              onClick={() => navigateMonth(1)}
              className="p-2 rounded-lg hover:bg-neutral-100"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-center text-sm font-medium text-neutral-500 py-2">
                {day}
              </div>
            ))}

            {monthDays.map(({ date, isCurrentMonth }, index) => {
              const dateDeadlines = getDeadlinesForDate(date)
              const isToday = date.toDateString() === new Date().toDateString()

              return (
                <div
                  key={index}
                  className={cn(
                    'min-h-[80px] p-1 border border-neutral-100 rounded',
                    !isCurrentMonth && 'bg-neutral-50',
                    isToday && 'bg-primary-50 border-primary-200'
                  )}
                >
                  <p className={cn(
                    'text-sm font-medium mb-1',
                    !isCurrentMonth && 'text-neutral-400',
                    isToday && 'text-primary-600'
                  )}>
                    {date.getDate()}
                  </p>
                  {dateDeadlines.slice(0, 2).map((d) => {
                    const config = typeConfig[d.type as DeadlineType]
                    return (
                      <div
                        key={d.deadlineId}
                        className={cn(
                          'text-xs px-1 py-0.5 rounded truncate mb-0.5',
                          config.color,
                          d.isCompleted && 'opacity-50 line-through'
                        )}
                      >
                        {d.title}
                      </div>
                    )
                  })}
                  {dateDeadlines.length > 2 && (
                    <p className="text-xs text-neutral-500">+{dateDeadlines.length - 2} more</p>
                  )}
                </div>
              )
            })}
          </div>
        </Card>
      ) : (
        /* List View */
        <div className="space-y-6">
          {/* Upcoming */}
          {upcomingDeadlines.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-neutral-900 mb-4">Upcoming Deadlines</h2>
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
              <h2 className="text-lg font-semibold text-neutral-900 mb-4">Past & Completed</h2>
              <div className="space-y-3">
                {pastDeadlines.map((deadline) => (
                  <DeadlineCard key={deadline.deadlineId} deadline={deadline} />
                ))}
              </div>
            </div>
          )}

          {filteredDeadlines.length === 0 && (
            <Card className="text-center py-12">
              <Calendar className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-neutral-900 mb-2">No deadlines found</h3>
              <p className="text-neutral-500">
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
      'transition-all',
      deadline.isCompleted && 'opacity-60',
      isOverdue && 'border-l-4 border-l-error-500',
      isUrgent && 'border-l-4 border-l-warning-500'
    )}>
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={cn(
          'w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0',
          deadline.isCompleted ? 'bg-success-100' : config.color
        )}>
          {deadline.isCompleted ? (
            <CheckCircle className="h-6 w-6 text-success-600" />
          ) : (
            <Icon className="h-6 w-6" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className={cn(
              'font-semibold text-neutral-900',
              deadline.isCompleted && 'line-through'
            )}>
              {deadline.title}
            </h3>
            {deadline.reminderSent && (
              <Bell className="h-4 w-4 text-primary-500" />
            )}
          </div>
          <p className="text-sm text-neutral-500 line-clamp-1">{deadline.description}</p>
          <div className="flex items-center gap-3 mt-2">
            <Badge className={config.color} size="sm">{config.label}</Badge>
            <Badge className={priority.color} size="sm">{priority.label}</Badge>
          </div>
        </div>

        {/* Due Date */}
        <div className="text-right">
          <p className={cn(
            'font-medium',
            isOverdue && 'text-error-600',
            isUrgent && 'text-warning-600',
            deadline.isCompleted && 'text-success-600',
            !isOverdue && !isUrgent && !deadline.isCompleted && 'text-neutral-900'
          )}>
            {deadline.isCompleted
              ? 'Completed'
              : isOverdue
              ? `${Math.abs(daysUntil)} days overdue`
              : daysUntil === 0
              ? 'Today'
              : daysUntil === 1
              ? 'Tomorrow'
              : `${daysUntil} days left`}
          </p>
          <p className="text-sm text-neutral-500">
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
