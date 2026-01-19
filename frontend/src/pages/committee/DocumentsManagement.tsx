import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  FolderOpen,
  Plus,
  Search,
  FileText,
  Download,
  Edit,
  Trash2,
  Eye,
  Upload,
  History,
  Filter,
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
import type { DocumentCategory, DocumentVisibility } from '@/types'

const categoryConfig: Record<DocumentCategory, { label: string; icon: typeof FileText; color: string; bgColor: string }> = {
  TEMPLATE: { label: 'Template', icon: FileText, color: 'text-primary-600', bgColor: 'bg-primary-50' },
  RUBRIC: { label: 'Rubric', icon: FileCheck, color: 'text-warning-600', bgColor: 'bg-warning-50' },
  HANDBOOK: { label: 'Handbook', icon: Book, color: 'text-info-600', bgColor: 'bg-info-50' },
  GUIDELINE: { label: 'Guideline', icon: ClipboardList, color: 'text-success-600', bgColor: 'bg-success-50' },
  FORM: { label: 'Form', icon: FileText, color: 'text-accent-600', bgColor: 'bg-accent-50' },
  OTHER: { label: 'Other', icon: FolderOpen, color: 'text-neutral-600', bgColor: 'bg-neutral-100' },
}

const visibilityConfig: Record<DocumentVisibility, { label: string; color: string }> = {
  PUBLIC: { label: 'Public', color: 'text-success-600' },
  STUDENTS_ONLY: { label: 'Students Only', color: 'text-info-600' },
  SUPERVISORS_ONLY: { label: 'Supervisors Only', color: 'text-warning-600' },
  COMMITTEE_ONLY: { label: 'Committee Only', color: 'text-error-600' },
}

export function DocumentsManagement() {
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<DocumentCategory | 'ALL'>('ALL')
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
            <FolderOpen className="h-7 w-7 text-primary-600" />
            General Documents
          </h1>
          <p className="text-neutral-600 mt-1">
            Manage templates, rubrics, handbooks, and guidelines
          </p>
        </div>
        <Link to={ROUTES.COMMITTEE.DOCUMENT_UPLOAD}>
          <Button>
            <Upload className="h-4 w-4 mr-2" />
            Upload Document
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card className="p-4">
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
              onChange={(e) => setCategoryFilter(e.target.value as DocumentCategory | 'ALL')}
              className="px-3 py-2 border border-neutral-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500"
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
              className="px-3 py-2 border border-neutral-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500"
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
        {(Object.keys(categoryConfig) as DocumentCategory[]).map((category) => {
          const config = categoryConfig[category]
          const count = data?.documents.filter((d) => d.category === category).length ?? 0
          const Icon = config.icon
          return (
            <button
              key={category}
              onClick={() => setCategoryFilter(categoryFilter === category ? 'ALL' : category)}
              className={cn(
                'p-3 rounded-lg border transition-colors text-center',
                categoryFilter === category
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-neutral-200 hover:bg-neutral-50'
              )}
            >
              <Icon className={cn('h-5 w-5 mx-auto mb-1', config.color)} />
              <p className="text-lg font-bold text-neutral-900">{count}</p>
              <p className="text-xs text-neutral-500">{config.label}</p>
            </button>
          )
        })}
      </div>

      {/* Documents List */}
      <div className="space-y-4">
        {filteredDocuments && filteredDocuments.length > 0 ? (
          filteredDocuments.map((document) => {
            const category = categoryConfig[document.category]
            const visibility = visibilityConfig[document.visibility]
            const Icon = category.icon

            return (
              <Card key={document.documentId} className="p-4">
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={cn('p-3 rounded-lg', category.bgColor)}>
                    <Icon className={cn('h-6 w-6', category.color)} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-neutral-900">{document.title}</h3>
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
            <FolderOpen className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-neutral-900">No documents found</h3>
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
        <Card className="p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-neutral-600">
              Showing {filteredDocuments?.length ?? 0} of {data.total} documents
            </span>
            <span className="text-neutral-500">
              Total downloads: {data.documents.reduce((sum, d) => sum + d.downloadCount, 0)}
            </span>
          </div>
        </Card>
      )}
    </div>
  )
}
