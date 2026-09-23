import { Link } from 'react-router-dom'
import { CheckCircle2, Circle, ListChecks } from 'lucide-react'
import { Card } from '@/components/ui'
import { useErrorToast } from '@/components/ui/Toast'
import { cn } from '@/lib/utils/cn'
import { formatDate } from '@/lib/utils/formatDate'
import { getApiErrorMessage } from '@/lib/api/client'
import { ROUTES } from '@/lib/constants/routes'
import { useSetActionItemStatus, useStudentActionItems } from '@/lib/hooks/useMeetingExtras'

/** Student dashboard: open action items from all meetings. Hidden when there are none. */
export function OpenActionItemsCard({ readOnly = false }: { readOnly?: boolean }) {
  const { data } = useStudentActionItems()
  const setStatus = useSetActionItemStatus('student')
  const showError = useErrorToast()

  const open = data?.open ?? []
  if (open.length === 0) return null

  return (
    <Card>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <ListChecks className="h-5 w-5 text-amber-700" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">Action Items</h2>
          <p className="text-sm text-neutral-500">{open.length} open from your supervision meetings</p>
        </div>
      </div>
      <ul className="divide-y divide-neutral-100">
        {open.slice(0, 6).map((item) => (
          <li key={item.actionItemId} className="flex items-start gap-3 py-2">
            <button
              type="button"
              disabled={readOnly || setStatus.isPending}
              onClick={() =>
                setStatus.mutate(
                  { actionItemId: item.actionItemId, status: 'DONE' },
                  { onError: (e) => showError('Could not update item', getApiErrorMessage(e)) }
                )
              }
              className="mt-0.5 flex-shrink-0 text-neutral-400 hover:text-success-600 transition-colors group"
              aria-label={`Mark "${item.description}" as done`}
            >
              <Circle className="h-5 w-5 group-hover:hidden" />
              <CheckCircle2 className="h-5 w-5 hidden group-hover:block" />
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-neutral-800">{item.description}</p>
              <p className="text-xs text-neutral-500 mt-0.5">
                {item.meetingId ? (
                  <Link
                    to={ROUTES.STUDENT.MEETING_DETAIL.replace(':id', String(item.meetingId))}
                    className="hover:text-primary-600 hover:underline"
                  >
                    {item.meetingTitle || 'Meeting'}
                    {item.meetingDate ? ` · ${formatDate(item.meetingDate)}` : ''}
                  </Link>
                ) : null}
                {item.dueDate && (
                  <span className={cn('ml-2', item.overdue && 'text-error-600 font-medium')}>
                    Due {formatDate(item.dueDate)}
                    {item.overdue ? ' · overdue' : ''}
                  </span>
                )}
              </p>
            </div>
          </li>
        ))}
      </ul>
      {open.length > 6 && (
        <p className="text-xs text-neutral-500 mt-2">+{open.length - 6} more on your meeting pages</p>
      )}
    </Card>
  )
}
