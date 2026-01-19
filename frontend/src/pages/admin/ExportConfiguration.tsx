import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Download,
  Plus,
  Search,
  FileSpreadsheet,
  FileText,
  FileJson,
  Calendar,
  Clock,
  Play,
  Pause,
  CheckCircle,
  X,
  Edit,
  Trash2,
  Settings,
  Database,
  Users,
  FolderKanban,
  ClipboardList,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import { useExportConfigurations } from '@/lib/hooks/useAdmin'
import { cn } from '@/lib/utils/cn'
import type { ExportConfiguration, ExportSchedule } from '@/types'

const exportSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
  dataType: z.enum(['USERS', 'PROJECTS', 'PROPOSALS', 'MEETINGS', 'REPORTS', 'AUDIT_LOGS']),
  format: z.enum(['CSV', 'EXCEL', 'JSON', 'PDF']),
  includeFields: z.array(z.string()).min(1, 'Select at least one field'),
  schedule: z.object({
    enabled: z.boolean(),
    frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY']).optional(),
    dayOfWeek: z.number().min(0).max(6).optional(),
    dayOfMonth: z.number().min(1).max(28).optional(),
    time: z.string().optional(),
  }),
})

type ExportFormData = z.infer<typeof exportSchema>

const dataTypeConfig: Record<string, { label: string; icon: typeof Users; fields: string[] }> = {
  USERS: {
    label: 'Users',
    icon: Users,
    fields: ['userId', 'fullName', 'email', 'role', 'status', 'department', 'createdAt', 'lastLoginAt'],
  },
  PROJECTS: {
    label: 'Projects',
    icon: FolderKanban,
    fields: ['projectId', 'title', 'description', 'status', 'studentName', 'supervisorName', 'createdAt', 'updatedAt'],
  },
  PROPOSALS: {
    label: 'Proposals',
    icon: FileText,
    fields: ['proposalId', 'title', 'status', 'studentName', 'supervisorName', 'submittedAt', 'reviewedAt', 'feedback'],
  },
  MEETINGS: {
    label: 'Meetings',
    icon: Calendar,
    fields: ['meetingId', 'type', 'scheduledAt', 'duration', 'studentName', 'supervisorName', 'status', 'notes'],
  },
  REPORTS: {
    label: 'Reports',
    icon: ClipboardList,
    fields: ['reportId', 'type', 'title', 'studentName', 'submittedAt', 'status', 'grade', 'feedback'],
  },
  AUDIT_LOGS: {
    label: 'Audit Logs',
    icon: Database,
    fields: ['logId', 'action', 'entityType', 'entityId', 'userId', 'ipAddress', 'timestamp', 'details'],
  },
}

const formatConfig: Record<string, { label: string; icon: typeof FileText; extension: string }> = {
  CSV: { label: 'CSV', icon: FileSpreadsheet, extension: '.csv' },
  EXCEL: { label: 'Excel', icon: FileSpreadsheet, extension: '.xlsx' },
  JSON: { label: 'JSON', icon: FileJson, extension: '.json' },
  PDF: { label: 'PDF', icon: FileText, extension: '.pdf' },
}

export function ExportConfigurationPage() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingConfig, setEditingConfig] = useState<ExportConfiguration | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const { data, isLoading } = useExportConfigurations()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ExportFormData>({
    resolver: zodResolver(exportSchema),
    defaultValues: {
      includeFields: [],
      schedule: { enabled: false },
    },
  })

  const selectedDataType = watch('dataType')
  const selectedFields = watch('includeFields')
  const scheduleEnabled = watch('schedule.enabled')

  const filteredConfigs = data?.configurations.filter((config) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      config.name.toLowerCase().includes(query) ||
      config.dataType.toLowerCase().includes(query)
    )
  })

  const handleCreate = async (formData: ExportFormData) => {
    console.log('Creating export config:', formData)
    setShowCreateModal(false)
    reset()
  }

  const handleExportNow = (config: ExportConfiguration) => {
    console.log('Exporting:', config.name)
    // Trigger immediate export
  }

  const toggleField = (field: string) => {
    const current = selectedFields || []
    if (current.includes(field)) {
      setValue('includeFields', current.filter((f) => f !== field))
    } else {
      setValue('includeFields', [...current, field])
    }
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
            <Download className="h-7 w-7 text-primary-600" />
            Export Configuration
          </h1>
          <p className="text-neutral-600 mt-1">
            Configure data exports and scheduled reports
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Export
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-neutral-500">Total Exports</p>
          <p className="text-2xl font-bold text-neutral-900">{data?.configurations.length || 0}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-neutral-500">Scheduled</p>
          <p className="text-2xl font-bold text-info-600">
            {data?.configurations.filter((c) => c.schedule?.enabled).length || 0}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-neutral-500">Active</p>
          <p className="text-2xl font-bold text-success-600">
            {data?.configurations.filter((c) => c.isActive).length || 0}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-neutral-500">Last Export</p>
          <p className="text-lg font-bold text-neutral-900">
            {data?.configurations[0]?.lastExportedAt
              ? new Date(data.configurations[0].lastExportedAt).toLocaleDateString()
              : 'Never'}
          </p>
        </Card>
      </div>

      {/* Search */}
      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <Input
            type="text"
            placeholder="Search exports..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </Card>

      {/* Export Configurations List */}
      <div className="space-y-4">
        {filteredConfigs && filteredConfigs.length > 0 ? (
          filteredConfigs.map((config) => {
            const dataType = dataTypeConfig[config.dataType]
            const format = formatConfig[config.format]
            const DataIcon = dataType?.icon || Database
            const FormatIcon = format?.icon || FileText

            return (
              <Card key={config.configId} className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-primary-50 rounded-lg">
                      <DataIcon className="h-6 w-6 text-primary-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-neutral-900">{config.name}</h3>
                        {config.isActive ? (
                          <span className="px-2 py-0.5 bg-success-50 text-success-600 rounded-full text-xs font-medium">
                            Active
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-neutral-100 text-neutral-500 rounded-full text-xs font-medium">
                            Inactive
                          </span>
                        )}
                      </div>
                      {config.description && (
                        <p className="text-sm text-neutral-500 mt-1">{config.description}</p>
                      )}

                      <div className="flex items-center gap-4 mt-3">
                        <span className="flex items-center gap-1.5 text-sm text-neutral-600">
                          <DataIcon className="h-4 w-4 text-neutral-400" />
                          {dataType?.label || config.dataType}
                        </span>
                        <span className="flex items-center gap-1.5 text-sm text-neutral-600">
                          <FormatIcon className="h-4 w-4 text-neutral-400" />
                          {format?.label || config.format}
                        </span>
                        <span className="flex items-center gap-1.5 text-sm text-neutral-600">
                          <Settings className="h-4 w-4 text-neutral-400" />
                          {config.includeFields?.length || 0} fields
                        </span>
                      </div>

                      {/* Schedule Info */}
                      {config.schedule?.enabled && (
                        <div className="flex items-center gap-2 mt-2 text-sm">
                          <Clock className="h-4 w-4 text-info-600" />
                          <span className="text-info-600 font-medium">
                            Scheduled: {config.schedule.frequency?.toLowerCase()} at {config.schedule.time}
                          </span>
                        </div>
                      )}

                      {/* Last Export */}
                      {config.lastExportedAt && (
                        <p className="text-xs text-neutral-400 mt-2">
                          Last exported: {new Date(config.lastExportedAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExportNow(config)}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Export Now
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingConfig(config)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            )
          })
        ) : (
          <Card className="p-12 text-center">
            <Download className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-neutral-900">No export configurations</h3>
            <p className="text-neutral-500 mt-1">
              Create your first export configuration to get started
            </p>
            <Button className="mt-4" onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Export
            </Button>
          </Card>
        )}
      </div>

      {/* Quick Export Section */}
      <Card className="p-6">
        <h3 className="font-semibold text-neutral-900 mb-4 flex items-center gap-2">
          <Download className="h-5 w-5 text-primary-600" />
          Quick Export
        </h3>
        <p className="text-sm text-neutral-500 mb-4">
          Export data immediately without creating a configuration
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {Object.entries(dataTypeConfig).map(([type, config]) => {
            const Icon = config.icon
            return (
              <Button
                key={type}
                variant="outline"
                className="flex-col h-auto py-4"
                onClick={() => console.log('Quick export:', type)}
              >
                <Icon className="h-6 w-6 mb-2 text-primary-600" />
                <span className="text-sm">{config.label}</span>
              </Button>
            )
          })}
        </div>
      </Card>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingConfig) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-neutral-900">
                {editingConfig ? 'Edit Export Configuration' : 'Create Export Configuration'}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setShowCreateModal(false)
                  setEditingConfig(null)
                  reset()
                }}
                className="p-1 hover:bg-neutral-100 rounded"
              >
                <X className="h-5 w-5 text-neutral-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit(handleCreate)} className="space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Export Name *
                  </label>
                  <Input
                    {...register('name')}
                    placeholder="e.g., Weekly User Report"
                    error={errors.name?.message}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Description
                  </label>
                  <textarea
                    {...register('description')}
                    placeholder="Optional description..."
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500"
                    rows={2}
                  />
                </div>
              </div>

              {/* Data Type & Format */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Data Type *
                  </label>
                  <select
                    {...register('dataType')}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Select data type</option>
                    {Object.entries(dataTypeConfig).map(([key, config]) => (
                      <option key={key} value={key}>{config.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Format *
                  </label>
                  <select
                    {...register('format')}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Select format</option>
                    {Object.entries(formatConfig).map(([key, config]) => (
                      <option key={key} value={key}>{config.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Field Selection */}
              {selectedDataType && dataTypeConfig[selectedDataType] && (
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Include Fields *
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {dataTypeConfig[selectedDataType].fields.map((field) => (
                      <label
                        key={field}
                        className={cn(
                          'flex items-center gap-2 p-2 border rounded cursor-pointer text-sm',
                          selectedFields?.includes(field)
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-neutral-200 hover:bg-neutral-50'
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={selectedFields?.includes(field)}
                          onChange={() => toggleField(field)}
                          className="rounded"
                        />
                        <span className="font-mono text-xs">{field}</span>
                      </label>
                    ))}
                  </div>
                  {errors.includeFields && (
                    <p className="text-sm text-error-600 mt-1">{errors.includeFields.message}</p>
                  )}
                </div>
              )}

              {/* Schedule */}
              <div className="space-y-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    {...register('schedule.enabled')}
                    className="rounded"
                  />
                  <span className="text-sm font-medium text-neutral-700">
                    Enable scheduled export
                  </span>
                </label>

                {scheduleEnabled && (
                  <div className="grid grid-cols-3 gap-4 p-4 bg-neutral-50 rounded-lg">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">
                        Frequency
                      </label>
                      <select
                        {...register('schedule.frequency')}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="DAILY">Daily</option>
                        <option value="WEEKLY">Weekly</option>
                        <option value="MONTHLY">Monthly</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">
                        Time
                      </label>
                      <Input type="time" {...register('schedule.time')} />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">
                        Day
                      </label>
                      <select
                        {...register('schedule.dayOfWeek', { valueAsNumber: true })}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500"
                      >
                        <option value={0}>Sunday</option>
                        <option value={1}>Monday</option>
                        <option value={2}>Tuesday</option>
                        <option value={3}>Wednesday</option>
                        <option value={4}>Thursday</option>
                        <option value={5}>Friday</option>
                        <option value={6}>Saturday</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateModal(false)
                    setEditingConfig(null)
                    reset()
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {editingConfig ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  )
}
