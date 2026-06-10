import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  FolderOpen,
  Search,
  FileText,
  Download,
  Edit,
  Trash2,
  Upload,
  Book,
  FileCheck,
  ClipboardList,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import { useGeneralDocuments, useDeleteGeneralDocument } from '@/lib/hooks/useCommittee'
import { ROUTES } from '@/lib/constants/routes'
import { cn } from '@/lib/utils/cn'
import type { CommitteeDocumentCategory, DocumentVisibility, GeneralDocument } from '@/types'

const categoryConfig: Record<CommitteeDocumentCategory, { label: string; icon: typeof FileText; color: string; bgColor: string }> = {
  TEMPLATE: { label: 'Template', icon: FileText, color: 'text-sky-600', bgColor: 'bg-sky-100' },
  RUBRIC: { label: 'Rubric', icon: FileCheck, color: 'text-amber-600', bgColor: 'bg-amber-100' },
  HANDBOOK: { label: 'Handbook', icon: Book, color: 'text-violet-600', bgColor: 'bg-violet-100' },
  GUIDELINE: { label: 'Guideline', icon: ClipboardList, color: 'text-emerald-600', bgColor: 'bg-emerald-100' },
  FORM: { label: 'Form', icon: FileText, color: 'text-orange-600', bgColor: 'bg-orange-100' },
  OTHER: { label: 'Other', icon: FolderOpen, color: 'text-stone-600', bgColor: 'bg-stone-100' },
}

const visibilityConfig: Record<DocumentVisibility, { label: string; color: string }> = {
  PUBLIC: { label: 'Public', color: 'text-emerald-600' },
  STUDENTS_ONLY: { label: 'Students Only', color: 'text-sky-600' },
  SUPERVISORS_ONLY: { label: 'Supervisors Only', color: 'text-amber-600' },
  COMMITTEE_ONLY: { label: 'Committee Only', color: 'text-rose-600' },
}

const FALLBACK_CATEGORY = categoryConfig.OTHER
const FALLBACK_VISIBILITY = { label: 'Unknown', color: 'text-stone-500' }

export function DocumentsManagement() {
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<CommitteeDocumentCategory | 'ALL'>('ALL')
  const [visibilityFilter, setVisibilityFilter] = useState<DocumentVisibility | 'ALL'>('ALL')

  const { data, isLoading } = useGeneralDocuments({
    category: categoryFilter !== 'ALL' ? categoryFilter : undefined,
    visibility: visibilityFilter !== 'ALL' ? visibilityFilter : undefined,
  })
  const deleteMutation = useDeleteGeneralDocument()

  const documents: GeneralDocument[] = data?.documents ?? []

  const filteredDocuments = documents.filter((doc) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      doc.title.toLowerCase().includes(query) ||
      doc.description?.toLowerCase().includes(query) ||
      doc.fileName.toLowerCase().includes(query)
    )
  })

  const handleDelete = async (documentId: number) => {
    if (!confirm('Are you sure you want to delete this document? This action cannot be undone.')) return
    try {
      await deleteMutation.mutateAsync(documentId)
    } catch (error) {
      console.error('Failed to delete document:', error)
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

  return (
    <div className="space-y-3 lg:space-y-4">
      {/* Compact Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-stone-800 via-stone-800 to-stone-900 p-3 sm:p-4 text-white shadow-md">
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

        <div className="relative flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex-shrink-0 w-9 h-9 bg-amber-500/20 rounded-lg flex items-center justify-center ring-1 ring-amber-500/30">
              <FolderOpen className="h-5 w-5 text-amber-400" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-white leading-tight">General Documents</h1>
              <p className="text-stone-300 text-xs">Manage templates, rubrics, handbooks, and guidelines</p>
            </div>
          </div>
          <Link to={ROUTES.COMMITTEE.DOCUMENT_UPLOAD}>
            <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white whitespace-nowrap">
              <Upload className="h-3.5 w-3.5 mr-1" />
              Upload
            </Button>
          </Link>
        </div>

        {/* Category chips inline */}
        <div className="relative mt-3 grid grid-cols-3 sm:grid-cols-6 gap-1.5">
          {(Object.keys(categoryConfig) as CommitteeDocumentCategory[]).map((category) => {
            const config = categoryConfig[category]
            const count = documents.filter((d) => d.category === category).length ?? 0
            const Icon = config.icon
            const active = categoryFilter === category
            return (
              <button
                key={category}
                onClick={() => setCategoryFilter(active ? 'ALL' : category)}
                className={cn(
                  'flex items-center gap-2 rounded-md px-2 py-1.5 ring-1 transition-colors',
                  active ? 'bg-amber-500/30 ring-amber-300/40' : 'bg-stone-700/40 ring-stone-600/40 hover:bg-stone-700/60'
                )}
              >
                <div className={cn('p-1 rounded flex-shrink-0', config.bgColor)}>
                  <Icon className={cn('h-3.5 w-3.5', config.color)} />
                </div>
                <div className="text-left min-w-0">
                  <p className="text-base font-bold leading-none">{count}</p>
                  <p className="text-[10px] text-stone-300 truncate uppercase tracking-wide">{config.label}</p>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Filters */}
      <Card padding="sm">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 pointer-events-none" />
            <Input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <select
            value={visibilityFilter}
            onChange={(e) => setVisibilityFilter(e.target.value as DocumentVisibility | 'ALL')}
            className="px-2.5 py-1.5 border border-stone-200 rounded-md text-xs focus:ring-2 focus:ring-amber-500 bg-white whitespace-nowrap"
          >
            <option value="ALL">All Visibility</option>
            <option value="PUBLIC">Public</option>
            <option value="STUDENTS_ONLY">Students</option>
            <option value="SUPERVISORS_ONLY">Supervisors</option>
            <option value="COMMITTEE_ONLY">Committee</option>
          </select>
        </div>
      </Card>

      {/* Documents List — 2-col grid */}
      {filteredDocuments && filteredDocuments.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
          {filteredDocuments.map((document) => {
            const category = categoryConfig[document.category] ?? FALLBACK_CATEGORY
            const visibility = visibilityConfig[document.visibility] ?? FALLBACK_VISIBILITY
            const Icon = category.icon

            return (
              <Card key={document.documentId} padding="sm" className="group hover:shadow-md transition-all border-l-4 border-l-stone-300">
                <div className="flex items-start gap-2.5">
                  <div className={cn('w-9 h-9 rounded-md flex items-center justify-center flex-shrink-0', category.bgColor)}>
                    <Icon className={cn('h-4 w-4', category.color)} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-sm text-stone-800 group-hover:text-amber-700 leading-tight truncate">{document.title}</h3>
                        {document.description && (
                          <p className="text-[11px] text-neutral-500 line-clamp-1">{document.description}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-1 mt-0.5">
                          <span className={cn('px-1.5 py-0 rounded-md text-[10px] font-semibold', category.bgColor, category.color)}>
                            {category.label}
                          </span>
                          <span className={cn('text-[10px] font-medium', visibility.color)}>
                            {visibility.label}
                          </span>
                          {!document.isActive && <span className="text-[10px] text-error-600">Inactive</span>}
                        </div>
                      </div>

                      <div className="flex items-center gap-0.5 flex-shrink-0">
                        <Link to={ROUTES.COMMITTEE.DOCUMENT_DETAIL.replace(':id', String(document.documentId))}>
                          <button className="p-1 rounded hover:bg-stone-100 transition-colors" title="Edit">
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                        </Link>
                        <button className="p-1 rounded hover:bg-stone-100 transition-colors" title="Download">
                          <Download className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(document.documentId)}
                          disabled={deleteMutation.isPending}
                          className="p-1 rounded hover:bg-rose-100 hover:text-rose-700 transition-colors disabled:opacity-50"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-error-500" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-1 flex items-center gap-1.5 text-[10px] text-neutral-500 flex-wrap">
                      <span className="truncate max-w-[120px]">{document.fileName}</span>
                      <span>· {formatFileSize(document.fileSize)}</span>
                      <span className="inline-flex items-center gap-0.5">
                        <Download className="h-3 w-3" />
                        {document.downloadCount}
                      </span>
                      <span>· {new Date(document.updatedAt).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: '2-digit' })}</span>
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card className="text-center py-8">
          <FolderOpen className="h-10 w-10 text-stone-300 mx-auto mb-2" />
          <h3 className="font-medium text-stone-800 mb-1">No documents found</h3>
          <p className="text-sm text-neutral-500 mb-3">
            {searchQuery || categoryFilter !== 'ALL' || visibilityFilter !== 'ALL'
              ? 'Try adjusting your filters'
              : 'Upload your first document to get started'}
          </p>
          <Link to={ROUTES.COMMITTEE.DOCUMENT_UPLOAD}>
            <Button size="sm">
              <Upload className="h-3.5 w-3.5 mr-1" />
              Upload Document
            </Button>
          </Link>
        </Card>
      )}
    </div>
  )
}
