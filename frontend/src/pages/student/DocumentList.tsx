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
    <div className="space-y-3 lg:space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 leading-tight">Documents</h1>
          <p className="text-xs text-neutral-600">Manage your FYP documents and files</p>
        </div>
        <Link to={ROUTES.STUDENT.DOCUMENT_UPLOAD}>
          <Button variant="primary" size="sm" leftIcon={<Upload className="h-4 w-4" />} className="whitespace-nowrap">
            Upload Document
          </Button>
        </Link>
      </div>

      {/* Type Stat Pills — horizontal compact strip */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
        {typeStats.map(({ type, label, color, count, icon: Icon }) => {
          const active = typeFilter === type
          return (
            <button
              key={type}
              onClick={() => setTypeFilter(active ? 'all' : type)}
              className={cn(
                'flex items-center gap-2 px-2 py-1.5 rounded-md transition-all bg-white text-left',
                active ? 'ring-2 ring-primary-500' : 'border border-neutral-200 hover:shadow-sm'
              )}
            >
              <div className={cn('w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0', color)}>
                <Icon className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-neutral-900 leading-none">{count}</p>
                <p className="text-[10px] text-neutral-500 truncate uppercase tracking-wide">{label}</p>
              </div>
            </button>
          )
        })}
      </div>

      {/* Filters — compact single row */}
      <Card padding="sm">
        <div className="flex flex-col lg:flex-row gap-2">
          <div className="flex-1">
            <Input
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="h-4 w-4" />}
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">Phase</span>
            <div className="flex gap-1">
              {([
                { value: 'all', label: 'All' },
                { value: 'FYP1', label: 'FYP1' },
                { value: 'FYP2', label: 'FYP2' },
                { value: 'FINAL', label: 'Final' },
              ] as const).map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setPhaseFilter(option.value as 'all' | DocumentPhase)}
                  className={cn(
                    'px-2 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap',
                    phaseFilter === option.value
                      ? 'bg-primary-100 text-primary-700 ring-1 ring-primary-300'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <div className="flex bg-neutral-100 rounded-md p-0.5 ml-1">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                aria-label="List view"
                className={cn(
                  'p-1.5 rounded transition-colors',
                  viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-neutral-200'
                )}
              >
                <List className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                aria-label="Grid view"
                className={cn(
                  'p-1.5 rounded transition-colors',
                  viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-neutral-200'
                )}
              >
                <Grid className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </Card>

      {filteredDocuments.length === 0 ? (
        <Card className="text-center py-8">
          <Folder className="h-10 w-10 text-neutral-300 mx-auto mb-2" />
          <h3 className="font-medium text-neutral-900 mb-1">
            {documents.length === 0 ? 'No documents yet' : 'No documents match your filters'}
          </h3>
          <p className="text-sm text-neutral-500 mb-3">
            {documents.length === 0
              ? 'Upload your first document to get started'
              : 'Try clearing the search or selecting a different category'}
          </p>
          {documents.length === 0 && (
            <Link to={ROUTES.STUDENT.DOCUMENT_UPLOAD}>
              <Button variant="primary" size="sm">Upload Document</Button>
            </Link>
          )}
        </Card>
      ) : viewMode === 'list' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
          {filteredDocuments.map((doc) => (
            <DocumentRow key={doc.documentId} document={doc} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
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
    <Link
      to={ROUTES.STUDENT.DOCUMENT_DETAIL.replace(':id', document.documentId)}
      className="block"
    >
      <Card hover padding="sm" className="transition-all">
        <div className="flex items-center gap-2.5">
          <div className={cn('w-9 h-9 rounded-md flex items-center justify-center flex-shrink-0', config.color)}>
            <Icon className="h-4 w-4" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="font-semibold text-sm text-neutral-900 truncate">{document.title}</h3>
              {document.version > 1 && (
                <Badge variant="default" size="sm">v{document.version}</Badge>
              )}
              {document.phase && (
                <Badge variant="default" size="sm">{document.phase}</Badge>
              )}
            </div>
            <div className="flex items-center gap-2 text-[11px] text-neutral-500 mt-0.5">
              <span className="truncate flex-1">{document.fileName}</span>
              <span className="flex-shrink-0">{formatFileSize(document.fileSize)}</span>
              <span className="hidden sm:inline-flex items-center gap-0.5 flex-shrink-0">
                <Clock className="h-3 w-3" />
                {new Date(document.uploadedAt).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: '2-digit' })}
              </span>
            </div>
          </div>

          <ChevronRight className="h-4 w-4 text-neutral-300 flex-shrink-0" />
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
    <Link
      to={ROUTES.STUDENT.DOCUMENT_DETAIL.replace(':id', document.documentId)}
      className="block h-full"
    >
      <Card hover padding="sm" className="h-full">
        <div className="flex flex-col h-full">
          <div className={cn('w-full h-14 rounded-md flex items-center justify-center mb-2', config.color)}>
            <Icon className="h-7 w-7" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <h3 className="font-semibold text-sm text-neutral-900 truncate flex-1">{document.title}</h3>
              {document.version > 1 && (
                <Badge variant="default" size="sm">v{document.version}</Badge>
              )}
            </div>
            <p className="text-xs text-neutral-500 truncate mb-1">{document.fileName}</p>
            {document.description && (
              <p className="text-[11px] text-neutral-400 line-clamp-2 leading-snug">{document.description}</p>
            )}
          </div>

          <div className="flex items-center justify-between mt-2 pt-2 border-t border-neutral-100 text-[10px] text-neutral-500">
            <span>{formatFileSize(document.fileSize)}</span>
            <span>{new Date(document.uploadedAt).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: '2-digit' })}</span>
          </div>
        </div>
      </Card>
    </Link>
  )
}
