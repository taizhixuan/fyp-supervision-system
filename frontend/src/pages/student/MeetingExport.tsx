import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  Download,
  Calendar,
  FileText,
  Check,
  Clock,
} from 'lucide-react'
import { Card, Button } from '@/components/ui'
import { useExportMeetings } from '@/lib/hooks/useStudent'
import { ROUTES } from '@/lib/constants/routes'
import { cn } from '@/lib/utils/cn'

type ExportFormat = 'PDF' | 'CSV' | 'ICAL'
type DateRange = 'all' | 'this_month' | 'last_3_months' | 'last_6_months' | 'custom'

const formatOptions: { value: ExportFormat; label: string; description: string; icon: typeof FileText }[] = [
  { value: 'PDF', label: 'PDF Document', description: 'Formatted document with meeting details', icon: FileText },
  { value: 'CSV', label: 'CSV Spreadsheet', description: 'Data export for analysis', icon: FileText },
  { value: 'ICAL', label: 'iCal Calendar', description: 'Import to calendar apps', icon: Calendar },
]

const dateRangeOptions: { value: DateRange; label: string }[] = [
  { value: 'all', label: 'All Meetings' },
  { value: 'this_month', label: 'This Month' },
  { value: 'last_3_months', label: 'Last 3 Months' },
  { value: 'last_6_months', label: 'Last 6 Months' },
  { value: 'custom', label: 'Custom Range' },
]

const statusOptions = [
  { value: 'all', label: 'All Statuses' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'PENDING', label: 'Pending' },
]

export function MeetingExport() {
  const [format, setFormat] = useState<ExportFormat>('PDF')
  const [dateRange, setDateRange] = useState<DateRange>('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [includeNotes, setIncludeNotes] = useState(true)
  const [includeAgenda, setIncludeAgenda] = useState(true)
  const [exportSuccess, setExportSuccess] = useState(false)

  const exportMeetings = useExportMeetings()

  const handleExport = async () => {
    try {
      await exportMeetings.mutateAsync({
        format,
        dateRange: dateRange === 'custom' ? { start: startDate, end: endDate } : dateRange,
        status: statusFilter === 'all' ? undefined : statusFilter,
        includeNotes,
        includeAgenda,
      })
      setExportSuccess(true)
      setTimeout(() => setExportSuccess(false), 3000)
    } catch (err) {
      // Error handled by mutation
    }
  }

  // Estimated meeting count (sample)
  const estimatedCount = 15

  return (
    <div className="max-w-2xl mx-auto space-y-4 lg:space-y-5">
      {/* Back Button */}
      <Link
        to={ROUTES.STUDENT.MEETINGS}
        className="inline-flex items-center gap-2 text-neutral-600 hover:text-primary-600 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Meetings
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Export Meetings</h1>
        <p className="text-neutral-600 mt-1">Download your meeting history in various formats</p>
      </div>

      {/* Format Selection */}
      <Card>
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">Export Format</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {formatOptions.map((option) => {
            const Icon = option.icon
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setFormat(option.value)}
                className={cn(
                  'p-4 rounded-lg border-2 text-left transition-colors',
                  format === option.value
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-neutral-200 hover:border-neutral-300'
                )}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center',
                    format === option.value ? 'bg-primary-100' : 'bg-neutral-100'
                  )}>
                    <Icon className={cn(
                      'h-5 w-5',
                      format === option.value ? 'text-primary-600' : 'text-neutral-500'
                    )} />
                  </div>
                  {format === option.value && (
                    <Check className="h-5 w-5 text-primary-600 ml-auto" />
                  )}
                </div>
                <h3 className="font-medium text-neutral-900">{option.label}</h3>
                <p className="text-xs text-neutral-500 mt-1">{option.description}</p>
              </button>
            )
          })}
        </div>
      </Card>

      {/* Date Range */}
      <Card>
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">Date Range</h2>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {dateRangeOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setDateRange(option.value)}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  dateRange === option.value
                    ? 'bg-primary-100 text-primary-700 border-2 border-primary-500'
                    : 'bg-neutral-100 text-neutral-600 border-2 border-transparent hover:bg-neutral-200'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>

          {dateRange === 'custom' && (
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-neutral-200">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Filters */}
      <Card>
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">Filter & Options</h2>
        <div className="space-y-4">
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Meeting Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Include Options (for PDF/CSV) */}
          {format !== 'ICAL' && (
            <div className="pt-4 border-t border-neutral-200">
              <p className="text-sm font-medium text-neutral-700 mb-3">Include in Export</p>
              <div className="space-y-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeAgenda}
                    onChange={(e) => setIncludeAgenda(e.target.checked)}
                    className="w-4 h-4 text-primary-600 rounded border-neutral-300 focus:ring-primary-500"
                  />
                  <span className="text-sm text-neutral-700">Meeting Agenda</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeNotes}
                    onChange={(e) => setIncludeNotes(e.target.checked)}
                    className="w-4 h-4 text-primary-600 rounded border-neutral-300 focus:ring-primary-500"
                  />
                  <span className="text-sm text-neutral-700">Meeting Notes</span>
                </label>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Preview Summary */}
      <Card className="bg-neutral-50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-neutral-900">Export Summary</h3>
            <p className="text-sm text-neutral-600 mt-1">
              Approximately <span className="font-medium">{estimatedCount}</span> meetings will be exported
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-neutral-500">
            <Clock className="h-4 w-4" />
            {format === 'PDF' ? '~30 seconds' : '~5 seconds'}
          </div>
        </div>
      </Card>

      {/* Export Button */}
      <div className="flex items-center justify-between pt-4 border-t border-neutral-200">
        <div className="flex items-center gap-2">
          {exportSuccess && (
            <>
              <Check className="h-5 w-5 text-success-600" />
              <span className="text-sm text-success-600 font-medium">Export started! Check your downloads.</span>
            </>
          )}
        </div>
        <Button
          variant="primary"
          leftIcon={<Download className="h-4 w-4" />}
          onClick={handleExport}
          isLoading={exportMeetings.isPending}
          disabled={dateRange === 'custom' && (!startDate || !endDate)}
        >
          Export {format}
        </Button>
      </div>

      {/* Tips */}
      <Card className="bg-primary-50 border-primary-200">
        <h3 className="font-medium text-primary-900 mb-2">Export Tips</h3>
        <ul className="text-sm text-primary-700 space-y-1">
          <li>• <strong>PDF</strong> is best for printing or sharing with others</li>
          <li>• <strong>CSV</strong> can be opened in Excel for analysis</li>
          <li>• <strong>iCal</strong> can be imported into Google Calendar, Outlook, or Apple Calendar</li>
        </ul>
      </Card>
    </div>
  )
}
