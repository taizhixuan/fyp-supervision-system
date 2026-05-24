import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  BarChart3, FileText, Download, Calendar, Filter, Clock,
  PieChart, TrendingUp, Users, FolderKanban, History,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { useGenerateReport, useCommitteeCycles } from '@/lib/hooks/useCommittee'
import { ROUTES } from '@/lib/constants/routes'
import { cn } from '@/lib/utils/cn'
import type { ReportType, ReportFormat } from '@/types'

const reportTypes: {
  value: ReportType
  label: string
  description: string
  icon: typeof BarChart3
  color: string
}[] = [
  { value: 'PAIRING_STATUS', label: 'Pairing Status', description: 'Student↔supervisor pairings across the chosen cycle', icon: FolderKanban, color: 'text-amber-600' },
  { value: 'SUPERVISOR_LOAD', label: 'Supervisor Load', description: 'Capacity, utilization, and assigned students', icon: Users, color: 'text-violet-600' },
  { value: 'PROPOSAL_SUMMARY', label: 'Proposal Summary', description: 'Submitted proposals by status', icon: FileText, color: 'text-emerald-600' },
  { value: 'MEETING_LOG_COMPLIANCE', label: 'Meeting Log Compliance', description: 'LOCKED logs per student vs the 6-log minimum', icon: TrendingUp, color: 'text-sky-600' },
  { value: 'RISK_ASSESSMENT', label: 'Risk Assessment', description: 'Projects flagged HIGH or MEDIUM with reasons', icon: BarChart3, color: 'text-rose-600' },
]

export function ReportsModule() {
  const navigate = useNavigate()
  const [selectedReport, setSelectedReport] = useState<ReportType | null>(null)
  const [format, setFormat] = useState<ReportFormat>('CSV')
  const [cycleId, setCycleId] = useState<number | undefined>(undefined)
  const [programmeFilter, setProgrammeFilter] = useState<string>('')
  const [dateRange, setDateRange] = useState<{ from: string; to: string }>({
    from: new Date(new Date().setMonth(new Date().getMonth() - 6)).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0],
  })

  const cyclesQuery = useCommitteeCycles()
  const generateMutation = useGenerateReport()

  const handleGenerate = async () => {
    if (!selectedReport) return
    try {
      await generateMutation.mutateAsync({
        reportType: selectedReport,
        format,
        filters: {
          cycleId,
          cycleStatus: cycleId ? undefined : 'ACTIVE',
          programme: programmeFilter || undefined,
          dateFrom: dateRange.from,
          dateTo: dateRange.to,
        },
      })
      navigate(ROUTES.COMMITTEE.REPORTS_HISTORY)
    } catch (e) {
      console.error('Failed to generate report:', e)
    }
  }

  return (
    <div className="space-y-3 lg:space-y-4">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-stone-800 via-stone-800 to-stone-900 p-3 sm:p-4 text-white shadow-md">
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-9 h-9 bg-amber-500/20 rounded-lg flex items-center justify-center ring-1 ring-amber-500/30">
              <BarChart3 className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-white leading-tight">Reports Module</h1>
              <p className="text-stone-300 text-xs">Generate FYP management reports (CSV / XLSX / PDF)</p>
            </div>
          </div>
          <Link to={ROUTES.COMMITTEE.REPORTS_HISTORY}>
            <Button variant="secondary" className="border-stone-600 text-stone-200 hover:bg-stone-700">
              <History className="h-4 w-4 mr-2" />
              View Generated Reports
            </Button>
          </Link>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="p-4 bg-gradient-to-r from-stone-100 to-stone-50 border-b border-stone-200">
          <h3 className="font-semibold text-stone-800 flex items-center gap-2"><PieChart className="h-5 w-5 text-amber-600" />Select Report Type</h3>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reportTypes.map((report) => {
              const Icon = report.icon
              return (
                <button
                  key={report.value} type="button"
                  onClick={() => setSelectedReport(report.value)}
                  className={cn(
                    'p-4 rounded-xl border-2 text-left transition-all duration-300',
                    selectedReport === report.value
                      ? 'border-amber-500 bg-amber-50 ring-2 ring-amber-200 shadow-sm'
                      : 'border-stone-200 hover:bg-stone-50 hover:border-stone-300')}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center',
                      selectedReport === report.value ? 'bg-amber-100' : 'bg-stone-100')}>
                      <Icon className={cn('h-5 w-5', report.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-stone-800">{report.label}</h4>
                      <p className="text-xs text-stone-500 mt-1 line-clamp-2">{report.description}</p>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="p-4 bg-gradient-to-r from-stone-100 to-stone-50 border-b border-stone-200">
          <h3 className="font-semibold text-stone-800 flex items-center gap-2"><Filter className="h-5 w-5 text-amber-600" />Report Filters</h3>
        </div>
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">FYP Cycle</label>
            <select
              value={cycleId ?? ''} onChange={(e) => setCycleId(e.target.value ? Number(e.target.value) : undefined)}
              className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm bg-white"
            >
              <option value="">All Active Cycles</option>
              {(cyclesQuery.data?.cycles ?? []).map(c => (
                <option key={c.cycleId} value={c.cycleId}>
                  {c.cycleType} · {c.academicYear} Sem {c.semester} · {c.status}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Programme</label>
            <select
              value={programmeFilter} onChange={(e) => setProgrammeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm bg-white"
            >
              <option value="">All Programmes</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Software Engineering">Software Engineering</option>
              <option value="Information Technology">Information Technology</option>
              <option value="Data Science">Data Science</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">From Date</label>
            <input type="date" value={dateRange.from}
              onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
              className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm bg-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">To Date</label>
            <input type="date" value={dateRange.to}
              onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
              className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm bg-white" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-stone-700 mb-1">Format</label>
            <div className="flex gap-2">
              {(['CSV','XLSX','PDF'] as const).map(f => (
                <button
                  key={f} type="button" onClick={() => setFormat(f)}
                  className={cn('flex-1 px-3 py-2 rounded-lg border text-sm font-medium transition-colors',
                    format === f ? 'border-amber-500 bg-amber-50 text-amber-800' : 'border-stone-200 hover:bg-stone-50')}
                >{f}</button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {selectedReport && (
        <Card className="border-l-4 border-l-amber-500 bg-amber-50/30">
          <div className="flex items-start justify-between p-4">
            <div>
              <h3 className="font-semibold text-stone-800">{reportTypes.find(r => r.value === selectedReport)?.label}</h3>
              <p className="text-sm text-stone-600 mt-1">{reportTypes.find(r => r.value === selectedReport)?.description}</p>
              <div className="flex items-center gap-4 mt-3 text-xs text-stone-500">
                <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{dateRange.from} to {dateRange.to}</span>
                {cycleId && <span className="px-2 py-0.5 bg-sky-100 text-sky-700 rounded-full font-medium">cycleId={cycleId}</span>}
                {programmeFilter && <span className="px-2 py-0.5 bg-stone-200 text-stone-700 rounded-full font-medium">{programmeFilter}</span>}
                <span className="px-2 py-0.5 bg-stone-100 text-stone-700 rounded-full font-medium">{format}</span>
              </div>
            </div>
            <span className="text-xs text-stone-400 flex items-center gap-1"><Clock className="h-3.5 w-3.5" />Synchronous</span>
          </div>
        </Card>
      )}

      <div className="flex justify-end gap-3">
        <Link to={ROUTES.COMMITTEE.DASHBOARD}>
          <Button variant="secondary" className="border-stone-300">Cancel</Button>
        </Link>
        <Button onClick={handleGenerate} disabled={!selectedReport || generateMutation.isPending}
          className="bg-amber-500 hover:bg-amber-600 text-white">
          {generateMutation.isPending ? <Spinner size="sm" className="mr-2" /> : <Download className="h-4 w-4 mr-2" />}
          Generate Report
        </Button>
      </div>
    </div>
  )
}
