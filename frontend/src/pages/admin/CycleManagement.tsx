import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Calendar,
  Plus,
  Search,
  Clock,
  Users,
  FileText,
  ChevronRight,
  Play,
  Pause,
  CheckCircle,
  Archive,
  Settings,
  AlertTriangle,
  Sparkles,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import {
  useFYPCycles,
  useUpdateCycle,
  useCycleTemplate,
  useCreateCycleFromTemplate,
} from '@/lib/hooks/useAdmin'
import { Modal, ModalHeader, ModalTitle, ModalBody, ModalFooter } from '@/components/ui/Modal'
import { useSuccessToast, useErrorToast } from '@/components/ui/Toast'
import { ROUTES } from '@/lib/constants/routes'
import { cn } from '@/lib/utils/cn'
import type { CycleStatus, FYPCycle } from '@/types'

type StatusEntry = { label: string; color: string; bgColor: string; borderColor: string; icon: typeof Clock }
type TypeEntry = { label: string; color: string; bgColor: string }

const DEFAULT_STATUS: StatusEntry = { label: 'Unknown', color: 'text-neutral-500', bgColor: 'bg-neutral-50', borderColor: 'border-neutral-200', icon: Clock }
const DEFAULT_TYPE: TypeEntry = { label: 'Unknown', color: 'text-neutral-600', bgColor: 'bg-neutral-100' }

const statusConfig: Record<string, StatusEntry> = {
  DRAFT: { label: 'Draft', color: 'text-amber-700', bgColor: 'bg-amber-100', borderColor: 'border-amber-200', icon: Settings },
  PLANNING: { label: 'Planning', color: 'text-amber-700', bgColor: 'bg-amber-100', borderColor: 'border-amber-200', icon: Settings },
  UPCOMING: { label: 'Upcoming', color: 'text-sky-700', bgColor: 'bg-sky-100', borderColor: 'border-sky-200', icon: Clock },
  ACTIVE: { label: 'Active', color: 'text-emerald-700', bgColor: 'bg-emerald-100', borderColor: 'border-emerald-200', icon: Play },
  PAUSED: { label: 'Paused', color: 'text-warning-600', bgColor: 'bg-warning-50', borderColor: 'border-warning-200', icon: Pause },
  COMPLETED: { label: 'Completed', color: 'text-stone-600', bgColor: 'bg-stone-100', borderColor: 'border-stone-200', icon: CheckCircle },
  ARCHIVED: { label: 'Archived', color: 'text-neutral-500', bgColor: 'bg-neutral-50', borderColor: 'border-neutral-200', icon: Archive },
}

const typeConfig: Record<string, TypeEntry> = {
  FYP1: { label: 'FYP 1', color: 'text-violet-700', bgColor: 'bg-violet-100' },
  FYP2: { label: 'FYP 2', color: 'text-teal-700', bgColor: 'bg-teal-100' },
  SHORT_SEM: { label: 'Short Semester', color: 'text-warning-600', bgColor: 'bg-warning-50' },
}

const getStatusConfig = (key: string | undefined): StatusEntry => (key && statusConfig[key]) || DEFAULT_STATUS
const getTypeConfig = (key: string | undefined): TypeEntry => (key && typeConfig[key]) || DEFAULT_TYPE

export function CycleManagement() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<CycleStatus | 'ALL'>('ALL')
  const [templateOpen, setTemplateOpen] = useState(false)
  const [tplPhase, setTplPhase] = useState<'FYP1' | 'FYP2'>('FYP1')
  const [tplForm, setTplForm] = useState({
    cycleCode: '',
    academicYear: '',
    semester: 1,
    startDate: '',
    endDate: '',
  })

  const { data, isLoading } = useFYPCycles(
    statusFilter !== 'ALL' ? statusFilter : undefined
  )
  const updateMutation = useUpdateCycle()
  const { data: templateData } = useCycleTemplate(tplPhase)
  const fromTemplateMutation = useCreateCycleFromTemplate()
  const successToast = useSuccessToast()
  const errorToast = useErrorToast()

  const handleCreateFromTemplate = async () => {
    if (!tplForm.cycleCode || !tplForm.academicYear || !tplForm.startDate || !tplForm.endDate) {
      errorToast('Missing fields', 'Please fill in all fields.')
      return
    }
    try {
      const result = await fromTemplateMutation.mutateAsync({
        phase: tplPhase,
        cycleCode: tplForm.cycleCode,
        academicYear: tplForm.academicYear,
        semester: tplForm.semester,
        startDate: tplForm.startDate,
        endDate: tplForm.endDate,
      })
      successToast(
        'Cycle created',
        `${tplForm.cycleCode} created with ${result.deadlinesCreated} deadlines.`
      )
      setTemplateOpen(false)
      setTplForm({ cycleCode: '', academicYear: '', semester: 1, startDate: '', endDate: '' })
    } catch (e) {
      errorToast('Create failed', (e as Error).message)
    }
  }

  const filteredCycles = data?.cycles.filter((cycle) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      cycle.name.toLowerCase().includes(query) ||
      cycle.academicYear.toLowerCase().includes(query)
    )
  })

  const handleStatusChange = async (cycle: FYPCycle, newStatus: CycleStatus) => {
    try {
      await updateMutation.mutateAsync({
        cycleId: cycle.cycleId,
        data: { status: newStatus },
      })
    } catch (error) {
      console.error('Failed to update cycle status:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    )
  }

  const activeCycle = data?.cycles.find((c) => c.status === 'ACTIVE')
  const stats = {
    total: data?.cycles.length ?? 0,
    active: data?.cycles.filter((c) => c.status === 'ACTIVE').length ?? 0,
    upcoming: data?.cycles.filter((c) => c.status === 'PLANNING').length ?? 0,
    completed: data?.cycles.filter((c) => c.status === 'COMPLETED').length ?? 0,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative bg-gradient-to-br from-stone-800 via-stone-800 to-stone-900 rounded-2xl p-6 text-white shadow-xl overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-amber-500/20 rounded-xl ring-1 ring-amber-500/30 flex items-center justify-center">
              <Calendar className="h-7 w-7 text-amber-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                FYP Cycle Management
                <Sparkles className="h-5 w-5 text-amber-400" />
              </h1>
              <p className="text-stone-300 mt-1">
                Manage academic cycles, semesters, and FYP periods
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              onClick={() => setTemplateOpen(true)}
              className="bg-emerald-500 hover:bg-emerald-600 text-white border-0"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Use Cycle Template
            </Button>
            <Link to={ROUTES.ADMIN.CYCLE_NEW}>
              <Button className="bg-amber-500 hover:bg-amber-600 text-white border-0">
                <Plus className="h-4 w-4 mr-2" />
                Create Cycle
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Cycle template modal — supports FYP1 and FYP2 */}
      <Modal isOpen={templateOpen} onClose={() => setTemplateOpen(false)} size="lg">
        <ModalHeader>
          <ModalTitle>Create {tplPhase} Cycle from Standard Template</ModalTitle>
        </ModalHeader>
        <ModalBody>
          <div className="mb-4">
            <label className="block text-sm font-medium text-neutral-700 mb-2">Phase</label>
            <div className="flex gap-2">
              {(['FYP1', 'FYP2'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setTplPhase(p)}
                  className={cn(
                    'px-4 py-2 rounded-md text-sm font-medium border transition-colors',
                    tplPhase === p
                      ? 'bg-emerald-500 text-white border-emerald-500'
                      : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-50'
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <p className="text-sm text-neutral-600 mb-4">
            This creates a new {tplPhase} cycle plus the{' '}
            {templateData?.deadlines.length ?? 0} standard deadlines from the official workflow,
            scheduled relative to your start date.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <Input
              label="Cycle code"
              value={tplForm.cycleCode}
              onChange={(e) => setTplForm({ ...tplForm, cycleCode: e.target.value })}
              placeholder={`${tplPhase}-2025-S1`}
            />
            <Input
              label="Academic year"
              value={tplForm.academicYear}
              onChange={(e) => setTplForm({ ...tplForm, academicYear: e.target.value })}
              placeholder="2025/2026"
            />
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Semester</label>
              <select
                value={tplForm.semester}
                onChange={(e) => setTplForm({ ...tplForm, semester: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value={1}>Sem 1</option>
                <option value={2}>Sem 2</option>
                <option value={3}>Sem 3 (Short)</option>
              </select>
            </div>
            <Input
              type="date"
              label="Start date"
              value={tplForm.startDate}
              onChange={(e) => setTplForm({ ...tplForm, startDate: e.target.value })}
            />
            <Input
              type="date"
              label="End date"
              value={tplForm.endDate}
              onChange={(e) => setTplForm({ ...tplForm, endDate: e.target.value })}
            />
          </div>
          {templateData && (
            <div className="border border-neutral-200 rounded-lg overflow-hidden">
              <div className="px-3 py-2 bg-neutral-50 border-b border-neutral-200 text-sm font-medium text-neutral-700">
                Deadlines that will be auto-created
              </div>
              <ul className="divide-y divide-neutral-100">
                {templateData.deadlines.map((d) => (
                  <li key={d.title} className="px-3 py-2 text-sm flex items-center justify-between">
                    <span className="text-neutral-800">{d.title}</span>
                    <span className="text-xs text-neutral-500">
                      Day {d.dayOffset >= 0 ? '+' : ''}
                      {d.dayOffset} • {d.audience}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setTemplateOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleCreateFromTemplate}
            disabled={fromTemplateMutation.isPending}
          >
            {fromTemplateMutation.isPending ? <Spinner size="sm" className="mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
            Create cycle &amp; deadlines
          </Button>
        </ModalFooter>
      </Modal>

      {/* Current Active Cycle Banner */}
      {activeCycle && (
        <Card className="p-4 border-l-4 border-l-emerald-500 bg-gradient-to-r from-emerald-50 to-emerald-100 border-emerald-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-200 rounded-lg">
                <Play className="h-5 w-5 text-emerald-700" />
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900">
                  Active Cycle: {activeCycle.name}
                </h3>
                <p className="text-sm text-neutral-600">
                  {activeCycle.academicYear} • {getTypeConfig(activeCycle.type).label}
                </p>
              </div>
            </div>
            <div className="text-sm text-neutral-600">
              <span className="font-medium">{activeCycle.totalStudents}</span> students enrolled
            </div>
          </div>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card
          className={cn(
            'p-4 cursor-pointer transition-colors',
            statusFilter === 'ALL' ? 'ring-2 ring-primary-500' : 'hover:bg-neutral-50'
          )}
          onClick={() => setStatusFilter('ALL')}
        >
          <p className="text-sm text-neutral-500">Total Cycles</p>
          <p className="text-2xl font-bold text-neutral-900">{stats.total}</p>
        </Card>
        <Card
          className={cn(
            'p-4 cursor-pointer transition-colors',
            statusFilter === 'ACTIVE' ? 'ring-2 ring-primary-500' : 'hover:bg-neutral-50'
          )}
          onClick={() => setStatusFilter(statusFilter === 'ACTIVE' ? 'ALL' : 'ACTIVE')}
        >
          <p className="text-sm text-neutral-500">Active</p>
          <p className="text-2xl font-bold text-success-600">{stats.active}</p>
        </Card>
        <Card
          className={cn(
            'p-4 cursor-pointer transition-colors',
            statusFilter === 'PLANNING' ? 'ring-2 ring-primary-500' : 'hover:bg-neutral-50'
          )}
          onClick={() => setStatusFilter(statusFilter === 'PLANNING' ? 'ALL' : 'PLANNING')}
        >
          <p className="text-sm text-neutral-500">Upcoming</p>
          <p className="text-2xl font-bold text-info-600">{stats.upcoming}</p>
        </Card>
        <Card
          className={cn(
            'p-4 cursor-pointer transition-colors',
            statusFilter === 'COMPLETED' ? 'ring-2 ring-primary-500' : 'hover:bg-neutral-50'
          )}
          onClick={() => setStatusFilter(statusFilter === 'COMPLETED' ? 'ALL' : 'COMPLETED')}
        >
          <p className="text-sm text-neutral-500">Completed</p>
          <p className="text-2xl font-bold text-primary-600">{stats.completed}</p>
        </Card>
      </div>

      {/* Search & Filters */}
      <div className="bg-gradient-to-r from-stone-100 to-stone-50 rounded-xl p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <Input
              type="text"
              placeholder="Search by cycle name or academic year..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as CycleStatus | 'ALL')}
            className="px-3 py-2 border border-neutral-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500"
          >
            <option value="ALL">All Status</option>
            <option value="DRAFT">Draft</option>
            <option value="UPCOMING">Upcoming</option>
            <option value="ACTIVE">Active</option>
            <option value="PAUSED">Paused</option>
            <option value="COMPLETED">Completed</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>
      </div>

      {/* Cycles List */}
      <div className="space-y-4">
        {filteredCycles && filteredCycles.length > 0 ? (
          filteredCycles.map((cycle) => {
            const status = getStatusConfig(cycle.status)
            const type = getTypeConfig(cycle.type)
            const StatusIcon = status.icon

            return (
              <Card key={cycle.cycleId} className="p-5 hover:shadow-lg hover:scale-[1.01] transition-all duration-300">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={cn('p-3 rounded-lg', status.bgColor)}>
                      <StatusIcon className={cn('h-6 w-6', status.color)} />
                    </div>

                    {/* Content */}
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-neutral-900">{cycle.name}</h3>
                        <span className={cn(
                          'px-2 py-0.5 rounded-xl text-xs font-medium border',
                          status.bgColor,
                          status.color,
                          status.borderColor
                        )}>
                          {status.label}
                        </span>
                        <span className={cn(
                          'px-2 py-0.5 rounded-xl text-xs font-medium',
                          type.bgColor,
                          type.color
                        )}>
                          {type.label}
                        </span>
                      </div>

                      <p className="text-sm text-neutral-500 mt-1">
                        {cycle.academicYear} • Semester {cycle.semester}
                      </p>

                      {/* Dates */}
                      <div className="flex items-center gap-4 mt-2 text-sm text-neutral-600">
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {new Date(cycle.startDate).toLocaleDateString()} - {new Date(cycle.endDate).toLocaleDateString()}
                        </span>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-4 mt-3">
                        <div className="flex items-center gap-1.5 text-sm">
                          <Users className="h-4 w-4 text-neutral-400" />
                          <span className="font-medium text-neutral-900">{cycle.totalStudents}</span>
                          <span className="text-neutral-500">students</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-sm">
                          <FileText className="h-4 w-4 text-neutral-400" />
                          <span className="font-medium text-neutral-900">{cycle.totalProposals}</span>
                          <span className="text-neutral-500">proposals</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-sm">
                          <Calendar className="h-4 w-4 text-neutral-400" />
                          <span className="font-medium text-neutral-900">{cycle.deadlines?.length || 0}</span>
                          <span className="text-neutral-500">deadlines</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {/* Status Actions — workflow: PLANNING → ACTIVE → COMPLETED → ARCHIVED */}
                    {cycle.status === 'PLANNING' && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleStatusChange(cycle, 'ACTIVE')}
                        disabled={updateMutation.isPending}
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Start
                      </Button>
                    )}
                    {cycle.status === 'ACTIVE' && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleStatusChange(cycle, 'COMPLETED')}
                        disabled={updateMutation.isPending}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Complete
                      </Button>
                    )}
                    {cycle.status === 'COMPLETED' && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleStatusChange(cycle, 'ARCHIVED')}
                        disabled={updateMutation.isPending}
                      >
                        <Archive className="h-4 w-4 mr-1" />
                        Archive
                      </Button>
                    )}

                    {/* View Details */}
                    <Link to={ROUTES.ADMIN.CYCLE_DETAIL.replace(':id', cycle.cycleId)}>
                      <Button variant="ghost" size="sm">
                        <ChevronRight className="h-5 w-5" />
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* Warnings */}
                {cycle.status === 'ACTIVE' && (!cycle.deadlines || cycle.deadlines.length === 0) && (
                  <div className="mt-4 p-3 bg-warning-50 rounded-lg flex items-center gap-2 text-sm text-warning-700">
                    <AlertTriangle className="h-4 w-4" />
                    No deadlines configured for this cycle. Students won't have clear submission dates.
                  </div>
                )}
              </Card>
            )
          })
        ) : (
          <Card className="p-12 text-center">
            <Calendar className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-neutral-900">No cycles found</h3>
            <p className="text-neutral-500 mt-1">
              {searchQuery || statusFilter !== 'ALL'
                ? 'Try adjusting your filters'
                : 'Create your first FYP cycle to get started'}
            </p>
            {!searchQuery && statusFilter === 'ALL' && (
              <Link to={ROUTES.ADMIN.CYCLE_NEW} className="mt-4 inline-block">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Cycle
                </Button>
              </Link>
            )}
          </Card>
        )}
      </div>
    </div>
  )
}
