import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  Download,
  FileText,
  FileSpreadsheet,
  Check,
  Filter,
  Calendar,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { useExportProjectData } from '@/lib/hooks/useCommittee'
import { ROUTES } from '@/lib/constants/routes'
import { cn } from '@/lib/utils/cn'
import type { ProjectStatus, PairingStatus } from '@/types'

type ExportFormat = 'CSV' | 'PDF'
type ExportType = 'PROJECTS' | 'STUDENTS' | 'SUPERVISORS' | 'PAIRINGS' | 'PROGRESS'

const exportTypes: { value: ExportType; label: string; description: string }[] = [
  { value: 'PROJECTS', label: 'All Projects', description: 'Complete list of all FYP projects with details' },
  { value: 'STUDENTS', label: 'Student List', description: 'All registered FYP students and their status' },
  { value: 'SUPERVISORS', label: 'Supervisor Load', description: 'Supervisor capacity and current load' },
  { value: 'PAIRINGS', label: 'Pairing Report', description: 'Student-supervisor pairings summary' },
  { value: 'PROGRESS', label: 'Progress Report', description: 'Project progress and milestone status' },
]

export function ExportOverview() {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('CSV')
  const [selectedType, setSelectedType] = useState<ExportType>('PROJECTS')
  const [cycleFilter, setCycleFilter] = useState<'FYP1' | 'FYP2' | 'ALL'>('ALL')
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'ALL'>('ALL')
  const [pairingFilter, setPairingFilter] = useState<PairingStatus | 'ALL'>('ALL')

  const exportMutation = useExportProjectData()

  const handleExport = async () => {
    try {
      await exportMutation.mutateAsync({
        format: selectedFormat,
        type: selectedType,
        filters: {
          cycle: cycleFilter !== 'ALL' ? cycleFilter : undefined,
          status: statusFilter !== 'ALL' ? statusFilter : undefined,
          pairingStatus: pairingFilter !== 'ALL' ? pairingFilter : undefined,
        },
      })
    } catch (error) {
      console.error('Export failed:', error)
    }
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to={ROUTES.COMMITTEE.PROJECTS}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Button>
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
          <Download className="h-7 w-7 text-primary-600" />
          Export Data
        </h1>
        <p className="text-neutral-600 mt-1">
          Export project and pairing data for reporting
        </p>
      </div>

      {/* Export Type Selection */}
      <Card className="p-6">
        <h3 className="font-semibold text-neutral-900 mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary-600" />
          Select Data to Export
        </h3>

        <div className="space-y-2">
          {exportTypes.map((type) => (
            <label
              key={type.value}
              className={cn(
                'flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors',
                selectedType === type.value
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-neutral-200 hover:bg-neutral-50'
              )}
            >
              <input
                type="radio"
                name="exportType"
                value={type.value}
                checked={selectedType === type.value}
                onChange={() => setSelectedType(type.value)}
                className="sr-only"
              />
              <div className={cn(
                'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5',
                selectedType === type.value
                  ? 'border-primary-500 bg-primary-500'
                  : 'border-neutral-300'
              )}>
                {selectedType === type.value && (
                  <Check className="h-3 w-3 text-white" />
                )}
              </div>
              <div>
                <span className="font-medium text-neutral-900">{type.label}</span>
                <p className="text-sm text-neutral-500 mt-0.5">{type.description}</p>
              </div>
            </label>
          ))}
        </div>
      </Card>

      {/* Filters */}
      <Card className="p-6">
        <h3 className="font-semibold text-neutral-900 mb-4 flex items-center gap-2">
          <Filter className="h-5 w-5 text-primary-600" />
          Filters
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Project Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ProjectStatus | 'ALL')}
              className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500"
            >
              <option value="ALL">All Status</option>
              <option value="NOT_STARTED">Not Started</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="ON_HOLD">On Hold</option>
            </select>
          </div>

          {/* Pairing Filter */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Pairing Status
            </label>
            <select
              value={pairingFilter}
              onChange={(e) => setPairingFilter(e.target.value as PairingStatus | 'ALL')}
              className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500"
            >
              <option value="ALL">All</option>
              <option value="PAIRED">Paired</option>
              <option value="UNPAIRED">Unpaired</option>
              <option value="PENDING_APPROVAL">Pending Approval</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Format Selection */}
      <Card className="p-6">
        <h3 className="font-semibold text-neutral-900 mb-4 flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5 text-primary-600" />
          Export Format
        </h3>

        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => setSelectedFormat('CSV')}
            className={cn(
              'flex-1 p-4 rounded-lg border-2 transition-colors text-left',
              selectedFormat === 'CSV'
                ? 'border-primary-500 bg-primary-50'
                : 'border-neutral-200 hover:bg-neutral-50'
            )}
          >
            <div className="flex items-center gap-3">
              <div className={cn(
                'w-10 h-10 rounded-lg flex items-center justify-center',
                selectedFormat === 'CSV' ? 'bg-primary-100' : 'bg-neutral-100'
              )}>
                <FileSpreadsheet className={cn(
                  'h-5 w-5',
                  selectedFormat === 'CSV' ? 'text-primary-600' : 'text-neutral-500'
                )} />
              </div>
              <div>
                <span className="font-medium text-neutral-900">CSV</span>
                <p className="text-xs text-neutral-500">Spreadsheet compatible</p>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setSelectedFormat('PDF')}
            className={cn(
              'flex-1 p-4 rounded-lg border-2 transition-colors text-left',
              selectedFormat === 'PDF'
                ? 'border-primary-500 bg-primary-50'
                : 'border-neutral-200 hover:bg-neutral-50'
            )}
          >
            <div className="flex items-center gap-3">
              <div className={cn(
                'w-10 h-10 rounded-lg flex items-center justify-center',
                selectedFormat === 'PDF' ? 'bg-primary-100' : 'bg-neutral-100'
              )}>
                <FileText className={cn(
                  'h-5 w-5',
                  selectedFormat === 'PDF' ? 'text-primary-600' : 'text-neutral-500'
                )} />
              </div>
              <div>
                <span className="font-medium text-neutral-900">PDF</span>
                <p className="text-xs text-neutral-500">Print-ready document</p>
              </div>
            </div>
          </button>
        </div>
      </Card>

      {/* Export Summary */}
      <Card className="p-6 bg-neutral-50">
        <h3 className="font-semibold text-neutral-900 mb-3">Export Summary</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-neutral-500">Data Type:</span>
            <span className="font-medium text-neutral-900">
              {exportTypes.find((t) => t.value === selectedType)?.label}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-500">Format:</span>
            <span className="font-medium text-neutral-900">{selectedFormat}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-500">Filters Applied:</span>
            <span className="font-medium text-neutral-900">
              {[
                cycleFilter !== 'ALL' ? cycleFilter : null,
                statusFilter !== 'ALL' ? statusFilter.replace('_', ' ') : null,
                pairingFilter !== 'ALL' ? pairingFilter.replace('_', ' ') : null,
              ].filter(Boolean).join(', ') || 'None'}
            </span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-neutral-200 mt-2">
            <span className="text-neutral-500 flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Generated:
            </span>
            <span className="font-medium text-neutral-900">
              {new Date().toLocaleDateString('en-MY', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        </div>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Link to={ROUTES.COMMITTEE.PROJECTS}>
          <Button variant="outline">Cancel</Button>
        </Link>
        <Button onClick={handleExport} disabled={exportMutation.isPending}>
          {exportMutation.isPending ? (
            <Spinner size="sm" className="mr-2" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          Export {selectedFormat}
        </Button>
      </div>

      {/* Success Message */}
      {exportMutation.isSuccess && (
        <Card className="p-4 bg-success-50 border-success-200">
          <div className="flex items-center gap-3">
            <Check className="h-5 w-5 text-success-600" />
            <div>
              <p className="font-medium text-success-800">Export Successful!</p>
              <p className="text-sm text-success-700">
                Your file has been downloaded. Check your downloads folder.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
