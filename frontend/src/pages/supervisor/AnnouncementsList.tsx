import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Megaphone,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Clock,
  Users,
  Inbox,
  Send,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import { useSupervisorAnnouncements, useDeleteAnnouncement } from '@/lib/hooks/useSupervisor'
import { ROUTES } from '@/lib/constants/routes'
import { cn } from '@/lib/utils/cn'
import { getPriorityDisplay, getScopeLabel } from '@/lib/utils/announcementDisplay'
import { formatDate } from '@/lib/utils/formatDate'

export function AnnouncementsList() {
  const [searchQuery, setSearchQuery] = useState('')

  const { data, isLoading } = useSupervisorAnnouncements()
  const deleteMutation = useDeleteAnnouncement()

  const filteredAnnouncements = data?.announcements
    .filter((announcement) => {
      if (!searchQuery) return true
      const query = searchQuery.toLowerCase()
      return (
        announcement.title.toLowerCase().includes(query) ||
        announcement.content.toLowerCase().includes(query)
      )
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const handleDelete = async (announcementId: number) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return
    try {
      await deleteMutation.mutateAsync(announcementId)
    } catch (error) {
      console.error('Failed to delete announcement:', error)
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
      {/* Compact Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-stone-800 via-stone-800 to-stone-900 p-3 sm:p-4 text-white shadow-md">
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

        <div className="relative flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex-shrink-0 w-9 h-9 bg-amber-500/20 rounded-lg flex items-center justify-center ring-1 ring-amber-500/30">
              <Megaphone className="h-5 w-5 text-amber-400" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-white leading-tight">Announcements</h1>
              <p className="text-stone-300 text-xs">Create and manage announcements for your supervisees</p>
            </div>
          </div>
          <Link to={ROUTES.SUPERVISOR.ANNOUNCEMENT_NEW}>
            <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-stone-900 font-semibold shadow whitespace-nowrap">
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
                {data.announcements.filter((a) => a.isActive).length}
              </div>
              <p className="text-[10px] text-stone-300 mt-0.5 uppercase tracking-wide">Active</p>
            </div>
            <div className="bg-stone-700/40 rounded-md px-2 py-1.5 ring-1 ring-stone-600/40">
              <div className="text-base font-bold leading-none text-rose-300">
                {data.announcements.filter((a) => a.priority === 'URGENT').length}
              </div>
              <p className="text-[10px] text-stone-300 mt-0.5 uppercase tracking-wide">Urgent</p>
            </div>
            <div className="bg-stone-700/40 rounded-md px-2 py-1.5 ring-1 ring-stone-600/40">
              <div className="text-base font-bold leading-none text-sky-300">
                {data.announcements.reduce((sum, a) => sum + a.viewCount, 0)}
              </div>
              <p className="text-[10px] text-stone-300 mt-0.5 uppercase tracking-wide">Views</p>
            </div>
          </div>
        )}
      </div>

      {/* Search */}
      <Card padding="sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 pointer-events-none" />
          <Input
            type="text"
            placeholder="Search announcements..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 border-stone-200 focus:ring-amber-500"
          />
        </div>
      </Card>

      {/* Announcements List — 2-col grid */}
      {filteredAnnouncements && filteredAnnouncements.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
          {filteredAnnouncements.map((announcement) => {
            const priority = getPriorityDisplay(announcement.priority)
            const PriorityIcon = priority.Icon
            const visibilityLabel = getScopeLabel(announcement.visibility)
            const isExpired = announcement.expiresAt && new Date(announcement.expiresAt) < new Date()
            const direction = announcement.direction ?? 'SENT'
            const isReceived = direction === 'RECEIVED'

            return (
              <Card
                key={announcement.announcementId}
                padding="sm"
                className={cn(
                  'group hover:shadow-md transition-all border-l-4 h-full',
                  !announcement.isActive && 'opacity-60',
                  isExpired ? 'border-l-stone-400 bg-stone-50/50' : priority.borderClass,
                )}
              >
                <div className="flex items-start gap-2.5 h-full">
                  <div className={cn('w-9 h-9 rounded-md flex items-center justify-center flex-shrink-0', priority.iconClass)}>
                    <PriorityIcon className="h-4 w-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-sm text-stone-800 group-hover:text-amber-700 leading-tight truncate">
                          {announcement.title}
                        </h3>
                        <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                          <span className={cn(
                            'inline-flex items-center gap-0.5 px-1.5 py-0 rounded-md text-[10px] font-semibold',
                            isReceived ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'
                          )}>
                            {isReceived ? <Inbox className="h-3 w-3" /> : <Send className="h-3 w-3" />}
                            {isReceived ? `From ${announcement.createdBy ?? 'committee'}` : 'Sent'}
                          </span>
                          <span className={cn('px-1.5 py-0 rounded-md text-[10px] font-semibold', priority.pillClass)}>
                            {priority.label}
                          </span>
                          <span className="inline-flex items-center gap-0.5 text-[10px] text-stone-500 px-1.5 py-0 bg-stone-100 rounded-md">
                            <Users className="h-3 w-3" />
                            {visibilityLabel}
                          </span>
                        </div>
                      </div>
                      {!isReceived && (
                        <div className="flex items-center gap-0.5 flex-shrink-0">
                          <Link to={ROUTES.SUPERVISOR.ANNOUNCEMENT_EDIT.replace(':id', String(announcement.announcementId))}>
                            <button className="p-1 rounded hover:bg-amber-100 hover:text-amber-700 transition-colors">
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                          </Link>
                          <button
                            onClick={() => handleDelete(announcement.announcementId)}
                            disabled={deleteMutation.isPending}
                            className="p-1 rounded hover:bg-rose-100 hover:text-rose-700 transition-colors disabled:opacity-50"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                          </button>
                        </div>
                      )}
                    </div>

                    <p className="mt-1 text-[11px] text-stone-600 line-clamp-2 leading-snug min-h-[2.25em]">
                      {announcement.content}
                    </p>

                    <div className="mt-1 flex items-center gap-1.5 text-[10px] flex-wrap">
                      <span className="inline-flex items-center gap-0.5 text-stone-500">
                        <Eye className="h-3 w-3" />
                        {announcement.viewCount}
                      </span>
                      <span className="inline-flex items-center gap-0.5 text-stone-500">
                        <Clock className="h-3 w-3" />
                        {formatDate(announcement.publishAt)}
                      </span>
                      {isExpired && <span className="text-stone-500">· Expired</span>}
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
          <h3 className="font-medium text-stone-800 mb-1">No announcements yet</h3>
          <p className="text-sm text-stone-500 mb-3">
            {searchQuery
              ? 'Try adjusting your search'
              : 'Create your first announcement to communicate with supervisees'}
          </p>
          <Link to={ROUTES.SUPERVISOR.ANNOUNCEMENT_NEW}>
            <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-stone-900 font-semibold">
              <Plus className="h-3.5 w-3.5 mr-1" />
              Create Announcement
            </Button>
          </Link>
        </Card>
      )}
    </div>
  )
}
