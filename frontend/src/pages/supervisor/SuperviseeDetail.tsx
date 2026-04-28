import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft,
  GraduationCap,
  Mail,
  Calendar,
  FileText,
  FolderOpen,
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  MessageSquare,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { useSupervisee } from '@/lib/hooks/useSupervisor'
import { ROUTES } from '@/lib/constants/routes'
import { cn } from '@/lib/utils/cn'
import type { ProjectStatus, SvProposalStatus } from '@/types'

const projectStatusConfig: Record<ProjectStatus, { label: string; color: string; bgColor: string }> = {
  NOT_STARTED: { label: 'Not Started', color: 'text-neutral-600', bgColor: 'bg-neutral-100' },
  IN_PROGRESS: { label: 'In Progress', color: 'text-primary-600', bgColor: 'bg-primary-50' },
  COMPLETED: { label: 'Completed', color: 'text-success-600', bgColor: 'bg-success-50' },
  ON_HOLD: { label: 'On Hold', color: 'text-warning-600', bgColor: 'bg-warning-50' },
  TERMINATED: { label: 'Terminated', color: 'text-error-600', bgColor: 'bg-error-50' },
}

const proposalStatusConfig: Record<SvProposalStatus, { label: string; color: string; bgColor: string }> = {
  NOT_SUBMITTED: { label: 'Not Submitted', color: 'text-neutral-600', bgColor: 'bg-neutral-100' },
  DRAFT: { label: 'Draft', color: 'text-neutral-600', bgColor: 'bg-neutral-100' },
  SUBMITTED: { label: 'Submitted', color: 'text-info-600', bgColor: 'bg-info-50' },
  UNDER_REVIEW: { label: 'Under Review', color: 'text-warning-600', bgColor: 'bg-warning-50' },
  REVISION_REQUIRED: { label: 'Revision Required', color: 'text-orange-600', bgColor: 'bg-orange-50' },
  APPROVED: { label: 'Approved', color: 'text-success-600', bgColor: 'bg-success-50' },
  REJECTED: { label: 'Rejected', color: 'text-error-600', bgColor: 'bg-error-50' },
}

const riskConfig = {
  LOW: { label: 'Low Risk', color: 'text-success-600', bgColor: 'bg-success-50' },
  MEDIUM: { label: 'Medium Risk', color: 'text-warning-600', bgColor: 'bg-warning-50' },
  HIGH: { label: 'High Risk', color: 'text-orange-600', bgColor: 'bg-orange-50' },
  CRITICAL: { label: 'Critical Risk', color: 'text-error-600', bgColor: 'bg-error-50' },
}

export function SuperviseeDetail() {
  const { id } = useParams<{ id: string }>()
  const { data: supervisee, isLoading } = useSupervisee(id ?? '')

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!supervisee) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-neutral-900">Supervisee not found</h2>
        <p className="text-neutral-600 mt-2">The supervisee you're looking for doesn't exist.</p>
        <Link to={ROUTES.SUPERVISOR.SUPERVISEES}>
          <Button className="mt-4">Back to Supervisees</Button>
        </Link>
      </div>
    )
  }

  const projectStatus = projectStatusConfig[supervisee.projectStatus]
  const proposalStatus = proposalStatusConfig[supervisee.proposalStatus]
  const risk = riskConfig[supervisee.riskLevel]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to={ROUTES.SUPERVISOR.SUPERVISEES}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Supervisees
          </Button>
        </Link>
      </div>

      {/* Risk Alert (if applicable) */}
      {(supervisee.riskLevel === 'HIGH' || supervisee.riskLevel === 'CRITICAL') && (
        <div className={cn('p-4 rounded-lg flex items-center gap-3', risk.bgColor)}>
          <AlertTriangle className={cn('h-6 w-6', risk.color)} />
          <div>
            <p className={cn('font-semibold', risk.color)}>{risk.label}</p>
            <p className="text-sm text-neutral-600">
              This student may need additional attention. Consider scheduling a check-in meeting.
            </p>
          </div>
          <Link to={ROUTES.SUPERVISOR.MEETING_NEW} className="ml-auto">
            <Button size="sm">Schedule Meeting</Button>
          </Link>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Student Info */}
        <div className="lg:col-span-1 space-y-6">
          {/* Profile Card */}
          <Card className="p-6">
            <div className="text-center">
              <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <GraduationCap className="h-10 w-10 text-primary-600" />
              </div>
              <h2 className="text-xl font-semibold text-neutral-900">{supervisee.fullName}</h2>
              <p className="text-neutral-600">{supervisee.program}</p>
              <p className="text-sm text-neutral-500">Year {supervisee.year}</p>
            </div>

            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-500">Student ID</span>
                <span className="text-sm font-medium">{supervisee.studentId}</span>
              </div>
              {supervisee.cgpa && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-500">CGPA</span>
                  <span className={cn(
                    'text-sm font-medium',
                    supervisee.cgpa >= 3.5 ? 'text-success-600' :
                    supervisee.cgpa >= 3.0 ? 'text-primary-600' :
                    supervisee.cgpa >= 2.5 ? 'text-warning-600' : 'text-error-600'
                  )}>
                    {supervisee.cgpa.toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2 pt-2">
                <Mail className="h-4 w-4 text-neutral-400" />
                <a
                  href={`mailto:${supervisee.email}`}
                  className="text-sm text-primary-600 hover:underline"
                >
                  {supervisee.email}
                </a>
              </div>
            </div>

            {/* Status Badges */}
            <div className="mt-4 pt-4 border-t border-neutral-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-500">Project Status</span>
                <span className={cn(
                  'px-2 py-0.5 rounded-full text-xs font-medium',
                  projectStatus.bgColor,
                  projectStatus.color
                )}>
                  {projectStatus.label}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-500">Risk Level</span>
                <span className={cn(
                  'px-2 py-0.5 rounded-full text-xs font-medium',
                  risk.bgColor,
                  risk.color
                )}>
                  {risk.label}
                </span>
              </div>
            </div>
          </Card>

          {/* Timeline Card */}
          <Card className="p-6">
            <h3 className="font-semibold text-neutral-900 mb-4">Timeline</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-neutral-500">Started</span>
                <span className="font-medium">
                  {new Date(supervisee.supervisionStartDate).toLocaleDateString('en-MY', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-500">Expected Completion</span>
                <span className="font-medium">
                  {new Date(supervisee.expectedCompletionDate).toLocaleDateString('en-MY', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
              {supervisee.lastMeetingDate && (
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500">Last Meeting</span>
                  <span className="font-medium">
                    {new Date(supervisee.lastMeetingDate).toLocaleDateString('en-MY', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </span>
                </div>
              )}
              {supervisee.nextMeetingDate && (
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500">Next Meeting</span>
                  <span className="font-medium text-primary-600">
                    {new Date(supervisee.nextMeetingDate).toLocaleDateString('en-MY', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </span>
                </div>
              )}
            </div>
          </Card>

          {/* Quick Actions */}
          <Card className="p-6">
            <h3 className="font-semibold text-neutral-900 mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <Link to={ROUTES.SUPERVISOR.MEETING_NEW} className="block">
                <Button variant="secondary" className="w-full justify-start">
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Meeting
                </Button>
              </Link>
              <Button variant="secondary" className="w-full justify-start">
                <MessageSquare className="h-4 w-4 mr-2" />
                Send Message
              </Button>
              <Link to={ROUTES.SUPERVISOR.LOGS} className="block">
                <Button variant="secondary" className="w-full justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  Review Logs
                </Button>
              </Link>
            </div>
          </Card>
        </div>

        {/* Right Column - Project Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Project Info */}
          <Card className="p-6">
            <h3 className="font-semibold text-neutral-900 mb-4">Project Information</h3>
            <h4 className="text-lg font-medium text-neutral-800">{supervisee.projectTitle}</h4>

            {/* Proposal Status */}
            <div className="mt-4 flex items-center gap-3">
              <span className="text-sm text-neutral-500">Proposal:</span>
              <span className={cn(
                'px-2.5 py-1 rounded-full text-xs font-medium',
                proposalStatus.bgColor,
                proposalStatus.color
              )}>
                {proposalStatus.label}
              </span>
              {supervisee.proposalStatus !== 'NOT_SUBMITTED' && (
                <Link to={ROUTES.SUPERVISOR.PROPOSALS}>
                  <Button variant="ghost" size="sm">
                    View Proposal
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </Button>
                </Link>
              )}
            </div>
          </Card>

          {/* Progress Overview */}
          <Card className="p-6">
            <h3 className="font-semibold text-neutral-900 mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-neutral-400" />
              Progress Overview
            </h3>

            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-neutral-600">Overall Progress</span>
                <span className="text-sm font-semibold">{supervisee.overallProgress}%</span>
              </div>
              <div className="h-3 bg-neutral-100 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    supervisee.overallProgress >= 75 ? 'bg-success-500' :
                    supervisee.overallProgress >= 50 ? 'bg-primary-500' :
                    supervisee.overallProgress >= 25 ? 'bg-warning-500' : 'bg-error-500'
                  )}
                  style={{ width: `${supervisee.overallProgress}%` }}
                />
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-neutral-50 rounded-lg">
                <Calendar className="h-5 w-5 text-primary-500 mx-auto mb-1" />
                <p className="text-2xl font-bold text-neutral-900">{supervisee.totalMeetings}</p>
                <p className="text-xs text-neutral-500">Meetings</p>
              </div>
              <div className="text-center p-3 bg-neutral-50 rounded-lg">
                <FileText className="h-5 w-5 text-accent-500 mx-auto mb-1" />
                <p className="text-2xl font-bold text-neutral-900">{supervisee.totalLogs}</p>
                <p className="text-xs text-neutral-500">Logs Submitted</p>
              </div>
              <div className="text-center p-3 bg-neutral-50 rounded-lg">
                <Clock className="h-5 w-5 text-warning-500 mx-auto mb-1" />
                <p className="text-2xl font-bold text-warning-600">{supervisee.pendingLogs}</p>
                <p className="text-xs text-neutral-500">Pending Review</p>
              </div>
              <div className="text-center p-3 bg-neutral-50 rounded-lg">
                <FolderOpen className="h-5 w-5 text-success-500 mx-auto mb-1" />
                <p className="text-2xl font-bold text-neutral-900">{supervisee.documentsCount}</p>
                <p className="text-xs text-neutral-500">Documents</p>
              </div>
            </div>
          </Card>

          {/* Action Items */}
          {supervisee.pendingLogs > 0 && (
            <Card className="p-6 bg-warning-50 border-warning-200">
              <h3 className="font-semibold text-warning-800 mb-3 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Action Required
              </h3>
              <p className="text-warning-700 mb-4">
                {supervisee.fullName} has {supervisee.pendingLogs} supervision log{supervisee.pendingLogs > 1 ? 's' : ''} awaiting your review.
              </p>
              <Link to={ROUTES.SUPERVISOR.LOGS}>
                <Button size="sm">
                  <FileText className="h-4 w-4 mr-2" />
                  Review Logs
                </Button>
              </Link>
            </Card>
          )}

          {/* Recent Activity - Placeholder */}
          <Card className="p-6">
            <h3 className="font-semibold text-neutral-900 mb-4">Recent Activity</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-neutral-50 rounded-lg">
                <FileText className="h-5 w-5 text-primary-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-neutral-900">Weekly Log Submitted</p>
                  <p className="text-xs text-neutral-500">Week 3 log submitted on Jan 19, 2025</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-neutral-50 rounded-lg">
                <Calendar className="h-5 w-5 text-success-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-neutral-900">Meeting Completed</p>
                  <p className="text-xs text-neutral-500">Progress review meeting on Jan 15, 2025</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-neutral-50 rounded-lg">
                <FolderOpen className="h-5 w-5 text-accent-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-neutral-900">Document Uploaded</p>
                  <p className="text-xs text-neutral-500">Progress Report uploaded on Jan 10, 2025</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
