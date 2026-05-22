import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Download,
  Clock,
  FileText,
  User,
  History,
  CheckCircle,
  AlertCircle,
} from 'lucide-react'
import { Card, Button, Badge, Spinner } from '@/components/ui'
import { useDocumentDetail, useDownloadDocument } from '@/lib/hooks/useStudent'
import { ROUTES } from '@/lib/constants/routes'
import { getApiErrorMessage } from '@/lib/api/client'

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function DocumentHistory() {
  const { id } = useParams<{ id: string }>()
  const { data: document, isLoading, isError, error } = useDocumentDetail(id || '')
  const download = useDownloadDocument()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" label="Loading history..." />
      </div>
    )
  }

  if (isError || !document) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-4">
        <AlertCircle className="h-12 w-12 text-error-500 mx-auto" />
        <h2 className="text-xl font-semibold text-neutral-900">Document not found</h2>
        <p className="text-neutral-500">{isError ? getApiErrorMessage(error) : 'Document is no longer available.'}</p>
        <Link to={ROUTES.STUDENT.DOCUMENTS}>
          <Button variant="primary">Back to Documents</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4 lg:space-y-5">
      <Link
        to={ROUTES.STUDENT.DOCUMENT_DETAIL.replace(':id', document.documentId)}
        className="inline-flex items-center gap-2 text-neutral-600 hover:text-primary-600 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Document
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Version History</h1>
        <p className="text-neutral-600 mt-1">{document.title}</p>
      </div>

      <Card>
        <h2 className="text-lg font-semibold text-neutral-900 mb-6">Upload Record</h2>

        <div className="relative">
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-neutral-200" />
          <div className="relative pl-16">
            <div className="absolute left-0 w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold bg-primary-600 text-white">
              v{document.version}
            </div>
            <Card className="border-primary-300 bg-primary-50">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-neutral-900">Version {document.version}</h3>
                    <Badge variant="primary" size="sm">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Current
                    </Badge>
                  </div>

                  {document.description && (
                    <p className="text-sm text-neutral-600 mb-3 whitespace-pre-wrap">{document.description}</p>
                  )}

                  <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-500">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(document.uploadedAt).toLocaleString('en-MY', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {document.uploadedBy || 'You'}
                    </span>
                    <span className="flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      {formatFileSize(document.fileSize)}
                    </span>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={<Download className="h-4 w-4" />}
                  isLoading={download.isPending}
                  onClick={() => download.mutate({ documentId: document.documentId, fileName: document.fileName })}
                >
                  Download
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </Card>

      <Card className="bg-primary-50 border-primary-200">
        <div className="flex items-start gap-3">
          <History className="h-5 w-5 text-primary-700 mt-0.5" />
          <div>
            <h3 className="font-medium text-primary-900 mb-1">No previous versions</h3>
            <p className="text-sm text-primary-700">
              Upload a new file from the document detail page to keep an iteration trail.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
