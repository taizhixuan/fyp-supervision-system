import { useMemo, useState } from 'react'
import {
  Megaphone,
  Search,
  X,
  Calendar,
  AlertTriangle,
  Info,
  ChevronRight,
} from 'lucide-react'
import {
  Card,
  Spinner,
  Modal,
  ModalHeader,
  ModalTitle,
  ModalBody,
  ModalFooter,
  Button,
} from '@/components/ui'
import { useStudentAnnouncements, type StudentAnnouncement } from '@/lib/hooks/useStudent'
import { cn } from '@/lib/utils/cn'

const priorityStyles: Record<
  string,
  { label: string; pillClass: string; barClass: string; iconClass: string; Icon: typeof Info }
> = {
  LOW: {
    label: 'Low',
    pillClass: 'bg-neutral-100 text-neutral-600',
    barClass: 'bg-neutral-300',
    iconClass: 'text-neutral-500 bg-neutral-100',
    Icon: Info,
  },
  NORMAL: {
    label: 'Normal',
    pillClass: 'bg-info-100 text-info-700',
    barClass: 'bg-info-400',
    iconClass: 'text-info-600 bg-info-100',
    Icon: Megaphone,
  },
  HIGH: {
    label: 'High',
    pillClass: 'bg-warning-100 text-warning-700',
    barClass: 'bg-warning-500',
    iconClass: 'text-warning-700 bg-warning-100',
    Icon: AlertTriangle,
  },
  URGENT: {
    label: 'Urgent',
    pillClass: 'bg-error-100 text-error-700',
    barClass: 'bg-error-500',
    iconClass: 'text-error-700 bg-error-100',
    Icon: AlertTriangle,
  },
}

function formatDate(value: string | undefined) {
  if (!value) return ''
  const d = new Date(value)
  if (isNaN(d.getTime())) return value
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function formatDateTime(value: string | undefined) {
  if (!value) return ''
  const d = new Date(value)
  if (isNaN(d.getTime())) return value
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function preview(text: string, max = 200): string {
  if (!text) return ''
  const trimmed = text.replace(/\s+/g, ' ').trim()
  return trimmed.length > max ? trimmed.slice(0, max) + '…' : trimmed
}

export function AnnouncementsList() {
  const [search, setSearch] = useState('')
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'>(
    'ALL'
  )
  const [selected, setSelected] = useState<StudentAnnouncement | null>(null)
  const { data, isLoading } = useStudentAnnouncements()

  const all = useMemo(() => data?.announcements ?? [], [data])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return all.filter((a) => {
      if (priorityFilter !== 'ALL' && a.priority !== priorityFilter) return false
      if (!q) return true
      return (
        a.title.toLowerCase().includes(q) ||
        a.content.toLowerCase().includes(q) ||
        (a.scope ?? '').toLowerCase().includes(q)
      )
    })
  }, [all, search, priorityFilter])

  const counts = useMemo(() => {
    const total = all.length
    const urgent = all.filter((a) => a.priority === 'URGENT' || a.priority === 'HIGH').length
    return { total, urgent }
  }, [all])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" label="Loading announcements..." />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center flex-shrink-0">
            <Megaphone className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Announcements</h1>
            <p className="text-neutral-600 mt-0.5">
              Updates from FYP committee and your supervisors
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="px-4 py-2 rounded-lg border border-neutral-200 bg-white">
            <p className="text-xs text-neutral-500 font-medium">Total</p>
            <p className="text-lg font-bold text-neutral-900">{counts.total}</p>
          </div>
          <div className="px-4 py-2 rounded-lg border border-warning-200 bg-warning-50">
            <p className="text-xs text-warning-700 font-medium">Important</p>
            <p className="text-lg font-bold text-warning-700">{counts.urgent}</p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <Card>
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, content, or scope…"
              className="w-full pl-9 pr-9 py-2 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="flex bg-neutral-100 rounded-lg p-1 self-start">
            {(['ALL', 'URGENT', 'HIGH', 'NORMAL', 'LOW'] as const).map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setPriorityFilter(opt)}
                className={cn(
                  'px-3 py-1.5 rounded text-xs font-medium transition-colors',
                  priorityFilter === opt
                    ? 'bg-white shadow-sm text-neutral-900'
                    : 'text-neutral-600 hover:bg-neutral-200'
                )}
              >
                {opt === 'ALL' ? 'All' : priorityStyles[opt]?.label ?? opt}
              </button>
            ))}
          </div>
        </div>
        {(search || priorityFilter !== 'ALL') && (
          <p className="text-xs text-neutral-500 mt-3">
            Showing {filtered.length} of {all.length} announcement{all.length === 1 ? '' : 's'}
          </p>
        )}
      </Card>

      {/* List */}
      {filtered.length === 0 ? (
        <Card className="text-center py-16">
          <Megaphone className="h-12 w-12 text-neutral-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-neutral-900 mb-1">
            {search || priorityFilter !== 'ALL'
              ? 'No announcements match your filters'
              : 'No announcements yet'}
          </h3>
          <p className="text-neutral-500 text-sm">
            {search || priorityFilter !== 'ALL'
              ? 'Try clearing the search or selecting a different priority.'
              : 'Check back later — new announcements from your committee and supervisors will appear here.'}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((a) => {
            const cfg = priorityStyles[a.priority] ?? priorityStyles.NORMAL
            const Icon = cfg.Icon
            return (
              <button
                key={a.announcementId}
                type="button"
                onClick={() => setSelected(a)}
                className="group w-full text-left bg-white rounded-xl border border-neutral-200 hover:border-primary-300 hover:shadow-md transition-all overflow-hidden"
              >
                <div className="flex">
                  <div className={cn('w-1.5 flex-shrink-0', cfg.barClass)} aria-hidden />
                  <div className="flex-1 p-4 sm:p-5">
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                          cfg.iconClass
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h3 className="font-semibold text-neutral-900 group-hover:text-primary-700 transition-colors">
                            {a.title}
                          </h3>
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded-full text-xs font-medium',
                              cfg.pillClass
                            )}
                          >
                            {cfg.label}
                          </span>
                        </div>
                        <p className="text-sm text-neutral-600 line-clamp-2 mb-2">
                          {preview(a.content)}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-neutral-400">
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {formatDate(a.publishAt || a.createdAt)}
                          </span>
                          {a.scope && a.scope !== 'ALL' && (
                            <span className="px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600">
                              {a.scope}
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-neutral-300 group-hover:text-primary-500 transition-colors flex-shrink-0 mt-1" />
                    </div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* Detail Modal */}
      <Modal isOpen={!!selected} onClose={() => setSelected(null)} size="lg">
        {selected && (
          <>
            <ModalHeader>
              <div className="flex items-start gap-3 flex-1">
                {(() => {
                  const cfg = priorityStyles[selected.priority] ?? priorityStyles.NORMAL
                  const Icon = cfg.Icon
                  return (
                    <div
                      className={cn(
                        'w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0',
                        cfg.iconClass
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                  )
                })()}
                <div className="flex-1 min-w-0">
                  <ModalTitle>{selected.title}</ModalTitle>
                  <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded-full font-medium',
                        (priorityStyles[selected.priority] ?? priorityStyles.NORMAL).pillClass
                      )}
                    >
                      {(priorityStyles[selected.priority] ?? priorityStyles.NORMAL).label}{' '}
                      priority
                    </span>
                    {selected.scope && selected.scope !== 'ALL' && (
                      <span className="px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600">
                        Scope: {selected.scope}
                      </span>
                    )}
                    <span className="text-neutral-500 inline-flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDateTime(selected.publishAt || selected.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            </ModalHeader>
            <ModalBody>
              <p className="text-neutral-700 whitespace-pre-line leading-relaxed">
                {selected.content}
              </p>
            </ModalBody>
            <ModalFooter>
              <Button variant="secondary" onClick={() => setSelected(null)}>
                Close
              </Button>
            </ModalFooter>
          </>
        )}
      </Modal>
    </div>
  )
}
