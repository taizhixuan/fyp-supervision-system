import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, Button, AlertBanner } from '@/components/ui'
import { TaskCheckboxSection } from './TaskCheckboxSection'
import { cn } from '@/lib/utils/cn'
import type { MeetingLogTaskCode } from '@/types/meetingLog'
import { getDefaultTasks, MEETING_LOG_TASKS } from '@/types/meetingLog'

// Form validation schema
const meetingLogFormSchema = z.object({
  meetingDate: z.string().min(1, 'Meeting date is required'),
  meetingNumber: z.number().min(1, 'Meeting number must be at least 1'),
  meetingMode: z.enum(['ONLINE', 'PHYSICAL'], {
    required_error: 'Meeting mode is required',
  }),
  projectTitle: z.string().min(5, 'Project title must be at least 5 characters'),
  fypPhase: z.enum(['FYP1', 'FYP2'], {
    required_error: 'FYP phase is required',
  }),
  tasks: z.array(
    z.object({
      taskCode: z.string(),
      isSelected: z.boolean(),
      details: z.string().optional(),
    })
  ),
  workDoneDetails: z
    .string()
    .min(20, 'Work done details must be at least 20 characters'),
  workToBeDone: z
    .string()
    .min(10, 'Work to be done must be at least 10 characters'),
  problemsAndSolutions: z.string().optional(),
})

export type MeetingLogFormData = z.infer<typeof meetingLogFormSchema>

interface MeetingLogFormProps {
  initialData?: Partial<MeetingLogFormData>
  onSubmit: (data: MeetingLogFormData, asDraft: boolean) => Promise<void>
  isLoading?: boolean
  disabled?: boolean
  showHeader?: boolean
  className?: string
}

/**
 * Main form component for creating/editing MMU Meeting Logs
 */
export function MeetingLogForm({
  initialData,
  onSubmit,
  isLoading = false,
  disabled = false,
  className,
}: MeetingLogFormProps) {
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<MeetingLogFormData>({
    resolver: zodResolver(meetingLogFormSchema),
    defaultValues: {
      meetingDate: initialData?.meetingDate || new Date().toISOString().split('T')[0],
      meetingNumber: initialData?.meetingNumber || 1,
      meetingMode: initialData?.meetingMode || 'PHYSICAL',
      projectTitle: initialData?.projectTitle || '',
      fypPhase: initialData?.fypPhase || 'FYP1',
      tasks: initialData?.tasks || getDefaultTasks().map((t) => ({
        taskCode: t.taskCode,
        isSelected: t.isSelected,
        details: t.details || '',
      })),
      workDoneDetails: initialData?.workDoneDetails || '',
      workToBeDone: initialData?.workToBeDone || '',
      problemsAndSolutions: initialData?.problemsAndSolutions || '',
    },
  })

  const tasks = watch('tasks')

  const handleTaskChange = (
    taskCode: MeetingLogTaskCode,
    isSelected: boolean,
    details?: string
  ) => {
    const updatedTasks = tasks.map((t) =>
      t.taskCode === taskCode ? { ...t, isSelected, details: details || '' } : t
    )
    setValue('tasks', updatedTasks)
  }

  const hasSelectedTasks = tasks.some((t) => t.isSelected)

  const onFormSubmit = async (data: MeetingLogFormData, asDraft: boolean) => {
    await onSubmit(data, asDraft)
  }

  return (
    <form className={cn('space-y-6', className)}>
      {/* Meeting Details */}
      <Card>
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">
          Meeting Details
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Meeting Number */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Meeting Number <span className="text-error-500">*</span>
            </label>
            <input
              type="number"
              min={1}
              disabled={disabled}
              className={cn(
                'w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500',
                errors.meetingNumber ? 'border-error-500' : 'border-neutral-300',
                disabled && 'bg-neutral-100 cursor-not-allowed'
              )}
              {...register('meetingNumber', { valueAsNumber: true })}
            />
            {errors.meetingNumber && (
              <p className="text-sm text-error-600 mt-1">
                {errors.meetingNumber.message}
              </p>
            )}
          </div>

          {/* Meeting Date */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Meeting Date <span className="text-error-500">*</span>
            </label>
            <input
              type="date"
              disabled={disabled}
              className={cn(
                'w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500',
                errors.meetingDate ? 'border-error-500' : 'border-neutral-300',
                disabled && 'bg-neutral-100 cursor-not-allowed'
              )}
              {...register('meetingDate')}
            />
            {errors.meetingDate && (
              <p className="text-sm text-error-600 mt-1">
                {errors.meetingDate.message}
              </p>
            )}
          </div>

          {/* Meeting Mode */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Meeting Mode <span className="text-error-500">*</span>
            </label>
            <select
              disabled={disabled}
              className={cn(
                'w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500',
                errors.meetingMode ? 'border-error-500' : 'border-neutral-300',
                disabled && 'bg-neutral-100 cursor-not-allowed'
              )}
              {...register('meetingMode')}
            >
              <option value="PHYSICAL">Physical</option>
              <option value="ONLINE">Online</option>
            </select>
            {errors.meetingMode && (
              <p className="text-sm text-error-600 mt-1">
                {errors.meetingMode.message}
              </p>
            )}
          </div>

          {/* FYP Phase */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              FYP Phase <span className="text-error-500">*</span>
            </label>
            <select
              disabled={disabled}
              className={cn(
                'w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500',
                errors.fypPhase ? 'border-error-500' : 'border-neutral-300',
                disabled && 'bg-neutral-100 cursor-not-allowed'
              )}
              {...register('fypPhase')}
            >
              <option value="FYP1">FYP 1</option>
              <option value="FYP2">FYP 2</option>
            </select>
            {errors.fypPhase && (
              <p className="text-sm text-error-600 mt-1">
                {errors.fypPhase.message}
              </p>
            )}
          </div>
        </div>

        {/* Project Title */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Project Title <span className="text-error-500">*</span>
          </label>
          <input
            type="text"
            disabled={disabled}
            placeholder="Enter your FYP project title"
            className={cn(
              'w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500',
              errors.projectTitle ? 'border-error-500' : 'border-neutral-300',
              disabled && 'bg-neutral-100 cursor-not-allowed'
            )}
            {...register('projectTitle')}
          />
          {errors.projectTitle && (
            <p className="text-sm text-error-600 mt-1">
              {errors.projectTitle.message}
            </p>
          )}
        </div>
      </Card>

      {/* Section 1: Tasks */}
      <Card>
        <Controller
          name="tasks"
          control={control}
          render={({ field }) => (
            <TaskCheckboxSection
              tasks={field.value.map((t) => ({
                taskCode: t.taskCode as MeetingLogTaskCode,
                label: MEETING_LOG_TASKS[t.taskCode as MeetingLogTaskCode],
                isSelected: t.isSelected,
                details: t.details,
              }))}
              onTaskChange={handleTaskChange}
              disabled={disabled}
              showDetails={true}
            />
          )}
        />

        {!hasSelectedTasks && (
          <AlertBanner
            variant="warning"
            title="No tasks selected"
            description="Please select at least one task that was carried out during this meeting."
            className="mt-4"
          />
        )}

        {/* Work Done Details */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Details of Work Done <span className="text-error-500">*</span>
          </label>
          <textarea
            disabled={disabled}
            placeholder="Describe in detail the work accomplished during this meeting..."
            className={cn(
              'w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none',
              errors.workDoneDetails ? 'border-error-500' : 'border-neutral-300',
              disabled && 'bg-neutral-100 cursor-not-allowed'
            )}
            rows={5}
            {...register('workDoneDetails')}
          />
          {errors.workDoneDetails && (
            <p className="text-sm text-error-600 mt-1">
              {errors.workDoneDetails.message}
            </p>
          )}
        </div>
      </Card>

      {/* Section 2: Work To Be Done */}
      <Card>
        <h3 className="text-sm font-semibold text-neutral-700 uppercase tracking-wide mb-4">
          Section 2: Work To Be Done
        </h3>
        <textarea
          disabled={disabled}
          placeholder="Describe the tasks and objectives for the next meeting..."
          className={cn(
            'w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none',
            errors.workToBeDone ? 'border-error-500' : 'border-neutral-300',
            disabled && 'bg-neutral-100 cursor-not-allowed'
          )}
          rows={4}
          {...register('workToBeDone')}
        />
        {errors.workToBeDone && (
          <p className="text-sm text-error-600 mt-1">
            {errors.workToBeDone.message}
          </p>
        )}
      </Card>

      {/* Section 3: Problems & Solutions */}
      <Card>
        <h3 className="text-sm font-semibold text-neutral-700 uppercase tracking-wide mb-4">
          Section 3: Problems Faced & Solutions (Optional)
        </h3>
        <textarea
          disabled={disabled}
          placeholder="Describe any problems encountered and how they were resolved..."
          className={cn(
            'w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none',
            'border-neutral-300',
            disabled && 'bg-neutral-100 cursor-not-allowed'
          )}
          rows={4}
          {...register('problemsAndSolutions')}
        />
      </Card>

      {/* Submit Buttons */}
      {!disabled && (
        <div className="flex items-center justify-between pt-4 border-t border-neutral-200">
          <Button
            type="button"
            variant="ghost"
            onClick={handleSubmit((data) => onFormSubmit(data, true))}
            isLoading={isLoading}
          >
            Save as Draft
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleSubmit((data) => onFormSubmit(data, false))}
            isLoading={isLoading}
            disabled={!hasSelectedTasks}
          >
            Submit for Review
          </Button>
        </div>
      )}
    </form>
  )
}

export { meetingLogFormSchema }
