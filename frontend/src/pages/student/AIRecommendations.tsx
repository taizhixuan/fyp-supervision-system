import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { isAxiosError } from 'axios'
import {
  Sparkles,
  RefreshCw,
  Target,
  Users,
  Info,
  GraduationCap,
  KeyRound,
  Network,
  Wrench,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { Card, Button, Badge, Spinner, AlertBanner } from '@/components/ui'
import { useSupervisorRecommendations, useRefreshRecommendations } from '@/lib/hooks/useStudent'
import { ROUTES } from '@/lib/constants/routes'
import { cn } from '@/lib/utils/cn'
import type { SupervisorRecommendation, RecommendationComponents } from '@/types'

const categoryIcons: Record<string, typeof Target> = {
  research_area: Target,
  skills: Target,
  availability: Users,
}

const categoryLabels: Record<string, string> = {
  research_area: 'Research Match',
  skills: 'Skills Match',
  availability: 'Availability',
}

const componentMeta: Array<{
  key: keyof RecommendationComponents
  label: string
  Icon: typeof Target
}> = [
  { key: 'semantic', label: 'Topic alignment', Icon: Network },
  { key: 'interest', label: 'Interest overlap', Icon: KeyRound },
  { key: 'skill', label: 'Skill match', Icon: Wrench },
  { key: 'programme', label: 'Programme', Icon: GraduationCap },
  { key: 'availability', label: 'Availability', Icon: Users },
]

export function AIRecommendations() {
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([])
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const { data, isLoading, error, errorUpdatedAt } = useSupervisorRecommendations()
  const refreshMutation = useRefreshRecommendations()

  // Drop any malformed entries from the AI response to avoid render crashes.
  const recommendations = (data?.recommendations ?? []).filter(
    (r): r is SupervisorRecommendation => Boolean(r?.supervisor?.fullName)
  )
  const generatedAt = data?.generatedAt || new Date().toISOString()

  // Auto-expand only the top recommendation when the list arrives/changes.
  const topId = recommendations[0]?.supervisor.supervisorId
  useEffect(() => {
    if (topId) {
      setExpanded(new Set([topId]))
    }
  }, [topId, data?.generatedAt])

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleCompare = (supervisorId: string) => {
    setSelectedForCompare((prev) =>
      prev.includes(supervisorId)
        ? prev.filter((id) => id !== supervisorId)
        : prev.length < 3
        ? [...prev, supervisorId]
        : prev
    )
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-success-600'
    if (score >= 75) return 'text-primary-600'
    if (score >= 60) return 'text-warning-600'
    return 'text-neutral-600'
  }

  const getScoreBg = (score: number) => {
    if (score >= 90) return 'bg-success-100'
    if (score >= 75) return 'bg-primary-100'
    if (score >= 60) return 'bg-warning-100'
    return 'bg-neutral-100'
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" label="Generating recommendations..." />
      </div>
    )
  }

  return (
    <div className="space-y-3 lg:space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary-600" />
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-900">AI Recommendations</h1>
          </div>
          <p className="text-sm text-neutral-600">
            Personalized supervisor matches based on your profile and interests
            {' · '}
            <span className="text-neutral-400">
              updated {new Date(generatedAt).toLocaleString('en-MY', { dateStyle: 'short', timeStyle: 'short' })}
            </span>
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<RefreshCw className={cn('h-4 w-4', refreshMutation.isPending && 'animate-spin')} />}
          onClick={() => refreshMutation.mutate()}
          disabled={refreshMutation.isPending}
          className="whitespace-nowrap"
        >
          Refresh
        </Button>
      </div>

      {/* Info Banner (dismissible, default closed-down copy) */}
      <AlertBanner
        variant="info"
        title="How AI Recommendations Work"
        description="Each supervisor is scored on five signals: topic alignment, interest overlap, skill match, programme alignment, and current availability. Supervisors who are full are filtered out."
        dismissible
      />

      {error && (
        // key bumps with each new errorUpdatedAt tick so the banner remounts
        // on every failed retry rather than staying suppressed after the
        // user clicked X once.
        isAxiosError(error) && error.response?.status === 503 ? (
          <AlertBanner
            key={errorUpdatedAt}
            variant="warning"
            title="Recommendation service is temporarily unavailable"
            description="The AI service is offline or warming up. Please try Refresh in a moment."
            dismissible
          />
        ) : (
          <AlertBanner
            key={errorUpdatedAt}
            variant="error"
            title="Failed to load recommendations"
            description="Something went wrong. Try refreshing — if the problem persists, check that your profile has interests and skills filled in."
            dismissible
          />
        )
      )}

      {/* Compare Bar — compact pill */}
      {selectedForCompare.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-primary-50 border border-primary-200 rounded-lg">
          <span className="text-sm font-medium text-primary-900">
            Compare Selected ({selectedForCompare.length}/3)
          </span>
          <Link
            to={`${ROUTES.STUDENT.COMPARE_SUPERVISORS}?ids=${selectedForCompare.join(',')}`}
            className="flex-shrink-0"
          >
            <Button variant="primary" size="sm" className="whitespace-nowrap">
              Compare Selected
            </Button>
          </Link>
        </div>
      )}

      {/* Recommendations List */}
      {recommendations.length === 0 ? (
        <Card className="text-center py-8">
          <Sparkles className="h-10 w-10 text-neutral-300 mx-auto mb-3" />
          <h3 className="font-medium text-neutral-900 mb-1">
            No recommendations yet
          </h3>
          <p className="text-sm text-neutral-500 mb-3">
            Complete your profile with research interests and skills to get personalized recommendations.
          </p>
          <Link to={ROUTES.STUDENT.PROFILE}>
            <Button variant="primary" size="sm">Update Profile</Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-3">
          {recommendations.map((rec, index) => {
            const isOpen = expanded.has(rec.supervisor.supervisorId)
            return (
              <Card
                key={rec.supervisor.supervisorId}
                padding="sm"
                className={cn(
                  'relative overflow-hidden',
                  index === 0 && 'ring-2 ring-primary-500'
                )}
              >
                {/* Rank Badge */}
                <div
                  className={cn(
                    'absolute top-0 left-0 px-2 py-0.5 text-xs font-bold rounded-br-md',
                    index === 0
                      ? 'bg-primary-600 text-white'
                      : index === 1
                      ? 'bg-neutral-700 text-white'
                      : index === 2
                      ? 'bg-warning-600 text-white'
                      : 'bg-neutral-200 text-neutral-700'
                  )}
                >
                  #{rec.rank}
                </div>

                {/* Always-visible identity row */}
                <div className="pt-4 flex items-start gap-3">
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-base font-bold text-primary-600">
                      {rec.supervisor.fullName
                        .split(' ')
                        .filter((n) => !['Dr.', 'Prof.'].includes(n))
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2)}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-neutral-900 text-sm leading-tight truncate">
                      {rec.supervisor.fullName}
                    </h3>
                    <p className="text-xs text-neutral-600 truncate">{rec.supervisor.title}</p>
                    <p className="text-xs text-neutral-500 truncate">
                      {rec.supervisor.department}
                    </p>

                    {/* Research Areas + Availability inline */}
                    <div className="mt-1.5 flex flex-wrap items-center gap-1">
                      {rec.supervisor.researchAreas.slice(0, 3).map((area) => (
                        <Badge key={area} variant="default" size="sm">
                          {area}
                        </Badge>
                      ))}
                      {rec.supervisor.researchAreas.length > 3 && (
                        <Badge variant="default" size="sm">
                          +{rec.supervisor.researchAreas.length - 3}
                        </Badge>
                      )}
                      <Badge
                        variant={rec.supervisor.isAcceptingStudents ? 'success' : 'error'}
                        size="sm"
                      >
                        {rec.supervisor.isAcceptingStudents
                          ? `${rec.supervisor.maxCapacity - rec.supervisor.currentLoad} slot${rec.supervisor.maxCapacity - rec.supervisor.currentLoad === 1 ? '' : 's'}`
                          : 'Full'}
                      </Badge>
                    </div>
                  </div>

                  {/* Match Score — compact */}
                  <button
                    type="button"
                    onClick={() => toggleExpand(rec.supervisor.supervisorId)}
                    className="flex flex-col items-center justify-center px-3 py-2 bg-neutral-50 hover:bg-neutral-100 rounded-lg min-w-[80px] transition-colors flex-shrink-0"
                    aria-expanded={isOpen}
                  >
                    <div className={cn('text-2xl font-bold leading-none', getScoreColor(rec.matchScore))}>
                      {rec.matchScore}%
                    </div>
                    <div className="flex items-center gap-1 mt-1 text-[10px] uppercase tracking-wide text-neutral-500">
                      Match
                      {isOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    </div>
                  </button>
                </div>

                {/* Collapsible details */}
                {isOpen && (
                  <>
                    {/* Score Breakdown */}
                    {rec.components && (
                      <div className="mt-3 pt-3 border-t border-neutral-200">
                        <h4 className="text-xs font-medium text-neutral-700 mb-2">
                          Score breakdown
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                          {componentMeta.map(({ key, label, Icon }) => {
                            const value = rec.components?.[key] ?? 0
                            const pct = Math.round(value * 100)
                            return (
                              <div key={key} className="p-2 rounded-md bg-neutral-50">
                                <div className="flex items-center gap-1.5 mb-1">
                                  <Icon className="h-3.5 w-3.5 text-neutral-500 flex-shrink-0" />
                                  <span className="text-[11px] font-medium text-neutral-700 truncate">
                                    {label}
                                  </span>
                                  <span className="ml-auto text-[11px] font-semibold text-neutral-700">
                                    {pct}%
                                  </span>
                                </div>
                                <div className="h-1 bg-neutral-200 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-primary-500 rounded-full transition-all"
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              </div>
                            )
                          })}
                        </div>
                        {rec.explanation && (
                          <p className="mt-2 text-xs text-neutral-600 leading-relaxed">
                            {rec.explanation}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Match Reasons */}
                    <div className="mt-3 pt-3 border-t border-neutral-200">
                      <h4 className="text-xs font-medium text-neutral-700 mb-2">
                        Why this match?
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {rec.matchReasons.map((reason) => {
                          const Icon = categoryIcons[reason.category] || Info
                          return (
                            <div
                              key={reason.category}
                              className={cn('p-2 rounded-md', getScoreBg(reason.score))}
                            >
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <Icon className={cn('h-3.5 w-3.5', getScoreColor(reason.score))} />
                                <span className="text-[11px] font-medium text-neutral-600">
                                  {categoryLabels[reason.category] || reason.category}
                                </span>
                                <span
                                  className={cn(
                                    'ml-auto text-xs font-bold',
                                    getScoreColor(reason.score)
                                  )}
                                >
                                  {reason.score}%
                                </span>
                              </div>
                              <p className="text-[11px] text-neutral-600 leading-snug">{reason.description}</p>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </>
                )}

                {/* Actions */}
                <div className="mt-3 pt-3 border-t border-neutral-200 flex flex-wrap items-center justify-between gap-2">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedForCompare.includes(rec.supervisor.supervisorId)}
                      onChange={() => toggleCompare(rec.supervisor.supervisorId)}
                      disabled={
                        !selectedForCompare.includes(rec.supervisor.supervisorId) &&
                        selectedForCompare.length >= 3
                      }
                      className="h-3.5 w-3.5 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-xs text-neutral-600">Add to compare</span>
                  </label>

                  <div className="flex gap-2 flex-shrink-0">
                    {!isOpen && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleExpand(rec.supervisor.supervisorId)}
                        className="whitespace-nowrap"
                      >
                        Details
                      </Button>
                    )}
                    <Link
                      to={ROUTES.STUDENT.SUPERVISOR_DETAIL.replace(
                        ':id',
                        rec.supervisor.supervisorId
                      )}
                    >
                      <Button variant="secondary" size="sm" className="whitespace-nowrap">
                        View Profile
                      </Button>
                    </Link>
                    <Link to={ROUTES.STUDENT.TOPICS}>
                      <Button variant="primary" size="sm" className="whitespace-nowrap">
                        Topics
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Bottom CTA */}
      <Card padding="sm" className="bg-neutral-50">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-neutral-900">
              Not finding the right match?
            </h3>
            <p className="text-xs text-neutral-600">
              Browse all supervisors or update your profile for better recommendations
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Link to={ROUTES.STUDENT.SUPERVISORS}>
              <Button variant="secondary" size="sm" className="whitespace-nowrap">Browse All</Button>
            </Link>
            <Link to={ROUTES.STUDENT.PROFILE}>
              <Button variant="ghost" size="sm" className="whitespace-nowrap">Update Profile</Button>
            </Link>
          </div>
        </div>
      </Card>
    </div>
  )
}
