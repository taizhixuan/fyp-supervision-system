import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  ArrowLeft,
  Send,
  FileText,
  AlertCircle,
  CheckCircle,
} from 'lucide-react'
import { Card, Button, Input, Badge, Spinner, AlertBanner } from '@/components/ui'
import { useSupervisorDetail, useCreateSupervisionRequest, useSupervisionRequests } from '@/lib/hooks/useStudent'
import { ROUTES } from '@/lib/constants/routes'
import { cn } from '@/lib/utils/cn'

// Validation schema
const requestSchema = z.object({
  proposedTitle: z
    .string()
    .min(10, 'Title must be at least 10 characters')
    .max(200, 'Title must be less than 200 characters'),
  topicDescription: z
    .string()
    .min(50, 'Description must be at least 50 characters')
    .max(2000, 'Description must be less than 2000 characters'),
  message: z
    .string()
    .max(1000, 'Message must be less than 1000 characters')
    .optional(),
})

type RequestFormData = z.infer<typeof requestSchema>

// Sample supervisor for design preview
const SAMPLE_SUPERVISOR = {
  supervisorId: '1',
  userId: '101',
  fullName: 'Dr. Sarah Lee Wei Lin',
  email: 'sarah.lee@mmu.edu.my',
  title: 'Associate Professor',
  department: 'Software Engineering',
  faculty: 'Faculty of Computing and Informatics',
  researchAreas: ['Artificial Intelligence', 'Machine Learning', 'NLP'],
  currentLoad: 5,
  maxCapacity: 8,
  isAcceptingStudents: true,
}

export function CreateSupervisionRequest() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const supervisorId = searchParams.get('supervisorId') || '1'
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const { data: supervisor, isLoading: loadingSupervisor } = useSupervisorDetail(supervisorId)
  const { data: existingRequests } = useSupervisionRequests()
  const createRequest = useCreateSupervisionRequest()

  // Use sample data if no API data available
  const displaySupervisor = supervisor || SAMPLE_SUPERVISOR

  // Check if user already has a pending request to this supervisor
  const hasPendingRequest = existingRequests?.requests?.some(
    (r) => r.supervisorId === supervisorId && r.status === 'PENDING'
  )

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<RequestFormData>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      proposedTitle: '',
      topicDescription: '',
      message: '',
    },
  })

  const topicDescription = watch('topicDescription')
  const message = watch('message')

  const onSubmit = async (data: RequestFormData) => {
    try {
      await createRequest.mutateAsync({
        supervisorId,
        ...data,
      })
      setSubmitSuccess(true)
    } catch (err) {
      // Error handled by mutation
    }
  }

  if (loadingSupervisor) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" label="Loading..." />
      </div>
    )
  }

  if (submitSuccess) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-success-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-success-600" />
          </div>
          <h2 className="text-xl font-bold text-neutral-900 mb-2">
            Request Sent Successfully!
          </h2>
          <p className="text-neutral-600 mb-6">
            Your supervision request has been sent to {displaySupervisor.fullName}.
            You will be notified when they respond.
          </p>
          <div className="flex justify-center gap-3">
            <Link to={ROUTES.STUDENT.MY_REQUESTS}>
              <Button variant="primary">View My Requests</Button>
            </Link>
            <Link to={ROUTES.STUDENT.SUPERVISORS}>
              <Button variant="secondary">Browse More Supervisors</Button>
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  if (hasPendingRequest) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Link
          to={ROUTES.STUDENT.SUPERVISORS}
          className="inline-flex items-center gap-2 text-neutral-600 hover:text-primary-600 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Directory
        </Link>

        <AlertBanner
          variant="warning"
          title="Pending Request Exists"
          description={`You already have a pending supervision request with ${displaySupervisor.fullName}. Please wait for their response before sending another request.`}
        />

        <div className="flex gap-3">
          <Link to={ROUTES.STUDENT.MY_REQUESTS}>
            <Button variant="primary">View My Requests</Button>
          </Link>
          <Link to={ROUTES.STUDENT.SUPERVISORS}>
            <Button variant="secondary">Browse Other Supervisors</Button>
          </Link>
        </div>
      </div>
    )
  }

  if (!displaySupervisor.isAcceptingStudents) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Link
          to={ROUTES.STUDENT.SUPERVISORS}
          className="inline-flex items-center gap-2 text-neutral-600 hover:text-primary-600 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Directory
        </Link>

        <AlertBanner
          variant="error"
          title="Supervisor Not Available"
          description={`${displaySupervisor.fullName} is currently not accepting new students. Please choose another supervisor.`}
        />

        <Link to={ROUTES.STUDENT.SUPERVISORS}>
          <Button variant="primary">Browse Supervisors</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back Button */}
      <Link
        to={ROUTES.STUDENT.SUPERVISOR_DETAIL.replace(':id', supervisorId)}
        className="inline-flex items-center gap-2 text-neutral-600 hover:text-primary-600 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Supervisor Profile
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Send Supervision Request</h1>
        <p className="text-neutral-600 mt-1">
          Request {displaySupervisor.fullName} to be your FYP supervisor
        </p>
      </div>

      {/* Supervisor Card */}
      <Card className="bg-primary-50 border-primary-200">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
            <span className="text-lg font-bold text-primary-600">
              {displaySupervisor.fullName
                .split(' ')
                .filter((n) => !['Dr.', 'Prof.'].includes(n))
                .map((n) => n[0])
                .join('')
                .slice(0, 2)}
            </span>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-primary-900">{displaySupervisor.fullName}</h3>
            <p className="text-sm text-primary-700">{displaySupervisor.title} • {displaySupervisor.department}</p>
            <div className="mt-1 flex flex-wrap gap-1">
              {displaySupervisor.researchAreas.slice(0, 3).map((area) => (
                <Badge key={area} variant="primary" size="sm">
                  {area}
                </Badge>
              ))}
            </div>
          </div>
          <Badge variant="success">
            {displaySupervisor.maxCapacity - displaySupervisor.currentLoad} slots
          </Badge>
        </div>
      </Card>

      {/* Request Form */}
      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {createRequest.isError && (
            <AlertBanner
              variant="error"
              title="Failed to send request"
              description="Please try again later."
              dismissible
            />
          )}

          {/* Proposed Title */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Proposed Project Title <span className="text-error-500">*</span>
            </label>
            <Input
              placeholder="e.g., AI-Powered Student Supervision System"
              leftIcon={<FileText className="h-5 w-5" />}
              error={errors.proposedTitle?.message}
              {...register('proposedTitle')}
            />
            <p className="mt-1 text-sm text-neutral-500">
              Give a brief, descriptive title for your proposed FYP project
            </p>
          </div>

          {/* Topic Description */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Project Description <span className="text-error-500">*</span>
            </label>
            <textarea
              className={cn(
                'w-full px-4 py-3 rounded-lg border transition-colors resize-none',
                'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
                errors.topicDescription ? 'border-error-500' : 'border-neutral-300'
              )}
              rows={6}
              placeholder="Describe your project idea, including:&#10;- Problem you want to solve&#10;- Your proposed approach&#10;- Why this topic interests you&#10;- Any relevant skills or experience you have"
              {...register('topicDescription')}
            />
            {errors.topicDescription && (
              <p className="mt-1 text-sm text-error-600">{errors.topicDescription.message}</p>
            )}
            <p className="mt-1 text-sm text-neutral-500">
              {topicDescription?.length || 0}/2000 characters (minimum 50)
            </p>
          </div>

          {/* Personal Message */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Personal Message (Optional)
            </label>
            <textarea
              className={cn(
                'w-full px-4 py-3 rounded-lg border transition-colors resize-none',
                'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
                errors.message ? 'border-error-500' : 'border-neutral-300'
              )}
              rows={4}
              placeholder="Add a personal message to the supervisor (optional). You might mention why you specifically want to work with them."
              {...register('message')}
            />
            {errors.message && (
              <p className="mt-1 text-sm text-error-600">{errors.message.message}</p>
            )}
            <p className="mt-1 text-sm text-neutral-500">
              {message?.length || 0}/1000 characters
            </p>
          </div>

          {/* Tips */}
          <div className="bg-neutral-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-neutral-700 mb-2 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Tips for a Good Request
            </h4>
            <ul className="text-sm text-neutral-600 space-y-1">
              <li>• Be specific about your project idea and goals</li>
              <li>• Explain why your topic aligns with the supervisor's research areas</li>
              <li>• Mention relevant courses or skills you have</li>
              <li>• Be professional and concise</li>
            </ul>
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-between pt-4 border-t border-neutral-200">
            <p className="text-sm text-neutral-500">
              The supervisor will be notified of your request
            </p>
            <Button
              type="submit"
              variant="primary"
              leftIcon={<Send className="h-4 w-4" />}
              isLoading={isSubmitting || createRequest.isPending}
            >
              Send Request
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
