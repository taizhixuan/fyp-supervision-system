import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  FileText,
  Download,
  Eye,
  Clock,
  GitBranch,
} from 'lucide-react'
import { Card, Button, Badge, Spinner } from '@/components/ui'
import { useProposalVersions } from '@/lib/hooks/useStudent'
import { ROUTES } from '@/lib/constants/routes'
import { cn } from '@/lib/utils/cn'
import type { ProposalStatus } from '@/types'

// Sample data for design preview
const SAMPLE_VERSIONS = [
  {
    versionId: '3',
    proposalId: '1',
    version: 3,
    title: 'AI-Powered Student Supervision System',
    status: 'DRAFT' as ProposalStatus,
    submittedAt: undefined,
    fileUrl: '#',
    changes: 'Updated methodology section based on supervisor feedback',
    createdAt: '2025-01-20T10:00:00Z',
  },
  {
    versionId: '2',
    proposalId: '1',
    version: 2,
    title: 'AI-Powered Student Supervision System',
    status: 'REVISION_REQUIRED' as ProposalStatus,
    submittedAt: '2025-01-15T14:30:00Z',
    fileUrl: '#',
    changes: 'Added detailed objectives and refined scope',
    createdAt: '2025-01-15T14:30:00Z',
  },
  {
    versionId: '1',
    proposalId: '1',
    version: 1,
    title: 'AI-Powered Student Supervision System',
    status: 'REJECTED' as ProposalStatus,
    submittedAt: '2025-01-10T09:00:00Z',
    fileUrl: '#',
    changes: 'Initial proposal submission',
    createdAt: '2025-01-10T09:00:00Z',
  },
]

const statusColors: Record<ProposalStatus, string> = {
  DRAFT: 'bg-neutral-100 text-neutral-700',
  SUBMITTED: 'bg-primary-100 text-primary-700',
  UNDER_REVIEW: 'bg-warning-100 text-warning-700',
  REVISION_REQUIRED: 'bg-error-100 text-error-700',
  APPROVED: 'bg-success-100 text-success-700',
  REJECTED: 'bg-error-100 text-error-700',
}

export function ProposalHistory() {
  const { data, isLoading } = useProposalVersions()

  // Use sample data if no API data
  const versions = data?.versions || SAMPLE_VERSIONS

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" label="Loading versions..." />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link
        to={ROUTES.STUDENT.PROPOSAL}
        className="inline-flex items-center gap-2 text-neutral-600 hover:text-primary-600 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Proposal
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Proposal Version History</h1>
        <p className="text-neutral-600 mt-1">
          View all versions of your proposal and track changes
        </p>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Timeline Line */}
        <div className="absolute left-[23px] top-0 bottom-0 w-0.5 bg-neutral-200" />

        {/* Versions */}
        <div className="space-y-6">
          {versions.map((version, index) => (
            <div key={version.versionId} className="relative flex gap-4">
              {/* Timeline Dot */}
              <div
                className={cn(
                  'relative z-10 w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0',
                  index === 0 ? 'bg-primary-100' : 'bg-neutral-100'
                )}
              >
                <GitBranch
                  className={cn(
                    'h-5 w-5',
                    index === 0 ? 'text-primary-600' : 'text-neutral-500'
                  )}
                />
              </div>

              {/* Version Card */}
              <Card className={cn('flex-1', index === 0 && 'ring-2 ring-primary-200')}>
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-neutral-900">
                        Version {version.version}
                      </h3>
                      <Badge className={statusColors[version.status]} size="sm">
                        {version.status.replace(/_/g, ' ')}
                      </Badge>
                      {index === 0 && (
                        <Badge variant="primary" size="sm">Current</Badge>
                      )}
                    </div>

                    <p className="text-sm text-neutral-700 mb-2">{version.title}</p>

                    {version.changes && (
                      <p className="text-sm text-neutral-500 italic">
                        "{version.changes}"
                      </p>
                    )}

                    <div className="mt-3 flex items-center gap-4 text-xs text-neutral-500">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Created: {new Date(version.createdAt).toLocaleDateString('en-MY', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      {version.submittedAt && (
                        <span>
                          Submitted: {new Date(version.submittedAt).toLocaleDateString('en-MY', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    {version.fileUrl && (
                      <a href={version.fileUrl} target="_blank" rel="noopener noreferrer">
                        <Button variant="secondary" size="sm" leftIcon={<Download className="h-4 w-4" />}>
                          Download
                        </Button>
                      </a>
                    )}
                    <Button variant="ghost" size="sm" leftIcon={<Eye className="h-4 w-4" />}>
                      View Details
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          ))}
        </div>
      </div>

      {versions.length === 0 && (
        <Card className="text-center py-12">
          <FileText className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
          <h2 className="text-lg font-medium text-neutral-900 mb-2">
            No versions yet
          </h2>
          <p className="text-neutral-500 mb-4">
            Start working on your proposal to create the first version
          </p>
          <Link to={ROUTES.STUDENT.PROPOSAL}>
            <Button variant="primary">Go to Proposal</Button>
          </Link>
        </Card>
      )}
    </div>
  )
}
