import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  FileText,
  Upload,
  Search,
  Folder,
  File,
  FileImage,
  FileCode,
  Clock,
  ChevronRight,
  Grid,
  List,
} from 'lucide-react'
import { Card, Button, Badge, Spinner, Input } from '@/components/ui'
import { useDocumentList } from '@/lib/hooks/useStudent'
import { ROUTES } from '@/lib/constants/routes'
import { cn } from '@/lib/utils/cn'
import type { FYPDocument, DocumentCategory } from '@/types'

// Sample data
const SAMPLE_DOCUMENTS: FYPDocument[] = [
  {
    documentId: '1',
    studentId: '1',
    title: 'FYP Proposal v2',
    description: 'Final revised proposal document',
    category: 'PROPOSAL',
    fileName: 'FYP_Proposal_v2.pdf',
    fileSize: 2456789,
    fileType: 'application/pdf',
    fileUrl: '/documents/proposal.pdf',
    version: 2,
    uploadedAt: '2025-01-15T14:30:00Z',
    uploadedBy: 'Student',
  },
  {
    documentId: '2',
    studentId: '1',
    title: 'Literature Review Draft',
    description: 'Draft of literature review chapter',
    category: 'REPORT',
    fileName: 'Literature_Review.docx',
    fileSize: 1234567,
    fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    fileUrl: '/documents/lit-review.docx',
    version: 1,
    uploadedAt: '2025-01-20T10:00:00Z',
    uploadedBy: 'Student',
  },
  {
    documentId: '3',
    studentId: '1',
    title: 'System Architecture Diagram',
    description: 'High-level system architecture',
    category: 'DIAGRAM',
    fileName: 'system_architecture.png',
    fileSize: 456789,
    fileType: 'image/png',
    fileUrl: '/documents/architecture.png',
    version: 1,
    uploadedAt: '2025-01-22T09:00:00Z',
    uploadedBy: 'Student',
  },
  {
    documentId: '4',
    studentId: '1',
    title: 'Source Code - Backend API',
    description: 'Backend API source code repository',
    category: 'CODE',
    fileName: 'backend_api.zip',
    fileSize: 5678901,
    fileType: 'application/zip',
    fileUrl: '/documents/backend.zip',
    version: 3,
    uploadedAt: '2025-01-25T16:00:00Z',
    uploadedBy: 'Student',
  },
  {
    documentId: '5',
    studentId: '1',
    title: 'Supervisor Feedback - Proposal',
    description: 'Feedback on proposal from Dr. Sarah Lee',
    category: 'OTHER',
    fileName: 'Supervisor_Feedback.pdf',
    fileSize: 234567,
    fileType: 'application/pdf',
    fileUrl: '/documents/feedback.pdf',
    version: 1,
    uploadedAt: '2025-01-18T11:00:00Z',
    uploadedBy: 'Supervisor',
  },
]

const categoryConfig: Record<DocumentCategory, { label: string; color: string; icon: typeof FileText }> = {
  PROPOSAL: { label: 'Proposal', color: 'bg-primary-100 text-primary-700', icon: FileText },
  REPORT: { label: 'Report', color: 'bg-info-100 text-info-700', icon: FileText },
  DIAGRAM: { label: 'Diagram', color: 'bg-success-100 text-success-700', icon: FileImage },
  CODE: { label: 'Code', color: 'bg-warning-100 text-warning-700', icon: FileCode },
  PRESENTATION: { label: 'Presentation', color: 'bg-error-100 text-error-700', icon: FileText },
  OTHER: { label: 'Other', color: 'bg-neutral-100 text-neutral-700', icon: File },
}

const categoryOptions = ['all', 'PROPOSAL', 'REPORT', 'DIAGRAM', 'CODE', 'PRESENTATION', 'OTHER']

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function DocumentList() {
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [phaseFilter, setPhaseFilter] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')

  const { data, isLoading } = useDocumentList(phaseFilter !== 'all' ? { phase: phaseFilter } : undefined)

  // Use sample data
  const documents = data?.documents || SAMPLE_DOCUMENTS

  const filteredDocuments = documents.filter((doc) => {
    const matchesCategory = categoryFilter === 'all' || doc.category === categoryFilter
    const matchesSearch = searchQuery === '' ||
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.fileName.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  // Group by category for stats
  const categoryStats = Object.entries(categoryConfig).map(([key, config]) => ({
    category: key as DocumentCategory,
    ...config,
    count: documents.filter(d => d.category === key).length,
  }))

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" label="Loading documents..." />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Documents</h1>
          <p className="text-neutral-600 mt-1">Manage your FYP documents and files</p>
        </div>
        <Link to={ROUTES.STUDENT.DOCUMENT_UPLOAD}>
          <Button variant="primary" leftIcon={<Upload className="h-4 w-4" />}>
            Upload Document
          </Button>
        </Link>
      </div>

      {/* Category Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {categoryStats.map(({ category, label, color, count, icon: Icon }) => (
          <button
            key={category}
            onClick={() => setCategoryFilter(categoryFilter === category ? 'all' : category)}
            className={cn(
              'p-3 rounded-lg text-center transition-all',
              categoryFilter === category
                ? 'ring-2 ring-primary-500 bg-white'
                : 'bg-white hover:shadow-md'
            )}
          >
            <div className={cn('w-10 h-10 rounded-lg mx-auto mb-2 flex items-center justify-center', color)}>
              <Icon className="h-5 w-5" />
            </div>
            <p className="text-2xl font-bold text-neutral-900">{count}</p>
            <p className="text-xs text-neutral-500">{label}</p>
          </button>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="h-4 w-4" />}
            />
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-neutral-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  'p-2 rounded transition-colors',
                  viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-neutral-200'
                )}
              >
                <List className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  'p-2 rounded transition-colors',
                  viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-neutral-200'
                )}
              >
                <Grid className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-neutral-200">
          <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Phase</span>
          <div className="flex flex-wrap gap-2">
            {[
              { value: 'all', label: 'All' },
              { value: 'FYP1', label: 'FYP 1' },
              { value: 'FYP2', label: 'FYP 2' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setPhaseFilter(option.value)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                  phaseFilter === option.value
                    ? 'bg-primary-100 text-primary-700 ring-1 ring-primary-300'
                    : 'bg-white text-neutral-600 hover:bg-neutral-100 border border-neutral-200'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Documents */}
      {viewMode === 'list' ? (
        <div className="space-y-2">
          {filteredDocuments.map((doc) => (
            <DocumentRow key={doc.documentId} document={doc} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocuments.map((doc) => (
            <DocumentCard key={doc.documentId} document={doc} />
          ))}
        </div>
      )}

      {filteredDocuments.length === 0 && (
        <Card className="text-center py-12">
          <Folder className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-neutral-900 mb-2">No documents found</h3>
          <p className="text-neutral-500 mb-4">
            {categoryFilter === 'all'
              ? 'Upload your first document to get started'
              : 'No documents match the selected filter'}
          </p>
          <Link to={ROUTES.STUDENT.DOCUMENT_UPLOAD}>
            <Button variant="primary">Upload Document</Button>
          </Link>
        </Card>
      )}
    </div>
  )
}

function DocumentRow({ document }: { document: FYPDocument }) {
  const config = categoryConfig[document.category]
  const Icon = config.icon

  return (
    <Link to={ROUTES.STUDENT.DOCUMENT_DETAIL.replace(':id', document.documentId)}>
      <Card hover className="transition-all">
        <div className="flex items-center gap-4">
          {/* Icon */}
          <div className={cn('w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0', config.color)}>
            <Icon className="h-6 w-6" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-neutral-900 truncate">{document.title}</h3>
              {document.version > 1 && (
                <Badge variant="default" size="sm">v{document.version}</Badge>
              )}
            </div>
            <p className="text-sm text-neutral-500 truncate">{document.fileName}</p>
          </div>

          {/* Meta */}
          <div className="hidden sm:flex items-center gap-4 text-sm text-neutral-500">
            <span>{formatFileSize(document.fileSize)}</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {new Date(document.uploadedAt).toLocaleDateString('en-MY')}
            </span>
          </div>

          <ChevronRight className="h-4 w-4 text-neutral-400" />
        </div>
      </Card>
    </Link>
  )
}

function DocumentCard({ document }: { document: FYPDocument }) {
  const config = categoryConfig[document.category]
  const Icon = config.icon

  return (
    <Link to={ROUTES.STUDENT.DOCUMENT_DETAIL.replace(':id', document.documentId)}>
      <Card hover className="h-full">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className={cn('w-full h-24 rounded-lg flex items-center justify-center mb-4', config.color)}>
            <Icon className="h-12 w-12" />
          </div>

          {/* Content */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-neutral-900 truncate">{document.title}</h3>
              {document.version > 1 && (
                <Badge variant="default" size="sm">v{document.version}</Badge>
              )}
            </div>
            <p className="text-sm text-neutral-500 truncate mb-2">{document.fileName}</p>
            {document.description && (
              <p className="text-xs text-neutral-400 line-clamp-2">{document.description}</p>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-neutral-100 text-xs text-neutral-500">
            <span>{formatFileSize(document.fileSize)}</span>
            <span>{new Date(document.uploadedAt).toLocaleDateString('en-MY')}</span>
          </div>
        </div>
      </Card>
    </Link>
  )
}
