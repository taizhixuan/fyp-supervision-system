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
  Sparkles,
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
import type { AnnouncementPriority } from '@/types'

const priorityConfig: Record<AnnouncementPriority, { label: string; color: string; bgColor: string; borderColor: string }> = {
  LOW: { label: 'Low', color: 'text-stone-600', bgColor: 'bg-stone-100', borderColor: 'border-l-stone-400' },
  NORMAL: { label: 'Normal', color: 'text-sky-600', bgColor: 'bg-sky-100', borderColor: 'border-l-sky-500' },
  HIGH: { label: 'High', color: 'text-amber-600', bgColor: 'bg-amber-100', borderColor: 'border-l-amber-500' },
  URGENT: { label: 'Urgent', color: 'text-rose-600', bgColor: 'bg-rose-100', borderColor: 'border-l-rose-500' },
}

// Backend can also publish ALL / ALL_STUDENTS / PROGRAMME_<CODE> via committee
// or admin announcements that the supervisor sees in their inbox. Lookups for
// any unknown scope fall back to FALLBACK_VISIBILITY below so the page never
// crashes on .icon when the enum grows.
const visibilityConfig: Record<string, { label: string; icon: typeof Users }> = {
  ALL: { label: 'All Users', icon: Users },
  ALL_STUDENTS: { label: 'All Students', icon: Users },
  ALL_SUPERVISEES: { label: 'All Supervisees', icon: Users },
  SPECIFIC_STUDENTS: { label: 'Specific Students', icon: Users },
  FYP1: { label: 'FYP 1 Students', icon: Users },
  FYP2: { label: 'FYP 2 Students', icon: Users },
}
const FALLBACK_VISIBILITY = { label: 'Other', icon: Users }

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
    <div className="space-y-6">
      {/* Header - Gradient Style */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-stone-800 via-stone-800 to-stone-900 p-6 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-stone-600/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-14 h-14 bg-amber-500/20 rounded-xl flex items-center justify-center ring-1 ring-amber-500/30">
              <Megaphone className="h-7 w-7 text-amber-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Announcements</h1>
              <p className="text-stone-300 mt-1">Create and manage announcements for your supervisees</p>
            </div>
          </div>
          <Link to={ROUTES.SUPERVISOR.ANNOUNCEMENT_NEW}>
            <Button className="bg-amber-500 hover:bg-amber-600 text-stone-900 font-semibold shadow-lg shadow-amber-500/25">
              <Plus className="h-4 w-4 mr-2" />
              New Announcement
            </Button>
          </Link>
        </div>
      </div>

      {/* Search Section */}
      <div className="flex flex-col sm:flex-row gap-4 p-4 bg-gradient-to-r from-stone-100 to-stone-50 rounded-xl">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <Input
            type="text"
            placeholder="Search announcements..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 border-stone-200 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {filteredAnnouncements && filteredAnnouncements.length > 0 ? (
          filteredAnnouncements.map((announcement) => {
            const priority = priorityConfig[announcement.priority]
            const visibility = visibilityConfig[announcement.visibility] ?? FALLBACK_VISIBILITY
            const VisibilityIcon = visibility.icon
            const isExpired = announcement.expiresAt && new Date(announcement.expiresAt) < new Date()
            // Backend returns "RECEIVED" for committee/admin announcements (read-only),
            // "SENT" for ones the supervisor authored. Default to SENT for back-compat.
            const direction = announcement.direction ?? 'SENT'
            const isReceived = direction === 'RECEIVED'

            return (
              <Card
                key={announcement.announcementId}
                className={cn(
                  'group p-5 hover:shadow-lg transition-all duration-300 border-l-4',
                  !announcement.isActive && 'opacity-60',
                  isExpired ? 'border-l-stone-400 bg-stone-50/50' : priority.borderColor,
                  'hover:scale-[1.01]'
                )}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={cn(
                    'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform',
                    priority.bgColor
                  )}>
                    <Megaphone className={cn('h-6 w-6', priority.color)} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-bold text-stone-800 group-hover:text-amber-700 transition-colors">
                          {announcement.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <span className={cn(
                            'inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold',
                            isReceived ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'
                          )}>
                            {isReceived ? <Inbox className="h-3 w-3" /> : <Send className="h-3 w-3" />}
                            {isReceived ? `From ${announcement.createdBy ?? 'committee'}` : 'Sent by you'}
                          </span>
                          <span className={cn(
                            'px-2.5 py-1 rounded-xl text-xs font-semibold',
                            priority.bgColor,
                            priority.color
                          )}>
                            {priority.label}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-stone-500 px-2 py-1 bg-stone-100 rounded-lg">
                            <VisibilityIcon className="h-3.5 w-3.5" />
                            {visibility.label}
                          </span>
                          {isExpired && (
                            <span className="text-xs text-stone-500 px-2 py-1 bg-stone-100 rounded-lg">Expired</span>
                          )}
                        </div>
                      </div>
                      {/* Edit/Delete only for items the supervisor owns. */}
                      {!isReceived && (
                        <div className="flex items-center gap-1">
                          <Link to={ROUTES.SUPERVISOR.ANNOUNCEMENT_EDIT.replace(':id', String(announcement.announcementId))}>
                            <Button variant="ghost" size="sm" className="hover:bg-amber-100 hover:text-amber-700">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(announcement.announcementId)}
                            disabled={deleteMutation.isPending}
                            className="hover:bg-rose-100 hover:text-rose-700"
                          >
                            <Trash2 className="h-4 w-4 text-rose-500" />
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Content Preview */}
                    <p className="mt-3 text-sm text-stone-600 line-clamp-2">
                      {announcement.content}
                    </p>

                    {/* Stats */}
                    <div className="mt-3 flex items-center gap-4 text-xs">
                      <span className="flex items-center gap-1.5 text-stone-500 px-2 py-1 bg-stone-100 rounded-lg">
                        <Eye className="h-3.5 w-3.5" />
                        {announcement.viewCount} views
                      </span>
                      <span className="flex items-center gap-1.5 text-stone-500 px-2 py-1 bg-stone-100 rounded-lg">
                        <Clock className="h-3.5 w-3.5" />
                        Published {new Date(announcement.publishAt).toLocaleDateString('en-MY', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </span>
                      {announcement.expiresAt && (
                        <span className={cn(
                          'flex items-center gap-1.5 px-2 py-1 rounded-lg',
                          isExpired ? 'text-stone-500 bg-stone-100' : 'text-amber-600 bg-amber-100'
                        )}>
                          {isExpired ? (
                            <>Expired on {new Date(announcement.expiresAt).toLocaleDateString()}</>
                          ) : (
                            <>Expires {new Date(announcement.expiresAt).toLocaleDateString()}</>
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            )
          })
        ) : (
          <Card className="p-12 text-center">
            <div className="w-16 h-16 mx-auto bg-stone-100 rounded-full flex items-center justify-center mb-4">
              <Megaphone className="h-8 w-8 text-stone-400" />
            </div>
            <h3 className="text-lg font-semibold text-stone-800">No announcements yet</h3>
            <p className="text-stone-500 mt-1">
              {searchQuery
                ? 'Try adjusting your search'
                : 'Create your first announcement to communicate with supervisees'}
            </p>
            <Link to={ROUTES.SUPERVISOR.ANNOUNCEMENT_NEW}>
              <Button className="mt-4 bg-amber-500 hover:bg-amber-600 text-stone-900 font-semibold">
                <Plus className="h-4 w-4 mr-2" />
                Create Announcement
              </Button>
            </Link>
          </Card>
        )}
      </div>

      {/* Summary Stats */}
      {data && data.announcements.length > 0 && (
        <Card className="overflow-hidden">
          <div className="p-4 bg-gradient-to-r from-stone-50 to-stone-100/50 border-b border-stone-200">
            <h3 className="font-semibold text-stone-800 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" />
              Announcement Summary
            </h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-5">
            <div className="text-center p-3 rounded-xl bg-stone-50">
              <p className="text-2xl font-bold text-stone-800">{data.total}</p>
              <p className="text-sm text-stone-500 font-medium">Total</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-emerald-50">
              <p className="text-2xl font-bold text-emerald-600">
                {data.announcements.filter((a) => a.isActive).length}
              </p>
              <p className="text-sm text-emerald-700 font-medium">Active</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-amber-50">
              <p className="text-2xl font-bold text-amber-600">
                {data.announcements.filter((a) => a.priority === 'HIGH' || a.priority === 'URGENT').length}
              </p>
              <p className="text-sm text-amber-700 font-medium">High Priority</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-sky-50">
              <p className="text-2xl font-bold text-sky-600">
                {data.announcements.reduce((sum, a) => sum + a.viewCount, 0)}
              </p>
              <p className="text-sm text-sky-700 font-medium">Total Views</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
