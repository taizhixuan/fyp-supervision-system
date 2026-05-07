import { useState } from 'react'
import { Lightbulb, Plus, Edit2, X, AlertCircle, Check, Clock, XCircle } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import { Modal, ModalHeader, ModalTitle, ModalBody, ModalFooter } from '@/components/ui/Modal'
import { useSuccessToast, useErrorToast } from '@/components/ui/Toast'
import {
  useMyTopics,
  useCreateTopic,
  useUpdateTopic,
  useWithdrawTopic,
  type SupervisorTopic,
  type TopicStatus,
} from '@/lib/hooks/useTopics'
import { cn } from '@/lib/utils/cn'

const statusConfig: Record<TopicStatus, { label: string; color: string; bgColor: string; icon: typeof Clock }> = {
  PENDING_REVIEW: { label: 'Pending review', color: 'text-amber-700', bgColor: 'bg-amber-50 border-amber-200', icon: Clock },
  APPROVED: { label: 'Approved', color: 'text-emerald-700', bgColor: 'bg-emerald-50 border-emerald-200', icon: Check },
  REJECTED: { label: 'Rejected', color: 'text-rose-700', bgColor: 'bg-rose-50 border-rose-200', icon: XCircle },
  REVISION_REQUIRED: { label: 'Revision requested', color: 'text-orange-700', bgColor: 'bg-orange-50 border-orange-200', icon: AlertCircle },
  WITHDRAWN: { label: 'Withdrawn', color: 'text-stone-600', bgColor: 'bg-stone-50 border-stone-200', icon: X },
}

const empty: { title: string; description: string; researchArea: string; slots: number } = {
  title: '',
  description: '',
  researchArea: '',
  slots: 1,
}

export function MyTopics() {
  const { data, isLoading } = useMyTopics()
  const createMut = useCreateTopic()
  const updateMut = useUpdateTopic()
  const withdrawMut = useWithdrawTopic()
  const successToast = useSuccessToast()
  const errorToast = useErrorToast()

  const [editing, setEditing] = useState<SupervisorTopic | null>(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ ...empty })

  const openCreate = () => {
    setForm({ ...empty })
    setCreating(true)
  }

  const openEdit = (t: SupervisorTopic) => {
    setForm({
      title: t.title,
      description: t.description,
      researchArea: t.researchArea ?? '',
      slots: t.slots,
    })
    setEditing(t)
  }

  const close = () => {
    setEditing(null)
    setCreating(false)
  }

  const submit = async () => {
    if (!form.title.trim() || !form.description.trim()) {
      errorToast('Missing fields', 'Title and description are required.')
      return
    }
    try {
      if (creating) {
        await createMut.mutateAsync({
          title: form.title,
          description: form.description,
          researchArea: form.researchArea || null,
          slots: form.slots,
        })
        successToast('Topic submitted', 'Awaiting committee review.')
      } else if (editing) {
        await updateMut.mutateAsync({
          topicId: editing.topicId,
          input: {
            title: form.title,
            description: form.description,
            researchArea: form.researchArea || null,
            slots: form.slots,
          },
        })
        successToast('Topic updated', editing.status === 'REVISION_REQUIRED' ? 'Resubmitted for review.' : 'Saved.')
      }
      close()
    } catch (e) {
      errorToast('Save failed', (e as Error).message)
    }
  }

  const handleWithdraw = async (t: SupervisorTopic) => {
    try {
      await withdrawMut.mutateAsync(t.topicId)
      successToast('Withdrawn', 'Topic is no longer visible to students.')
    } catch (e) {
      errorToast('Withdraw failed', (e as Error).message)
    }
  }

  const editable = (t: SupervisorTopic) =>
    t.status === 'PENDING_REVIEW' || t.status === 'REVISION_REQUIRED'

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
            <Lightbulb className="h-7 w-7 text-primary-600" />
            My Project Topics
          </h1>
          <p className="text-neutral-600 mt-1">
            Post project topics you want to supervise. Approved topics are published to students for them to confirm.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          New topic
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : !data || data.topics.length === 0 ? (
        <Card className="p-12 text-center">
          <Lightbulb className="h-12 w-12 text-neutral-300 mx-auto mb-3" />
          <h3 className="text-neutral-900 font-medium">No topics yet</h3>
          <p className="text-sm text-neutral-500 mt-1">
            Click <strong>New topic</strong> to propose a project students can pick up.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {data.topics.map((t) => {
            const cfg = statusConfig[t.status]
            const StatusIcon = cfg.icon
            return (
              <Card key={t.topicId} className="p-5">
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-medium text-neutral-900">{t.title}</h3>
                      <span
                        className={cn(
                          'shrink-0 px-2 py-0.5 rounded-full text-xs font-medium border flex items-center gap-1',
                          cfg.bgColor,
                          cfg.color
                        )}
                      >
                        <StatusIcon className="h-3 w-3" />
                        {cfg.label}
                      </span>
                    </div>
                    <p className="text-sm text-neutral-600 mt-1 line-clamp-2">{t.description}</p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-neutral-500">
                      {t.researchArea && (
                        <span className="px-2 py-0.5 bg-neutral-100 rounded-full">{t.researchArea}</span>
                      )}
                      <span>
                        {t.confirmedCount} / {t.slots} slots taken
                      </span>
                      {t.createdAt && (
                        <span>
                          Created {new Date(t.createdAt).toLocaleDateString('en-MY', { day: 'numeric', month: 'short' })}
                        </span>
                      )}
                    </div>
                    {t.feedback && (t.status === 'REJECTED' || t.status === 'REVISION_REQUIRED') && (
                      <div className="mt-3 p-2 rounded bg-amber-50 border border-amber-200 text-sm text-amber-800">
                        <strong>Committee feedback:</strong> {t.feedback}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    {editable(t) && (
                      <Button size="sm" variant="secondary" onClick={() => openEdit(t)}>
                        <Edit2 className="h-3.5 w-3.5 mr-1" />
                        Edit
                      </Button>
                    )}
                    {(t.status === 'APPROVED' || t.status === 'PENDING_REVIEW') && t.confirmedCount === 0 && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleWithdraw(t)}
                        disabled={withdrawMut.isPending}
                      >
                        <X className="h-3.5 w-3.5 mr-1" />
                        Withdraw
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <Modal isOpen={creating || !!editing} onClose={close} size="lg">
        <ModalHeader>
          <ModalTitle>{creating ? 'New Project Topic' : 'Edit Topic'}</ModalTitle>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-3">
            <Input
              label="Title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Real-time Anomaly Detection in IoT Sensor Networks"
              maxLength={500}
            />
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={5}
                placeholder="What's the problem? What approach? What deliverables do you expect?"
                className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Research area"
                value={form.researchArea}
                onChange={(e) => setForm({ ...form, researchArea: e.target.value })}
                placeholder="AI/ML, Cybersecurity, Data Science..."
              />
              <Input
                type="number"
                min={1}
                max={10}
                label="Slots (max students)"
                value={form.slots}
                onChange={(e) => setForm({ ...form, slots: Number(e.target.value) })}
              />
            </div>
            {editing?.status === 'REVISION_REQUIRED' && editing.feedback && (
              <div className="p-3 rounded bg-amber-50 border border-amber-200 text-sm">
                <strong className="text-amber-800">Committee asked for revision:</strong>
                <p className="text-amber-700 mt-1">{editing.feedback}</p>
                <p className="text-xs text-amber-600 mt-2">Saving will resubmit for review.</p>
              </div>
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={close}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={createMut.isPending || updateMut.isPending}>
            {(createMut.isPending || updateMut.isPending) && <Spinner size="sm" className="mr-2" />}
            {creating ? 'Submit for review' : editing?.status === 'REVISION_REQUIRED' ? 'Resubmit' : 'Save'}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}
