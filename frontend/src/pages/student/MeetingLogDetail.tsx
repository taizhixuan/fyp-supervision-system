import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Calendar,
  AlertCircle,
  Edit,
  Download,
  PenLine,
  Lock,
  Clock,
  MessageSquare,
  Send,
} from 'lucide-react'
import { Card, Button, Badge, Spinner, AlertBanner } from '@/components/ui'
import {
  MeetingLogHeader,
  TaskCheckboxDisplay,
  SignaturePadModal,
  SignatureDisplay,
} from '@/components/meetingLog'
import {
  useMeetingLogDetail,
  useSignMeetingLog,
  useSubmitMeetingLog,
  useExportMeetingLog,
} from '@/lib/hooks/useMeetingLog'
import { ROUTES } from '@/lib/constants/routes'
import { MEETING_LOG_STATUS_CONFIG } from '@/types/meetingLog'

export function MeetingLogDetail() {
  const { id } = useParams<{ id: string }>()

  const [showSignatureModal, setShowSignatureModal] = useState(false)

  const { data: log, isLoading, error } = useMeetingLogDetail(id || '')
  const signMutation = useSignMeetingLog()
  const submitMutation = useSubmitMeetingLog()
  const exportMutation = useExportMeetingLog()

  const handleSign = async (dataUrl: string, sha256Hash: string) => {
    if (!id) return
    try {
      await signMutation.mutateAsync({
        logId: id,
        signatureData: {
          signatureImageDataUrl: dataUrl,
          signatureSha256: sha256Hash,
        },
      })
    } catch (err) {
      // Error handled by mutation
    }
  }

  const handleSubmit = async () => {
    if (!id) return
    try {
      await submitMutation.mutateAsync(id)
    } catch (err) {
      // Error handled by mutation
    }
  }

  const handleExport = async () => {
    if (!id) return
    try {
      await exportMutation.mutateAsync(id)
    } catch {
      // mutation surfaces error via state; no extra handling here
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
      <div className="max-w-3xl mx-auto space-y-3 lg:space-y-4">
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

  const statusConfig = MEETING_LOG_STATUS_CONFIG[log.status]
  const canEdit = ['DRAFT', 'CORRECTION_REQUIRED'].includes(log.status)
  const canSubmit = log.status === 'DRAFT'
  const canSign = log.status === 'SUPERVISOR_SIGNED'

  const supervisorSignature = log.signatures.find((s) => s.signerRole === 'SUPERVISOR')
  const studentSignature = log.signatures.find((s) => s.signerRole === 'STUDENT')

  return (
    <div className="max-w-4xl mx-auto space-y-3 lg:space-y-4">
      {/* Back Button */}
      <Link
        to={ROUTES.STUDENT.MEETING_LOGS}
        className="inline-flex items-center gap-2 text-neutral-600 hover:text-primary-600 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Meeting Logs
      </Link>

      {/* Status Banner */}
      {log.status === 'CORRECTION_REQUIRED' && (
        <Card className="bg-error-50 border-error-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-error-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-error-900">Correction Required</p>
              <p className="text-sm text-error-700 mt-1">
                {log.correctionReason || 'Your supervisor has requested changes to this log. Please update accordingly.'}
              </p>
              <Link to={ROUTES.STUDENT.MEETING_LOG_EDIT.replace(':id', log.logId)}>
                <Button variant="danger" size="sm" className="mt-3" leftIcon={<Edit className="h-4 w-4" />}>
                  Edit Meeting Log
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      )}

      {log.status === 'SUPERVISOR_SIGNED' && (
        <Card className="bg-info-50 border-info-200">
          <div className="flex items-start gap-3">
            <PenLine className="h-5 w-5 text-info-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-info-900">Awaiting Your Signature</p>
              <p className="text-sm text-info-700 mt-1">
                Your supervisor has reviewed and signed this log. Please add your signature to finalize.
              </p>
              <Button
                variant="primary"
                size="sm"
                className="mt-3"
                leftIcon={<PenLine className="h-4 w-4" />}
                onClick={() => setShowSignatureModal(true)}
              >
                Sign Meeting Log
              </Button>
            </div>
          </div>
        </Card>
      )}

      {log.status === 'LOCKED' && (
        <Card className="bg-success-50 border-success-200">
          <div className="flex items-start gap-3">
            <Lock className="h-5 w-5 text-success-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-success-900">Meeting Log Finalized</p>
              <p className="text-sm text-success-700 mt-1">
                This log has been signed by both parties and is now locked.
                {log.lockedAt && ` Finalized on ${new Date(log.lockedAt).toLocaleDateString('en-MY')}.`}
              </p>
              <Button
                variant="secondary"
                size="sm"
                className="mt-3"
                leftIcon={<Download className="h-4 w-4" />}
                onClick={() => {
                  // TODO: Implement PDF download
                  alert('PDF export coming soon!')
                }}
              >
                Download PDF
              </Button>
            </div>
          </div>
        </Card>
      )}

      {log.status === 'SUBMITTED' && (
        <Card className="bg-warning-50 border-warning-200">
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-warning-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-warning-900">Pending Review</p>
              <p className="text-sm text-warning-700 mt-1">
                This log has been submitted and is waiting for supervisor review.
                {log.submittedAt && ` Submitted on ${new Date(log.submittedAt).toLocaleDateString('en-MY')}.`}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <Badge variant={statusConfig.variant} size="md">
          {statusConfig.label}
        </Badge>
        <div className="flex gap-2">
          {canEdit && (
            <Link to={ROUTES.STUDENT.MEETING_LOG_EDIT.replace(':id', log.logId)}>
              <Button variant="secondary" leftIcon={<Edit className="h-4 w-4" />}>
                Edit
              </Button>
            </Link>
          )}
          <Button
            variant="secondary"
            size="sm"
            onClick={handleExport}
            isLoading={exportMutation.isPending}
          >
            <Download className="h-4 w-4 mr-2" />
            Download DOCX
          </Button>
        </div>
      </div>

      {/* Meeting Log Header */}
      <MeetingLogHeader
        data={{
          meetingDate: log.meetingDate,
          meetingNumber: log.meetingNumber,
          meetingMode: log.meetingMode,
          projectTitle: log.projectTitle,
          fypPhase: log.fypPhase,
          student: log.student,
          supervisor: log.supervisor,
          coSupervisor: log.coSupervisor,
        }}
      />

      {/* Section 1: Tasks */}
      <Card>
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">
          Section 1: Tasks Carried Out
        </h2>
        <TaskCheckboxDisplay tasks={log.tasks} />

        {log.workDoneDetails && (
          <div className="mt-6 p-4 bg-neutral-50 rounded-lg">
            <h3 className="text-sm font-semibold text-neutral-700 mb-2">
              Details of Work Done
            </h3>
            <p className="text-neutral-700 whitespace-pre-wrap">{log.workDoneDetails}</p>
          </div>
        )}
      </Card>

      {/* Section 2: Work To Be Done */}
      <Card>
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">
          <Calendar className="h-5 w-5 inline mr-2 text-primary-600" />
          Section 2: Work To Be Done
        </h2>
        <p className="text-neutral-700 whitespace-pre-wrap">
          {log.workToBeDone || <span className="text-neutral-400 italic">Not specified</span>}
        </p>
      </Card>

      {/* Section 3: Problems & Solutions */}
      <Card>
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">
          <AlertCircle className="h-5 w-5 inline mr-2 text-warning-600" />
          Section 3: Problems Faced & Solutions
        </h2>
        <p className="text-neutral-700 whitespace-pre-wrap">
          {log.problemsAndSolutions || <span className="text-neutral-400 italic">None reported</span>}
        </p>
      </Card>

      {/* Section 4: Supervisor Comments */}
      {log.supervisorComments && (
        <Card className="border-primary-200 bg-primary-50">
          <h2 className="text-lg font-semibold text-primary-900 mb-4">
            <MessageSquare className="h-5 w-5 inline mr-2" />
            Section 4: Supervisor Comments
          </h2>
          <p className="text-primary-800 whitespace-pre-wrap">{log.supervisorComments}</p>
        </Card>
      )}

      {/* Signatures Section */}
      <Card>
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">
          <PenLine className="h-5 w-5 inline mr-2 text-neutral-600" />
          Signatures
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Supervisor Signature */}
          <div className="border border-neutral-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-neutral-500 mb-3">Supervisor</h3>
            {supervisorSignature ? (
              <SignatureDisplay
                signatureUrl={supervisorSignature.signatureImageUrl || ''}
                signerName={supervisorSignature.signerName}
                signedAt={supervisorSignature.signedAt}
              />
            ) : (
              <div className="text-center py-6 text-neutral-400">
                <PenLine className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Pending signature</p>
              </div>
            )}
          </div>

          {/* Student Signature */}
          <div className="border border-neutral-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-neutral-500 mb-3">Student</h3>
            {studentSignature ? (
              <SignatureDisplay
                signatureUrl={studentSignature.signatureImageUrl || ''}
                signerName={studentSignature.signerName}
                signedAt={studentSignature.signedAt}
              />
            ) : canSign ? (
              <div className="text-center py-4">
                <Button
                  variant="primary"
                  onClick={() => setShowSignatureModal(true)}
                  leftIcon={<PenLine className="h-4 w-4" />}
                  isLoading={signMutation.isPending}
                >
                  Add Your Signature
                </Button>
              </div>
            ) : (
              <div className="text-center py-6 text-neutral-400">
                <PenLine className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Pending signature</p>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Actions */}
      {canSubmit && (
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-neutral-900">Ready to submit?</h3>
              <p className="text-sm text-neutral-600">
                Once submitted, your supervisor will be notified to review this log.
              </p>
            </div>
            <Button
              variant="primary"
              onClick={handleSubmit}
              leftIcon={<Send className="h-4 w-4" />}
              isLoading={submitMutation.isPending}
            >
              Submit for Review
            </Button>
          </div>
        </Card>
      )}

      {/* Signature Modal */}
      <SignaturePadModal
        isOpen={showSignatureModal}
        onClose={() => setShowSignatureModal(false)}
        onSave={handleSign}
        title="Sign Meeting Log"
      />

      {/* Error alerts */}
      {signMutation.isError && (
        <AlertBanner
          variant="error"
          title="Failed to sign"
          description={signMutation.error?.message || 'An error occurred while signing.'}
        />
      )}
      {submitMutation.isError && (
        <AlertBanner
          variant="error"
          title="Failed to submit"
          description={submitMutation.error?.message || 'An error occurred while submitting.'}
        />
      )}
    </div>
  )
}
