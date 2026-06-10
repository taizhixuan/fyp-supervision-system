import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  ArrowLeft,
  Megaphone,
  Send,
  Users,
  Paperclip,
  Link2,
  Trash2,
  Eye,
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
import type { CreateSupervisorAnnouncementData } from '@/types/supervisor'
import { ROUTES } from '@/lib/constants/routes'
import { cn } from '@/lib/utils/cn'

const MAX_FILE_SIZE = 10 * 1024 * 1024

const announcementSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title is too long'),
  content: z.string().min(1, 'Content is required').max(5000, 'Content is too long'),
  visibility: z.enum(['ALL_SUPERVISEES', 'SPECIFIC_STUDENTS', 'FYP1', 'FYP2']),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']),
  publishAt: z.string().min(1, 'Publish date is required'),
  expiresAt: z.string().optional(),
  targetStudentIds: z.array(z.number()).optional(),
})

type AnnouncementFormData = z.infer<typeof announcementSchema>
type LinkRow = { label: string; url: string }

export function CreateAnnouncement() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEditing = !!id

  const { data: existingAnnouncement, isLoading: loadingAnnouncement } = useSupervisorAnnouncement(Number(id))
  const { data: superviseesData } = useSupervisees()
  const createMutation = useCreateAnnouncement()
  const updateMutation = useUpdateAnnouncement()

  const [files, setFiles] = useState<File[]>([])
  const [links, setLinks] = useState<LinkRow[]>([])
  const [fileError, setFileError] = useState<string | null>(null)

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
      const cleanedLinks = links
        .map((l) => ({ label: l.label.trim(), url: l.url.trim() }))
        .filter((l) => l.label && l.url)
      const publishAt = new Date(data.publishAt).toISOString()
      const expiresAt = data.expiresAt ? new Date(data.expiresAt).toISOString() : undefined

      if (isEditing && existingAnnouncement) {
        await updateMutation.mutateAsync({
          announcementId: existingAnnouncement.announcementId,
          title: data.title,
          content: data.content,
          visibility: data.visibility,
          priority: data.priority,
          targetStudentIds: data.targetStudentIds,
          publishAt,
          expiresAt,
          isActive: true,
        })
      } else {
        const createPayload: CreateSupervisorAnnouncementData = {
          title: data.title,
          content: data.content,
          visibility: data.visibility,
          priority: data.priority,
          targetStudentIds: data.targetStudentIds,
          publishAt,
          expiresAt,
          attachments: files,
          links: cleanedLinks,
        }
        await createMutation.mutateAsync(createPayload)
      }
      navigate(ROUTES.SUPERVISOR.ANNOUNCEMENTS)
    } catch (error) {
      console.error('Failed to save announcement:', error)
    }
  }

  const toggleStudent = (studentUserId: number) => {
    const current = selectedStudents
    if (current.includes(studentUserId)) {
      setValue('targetStudentIds', current.filter((id) => id !== studentUserId))
    } else {
      setValue('targetStudentIds', [...current, studentUserId])
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null)
    const incoming = Array.from(e.target.files ?? [])
    const oversize = incoming.find((f) => f.size > MAX_FILE_SIZE)
    if (oversize) {
      setFileError(`"${oversize.name}" is over the 10 MB limit.`)
      return
    }
    setFiles((prev) => [...prev, ...incoming])
    e.target.value = ''
  }
  const removeFile = (idx: number) => setFiles((prev) => prev.filter((_, i) => i !== idx))
  const addLinkRow = () => setLinks((prev) => [...prev, { label: '', url: '' }])
  const updateLink = (idx: number, key: 'label' | 'url', value: string) => {
    setLinks((prev) => prev.map((l, i) => (i === idx ? { ...l, [key]: value } : l)))
  }
  const removeLink = (idx: number) => setLinks((prev) => prev.filter((_, i) => i !== idx))

  if (isEditing && loadingAnnouncement) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    )
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <div className="space-y-3 lg:space-y-4 lg:max-w-6xl lg:mx-auto">
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

      <form onSubmit={handleSubmit(onSubmit)} className="lg:grid lg:grid-cols-12 lg:gap-6 lg:items-start space-y-4 lg:space-y-0">
        {/* Left column: form fields */}
        <div className="lg:col-span-7 space-y-3 lg:space-y-4">
        {/* Basic Info */}
        <Card>
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
        <Card>
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

            {/* Student Selection (if specific students) — current supervisees only.
                Past-cycle students are filtered out by the backend so they don't
                appear here. */}
            {visibility === 'SPECIFIC_STUDENTS' && superviseesData && (
              <div className="border rounded-lg p-4 bg-neutral-50">
                <p className="text-sm font-medium text-neutral-700 mb-3">
                  Select current supervisees to notify:
                </p>
                {superviseesData.supervisees.length === 0 ? (
                  <p className="text-sm text-neutral-500">
                    No active supervisees in your current cycle.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {superviseesData.supervisees.map((student) => {
                      const sid = Number(student.userId)
                      return (
                        <label
                          key={student.superviseeId}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedStudents.includes(sid)}
                            onChange={() => toggleStudent(sid)}
                            className="w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                          />
                          <span className="text-sm text-neutral-700">{student.fullName}</span>
                          <span className="text-xs text-neutral-500">({student.studentId})</span>
                        </label>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>

        {/* Attachments + external links */}
        <Card>
          <h3 className="font-semibold text-neutral-900 mb-4 flex items-center gap-2">
            <Paperclip className="h-5 w-5 text-neutral-400" />
            Attachments &amp; Links
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Attach files (PDF, DOC, images — 10 MB max each)
              </label>
              <input
                type="file"
                multiple
                onChange={handleFileSelect}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,image/*,.txt,.zip"
                className="block w-full text-sm text-neutral-700 file:mr-3 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
              />
              {fileError && <p className="text-sm text-error-600 mt-2">{fileError}</p>}
              {files.length > 0 && (
                <ul className="mt-3 space-y-2">
                  {files.map((file, i) => (
                    <li key={i} className="flex items-center justify-between text-sm bg-neutral-50 rounded-md px-3 py-2">
                      <span className="truncate">
                        <Paperclip className="inline h-4 w-4 mr-2 text-neutral-400" />
                        {file.name} <span className="text-neutral-400">({(file.size / 1024).toFixed(1)} KB)</span>
                      </span>
                      <button type="button" onClick={() => removeFile(i)} className="text-error-600 hover:text-error-700">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-neutral-700">External links</label>
                <Button type="button" variant="ghost" size="sm" onClick={addLinkRow} leftIcon={<Link2 className="h-4 w-4" />}>
                  Add link
                </Button>
              </div>
              {links.length === 0 ? (
                <p className="text-xs text-neutral-500">No external links yet.</p>
              ) : (
                <ul className="space-y-2">
                  {links.map((link, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Input
                        placeholder="Label"
                        value={link.label}
                        onChange={(e) => updateLink(i, 'label', e.target.value)}
                      />
                      <Input
                        placeholder="https://..."
                        value={link.url}
                        onChange={(e) => updateLink(i, 'url', e.target.value)}
                      />
                      <button type="button" onClick={() => removeLink(i)} className="text-error-600 hover:text-error-700 p-2">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </Card>

        {/* Schedule */}
        <Card>
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
        </div>

        {/* Right column: sticky live preview + actions */}
        <aside className="lg:col-span-5">
          <div className="lg:sticky lg:top-6 space-y-4">

            {/* Preview */}
            <Card className="bg-neutral-50">
              <h3 className="font-semibold text-neutral-900 mb-1 flex items-center gap-2">
                <Eye className="h-5 w-5 text-neutral-400" />
                Live Preview
              </h3>
              <p className="text-xs text-neutral-500 mb-4">
                Updates as you type — this is how supervisees will see it.
              </p>
              <div className="bg-white rounded-lg border p-4">
                <div className="flex items-start gap-3">
                  <div className={cn(
                    'p-2 rounded-lg',
                    watch('priority') === 'URGENT' ? 'bg-error-50' :
                    watch('priority') === 'HIGH' ? 'bg-warning-50' :
                    watch('priority') === 'NORMAL' ? 'bg-info-50' : 'bg-neutral-100'
                  )}>
                    <Megaphone className={cn(
                      'h-5 w-5',
                      watch('priority') === 'URGENT' ? 'text-error-600' :
                      watch('priority') === 'HIGH' ? 'text-warning-600' :
                      watch('priority') === 'NORMAL' ? 'text-info-600' : 'text-neutral-600'
                    )} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-neutral-900 break-words">
                      {watch('title') || 'Announcement Title'}
                    </h4>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className={cn(
                        'px-2 py-0.5 rounded-full text-xs font-medium',
                        watch('priority') === 'URGENT' ? 'bg-error-50 text-error-700' :
                        watch('priority') === 'HIGH' ? 'bg-warning-50 text-warning-700' :
                        watch('priority') === 'NORMAL' ? 'bg-info-50 text-info-700' : 'bg-neutral-100 text-neutral-700'
                      )}>
                        {watch('priority')}
                      </span>
                      <span className="text-xs text-neutral-500">
                        {visibility === 'ALL_SUPERVISEES' ? 'All Supervisees' :
                         visibility === 'FYP1' ? 'FYP 1 Students' :
                         visibility === 'FYP2' ? 'FYP 2 Students' :
                         `${selectedStudents.length} specific student${selectedStudents.length === 1 ? '' : 's'}`}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-neutral-600 whitespace-pre-wrap break-words">
                      {watch('content') || 'Announcement content will appear here…'}
                    </p>
                    {(files.length > 0 || links.length > 0) && (
                      <div className="mt-3 pt-3 border-t border-neutral-100 space-y-1">
                        {files.length > 0 && (
                          <p className="text-xs text-neutral-500">
                            <Paperclip className="inline h-3 w-3 mr-1" />
                            {files.length} attachment{files.length === 1 ? '' : 's'}
                          </p>
                        )}
                        {links.length > 0 && (
                          <p className="text-xs text-neutral-500">
                            <Link2 className="inline h-3 w-3 mr-1" />
                            {links.filter((l) => l.label && l.url).length} link
                            {links.filter((l) => l.label && l.url).length === 1 ? '' : 's'}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            {/* Submit */}
            <div className="flex justify-end gap-3">
              <Link to={ROUTES.SUPERVISOR.ANNOUNCEMENTS}>
                <Button variant="secondary" type="button">
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
          </div>
        </aside>
      </form>
    </div>
  )
}
