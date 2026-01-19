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
} from 'lucide-react'
import { Card, Button, Badge, Spinner, Input } from '@/components/ui'
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

const typeConfig: Record<ResourceType, { label: string; color: string; icon: typeof FileText }> = {
  GUIDELINE: { label: 'Guideline', color: 'bg-primary-100 text-primary-700', icon: BookOpen },
  TEMPLATE: { label: 'Template', color: 'bg-success-100 text-success-700', icon: FileText },
  VIDEO: { label: 'Video', color: 'bg-error-100 text-error-700', icon: Video },
  DOCUMENT: { label: 'Document', color: 'bg-warning-100 text-warning-700', icon: FileText },
  LINK: { label: 'Link', color: 'bg-info-100 text-info-700', icon: ExternalLink },
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Resources Hub</h1>
          <p className="text-neutral-600 mt-1">Guidelines, templates, and helpful materials for your FYP</p>
        </div>
        <Link to={ROUTES.STUDENT.DEADLINES}>
          <Button variant="secondary" leftIcon={<Clock className="h-4 w-4" />}>
            View Deadlines
          </Button>
        </Link>
      </div>

      {/* Featured Resources */}
      {featuredResources.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
            <Star className="h-5 w-5 text-warning-500" />
            Featured Resources
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {featuredResources.map((resource) => (
              <FeaturedResourceCard key={resource.resourceId} resource={resource} />
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <Card>
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search resources..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="h-4 w-4" />}
            />
          </div>
          <div className="flex flex-wrap gap-4">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Types</option>
              {Object.entries(typeConfig).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
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
      <div className="space-y-3">
        {filteredResources.map((resource) => (
          <ResourceRow key={resource.resourceId} resource={resource} />
        ))}
      </div>

      {filteredResources.length === 0 && (
        <Card className="text-center py-12">
          <Folder className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-neutral-900 mb-2">No resources found</h3>
          <p className="text-neutral-500">
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
      <Card hover className="h-full">
        <div className="flex items-start gap-3">
          <div className={cn('w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0', config.color)}>
            <Icon className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-neutral-900 line-clamp-1">{resource.title}</h3>
            <p className="text-sm text-neutral-500 line-clamp-2 mt-1">{resource.description}</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge className={config.color} size="sm">{config.label}</Badge>
              {resource.fileSize && (
                <span className="text-xs text-neutral-400">{formatFileSize(resource.fileSize)}</span>
              )}
            </div>
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
      <Card hover className="transition-all">
        <div className="flex items-center gap-4">
          {/* Icon */}
          <div className={cn('w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0', config.color)}>
            <Icon className="h-6 w-6" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-neutral-900">{resource.title}</h3>
              {resource.isFeatured && (
                <Star className="h-4 w-4 text-warning-500 fill-warning-500" />
              )}
            </div>
            <p className="text-sm text-neutral-500 line-clamp-1">{resource.description}</p>
          </div>

          {/* Meta */}
          <div className="hidden sm:flex items-center gap-4 text-sm text-neutral-500">
            <Badge className={config.color} size="sm">{config.label}</Badge>
            <span>{categoryConfig[resource.category]}</span>
            {resource.fileSize && <span>{formatFileSize(resource.fileSize)}</span>}
            {resource.duration && <span>{resource.duration}</span>}
          </div>

          <ChevronRight className="h-4 w-4 text-neutral-400" />
        </div>
      </Card>
    </Link>
  )
}
