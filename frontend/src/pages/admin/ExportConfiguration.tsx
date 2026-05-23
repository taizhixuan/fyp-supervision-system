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
  Megaphone,
  ClipboardList,
  Database,
  Clock,
  CheckCircle,
  X,
  Edit,
  Trash2,
  Settings,
  Users,
  FolderKanban,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import { useSuccessToast, useErrorToast } from '@/components/ui/Toast'
import {
  useExportConfigurations,
  useCreateExportConfig,
  useUpdateExportConfig,
  useRunExport,
  useDeleteExportConfig,
} from '@/lib/hooks/useAdmin'
import { apiClient } from '@/lib/api/client'
import { cn } from '@/lib/utils/cn'
import type { ExportConfiguration } from '@/types'

const exportSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  dataType: z.enum(['USERS', 'PROJECTS', 'PROPOSALS', 'MEETINGS', 'MEETING_LOGS', 'ANNOUNCEMENTS', 'AUDIT_LOGS']),
  format: z.enum(['CSV', 'JSON', 'XLSX']),
  fields: z.array(z.string()).min(1, 'Select at least one field'),
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
  USERS: {
    label: 'Users',
    icon: Users,
    fields: ['userId', 'email', 'fullName', 'role', 'status', 'mmuId', 'phone', 'department', 'lastLoginAt', 'createdAt'],
    colors: 'bg-sky-100 text-sky-700 border-sky-200',
  },
  PROJECTS: {
    label: 'Projects',
    icon: FolderKanban,
    fields: ['projectId', 'title', 'status', 'studentId', 'studentName', 'supervisorId', 'supervisorName', 'cycleCode', 'registeredAt', 'updatedAt'],
    colors: 'bg-violet-100 text-violet-700 border-violet-200',
  },
  PROPOSALS: {
    label: 'Proposals',
    icon: FileText,
    fields: ['proposalId', 'title', 'status', 'currentVersion', 'studentName', 'supervisorName', 'createdAt', 'updatedAt'],
    colors: 'bg-amber-100 text-amber-700 border-amber-200',
  },
  MEETINGS: {
    label: 'Meetings',
    icon: Calendar,
    fields: ['meetingId', 'title', 'meetingType', 'status', 'platform', 'scheduledStart', 'scheduledEnd', 'durationMinutes', 'studentName', 'supervisorName'],
    colors: 'bg-orange-100 text-orange-700 border-orange-200',
  },
  MEETING_LOGS: {
    label: 'Meeting Logs',
    icon: ClipboardList,
    fields: ['logId', 'meetingDate', 'meetingNumber', 'fypPhase', 'status', 'studentName', 'supervisorName', 'submittedAt', 'lockedAt'],
    colors: 'bg-teal-100 text-teal-700 border-teal-200',
  },
  ANNOUNCEMENTS: {
    label: 'Announcements',
    icon: Megaphone,
    fields: ['announcementId', 'title', 'scope', 'priority', 'status', 'createdBy', 'publishAt', 'expiresAt', 'viewCount'],
    colors: 'bg-rose-100 text-rose-700 border-rose-200',
  },
  AUDIT_LOGS: {
    label: 'Audit Logs',
    icon: Database,
    fields: ['auditId', 'action', 'entityName', 'entityId', 'user', 'details', 'ipAddress', 'timestamp'],
    colors: 'bg-stone-100 text-stone-700 border-stone-200',
  },
}

const formatConfig: Record<string, { label: string; icon: typeof FileText; extension: string; colors: string; mime: string }> = {
  CSV: { label: 'CSV', icon: FileSpreadsheet, extension: '.csv', colors: 'bg-emerald-100 text-emerald-700', mime: 'text/csv' },
  JSON: { label: 'JSON', icon: FileJson, extension: '.json', colors: 'bg-amber-100 text-amber-700', mime: 'application/json' },
  XLSX: { label: 'Excel', icon: FileSpreadsheet, extension: '.xlsx', colors: 'bg-sky-100 text-sky-700', mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
}

export function ExportConfigurationPage() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingConfig, setEditingConfig] = useState<ExportConfiguration | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [runningId, setRunningId] = useState<number | null>(null)

  const { data, isLoading } = useExportConfigurations()
  const createMutation = useCreateExportConfig()
  const updateMutation = useUpdateExportConfig()
  const runMutation = useRunExport()
  const deleteMutation = useDeleteExportConfig()
  const successToast = useSuccessToast()
  const errorToast = useErrorToast()

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
      fields: [],
      format: 'CSV',
      schedule: { enabled: false },
    },
  })

  const selectedDataType = watch('dataType')
  const selectedFields = watch('fields')
  const scheduleEnabled = watch('schedule.enabled')

  const filteredConfigs = data?.configs.filter((config: any) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      config.name?.toLowerCase().includes(query) ||
      config.dataType?.toLowerCase().includes(query)
    )
  })

  const openCreate = () => {
    setEditingConfig(null)
    reset({ name: '', dataType: undefined as any, format: 'CSV', fields: [], schedule: { enabled: false } })
    setShowCreateModal(true)
  }

  const openEdit = (config: any) => {
    setEditingConfig(config)
    reset({
      name: config.name ?? '',
      dataType: config.dataType,
      format: (config.format as 'CSV' | 'JSON' | 'XLSX') || 'CSV',
      fields: Array.isArray(config.fields) ? config.fields : [],
      schedule: config.schedule?.enabled ? config.schedule : { enabled: false },
    })
    setShowCreateModal(true)
  }

  const closeModal = () => {
    setShowCreateModal(false)
    setEditingConfig(null)
    reset()
  }

  const handleCreate = async (formData: ExportFormData) => {
    try {
      const payload = {
        name: formData.name,
        dataType: formData.dataType,
        format: formData.format,
        includeHeaders: true,
        dateFormat: 'yyyy-MM-dd',
        fields: formData.fields,
        schedule: formData.schedule?.enabled ? formData.schedule : { enabled: false },
      } as any
      if (editingConfig) {
        await updateMutation.mutateAsync({ configId: editingConfig.configId, data: payload })
        successToast('Export updated', `${formData.name} has been updated.`)
      } else {
        await createMutation.mutateAsync(payload)
        successToast('Export created', `${formData.name} is ready to run.`)
      }
      closeModal()
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'Unknown error'
      errorToast(editingConfig ? 'Update failed' : 'Create failed', msg)
    }
  }

  const handleExportNow = async (config: any) => {
    setRunningId(config.configId)
    try {
      await runMutation.mutateAsync(config.configId)
      const format = (config.format || 'CSV').toUpperCase()
      const ext = formatConfig[format]?.extension ?? '.csv'
      successToast('Export ready', `Downloading ${config.name}${ext}…`)
      // Stream the file through axios so the JWT header is attached.
      const res = await apiClient.get(`/admin/export-configs/${config.configId}/download`, { responseType: 'blob' })
      const url = URL.createObjectURL(res.data as Blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${(config.name || 'export').replace(/\s+/g, '_')}${ext}`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (e) {
      errorToast('Export failed', (e as Error).message)
    } finally {
      setRunningId(null)
    }
  }

  const handleDelete = async (config: any) => {
    if (!window.confirm(`Delete export configuration "${config.name}"?`)) return
    try {
      await deleteMutation.mutateAsync(config.configId)
      successToast('Deleted', `${config.name} has been removed.`)
    } catch (e) {
      errorToast('Delete failed', (e as Error).message)
    }
  }

  const handleQuickExport = async (dataType: string) => {
    const fields = dataTypeConfig[dataType]?.fields ?? []
    try {
      const created = await createMutation.mutateAsync({
        name: `Quick ${dataTypeConfig[dataType]?.label || dataType} ${new Date().toLocaleString('en-MY', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`,
        dataType,
        format: 'CSV',
        includeHeaders: true,
        dateFormat: 'yyyy-MM-dd',
        fields,
        schedule: { enabled: false },
      } as any)
      await handleExportNow(created)
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'Unknown error'
      errorToast('Quick export failed', msg)
    }
  }

  const toggleField = (field: string) => {
    const current = selectedFields || []
    if (current.includes(field)) {
      setValue('fields', current.filter((f) => f !== field))
    } else {
      setValue('fields', [...current, field])
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
      {/* Compact hero with inline stat chips */}
      <div className="relative bg-gradient-to-br from-stone-800 via-stone-800 to-stone-900 rounded-xl p-3 sm:p-4 text-white shadow-md overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="relative flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex-shrink-0 w-9 h-9 bg-amber-500/20 rounded-lg flex items-center justify-center ring-1 ring-amber-500/30">
              <Download className="h-5 w-5 text-amber-400" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-white leading-tight">Export Configuration</h1>
              <p className="text-stone-300 text-xs">Configure data exports and scheduled reports</p>
            </div>
          </div>
          <Button size="sm" onClick={openCreate} className="bg-amber-500 hover:bg-amber-600 text-white border-0">
            <Plus className="h-3.5 w-3.5 mr-1" />
            Create Export
          </Button>
        </div>

        {/* Stat chips */}
        <div className="relative mt-3 grid grid-cols-2 sm:grid-cols-3 gap-1.5">
          {[
            { label: 'Total', value: data?.configs.length || 0, color: 'text-stone-200' },
            { label: 'Scheduled', value: data?.configs.filter((c: any) => c.schedule?.enabled).length || 0, color: 'text-emerald-300' },
            { label: 'Last Run', value: data?.configs.find((c: any) => c.lastExportAt)?.lastExportAt ? new Date(data.configs.find((c: any) => c.lastExportAt).lastExportAt).toLocaleDateString('en-MY', { day: 'numeric', month: 'short' }) : '—', color: 'text-violet-300' },
          ].map((chip) => (
            <div key={chip.label} className="bg-stone-700/40 ring-1 ring-stone-600/40 rounded-md px-2 py-1.5">
              <div className={cn('text-base font-bold leading-none', chip.color)}>{chip.value}</div>
              <p className="text-[10px] text-stone-300 truncate uppercase tracking-wide">{chip.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Search */}
      <Card padding="sm">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
          <Input
            type="text"
            placeholder="Search exports..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-9 text-sm"
          />
        </div>
      </Card>

      {/* Export Configurations List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
        {filteredConfigs && filteredConfigs.length > 0 ? (
          filteredConfigs.map((config: any) => {
            const dataType = dataTypeConfig[config.dataType]
            const format = formatConfig[config.format] ?? formatConfig.CSV
            const DataIcon = dataType?.icon || FileText
            const FormatIcon = format?.icon || FileText
            const isBusy = runningId === config.configId && runMutation.isPending

            return (
              <Card key={config.configId} padding="sm" className="hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 min-w-0">
                    <div className={cn('p-1.5 rounded-md border flex-shrink-0', dataType?.colors || 'bg-stone-100 text-stone-700 border-stone-200')}>
                      <DataIcon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="text-sm font-semibold text-neutral-900">{config.name}</h3>
                        {config.schedule?.enabled ? (
                          <span className="px-1.5 py-0 bg-emerald-50 text-emerald-700 rounded text-[10px] font-medium">Scheduled</span>
                        ) : (
                          <span className="px-1.5 py-0 bg-neutral-100 text-neutral-500 rounded text-[10px] font-medium">On-demand</span>
                        )}
                      </div>

                      <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 mt-1 text-[11px] text-neutral-600">
                        <span className="flex items-center gap-0.5">
                          <DataIcon className="h-3 w-3 text-neutral-400" />
                          {dataType?.label || config.dataType}
                        </span>
                        <span className="flex items-center gap-0.5">
                          <FormatIcon className="h-3 w-3 text-neutral-400" />
                          {format?.label || config.format}
                        </span>
                        <span className="flex items-center gap-0.5">
                          <Settings className="h-3 w-3 text-neutral-400" />
                          {config.fields?.length || 0} fields
                        </span>
                      </div>

                      {config.schedule?.enabled && (
                        <div className="flex items-center gap-1 mt-0.5 text-[11px]">
                          <Clock className="h-3 w-3 text-sky-600" />
                          <span className="text-sky-600 font-medium">
                            {String(config.schedule.frequency || '').toLowerCase()}{config.schedule.time ? ` at ${config.schedule.time}` : ''}
                          </span>
                          {config.nextRunAt && (
                            <span className="text-stone-500">
                              · next {new Date(config.nextRunAt).toLocaleString('en-MY', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>
                      )}

                      {config.lastExportAt && (
                        <p className="text-[10px] text-neutral-400">
                          Last: {new Date(config.lastExportAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleExportNow(config)}
                      disabled={isBusy}
                      isLoading={isBusy}
                      className="h-7 px-2 text-xs"
                    >
                      <Download className="h-3.5 w-3.5 mr-0.5" />
                      Run
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEdit(config)}
                      className="px-1.5"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(config)}
                      disabled={deleteMutation.isPending}
                      className="px-1.5 text-rose-600 hover:bg-rose-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            )
          })
        ) : (
          <Card className="text-center py-8 col-span-full">
            <Download className="h-10 w-10 text-neutral-300 mx-auto mb-2" />
            <h3 className="text-sm font-medium text-neutral-900">No export configurations</h3>
            <p className="text-xs text-neutral-500 mt-1">
              Create your first export configuration to get started
            </p>
            <Button size="sm" className="mt-3" onClick={openCreate}>
              <Plus className="h-3.5 w-3.5 mr-1" />
              Create Export
            </Button>
          </Card>
        )}
      </div>

      {/* Quick Export Section */}
      <Card padding="sm">
        <h3 className="text-sm font-semibold text-neutral-900 mb-1 flex items-center gap-1.5">
          <Download className="h-4 w-4 text-amber-600" />
          Quick Export
        </h3>
        <p className="text-[11px] text-neutral-500 mb-2">
          Create + run a one-shot CSV export with the default fields
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-1.5">
          {Object.entries(dataTypeConfig).map(([type, config]) => {
            const Icon = config.icon
            return (
              <Button
                key={type}
                variant="secondary"
                className={cn('flex-col h-auto py-3 border hover:scale-105 transition-all duration-200', config.colors)}
                onClick={() => handleQuickExport(type)}
                disabled={createMutation.isPending || runMutation.isPending}
              >
                <Icon className="h-5 w-5 mb-1" />
                <span className="text-xs">{config.label}</span>
              </Button>
            )
          })}
        </div>
      </Card>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-0">
            <div className="bg-gradient-to-r from-stone-800 to-stone-900 p-3 rounded-t-xl">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-white flex items-center gap-1.5">
                  <Download className="h-4 w-4 text-amber-400" />
                  {editingConfig ? 'Edit Export Configuration' : 'Create Export Configuration'}
                </h2>
                <button
                  type="button"
                  onClick={closeModal}
                  className="p-1 hover:bg-stone-700 rounded text-stone-400 hover:text-white transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit(handleCreate)} className="p-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Export Name *
                </label>
                <Input
                  {...register('name')}
                  placeholder="e.g., Weekly User Report"
                  error={errors.name?.message}
                  className="h-9 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Data Type *
                  </label>
                  <select
                    {...register('dataType')}
                    className="w-full px-2.5 h-9 border border-neutral-300 rounded-md text-sm focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="">Select data type</option>
                    {Object.entries(dataTypeConfig).map(([key, config]) => (
                      <option key={key} value={key}>{config.label}</option>
                    ))}
                  </select>
                  {errors.dataType && (
                    <p className="text-[11px] text-error-600 mt-0.5">{errors.dataType.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Format *
                  </label>
                  <select
                    {...register('format')}
                    className="w-full px-2.5 h-9 border border-neutral-300 rounded-md text-sm focus:ring-2 focus:ring-amber-500"
                  >
                    {Object.entries(formatConfig).map(([key, config]) => (
                      <option key={key} value={key}>{config.label} ({config.extension})</option>
                    ))}
                  </select>
                  {errors.format && (
                    <p className="text-[11px] text-error-600 mt-0.5">{errors.format.message}</p>
                  )}
                </div>
              </div>

              {selectedDataType && dataTypeConfig[selectedDataType] && (
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1.5">
                    Include Fields *
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                    {dataTypeConfig[selectedDataType].fields.map((field) => (
                      <label
                        key={field}
                        className={cn(
                          'flex items-center gap-1.5 px-2 py-1 border rounded cursor-pointer text-xs transition-all',
                          selectedFields?.includes(field)
                            ? 'border-amber-500 bg-amber-50 text-amber-700'
                            : 'border-neutral-200 hover:bg-stone-50'
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={selectedFields?.includes(field)}
                          onChange={() => toggleField(field)}
                          className="rounded text-amber-600 focus:ring-amber-500 h-3.5 w-3.5"
                        />
                        <span className="font-mono text-[11px]">{field}</span>
                      </label>
                    ))}
                  </div>
                  {errors.fields && (
                    <p className="text-[11px] text-error-600 mt-0.5">{errors.fields.message}</p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <label className="flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    {...register('schedule.enabled')}
                    className="rounded text-amber-600 focus:ring-amber-500 h-3.5 w-3.5"
                  />
                  <span className="text-xs font-medium text-neutral-700">
                    Enable scheduled export (runs automatically at the configured time)
                  </span>
                </label>

                {scheduleEnabled && (
                  <div className="grid grid-cols-3 gap-2 p-2 bg-stone-50 rounded-md border border-stone-200">
                    <div>
                      <label className="block text-[11px] font-medium text-neutral-700 mb-0.5">
                        Frequency
                      </label>
                      <select
                        {...register('schedule.frequency')}
                        className="w-full px-2 h-8 border border-neutral-300 rounded-md text-xs focus:ring-2 focus:ring-amber-500"
                      >
                        <option value="DAILY">Daily</option>
                        <option value="WEEKLY">Weekly</option>
                        <option value="MONTHLY">Monthly</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-neutral-700 mb-0.5">
                        Time
                      </label>
                      <Input type="time" {...register('schedule.time')} className="h-8 text-xs" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-neutral-700 mb-0.5">
                        Day
                      </label>
                      <select
                        {...register('schedule.dayOfWeek', { valueAsNumber: true })}
                        className="w-full px-2 h-8 border border-neutral-300 rounded-md text-xs focus:ring-2 focus:ring-amber-500"
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

              <div className="flex justify-end gap-2 pt-2 border-t border-neutral-200">
                <Button type="button" variant="secondary" size="sm" onClick={closeModal}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="bg-amber-500 hover:bg-amber-600 text-white border-0"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    <Spinner size="sm" className="mr-1" />
                  ) : (
                    <CheckCircle className="h-3.5 w-3.5 mr-1" />
                  )}
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
