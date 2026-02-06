import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle, Edit3 } from 'lucide-react'
import { Card, Button, AlertBanner, Spinner } from '@/components/ui'
import { MeetingLogForm } from '@/components/meetingLog'
import type { MeetingLogFormData } from '@/components/meetingLog'
import { useMeetingLogDetail, useUpdateMeetingLog, useSubmitMeetingLog } from '@/lib/hooks/useMeetingLog'
import { ROUTES } from '@/lib/constants/routes'
import type { MeetingLogTaskCode } from '@/types/meetingLog'

export function MeetingLogEdit() {
  const { id } = useParams<{ id: string }>()

  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [isDraft, setIsDraft] = useState(false)

  const { data: log, isLoading, error } = useMeetingLogDetail(id || '')
  const updateMutation = useUpdateMeetingLog()
  const submitMutation = useSubmitMeetingLog()

  const handleSubmit = async (data: MeetingLogFormData, asDraft: boolean) => {
    if (!id) return

    try {
      setIsDraft(asDraft)

      // Update the log
      await updateMutation.mutateAsync({
        logId: id,
        logData: {
          meetingDate: data.meetingDate,
          meetingNumber: data.meetingNumber,
          meetingMode: data.meetingMode,
          projectTitle: data.projectTitle,
          fypPhase: data.fypPhase,
          tasks: data.tasks.map((t) => ({
            taskCode: t.taskCode as MeetingLogTaskCode,
            isSelected: t.isSelected,
            details: t.details,
          })),
          workDoneDetails: data.workDoneDetails,
          workToBeDone: data.workToBeDone,
          problemsAndSolutions: data.problemsAndSolutions || '',
        },
      })

      // If not saving as draft, submit for review
      if (!asDraft) {
        await submitMutation.mutateAsync(id)
      }

      setSubmitSuccess(true)
    } catch (err) {
      // Error handled by mutation
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" label="Loading meeting log..." />
      </div>
    )
  }

  if (error || !log) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <AlertBanner
          variant="error"
          title="Failed to load meeting log"
          description="The meeting log could not be found or an error occurred."
        />
        <Link to={ROUTES.STUDENT.MEETING_LOGS}>
          <Button variant="secondary" leftIcon={<ArrowLeft className="h-4 w-4" />}>
            Back to Meeting Logs
          </Button>
        </Link>
      </div>
    )
  }

  // Check if log can be edited
  const canEdit = ['DRAFT', 'CORRECTION_REQUIRED'].includes(log.status)
  if (!canEdit) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <AlertBanner
          variant="warning"
          title="Cannot edit this log"
          description="This meeting log cannot be edited because it has already been submitted or signed."
        />
        <Link to={ROUTES.STUDENT.MEETING_LOG_DETAIL.replace(':id', log.logId)}>
          <Button variant="secondary" leftIcon={<ArrowLeft className="h-4 w-4" />}>
            View Meeting Log
          </Button>
        </Link>
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
            {isDraft ? 'Changes Saved!' : 'Meeting Log Resubmitted!'}
          </h2>
          <p className="text-neutral-600 mb-6">
            {isDraft
              ? 'Your changes have been saved. You can continue editing or submit when ready.'
              : 'Your meeting log has been resubmitted for supervisor review.'}
          </p>
          <div className="flex justify-center gap-3">
            <Link to={ROUTES.STUDENT.MEETING_LOG_DETAIL.replace(':id', log.logId)}>
              <Button variant="primary">View Meeting Log</Button>
            </Link>
            <Link to={ROUTES.STUDENT.MEETING_LOGS}>
              <Button variant="secondary">View All Logs</Button>
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  // Prepare initial data for the form
  const initialData: Partial<MeetingLogFormData> = {
    meetingDate: log.meetingDate,
    meetingNumber: log.meetingNumber,
    meetingMode: log.meetingMode,
    projectTitle: log.projectTitle,
    fypPhase: log.fypPhase,
    tasks: log.tasks.map((t) => ({
      taskCode: t.taskCode,
      isSelected: t.isSelected,
      details: t.details || '',
    })),
    workDoneDetails: log.workDoneDetails,
    workToBeDone: log.workToBeDone,
    problemsAndSolutions: log.problemsAndSolutions || '',
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back Button */}
      <Link
        to={ROUTES.STUDENT.MEETING_LOG_DETAIL.replace(':id', log.logId)}
        className="inline-flex items-center gap-2 text-neutral-600 hover:text-primary-600 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Meeting Log
      </Link>

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
          <Edit3 className="h-6 w-6 text-amber-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Edit Meeting Log</h1>
          <p className="text-neutral-600 mt-0.5">
            Meeting #{log.meetingNumber} - {new Date(log.meetingDate).toLocaleDateString('en-MY')}
          </p>
        </div>
      </div>

      {/* Correction Required Alert */}
      {log.status === 'CORRECTION_REQUIRED' && log.correctionReason && (
        <AlertBanner
          variant="error"
          title="Correction Required"
          description={log.correctionReason}
        />
      )}

      {/* Tips */}
      <AlertBanner
        variant="info"
        title="Editing Guidelines"
        description="Make the necessary changes and resubmit for supervisor review. Your supervisor will be notified of the updated log."
      />

      {/* Form */}
      <MeetingLogForm
        initialData={initialData}
        onSubmit={handleSubmit}
        isLoading={updateMutation.isPending || submitMutation.isPending}
      />

      {/* Errors */}
      {updateMutation.isError && (
        <AlertBanner
          variant="error"
          title="Failed to save changes"
          description={updateMutation.error?.message || 'An unexpected error occurred.'}
        />
      )}
      {submitMutation.isError && (
        <AlertBanner
          variant="error"
          title="Failed to submit"
          description={submitMutation.error?.message || 'An unexpected error occurred.'}
        />
      )}
    </div>
  )
}
