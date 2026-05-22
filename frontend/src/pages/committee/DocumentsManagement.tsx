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
  History,
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
import type { CommitteeDocumentCategory, DocumentVisibility } from '@/types'

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

export function DocumentsManagement() {
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<CommitteeDocumentCategory | 'ALL'>('ALL')
  const [visibilityFilter, setVisibilityFilter] = useState<DocumentVisibility | 'ALL'>('ALL')

  const { data, isLoading } = useGeneralDocuments({
    category: categoryFilter !== 'ALL' ? categoryFilter : undefined,
    visibility: visibilityFilter !== 'ALL' ? visibilityFilter : undefined,
  })
  const deleteMutation = useDeleteGeneralDocument()

  const filteredDocuments = data?.documents.filter((doc) => {
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
      {/* Header - Gradient Style */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-stone-800 via-stone-800 to-stone-900 p-6 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-stone-600/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-14 h-14 bg-amber-500/20 rounded-xl flex items-center justify-center ring-1 ring-amber-500/30">
              <FolderOpen className="h-7 w-7 text-amber-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">General Documents</h1>
              <p className="text-stone-300 mt-1">
                Manage templates, rubrics, handbooks, and guidelines
              </p>
            </div>
          </div>
          <Link to={ROUTES.COMMITTEE.DOCUMENT_UPLOAD}>
            <Button className="bg-amber-500 hover:bg-amber-600 text-white">
              <Upload className="h-4 w-4 mr-2" />
              Upload Document
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4 bg-gradient-to-r from-stone-100 to-stone-50">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <Input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as CommitteeDocumentCategory | 'ALL')}
              className="px-3 py-2 border border-stone-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 bg-white"
            >
              <option value="ALL">All Categories</option>
              <option value="TEMPLATE">Templates</option>
              <option value="RUBRIC">Rubrics</option>
              <option value="HANDBOOK">Handbooks</option>
              <option value="GUIDELINE">Guidelines</option>
              <option value="FORM">Forms</option>
              <option value="OTHER">Other</option>
            </select>
            <select
              value={visibilityFilter}
              onChange={(e) => setVisibilityFilter(e.target.value as DocumentVisibility | 'ALL')}
              className="px-3 py-2 border border-stone-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 bg-white"
            >
              <option value="ALL">All Visibility</option>
              <option value="PUBLIC">Public</option>
              <option value="STUDENTS_ONLY">Students Only</option>
              <option value="SUPERVISORS_ONLY">Supervisors Only</option>
              <option value="COMMITTEE_ONLY">Committee Only</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Category Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {(Object.keys(categoryConfig) as CommitteeDocumentCategory[]).map((category) => {
          const config = categoryConfig[category]
          const count = data?.documents.filter((d) => d.category === category).length ?? 0
          const Icon = config.icon
          return (
            <button
              key={category}
              onClick={() => setCategoryFilter(categoryFilter === category ? 'ALL' : category)}
              className={cn(
                'p-3 rounded-xl border transition-all duration-300 text-center',
                categoryFilter === category
                  ? 'border-amber-500 bg-amber-50 shadow-sm'
                  : 'border-stone-200 hover:bg-stone-50 hover:border-stone-300'
              )}
            >
              <Icon className={cn('h-5 w-5 mx-auto mb-1', config.color)} />
              <p className="text-lg font-bold text-stone-800">{count}</p>
              <p className="text-xs text-stone-500 font-medium">{config.label}</p>
            </button>
          )
        })}
      </div>

      {/* Documents List */}
      <div className="flex flex-col gap-4">
        {filteredDocuments && filteredDocuments.length > 0 ? (
          filteredDocuments.map((document) => {
            const category = categoryConfig[document.category]
            const visibility = visibilityConfig[document.visibility]
            const Icon = category.icon

            return (
              <Card key={document.documentId} className="group p-4 hover:shadow-lg transition-all duration-300 border-l-4 border-l-stone-300">
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={cn('p-3 rounded-xl shadow-sm', category.bgColor)}>
                    <Icon className={cn('h-6 w-6', category.color)} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-stone-800 group-hover:text-amber-700 transition-colors">{document.title}</h3>
                        {document.description && (
                          <p className="text-sm text-neutral-500 mt-0.5 line-clamp-1">
                            {document.description}
                          </p>
                        )}
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <span className={cn(
                            'px-2 py-0.5 rounded-full text-xs font-medium',
                            category.bgColor,
                            category.color
                          )}>
                            {category.label}
                          </span>
                          <span className={cn('text-xs font-medium', visibility.color)}>
                            {visibility.label}
                          </span>
                          <span className="text-xs text-neutral-500">
                            v{document.version}
                          </span>
                          {!document.isActive && (
                            <span className="text-xs text-error-600">Inactive</span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1">
                        <Link to={ROUTES.COMMITTEE.DOCUMENT_VERSIONS.replace(':id', String(document.documentId))}>
                          <Button variant="ghost" size="sm" title="Version History">
                            <History className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link to={ROUTES.COMMITTEE.DOCUMENT_DETAIL.replace(':id', String(document.documentId))}>
                          <Button variant="ghost" size="sm" title="Edit">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button variant="ghost" size="sm" title="Download">
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Delete"
                          onClick={() => handleDelete(document.documentId)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-error-500" />
                        </Button>
                      </div>
                    </div>

                    {/* File Info */}
                    <div className="flex items-center gap-4 mt-3 text-xs text-neutral-500">
                      <span>{document.fileName}</span>
                      <span>{formatFileSize(document.fileSize)}</span>
                      <span className="flex items-center gap-1">
                        <Download className="h-3 w-3" />
                        {document.downloadCount} downloads
                      </span>
                      <span>
                        Updated {new Date(document.updatedAt).toLocaleDateString('en-MY', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            )
          })
        ) : (
          <Card className="p-12 text-center">
            <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FolderOpen className="h-8 w-8 text-stone-400" />
            </div>
            <h3 className="text-lg font-semibold text-stone-800">No documents found</h3>
            <p className="text-neutral-500 mt-1">
              {searchQuery || categoryFilter !== 'ALL' || visibilityFilter !== 'ALL'
                ? 'Try adjusting your filters'
                : 'Upload your first document to get started'}
            </p>
            <Link to={ROUTES.COMMITTEE.DOCUMENT_UPLOAD}>
              <Button className="mt-4">
                <Upload className="h-4 w-4 mr-2" />
                Upload Document
              </Button>
            </Link>
          </Card>
        )}
      </div>

      {/* Summary */}
      {data && data.documents.length > 0 && (
        <Card className="p-4 bg-gradient-to-r from-stone-100 to-stone-50">
          <div className="flex items-center justify-between text-sm">
            <span className="text-stone-600 font-medium">
              Showing {filteredDocuments?.length ?? 0} of {data.total} documents
            </span>
            <span className="text-stone-500">
              Total downloads: <span className="font-semibold text-amber-600">{data.documents.reduce((sum, d) => sum + d.downloadCount, 0)}</span>
            </span>
          </div>
        </Card>
      )}
    </div>
  )
}
