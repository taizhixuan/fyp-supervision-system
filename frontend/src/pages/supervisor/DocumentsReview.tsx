import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  FolderOpen,
  Search,
  Filter,
  ChevronRight,
  GraduationCap,
  FileText,
  MessageSquare,
  Download,
  Clock,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import { useSuperviseeDocuments } from '@/lib/hooks/useSupervisor'
import { ROUTES } from '@/lib/constants/routes'
import { cn } from '@/lib/utils/cn'
import type { DocumentType } from '@/types'

const typeConfig: Record<DocumentType, { label: string; color: string; bgColor: string }> = {
  PROPOSAL: { label: 'Proposal', color: 'text-primary-600', bgColor: 'bg-primary-50' },
  REPORT: { label: 'Report', color: 'text-info-600', bgColor: 'bg-info-50' },
  PRESENTATION: { label: 'Presentation', color: 'text-accent-600', bgColor: 'bg-accent-50' },
  MEETING_NOTES: { label: 'Meeting Notes', color: 'text-success-600', bgColor: 'bg-success-50' },
  REFERENCE: { label: 'Reference', color: 'text-warning-600', bgColor: 'bg-warning-50' },
  FEEDBACK: { label: 'Feedback', color: 'text-orange-600', bgColor: 'bg-orange-50' },
  OTHER: { label: 'Other', color: 'text-neutral-600', bgColor: 'bg-neutral-100' },
}

const filterOptions = [
  { value: 'all', label: 'All Types' },
  { value: 'PROPOSAL', label: 'Proposals' },
  { value: 'REPORT', label: 'Reports' },
  { value: 'PRESENTATION', label: 'Presentations' },
]

export function DocumentsReview() {
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [studentFilter, setStudentFilter] = useState('all')

  const { data, isLoading } = useSuperviseeDocuments(
    typeFilter !== 'all' ? { type: typeFilter } : undefined
  )

  const filteredDocuments = data?.documents
    .filter((doc) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return (
          doc.studentName.toLowerCase().includes(query) ||
          doc.title.toLowerCase().includes(query) ||
          doc.fileName.toLowerCase().includes(query)
        )
      }
      return true
    })
    .filter((doc) => {
      if (studentFilter === 'all') return true
      return doc.studentId === studentFilter
    })
    .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())

  // Get unique students for filter
  const students = [...new Set(data?.documents.map((d) => ({ id: d.studentId, name: d.studentName })))]
    .filter((s, i, arr) => arr.findIndex(x => x.id === s.id) === i)

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
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
          <FolderOpen className="h-7 w-7 text-primary-600" />
          Documents Review
        </h1>
        <p className="text-neutral-600 mt-1">
          View and provide feedback on documents uploaded by your supervisees
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Type Filter */}
        <div className="flex items-center gap-1 p-1 bg-neutral-100 rounded-lg overflow-x-auto">
          {filterOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setTypeFilter(option.value)}
              className={cn(
                'px-3 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap',
                typeFilter === option.value
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-600 hover:text-neutral-900'
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Student Filter */}
        <select
          value={studentFilter}
          onChange={(e) => setStudentFilter(e.target.value)}
          className="px-3 py-2 border border-neutral-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500"
        >
          <option value="all">All Students</option>
          {students.map((student) => (
            <option key={student.id} value={student.id}>
              {student.name}
            </option>
          ))}
        </select>

        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <Input
            type="text"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Documents List */}
      <div className="space-y-4">
        {filteredDocuments && filteredDocuments.length > 0 ? (
          filteredDocuments.map((doc) => {
            const type = typeConfig[doc.type]
            return (
              <Link
                key={doc.documentId}
                to={ROUTES.SUPERVISOR.DOCUMENT_DETAIL.replace(':id', String(doc.documentId))}
              >
                <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-start gap-4">
                    {/* File Icon */}
                    <div className={cn('p-3 rounded-lg', type.bgColor)}>
                      <FileText className={cn('h-6 w-6', type.color)} />
                    </div>

                    {/* Document Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-semibold text-neutral-900">{doc.title}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <GraduationCap className="h-4 w-4 text-neutral-400" />
                            <span className="text-sm text-neutral-500">{doc.studentName}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            'px-2.5 py-1 rounded-full text-xs font-medium',
                            type.bgColor,
                            type.color
                          )}>
                            {type.label}
                          </span>
                          <ChevronRight className="h-5 w-5 text-neutral-400" />
                        </div>
                      </div>

                      {/* File Details */}
                      <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-neutral-500">
                        <span>{doc.fileName}</span>
                        <span>{formatFileSize(doc.fileSize)}</span>
                        <span>Version {doc.version}</span>
                        {doc.hasFeedback && (
                          <span className="flex items-center gap-1 text-primary-600">
                            <MessageSquare className="h-3.5 w-3.5" />
                            {doc.feedbackCount} feedback
                          </span>
                        )}
                      </div>

                      {/* Description */}
                      {doc.description && (
                        <p className="mt-2 text-sm text-neutral-600 line-clamp-1">
                          {doc.description}
                        </p>
                      )}

                      {/* Upload Date */}
                      <div className="mt-2 flex items-center gap-1 text-xs text-neutral-400">
                        <Clock className="h-3.5 w-3.5" />
                        Uploaded {new Date(doc.uploadedAt).toLocaleDateString('en-MY', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            )
          })
        ) : (
          <Card className="p-12 text-center">
            <FolderOpen className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-neutral-900">No documents found</h3>
            <p className="text-neutral-500 mt-1">
              {searchQuery || typeFilter !== 'all' || studentFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'No documents uploaded yet'}
            </p>
          </Card>
        )}
      </div>

      {/* Summary Stats */}
      {data && data.documents.length > 0 && (
        <Card className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-neutral-900">{data.total}</p>
              <p className="text-sm text-neutral-500">Total Documents</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-primary-600">
                {data.documents.filter((d) => d.type === 'PROPOSAL').length}
              </p>
              <p className="text-sm text-neutral-500">Proposals</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-info-600">
                {data.documents.filter((d) => d.type === 'REPORT').length}
              </p>
              <p className="text-sm text-neutral-500">Reports</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-success-600">
                {data.documents.filter((d) => d.hasFeedback).length}
              </p>
              <p className="text-sm text-neutral-500">With Feedback</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
