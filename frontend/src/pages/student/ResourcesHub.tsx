import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BookOpen,
  FileText,
  Video,
  Download,
  ExternalLink,
  Search,
  Filter,
  Folder,
  ChevronRight,
  Star,
  Clock,
  Library,
  Eye,
  Sparkles,
  ArrowRight,
} from 'lucide-react'
import { Card, Badge, Spinner } from '@/components/ui'
import { useResources } from '@/lib/hooks/useStudent'
import { ROUTES } from '@/lib/constants/routes'
import { cn } from '@/lib/utils/cn'

type ResourceType = 'GUIDELINE' | 'TEMPLATE' | 'VIDEO' | 'DOCUMENT' | 'LINK'
type ResourceCategory = 'GENERAL' | 'PROPOSAL' | 'REPORT' | 'PRESENTATION' | 'SUBMISSION'

interface Resource {
  resourceId: string
  title: string
  description: string
  type: ResourceType
  category: ResourceCategory
  fileUrl?: string
  externalUrl?: string
  fileSize?: number
  duration?: string
  isFeatured: boolean
  viewCount: number
  createdAt: string
  updatedAt: string
}

const typeConfig: Record<ResourceType, { label: string; color: string; bgColor: string; icon: typeof FileText }> = {
  GUIDELINE: { label: 'Guideline', color: 'bg-amber-100 text-amber-700', bgColor: 'bg-amber-500', icon: BookOpen },
  TEMPLATE: { label: 'Template', color: 'bg-emerald-100 text-emerald-700', bgColor: 'bg-emerald-500', icon: FileText },
  VIDEO: { label: 'Video', color: 'bg-rose-100 text-rose-700', bgColor: 'bg-rose-500', icon: Video },
  DOCUMENT: { label: 'Document', color: 'bg-sky-100 text-sky-700', bgColor: 'bg-sky-500', icon: FileText },
  LINK: { label: 'Link', color: 'bg-violet-100 text-violet-700', bgColor: 'bg-violet-500', icon: ExternalLink },
}

const categoryConfig: Record<ResourceCategory, string> = {
  GENERAL: 'General',
  PROPOSAL: 'Proposal',
  REPORT: 'Report',
  PRESENTATION: 'Presentation',
  SUBMISSION: 'Submission',
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function ResourcesHub() {
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  const { data, isLoading } = useResources()

  // Use sample data
  const resources = data?.resources ?? []

  const filteredResources = resources.filter((res) => {
    const matchesType = typeFilter === 'all' || res.type === typeFilter
    const matchesCategory = categoryFilter === 'all' || res.category === categoryFilter
    const matchesSearch = searchQuery === '' ||
      res.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesType && matchesCategory && matchesSearch
  })

  const featuredResources = resources.filter(r => r.isFeatured)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" label="Loading resources..." />
      </div>
    )
  }

  return (
    <div className="space-y-3 lg:space-y-4">
      {/* Compact Header — title + stats + filters all in the hero */}
      <div className="relative bg-gradient-to-br from-primary-800 via-primary-900 to-primary-950 rounded-xl p-3 sm:p-4 text-white overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary-500/10 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />

        <div className="relative flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 bg-white/10 backdrop-blur rounded-lg flex items-center justify-center flex-shrink-0">
              <Library className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold leading-tight">Resources Hub</h1>
              <p className="text-primary-200 text-xs">Guidelines, templates, and helpful materials</p>
            </div>
          </div>

          {/* Inline stat chips */}
          <div className="grid grid-cols-3 gap-1.5 flex-shrink-0">
            <div className="bg-white/10 rounded-md px-2 py-1 text-center min-w-[60px]">
              <div className="text-base font-bold leading-none">{resources.length}</div>
              <p className="text-[10px] text-primary-200 mt-0.5 uppercase tracking-wide">Total</p>
            </div>
            <div className="bg-white/10 rounded-md px-2 py-1 text-center min-w-[60px]">
              <div className="text-base font-bold leading-none text-success-300">{featuredResources.length}</div>
              <p className="text-[10px] text-primary-200 mt-0.5 uppercase tracking-wide">Featured</p>
            </div>
            <div className="bg-white/10 rounded-md px-2 py-1 text-center min-w-[60px]">
              <div className="text-base font-bold leading-none text-info-300">{Object.keys(categoryConfig).length}</div>
              <p className="text-[10px] text-primary-200 mt-0.5 uppercase tracking-wide">Cats</p>
            </div>
          </div>
        </div>

        {/* Inline filter row inside hero */}
        <div className="relative mt-3 flex flex-col sm:flex-row gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary-200 pointer-events-none" />
            <input
              type="text"
              placeholder="Search resources..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-md border border-white/20 bg-white/10 text-white placeholder-primary-200 text-sm focus:outline-none focus:ring-2 focus:ring-white/30"
            />
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Filter className="h-4 w-4 text-primary-200 hidden sm:block" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-2.5 py-2 rounded-md border border-white/20 bg-white/10 text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-white/30 [&>option]:text-stone-700"
            >
              <option value="all">All Types</option>
              {Object.entries(typeConfig).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-2.5 py-2 rounded-md border border-white/20 bg-white/10 text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-white/30 [&>option]:text-stone-700"
            >
              <option value="all">All Categories</option>
              {Object.entries(categoryConfig).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Featured Resources */}
      {featuredResources.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-4 w-4 text-warning-600" />
            <h2 className="text-sm font-bold text-stone-800 uppercase tracking-wide">Featured</h2>
            <span className="px-1.5 py-0 bg-warning-100 text-warning-700 text-[10px] font-semibold rounded-full">
              {featuredResources.length}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {featuredResources.map((resource) => (
              <FeaturedResourceCard key={resource.resourceId} resource={resource} />
            ))}
          </div>
        </div>
      )}

      {/* Resources List */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Folder className="h-4 w-4 text-stone-600" />
          <h2 className="text-sm font-bold text-stone-800 uppercase tracking-wide">All Resources</h2>
          <span className="px-1.5 py-0 bg-stone-100 text-stone-600 text-[10px] font-semibold rounded-full">
            {filteredResources.length}
          </span>
        </div>
        {filteredResources.length === 0 ? (
          <Card className="text-center py-8">
            <Folder className="h-10 w-10 text-stone-300 mx-auto mb-2" />
            <h3 className="font-medium text-stone-800 mb-1">No resources found</h3>
            <p className="text-sm text-stone-500">Try adjusting your search or filters</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
            {filteredResources.map((resource) => (
              <ResourceRow key={resource.resourceId} resource={resource} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function FeaturedResourceCard({ resource }: { resource: Resource }) {
  const config = typeConfig[resource.type as ResourceType] ?? typeConfig.DOCUMENT
  const Icon = config.icon

  return (
    <Link to={ROUTES.STUDENT.RESOURCE_DETAIL.replace(':id', resource.resourceId)} className="h-full">
      <Card padding="sm" className="h-full group hover:shadow-md transition-all border-l-4 border-l-warning-400 flex flex-col">
        <div className="flex items-start gap-2.5 mb-2">
          <div className={cn(
            'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md transition-transform group-hover:scale-105',
            config.bgColor
          )}>
            <Icon className="h-4 w-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <Star className="h-3.5 w-3.5 text-warning-500 fill-warning-500 flex-shrink-0" />
              <Badge className={cn(config.color, 'font-semibold')} size="sm">{config.label}</Badge>
            </div>
            <h3 className="font-semibold text-sm text-stone-800 line-clamp-1 group-hover:text-primary-700 transition-colors">
              {resource.title}
            </h3>
          </div>
        </div>

        <p className="text-xs text-stone-500 line-clamp-2 mb-2 leading-snug flex-1">{resource.description}</p>

        <div className="flex items-center justify-between pt-2 border-t border-stone-100">
          <div className="flex items-center gap-2 text-[11px] text-stone-400">
            {resource.fileSize && (
              <span className="flex items-center gap-1">
                <Download className="h-3 w-3" />
                {formatFileSize(resource.fileSize)}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {(resource.viewCount ?? 0).toLocaleString()}
            </span>
          </div>
          <ArrowRight className="h-3.5 w-3.5 text-stone-400 group-hover:text-primary-500 group-hover:translate-x-1 transition-all" />
        </div>
      </Card>
    </Link>
  )
}

function ResourceRow({ resource }: { resource: Resource }) {
  const config = typeConfig[resource.type as ResourceType] ?? typeConfig.DOCUMENT
  const Icon = config.icon
  const categoryLabel = categoryConfig[resource.category as ResourceCategory] ?? resource.category ?? 'General'

  return (
    <Link to={ROUTES.STUDENT.RESOURCE_DETAIL.replace(':id', resource.resourceId)}>
      <Card padding="sm" className="group hover:shadow-md transition-all border-l-4 border-l-stone-200 hover:border-l-primary-400">
        <div className="flex items-center gap-2.5">
          {/* Icon */}
          <div className={cn(
            'w-9 h-9 rounded-md flex items-center justify-center flex-shrink-0 ring-2',
            config.color,
            config.color.replace('bg-', 'ring-').replace('-100', '-200')
          )}>
            <Icon className="h-4 w-4" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="font-semibold text-sm text-stone-800 group-hover:text-primary-700 transition-colors truncate">
                {resource.title}
              </h3>
              {resource.isFeatured && (
                <Star className="h-3.5 w-3.5 text-warning-500 fill-warning-500 flex-shrink-0" />
              )}
            </div>
            <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-stone-400 mt-0.5">
              <Badge className={cn(config.color, 'font-semibold')} size="sm">{config.label}</Badge>
              <span className="text-stone-500">{categoryLabel}</span>
              {resource.fileSize && (
                <span className="inline-flex items-center gap-0.5">
                  <Download className="h-3 w-3" />
                  {formatFileSize(resource.fileSize)}
                </span>
              )}
              {resource.duration && (
                <span className="inline-flex items-center gap-0.5">
                  <Clock className="h-3 w-3" />
                  {resource.duration}
                </span>
              )}
              <span className="inline-flex items-center gap-0.5">
                <Eye className="h-3 w-3" />
                {(resource.viewCount ?? 0).toLocaleString()}
              </span>
            </div>
          </div>

          <ChevronRight className="h-4 w-4 text-stone-300 group-hover:text-primary-600 transition-colors flex-shrink-0" />
        </div>
      </Card>
    </Link>
  )
}
