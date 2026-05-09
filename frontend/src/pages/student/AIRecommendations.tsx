import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Sparkles,
  RefreshCw,
  Star,
  Target,
  Clock,
  TrendingUp,
  Users,
  Info,
} from 'lucide-react'
import { Card, Button, Badge, Spinner, AlertBanner } from '@/components/ui'
import { useSupervisorRecommendations, useRefreshRecommendations } from '@/lib/hooks/useStudent'
import { ROUTES } from '@/lib/constants/routes'
import { cn } from '@/lib/utils/cn'
import type { SupervisorRecommendation } from '@/types'

const categoryIcons: Record<string, typeof Target> = {
  research_area: Target,
  skills: Star,
  availability: Users,
  success_rate: TrendingUp,
  response_time: Clock,
}

const categoryLabels: Record<string, string> = {
  research_area: 'Research Match',
  skills: 'Skills Match',
  availability: 'Availability',
  success_rate: 'Success Rate',
  response_time: 'Response Time',
}

export function AIRecommendations() {
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([])

  const { data, isLoading, error } = useSupervisorRecommendations()
  const refreshMutation = useRefreshRecommendations()

  // Drop any malformed entries from the AI response to avoid render crashes.
  const recommendations = (data?.recommendations ?? []).filter(
    (r): r is SupervisorRecommendation => Boolean(r?.supervisor?.fullName)
  )
  const generatedAt = data?.generatedAt || new Date().toISOString()

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary-600" />
            <h1 className="text-2xl font-bold text-neutral-900">AI Recommendations</h1>
          </div>
          <p className="text-neutral-600 mt-1">
            Personalized supervisor matches based on your profile and interests
          </p>
        </div>
        <Button
          variant="secondary"
          leftIcon={<RefreshCw className={cn('h-4 w-4', refreshMutation.isPending && 'animate-spin')} />}
          onClick={() => refreshMutation.mutate()}
          disabled={refreshMutation.isPending}
        >
          Refresh Recommendations
        </Button>
      </div>

      {/* Info Banner */}
      <AlertBanner
        variant="info"
        title="How AI Recommendations Work"
        description="Our AI analyzes your research interests, skills, and project preferences to find supervisors with the best match. Scores are based on research alignment, skill compatibility, availability, and historical success rates."
        dismissible
      />

      {error && (
        <AlertBanner
          variant="error"
          title="Failed to load recommendations"
          description="Using cached recommendations. Try refreshing."
          dismissible
        />
      )}

      {/* Compare Bar */}
      {selectedForCompare.length > 0 && (
        <Card className="bg-primary-50 border-primary-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="font-medium text-primary-900">
                Compare Selected ({selectedForCompare.length}/3)
              </span>
            </div>
            <Link
              to={`${ROUTES.STUDENT.COMPARE_SUPERVISORS}?ids=${selectedForCompare.join(',')}`}
            >
              <Button variant="primary" size="sm">
                Compare Selected
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {/* Last Updated */}
      <p className="text-sm text-neutral-500">
        Last updated: {new Date(generatedAt).toLocaleString('en-MY')}
      </p>

      {/* Recommendations List */}
      {recommendations.length === 0 ? (
        <Card className="text-center py-12">
          <Sparkles className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-neutral-900 mb-2">
            No recommendations yet
          </h3>
          <p className="text-neutral-500 mb-4">
            Complete your profile with research interests and skills to get personalized recommendations.
          </p>
          <Link to={ROUTES.STUDENT.PROFILE}>
            <Button variant="primary">Update Profile</Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-4">
          {recommendations.map((rec, index) => (
            <Card
              key={rec.supervisor.supervisorId}
              className={cn(
                'relative overflow-hidden',
                index === 0 && 'ring-2 ring-primary-500'
              )}
            >
              {/* Rank Badge */}
              <div
                className={cn(
                  'absolute top-0 left-0 px-3 py-1 text-sm font-bold',
                  index === 0
                    ? 'bg-primary-600 text-white'
                    : index === 1
                    ? 'bg-neutral-700 text-white'
                    : index === 2
                    ? 'bg-amber-600 text-white'
                    : 'bg-neutral-200 text-neutral-700'
                )}
              >
                #{rec.rank}
              </div>

              <div className="pt-6">
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Supervisor Info */}
                  <div className="flex gap-4 flex-1">
                    {/* Avatar */}
                    <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-xl font-bold text-primary-600">
                        {rec.supervisor.fullName
                          .split(' ')
                          .filter((n) => !['Dr.', 'Prof.'].includes(n))
                          .map((n) => n[0])
                          .join('')
                          .slice(0, 2)}
                      </span>
                    </div>

                    {/* Info */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-neutral-900">
                            {rec.supervisor.fullName}
                          </h3>
                          <p className="text-neutral-600">{rec.supervisor.title}</p>
                          <p className="text-sm text-neutral-500">
                            {rec.supervisor.department}
                          </p>
                        </div>
                      </div>

                      {/* Research Areas */}
                      <div className="mt-3 flex flex-wrap gap-1">
                        {rec.supervisor.researchAreas.slice(0, 4).map((area) => (
                          <Badge key={area} variant="default" size="sm">
                            {area}
                          </Badge>
                        ))}
                      </div>

                      {/* Availability */}
                      <div className="mt-3">
                        <Badge
                          variant={rec.supervisor.isAcceptingStudents ? 'success' : 'error'}
                          size="sm"
                        >
                          {rec.supervisor.isAcceptingStudents
                            ? `${rec.supervisor.maxCapacity - rec.supervisor.currentLoad} slots available`
                            : 'Not accepting'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Match Score */}
                  <div className="flex flex-col items-center justify-center px-6 py-4 bg-neutral-50 rounded-xl min-w-[140px]">
                    <div
                      className={cn(
                        'text-4xl font-bold',
                        getScoreColor(rec.matchScore)
                      )}
                    >
                      {rec.matchScore}%
                    </div>
                    <p className="text-sm text-neutral-500 mt-1">Match Score</p>
                  </div>
                </div>

                {/* Match Reasons */}
                <div className="mt-4 pt-4 border-t border-neutral-200">
                  <h4 className="text-sm font-medium text-neutral-700 mb-3">
                    Why this match?
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {rec.matchReasons.map((reason) => {
                      const Icon = categoryIcons[reason.category] || Info
                      return (
                        <div
                          key={reason.category}
                          className={cn(
                            'p-3 rounded-lg',
                            getScoreBg(reason.score)
                          )}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <Icon className={cn('h-4 w-4', getScoreColor(reason.score))} />
                            <span className="text-xs font-medium text-neutral-600">
                              {categoryLabels[reason.category] || reason.category}
                            </span>
                            <span
                              className={cn(
                                'ml-auto text-sm font-bold',
                                getScoreColor(reason.score)
                              )}
                            >
                              {reason.score}%
                            </span>
                          </div>
                          <p className="text-xs text-neutral-600">{reason.description}</p>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedForCompare.includes(rec.supervisor.supervisorId)}
                      onChange={() => toggleCompare(rec.supervisor.supervisorId)}
                      disabled={
                        !selectedForCompare.includes(rec.supervisor.supervisorId) &&
                        selectedForCompare.length >= 3
                      }
                      className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-neutral-600">Add to compare</span>
                  </label>

                  <div className="flex gap-2">
                    <Link
                      to={ROUTES.STUDENT.SUPERVISOR_DETAIL.replace(
                        ':id',
                        rec.supervisor.supervisorId
                      )}
                    >
                      <Button variant="secondary" size="sm">
                        View Profile
                      </Button>
                    </Link>
                    <Link to={ROUTES.STUDENT.TOPICS}>
                      <Button variant="primary" size="sm">
                        Browse Topics
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Bottom CTA */}
      <Card className="bg-neutral-50">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold text-neutral-900">
              Not finding the right match?
            </h3>
            <p className="text-sm text-neutral-600">
              Browse all supervisors or update your profile for better recommendations
            </p>
          </div>
          <div className="flex gap-2">
            <Link to={ROUTES.STUDENT.SUPERVISORS}>
              <Button variant="secondary">Browse All</Button>
            </Link>
            <Link to={ROUTES.STUDENT.PROFILE}>
              <Button variant="ghost">Update Profile</Button>
            </Link>
          </div>
        </div>
      </Card>
    </div>
  )
}
