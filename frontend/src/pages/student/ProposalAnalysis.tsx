import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  Sparkles,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  XCircle,
  Lightbulb,
  Target,
  TrendingUp,
  TrendingDown,
} from 'lucide-react'
import { Card, Button, Badge, Spinner, AlertBanner } from '@/components/ui'
import { useProposalAnalysis, useAnalyzeProposal } from '@/lib/hooks/useStudent'
import { ROUTES } from '@/lib/constants/routes'
import { cn } from '@/lib/utils/cn'

// Sample data for design preview
const SAMPLE_ANALYSIS = {
  analysisId: '1',
  proposalId: '1',
  overallScore: 78,
  sectionAnalysis: [
    { section: 'Title', status: 'COMPLETE' as const, score: 95, feedback: 'Clear and descriptive title that accurately reflects the project scope.' },
    { section: 'Problem Statement', status: 'COMPLETE' as const, score: 85, feedback: 'Well-defined problem with clear motivation. Consider adding more recent statistics or citations.' },
    { section: 'Objectives', status: 'COMPLETE' as const, score: 80, feedback: 'Objectives are specific and measurable. Consider adding timeline estimates for each objective.' },
    { section: 'Scope', status: 'NEEDS_IMPROVEMENT' as const, score: 65, feedback: 'Scope is defined but could be more specific about limitations and boundaries.' },
    { section: 'Methodology', status: 'NEEDS_IMPROVEMENT' as const, score: 70, feedback: 'Methodology is outlined but lacks detail on specific tools and techniques.' },
    { section: 'Expected Outcomes', status: 'COMPLETE' as const, score: 75, feedback: 'Outcomes are clear but could be more specific about deliverables.' },
    { section: 'Timeline', status: 'INCOMPLETE' as const, score: 50, feedback: 'Timeline needs more detailed milestones and deadlines.' },
    { section: 'References', status: 'MISSING' as const, score: 0, feedback: 'No references provided. Academic proposals should include relevant literature.' },
  ],
  suggestions: [
    { section: 'Scope', type: 'CONTENT' as const, priority: 'HIGH' as const, suggestion: 'Define specific boundaries of what the system will and will not cover.', example: 'E.g., "The system will focus on undergraduate FYP processes only and will not include postgraduate thesis management."' },
    { section: 'Methodology', type: 'CLARITY' as const, priority: 'HIGH' as const, suggestion: 'Specify the development methodology and tools you plan to use.', example: 'E.g., "Agile methodology with 2-week sprints using React for frontend and Node.js for backend."' },
    { section: 'Timeline', type: 'STRUCTURE' as const, priority: 'MEDIUM' as const, suggestion: 'Break down the project into phases with specific dates.', example: 'E.g., "Phase 1 (Week 1-4): Requirements gathering and system design"' },
    { section: 'References', type: 'MISSING' as const, priority: 'HIGH' as const, suggestion: 'Add at least 5-10 academic references to support your proposal.', example: 'Include recent papers (2020-2024) related to your topic from IEEE, ACM, or other reputable sources.' },
  ],
  strengths: [
    'Clear and focused project title',
    'Well-articulated problem statement with real-world relevance',
    'Measurable and achievable objectives',
    'Good alignment between problem, objectives, and outcomes',
  ],
  weaknesses: [
    'Missing academic references and literature review',
    'Scope boundaries are not clearly defined',
    'Methodology lacks technical depth',
    'Timeline is too vague without specific milestones',
  ],
  analyzedAt: '2025-01-20T10:30:00Z',
}

const statusIcons = {
  COMPLETE: CheckCircle,
  INCOMPLETE: AlertCircle,
  NEEDS_IMPROVEMENT: AlertCircle,
  MISSING: XCircle,
}

const statusColors = {
  COMPLETE: 'text-success-600',
  INCOMPLETE: 'text-warning-600',
  NEEDS_IMPROVEMENT: 'text-warning-600',
  MISSING: 'text-error-600',
}

const statusBgColors = {
  COMPLETE: 'bg-success-50',
  INCOMPLETE: 'bg-warning-50',
  NEEDS_IMPROVEMENT: 'bg-warning-50',
  MISSING: 'bg-error-50',
}

const priorityColors = {
  HIGH: 'bg-error-100 text-error-700',
  MEDIUM: 'bg-warning-100 text-warning-700',
  LOW: 'bg-neutral-100 text-neutral-700',
}

export function ProposalAnalysis() {
  const { data: analysis, isLoading } = useProposalAnalysis()
  const analyzeMutation = useAnalyzeProposal()

  // Use sample data if no API data
  const displayAnalysis = analysis || SAMPLE_ANALYSIS

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success-600'
    if (score >= 60) return 'text-warning-600'
    return 'text-error-600'
  }

  const getScoreGradient = (score: number) => {
    if (score >= 80) return 'from-success-500 to-success-600'
    if (score >= 60) return 'from-warning-500 to-warning-600'
    return 'from-error-500 to-error-600'
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" label="Loading analysis..." />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link
        to={ROUTES.STUDENT.PROPOSAL}
        className="inline-flex items-center gap-2 text-neutral-600 hover:text-primary-600 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Proposal
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary-600" />
            <h1 className="text-2xl font-bold text-neutral-900">AI Proposal Analysis</h1>
          </div>
          <p className="text-neutral-600 mt-1">
            Get AI-powered feedback on your proposal
          </p>
        </div>
        <Button
          variant="secondary"
          leftIcon={<RefreshCw className={cn('h-4 w-4', analyzeMutation.isPending && 'animate-spin')} />}
          onClick={() => analyzeMutation.mutate()}
          disabled={analyzeMutation.isPending}
        >
          Re-analyze
        </Button>
      </div>

      {/* Info Banner */}
      <AlertBanner
        variant="info"
        title="AI Analysis"
        description="This analysis is generated by AI and should be used as guidance. Always consult with your supervisor for final feedback."
        dismissible
      />

      {/* Overall Score */}
      <Card>
        <div className="flex flex-col md:flex-row items-center gap-8">
          {/* Score Circle */}
          <div className="relative">
            <div className={cn(
              'w-32 h-32 rounded-full bg-gradient-to-br flex items-center justify-center',
              getScoreGradient(displayAnalysis.overallScore)
            )}>
              <div className="w-28 h-28 rounded-full bg-white flex items-center justify-center">
                <span className={cn('text-4xl font-bold', getScoreColor(displayAnalysis.overallScore))}>
                  {displayAnalysis.overallScore}
                </span>
              </div>
            </div>
          </div>

          <div className="flex-1 text-center md:text-left">
            <h2 className="text-xl font-semibold text-neutral-900 mb-2">
              Overall Proposal Score
            </h2>
            <p className="text-neutral-600 mb-4">
              {displayAnalysis.overallScore >= 80
                ? 'Your proposal is well-structured and comprehensive.'
                : displayAnalysis.overallScore >= 60
                ? 'Your proposal has good foundations but needs some improvements.'
                : 'Your proposal needs significant improvements before submission.'}
            </p>
            <p className="text-sm text-neutral-500">
              Last analyzed: {new Date(displayAnalysis.analyzedAt).toLocaleString('en-MY')}
            </p>
          </div>
        </div>
      </Card>

      {/* Strengths and Weaknesses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Strengths */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-success-600" />
            <h3 className="text-lg font-semibold text-neutral-900">Strengths</h3>
          </div>
          <ul className="space-y-2">
            {displayAnalysis.strengths.map((strength, index) => (
              <li key={index} className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-success-600 flex-shrink-0 mt-0.5" />
                <span className="text-neutral-700">{strength}</span>
              </li>
            ))}
          </ul>
        </Card>

        {/* Weaknesses */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <TrendingDown className="h-5 w-5 text-error-600" />
            <h3 className="text-lg font-semibold text-neutral-900">Areas for Improvement</h3>
          </div>
          <ul className="space-y-2">
            {displayAnalysis.weaknesses.map((weakness, index) => (
              <li key={index} className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-error-600 flex-shrink-0 mt-0.5" />
                <span className="text-neutral-700">{weakness}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Section Analysis */}
      <Card>
        <h3 className="text-lg font-semibold text-neutral-900 mb-4">Section-by-Section Analysis</h3>
        <div className="space-y-4">
          {displayAnalysis.sectionAnalysis.map((section) => {
            const StatusIcon = statusIcons[section.status]
            return (
              <div
                key={section.section}
                className={cn('p-4 rounded-lg', statusBgColors[section.status])}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <StatusIcon className={cn('h-5 w-5 flex-shrink-0 mt-0.5', statusColors[section.status])} />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-neutral-900">{section.section}</h4>
                        <Badge
                          variant={section.status === 'COMPLETE' ? 'success' : section.status === 'MISSING' ? 'error' : 'warning'}
                          size="sm"
                        >
                          {section.status.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                      <p className="text-sm text-neutral-600 mt-1">{section.feedback}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={cn('text-2xl font-bold', getScoreColor(section.score))}>
                      {section.score}
                    </span>
                    <p className="text-xs text-neutral-500">/100</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Suggestions */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="h-5 w-5 text-warning-600" />
          <h3 className="text-lg font-semibold text-neutral-900">Suggestions for Improvement</h3>
        </div>
        <div className="space-y-4">
          {displayAnalysis.suggestions.map((suggestion, index) => (
            <div key={index} className="p-4 bg-neutral-50 rounded-lg">
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary-600" />
                  <span className="font-medium text-neutral-900">{suggestion.section}</span>
                  <Badge className={priorityColors[suggestion.priority]} size="sm">
                    {suggestion.priority}
                  </Badge>
                </div>
              </div>
              <p className="text-neutral-700 mb-2">{suggestion.suggestion}</p>
              {suggestion.example && (
                <div className="mt-2 p-3 bg-white rounded border border-neutral-200">
                  <p className="text-sm text-neutral-600 italic">{suggestion.example}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* CTA */}
      <Card className="bg-primary-50 border-primary-200">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold text-primary-900">Ready to improve your proposal?</h3>
            <p className="text-sm text-primary-700">
              Apply these suggestions to strengthen your proposal
            </p>
          </div>
          <Link to={ROUTES.STUDENT.PROPOSAL}>
            <Button variant="primary">Edit Proposal</Button>
          </Link>
        </div>
      </Card>
    </div>
  )
}
