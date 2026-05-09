import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft,
  FileText,
  Download,
  GraduationCap,
  MessageSquare,
  Send,
  Upload,
  AlertCircle,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import {
  useSuperviseeDocument,
  useSubmitDocumentFeedback,
  useDownloadSuperviseeDocument,
} from '@/lib/hooks/useSupervisor'
import { ROUTES } from '@/lib/constants/routes'
import { getApiErrorMessage } from '@/lib/api/client'
import { cn } from '@/lib/utils/cn'
import type { SvDocumentType } from '@/types'

const typeConfig: Record<SvDocumentType, { label: string; color: string; bgColor: string }> = {
  PROPOSAL: { label: 'Proposal', color: 'text-primary-600', bgColor: 'bg-primary-50' },
  REPORT: { label: 'Report', color: 'text-info-600', bgColor: 'bg-info-50' },
  PRESENTATION: { label: 'Presentation', color: 'text-accent-600', bgColor: 'bg-accent-50' },
  MEETING_NOTES: { label: 'Meeting Notes', color: 'text-success-600', bgColor: 'bg-success-50' },
  REFERENCE: { label: 'Reference', color: 'text-warning-600', bgColor: 'bg-warning-50' },
  FEEDBACK: { label: 'Feedback', color: 'text-orange-600', bgColor: 'bg-orange-50' },
  OTHER: { label: 'Other', color: 'text-neutral-600', bgColor: 'bg-neutral-100' },
}

function resolveType(type: string | undefined): SvDocumentType {
  if (!type) return 'OTHER'
  return (typeConfig[type as SvDocumentType] ? type : 'OTHER') as SvDocumentType
}

export function DocumentDetail() {
  const { id } = useParams<{ id: string }>()
  const [feedbackContent, setFeedbackContent] = useState('')
  const [annotatedFile, setAnnotatedFile] = useState<File | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const documentId = Number(id)
  const { data: document, isLoading, isError, error } = useSuperviseeDocument(documentId)
  const submitFeedback = useSubmitDocumentFeedback()
  const download = useDownloadSuperviseeDocument()

  const handleSubmitFeedback = async () => {
    if (!document || !feedbackContent.trim()) return
    setActionError(null)
    try {
      await submitFeedback.mutateAsync({
        documentId: document.documentId,
        content: feedbackContent,
        annotatedFile: annotatedFile || undefined,
      })
      setFeedbackContent('')
      setAnnotatedFile(null)
    } catch (err) {
      setActionError(getApiErrorMessage(err))
    }
  }

  const handleDownload = async () => {
    if (!document) return
    setActionError(null)
    try {
      await download.mutateAsync({ documentId: document.documentId, fileName: document.fileName })
    } catch (err) {
      setActionError(getApiErrorMessage(err))
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    )
  }

  if (isError || !document) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-4">
        <AlertCircle className="h-12 w-12 text-error-500 mx-auto" />
        <h2 className="text-xl font-semibold text-neutral-900">Document not found</h2>
        <p className="text-neutral-600">{isError ? getApiErrorMessage(error) : "The document you're looking for doesn't exist."}</p>
        <Link to={ROUTES.SUPERVISOR.DOCUMENTS}>
          <Button>Back to Documents</Button>
        </Link>
      </div>
    )
  }

  const typeKey = resolveType(document.type)
  const type = typeConfig[typeKey]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to={ROUTES.SUPERVISOR.DOCUMENTS}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Documents
          </Button>
        </Link>
      </div>

      {actionError && (
        <div className="rounded-lg border border-error-200 bg-error-50 p-4 text-sm text-error-700">
          {actionError}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card className="p-6">
            <div className="text-center">
              <div className={cn('w-20 h-20 rounded-lg flex items-center justify-center mx-auto mb-4', type.bgColor)}>
                <FileText className={cn('h-10 w-10', type.color)} />
              </div>
              <h2 className="text-lg font-semibold text-neutral-900 break-all">{document.title}</h2>
              <span className={cn(
                'inline-block mt-2 px-3 py-1 rounded-full text-sm font-medium',
                type.bgColor,
                type.color
              )}>
                {type.label}
              </span>
            </div>

            <div className="mt-6 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-4">
                <span className="text-neutral-500">File Name</span>
                <span className="font-medium text-neutral-900 truncate text-right" title={document.fileName}>
                  {document.fileName}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-500">File Size</span>
                <span className="font-medium">{formatFileSize(document.fileSize)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-500">Version</span>
                <span className="font-medium">{document.version}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-500">Uploaded</span>
                <span className="font-medium">
                  {new Date(document.uploadedAt).toLocaleDateString('en-MY', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </div>

            <div className="mt-6 space-y-2">
              <Button
                className="w-full"
                onClick={handleDownload}
                isLoading={download.isPending}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold text-neutral-900 mb-4">Uploaded By</h3>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                <GraduationCap className="h-6 w-6 text-primary-600" />
              </div>
              <div>
                <p className="font-medium text-neutral-900">{document.studentName}</p>
                <p className="text-sm text-neutral-500">Supervisee</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {document.description && (
            <Card className="p-6">
              <h3 className="font-semibold text-neutral-900 mb-3">Description</h3>
              <p className="text-neutral-600 whitespace-pre-wrap">{document.description}</p>
            </Card>
          )}

          <Card className="p-6">
            <h3 className="font-semibold text-neutral-900 mb-4 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-neutral-400" />
              Provide Feedback
            </h3>

            <textarea
              value={feedbackContent}
              onChange={(e) => setFeedbackContent(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 mb-4"
              placeholder="Enter your feedback or comments on this document..."
            />

            <div className="mb-4">
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Upload Annotated Version (Optional)
              </label>
              <div className="border-2 border-dashed border-neutral-300 rounded-lg p-4">
                {annotatedFile ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="h-5 w-5 text-neutral-400 flex-shrink-0" />
                      <span className="text-sm text-neutral-700 truncate">{annotatedFile.name}</span>
                      <span className="text-xs text-neutral-500 flex-shrink-0">
                        ({formatFileSize(annotatedFile.size)})
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setAnnotatedFile(null)}
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center cursor-pointer">
                    <Upload className="h-8 w-8 text-neutral-400 mb-2" />
                    <span className="text-sm text-neutral-600">
                      Click to upload annotated file
                    </span>
                    <span className="text-xs text-neutral-500 mt-1">
                      PDF, DOC, or DOCX up to 10MB
                    </span>
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          setAnnotatedFile(e.target.files[0])
                        }
                      }}
                    />
                  </label>
                )}
              </div>
            </div>

            <Button
              onClick={handleSubmitFeedback}
              disabled={!feedbackContent.trim() || submitFeedback.isPending}
            >
              {submitFeedback.isPending ? (
                <Spinner size="sm" className="mr-2" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Submit Feedback
            </Button>
          </Card>
        </div>
      </div>
    </div>
  )
}
