import { useState } from 'react'
import { ClipboardCheck, User, Mail, Briefcase, Hash, Check, X, AlertCircle } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { Modal, ModalHeader, ModalTitle, ModalBody, ModalFooter } from '@/components/ui/Modal'
import { useSuccessToast, useErrorToast } from '@/components/ui/Toast'
import {
  useCommitteeTopicQueue,
  useReviewTopic,
  type SupervisorTopic,
  type TopicStatus,
} from '@/lib/hooks/useTopics'
import { cn } from '@/lib/utils/cn'

const TABS: { key: TopicStatus; label: string }[] = [
  { key: 'PENDING_REVIEW', label: 'Pending' },
  { key: 'APPROVED', label: 'Approved' },
  { key: 'REJECTED', label: 'Rejected' },
  { key: 'REVISION_REQUIRED', label: 'Revision asked' },
]

type Decision = 'APPROVED' | 'REJECTED' | 'REVISION_REQUIRED'

export function TopicReviewQueue() {
  const [tab, setTab] = useState<TopicStatus>('PENDING_REVIEW')
  const { data, isLoading } = useCommitteeTopicQueue(tab)
  const reviewMut = useReviewTopic()
  const successToast = useSuccessToast()
  const errorToast = useErrorToast()

  const [reviewing, setReviewing] = useState<SupervisorTopic | null>(null)
  const [decision, setDecision] = useState<Decision>('APPROVED')
  const [feedback, setFeedback] = useState('')

  const openReview = (t: SupervisorTopic, d: Decision) => {
    setReviewing(t)
    setDecision(d)
    setFeedback('')
  }

  const submit = async () => {
    if (!reviewing) return
    if ((decision === 'REJECTED' || decision === 'REVISION_REQUIRED') && !feedback.trim()) {
      errorToast('Feedback required', 'Provide a reason so the supervisor knows what to fix.')
      return
    }
    try {
      await reviewMut.mutateAsync({
        topicId: reviewing.topicId,
        decision,
        feedback: feedback.trim() || undefined,
      })
      const verb = decision === 'APPROVED' ? 'Approved' : decision === 'REJECTED' ? 'Rejected' : 'Revision requested'
      successToast(verb, `${reviewing.supervisorName ?? 'Supervisor'} has been notified.`)
      setReviewing(null)
    } catch (e) {
      errorToast('Review failed', (e as Error).message)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
          <ClipboardCheck className="h-7 w-7 text-primary-600" />
          Topic Review Queue
        </h1>
        <p className="text-neutral-600 mt-1">
          Review project topics submitted by supervisors. Approved topics are published to students.
        </p>
      </div>

      <div className="flex gap-2 border-b border-neutral-200 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap',
              tab === t.key
                ? 'border-primary-500 text-primary-700'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : !data || data.topics.length === 0 ? (
        <Card className="p-12 text-center">
          <ClipboardCheck className="h-12 w-12 text-neutral-300 mx-auto mb-3" />
          <p className="text-neutral-500">No topics in this category.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {data.topics.map((t) => (
            <Card key={t.topicId} className="p-5">
              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-neutral-900">{t.title}</h3>
                  <p className="text-sm text-neutral-700 mt-1 whitespace-pre-wrap">{t.description}</p>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs text-neutral-500">
                    <span className="flex items-center gap-1">
                      <User className="h-3.5 w-3.5" />
                      {t.supervisorName}
                    </span>
                    {t.supervisorEmail && (
                      <span className="flex items-center gap-1">
                        <Mail className="h-3.5 w-3.5" />
                        {t.supervisorEmail}
                      </span>
                    )}
                    {t.supervisorDepartment && (
                      <span className="flex items-center gap-1">
                        <Briefcase className="h-3.5 w-3.5" />
                        {t.supervisorDepartment}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Hash className="h-3.5 w-3.5" />
                      {t.slots} slots
                    </span>
                    {t.researchArea && (
                      <span className="px-2 py-0.5 bg-neutral-100 rounded-full">{t.researchArea}</span>
                    )}
                  </div>
                  {t.feedback && tab !== 'PENDING_REVIEW' && (
                    <div className="mt-3 p-2 rounded bg-neutral-50 border border-neutral-200 text-sm text-neutral-700">
                      <strong>Your feedback:</strong> {t.feedback}
                    </div>
                  )}
                </div>
                {tab === 'PENDING_REVIEW' && (
                  <div className="flex flex-col gap-2 shrink-0 w-44">
                    <Button size="sm" onClick={() => openReview(t, 'APPROVED')}>
                      <Check className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => openReview(t, 'REVISION_REQUIRED')}>
                      <AlertCircle className="h-4 w-4 mr-1" />
                      Ask revision
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => openReview(t, 'REJECTED')}>
                      <X className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={!!reviewing} onClose={() => setReviewing(null)} size="md">
        <ModalHeader>
          <ModalTitle>
            {decision === 'APPROVED'
              ? 'Approve topic'
              : decision === 'REJECTED'
              ? 'Reject topic'
              : 'Request revision'}
          </ModalTitle>
        </ModalHeader>
        <ModalBody>
          {reviewing && (
            <p className="text-sm text-neutral-600 mb-3">
              <strong>{reviewing.supervisorName}</strong> — &ldquo;{reviewing.title}&rdquo;
            </p>
          )}
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Feedback {(decision === 'REJECTED' || decision === 'REVISION_REQUIRED') && <span className="text-rose-600">*</span>}
          </label>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={4}
            maxLength={500}
            placeholder={
              decision === 'APPROVED'
                ? 'Optional comment for the supervisor'
                : 'Tell the supervisor what to change'
            }
            className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
          <p className="text-xs text-neutral-500 mt-1">{feedback.length}/500</p>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setReviewing(null)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={reviewMut.isPending}>
            {reviewMut.isPending && <Spinner size="sm" className="mr-2" />}
            Confirm
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}
