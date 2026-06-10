import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Megaphone,
  Plus,
  Search,
  Edit,
  Archive,
  Eye,
  Clock,
  Users,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import { useCommitteeAnnouncements, useArchiveAnnouncement } from '@/lib/hooks/useCommittee'
import { ROUTES } from '@/lib/constants/routes'
import { cn } from '@/lib/utils/cn'
import { getPriorityDisplay, getScopeLabel } from '@/lib/utils/announcementDisplay'
import { formatDate } from '@/lib/utils/formatDate'
import type { AnnouncementScope, AnnouncementStatus, FYPAnnouncement } from '@/types'

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  DRAFT: { label: 'Draft', color: 'text-stone-600', bgColor: 'bg-stone-100' },
  PUBLISHED: { label: 'Published', color: 'text-emerald-600', bgColor: 'bg-emerald-100' },
  ARCHIVED: { label: 'Archived', color: 'text-stone-500', bgColor: 'bg-stone-100' },
}
const FALLBACK_STATUS = { label: 'Unknown', color: 'text-stone-600', bgColor: 'bg-stone-100' }

export function AnnouncementsList() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<AnnouncementStatus | 'ALL'>('ALL')
  const [scopeFilter, setScopeFilter] = useState<AnnouncementScope | 'ALL'>('ALL')

  const { data, isLoading } = useCommitteeAnnouncements()
  const archiveMutation = useArchiveAnnouncement()

  const filteredAnnouncements = data?.announcements
    .filter((announcement: FYPAnnouncement) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        if (
          !announcement.title.toLowerCase().includes(query) &&
          !announcement.content.toLowerCase().includes(query)
        ) {
          return false
        }
      }
      if (statusFilter !== 'ALL' && announcement.status !== statusFilter) {
        return false
      }
      if (scopeFilter !== 'ALL' && announcement.scope !== scopeFilter) {
        return false
      }
      return true
    })
    .sort((a: FYPAnnouncement, b: FYPAnnouncement) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const handleArchive = async (announcementId: number) => {
    if (!confirm('Are you sure you want to archive this announcement?')) return
    try {
      await archiveMutation.mutateAsync(announcementId)
    } catch (error) {
      console.error('Failed to archive announcement:', error)
    }
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
      {/* Compact Header with stats inline */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-stone-800 via-stone-800 to-stone-900 p-3 sm:p-4 text-white shadow-md">
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

        <div className="relative flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex-shrink-0 w-9 h-9 bg-amber-500/20 rounded-lg flex items-center justify-center ring-1 ring-amber-500/30">
              <Megaphone className="h-5 w-5 text-amber-400" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-white leading-tight">FYP Announcements</h1>
              <p className="text-stone-300 text-xs">Manage announcements for all FYP students and supervisors</p>
            </div>
          </div>
          <Link to={ROUTES.COMMITTEE.ANNOUNCEMENT_NEW}>
            <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white whitespace-nowrap">
              <Plus className="h-3.5 w-3.5 mr-1" />
              New
            </Button>
          </Link>
        </div>

        {data && data.announcements.length > 0 && (
          <div className="relative mt-3 grid grid-cols-4 gap-1.5 text-center">
            <div className="bg-stone-700/40 rounded-md px-2 py-1.5 ring-1 ring-stone-600/40">
              <div className="text-base font-bold leading-none">{data.total}</div>
              <p className="text-[10px] text-stone-300 mt-0.5 uppercase tracking-wide">Total</p>
            </div>
            <div className="bg-stone-700/40 rounded-md px-2 py-1.5 ring-1 ring-stone-600/40">
              <div className="text-base font-bold leading-none text-emerald-300">
                {data.announcements.filter((a: FYPAnnouncement) => a.status === 'PUBLISHED').length}
              </div>
              <p className="text-[10px] text-stone-300 mt-0.5 uppercase tracking-wide">Published</p>
            </div>
            <div className="bg-stone-700/40 rounded-md px-2 py-1.5 ring-1 ring-stone-600/40">
              <div className="text-base font-bold leading-none text-rose-300">
                {data.announcements.filter((a: FYPAnnouncement) => a.priority === 'URGENT').length}
              </div>
              <p className="text-[10px] text-stone-300 mt-0.5 uppercase tracking-wide">Urgent</p>
            </div>
            <div className="bg-stone-700/40 rounded-md px-2 py-1.5 ring-1 ring-stone-600/40">
              <div className="text-base font-bold leading-none text-sky-300">
                {data.announcements.reduce((sum: number, a: FYPAnnouncement) => sum + a.viewCount, 0)}
              </div>
              <p className="text-[10px] text-stone-300 mt-0.5 uppercase tracking-wide">Views</p>
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <Card padding="sm">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 pointer-events-none" />
            <Input
              type="text"
              placeholder="Search announcements..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-1.5">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as AnnouncementStatus | 'ALL')}
              className="px-2.5 py-1.5 border border-neutral-300 rounded-md text-xs focus:ring-2 focus:ring-primary-500 whitespace-nowrap"
            >
              <option value="ALL">All Status</option>
              <option value="PUBLISHED">Published</option>
              <option value="DRAFT">Draft</option>
              <option value="ARCHIVED">Archived</option>
            </select>
            <select
              value={scopeFilter}
              onChange={(e) => setScopeFilter(e.target.value as AnnouncementScope | 'ALL')}
              className="px-2.5 py-1.5 border border-neutral-300 rounded-md text-xs focus:ring-2 focus:ring-primary-500 whitespace-nowrap"
            >
              <option value="ALL">All Audiences</option>
              <option value="FYP1">FYP1</option>
              <option value="FYP2">FYP2</option>
              <option value="PROGRAMME_CS">CS</option>
              <option value="PROGRAMME_SE">SE</option>
              <option value="PROGRAMME_DS">DS</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Announcements List — 2-col grid */}
      {filteredAnnouncements && filteredAnnouncements.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
          {filteredAnnouncements.map((announcement: FYPAnnouncement) => {
            const priority = getPriorityDisplay(announcement.priority)
            const PriorityIcon = priority.Icon
            const scopeLabel = getScopeLabel(announcement.scope)
            const status = statusConfig[announcement.status] ?? FALLBACK_STATUS
            const isExpired = announcement.expiresAt && new Date(announcement.expiresAt) < new Date()

            return (
              <Card
                key={announcement.announcementId}
                padding="sm"
                className={cn(
                  'group hover:shadow-md transition-all border-l-4 h-full',
                  priority.borderClass,
                  announcement.status === 'ARCHIVED' && 'opacity-60',
                  isExpired && 'bg-stone-50',
                )}
              >
                <div className="flex items-start gap-2.5 h-full">
                  <div className={cn('w-9 h-9 rounded-md flex items-center justify-center flex-shrink-0', priority.iconClass)}>
                    <PriorityIcon className="h-4 w-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-sm text-stone-800 group-hover:text-amber-700 leading-tight truncate">{announcement.title}</h3>
                        <div className="flex flex-wrap items-center gap-1 mt-0.5">
                          <span className={cn('px-1.5 py-0 rounded-md text-[10px] font-semibold', priority.pillClass)}>
                            {priority.label}
                          </span>
                          <span className={cn('px-1.5 py-0 rounded-md text-[10px] font-semibold', status.bgColor, status.color)}>
                            {status.label}
                          </span>
                          <span className="inline-flex items-center gap-0.5 text-[10px] text-neutral-500">
                            <Users className="h-3 w-3" />
                            {scopeLabel}
                          </span>
                          {isExpired && <span className="text-[10px] text-neutral-500">· Expired</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5 flex-shrink-0">
                        <Link to={ROUTES.COMMITTEE.ANNOUNCEMENT_EDIT.replace(':id', String(announcement.announcementId))}>
                          <button className="p-1 rounded hover:bg-amber-100 hover:text-amber-700 transition-colors">
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                        </Link>
                        {announcement.status !== 'ARCHIVED' && (
                          <button
                            onClick={() => handleArchive(announcement.announcementId)}
                            disabled={archiveMutation.isPending}
                            className="p-1 rounded hover:bg-stone-100 transition-colors disabled:opacity-50"
                          >
                            <Archive className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <p className="mt-1 text-[11px] text-neutral-600 line-clamp-2 leading-snug min-h-[2.25em]">
                      {announcement.content}
                    </p>

                    <div className="mt-1 flex items-center gap-2 text-[10px] text-neutral-500">
                      <span className="inline-flex items-center gap-0.5">
                        <Eye className="h-3 w-3" />
                        {announcement.viewCount}
                      </span>
                      <span className="inline-flex items-center gap-0.5">
                        <Clock className="h-3 w-3" />
                        {formatDate(announcement.publishAt)}
                      </span>
                      <span className="truncate">· {announcement.createdBy}</span>
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card className="text-center py-8">
          <Megaphone className="h-10 w-10 text-stone-300 mx-auto mb-2" />
          <h3 className="font-medium text-stone-800 mb-1">No announcements found</h3>
          <p className="text-sm text-neutral-500 mb-3">
            {searchQuery || statusFilter !== 'ALL' || scopeFilter !== 'ALL'
              ? 'Try adjusting your filters'
              : 'Create your first announcement to communicate with students'}
          </p>
          <Link to={ROUTES.COMMITTEE.ANNOUNCEMENT_NEW}>
            <Button size="sm">
              <Plus className="h-3.5 w-3.5 mr-1" />
              Create Announcement
            </Button>
          </Link>
        </Card>
      )}
    </div>
  )
}
