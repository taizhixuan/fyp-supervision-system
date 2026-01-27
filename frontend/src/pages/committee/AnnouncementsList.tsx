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
  Filter,
  Sparkles,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import { useCommitteeAnnouncements, useArchiveAnnouncement } from '@/lib/hooks/useCommittee'
import { ROUTES } from '@/lib/constants/routes'
import { cn } from '@/lib/utils/cn'
import type { AnnouncementScope, AnnouncementPriority, AnnouncementStatus } from '@/types'

const priorityConfig: Record<AnnouncementPriority, { label: string; color: string; bgColor: string }> = {
  LOW: { label: 'Low', color: 'text-stone-600', bgColor: 'bg-stone-100' },
  NORMAL: { label: 'Normal', color: 'text-sky-600', bgColor: 'bg-sky-100' },
  HIGH: { label: 'High', color: 'text-amber-600', bgColor: 'bg-amber-100' },
  URGENT: { label: 'Urgent', color: 'text-rose-600', bgColor: 'bg-rose-100' },
}

const scopeConfig: Record<AnnouncementScope, { label: string }> = {
  ALL: { label: 'All Students' },
  FYP1: { label: 'FYP1 Only' },
  FYP2: { label: 'FYP2 Only' },
  PROGRAMME_CS: { label: 'Computer Science' },
  PROGRAMME_SE: { label: 'Software Engineering' },
  PROGRAMME_DS: { label: 'Data Science' },
}

const statusConfig: Record<AnnouncementStatus, { label: string; color: string; bgColor: string }> = {
  DRAFT: { label: 'Draft', color: 'text-stone-600', bgColor: 'bg-stone-100' },
  PUBLISHED: { label: 'Published', color: 'text-emerald-600', bgColor: 'bg-emerald-100' },
  ARCHIVED: { label: 'Archived', color: 'text-stone-500', bgColor: 'bg-stone-100' },
}

export function AnnouncementsList() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<AnnouncementStatus | 'ALL'>('ALL')
  const [scopeFilter, setScopeFilter] = useState<AnnouncementScope | 'ALL'>('ALL')

  const { data, isLoading } = useCommitteeAnnouncements()
  const archiveMutation = useArchiveAnnouncement()

  const filteredAnnouncements = data?.announcements
    .filter((announcement) => {
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
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

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
              <h1 className="text-2xl font-bold text-white">FYP Announcements</h1>
              <p className="text-stone-300 mt-1">
                Manage announcements for all FYP students and supervisors
              </p>
            </div>
          </div>
          <Link to={ROUTES.COMMITTEE.ANNOUNCEMENT_NEW}>
            <Button className="bg-amber-500 hover:bg-amber-600 text-white">
              <Plus className="h-4 w-4 mr-2" />
              New Announcement
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
              placeholder="Search announcements..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as AnnouncementStatus | 'ALL')}
              className="px-3 py-2 border border-neutral-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500"
            >
              <option value="ALL">All Status</option>
              <option value="PUBLISHED">Published</option>
              <option value="DRAFT">Draft</option>
              <option value="ARCHIVED">Archived</option>
            </select>
            <select
              value={scopeFilter}
              onChange={(e) => setScopeFilter(e.target.value as AnnouncementScope | 'ALL')}
              className="px-3 py-2 border border-neutral-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500"
            >
              <option value="ALL">All Audiences</option>
              <option value="ALL">All Students</option>
              <option value="FYP1">FYP1 Only</option>
              <option value="FYP2">FYP2 Only</option>
              <option value="PROGRAMME_CS">Computer Science</option>
              <option value="PROGRAMME_SE">Software Engineering</option>
              <option value="PROGRAMME_DS">Data Science</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Announcements List */}
      <div className="flex flex-col gap-4">
        {filteredAnnouncements && filteredAnnouncements.length > 0 ? (
          filteredAnnouncements.map((announcement) => {
            const priority = priorityConfig[announcement.priority]
            const scope = scopeConfig[announcement.scope]
            const status = statusConfig[announcement.status]
            const isExpired = announcement.expiresAt && new Date(announcement.expiresAt) < new Date()

            return (
              <Card
                key={announcement.announcementId}
                className={cn(
                  'group p-4 hover:shadow-lg transition-all duration-300 border-l-4',
                  announcement.priority === 'URGENT' && 'border-l-rose-500',
                  announcement.priority === 'HIGH' && 'border-l-amber-500',
                  announcement.priority === 'NORMAL' && 'border-l-sky-500',
                  announcement.priority === 'LOW' && 'border-l-stone-400',
                  announcement.status === 'ARCHIVED' && 'opacity-60',
                  isExpired && 'bg-stone-50'
                )}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={cn('p-2.5 rounded-xl', priority.bgColor)}>
                    <Megaphone className={cn('h-5 w-5', priority.color)} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-stone-800 group-hover:text-amber-700 transition-colors">{announcement.title}</h3>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className={cn(
                            'px-2 py-0.5 rounded-full text-xs font-medium',
                            priority.bgColor,
                            priority.color
                          )}>
                            {priority.label}
                          </span>
                          <span className={cn(
                            'px-2 py-0.5 rounded-full text-xs font-medium',
                            status.bgColor,
                            status.color
                          )}>
                            {status.label}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-neutral-500">
                            <Users className="h-3.5 w-3.5" />
                            {scope.label}
                          </span>
                          {isExpired && (
                            <span className="text-xs text-neutral-500">Expired</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Link to={ROUTES.COMMITTEE.ANNOUNCEMENT_EDIT.replace(':id', String(announcement.announcementId))}>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        {announcement.status !== 'ARCHIVED' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleArchive(announcement.announcementId)}
                            disabled={archiveMutation.isPending}
                          >
                            <Archive className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Content Preview */}
                    <p className="mt-2 text-sm text-neutral-600 line-clamp-2">
                      {announcement.content}
                    </p>

                    {/* Stats */}
                    <div className="mt-3 flex items-center gap-4 text-xs text-neutral-500">
                      <span className="flex items-center gap-1">
                        <Eye className="h-3.5 w-3.5" />
                        {announcement.viewCount} views
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        Published {new Date(announcement.publishAt).toLocaleDateString('en-MY', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                      {announcement.expiresAt && (
                        <span>
                          {isExpired
                            ? `Expired ${new Date(announcement.expiresAt).toLocaleDateString()}`
                            : `Expires ${new Date(announcement.expiresAt).toLocaleDateString()}`}
                        </span>
                      )}
                      <span>By {announcement.createdBy}</span>
                    </div>
                  </div>
                </div>
              </Card>
            )
          })
        ) : (
          <Card className="p-12 text-center">
            <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Megaphone className="h-8 w-8 text-stone-400" />
            </div>
            <h3 className="text-lg font-semibold text-stone-800">No announcements found</h3>
            <p className="text-neutral-500 mt-1">
              {searchQuery || statusFilter !== 'ALL' || scopeFilter !== 'ALL'
                ? 'Try adjusting your filters'
                : 'Create your first announcement to communicate with students'}
            </p>
            <Link to={ROUTES.COMMITTEE.ANNOUNCEMENT_NEW}>
              <Button className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Create Announcement
              </Button>
            </Link>
          </Card>
        )}
      </div>

      {/* Summary */}
      {data && data.announcements.length > 0 && (
        <Card className="overflow-hidden">
          <div className="p-4 bg-gradient-to-r from-stone-100 to-stone-50 border-b border-stone-200">
            <h3 className="font-semibold text-stone-800">Summary Statistics</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4">
            <div className="text-center p-3 rounded-xl bg-stone-100">
              <p className="text-2xl font-bold text-stone-800">{data.total}</p>
              <p className="text-sm text-stone-600 font-medium">Total</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-emerald-100">
              <p className="text-2xl font-bold text-emerald-700">
                {data.announcements.filter((a) => a.status === 'PUBLISHED').length}
              </p>
              <p className="text-sm text-emerald-700 font-medium">Published</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-amber-100">
              <p className="text-2xl font-bold text-amber-700">
                {data.announcements.filter((a) => a.priority === 'HIGH' || a.priority === 'URGENT').length}
              </p>
              <p className="text-sm text-amber-700 font-medium">High Priority</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-sky-100">
              <p className="text-2xl font-bold text-sky-700">
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
