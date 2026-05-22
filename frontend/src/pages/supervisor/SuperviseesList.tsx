import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Users,
  Search,
  ChevronRight,
  GraduationCap,
  Calendar,
  FileText,
  AlertTriangle,
  Clock,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import { useSupervisees } from '@/lib/hooks/useSupervisor'
import { ROUTES } from '@/lib/constants/routes'
import { cn } from '@/lib/utils/cn'

type StatusEntry = { label: string; color: string; bgColor: string; borderColor: string }
type RiskEntry = { label: string; color: string; bgColor: string; dotColor: string }

const DEFAULT_STATUS: StatusEntry = { label: 'Unknown', color: 'text-neutral-600', bgColor: 'bg-neutral-100', borderColor: 'border-l-neutral-400' }
const DEFAULT_RISK: RiskEntry = { label: 'Unknown', color: 'text-neutral-600', bgColor: 'bg-neutral-50', dotColor: 'bg-neutral-400' }

const statusConfig: Record<string, StatusEntry> = {
  ACTIVE: { label: 'Active', color: 'text-sky-600', bgColor: 'bg-sky-100', borderColor: 'border-l-sky-500' },
  COMPLETED: { label: 'Completed', color: 'text-emerald-600', bgColor: 'bg-emerald-100', borderColor: 'border-l-emerald-500' },
  SUSPENDED: { label: 'Suspended', color: 'text-amber-600', bgColor: 'bg-amber-100', borderColor: 'border-l-amber-500' },
  DROPPED: { label: 'Dropped', color: 'text-rose-600', bgColor: 'bg-rose-100', borderColor: 'border-l-rose-500' },
}

const riskConfig: Record<string, RiskEntry> = {
  LOW: { label: 'Low Risk', color: 'text-emerald-600', bgColor: 'bg-emerald-50', dotColor: 'bg-emerald-500' },
  MEDIUM: { label: 'Medium Risk', color: 'text-amber-600', bgColor: 'bg-amber-50', dotColor: 'bg-amber-500' },
  HIGH: { label: 'High Risk', color: 'text-orange-600', bgColor: 'bg-orange-50', dotColor: 'bg-orange-500' },
  CRITICAL: { label: 'Critical', color: 'text-rose-600', bgColor: 'bg-rose-50', dotColor: 'bg-rose-500' },
}

const getStatusConfig = (key: string | undefined): StatusEntry => (key && statusConfig[key]) || DEFAULT_STATUS
const getRiskConfig = (key: string | undefined): RiskEntry => (key && riskConfig[key]) || DEFAULT_RISK

const filterOptions = [
  { value: 'all', label: 'All Students' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'SUSPENDED', label: 'Suspended' },
  { value: 'at-risk', label: 'At Risk' },
]

export function SuperviseesList() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState<'name' | 'progress' | 'risk'>('name')

  const { data, isLoading } = useSupervisees()

  const filteredSupervisees = data?.supervisees
    .filter((supervisee) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return (
          supervisee.fullName.toLowerCase().includes(query) ||
          supervisee.projectTitle.toLowerCase().includes(query) ||
          supervisee.studentId.includes(query)
        )
      }
      return true
    })
    .filter((supervisee) => {
      if (statusFilter === 'all') return true
      if (statusFilter === 'at-risk') {
        return supervisee.riskLevel === 'HIGH' || supervisee.riskLevel === 'CRITICAL'
      }
      return supervisee.projectStatus === statusFilter
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.fullName.localeCompare(b.fullName)
        case 'progress':
          return b.overallProgress - a.overallProgress
        case 'risk':
          const riskOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }
          return riskOrder[a.riskLevel] - riskOrder[b.riskLevel]
        default:
          return 0
      }
    })

  const atRiskCount = data?.supervisees.filter(
    (s) => s.riskLevel === 'HIGH' || s.riskLevel === 'CRITICAL'
  ).length ?? 0

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-3 lg:space-y-4">
      {/* Compact Header — stats inline */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-stone-800 via-stone-800 to-stone-900 p-3 sm:p-4 text-white shadow-md">
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

        <div className="relative flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex-shrink-0 w-9 h-9 bg-amber-500/20 rounded-lg flex items-center justify-center ring-1 ring-amber-500/30">
              <Users className="h-5 w-5 text-amber-400" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-white leading-tight">My Supervisees</h1>
              <p className="text-stone-300 text-xs">Monitor and manage your supervised students</p>
            </div>
          </div>
          {atRiskCount > 0 && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-rose-500/20 backdrop-blur-sm rounded-md ring-1 ring-rose-500/30 flex-shrink-0">
              <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />
              <span className="text-xs font-semibold text-rose-200">
                {atRiskCount} at risk
              </span>
            </div>
          )}
        </div>

        {/* Inline stats */}
        {data && data.supervisees.length > 0 && (
          <div className="relative mt-3 grid grid-cols-5 gap-1.5 text-center">
            <div className="bg-stone-700/40 rounded-md px-2 py-1.5 ring-1 ring-stone-600/40">
              <div className="text-base font-bold leading-none">{data.total}</div>
              <p className="text-[10px] text-stone-300 mt-0.5 uppercase tracking-wide">Total</p>
            </div>
            <div className="bg-stone-700/40 rounded-md px-2 py-1.5 ring-1 ring-stone-600/40">
              <div className="text-base font-bold leading-none text-sky-300">
                {data.supervisees.filter((s) => s.projectStatus === 'ACTIVE').length}
              </div>
              <p className="text-[10px] text-stone-300 mt-0.5 uppercase tracking-wide">Active</p>
            </div>
            <div className="bg-stone-700/40 rounded-md px-2 py-1.5 ring-1 ring-stone-600/40">
              <div className="text-base font-bold leading-none text-amber-300">
                {data.supervisees.filter((s) => s.projectStatus === 'SUSPENDED').length}
              </div>
              <p className="text-[10px] text-stone-300 mt-0.5 uppercase tracking-wide">Suspended</p>
            </div>
            <div className="bg-stone-700/40 rounded-md px-2 py-1.5 ring-1 ring-stone-600/40">
              <div className="text-base font-bold leading-none text-emerald-300">
                {data.supervisees.filter((s) => s.projectStatus === 'COMPLETED').length}
              </div>
              <p className="text-[10px] text-stone-300 mt-0.5 uppercase tracking-wide">Done</p>
            </div>
            <div className={cn('rounded-md px-2 py-1.5 ring-1', atRiskCount > 0 ? 'bg-rose-500/30 ring-rose-300/40' : 'bg-stone-700/40 ring-stone-600/40')}>
              <div className="text-base font-bold leading-none text-rose-300">{atRiskCount}</div>
              <p className="text-[10px] text-stone-300 mt-0.5 uppercase tracking-wide">Risk</p>
            </div>
          </div>
        )}
      </div>

      {/* Filters — compact single row */}
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
              placeholder="Search by name, ID, or project..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 border-stone-200 focus:ring-amber-500"
            />
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'name' | 'progress' | 'risk')}
            className="px-2.5 py-1.5 border border-stone-200 rounded-md text-xs font-medium text-stone-700 focus:ring-2 focus:ring-amber-500 bg-white whitespace-nowrap"
          >
            <option value="name">Sort: Name</option>
            <option value="progress">Sort: Progress</option>
            <option value="risk">Sort: Risk</option>
          </select>
        </div>
      </Card>

      {/* Supervisee List — 2-col grid */}
      {filteredSupervisees && filteredSupervisees.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
          {filteredSupervisees.map((supervisee) => {
            const status = getStatusConfig(supervisee.projectStatus)
            const risk = getRiskConfig(supervisee.riskLevel)
            return (
              <Link
                key={supervisee.superviseeId}
                to={ROUTES.SUPERVISOR.SUPERVISEE_DETAIL.replace(':id', supervisee.superviseeId)}
              >
                <Card padding="sm" className={cn(
                  'group hover:shadow-md transition-all cursor-pointer border-l-4',
                  (supervisee.riskLevel === 'HIGH' || supervisee.riskLevel === 'CRITICAL')
                    ? 'border-l-rose-500 bg-rose-50/30'
                    : status.borderColor,
                )}>
                  <div className="flex items-start gap-2.5">
                    <div className="w-10 h-10 bg-gradient-to-br from-amber-100 to-amber-200 rounded-md flex items-center justify-center flex-shrink-0 shadow-sm">
                      <GraduationCap className="h-5 w-5 text-amber-600" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-semibold text-sm text-stone-800 group-hover:text-amber-700 leading-tight truncate">{supervisee.fullName}</h3>
                            <div className={cn('w-2 h-2 rounded-full flex-shrink-0', risk.dotColor)} title={risk.label} />
                          </div>
                          <p className="text-[11px] text-stone-500 truncate">
                            {supervisee.studentId} · {supervisee.program} · Y{supervisee.year}
                          </p>
                        </div>
                        <span className={cn(
                          'px-1.5 py-0.5 rounded-md text-[10px] font-semibold flex-shrink-0',
                          status.bgColor,
                          status.color
                        )}>
                          {status.label}
                        </span>
                      </div>

                      <h4 className="text-xs font-semibold text-stone-700 mt-1 line-clamp-1">{supervisee.projectTitle}</h4>

                      {/* Stats row */}
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px]">
                        <div className="flex items-center gap-1 flex-1 min-w-[80px]">
                          <div className="flex-1 h-1.5 bg-stone-100 rounded-full overflow-hidden">
                            <div
                              className={cn(
                                'h-full rounded-full',
                                supervisee.overallProgress >= 75 ? 'bg-emerald-500' :
                                supervisee.overallProgress >= 50 ? 'bg-sky-500' :
                                supervisee.overallProgress >= 25 ? 'bg-amber-500' : 'bg-rose-500'
                              )}
                              style={{ width: `${supervisee.overallProgress}%` }}
                            />
                          </div>
                          <span className="text-stone-600 font-semibold tabular-nums">{supervisee.overallProgress}%</span>
                        </div>
                        <span className="inline-flex items-center gap-0.5 text-stone-500">
                          <Calendar className="h-3 w-3" />
                          {supervisee.totalMeetings}
                        </span>
                        {supervisee.pendingLogs > 0 && (
                          <span className="inline-flex items-center gap-0.5 text-amber-700 bg-amber-100 px-1 rounded font-medium">
                            <FileText className="h-3 w-3" />
                            {supervisee.pendingLogs}
                          </span>
                        )}
                        {supervisee.lastMeetingDate && (
                          <span className="inline-flex items-center gap-0.5 text-stone-400">
                            <Clock className="h-3 w-3" />
                            {new Date(supervisee.lastMeetingDate).toLocaleDateString('en-MY', { day: 'numeric', month: 'short' })}
                          </span>
                        )}
                      </div>
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
          <Users className="h-10 w-10 text-stone-300 mx-auto mb-2" />
          <h3 className="font-medium text-stone-800 mb-1">No supervisees found</h3>
          <p className="text-sm text-stone-500">
            {searchQuery || statusFilter !== 'all'
              ? 'Try adjusting your filters'
              : "You don't have any supervisees yet"}
          </p>
        </Card>
      )}
    </div>
  )
}
