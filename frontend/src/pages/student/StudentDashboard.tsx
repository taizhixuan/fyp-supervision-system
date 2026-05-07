import { Link } from 'react-router-dom'
import {
  Calendar,
  FileText,
  Users,
  Clock,
  CheckCircle,
  ArrowRight,
  ClipboardList,
  FolderOpen,
  Bell,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Video,
  MapPin,
  ChevronRight,
  GraduationCap,
} from 'lucide-react'
import { Card, Button, Badge, Spinner, AlertBanner } from '@/components/ui'
import { useStudentDashboard } from '@/lib/hooks/useStudent'
import { ROUTES } from '@/lib/constants/routes'
import { cn } from '@/lib/utils/cn'
import type { RegistrationStatus, ProposalStatus, MeetingStatus, LogStatus } from '@/types'

// Helper function to generate registration steps based on proposal status
const getRegistrationSteps = (proposalStatus?: ProposalStatus) => {
  const baseSteps = [
    { step: 1, title: 'Find Supervisor', description: 'Select a supervisor', status: 'COMPLETED' as const, completedAt: '2024-09-15' },
    { step: 2, title: 'Submit Proposal', description: 'Submit your proposal', status: 'CURRENT' as const, dueDate: '2024-10-30' },
    { step: 3, title: 'Committee Review', description: 'Wait for review', status: 'PENDING' as const },
    { step: 4, title: 'Registered', description: 'FYP registration complete', status: 'PENDING' as const },
  ]

  if (!proposalStatus) return baseSteps

  switch (proposalStatus) {
    case 'DRAFT':
      return baseSteps
    case 'SUBMITTED':
    case 'UNDER_REVIEW':
      return [
        { ...baseSteps[0] },
        { ...baseSteps[1], status: 'COMPLETED' as const, completedAt: new Date().toISOString() },
        { ...baseSteps[2], status: 'CURRENT' as const },
        { ...baseSteps[3] },
      ]
    case 'REVISION_REQUIRED':
      return [
        { ...baseSteps[0] },
        { step: 2, title: 'Revise Proposal', description: 'Address feedback', status: 'CURRENT' as const },
        { ...baseSteps[2], status: 'PENDING' as const },
        { ...baseSteps[3] },
      ]
    case 'APPROVED':
      return [
        { ...baseSteps[0] },
        { ...baseSteps[1], status: 'COMPLETED' as const, completedAt: new Date().toISOString() },
        { ...baseSteps[2], status: 'COMPLETED' as const, completedAt: new Date().toISOString() },
        { ...baseSteps[3], status: 'COMPLETED' as const, completedAt: new Date().toISOString() },
      ]
    case 'REJECTED':
      return [
        { ...baseSteps[0] },
        { step: 2, title: 'Resubmit Proposal', description: 'Start a new proposal', status: 'CURRENT' as const },
        { ...baseSteps[2], status: 'PENDING' as const },
        { ...baseSteps[3] },
      ]
    default:
      return baseSteps
  }
}

// Helper function to get registration status based on proposal status
const getRegistrationStatus = (proposalStatus?: ProposalStatus): RegistrationStatus => {
  if (!proposalStatus) return 'PROPOSAL_PENDING'
  switch (proposalStatus) {
    case 'DRAFT':
      return 'PROPOSAL_PENDING'
    case 'SUBMITTED':
    case 'UNDER_REVIEW':
      return 'UNDER_REVIEW'
    case 'REVISION_REQUIRED':
      return 'PROPOSAL_PENDING'
    case 'APPROVED':
      return 'REGISTERED'
    case 'REJECTED':
      return 'PROPOSAL_PENDING'
    default:
      return 'PROPOSAL_PENDING'
  }
}

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
    nextSteps: getRegistrationSteps('DRAFT'),
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
      platform: 'MICROSOFT_TEAMS' as const,
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
        platform: 'MICROSOFT_TEAMS' as const,
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

  const { profile, upcomingMeetings, pendingLogs, recentDocuments, upcomingDeadlines, proposalStatus, quickStats } = dashboard

  // Dynamic registration status based on proposal
  const dynamicRegistrationSteps = getRegistrationSteps(proposalStatus?.status)
  const dynamicRegistrationStatus = getRegistrationStatus(proposalStatus?.status)
  const registrationStatus = {
    ...dashboard.registrationStatus,
    status: dynamicRegistrationStatus,
    nextSteps: dynamicRegistrationSteps,
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
              <GraduationCap className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">
                Welcome back, {profile.fullName.split(' ')[0]}!
              </h1>
              <p className="text-primary-100 mt-0.5">
                {registrationStatus.cycle} • {registrationStatus.academicYear}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to={ROUTES.STUDENT.NOTIFICATIONS}>
              <Button
                variant="secondary"
                size="sm"
                className="bg-white/20 border-white/30 text-white hover:bg-white/30"
                leftIcon={<Bell className="h-4 w-4" />}
              >
                <span className="hidden sm:inline">Notifications</span>
                {dashboard.notifications.unreadCount > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 bg-error-500 text-white text-xs rounded-full">
                    {dashboard.notifications.unreadCount}
                  </span>
                )}
              </Button>
            </Link>
            <Link to={ROUTES.STUDENT.CHATBOT}>
              <Button
                size="sm"
                className="bg-white text-primary-700 hover:bg-primary-50"
                leftIcon={<Sparkles className="h-4 w-4" />}
              >
                AI Assistant
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-primary-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
              <Calendar className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900">{quickStats.totalMeetings}</p>
              <p className="text-xs text-neutral-500">Total Meetings</p>
            </div>
          </div>
        </Card>
        <Card className="border-l-4 border-l-success-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-success-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-success-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900">{quickStats.completedLogs}</p>
              <p className="text-xs text-neutral-500">Completed Logs</p>
            </div>
          </div>
        </Card>
        <Card className="border-l-4 border-l-warning-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-warning-100 rounded-lg flex items-center justify-center">
              <ClipboardList className="h-5 w-5 text-warning-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900">{pendingLogs.length}</p>
              <p className="text-xs text-neutral-500">Pending Logs</p>
            </div>
          </div>
        </Card>
        <Card className="border-l-4 border-l-info-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-info-100 rounded-lg flex items-center justify-center">
              <FileText className="h-5 w-5 text-info-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900">{quickStats.documentsUploaded}</p>
              <p className="text-xs text-neutral-500">Documents</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Pending Logs Alert */}
      {pendingLogs.length > 0 && (
        <div className="bg-warning-50 border border-warning-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-warning-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-warning-600" />
            </div>
            <div>
              <p className="font-medium text-warning-800">Pending Supervision Logs</p>
              <p className="text-sm text-warning-600">You have {pendingLogs.length} log(s) that need to be completed</p>
            </div>
          </div>
          <Link to={ROUTES.STUDENT.LOGS}>
            <Button variant="secondary" size="sm" className="border-warning-300 text-warning-700 hover:bg-warning-100">
              Complete Now
            </Button>
          </Link>
        </div>
      )}

      {/* Registration Progress */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center shadow-lg shadow-primary-500/20">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-neutral-900">Registration Progress</h2>
              <p className="text-sm text-neutral-500">Track your FYP journey</p>
            </div>
          </div>
          <Badge className={cn(statusColors[registrationStatus.status], 'px-3 py-1')}>
            {registrationStatus.status.replace(/_/g, ' ')}
          </Badge>
        </div>

        {/* Progress Steps - Enhanced with Icons */}
        <div className="relative mb-6">
          {/* Progress Bar Background */}
          <div className="absolute top-6 left-12 right-12 h-1 bg-neutral-200 rounded-full" />
          {/* Progress Bar Fill */}
          <div
            className="absolute top-6 left-12 h-1 bg-gradient-to-r from-success-500 to-primary-500 rounded-full transition-all duration-500"
            style={{
              width: `${Math.max(0, (registrationStatus.nextSteps.filter(s => s.status === 'COMPLETED').length / (registrationStatus.nextSteps.length - 1)) * 100)}%`,
              maxWidth: 'calc(100% - 6rem)'
            }}
          />

          <div className="flex items-start justify-between relative px-2">
            {registrationStatus.nextSteps.map((step) => {
              // Define icons for each step with appropriate colors
              const getStepIcon = (stepNum: number, status: string) => {
                const iconClass = cn(
                  'h-5 w-5',
                  status === 'COMPLETED' && 'text-white',
                  status === 'CURRENT' && 'text-white',
                  status === 'PENDING' && 'text-neutral-400'
                )
                switch (stepNum) {
                  case 1: return <Users className={iconClass} />
                  case 2: return <FileText className={iconClass} />
                  case 3: return <ClipboardList className={iconClass} />
                  case 4: return <GraduationCap className={iconClass} />
                  default: return <span>{stepNum}</span>
                }
              }

              return (
                <div key={step.step} className="flex flex-col items-center flex-1">
                  <div
                    className={cn(
                      'w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 relative z-10',
                      step.status === 'COMPLETED' && 'bg-success-500 shadow-lg shadow-success-500/40',
                      step.status === 'CURRENT' && 'bg-primary-600 ring-4 ring-primary-100 shadow-lg shadow-primary-500/40',
                      step.status === 'PENDING' && 'bg-neutral-100 border-2 border-neutral-200'
                    )}
                  >
                    {getStepIcon(step.step, step.status)}
                  </div>
                  <p className={cn(
                    'mt-3 text-xs font-medium text-center max-w-[90px]',
                    step.status === 'COMPLETED' && 'text-success-700',
                    step.status === 'CURRENT' && 'text-primary-700 font-semibold',
                    step.status === 'PENDING' && 'text-neutral-400'
                  )}>
                    {step.title}
                  </p>
                  {step.status === 'COMPLETED' && step.completedAt && (
                    <p className="text-[10px] text-success-600 mt-0.5">
                      {new Date(step.completedAt).toLocaleDateString('en-MY', { day: 'numeric', month: 'short' })}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Current Step Detail - Enhanced */}
        {registrationStatus.nextSteps.find(s => s.status === 'CURRENT') && (
          <div className={cn(
            'rounded-xl p-4 border transition-all',
            proposalStatus?.status === 'REVISION_REQUIRED'
              ? 'bg-warning-50 border-warning-200'
              : proposalStatus?.status === 'SUBMITTED' || proposalStatus?.status === 'UNDER_REVIEW'
              ? 'bg-info-50 border-info-200'
              : 'bg-primary-50 border-primary-100'
          )}>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={cn(
                  'w-10 h-10 rounded-lg flex items-center justify-center',
                  proposalStatus?.status === 'REVISION_REQUIRED'
                    ? 'bg-warning-100'
                    : proposalStatus?.status === 'SUBMITTED' || proposalStatus?.status === 'UNDER_REVIEW'
                    ? 'bg-info-100'
                    : 'bg-primary-100'
                )}>
                  {proposalStatus?.status === 'SUBMITTED' || proposalStatus?.status === 'UNDER_REVIEW' ? (
                    <Clock className={cn('h-5 w-5', proposalStatus?.status === 'UNDER_REVIEW' ? 'text-info-600' : 'text-info-600')} />
                  ) : proposalStatus?.status === 'REVISION_REQUIRED' ? (
                    <AlertTriangle className="h-5 w-5 text-warning-600" />
                  ) : (
                    <FileText className="h-5 w-5 text-primary-600" />
                  )}
                </div>
                <div>
                  <p className={cn(
                    'font-semibold',
                    proposalStatus?.status === 'REVISION_REQUIRED'
                      ? 'text-warning-900'
                      : proposalStatus?.status === 'SUBMITTED' || proposalStatus?.status === 'UNDER_REVIEW'
                      ? 'text-info-900'
                      : 'text-primary-900'
                  )}>
                    {proposalStatus?.status === 'SUBMITTED'
                      ? 'Proposal Submitted - Awaiting Review'
                      : proposalStatus?.status === 'UNDER_REVIEW'
                      ? 'Under Review by Committee'
                      : proposalStatus?.status === 'REVISION_REQUIRED'
                      ? 'Revision Required'
                      : `Current: ${registrationStatus.nextSteps.find(s => s.status === 'CURRENT')?.title}`}
                  </p>
                  <p className={cn(
                    'text-sm mt-0.5',
                    proposalStatus?.status === 'REVISION_REQUIRED'
                      ? 'text-warning-700'
                      : proposalStatus?.status === 'SUBMITTED' || proposalStatus?.status === 'UNDER_REVIEW'
                      ? 'text-info-700'
                      : 'text-primary-700'
                  )}>
                    {proposalStatus?.status === 'SUBMITTED'
                      ? 'Your supervisor will review your proposal soon'
                      : proposalStatus?.status === 'UNDER_REVIEW'
                      ? 'The FYP committee is evaluating your submission'
                      : proposalStatus?.status === 'REVISION_REQUIRED'
                      ? 'Please address the feedback and resubmit'
                      : registrationStatus.nextSteps.find(s => s.status === 'CURRENT')?.description}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {(() => {
                  const currentStep = registrationStatus.nextSteps.find(s => s.status === 'CURRENT')
                  return currentStep && 'dueDate' in currentStep && currentStep.dueDate ? (
                    <Badge variant="warning" size="sm">
                      Due: {new Date(currentStep.dueDate).toLocaleDateString('en-MY', { day: 'numeric', month: 'short' })}
                    </Badge>
                  ) : null
                })()}
                {(proposalStatus?.status === 'DRAFT' || proposalStatus?.status === 'REVISION_REQUIRED') && (
                  <Link to={ROUTES.STUDENT.PROPOSAL}>
                    <Button
                      variant={proposalStatus?.status === 'REVISION_REQUIRED' ? 'secondary' : 'primary'}
                      size="sm"
                      className={proposalStatus?.status === 'REVISION_REQUIRED' ? 'border-warning-300 text-warning-700 hover:bg-warning-100' : ''}
                      rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
                    >
                      {proposalStatus?.status === 'REVISION_REQUIRED' ? 'View Feedback' : 'Continue'}
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}

        {/* All Steps Completed */}
        {registrationStatus.nextSteps.every(s => s.status === 'COMPLETED') && (
          <div className="bg-gradient-to-r from-success-50 to-success-100 rounded-xl p-4 border border-success-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-success-500 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-success-900">Registration Complete!</p>
                <p className="text-sm text-success-700">Your FYP project has been successfully registered</p>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Proposal Status */}
        {proposalStatus && (
          <Card className="flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-success-100 rounded-lg flex items-center justify-center">
                  <FileText className="h-5 w-5 text-success-600" />
                </div>
                <h2 className="text-lg font-semibold text-neutral-900">My Proposal</h2>
              </div>
              <Badge className={proposalStatusColors[proposalStatus.status]}>
                {proposalStatus.status.replace(/_/g, ' ')}
              </Badge>
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-neutral-900 mb-2">{proposalStatus.title}</h3>
              <p className="text-sm text-neutral-600 mb-4 line-clamp-2">
                {proposalStatus.problemStatement}
              </p>
              <div className="flex items-center gap-4 text-sm text-neutral-500 mb-4">
                <span>Version {proposalStatus.version}</span>
                <span>•</span>
                <span>Updated {new Date(proposalStatus.updatedAt).toLocaleDateString('en-MY')}</span>
              </div>
            </div>
            <div className="flex gap-2 pt-4 border-t border-neutral-100">
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
        <Card className="flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-error-100 rounded-lg flex items-center justify-center">
                <Clock className="h-5 w-5 text-error-600" />
              </div>
              <h2 className="text-lg font-semibold text-neutral-900">Upcoming Deadlines</h2>
            </div>
            <Link to={ROUTES.STUDENT.DEADLINES}>
              <Button variant="ghost" size="sm" rightIcon={<ChevronRight className="h-4 w-4" />}>
                View All
              </Button>
            </Link>
          </div>
          <div className="flex-1 space-y-3">
            {upcomingDeadlines.length === 0 ? (
              <p className="text-neutral-500 text-center py-4">No upcoming deadlines</p>
            ) : (
              upcomingDeadlines.slice(0, 3).map((deadline) => {
                const days = deadline.daysRemaining ?? 999
                return (
                  <div
                    key={deadline.deadlineId}
                    className={cn(
                      'flex items-center justify-between p-3 rounded-xl',
                      days <= 7 ? 'bg-error-50 border border-error-100' : 'bg-neutral-50'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'w-2 h-2 rounded-full',
                        days <= 7 ? 'bg-error-500' :
                        days <= 14 ? 'bg-warning-500' : 'bg-neutral-300'
                      )} />
                      <div>
                        <p className="font-medium text-neutral-900 text-sm">{deadline.title}</p>
                        <p className="text-xs text-neutral-500">
                          {new Date(deadline.dueDate).toLocaleDateString('en-MY', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={days <= 7 ? 'error' : days <= 14 ? 'warning' : 'default'}
                      size="sm"
                    >
                      {days}d
                    </Badge>
                  </div>
                )
              })
            )}
          </div>
        </Card>
      </div>

      {/* Upcoming Meetings */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
              <Calendar className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-neutral-900">Upcoming Meetings</h2>
              <p className="text-sm text-neutral-500">{upcomingMeetings.length} scheduled</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link to={ROUTES.STUDENT.MEETING_NEW}>
              <Button variant="primary" size="sm">
                Request Meeting
              </Button>
            </Link>
            <Link to={ROUTES.STUDENT.MEETINGS}>
              <Button variant="ghost" size="sm" rightIcon={<ChevronRight className="h-4 w-4" />}>
                View All
              </Button>
            </Link>
          </div>
        </div>
        {upcomingMeetings.length === 0 ? (
          <div className="text-center py-8 bg-neutral-50 rounded-xl">
            <Calendar className="h-12 w-12 text-neutral-300 mx-auto mb-3" />
            <p className="text-neutral-500 mb-3">No upcoming meetings</p>
            <Link to={ROUTES.STUDENT.MEETING_NEW}>
              <Button variant="primary" size="sm">
                Schedule a Meeting
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcomingMeetings.map((meeting) => (
              <Link
                key={meeting.meetingId}
                to={ROUTES.STUDENT.MEETING_DETAIL.replace(':id', meeting.meetingId)}
                className="block"
              >
                <div className="p-4 rounded-xl border border-neutral-200 hover:border-primary-300 hover:shadow-md transition-all bg-white">
                  <div className="flex items-start justify-between mb-3">
                    <Badge className={meetingStatusColors[meeting.status]} size="sm">
                      {meeting.status}
                    </Badge>
                    <span className="text-xs text-neutral-500">
                      {meeting.duration} min
                    </span>
                  </div>
                  <h3 className="font-medium text-neutral-900 mb-1">{meeting.title}</h3>
                  <p className="text-sm text-neutral-600 mb-3">
                    with {meeting.supervisor.fullName}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-neutral-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(meeting.scheduledAt).toLocaleDateString('en-MY', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                      })}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {new Date(meeting.scheduledAt).toLocaleTimeString('en-MY', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 mt-2 text-xs text-neutral-500">
                    {meeting.platform === 'IN_PERSON' ? (
                      <>
                        <MapPin className="h-3.5 w-3.5" />
                        <span>{meeting.location}</span>
                      </>
                    ) : (
                      <>
                        <Video className="h-3.5 w-3.5" />
                        <span>{meeting.platform.replace('_', ' ')}</span>
                      </>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>

      {/* Recent Documents */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-info-100 rounded-lg flex items-center justify-center">
              <FolderOpen className="h-5 w-5 text-info-600" />
            </div>
            <h2 className="text-lg font-semibold text-neutral-900">Recent Documents</h2>
          </div>
          <div className="flex gap-2">
            <Link to={ROUTES.STUDENT.DOCUMENT_UPLOAD}>
              <Button variant="primary" size="sm">
                Upload
              </Button>
            </Link>
            <Link to={ROUTES.STUDENT.DOCUMENTS}>
              <Button variant="ghost" size="sm" rightIcon={<ChevronRight className="h-4 w-4" />}>
                View All
              </Button>
            </Link>
          </div>
        </div>
        {recentDocuments.length === 0 ? (
          <div className="text-center py-8 bg-neutral-50 rounded-xl">
            <FolderOpen className="h-12 w-12 text-neutral-300 mx-auto mb-3" />
            <p className="text-neutral-500 mb-3">No documents uploaded yet</p>
            <Link to={ROUTES.STUDENT.DOCUMENT_UPLOAD}>
              <Button variant="primary" size="sm">
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
                <div className="flex items-center justify-between p-3 rounded-xl hover:bg-neutral-50 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center group-hover:bg-primary-100 transition-colors">
                      <FileText className="h-5 w-5 text-neutral-600 group-hover:text-primary-600 transition-colors" />
                    </div>
                    <div>
                      <p className="font-medium text-neutral-900">{doc.title}</p>
                      <p className="text-xs text-neutral-500">
                        {doc.fileName} • {(doc.fileSize / 1024 / 1024).toFixed(1)} MB
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="default" size="sm">{doc.phase}</Badge>
                    <ChevronRight className="h-4 w-4 text-neutral-400" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Link to={ROUTES.STUDENT.TOPICS}>
            <div className="bg-white border border-neutral-200 rounded-xl p-4 text-center hover:border-primary-300 hover:shadow-md transition-all group cursor-pointer">
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-primary-600 transition-colors">
                <Users className="h-6 w-6 text-primary-600 group-hover:text-white transition-colors" />
              </div>
              <p className="font-medium text-neutral-900 text-sm">Browse Topics</p>
            </div>
          </Link>
          <Link to={ROUTES.STUDENT.PROPOSAL}>
            <div className="bg-white border border-neutral-200 rounded-xl p-4 text-center hover:border-success-300 hover:shadow-md transition-all group cursor-pointer">
              <div className="w-12 h-12 bg-success-100 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-success-600 transition-colors">
                <FileText className="h-6 w-6 text-success-600 group-hover:text-white transition-colors" />
              </div>
              <p className="font-medium text-neutral-900 text-sm">My Proposal</p>
            </div>
          </Link>
          <Link to={ROUTES.STUDENT.LOGS}>
            <div className="bg-white border border-neutral-200 rounded-xl p-4 text-center hover:border-warning-300 hover:shadow-md transition-all group cursor-pointer">
              <div className="w-12 h-12 bg-warning-100 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-warning-600 transition-colors">
                <ClipboardList className="h-6 w-6 text-warning-600 group-hover:text-white transition-colors" />
              </div>
              <p className="font-medium text-neutral-900 text-sm">Supervision Logs</p>
            </div>
          </Link>
          <Link to={ROUTES.STUDENT.RESOURCES}>
            <div className="bg-white border border-neutral-200 rounded-xl p-4 text-center hover:border-info-300 hover:shadow-md transition-all group cursor-pointer">
              <div className="w-12 h-12 bg-info-100 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-info-600 transition-colors">
                <FolderOpen className="h-6 w-6 text-info-600 group-hover:text-white transition-colors" />
              </div>
              <p className="font-medium text-neutral-900 text-sm">Resources</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
