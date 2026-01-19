import { Link } from 'react-router-dom'
import {
  CheckCircle,
  Clock,
  AlertCircle,
  Users,
  FileText,
  ClipboardCheck,
  Award,
  ArrowRight,
  Calendar,
} from 'lucide-react'
import { Card, Button, Badge, Spinner } from '@/components/ui'
import { useProjectRegistration } from '@/lib/hooks/useStudent'
import { ROUTES } from '@/lib/constants/routes'
import { cn } from '@/lib/utils/cn'
import type { RegistrationStatus as RegistrationStatusType } from '@/types'

// Sample data
const SAMPLE_REGISTRATION = {
  registrationId: '1',
  studentId: '1',
  academicYear: '2024/2025',
  semester: 1,
  cycle: 'FYP1',
  status: 'PROPOSAL_PENDING' as RegistrationStatusType,
  supervisorId: '1',
  supervisor: {
    supervisorId: '1',
    userId: '101',
    fullName: 'Dr. Sarah Lee Wei Lin',
    email: 'sarah.lee@mmu.edu.my',
    title: 'Associate Professor',
    department: 'Software Engineering',
    faculty: 'Faculty of Computing and Informatics',
    researchAreas: ['AI', 'ML'],
    currentLoad: 5,
    maxCapacity: 8,
    isAcceptingStudents: true,
  },
  proposalId: '1',
  nextSteps: [
    { step: 1, title: 'Account Verification', description: 'Verify your student account', status: 'COMPLETED' as const, completedAt: '2024-09-01T10:00:00Z' },
    { step: 2, title: 'Find Supervisor', description: 'Select and get approval from a supervisor', status: 'COMPLETED' as const, completedAt: '2024-09-15T14:30:00Z' },
    { step: 3, title: 'Submit Proposal', description: 'Complete and submit your FYP proposal', status: 'CURRENT' as const, dueDate: '2025-02-15T23:59:00Z' },
    { step: 4, title: 'Proposal Review', description: 'Wait for supervisor and committee review', status: 'PENDING' as const },
    { step: 5, title: 'Project Registration', description: 'Finalize FYP registration', status: 'PENDING' as const },
  ],
  timeline: [
    { eventId: '4', type: 'SUBMISSION' as const, title: 'Proposal Draft Saved', description: 'First draft of proposal saved', timestamp: '2025-01-10T09:00:00Z' },
    { eventId: '3', type: 'STATUS_CHANGE' as const, title: 'Supervisor Assigned', description: 'Dr. Sarah Lee accepted supervision request', timestamp: '2024-09-15T14:30:00Z' },
    { eventId: '2', type: 'SUBMISSION' as const, title: 'Supervision Request Sent', description: 'Sent request to Dr. Sarah Lee', timestamp: '2024-09-10T11:00:00Z' },
    { eventId: '1', type: 'STATUS_CHANGE' as const, title: 'Account Verified', description: 'Student account verified by admin', timestamp: '2024-09-01T10:00:00Z' },
  ],
}

const statusConfig: Record<RegistrationStatusType, { label: string; color: string; bgColor: string }> = {
  NOT_STARTED: { label: 'Not Started', color: 'text-neutral-700', bgColor: 'bg-neutral-100' },
  SUPERVISOR_PENDING: { label: 'Finding Supervisor', color: 'text-warning-700', bgColor: 'bg-warning-100' },
  PROPOSAL_PENDING: { label: 'Proposal Pending', color: 'text-primary-700', bgColor: 'bg-primary-100' },
  UNDER_REVIEW: { label: 'Under Review', color: 'text-info-700', bgColor: 'bg-info-100' },
  REGISTERED: { label: 'Registered', color: 'text-success-700', bgColor: 'bg-success-100' },
  DEFERRED: { label: 'Deferred', color: 'text-error-700', bgColor: 'bg-error-100' },
}

const stepIcons = [CheckCircle, Users, FileText, ClipboardCheck, Award]

export function RegistrationStatus() {
  const { data, isLoading } = useProjectRegistration()

  // Use sample data
  const registration = data || SAMPLE_REGISTRATION
  const status = statusConfig[registration.status]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" label="Loading registration status..." />
      </div>
    )
  }

  const completedSteps = registration.nextSteps.filter((s) => s.status === 'COMPLETED').length
  const totalSteps = registration.nextSteps.length
  const progressPercentage = (completedSteps / totalSteps) * 100

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Project Registration Status</h1>
        <p className="text-neutral-600 mt-1">
          Track your FYP registration progress for {registration.cycle} {registration.academicYear}
        </p>
      </div>

      {/* Status Overview Card */}
      <Card className={cn('border-2', status.bgColor.replace('100', '200'))}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Badge className={cn(status.bgColor, status.color)} size="lg">
                {status.label}
              </Badge>
              <span className="text-neutral-500">•</span>
              <span className="text-neutral-600">{registration.cycle} {registration.academicYear}</span>
            </div>
            <h2 className="text-lg font-semibold text-neutral-900 mb-1">
              {registration.status === 'REGISTERED'
                ? 'You are registered for FYP!'
                : `Step ${completedSteps + 1} of ${totalSteps}: ${registration.nextSteps.find((s) => s.status === 'CURRENT')?.title}`}
            </h2>
            <p className="text-neutral-600">
              {registration.nextSteps.find((s) => s.status === 'CURRENT')?.description ||
                'All steps completed'}
            </p>
          </div>

          {/* Progress Circle */}
          <div className="flex items-center gap-4">
            <div className="relative w-20 h-20">
              <svg className="w-20 h-20 transform -rotate-90">
                <circle
                  cx="40"
                  cy="40"
                  r="36"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  className="text-neutral-200"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="36"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={`${2 * Math.PI * 36}`}
                  strokeDashoffset={`${2 * Math.PI * 36 * (1 - progressPercentage / 100)}`}
                  className="text-primary-600 transition-all duration-500"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold text-neutral-900">
                  {Math.round(progressPercentage)}%
                </span>
              </div>
            </div>
            <div className="text-sm text-neutral-600">
              <p className="font-medium">{completedSteps} of {totalSteps}</p>
              <p>steps completed</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Supervisor Card */}
      {registration.supervisor && (
        <Card>
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">Your Supervisor</h3>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center">
              <span className="text-lg font-bold text-primary-600">
                {registration.supervisor.fullName
                  .split(' ')
                  .filter((n) => !['Dr.', 'Prof.'].includes(n))
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)}
              </span>
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-neutral-900">{registration.supervisor.fullName}</h4>
              <p className="text-sm text-neutral-600">
                {registration.supervisor.title} • {registration.supervisor.department}
              </p>
              <p className="text-sm text-neutral-500">{registration.supervisor.email}</p>
            </div>
            <Link to={ROUTES.STUDENT.SUPERVISOR_DETAIL.replace(':id', registration.supervisor.supervisorId)}>
              <Button variant="secondary" size="sm">
                View Profile
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {/* Progress Steps */}
      <Card>
        <h3 className="text-lg font-semibold text-neutral-900 mb-6">Registration Steps</h3>
        <div className="space-y-4">
          {registration.nextSteps.map((step, index) => {
            const StepIcon = stepIcons[index] || CheckCircle
            const isCompleted = step.status === 'COMPLETED'
            const isCurrent = step.status === 'CURRENT'
            const isPending = step.status === 'PENDING'

            return (
              <div
                key={step.step}
                className={cn(
                  'flex items-start gap-4 p-4 rounded-lg transition-colors',
                  isCurrent && 'bg-primary-50 border border-primary-200',
                  isCompleted && 'bg-success-50',
                  isPending && 'bg-neutral-50'
                )}
              >
                {/* Step Number/Icon */}
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
                    isCompleted && 'bg-success-500 text-white',
                    isCurrent && 'bg-primary-600 text-white',
                    isPending && 'bg-neutral-200 text-neutral-500'
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <StepIcon className="h-5 w-5" />
                  )}
                </div>

                {/* Step Content */}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className={cn(
                      'font-medium',
                      isCompleted && 'text-success-900',
                      isCurrent && 'text-primary-900',
                      isPending && 'text-neutral-500'
                    )}>
                      {step.title}
                    </h4>
                    {isCompleted && (
                      <Badge variant="success" size="sm">Completed</Badge>
                    )}
                    {isCurrent && (
                      <Badge variant="primary" size="sm">Current</Badge>
                    )}
                  </div>
                  <p className={cn(
                    'text-sm mt-1',
                    isCompleted && 'text-success-700',
                    isCurrent && 'text-primary-700',
                    isPending && 'text-neutral-400'
                  )}>
                    {step.description}
                  </p>

                  {/* Timestamp or Due Date */}
                  {step.completedAt && (
                    <p className="text-xs text-success-600 mt-2 flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Completed on {new Date(step.completedAt).toLocaleDateString('en-MY')}
                    </p>
                  )}
                  {step.dueDate && isCurrent && (
                    <p className="text-xs text-warning-600 mt-2 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Due: {new Date(step.dueDate).toLocaleDateString('en-MY')}
                    </p>
                  )}
                </div>

                {/* Action */}
                {isCurrent && (
                  <div>
                    {step.step === 2 && !registration.supervisor && (
                      <Link to={ROUTES.STUDENT.SUPERVISORS}>
                        <Button variant="primary" size="sm" rightIcon={<ArrowRight className="h-4 w-4" />}>
                          Find Supervisor
                        </Button>
                      </Link>
                    )}
                    {step.step === 3 && (
                      <Link to={ROUTES.STUDENT.PROPOSAL}>
                        <Button variant="primary" size="sm" rightIcon={<ArrowRight className="h-4 w-4" />}>
                          Work on Proposal
                        </Button>
                      </Link>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </Card>

      {/* Activity Timeline */}
      <Card>
        <h3 className="text-lg font-semibold text-neutral-900 mb-4">Recent Activity</h3>
        <div className="relative">
          <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-neutral-200" />
          <div className="space-y-4">
            {registration.timeline.map((event) => (
              <div key={event.eventId} className="relative flex gap-4 pl-8">
                <div
                  className={cn(
                    'absolute left-0 w-6 h-6 rounded-full flex items-center justify-center',
                    event.type === 'SUBMISSION' ? 'bg-primary-100' : 'bg-success-100'
                  )}
                >
                  {event.type === 'SUBMISSION' ? (
                    <FileText className="h-3 w-3 text-primary-600" />
                  ) : (
                    <CheckCircle className="h-3 w-3 text-success-600" />
                  )}
                </div>
                <div className="flex-1 pb-4">
                  <p className="font-medium text-neutral-900 text-sm">{event.title}</p>
                  <p className="text-xs text-neutral-500 mt-0.5">{event.description}</p>
                  <p className="text-xs text-neutral-400 mt-1">
                    {new Date(event.timestamp).toLocaleDateString('en-MY', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  )
}
