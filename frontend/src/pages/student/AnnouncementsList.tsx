import { useEffect, useMemo, useState } from 'react'
import {
  Megaphone,
  Search,
  X,
  Calendar,
  ChevronRight,
  Paperclip,
  Link2,
  Download,
  ExternalLink,
  CheckCheck,
} from 'lucide-react'
import { apiClient } from '@/lib/api/client'
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
import {
  useStudentAnnouncements,
  useMarkAnnouncementRead,
  useMarkAllAnnouncementsRead,
  type StudentAnnouncement,
} from '@/lib/hooks/useStudent'
import { getPriorityDisplay, getScopeLabel } from '@/lib/utils/announcementDisplay'
import { formatDate, formatDateTime, formatRelativeDate } from '@/lib/utils/formatDate'
import { cn } from '@/lib/utils/cn'

type PriorityFilter = 'ALL' | 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'

function preview(text: string, max = 200): string {
  if (!text) return ''
  const trimmed = text.replace(/\s+/g, ' ').trim()
  return trimmed.length > max ? trimmed.slice(0, max) + '…' : trimmed
}

export function AnnouncementsList() {
  const [search, setSearch] = useState('')
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('ALL')
  const [selected, setSelected] = useState<StudentAnnouncement | null>(null)

  const { data, isLoading } = useStudentAnnouncements()
  const markReadMutation = useMarkAnnouncementRead()
  const markAllReadMutation = useMarkAllAnnouncementsRead()

  const all = useMemo(() => data?.announcements ?? [], [data])
  const isRead = (a: StudentAnnouncement) => a.isRead === true

  // Auto-mark as read when the detail modal opens — but only if it isn't
  // already read, to avoid spamming the server on repeat-opens.
  useEffect(() => {
    if (selected && !selected.isRead) {
      markReadMutation.mutate(selected.announcementId)
    }
  }, [selected, markReadMutation])

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

  // Pin URGENT to the top of the list with a distinct full-width style.
  // Only apply when no priority filter is active (otherwise the filter result
  // is already homogeneous and pinning makes no sense).
  const { pinned, rest } = useMemo(() => {
    if (priorityFilter !== 'ALL') return { pinned: [] as StudentAnnouncement[], rest: filtered }
    return {
      pinned: filtered.filter((a) => a.priority === 'URGENT'),
      rest: filtered.filter((a) => a.priority !== 'URGENT'),
    }
  }, [filtered, priorityFilter])

  const counts = useMemo(() => {
    const total = all.length
    const urgent = all.filter((a) => a.priority === 'URGENT').length
    const unread = all.filter((a) => a.isRead !== true).length
    return { total, urgent, unread }
  }, [all])

  const unreadIds = useMemo(
    () => all.filter((a) => a.isRead !== true).map((a) => a.announcementId),
    [all],
  )
  const canMarkAllRead = counts.unread > 0

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" label="Loading announcements..." />
      </div>
    )
  }

  return (
    <div className="space-y-3 lg:space-y-4">
      {/* Header — title + compact stat chips on one row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center flex-shrink-0">
            <Megaphone className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 leading-tight">Announcements</h1>
            <p className="text-xs text-neutral-600">
              Updates from FYP committee and your supervisors
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="px-2.5 py-1 rounded-md border border-neutral-200 bg-white text-center">
            <p className="text-[10px] uppercase tracking-wide text-neutral-500 font-medium">Total</p>
            <p className="text-base font-bold text-neutral-900 leading-none">{counts.total}</p>
          </div>
          <div className="px-2.5 py-1 rounded-md border border-primary-200 bg-primary-50 text-center">
            <p className="text-[10px] uppercase tracking-wide text-primary-700 font-medium">Unread</p>
            <p className="text-base font-bold text-primary-700 leading-none">{counts.unread}</p>
          </div>
          <div className="px-2.5 py-1 rounded-md border border-error-200 bg-error-50 text-center">
            <p className="text-[10px] uppercase tracking-wide text-error-700 font-medium">Urgent</p>
            <p className="text-base font-bold text-error-700 leading-none">{counts.urgent}</p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <Card padding="sm">
        <div className="flex flex-col lg:flex-row gap-2">
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
          <div className="flex items-center gap-2">
            <div className="flex bg-neutral-100 rounded-lg p-1 self-start">
              {(['ALL', 'URGENT', 'HIGH', 'NORMAL', 'LOW'] as const).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setPriorityFilter(opt)}
                  className={cn(
                    'px-2.5 py-1 rounded text-xs font-medium transition-colors whitespace-nowrap',
                    priorityFilter === opt
                      ? 'bg-white shadow-sm text-neutral-900'
                      : 'text-neutral-600 hover:bg-neutral-200',
                  )}
                >
                  {opt === 'ALL' ? 'All' : getPriorityDisplay(opt).label}
                </button>
              ))}
            </div>
            {canMarkAllRead && (
              <button
                type="button"
                onClick={() => markAllReadMutation.mutate(unreadIds)}
                disabled={markAllReadMutation.isPending}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium text-primary-700 hover:bg-primary-50 border border-primary-200 whitespace-nowrap"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </button>
            )}
          </div>
        </div>
        {(search || priorityFilter !== 'ALL') && (
          <p className="text-xs text-neutral-500 mt-2">
            Showing {filtered.length} of {all.length} announcement{all.length === 1 ? '' : 's'}
          </p>
        )}
      </Card>

      {/* List */}
      {filtered.length === 0 ? (
        <Card className="text-center py-8">
          <Megaphone className="h-10 w-10 text-neutral-300 mx-auto mb-2" />
          <h3 className="font-medium text-neutral-900 mb-1">
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
          {pinned.length > 0 && (
            <div className="space-y-2">
              {pinned.map((a) => (
                <PinnedCard
                  key={a.announcementId}
                  announcement={a}
                  unread={!isRead(a)}
                  onClick={() => setSelected(a)}
                />
              ))}
            </div>
          )}

          {rest.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
              {rest.map((a) => (
                <CompactCard
                  key={a.announcementId}
                  announcement={a}
                  unread={!isRead(a)}
                  onClick={() => setSelected(a)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Detail Modal */}
      <Modal isOpen={!!selected} onClose={() => setSelected(null)} size="lg">
        {selected && (
          <>
            <ModalHeader>
              <div className="flex items-start gap-3 flex-1">
                {(() => {
                  const cfg = getPriorityDisplay(selected.priority)
                  const Icon = cfg.Icon
                  return (
                    <div
                      className={cn(
                        'w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0',
                        cfg.iconClass,
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
                        getPriorityDisplay(selected.priority).pillClass,
                      )}
                    >
                      {getPriorityDisplay(selected.priority).label} priority
                    </span>
                    {selected.scope && selected.scope !== 'ALL' && (
                      <span className="px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600">
                        {getScopeLabel(selected.scope)}
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

              {selected.attachments && selected.attachments.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-sm font-semibold text-neutral-900 mb-3 flex items-center gap-2">
                    <Paperclip className="h-4 w-4 text-neutral-400" />
                    Attachments
                  </h4>
                  <ul className="space-y-2">
                    {selected.attachments.map((att) => (
                      <li
                        key={att.attachmentId}
                        className="flex items-center justify-between gap-3 bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2"
                      >
                        <span className="truncate text-sm text-neutral-700">
                          {att.fileName}{' '}
                          <span className="text-neutral-400 text-xs">
                            ({(att.fileSize / 1024).toFixed(1)} KB)
                          </span>
                        </span>
                        <Button
                          size="sm"
                          variant="secondary"
                          leftIcon={<Download className="h-3.5 w-3.5" />}
                          onClick={async () => {
                            const res = await apiClient.get(att.downloadUrl, { responseType: 'blob' })
                            const blobUrl = URL.createObjectURL(res.data as Blob)
                            const a = document.createElement('a')
                            a.href = blobUrl
                            a.download = att.fileName
                            document.body.appendChild(a)
                            a.click()
                            a.remove()
                            URL.revokeObjectURL(blobUrl)
                          }}
                        >
                          Download
                        </Button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {selected.links && selected.links.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-sm font-semibold text-neutral-900 mb-3 flex items-center gap-2">
                    <Link2 className="h-4 w-4 text-neutral-400" />
                    Links
                  </h4>
                  <ul className="space-y-2">
                    {selected.links.map((link) => (
                      <li key={link.linkId}>
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-sm text-primary-600 hover:underline break-all"
                        >
                          <ExternalLink className="h-4 w-4 flex-shrink-0" />
                          {link.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
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

interface CardProps {
  announcement: StudentAnnouncement
  unread: boolean
  onClick: () => void
}

function PinnedCard({ announcement: a, unread, onClick }: CardProps) {
  const cfg = getPriorityDisplay(a.priority)
  const Icon = cfg.Icon
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group block w-full text-left bg-white rounded-lg border-2 hover:shadow-lg transition-all overflow-hidden',
        unread ? 'border-error-300 ring-1 ring-error-100' : 'border-error-200',
      )}
    >
      <div className="flex">
        <div className={cn('w-1.5 flex-shrink-0', cfg.barClass)} aria-hidden />
        <div className="flex-1 p-3.5">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                cfg.iconClass,
              )}
            >
              <Icon className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={cn(
                    'px-1.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide',
                    cfg.pillClass,
                  )}
                >
                  Pinned · {cfg.label}
                </span>
                {unread && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-primary-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary-500" />
                    New
                  </span>
                )}
              </div>
              <h3
                className={cn(
                  'text-base text-neutral-900 group-hover:text-primary-700 transition-colors leading-tight',
                  unread ? 'font-bold' : 'font-semibold',
                )}
              >
                {a.title}
              </h3>
              <p className="text-sm text-neutral-600 line-clamp-2 mt-1 leading-snug">
                {preview(a.content, 200)}
              </p>
              <div className="flex items-center gap-3 mt-2 text-[11px] text-neutral-500">
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatRelativeDate(a.publishAt || a.createdAt)}
                </span>
                {a.scope && a.scope !== 'ALL' && (
                  <span className="px-1.5 py-0 rounded-full bg-neutral-100 text-neutral-600 truncate">
                    {getScopeLabel(a.scope)}
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
}

function CompactCard({ announcement: a, unread, onClick }: CardProps) {
  const cfg = getPriorityDisplay(a.priority)
  const Icon = cfg.Icon
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group text-left bg-white rounded-lg border hover:border-primary-300 hover:shadow-md transition-all overflow-hidden h-full',
        unread ? 'border-neutral-300' : 'border-neutral-200',
      )}
    >
      <div className="flex h-full">
        <div className={cn('w-1 flex-shrink-0', cfg.barClass)} aria-hidden />
        <div className="flex-1 p-3">
          <div className="flex items-start gap-2.5 h-full">
            <div
              className={cn(
                'w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0',
                cfg.iconClass,
              )}
            >
              <Icon className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                {unread && (
                  <span
                    className="flex-shrink-0 w-2 h-2 rounded-full bg-primary-500"
                    aria-label="Unread"
                  />
                )}
                <h3
                  className={cn(
                    'text-sm text-neutral-900 group-hover:text-primary-700 transition-colors leading-tight truncate flex-1',
                    unread ? 'font-bold' : 'font-semibold',
                  )}
                >
                  {a.title}
                </h3>
                <span
                  className={cn(
                    'px-1.5 py-0.5 rounded-full text-[10px] font-medium flex-shrink-0',
                    cfg.pillClass,
                  )}
                >
                  {cfg.label}
                </span>
              </div>
              <p className="text-xs text-neutral-600 line-clamp-2 mb-1.5 leading-snug min-h-[2.25em]">
                {preview(a.content, 140)}
              </p>
              <div className="flex items-center gap-2 text-[11px] text-neutral-400">
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(a.publishAt || a.createdAt)}
                </span>
                {a.scope && a.scope !== 'ALL' && (
                  <span className="px-1.5 py-0 rounded-full bg-neutral-100 text-neutral-600 truncate">
                    {getScopeLabel(a.scope)}
                  </span>
                )}
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-neutral-300 group-hover:text-primary-500 transition-colors flex-shrink-0 mt-0.5" />
          </div>
        </div>
      </div>
    </button>
  )
}
