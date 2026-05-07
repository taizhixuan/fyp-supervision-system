import { useState } from 'react'
import {
  Settings,
  Search,
  Edit,
  Check,
  X,
  Clock,
  AlertTriangle,
  Info,
  Sparkles,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import { useSystemParameters, useUpdateParameter } from '@/lib/hooks/useAdmin'
import { cn } from '@/lib/utils/cn'
import type { ParameterCategory, AdminSystemParameter } from '@/types'

type CategoryConfigEntry = { label: string; color: string; bgColor: string; icon: typeof Settings }

const DEFAULT_CATEGORY: CategoryConfigEntry = { label: 'Other', color: 'text-neutral-600', bgColor: 'bg-neutral-100 border-neutral-200', icon: Settings }

// Keys cover both the original UPPERCASE union and the lowercase categories the backend currently emits
// (general, supervision, proposal, notification, security, ai, storage). Unknown keys fall back to DEFAULT_CATEGORY.
const categoryConfig: Record<string, CategoryConfigEntry> = {
  GENERAL: { label: 'General', color: 'text-stone-700', bgColor: 'bg-stone-100 border-stone-200', icon: Settings },
  QUOTAS: { label: 'Quotas & Limits', color: 'text-sky-700', bgColor: 'bg-sky-100 border-sky-200', icon: AlertTriangle },
  MEETINGS: { label: 'Meetings', color: 'text-violet-700', bgColor: 'bg-violet-100 border-violet-200', icon: Clock },
  PROPOSALS: { label: 'Proposals', color: 'text-emerald-700', bgColor: 'bg-emerald-100 border-emerald-200', icon: Info },
  NOTIFICATIONS: { label: 'Notifications', color: 'text-amber-700', bgColor: 'bg-amber-100 border-amber-200', icon: Info },
  SECURITY: { label: 'Security', color: 'text-rose-700', bgColor: 'bg-rose-100 border-rose-200', icon: AlertTriangle },
  general: { label: 'General', color: 'text-stone-700', bgColor: 'bg-stone-100 border-stone-200', icon: Settings },
  supervision: { label: 'Supervision', color: 'text-violet-700', bgColor: 'bg-violet-100 border-violet-200', icon: Clock },
  proposal: { label: 'Proposals', color: 'text-emerald-700', bgColor: 'bg-emerald-100 border-emerald-200', icon: Info },
  notification: { label: 'Notifications', color: 'text-amber-700', bgColor: 'bg-amber-100 border-amber-200', icon: Info },
  security: { label: 'Security', color: 'text-rose-700', bgColor: 'bg-rose-100 border-rose-200', icon: AlertTriangle },
  ai: { label: 'AI Services', color: 'text-fuchsia-700', bgColor: 'bg-fuchsia-100 border-fuchsia-200', icon: Sparkles },
  storage: { label: 'Storage', color: 'text-sky-700', bgColor: 'bg-sky-100 border-sky-200', icon: AlertTriangle },
}

function getCategoryConfig(key: string | undefined): CategoryConfigEntry {
  if (!key) return DEFAULT_CATEGORY
  return categoryConfig[key] ?? DEFAULT_CATEGORY
}

// Categories rendered as filter chips, in display order. Backend currently emits lowercase keys.
const CATEGORY_BUTTONS: string[] = ['general', 'supervision', 'proposal', 'notification', 'security', 'ai', 'storage']

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

  const handleEdit = (param: AdminSystemParameter) => {
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

  const renderValueInput = (param: AdminSystemParameter) => {
    if (param.type === 'BOOLEAN') {
      return (
        <select
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          className="px-3 py-1.5 border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white"
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
        className="w-48 border-stone-300 focus:border-amber-500 focus:ring-amber-500/20"
      />
    )
  }

  const renderValue = (param: AdminSystemParameter) => {
    if (param.type === 'BOOLEAN') {
      return (
        <span className={cn(
          'px-2.5 py-1 rounded-full text-xs font-medium',
          param.value === 'true' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-stone-100 text-stone-600 border border-stone-200'
        )}>
          {param.value === 'true' ? 'Enabled' : 'Disabled'}
        </span>
      )
    }
    return <span className="font-mono text-sm bg-stone-100 px-2 py-1 rounded text-stone-700">{param.value}</span>
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
  }, {} as Record<ParameterCategory, AdminSystemParameter[]>)

  return (
    <div className="space-y-6">
      <div className="relative bg-gradient-to-br from-stone-800 via-stone-800 to-stone-900 rounded-2xl p-6 text-white shadow-xl overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-stone-600/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        <div className="relative flex items-start gap-4">
          <div className="w-14 h-14 bg-amber-500/20 rounded-xl flex items-center justify-center ring-1 ring-amber-500/30">
            <Settings className="h-7 w-7 text-amber-400" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              System Parameters
              <Sparkles className="h-5 w-5 text-amber-400" />
            </h1>
            <p className="text-stone-300 mt-1">
              Configure system-wide settings and policies
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setSelectedCategory('ALL')}
          className={cn(
            'px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 border',
            selectedCategory === 'ALL'
              ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/20'
              : 'bg-stone-100 text-stone-600 border-stone-200 hover:bg-stone-200 hover:border-stone-300 hover:shadow-sm'
          )}
        >
          All
        </button>
        {CATEGORY_BUTTONS.map((key) => {
          const config = getCategoryConfig(key)
          const Icon = config.icon
          return (
            <button
              key={key}
              type="button"
              onClick={() => setSelectedCategory(key as ParameterCategory)}
              className={cn(
                'px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 border flex items-center gap-2',
                selectedCategory === key
                  ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/20'
                  : cn(config.bgColor, config.color, 'hover:shadow-sm hover:scale-[1.02]')
              )}
            >
              <Icon className="h-4 w-4" />
              {config.label}
            </button>
          )
        })}
      </div>

      <div className="bg-gradient-to-r from-stone-100 to-stone-50 rounded-xl p-4 border border-stone-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <Input
            type="text"
            placeholder="Search parameters..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-white border-stone-200 focus:border-amber-500 focus:ring-amber-500/20"
          />
        </div>
      </div>

      {selectedCategory === 'ALL' ? (
        Object.entries(groupedParams || {}).map(([category, params]) => {
          const config = getCategoryConfig(category)
          const Icon = config.icon
          return (
            <Card key={category} className="p-6 border-stone-200 hover:shadow-lg transition-shadow duration-200">
              <h3 className="font-semibold text-stone-900 mb-4 flex items-center gap-2">
                <div className={cn('p-2 rounded-lg border', config.bgColor)}>
                  <Icon className={cn('h-5 w-5', config.color)} />
                </div>
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
        <Card className="p-6 border-stone-200 hover:shadow-lg transition-shadow duration-200">
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

      {(!filteredParams || filteredParams.length === 0) && (
        <Card className="p-12 text-center border-stone-200">
          <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Settings className="h-8 w-8 text-stone-400" />
          </div>
          <h3 className="text-lg font-medium text-stone-900">No parameters found</h3>
          <p className="text-stone-500 mt-1">
            {searchQuery ? 'Try adjusting your search' : 'No parameters available'}
          </p>
        </Card>
      )}
    </div>
  )
}

interface ParameterRowProps {
  param: AdminSystemParameter
  isEditing: boolean
  editValue: string
  onEdit: () => void
  onSave: () => void
  onCancel: () => void
  onValueChange: (value: string) => void
  renderValueInput: (param: AdminSystemParameter) => React.ReactNode
  renderValue: (param: AdminSystemParameter) => React.ReactNode
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
    <div className="flex items-start justify-between gap-4 p-4 bg-gradient-to-r from-stone-50 to-white rounded-xl border border-stone-200 hover:shadow-md hover:scale-[1.01] transition-all duration-200">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="font-medium text-stone-900">{param.label}</h4>
          <span className="text-xs text-stone-400 font-mono bg-stone-100 px-2 py-0.5 rounded">{param.key}</span>
        </div>
        <p className="text-sm text-stone-500 mt-0.5">{param.description}</p>
        {param.lastModifiedAt && (
          <div className="flex items-center gap-2 mt-2 text-xs text-stone-400">
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
              className="bg-amber-500 hover:bg-amber-600 text-white"
            >
              {isSaving ? <Spinner size="sm" /> : <Check className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="sm" onClick={onCancel} className="text-stone-600 hover:text-stone-800 hover:bg-stone-100">
              <X className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <>
            {renderValue(param)}
            {param.isEditable && (
              <Button variant="ghost" size="sm" onClick={onEdit} className="text-stone-600 hover:text-amber-600 hover:bg-amber-50">
                <Edit className="h-4 w-4" />
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
