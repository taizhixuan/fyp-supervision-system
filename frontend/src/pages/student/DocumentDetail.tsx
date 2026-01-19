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
  File,
  User,
  History,
  ExternalLink,
  Share2,
} from 'lucide-react'
import { Card, Button, Badge, Spinner, Modal } from '@/components/ui'
import { useDocumentDetail, useDeleteDocument } from '@/lib/hooks/useStudent'
import { ROUTES } from '@/lib/constants/routes'
import { cn } from '@/lib/utils/cn'
import type { DocumentCategory } from '@/types'

// Sample data
const SAMPLE_DOCUMENT = {
  documentId: '1',
  studentId: '1',
  title: 'FYP Proposal v2',
  description: 'Final revised proposal document with updated methodology section and improved literature review. This version addresses all the feedback from the first review.',
  category: 'PROPOSAL' as DocumentCategory,
  fileName: 'FYP_Proposal_v2.pdf',
  fileSize: 2456789,
  fileType: 'application/pdf',
  fileUrl: '/documents/proposal.pdf',
  version: 2,
  uploadedAt: '2025-01-15T14:30:00Z',
  uploadedBy: 'Student',
  versions: [
    { version: 2, uploadedAt: '2025-01-15T14:30:00Z', fileSize: 2456789, note: 'Revised methodology section' },
    { version: 1, uploadedAt: '2025-01-10T09:00:00Z', fileSize: 2234567, note: 'Initial submission' },
  ],
}

const categoryConfig: Record<DocumentCategory, { label: string; color: string; icon: typeof FileText }> = {
  PROPOSAL: { label: 'Proposal', color: 'bg-primary-100 text-primary-700', icon: FileText },
  REPORT: { label: 'Report', color: 'bg-info-100 text-info-700', icon: FileText },
  DIAGRAM: { label: 'Diagram', color: 'bg-success-100 text-success-700', icon: FileImage },
  CODE: { label: 'Code', color: 'bg-warning-100 text-warning-700', icon: FileCode },
  PRESENTATION: { label: 'Presentation', color: 'bg-error-100 text-error-700', icon: FileText },
  OTHER: { label: 'Other', color: 'bg-neutral-100 text-neutral-700', icon: File },
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function DocumentDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const { data: document, isLoading } = useDocumentDetail(id || '')
  const deleteDocument = useDeleteDocument()

  // Use sample data
  const displayDoc = document || SAMPLE_DOCUMENT
  const config = categoryConfig[displayDoc.category]
  const Icon = config.icon

  const handleDelete = async () => {
    try {
      await deleteDocument.mutateAsync(id!)
      navigate(ROUTES.STUDENT.DOCUMENTS)
    } catch (err) {
      // Error handled by mutation
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" label="Loading document..." />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back Button */}
      <Link
        to={ROUTES.STUDENT.DOCUMENTS}
        className="inline-flex items-center gap-2 text-neutral-600 hover:text-primary-600 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Documents
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className={cn('w-14 h-14 rounded-lg flex items-center justify-center flex-shrink-0', config.color)}>
            <Icon className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">{displayDoc.title}</h1>
            <p className="text-neutral-600 mt-1">{displayDoc.fileName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={config.color}>{config.label}</Badge>
          <Badge variant="default">v{displayDoc.version}</Badge>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Document Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Preview / Details */}
          <Card>
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">Document Details</h2>

            {/* Preview Area */}
            <div className={cn(
              'w-full h-48 rounded-lg flex flex-col items-center justify-center mb-6',
              config.color
            )}>
              <Icon className="h-16 w-16 mb-2" />
              <p className="font-medium">{displayDoc.fileName}</p>
              <p className="text-sm opacity-75">{formatFileSize(displayDoc.fileSize)}</p>
            </div>

            {/* Description */}
            {displayDoc.description && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-neutral-500 mb-2">Description</h3>
                <p className="text-neutral-700">{displayDoc.description}</p>
              </div>
            )}

            {/* Meta Information */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-neutral-500 mb-1">File Type</h3>
                <p className="text-neutral-900">{displayDoc.fileType.split('/').pop()?.toUpperCase()}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-neutral-500 mb-1">File Size</h3>
                <p className="text-neutral-900">{formatFileSize(displayDoc.fileSize)}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-neutral-500 mb-1">Uploaded</h3>
                <p className="text-neutral-900">
                  {new Date(displayDoc.uploadedAt).toLocaleDateString('en-MY', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-neutral-500 mb-1">Uploaded By</h3>
                <p className="text-neutral-900">{displayDoc.uploadedBy}</p>
              </div>
            </div>
          </Card>

          {/* Version History */}
          {displayDoc.versions && displayDoc.versions.length > 0 && (
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-neutral-900">Version History</h2>
                <Link to={ROUTES.STUDENT.DOCUMENT_HISTORY.replace(':id', displayDoc.documentId)}>
                  <Button variant="ghost" size="sm" rightIcon={<ExternalLink className="h-3 w-3" />}>
                    View All
                  </Button>
                </Link>
              </div>

              <div className="space-y-3">
                {displayDoc.versions.slice(0, 3).map((version, index) => (
                  <div
                    key={version.version}
                    className={cn(
                      'flex items-center justify-between p-3 rounded-lg',
                      index === 0 ? 'bg-primary-50 border border-primary-200' : 'bg-neutral-50'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
                        index === 0 ? 'bg-primary-600 text-white' : 'bg-neutral-200 text-neutral-600'
                      )}>
                        {version.version}
                      </div>
                      <div>
                        <p className="font-medium text-neutral-900">
                          Version {version.version}
                          {index === 0 && <span className="text-primary-600 ml-2">(Current)</span>}
                        </p>
                        <p className="text-xs text-neutral-500">
                          {new Date(version.uploadedAt).toLocaleDateString('en-MY')} • {formatFileSize(version.fileSize)}
                        </p>
                        {version.note && (
                          <p className="text-xs text-neutral-600 mt-1">{version.note}</p>
                        )}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" leftIcon={<Download className="h-3 w-3" />}>
                      Download
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Actions */}
          <Card>
            <h3 className="text-sm font-medium text-neutral-500 mb-3">Actions</h3>
            <div className="space-y-2">
              <a
                href={displayDoc.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                download
              >
                <Button variant="primary" className="w-full" leftIcon={<Download className="h-4 w-4" />}>
                  Download
                </Button>
              </a>
              <Link to={ROUTES.STUDENT.DOCUMENT_UPLOAD + `?replace=${displayDoc.documentId}`}>
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

          {/* Quick Info */}
          <Card>
            <h3 className="text-sm font-medium text-neutral-500 mb-3">Quick Info</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-neutral-400" />
                <span className="text-neutral-600">
                  {new Date(displayDoc.uploadedAt).toLocaleString('en-MY')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-neutral-400" />
                <span className="text-neutral-600">
                  {displayDoc.versions?.length || 1} version{(displayDoc.versions?.length || 1) > 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-neutral-400" />
                <span className="text-neutral-600">
                  By {displayDoc.uploadedBy}
                </span>
              </div>
            </div>
          </Card>

          {/* Related */}
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

      {/* Delete Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Document"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-neutral-600">
            Are you sure you want to delete <strong>{displayDoc.title}</strong>? This action cannot be undone and all versions will be removed.
          </p>
          <div className="flex gap-3 justify-end">
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
          </div>
        </div>
      </Modal>
    </div>
  )
}
