import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Download,
  ExternalLink,
  BookOpen,
  FileText,
  Video,
  Clock,
  Eye,
  Calendar,
  Share2,
  Star,
  Play,
} from 'lucide-react'
import { Card, Button, Badge, Spinner } from '@/components/ui'
import { useResourceDetail, useDownloadResource } from '@/lib/hooks/useStudent'
import { ROUTES } from '@/lib/constants/routes'
import { cn } from '@/lib/utils/cn'
import type { Resource } from '@/types'

type ResourceType = 'GUIDELINE' | 'TEMPLATE' | 'VIDEO' | 'DOCUMENT' | 'LINK'
type ResourceCategory = 'GENERAL' | 'PROPOSAL' | 'REPORT' | 'PRESENTATION' | 'SUBMISSION'

// Optional fields the backend may return on a resource detail payload that are
// not part of the shared Resource list shape.
interface ResourceContentSection {
  title: string
  description: string
}

interface ResourceRelatedResource {
  id: string
  type: string
  title: string
}

interface ResourceDetailExtras {
  externalUrl?: string
  duration?: string
  viewCount?: number
  fileName?: string | null
  content?: {
    sections?: ResourceContentSection[]
    relatedResources?: ResourceRelatedResource[]
  }
}

type ResourceDetailData = Resource & ResourceDetailExtras

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

export function ResourceDetail() {
  const { id } = useParams<{ id: string }>()

  const { data: resource, isLoading } = useResourceDetail(id || '')
  const downloadMutation = useDownloadResource()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" label="Loading resource..." />
      </div>
    )
  }

  if (!resource) {
    return (
      <div className="max-w-3xl mx-auto space-y-3 lg:space-y-4">
        <Link
          to={ROUTES.STUDENT.RESOURCES}
          className="inline-flex items-center gap-2 text-neutral-600 hover:text-primary-600 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Resources
        </Link>
        <Card className="text-center py-16">
          <h2 className="text-lg font-semibold text-neutral-900 mb-2">Resource not found</h2>
          <p className="text-neutral-500">It may have been removed or you don't have access.</p>
        </Card>
      </div>
    )
  }

  const displayResource = resource as ResourceDetailData
  const config = typeConfig[displayResource.type as ResourceType] ?? typeConfig.DOCUMENT
  const Icon = config.icon
  const categoryLabel = categoryConfig[displayResource.category as ResourceCategory] ?? displayResource.category ?? 'General'
  const updatedAtLabel = displayResource.updatedAt
    ? new Date(displayResource.updatedAt).toLocaleDateString('en-MY')
    : null

  return (
    <div className="max-w-3xl mx-auto space-y-3 lg:space-y-4">
      {/* Back Button */}
      <Link
        to={ROUTES.STUDENT.RESOURCES}
        className="inline-flex items-center gap-2 text-neutral-600 hover:text-primary-600 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Resources
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        <div className={cn('w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0', config.color)}>
          <Icon className="h-8 w-8" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-2xl font-bold text-neutral-900">{displayResource.title}</h1>
            {displayResource.isFeatured && (
              <Star className="h-5 w-5 text-warning-500 fill-warning-500" />
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={config.color}>{config.label}</Badge>
            <Badge variant="default">{categoryLabel}</Badge>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Content */}
        <div className="lg:col-span-2 space-y-3 lg:space-y-4">
          {/* Description */}
          <Card>
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">About this Resource</h2>
            <p className="text-neutral-700">{displayResource.description}</p>
          </Card>

          {/* Video Embed (for video type) */}
          {displayResource.type === 'VIDEO' && displayResource.externalUrl && (
            <Card className="bg-neutral-900">
              <div className="aspect-video flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
                    <Play className="h-10 w-10 text-white ml-1" />
                  </div>
                  <a
                    href={displayResource.externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white hover:underline"
                  >
                    Watch on YouTube
                  </a>
                </div>
              </div>
            </Card>
          )}

          {/* Document Preview */}
          {displayResource.fileUrl && displayResource.type !== 'VIDEO' && (
            <Card>
              <h2 className="text-lg font-semibold text-neutral-900 mb-4">Document Preview</h2>
              <div className={cn(
                'w-full h-64 rounded-lg flex flex-col items-center justify-center',
                config.color
              )}>
                <Icon className="h-16 w-16 mb-4" />
                <p className="font-medium text-lg">{displayResource.title}</p>
                <p className="text-sm opacity-75 mt-1">{formatFileSize(displayResource.fileSize!)}</p>
              </div>
            </Card>
          )}

          {/* Content Sections */}
          {displayResource.content?.sections && (
            <Card>
              <h2 className="text-lg font-semibold text-neutral-900 mb-4">What's Inside</h2>
              <div className="space-y-3">
                {displayResource.content.sections.map((section, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 bg-neutral-50 rounded-lg"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0 text-sm font-bold text-primary-600">
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="font-medium text-neutral-900">{section.title}</h4>
                      <p className="text-sm text-neutral-600">{section.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Related Resources */}
          {displayResource.content?.relatedResources && (
            <Card>
              <h2 className="text-lg font-semibold text-neutral-900 mb-4">Related Resources</h2>
              <div className="space-y-2">
                {displayResource.content.relatedResources.map((related) => {
                  const relatedConfig = typeConfig[related.type as ResourceType] ?? typeConfig.DOCUMENT
                  const RelatedIcon = relatedConfig.icon
                  return (
                    <Link
                      key={related.id}
                      to={ROUTES.STUDENT.RESOURCE_DETAIL.replace(':id', related.id)}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-neutral-50 transition-colors"
                    >
                      <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', relatedConfig.color)}>
                        <RelatedIcon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-neutral-900">{related.title}</p>
                        <p className="text-xs text-neutral-500">{relatedConfig.label}</p>
                      </div>
                      <ExternalLink className="h-4 w-4 text-neutral-400" />
                    </Link>
                  )
                })}
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-3 lg:space-y-4">
          {/* Download / Open */}
          <Card>
            <h3 className="text-sm font-medium text-neutral-500 mb-3">Actions</h3>
            <div className="space-y-2">
              {displayResource.fileUrl && (
                <Button
                  variant="primary"
                  className="w-full"
                  leftIcon={<Download className="h-4 w-4" />}
                  onClick={() =>
                    downloadMutation.mutate({
                      resourceId: displayResource.resourceId,
                      fileName: displayResource.fileName ?? displayResource.title,
                    })
                  }
                  disabled={downloadMutation.isPending}
                >
                  {downloadMutation.isPending ? 'Downloading…' : 'Download'}
                </Button>
              )}
              {displayResource.externalUrl && (
                <a href={displayResource.externalUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="primary" className="w-full" leftIcon={<ExternalLink className="h-4 w-4" />}>
                    Open Link
                  </Button>
                </a>
              )}
              <Button variant="ghost" className="w-full" leftIcon={<Share2 className="h-4 w-4" />}>
                Share
              </Button>
            </div>
          </Card>

          {/* Info */}
          <Card>
            <h3 className="text-sm font-medium text-neutral-500 mb-3">Details</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-neutral-400" />
                <span className="text-neutral-600">{(displayResource.viewCount ?? 0).toLocaleString()} views</span>
              </div>
              {displayResource.fileSize && (
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-neutral-400" />
                  <span className="text-neutral-600">{formatFileSize(displayResource.fileSize)}</span>
                </div>
              )}
              {displayResource.duration && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-neutral-400" />
                  <span className="text-neutral-600">{displayResource.duration}</span>
                </div>
              )}
              {updatedAtLabel && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-neutral-400" />
                  <span className="text-neutral-600">Updated {updatedAtLabel}</span>
                </div>
              )}
            </div>
          </Card>

          {/* Help */}
          <Card className="bg-primary-50 border-primary-200">
            <h3 className="font-medium text-primary-900 mb-2">Need Help?</h3>
            <p className="text-sm text-primary-700 mb-3">
              If you have questions about this resource, contact the FYP Committee.
            </p>
            <Link to={ROUTES.STUDENT.CHATBOT}>
              <Button variant="secondary" size="sm" className="w-full">
                Ask Chatbot
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    </div>
  )
}
