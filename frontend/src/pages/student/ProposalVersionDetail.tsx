import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, FileText } from 'lucide-react'
import { Card, Button, Badge, Spinner } from '@/components/ui'
import { ProposalContentSections } from '@/components/common/ProposalContentSections'
import { useProposalVersions } from '@/lib/hooks/useStudent'
import { ROUTES } from '@/lib/constants/routes'
import { cn } from '@/lib/utils/cn'
import type { ProposalStatus } from '@/types'

const statusColors: Record<ProposalStatus, string> = {
  DRAFT: 'bg-neutral-100 text-neutral-700',
  SUBMITTED: 'bg-primary-100 text-primary-700',
  UNDER_REVIEW: 'bg-warning-100 text-warning-700',
  REVISION_REQUIRED: 'bg-error-100 text-error-700',
  APPROVED: 'bg-success-100 text-success-700',
  REJECTED: 'bg-error-100 text-error-700',
}

export function ProposalVersionDetail() {
  const { versionId } = useParams<{ versionId: string }>()
  const { data, isLoading } = useProposalVersions()

  const version = (data?.versions ?? []).find((v) => String(v.versionId) === String(versionId))

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" label="Loading version..." />
      </div>
    )
  }

  if (!version) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
        <h2 className="text-lg font-medium text-neutral-900 mb-2">Version not found</h2>
        <p className="text-neutral-500 mb-4">This proposal version could not be located.</p>
        <Link to={ROUTES.STUDENT.PROPOSAL_HISTORY}>
          <Button variant="primary">Back to Version History</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-3 lg:space-y-4">
      <Link
        to={ROUTES.STUDENT.PROPOSAL_HISTORY}
        className="inline-flex items-center gap-2 text-neutral-600 hover:text-primary-600 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Version History
      </Link>

      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold text-neutral-900">Version {version.version}</h1>
        <Badge className={cn(statusColors[version.status])} size="sm">
          {version.status.replace(/_/g, ' ')}
        </Badge>
        <span className="text-sm text-neutral-500">
          {new Date(version.createdAt).toLocaleDateString('en-MY', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>

      {version.title && (
        <Card>
          <h3 className="font-semibold text-neutral-900 mb-1">Title</h3>
          <p className="text-neutral-700">{version.title}</p>
        </Card>
      )}

      {version.content ? (
        <ProposalContentSections
          content={version.content}
          downloadPath={version.fileName ? `/student/proposal/attachment?versionId=${version.versionId}` : undefined}
          fileName={version.fileName}
        />
      ) : (
        <Card className="text-center py-8">
          <p className="text-neutral-500">No detailed content is stored for this version.</p>
        </Card>
      )}
    </div>
  )
}
