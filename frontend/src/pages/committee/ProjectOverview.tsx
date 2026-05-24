import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  FolderKanban, Search, Users, UserX, AlertTriangle, ChevronRight,
  Download, GraduationCap, User, ChevronDown,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import { Pagination } from '@/components/ui/Pagination'
import {
  useProjectOverview, useCommitteeCycles, useExportProjects,
} from '@/lib/hooks/useCommittee'
import { ROUTES } from '@/lib/constants/routes'
import { cn } from '@/lib/utils/cn'
import type { CommitteeProjectStatus, PairingStatus, CycleSummary } from '@/types'
import type { CycleStatus } from '@/types/committee'

type StatusEntry = { label: string; color: string; bgColor: string }
const DEFAULT: StatusEntry = { label: 'Unknown', color: 'text-neutral-600', bgColor: 'bg-neutral-100' }

const projectStatusConfig: Record<string, StatusEntry> = {
  ACTIVE: { label: 'Active', color: 'text-sky-600', bgColor: 'bg-sky-100' },
  COMPLETED: { label: 'Completed', color: 'text-emerald-600', bgColor: 'bg-emerald-100' },
  SUSPENDED: { label: 'Suspended', color: 'text-amber-600', bgColor: 'bg-amber-100' },
  DROPPED: { label: 'Dropped', color: 'text-rose-600', bgColor: 'bg-rose-100' },
}
const pairingStatusConfig: Record<string, StatusEntry> = {
  UNPAIRED: { label: 'Unpaired', color: 'text-rose-600', bgColor: 'bg-rose-100' },
  PENDING_APPROVAL: { label: 'Pending', color: 'text-amber-600', bgColor: 'bg-amber-100' },
  PAIRED: { label: 'Paired', color: 'text-emerald-600', bgColor: 'bg-emerald-100' },
}
const cycleStatusBadge: Record<CycleStatus, StatusEntry> = {
  ACTIVE: { label: 'Active', color: 'text-emerald-700', bgColor: 'bg-emerald-50' },
  PLANNING: { label: 'Planning', color: 'text-sky-700', bgColor: 'bg-sky-50' },
  COMPLETED: { label: 'Past', color: 'text-stone-600', bgColor: 'bg-stone-100' },
  ARCHIVED: { label: 'Archived', color: 'text-stone-500', bgColor: 'bg-stone-100' },
}
const riskConfig = {
  LOW: { label: 'Low Risk', color: 'text-emerald-600', bgColor: 'bg-emerald-100' },
  MEDIUM: { label: 'Medium Risk', color: 'text-amber-600', bgColor: 'bg-amber-100' },
  HIGH: { label: 'High Risk', color: 'text-rose-600', bgColor: 'bg-rose-100' },
}

const get = (table: Record<string, StatusEntry>, key: string | undefined): StatusEntry =>
  (key && table[key]) || DEFAULT

type CycleChoice =
  | { kind: 'active' }
  | { kind: 'all' }
  | { kind: 'specific'; cycleId: number }

function describeCycle(c: CycleSummary): string {
  const sem = c.semester ? ` Sem ${c.semester}` : ''
  const status = cycleStatusBadge[c.status].label
  return `${c.cycleType} · ${c.academicYear}${sem} · ${status}`
}

export function ProjectOverview() {
  const [cycleChoice, setCycleChoice] = useState<CycleChoice>({ kind: 'active' })
  const [statusFilter, setStatusFilter] = useState<CommitteeProjectStatus | 'ALL'>('ALL')
  const [pairingFilter, setPairingFilter] = useState<PairingStatus | 'ALL'>('ALL')
  const [riskFilter, setRiskFilter] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'ALL'>('ALL')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(20)
  const [exportOpen, setExportOpen] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(0) }, 300)
    return () => clearTimeout(t)
  }, [searchInput])

  const cyclesQuery = useCommitteeCycles()
  const cycles = cyclesQuery.data?.cycles ?? []

  const filterPayload = useMemo(() => ({
    cycleId: cycleChoice.kind === 'specific' ? cycleChoice.cycleId : undefined,
    cycleStatus: cycleChoice.kind === 'active' ? ('ACTIVE' as const)
      : cycleChoice.kind === 'all' ? undefined : undefined,
    projectStatus: statusFilter === 'ALL' ? undefined : statusFilter,
    pairingStatus: pairingFilter === 'ALL' ? undefined : pairingFilter,
    riskLevel: riskFilter === 'ALL' ? undefined : riskFilter,
    search: search || undefined,
  }), [cycleChoice, statusFilter, pairingFilter, riskFilter, search])

  const { data, isLoading, isFetching } = useProjectOverview({ ...filterPayload, page, size })
  const exportMutation = useExportProjects()

  // Stat cards reflect the whole cycle population (scoped only by cycle selection,
  // NOT by the user's pairing/status/risk filters). Each query asks size=1 so the
  // response is tiny — we only read totalElements.
  const pairedCountQuery = useProjectOverview({
    cycleId: filterPayload.cycleId,
    cycleStatus: filterPayload.cycleStatus,
    pairingStatus: 'PAIRED',
    size: 1,
  })
  const unpairedCountQuery = useProjectOverview({
    cycleId: filterPayload.cycleId,
    cycleStatus: filterPayload.cycleStatus,
    pairingStatus: 'UNPAIRED',
    size: 1,
  })
  const highRiskCountQuery = useProjectOverview({
    cycleId: filterPayload.cycleId,
    cycleStatus: filterPayload.cycleStatus,
    riskLevel: 'HIGH',
    size: 1,
  })

  const stats = useMemo(() => ({
    total: data?.total ?? 0,
    paired: pairedCountQuery.data?.total ?? 0,
    unpaired: unpairedCountQuery.data?.total ?? 0,
    highRisk: highRiskCountQuery.data?.total ?? 0,
  }), [data, pairedCountQuery.data, unpairedCountQuery.data, highRiskCountQuery.data])

  const handleExport = (format: 'CSV' | 'XLSX' | 'PDF') => {
    setExportOpen(false)
    exportMutation.mutate({ format, filters: filterPayload })
  }

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[400px]"><Spinner size="lg" /></div>
  }

  return (
    <div className="space-y-3 lg:space-y-4">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-stone-800 via-stone-800 to-stone-900 p-3 sm:p-4 text-white shadow-md">
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-9 h-9 bg-amber-500/20 rounded-lg flex items-center justify-center ring-1 ring-amber-500/30">
              <FolderKanban className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-white leading-tight">Project & Pairing Overview</h1>
              <p className="text-stone-300 text-xs">Monitor all FYP projects and student-supervisor pairings</p>
            </div>
          </div>
          <div className="flex gap-2 relative">
            <Link to={ROUTES.COMMITTEE.UNPAIRED_STUDENTS}>
              <Button variant="secondary" className="border-stone-600 text-stone-200 hover:bg-stone-700">
                <UserX className="h-4 w-4 mr-2" />
                Unpaired ({stats.unpaired})
              </Button>
            </Link>
            <div className="relative">
              <Button
                type="button"
                onClick={() => setExportOpen(o => !o)}
                disabled={exportMutation.isPending}
                className="bg-amber-500 hover:bg-amber-600 text-white"
              >
                {exportMutation.isPending ? <Spinner size="sm" className="mr-2" /> : <Download className="h-4 w-4 mr-2" />}
                Export <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
              {exportOpen && (
                <div className="absolute right-0 top-full mt-1 bg-white border border-stone-200 rounded-md shadow-lg z-10 min-w-[140px]">
                  {(['CSV','XLSX','PDF'] as const).map(f => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => handleExport(f)}
                      className="block w-full text-left px-3 py-2 text-sm text-stone-700 hover:bg-stone-50"
                    >Export {f}</button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 text-center border-l-4 border-l-stone-400">
          <p className="text-3xl font-bold text-stone-800">{stats.total}</p>
          <p className="text-sm text-stone-600 font-medium">Total Projects</p>
        </Card>
        <Card className="p-4 text-center border-l-4 border-l-emerald-500">
          <p className="text-3xl font-bold text-emerald-600">{stats.paired}</p>
          <p className="text-sm text-stone-600 font-medium">Paired Students</p>
        </Card>
        <Card className="p-4 text-center border-l-4 border-l-rose-500">
          <p className="text-3xl font-bold text-rose-600">{stats.unpaired}</p>
          <p className="text-sm text-stone-600 font-medium">Unpaired Students</p>
        </Card>
        <Card className="p-4 text-center border-l-4 border-l-amber-500">
          <p className="text-3xl font-bold text-amber-600">{stats.highRisk}</p>
          <p className="text-sm text-stone-600 font-medium">High Risk</p>
        </Card>
      </div>

      <Card className="p-4 bg-gradient-to-r from-stone-100 to-stone-50">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <Input
              type="text"
              placeholder="Search by title, student, or supervisor..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={cycleChoice.kind === 'specific' ? `id:${cycleChoice.cycleId}` : cycleChoice.kind}
              onChange={(e) => {
                const v = e.target.value
                setPage(0)
                if (v === 'active') setCycleChoice({ kind: 'active' })
                else if (v === 'all') setCycleChoice({ kind: 'all' })
                else setCycleChoice({ kind: 'specific', cycleId: Number(v.slice(3)) })
              }}
              className="px-3 py-2 border border-stone-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 bg-white"
            >
              <option value="active">All Active Cycles</option>
              <option value="all">All Cycles (incl. past)</option>
              {cycles.map(c => (
                <option key={c.cycleId} value={`id:${c.cycleId}`}>{describeCycle(c)}</option>
              ))}
            </select>
            <select
              value={pairingFilter}
              onChange={(e) => { setPairingFilter(e.target.value as PairingStatus | 'ALL'); setPage(0) }}
              className="px-3 py-2 border border-stone-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 bg-white"
            >
              <option value="ALL">All Pairing Status</option>
              <option value="PAIRED">Paired</option>
              <option value="UNPAIRED">Unpaired</option>
              <option value="PENDING_APPROVAL">Pending</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value as CommitteeProjectStatus | 'ALL'); setPage(0) }}
              className="px-3 py-2 border border-stone-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 bg-white"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="COMPLETED">Completed</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="DROPPED">Dropped</option>
            </select>
            <select
              value={riskFilter}
              onChange={(e) => { setRiskFilter(e.target.value as 'LOW'|'MEDIUM'|'HIGH'|'ALL'); setPage(0) }}
              className="px-3 py-2 border border-stone-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 bg-white"
            >
              <option value="ALL">All Risk</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
        </div>
      </Card>

      <div className="flex gap-3">
        <Link to={ROUTES.COMMITTEE.SUPERVISOR_LOAD}>
          <Button variant="secondary" size="sm" className="border-stone-300 hover:bg-stone-100">
            <Users className="h-4 w-4 mr-2" />
            Supervisor Load Analysis
          </Button>
        </Link>
      </div>

      <div className={cn('grid grid-cols-1 lg:grid-cols-2 gap-2.5', isFetching && 'opacity-60')}>
        {(data?.projects ?? []).length > 0 ? (
          (data?.projects ?? []).map((project) => {
            const pairing = get(pairingStatusConfig, project.pairingStatus)
            const pStatus = get(projectStatusConfig, project.projectStatus)
            const risk = riskConfig[project.riskLevel]
            const cycleBadge = project.cycleStatus ? cycleStatusBadge[project.cycleStatus] : undefined
            return (
              <Link key={project.projectId} to={ROUTES.COMMITTEE.PROJECT_DETAIL.replace(':id', String(project.projectId))}>
                <Card className="group p-4 hover:shadow-lg transition-all duration-300 cursor-pointer border-l-4 border-l-stone-300">
                  <div className="flex items-center gap-4">
                    <div className="relative w-14 h-14 flex-shrink-0">
                      <svg className="w-14 h-14 transform -rotate-90">
                        <circle className="text-neutral-200" strokeWidth="4" stroke="currentColor" fill="transparent" r="24" cx="28" cy="28" />
                        <circle
                          className={cn(project.progress >= 70 ? 'text-emerald-500'
                            : project.progress >= 40 ? 'text-amber-500' : 'text-rose-500')}
                          strokeWidth="4"
                          strokeDasharray={`${project.progress * 1.51} 151`}
                          strokeLinecap="round" stroke="currentColor" fill="transparent" r="24" cx="28" cy="28"
                        />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold">{project.progress}%</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-semibold text-stone-800 line-clamp-1 group-hover:text-amber-700 transition-colors">
                            {project.title || 'Untitled Project'}
                          </h3>
                          <div className="flex items-center gap-3 mt-1 text-sm text-neutral-600">
                            <span className="flex items-center gap-1"><GraduationCap className="h-4 w-4" />{project.studentName}</span>
                            {project.supervisorName && (
                              <span className="flex items-center gap-1"><User className="h-4 w-4" />{project.supervisorName}</span>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-stone-300 group-hover:text-amber-500 group-hover:translate-x-1 transition-all flex-shrink-0" />
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', pairing.bgColor, pairing.color)}>{pairing.label}</span>
                        <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', pStatus.bgColor, pStatus.color)}>{pStatus.label}</span>
                        {project.cycleCode && (
                          <span className="px-2 py-0.5 bg-neutral-100 text-neutral-600 rounded-full text-xs font-medium">{project.cycleCode}</span>
                        )}
                        {project.programme && (
                          <span className="px-2 py-0.5 bg-neutral-100 text-neutral-600 rounded-full text-xs font-medium">{project.programme}</span>
                        )}
                        {cycleBadge && project.cycleStatus !== 'ACTIVE' && (
                          <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', cycleBadge.bgColor, cycleBadge.color)}>{cycleBadge.label}</span>
                        )}
                        {project.riskLevel !== 'LOW' && (
                          <span
                            className={cn('px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1', risk.bgColor, risk.color)}
                            title={project.riskFactors?.join(' · ')}
                          >
                            <AlertTriangle className="h-3 w-3" />
                            {risk.label}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            )
          })
        ) : (
          <Card className="text-center py-8 col-span-full">
            <h3 className="font-medium text-stone-800">No projects found</h3>
            <p className="text-neutral-500 mt-1">
              {search || cycleChoice.kind !== 'active' || statusFilter !== 'ALL' || pairingFilter !== 'ALL' || riskFilter !== 'ALL'
                ? 'Try adjusting your filters'
                : 'No projects have been registered in active cycles yet'}
            </p>
          </Card>
        )}
      </div>

      {data && data.total > 0 && (
        <Card className="p-4 bg-gradient-to-r from-stone-100 to-stone-50">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm text-stone-600">
              <span>Page size:</span>
              <select
                value={size}
                onChange={(e) => { setSize(Number(e.target.value)); setPage(0) }}
                className="px-2 py-1 border border-stone-200 rounded text-sm bg-white"
              >
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            <Pagination
              currentPage={page + 1}
              totalPages={Math.max(1, data.totalPages)}
              onPageChange={(p) => setPage(p - 1)}
              totalItems={data.total}
              pageSize={size}
            />
          </div>
        </Card>
      )}
    </div>
  )
}
