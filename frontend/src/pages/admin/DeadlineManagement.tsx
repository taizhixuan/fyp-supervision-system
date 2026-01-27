import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Clock,
  Plus,
  Search,
  Calendar,
  AlertTriangle,
  CheckCircle,
  X,
  Edit,
  Trash2,
  FileText,
  Users,
  ClipboardList,
  CalendarDays,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import {
  useDeadlines,
  useCreateDeadline,
  useUpdateDeadline,
  useFYPCycles,
} from '@/lib/hooks/useAdmin'
import { cn } from '@/lib/utils/cn'
import type { DeadlineType, DeadlineStatus, Deadline } from '@/types'

const deadlineSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
  type: z.enum(['PROPOSAL_SUBMISSION', 'SUPERVISOR_SELECTION', 'PROGRESS_REPORT', 'FINAL_REPORT', 'PRESENTATION', 'CUSTOM'] as const),
  cycleId: z.string().min(1, 'Please select a cycle'),
  dueDate: z.string().min(1, 'Due date is required'),
  reminderDays: z.number().min(0).max(30),
  isActive: z.boolean(),
})

type DeadlineFormData = z.infer<typeof deadlineSchema>

const typeConfig: Record<DeadlineType, { label: string; color: string; bgColor: string; icon: typeof Clock }> = {
  PROPOSAL_SUBMISSION: { label: 'Proposal', color: 'text-primary-600', bgColor: 'bg-primary-50', icon: FileText },
  SUPERVISOR_SELECTION: { label: 'Supervisor Selection', color: 'text-accent-600', bgColor: 'bg-accent-50', icon: Users },
  PROGRESS_REPORT: { label: 'Progress Report', color: 'text-info-600', bgColor: 'bg-info-50', icon: ClipboardList },
  FINAL_REPORT: { label: 'Final Report', color: 'text-success-600', bgColor: 'bg-success-50', icon: FileText },
  PRESENTATION: { label: 'Presentation', color: 'text-warning-600', bgColor: 'bg-warning-50', icon: Calendar },
  CUSTOM: { label: 'Custom', color: 'text-neutral-600', bgColor: 'bg-neutral-100', icon: Clock },
}

const statusConfig: Record<DeadlineStatus, { label: string; color: string; bgColor: string }> = {
  UPCOMING: { label: 'Upcoming', color: 'text-info-600', bgColor: 'bg-info-50' },
  ACTIVE: { label: 'Active', color: 'text-success-600', bgColor: 'bg-success-50' },
  PASSED: { label: 'Passed', color: 'text-neutral-600', bgColor: 'bg-neutral-100' },
  EXTENDED: { label: 'Extended', color: 'text-warning-600', bgColor: 'bg-warning-50' },
}

export function DeadlineManagement() {
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<DeadlineType | 'ALL'>('ALL')
  const [statusFilter, setStatusFilter] = useState<DeadlineStatus | 'ALL'>('ALL')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingDeadline, setEditingDeadline] = useState<Deadline | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')

  const { data, isLoading } = useDeadlines(
    typeFilter !== 'ALL' ? typeFilter : undefined
  )
  const { data: cyclesData } = useFYPCycles()
  const createMutation = useCreateDeadline()
  const updateMutation = useUpdateDeadline()

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<DeadlineFormData>({
    resolver: zodResolver(deadlineSchema),
    defaultValues: {
      reminderDays: 7,
      isActive: true,
    },
  })

  const filteredDeadlines = data?.deadlines.filter((deadline) => {
    if (statusFilter !== 'ALL' && deadline.status !== statusFilter) return false
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      deadline.name.toLowerCase().includes(query) ||
      deadline.description?.toLowerCase().includes(query)
    )
  })

  const handleCreate = async (formData: DeadlineFormData) => {
    try {
      await createMutation.mutateAsync({
        name: formData.name,
        description: formData.description,
        type: formData.type,
        cycleId: formData.cycleId,
        dueDate: new Date(formData.dueDate).toISOString(),
        reminderDays: formData.reminderDays,
        isActive: formData.isActive,
      })
      setShowCreateModal(false)
      reset()
    } catch (error) {
      console.error('Failed to create deadline:', error)
    }
  }

  const handleUpdate = async (formData: DeadlineFormData) => {
    if (!editingDeadline) return
    try {
      await updateMutation.mutateAsync({
        deadlineId: editingDeadline.deadlineId,
        data: {
          name: formData.name,
          description: formData.description,
          type: formData.type,
          dueDate: new Date(formData.dueDate).toISOString(),
          reminderDays: formData.reminderDays,
          isActive: formData.isActive,
        },
      })
      setEditingDeadline(null)
      reset()
    } catch (error) {
      console.error('Failed to update deadline:', error)
    }
  }

  const openEditModal = (deadline: Deadline) => {
    setEditingDeadline(deadline)
    setValue('name', deadline.name)
    setValue('description', deadline.description || '')
    setValue('type', deadline.type)
    setValue('cycleId', deadline.cycleId)
    setValue('dueDate', deadline.dueDate.split('T')[0])
    setValue('reminderDays', deadline.reminderDays || 7)
    setValue('isActive', deadline.isActive)
  }

  const getDaysUntil = (dueDate: string) => {
    const due = new Date(dueDate)
    const now = new Date()
    const diff = due.getTime() - now.getTime()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  const getCalendarData = () => {
    if (!filteredDeadlines) return {}
    const calendar: Record<string, Deadline[]> = {}
    filteredDeadlines.forEach((deadline) => {
      const monthKey = new Date(deadline.dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
      if (!calendar[monthKey]) {
        calendar[monthKey] = []
      }
      calendar[monthKey].push(deadline)
    })
    return calendar
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    )
  }

  const activeCycles = cyclesData?.cycles.filter((c) => c.status === 'ACTIVE' || c.status === 'UPCOMING') || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
            <Clock className="h-7 w-7 text-primary-600" />
            Deadline Management
          </h1>
          <p className="text-neutral-600 mt-1">
            Configure submission deadlines and important dates
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center border border-neutral-200 rounded-lg p-1">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={cn(
                'px-3 py-1.5 rounded text-sm font-medium transition-colors',
                viewMode === 'list' ? 'bg-primary-500 text-white' : 'text-neutral-600 hover:bg-neutral-100'
              )}
            >
              List
            </button>
            <button
              type="button"
              onClick={() => setViewMode('calendar')}
              className={cn(
                'px-3 py-1.5 rounded text-sm font-medium transition-colors',
                viewMode === 'calendar' ? 'bg-primary-500 text-white' : 'text-neutral-600 hover:bg-neutral-100'
              )}
            >
              Calendar
            </button>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Deadline
          </Button>
        </div>
      </div>

      {/* Upcoming Deadlines Alert */}
      {filteredDeadlines?.some((d) => d.status === 'ACTIVE' && getDaysUntil(d.dueDate) <= 7) && (
        <Card className="p-4 border-l-4 border-l-warning-500 bg-warning-50">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-warning-600" />
            <div>
              <h3 className="font-medium text-neutral-900">Upcoming Deadlines</h3>
              <p className="text-sm text-neutral-600">
                {filteredDeadlines?.filter((d) => d.status === 'ACTIVE' && getDaysUntil(d.dueDate) <= 7).length} deadline(s) due within the next 7 days
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Search & Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <Input
              type="text"
              placeholder="Search deadlines..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as DeadlineType | 'ALL')}
            className="px-3 py-2 border border-neutral-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500"
          >
            <option value="ALL">All Types</option>
            {Object.entries(typeConfig).map(([key, config]) => (
              <option key={key} value={key}>{config.label}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as DeadlineStatus | 'ALL')}
            className="px-3 py-2 border border-neutral-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500"
          >
            <option value="ALL">All Status</option>
            {Object.entries(statusConfig).map(([key, config]) => (
              <option key={key} value={key}>{config.label}</option>
            ))}
          </select>
        </div>
      </Card>

      {/* Content */}
      {viewMode === 'list' ? (
        /* List View */
        <div className="space-y-3">
          {filteredDeadlines && filteredDeadlines.length > 0 ? (
            filteredDeadlines.map((deadline) => {
              const type = typeConfig[deadline.type]
              const status = statusConfig[deadline.status]
              const TypeIcon = type.icon
              const daysUntil = getDaysUntil(deadline.dueDate)

              return (
                <Card key={deadline.deadlineId} className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className={cn('p-2 rounded-lg', type.bgColor)}>
                        <TypeIcon className={cn('h-5 w-5', type.color)} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-neutral-900">{deadline.name}</h3>
                          <span className={cn(
                            'px-2 py-0.5 rounded-full text-xs font-medium',
                            status.bgColor,
                            status.color
                          )}>
                            {status.label}
                          </span>
                          {!deadline.isActive && (
                            <span className="px-2 py-0.5 bg-neutral-100 text-neutral-500 rounded-full text-xs">
                              Inactive
                            </span>
                          )}
                        </div>
                        {deadline.description && (
                          <p className="text-sm text-neutral-500 mt-1">{deadline.description}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-sm text-neutral-600">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            Due: {new Date(deadline.dueDate).toLocaleDateString()}
                          </span>
                          <span className="text-neutral-400">•</span>
                          <span className={cn(
                            'font-medium',
                            daysUntil < 0 ? 'text-error-600' :
                            daysUntil <= 3 ? 'text-warning-600' :
                            daysUntil <= 7 ? 'text-info-600' : 'text-neutral-600'
                          )}>
                            {daysUntil < 0
                              ? `${Math.abs(daysUntil)} days overdue`
                              : daysUntil === 0
                              ? 'Due today'
                              : `${daysUntil} days remaining`}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditModal(deadline)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              )
            })
          ) : (
            <Card className="p-12 text-center">
              <Clock className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-neutral-900">No deadlines found</h3>
              <p className="text-neutral-500 mt-1">
                {searchQuery || typeFilter !== 'ALL' || statusFilter !== 'ALL'
                  ? 'Try adjusting your filters'
                  : 'Create your first deadline to get started'}
              </p>
            </Card>
          )}
        </div>
      ) : (
        /* Calendar View */
        <div className="space-y-6">
          {Object.entries(getCalendarData()).map(([month, deadlines]) => (
            <Card key={month} className="p-6">
              <h3 className="font-semibold text-neutral-900 mb-4 flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-primary-600" />
                {month}
              </h3>
              <div className="space-y-3">
                {deadlines.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()).map((deadline) => {
                  const type = typeConfig[deadline.type]
                  const TypeIcon = type.icon
                  const daysUntil = getDaysUntil(deadline.dueDate)

                  return (
                    <div
                      key={deadline.deadlineId}
                      className="flex items-center gap-4 p-3 bg-neutral-50 rounded-lg"
                    >
                      <div className="text-center min-w-[50px]">
                        <p className="text-2xl font-bold text-neutral-900">
                          {new Date(deadline.dueDate).getDate()}
                        </p>
                        <p className="text-xs text-neutral-500 uppercase">
                          {new Date(deadline.dueDate).toLocaleDateString('en-US', { weekday: 'short' })}
                        </p>
                      </div>
                      <div className={cn('p-2 rounded-lg', type.bgColor)}>
                        <TypeIcon className={cn('h-5 w-5', type.color)} />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-neutral-900">{deadline.name}</h4>
                        <p className="text-sm text-neutral-500">{type.label}</p>
                      </div>
                      <div className={cn(
                        'text-sm font-medium px-3 py-1 rounded-full',
                        daysUntil < 0 ? 'bg-error-50 text-error-600' :
                        daysUntil <= 3 ? 'bg-warning-50 text-warning-600' :
                        daysUntil <= 7 ? 'bg-info-50 text-info-600' : 'bg-neutral-100 text-neutral-600'
                      )}>
                        {daysUntil < 0 ? 'Overdue' : daysUntil === 0 ? 'Today' : `${daysUntil}d`}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditModal(deadline)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  )
                })}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {(showCreateModal || editingDeadline) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <Card className="w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-neutral-900">
                {editingDeadline ? 'Edit Deadline' : 'Create Deadline'}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setShowCreateModal(false)
                  setEditingDeadline(null)
                  reset()
                }}
                className="p-1 hover:bg-neutral-100 rounded"
              >
                <X className="h-5 w-5 text-neutral-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit(editingDeadline ? handleUpdate : handleCreate)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Deadline Name *
                </label>
                <Input
                  {...register('name')}
                  placeholder="e.g., Proposal Submission Deadline"
                  error={errors.name?.message}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Description
                </label>
                <textarea
                  {...register('description')}
                  placeholder="Optional description..."
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Type *
                  </label>
                  <select
                    {...register('type')}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500"
                  >
                    {Object.entries(typeConfig).map(([key, config]) => (
                      <option key={key} value={key}>{config.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    FYP Cycle *
                  </label>
                  <select
                    {...register('cycleId')}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Select cycle</option>
                    {activeCycles.map((cycle) => (
                      <option key={cycle.cycleId} value={cycle.cycleId}>
                        {cycle.name}
                      </option>
                    ))}
                  </select>
                  {errors.cycleId && (
                    <p className="text-sm text-error-600 mt-1">{errors.cycleId.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Due Date *
                  </label>
                  <Input
                    type="date"
                    {...register('dueDate')}
                    error={errors.dueDate?.message}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Reminder (days before)
                  </label>
                  <Input
                    type="number"
                    {...register('reminderDays', { valueAsNumber: true })}
                    min={0}
                    max={30}
                  />
                </div>
              </div>

              <label className="flex items-center gap-2">
                <input type="checkbox" {...register('isActive')} />
                <span className="text-sm text-neutral-700">Active (visible to users)</span>
              </label>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateModal(false)
                    setEditingDeadline(null)
                    reset()
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {(createMutation.isPending || updateMutation.isPending) ? (
                    <Spinner size="sm" className="mr-2" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  {editingDeadline ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  )
}
