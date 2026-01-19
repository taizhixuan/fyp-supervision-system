import { useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  ArrowLeft,
  Megaphone,
  Send,
  Users,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import {
  useSupervisorAnnouncement,
  useCreateAnnouncement,
  useUpdateAnnouncement,
  useSupervisees,
} from '@/lib/hooks/useSupervisor'
import { ROUTES } from '@/lib/constants/routes'
import { cn } from '@/lib/utils/cn'

const announcementSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title is too long'),
  content: z.string().min(1, 'Content is required').max(5000, 'Content is too long'),
  visibility: z.enum(['ALL_SUPERVISEES', 'SPECIFIC_STUDENTS', 'FYP1', 'FYP2']),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']),
  publishAt: z.string().min(1, 'Publish date is required'),
  expiresAt: z.string().optional(),
  targetStudentIds: z.array(z.string()).optional(),
})

type AnnouncementFormData = z.infer<typeof announcementSchema>

export function CreateAnnouncement() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEditing = !!id

  const { data: existingAnnouncement, isLoading: loadingAnnouncement } = useSupervisorAnnouncement(Number(id))
  const { data: superviseesData } = useSupervisees()
  const createMutation = useCreateAnnouncement()
  const updateMutation = useUpdateAnnouncement()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<AnnouncementFormData>({
    resolver: zodResolver(announcementSchema),
    defaultValues: {
      visibility: 'ALL_SUPERVISEES',
      priority: 'NORMAL',
      publishAt: new Date().toISOString().slice(0, 16),
      targetStudentIds: [],
    },
  })

  const visibility = watch('visibility')
  const selectedStudents = watch('targetStudentIds') || []

  useEffect(() => {
    if (existingAnnouncement) {
      reset({
        title: existingAnnouncement.title,
        content: existingAnnouncement.content,
        visibility: existingAnnouncement.visibility,
        priority: existingAnnouncement.priority,
        publishAt: new Date(existingAnnouncement.publishAt).toISOString().slice(0, 16),
        expiresAt: existingAnnouncement.expiresAt
          ? new Date(existingAnnouncement.expiresAt).toISOString().slice(0, 16)
          : undefined,
        targetStudentIds: existingAnnouncement.targetStudentIds || [],
      })
    }
  }, [existingAnnouncement, reset])

  const onSubmit = async (data: AnnouncementFormData) => {
    try {
      const payload = {
        ...data,
        publishAt: new Date(data.publishAt).toISOString(),
        expiresAt: data.expiresAt ? new Date(data.expiresAt).toISOString() : undefined,
        isActive: true,
      }

      if (isEditing && existingAnnouncement) {
        await updateMutation.mutateAsync({
          announcementId: existingAnnouncement.announcementId,
          ...payload,
        })
      } else {
        await createMutation.mutateAsync(payload)
      }
      navigate(ROUTES.SUPERVISOR.ANNOUNCEMENTS)
    } catch (error) {
      console.error('Failed to save announcement:', error)
    }
  }

  const toggleStudent = (studentId: string) => {
    const current = selectedStudents
    if (current.includes(studentId)) {
      setValue('targetStudentIds', current.filter((id) => id !== studentId))
    } else {
      setValue('targetStudentIds', [...current, studentId])
    }
  }

  if (isEditing && loadingAnnouncement) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    )
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to={ROUTES.SUPERVISOR.ANNOUNCEMENTS}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Announcements
          </Button>
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
          <Megaphone className="h-7 w-7 text-primary-600" />
          {isEditing ? 'Edit Announcement' : 'Create Announcement'}
        </h1>
        <p className="text-neutral-600 mt-1">
          {isEditing
            ? 'Update your announcement details'
            : 'Create a new announcement for your supervisees'}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Info */}
        <Card className="p-6">
          <h3 className="font-semibold text-neutral-900 mb-4">Announcement Details</h3>

          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Title *
              </label>
              <Input
                {...register('title')}
                placeholder="e.g., Progress Report Deadline Reminder"
                error={errors.title?.message}
              />
            </div>

            {/* Content */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Content *
              </label>
              <textarea
                {...register('content')}
                rows={6}
                className={cn(
                  'w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
                  errors.content ? 'border-error-500' : 'border-neutral-300'
                )}
                placeholder="Write your announcement content here..."
              />
              {errors.content && (
                <p className="text-sm text-error-500 mt-1">{errors.content.message}</p>
              )}
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Priority *
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { value: 'LOW', label: 'Low', color: 'bg-neutral-100 text-neutral-700' },
                  { value: 'NORMAL', label: 'Normal', color: 'bg-info-50 text-info-700' },
                  { value: 'HIGH', label: 'High', color: 'bg-warning-50 text-warning-700' },
                  { value: 'URGENT', label: 'Urgent', color: 'bg-error-50 text-error-700' },
                ].map((option) => (
                  <label
                    key={option.value}
                    className={cn(
                      'flex items-center justify-center p-2 rounded-lg cursor-pointer border-2 transition-colors text-sm font-medium',
                      watch('priority') === option.value
                        ? `border-primary-500 ${option.color}`
                        : 'border-transparent bg-neutral-50 text-neutral-600 hover:bg-neutral-100'
                    )}
                  >
                    <input
                      type="radio"
                      {...register('priority')}
                      value={option.value}
                      className="sr-only"
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Visibility */}
        <Card className="p-6">
          <h3 className="font-semibold text-neutral-900 mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-neutral-400" />
            Target Audience
          </h3>

          <div className="space-y-4">
            {/* Visibility Options */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'ALL_SUPERVISEES', label: 'All Supervisees' },
                { value: 'FYP1', label: 'FYP 1 Students' },
                { value: 'FYP2', label: 'FYP 2 Students' },
                { value: 'SPECIFIC_STUDENTS', label: 'Specific Students' },
              ].map((option) => (
                <label
                  key={option.value}
                  className={cn(
                    'flex items-center gap-2 p-3 rounded-lg cursor-pointer border transition-colors',
                    visibility === option.value
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-neutral-200 hover:bg-neutral-50'
                  )}
                >
                  <input
                    type="radio"
                    {...register('visibility')}
                    value={option.value}
                    className="sr-only"
                  />
                  <span className={cn(
                    'w-4 h-4 rounded-full border-2 flex items-center justify-center',
                    visibility === option.value ? 'border-primary-500' : 'border-neutral-300'
                  )}>
                    {visibility === option.value && (
                      <span className="w-2 h-2 rounded-full bg-primary-500" />
                    )}
                  </span>
                  <span className="text-sm font-medium text-neutral-700">{option.label}</span>
                </label>
              ))}
            </div>

            {/* Student Selection (if specific students) */}
            {visibility === 'SPECIFIC_STUDENTS' && superviseesData && (
              <div className="border rounded-lg p-4 bg-neutral-50">
                <p className="text-sm font-medium text-neutral-700 mb-3">
                  Select students to notify:
                </p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {superviseesData.supervisees.map((student) => (
                    <label
                      key={student.superviseeId}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedStudents.includes(student.superviseeId)}
                        onChange={() => toggleStudent(student.superviseeId)}
                        className="w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm text-neutral-700">{student.fullName}</span>
                      <span className="text-xs text-neutral-500">({student.studentId})</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Schedule */}
        <Card className="p-6">
          <h3 className="font-semibold text-neutral-900 mb-4">Schedule</h3>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Publish Date & Time *
              </label>
              <Input
                type="datetime-local"
                {...register('publishAt')}
                error={errors.publishAt?.message}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Expiry Date & Time (Optional)
              </label>
              <Input
                type="datetime-local"
                {...register('expiresAt')}
              />
              <p className="text-xs text-neutral-500 mt-1">
                Leave empty for no expiry
              </p>
            </div>
          </div>
        </Card>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <Link to={ROUTES.SUPERVISOR.ANNOUNCEMENTS}>
            <Button variant="outline" type="button">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={isPending}>
            {isPending ? (
              <Spinner size="sm" className="mr-2" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            {isEditing ? 'Update Announcement' : 'Publish Announcement'}
          </Button>
        </div>
      </form>
    </div>
  )
}
