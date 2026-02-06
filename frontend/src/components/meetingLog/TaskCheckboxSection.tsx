import { CheckCircle, Circle } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { MeetingLogTask, MeetingLogTaskCode } from '@/types/meetingLog'
import { MEETING_LOG_TASKS } from '@/types/meetingLog'

interface TaskCheckboxSectionProps {
  tasks: MeetingLogTask[]
  onTaskChange: (taskCode: MeetingLogTaskCode, isSelected: boolean, details?: string) => void
  disabled?: boolean
  showDetails?: boolean
  className?: string
}

/**
 * Section 1 of MMU Meeting Log: Task Checkboxes
 * Shows 6 standard tasks with checkboxes and strike-through for unselected
 */
export function TaskCheckboxSection({
  tasks,
  onTaskChange,
  disabled = false,
  showDetails = true,
  className,
}: TaskCheckboxSectionProps) {
  // Ensure all 6 tasks are present
  const allTaskCodes = Object.keys(MEETING_LOG_TASKS) as MeetingLogTaskCode[]
  const taskMap = new Map(tasks.map((t) => [t.taskCode, t]))

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-neutral-700 uppercase tracking-wide">
          Section 1: Tasks Carried Out
        </h3>
        <span className="text-xs text-neutral-500">Select all that apply</span>
      </div>

      <div className="space-y-2">
        {allTaskCodes.map((code) => {
          const task = taskMap.get(code)
          const isSelected = task?.isSelected ?? false
          const details = task?.details ?? ''

          return (
            <TaskCheckboxItem
              key={code}
              taskCode={code}
              label={MEETING_LOG_TASKS[code]}
              isSelected={isSelected}
              details={details}
              onSelect={(selected) => onTaskChange(code, selected, details)}
              onDetailsChange={(newDetails) => onTaskChange(code, isSelected, newDetails)}
              disabled={disabled}
              showDetails={showDetails && isSelected}
            />
          )
        })}
      </div>
    </div>
  )
}

interface TaskCheckboxItemProps {
  taskCode: MeetingLogTaskCode
  label: string
  isSelected: boolean
  details: string
  onSelect: (isSelected: boolean) => void
  onDetailsChange: (details: string) => void
  disabled?: boolean
  showDetails?: boolean
}

function TaskCheckboxItem({
  label,
  isSelected,
  details,
  onSelect,
  onDetailsChange,
  disabled = false,
  showDetails = false,
}: TaskCheckboxItemProps) {
  return (
    <div
      className={cn(
        'rounded-lg border transition-all',
        isSelected
          ? 'border-primary-200 bg-primary-50'
          : 'border-neutral-200 bg-neutral-50',
        disabled && 'opacity-60'
      )}
    >
      <label
        className={cn(
          'flex items-center gap-3 p-3 cursor-pointer',
          disabled && 'cursor-not-allowed'
        )}
      >
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onSelect(e.target.checked)}
          disabled={disabled}
          className="sr-only"
        />
        <span
          className={cn(
            'flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors',
            isSelected
              ? 'border-primary-500 bg-primary-500 text-white'
              : 'border-neutral-300 bg-white'
          )}
        >
          {isSelected && <CheckCircle className="h-3 w-3" />}
        </span>
        <span
          className={cn(
            'font-medium transition-all',
            isSelected ? 'text-primary-900' : 'text-neutral-500 line-through'
          )}
        >
          {label}
        </span>
      </label>

      {/* Details text area (shown when selected and showDetails is true) */}
      {showDetails && (
        <div className="px-3 pb-3 pt-0">
          <textarea
            value={details}
            onChange={(e) => onDetailsChange(e.target.value)}
            placeholder="Add details about this task (optional)..."
            disabled={disabled}
            className={cn(
              'w-full px-3 py-2 text-sm rounded-md border border-primary-200 bg-white',
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
              'resize-none placeholder:text-neutral-400',
              disabled && 'bg-neutral-100 cursor-not-allowed'
            )}
            rows={2}
          />
        </div>
      )}
    </div>
  )
}

interface TaskCheckboxDisplayProps {
  tasks: MeetingLogTask[]
  className?: string
}

/**
 * Read-only display of tasks with strike-through for unselected
 * Used in log detail view and PDF generation
 */
export function TaskCheckboxDisplay({ tasks, className }: TaskCheckboxDisplayProps) {
  const allTaskCodes = Object.keys(MEETING_LOG_TASKS) as MeetingLogTaskCode[]
  const taskMap = new Map(tasks.map((t) => [t.taskCode, t]))

  return (
    <div className={cn('space-y-2', className)}>
      {allTaskCodes.map((code) => {
        const task = taskMap.get(code)
        const isSelected = task?.isSelected ?? false
        const details = task?.details

        return (
          <div key={code} className="flex items-start gap-2">
            <span
              className={cn(
                'flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5',
                isSelected
                  ? 'bg-primary-500 text-white'
                  : 'bg-neutral-200 text-neutral-400'
              )}
            >
              {isSelected ? (
                <CheckCircle className="h-3 w-3" />
              ) : (
                <Circle className="h-3 w-3" />
              )}
            </span>
            <div className="flex-1">
              <span
                className={cn(
                  'font-medium',
                  isSelected ? 'text-neutral-900' : 'text-neutral-400 line-through'
                )}
              >
                {MEETING_LOG_TASKS[code]}
              </span>
              {isSelected && details && (
                <p className="mt-1 text-sm text-neutral-600">{details}</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

interface TaskSummaryBadgesProps {
  tasks: MeetingLogTask[]
  className?: string
}

/**
 * Compact badge display of selected tasks
 * Used in list views
 */
export function TaskSummaryBadges({ tasks, className }: TaskSummaryBadgesProps) {
  const selectedTasks = tasks.filter((t) => t.isSelected)

  if (selectedTasks.length === 0) {
    return (
      <span className="text-sm text-neutral-400 italic">No tasks selected</span>
    )
  }

  return (
    <div className={cn('flex flex-wrap gap-1', className)}>
      {selectedTasks.map((task) => (
        <span
          key={task.taskCode}
          className="px-2 py-0.5 bg-primary-100 text-primary-700 text-xs font-medium rounded-full"
        >
          {MEETING_LOG_TASKS[task.taskCode]}
        </span>
      ))}
    </div>
  )
}
