import { useState, useMemo, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle, ClipboardList, Link2 } from 'lucide-react'
import { Card, Button, AlertBanner, Spinner } from '@/components/ui'
import { MeetingLogForm } from '@/components/meetingLog'
import type { MeetingLogFormData } from '@/components/meetingLog'
import { useCreateMeetingLog, useMeetingLogPrefill } from '@/lib/hooks/useMeetingLog'
import { useMeetingList } from '@/lib/hooks/useStudent'
import { ROUTES } from '@/lib/constants/routes'

export function MeetingLogCreate() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialMeetingId = searchParams.get('meetingId') || ''
  const [selectedMeetingId, setSelectedMeetingId] = useState<string>(initialMeetingId)

  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [createdLogId, setCreatedLogId] = useState<string | null>(null)
  const [isDraft, setIsDraft] = useState(false)

  const createMeetingLog = useCreateMeetingLog()
  const { data: prefill, isLoading: prefillLoading } = useMeetingLogPrefill(selectedMeetingId || undefined)
  const { data: meetingsData, isLoading: meetingsLoading } = useMeetingList()

  // Confirmed/completed meetings for the picker
  const linkableMeetings = useMemo(() => {
    const list = meetingsData?.meetings || []
    return list.filter((m) => m.status === 'CONFIRMED' || m.status === 'COMPLETED')
  }, [meetingsData])

  const handlePickerChange = (value: string) => {
    setSelectedMeetingId(value)
    if (value) {
      setSearchParams({ meetingId: value }, { replace: true })
    } else {
      searchParams.delete('meetingId')
      setSearchParams(searchParams, { replace: true })
    }
  }

  const handleSubmit = async (data: MeetingLogFormData, asDraft: boolean) => {
    try {
      setIsDraft(asDraft)
      const result = await createMeetingLog.mutateAsync({
        meetingId: selectedMeetingId || undefined,
        meetingDate: data.meetingDate,
        meetingNumber: data.meetingNumber,
        meetingMode: data.meetingMode,
        projectTitle: data.projectTitle,
        fypPhase: data.fypPhase,
        tasks: data.tasks.map((t) => ({
          taskCode: t.taskCode as import('@/types/meetingLog').MeetingLogTaskCode,
          isSelected: t.isSelected,
          details: t.details,
        })),
        workDoneDetails: data.workDoneDetails,
        workToBeDone: data.workToBeDone,
        problemsAndSolutions: data.problemsAndSolutions || '',
        status: asDraft ? 'DRAFT' : 'SUBMITTED',
      })
      setCreatedLogId(result.logId)
      setSubmitSuccess(true)
    } catch (err) {
      // Error handled by mutation
    }
  }

  // Sync URL when navigating in directly with a meetingId param
  useEffect(() => {
    if (initialMeetingId && initialMeetingId !== selectedMeetingId) {
      setSelectedMeetingId(initialMeetingId)
    }
  }, [initialMeetingId, selectedMeetingId])

  if (submitSuccess) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-success-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-success-600" />
          </div>
          <h2 className="text-xl font-bold text-neutral-900 mb-2">
            {isDraft ? 'Draft Saved!' : 'Meeting Log Submitted!'}
          </h2>
          <p className="text-neutral-600 mb-6">
            {isDraft
              ? 'Your meeting log has been saved as a draft. You can edit and submit it later.'
              : 'Your meeting log has been submitted for supervisor review.'}
          </p>
          <div className="flex justify-center gap-3">
            {createdLogId && (
              <Link to={ROUTES.STUDENT.MEETING_LOG_DETAIL.replace(':id', createdLogId)}>
                <Button variant="primary">View Meeting Log</Button>
              </Link>
            )}
            <Link to={ROUTES.STUDENT.MEETING_LOGS}>
              <Button variant="secondary">View All Logs</Button>
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  // Build initialData from prefill once it loads.
  const initialData: Partial<MeetingLogFormData> | undefined = prefill
    ? {
        meetingNumber: prefill.meetingNumber,
        projectTitle: prefill.projectTitle,
        fypPhase: prefill.fypPhase,
        ...(prefill.meetingDate ? { meetingDate: prefill.meetingDate } : {}),
        ...(prefill.meetingMode ? { meetingMode: prefill.meetingMode } : {}),
      }
    : undefined

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back Button */}
      <Link
        to={ROUTES.STUDENT.MEETING_LOGS}
        className="inline-flex items-center gap-2 text-neutral-600 hover:text-primary-600 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Meeting Logs
      </Link>

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
          <ClipboardList className="h-6 w-6 text-primary-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Create Meeting Log</h1>
          <p className="text-neutral-600 mt-0.5">
            Record your supervision meeting in MMU FCI format
          </p>
        </div>
      </div>

      {/* Tips */}
      <AlertBanner
        variant="info"
        title="Meeting Log Guidelines"
        description="Fill in all required sections accurately. Your supervisor will review this log and may request corrections before signing. Once both parties sign, the log will be locked and can be exported as PDF."
      />

      {/* Meeting Picker */}
      <Card>
        <div className="flex items-center gap-2 mb-2">
          <Link2 className="h-4 w-4 text-neutral-500" />
          <h3 className="text-sm font-semibold text-neutral-700">Link to a meeting</h3>
        </div>
        <p className="text-xs text-neutral-500 mb-3">
          Selecting a meeting auto-fills date and mode. Number, project title and FYP phase fill from your active project.
        </p>
        <select
          value={selectedMeetingId}
          onChange={(e) => handlePickerChange(e.target.value)}
          disabled={meetingsLoading}
          className="w-full px-4 py-2.5 rounded-lg border border-neutral-300 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">— No linked meeting (manual entry) —</option>
          {linkableMeetings.map((m) => {
            const dateStr = m.scheduledAt
              ? new Date(m.scheduledAt).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })
              : ''
            return (
              <option key={m.meetingId} value={String(m.meetingId)}>
                {m.title || `Meeting #${m.meetingId}`} — {dateStr} ({m.status})
              </option>
            )
          })}
        </select>
        {meetingsLoading && (
          <p className="text-xs text-neutral-500 mt-2">Loading meetings…</p>
        )}
      </Card>

      {/* Form (re-mounts on picker change so prefill takes effect) */}
      {prefillLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" label="Loading meeting details…" />
        </div>
      ) : (
        <MeetingLogForm
          key={selectedMeetingId || 'no-meeting'}
          initialData={initialData}
          onSubmit={handleSubmit}
          isLoading={createMeetingLog.isPending}
        />
      )}

      {/* Error */}
      {createMeetingLog.isError && (
        <AlertBanner
          variant="error"
          title="Failed to create meeting log"
          description={createMeetingLog.error?.message || 'An unexpected error occurred. Please try again.'}
        />
      )}
    </div>
  )
}
