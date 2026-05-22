import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft,
  FolderKanban,
  User,
  GraduationCap,
  Mail,
  Calendar,
  Clock,
  FileText,
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  TrendingUp,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { useProjectDetail } from '@/lib/hooks/useCommittee'
import { ROUTES } from '@/lib/constants/routes'
import { cn } from '@/lib/utils/cn'

type StatusEntry = { label: string; color: string; bgColor: string }
const DEFAULT_PROJECT_STATUS: StatusEntry = { label: 'Unknown', color: 'text-neutral-600', bgColor: 'bg-neutral-100' }
const DEFAULT_PAIRING_STATUS: StatusEntry = { label: 'Unknown', color: 'text-neutral-600', bgColor: 'bg-neutral-100' }

const projectStatusConfig: Record<string, StatusEntry> = {
  ACTIVE: { label: 'Active', color: 'text-info-600', bgColor: 'bg-info-50' },
  COMPLETED: { label: 'Completed', color: 'text-success-600', bgColor: 'bg-success-50' },
  SUSPENDED: { label: 'Suspended', color: 'text-warning-600', bgColor: 'bg-warning-50' },
  DROPPED: { label: 'Dropped', color: 'text-error-600', bgColor: 'bg-error-50' },
}
const getProjectStatusConfig = (key: string | undefined): StatusEntry => (key && projectStatusConfig[key]) || DEFAULT_PROJECT_STATUS

const pairingStatusConfig: Record<string, StatusEntry> = {
  UNPAIRED: { label: 'Unpaired', color: 'text-error-600', bgColor: 'bg-error-50' },
  PENDING_APPROVAL: { label: 'Pending Approval', color: 'text-warning-600', bgColor: 'bg-warning-50' },
  PAIRED: { label: 'Paired', color: 'text-success-600', bgColor: 'bg-success-50' },
}
const getPairingStatusConfig = (key: string | undefined): StatusEntry => (key && pairingStatusConfig[key]) || DEFAULT_PAIRING_STATUS

const riskConfig = {
  LOW: { label: 'Low Risk', color: 'text-success-600', bgColor: 'bg-success-50', icon: CheckCircle },
  MEDIUM: { label: 'Medium Risk', color: 'text-warning-600', bgColor: 'bg-warning-50', icon: AlertTriangle },
  HIGH: { label: 'High Risk', color: 'text-error-600', bgColor: 'bg-error-50', icon: AlertTriangle },
}

export function ProjectDetail() {
  const { id } = useParams<{ id: string }>()
  const { data: project, isLoading } = useProjectDetail(Number(id))

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-neutral-900">Project not found</h2>
        <p className="text-neutral-600 mt-2">The project you're looking for doesn't exist.</p>
        <Link to={ROUTES.COMMITTEE.PROJECTS}>
          <Button className="mt-4">Back to Projects</Button>
        </Link>
      </div>
    )
  }

  const projectStatus = getProjectStatusConfig(project.projectStatus)
  const pairingStatus = getPairingStatusConfig(project.pairingStatus)
  const risk = riskConfig[project.riskLevel]
  const RiskIcon = risk.icon

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to={ROUTES.COMMITTEE.PROJECTS}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Button>
        </Link>
      </div>

      {/* Project Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
            <FolderKanban className="h-7 w-7 text-primary-600" />
            {project.title || 'Untitled Project'}
          </h1>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className={cn(
              'px-2 py-0.5 rounded-full text-xs font-medium',
              pairingStatus.bgColor,
              pairingStatus.color
            )}>
              {pairingStatus.label}
            </span>
            <span className={cn(
              'px-2 py-0.5 rounded-full text-xs font-medium',
              projectStatus.bgColor,
              projectStatus.color
            )}>
              {projectStatus.label}
            </span>
            <span className="px-2 py-0.5 bg-neutral-100 text-neutral-600 rounded-full text-xs font-medium">
              {project.cycle}
            </span>
            <span className="px-2 py-0.5 bg-neutral-100 text-neutral-600 rounded-full text-xs font-medium">
              {project.programme}
            </span>
          </div>
        </div>

        {/* Risk Badge */}
        <div className={cn(
          'flex items-center gap-2 px-4 py-2 rounded-lg',
          risk.bgColor
        )}>
          <RiskIcon className={cn('h-5 w-5', risk.color)} />
          <span className={cn('font-medium', risk.color)}>{risk.label}</span>
        </div>
      </div>

      {/* Progress Overview */}
      <Card>
        <h3 className="font-semibold text-neutral-900 mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary-600" />
          Progress Overview
        </h3>

        <div className="flex items-center gap-6">
          {/* Progress Circle */}
          <div className="relative w-24 h-24 flex-shrink-0">
            <svg className="w-24 h-24 transform -rotate-90">
              <circle
                className="text-neutral-200"
                strokeWidth="8"
                stroke="currentColor"
                fill="transparent"
                r="42"
                cx="48"
                cy="48"
              />
              <circle
                className={cn(
                  project.progress >= 70 ? 'text-success-500' :
                  project.progress >= 40 ? 'text-warning-500' : 'text-error-500'
                )}
                strokeWidth="8"
                strokeDasharray={`${project.progress * 2.64} 264`}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
                r="42"
                cx="48"
                cy="48"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold">
              {project.progress}%
            </span>
          </div>

          {/* Milestones */}
          <div className="flex-1">
            <h4 className="text-sm font-medium text-neutral-700 mb-3">Milestones</h4>
            <div className="space-y-2">
              {(project.milestones || []).map((milestone) => (
                <div key={milestone.milestoneId} className="flex items-center gap-3">
                  <div className={cn(
                    'w-4 h-4 rounded-full flex items-center justify-center',
                    milestone.status === 'COMPLETED' ? 'bg-success-500' :
                    milestone.status === 'IN_PROGRESS' ? 'bg-info-500' : 'bg-neutral-300'
                  )}>
                    {milestone.status === 'COMPLETED' && (
                      <CheckCircle className="h-3 w-3 text-white" />
                    )}
                  </div>
                  <span className={cn(
                    'text-sm',
                    milestone.status === 'COMPLETED' ? 'text-neutral-500 line-through' : 'text-neutral-700'
                  )}>
                    {milestone.title}
                  </span>
                  {milestone.dueDate && (
                    <span className="text-xs text-neutral-400 ml-auto">
                      Due: {new Date(milestone.dueDate).toLocaleDateString()}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Student & Supervisor Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Student Card */}
        <Card>
          <h3 className="font-semibold text-neutral-900 mb-4 flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary-600" />
            Student Information
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                <GraduationCap className="h-6 w-6 text-primary-600" />
              </div>
              <div>
                <p className="font-medium text-neutral-900">{project.studentName}</p>
                <p className="text-sm text-neutral-500">{project.studentId}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-neutral-600">
              <Mail className="h-4 w-4" />
              <a href={`mailto:${project.studentEmail}`} className="hover:text-primary-600">
                {project.studentEmail}
              </a>
            </div>
            <div className="flex items-center gap-2 text-sm text-neutral-600">
              <Calendar className="h-4 w-4" />
              <span>Registered: {new Date(project.registeredAt).toLocaleDateString()}</span>
            </div>
          </div>
        </Card>

        {/* Supervisor Card */}
        <Card>
          <h3 className="font-semibold text-neutral-900 mb-4 flex items-center gap-2">
            <User className="h-5 w-5 text-primary-600" />
            Supervisor Information
          </h3>
          {project.supervisorId ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-accent-100 rounded-full flex items-center justify-center">
                  <User className="h-6 w-6 text-accent-600" />
                </div>
                <div>
                  <p className="font-medium text-neutral-900">{project.supervisorName}</p>
                  <p className="text-sm text-neutral-500">{project.supervisorDepartment}</p>
                </div>
              </div>
              {project.supervisorEmail && (
                <div className="flex items-center gap-2 text-sm text-neutral-600">
                  <Mail className="h-4 w-4" />
                  <a href={`mailto:${project.supervisorEmail}`} className="hover:text-primary-600">
                    {project.supervisorEmail}
                  </a>
                </div>
              )}
              {project.pairedAt && (
                <div className="flex items-center gap-2 text-sm text-neutral-600">
                  <Calendar className="h-4 w-4" />
                  <span>Paired: {new Date(project.pairedAt).toLocaleDateString()}</span>
                </div>
              )}
              <Link to={ROUTES.COMMITTEE.SUPERVISOR_LOAD_DETAIL.replace(':id', project.supervisorId)}>
                <Button variant="secondary" size="sm" className="mt-2">
                  <ExternalLink className="h-4 w-4 mr-1" />
                  View Supervisor Load
                </Button>
              </Link>
            </div>
          ) : (
            <div className="text-center py-6">
              <User className="h-10 w-10 text-neutral-300 mx-auto mb-2" />
              <p className="text-neutral-500">No supervisor assigned</p>
              <Link to={ROUTES.COMMITTEE.UNPAIRED_STUDENTS}>
                <Button variant="secondary" size="sm" className="mt-3">
                  View Unpaired Students
                </Button>
              </Link>
            </div>
          )}
        </Card>
      </div>

      {/* Project Description */}
      {project.description && (
        <Card>
          <h3 className="font-semibold text-neutral-900 mb-3 flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary-600" />
            Project Description
          </h3>
          <p className="text-neutral-600 whitespace-pre-wrap">{project.description}</p>
        </Card>
      )}

      {/* Activity & Meetings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Recent Meetings */}
        <Card>
          <h3 className="font-semibold text-neutral-900 mb-4 flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary-600" />
            Recent Meetings
          </h3>
          {(project.recentMeetings?.length ?? 0) > 0 ? (
            <div className="space-y-3">
              {(project.recentMeetings || []).map((meeting) => (
                <div key={meeting.meetingId} className="p-3 bg-neutral-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-neutral-900">{meeting.title}</span>
                    <span className={cn(
                      'px-2 py-0.5 rounded-full text-xs font-medium',
                      meeting.status === 'COMPLETED' ? 'bg-success-50 text-success-700' :
                      meeting.status === 'SCHEDULED' ? 'bg-info-50 text-info-700' :
                      'bg-error-50 text-error-700'
                    )}>
                      {meeting.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-neutral-500">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{new Date(meeting.scheduledAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-neutral-500 text-sm">No meetings scheduled yet</p>
          )}
        </Card>

        {/* Submissions */}
        <Card>
          <h3 className="font-semibold text-neutral-900 mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary-600" />
            Recent Submissions
          </h3>
          {(project.submissions?.length ?? 0) > 0 ? (
            <div className="space-y-3">
              {(project.submissions || []).map((submission) => (
                <div key={submission.submissionId} className="p-3 bg-neutral-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-neutral-900">{submission.title}</span>
                    <span className={cn(
                      'px-2 py-0.5 rounded-full text-xs font-medium',
                      submission.status === 'APPROVED' ? 'bg-success-50 text-success-700' :
                      submission.status === 'PENDING' ? 'bg-warning-50 text-warning-700' :
                      submission.status === 'REJECTED' ? 'bg-error-50 text-error-700' :
                      'bg-info-50 text-info-700'
                    )}>
                      {submission.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-neutral-500">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Submitted: {new Date(submission.submittedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-neutral-500 text-sm">No submissions yet</p>
          )}
        </Card>
      </div>

      {/* Risk Factors */}
      {project.riskFactors && project.riskFactors.length > 0 && (
        <Card className="border-l-4 border-l-warning-500">
          <h3 className="font-semibold text-neutral-900 mb-3 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning-600" />
            Risk Factors
          </h3>
          <ul className="space-y-2">
            {project.riskFactors.map((factor, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-neutral-600">
                <span className="text-warning-500 mt-1">•</span>
                {factor}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button variant="secondary">
          <Mail className="h-4 w-4 mr-2" />
          Contact Student
        </Button>
        {project.supervisorEmail && (
          <Button variant="secondary">
            <Mail className="h-4 w-4 mr-2" />
            Contact Supervisor
          </Button>
        )}
      </div>
    </div>
  )
}
