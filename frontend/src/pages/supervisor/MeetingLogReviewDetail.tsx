import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Calendar,
  AlertCircle,
  PenLine,
  Lock,
  Clock,
  MessageSquare,
  CheckCircle,
  XCircle,
  GraduationCap,
} from 'lucide-react'
import { Card, Button, Badge, Spinner, AlertBanner } from '@/components/ui'
import {
  MeetingLogHeader,
  TaskCheckboxDisplay,
  SignaturePadModal,
  SignatureDisplay,
} from '@/components/meetingLog'
import {
  useSupervisorMeetingLogDetail,
  useAddSupervisorComments,
  useRequestMeetingLogCorrection,
  useSupervisorSignMeetingLog,
} from '@/lib/hooks/useMeetingLog'
import { ROUTES } from '@/lib/constants/routes'
import { MEETING_LOG_STATUS_CONFIG } from '@/types/meetingLog'

export function MeetingLogReviewDetail() {
  const { id } = useParams<{ id: string }>()

  const [showSignatureModal, setShowSignatureModal] = useState(false)
  const [showCorrectionModal, setShowCorrectionModal] = useState(false)
  const [comments, setComments] = useState('')
  const [correctionReason, setCorrectionReason] = useState('')
  const [commentsSuccess, setCommentsSuccess] = useState(false)

  const { data: log, isLoading, error } = useSupervisorMeetingLogDetail(id || '')
  const addCommentsMutation = useAddSupervisorComments()
  const requestCorrectionMutation = useRequestMeetingLogCorrection()
  const signMutation = useSupervisorSignMeetingLog()

  const handleSaveComments = async () => {
    if (!id || !comments.trim()) return
    try {
      await addCommentsMutation.mutateAsync({
        logId: id,
        comments: comments.trim(),
      })
      setCommentsSuccess(true)
      setTimeout(() => setCommentsSuccess(false), 3000)
    } catch (err) {
      // Error handled by mutation
    }
  }

  const handleRequestCorrection = async () => {
    if (!id || !correctionReason.trim()) return
    try {
      await requestCorrectionMutation.mutateAsync({
        logId: id,
        reason: correctionReason.trim(),
      })
      setShowCorrectionModal(false)
      setCorrectionReason('')
    } catch (err) {
      // Error handled by mutation
    }
  }

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
        <Link to={ROUTES.SUPERVISOR.MEETING_LOGS}>
          <Button variant="secondary" leftIcon={<ArrowLeft className="h-4 w-4" />}>
            Back to Logs
          </Button>
        </Link>
      </div>
    )
  }

  const statusConfig = MEETING_LOG_STATUS_CONFIG[log.status]
  const canSign = log.status === 'SUBMITTED'
  const canAddComments = ['SUBMITTED', 'CORRECTION_REQUIRED'].includes(log.status)

  const supervisorSignature = log.signatures.find((s) => s.signerRole === 'SUPERVISOR')
  const studentSignature = log.signatures.find((s) => s.signerRole === 'STUDENT')

  // Initialize comments from log
  if (log.supervisorComments && !comments) {
    setComments(log.supervisorComments)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back Button */}
      <Link
        to={ROUTES.SUPERVISOR.MEETING_LOGS}
        className="inline-flex items-center gap-2 text-neutral-600 hover:text-primary-600 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Meeting Logs
      </Link>

      {/* Student Info Banner */}
      <Card className="bg-gradient-to-r from-primary-50 to-blue-50 border-primary-200">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
            <GraduationCap className="h-6 w-6 text-primary-600" />
          </div>
          <div className="flex-1">
            <h2 className="font-semibold text-primary-900">{log.student.fullName}</h2>
            <p className="text-sm text-primary-600">
              {log.student.matricNo} • {log.student.programme}
            </p>
          </div>
          <Badge variant={statusConfig.variant} size="md">
            {statusConfig.label}
          </Badge>
        </div>
      </Card>

      {/* Action Required Banner */}
      {log.status === 'SUBMITTED' && (
        <Card className="bg-amber-50 border-amber-200">
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-amber-900">Review Required</p>
              <p className="text-sm text-amber-700 mt-1">
                This meeting log is awaiting your review. You can add comments, request corrections, or approve and sign.
              </p>
              <div className="flex gap-2 mt-3">
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<PenLine className="h-4 w-4" />}
                  onClick={() => setShowSignatureModal(true)}
                >
                  Approve & Sign
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  leftIcon={<XCircle className="h-4 w-4" />}
                  onClick={() => setShowCorrectionModal(true)}
                >
                  Request Correction
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {log.status === 'CORRECTION_REQUIRED' && (
        <Card className="bg-rose-50 border-rose-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-rose-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-rose-900">Correction Requested</p>
              <p className="text-sm text-rose-700 mt-1">
                You have requested corrections for this log. Waiting for student to resubmit.
              </p>
              {log.correctionReason && (
                <p className="text-sm text-rose-600 mt-2 p-2 bg-rose-100 rounded-lg">
                  <strong>Reason:</strong> {log.correctionReason}
                </p>
              )}
            </div>
          </div>
        </Card>
      )}

      {log.status === 'SUPERVISOR_SIGNED' && (
        <Card className="bg-blue-50 border-blue-200">
          <div className="flex items-start gap-3">
            <PenLine className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-blue-900">Awaiting Student Signature</p>
              <p className="text-sm text-blue-700 mt-1">
                You have signed this log. Waiting for the student to add their signature.
              </p>
            </div>
          </div>
        </Card>
      )}

      {log.status === 'LOCKED' && (
        <Card className="bg-success-50 border-success-200">
          <div className="flex items-start gap-3">
            <Lock className="h-5 w-5 text-success-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-success-900">Meeting Log Finalized</p>
              <p className="text-sm text-success-700 mt-1">
                This log has been signed by both parties and is now locked.
                {log.lockedAt && ` Finalized on ${new Date(log.lockedAt).toLocaleDateString('en-MY')}.`}
              </p>
            </div>
          </div>
        </Card>
      )}

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
      <Card className="border-primary-200 bg-primary-50">
        <h2 className="text-lg font-semibold text-primary-900 mb-4">
          <MessageSquare className="h-5 w-5 inline mr-2" />
          Section 4: Supervisor Comments
        </h2>

        {canAddComments ? (
          <div className="space-y-4">
            <textarea
              value={comments}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setComments(e.target.value)}
              placeholder="Add your comments for the student..."
              rows={4}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white resize-none"
            />
            <div className="flex items-center gap-3">
              <Button
                variant="primary"
                onClick={handleSaveComments}
                isLoading={addCommentsMutation.isPending}
                disabled={!comments.trim()}
              >
                Save Comments
              </Button>
              {commentsSuccess && (
                <span className="text-success-600 text-sm flex items-center gap-1">
                  <CheckCircle className="h-4 w-4" />
                  Comments saved
                </span>
              )}
            </div>
          </div>
        ) : (
          <p className="text-primary-800 whitespace-pre-wrap">
            {log.supervisorComments || <span className="text-primary-400 italic">No comments added</span>}
          </p>
        )}
      </Card>

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

          {/* Student Signature */}
          <div className="border border-neutral-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-neutral-500 mb-3">Student</h3>
            {studentSignature ? (
              <SignatureDisplay
                signatureUrl={studentSignature.signatureImageUrl || ''}
                signerName={studentSignature.signerName}
                signedAt={studentSignature.signedAt}
              />
            ) : (
              <div className="text-center py-6 text-neutral-400">
                <PenLine className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Pending signature</p>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Action Buttons */}
      {canSign && (
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-neutral-900">Ready to approve?</h3>
              <p className="text-sm text-neutral-600">
                Sign this meeting log to approve it. The student will then add their signature.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="danger"
                onClick={() => setShowCorrectionModal(true)}
                leftIcon={<XCircle className="h-4 w-4" />}
              >
                Request Correction
              </Button>
              <Button
                variant="primary"
                onClick={() => setShowSignatureModal(true)}
                leftIcon={<PenLine className="h-4 w-4" />}
                isLoading={signMutation.isPending}
              >
                Approve & Sign
              </Button>
            </div>
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

      {/* Correction Request Modal */}
      {showCorrectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowCorrectionModal(false)}
          />
          <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <h2 className="text-xl font-bold text-neutral-900 mb-4">Request Correction</h2>
            <p className="text-neutral-600 mb-4">
              Please explain what needs to be corrected. The student will be notified.
            </p>
            <textarea
              value={correctionReason}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCorrectionReason(e.target.value)}
              placeholder="Describe the required corrections..."
              rows={4}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
            />
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="secondary" onClick={() => setShowCorrectionModal(false)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleRequestCorrection}
                isLoading={requestCorrectionMutation.isPending}
                disabled={!correctionReason.trim()}
              >
                Submit Request
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Error alerts — dismissible + auto-clear so the banner doesn't pile
          up on retries; reset() flips isError back to false so the next
          failure can re-render a fresh banner. */}
      {signMutation.isError && (
        <AlertBanner
          variant="error"
          title="Failed to sign"
          description={signMutation.error?.message || 'An error occurred while signing.'}
          dismissible
          autoDismissMs={6000}
          onDismiss={() => signMutation.reset()}
        />
      )}
      {addCommentsMutation.isError && (
        <AlertBanner
          variant="error"
          title="Failed to save comments"
          description={addCommentsMutation.error?.message || 'An error occurred.'}
          dismissible
          autoDismissMs={6000}
          onDismiss={() => addCommentsMutation.reset()}
        />
      )}
      {requestCorrectionMutation.isError && (
        <AlertBanner
          variant="error"
          title="Failed to request correction"
          description={requestCorrectionMutation.error?.message || 'An error occurred.'}
          dismissible
          autoDismissMs={6000}
          onDismiss={() => requestCorrectionMutation.reset()}
        />
      )}
    </div>
  )
}
