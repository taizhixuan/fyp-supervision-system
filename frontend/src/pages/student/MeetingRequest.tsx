import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  ArrowLeft,
  Video,
  MapPin,
  X,
  CheckCircle,
} from 'lucide-react'
import { Card, Button, Input, Badge } from '@/components/ui'
import { useCreateMeeting } from '@/lib/hooks/useStudent'
import { ROUTES } from '@/lib/constants/routes'
import { cn } from '@/lib/utils/cn'
import type { MeetingPlatform } from '@/types'

const meetingSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  agenda: z.string().optional(),
  duration: z.number().min(15, 'Minimum 15 minutes').max(120, 'Maximum 2 hours'),
  platform: z.enum(['IN_PERSON', 'ZOOM', 'GOOGLE_MEET', 'MICROSOFT_TEAMS', 'OTHER']),
  location: z.string().optional(),
})

type MeetingFormData = z.infer<typeof meetingSchema>

const PLATFORMS: { value: MeetingPlatform; label: string; icon: typeof Video }[] = [
  { value: 'ZOOM', label: 'Zoom', icon: Video },
  { value: 'GOOGLE_MEET', label: 'Google Meet', icon: Video },
  { value: 'MICROSOFT_TEAMS', label: 'Microsoft Teams', icon: Video },
  { value: 'IN_PERSON', label: 'In Person', icon: MapPin },
  { value: 'OTHER', label: 'Other', icon: Video },
]

const DURATIONS = [15, 30, 45, 60, 90, 120]

export function MeetingRequest() {
  const navigate = useNavigate()
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedSlots, setSelectedSlots] = useState<string[]>([])
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const createMeeting = useCreateMeeting()
  const supervisorId = '1' // In real app, get from context or prop

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<MeetingFormData>({
    resolver: zodResolver(meetingSchema),
    defaultValues: {
      title: '',
      agenda: '',
      duration: 30,
      platform: 'ZOOM',
    },
  })

  const platform = watch('platform')

  // Generate next 14 days for date selection
  const availableDates = Array.from({ length: 14 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() + i + 1)
    return date.toISOString().split('T')[0]
  })

  // Sample time slots
  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  ]

  const toggleSlot = (time: string) => {
    if (selectedSlots.includes(time)) {
      setSelectedSlots(selectedSlots.filter((s) => s !== time))
    } else if (selectedSlots.length < 3) {
      setSelectedSlots([...selectedSlots, time])
    }
  }

  const onSubmit = async (data: MeetingFormData) => {
    if (selectedSlots.length === 0) {
      return
    }

    const proposedTimes = selectedSlots.map((time) => {
      const [hours, minutes] = time.split(':')
      const date = new Date(selectedDate)
      date.setHours(parseInt(hours), parseInt(minutes), 0, 0)
      return date.toISOString()
    })

    try {
      await createMeeting.mutateAsync({
        supervisorId,
        title: data.title,
        agenda: data.agenda,
        proposedTimes,
        duration: data.duration,
        platform: data.platform,
        location: data.location,
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
          <h2 className="text-xl font-bold text-neutral-900 mb-2">Meeting Request Sent!</h2>
          <p className="text-neutral-600 mb-6">
            Your meeting request has been sent to your supervisor. You will be notified once they confirm.
          </p>
          <div className="flex justify-center gap-3">
            <Link to={ROUTES.STUDENT.MEETINGS}>
              <Button variant="primary">View Meetings</Button>
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
        to={ROUTES.STUDENT.MEETINGS}
        className="inline-flex items-center gap-2 text-neutral-600 hover:text-primary-600 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Meetings
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Request Meeting</h1>
        <p className="text-neutral-600 mt-1">Schedule a meeting with your supervisor</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Meeting Details */}
        <Card>
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Meeting Details</h2>

          <div className="space-y-4">
            <Input
              label="Meeting Title"
              placeholder="e.g., Weekly Progress Review"
              error={errors.title?.message}
              required
              {...register('title')}
            />

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Agenda (Optional)
              </label>
              <textarea
                className="w-full px-4 py-3 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                rows={3}
                placeholder="What would you like to discuss?"
                {...register('agenda')}
              />
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Duration <span className="text-error-500">*</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {DURATIONS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setValue('duration', d)}
                    className={cn(
                      'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                      watch('duration') === d
                        ? 'bg-primary-100 text-primary-700 border-2 border-primary-500'
                        : 'bg-neutral-100 text-neutral-600 border-2 border-transparent hover:bg-neutral-200'
                    )}
                  >
                    {d} min
                  </button>
                ))}
              </div>
            </div>

            {/* Platform */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Platform <span className="text-error-500">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {PLATFORMS.map((p) => {
                  const Icon = p.icon
                  return (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setValue('platform', p.value)}
                      className={cn(
                        'flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                        platform === p.value
                          ? 'bg-primary-100 text-primary-700 border-2 border-primary-500'
                          : 'bg-neutral-100 text-neutral-600 border-2 border-transparent hover:bg-neutral-200'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {p.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {platform === 'IN_PERSON' && (
              <Input
                label="Location"
                placeholder="e.g., Room 3.12, FCI Building"
                {...register('location')}
              />
            )}
          </div>
        </Card>

        {/* Date & Time Selection */}
        <Card>
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Select Date & Time</h2>
          <p className="text-sm text-neutral-500 mb-4">
            Select a date and up to 3 preferred time slots
          </p>

          {/* Date Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Select Date <span className="text-error-500">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {availableDates.slice(0, 7).map((date) => {
                const d = new Date(date)
                const isWeekend = d.getDay() === 0 || d.getDay() === 6
                if (isWeekend) return null
                return (
                  <button
                    key={date}
                    type="button"
                    onClick={() => {
                      setSelectedDate(date)
                      setSelectedSlots([])
                    }}
                    className={cn(
                      'flex flex-col items-center p-3 rounded-lg min-w-[70px] transition-colors',
                      selectedDate === date
                        ? 'bg-primary-100 text-primary-700 border-2 border-primary-500'
                        : 'bg-neutral-100 text-neutral-600 border-2 border-transparent hover:bg-neutral-200'
                    )}
                  >
                    <span className="text-xs">{d.toLocaleDateString('en-MY', { weekday: 'short' })}</span>
                    <span className="text-lg font-bold">{d.getDate()}</span>
                    <span className="text-xs">{d.toLocaleDateString('en-MY', { month: 'short' })}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Time Slots */}
          {selectedDate && (
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Select Time Slots (up to 3) <span className="text-error-500">*</span>
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {timeSlots.map((time) => (
                  <button
                    key={time}
                    type="button"
                    onClick={() => toggleSlot(time)}
                    disabled={!selectedSlots.includes(time) && selectedSlots.length >= 3}
                    className={cn(
                      'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                      selectedSlots.includes(time)
                        ? 'bg-primary-600 text-white'
                        : selectedSlots.length >= 3
                        ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                        : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                    )}
                  >
                    {time}
                  </button>
                ))}
              </div>
              <p className="text-xs text-neutral-500 mt-2">
                {selectedSlots.length}/3 time slots selected
              </p>
            </div>
          )}
        </Card>

        {/* Selected Summary */}
        {selectedSlots.length > 0 && (
          <Card className="bg-primary-50 border-primary-200">
            <h3 className="font-medium text-primary-900 mb-2">Selected Time Slots</h3>
            <div className="flex flex-wrap gap-2">
              {selectedSlots.map((time) => (
                <Badge key={time} variant="primary" className="pr-1">
                  {new Date(selectedDate).toLocaleDateString('en-MY', { day: 'numeric', month: 'short' })} at {time}
                  <button
                    type="button"
                    onClick={() => toggleSlot(time)}
                    className="ml-1 p-0.5 rounded-full hover:bg-primary-700"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <p className="text-xs text-primary-700 mt-2">
              Your supervisor will choose one of these times
            </p>
          </Card>
        )}

        {/* Submit */}
        <div className="flex items-center justify-between pt-4 border-t border-neutral-200">
          <p className="text-sm text-neutral-500">
            Your supervisor will be notified of your request
          </p>
          <Button
            type="submit"
            variant="primary"
            isLoading={createMeeting.isPending}
            disabled={!selectedDate || selectedSlots.length === 0}
          >
            Send Request
          </Button>
        </div>
      </form>
    </div>
  )
}
