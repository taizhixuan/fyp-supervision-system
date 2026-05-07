import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Lightbulb, User, Briefcase, Hash, Check } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import { Modal, ModalHeader, ModalTitle, ModalBody, ModalFooter } from '@/components/ui/Modal'
import { useSuccessToast, useErrorToast } from '@/components/ui/Toast'
import { useApprovedTopics, useConfirmTopic, type SupervisorTopic } from '@/lib/hooks/useTopics'
import { ROUTES } from '@/lib/constants/routes'
import { cn } from '@/lib/utils/cn'

export function BrowseTopics() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [areaFilter, setAreaFilter] = useState<string>('ALL')

  const { data, isLoading } = useApprovedTopics({
    search: search || undefined,
    researchArea: areaFilter,
  })
  const confirmMut = useConfirmTopic()
  const successToast = useSuccessToast()
  const errorToast = useErrorToast()

  const [confirming, setConfirming] = useState<SupervisorTopic | null>(null)

  // Build the area filter from data.
  const areas = useMemo(() => {
    const set = new Set<string>()
    data?.topics.forEach((t) => {
      if (t.researchArea) set.add(t.researchArea)
    })
    return Array.from(set).sort()
  }, [data])

  const handleConfirm = async () => {
    if (!confirming) return
    try {
      const result = await confirmMut.mutateAsync(confirming.topicId)
      successToast(
        'Paired',
        `You are now paired with ${result.supervisorName} on this project.`
      )
      setConfirming(null)
      navigate(ROUTES.STUDENT.DASHBOARD)
    } catch (e) {
      errorToast('Confirm failed', (e as Error).message)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
          <Lightbulb className="h-7 w-7 text-primary-600" />
          Browse Project Topics
        </h1>
        <p className="text-neutral-600 mt-1">
          These topics have been proposed by supervisors and approved by the FYP committee. Pick one
          to pair with the supervisor and start your FYP1.
        </p>
      </div>

      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2 relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search title, description, or supervisor"
              className="pl-9"
            />
          </div>
          <select
            value={areaFilter}
            onChange={(e) => setAreaFilter(e.target.value)}
            className="px-3 py-2 border border-neutral-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500"
          >
            <option value="ALL">All research areas</option>
            {areas.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : !data || data.topics.length === 0 ? (
        <Card className="p-12 text-center">
          <Lightbulb className="h-12 w-12 text-neutral-300 mx-auto mb-3" />
          <h3 className="text-neutral-900 font-medium">No approved topics yet</h3>
          <p className="text-sm text-neutral-500 mt-1">
            Check back once supervisors have submitted topics and the FYP committee has approved them.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {data.topics.map((t) => {
            const full = t.remainingSlots <= 0
            return (
              <Card key={t.topicId} className={cn('p-5', full && 'opacity-70')}>
                <h3 className="font-medium text-neutral-900">{t.title}</h3>
                <p className="text-sm text-neutral-700 mt-1 line-clamp-3 whitespace-pre-wrap">
                  {t.description}
                </p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-3 text-xs text-neutral-500">
                  <span className="flex items-center gap-1">
                    <User className="h-3.5 w-3.5" />
                    {t.supervisorName}
                  </span>
                  {t.supervisorDepartment && (
                    <span className="flex items-center gap-1">
                      <Briefcase className="h-3.5 w-3.5" />
                      {t.supervisorDepartment}
                    </span>
                  )}
                  {t.researchArea && (
                    <span className="px-2 py-0.5 bg-neutral-100 rounded-full">{t.researchArea}</span>
                  )}
                  <span
                    className={cn(
                      'flex items-center gap-1',
                      full ? 'text-rose-600' : 'text-emerald-700'
                    )}
                  >
                    <Hash className="h-3.5 w-3.5" />
                    {t.remainingSlots} of {t.slots} slots left
                  </span>
                </div>
                <div className="mt-3">
                  <Button
                    size="sm"
                    onClick={() => setConfirming(t)}
                    disabled={full || confirmMut.isPending}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Confirm this topic
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <Modal isOpen={!!confirming} onClose={() => setConfirming(null)} size="md">
        <ModalHeader>
          <ModalTitle>Confirm topic</ModalTitle>
        </ModalHeader>
        <ModalBody>
          {confirming && (
            <>
              <p className="text-sm text-neutral-700">
                You are about to pair with <strong>{confirming.supervisorName}</strong> on:
              </p>
              <p className="font-medium text-neutral-900 mt-2">{confirming.title}</p>
              <p className="text-sm text-neutral-600 mt-3">
                This creates your FYP1 project. You can have only one paired project per cycle, so
                this choice is final unless the committee intervenes.
              </p>
            </>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setConfirming(null)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={confirmMut.isPending}>
            {confirmMut.isPending && <Spinner size="sm" className="mr-2" />}
            Confirm pairing
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}
