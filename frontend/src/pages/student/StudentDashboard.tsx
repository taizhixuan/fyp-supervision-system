import { useEffect, useState } from 'react'
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
  Sparkles,
  TrendingUp,
  AlertTriangle,
  AlertCircle,
  Video,
  MapPin,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  GraduationCap,
} from 'lucide-react'
import { Card, Button, Badge, Spinner, AlertBanner } from '@/components/ui'
import { useStudentDashboard } from '@/lib/hooks/useStudent'
import { ROUTES } from '@/lib/constants/routes'
import { cn } from '@/lib/utils/cn'
import { trimesterProgress } from '@/lib/utils/trimester'
import type { RegistrationStatus, ProposalStatus, MeetingStatus, LogStatus } from '@/types'

// Build the 4-step strip from the backend-derived registration status.
// Spec UC4 → UC6 → UC7 → UC9 maps cleanly: Find Supervisor → Submit Proposal → Committee Review → Registered.
const getRegistrationSteps = (status: RegistrationStatus) => {
  const titles = [
    { step: 1, title: 'Find Supervisor', description: 'Browse directory and send a request' },
    { step: 2, title: 'Submit Proposal', description: 'Submit your proposal' },
    { step: 3, title: 'Committee Review', description: 'Wait for committee review' },
    { step: 4, title: 'Registered', description: 'FYP registration complete' },
  ]
  const COMPLETED = 'COMPLETED' as const
  const CURRENT = 'CURRENT' as const
  const PENDING = 'PENDING' as const
  let activeIdx = 0
  switch (status) {
    case 'NOT_STARTED':
    case 'SUPERVISOR_PENDING':
      activeIdx = 0
      break
    case 'PROPOSAL_PENDING':
      activeIdx = 1
      break
    case 'UNDER_REVIEW':
      activeIdx = 2
      break
    case 'REGISTERED':
      activeIdx = 4
      break
    case 'DEFERRED':
      activeIdx = 0
      break
  }
  return titles.map((t, i) => ({
    ...t,
    status: i < activeIdx ? COMPLETED : i === activeIdx ? CURRENT : PENDING,
  }))
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
    nextSteps: getRegistrationSteps('PROPOSAL_PENDING'),
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
  SUPERVISOR_PENDING: 'bg-warning-100 text-warning-800',
  PROPOSAL_PENDING: 'bg-warning-100 text-warning-900',
  UNDER_REVIEW: 'bg-info-100 text-info-800',
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

  // Registration Progress card is collapsible — saves ~350px of scroll when hidden.
  // Defaults to expanded so first-time users see it; choice persists per device.
  const REG_PROGRESS_KEY = 'student-dash-reg-progress-open'
  const [showRegProgress, setShowRegProgress] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true
    try {
      const saved = window.localStorage.getItem(REG_PROGRESS_KEY)
      return saved === null ? true : saved === 'true'
    } catch {
      return true
    }
  })
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(REG_PROGRESS_KEY, String(showRegProgress))
    } catch {
      // ignore
    }
  }, [showRegProgress])

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

  // Trust the backend-derived registration status. It already accounts for
  // project existence (supervisor accepted) AND proposal lifecycle.
  const backendStatus = dashboard.registrationStatus.status
  const registrationStatus = {
    ...dashboard.registrationStatus,
    nextSteps: getRegistrationSteps(backendStatus),
  }

  // Supervisor paired = project exists ⇒ status is one of these three.
  const isPaired =
    backendStatus === 'PROPOSAL_PENDING' ||
    backendStatus === 'UNDER_REVIEW' ||
    backendStatus === 'REGISTERED'
  const pairedSupervisor = dashboard.registrationStatus.supervisor as
    | { fullName?: string; department?: string; email?: string }
    | undefined
  const nextDeadline = upcomingDeadlines && upcomingDeadlines.length > 0 ? upcomingDeadlines[0] : null

  // Trimester window + log compliance + FYP1 result — drives the new dashboard widgets.
  const reg = dashboard.registrationStatus
  const trimester = trimesterProgress(reg.trimesterStartDate, reg.trimesterEndDate)
  const logsDone = reg.meetingLogsCompleted ?? 0
  const logsRequired = reg.meetingLogsRequired ?? 0
  const logsRatio = logsRequired > 0 ? Math.min(1, logsDone / logsRequired) : 0
  const logsRemaining = Math.max(0, logsRequired - logsDone)
  const currentPhase = (reg.cycle ?? 'FYP1').toUpperCase()
  const isFyp2 = currentPhase === 'FYP2'
  const fyp1Passed = reg.fyp1Passed
  // Three-step phase strip. The student's current phase + cycle state are the source
  // of truth — fyp1Passed is just an admin-recorded outcome, not the gate. If the
  // student is currently in FYP2 they have demonstrably moved past FYP1 (AuthService /
  // committee already flipped Project.stage), so step 1 is done regardless.
  const cycleEnded = reg.cycleActive === false
  const fyp1Done = isFyp2 || fyp1Passed === true
  const fyp2Done = isFyp2 && cycleEnded
  const phaseSteps = [
    {
      key: 'FYP1',
      label: 'FYP 1',
      status: fyp1Done
        ? 'done'
        : (currentPhase === 'FYP1' && !cycleEnded ? 'current' : 'pending'),
    },
    {
      key: 'FYP2',
      label: 'FYP 2',
      status: fyp2Done
        ? 'done'
        : (isFyp2 && !cycleEnded ? 'current' : 'pending'),
    },
    {
      key: 'COMPLETE',
      label: 'Complete',
      status: fyp2Done ? 'current' : 'pending',
    },
  ] as const

  return (
    <div className="space-y-3 lg:space-y-4">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl px-4 py-3 sm:px-5 sm:py-3.5 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-bold leading-tight truncate">
                Welcome back, {profile.fullName.split(' ')[0]}!
              </h1>
              <p className="text-primary-100 text-xs sm:text-sm mt-0.5">
                {registrationStatus.cycle} • {registrationStatus.academicYear}
                {trimester && trimester.hasStarted && !trimester.hasEnded && (
                  <>
                    {' • '}Week {trimester.currentWeek} of {trimester.totalWeeks}
                    {trimester.weeksRemaining > 0 && (
                      <span className="text-primary-200">
                        {' • '}{trimester.weeksRemaining} {trimester.weeksRemaining === 1 ? 'week' : 'weeks'} left
                      </span>
                    )}
                  </>
                )}
                {trimester && !trimester.hasStarted && (
                  <span>{' • '}Trimester starts soon</span>
                )}
                {trimester && trimester.hasEnded && (
                  <span>{' • '}Trimester ended</span>
                )}
              </p>
            </div>
          </div>
          <Link to={ROUTES.STUDENT.CHATBOT} className="flex-shrink-0">
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

      {/* Cycle-ended banner — backend signals when the FYP cycle has been
          COMPLETED/ARCHIVED so write actions across the app are disabled.
          Surfaced above the status grid so it stays full-width when present. */}
      {dashboard.registrationStatus.cycleActive === false && (
        <Card className="p-4 border-l-4 border-l-warning-500 bg-warning-50">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-warning-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-warning-900">Your FYP cycle has ended</p>
              <p className="text-sm text-warning-800 mt-0.5">
                The FYP cycle you were enrolled in has been{' '}
                {dashboard.registrationStatus.cycleStatus === 'ARCHIVED' ? 'archived' : 'completed'}.
                You now have read-only access — viewing your records is fine, but new submissions are disabled.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Compact FYP phase pill row — kept low-key so Registration Progress can be the focal point.
          The detailed stepper lives further down; this is just a status glance. */}
      <Card className="!py-2.5 !px-4">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wide flex-shrink-0">FYP Phase</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {phaseSteps.map((step, idx) => (
                <div key={step.key} className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
                      step.status === 'done' && 'bg-success-100 text-success-700',
                      step.status === 'current' && 'bg-primary-600 text-white shadow-sm shadow-primary-500/30',
                      step.status === 'pending' && 'bg-neutral-100 text-neutral-500',
                    )}
                  >
                    {step.status === 'done' && <CheckCircle className="h-3 w-3" />}
                    {step.label}
                  </span>
                  {idx < phaseSteps.length - 1 && (
                    <ChevronRight className="h-3 w-3 text-neutral-400" />
                  )}
                </div>
              ))}
            </div>
          </div>
          {fyp1Passed === true && (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-success-50 text-success-700 text-xs font-medium">
              <CheckCircle className="h-3 w-3" />
              FYP1 Passed
              {reg.fyp1ResultDecidedAt && (
                <span className="text-success-600">
                  · {new Date(reg.fyp1ResultDecidedAt).toLocaleDateString('en-MY', { day: 'numeric', month: 'short' })}
                </span>
              )}
            </span>
          )}
          {fyp1Passed === false && (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-error-50 text-error-700 text-xs font-medium">
              <AlertCircle className="h-3 w-3" />
              FYP1 Failed
              {reg.fyp1ResultDecidedAt && (
                <span className="text-error-600">
                  · {new Date(reg.fyp1ResultDecidedAt).toLocaleDateString('en-MY', { day: 'numeric', month: 'short' })}
                </span>
              )}
            </span>
          )}
        </div>
      </Card>

      {/* Pairing banner — different content depending on whether the student has a project yet */}
      {isPaired ? (
        <Card className="p-5 border-l-4 border-l-success-500 bg-gradient-to-r from-success-50 to-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-success-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <CheckCircle className="h-5 w-5 text-success-600" />
              </div>
              <div>
                <p className="text-sm text-neutral-500">You are paired with</p>
                <p className="font-semibold text-neutral-900">
                  {pairedSupervisor?.fullName ?? 'your supervisor'}
                </p>
                {pairedSupervisor?.department && (
                  <p className="text-xs text-neutral-500">{pairedSupervisor.department}</p>
                )}
              </div>
            </div>
            {nextDeadline && (
              <div className="text-right">
                <p className="text-xs text-neutral-500">Next deadline</p>
                <p className="text-sm font-medium text-neutral-900">
                  {(nextDeadline as { title?: string }).title ?? '—'}
                </p>
                <p className="text-xs text-neutral-500">
                  {new Date((nextDeadline as { dueDate: string }).dueDate).toLocaleDateString('en-MY', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>
              </div>
            )}
          </div>
        </Card>
      ) : (
        <Card className="p-5 border-l-4 border-l-primary-500 bg-gradient-to-r from-primary-50 to-white">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Sparkles className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <p className="font-semibold text-neutral-900">You haven&apos;t paired with a supervisor yet</p>
                <p className="text-sm text-neutral-600 mt-0.5">
                  Browse the supervisor directory or check the AI recommendations to start your FYP.
                </p>
              </div>
            </div>
            <Link to={ROUTES.STUDENT.SUPERVISORS} className="shrink-0">
              <Button>
                <Sparkles className="h-4 w-4 mr-2" />
                Find Supervisor
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {/* Quick Stats — empty cards swap the number for a CTA so new students don't see a wall of zeros. */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-primary-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Calendar className="h-5 w-5 text-primary-600" />
            </div>
            <div className="min-w-0">
              {quickStats.totalMeetings > 0 ? (
                <>
                  <p className="text-2xl font-bold text-neutral-900">{quickStats.totalMeetings}</p>
                  <p className="text-xs text-neutral-500">Total Meetings</p>
                </>
              ) : (
                <>
                  <p className="text-sm font-semibold text-neutral-900">No meetings yet</p>
                  <Link
                    to={ROUTES.STUDENT.MEETING_NEW}
                    className="text-xs text-primary-600 hover:text-primary-700 inline-flex items-center gap-0.5 mt-0.5"
                  >
                    Schedule one <ArrowRight className="h-3 w-3" />
                  </Link>
                </>
              )}
            </div>
          </div>
        </Card>
        <Card className="border-l-4 border-l-success-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-success-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-success-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-2xl font-bold text-neutral-900">
                {logsDone}<span className="text-base font-medium text-neutral-500"> of {logsRequired || 6}</span>
              </p>
              <p className="text-xs text-neutral-500">{currentPhase} meeting logs</p>
            </div>
          </div>
          {logsDone === 0 ? (
            <div className="mt-3 h-1.5 rounded-full border border-dashed border-neutral-300" />
          ) : (
            <div className="mt-3 h-1.5 rounded-full bg-neutral-100 overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  logsDone >= (logsRequired || 6) ? 'bg-success-500' : 'bg-warning-500',
                )}
                style={{ width: `${Math.round(logsRatio * 100)}%` }}
              />
            </div>
          )}
          <p className="text-[11px] text-neutral-500 mt-1">
            {logsDone >= (logsRequired || 6)
              ? 'Minimum met ✓'
              : logsDone === 0
              ? `Log your first meeting to start tracking`
              : `${logsRemaining} more to meet ${currentPhase} minimum`}
          </p>
        </Card>
        <Card className="border-l-4 border-l-warning-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-warning-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <ClipboardList className="h-5 w-5 text-warning-600" />
            </div>
            <div className="min-w-0">
              {pendingLogs.length > 0 ? (
                <>
                  <p className="text-2xl font-bold text-neutral-900">{pendingLogs.length}</p>
                  <p className="text-xs text-neutral-500">Pending Logs</p>
                </>
              ) : (
                <>
                  <p className="text-sm font-semibold text-neutral-900">All caught up</p>
                  <p className="text-xs text-neutral-500">No pending logs</p>
                </>
              )}
            </div>
          </div>
        </Card>
        <Card className="border-l-4 border-l-info-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-info-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <FileText className="h-5 w-5 text-info-600" />
            </div>
            <div className="min-w-0">
              {quickStats.documentsUploaded > 0 ? (
                <>
                  <p className="text-2xl font-bold text-neutral-900">{quickStats.documentsUploaded}</p>
                  <p className="text-xs text-neutral-500">Documents</p>
                </>
              ) : (
                <>
                  <p className="text-sm font-semibold text-neutral-900">No documents</p>
                  <Link
                    to={ROUTES.STUDENT.DOCUMENT_UPLOAD}
                    className="text-xs text-info-600 hover:text-info-700 inline-flex items-center gap-0.5 mt-0.5"
                  >
                    Upload one <ArrowRight className="h-3 w-3" />
                  </Link>
                </>
              )}
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

      {/* Registration Progress — hidden once registration is complete (proposal APPROVED)
          or once the FYP cycle has ended (no more progress to make). */}
      {backendStatus !== 'REGISTERED' && reg.cycleActive !== false && (
      <Card className="overflow-hidden">
        <div className={cn('flex items-center justify-between gap-3', showRegProgress ? 'mb-5' : 'mb-0')}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center shadow-lg shadow-primary-500/20 flex-shrink-0">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-neutral-900">Registration Progress</h2>
              <p className="text-sm text-neutral-500 truncate">
                {showRegProgress
                  ? 'Track your FYP journey'
                  : `Current: ${registrationStatus.nextSteps.find((s) => s.status === 'CURRENT')?.title ?? '—'}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge className={cn(statusColors[registrationStatus.status], 'px-3 py-1')}>
              {registrationStatus.status.replace(/_/g, ' ')}
            </Badge>
            <button
              type="button"
              onClick={() => setShowRegProgress((v) => !v)}
              aria-expanded={showRegProgress}
              aria-label={showRegProgress ? 'Hide details' : 'Show details'}
              className="inline-flex items-center justify-center w-8 h-8 rounded-md text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
            >
              {showRegProgress ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {showRegProgress && (<>
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
        </>)}
      </Card>
      )}

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

      {/* Upcoming Meetings + Recent Documents — side-by-side on lg+ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5">
      {/* Upcoming Meetings */}
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Calendar className="h-5 w-5 text-primary-600" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-neutral-900">Upcoming Meetings</h2>
              <p className="text-sm text-neutral-500">{upcomingMeetings.length} scheduled</p>
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Link to={ROUTES.STUDENT.MEETING_NEW}>
              <Button variant="primary" size="sm" className="whitespace-nowrap">
                Request Meeting
              </Button>
            </Link>
            <Link to={ROUTES.STUDENT.MEETINGS}>
              <Button
                variant="ghost"
                size="sm"
                rightIcon={<ChevronRight className="h-4 w-4" />}
                className="whitespace-nowrap"
              >
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4">
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
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 bg-info-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <FolderOpen className="h-5 w-5 text-info-600" />
            </div>
            <h2 className="text-lg font-semibold text-neutral-900">Recent Documents</h2>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Link to={ROUTES.STUDENT.DOCUMENT_UPLOAD}>
              <Button variant="primary" size="sm" className="whitespace-nowrap">
                Upload
              </Button>
            </Link>
            <Link to={ROUTES.STUDENT.DOCUMENTS}>
              <Button
                variant="ghost"
                size="sm"
                rightIcon={<ChevronRight className="h-4 w-4" />}
                className="whitespace-nowrap"
              >
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
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Link to={ROUTES.STUDENT.SUPERVISORS}>
            <div className="bg-white border border-neutral-200 rounded-xl p-4 text-center hover:border-primary-300 hover:shadow-md transition-all group cursor-pointer">
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-primary-600 transition-colors">
                <Users className="h-6 w-6 text-primary-600 group-hover:text-white transition-colors" />
              </div>
              <p className="font-medium text-neutral-900 text-sm">Find Supervisor</p>
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

