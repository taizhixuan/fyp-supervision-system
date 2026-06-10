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
import { useSuccessToast, useErrorToast } from '@/components/ui/Toast'
import {
  useDeadlines,
  useCreateDeadline,
  useUpdateDeadline,
  useDeleteDeadline,
  useFYPCycles,
} from '@/lib/hooks/useAdmin'
import { cn } from '@/lib/utils/cn'
import type { AdminDeadlineType, DeadlineStatus, AdminDeadline, UserRole } from '@/types'

const TARGET_ROLE_OPTIONS: UserRole[] = ['STUDENT', 'SUPERVISOR', 'FYP_COMMITTEE']

const deadlineSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters'),
  description: z.string().optional(),
  type: z.string().min(1, 'Type is required'),
  cycleId: z.coerce.number().int().positive('Please select a cycle'),
  dueDate: z.string().min(1, 'Due date is required'),
  reminderDays: z.coerce.number().int().min(0).max(30),
  audience: z.enum(['STUDENT', 'SUPERVISOR', 'FYP_COMMITTEE', 'ALL']),
  isExtendable: z.boolean(),
})

type DeadlineFormData = z.infer<typeof deadlineSchema>

type TypeEntry = { label: string; color: string; bgColor: string; icon: typeof Clock }
type StatusEntry = { label: string; color: string; bgColor: string }

const DEFAULT_TYPE: TypeEntry = { label: 'Other', color: 'text-neutral-600', bgColor: 'bg-neutral-100', icon: Clock }
const DEFAULT_STATUS: StatusEntry = { label: 'Unknown', color: 'text-neutral-600', bgColor: 'bg-neutral-100' }

const typeConfig: Record<string, TypeEntry> = {
  ANNOUNCEMENT: { label: 'Announcement', color: 'text-info-600', bgColor: 'bg-info-50', icon: FileText },
  BRIEFING: { label: 'Briefing', color: 'text-info-600', bgColor: 'bg-info-50', icon: Users },
  PROPOSAL_SUBMISSION: { label: 'Proposal Submission', color: 'text-primary-600', bgColor: 'bg-primary-50', icon: FileText },
  PROPOSAL_ACCEPTANCE: { label: 'Proposal Acceptance', color: 'text-primary-600', bgColor: 'bg-primary-50', icon: CheckCircle },
  STUDENT_CONFIRMATION: { label: 'Student Confirmation', color: 'text-accent-600', bgColor: 'bg-accent-50', icon: Users },
  SUBJECT_REG_FORM: { label: 'Subject Reg Form', color: 'text-accent-600', bgColor: 'bg-accent-50', icon: ClipboardList },
  SUBJECT_REG_CLIC: { label: 'Subject Reg Clic', color: 'text-accent-600', bgColor: 'bg-accent-50', icon: ClipboardList },
  SUPERVISOR_SELECTION: { label: 'Supervisor Selection', color: 'text-accent-600', bgColor: 'bg-accent-50', icon: Users },
  MODERATOR_ASSIGNMENT: { label: 'Moderator Assignment', color: 'text-warning-600', bgColor: 'bg-warning-50', icon: Users },
  PROGRESS_REPORT: { label: 'Progress Report', color: 'text-info-600', bgColor: 'bg-info-50', icon: ClipboardList },
  INTERIM_REPORT: { label: 'Interim Report', color: 'text-info-600', bgColor: 'bg-info-50', icon: ClipboardList },
  FINAL_REPORT: { label: 'Final Report', color: 'text-success-600', bgColor: 'bg-success-50', icon: FileText },
  FINAL_SOFT_COPY: { label: 'Final Soft Copy', color: 'text-success-600', bgColor: 'bg-success-50', icon: FileText },
  PRESENTATION: { label: 'Presentation', color: 'text-warning-600', bgColor: 'bg-warning-50', icon: Calendar },
  POSTER_SLOTS: { label: 'Poster Slots', color: 'text-warning-600', bgColor: 'bg-warning-50', icon: Calendar },
  POSTER_EVAL: { label: 'Poster Evaluation', color: 'text-warning-600', bgColor: 'bg-warning-50', icon: Calendar },
  PLAGIARISM: { label: 'Plagiarism Check', color: 'text-error-600', bgColor: 'bg-error-50', icon: AlertTriangle },
  FEEDBACK: { label: 'Feedback', color: 'text-neutral-600', bgColor: 'bg-neutral-100', icon: ClipboardList },
  MARK_ENTRY: { label: 'Mark Entry', color: 'text-success-600', bgColor: 'bg-success-50', icon: ClipboardList },
  MEETING_LOGS: { label: 'Meeting Logs', color: 'text-info-600', bgColor: 'bg-info-50', icon: ClipboardList },
  CUSTOM: { label: 'Custom', color: 'text-neutral-600', bgColor: 'bg-neutral-100', icon: Clock },
}

const statusConfig: Record<string, StatusEntry> = {
  UPCOMING: { label: 'Upcoming', color: 'text-info-600', bgColor: 'bg-info-50' },
  ACTIVE: { label: 'Active', color: 'text-success-600', bgColor: 'bg-success-50' },
  PAST: { label: 'Past', color: 'text-neutral-600', bgColor: 'bg-neutral-100' },
  EXTENDED: { label: 'Extended', color: 'text-warning-600', bgColor: 'bg-warning-50' },
}

const getTypeConfig = (key: string | undefined): TypeEntry => (key && typeConfig[key]) || DEFAULT_TYPE
const getStatusConfig = (key: string | undefined): StatusEntry => (key && statusConfig[key]) || DEFAULT_STATUS

const TYPE_OPTIONS: AdminDeadlineType[] = Object.keys(typeConfig)

export function DeadlineManagement() {
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<AdminDeadlineType | 'ALL'>('ALL')
  const [statusFilter, setStatusFilter] = useState<DeadlineStatus | 'ALL'>('ALL')
  const [cycleFilter, setCycleFilter] = useState<number | undefined>(undefined)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingDeadline, setEditingDeadline] = useState<AdminDeadline | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')

  const { data, isLoading } = useDeadlines(cycleFilter)
  const { data: cyclesData } = useFYPCycles()
  const createMutation = useCreateDeadline()
  const updateMutation = useUpdateDeadline()
  const deleteMutation = useDeleteDeadline()
  const successToast = useSuccessToast()
  const errorToast = useErrorToast()

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
      audience: 'STUDENT',
      isExtendable: false,
      type: 'CUSTOM',
    },
  })

  const filteredDeadlines = data?.deadlines.filter((deadline: AdminDeadline) => {
    if (typeFilter !== 'ALL' && deadline.type !== typeFilter) return false
    if (statusFilter !== 'ALL' && deadline.status !== statusFilter) return false
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      (deadline.title || '').toLowerCase().includes(query) ||
      (deadline.description || '').toLowerCase().includes(query)
    )
  })

  const closeModals = () => {
    setShowCreateModal(false)
    setEditingDeadline(null)
    reset()
  }

  const handleCreate = async (formData: DeadlineFormData) => {
    try {
      await createMutation.mutateAsync({
        cycleId: formData.cycleId,
        title: formData.title,
        type: formData.type,
        description: formData.description,
        dueDate: formData.dueDate,
        reminderDays: [formData.reminderDays],
        targetRoles: formData.audience === 'ALL' ? ['STUDENT', 'SUPERVISOR', 'FYP_COMMITTEE'] : [formData.audience],
        isExtendable: formData.isExtendable,
      })
      successToast('Deadline created', formData.title)
      closeModals()
    } catch (e) {
      errorToast('Create failed', (e as Error).message)
    }
  }

  const handleUpdate = async (formData: DeadlineFormData) => {
    if (!editingDeadline) return
    try {
      await updateMutation.mutateAsync({
        deadlineId: editingDeadline.deadlineId,
        data: {
          title: formData.title,
          description: formData.description,
          dueDate: formData.dueDate,
          reminderDays: [formData.reminderDays],
          targetRoles: formData.audience === 'ALL' ? ['STUDENT', 'SUPERVISOR', 'FYP_COMMITTEE'] : [formData.audience],
          isExtendable: formData.isExtendable,
        },
      })
      successToast('Deadline updated', formData.title)
      closeModals()
    } catch (e) {
      errorToast('Update failed', (e as Error).message)
    }
  }

  const handleDelete = async (deadline: AdminDeadline) => {
    if (!window.confirm(`Delete deadline "${deadline.title}"?`)) return
    try {
      await deleteMutation.mutateAsync(deadline.deadlineId)
      successToast('Deleted', deadline.title)
    } catch (e) {
      errorToast('Delete failed', (e as Error).message)
    }
  }

  const openEditModal = (deadline: AdminDeadline) => {
    setEditingDeadline(deadline)
    setValue('title', deadline.title)
    setValue('description', deadline.description || '')
    setValue('type', deadline.type)
    setValue('cycleId', deadline.cycleId)
    setValue('dueDate', deadline.dueDate ? deadline.dueDate.split('T')[0] : '')
    setValue('reminderDays', deadline.reminderDays?.[0] ?? 7)
    setValue('audience', (deadline.targetRoles?.[0] as DeadlineFormData['audience']) ?? 'STUDENT')
    setValue('isExtendable', deadline.isExtendable ?? false)
  }

  const getDaysUntil = (dueDate: string) => {
    const due = new Date(dueDate)
    const now = new Date()
    const diff = due.getTime() - now.getTime()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  const getCalendarData = () => {
    if (!filteredDeadlines) return {}
    const calendar: Record<string, AdminDeadline[]> = {}
    filteredDeadlines.forEach((deadline: AdminDeadline) => {
      const monthKey = new Date(deadline.dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
      if (!calendar[monthKey]) calendar[monthKey] = []
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

  const cycles = cyclesData?.cycles ?? []
  const selectableCycles = cycles.filter((c) => c.status === 'PLANNING' || c.status === 'ACTIVE')

  return (
    <div className="space-y-3 lg:space-y-4">
      {/* Compact hero */}
      <div className="relative bg-gradient-to-br from-stone-800 via-stone-800 to-stone-900 rounded-xl p-3 sm:p-4 text-white shadow-md overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="relative flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex-shrink-0 w-9 h-9 bg-amber-500/20 rounded-lg flex items-center justify-center ring-1 ring-amber-500/30">
              <Clock className="h-5 w-5 text-amber-400" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-white leading-tight">Deadline Management</h1>
              <p className="text-stone-300 text-xs">Configure submission deadlines for each FYP cycle</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="flex items-center border border-stone-600/40 rounded-md p-0.5 bg-stone-700/40">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={cn(
                  'px-2 py-0.5 rounded text-xs font-medium transition-colors',
                  viewMode === 'list' ? 'bg-amber-500 text-white' : 'text-stone-300 hover:bg-stone-700/60'
                )}
              >
                List
              </button>
              <button
                type="button"
                onClick={() => setViewMode('calendar')}
                className={cn(
                  'px-2 py-0.5 rounded text-xs font-medium transition-colors',
                  viewMode === 'calendar' ? 'bg-amber-500 text-white' : 'text-stone-300 hover:bg-stone-700/60'
                )}
              >
                Calendar
              </button>
            </div>
            <Button
              size="sm"
              onClick={() => {
                reset({ reminderDays: 7, audience: 'STUDENT', isExtendable: false, type: 'CUSTOM' })
                setShowCreateModal(true)
              }}
              className="bg-amber-500 hover:bg-amber-600 text-white border-0"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add Deadline
            </Button>
          </div>
        </div>
      </div>

      {/* Upcoming Deadlines Alert */}
      {filteredDeadlines?.some((d: AdminDeadline) => d.status === 'ACTIVE' && getDaysUntil(d.dueDate) <= 7) && (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md border-l-4 border-l-amber-500 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-neutral-900">Upcoming Deadlines</p>
            <p className="text-xs text-neutral-600">
              {filteredDeadlines?.filter((d: AdminDeadline) => d.status === 'ACTIVE' && getDaysUntil(d.dueDate) <= 7).length} deadline(s) due within the next 7 days
            </p>
          </div>
        </div>
      )}

      {/* Search & Filters */}
      <Card padding="sm">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
            <Input
              type="text"
              placeholder="Search deadlines..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-9 text-sm"
            />
          </div>
          <select
            value={cycleFilter ?? ''}
            onChange={(e) => setCycleFilter(e.target.value ? Number(e.target.value) : undefined)}
            className="px-2.5 h-9 border border-neutral-300 rounded-md text-sm focus:ring-2 focus:ring-amber-500"
          >
            <option value="">All Cycles</option>
            {cycles.map((c) => (
              <option key={c.cycleId} value={c.cycleId}>{c.cycleCode || c.name}</option>
            ))}
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as AdminDeadlineType | 'ALL')}
            className="px-2.5 h-9 border border-neutral-300 rounded-md text-sm focus:ring-2 focus:ring-amber-500"
          >
            <option value="ALL">All Types</option>
            {TYPE_OPTIONS.map((key) => (
              <option key={key} value={key}>{typeConfig[key].label}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as DeadlineStatus | 'ALL')}
            className="px-2.5 h-9 border border-neutral-300 rounded-md text-sm focus:ring-2 focus:ring-amber-500"
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
        <div className="space-y-3">
          {filteredDeadlines && filteredDeadlines.length > 0 ? (
            filteredDeadlines.map((deadline: AdminDeadline) => {
              const type = getTypeConfig(deadline.type)
              const status = getStatusConfig(deadline.status)
              const TypeIcon = type.icon
              const daysUntil = getDaysUntil(deadline.dueDate)

              return (
                <Card key={deadline.deadlineId} padding="sm" className="hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 min-w-0">
                      <div className={cn('p-1.5 rounded-md flex-shrink-0', type.bgColor)}>
                        <TypeIcon className={cn('h-4 w-4', type.color)} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="text-sm font-semibold text-neutral-900">{deadline.title}</h3>
                          <span className={cn('px-1.5 py-0 rounded text-[10px] font-medium', status.bgColor, status.color)}>
                            {status.label}
                          </span>
                          {deadline.cycleName && (
                            <span className="px-1.5 py-0 bg-neutral-100 text-neutral-600 rounded text-[10px]">
                              {deadline.cycleName}
                            </span>
                          )}
                        </div>
                        {deadline.description && (
                          <p className="text-[11px] text-neutral-500 line-clamp-1">{deadline.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-neutral-600">
                          <span className="flex items-center gap-0.5">
                            <Calendar className="h-3 w-3" />
                            Due {new Date(deadline.dueDate).toLocaleDateString()}
                          </span>
                          <span className={cn(
                            'font-semibold',
                            daysUntil < 0 ? 'text-rose-600' :
                            daysUntil <= 3 ? 'text-amber-600' :
                            daysUntil <= 7 ? 'text-sky-600' : 'text-neutral-600'
                          )}>
                            · {daysUntil < 0
                              ? `${Math.abs(daysUntil)}d overdue`
                              : daysUntil === 0
                              ? 'Today'
                              : `${daysUntil}d left`}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5 flex-shrink-0">
                      <Button variant="ghost" size="sm" onClick={() => openEditModal(deadline)} className="px-1.5">
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(deadline)} className="text-rose-600 px-1.5">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </Card>
              )
            })
          ) : (
            <Card className="text-center py-8">
              <Clock className="h-10 w-10 text-neutral-300 mx-auto mb-2" />
              <h3 className="text-sm font-medium text-neutral-900">No deadlines found</h3>
              <p className="text-xs text-neutral-500 mt-1">
                {searchQuery || typeFilter !== 'ALL' || statusFilter !== 'ALL' || cycleFilter
                  ? 'Try adjusting your filters'
                  : 'Create your first deadline to get started'}
              </p>
            </Card>
          )}
        </div>
      ) : (
        <div className="space-y-2.5">
          {Object.entries(getCalendarData()).map(([month, deadlines]) => (
            <Card key={month} padding="sm">
              <h3 className="text-sm font-semibold text-neutral-900 mb-2 flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4 text-amber-600" />
                {month}
              </h3>
              <div className="space-y-1.5">
                {deadlines.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()).map((deadline) => {
                  const type = getTypeConfig(deadline.type)
                  const TypeIcon = type.icon
                  const daysUntil = getDaysUntil(deadline.dueDate)
                  return (
                    <div key={deadline.deadlineId} className="flex items-center gap-2 p-2 bg-neutral-50 rounded-md">
                      <div className="text-center min-w-[36px]">
                        <p className="text-base font-bold text-neutral-900 leading-none">
                          {new Date(deadline.dueDate).getDate()}
                        </p>
                        <p className="text-[10px] text-neutral-500 uppercase">
                          {new Date(deadline.dueDate).toLocaleDateString('en-US', { weekday: 'short' })}
                        </p>
                      </div>
                      <div className={cn('p-1 rounded-md', type.bgColor)}>
                        <TypeIcon className={cn('h-3.5 w-3.5', type.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-semibold text-neutral-900 truncate">{deadline.title}</h4>
                        <p className="text-[10px] text-neutral-500">{type.label}</p>
                      </div>
                      <div className={cn(
                        'text-[10px] font-medium px-1.5 py-0.5 rounded',
                        daysUntil < 0 ? 'bg-rose-50 text-rose-600' :
                        daysUntil <= 3 ? 'bg-amber-50 text-amber-600' :
                        daysUntil <= 7 ? 'bg-sky-50 text-sky-600' : 'bg-neutral-100 text-neutral-600'
                      )}>
                        {daysUntil < 0 ? 'Overdue' : daysUntil === 0 ? 'Today' : `${daysUntil}d`}
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => openEditModal(deadline)}>
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
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-medium text-neutral-900">
                {editingDeadline ? 'Edit Deadline' : 'Create Deadline'}
              </h2>
              <button type="button" onClick={closeModals} className="p-1 hover:bg-neutral-100 rounded">
                <X className="h-5 w-5 text-neutral-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit(editingDeadline ? handleUpdate : handleCreate)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Title *</label>
                <Input
                  {...register('title')}
                  placeholder="e.g., Proposal Submission Deadline"
                  error={errors.title?.message}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Description</label>
                <textarea
                  {...register('description')}
                  placeholder="Optional description..."
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Type *</label>
                  <select
                    {...register('type')}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500"
                  >
                    {TYPE_OPTIONS.map((key) => (
                      <option key={key} value={key}>{typeConfig[key].label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">FYP Cycle *</label>
                  <select
                    {...register('cycleId')}
                    disabled={!!editingDeadline}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500 disabled:bg-neutral-100"
                  >
                    <option value="">Select cycle</option>
                    {selectableCycles.map((cycle) => (
                      <option key={cycle.cycleId} value={cycle.cycleId}>
                        {cycle.cycleCode || cycle.name}
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
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Due Date *</label>
                  <Input type="date" {...register('dueDate')} error={errors.dueDate?.message} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Reminder (days before)</label>
                  <Input type="number" {...register('reminderDays')} min={0} max={30} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Audience</label>
                  <select
                    {...register('audience')}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500"
                  >
                    {TARGET_ROLE_OPTIONS.map((role) => (
                      <option key={role} value={role}>{role.replace('_', ' ')}</option>
                    ))}
                    <option value="ALL">Everyone</option>
                  </select>
                </div>
                <label className="flex items-center gap-2 mt-6">
                  <input type="checkbox" {...register('isExtendable')} />
                  <span className="text-sm text-neutral-700">Extension allowed</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="secondary" onClick={closeModals}>Cancel</Button>
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
