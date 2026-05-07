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
import { Card, Button, Badge, Spinner } from '@/components/ui'
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

// Sample data
const SAMPLE_RESOURCES: Resource[] = [
  {
    resourceId: '1',
    title: 'FYP Guidelines 2024/2025',
    description: 'Complete guidelines for Final Year Project including timeline, requirements, and assessment criteria.',
    type: 'GUIDELINE',
    category: 'GENERAL',
    fileUrl: '/resources/fyp-guidelines.pdf',
    fileSize: 2456789,
    isFeatured: true,
    viewCount: 1250,
    createdAt: '2024-09-01T00:00:00Z',
    updatedAt: '2024-09-15T00:00:00Z',
  },
  {
    resourceId: '2',
    title: 'Proposal Template',
    description: 'Official FYP proposal template with all required sections and formatting guidelines.',
    type: 'TEMPLATE',
    category: 'PROPOSAL',
    fileUrl: '/resources/proposal-template.docx',
    fileSize: 456789,
    isFeatured: true,
    viewCount: 890,
    createdAt: '2024-09-01T00:00:00Z',
    updatedAt: '2024-09-01T00:00:00Z',
  },
  {
    resourceId: '3',
    title: 'How to Write a Problem Statement',
    description: 'Video tutorial on crafting an effective problem statement for your FYP.',
    type: 'VIDEO',
    category: 'PROPOSAL',
    externalUrl: 'https://youtube.com/watch?v=example',
    duration: '15:30',
    isFeatured: false,
    viewCount: 456,
    createdAt: '2024-10-15T00:00:00Z',
    updatedAt: '2024-10-15T00:00:00Z',
  },
  {
    resourceId: '4',
    title: 'Final Report Template',
    description: 'Complete template for FYP final report with chapter structure and formatting.',
    type: 'TEMPLATE',
    category: 'REPORT',
    fileUrl: '/resources/report-template.docx',
    fileSize: 567890,
    isFeatured: true,
    viewCount: 678,
    createdAt: '2024-09-01T00:00:00Z',
    updatedAt: '2024-09-01T00:00:00Z',
  },
  {
    resourceId: '5',
    title: 'Presentation Guidelines',
    description: 'Guidelines for FYP presentation including time limits, format, and Q&A tips.',
    type: 'GUIDELINE',
    category: 'PRESENTATION',
    fileUrl: '/resources/presentation-guidelines.pdf',
    fileSize: 234567,
    isFeatured: false,
    viewCount: 345,
    createdAt: '2024-11-01T00:00:00Z',
    updatedAt: '2024-11-01T00:00:00Z',
  },
  {
    resourceId: '6',
    title: 'Literature Review Writing Guide',
    description: 'Step-by-step guide on conducting and writing a comprehensive literature review.',
    type: 'DOCUMENT',
    category: 'REPORT',
    fileUrl: '/resources/literature-review-guide.pdf',
    fileSize: 345678,
    isFeatured: false,
    viewCount: 567,
    createdAt: '2024-10-01T00:00:00Z',
    updatedAt: '2024-10-01T00:00:00Z',
  },
  {
    resourceId: '7',
    title: 'Citation & Referencing Guide',
    description: 'Complete guide on IEEE citation format with examples.',
    type: 'DOCUMENT',
    category: 'GENERAL',
    fileUrl: '/resources/citation-guide.pdf',
    fileSize: 189012,
    isFeatured: false,
    viewCount: 890,
    createdAt: '2024-09-15T00:00:00Z',
    updatedAt: '2024-09-15T00:00:00Z',
  },
  {
    resourceId: '8',
    title: 'Turnitin Submission Guide',
    description: 'How to submit your work through Turnitin and interpret the similarity report.',
    type: 'LINK',
    category: 'SUBMISSION',
    externalUrl: 'https://turnitin.com/guides',
    isFeatured: false,
    viewCount: 234,
    createdAt: '2024-10-20T00:00:00Z',
    updatedAt: '2024-10-20T00:00:00Z',
  },
]

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
  const resources = data?.resources || SAMPLE_RESOURCES

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
    <div className="space-y-6">
      {/* Header with Gradient */}
      <div className="relative bg-gradient-to-br from-stone-800 via-stone-800 to-stone-900 rounded-2xl p-6 text-white overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-amber-500/5 rounded-full translate-y-1/2 -translate-x-1/2" />

        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-amber-500 rounded-xl flex items-center justify-center shadow-lg">
              <Library className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Resources Hub</h1>
              <p className="text-stone-300 mt-0.5">Guidelines, templates, and helpful materials</p>
            </div>
          </div>
          <Link to={ROUTES.STUDENT.DEADLINES}>
            <Button
              variant="secondary"
              leftIcon={<Clock className="h-4 w-4" />}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              View Deadlines
            </Button>
          </Link>
        </div>

        {/* Quick Stats */}
        <div className="relative mt-6 pt-6 border-t border-white/10 grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-amber-400">{resources.length}</div>
            <div className="text-sm text-stone-400">Total Resources</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-400">{featuredResources.length}</div>
            <div className="text-sm text-stone-400">Featured</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-sky-400">{Object.keys(categoryConfig).length}</div>
            <div className="text-sm text-stone-400">Categories</div>
          </div>
        </div>
      </div>

      {/* Featured Resources */}
      {featuredResources.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-amber-600" />
            </div>
            <h2 className="text-lg font-bold text-stone-800">Featured Resources</h2>
            <span className="px-2.5 py-0.5 bg-amber-100 text-amber-700 text-sm font-semibold rounded-full">
              {featuredResources.length}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {featuredResources.map((resource) => (
              <FeaturedResourceCard key={resource.resourceId} resource={resource} />
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <Card className="bg-gradient-to-r from-stone-50 to-neutral-50 border-stone-200">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-stone-400" />
            </div>
            <input
              type="text"
              placeholder="Search resources..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-stone-700 placeholder-stone-400 transition-all"
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-stone-500" />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-4 py-3 rounded-xl border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-stone-700 font-medium transition-all"
              >
                <option value="all">All Types</option>
                {Object.entries(typeConfig).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-3 rounded-xl border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-stone-700 font-medium transition-all"
            >
              <option value="all">All Categories</option>
              {Object.entries(categoryConfig).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Resources List */}
      <div className="mt-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-stone-100 rounded-lg flex items-center justify-center">
            <Folder className="h-4 w-4 text-stone-600" />
          </div>
          <h2 className="text-lg font-bold text-stone-800">All Resources</h2>
          <span className="px-2.5 py-0.5 bg-stone-100 text-stone-600 text-sm font-semibold rounded-full">
            {filteredResources.length}
          </span>
        </div>
        <div className="flex flex-col gap-5">
          {filteredResources.map((resource) => (
            <ResourceRow key={resource.resourceId} resource={resource} />
          ))}
        </div>
      </div>

      {filteredResources.length === 0 && (
        <Card className="text-center py-16 bg-gradient-to-br from-stone-50 to-neutral-50">
          <div className="w-16 h-16 bg-stone-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Folder className="h-8 w-8 text-stone-400" />
          </div>
          <h3 className="text-lg font-semibold text-stone-800 mb-2">No resources found</h3>
          <p className="text-stone-500">
            Try adjusting your search or filters
          </p>
        </Card>
      )}
    </div>
  )
}

function FeaturedResourceCard({ resource }: { resource: Resource }) {
  const config = typeConfig[resource.type]
  const Icon = config.icon

  return (
    <Link to={ROUTES.STUDENT.RESOURCE_DETAIL.replace(':id', resource.resourceId)}>
      <Card className="h-full group hover:shadow-lg transition-all duration-300 border-l-4 border-l-amber-400 overflow-hidden relative">
        {/* Background Glow */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />

        <div className="relative">
          {/* Header with Icon */}
          <div className="flex items-start gap-4 mb-3">
            <div className={cn(
              'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg transition-transform group-hover:scale-110',
              config.bgColor
            )}>
              <Icon className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-amber-500 fill-amber-500 flex-shrink-0" />
                <Badge className={cn(config.color, 'font-semibold')} size="sm">{config.label}</Badge>
              </div>
              <h3 className="font-bold text-stone-800 line-clamp-1 mt-1 group-hover:text-amber-700 transition-colors">
                {resource.title}
              </h3>
            </div>
          </div>

          {/* Description */}
          <p className="text-sm text-stone-500 line-clamp-2 mb-4">{resource.description}</p>

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-stone-100">
            <div className="flex items-center gap-3 text-xs text-stone-400">
              {resource.fileSize && (
                <span className="flex items-center gap-1">
                  <Download className="h-3 w-3" />
                  {formatFileSize(resource.fileSize)}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {resource.viewCount.toLocaleString()} views
              </span>
            </div>
            <ArrowRight className="h-4 w-4 text-stone-400 group-hover:text-amber-500 group-hover:translate-x-1 transition-all" />
          </div>
        </div>
      </Card>
    </Link>
  )
}

function ResourceRow({ resource }: { resource: Resource }) {
  const config = typeConfig[resource.type]
  const Icon = config.icon

  return (
    <Link to={ROUTES.STUDENT.RESOURCE_DETAIL.replace(':id', resource.resourceId)}>
      <Card className="group hover:shadow-md transition-all duration-200 border-l-4 border-l-stone-200 hover:border-l-amber-400 p-5">
        <div className="flex items-center gap-4">
          {/* Icon */}
          <div className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200 group-hover:scale-105 ring-2',
            config.color,
            config.color.replace('bg-', 'ring-').replace('-100', '-200')
          )}>
            <Icon className="h-5 w-5" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-stone-800 group-hover:text-amber-700 transition-colors">
                {resource.title}
              </h3>
              {resource.isFeatured && (
                <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
              )}
            </div>
            <p className="text-sm text-stone-500 line-clamp-1">{resource.description}</p>
            {/* Mobile badges */}
            <div className="flex items-center gap-2 mt-2 sm:hidden">
              <Badge className={cn(config.color, 'font-semibold')} size="sm">{config.label}</Badge>
              <span className="text-xs text-stone-400">{categoryConfig[resource.category]}</span>
            </div>
          </div>

          {/* Meta - Desktop */}
          <div className="hidden sm:flex items-center gap-3">
            <Badge className={cn(config.color, 'font-semibold')} size="sm">{config.label}</Badge>
            <span className="px-2.5 py-1 bg-stone-100 text-stone-600 text-xs font-medium rounded-lg">
              {categoryConfig[resource.category]}
            </span>
            {resource.fileSize && (
              <span className="flex items-center gap-1 text-xs text-stone-400">
                <Download className="h-3 w-3" />
                {formatFileSize(resource.fileSize)}
              </span>
            )}
            {resource.duration && (
              <span className="flex items-center gap-1 text-xs text-stone-400">
                <Clock className="h-3 w-3" />
                {resource.duration}
              </span>
            )}
            <span className="flex items-center gap-1 text-xs text-stone-400">
              <Eye className="h-3 w-3" />
              {resource.viewCount.toLocaleString()}
            </span>
          </div>

          <div className="w-8 h-8 rounded-lg bg-stone-100 group-hover:bg-amber-100 flex items-center justify-center transition-colors">
            <ChevronRight className="h-4 w-4 text-stone-400 group-hover:text-amber-600 transition-colors" />
          </div>
        </div>
      </Card>
    </Link>
  )
}
