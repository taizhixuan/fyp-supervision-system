import { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  Search,
  Users,
  Sparkles,
  X,
  SlidersHorizontal,
  RefreshCw,
  ArrowUpDown,
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

type SortKey = 'name_asc' | 'name_desc' | 'load_asc' | 'load_desc'
const SORT_LABELS: Record<SortKey, string> = {
  name_asc: 'Name (A → Z)',
  name_desc: 'Name (Z → A)',
  load_asc: 'Most slots available',
  load_desc: 'Fewest slots available',
}

function AvailabilityIndicator({ supervisor }: { supervisor: SupervisorSummary }) {
  const availableSlots = Math.max(0, supervisor.maxCapacity - supervisor.currentLoad)
  const loadPercent = supervisor.maxCapacity > 0
    ? Math.round((supervisor.currentLoad / supervisor.maxCapacity) * 100)
    : 0

  const barColor =
    loadPercent >= 100
      ? 'bg-error-500'
      : loadPercent >= 80
      ? 'bg-warning-500'
      : 'bg-success-500'

  const dotColor = barColor

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
                  dotColor,
                )}
              />
              <span className={cn('relative inline-flex h-2 w-2 rounded-full', dotColor)} />
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

      {/* Capacity bar — labelled "N of M students" to remove ambiguity with the badge.
          Bar fills with current load; semantic color matches the badge. */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all duration-500', barColor)}
            style={{ width: `${Math.min(loadPercent, 100)}%` }}
          />
        </div>
        <span className="text-xs text-neutral-500 tabular-nums whitespace-nowrap">
          {supervisor.currentLoad} of {supervisor.maxCapacity} students
        </span>
      </div>
    </div>
  )
}

export function SupervisorDirectory() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedAreas, setSelectedAreas] = useState<string[]>([])
  const [availableOnly, setAvailableOnly] = useState(false)
  const [sort, setSort] = useState<SortKey>('name_asc')
  const [showFilters, setShowFilters] = useState(false)
  const [compareList, setCompareList] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)

  const { data, isLoading, dataUpdatedAt, refetch, isFetching } = useSupervisorList({
    search: searchQuery,
    researchArea: selectedAreas.length > 0 ? selectedAreas.join(',') : undefined,
    availableOnly: availableOnly || undefined,
    sort,
    page: currentPage,
    limit: PAGE_SIZE,
  })

  const supervisors = data?.supervisors || []
  const totalItems = data?.total ?? 0
  const totalPages = data?.totalPages ?? 1

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    setCurrentPage(1)
  }, [])

  const toggleArea = useCallback((area: string) => {
    setSelectedAreas((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area],
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
        : prev,
    )
  }

  const clearCompare = () => setCompareList([])

  const clearFilters = () => {
    setSelectedAreas([])
    setAvailableOnly(false)
    setSearchQuery('')
    setCurrentPage(1)
  }

  const activeFilterCount = selectedAreas.length + (availableOnly ? 1 : 0) + (searchQuery ? 1 : 0)
  const hasActiveFilters = activeFilterCount > 0

  const lastUpdated = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : null

  return (
    <div className="space-y-3 lg:space-y-4 pb-24">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-900">Supervisor Directory</h1>
          <p className="text-sm text-neutral-600">Find and connect with supervisors for your FYP</p>
        </div>
        <Link to={ROUTES.STUDENT.RECOMMENDATIONS}>
          <Button variant="primary" size="sm" leftIcon={<Sparkles className="h-4 w-4" />} className="whitespace-nowrap">
            AI Recommendations
          </Button>
        </Link>
      </div>

      {/* Search + Filters + Sort */}
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
              onClick={() => setShowFilters((v) => !v)}
              className="whitespace-nowrap"
            >
              Filters
              {(selectedAreas.length > 0 || availableOnly) && (
                <Badge variant="primary" size="sm" className="ml-2">
                  {selectedAreas.length + (availableOnly ? 1 : 0)}
                </Badge>
              )}
            </Button>
            <div className="relative">
              <select
                value={sort}
                onChange={(e) => {
                  setSort(e.target.value as SortKey)
                  setCurrentPage(1)
                }}
                className="appearance-none pl-8 pr-3 h-8 rounded-md border border-neutral-300 text-xs font-medium text-neutral-700 bg-white hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {(Object.keys(SORT_LABELS) as SortKey[]).map((k) => (
                  <option key={k} value={k}>{SORT_LABELS[k]}</option>
                ))}
              </select>
              <ArrowUpDown className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400 pointer-events-none" />
            </div>
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
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1.5">Research Areas</label>
              <div className="flex flex-wrap gap-1.5">
                {RESEARCH_AREAS.map((area) => (
                  <button
                    key={area}
                    onClick={() => toggleArea(area)}
                    className={cn(
                      'px-2.5 py-1 rounded-full text-xs font-medium transition-colors',
                      selectedAreas.includes(area)
                        ? 'bg-success-100 text-success-700 ring-1 ring-success-300'
                        : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200',
                    )}
                  >
                    {area}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={availableOnly}
                  onChange={(e) => handleAvailableOnlyChange(e.target.checked)}
                  className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-neutral-700">Only show supervisors accepting students</span>
              </label>
              {(selectedAreas.length > 0 || availableOnly) && (
                <Button variant="ghost" size="sm" onClick={() => { setSelectedAreas([]); setAvailableOnly(false); setCurrentPage(1) }}>
                  Reset filters
                </Button>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* Active filter chips — always visible so users know what's applied
          without needing to expand the filter panel. */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-medium text-neutral-500">Active filters:</span>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-neutral-100 hover:bg-neutral-200 text-xs text-neutral-700"
            >
              Search: "{searchQuery}"
              <X className="h-3 w-3" />
            </button>
          )}
          {availableOnly && (
            <button
              onClick={() => setAvailableOnly(false)}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-success-50 hover:bg-success-100 text-xs text-success-700"
            >
              Accepting students
              <X className="h-3 w-3" />
            </button>
          )}
          {selectedAreas.map((area) => (
            <button
              key={area}
              onClick={() => toggleArea(area)}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary-50 hover:bg-primary-100 text-xs text-primary-700"
            >
              {area}
              <X className="h-3 w-3" />
            </button>
          ))}
          <button
            onClick={clearFilters}
            className="text-xs text-neutral-500 hover:text-error-600 underline ml-1"
          >
            Clear all
          </button>
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
        {lastUpdated && <span className="text-neutral-400">Updated {lastUpdated}</span>}
      </div>

      {/* Supervisor List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" label="Loading supervisors..." />
        </div>
      ) : supervisors.length === 0 ? (
        <Card className="text-center py-8">
          <Users className="h-10 w-10 text-neutral-300 mx-auto mb-3" />
          <h3 className="font-medium text-neutral-900 mb-1">No supervisors found</h3>
          <p className="text-sm text-neutral-500 mb-3">Try adjusting your search or filters</p>
          {hasActiveFilters && (
            <Button variant="secondary" size="sm" onClick={clearFilters}>
              Clear Filters
            </Button>
          )}
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
            {supervisors.map((supervisor) => {
              const isCompared = compareList.includes(supervisor.supervisorId)
              const compareDisabled = !isCompared && compareList.length >= 3
              return (
                <Card key={supervisor.supervisorId} hover padding="sm" className={cn('relative flex flex-col', isCompared && 'ring-2 ring-primary-400')}>
                  {/* Compare toggle — visible, labelled, larger hit target. */}
                  <label
                    className={cn(
                      'absolute top-2 right-2 z-10 inline-flex items-center gap-1.5 px-2 py-1 rounded-md border transition-colors cursor-pointer',
                      isCompared
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-neutral-200 bg-white hover:border-primary-300 hover:bg-primary-50/50 text-neutral-600',
                      compareDisabled && 'opacity-40 cursor-not-allowed',
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={isCompared}
                      disabled={compareDisabled}
                      onChange={() => toggleCompare(supervisor.supervisorId)}
                      className="h-3.5 w-3.5 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-xs font-medium">Compare</span>
                  </label>

                  {/* Identity row */}
                  <div className="flex gap-3 pr-24">
                    <div className="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                      {assetUrl(supervisor.profileImageUrl) ? (
                        <img
                          src={assetUrl(supervisor.profileImageUrl)!}
                          alt={supervisor.fullName}
                          className="w-14 h-14 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-lg font-bold text-primary-600">
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
                      <h3 className="text-base font-bold text-neutral-900 leading-tight truncate">
                        {supervisor.fullName}
                      </h3>
                      <p className="text-xs text-neutral-600 truncate mt-0.5">{supervisor.title}</p>
                      <p className="text-[11px] text-neutral-400 truncate">{supervisor.department}</p>
                    </div>
                  </div>

                  <AvailabilityIndicator supervisor={supervisor} />

                  {/* Research Areas */}
                  <div className="mt-2.5 flex flex-wrap gap-1">
                    {supervisor.researchAreas.slice(0, 3).map((area) => (
                      <Badge key={area} variant="default" size="sm">{area}</Badge>
                    ))}
                    {supervisor.researchAreas.length > 3 && (
                      <Badge variant="default" size="sm">+{supervisor.researchAreas.length - 3}</Badge>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="mt-3 flex items-center gap-2 pt-0">
                    <Link
                      to={ROUTES.STUDENT.SUPERVISOR_DETAIL.replace(':id', supervisor.supervisorId)}
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
              )
            })}
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={PAGE_SIZE}
            onPageChange={setCurrentPage}
          />
        </>
      )}

      {/* Floating Compare action bar — sticks to the bottom of the viewport
          whenever at least one supervisor is checked, so the trigger is
          unmissable instead of relying on a faint inline strip. */}
      {compareList.length > 0 && (
        <div className="fixed left-1/2 -translate-x-1/2 bottom-4 z-40 w-[min(680px,calc(100%-1.5rem))]">
          <div className="bg-primary-700 text-white rounded-xl shadow-2xl shadow-primary-900/40 border border-primary-600 px-3 py-2.5 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-white/15 text-sm font-bold">
              {compareList.length}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold leading-tight">
                {compareList.length} of 3 selected
              </p>
              <div className="flex flex-wrap gap-1 mt-0.5">
                {compareList.map((id) => {
                  const sup = supervisors.find((s) => s.supervisorId === id)
                  return sup ? (
                    <span key={id} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/10 text-[11px]">
                      {sup.fullName.split(' ').slice(0, 2).join(' ')}
                      <button
                        onClick={() => toggleCompare(id)}
                        className="opacity-70 hover:opacity-100"
                        aria-label={`Remove ${sup.fullName} from compare`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ) : null
                })}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={clearCompare}
                className="text-xs text-primary-100 hover:text-white px-2 py-1"
              >
                Clear
              </button>
              <Link to={`${ROUTES.STUDENT.COMPARE_SUPERVISORS}?ids=${compareList.join(',')}`}>
                <Button
                  variant="primary"
                  size="sm"
                  className="bg-white text-primary-700 hover:bg-primary-50 font-semibold whitespace-nowrap"
                  disabled={compareList.length < 2}
                >
                  Compare ({compareList.length})
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
