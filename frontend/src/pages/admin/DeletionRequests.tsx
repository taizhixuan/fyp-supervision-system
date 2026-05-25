import { useState } from 'react'
import { Trash2, CheckCircle, XCircle, Clock, AlertTriangle, RefreshCw } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { AlertBanner } from '@/components/ui/AlertBanner'
import { Modal, ModalHeader, ModalTitle, ModalBody, ModalFooter } from '@/components/ui/Modal'
import { useSuccessToast, useErrorToast } from '@/components/ui/Toast'
import {
  useAdminDeletionRequests,
  useApproveDeletionRequest,
  useRejectDeletionRequest,
  type AdminDeletionRequest,
} from '@/lib/hooks/useAdmin'
import { getApiErrorMessage } from '@/lib/api/client'
import { cn } from '@/lib/utils/cn'

const STATUS_CFG: Record<AdminDeletionRequest['status'], { label: string; tint: string; icon: typeof Clock }> = {
  PENDING:   { label: 'Pending',  tint: 'bg-amber-100 text-amber-700',   icon: Clock },
  APPROVED:  { label: 'Approved', tint: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
  COMPLETED: { label: 'Completed', tint: 'bg-neutral-200 text-neutral-700', icon: CheckCircle },
  REJECTED:  { label: 'Rejected', tint: 'bg-red-100 text-red-700',       icon: XCircle },
}

export function DeletionRequests() {
  const [pendingOnly, setPendingOnly] = useState(true)
  const { data, isLoading, refetch, isFetching } = useAdminDeletionRequests(pendingOnly)
  const [decideTarget, setDecideTarget] = useState<{ req: AdminDeletionRequest; action: 'approve' | 'reject' } | null>(null)

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
            <Trash2 className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Account Deletion Requests</h1>
            <p className="text-sm text-neutral-500 mt-1">
              PDPA right of erasure. Approving a request anonymises the user&apos;s personal details and permanently
              deletes their chat history. Academic records (project, proposal, meeting logs, documents) are kept.
            </p>
          </div>
        </div>
        <Button type="button" variant="secondary" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={cn('h-4 w-4 mr-2', isFetching && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      <div className="flex items-center gap-2 text-sm">
        <button
          type="button"
          onClick={() => setPendingOnly(true)}
          className={cn(
            'px-3 py-1.5 rounded-md font-medium transition-colors',
            pendingOnly ? 'bg-primary-600 text-white' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200',
          )}
        >
          Pending only
        </button>
        <button
          type="button"
          onClick={() => setPendingOnly(false)}
          className={cn(
            'px-3 py-1.5 rounded-md font-medium transition-colors',
            !pendingOnly ? 'bg-primary-600 text-white' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200',
          )}
        >
          All
        </button>
      </div>

      <Card className="p-0 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <Spinner />
          </div>
        ) : !data || data.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle className="h-10 w-10 text-neutral-300 mx-auto mb-2" />
            <p className="text-sm text-neutral-500">No {pendingOnly ? 'pending ' : ''}deletion requests.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr className="text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Requested</th>
                  <th className="px-4 py-3">Reason</th>
                  <th className="px-4 py-3">Decision</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {data.map((req) => {
                  const cfg = STATUS_CFG[req.status]
                  const StatusIcon = cfg.icon
                  return (
                    <tr key={req.requestId} className="hover:bg-neutral-50">
                      <td className="px-4 py-3">
                        {req.user ? (
                          <>
                            <p className="font-medium text-neutral-900">{req.user.fullName}</p>
                            <p className="text-xs text-neutral-500">{req.user.mmuId} · {req.user.email}</p>
                          </>
                        ) : (
                          <span className="text-neutral-400 italic">unknown</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium', cfg.tint)}>
                          <StatusIcon className="h-3 w-3" />
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-neutral-700">
                        {req.requestedAt ? new Date(req.requestedAt).toLocaleString() : '—'}
                      </td>
                      <td className="px-4 py-3 max-w-xs">
                        <p className="text-neutral-700 line-clamp-2">{req.reason || <span className="text-neutral-400 italic">No reason given</span>}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-neutral-600">
                        {req.decidedBy ? (
                          <>
                            <p>by {req.decidedBy}</p>
                            {req.decidedAt && <p className="text-neutral-400">{new Date(req.decidedAt).toLocaleString()}</p>}
                            {req.decisionNote && <p className="mt-1 italic line-clamp-2">&ldquo;{req.decisionNote}&rdquo;</p>}
                          </>
                        ) : (
                          <span className="text-neutral-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        {req.status === 'PENDING' ? (
                          <div className="inline-flex gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="danger"
                              onClick={() => setDecideTarget({ req, action: 'approve' })}
                            >
                              Approve & delete
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              onClick={() => setDecideTarget({ req, action: 'reject' })}
                            >
                              Reject
                            </Button>
                          </div>
                        ) : (
                          <Badge variant="default">No action</Badge>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {decideTarget && (
        <DecisionModal
          target={decideTarget}
          onClose={() => setDecideTarget(null)}
        />
      )}
    </div>
  )
}

function DecisionModal({
  target,
  onClose,
}: {
  target: { req: AdminDeletionRequest; action: 'approve' | 'reject' }
  onClose: () => void
}) {
  const [note, setNote] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const approve = useApproveDeletionRequest()
  const reject = useRejectDeletionRequest()
  const showSuccess = useSuccessToast()
  const showError = useErrorToast()
  const isApprove = target.action === 'approve'
  const pending = isApprove ? approve.isPending : reject.isPending

  const handleSubmit = async () => {
    if (isApprove && !confirmed) return
    setError(null)
    try {
      const mutation = isApprove ? approve : reject
      await mutation.mutateAsync({ requestId: target.req.requestId, note: note.trim() })
      showSuccess(
        isApprove ? 'Account anonymised' : 'Request rejected',
        isApprove
          ? `${target.req.user?.fullName ?? 'User'}'s personal details have been removed.`
          : 'The student has been notified.',
      )
      onClose()
    } catch (err) {
      const msg = getApiErrorMessage(err)
      setError(msg)
      showError(msg)
    }
  }

  return (
    <Modal isOpen onClose={onClose} size="lg">
      <ModalHeader>
        <div className="flex items-start gap-3">
          <div className={cn(
            'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
            isApprove ? 'bg-red-50' : 'bg-neutral-100',
          )}>
            {isApprove ? <AlertTriangle className="h-5 w-5 text-red-600" /> : <XCircle className="h-5 w-5 text-neutral-700" />}
          </div>
          <ModalTitle>
            {isApprove ? 'Approve deletion and anonymise account' : 'Reject deletion request'}
          </ModalTitle>
        </div>
      </ModalHeader>
      <ModalBody>
        <p className="text-sm text-neutral-700 mb-3">
          {target.req.user?.fullName} ({target.req.user?.mmuId})
        </p>

        {isApprove && (
          <div className="rounded-md bg-amber-50 border border-amber-200 p-3 mb-4">
            <p className="text-sm text-amber-900 font-medium">This action is irreversible.</p>
            <ul className="text-xs text-amber-800 list-disc pl-5 mt-2 space-y-1">
              <li>The user&apos;s name, email, MMU ID, phone, and profile image will be replaced with placeholders</li>
              <li>Their chatbot history, memory, and notifications will be permanently deleted</li>
              <li>Project, proposal, meeting logs, and documents are kept (academic record)</li>
              <li>The user will no longer be able to sign in</li>
            </ul>
          </div>
        )}

        <label className="block text-sm font-medium text-neutral-700 mb-1">
          Note (optional, shown to the student on rejection)
        </label>
        <textarea
          className="block w-full rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 border"
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={isApprove ? 'Optional note saved in audit trail' : 'Explain why the request is declined'}
        />

        {error && (
          <AlertBanner
            variant="error"
            description={error}
            dismissible
            onDismiss={() => setError(null)}
            className="mt-4"
          />
        )}

        {isApprove && (
          <label className="flex items-start gap-2.5 mt-4 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-neutral-300 text-red-600 focus:ring-red-500"
            />
            <span className="text-sm text-neutral-700">
              I confirm that I have verified this request and want to anonymise this account permanently.
            </span>
          </label>
        )}
      </ModalBody>
      <ModalFooter>
        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
        <Button
          type="button"
          variant={isApprove ? 'danger' : 'primary'}
          onClick={handleSubmit}
          disabled={pending || (isApprove && !confirmed)}
          isLoading={pending}
        >
          {isApprove ? 'Approve and anonymise' : 'Reject'}
        </Button>
      </ModalFooter>
    </Modal>
  )
}
