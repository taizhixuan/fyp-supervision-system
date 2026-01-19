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
  AlertTriangle,
  ChevronRight,
  Users,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import { useSupervisorAnnouncements, useDeleteAnnouncement } from '@/lib/hooks/useSupervisor'
import { ROUTES } from '@/lib/constants/routes'
import { cn } from '@/lib/utils/cn'
import type { AnnouncementPriority, AnnouncementVisibility } from '@/types'

const priorityConfig: Record<AnnouncementPriority, { label: string; color: string; bgColor: string }> = {
  LOW: { label: 'Low', color: 'text-neutral-600', bgColor: 'bg-neutral-100' },
  NORMAL: { label: 'Normal', color: 'text-info-600', bgColor: 'bg-info-50' },
  HIGH: { label: 'High', color: 'text-warning-600', bgColor: 'bg-warning-50' },
  URGENT: { label: 'Urgent', color: 'text-error-600', bgColor: 'bg-error-50' },
}

const visibilityConfig: Record<AnnouncementVisibility, { label: string; icon: typeof Users }> = {
  ALL_SUPERVISEES: { label: 'All Supervisees', icon: Users },
  SPECIFIC_STUDENTS: { label: 'Specific Students', icon: Users },
  FYP1: { label: 'FYP 1 Students', icon: Users },
  FYP2: { label: 'FYP 2 Students', icon: Users },
}

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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
            <Megaphone className="h-7 w-7 text-primary-600" />
            Announcements
          </h1>
          <p className="text-neutral-600 mt-1">
            Create and manage announcements for your supervisees
          </p>
        </div>
        <Link to={ROUTES.SUPERVISOR.ANNOUNCEMENT_NEW}>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Announcement
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
        <Input
          type="text"
          placeholder="Search announcements..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {filteredAnnouncements && filteredAnnouncements.length > 0 ? (
          filteredAnnouncements.map((announcement) => {
            const priority = priorityConfig[announcement.priority]
            const visibility = visibilityConfig[announcement.visibility]
            const VisibilityIcon = visibility.icon
            const isExpired = announcement.expiresAt && new Date(announcement.expiresAt) < new Date()

            return (
              <Card
                key={announcement.announcementId}
                className={cn(
                  'p-4',
                  !announcement.isActive && 'opacity-60',
                  isExpired && 'border-l-4 border-l-neutral-400'
                )}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={cn('p-2 rounded-lg', priority.bgColor)}>
                    <Megaphone className={cn('h-5 w-5', priority.color)} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-neutral-900">{announcement.title}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={cn(
                            'px-2 py-0.5 rounded-full text-xs font-medium',
                            priority.bgColor,
                            priority.color
                          )}>
                            {priority.label}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-neutral-500">
                            <VisibilityIcon className="h-3.5 w-3.5" />
                            {visibility.label}
                          </span>
                          {isExpired && (
                            <span className="text-xs text-neutral-500">Expired</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Link to={ROUTES.SUPERVISOR.ANNOUNCEMENT_EDIT.replace(':id', String(announcement.announcementId))}>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(announcement.announcementId)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-error-500" />
                        </Button>
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
                        })}
                      </span>
                      {announcement.expiresAt && (
                        <span className="flex items-center gap-1">
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
            <Megaphone className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-neutral-900">No announcements yet</h3>
            <p className="text-neutral-500 mt-1">
              {searchQuery
                ? 'Try adjusting your search'
                : 'Create your first announcement to communicate with supervisees'}
            </p>
            <Link to={ROUTES.SUPERVISOR.ANNOUNCEMENT_NEW}>
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
        <Card className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-neutral-900">{data.total}</p>
              <p className="text-sm text-neutral-500">Total</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-success-600">
                {data.announcements.filter((a) => a.isActive).length}
              </p>
              <p className="text-sm text-neutral-500">Active</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-warning-600">
                {data.announcements.filter((a) => a.priority === 'HIGH' || a.priority === 'URGENT').length}
              </p>
              <p className="text-sm text-neutral-500">High Priority</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-primary-600">
                {data.announcements.reduce((sum, a) => sum + a.viewCount, 0)}
              </p>
              <p className="text-sm text-neutral-500">Total Views</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
