import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  FileText,
  Upload,
  Search,
  Folder,
  File,
  FileImage,
  FileCode,
  Database,
  Presentation,
  Clock,
  ChevronRight,
  Grid,
  List,
  AlertCircle,
} from 'lucide-react'
import { Card, Button, Badge, Spinner, Input } from '@/components/ui'
import { useDocumentList } from '@/lib/hooks/useStudent'
import { ROUTES } from '@/lib/constants/routes'
import { getApiErrorMessage } from '@/lib/api/client'
import { cn } from '@/lib/utils/cn'
import type { FYPDocument, DocumentType, DocumentPhase } from '@/types'

type Icon = typeof FileText

const typeConfig: Record<DocumentType, { label: string; color: string; icon: Icon }> = {
  PROPOSAL: { label: 'Proposal', color: 'bg-primary-100 text-primary-700', icon: FileText },
  REPORT: { label: 'Report', color: 'bg-info-100 text-info-700', icon: FileText },
  PRESENTATION: { label: 'Presentation', color: 'bg-error-100 text-error-700', icon: Presentation },
  CODE: { label: 'Code', color: 'bg-warning-100 text-warning-700', icon: FileCode },
  DATASET: { label: 'Dataset', color: 'bg-success-100 text-success-700', icon: Database },
  OTHER: { label: 'Other', color: 'bg-neutral-100 text-neutral-700', icon: File },
}

const TYPE_ORDER: DocumentType[] = ['PROPOSAL', 'REPORT', 'PRESENTATION', 'CODE', 'DATASET', 'OTHER']

function resolveType(doc: FYPDocument): DocumentType {
  return typeConfig[doc.type] ? doc.type : 'OTHER'
}

function pickIcon(mimeType?: string): Icon {
  if (!mimeType) return File
  if (mimeType.startsWith('image/')) return FileImage
  return File
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function DocumentList() {
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | DocumentType>('all')
  const [phaseFilter, setPhaseFilter] = useState<'all' | DocumentPhase>('all')
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')

  const { data, isLoading, isError, error, refetch } = useDocumentList(
    phaseFilter !== 'all' ? { phase: phaseFilter } : undefined
  )

  const documents = useMemo(() => data?.documents ?? [], [data])

  const filteredDocuments = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return documents.filter((doc) => {
      const matchesType = typeFilter === 'all' || resolveType(doc) === typeFilter
      const matchesSearch =
        q === '' ||
        doc.title.toLowerCase().includes(q) ||
        (doc.fileName?.toLowerCase().includes(q) ?? false)
      return matchesType && matchesSearch
    })
  }, [documents, searchQuery, typeFilter])

  const typeStats = useMemo(() =>
    TYPE_ORDER.map((type) => ({
      type,
      ...typeConfig[type],
      count: documents.filter((d) => resolveType(d) === type).length,
    })),
  [documents])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" label="Loading documents..." />
      </div>
    )
  }

  if (isError) {
    return (
      <Card className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-error-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-neutral-900 mb-2">Couldn't load documents</h3>
        <p className="text-neutral-500 mb-4">{getApiErrorMessage(error)}</p>
        <Button variant="secondary" onClick={() => refetch()}>Try again</Button>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
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

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {typeStats.map(({ type, label, color, count, icon: Icon }) => {
          const active = typeFilter === type
          return (
            <button
              key={type}
              onClick={() => setTypeFilter(active ? 'all' : type)}
              className={cn(
                'p-3 rounded-lg text-center transition-all',
                active ? 'ring-2 ring-primary-500 bg-white' : 'bg-white hover:shadow-md'
              )}
            >
              <div className={cn('w-10 h-10 rounded-lg mx-auto mb-2 flex items-center justify-center', color)}>
                <Icon className="h-5 w-5" />
              </div>
              <p className="text-2xl font-bold text-neutral-900">{count}</p>
              <p className="text-xs text-neutral-500">{label}</p>
            </button>
          )
        })}
      </div>

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
                type="button"
                onClick={() => setViewMode('list')}
                aria-label="List view"
                className={cn(
                  'p-2 rounded transition-colors',
                  viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-neutral-200'
                )}
              >
                <List className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                aria-label="Grid view"
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
            {([
              { value: 'all', label: 'All' },
              { value: 'FYP1', label: 'FYP 1' },
              { value: 'FYP2', label: 'FYP 2' },
              { value: 'FINAL', label: 'Final' },
            ] as const).map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setPhaseFilter(option.value as 'all' | DocumentPhase)}
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

      {filteredDocuments.length === 0 ? (
        <Card className="text-center py-12">
          <Folder className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-neutral-900 mb-2">
            {documents.length === 0 ? 'No documents yet' : 'No documents match your filters'}
          </h3>
          <p className="text-neutral-500 mb-4">
            {documents.length === 0
              ? 'Upload your first document to get started'
              : 'Try clearing the search or selecting a different category'}
          </p>
          {documents.length === 0 && (
            <Link to={ROUTES.STUDENT.DOCUMENT_UPLOAD}>
              <Button variant="primary">Upload Document</Button>
            </Link>
          )}
        </Card>
      ) : viewMode === 'list' ? (
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
    </div>
  )
}

function DocumentRow({ document }: { document: FYPDocument }) {
  const type = resolveType(document)
  const config = typeConfig[type]
  const Icon = type === 'OTHER' ? pickIcon(document.mimeType) : config.icon

  return (
    <Link to={ROUTES.STUDENT.DOCUMENT_DETAIL.replace(':id', document.documentId)}>
      <Card hover className="transition-all">
        <div className="flex items-center gap-4">
          <div className={cn('w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0', config.color)}>
            <Icon className="h-6 w-6" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-neutral-900 truncate">{document.title}</h3>
              {document.version > 1 && (
                <Badge variant="default" size="sm">v{document.version}</Badge>
              )}
              {document.phase && (
                <Badge variant="default" size="sm">{document.phase}</Badge>
              )}
            </div>
            <p className="text-sm text-neutral-500 truncate">{document.fileName}</p>
          </div>

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
  const type = resolveType(document)
  const config = typeConfig[type]
  const Icon = type === 'OTHER' ? pickIcon(document.mimeType) : config.icon

  return (
    <Link to={ROUTES.STUDENT.DOCUMENT_DETAIL.replace(':id', document.documentId)}>
      <Card hover className="h-full">
        <div className="flex flex-col h-full">
          <div className={cn('w-full h-24 rounded-lg flex items-center justify-center mb-4', config.color)}>
            <Icon className="h-12 w-12" />
          </div>

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

          <div className="flex items-center justify-between mt-4 pt-4 border-t border-neutral-100 text-xs text-neutral-500">
            <span>{formatFileSize(document.fileSize)}</span>
            <span>{new Date(document.uploadedAt).toLocaleDateString('en-MY')}</span>
          </div>
        </div>
      </Card>
    </Link>
  )
}
