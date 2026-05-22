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
    <div className="space-y-3 lg:space-y-4">
      {/* Compact Header — stats inline */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-stone-800 via-stone-800 to-stone-900 p-3 sm:p-4 text-white shadow-md">
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

        <div className="relative flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex-shrink-0 w-9 h-9 bg-amber-500/20 rounded-lg flex items-center justify-center ring-1 ring-amber-500/30">
              <FolderOpen className="h-5 w-5 text-amber-400" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-white leading-tight flex items-center gap-1.5">
                Documents Review
                <Sparkles className="h-4 w-4 text-amber-400" />
              </h1>
              <p className="text-stone-300 text-xs">View and provide feedback on supervisee documents</p>
            </div>
          </div>
        </div>

        {data && data.documents.length > 0 && (
          <div className="relative mt-3 grid grid-cols-4 gap-1.5 text-center">
            <div className="bg-stone-700/40 rounded-md px-2 py-1.5 ring-1 ring-stone-600/40">
              <div className="text-base font-bold leading-none">{data.total}</div>
              <p className="text-[10px] text-stone-300 mt-0.5 uppercase tracking-wide">Total</p>
            </div>
            <div className="bg-stone-700/40 rounded-md px-2 py-1.5 ring-1 ring-stone-600/40">
              <div className="text-base font-bold leading-none text-amber-300">
                {data.documents.filter((d) => d.type === 'PROPOSAL').length}
              </div>
              <p className="text-[10px] text-stone-300 mt-0.5 uppercase tracking-wide">Proposals</p>
            </div>
            <div className="bg-stone-700/40 rounded-md px-2 py-1.5 ring-1 ring-stone-600/40">
              <div className="text-base font-bold leading-none text-sky-300">
                {data.documents.filter((d) => d.type === 'REPORT').length}
              </div>
              <p className="text-[10px] text-stone-300 mt-0.5 uppercase tracking-wide">Reports</p>
            </div>
            <div className="bg-stone-700/40 rounded-md px-2 py-1.5 ring-1 ring-stone-600/40">
              <div className="text-base font-bold leading-none text-emerald-300">
                {data.documents.filter((d) => d.hasFeedback).length}
              </div>
              <p className="text-[10px] text-stone-300 mt-0.5 uppercase tracking-wide">Feedback</p>
            </div>
          </div>
        )}
      </div>

      {/* Filters — compact */}
      <Card padding="sm">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex items-center gap-0.5 p-0.5 bg-stone-100 rounded-md overflow-x-auto">
            {filterOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setTypeFilter(option.value)}
                className={cn(
                  'px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap',
                  typeFilter === option.value
                    ? 'bg-stone-800 text-white shadow-sm'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-white'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>

          <select
            value={studentFilter}
            onChange={(e) => setStudentFilter(e.target.value)}
            className="px-2.5 py-1.5 border border-stone-200 rounded-md text-xs font-medium text-stone-700 focus:ring-2 focus:ring-amber-500 bg-white whitespace-nowrap"
          >
            <option value="all">All Students</option>
            {students.map((student) => (
              <option key={student.id} value={student.id}>{student.name}</option>
            ))}
          </select>

          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 pointer-events-none" />
            <Input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 border-stone-200 focus:ring-amber-500"
            />
          </div>
        </div>
      </Card>

      {/* Documents List — 2-col grid */}
      {filteredDocuments && filteredDocuments.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
          {filteredDocuments.map((doc) => {
            const type = styleFor(doc.type)
            return (
              <Link
                key={doc.documentId}
                to={ROUTES.SUPERVISOR.DOCUMENT_DETAIL.replace(':id', String(doc.documentId))}
              >
                <Card padding="sm" className={cn(
                  'group hover:shadow-md transition-all cursor-pointer border-l-4',
                  type.borderColor,
                )}>
                  <div className="flex items-start gap-2.5">
                    <div className={cn('w-10 h-10 rounded-md flex items-center justify-center flex-shrink-0 shadow-sm', type.bgColor)}>
                      <FileText className={cn('h-5 w-5', type.color)} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-sm text-stone-800 group-hover:text-amber-700 leading-tight truncate">{doc.title}</h3>
                          <div className="flex items-center gap-1 text-[11px] text-stone-500 truncate">
                            <GraduationCap className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{doc.studentName}</span>
                          </div>
                        </div>
                        <span className={cn(
                          'px-1.5 py-0.5 rounded-md text-[10px] font-semibold flex-shrink-0',
                          type.bgColor,
                          type.color
                        )}>
                          {type.label}
                        </span>
                      </div>

                      <div className="mt-1.5 flex flex-wrap items-center gap-1 text-[10px] text-stone-500">
                        <span className="px-1 py-0 bg-stone-100 rounded truncate max-w-[120px]">{doc.fileName}</span>
                        <span className="px-1 py-0 bg-stone-100 rounded">{formatFileSize(doc.fileSize)}</span>
                        <span className="px-1 py-0 bg-stone-100 rounded">v{doc.version}</span>
                        {doc.hasFeedback && (
                          <span className="inline-flex items-center gap-0.5 px-1 py-0 bg-amber-100 text-amber-700 rounded font-medium">
                            <MessageSquare className="h-3 w-3" />
                            {doc.feedbackCount}
                          </span>
                        )}
                      </div>

                      {doc.description && (
                        <p className="mt-1 text-[11px] text-stone-600 line-clamp-1 leading-snug">
                          {doc.description}
                        </p>
                      )}

                      <div className="mt-1 inline-flex items-center gap-0.5 text-[10px] text-stone-400">
                        <Clock className="h-3 w-3" />
                        {new Date(doc.uploadedAt).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: '2-digit' })}
                      </div>
                    </div>

                    <ChevronRight className="h-4 w-4 text-stone-300 group-hover:text-amber-500 transition-colors flex-shrink-0 mt-0.5" />
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>
      ) : (
        <Card className="text-center py-8">
          <FolderOpen className="h-10 w-10 text-stone-300 mx-auto mb-2" />
          <h3 className="font-medium text-stone-800 mb-1">No documents found</h3>
          <p className="text-sm text-stone-500">
            {searchQuery || typeFilter !== 'all' || studentFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'No documents uploaded yet'}
          </p>
        </Card>
      )}
    </div>
  )
}
