import { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  Search,
  Users,
  Sparkles,
  X,
  SlidersHorizontal,
  RefreshCw,
} from 'lucide-react'
import { Card, Button, Input, Badge, Spinner, Pagination } from '@/components/ui'
import { useSupervisorList } from '@/lib/hooks/useStudent'
import { ROUTES } from '@/lib/constants/routes'
import { cn } from '@/lib/utils/cn'
import { assetUrl } from '@/lib/utils/assetUrl'
import type { SupervisorSummary } from '@/types'

const PAGE_SIZE = 9

const RESEARCH_AREAS = [
  'Artificial Intelligence',
  'Machine Learning',
  'Cybersecurity',
  'Data Science',
  'Web Development',
  'Cloud Computing',
  'Computer Vision',
  'Natural Language Processing',
  'Blockchain',
  'IoT',
]

function AvailabilityIndicator({ supervisor }: { supervisor: SupervisorSummary }) {
  const availableSlots = supervisor.maxCapacity - supervisor.currentLoad
  const loadPercent = Math.round((supervisor.currentLoad / supervisor.maxCapacity) * 100)

  const barColor =
    loadPercent >= 100
      ? 'bg-error-500'
      : loadPercent >= 80
      ? 'bg-warning-500'
      : 'bg-success-500'

  const dotColor =
    loadPercent >= 100
      ? 'bg-error-500'
      : loadPercent >= 80
      ? 'bg-warning-500'
      : 'bg-success-500'

  return (
    <div className="mt-2.5 space-y-1.5">
      {/* Badge with live dot */}
      <div className="flex items-center gap-2">
        {supervisor.isAcceptingStudents ? (
          <Badge variant="success" size="sm" className="gap-1.5">
            <span className="relative flex h-2 w-2">
              <span
                className={cn(
                  'absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping',
                  dotColor
                )}
              />
              <span
                className={cn('relative inline-flex h-2 w-2 rounded-full', dotColor)}
              />
            </span>
            {availableSlots} {availableSlots === 1 ? 'slot' : 'slots'} available
          </Badge>
        ) : (
          <Badge variant="error" size="sm" className="gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="relative inline-flex h-2 w-2 rounded-full bg-error-500" />
            </span>
            Full
          </Badge>
        )}
      </div>

      {/* Capacity bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all duration-500', barColor)}
            style={{ width: `${Math.min(loadPercent, 100)}%` }}
          />
        </div>
        <span className="text-xs text-neutral-500 tabular-nums whitespace-nowrap">
          {supervisor.currentLoad}/{supervisor.maxCapacity}
        </span>
      </div>
    </div>
  )
}

export function SupervisorDirectory() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedAreas, setSelectedAreas] = useState<string[]>([])
  const [availableOnly, setAvailableOnly] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [compareList, setCompareList] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)

  const { data, isLoading, dataUpdatedAt, refetch, isFetching } = useSupervisorList({
    search: searchQuery,
    researchArea: selectedAreas.length > 0 ? selectedAreas.join(',') : undefined,
    availableOnly,
    page: currentPage,
    limit: PAGE_SIZE,
  })

  const supervisors = data?.supervisors || []
  const totalItems = data?.total ?? 0
  const totalPages = data?.totalPages ?? 1

  // Reset to page 1 when filters change
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    setCurrentPage(1)
  }, [])

  const toggleArea = useCallback((area: string) => {
    setSelectedAreas((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
    )
    setCurrentPage(1)
  }, [])

  const handleAvailableOnlyChange = useCallback((checked: boolean) => {
    setAvailableOnly(checked)
    setCurrentPage(1)
  }, [])

  const toggleCompare = (supervisorId: string) => {
    setCompareList((prev) =>
      prev.includes(supervisorId)
        ? prev.filter((id) => id !== supervisorId)
        : prev.length < 3
        ? [...prev, supervisorId]
        : prev
    )
  }

  const clearFilters = () => {
    setSelectedAreas([])
    setAvailableOnly(false)
    setCurrentPage(1)
  }

  const hasActiveFilters = selectedAreas.length > 0 || availableOnly

  // Format the last-updated timestamp
  const lastUpdated = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : null

  return (
    <div className="space-y-3 lg:space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-900">Supervisor Directory</h1>
          <p className="text-sm text-neutral-600">
            Find and connect with supervisors for your FYP
          </p>
        </div>
        <Link to={ROUTES.STUDENT.RECOMMENDATIONS}>
          <Button variant="primary" size="sm" leftIcon={<Sparkles className="h-4 w-4" />} className="whitespace-nowrap">
            AI Recommendations
          </Button>
        </Link>
      </div>

      {/* Search + Filters + result meta — all on one row */}
      <Card padding="sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="flex-1 min-w-0">
            <Input
              placeholder="Search by name, research area, or department..."
              leftIcon={<Search className="h-4 w-4" />}
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<SlidersHorizontal className="h-4 w-4" />}
              onClick={() => setShowFilters(!showFilters)}
              className="whitespace-nowrap"
            >
              Filters
              {hasActiveFilters && (
                <Badge variant="primary" size="sm" className="ml-2">
                  {selectedAreas.length + (availableOnly ? 1 : 0)}
                </Badge>
              )}
            </Button>
            <button
              type="button"
              onClick={() => refetch()}
              disabled={isFetching}
              className="inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-primary-600 transition-colors disabled:opacity-50 px-2 py-1.5 rounded-md hover:bg-neutral-50"
              title="Refresh availability"
            >
              <RefreshCw className={cn('h-3.5 w-3.5', isFetching && 'animate-spin')} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="mt-3 pt-3 border-t border-neutral-200 space-y-3">
            {/* Research Areas Filter */}
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1.5">
                Research Areas
              </label>
              <div className="flex flex-wrap gap-1.5">
                {RESEARCH_AREAS.map((area) => (
                  <button
                    key={area}
                    onClick={() => toggleArea(area)}
                    className={cn(
                      'px-2.5 py-1 rounded-full text-xs font-medium transition-colors',
                      selectedAreas.includes(area)
                        ? 'bg-success-100 text-success-700'
                        : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                    )}
                  >
                    {area}
                  </button>
                ))}
              </div>
            </div>

            {/* Availability Filter */}
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={availableOnly}
                  onChange={(e) => handleAvailableOnlyChange(e.target.checked)}
                  className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-neutral-700">
                  Only show supervisors accepting students
                </span>
              </label>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Clear all filters
                </Button>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* Compare Bar — compact pill */}
      {compareList.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-primary-50 border border-primary-200 rounded-lg">
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <span className="text-sm font-medium text-primary-900 whitespace-nowrap">
              Compare ({compareList.length}/3)
            </span>
            <div className="flex flex-wrap gap-1.5">
              {compareList.map((id) => {
                const supervisor = supervisors.find((s) => s.supervisorId === id)
                return supervisor ? (
                  <Badge key={id} variant="primary" size="sm" className="pr-1">
                    {supervisor.fullName.split(' ').slice(0, 2).join(' ')}
                    <button
                      onClick={() => toggleCompare(id)}
                      className="ml-1 p-0.5 rounded-full hover:bg-primary-700"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ) : null
              })}
            </div>
          </div>
          <Link
            to={`${ROUTES.STUDENT.COMPARE_SUPERVISORS}?ids=${compareList.join(',')}`}
            className="flex-shrink-0"
          >
            <Button variant="primary" size="sm" className="whitespace-nowrap">
              Compare Selected
            </Button>
          </Link>
        </div>
      )}

      {/* Result count strip */}
      <div className="flex items-center justify-between text-xs text-neutral-500">
        <p>
          Showing <span className="font-medium text-neutral-700">{supervisors.length}</span>
          {totalItems > 0 && (
            <> of <span className="font-medium text-neutral-700">{totalItems}</span></>
          )}{' '}
          supervisor(s)
        </p>
        {lastUpdated && (
          <span className="text-neutral-400">Updated {lastUpdated}</span>
        )}
      </div>

      {/* Supervisor List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" label="Loading supervisors..." />
        </div>
      ) : supervisors.length === 0 ? (
        <Card className="text-center py-8">
          <Users className="h-10 w-10 text-neutral-300 mx-auto mb-3" />
          <h3 className="font-medium text-neutral-900 mb-1">
            No supervisors found
          </h3>
          <p className="text-sm text-neutral-500 mb-3">
            Try adjusting your search or filters
          </p>
          {hasActiveFilters && (
            <Button variant="secondary" size="sm" onClick={clearFilters}>
              Clear Filters
            </Button>
          )}
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
            {supervisors.map((supervisor) => (
              <Card key={supervisor.supervisorId} hover padding="sm" className="relative flex flex-col">
                {/* Compare Checkbox — icon-only on the card */}
                <label className="absolute top-2.5 right-2.5 flex items-center gap-1 cursor-pointer z-10">
                  <input
                    type="checkbox"
                    checked={compareList.includes(supervisor.supervisorId)}
                    onChange={() => toggleCompare(supervisor.supervisorId)}
                    disabled={
                      !compareList.includes(supervisor.supervisorId) &&
                      compareList.length >= 3
                    }
                    className="h-3.5 w-3.5 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-[10px] uppercase tracking-wide text-neutral-400 font-medium">Compare</span>
                </label>

                {/* Identity row */}
                <div className="flex gap-3 pr-16">
                  <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                    {assetUrl(supervisor.profileImageUrl) ? (
                      <img
                        src={assetUrl(supervisor.profileImageUrl)!}
                        alt={supervisor.fullName}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-base font-bold text-primary-600">
                        {supervisor.fullName
                          .split(' ')
                          .filter((n) => !['Dr.', 'Prof.'].includes(n))
                          .map((n) => n[0])
                          .join('')
                          .slice(0, 2)}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-neutral-900 text-sm leading-tight truncate">
                      {supervisor.fullName}
                    </h3>
                    <p className="text-xs text-neutral-600 truncate">{supervisor.title}</p>
                    <p className="text-xs text-neutral-500 truncate">{supervisor.department}</p>
                  </div>
                </div>

                {/* Availability */}
                <AvailabilityIndicator supervisor={supervisor} />

                {/* Research Areas */}
                <div className="mt-2.5 flex flex-wrap gap-1">
                  {supervisor.researchAreas.slice(0, 3).map((area) => (
                    <Badge key={area} variant="default" size="sm">
                      {area}
                    </Badge>
                  ))}
                  {supervisor.researchAreas.length > 3 && (
                    <Badge variant="default" size="sm">
                      +{supervisor.researchAreas.length - 3}
                    </Badge>
                  )}
                </div>

                {/* Actions — pushed to bottom for visual alignment */}
                <div className="mt-3 flex items-center gap-2 pt-0">
                  <Link
                    to={ROUTES.STUDENT.SUPERVISOR_DETAIL.replace(
                      ':id',
                      supervisor.supervisorId
                    )}
                    className="flex-1"
                  >
                    <Button variant="secondary" size="sm" className="w-full whitespace-nowrap">
                      View Profile
                    </Button>
                  </Link>
                  <Link to={`${ROUTES.STUDENT.CREATE_REQUEST}?supervisorId=${supervisor.supervisorId}`} className="flex-shrink-0">
                    <Button variant="primary" size="sm" className="whitespace-nowrap">
                      Request
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={PAGE_SIZE}
            onPageChange={setCurrentPage}
          />
        </>
      )}
    </div>
  )
}
