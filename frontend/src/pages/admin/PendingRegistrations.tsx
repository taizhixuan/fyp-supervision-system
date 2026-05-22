import { useState } from 'react'
import { UserPlus, Check, X, Mail, Clock, GraduationCap, Briefcase } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { Modal, ModalHeader, ModalTitle, ModalBody, ModalFooter } from '@/components/ui/Modal'
import { useSuccessToast, useErrorToast } from '@/components/ui/Toast'
import {
  usePendingRegistrations,
  useApproveRegistration,
  useRejectRegistration,
  type PendingRegistration,
} from '@/lib/hooks/useAdmin'
import { cn } from '@/lib/utils/cn'
import { avatarInitial } from '@/lib/utils/name'

type Tab = 'STUDENT' | 'SUPERVISOR'

export function PendingRegistrations() {
  const [tab, setTab] = useState<Tab>('STUDENT')
  const [rejectTarget, setRejectTarget] = useState<PendingRegistration | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  const { data, isLoading } = usePendingRegistrations(tab)
  const approveMutation = useApproveRegistration()
  const rejectMutation = useRejectRegistration()
  const successToast = useSuccessToast()
  const errorToast = useErrorToast()

  const handleApprove = async (user: PendingRegistration) => {
    try {
      await approveMutation.mutateAsync(user.userId)
      successToast('Approved', `${user.fullName} can now sign in.`)
    } catch (e) {
      errorToast('Approve failed', (e as Error).message)
    }
  }

  const handleReject = async () => {
    if (!rejectTarget) return
    if (!rejectReason.trim()) {
      errorToast('Reason required', 'Please provide a rejection reason.')
      return
    }
    try {
      await rejectMutation.mutateAsync({ userId: rejectTarget.userId, reason: rejectReason.trim() })
      successToast('Rejected', `${rejectTarget.fullName} has been notified.`)
      setRejectTarget(null)
      setRejectReason('')
    } catch (e) {
      errorToast('Reject failed', (e as Error).message)
    }
  }

  return (
    <div className="space-y-4 lg:space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
          <UserPlus className="h-7 w-7 text-primary-600" />
          Pending Registrations
        </h1>
        <p className="text-neutral-600 mt-1">
          Approve or reject new student and supervisor signups before they can sign in.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-neutral-200">
        <button
          type="button"
          onClick={() => setTab('STUDENT')}
          className={cn(
            'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-2',
            tab === 'STUDENT'
              ? 'border-primary-500 text-primary-700'
              : 'border-transparent text-neutral-500 hover:text-neutral-900'
          )}
        >
          <GraduationCap className="h-4 w-4" />
          Students
          {data && tab === 'STUDENT' && (
            <span className="ml-1 px-2 py-0.5 bg-primary-100 text-primary-700 rounded-full text-xs">
              {data.studentCount}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setTab('SUPERVISOR')}
          className={cn(
            'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-2',
            tab === 'SUPERVISOR'
              ? 'border-primary-500 text-primary-700'
              : 'border-transparent text-neutral-500 hover:text-neutral-900'
          )}
        >
          <Briefcase className="h-4 w-4" />
          Supervisors
          {data && tab === 'SUPERVISOR' && (
            <span className="ml-1 px-2 py-0.5 bg-primary-100 text-primary-700 rounded-full text-xs">
              {data.supervisorCount}
            </span>
          )}
        </button>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : !data || data.registrations.length === 0 ? (
        <Card className="p-12 text-center">
          <UserPlus className="h-12 w-12 text-neutral-300 mx-auto mb-3" />
          <h3 className="text-neutral-900 font-medium">No pending registrations</h3>
          <p className="text-sm text-neutral-500 mt-1">
            {tab === 'STUDENT' ? 'Student' : 'Supervisor'} signups awaiting approval will appear here.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {data.registrations.map((reg) => (
            <Card key={reg.userId} className="p-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-semibold flex-shrink-0">
                  {avatarInitial(reg.fullName)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-medium text-neutral-900">{reg.fullName}</h3>
                      <p className="text-sm text-neutral-500">{reg.mmuId}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setRejectTarget(reg)}
                        disabled={approveMutation.isPending || rejectMutation.isPending}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleApprove(reg)}
                        disabled={approveMutation.isPending || rejectMutation.isPending}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-neutral-600">
                    <span className="flex items-center gap-1">
                      <Mail className="h-3.5 w-3.5" />
                      {reg.email}
                    </span>
                    {reg.department && <span>{reg.department}</span>}
                    {reg.programme && <span>{reg.programme}</span>}
                    <span className="flex items-center gap-1 text-neutral-500">
                      <Clock className="h-3.5 w-3.5" />
                      {new Date(reg.registeredAt).toLocaleDateString('en-MY', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Reject modal */}
      <Modal isOpen={!!rejectTarget} onClose={() => setRejectTarget(null)} size="md">
        <ModalHeader>
          <ModalTitle>Reject registration</ModalTitle>
        </ModalHeader>
        <ModalBody>
          {rejectTarget && (
            <p className="text-sm text-neutral-600 mb-3">
              Reject <strong>{rejectTarget.fullName}</strong> ({rejectTarget.email})? The user will be
              notified with your reason.
            </p>
          )}
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Reason <span className="text-error-600">*</span>
          </label>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            maxLength={300}
            rows={3}
            placeholder="e.g. Email is not an MMU email, or duplicate account"
            className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
          <p className="text-xs text-neutral-500 mt-1">{rejectReason.length}/300</p>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setRejectTarget(null)}>
            Cancel
          </Button>
          <Button
            onClick={handleReject}
            disabled={rejectMutation.isPending || !rejectReason.trim()}
          >
            {rejectMutation.isPending ? <Spinner size="sm" className="mr-2" /> : null}
            Reject &amp; Notify
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}
