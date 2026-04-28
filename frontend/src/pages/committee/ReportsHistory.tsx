import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  History,
  FileText,
  Download,
  Trash2,
  Clock,
  Calendar,
  Filter,
  Search,
  BarChart3,
  TrendingUp,
  Users,
  FolderKanban,
  CheckCircle,
  AlertCircle,
  Loader,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import { useGeneratedReports, useDeleteReport } from '@/lib/hooks/useCommittee'
import { ROUTES } from '@/lib/constants/routes'
import { cn } from '@/lib/utils/cn'
import type { ReportType, GeneratedReport } from '@/types'

const reportTypeConfig: Record<ReportType, { label: string; icon: typeof BarChart3; color: string }> = {
  PROGRESS_SUMMARY: { label: 'Progress Summary', icon: TrendingUp, color: 'text-info-600' },
  SUPERVISION_LOAD: { label: 'Supervision Load', icon: Users, color: 'text-accent-600' },
  PAIRING_STATUS: { label: 'Pairing Status', icon: FolderKanban, color: 'text-primary-600' },
  PROPOSAL_ANALYSIS: { label: 'Proposal Analysis', icon: FileText, color: 'text-success-600' },
  MILESTONE_TRACKING: { label: 'Milestone Tracking', icon: Calendar, color: 'text-warning-600' },
  RISK_ASSESSMENT: { label: 'Risk Assessment', icon: BarChart3, color: 'text-error-600' },
}

const statusConfig = {
  PENDING: { label: 'Generating', color: 'text-warning-600', bgColor: 'bg-warning-50', icon: Loader },
  COMPLETED: { label: 'Ready', color: 'text-success-600', bgColor: 'bg-success-50', icon: CheckCircle },
  FAILED: { label: 'Failed', color: 'text-error-600', bgColor: 'bg-error-50', icon: AlertCircle },
}

export function ReportsHistory() {
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<ReportType | 'ALL'>('ALL')

  const { data, isLoading } = useGeneratedReports()
  const deleteMutation = useDeleteReport()

  const filteredReports = data?.reports.filter((report) => {
    if (typeFilter !== 'ALL' && report.type !== typeFilter) return false
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      report.title.toLowerCase().includes(query) ||
      reportTypeConfig[report.type].label.toLowerCase().includes(query)
    )
  })

  const handleDelete = async (reportId: number) => {
    if (!confirm('Are you sure you want to delete this report?')) return
    try {
      await deleteMutation.mutateAsync(reportId)
    } catch (error) {
      console.error('Failed to delete report:', error)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

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
      <div className="flex items-center gap-4">
        <Link to={ROUTES.COMMITTEE.REPORTS}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Reports
          </Button>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
            <History className="h-7 w-7 text-primary-600" />
            Generated Reports
          </h1>
          <p className="text-neutral-600 mt-1">
            View and download previously generated reports
          </p>
        </div>
        <Link to={ROUTES.COMMITTEE.REPORTS}>
          <Button>
            <BarChart3 className="h-4 w-4 mr-2" />
            Generate New Report
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <Input
              type="text"
              placeholder="Search reports..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as ReportType | 'ALL')}
            className="px-3 py-2 border border-neutral-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500"
          >
            <option value="ALL">All Types</option>
            {Object.entries(reportTypeConfig).map(([value, config]) => (
              <option key={value} value={value}>
                {config.label}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* Reports List */}
      <div className="space-y-3">
        {filteredReports && filteredReports.length > 0 ? (
          filteredReports.map((report) => {
            const typeConfig = reportTypeConfig[report.type]
            const status = statusConfig[report.status]
            const Icon = typeConfig.icon
            const StatusIcon = status.icon

            return (
              <Card key={report.reportId} className="p-4">
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={cn(
                    'w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0',
                    report.status === 'COMPLETED' ? 'bg-primary-50' : 'bg-neutral-100'
                  )}>
                    <Icon className={cn(
                      'h-6 w-6',
                      report.status === 'COMPLETED' ? typeConfig.color : 'text-neutral-400'
                    )} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-neutral-900">{report.title}</h3>
                        <p className="text-sm text-neutral-500">{typeConfig.label}</p>
                      </div>
                      <span className={cn(
                        'px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1',
                        status.bgColor,
                        status.color
                      )}>
                        <StatusIcon className={cn(
                          'h-3.5 w-3.5',
                          report.status === 'PENDING' && 'animate-spin'
                        )} />
                        {status.label}
                      </span>
                    </div>

                    {/* Meta Info */}
                    <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-neutral-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(report.generatedAt).toLocaleDateString('en-MY', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      {report.fileSize && (
                        <span>{formatFileSize(report.fileSize)}</span>
                      )}
                      {report.filters.cycle && (
                        <span className="px-2 py-0.5 bg-info-50 text-info-700 rounded-full font-medium">
                          {report.filters.cycle}
                        </span>
                      )}
                      {report.filters.programme && (
                        <span className="px-2 py-0.5 bg-neutral-100 text-neutral-600 rounded-full font-medium">
                          {report.filters.programme}
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 mt-3">
                      {report.status === 'COMPLETED' && (
                        <Button variant="secondary" size="sm">
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      )}
                      {report.status === 'COMPLETED' && report.previewUrl && (
                        <Button variant="secondary" size="sm">
                          <FileText className="h-4 w-4 mr-1" />
                          Preview
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-error-600 hover:text-error-700 hover:bg-error-50"
                        onClick={() => handleDelete(report.reportId)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            )
          })
        ) : (
          <Card className="p-12 text-center">
            <History className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-neutral-900">No reports found</h3>
            <p className="text-neutral-500 mt-1">
              {searchQuery || typeFilter !== 'ALL'
                ? 'Try adjusting your filters'
                : 'Generate your first report to get started'}
            </p>
            {!searchQuery && typeFilter === 'ALL' && (
              <Link to={ROUTES.COMMITTEE.REPORTS}>
                <Button className="mt-4">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Generate Report
                </Button>
              </Link>
            )}
          </Card>
        )}
      </div>

      {/* Summary */}
      {data && data.reports.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-neutral-600">
              Showing {filteredReports?.length ?? 0} of {data.total} reports
            </span>
            <span className="text-neutral-500">
              {data.reports.filter((r) => r.status === 'COMPLETED').length} ready for download
            </span>
          </div>
        </Card>
      )}
    </div>
  )
}
