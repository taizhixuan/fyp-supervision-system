import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft,
  History,
  FileText,
  Download,
  Clock,
  User,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { useGeneralDocument } from '@/lib/hooks/useCommittee'
import { ROUTES } from '@/lib/constants/routes'
import { cn } from '@/lib/utils/cn'

export function DocumentVersions() {
  const { id } = useParams<{ id: string }>()
  const { data: document, isLoading } = useGeneralDocument(Number(id))

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

  if (!document) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-neutral-900">Document not found</h2>
        <p className="text-neutral-600 mt-2">The document you're looking for doesn't exist.</p>
        <Link to={ROUTES.COMMITTEE.DOCUMENTS}>
          <Button className="mt-4">Back to Documents</Button>
        </Link>
      </div>
    )
  }

  // Combine current version with history
  const allVersions = [
    {
      versionId: 0,
      version: document.version,
      fileName: document.fileName,
      fileSize: document.fileSize,
      fileUrl: document.fileUrl,
      uploadedBy: document.uploadedBy,
      uploadedAt: document.updatedAt,
      changeNotes: 'Current version',
      isCurrent: true,
    },
    ...(document.versions || []).map(v => ({ ...v, isCurrent: false })),
  ].sort((a, b) => b.version - a.version)

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
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
          <History className="h-7 w-7 text-primary-600" />
          Version History
        </h1>
        <p className="text-neutral-600 mt-1">{document.title}</p>
      </div>

      {/* Current Document Info */}
      <Card className="p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-primary-50 rounded-lg">
            <FileText className="h-6 w-6 text-primary-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-neutral-900">{document.title}</h3>
            {document.description && (
              <p className="text-sm text-neutral-500 mt-1">{document.description}</p>
            )}
            <div className="flex items-center gap-4 mt-2 text-sm text-neutral-500">
              <span>{document.versions?.length ? document.versions.length + 1 : 1} versions</span>
              <span>Current: v{document.version}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Version Timeline */}
      <Card className="p-6">
        <h3 className="font-semibold text-neutral-900 mb-6">All Versions</h3>

        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-neutral-200" />

          <div className="space-y-6">
            {allVersions.map((version, index) => (
              <div key={version.versionId || version.version} className="relative flex gap-4">
                {/* Timeline dot */}
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center z-10 flex-shrink-0',
                  version.isCurrent ? 'bg-primary-500' : 'bg-neutral-300'
                )}>
                  <span className="text-xs font-bold text-white">v{version.version}</span>
                </div>

                {/* Content */}
                <div className={cn(
                  'flex-1 p-4 rounded-lg border',
                  version.isCurrent ? 'border-primary-200 bg-primary-50' : 'border-neutral-200 bg-white'
                )}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-neutral-900">Version {version.version}</span>
                        {version.isCurrent && (
                          <span className="px-2 py-0.5 bg-primary-100 text-primary-700 text-xs font-medium rounded-full">
                            Current
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-neutral-500 mt-1">{version.fileName}</p>
                      {version.changeNotes && !version.isCurrent && (
                        <p className="text-sm text-neutral-600 mt-2 italic">"{version.changeNotes}"</p>
                      )}
                    </div>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  </div>

                  <div className="flex items-center gap-4 mt-3 text-xs text-neutral-500">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {new Date(version.uploadedAt).toLocaleDateString('en-MY', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="h-3.5 w-3.5" />
                      {version.uploadedBy}
                    </span>
                    <span>{formatFileSize(version.fileSize)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Link to={ROUTES.COMMITTEE.DOCUMENT_DETAIL.replace(':id', String(document.documentId))}>
          <Button variant="outline">
            Edit Document
          </Button>
        </Link>
        <Button>
          <Download className="h-4 w-4 mr-2" />
          Download Current Version
        </Button>
      </div>
    </div>
  )
}
