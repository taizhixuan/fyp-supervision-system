import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  ArrowLeft,
  Video,
  MapPin,
  CheckCircle,
  AlertCircle,
  Calendar as CalendarIcon,
  Clock,
} from 'lucide-react'
import { Card, Button, Input } from '@/components/ui'
import {
  useCreateMeeting,
  useStudentDashboard,
  useSupervisorAvailableSlotsRange,
} from '@/lib/hooks/useStudent'
import { ROUTES } from '@/lib/constants/routes'
import { cn } from '@/lib/utils/cn'
import type { MeetingPlatform } from '@/types'

const meetingSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  agenda: z.string().optional(),
  platform: z.enum(['IN_PERSON', 'ZOOM', 'GOOGLE_MEET', 'MICROSOFT_TEAMS', 'OTHER']),
  location: z.string().optional(),
})

type MeetingFormData = z.infer<typeof meetingSchema>

const PLATFORMS: { value: MeetingPlatform; label: string; icon: typeof Video }[] = [
  { value: 'IN_PERSON', label: 'In Person', icon: MapPin },
  { value: 'MICROSOFT_TEAMS', label: 'Microsoft Teams', icon: Video },
  { value: 'ZOOM', label: 'Zoom', icon: Video },
  { value: 'GOOGLE_MEET', label: 'Google Meet', icon: Video },
  { value: 'OTHER', label: 'Other', icon: Video },
]

const HORIZON_DAYS = 14

function toIsoDateLocal(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function formatTimeShort(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit', hour12: false })
}

export function MeetingRequest() {
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedSlotStart, setSelectedSlotStart] = useState<string | null>(null)
  const [selectedSlotDuration, setSelectedSlotDuration] = useState<number>(30)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const createMeeting = useCreateMeeting()
  const { data: dashboard } = useStudentDashboard()
  const supervisorId = dashboard?.supervisorId ?? ''

  const today = useMemo(() => new Date(), [])
  const horizon = useMemo(() => {
    const d = new Date(today)
    d.setDate(d.getDate() + HORIZON_DAYS)
    return d
  }, [today])

  const fromIso = toIsoDateLocal(today)
  const toIso = toIsoDateLocal(horizon)

  const { data: slotsData, isLoading: loadingSlots } = useSupervisorAvailableSlotsRange(
    supervisorId,
    fromIso,
    toIso
  )

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
      platform: 'IN_PERSON',
    },
  })

  const platform = watch('platform')

  // Build the 14-day grid with per-day slot counts.
  const dayGrid = useMemo(() => {
    const out: { date: string; label: string; weekday: string; available: number }[] = []
    for (let i = 0; i < HORIZON_DAYS; i++) {
      const d = new Date(today)
      d.setDate(d.getDate() + i)
      const key = toIsoDateLocal(d)
      const slots = slotsData?.slotsByDay?.[key] ?? []
      const available = slots.filter((s) => s.available).length
      out.push({
        date: key,
        label: d.toLocaleDateString('en-MY', { day: 'numeric', month: 'short' }),
        weekday: d.toLocaleDateString('en-MY', { weekday: 'short' }),
        available,
      })
    }
    return out
  }, [today, slotsData])

  const dailySlots = selectedDate ? slotsData?.slotsByDay?.[selectedDate] ?? [] : []

  const handlePickSlot = (start: string, duration: number) => {
    setSelectedSlotStart(start)
    setSelectedSlotDuration(duration)
  }

  const onSubmit = async (data: MeetingFormData) => {
    setSubmitError(null)
    if (!selectedSlotStart) {
      setSubmitError('Pick a time slot first.')
      return
    }
    try {
      await createMeeting.mutateAsync({
        title: data.title,
        agenda: data.agenda,
        proposedStartAt: selectedSlotStart,
        duration: selectedSlotDuration,
        platform: data.platform,
        location: data.location,
      })
      setSubmitSuccess(true)
    } catch (err: any) {
      setSubmitError(err?.response?.data?.message || err?.message || 'Failed to send request.')
    }
  }

  if (submitSuccess) {
    return (
      <div className="max-w-2xl mx-auto space-y-3 lg:space-y-4">
        <Card className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-success-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-success-600" />
          </div>
          <h2 className="text-xl font-bold text-neutral-900 mb-2">Meeting Request Sent!</h2>
          <p className="text-neutral-600 mb-6">
            Your supervisor has been notified and will confirm the slot.
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
    <div className="max-w-3xl mx-auto space-y-3 lg:space-y-4">
      <Link
        to={ROUTES.STUDENT.MEETINGS}
        className="inline-flex items-center gap-2 text-neutral-600 hover:text-primary-600 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Meetings
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Request Meeting</h1>
        <p className="text-neutral-600 mt-1">
          Pick from your supervisor's published timeslots — no more guessing.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 lg:space-y-4">
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

        <Card>
          <h2 className="text-lg font-semibold text-neutral-900 mb-1 flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-primary-600" />
            Select Date &amp; Time
          </h2>
          <p className="text-sm text-neutral-500 mb-4">
            Pick a day, then choose an open slot from your supervisor's published availability.
          </p>

          {loadingSlots && (
            <p className="text-sm text-neutral-500">Loading available slots…</p>
          )}

          {!loadingSlots && (
            <>
              <div className="mb-5 grid grid-cols-7 gap-2">
                {dayGrid.map((d) => {
                  const isSelected = selectedDate === d.date
                  const disabled = d.available === 0
                  return (
                    <button
                      key={d.date}
                      type="button"
                      disabled={disabled}
                      onClick={() => {
                        setSelectedDate(d.date)
                        setSelectedSlotStart(null)
                      }}
                      className={cn(
                        'flex flex-col items-center rounded-lg border-2 p-2 transition-colors',
                        isSelected
                          ? 'border-primary-500 bg-primary-100 text-primary-700'
                          : disabled
                          ? 'border-transparent bg-neutral-50 text-neutral-300 cursor-not-allowed'
                          : 'border-transparent bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                      )}
                    >
                      <span className="text-xs">{d.weekday}</span>
                      <span className="text-lg font-bold">{d.label}</span>
                      <span
                        className={cn(
                          'mt-1 text-[10px] font-medium uppercase tracking-wide',
                          disabled
                            ? 'text-neutral-300'
                            : d.available <= 2
                            ? 'text-amber-600'
                            : 'text-emerald-600'
                        )}
                      >
                        {disabled ? 'No slots' : `${d.available} slot${d.available === 1 ? '' : 's'}`}
                      </span>
                    </button>
                  )
                })}
              </div>

              {selectedDate && (
                <div>
                  <label className="mb-2 flex items-center gap-1 text-sm font-medium text-neutral-700">
                    <Clock className="h-4 w-4" /> Available slots on{' '}
                    {new Date(selectedDate).toLocaleDateString('en-MY', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'short',
                    })}
                  </label>
                  {dailySlots.length === 0 ? (
                    <p className="rounded-md bg-neutral-50 p-3 text-sm text-neutral-500">
                      Your supervisor hasn't published any slots for this day.
                    </p>
                  ) : (
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
                      {dailySlots.map((s) => {
                        const isSelected = selectedSlotStart === s.start
                        const disabled = !s.available
                        const label = `${formatTimeShort(s.start)}–${formatTimeShort(s.end)}`
                        return (
                          <button
                            key={s.start}
                            type="button"
                            disabled={disabled}
                            onClick={() => handlePickSlot(s.start, s.durationMinutes)}
                            className={cn(
                              'rounded-md border px-2 py-2 text-xs font-medium transition-colors',
                              isSelected
                                ? 'border-primary-500 bg-primary-600 text-white'
                                : disabled
                                ? 'border-neutral-200 bg-neutral-50 text-neutral-300 line-through cursor-not-allowed'
                                : 'border-neutral-300 bg-white text-neutral-700 hover:border-primary-400 hover:bg-primary-50'
                            )}
                            title={
                              disabled
                                ? s.past
                                  ? 'Past'
                                  : 'Already taken'
                                : `${s.durationMinutes}-minute slot`
                            }
                          >
                            {label}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </Card>

        {submitError && (
          <div className="flex items-start gap-2 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            {submitError}
          </div>
        )}

        <div className="flex items-center justify-between border-t border-neutral-200 pt-4">
          <p className="text-sm text-neutral-500">
            {selectedSlotStart
              ? `Slot: ${new Date(selectedSlotStart).toLocaleString('en-MY', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })} (${selectedSlotDuration} min)`
              : 'Pick a slot to enable the request button.'}
          </p>
          <Button
            type="submit"
            variant="primary"
            isLoading={createMeeting.isPending}
            disabled={!selectedSlotStart || !supervisorId}
          >
            Send Request
          </Button>
        </div>
      </form>
    </div>
  )
}
