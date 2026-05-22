import { useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Download,
  Trash2,
  Edit,
  Clock,
  FileText,
  FileImage,
  FileCode,
  Database,
  Presentation,
  File,
  User,
  AlertCircle,
} from 'lucide-react'
import { Card, Button, Badge, Spinner } from '@/components/ui'
import { Modal, ModalHeader, ModalTitle, ModalBody, ModalFooter } from '@/components/ui/Modal'
import {
  useDocumentDetail,
  useDeleteDocument,
  useDownloadDocument,
} from '@/lib/hooks/useStudent'
import { ROUTES } from '@/lib/constants/routes'
import { getApiErrorMessage } from '@/lib/api/client'
import { cn } from '@/lib/utils/cn'
import type { DocumentType } from '@/types'

type Icon = typeof FileText

const typeConfig: Record<DocumentType, { label: string; color: string; icon: Icon }> = {
  PROPOSAL: { label: 'Proposal', color: 'bg-primary-100 text-primary-700', icon: FileText },
  REPORT: { label: 'Report', color: 'bg-info-100 text-info-700', icon: FileText },
  PRESENTATION: { label: 'Presentation', color: 'bg-error-100 text-error-700', icon: Presentation },
  CODE: { label: 'Code', color: 'bg-warning-100 text-warning-700', icon: FileCode },
  DATASET: { label: 'Dataset', color: 'bg-success-100 text-success-700', icon: Database },
  OTHER: { label: 'Other', color: 'bg-neutral-100 text-neutral-700', icon: File },
}

function pickIcon(type: DocumentType, mimeType?: string): Icon {
  if (type === 'OTHER' && mimeType?.startsWith('image/')) return FileImage
  return typeConfig[type].icon
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function fileExtension(fileName?: string, mimeType?: string): string {
  if (fileName) {
    const idx = fileName.lastIndexOf('.')
    if (idx !== -1 && idx < fileName.length - 1) {
      return fileName.slice(idx + 1).toUpperCase()
    }
  }
  if (mimeType) {
    const part = mimeType.split('/').pop()
    if (part) return part.toUpperCase()
  }
  return 'FILE'
}

export function DocumentDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const { data: document, isLoading, isError, error } = useDocumentDetail(id || '')
  const deleteDocument = useDeleteDocument()
  const downloadDocument = useDownloadDocument()

  const handleDelete = async () => {
    setActionError(null)
    try {
      await deleteDocument.mutateAsync(id!)
      navigate(ROUTES.STUDENT.DOCUMENTS)
    } catch (err) {
      setActionError(getApiErrorMessage(err))
    }
  }

  const handleDownload = async () => {
    if (!document) return
    setActionError(null)
    try {
      await downloadDocument.mutateAsync({
        documentId: document.documentId,
        fileName: document.fileName,
      })
    } catch (err) {
      setActionError(getApiErrorMessage(err))
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" label="Loading document..." />
      </div>
    )
  }

  if (isError || !document) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-4">
        <AlertCircle className="h-12 w-12 text-error-500 mx-auto" />
        <h2 className="text-xl font-semibold text-neutral-900">Document not found</h2>
        <p className="text-neutral-500">{isError ? getApiErrorMessage(error) : "The document you're looking for doesn't exist."}</p>
        <Link to={ROUTES.STUDENT.DOCUMENTS}>
          <Button variant="primary">Back to Documents</Button>
        </Link>
      </div>
    )
  }

  const typeKey: DocumentType = typeConfig[document.type] ? document.type : 'OTHER'
  const config = typeConfig[typeKey]
  const Icon = pickIcon(typeKey, document.mimeType)

  return (
    <div className="max-w-3xl mx-auto space-y-3 lg:space-y-4">
      <Link
        to={ROUTES.STUDENT.DOCUMENTS}
        className="inline-flex items-center gap-2 text-neutral-600 hover:text-primary-600 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Documents
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className={cn('w-14 h-14 rounded-lg flex items-center justify-center flex-shrink-0', config.color)}>
            <Icon className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">{document.title}</h1>
            <p className="text-neutral-600 mt-1 break-all">{document.fileName}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge className={config.color}>{config.label}</Badge>
          {document.phase && <Badge variant="default">{document.phase}</Badge>}
          {document.version > 1 && <Badge variant="default">v{document.version}</Badge>}
        </div>
      </div>

      {actionError && (
        <div className="rounded-lg border border-error-200 bg-error-50 p-4 text-sm text-error-700">
          {actionError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3 lg:space-y-4">
          <Card>
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">Document Details</h2>

            <div className={cn(
              'w-full h-48 rounded-lg flex flex-col items-center justify-center mb-6',
              config.color
            )}>
              <Icon className="h-16 w-16 mb-2" />
              <p className="font-medium break-all px-4 text-center">{document.fileName}</p>
              <p className="text-sm opacity-75">{formatFileSize(document.fileSize)}</p>
            </div>

            {document.description && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-neutral-500 mb-2">Description</h3>
                <p className="text-neutral-700 whitespace-pre-wrap">{document.description}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-neutral-500 mb-1">File Type</h3>
                <p className="text-neutral-900">{fileExtension(document.fileName, document.mimeType)}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-neutral-500 mb-1">File Size</h3>
                <p className="text-neutral-900">{formatFileSize(document.fileSize)}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-neutral-500 mb-1">Uploaded</h3>
                <p className="text-neutral-900">
                  {new Date(document.uploadedAt).toLocaleDateString('en-MY', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-neutral-500 mb-1">Uploaded By</h3>
                <p className="text-neutral-900">{document.uploadedBy || 'You'}</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-3 lg:space-y-4">
          <Card>
            <h3 className="text-sm font-medium text-neutral-500 mb-3">Actions</h3>
            <div className="space-y-2">
              <Button
                variant="primary"
                className="w-full"
                leftIcon={<Download className="h-4 w-4" />}
                onClick={handleDownload}
                isLoading={downloadDocument.isPending}
              >
                Download
              </Button>
              <Link
                to={`${ROUTES.STUDENT.DOCUMENT_UPLOAD}?replace=${document.documentId}`}
                className="block"
              >
                <Button variant="secondary" className="w-full" leftIcon={<Edit className="h-4 w-4" />}>
                  Upload New Version
                </Button>
              </Link>
              <Button
                variant="ghost"
                className="w-full text-error-600 hover:bg-error-50"
                leftIcon={<Trash2 className="h-4 w-4" />}
                onClick={() => setShowDeleteModal(true)}
              >
                Delete Document
              </Button>
            </div>
          </Card>

          <Card>
            <h3 className="text-sm font-medium text-neutral-500 mb-3">Quick Info</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-neutral-400" />
                <span className="text-neutral-600">
                  {new Date(document.uploadedAt).toLocaleString('en-MY')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-neutral-400" />
                <span className="text-neutral-600">
                  By {document.uploadedBy || 'You'}
                </span>
              </div>
            </div>
          </Card>

          <Card className="bg-neutral-50">
            <h3 className="text-sm font-medium text-neutral-500 mb-3">Related Links</h3>
            <div className="space-y-2 text-sm">
              <Link
                to={ROUTES.STUDENT.PROPOSAL}
                className="flex items-center gap-2 text-primary-600 hover:underline"
              >
                <FileText className="h-4 w-4" />
                View Proposal
              </Link>
              <Link
                to={ROUTES.STUDENT.DOCUMENTS}
                className="flex items-center gap-2 text-primary-600 hover:underline"
              >
                <File className="h-4 w-4" />
                All Documents
              </Link>
            </div>
          </Card>
        </div>
      </div>

      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        size="sm"
      >
        <ModalHeader>
          <ModalTitle>Delete Document</ModalTitle>
        </ModalHeader>
        <ModalBody>
          <p className="text-sm text-neutral-600">
            Are you sure you want to delete <strong>{document.title}</strong>? This action cannot be undone.
          </p>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button
            variant="error"
            onClick={handleDelete}
            isLoading={deleteDocument.isPending}
          >
            Delete Document
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}
