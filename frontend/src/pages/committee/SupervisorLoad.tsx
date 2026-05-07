import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Users,
  Search,
  ArrowLeft,
  AlertTriangle,
  ChevronRight,
  User,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import { useSupervisorLoads } from '@/lib/hooks/useCommittee'
import { ROUTES } from '@/lib/constants/routes'
import { cn } from '@/lib/utils/cn'

export function SupervisorLoad() {
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<'ALL' | 'OVERLOADED' | 'AVAILABLE'>('ALL')

  const { data, isLoading } = useSupervisorLoads()

  const filteredSupervisors = data?.supervisors.filter((supervisor) => {
    if (filter === 'OVERLOADED' && !supervisor.isOverloaded) return false
    if (filter === 'AVAILABLE' && supervisor.currentLoad >= supervisor.maxCapacity) return false
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      supervisor.fullName.toLowerCase().includes(query) ||
      supervisor.email.toLowerCase().includes(query) ||
      supervisor.department.toLowerCase().includes(query) ||
      supervisor.expertise.some((e) => e.toLowerCase().includes(query))
    )
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    )
  }

  const stats = {
    total: data?.supervisors.length ?? 0,
    overloaded: data?.supervisors.filter((s) => s.isOverloaded).length ?? 0,
    available: data?.supervisors.filter((s) => s.currentLoad < s.maxCapacity).length ?? 0,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to={ROUTES.COMMITTEE.PROJECTS}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Overview
          </Button>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
            <Users className="h-7 w-7 text-primary-600" />
            Supervisor Load Analysis
          </h1>
          <p className="text-neutral-600 mt-1">
            Monitor supervisor capacity and student distribution
          </p>
        </div>
        {stats.overloaded > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-error-50 border border-error-200 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-error-600" />
            <span className="font-medium text-error-700">
              {stats.overloaded} supervisor{stats.overloaded > 1 ? 's' : ''} overloaded
            </span>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card
          className={cn(
            'p-4 cursor-pointer transition-colors',
            filter === 'ALL' ? 'ring-2 ring-primary-500' : 'hover:bg-neutral-50'
          )}
          onClick={() => setFilter('ALL')}
        >
          <p className="text-sm text-neutral-500">Total Supervisors</p>
          <p className="text-2xl font-bold text-neutral-900">{stats.total}</p>
        </Card>
        <Card
          className={cn(
            'p-4 cursor-pointer transition-colors',
            filter === 'AVAILABLE' ? 'ring-2 ring-primary-500' : 'hover:bg-neutral-50'
          )}
          onClick={() => setFilter(filter === 'AVAILABLE' ? 'ALL' : 'AVAILABLE')}
        >
          <p className="text-sm text-neutral-500">With Capacity</p>
          <p className="text-2xl font-bold text-success-600">{stats.available}</p>
        </Card>
        <Card
          className={cn(
            'p-4 cursor-pointer transition-colors',
            filter === 'OVERLOADED' ? 'ring-2 ring-primary-500' : 'hover:bg-neutral-50'
          )}
          onClick={() => setFilter(filter === 'OVERLOADED' ? 'ALL' : 'OVERLOADED')}
        >
          <p className="text-sm text-neutral-500">Overloaded</p>
          <p className="text-2xl font-bold text-error-600">{stats.overloaded}</p>
        </Card>
      </div>

      {/* Search */}
      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <Input
            type="text"
            placeholder="Search by name, email, department, or expertise..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </Card>

      {/* Supervisors List */}
      <div className="space-y-3">
        {filteredSupervisors && filteredSupervisors.length > 0 ? (
          filteredSupervisors.map((supervisor) => {
            const utilizationColor = supervisor.utilizationRate > 100
              ? 'text-error-600'
              : supervisor.utilizationRate >= 80
                ? 'text-warning-600'
                : 'text-success-600'

            const progressBarColor = supervisor.utilizationRate > 100
              ? 'bg-error-500'
              : supervisor.utilizationRate >= 80
                ? 'bg-warning-500'
                : 'bg-success-500'

            return (
              <Link
                key={supervisor.supervisorId}
                to={ROUTES.COMMITTEE.SUPERVISOR_LOAD_DETAIL.replace(':id', supervisor.supervisorId)}
              >
                <Card className={cn(
                  'p-4 hover:shadow-md transition-shadow cursor-pointer',
                  supervisor.isOverloaded && 'border-l-4 border-l-error-500'
                )}>
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className={cn(
                      'w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0',
                      supervisor.isOverloaded ? 'bg-error-100' : 'bg-primary-100'
                    )}>
                      <User className={cn(
                        'h-6 w-6',
                        supervisor.isOverloaded ? 'text-error-600' : 'text-primary-600'
                      )} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-neutral-900">{supervisor.fullName}</h3>
                            {supervisor.isOverloaded && (
                              <span className="px-2 py-0.5 bg-error-50 text-error-700 rounded-full text-xs font-medium">
                                Overloaded
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-neutral-500">{supervisor.department}</p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-neutral-400 flex-shrink-0" />
                      </div>

                      {/* Load Bar */}
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-neutral-600">
                            {supervisor.currentLoad} / {supervisor.maxCapacity} students
                          </span>
                          <span className={cn('font-medium', utilizationColor)}>
                            {Math.round(supervisor.utilizationRate)}%
                          </span>
                        </div>
                        <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                          <div
                            className={cn('h-full rounded-full transition-all', progressBarColor)}
                            style={{ width: `${Math.min(supervisor.utilizationRate, 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* Student Breakdown */}
                      <div className="flex items-center gap-4 mt-2 text-xs text-neutral-500">
                        <span>FYP1: {supervisor.fyp1Students}</span>
                        <span>FYP2: {supervisor.fyp2Students}</span>
                        <span>Available: {Math.max(0, supervisor.maxCapacity - supervisor.currentLoad)}</span>
                      </div>

                      {/* Expertise */}
                      <div className="mt-2">
                        {supervisor.expertise.slice(0, 3).map((area) => (
                          <span
                            key={area}
                            className="inline-block px-2 py-0.5 bg-neutral-100 text-neutral-600 rounded text-xs mr-1"
                          >
                            {area}
                          </span>
                        ))}
                        {supervisor.expertise.length > 3 && (
                          <span className="text-xs text-neutral-400">
                            +{supervisor.expertise.length - 3} more
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
          <Card className="p-12 text-center">
            <Users className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-neutral-900">No supervisors found</h3>
            <p className="text-neutral-500 mt-1">
              {searchQuery || filter !== 'ALL'
                ? 'Try adjusting your filters'
                : 'No supervisors have been registered yet'}
            </p>
          </Card>
        )}
      </div>

      {/* Summary */}
      {data && data.supervisors.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-neutral-600">
              Showing {filteredSupervisors?.length ?? 0} of {data.total} supervisors
            </span>
            <span className="text-neutral-500">
              Total capacity: {data.supervisors.reduce((sum, s) => sum + s.maxCapacity, 0)} students
            </span>
          </div>
        </Card>
      )}
    </div>
  )
}
