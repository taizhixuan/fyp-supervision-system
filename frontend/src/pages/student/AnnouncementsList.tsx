import { useMemo, useState } from 'react'
import { Megaphone, Search } from 'lucide-react'
import { Card, Spinner } from '@/components/ui'
import { useStudentAnnouncements } from '@/lib/hooks/useStudent'
import { cn } from '@/lib/utils/cn'

const priorityStyles: Record<string, { label: string; pillClass: string; borderClass: string }> = {
  LOW: { label: 'Low', pillClass: 'bg-neutral-100 text-neutral-600', borderClass: 'border-l-neutral-300' },
  NORMAL: { label: 'Normal', pillClass: 'bg-info-100 text-info-700', borderClass: 'border-l-info-400' },
  HIGH: { label: 'High', pillClass: 'bg-warning-100 text-warning-700', borderClass: 'border-l-warning-500' },
  URGENT: { label: 'Urgent', pillClass: 'bg-error-100 text-error-700', borderClass: 'border-l-error-500' },
}

function formatDate(value: string | undefined) {
  if (!value) return ''
  const d = new Date(value)
  if (isNaN(d.getTime())) return value
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

export function AnnouncementsList() {
  const [search, setSearch] = useState('')
  const { data, isLoading } = useStudentAnnouncements()

  const filtered = useMemo(() => {
    const items = data?.announcements ?? []
    const q = search.trim().toLowerCase()
    if (!q) return items
    return items.filter(
      (a) => a.title.toLowerCase().includes(q) || a.content.toLowerCase().includes(q)
    )
  }, [data, search])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" label="Loading announcements..." />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Announcements</h1>
        <p className="text-neutral-600 mt-1">Updates from FYP committee and your supervisors</p>
      </div>

      <Card className="p-0">
        <div className="p-4 border-b border-neutral-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search announcements"
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16 text-neutral-500">
            <Megaphone className="h-12 w-12 text-neutral-300 mx-auto mb-3" />
            <p className="text-sm">{search ? 'No announcements match your search.' : 'No announcements yet.'}</p>
          </div>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {filtered.map((a) => {
              const cfg = priorityStyles[a.priority] ?? priorityStyles.NORMAL
              return (
                <li key={a.announcementId} className={cn('p-5 border-l-4', cfg.borderClass)}>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="font-semibold text-neutral-900">{a.title}</h3>
                    <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', cfg.pillClass)}>
                      {cfg.label}
                    </span>
                  </div>
                  <p className="text-sm text-neutral-700 whitespace-pre-line mb-3">{a.content}</p>
                  <p className="text-xs text-neutral-400">
                    {formatDate(a.publishAt || a.createdAt)}
                  </p>
                </li>
              )
            })}
          </ul>
        )}
      </Card>
    </div>
  )
}
