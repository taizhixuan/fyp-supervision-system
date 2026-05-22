import { useState } from 'react'
import { useNavigate, Link, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  ArrowLeft,
  Upload,
  FileText,
  X,
  CheckCircle,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import { useGeneralDocument, useUploadGeneralDocument, useUpdateGeneralDocument } from '@/lib/hooks/useCommittee'
import { ROUTES } from '@/lib/constants/routes'
import { cn } from '@/lib/utils/cn'

const documentSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title is too long'),
  description: z.string().max(1000, 'Description is too long').optional(),
  category: z.enum(['TEMPLATE', 'RUBRIC', 'HANDBOOK', 'GUIDELINE', 'FORM', 'OTHER']),
  visibility: z.enum(['PUBLIC', 'STUDENTS_ONLY', 'SUPERVISORS_ONLY', 'COMMITTEE_ONLY']),
  cycleScope: z.enum(['EVERGREEN', 'FYP1', 'FYP2']),
  changeNotes: z.string().max(500, 'Change notes too long').optional(),
})

type DocumentFormData = z.infer<typeof documentSchema>

export function DocumentUpload() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEditing = !!id
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const { data: existingDocument, isLoading: loadingDocument } = useGeneralDocument(Number(id))
  const uploadMutation = useUploadGeneralDocument()
  const updateMutation = useUpdateGeneralDocument()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<DocumentFormData>({
    resolver: zodResolver(documentSchema),
    defaultValues: isEditing && existingDocument ? {
      title: existingDocument.title,
      description: existingDocument.description || '',
      category: existingDocument.category,
      visibility: existingDocument.visibility,
      cycleScope: (existingDocument as { cycleType?: 'FYP1' | 'FYP2' | null }).cycleType ?? 'EVERGREEN',
    } : {
      category: 'TEMPLATE',
      visibility: 'PUBLIC',
      cycleScope: 'EVERGREEN',
    },
  })

  const selectedCategory = watch('category')
  const selectedVisibility = watch('visibility')
  const selectedCycleScope = watch('cycleScope')

  const onSubmit = async (data: DocumentFormData) => {
    try {
      if (isEditing && existingDocument) {
        await updateMutation.mutateAsync({
          documentId: existingDocument.documentId,
          ...data,
          file: selectedFile || undefined,
        })
      } else {
        if (!selectedFile) {
          alert('Please select a file to upload')
          return
        }
        await uploadMutation.mutateAsync({
          ...data,
          file: selectedFile,
        })
      }
      navigate(ROUTES.COMMITTEE.DOCUMENTS)
    } catch (error) {
      console.error('Failed to save document:', error)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  if (isEditing && loadingDocument) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    )
  }

  const isPending = uploadMutation.isPending || updateMutation.isPending

  const categoryOptions = [
    { value: 'TEMPLATE', label: 'Template', description: 'Document templates for students' },
    { value: 'RUBRIC', label: 'Rubric', description: 'Assessment rubrics' },
    { value: 'HANDBOOK', label: 'Handbook', description: 'FYP handbooks and guides' },
    { value: 'GUIDELINE', label: 'Guideline', description: 'Instructions and guidelines' },
    { value: 'FORM', label: 'Form', description: 'Official forms' },
    { value: 'OTHER', label: 'Other', description: 'Other documents' },
  ]

  const visibilityOptions = [
    { value: 'PUBLIC', label: 'Public', description: 'Visible to everyone' },
    { value: 'STUDENTS_ONLY', label: 'Students Only', description: 'Only FYP students can view' },
    { value: 'SUPERVISORS_ONLY', label: 'Supervisors Only', description: 'Only supervisors can view' },
    { value: 'COMMITTEE_ONLY', label: 'Committee Only', description: 'Only committee members can view' },
  ]

  const cycleScopeOptions = [
    { value: 'EVERGREEN', label: 'All cycles (evergreen)', description: 'General handbook, writing tips — every cohort sees this' },
    { value: 'FYP1', label: 'Current FYP1 cycle', description: 'Pinned to the active FYP1 cohort; hidden from past or future cycles' },
    { value: 'FYP2', label: 'Current FYP2 cycle', description: 'Pinned to the active FYP2 cohort; hidden from past or future cycles' },
  ]

  return (
    <div className="space-y-4 lg:space-y-5 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to={ROUTES.COMMITTEE.DOCUMENTS}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Documents
          </Button>
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
          <Upload className="h-7 w-7 text-primary-600" />
          {isEditing ? 'Update Document' : 'Upload Document'}
        </h1>
        <p className="text-neutral-600 mt-1">
          {isEditing
            ? 'Update document details or upload a new version'
            : 'Upload a new document for FYP students and supervisors'}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 lg:space-y-5">
        {/* File Upload */}
        <Card>
          <h3 className="font-semibold text-neutral-900 mb-4">
            {isEditing ? 'Upload New Version (Optional)' : 'Select File *'}
          </h3>

          <div className="border-2 border-dashed border-neutral-300 rounded-lg p-6">
            {selectedFile ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary-50 rounded-lg">
                    <FileText className="h-6 w-6 text-primary-600" />
                  </div>
                  <div>
                    <p className="font-medium text-neutral-900">{selectedFile.name}</p>
                    <p className="text-sm text-neutral-500">{formatFileSize(selectedFile.size)}</p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedFile(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <label className="flex flex-col items-center cursor-pointer">
                <Upload className="h-10 w-10 text-neutral-400 mb-3" />
                <span className="text-sm font-medium text-neutral-700">
                  Click to upload or drag and drop
                </span>
                <span className="text-xs text-neutral-500 mt-1">
                  PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX up to 50MB
                </span>
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      setSelectedFile(e.target.files[0])
                    }
                  }}
                />
              </label>
            )}
          </div>

          {isEditing && existingDocument && !selectedFile && (
            <div className="mt-4 p-3 bg-neutral-50 rounded-lg">
              <p className="text-sm text-neutral-600">
                Current file: <span className="font-medium">{existingDocument.fileName}</span>
                ({formatFileSize(existingDocument.fileSize)})
              </p>
            </div>
          )}
        </Card>

        {/* Document Details */}
        <Card>
          <h3 className="font-semibold text-neutral-900 mb-4">Document Details</h3>

          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Title *
              </label>
              <Input
                {...register('title')}
                placeholder="e.g., FYP Proposal Template"
                error={errors.title?.message}
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Description
              </label>
              <textarea
                {...register('description')}
                rows={3}
                className={cn(
                  'w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
                  errors.description ? 'border-error-500' : 'border-neutral-300'
                )}
                placeholder="Brief description of this document..."
              />
              {errors.description && (
                <p className="text-sm text-error-500 mt-1">{errors.description.message}</p>
              )}
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Category *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {categoryOptions.map((option) => (
                  <label
                    key={option.value}
                    className={cn(
                      'flex flex-col p-3 rounded-lg cursor-pointer border transition-colors',
                      selectedCategory === option.value
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-neutral-200 hover:bg-neutral-50'
                    )}
                  >
                    <input
                      type="radio"
                      {...register('category')}
                      value={option.value}
                      className="sr-only"
                    />
                    <span className="text-sm font-medium text-neutral-900">{option.label}</span>
                    <span className="text-xs text-neutral-500 mt-0.5">{option.description}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Visibility */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Visibility *
              </label>
              <div className="grid grid-cols-2 gap-2">
                {visibilityOptions.map((option) => (
                  <label
                    key={option.value}
                    className={cn(
                      'flex flex-col p-3 rounded-lg cursor-pointer border transition-colors',
                      selectedVisibility === option.value
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
                    <span className="text-sm font-medium text-neutral-900">{option.label}</span>
                    <span className="text-xs text-neutral-500 mt-0.5">{option.description}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Cycle scope */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Cycle scope *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {cycleScopeOptions.map((option) => (
                  <label
                    key={option.value}
                    className={cn(
                      'flex flex-col p-3 rounded-lg cursor-pointer border transition-colors',
                      selectedCycleScope === option.value
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-neutral-200 hover:bg-neutral-50'
                    )}
                  >
                    <input
                      type="radio"
                      {...register('cycleScope')}
                      value={option.value}
                      className="sr-only"
                    />
                    <span className="text-sm font-medium text-neutral-900">{option.label}</span>
                    <span className="text-xs text-neutral-500 mt-0.5">{option.description}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Change Notes (for updates) */}
            {isEditing && (
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Change Notes
                </label>
                <textarea
                  {...register('changeNotes')}
                  rows={2}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Describe what changed in this version..."
                />
              </div>
            )}
          </div>
        </Card>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <Link to={ROUTES.COMMITTEE.DOCUMENTS}>
            <Button variant="secondary" type="button">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={isPending || (!isEditing && !selectedFile)}>
            {isPending ? (
              <Spinner size="sm" className="mr-2" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-2" />
            )}
            {isEditing ? 'Update Document' : 'Upload Document'}
          </Button>
        </div>
      </form>
    </div>
  )
}
