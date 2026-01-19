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
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import { useFYPCycles, useUpdateCycle } from '@/lib/hooks/useAdmin'
import { ROUTES } from '@/lib/constants/routes'
import { cn } from '@/lib/utils/cn'
import type { CycleStatus, CycleType, FYPCycle } from '@/types'

const statusConfig: Record<CycleStatus, { label: string; color: string; bgColor: string; icon: typeof Clock }> = {
  DRAFT: { label: 'Draft', color: 'text-neutral-600', bgColor: 'bg-neutral-100', icon: Settings },
  UPCOMING: { label: 'Upcoming', color: 'text-info-600', bgColor: 'bg-info-50', icon: Clock },
  ACTIVE: { label: 'Active', color: 'text-success-600', bgColor: 'bg-success-50', icon: Play },
  PAUSED: { label: 'Paused', color: 'text-warning-600', bgColor: 'bg-warning-50', icon: Pause },
  COMPLETED: { label: 'Completed', color: 'text-primary-600', bgColor: 'bg-primary-50', icon: CheckCircle },
  ARCHIVED: { label: 'Archived', color: 'text-neutral-500', bgColor: 'bg-neutral-50', icon: Archive },
}

const typeConfig: Record<CycleType, { label: string; color: string }> = {
  FYP1: { label: 'FYP 1', color: 'text-info-600' },
  FYP2: { label: 'FYP 2', color: 'text-accent-600' },
  SHORT_SEM: { label: 'Short Semester', color: 'text-warning-600' },
}

export function CycleManagement() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<CycleStatus | 'ALL'>('ALL')

  const { data, isLoading } = useFYPCycles(
    statusFilter !== 'ALL' ? statusFilter : undefined
  )
  const updateMutation = useUpdateCycle()

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
    upcoming: data?.cycles.filter((c) => c.status === 'UPCOMING').length ?? 0,
    completed: data?.cycles.filter((c) => c.status === 'COMPLETED').length ?? 0,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
            <Calendar className="h-7 w-7 text-primary-600" />
            FYP Cycle Management
          </h1>
          <p className="text-neutral-600 mt-1">
            Manage academic cycles, semesters, and FYP periods
          </p>
        </div>
        <Link to={ROUTES.ADMIN.CYCLE_NEW}>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Cycle
          </Button>
        </Link>
      </div>

      {/* Current Active Cycle Banner */}
      {activeCycle && (
        <Card className="p-4 border-l-4 border-l-success-500 bg-success-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-success-100 rounded-lg">
                <Play className="h-5 w-5 text-success-600" />
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900">
                  Active Cycle: {activeCycle.name}
                </h3>
                <p className="text-sm text-neutral-600">
                  {activeCycle.academicYear} • {typeConfig[activeCycle.type].label}
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
            statusFilter === 'UPCOMING' ? 'ring-2 ring-primary-500' : 'hover:bg-neutral-50'
          )}
          onClick={() => setStatusFilter(statusFilter === 'UPCOMING' ? 'ALL' : 'UPCOMING')}
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
      <Card className="p-4">
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
      </Card>

      {/* Cycles List */}
      <div className="space-y-4">
        {filteredCycles && filteredCycles.length > 0 ? (
          filteredCycles.map((cycle) => {
            const status = statusConfig[cycle.status]
            const type = typeConfig[cycle.type]
            const StatusIcon = status.icon

            return (
              <Card key={cycle.cycleId} className="p-5">
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
                          'px-2 py-0.5 rounded-full text-xs font-medium',
                          status.bgColor,
                          status.color
                        )}>
                          {status.label}
                        </span>
                        <span className="px-2 py-0.5 bg-neutral-100 text-neutral-600 rounded-full text-xs font-medium">
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
                    {/* Status Actions */}
                    {cycle.status === 'DRAFT' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStatusChange(cycle, 'UPCOMING')}
                        disabled={updateMutation.isPending}
                      >
                        Publish
                      </Button>
                    )}
                    {cycle.status === 'UPCOMING' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStatusChange(cycle, 'ACTIVE')}
                        disabled={updateMutation.isPending}
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Start
                      </Button>
                    )}
                    {cycle.status === 'ACTIVE' && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleStatusChange(cycle, 'PAUSED')}
                          disabled={updateMutation.isPending}
                        >
                          <Pause className="h-4 w-4 mr-1" />
                          Pause
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusChange(cycle, 'COMPLETED')}
                          disabled={updateMutation.isPending}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Complete
                        </Button>
                      </>
                    )}
                    {cycle.status === 'PAUSED' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStatusChange(cycle, 'ACTIVE')}
                        disabled={updateMutation.isPending}
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Resume
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
