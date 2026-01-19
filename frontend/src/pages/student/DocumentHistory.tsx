import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Download,
  Clock,
  FileText,
  User,
  History,
  GitCompare,
  CheckCircle,
} from 'lucide-react'
import { Card, Button, Badge, Spinner } from '@/components/ui'
import { useDocumentDetail } from '@/lib/hooks/useStudent'
import { ROUTES } from '@/lib/constants/routes'
import { cn } from '@/lib/utils/cn'

// Sample version history data
const SAMPLE_VERSIONS = [
  {
    version: 4,
    uploadedAt: '2025-01-25T14:30:00Z',
    uploadedBy: 'Student',
    fileSize: 2789012,
    fileName: 'FYP_Proposal_v4.pdf',
    note: 'Final version after committee approval',
    changes: ['Updated abstract', 'Added acknowledgements', 'Fixed formatting issues'],
    isCurrent: true,
  },
  {
    version: 3,
    uploadedAt: '2025-01-20T10:00:00Z',
    uploadedBy: 'Student',
    fileSize: 2678901,
    fileName: 'FYP_Proposal_v3.pdf',
    note: 'Addressed supervisor feedback on methodology',
    changes: ['Revised methodology section', 'Added new references', 'Improved timeline'],
  },
  {
    version: 2,
    uploadedAt: '2025-01-15T14:30:00Z',
    uploadedBy: 'Student',
    fileSize: 2456789,
    fileName: 'FYP_Proposal_v2.pdf',
    note: 'Revised proposal with updated literature review',
    changes: ['Expanded literature review', 'Clarified problem statement', 'Added scope limitations'],
  },
  {
    version: 1,
    uploadedAt: '2025-01-10T09:00:00Z',
    uploadedBy: 'Student',
    fileSize: 2234567,
    fileName: 'FYP_Proposal_v1.pdf',
    note: 'Initial submission',
    changes: ['Initial proposal document'],
  },
]

const SAMPLE_DOCUMENT = {
  documentId: '1',
  title: 'FYP Proposal',
  category: 'PROPOSAL' as const,
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getTimeDiff(date1: string, date2: string): string {
  const diff = new Date(date1).getTime() - new Date(date2).getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return 'Same day'
  if (days === 1) return '1 day later'
  return `${days} days later`
}

export function DocumentHistory() {
  const { id } = useParams<{ id: string }>()

  const { data: document, isLoading } = useDocumentDetail(id || '')

  // Use sample data
  const displayDoc = document || SAMPLE_DOCUMENT
  const versions = SAMPLE_VERSIONS

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" label="Loading history..." />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back Button */}
      <Link
        to={ROUTES.STUDENT.DOCUMENT_DETAIL.replace(':id', id!)}
        className="inline-flex items-center gap-2 text-neutral-600 hover:text-primary-600 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Document
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Version History</h1>
        <p className="text-neutral-600 mt-1">
          {displayDoc.title} • {versions.length} versions
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="text-center">
          <History className="h-6 w-6 text-primary-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-neutral-900">{versions.length}</div>
          <p className="text-sm text-neutral-500">Total Versions</p>
        </Card>
        <Card className="text-center">
          <Clock className="h-6 w-6 text-success-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-neutral-900">
            {Math.floor((new Date(versions[0].uploadedAt).getTime() - new Date(versions[versions.length - 1].uploadedAt).getTime()) / (1000 * 60 * 60 * 24))}
          </div>
          <p className="text-sm text-neutral-500">Days Since v1</p>
        </Card>
        <Card className="text-center">
          <FileText className="h-6 w-6 text-warning-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-neutral-900">
            {formatFileSize(versions[0].fileSize)}
          </div>
          <p className="text-sm text-neutral-500">Current Size</p>
        </Card>
      </div>

      {/* Version Timeline */}
      <Card>
        <h2 className="text-lg font-semibold text-neutral-900 mb-6">All Versions</h2>

        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-neutral-200" />

          <div className="space-y-6">
            {versions.map((version, index) => (
              <div key={version.version} className="relative pl-16">
                {/* Version Badge */}
                <div
                  className={cn(
                    'absolute left-0 w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold',
                    version.isCurrent
                      ? 'bg-primary-600 text-white'
                      : 'bg-white border-2 border-neutral-300 text-neutral-600'
                  )}
                >
                  v{version.version}
                </div>

                {/* Version Card */}
                <Card className={cn(
                  version.isCurrent && 'border-primary-300 bg-primary-50'
                )}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-neutral-900">
                          Version {version.version}
                        </h3>
                        {version.isCurrent && (
                          <Badge variant="primary" size="sm">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Current
                          </Badge>
                        )}
                      </div>

                      <p className="text-sm text-neutral-600 mb-3">{version.note}</p>

                      {/* Changes */}
                      {version.changes && version.changes.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs font-medium text-neutral-500 mb-2">Changes:</p>
                          <ul className="text-sm text-neutral-600 space-y-1">
                            {version.changes.map((change, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-primary-500 mt-1">•</span>
                                {change}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Meta */}
                      <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-500">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(version.uploadedAt).toLocaleDateString('en-MY', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {version.uploadedBy}
                        </span>
                        <span className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          {formatFileSize(version.fileSize)}
                        </span>
                        {index < versions.length - 1 && (
                          <span className="text-neutral-400">
                            {getTimeDiff(version.uploadedAt, versions[index + 1].uploadedAt)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        leftIcon={<Download className="h-4 w-4" />}
                      >
                        Download
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Compare Versions */}
      <Card className="bg-neutral-50">
        <div className="flex items-center gap-4">
          <GitCompare className="h-8 w-8 text-neutral-400" />
          <div className="flex-1">
            <h3 className="font-medium text-neutral-900">Compare Versions</h3>
            <p className="text-sm text-neutral-600">
              Download multiple versions to compare changes
            </p>
          </div>
          <Button variant="secondary" leftIcon={<Download className="h-4 w-4" />}>
            Download All
          </Button>
        </div>
      </Card>

      {/* Tips */}
      <Card className="bg-primary-50 border-primary-200">
        <h3 className="font-medium text-primary-900 mb-2">Version Tips</h3>
        <ul className="text-sm text-primary-700 space-y-1">
          <li>• Each new upload creates a new version automatically</li>
          <li>• All versions are stored and can be downloaded anytime</li>
          <li>• Add descriptive notes when uploading to track changes</li>
          <li>• Current version is always the latest uploaded</li>
        </ul>
      </Card>
    </div>
  )
}
