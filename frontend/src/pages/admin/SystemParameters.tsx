import { useState } from 'react'
import {
  Settings,
  Search,
  Edit,
  Check,
  X,
  Clock,
  User,
  AlertTriangle,
  Info,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import { useSystemParameters, useUpdateParameter } from '@/lib/hooks/useAdmin'
import { cn } from '@/lib/utils/cn'
import type { ParameterCategory, SystemParameter } from '@/types'

const categoryConfig: Record<ParameterCategory, { label: string; color: string; icon: typeof Settings }> = {
  GENERAL: { label: 'General', color: 'text-primary-600', icon: Settings },
  QUOTAS: { label: 'Quotas & Limits', color: 'text-info-600', icon: AlertTriangle },
  MEETINGS: { label: 'Meetings', color: 'text-accent-600', icon: Clock },
  PROPOSALS: { label: 'Proposals', color: 'text-success-600', icon: Info },
  NOTIFICATIONS: { label: 'Notifications', color: 'text-warning-600', icon: Info },
  SECURITY: { label: 'Security', color: 'text-error-600', icon: AlertTriangle },
}

export function SystemParameters() {
  const [selectedCategory, setSelectedCategory] = useState<ParameterCategory | 'ALL'>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [editingParam, setEditingParam] = useState<number | null>(null)
  const [editValue, setEditValue] = useState('')

  const { data, isLoading } = useSystemParameters(
    selectedCategory !== 'ALL' ? selectedCategory : undefined
  )
  const updateMutation = useUpdateParameter()

  const filteredParams = data?.parameters.filter((param) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      param.label.toLowerCase().includes(query) ||
      param.key.toLowerCase().includes(query) ||
      param.description.toLowerCase().includes(query)
    )
  })

  const handleEdit = (param: SystemParameter) => {
    setEditingParam(param.parameterId)
    setEditValue(param.value)
  }

  const handleSave = async (parameterId: number) => {
    try {
      await updateMutation.mutateAsync({
        parameterId,
        data: { value: editValue },
      })
      setEditingParam(null)
    } catch (error) {
      console.error('Failed to update parameter:', error)
    }
  }

  const handleCancel = () => {
    setEditingParam(null)
    setEditValue('')
  }

  const renderValueInput = (param: SystemParameter) => {
    if (param.type === 'BOOLEAN') {
      return (
        <select
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          className="px-3 py-1.5 border border-neutral-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500"
        >
          <option value="true">Enabled</option>
          <option value="false">Disabled</option>
        </select>
      )
    }
    return (
      <Input
        type={param.type === 'NUMBER' ? 'number' : 'text'}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        className="w-48"
      />
    )
  }

  const renderValue = (param: SystemParameter) => {
    if (param.type === 'BOOLEAN') {
      return (
        <span className={cn(
          'px-2 py-0.5 rounded-full text-xs font-medium',
          param.value === 'true' ? 'bg-success-50 text-success-700' : 'bg-neutral-100 text-neutral-600'
        )}>
          {param.value === 'true' ? 'Enabled' : 'Disabled'}
        </span>
      )
    }
    return <span className="font-mono text-sm">{param.value}</span>
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    )
  }

  // Group parameters by category
  const groupedParams = filteredParams?.reduce((acc, param) => {
    if (!acc[param.category]) {
      acc[param.category] = []
    }
    acc[param.category].push(param)
    return acc
  }, {} as Record<ParameterCategory, SystemParameter[]>)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
          <Settings className="h-7 w-7 text-primary-600" />
          System Parameters
        </h1>
        <p className="text-neutral-600 mt-1">
          Configure system-wide settings and policies
        </p>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setSelectedCategory('ALL')}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
            selectedCategory === 'ALL'
              ? 'bg-primary-500 text-white'
              : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
          )}
        >
          All
        </button>
        {Object.entries(categoryConfig).map(([key, config]) => (
          <button
            key={key}
            type="button"
            onClick={() => setSelectedCategory(key as ParameterCategory)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              selectedCategory === key
                ? 'bg-primary-500 text-white'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            )}
          >
            {config.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <Input
            type="text"
            placeholder="Search parameters..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </Card>

      {/* Parameters List */}
      {selectedCategory === 'ALL' ? (
        // Grouped view
        Object.entries(groupedParams || {}).map(([category, params]) => {
          const config = categoryConfig[category as ParameterCategory]
          const Icon = config.icon
          return (
            <Card key={category} className="p-6">
              <h3 className="font-semibold text-neutral-900 mb-4 flex items-center gap-2">
                <Icon className={cn('h-5 w-5', config.color)} />
                {config.label}
              </h3>
              <div className="space-y-4">
                {params.map((param) => (
                  <ParameterRow
                    key={param.parameterId}
                    param={param}
                    isEditing={editingParam === param.parameterId}
                    editValue={editValue}
                    onEdit={() => handleEdit(param)}
                    onSave={() => handleSave(param.parameterId)}
                    onCancel={handleCancel}
                    onValueChange={setEditValue}
                    renderValueInput={renderValueInput}
                    renderValue={renderValue}
                    isSaving={updateMutation.isPending}
                  />
                ))}
              </div>
            </Card>
          )
        })
      ) : (
        // Single category view
        <Card className="p-6">
          <div className="space-y-4">
            {filteredParams?.map((param) => (
              <ParameterRow
                key={param.parameterId}
                param={param}
                isEditing={editingParam === param.parameterId}
                editValue={editValue}
                onEdit={() => handleEdit(param)}
                onSave={() => handleSave(param.parameterId)}
                onCancel={handleCancel}
                onValueChange={setEditValue}
                renderValueInput={renderValueInput}
                renderValue={renderValue}
                isSaving={updateMutation.isPending}
              />
            ))}
          </div>
        </Card>
      )}

      {/* Empty State */}
      {(!filteredParams || filteredParams.length === 0) && (
        <Card className="p-12 text-center">
          <Settings className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-neutral-900">No parameters found</h3>
          <p className="text-neutral-500 mt-1">
            {searchQuery ? 'Try adjusting your search' : 'No parameters available'}
          </p>
        </Card>
      )}
    </div>
  )
}

interface ParameterRowProps {
  param: SystemParameter
  isEditing: boolean
  editValue: string
  onEdit: () => void
  onSave: () => void
  onCancel: () => void
  onValueChange: (value: string) => void
  renderValueInput: (param: SystemParameter) => React.ReactNode
  renderValue: (param: SystemParameter) => React.ReactNode
  isSaving: boolean
}

function ParameterRow({
  param,
  isEditing,
  editValue,
  onEdit,
  onSave,
  onCancel,
  onValueChange,
  renderValueInput,
  renderValue,
  isSaving,
}: ParameterRowProps) {
  return (
    <div className="flex items-start justify-between gap-4 p-4 bg-neutral-50 rounded-lg">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="font-medium text-neutral-900">{param.label}</h4>
          <span className="text-xs text-neutral-400 font-mono">{param.key}</span>
        </div>
        <p className="text-sm text-neutral-500 mt-0.5">{param.description}</p>
        {param.lastModifiedAt && (
          <div className="flex items-center gap-2 mt-2 text-xs text-neutral-400">
            <Clock className="h-3.5 w-3.5" />
            <span>
              Modified by {param.lastModifiedBy} on{' '}
              {new Date(param.lastModifiedAt).toLocaleDateString()}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        {isEditing ? (
          <>
            {renderValueInput(param)}
            <Button
              size="sm"
              onClick={onSave}
              disabled={isSaving}
            >
              {isSaving ? <Spinner size="sm" /> : <Check className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <X className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <>
            {renderValue(param)}
            {param.isEditable && (
              <Button variant="ghost" size="sm" onClick={onEdit}>
                <Edit className="h-4 w-4" />
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
