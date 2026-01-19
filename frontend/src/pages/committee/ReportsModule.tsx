import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  BarChart3,
  FileText,
  Download,
  Calendar,
  Filter,
  Clock,
  ChevronRight,
  PieChart,
  TrendingUp,
  Users,
  FolderKanban,
  History,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { useGenerateReport } from '@/lib/hooks/useCommittee'
import { ROUTES } from '@/lib/constants/routes'
import { cn } from '@/lib/utils/cn'
import type { ReportType } from '@/types'

const reportTypes: {
  value: ReportType
  label: string
  description: string
  icon: typeof BarChart3
  color: string
}[] = [
  {
    value: 'PROGRESS_SUMMARY',
    label: 'Progress Summary',
    description: 'Overview of all project progress and milestone completion rates',
    icon: TrendingUp,
    color: 'text-info-600',
  },
  {
    value: 'SUPERVISION_LOAD',
    label: 'Supervision Load Report',
    description: 'Analysis of supervisor capacity and student distribution',
    icon: Users,
    color: 'text-accent-600',
  },
  {
    value: 'PAIRING_STATUS',
    label: 'Pairing Status Report',
    description: 'Current student-supervisor pairing statistics',
    icon: FolderKanban,
    color: 'text-primary-600',
  },
  {
    value: 'PROPOSAL_ANALYSIS',
    label: 'Proposal Analysis',
    description: 'Submitted proposals breakdown with approval rates',
    icon: FileText,
    color: 'text-success-600',
  },
  {
    value: 'MILESTONE_TRACKING',
    label: 'Milestone Tracking',
    description: 'Detailed milestone completion and deadline tracking',
    icon: Calendar,
    color: 'text-warning-600',
  },
  {
    value: 'RISK_ASSESSMENT',
    label: 'Risk Assessment',
    description: 'Projects at risk analysis with intervention recommendations',
    icon: BarChart3,
    color: 'text-error-600',
  },
]

export function ReportsModule() {
  const navigate = useNavigate()
  const [selectedReport, setSelectedReport] = useState<ReportType | null>(null)
  const [cycleFilter, setCycleFilter] = useState<'FYP1' | 'FYP2' | 'ALL'>('ALL')
  const [programmeFilter, setProgrammeFilter] = useState<string>('ALL')
  const [dateRange, setDateRange] = useState<{ from: string; to: string }>({
    from: new Date(new Date().setMonth(new Date().getMonth() - 6)).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0],
  })

  const generateMutation = useGenerateReport()

  const handleGenerate = async () => {
    if (!selectedReport) return

    try {
      await generateMutation.mutateAsync({
        type: selectedReport,
        filters: {
          cycle: cycleFilter !== 'ALL' ? cycleFilter : undefined,
          programme: programmeFilter !== 'ALL' ? programmeFilter : undefined,
          dateFrom: dateRange.from,
          dateTo: dateRange.to,
        },
      })
      navigate(ROUTES.COMMITTEE.REPORTS_HISTORY)
    } catch (error) {
      console.error('Failed to generate report:', error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
            <BarChart3 className="h-7 w-7 text-primary-600" />
            Reports Module
          </h1>
          <p className="text-neutral-600 mt-1">
            Generate comprehensive reports for FYP management
          </p>
        </div>
        <Link to={ROUTES.COMMITTEE.REPORTS_HISTORY}>
          <Button variant="outline">
            <History className="h-4 w-4 mr-2" />
            View Generated Reports
          </Button>
        </Link>
      </div>

      {/* Report Type Selection */}
      <Card className="p-6">
        <h3 className="font-semibold text-neutral-900 mb-4 flex items-center gap-2">
          <PieChart className="h-5 w-5 text-primary-600" />
          Select Report Type
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reportTypes.map((report) => {
            const Icon = report.icon
            return (
              <button
                key={report.value}
                type="button"
                onClick={() => setSelectedReport(report.value)}
                className={cn(
                  'p-4 rounded-lg border-2 text-left transition-all',
                  selectedReport === report.value
                    ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200'
                    : 'border-neutral-200 hover:bg-neutral-50 hover:border-neutral-300'
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center',
                    selectedReport === report.value ? 'bg-primary-100' : 'bg-neutral-100'
                  )}>
                    <Icon className={cn('h-5 w-5', report.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-neutral-900">{report.label}</h4>
                    <p className="text-xs text-neutral-500 mt-1 line-clamp-2">
                      {report.description}
                    </p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </Card>

      {/* Filters */}
      <Card className="p-6">
        <h3 className="font-semibold text-neutral-900 mb-4 flex items-center gap-2">
          <Filter className="h-5 w-5 text-primary-600" />
          Report Filters
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Cycle Filter */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              FYP Cycle
            </label>
            <select
              value={cycleFilter}
              onChange={(e) => setCycleFilter(e.target.value as 'FYP1' | 'FYP2' | 'ALL')}
              className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500"
            >
              <option value="ALL">All Cycles</option>
              <option value="FYP1">FYP1</option>
              <option value="FYP2">FYP2</option>
            </select>
          </div>

          {/* Programme Filter */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Programme
            </label>
            <select
              value={programmeFilter}
              onChange={(e) => setProgrammeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500"
            >
              <option value="ALL">All Programmes</option>
              <option value="CS">Computer Science</option>
              <option value="SE">Software Engineering</option>
              <option value="IT">Information Technology</option>
              <option value="DS">Data Science</option>
            </select>
          </div>

          {/* Date From */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              From Date
            </label>
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
              className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Date To */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              To Date
            </label>
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
              className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => {
          setSelectedReport('PROGRESS_SUMMARY')
          setCycleFilter('FYP1')
        }}>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-neutral-900">FYP1 Progress</h4>
              <p className="text-sm text-neutral-500">Quick progress summary</p>
            </div>
            <ChevronRight className="h-5 w-5 text-neutral-400" />
          </div>
        </Card>

        <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => {
          setSelectedReport('SUPERVISION_LOAD')
        }}>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-neutral-900">Load Analysis</h4>
              <p className="text-sm text-neutral-500">Supervisor capacity report</p>
            </div>
            <ChevronRight className="h-5 w-5 text-neutral-400" />
          </div>
        </Card>

        <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => {
          setSelectedReport('RISK_ASSESSMENT')
        }}>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-neutral-900">At-Risk Projects</h4>
              <p className="text-sm text-neutral-500">Risk assessment report</p>
            </div>
            <ChevronRight className="h-5 w-5 text-neutral-400" />
          </div>
        </Card>
      </div>

      {/* Selected Report Preview */}
      {selectedReport && (
        <Card className="p-6 border-l-4 border-l-primary-500">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-neutral-900">
                {reportTypes.find((r) => r.value === selectedReport)?.label}
              </h3>
              <p className="text-sm text-neutral-500 mt-1">
                {reportTypes.find((r) => r.value === selectedReport)?.description}
              </p>
              <div className="flex items-center gap-4 mt-3 text-xs text-neutral-500">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {dateRange.from} to {dateRange.to}
                </span>
                {cycleFilter !== 'ALL' && (
                  <span className="px-2 py-0.5 bg-info-50 text-info-700 rounded-full font-medium">
                    {cycleFilter}
                  </span>
                )}
                {programmeFilter !== 'ALL' && (
                  <span className="px-2 py-0.5 bg-neutral-100 text-neutral-600 rounded-full font-medium">
                    {programmeFilter}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-neutral-400 flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                Estimated: 30 seconds
              </span>
            </div>
          </div>
        </Card>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Link to={ROUTES.COMMITTEE.DASHBOARD}>
          <Button variant="outline">Cancel</Button>
        </Link>
        <Button
          onClick={handleGenerate}
          disabled={!selectedReport || generateMutation.isPending}
        >
          {generateMutation.isPending ? (
            <Spinner size="sm" className="mr-2" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          Generate Report
        </Button>
      </div>
    </div>
  )
}
