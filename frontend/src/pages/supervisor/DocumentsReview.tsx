import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  FolderOpen,
  Search,
  ChevronRight,
  GraduationCap,
  FileText,
  MessageSquare,
  Clock,
  Sparkles,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import { useSuperviseeDocuments } from '@/lib/hooks/useSupervisor'
import { ROUTES } from '@/lib/constants/routes'
import { cn } from '@/lib/utils/cn'
type DocStyle = { label: string; color: string; bgColor: string; borderColor: string }

const typeConfig: Record<string, DocStyle> = {
  PROPOSAL: { label: 'Proposal', color: 'text-amber-600', bgColor: 'bg-amber-50', borderColor: 'border-l-amber-500' },
  REPORT: { label: 'Report', color: 'text-sky-600', bgColor: 'bg-sky-50', borderColor: 'border-l-sky-500' },
  PRESENTATION: { label: 'Presentation', color: 'text-violet-600', bgColor: 'bg-violet-50', borderColor: 'border-l-violet-500' },
  MEETING_NOTES: { label: 'Meeting Notes', color: 'text-emerald-600', bgColor: 'bg-emerald-50', borderColor: 'border-l-emerald-500' },
  REFERENCE: { label: 'Reference', color: 'text-rose-600', bgColor: 'bg-rose-50', borderColor: 'border-l-rose-500' },
  FEEDBACK: { label: 'Feedback', color: 'text-orange-600', bgColor: 'bg-orange-50', borderColor: 'border-l-orange-500' },
  CODE: { label: 'Code', color: 'text-slate-600', bgColor: 'bg-slate-100', borderColor: 'border-l-slate-500' },
  DATASET: { label: 'Dataset', color: 'text-teal-600', bgColor: 'bg-teal-50', borderColor: 'border-l-teal-500' },
  OTHER: { label: 'Other', color: 'text-stone-600', bgColor: 'bg-stone-100', borderColor: 'border-l-stone-400' },
}

function styleFor(type: string | undefined): DocStyle {
  return typeConfig[(type || 'OTHER').toUpperCase()] || typeConfig.OTHER
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
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                Documents Review
                <Sparkles className="h-5 w-5 text-amber-400" />
              </h1>
              <p className="text-stone-300 mt-1">
                View and provide feedback on documents uploaded by your supervisees
              </p>
            </div>
          </div>
          {data && data.documents.length > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 backdrop-blur-sm rounded-xl ring-1 ring-amber-500/30">
              <FileText className="h-5 w-5 text-amber-400" />
              <span className="text-sm font-semibold text-amber-200">
                {data.total} document{data.total !== 1 ? 's' : ''} total
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 p-4 bg-gradient-to-r from-stone-100 to-stone-50 rounded-xl">
        {/* Type Filter */}
        <div className="flex items-center gap-1 p-1 bg-white rounded-lg shadow-sm overflow-x-auto">
          {filterOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setTypeFilter(option.value)}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-lg transition-all whitespace-nowrap',
                typeFilter === option.value
                  ? 'bg-stone-800 text-white shadow-sm'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
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
          className="px-4 py-2 border border-stone-200 rounded-lg text-sm font-medium text-stone-700 focus:ring-2 focus:ring-amber-500 bg-white"
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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <Input
            type="text"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 border-stone-200 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* Documents List */}
      <div className="flex flex-col gap-4">
        {filteredDocuments && filteredDocuments.length > 0 ? (
          filteredDocuments.map((doc) => {
            const type = styleFor(doc.type)
            return (
              <Link
                key={doc.documentId}
                to={ROUTES.SUPERVISOR.DOCUMENT_DETAIL.replace(':id', String(doc.documentId))}
              >
                <Card className={cn(
                  'group p-5 hover:shadow-lg transition-all duration-300 cursor-pointer border-l-4',
                  type.borderColor,
                  'hover:scale-[1.01]'
                )}>
                  <div className="flex items-start gap-4">
                    {/* File Icon */}
                    <div className={cn(
                      'w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform',
                      type.bgColor
                    )}>
                      <FileText className={cn('h-7 w-7', type.color)} />
                    </div>

                    {/* Document Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-bold text-stone-800 group-hover:text-amber-700 transition-colors">{doc.title}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <GraduationCap className="h-4 w-4 text-stone-400" />
                            <span className="text-sm text-stone-500">{doc.studentName}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            'px-3 py-1.5 rounded-xl text-xs font-semibold',
                            type.bgColor,
                            type.color
                          )}>
                            {type.label}
                          </span>
                          <ChevronRight className="h-5 w-5 text-stone-300 group-hover:text-amber-500 group-hover:translate-x-1 transition-all" />
                        </div>
                      </div>

                      {/* File Details */}
                      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                        <span className="px-2 py-1 bg-stone-100 rounded-lg text-stone-600">{doc.fileName}</span>
                        <span className="px-2 py-1 bg-stone-100 rounded-lg text-stone-600">{formatFileSize(doc.fileSize)}</span>
                        <span className="px-2 py-1 bg-stone-100 rounded-lg text-stone-600">Version {doc.version}</span>
                        {doc.hasFeedback && (
                          <span className="flex items-center gap-1.5 text-amber-600 px-2 py-1 bg-amber-100 rounded-lg font-medium">
                            <MessageSquare className="h-3.5 w-3.5" />
                            {doc.feedbackCount} feedback
                          </span>
                        )}
                      </div>

                      {/* Description */}
                      {doc.description && (
                        <p className="mt-2 text-sm text-stone-600 line-clamp-1">
                          {doc.description}
                        </p>
                      )}

                      {/* Upload Date */}
                      <div className="mt-2 flex items-center gap-1 text-xs text-stone-400">
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
            <div className="w-16 h-16 mx-auto bg-stone-100 rounded-full flex items-center justify-center mb-4">
              <FolderOpen className="h-8 w-8 text-stone-400" />
            </div>
            <h3 className="text-lg font-semibold text-stone-800">No documents found</h3>
            <p className="text-stone-500 mt-1">
              {searchQuery || typeFilter !== 'all' || studentFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'No documents uploaded yet'}
            </p>
          </Card>
        )}
      </div>

      {/* Summary Stats */}
      {data && data.documents.length > 0 && (
        <Card className="overflow-hidden">
          <div className="p-4 bg-gradient-to-r from-stone-50 to-stone-100/50 border-b border-stone-200">
            <h3 className="font-semibold text-stone-800">Documents Summary</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-5">
            <div className="text-center p-3 rounded-xl bg-stone-50">
              <p className="text-2xl font-bold text-stone-800">{data.total}</p>
              <p className="text-sm text-stone-500 font-medium">Total Documents</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-amber-50">
              <p className="text-2xl font-bold text-amber-600">
                {data.documents.filter((d) => d.type === 'PROPOSAL').length}
              </p>
              <p className="text-sm text-amber-700 font-medium">Proposals</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-sky-50">
              <p className="text-2xl font-bold text-sky-600">
                {data.documents.filter((d) => d.type === 'REPORT').length}
              </p>
              <p className="text-sm text-sky-700 font-medium">Reports</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-emerald-50">
              <p className="text-2xl font-bold text-emerald-600">
                {data.documents.filter((d) => d.hasFeedback).length}
              </p>
              <p className="text-sm text-emerald-700 font-medium">With Feedback</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
