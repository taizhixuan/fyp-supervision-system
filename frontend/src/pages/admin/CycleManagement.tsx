import { useState } from 'react'
import {
  Calendar,
  Plus,
  Search,
  Clock,
  Users,
  Calendar as CalendarIcon,
  Play,
  CheckCircle,
  Archive,
  Settings,
  AlertTriangle,
  Sparkles,
  Trash2,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import {
  useFYPCycles,
  useCreateCycle,
  useCycleTemplate,
  useCycleStudents,
  useCreateCycleFromTemplate,
  useActivateCycle,
  useCompleteCycle,
  useArchiveCycle,
  useDeleteCycle,
} from '@/lib/hooks/useAdmin'
import { Modal, ModalHeader, ModalTitle, ModalBody, ModalFooter } from '@/components/ui/Modal'
import { useSuccessToast, useErrorToast } from '@/components/ui/Toast'
import { cn } from '@/lib/utils/cn'
import type { CycleStatus, FYPCycle, CycleType } from '@/types'

type StatusEntry = { label: string; color: string; bgColor: string; borderColor: string; icon: typeof Clock }
type TypeEntry = { label: string; color: string; bgColor: string }

const DEFAULT_STATUS: StatusEntry = { label: 'Unknown', color: 'text-neutral-500', bgColor: 'bg-neutral-50', borderColor: 'border-neutral-200', icon: Clock }
const DEFAULT_TYPE: TypeEntry = { label: 'Unknown', color: 'text-neutral-600', bgColor: 'bg-neutral-100' }

const statusConfig: Record<CycleStatus, StatusEntry> = {
  PLANNING: { label: 'Planning', color: 'text-amber-700', bgColor: 'bg-amber-100', borderColor: 'border-amber-200', icon: Settings },
  ACTIVE: { label: 'Active', color: 'text-emerald-700', bgColor: 'bg-emerald-100', borderColor: 'border-emerald-200', icon: Play },
  COMPLETED: { label: 'Completed', color: 'text-stone-600', bgColor: 'bg-stone-100', borderColor: 'border-stone-200', icon: CheckCircle },
  ARCHIVED: { label: 'Archived', color: 'text-neutral-500', bgColor: 'bg-neutral-50', borderColor: 'border-neutral-200', icon: Archive },
}

const typeConfig: Record<CycleType, TypeEntry> = {
  FYP1: { label: 'FYP 1', color: 'text-violet-700', bgColor: 'bg-violet-100' },
  FYP2: { label: 'FYP 2', color: 'text-teal-700', bgColor: 'bg-teal-100' },
}

const getStatusConfig = (key: string | undefined): StatusEntry =>
  (key && statusConfig[key as CycleStatus]) || DEFAULT_STATUS
const getTypeConfig = (key: string | undefined): TypeEntry =>
  (key && typeConfig[key as CycleType]) || DEFAULT_TYPE

interface CycleFormState {
  cycleCode: string
  cycleType: CycleType
  academicYear: string
  semester: number
  startDate: string
  endDate: string
}

const emptyForm = (): CycleFormState => ({
  cycleCode: '',
  cycleType: 'FYP1',
  academicYear: '',
  semester: 1,
  startDate: '',
  endDate: '',
})

export function CycleManagement() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<CycleStatus | 'ALL'>('ALL')
  const [templateOpen, setTemplateOpen] = useState(false)
  const [tplPhase, setTplPhase] = useState<CycleType>('FYP1')
  const [tplForm, setTplForm] = useState<CycleFormState>(emptyForm())

  const [createOpen, setCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState<CycleFormState>(emptyForm())
  const [detailCycle, setDetailCycle] = useState<FYPCycle | null>(null)

  const { data, isLoading } = useFYPCycles({
    status: statusFilter !== 'ALL' ? statusFilter : undefined,
  })
  const { data: templateData } = useCycleTemplate(tplPhase)
  const { data: detailData, isLoading: detailLoading } = useCycleStudents(
    detailCycle ? String(detailCycle.cycleId) : null,
    !!detailCycle,
  )
  const createMutation = useCreateCycle()
  const fromTemplateMutation = useCreateCycleFromTemplate()
  const activateMutation = useActivateCycle()
  const completeMutation = useCompleteCycle()
  const archiveMutation = useArchiveCycle()
  const deleteMutation = useDeleteCycle()
  const successToast = useSuccessToast()
  const errorToast = useErrorToast()

  const validateForm = (form: CycleFormState): string | null => {
    if (!form.cycleCode.trim()) return 'Cycle code is required.'
    if (!form.academicYear.trim()) return 'Academic year is required.'
    if (!form.startDate) return 'Start date is required.'
    if (!form.endDate) return 'End date is required.'
    if (form.endDate < form.startDate) return 'End date must be on or after start date.'
    return null
  }

  const handleCreate = async () => {
    const err = validateForm(createForm)
    if (err) {
      errorToast('Missing fields', err)
      return
    }
    try {
      await createMutation.mutateAsync({
        cycleCode: createForm.cycleCode,
        cycleType: createForm.cycleType,
        academicYear: createForm.academicYear,
        semester: createForm.semester,
        startDate: createForm.startDate,
        endDate: createForm.endDate,
      })
      successToast('Cycle created', `${createForm.cycleCode} is now in PLANNING.`)
      setCreateOpen(false)
      setCreateForm(emptyForm())
    } catch (e) {
      errorToast('Create failed', (e as Error).message)
    }
  }

  const handleCreateFromTemplate = async () => {
    const err = validateForm(tplForm)
    if (err) {
      errorToast('Missing fields', err)
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
      setTplForm(emptyForm())
    } catch (e) {
      errorToast('Create failed', (e as Error).message)
    }
  }

  const handleActivate = async (cycle: FYPCycle) => {
    try {
      const result = await activateMutation.mutateAsync(cycle.cycleId)
      const note = result.studentsAttached > 0
        ? ` ${result.studentsAttached} student${result.studentsAttached === 1 ? '' : 's'} attached.`
        : ''
      successToast('Cycle started', `${cycle.cycleCode || cycle.name} is now active.${note}`)
    } catch (e) {
      errorToast('Activation failed', (e as Error).message)
    }
  }

  const handleComplete = async (cycle: FYPCycle) => {
    try {
      await completeMutation.mutateAsync(cycle.cycleId)
      successToast('Cycle completed', `${cycle.cycleCode || cycle.name} marked as completed.`)
    } catch (e) {
      errorToast('Update failed', (e as Error).message)
    }
  }

  const handleArchive = async (cycle: FYPCycle) => {
    try {
      await archiveMutation.mutateAsync(cycle.cycleId)
      successToast('Cycle archived', `${cycle.cycleCode || cycle.name} archived.`)
    } catch (e) {
      errorToast('Update failed', (e as Error).message)
    }
  }

  const handleDelete = async (cycle: FYPCycle) => {
    if (!window.confirm(`Delete cycle ${cycle.cycleCode || cycle.name}? This cannot be undone.`)) return
    try {
      await deleteMutation.mutateAsync(cycle.cycleId)
      successToast('Cycle deleted', `${cycle.cycleCode || cycle.name} removed.`)
    } catch (e) {
      errorToast('Delete failed', (e as Error).message)
    }
  }

  const cycles = data?.cycles ?? []
  const filteredCycles = cycles.filter((cycle) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      (cycle.name || '').toLowerCase().includes(query) ||
      (cycle.cycleCode || '').toLowerCase().includes(query) ||
      (cycle.academicYear || '').toLowerCase().includes(query)
    )
  })

  const activeFyp1 = cycles.find((c) => c.status === 'ACTIVE' && c.type === 'FYP1')
  const activeFyp2 = cycles.find((c) => c.status === 'ACTIVE' && c.type === 'FYP2')

  const stats = {
    total: cycles.length,
    active: cycles.filter((c) => c.status === 'ACTIVE').length,
    planning: cycles.filter((c) => c.status === 'PLANNING').length,
    completed: cycles.filter((c) => c.status === 'COMPLETED').length,
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    )
  }

  const statChips = [
    { key: 'ALL', label: 'Total', value: stats.total, color: 'text-stone-200' },
    { key: 'ACTIVE', label: 'Active', value: stats.active, color: 'text-emerald-300' },
    { key: 'PLANNING', label: 'Planning', value: stats.planning, color: 'text-amber-300' },
    { key: 'COMPLETED', label: 'Completed', value: stats.completed, color: 'text-stone-300' },
  ] as const

  return (
    <div className="space-y-3 lg:space-y-4">
      {/* Compact hero with inline stat chips */}
      <div className="relative bg-gradient-to-br from-stone-800 via-stone-800 to-stone-900 rounded-xl p-3 sm:p-4 text-white shadow-md overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="relative flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex-shrink-0 w-9 h-9 bg-amber-500/20 rounded-lg flex items-center justify-center ring-1 ring-amber-500/30">
              <Calendar className="h-5 w-5 text-amber-400" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-white leading-tight">FYP Cycle Management</h1>
              <p className="text-stone-300 text-xs">One active FYP1 + one active FYP2 cycle at a time. Activating attaches all students.</p>
            </div>
          </div>
          <div className="flex gap-1.5">
            <Button
              type="button"
              size="sm"
              onClick={() => {
                setTplForm(emptyForm())
                setTemplateOpen(true)
              }}
              className="bg-emerald-500 hover:bg-emerald-600 text-white border-0"
            >
              <Sparkles className="h-3.5 w-3.5 mr-1" />
              Template
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                setCreateForm(emptyForm())
                setCreateOpen(true)
              }}
              className="bg-amber-500 hover:bg-amber-600 text-white border-0"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Create
            </Button>
          </div>
        </div>

        {/* Inline stat chips */}
        <div className="relative mt-3 grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {statChips.map((chip) => {
            const active = statusFilter === chip.key
            return (
              <button
                key={chip.key}
                type="button"
                onClick={() => setStatusFilter(chip.key === statusFilter && chip.key !== 'ALL' ? 'ALL' : (chip.key as CycleStatus | 'ALL'))}
                className={cn(
                  'flex items-center gap-2 rounded-md px-2 py-1.5 ring-1 transition-colors text-left',
                  active ? 'bg-amber-500/30 ring-amber-300/50' : 'bg-stone-700/40 ring-stone-600/40 hover:bg-stone-700/60'
                )}
              >
                <div className="min-w-0 flex-1">
                  <div className={cn('text-base font-bold leading-none', chip.color)}>{chip.value}</div>
                  <p className="text-[10px] text-stone-300 truncate uppercase tracking-wide">{chip.label}</p>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Active cycle banners */}
      <div className="grid gap-2 md:grid-cols-2">
        <ActiveCycleBanner cycle={activeFyp1} type="FYP1" />
        <ActiveCycleBanner cycle={activeFyp2} type="FYP2" />
      </div>

      {/* Search & Filters */}
      <Card padding="sm">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
            <Input
              type="text"
              placeholder="Search by code, name, or academic year..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-9 text-sm"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as CycleStatus | 'ALL')}
            className="px-2.5 h-9 border border-neutral-300 rounded-md text-sm focus:ring-2 focus:ring-amber-500"
          >
            <option value="ALL">All Status</option>
            <option value="PLANNING">Planning</option>
            <option value="ACTIVE">Active</option>
            <option value="COMPLETED">Completed</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>
      </Card>

      {/* Cycles List */}
      <div className="space-y-2.5">
        {filteredCycles.length > 0 ? (
          filteredCycles.map((cycle) => {
            const status = getStatusConfig(cycle.status)
            const type = getTypeConfig(cycle.type)
            const StatusIcon = status.icon
            const busy = activateMutation.isPending || completeMutation.isPending || archiveMutation.isPending || deleteMutation.isPending

            return (
              <Card key={cycle.cycleId} padding="sm" className="hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className={cn('p-1.5 rounded-md flex-shrink-0', status.bgColor)}>
                      <StatusIcon className={cn('h-4 w-4', status.color)} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="text-sm font-semibold text-neutral-900">{cycle.cycleCode || cycle.name}</h3>
                        <span className={cn('px-1.5 py-0 rounded text-[10px] font-medium border', status.bgColor, status.color, status.borderColor)}>
                          {status.label}
                        </span>
                        <span className={cn('px-1.5 py-0 rounded text-[10px] font-medium', type.bgColor, type.color)}>
                          {type.label}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-500">
                        {cycle.academicYear} · Semester {cycle.semester}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-neutral-600">
                        <span className="flex items-center gap-0.5">
                          <Clock className="h-3 w-3" />
                          {cycle.startDate ? new Date(cycle.startDate).toLocaleDateString() : '—'} →{' '}
                          {cycle.endDate ? new Date(cycle.endDate).toLocaleDateString() : '—'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Stat icon={<Users className="h-3 w-3 text-neutral-400" />} value={cycle.totalStudents} label="students" onClick={() => setDetailCycle(cycle)} />
                        <Stat icon={<CheckCircle className="h-3 w-3 text-neutral-400" />} value={cycle.pairedStudents} label="paired" onClick={() => setDetailCycle(cycle)} />
                        <Stat icon={<CalendarIcon className="h-3 w-3 text-neutral-400" />} value={cycle.deadlineCount} label="deadlines" onClick={() => setDetailCycle(cycle)} />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {cycle.status === 'PLANNING' && (
                      <>
                        <Button variant="secondary" size="sm" onClick={() => handleActivate(cycle)} disabled={busy} className="h-7 px-2 text-xs">
                          <Play className="h-3.5 w-3.5 mr-0.5" />
                          Start
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(cycle)} disabled={busy} className="text-rose-600 px-1.5">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    )}
                    {cycle.status === 'ACTIVE' && (
                      <Button variant="secondary" size="sm" onClick={() => handleComplete(cycle)} disabled={busy} className="h-7 px-2 text-xs">
                        <CheckCircle className="h-3.5 w-3.5 mr-0.5" />
                        Complete
                      </Button>
                    )}
                    {cycle.status === 'COMPLETED' && (
                      <Button variant="secondary" size="sm" onClick={() => handleArchive(cycle)} disabled={busy} className="h-7 px-2 text-xs">
                        <Archive className="h-3.5 w-3.5 mr-0.5" />
                        Archive
                      </Button>
                    )}
                  </div>
                </div>

                {cycle.status === 'ACTIVE' && cycle.deadlineCount === 0 && (
                  <div className="mt-2 px-2 py-1.5 bg-amber-50 rounded-md flex items-center gap-1.5 text-[11px] text-amber-700">
                    <AlertTriangle className="h-3 w-3" />
                    No deadlines configured for this cycle. Students won&apos;t see clear submission dates.
                  </div>
                )}
              </Card>
            )
          })
        ) : (
          <Card className="text-center py-8">
            <Calendar className="h-10 w-10 text-neutral-300 mx-auto mb-2" />
            <h3 className="text-sm font-medium text-neutral-900">No cycles found</h3>
            <p className="text-xs text-neutral-500 mt-1">
              {searchQuery || statusFilter !== 'ALL'
                ? 'Try adjusting your filters'
                : 'Create your first FYP cycle to get started'}
            </p>
            {!searchQuery && statusFilter === 'ALL' && (
              <Button
                size="sm"
                className="mt-3"
                onClick={() => {
                  setCreateForm(emptyForm())
                  setCreateOpen(true)
                }}
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Create Cycle
              </Button>
            )}
          </Card>
        )}
      </div>

      {/* Cycle roster + deadlines detail */}
      <Modal isOpen={!!detailCycle} onClose={() => setDetailCycle(null)} size="lg">
        <ModalHeader>
          <ModalTitle>{detailCycle?.cycleCode} — Students &amp; Deadlines</ModalTitle>
        </ModalHeader>
        <ModalBody>
          {detailLoading ? (
            <div className="flex justify-center py-8"><Spinner /></div>
          ) : (
            <div className="space-y-4">
              {/* Students */}
              <div>
                <h4 className="text-sm font-semibold text-neutral-900 mb-1.5 flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-neutral-400" />
                  Students ({detailData?.students.length ?? 0})
                  <span className="text-neutral-400 font-normal">· {detailData?.pairedStudents ?? 0} paired</span>
                </h4>
                {!detailData || detailData.students.length === 0 ? (
                  <p className="text-xs text-neutral-500">No students enrolled in this cycle yet.</p>
                ) : (
                  <div className="max-h-72 overflow-y-auto border border-neutral-200 rounded-md">
                    <table className="w-full text-xs">
                      <thead className="bg-neutral-50 text-neutral-500 sticky top-0">
                        <tr>
                          <th className="text-left px-2 py-1 font-medium">Name</th>
                          <th className="text-left px-2 py-1 font-medium">MMU ID</th>
                          <th className="text-left px-2 py-1 font-medium">Supervisor</th>
                          <th className="text-left px-2 py-1 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detailData.students.map((s) => (
                          <tr key={s.userId} className="border-t border-neutral-100">
                            <td className="px-2 py-1">
                              <div className="font-medium text-neutral-900">{s.fullName}</div>
                              <div className="text-[10px] text-neutral-400">{s.email}</div>
                            </td>
                            <td className="px-2 py-1 text-neutral-600">{s.mmuId || '—'}</td>
                            <td className="px-2 py-1">
                              {s.paired
                                ? <span className="text-neutral-700">{s.supervisorName}</span>
                                : <span className="text-amber-600">Unpaired</span>}
                            </td>
                            <td className="px-2 py-1 text-neutral-600">{s.projectStatus || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Deadlines */}
              <div>
                <h4 className="text-sm font-semibold text-neutral-900 mb-1.5 flex items-center gap-1.5">
                  <CalendarIcon className="h-4 w-4 text-neutral-400" />
                  Deadlines ({detailData?.deadlines.length ?? 0})
                </h4>
                {!detailData || detailData.deadlines.length === 0 ? (
                  <p className="text-xs text-neutral-500">No deadlines configured for this cycle.</p>
                ) : (
                  <ul className="space-y-1">
                    {detailData.deadlines.map((d) => (
                      <li key={d.deadlineId} className="flex items-center justify-between gap-2 text-xs border border-neutral-200 rounded px-2 py-1">
                        <span className="text-neutral-800 truncate">{d.title}</span>
                        <span className="text-neutral-500 flex-shrink-0">
                          {d.dueDate ? new Date(d.dueDate).toLocaleDateString() : '—'}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setDetailCycle(null)}>Close</Button>
        </ModalFooter>
      </Modal>

      {/* Create Cycle Modal (blank, no template) */}
      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} size="lg">
        <ModalHeader>
          <ModalTitle>Create FYP Cycle</ModalTitle>
        </ModalHeader>
        <ModalBody>
          <p className="text-sm text-neutral-600 mb-4">
            Creates a blank cycle in PLANNING status. Add deadlines yourself, or use the &ldquo;From Template&rdquo; option to scaffold the standard FYP1 / FYP2 timeline.
          </p>
          <CycleFormFields form={createForm} setForm={setCreateForm} showTypePicker />
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button onClick={handleCreate} disabled={createMutation.isPending}>
            {createMutation.isPending ? <Spinner size="sm" className="mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
            Create
          </Button>
        </ModalFooter>
      </Modal>

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
                  onClick={() => {
                    setTplPhase(p)
                    setTplForm({ ...tplForm, cycleType: p })
                  }}
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
            Creates a {tplPhase} cycle plus the {templateData?.deadlines.length ?? 0} standard deadlines from the official workflow, scheduled relative to your start date.
          </p>
          <CycleFormFields form={tplForm} setForm={setTplForm} />
          {templateData && (
            <div className="border border-neutral-200 rounded-lg overflow-hidden mt-4">
              <div className="px-3 py-2 bg-neutral-50 border-b border-neutral-200 text-sm font-medium text-neutral-700">
                Deadlines that will be auto-created
              </div>
              <ul className="divide-y divide-neutral-100">
                {templateData.deadlines.map((d) => (
                  <li key={d.title} className="px-3 py-2 text-sm flex items-center justify-between">
                    <span className="text-neutral-800">{d.title}</span>
                    <span className="text-xs text-neutral-500">
                      Day {d.dayOffset >= 0 ? '+' : ''}{d.dayOffset} • {d.audience}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setTemplateOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateFromTemplate} disabled={fromTemplateMutation.isPending}>
            {fromTemplateMutation.isPending ? <Spinner size="sm" className="mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
            Create cycle &amp; deadlines
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}

function ActiveCycleBanner({ cycle, type }: { cycle: FYPCycle | undefined; type: CycleType }) {
  const typeStyle = getTypeConfig(type)
  if (!cycle) {
    return (
      <Card padding="sm" className="border border-dashed border-neutral-300 bg-neutral-50">
        <div className="flex items-center gap-2">
          <div className={cn('p-1 rounded', typeStyle.bgColor)}>
            <Calendar className={cn('h-3.5 w-3.5', typeStyle.color)} />
          </div>
          <div>
            <p className="text-xs font-medium text-neutral-700">No active {typeStyle.label} cycle</p>
            <p className="text-[10px] text-neutral-500">Activate a PLANNING cycle to attach students.</p>
          </div>
        </div>
      </Card>
    )
  }
  return (
    <Card padding="sm" className="border-l-4 border-l-emerald-500 bg-gradient-to-r from-emerald-50 to-emerald-100/50 border-emerald-200">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1 bg-emerald-200 rounded">
            <Play className="h-3.5 w-3.5 text-emerald-700" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-neutral-900 truncate">
              Active {typeStyle.label}: {cycle.cycleCode || cycle.name}
            </h3>
            <p className="text-[11px] text-neutral-600">
              {cycle.academicYear} · Semester {cycle.semester}
            </p>
          </div>
        </div>
        <div className="text-right text-[11px] text-neutral-600 flex-shrink-0">
          <div><span className="font-bold">{cycle.totalStudents}</span> students</div>
          <div className="text-[10px] text-neutral-500">{cycle.deadlineCount} deadlines</div>
        </div>
      </div>
    </Card>
  )
}

function Stat({ icon, value, label, onClick }: { icon: React.ReactNode; value: number; label: string; onClick?: () => void }) {
  const inner = (
    <>
      {icon}
      <span className="font-medium text-neutral-900">{value}</span>
      <span className="text-neutral-500">{label}</span>
    </>
  )
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="flex items-center gap-1 text-[11px] -mx-1 px-1 rounded hover:bg-neutral-100 hover:text-primary-700 transition-colors cursor-pointer"
      >
        {inner}
      </button>
    )
  }
  return <div className="flex items-center gap-1 text-[11px]">{inner}</div>
}

function CycleFormFields({
  form,
  setForm,
  showTypePicker,
}: {
  form: CycleFormState
  setForm: (next: CycleFormState) => void
  showTypePicker?: boolean
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <Input
        label="Cycle code"
        value={form.cycleCode}
        onChange={(e) => setForm({ ...form, cycleCode: e.target.value })}
        placeholder={`${form.cycleType}-2025-S1`}
      />
      {showTypePicker ? (
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Type</label>
          <select
            value={form.cycleType}
            onChange={(e) => setForm({ ...form, cycleType: e.target.value as CycleType })}
            className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="FYP1">FYP 1</option>
            <option value="FYP2">FYP 2</option>
          </select>
        </div>
      ) : (
        <Input
          label="Academic year"
          value={form.academicYear}
          onChange={(e) => setForm({ ...form, academicYear: e.target.value })}
          placeholder="2025/2026"
        />
      )}
      {showTypePicker && (
        <Input
          label="Academic year"
          value={form.academicYear}
          onChange={(e) => setForm({ ...form, academicYear: e.target.value })}
          placeholder="2025/2026"
        />
      )}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1">Semester</label>
        <select
          value={form.semester}
          onChange={(e) => setForm({ ...form, semester: Number(e.target.value) })}
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
        value={form.startDate}
        onChange={(e) => setForm({ ...form, startDate: e.target.value })}
      />
      <Input
        type="date"
        label="End date"
        value={form.endDate}
        onChange={(e) => setForm({ ...form, endDate: e.target.value })}
      />
    </div>
  )
}
