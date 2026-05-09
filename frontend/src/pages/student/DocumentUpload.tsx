import { useState, useRef, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  ArrowLeft,
  Upload,
  File,
  FileText,
  FileCode,
  Database,
  Presentation,
  CheckCircle,
  AlertCircle,
  Cloud,
} from 'lucide-react'
import { Card, Button, Input } from '@/components/ui'
import { useUploadDocument } from '@/lib/hooks/useStudent'
import { ROUTES } from '@/lib/constants/routes'
import { getApiErrorMessage } from '@/lib/api/client'
import { cn } from '@/lib/utils/cn'
import type { DocumentType, DocumentPhase } from '@/types'

const uploadSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  type: z.enum(['PROPOSAL', 'REPORT', 'PRESENTATION', 'CODE', 'DATASET', 'OTHER']),
  phase: z.enum(['FYP1', 'FYP2', 'FINAL']),
})

type UploadFormData = z.infer<typeof uploadSchema>

const typeOptions: { value: DocumentType; label: string; description: string; icon: typeof FileText }[] = [
  { value: 'PROPOSAL', label: 'Proposal', description: 'FYP proposal documents', icon: FileText },
  { value: 'REPORT', label: 'Report', description: 'Progress reports and chapters', icon: FileText },
  { value: 'PRESENTATION', label: 'Presentation', description: 'Slides and presentations', icon: Presentation },
  { value: 'CODE', label: 'Code', description: 'Source code and repositories', icon: FileCode },
  { value: 'DATASET', label: 'Dataset', description: 'Data files and datasets', icon: Database },
  { value: 'OTHER', label: 'Other', description: 'Diagrams, images, supporting files', icon: File },
]

const phaseOptions: { value: DocumentPhase; label: string; description: string }[] = [
  { value: 'FYP1', label: 'FYP 1', description: 'First semester deliverables' },
  { value: 'FYP2', label: 'FYP 2', description: 'Second semester deliverables' },
  { value: 'FINAL', label: 'Final', description: 'Final report / submission' },
]

const acceptedExtensions = '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.png,.jpg,.jpeg,.gif,.zip,.txt,.csv,.json'

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function DocumentUpload() {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [fileError, setFileError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const uploadDocument = useUploadDocument()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<UploadFormData>({
    resolver: zodResolver(uploadSchema),
    defaultValues: {
      title: '',
      description: '',
      type: 'OTHER',
      phase: 'FYP1',
    },
  })

  const selectedType = watch('type')
  const selectedPhase = watch('phase')

  const validateFile = (file: File): boolean => {
    setFileError(null)

    if (file.size > MAX_FILE_SIZE) {
      setFileError(`File size exceeds 50MB limit. Your file is ${formatFileSize(file.size)}.`)
      return false
    }

    return true
  }

  const handleFileSelect = useCallback((file: File) => {
    if (validateFile(file)) {
      setSelectedFile(file)
      const title = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ').trim()
      setValue('title', title.slice(0, 100))
    }
  }, [setValue])

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0])
    }
  }, [handleFileSelect])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0])
    }
  }

  const onSubmit = async (data: UploadFormData) => {
    setSubmitError(null)
    if (!selectedFile) {
      setFileError('Please select a file to upload')
      return
    }

    let progressTimer: ReturnType<typeof setInterval> | null = null
    try {
      progressTimer = setInterval(() => {
        setUploadProgress((prev) => (prev >= 90 ? prev : prev + 10))
      }, 200)

      await uploadDocument.mutateAsync({
        file: selectedFile,
        title: data.title,
        description: data.description,
        type: data.type,
        phase: data.phase,
      })

      if (progressTimer) clearInterval(progressTimer)
      setUploadProgress(100)
      setUploadSuccess(true)
    } catch (err) {
      if (progressTimer) clearInterval(progressTimer)
      setUploadProgress(0)
      setSubmitError(getApiErrorMessage(err))
    }
  }

  if (uploadSuccess) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-success-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-success-600" />
          </div>
          <h2 className="text-xl font-bold text-neutral-900 mb-2">Document Uploaded!</h2>
          <p className="text-neutral-600 mb-6">
            Your document has been uploaded successfully.
          </p>
          <div className="flex justify-center gap-3">
            <Button variant="primary" onClick={() => navigate(ROUTES.STUDENT.DOCUMENTS)}>
              View Documents
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setUploadSuccess(false)
                setSelectedFile(null)
                setUploadProgress(0)
                setSubmitError(null)
              }}
            >
              Upload Another
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link
        to={ROUTES.STUDENT.DOCUMENTS}
        className="inline-flex items-center gap-2 text-neutral-600 hover:text-primary-600 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Documents
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Upload Document</h1>
        <p className="text-neutral-600 mt-1">Add a new document to your FYP repository</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Select File</h2>

          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all',
              dragActive && 'border-primary-500 bg-primary-50',
              selectedFile && !fileError && 'border-success-500 bg-success-50',
              fileError && 'border-error-500 bg-error-50',
              !dragActive && !selectedFile && !fileError && 'border-neutral-300 hover:border-primary-400 hover:bg-neutral-50'
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept={acceptedExtensions}
              onChange={handleInputChange}
            />

            {selectedFile && !fileError ? (
              <div>
                <div className="w-16 h-16 rounded-full bg-success-100 flex items-center justify-center mx-auto mb-4">
                  <File className="h-8 w-8 text-success-600" />
                </div>
                <p className="font-medium text-neutral-900 break-all">{selectedFile.name}</p>
                <p className="text-sm text-neutral-500 mt-1">{formatFileSize(selectedFile.size)}</p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedFile(null)
                    setFileError(null)
                  }}
                  className="mt-4 text-sm text-error-600 hover:underline"
                >
                  Remove file
                </button>
              </div>
            ) : (
              <div>
                <div className={cn(
                  'w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4',
                  fileError ? 'bg-error-100' : 'bg-neutral-100'
                )}>
                  {fileError ? (
                    <AlertCircle className="h-8 w-8 text-error-600" />
                  ) : (
                    <Cloud className="h-8 w-8 text-neutral-400" />
                  )}
                </div>
                <p className="font-medium text-neutral-900">
                  {fileError || 'Drop your file here or click to browse'}
                </p>
                <p className="text-sm text-neutral-500 mt-1">
                  PDF, DOC, DOCX, PPT, PPTX, XLS, PNG, JPG, ZIP, TXT, CSV, JSON (max 50MB)
                </p>
              </div>
            )}
          </div>

          {uploadDocument.isPending && uploadProgress > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm text-neutral-600 mb-2">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-500 rounded-full transition-all"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Document Details</h2>

          <div className="space-y-4">
            <Input
              label="Document Title"
              placeholder="Enter a title for this document"
              error={errors.title?.message}
              required
              {...register('title')}
            />

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Description (Optional)
              </label>
              <textarea
                className="w-full px-4 py-3 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                rows={3}
                placeholder="Brief description of the document..."
                {...register('description')}
              />
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Document Type</h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {typeOptions.map((option) => {
              const Icon = option.icon
              const active = selectedType === option.value
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setValue('type', option.value, { shouldValidate: true })}
                  className={cn(
                    'p-4 rounded-lg border-2 text-left transition-all',
                    active
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-neutral-200 hover:border-neutral-300'
                  )}
                >
                  <Icon className={cn(
                    'h-5 w-5 mb-2',
                    active ? 'text-primary-600' : 'text-neutral-500'
                  )} />
                  <p className="font-medium text-neutral-900">{option.label}</p>
                  <p className="text-xs text-neutral-500 mt-1">{option.description}</p>
                </button>
              )
            })}
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Phase</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {phaseOptions.map((option) => {
              const active = selectedPhase === option.value
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setValue('phase', option.value, { shouldValidate: true })}
                  className={cn(
                    'p-4 rounded-lg border-2 text-left transition-all',
                    active
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-neutral-200 hover:border-neutral-300'
                  )}
                >
                  <p className={cn('font-medium', active ? 'text-primary-700' : 'text-neutral-900')}>
                    {option.label}
                  </p>
                  <p className="text-xs text-neutral-500 mt-1">{option.description}</p>
                </button>
              )
            })}
          </div>
        </Card>

        {submitError && (
          <div className="rounded-lg border border-error-200 bg-error-50 p-4 text-sm text-error-700">
            {submitError}
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-neutral-200">
          <p className="text-sm text-neutral-500">
            Maximum file size: 50MB
          </p>
          <Button
            type="submit"
            variant="primary"
            leftIcon={<Upload className="h-4 w-4" />}
            isLoading={uploadDocument.isPending}
            disabled={!selectedFile || !!fileError}
          >
            Upload Document
          </Button>
        </div>
      </form>
    </div>
  )
}
