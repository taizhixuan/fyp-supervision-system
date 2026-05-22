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
  CheckCircle,
  X,
  Edit,
  Settings,
  Database,
  Users,
  FolderKanban,
  ClipboardList,
  Sparkles,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import { useExportConfigurations } from '@/lib/hooks/useAdmin'
import { cn } from '@/lib/utils/cn'
import type { ExportConfiguration } from '@/types'

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

const dataTypeConfig: Record<string, { label: string; icon: typeof Users; fields: string[]; colors: string }> = {
  STUDENTS: {
    label: 'Students',
    icon: Users,
    fields: ['userId', 'fullName', 'email', 'role', 'status', 'department', 'createdAt', 'lastLoginAt'],
    colors: 'bg-sky-100 text-sky-700 border-sky-200',
  },
  SUPERVISORS: {
    label: 'Supervisors',
    icon: Users,
    fields: ['userId', 'fullName', 'email', 'department', 'expertise', 'availableSlots', 'createdAt'],
    colors: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  },
  PROJECTS: {
    label: 'Projects',
    icon: FolderKanban,
    fields: ['projectId', 'title', 'description', 'status', 'studentName', 'supervisorName', 'createdAt', 'updatedAt'],
    colors: 'bg-violet-100 text-violet-700 border-violet-200',
  },
  PROPOSALS: {
    label: 'Proposals',
    icon: FileText,
    fields: ['proposalId', 'title', 'status', 'studentName', 'supervisorName', 'submittedAt', 'reviewedAt', 'feedback'],
    colors: 'bg-amber-100 text-amber-700 border-amber-200',
  },
  MEETINGS: {
    label: 'Meetings',
    icon: Calendar,
    fields: ['meetingId', 'type', 'scheduledAt', 'duration', 'studentName', 'supervisorName', 'status', 'notes'],
    colors: 'bg-orange-100 text-orange-700 border-orange-200',
  },
  LOGS: {
    label: 'Audit Logs',
    icon: Database,
    fields: ['logId', 'action', 'entityType', 'entityId', 'userId', 'ipAddress', 'timestamp', 'details'],
    colors: 'bg-stone-100 text-stone-700 border-stone-200',
  },
  REPORTS: {
    label: 'Reports',
    icon: ClipboardList,
    fields: ['reportId', 'type', 'title', 'studentName', 'submittedAt', 'status', 'grade', 'feedback'],
    colors: 'bg-teal-100 text-teal-700 border-teal-200',
  },
}

const formatConfig: Record<string, { label: string; icon: typeof FileText; extension: string; colors: string }> = {
  CSV: { label: 'CSV', icon: FileSpreadsheet, extension: '.csv', colors: 'bg-emerald-100 text-emerald-700' },
  EXCEL: { label: 'Excel', icon: FileSpreadsheet, extension: '.xlsx', colors: 'bg-sky-100 text-sky-700' },
  JSON: { label: 'JSON', icon: FileJson, extension: '.json', colors: 'bg-amber-100 text-amber-700' },
  PDF: { label: 'PDF', icon: FileText, extension: '.pdf', colors: 'bg-rose-100 text-rose-700' },
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

  const filteredConfigs = data?.configs.filter((config) => {
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
    <div className="space-y-3 lg:space-y-4">
      {/* Header */}
      <div className="relative bg-gradient-to-br from-stone-800 via-stone-800 to-stone-900 rounded-xl p-3 sm:p-4 text-white shadow-md overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-amber-500/20 rounded-xl flex items-center justify-center ring-1 ring-amber-500/30">
              <Download className="h-7 w-7 text-amber-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                Export Configuration
                <Sparkles className="h-5 w-5 text-amber-400" />
              </h1>
              <p className="text-stone-300 text-xs">
                Configure data exports and scheduled reports
              </p>
            </div>
          </div>
          <Button onClick={() => setShowCreateModal(true)} className="bg-amber-500 hover:bg-amber-600 text-white border-0">
            <Plus className="h-4 w-4 mr-2" />
            Create Export
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 border-l-4 border-l-amber-500">
          <p className="text-sm text-neutral-500">Total Exports</p>
          <p className="text-xl sm:text-2xl font-bold text-neutral-900 leading-tight">{data?.configs.length || 0}</p>
        </Card>
        <Card className="p-4 border-l-4 border-l-emerald-500">
          <p className="text-sm text-neutral-500">Scheduled</p>
          <p className="text-2xl font-bold text-emerald-600">
            {data?.configs.filter((c) => c.schedule?.enabled).length || 0}
          </p>
        </Card>
        <Card className="p-4 border-l-4 border-l-sky-500">
          <p className="text-sm text-neutral-500">Active</p>
          <p className="text-2xl font-bold text-sky-600">
            {data?.configs.filter((c) => c.isActive).length || 0}
          </p>
        </Card>
        <Card className="p-4 border-l-4 border-l-violet-500">
          <p className="text-sm text-neutral-500">Last Export</p>
          <p className="text-lg font-bold text-neutral-900">
            {data?.configs[0]?.lastExportedAt
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
              <Card key={config.configId} className="p-5 hover:shadow-lg hover:scale-[1.01] transition-all duration-300">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className={cn('p-3 rounded-lg border', dataType?.colors || 'bg-stone-100 text-stone-700 border-stone-200')}>
                      <DataIcon className="h-6 w-6" />
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
                      variant="secondary"
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
          <Card className="text-center py-8">
            <Download className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
            <h3 className="font-medium text-neutral-900">No export configurations</h3>
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
      <Card>
        <h3 className="font-semibold text-neutral-900 mb-4 flex items-center gap-2">
          <Download className="h-5 w-5 text-amber-600" />
          Quick Export
        </h3>
        <p className="text-sm text-neutral-500 mb-4">
          Export data immediately without creating a configuration
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
          {Object.entries(dataTypeConfig).map(([type, config]) => {
            const Icon = config.icon
            return (
              <Button
                key={type}
                variant="secondary"
                className={cn('flex-col h-auto py-4 border hover:scale-105 transition-all duration-200', config.colors)}
                onClick={() => console.log('Quick export:', type)}
              >
                <Icon className="h-6 w-6 mb-2" />
                <span className="text-sm">{config.label}</span>
              </Button>
            )
          })}
        </div>
      </Card>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingConfig) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-0">
            <div className="bg-gradient-to-r from-stone-800 to-stone-900 p-4 rounded-t-xl">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Download className="h-5 w-5 text-amber-400" />
                  {editingConfig ? 'Edit Export Configuration' : 'Create Export Configuration'}
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false)
                    setEditingConfig(null)
                    reset()
                  }}
                  className="p-1 hover:bg-stone-700 rounded text-stone-400 hover:text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit(handleCreate)} className="p-6 space-y-3 lg:space-y-4">
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
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:ring-2 focus:ring-amber-500"
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
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:ring-2 focus:ring-amber-500"
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
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:ring-2 focus:ring-amber-500"
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
                          'flex items-center gap-2 p-2 border rounded cursor-pointer text-sm transition-all',
                          selectedFields?.includes(field)
                            ? 'border-amber-500 bg-amber-50 text-amber-700'
                            : 'border-neutral-200 hover:bg-stone-50'
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={selectedFields?.includes(field)}
                          onChange={() => toggleField(field)}
                          className="rounded text-amber-600 focus:ring-amber-500"
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
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span className="text-sm font-medium text-neutral-700">
                    Enable scheduled export
                  </span>
                </label>

                {scheduleEnabled && (
                  <div className="grid grid-cols-3 gap-4 p-4 bg-stone-50 rounded-lg border border-stone-200">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">
                        Frequency
                      </label>
                      <select
                        {...register('schedule.frequency')}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:ring-2 focus:ring-amber-500"
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
                        className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:ring-2 focus:ring-amber-500"
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
                  variant="secondary"
                  onClick={() => {
                    setShowCreateModal(false)
                    setEditingConfig(null)
                    reset()
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" className="bg-amber-500 hover:bg-amber-600 text-white border-0">
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
