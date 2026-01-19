import { Link } from 'react-router-dom'
import {
  Calendar,
  FileText,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  ClipboardList,
  FolderOpen,
  Bell,
  Sparkles,
} from 'lucide-react'
import { Card, Button, Badge, Spinner, AlertBanner } from '@/components/ui'
import { useStudentDashboard } from '@/lib/hooks/useStudent'
import { ROUTES } from '@/lib/constants/routes'
import { cn } from '@/lib/utils/cn'
import type { RegistrationStatus, ProposalStatus, MeetingStatus, LogStatus } from '@/types'

// Sample data for design preview
const SAMPLE_DASHBOARD = {
  profile: {
    userId: '1',
    studentId: '1201234567',
    fullName: 'Ahmad bin Abdullah',
    email: 'ahmad@student.mmu.edu.my',
    programCode: 'BIT',
    programName: 'Bachelor of Information Technology',
    faculty: 'Faculty of Computing and Informatics',
    intakeYear: 2021,
    expectedGraduation: '2025-06',
    skills: ['Python', 'React', 'Machine Learning'],
    researchInterests: ['AI', 'Web Development'],
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
  registrationStatus: {
    registrationId: '1',
    studentId: '1',
    academicYear: '2024/2025',
    semester: 1,
    cycle: 'FYP1',
    status: 'PROPOSAL_PENDING' as RegistrationStatus,
    nextSteps: [
      { step: 1, title: 'Find Supervisor', description: 'Select a supervisor', status: 'COMPLETED' as const, completedAt: '2024-09-15' },
      { step: 2, title: 'Submit Proposal', description: 'Submit your proposal', status: 'CURRENT' as const, dueDate: '2024-10-30' },
      { step: 3, title: 'Committee Review', description: 'Wait for review', status: 'PENDING' as const },
    ],
    timeline: [],
  },
  upcomingMeetings: [
    {
      meetingId: '1',
      studentId: '1',
      supervisorId: '1',
      supervisor: { supervisorId: '1', userId: '2', fullName: 'Dr. Sarah Lee', email: 'sarah@mmu.edu.my', title: 'Associate Professor', department: 'Software Engineering', faculty: 'FCI', researchAreas: ['AI', 'ML'], currentLoad: 5, maxCapacity: 8, isAcceptingStudents: true },
      title: 'Weekly Progress Review',
      agenda: 'Discuss proposal draft and timeline',
      scheduledAt: '2025-01-25T10:00:00Z',
      duration: 60,
      platform: 'ZOOM' as const,
      status: 'CONFIRMED' as MeetingStatus,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    },
    {
      meetingId: '2',
      studentId: '1',
      supervisorId: '1',
      supervisor: { supervisorId: '1', userId: '2', fullName: 'Dr. Sarah Lee', email: 'sarah@mmu.edu.my', title: 'Associate Professor', department: 'Software Engineering', faculty: 'FCI', researchAreas: ['AI', 'ML'], currentLoad: 5, maxCapacity: 8, isAcceptingStudents: true },
      title: 'Proposal Review Meeting',
      scheduledAt: '2025-02-01T14:00:00Z',
      duration: 45,
      platform: 'IN_PERSON' as const,
      location: 'Room 3.12, FCI Building',
      status: 'PENDING' as MeetingStatus,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    },
  ],
  pendingLogs: [
    {
      logId: '1',
      meetingId: '0',
      meeting: {
        meetingId: '0',
        studentId: '1',
        supervisorId: '1',
        supervisor: { supervisorId: '1', userId: '2', fullName: 'Dr. Sarah Lee', email: 'sarah@mmu.edu.my', title: 'Associate Professor', department: 'Software Engineering', faculty: 'FCI', researchAreas: ['AI', 'ML'], currentLoad: 5, maxCapacity: 8, isAcceptingStudents: true },
        title: 'Initial Meeting',
        scheduledAt: '2025-01-15T10:00:00Z',
        duration: 60,
        platform: 'ZOOM' as const,
        status: 'COMPLETED' as MeetingStatus,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      },
      studentId: '1',
      supervisorId: '1',
      discussionSummary: '',
      actionItems: [],
      status: 'DRAFT' as LogStatus,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    },
  ],
  recentDocuments: [
    { documentId: '1', studentId: '1', title: 'FYP1 Proposal Draft v1', type: 'PROPOSAL' as const, phase: 'FYP1' as const, fileName: 'proposal_v1.pdf', fileSize: 2048000, fileUrl: '#', mimeType: 'application/pdf', version: 1, uploadedAt: '2025-01-10T08:00:00Z', updatedAt: '2025-01-10T08:00:00Z' },
    { documentId: '2', studentId: '1', title: 'Literature Review Notes', type: 'OTHER' as const, phase: 'FYP1' as const, fileName: 'lit_review.docx', fileSize: 512000, fileUrl: '#', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', version: 1, uploadedAt: '2025-01-08T14:30:00Z', updatedAt: '2025-01-08T14:30:00Z' },
  ],
  upcomingDeadlines: [
    { deadlineId: '1', title: 'FYP1 Proposal Submission', dueDate: '2025-02-15T23:59:00Z', type: 'PROPOSAL' as const, phase: 'FYP1' as const, isUpcoming: true, daysRemaining: 26 },
    { deadlineId: '2', title: 'Progress Report 1', dueDate: '2025-03-01T23:59:00Z', type: 'REPORT' as const, phase: 'FYP1' as const, isUpcoming: true, daysRemaining: 40 },
    { deadlineId: '3', title: 'FYP1 Final Presentation', dueDate: '2025-04-15T23:59:00Z', type: 'PRESENTATION' as const, phase: 'FYP1' as const, isUpcoming: true, daysRemaining: 85 },
  ],
  proposalStatus: {
    proposalId: '1',
    studentId: '1',
    title: 'AI-Powered Student Supervision System',
    problemStatement: 'Manual FYP supervision processes are inefficient...',
    objectives: ['Develop an automated system', 'Implement AI recommendations'],
    scope: 'The system will cover...',
    methodology: 'Agile development methodology...',
    expectedOutcomes: ['Working prototype', 'Documentation'],
    status: 'DRAFT' as ProposalStatus,
    version: 1,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-15',
  },
  notifications: { unreadCount: 3 },
  quickStats: { totalMeetings: 4, completedLogs: 2, documentsUploaded: 5 },
}

const statusColors: Record<RegistrationStatus, string> = {
  NOT_STARTED: 'bg-neutral-100 text-neutral-700',
  SUPERVISOR_PENDING: 'bg-warning-100 text-warning-700',
  PROPOSAL_PENDING: 'bg-primary-100 text-primary-700',
  UNDER_REVIEW: 'bg-info-100 text-info-700',
  REGISTERED: 'bg-success-100 text-success-700',
  DEFERRED: 'bg-error-100 text-error-700',
}

const proposalStatusColors: Record<ProposalStatus, string> = {
  DRAFT: 'bg-neutral-100 text-neutral-700',
  SUBMITTED: 'bg-primary-100 text-primary-700',
  UNDER_REVIEW: 'bg-warning-100 text-warning-700',
  REVISION_REQUIRED: 'bg-error-100 text-error-700',
  APPROVED: 'bg-success-100 text-success-700',
  REJECTED: 'bg-error-100 text-error-700',
}

const meetingStatusColors: Record<MeetingStatus, string> = {
  PENDING: 'bg-warning-100 text-warning-700',
  CONFIRMED: 'bg-success-100 text-success-700',
  RESCHEDULED: 'bg-info-100 text-info-700',
  CANCELLED: 'bg-error-100 text-error-700',
  COMPLETED: 'bg-neutral-100 text-neutral-700',
}

export function StudentDashboard() {
  const { data, isLoading, error } = useStudentDashboard()

  // Use sample data if no API data available
  const dashboard = data || SAMPLE_DASHBOARD

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" label="Loading dashboard..." />
      </div>
    )
  }

  if (error && !dashboard) {
    return (
      <AlertBanner
        variant="error"
        title="Failed to load dashboard"
        description="Please try refreshing the page."
      />
    )
  }

  const { profile, registrationStatus, upcomingMeetings, pendingLogs, recentDocuments, upcomingDeadlines, proposalStatus, quickStats } = dashboard

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">
            Welcome back, {profile.fullName.split(' ')[0]}!
          </h1>
          <p className="text-neutral-600 mt-1">
            {profile.programName} • {registrationStatus.cycle} {registrationStatus.academicYear}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link to={ROUTES.STUDENT.NOTIFICATIONS}>
            <Button variant="secondary" size="sm" leftIcon={<Bell className="h-4 w-4" />}>
              Notifications
              {dashboard.notifications.unreadCount > 0 && (
                <Badge variant="error" size="sm" className="ml-2">
                  {dashboard.notifications.unreadCount}
                </Badge>
              )}
            </Button>
          </Link>
          <Link to={ROUTES.STUDENT.CHATBOT}>
            <Button variant="primary" size="sm" leftIcon={<Sparkles className="h-4 w-4" />}>
              AI Assistant
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="text-center">
          <div className="text-3xl font-bold text-primary-600">{quickStats.totalMeetings}</div>
          <p className="text-sm text-neutral-600 mt-1">Total Meetings</p>
        </Card>
        <Card className="text-center">
          <div className="text-3xl font-bold text-success-600">{quickStats.completedLogs}</div>
          <p className="text-sm text-neutral-600 mt-1">Completed Logs</p>
        </Card>
        <Card className="text-center">
          <div className="text-3xl font-bold text-warning-600">{pendingLogs.length}</div>
          <p className="text-sm text-neutral-600 mt-1">Pending Logs</p>
        </Card>
        <Card className="text-center">
          <div className="text-3xl font-bold text-info-600">{quickStats.documentsUploaded}</div>
          <p className="text-sm text-neutral-600 mt-1">Documents</p>
        </Card>
      </div>

      {/* Registration Progress */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-neutral-900">Registration Progress</h2>
          <Badge className={statusColors[registrationStatus.status]}>
            {registrationStatus.status.replace(/_/g, ' ')}
          </Badge>
        </div>
        <div className="flex items-center gap-2 mb-4">
          {registrationStatus.nextSteps.map((step, index) => (
            <div key={step.step} className="flex items-center">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
                  step.status === 'COMPLETED' && 'bg-success-100 text-success-700',
                  step.status === 'CURRENT' && 'bg-primary-600 text-white',
                  step.status === 'PENDING' && 'bg-neutral-100 text-neutral-500'
                )}
              >
                {step.status === 'COMPLETED' ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  step.step
                )}
              </div>
              {index < registrationStatus.nextSteps.length - 1 && (
                <div
                  className={cn(
                    'w-12 h-1 mx-1',
                    step.status === 'COMPLETED' ? 'bg-success-500' : 'bg-neutral-200'
                  )}
                />
              )}
            </div>
          ))}
        </div>
        <div className="space-y-2">
          {registrationStatus.nextSteps.map((step) => (
            <div
              key={step.step}
              className={cn(
                'flex items-center justify-between p-3 rounded-lg',
                step.status === 'CURRENT' && 'bg-primary-50 border border-primary-200'
              )}
            >
              <div>
                <p className={cn(
                  'font-medium',
                  step.status === 'CURRENT' ? 'text-primary-900' : 'text-neutral-700'
                )}>
                  {step.title}
                </p>
                <p className="text-sm text-neutral-500">{step.description}</p>
              </div>
              {step.status === 'CURRENT' && step.dueDate && (
                <Badge variant="warning" size="sm">
                  Due: {new Date(step.dueDate).toLocaleDateString('en-MY', { day: 'numeric', month: 'short' })}
                </Badge>
              )}
              {step.status === 'COMPLETED' && step.completedAt && (
                <span className="text-sm text-success-600">
                  Completed {new Date(step.completedAt).toLocaleDateString('en-MY', { day: 'numeric', month: 'short' })}
                </span>
              )}
            </div>
          ))}
        </div>
        <div className="mt-4">
          <Link to={ROUTES.STUDENT.REGISTRATION_STATUS}>
            <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="h-4 w-4" />}>
              View Full Status
            </Button>
          </Link>
        </div>
      </Card>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Proposal Status */}
        {proposalStatus && (
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-neutral-900">My Proposal</h2>
              <Badge className={proposalStatusColors[proposalStatus.status]}>
                {proposalStatus.status.replace(/_/g, ' ')}
              </Badge>
            </div>
            <h3 className="font-medium text-neutral-900 mb-2">{proposalStatus.title}</h3>
            <p className="text-sm text-neutral-600 mb-4 line-clamp-2">
              {proposalStatus.problemStatement}
            </p>
            <div className="flex items-center justify-between text-sm text-neutral-500 mb-4">
              <span>Version {proposalStatus.version}</span>
              <span>Updated {new Date(proposalStatus.updatedAt).toLocaleDateString('en-MY')}</span>
            </div>
            <div className="flex gap-2">
              <Link to={ROUTES.STUDENT.PROPOSAL} className="flex-1">
                <Button variant="primary" className="w-full" size="sm">
                  Edit Proposal
                </Button>
              </Link>
              <Link to={ROUTES.STUDENT.PROPOSAL_ANALYSIS}>
                <Button variant="secondary" size="sm" leftIcon={<Sparkles className="h-4 w-4" />}>
                  AI Analysis
                </Button>
              </Link>
            </div>
          </Card>
        )}

        {/* Upcoming Deadlines */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-neutral-900">Upcoming Deadlines</h2>
            <Link to={ROUTES.STUDENT.DEADLINES}>
              <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="h-4 w-4" />}>
                View All
              </Button>
            </Link>
          </div>
          {upcomingDeadlines.length === 0 ? (
            <p className="text-neutral-500 text-center py-4">No upcoming deadlines</p>
          ) : (
            <div className="space-y-3">
              {upcomingDeadlines.slice(0, 3).map((deadline) => (
                <div
                  key={deadline.deadlineId}
                  className={cn(
                    'flex items-center justify-between p-3 rounded-lg',
                    deadline.daysRemaining <= 7 ? 'bg-error-50' : 'bg-neutral-50'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'w-10 h-10 rounded-lg flex items-center justify-center',
                      deadline.daysRemaining <= 7 ? 'bg-error-100' : 'bg-primary-100'
                    )}>
                      <Clock className={cn(
                        'h-5 w-5',
                        deadline.daysRemaining <= 7 ? 'text-error-600' : 'text-primary-600'
                      )} />
                    </div>
                    <div>
                      <p className="font-medium text-neutral-900">{deadline.title}</p>
                      <p className="text-sm text-neutral-500">
                        {new Date(deadline.dueDate).toLocaleDateString('en-MY', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={deadline.daysRemaining <= 7 ? 'error' : deadline.daysRemaining <= 14 ? 'warning' : 'default'}
                    size="sm"
                  >
                    {deadline.daysRemaining} days
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Upcoming Meetings */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-neutral-900">Upcoming Meetings</h2>
          <div className="flex gap-2">
            <Link to={ROUTES.STUDENT.MEETING_NEW}>
              <Button variant="secondary" size="sm">
                Request Meeting
              </Button>
            </Link>
            <Link to={ROUTES.STUDENT.MEETINGS}>
              <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="h-4 w-4" />}>
                View All
              </Button>
            </Link>
          </div>
        </div>
        {upcomingMeetings.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-neutral-300 mx-auto mb-3" />
            <p className="text-neutral-500">No upcoming meetings</p>
            <Link to={ROUTES.STUDENT.MEETING_NEW}>
              <Button variant="primary" size="sm" className="mt-3">
                Schedule a Meeting
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingMeetings.map((meeting) => (
              <Link
                key={meeting.meetingId}
                to={ROUTES.STUDENT.MEETING_DETAIL.replace(':id', meeting.meetingId)}
                className="block"
              >
                <div className="flex items-center justify-between p-4 rounded-lg bg-neutral-50 hover:bg-neutral-100 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary-100 flex items-center justify-center">
                      <Calendar className="h-6 w-6 text-primary-600" />
                    </div>
                    <div>
                      <p className="font-medium text-neutral-900">{meeting.title}</p>
                      <p className="text-sm text-neutral-600">
                        with {meeting.supervisor.fullName}
                      </p>
                      <p className="text-sm text-neutral-500">
                        {new Date(meeting.scheduledAt).toLocaleDateString('en-MY', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                        })}{' '}
                        at{' '}
                        {new Date(meeting.scheduledAt).toLocaleTimeString('en-MY', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                        {' • '}
                        {meeting.platform === 'IN_PERSON' ? meeting.location : meeting.platform.replace('_', ' ')}
                      </p>
                    </div>
                  </div>
                  <Badge className={meetingStatusColors[meeting.status]} size="sm">
                    {meeting.status}
                  </Badge>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>

      {/* Pending Logs Alert */}
      {pendingLogs.length > 0 && (
        <AlertBanner
          variant="warning"
          title="Pending Supervision Logs"
          description={`You have ${pendingLogs.length} supervision log(s) that need to be completed.`}
          action={
            <Link to={ROUTES.STUDENT.LOGS}>
              <Button variant="warning" size="sm">
                Complete Logs
              </Button>
            </Link>
          }
        />
      )}

      {/* Recent Documents */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-neutral-900">Recent Documents</h2>
          <div className="flex gap-2">
            <Link to={ROUTES.STUDENT.DOCUMENT_UPLOAD}>
              <Button variant="secondary" size="sm">
                Upload Document
              </Button>
            </Link>
            <Link to={ROUTES.STUDENT.DOCUMENTS}>
              <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="h-4 w-4" />}>
                View All
              </Button>
            </Link>
          </div>
        </div>
        {recentDocuments.length === 0 ? (
          <div className="text-center py-8">
            <FolderOpen className="h-12 w-12 text-neutral-300 mx-auto mb-3" />
            <p className="text-neutral-500">No documents uploaded yet</p>
            <Link to={ROUTES.STUDENT.DOCUMENT_UPLOAD}>
              <Button variant="primary" size="sm" className="mt-3">
                Upload Your First Document
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {recentDocuments.map((doc) => (
              <Link
                key={doc.documentId}
                to={ROUTES.STUDENT.DOCUMENT_DETAIL.replace(':id', doc.documentId)}
                className="block"
              >
                <div className="flex items-center justify-between p-3 rounded-lg hover:bg-neutral-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-neutral-600" />
                    </div>
                    <div>
                      <p className="font-medium text-neutral-900">{doc.title}</p>
                      <p className="text-sm text-neutral-500">
                        {doc.fileName} • {(doc.fileSize / 1024).toFixed(0)} KB
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="default" size="sm">{doc.phase}</Badge>
                    <p className="text-xs text-neutral-400 mt-1">
                      {new Date(doc.uploadedAt).toLocaleDateString('en-MY')}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Link to={ROUTES.STUDENT.SUPERVISORS}>
          <Card hover className="text-center cursor-pointer">
            <Users className="h-8 w-8 text-primary-600 mx-auto mb-2" />
            <p className="font-medium text-neutral-900">Find Supervisor</p>
          </Card>
        </Link>
        <Link to={ROUTES.STUDENT.PROPOSAL}>
          <Card hover className="text-center cursor-pointer">
            <FileText className="h-8 w-8 text-success-600 mx-auto mb-2" />
            <p className="font-medium text-neutral-900">My Proposal</p>
          </Card>
        </Link>
        <Link to={ROUTES.STUDENT.LOGS}>
          <Card hover className="text-center cursor-pointer">
            <ClipboardList className="h-8 w-8 text-warning-600 mx-auto mb-2" />
            <p className="font-medium text-neutral-900">Supervision Logs</p>
          </Card>
        </Link>
        <Link to={ROUTES.STUDENT.RESOURCES}>
          <Card hover className="text-center cursor-pointer">
            <FolderOpen className="h-8 w-8 text-info-600 mx-auto mb-2" />
            <p className="font-medium text-neutral-900">Resources</p>
          </Card>
        </Link>
      </div>
    </div>
  )
}
