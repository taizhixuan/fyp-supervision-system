import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Video,
  Users,
  GraduationCap,
  Send,
  Link2,
  Info,
  Copy,
  Check,
  Globe,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import { useSupervisees, useCreateMeeting } from '@/lib/hooks/useSupervisor'
import { ROUTES } from '@/lib/constants/routes'
import { cn } from '@/lib/utils/cn'
import {
  ONLINE_PLATFORMS,
  detectPlatformFromUrl,
  getPlatformInfo,
} from '@/lib/utils/meetingPlatform'

const meetingSchema = z.object({
  studentId: z.string().min(1, 'Please select a student'),
  title: z.string().min(1, 'Title is required').max(200, 'Title is too long'),
  type: z.enum(['IN_PERSON', 'ONLINE', 'HYBRID']),
  proposedDateTime: z.string().min(1, 'Date and time is required'),
  duration: z.number().min(15, 'Minimum 15 minutes').max(180, 'Maximum 3 hours'),
  location: z.string().optional(),
  meetingUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  onlinePlatform: z.enum(['MICROSOFT_TEAMS', 'ZOOM', 'GOOGLE_MEET', 'WEBEX', 'OTHER']).optional(),
  agenda: z.string().optional(),
})

type MeetingFormData = z.infer<typeof meetingSchema>

export function CreateMeeting() {
  const navigate = useNavigate()
  const { data: superviseesData, isLoading: loadingSupervisees } = useSupervisees()
  const createMeeting = useCreateMeeting()

  const [linkCopied, setLinkCopied] = useState(false)
  const [showPlatformHelp, setShowPlatformHelp] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<MeetingFormData>({
    resolver: zodResolver(meetingSchema),
    defaultValues: {
      type: 'IN_PERSON',
      duration: 60,
      onlinePlatform: 'MICROSOFT_TEAMS',
    },
  })

  const meetingType = watch('type')
  const meetingUrl = watch('meetingUrl')
  const onlinePlatform = watch('onlinePlatform')

  // Auto-detect platform from URL
  useEffect(() => {
    if (meetingUrl && meetingUrl.length > 10) {
      const detected = detectPlatformFromUrl(meetingUrl)
      if (detected !== 'OTHER') {
        setValue('onlinePlatform', detected)
      }
    }
  }, [meetingUrl, setValue])

  const selectedPlatformInfo = getPlatformInfo(onlinePlatform || 'MICROSOFT_TEAMS')
  const showOnlineFields = meetingType === 'ONLINE' || meetingType === 'HYBRID'

  const handleCopyLink = async () => {
    if (meetingUrl) {
      await navigator.clipboard.writeText(meetingUrl)
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
    }
  }

  const onSubmit = async (data: MeetingFormData) => {
    try {
      const selectedStudent = superviseesData?.supervisees.find(s => s.superviseeId === data.studentId)
      await createMeeting.mutateAsync({
        ...data,
        studentName: selectedStudent?.fullName ?? '',
        requestedBy: 'SUPERVISOR',
        status: 'PENDING',
        proposedDateTime: new Date(data.proposedDateTime).toISOString(),
      })
      navigate(ROUTES.SUPERVISOR.MEETINGS)
    } catch (error) {
      console.error('Failed to create meeting:', error)
    }
  }

  if (loadingSupervisees) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to={ROUTES.SUPERVISOR.MEETINGS}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Meetings
          </Button>
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
          <Calendar className="h-7 w-7 text-primary-600" />
          Schedule New Meeting
        </h1>
        <p className="text-neutral-600 mt-1">
          Create a new meeting with one of your supervisees
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Student Selection */}
        <Card className="p-6">
          <h3 className="font-semibold text-neutral-900 mb-4 flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-neutral-400" />
            Select Student
          </h3>
          <select
            {...register('studentId')}
            className={cn(
              'w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
              errors.studentId ? 'border-error-500' : 'border-neutral-300'
            )}
          >
            <option value="">Choose a supervisee...</option>
            {superviseesData?.supervisees.map((student) => (
              <option key={student.superviseeId} value={student.superviseeId}>
                {student.fullName} - {student.projectTitle}
              </option>
            ))}
          </select>
          {errors.studentId && (
            <p className="text-sm text-error-500 mt-1">{errors.studentId.message}</p>
          )}
        </Card>

        {/* Meeting Details */}
        <Card className="p-6">
          <h3 className="font-semibold text-neutral-900 mb-4">Meeting Details</h3>

          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Meeting Title *
              </label>
              <Input
                {...register('title')}
                placeholder="e.g., Weekly Progress Review"
                error={errors.title?.message}
              />
            </div>

            {/* Meeting Type */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Meeting Type *
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'IN_PERSON', label: 'In Person', icon: MapPin },
                  { value: 'ONLINE', label: 'Online', icon: Video },
                  { value: 'HYBRID', label: 'Hybrid', icon: Users },
                ].map((option) => (
                  <label
                    key={option.value}
                    className={cn(
                      'flex items-center justify-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors',
                      meetingType === option.value
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-neutral-300 hover:bg-neutral-50'
                    )}
                  >
                    <input
                      type="radio"
                      {...register('type')}
                      value={option.value}
                      className="sr-only"
                    />
                    <option.icon className="h-4 w-4" />
                    <span className="text-sm font-medium">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Date and Time */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Date & Time *
                </label>
                <Input
                  type="datetime-local"
                  {...register('proposedDateTime')}
                  error={errors.proposedDateTime?.message}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Duration (minutes) *
                </label>
                <select
                  {...register('duration', { valueAsNumber: true })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>1 hour</option>
                  <option value={90}>1.5 hours</option>
                  <option value={120}>2 hours</option>
                </select>
              </div>
            </div>

            {/* Location (for in-person or hybrid) */}
            {(meetingType === 'IN_PERSON' || meetingType === 'HYBRID') && (
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Location
                </label>
                <Input
                  {...register('location')}
                  placeholder="e.g., FCI Building, Room 502"
                />
              </div>
            )}

            {/* Online Meeting Section */}
            {showOnlineFields && (
              <div className="space-y-4 p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-neutral-900 flex items-center gap-2">
                    <Globe className="h-4 w-4 text-primary-500" />
                    Online Meeting Setup
                  </h4>
                  <button
                    type="button"
                    onClick={() => setShowPlatformHelp(!showPlatformHelp)}
                    className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1"
                  >
                    <Info className="h-3.5 w-3.5" />
                    How to get a meeting link?
                  </button>
                </div>

                {/* Platform Help Panel */}
                {showPlatformHelp && (
                  <div className="p-3 bg-primary-50 border border-primary-100 rounded-md text-sm space-y-2">
                    <p className="font-medium text-primary-800">Quick Guide:</p>
                    <ul className="space-y-1.5 text-primary-700">
                      {ONLINE_PLATFORMS.filter(p => p.key !== 'OTHER').map((p) => (
                        <li key={p.key} className="flex items-start gap-2">
                          <span className={cn('font-medium min-w-[80px]', p.color)}>{p.shortLabel}:</span>
                          <span>{p.helpText}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Platform Picker */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Platform
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {ONLINE_PLATFORMS.filter(p => p.key !== 'OTHER').map((platform) => (
                      <button
                        key={platform.key}
                        type="button"
                        onClick={() => setValue('onlinePlatform', platform.key)}
                        className={cn(
                          'flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors border',
                          onlinePlatform === platform.key
                            ? cn('border-primary-500', platform.bgColor, platform.color)
                            : 'border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50'
                        )}
                      >
                        <Video className="h-4 w-4" />
                        {platform.shortLabel}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setValue('onlinePlatform', 'OTHER')}
                      className={cn(
                        'flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors border',
                        onlinePlatform === 'OTHER'
                          ? 'border-primary-500 bg-neutral-100 text-neutral-700'
                          : 'border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50'
                      )}
                    >
                      <Link2 className="h-4 w-4" />
                      Other
                    </button>
                  </div>
                </div>

                {/* Meeting URL with auto-detect */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Meeting Link
                  </label>
                  <div className="relative">
                    <Input
                      {...register('meetingUrl')}
                      placeholder={selectedPlatformInfo.placeholder}
                      error={errors.meetingUrl?.message}
                      className="pr-10"
                    />
                    {meetingUrl && (
                      <button
                        type="button"
                        onClick={handleCopyLink}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded hover:bg-neutral-200 transition-colors"
                        title="Copy link"
                      >
                        {linkCopied ? (
                          <Check className="h-4 w-4 text-success-500" />
                        ) : (
                          <Copy className="h-4 w-4 text-neutral-400" />
                        )}
                      </button>
                    )}
                  </div>
                  {meetingUrl && detectPlatformFromUrl(meetingUrl) !== 'OTHER' && (
                    <p className="text-xs text-success-600 mt-1 flex items-center gap-1">
                      <Check className="h-3 w-3" />
                      Detected: {getPlatformInfo(detectPlatformFromUrl(meetingUrl)).label}
                    </p>
                  )}
                  <p className="text-xs text-neutral-500 mt-1">
                    Paste the meeting link here. The platform will be auto-detected from the URL.
                  </p>
                </div>
              </div>
            )}

            {/* Agenda */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Agenda (Optional)
              </label>
              <textarea
                {...register('agenda')}
                rows={4}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Enter topics to discuss during the meeting..."
              />
            </div>
          </div>
        </Card>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <Link to={ROUTES.SUPERVISOR.MEETINGS}>
            <Button variant="secondary" type="button">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={createMeeting.isPending}>
            {createMeeting.isPending ? (
              <Spinner size="sm" className="mr-2" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Schedule Meeting
          </Button>
        </div>
      </form>
    </div>
  )
}
