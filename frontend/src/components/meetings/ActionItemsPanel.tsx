import { useState } from 'react'
import { CheckCircle2, Circle, ListChecks, Plus, Trash2, History } from 'lucide-react'
import { Card, Button, Spinner } from '@/components/ui'
import { useErrorToast } from '@/components/ui/Toast'
import { cn } from '@/lib/utils/cn'
import { formatDate } from '@/lib/utils/formatDate'
import { getApiErrorMessage } from '@/lib/api/client'
import {
  useAddActionItem,
  useDeleteActionItem,
  useMeetingActionItems,
  useSetActionItemStatus,
} from '@/lib/hooks/useMeetingExtras'
import type { MeetingActionItem } from '@/types'

interface ActionItemsPanelProps {
  role: 'student' | 'supervisor'
  meetingId: string | number
  /** Supervisor only: allow adding items to this meeting. */
  canAdd?: boolean
  /** Hide the toggle (e.g. student in a finished cycle). */
  readOnly?: boolean
}

/**
 * Action items raised in this meeting, plus anything still open from earlier meetings.
 * Either party can tick an item off; open items keep following the project until done.
 */
export function ActionItemsPanel({ role, meetingId, canAdd = false, readOnly = false }: ActionItemsPanelProps) {
  const { data, isLoading } = useMeetingActionItems(role, meetingId)
  const setStatus = useSetActionItemStatus(role)
  const addItem = useAddActionItem()
  const deleteItem = useDeleteActionItem()
  const showError = useErrorToast()
  const [draft, setDraft] = useState('')
  const [dueDate, setDueDate] = useState('')

  const items = data?.items ?? []
  const carriedOver = data?.carriedOver ?? []

  if (!isLoading && items.length === 0 && carriedOver.length === 0 && !canAdd) return null

  const toggle = (item: MeetingActionItem) => {
    setStatus.mutate(
      { actionItemId: item.actionItemId, status: item.status === 'DONE' ? 'OPEN' : 'DONE' },
      { onError: (e) => showError('Could not update item', getApiErrorMessage(e)) }
    )
  }

  const submit = () => {
    if (!draft.trim()) return
    addItem.mutate(
      { meetingId: Number(meetingId), description: draft.trim(), dueDate: dueDate || undefined },
      {
        onSuccess: () => {
          setDraft('')
          setDueDate('')
        },
        onError: (e) => showError('Could not add item', getApiErrorMessage(e)),
      }
    )
  }

  const renderItem = (item: MeetingActionItem, showSource: boolean) => {
    const done = item.status === 'DONE'
    return (
      <li key={item.actionItemId} className="flex items-start gap-3 py-2">
        <button
          type="button"
          onClick={() => toggle(item)}
          disabled={readOnly || setStatus.isPending}
          className={cn(
            'mt-0.5 flex-shrink-0 rounded-full transition-colors',
            readOnly ? 'cursor-default' : 'hover:text-success-600'
          )}
          aria-label={done ? `Mark "${item.description}" as open` : `Mark "${item.description}" as done`}
        >
          {done ? (
            <CheckCircle2 className="h-5 w-5 text-success-500" />
          ) : (
            <Circle className="h-5 w-5 text-neutral-400" />
          )}
        </button>
        <div className="flex-1 min-w-0">
          <p className={cn('text-sm', done ? 'text-neutral-400 line-through' : 'text-neutral-800')}>
            {item.description}
          </p>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5 text-xs text-neutral-500">
            {showSource && item.meetingTitle && (
              <span>
                From: {item.meetingTitle}
                {item.meetingDate ? ` (${formatDate(item.meetingDate)})` : ''}
              </span>
            )}
            {item.dueDate && (
              <span className={cn(item.overdue && 'text-error-600 font-medium')}>
                Due {formatDate(item.dueDate)}
                {item.overdue ? ' · overdue' : ''}
              </span>
            )}
            {done && item.completedByName && <span>Done by {item.completedByName}</span>}
          </div>
        </div>
        {role === 'supervisor' && canAdd && (
          <button
            type="button"
            onClick={() =>
              deleteItem.mutate(item.actionItemId, {
                onError: (e) => showError('Could not delete item', getApiErrorMessage(e)),
              })
            }
            className="text-neutral-300 hover:text-error-500 transition-colors"
            aria-label={`Delete "${item.description}"`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </li>
    )
  }

  return (
    <Card>
      <div className="flex items-center gap-2 mb-3">
        <ListChecks className="h-5 w-5 text-primary-600" />
        <h3 className="font-semibold text-neutral-900">Action Items</h3>
        {items.length > 0 && (
          <span className="text-xs text-neutral-500">
            {items.filter((i) => i.status === 'DONE').length}/{items.length} done
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="py-4 flex justify-center">
          <Spinner size="sm" />
        </div>
      ) : (
        <>
          {items.length > 0 ? (
            <ul className="divide-y divide-neutral-100">{items.map((i) => renderItem(i, false))}</ul>
          ) : (
            <p className="text-sm text-neutral-500">No action items for this meeting yet.</p>
          )}

          {carriedOver.length > 0 && (
            <div className="mt-4 pt-3 border-t border-neutral-100">
              <p className="flex items-center gap-1.5 text-xs font-medium text-amber-700 uppercase tracking-wide mb-1">
                <History className="h-3.5 w-3.5" />
                Still open from earlier meetings ({carriedOver.length})
              </p>
              <ul className="divide-y divide-neutral-100">{carriedOver.map((i) => renderItem(i, true))}</ul>
            </div>
          )}

          {canAdd && (
            <div className="mt-4 pt-3 border-t border-neutral-100 flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submit()}
                maxLength={500}
                placeholder="Add an action item…"
                className="flex-1 px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                aria-label="New action item"
              />
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                aria-label="Due date (optional)"
              />
              <Button
                size="sm"
                onClick={submit}
                isLoading={addItem.isPending}
                disabled={!draft.trim()}
                leftIcon={<Plus className="h-4 w-4" />}
              >
                Add
              </Button>
            </div>
          )}
        </>
      )}
    </Card>
  )
}
