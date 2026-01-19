import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Users,
  Search,
  Filter,
  ChevronRight,
  GraduationCap,
  Calendar,
  FileText,
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import { useSupervisees } from '@/lib/hooks/useSupervisor'
import { ROUTES } from '@/lib/constants/routes'
import { cn } from '@/lib/utils/cn'
import type { ProjectStatus, Supervisee } from '@/types'

const statusConfig: Record<ProjectStatus, { label: string; color: string; bgColor: string }> = {
  NOT_STARTED: { label: 'Not Started', color: 'text-neutral-600', bgColor: 'bg-neutral-100' },
  IN_PROGRESS: { label: 'In Progress', color: 'text-primary-600', bgColor: 'bg-primary-50' },
  COMPLETED: { label: 'Completed', color: 'text-success-600', bgColor: 'bg-success-50' },
  ON_HOLD: { label: 'On Hold', color: 'text-warning-600', bgColor: 'bg-warning-50' },
  TERMINATED: { label: 'Terminated', color: 'text-error-600', bgColor: 'bg-error-50' },
}

const riskConfig = {
  LOW: { label: 'Low Risk', color: 'text-success-600', bgColor: 'bg-success-50', dotColor: 'bg-success-500' },
  MEDIUM: { label: 'Medium Risk', color: 'text-warning-600', bgColor: 'bg-warning-50', dotColor: 'bg-warning-500' },
  HIGH: { label: 'High Risk', color: 'text-orange-600', bgColor: 'bg-orange-50', dotColor: 'bg-orange-500' },
  CRITICAL: { label: 'Critical', color: 'text-error-600', bgColor: 'bg-error-50', dotColor: 'bg-error-500' },
}

const filterOptions = [
  { value: 'all', label: 'All Students' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'ON_HOLD', label: 'On Hold' },
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
            <Users className="h-7 w-7 text-primary-600" />
            My Supervisees
          </h1>
          <p className="text-neutral-600 mt-1">
            Monitor and manage your supervised students
          </p>
        </div>
        {atRiskCount > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 bg-error-50 border border-error-200 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-error-600" />
            <span className="text-sm font-medium text-error-700">
              {atRiskCount} student{atRiskCount > 1 ? 's' : ''} at risk
            </span>
          </div>
        )}
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1 p-1 bg-neutral-100 rounded-lg overflow-x-auto">
          {filterOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setStatusFilter(option.value)}
              className={cn(
                'px-3 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap',
                statusFilter === option.value
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-600 hover:text-neutral-900'
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <Input
            type="text"
            placeholder="Search by name, ID, or project..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'name' | 'progress' | 'risk')}
          className="px-3 py-2 border border-neutral-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500"
        >
          <option value="name">Sort by Name</option>
          <option value="progress">Sort by Progress</option>
          <option value="risk">Sort by Risk Level</option>
        </select>
      </div>

      {/* Supervisee List */}
      <div className="space-y-4">
        {filteredSupervisees && filteredSupervisees.length > 0 ? (
          filteredSupervisees.map((supervisee) => {
            const status = statusConfig[supervisee.projectStatus]
            const risk = riskConfig[supervisee.riskLevel]
            return (
              <Link
                key={supervisee.superviseeId}
                to={ROUTES.SUPERVISOR.SUPERVISEE_DETAIL.replace(':id', supervisee.superviseeId)}
              >
                <Card className={cn(
                  'p-4 hover:shadow-md transition-shadow cursor-pointer',
                  (supervisee.riskLevel === 'HIGH' || supervisee.riskLevel === 'CRITICAL') &&
                    'border-l-4 border-l-error-400'
                )}>
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <GraduationCap className="h-6 w-6 text-primary-600" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-neutral-900">{supervisee.fullName}</h3>
                            <div className={cn('w-2 h-2 rounded-full', risk.dotColor)} title={risk.label} />
                          </div>
                          <p className="text-sm text-neutral-500">
                            {supervisee.studentId} | {supervisee.program} | Year {supervisee.year}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            'px-2.5 py-1 rounded-full text-xs font-medium',
                            status.bgColor,
                            status.color
                          )}>
                            {status.label}
                          </span>
                          <ChevronRight className="h-5 w-5 text-neutral-400" />
                        </div>
                      </div>

                      {/* Project Title */}
                      <h4 className="font-medium text-neutral-800 mt-2">{supervisee.projectTitle}</h4>

                      {/* Stats Row */}
                      <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
                        {/* Progress */}
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-neutral-400" />
                          <div className="w-24 h-2 bg-neutral-100 rounded-full overflow-hidden">
                            <div
                              className={cn(
                                'h-full rounded-full',
                                supervisee.overallProgress >= 75 ? 'bg-success-500' :
                                supervisee.overallProgress >= 50 ? 'bg-primary-500' :
                                supervisee.overallProgress >= 25 ? 'bg-warning-500' : 'bg-error-500'
                              )}
                              style={{ width: `${supervisee.overallProgress}%` }}
                            />
                          </div>
                          <span className="text-neutral-600">{supervisee.overallProgress}%</span>
                        </div>

                        {/* Meetings */}
                        <div className="flex items-center gap-1 text-neutral-500">
                          <Calendar className="h-4 w-4" />
                          <span>{supervisee.totalMeetings} meetings</span>
                        </div>

                        {/* Pending Logs */}
                        {supervisee.pendingLogs > 0 && (
                          <div className="flex items-center gap-1 text-warning-600">
                            <FileText className="h-4 w-4" />
                            <span>{supervisee.pendingLogs} pending logs</span>
                          </div>
                        )}

                        {/* Last Meeting */}
                        {supervisee.lastMeetingDate && (
                          <div className="flex items-center gap-1 text-neutral-500">
                            <Clock className="h-4 w-4" />
                            <span>
                              Last met {new Date(supervisee.lastMeetingDate).toLocaleDateString('en-MY', {
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
            <Users className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-neutral-900">No supervisees found</h3>
            <p className="text-neutral-500 mt-1">
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : "You don't have any supervisees yet"}
            </p>
          </Card>
        )}
      </div>

      {/* Summary Stats */}
      {data && data.supervisees.length > 0 && (
        <Card className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-neutral-900">{data.total}</p>
              <p className="text-sm text-neutral-500">Total Supervisees</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-primary-600">
                {data.supervisees.filter((s) => s.projectStatus === 'IN_PROGRESS').length}
              </p>
              <p className="text-sm text-neutral-500">In Progress</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-warning-600">
                {data.supervisees.filter((s) => s.projectStatus === 'ON_HOLD').length}
              </p>
              <p className="text-sm text-neutral-500">On Hold</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-success-600">
                {data.supervisees.filter((s) => s.projectStatus === 'COMPLETED').length}
              </p>
              <p className="text-sm text-neutral-500">Completed</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-error-600">{atRiskCount}</p>
              <p className="text-sm text-neutral-500">At Risk</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
