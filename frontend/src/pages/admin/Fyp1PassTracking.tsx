import { useRef, useState } from 'react'
import { Award, Upload, Check, Search, Download, AlertTriangle } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import { Modal, ModalHeader, ModalTitle, ModalBody, ModalFooter } from '@/components/ui/Modal'
import { useSuccessToast, useErrorToast } from '@/components/ui/Toast'
import {
  useFyp1PassList,
  useSetFyp1Passed,
  useImportFyp1Passed,
  type Fyp1PassRow,
} from '@/lib/hooks/useAdmin'
import { cn } from '@/lib/utils/cn'

type Filter = 'ALL' | 'PASSED' | 'FAILED' | 'PENDING'

export function Fyp1PassTracking() {
  const { data, isLoading } = useFyp1PassList()
  const setMutation = useSetFyp1Passed()
  const importMutation = useImportFyp1Passed()
  const successToast = useSuccessToast()
  const errorToast = useErrorToast()

  const [filter, setFilter] = useState<Filter>('ALL')
  const [search, setSearch] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  // When admin clicks PASS for a student under the 6-log minimum, hold the action in
  // this state and show a confirm modal. Soft-warning per the plan: admin can override.
  const [pendingPass, setPendingPass] = useState<Fyp1PassRow | null>(null)

  const handleSet = async (project: Fyp1PassRow, passed: boolean | null) => {
    // Soft warning: if admin marks PASS but student is below the 6-log minimum, ask for
    // confirmation. Other transitions (FAIL / reset to PENDING) skip the gate.
    if (passed === true && project.meetsMeetingLogMinimum === false) {
      setPendingPass(project)
      return
    }
    await commitSet(project, passed)
  }

  const commitSet = async (project: Fyp1PassRow, passed: boolean | null) => {
    try {
      await setMutation.mutateAsync({ projectId: project.projectId, passed })
      const label = passed === true ? 'passed' : passed === false ? 'failed' : 'reset to pending'
      successToast('Updated', `${project.studentName} marked ${label}.`)
    } catch (e) {
      errorToast('Update failed', (e as Error).message)
    }
  }

  const handleImport = async (file: File) => {
    try {
      const result = await importMutation.mutateAsync(file)
      successToast(
        'Import done',
        `${result.updated} updated. ${result.notFoundCount} not matched.`
      )
    } catch (e) {
      errorToast('Import failed', (e as Error).message)
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const downloadTemplate = () => {
    const csv = 'studentId,passed\nMMU0001,true\nMMU0002,false\n'
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'fyp1-pass-template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const filtered = (data?.projects || []).filter((p) => {
    if (filter === 'PASSED' && p.fyp1Passed !== true) return false
    if (filter === 'FAILED' && p.fyp1Passed !== false) return false
    if (filter === 'PENDING' && p.fyp1Passed !== null) return false
    if (search) {
      const q = search.toLowerCase()
      return (
        p.studentName.toLowerCase().includes(q) ||
        p.studentId.toLowerCase().includes(q) ||
        p.studentEmail.toLowerCase().includes(q)
      )
    }
    return true
  })

  return (
    <div className="space-y-3 lg:space-y-4">
      {/* Compact hero with inline stat chips */}
      <div className="relative bg-gradient-to-br from-stone-800 via-stone-800 to-stone-900 rounded-xl p-3 sm:p-4 text-white shadow-md overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="relative flex items-center gap-3 min-w-0">
          <div className="flex-shrink-0 w-9 h-9 bg-amber-500/20 rounded-lg flex items-center justify-center ring-1 ring-amber-500/30">
            <Award className="h-5 w-5 text-amber-400" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-bold text-white leading-tight">FYP1 Pass Tracking</h1>
            <p className="text-stone-300 text-xs">Passed students auto-advance to FYP2 on next login when an FYP2 cycle is active</p>
          </div>
        </div>

        <div className="relative mt-3 grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {[
            { label: 'Total', value: data?.total ?? 0, color: 'text-stone-200' },
            { label: 'Passed', value: data?.passedCount ?? 0, color: 'text-emerald-300' },
            { label: 'Failed', value: data?.failedCount ?? 0, color: 'text-rose-300' },
            { label: 'Pending', value: data?.pendingCount ?? 0, color: 'text-orange-300' },
          ].map((chip) => (
            <div key={chip.label} className="bg-stone-700/40 ring-1 ring-stone-600/40 rounded-md px-2 py-1.5">
              <div className={cn('text-base font-bold leading-none', chip.color)}>{chip.value}</div>
              <p className="text-[10px] text-stone-300 truncate uppercase tracking-wide">{chip.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Toolbar */}
      <Card padding="sm">
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-1.5">
            {(['ALL', 'PASSED', 'FAILED', 'PENDING'] as Filter[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={cn(
                  'px-2.5 py-1 rounded text-xs font-medium transition-colors',
                  filter === f
                    ? 'bg-amber-600 text-white'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                )}
              >
                {f.charAt(0) + f.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            <div className="relative">
              <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search…"
                className="pl-8 h-8 w-48 text-sm"
              />
            </div>
            <Button variant="secondary" size="sm" onClick={downloadTemplate} className="h-8 px-2 text-xs">
              <Download className="h-3.5 w-3.5 mr-0.5" />
              Template
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleImport(file)
              }}
            />
            <Button
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={importMutation.isPending}
              className="h-8 px-2 text-xs"
            >
              {importMutation.isPending ? <Spinner size="sm" className="mr-0.5" /> : <Upload className="h-3.5 w-3.5 mr-0.5" />}
              Import CSV
            </Button>
          </div>
        </div>
      </Card>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Spinner size="lg" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="text-center py-8">
          <Award className="h-10 w-10 text-neutral-300 mx-auto mb-2" />
          <p className="text-sm text-neutral-500">No projects match the current filter.</p>
        </Card>
      ) : (
        <Card className="overflow-x-auto" padding="sm">
          <table className="w-full text-xs">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="text-left px-2.5 py-1.5 font-semibold text-neutral-700 uppercase tracking-wide text-[10px]">Student</th>
                <th className="text-left px-2.5 py-1.5 font-semibold text-neutral-700 uppercase tracking-wide text-[10px]">Project</th>
                <th className="text-left px-2.5 py-1.5 font-semibold text-neutral-700 uppercase tracking-wide text-[10px]">Supervisor</th>
                <th className="text-left px-2.5 py-1.5 font-semibold text-neutral-700 uppercase tracking-wide text-[10px]">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filtered.map((p) => (
                <tr key={p.projectId} className="hover:bg-neutral-50">
                  <td className="px-2.5 py-1.5">
                    <div className="font-medium text-neutral-900 flex items-center gap-1.5">
                      {p.studentName}
                      {p.meetingLogsRequired != null && (
                        <span
                          className={cn(
                            'inline-flex items-center gap-0.5 px-1.5 py-0 rounded text-[10px] font-medium',
                            p.meetsMeetingLogMinimum
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-amber-50 text-amber-700',
                          )}
                          title={p.meetsMeetingLogMinimum
                            ? `${p.meetingLogsCompleted}/${p.meetingLogsRequired} required FYP1 logs`
                            : `Below the ${p.meetingLogsRequired}-log FYP1 minimum`}
                        >
                          {p.meetsMeetingLogMinimum ? (
                            <Check className="h-2.5 w-2.5" />
                          ) : (
                            <AlertTriangle className="h-2.5 w-2.5" />
                          )}
                          {p.meetingLogsCompleted ?? 0}/{p.meetingLogsRequired}
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-neutral-500">{p.studentId}</div>
                  </td>
                  <td className="px-2.5 py-1.5 max-w-xs">
                    <div className="line-clamp-2 text-neutral-700">{p.projectTitle}</div>
                  </td>
                  <td className="px-2.5 py-1.5 text-neutral-700">
                    {p.supervisorName || <span className="text-neutral-400">Unassigned</span>}
                  </td>
                  <td className="px-2.5 py-1.5">
                    <div className="flex items-center gap-0.5">
                      <button
                        type="button"
                        onClick={() => handleSet(p, true)}
                        disabled={setMutation.isPending}
                        className={cn(
                          'px-2 py-0.5 text-[11px] rounded font-medium transition-colors',
                          p.fyp1Passed === true
                            ? 'bg-emerald-600 text-white'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        )}
                      >
                        Pass
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSet(p, false)}
                        disabled={setMutation.isPending}
                        className={cn(
                          'px-2 py-0.5 text-[11px] rounded font-medium transition-colors',
                          p.fyp1Passed === false
                            ? 'bg-rose-600 text-white'
                            : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                        )}
                      >
                        Fail
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSet(p, null)}
                        disabled={setMutation.isPending}
                        className={cn(
                          'px-2 py-0.5 text-[11px] rounded font-medium transition-colors',
                          p.fyp1Passed === null
                            ? 'bg-orange-500 text-white'
                            : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                        )}
                      >
                        Pending
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* Soft-warning confirm modal — admin can still pass a student who is under the
          6-log FYP1 minimum, but has to consciously confirm. */}
      <Modal isOpen={!!pendingPass} onClose={() => setPendingPass(null)} size="sm">
        <ModalHeader>
          <ModalTitle>Mark passed below minimum?</ModalTitle>
        </ModalHeader>
        <ModalBody>
          {pendingPass && (
            <div className="space-y-3 text-sm text-neutral-700">
              <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg p-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-amber-900">
                    {pendingPass.studentName} has only {pendingPass.meetingLogsCompleted ?? 0} of {pendingPass.meetingLogsRequired} required FYP1 meeting logs.
                  </p>
                  <p className="text-amber-800 mt-1">
                    The FCI minimum for FYP1 supervision is {pendingPass.meetingLogsRequired} completed logs.
                    Mark this student as passed anyway?
                  </p>
                </div>
              </div>
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setPendingPass(null)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={async () => {
              if (pendingPass) {
                await commitSet(pendingPass, true)
                setPendingPass(null)
              }
            }}
            isLoading={setMutation.isPending}
          >
            Pass anyway
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}
