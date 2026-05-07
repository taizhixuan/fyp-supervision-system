import { useState } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  ArrowLeft,
  Save,
  Send,
  CheckCircle,
} from 'lucide-react'
import { Card, Button, AlertBanner } from '@/components/ui'
import { useCreateLog, useMeetingList } from '@/lib/hooks/useStudent'
import { ROUTES } from '@/lib/constants/routes'
import { cn } from '@/lib/utils/cn'

const logSchema = z.object({
  weekNumber: z.number().min(1, 'Week number is required').max(52, 'Invalid week number'),
  activitiesCompleted: z.string().min(20, 'Please provide more detail about activities completed (min 20 characters)'),
  challengesFaced: z.string().optional(),
  plannedActivities: z.string().min(10, 'Please provide planned activities (min 10 characters)'),
  progressPercentage: z.number().min(0).max(100),
  meetingId: z.string().optional(),
})

type LogFormData = z.infer<typeof logSchema>

// Sample completed meetings
const SAMPLE_MEETINGS = [
  { meetingId: '3', title: 'Initial Consultation', scheduledAt: '2025-01-15T10:00:00Z' },
  { meetingId: '2', title: 'Proposal Review Meeting', scheduledAt: '2025-01-22T14:00:00Z' },
]

export function LogCreate() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const meetingIdFromUrl = searchParams.get('meetingId')

  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [isDraft, setIsDraft] = useState(false)

  const createLog = useCreateLog()
  const { data: meetingData } = useMeetingList()

  // Use sample meetings
  const completedMeetings = meetingData?.meetings?.filter(m => m.status === 'COMPLETED') || SAMPLE_MEETINGS

  // Calculate current week of semester (sample)
  const currentWeek = 5

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<LogFormData>({
    resolver: zodResolver(logSchema),
    defaultValues: {
      weekNumber: currentWeek,
      activitiesCompleted: '',
      challengesFaced: '',
      plannedActivities: '',
      progressPercentage: 30,
      meetingId: meetingIdFromUrl || '',
    },
  })

  const progressPercentage = watch('progressPercentage')

  const onSubmit = async (data: LogFormData, asDraft: boolean = false) => {
    try {
      await createLog.mutateAsync({
        ...data,
        status: asDraft ? 'DRAFT' : 'PENDING',
      })
      setSubmitSuccess(true)
    } catch (err) {
      // Error handled by mutation
    }
  }

  if (submitSuccess) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-success-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-success-600" />
          </div>
          <h2 className="text-xl font-bold text-neutral-900 mb-2">
            {isDraft ? 'Draft Saved!' : 'Log Submitted!'}
          </h2>
          <p className="text-neutral-600 mb-6">
            {isDraft
              ? 'Your log has been saved as a draft. You can edit and submit it later.'
              : 'Your weekly log has been submitted for supervisor review.'}
          </p>
          <div className="flex justify-center gap-3">
            <Link to={ROUTES.STUDENT.LOGS}>
              <Button variant="primary">View All Logs</Button>
            </Link>
            <Link to={ROUTES.STUDENT.DASHBOARD}>
              <Button variant="secondary">Go to Dashboard</Button>
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back Button */}
      <Link
        to={ROUTES.STUDENT.LOGS}
        className="inline-flex items-center gap-2 text-neutral-600 hover:text-primary-600 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Logs
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Create New Log Entry</h1>
        <p className="text-neutral-600 mt-1">Record your weekly progress and activities</p>
      </div>

      {/* Tips */}
      <AlertBanner
        variant="info"
        title="Log Entry Tips"
        description="Be specific about what you accomplished and challenges faced. This helps your supervisor provide better guidance."
      />

      <form className="space-y-6">
        {/* Week Number & Meeting Link */}
        <Card>
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Log Details</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Week Number */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Week Number <span className="text-error-500">*</span>
              </label>
              <input
                type="number"
                min={1}
                max={52}
                className={cn(
                  'w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500',
                  errors.weekNumber ? 'border-error-500' : 'border-neutral-300'
                )}
                {...register('weekNumber', { valueAsNumber: true })}
              />
              {errors.weekNumber && (
                <p className="text-sm text-error-600 mt-1">{errors.weekNumber.message}</p>
              )}
              <p className="text-xs text-neutral-500 mt-1">Current semester week: {currentWeek}</p>
            </div>

            {/* Link to Meeting */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Link to Meeting (Optional)
              </label>
              <select
                className="w-full px-4 py-3 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
                {...register('meetingId')}
              >
                <option value="">No meeting linked</option>
                {completedMeetings.map((meeting: any) => (
                  <option key={meeting.meetingId} value={meeting.meetingId}>
                    {meeting.title} - {new Date(meeting.scheduledAt).toLocaleDateString('en-MY')}
                  </option>
                ))}
              </select>
              <p className="text-xs text-neutral-500 mt-1">Link this log to a completed meeting</p>
            </div>
          </div>
        </Card>

        {/* Progress */}
        <Card>
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Overall Progress</h2>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-neutral-700">
                Project Completion
              </label>
              <span className="text-lg font-bold text-primary-600">{progressPercentage}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer slider-thumb"
              {...register('progressPercentage', { valueAsNumber: true })}
            />
            <div className="flex justify-between text-xs text-neutral-500 mt-1">
              <span>0%</span>
              <span>25%</span>
              <span>50%</span>
              <span>75%</span>
              <span>100%</span>
            </div>
          </div>
        </Card>

        {/* Activities */}
        <Card>
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Weekly Activities</h2>

          <div className="space-y-4">
            {/* Activities Completed */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Activities Completed <span className="text-error-500">*</span>
              </label>
              <textarea
                className={cn(
                  'w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none',
                  errors.activitiesCompleted ? 'border-error-500' : 'border-neutral-300'
                )}
                rows={4}
                placeholder="Describe what you accomplished this week..."
                {...register('activitiesCompleted')}
              />
              {errors.activitiesCompleted && (
                <p className="text-sm text-error-600 mt-1">{errors.activitiesCompleted.message}</p>
              )}
            </div>

            {/* Challenges Faced */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Challenges Faced (Optional)
              </label>
              <textarea
                className="w-full px-4 py-3 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                rows={3}
                placeholder="Any obstacles or difficulties encountered..."
                {...register('challengesFaced')}
              />
            </div>

            {/* Planned Activities */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Planned Activities for Next Week <span className="text-error-500">*</span>
              </label>
              <textarea
                className={cn(
                  'w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none',
                  errors.plannedActivities ? 'border-error-500' : 'border-neutral-300'
                )}
                rows={3}
                placeholder="What do you plan to work on next..."
                {...register('plannedActivities')}
              />
              {errors.plannedActivities && (
                <p className="text-sm text-error-600 mt-1">{errors.plannedActivities.message}</p>
              )}
            </div>
          </div>
        </Card>

        {/* Submit */}
        <div className="flex items-center justify-between pt-4 border-t border-neutral-200">
          <Button
            type="button"
            variant="ghost"
            leftIcon={<Save className="h-4 w-4" />}
            onClick={() => {
              setIsDraft(true)
              handleSubmit((data) => onSubmit(data, true))()
            }}
            isLoading={createLog.isPending && isDraft}
          >
            Save as Draft
          </Button>
          <Button
            type="button"
            variant="primary"
            leftIcon={<Send className="h-4 w-4" />}
            onClick={() => {
              setIsDraft(false)
              handleSubmit((data) => onSubmit(data, false))()
            }}
            isLoading={createLog.isPending && !isDraft}
          >
            Submit for Review
          </Button>
        </div>
      </form>
    </div>
  )
}
