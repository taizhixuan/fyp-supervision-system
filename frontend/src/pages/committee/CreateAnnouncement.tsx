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
  useCommitteeAnnouncement,
  useCreateCommitteeAnnouncement,
  useUpdateCommitteeAnnouncement,
} from '@/lib/hooks/useCommittee'
import { ROUTES } from '@/lib/constants/routes'
import { cn } from '@/lib/utils/cn'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB

const announcementSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title is too long'),
  content: z.string().min(1, 'Content is required').max(10000, 'Content is too long'),
  scope: z.enum(['ALL', 'FYP1', 'FYP2', 'PROGRAMME_CS', 'PROGRAMME_SE', 'PROGRAMME_DS']),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']),
  publishAt: z.string().min(1, 'Publish date is required'),
  expiresAt: z.string().optional(),
})

type AnnouncementFormData = z.infer<typeof announcementSchema>
type LinkRow = { label: string; url: string }

export function CreateAnnouncement() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEditing = !!id

  const { data: existingAnnouncement, isLoading: loadingAnnouncement } = useCommitteeAnnouncement(Number(id))
  const createMutation = useCreateCommitteeAnnouncement()
  const updateMutation = useUpdateCommitteeAnnouncement()

  const [files, setFiles] = useState<File[]>([])
  const [links, setLinks] = useState<LinkRow[]>([])
  const [fileError, setFileError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<AnnouncementFormData>({
    resolver: zodResolver(announcementSchema),
    defaultValues: {
      scope: 'ALL',
      priority: 'NORMAL',
      publishAt: new Date().toISOString().slice(0, 16),
    },
  })

  const selectedScope = watch('scope')
  const selectedPriority = watch('priority')

  useEffect(() => {
    if (existingAnnouncement) {
      reset({
        title: existingAnnouncement.title,
        content: existingAnnouncement.content,
        scope: existingAnnouncement.scope,
        priority: existingAnnouncement.priority,
        publishAt: new Date(existingAnnouncement.publishAt).toISOString().slice(0, 16),
        expiresAt: existingAnnouncement.expiresAt
          ? new Date(existingAnnouncement.expiresAt).toISOString().slice(0, 16)
          : undefined,
      })
    }
  }, [existingAnnouncement, reset])

  const onSubmit = async (data: AnnouncementFormData) => {
    try {
      const cleanedLinks = links
        .map((l) => ({ label: l.label.trim(), url: l.url.trim() }))
        .filter((l) => l.label && l.url)
      const payload = {
        ...data,
        publishAt: new Date(data.publishAt).toISOString(),
        expiresAt: data.expiresAt ? new Date(data.expiresAt).toISOString() : undefined,
        links: cleanedLinks,
        attachments: files,
      }

      if (isEditing && existingAnnouncement) {
        await updateMutation.mutateAsync({
          announcementId: existingAnnouncement.announcementId,
          ...payload,
        })
      } else {
        await createMutation.mutateAsync(payload)
      }
      navigate(ROUTES.COMMITTEE.ANNOUNCEMENTS)
    } catch (error) {
      console.error('Failed to save announcement:', error)
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
    // Reset the input so the same filename can be re-picked.
    e.target.value = ''
  }

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx))
  }

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

  const scopeOptions = [
    { value: 'ALL', label: 'All Students', description: 'Visible to all FYP students' },
    { value: 'FYP1', label: 'FYP1 Only', description: 'Only FYP1 students' },
    { value: 'FYP2', label: 'FYP2 Only', description: 'Only FYP2 students' },
    { value: 'PROGRAMME_CS', label: 'Computer Science', description: 'CS programme only' },
    { value: 'PROGRAMME_SE', label: 'Software Engineering', description: 'SE programme only' },
    { value: 'PROGRAMME_DS', label: 'Data Science', description: 'DS programme only' },
  ]

  const priorityOptions = [
    { value: 'LOW', label: 'Low', color: 'bg-neutral-100 text-neutral-700' },
    { value: 'NORMAL', label: 'Normal', color: 'bg-info-50 text-info-700' },
    { value: 'HIGH', label: 'High', color: 'bg-warning-50 text-warning-700' },
    { value: 'URGENT', label: 'Urgent', color: 'bg-error-50 text-error-700' },
  ]

  return (
    <div className="space-y-3 lg:space-y-4 lg:max-w-6xl lg:mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to={ROUTES.COMMITTEE.ANNOUNCEMENTS}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Announcements
          </Button>
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
          <Megaphone className="h-7 w-7 text-primary-600" />
          {isEditing ? 'Edit Announcement' : 'Create FYP Announcement'}
        </h1>
        <p className="text-neutral-600 mt-1">
          {isEditing
            ? 'Update your announcement details'
            : 'Create a new announcement for FYP students and supervisors'}
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
                placeholder="e.g., FYP1 Proposal Submission Deadline"
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
                rows={8}
                className={cn(
                  'w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
                  errors.content ? 'border-error-500' : 'border-neutral-300'
                )}
                placeholder="Write your announcement content here. You can include important details, deadlines, and instructions..."
              />
              {errors.content && (
                <p className="text-sm text-error-500 mt-1">{errors.content.message}</p>
              )}
              <p className="text-xs text-neutral-500 mt-1">
                Supports plain text. Keep announcements clear and concise.
              </p>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Priority *
              </label>
              <div className="grid grid-cols-4 gap-2">
                {priorityOptions.map((option) => (
                  <label
                    key={option.value}
                    className={cn(
                      'flex items-center justify-center p-2 rounded-lg cursor-pointer border-2 transition-colors text-sm font-medium',
                      selectedPriority === option.value
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

        {/* Target Audience */}
        <Card>
          <h3 className="font-semibold text-neutral-900 mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-neutral-400" />
            Target Audience
          </h3>

          <div className="grid sm:grid-cols-2 gap-3">
            {scopeOptions.map((option) => (
              <label
                key={option.value}
                className={cn(
                  'flex flex-col p-3 rounded-lg cursor-pointer border transition-colors',
                  selectedScope === option.value
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-neutral-200 hover:bg-neutral-50'
                )}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    {...register('scope')}
                    value={option.value}
                    className="sr-only"
                  />
                  <span className={cn(
                    'w-4 h-4 rounded-full border-2 flex items-center justify-center',
                    selectedScope === option.value ? 'border-primary-500' : 'border-neutral-300'
                  )}>
                    {selectedScope === option.value && (
                      <span className="w-2 h-2 rounded-full bg-primary-500" />
                    )}
                  </span>
                  <span className="text-sm font-medium text-neutral-900">{option.label}</span>
                </div>
                <span className="text-xs text-neutral-500 mt-1 ml-6">{option.description}</span>
              </label>
            ))}
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
                <label className="block text-sm font-medium text-neutral-700">
                  External links
                </label>
                <Button type="button" variant="ghost" size="sm" onClick={addLinkRow} leftIcon={<Link2 className="h-4 w-4" />}>
                  Add link
                </Button>
              </div>
              {links.length === 0 ? (
                <p className="text-xs text-neutral-500">No external links yet — useful for guides, slides, or external resources.</p>
              ) : (
                <ul className="space-y-2">
                  {links.map((link, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Input
                        placeholder="Label (e.g. Marking Rubric)"
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
              <p className="text-xs text-neutral-500 mt-1">
                Set to now for immediate publishing
              </p>
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
            Updates as you type — this is how students will see the announcement.
          </p>
          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-start gap-3">
              <div className={cn(
                'p-2 rounded-lg',
                selectedPriority === 'URGENT' ? 'bg-error-50' :
                selectedPriority === 'HIGH' ? 'bg-warning-50' :
                selectedPriority === 'NORMAL' ? 'bg-info-50' : 'bg-neutral-100'
              )}>
                <Megaphone className={cn(
                  'h-5 w-5',
                  selectedPriority === 'URGENT' ? 'text-error-600' :
                  selectedPriority === 'HIGH' ? 'text-warning-600' :
                  selectedPriority === 'NORMAL' ? 'text-info-600' : 'text-neutral-600'
                )} />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-neutral-900">
                  {watch('title') || 'Announcement Title'}
                </h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className={cn(
                    'px-2 py-0.5 rounded-full text-xs font-medium',
                    selectedPriority === 'URGENT' ? 'bg-error-50 text-error-700' :
                    selectedPriority === 'HIGH' ? 'bg-warning-50 text-warning-700' :
                    selectedPriority === 'NORMAL' ? 'bg-info-50 text-info-700' : 'bg-neutral-100 text-neutral-700'
                  )}>
                    {priorityOptions.find(p => p.value === selectedPriority)?.label}
                  </span>
                  <span className="text-xs text-neutral-500">
                    {scopeOptions.find(s => s.value === selectedScope)?.label}
                  </span>
                </div>
                <p className="mt-2 text-sm text-neutral-600 whitespace-pre-wrap">
                  {watch('content') || 'Announcement content will appear here...'}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <Link to={ROUTES.COMMITTEE.ANNOUNCEMENTS}>
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
