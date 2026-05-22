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
    <div className="space-y-3 lg:space-y-4">
      {/* Compact hero */}
      <div className="relative bg-gradient-to-br from-stone-800 via-stone-800 to-stone-900 rounded-xl p-3 sm:p-4 text-white shadow-md overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="relative flex items-center gap-3 min-w-0">
          <div className="flex-shrink-0 w-9 h-9 bg-amber-500/20 rounded-lg flex items-center justify-center ring-1 ring-amber-500/30">
            <UserPlus className="h-5 w-5 text-amber-400" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-bold text-white leading-tight">Pending Registrations</h1>
            <p className="text-stone-300 text-xs">Approve or reject student and supervisor signups before they can sign in</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-neutral-200">
        <button
          type="button"
          onClick={() => setTab('STUDENT')}
          className={cn(
            'px-3 py-1.5 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-1.5',
            tab === 'STUDENT'
              ? 'border-amber-500 text-amber-700'
              : 'border-transparent text-neutral-500 hover:text-neutral-900'
          )}
        >
          <GraduationCap className="h-3.5 w-3.5" />
          Students
          {data && tab === 'STUDENT' && (
            <span className="ml-0.5 px-1.5 py-0 bg-amber-100 text-amber-700 rounded text-[10px] font-bold">
              {data.studentCount}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setTab('SUPERVISOR')}
          className={cn(
            'px-3 py-1.5 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-1.5',
            tab === 'SUPERVISOR'
              ? 'border-amber-500 text-amber-700'
              : 'border-transparent text-neutral-500 hover:text-neutral-900'
          )}
        >
          <Briefcase className="h-3.5 w-3.5" />
          Supervisors
          {data && tab === 'SUPERVISOR' && (
            <span className="ml-0.5 px-1.5 py-0 bg-amber-100 text-amber-700 rounded text-[10px] font-bold">
              {data.supervisorCount}
            </span>
          )}
        </button>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Spinner size="lg" />
        </div>
      ) : !data || data.registrations.length === 0 ? (
        <Card className="text-center py-8">
          <UserPlus className="h-10 w-10 text-neutral-300 mx-auto mb-2" />
          <h3 className="text-neutral-900 font-medium text-sm">No pending registrations</h3>
          <p className="text-xs text-neutral-500 mt-1">
            {tab === 'STUDENT' ? 'Student' : 'Supervisor'} signups awaiting approval will appear here.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
          {data.registrations.map((reg) => (
            <Card key={reg.userId} padding="sm" className="hover:shadow-md transition-all">
              <div className="flex items-start gap-2.5">
                <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
                  {avatarInitial(reg.fullName)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-neutral-900 leading-tight truncate">{reg.fullName}</h3>
                      <p className="text-[11px] text-neutral-500">{reg.mmuId}</p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setRejectTarget(reg)}
                        disabled={approveMutation.isPending || rejectMutation.isPending}
                        className="h-7 px-2 text-xs"
                      >
                        <X className="h-3.5 w-3.5 mr-0.5" />
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleApprove(reg)}
                        disabled={approveMutation.isPending || rejectMutation.isPending}
                        className="h-7 px-2 text-xs"
                      >
                        <Check className="h-3.5 w-3.5 mr-0.5" />
                        Approve
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1 text-[11px] text-neutral-600">
                    <span className="flex items-center gap-0.5 truncate">
                      <Mail className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{reg.email}</span>
                    </span>
                    {reg.department && <span>· {reg.department}</span>}
                    {reg.programme && <span>· {reg.programme}</span>}
                    <span className="flex items-center gap-0.5 text-neutral-500">
                      <Clock className="h-3 w-3" />
                      {new Date(reg.registeredAt).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })}
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
