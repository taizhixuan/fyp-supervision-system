import { useMemo, useState } from 'react'
import { Award, GraduationCap, CheckCircle, Lock, Clock } from 'lucide-react'
import { Card, Button, Spinner } from '@/components/ui'
import {
  Modal,
  ModalHeader,
  ModalTitle,
  ModalBody,
  ModalFooter,
} from '@/components/ui/Modal'
import { useSupervisees } from '@/lib/hooks/useSupervisor'
import {
  useSupervisorGrades,
  useSubmitGrade,
  RUBRIC_CRITERIA,
  type FypGrade,
  type GradePhase,
  type GradeStatus,
} from '@/lib/hooks/useGrading'
import { cn } from '@/lib/utils/cn'

const STATUS_BADGE: Record<GradeStatus, { label: string; cls: string }> = {
  DRAFT:     { label: 'Draft',     cls: 'bg-stone-100 text-stone-700' },
  SUBMITTED: { label: 'Submitted', cls: 'bg-amber-100 text-amber-700' },
  FINALISED: { label: 'Finalised', cls: 'bg-emerald-100 text-emerald-700' },
}

interface ModalState {
  open: boolean
  projectId: number | null
  studentName: string
  phase: GradePhase
  existing: FypGrade | null
}

export function SupervisorGrades() {
  const { data: superviseesResp, isLoading: loadingSupervisees } = useSupervisees()
  const { data: gradesResp, isLoading: loadingGrades } = useSupervisorGrades()
  const submit = useSubmitGrade()

  const [modal, setModal] = useState<ModalState>({
    open: false, projectId: null, studentName: '', phase: 'FYP2', existing: null,
  })

  // Index existing grades by (projectId, phase) so each row can show its current state.
  const gradesByKey = useMemo(() => {
    const map = new Map<string, FypGrade>()
    for (const g of gradesResp?.grades ?? []) {
      map.set(`${g.projectId}_${g.phase}`, g)
    }
    return map
  }, [gradesResp])

  const supervisees = superviseesResp?.supervisees ?? []

  const openGradeModal = (projectId: number, studentName: string, phase: GradePhase) => {
    const existing = gradesByKey.get(`${projectId}_${phase}`) ?? null
    setModal({ open: true, projectId, studentName, phase, existing })
  }

  if (loadingSupervisees || loadingGrades) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" label="Loading grading queue..." />
      </div>
    )
  }

  return (
    <div className="space-y-4 lg:space-y-5">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-700 via-amber-800 to-amber-900 p-6 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative flex items-center gap-4">
          <div className="w-14 h-14 bg-white/15 rounded-xl flex items-center justify-center ring-1 ring-white/20">
            <Award className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Final-Report Grading</h1>
            <p className="text-amber-100 mt-0.5">
              Record FYP1 and FYP2 marks for each of your active supervisees.
            </p>
          </div>
        </div>
      </div>

      {/* Empty state */}
      {supervisees.length === 0 ? (
        <Card className="text-center py-12">
          <GraduationCap className="h-12 w-12 text-stone-300 mx-auto mb-3" />
          <p className="text-stone-600">No active supervisees to grade yet.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {supervisees.map((s) => {
            const projectId = Number(s.superviseeId)
            const fyp1 = gradesByKey.get(`${projectId}_FYP1`) ?? null
            const fyp2 = gradesByKey.get(`${projectId}_FYP2`) ?? null

            return (
              <Card key={s.superviseeId} className="p-5">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-stone-900">{s.fullName}</h3>
                    <p className="text-sm text-stone-500 mt-0.5">
                      {s.studentId} · {s.program}
                    </p>
                    <p className="text-sm text-stone-600 mt-1 truncate">
                      {s.projectTitle || <span className="text-stone-400">Untitled</span>}
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                    <PhaseGradeButton
                      phase="FYP1"
                      grade={fyp1}
                      onClick={() => openGradeModal(projectId, s.fullName, 'FYP1')}
                    />
                    <PhaseGradeButton
                      phase="FYP2"
                      grade={fyp2}
                      onClick={() => openGradeModal(projectId, s.fullName, 'FYP2')}
                    />
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <GradeModal
        state={modal}
        onClose={() => setModal((s) => ({ ...s, open: false }))}
        onSave={async (status, rubric, remarks) => {
          if (!modal.projectId) return
          await submit.mutateAsync({
            projectId: modal.projectId,
            phase: modal.phase,
            rubric,
            remarks,
            status,
          })
          setModal((s) => ({ ...s, open: false }))
        }}
        saving={submit.isPending}
      />
    </div>
  )
}

// ---------- Per-phase chip button on each supervisee row ----------

function PhaseGradeButton({
  phase, grade, onClick,
}: { phase: GradePhase; grade: FypGrade | null; onClick: () => void }) {
  if (!grade) {
    return (
      <Button variant="secondary" size="sm" onClick={onClick} leftIcon={<Award className="h-4 w-4" />}>
        Grade {phase}
      </Button>
    )
  }
  const badge = STATUS_BADGE[grade.status]
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-stone-200 hover:border-amber-400 hover:bg-amber-50 transition-colors"
    >
      <span className="text-xs font-semibold text-stone-700">{phase}</span>
      <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', badge.cls)}>
        {badge.label}
      </span>
      {grade.totalScore != null && (
        <span className="text-sm font-semibold text-stone-900">
          {Number(grade.totalScore).toFixed(1)}
          {grade.letterGrade && (
            <span className="text-xs text-amber-700 ml-1">{grade.letterGrade}</span>
          )}
        </span>
      )}
    </button>
  )
}

// ---------- Grade form modal ----------

function GradeModal({
  state, onClose, onSave, saving,
}: {
  state: ModalState
  onClose: () => void
  onSave: (status: 'DRAFT' | 'SUBMITTED', rubric: Record<string, number>, remarks: string) => void
  saving: boolean
}) {
  const initialRubric = useMemo(() => {
    const r: Record<string, number> = {}
    for (const c of RUBRIC_CRITERIA) {
      r[c.key] = state.existing?.rubric?.[c.key] ?? 0
    }
    return r
  }, [state.existing])
  const initialRemarks = state.existing?.remarks ?? ''

  const [rubric, setRubric] = useState<Record<string, number>>(initialRubric)
  const [remarks, setRemarks] = useState(initialRemarks)

  // Re-seed when modal opens with a different grade.
  // Using state.existing as the cue: the parent constructs a new modal state on each open.
  // We can rely on initialRubric memo since `state.existing` reference changes each open.
  // Reset on prop change:
  useMemo(() => { setRubric(initialRubric); setRemarks(initialRemarks) }, [initialRubric, initialRemarks])

  const total = Object.values(rubric).reduce((a, b) => a + (Number(b) || 0), 0)
  const letter = letterFor(total)
  const isLocked = state.existing?.status === 'FINALISED'

  return (
    <Modal isOpen={state.open} onClose={onClose} size="lg">
      <ModalHeader>
        <ModalTitle>
          {state.phase} grade — {state.studentName}
        </ModalTitle>
      </ModalHeader>
      <ModalBody>
        {isLocked && (
          <div className="mb-4 flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 text-emerald-800 text-sm">
            <Lock className="h-4 w-4" />
            This grade is FINALISED — read-only.
          </div>
        )}
        <div className="space-y-3">
          {RUBRIC_CRITERIA.map((c) => (
            <div key={c.key} className="flex items-center gap-3">
              <div className="flex-1">
                <p className="text-sm font-medium text-stone-800">{c.label}</p>
                <p className="text-xs text-stone-500">Out of {c.max}</p>
              </div>
              <input
                type="number"
                min={0}
                max={c.max}
                step={0.5}
                disabled={isLocked}
                value={rubric[c.key] ?? 0}
                onChange={(e) => setRubric((r) => ({ ...r, [c.key]: Number(e.target.value) }))}
                className="w-24 px-3 py-1.5 rounded-md border border-stone-300 text-right disabled:bg-stone-100"
              />
            </div>
          ))}
          <div className="border-t pt-3 flex items-center justify-between">
            <p className="text-sm font-medium text-stone-700">Total</p>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold text-stone-900">{total.toFixed(1)}</span>
              <span className="px-3 py-1 rounded-lg bg-amber-100 text-amber-800 font-semibold">
                {letter}
              </span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Remarks</label>
            <textarea
              rows={3}
              disabled={isLocked}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Optional comments for the student / committee."
              className="w-full px-3 py-2 rounded-md border border-stone-300 disabled:bg-stone-100"
            />
          </div>
        </div>
        {state.existing && (
          <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-stone-500">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" /> Updated {state.existing.updatedAt}
            </span>
            <span>
              Status: <span className="font-medium text-stone-700">{state.existing.status}</span>
            </span>
          </div>
        )}
      </ModalBody>
      <ModalFooter>
        <Button variant="ghost" onClick={onClose}>Close</Button>
        {!isLocked && (
          <>
            <Button
              variant="secondary"
              onClick={() => onSave('DRAFT', rubric, remarks)}
              isLoading={saving}
            >
              Save draft
            </Button>
            <Button
              variant="primary"
              onClick={() => onSave('SUBMITTED', rubric, remarks)}
              isLoading={saving}
              leftIcon={<CheckCircle className="h-4 w-4" />}
            >
              Submit for finalisation
            </Button>
          </>
        )}
      </ModalFooter>
    </Modal>
  )
}

function letterFor(total: number): string {
  if (total >= 80) return 'A'
  if (total >= 75) return 'A-'
  if (total >= 70) return 'B+'
  if (total >= 65) return 'B'
  if (total >= 60) return 'B-'
  if (total >= 55) return 'C+'
  if (total >= 50) return 'C'
  if (total >= 45) return 'C-'
  if (total >= 40) return 'D'
  return 'F'
}
