import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Users,
  Search,
  ChevronRight,
  GraduationCap,
  Calendar,
  FileText,
  TrendingUp,
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
    <div className="space-y-6">
      {/* Header - Gradient Style */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-stone-800 via-stone-800 to-stone-900 p-6 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-stone-600/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-14 h-14 bg-amber-500/20 rounded-xl flex items-center justify-center ring-1 ring-amber-500/30">
              <Users className="h-7 w-7 text-amber-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">My Supervisees</h1>
              <p className="text-stone-300 mt-1">Monitor and manage your supervised students</p>
            </div>
          </div>
          {atRiskCount > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-rose-500/20 backdrop-blur-sm rounded-xl ring-1 ring-rose-500/30">
              <AlertTriangle className="h-5 w-5 text-rose-400" />
              <span className="text-sm font-semibold text-rose-200">
                {atRiskCount} student{atRiskCount > 1 ? 's' : ''} at risk
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4 p-4 bg-gradient-to-r from-stone-100 to-stone-50 rounded-xl">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1 p-1 bg-white rounded-lg shadow-sm overflow-x-auto">
          {filterOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setStatusFilter(option.value)}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-lg transition-all whitespace-nowrap',
                statusFilter === option.value
                  ? 'bg-stone-800 text-white shadow-sm'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <Input
            type="text"
            placeholder="Search by name, ID, or project..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 border-stone-200 focus:ring-amber-500"
          />
        </div>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'name' | 'progress' | 'risk')}
          className="px-4 py-2 border border-stone-200 rounded-lg text-sm font-medium text-stone-700 focus:ring-2 focus:ring-amber-500 bg-white"
        >
          <option value="name">Sort by Name</option>
          <option value="progress">Sort by Progress</option>
          <option value="risk">Sort by Risk Level</option>
        </select>
      </div>

      {/* Supervisee List */}
      <div className="flex flex-col gap-4">
        {filteredSupervisees && filteredSupervisees.length > 0 ? (
          filteredSupervisees.map((supervisee) => {
            const status = getStatusConfig(supervisee.projectStatus)
            const risk = getRiskConfig(supervisee.riskLevel)
            return (
              <Link
                key={supervisee.superviseeId}
                to={ROUTES.SUPERVISOR.SUPERVISEE_DETAIL.replace(':id', supervisee.superviseeId)}
              >
                <Card className={cn(
                  'group p-5 hover:shadow-lg transition-all duration-300 cursor-pointer border-l-4',
                  (supervisee.riskLevel === 'HIGH' || supervisee.riskLevel === 'CRITICAL')
                    ? 'border-l-rose-500 bg-rose-50/30'
                    : status.borderColor,
                  'hover:scale-[1.01]'
                )}>
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="w-14 h-14 bg-gradient-to-br from-amber-100 to-amber-200 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                      <GraduationCap className="h-7 w-7 text-amber-600" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-stone-800 group-hover:text-amber-700 transition-colors">{supervisee.fullName}</h3>
                            <div className={cn('w-2.5 h-2.5 rounded-full ring-2 ring-white', risk.dotColor)} title={risk.label} />
                          </div>
                          <p className="text-sm text-stone-500">
                            {supervisee.studentId} | {supervisee.program} | Year {supervisee.year}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            'px-3 py-1.5 rounded-xl text-xs font-semibold',
                            status.bgColor,
                            status.color
                          )}>
                            {status.label}
                          </span>
                          <ChevronRight className="h-5 w-5 text-stone-300 group-hover:text-amber-500 group-hover:translate-x-1 transition-all" />
                        </div>
                      </div>

                      {/* Project Title */}
                      <h4 className="font-semibold text-stone-700 mt-2">{supervisee.projectTitle}</h4>

                      {/* Stats Row */}
                      <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
                        {/* Progress */}
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-stone-400" />
                          <div className="w-28 h-2.5 bg-stone-100 rounded-full overflow-hidden shadow-inner">
                            <div
                              className={cn(
                                'h-full rounded-full transition-all',
                                supervisee.overallProgress >= 75 ? 'bg-emerald-500' :
                                supervisee.overallProgress >= 50 ? 'bg-sky-500' :
                                supervisee.overallProgress >= 25 ? 'bg-amber-500' : 'bg-rose-500'
                              )}
                              style={{ width: `${supervisee.overallProgress}%` }}
                            />
                          </div>
                          <span className="text-stone-600 font-semibold">{supervisee.overallProgress}%</span>
                        </div>

                        {/* Meetings */}
                        <div className="flex items-center gap-1.5 text-stone-500 px-2 py-1 bg-stone-100 rounded-lg">
                          <Calendar className="h-4 w-4" />
                          <span>{supervisee.totalMeetings} meetings</span>
                        </div>

                        {/* Pending Logs */}
                        {supervisee.pendingLogs > 0 && (
                          <div className="flex items-center gap-1.5 text-amber-600 px-2 py-1 bg-amber-100 rounded-lg font-medium">
                            <FileText className="h-4 w-4" />
                            <span>{supervisee.pendingLogs} pending</span>
                          </div>
                        )}

                        {/* Last Meeting */}
                        {supervisee.lastMeetingDate && (
                          <div className="flex items-center gap-1 text-stone-400 text-xs">
                            <Clock className="h-3.5 w-3.5" />
                            <span>
                              Last: {new Date(supervisee.lastMeetingDate).toLocaleDateString('en-MY', {
                                day: 'numeric',
                                month: 'short',
                              })}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            )
          })
        ) : (
          <Card className="p-12 text-center">
            <div className="w-16 h-16 mx-auto bg-stone-100 rounded-full flex items-center justify-center mb-4">
              <Users className="h-8 w-8 text-stone-400" />
            </div>
            <h3 className="text-lg font-semibold text-stone-800">No supervisees found</h3>
            <p className="text-stone-500 mt-1">
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : "You don't have any supervisees yet"}
            </p>
          </Card>
        )}
      </div>

      {/* Summary Stats */}
      {data && data.supervisees.length > 0 && (
        <Card className="overflow-hidden">
          <div className="p-4 bg-gradient-to-r from-stone-50 to-stone-100/50 border-b border-stone-200">
            <h3 className="font-semibold text-stone-800">Supervisee Summary</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-5">
            <div className="text-center p-3 rounded-xl bg-stone-50">
              <p className="text-2xl font-bold text-stone-800">{data.total}</p>
              <p className="text-sm text-stone-500 font-medium">Total</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-sky-50">
              <p className="text-2xl font-bold text-sky-600">
                {data.supervisees.filter((s) => s.projectStatus === 'ACTIVE').length}
              </p>
              <p className="text-sm text-sky-700 font-medium">Active</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-amber-50">
              <p className="text-2xl font-bold text-amber-600">
                {data.supervisees.filter((s) => s.projectStatus === 'SUSPENDED').length}
              </p>
              <p className="text-sm text-amber-700 font-medium">Suspended</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-emerald-50">
              <p className="text-2xl font-bold text-emerald-600">
                {data.supervisees.filter((s) => s.projectStatus === 'COMPLETED').length}
              </p>
              <p className="text-sm text-emerald-700 font-medium">Completed</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-rose-50">
              <p className="text-2xl font-bold text-rose-600">{atRiskCount}</p>
              <p className="text-sm text-rose-700 font-medium">At Risk</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
