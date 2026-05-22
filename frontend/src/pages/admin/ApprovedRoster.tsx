import { useRef, useState } from 'react'
import { ShieldCheck, Upload, Download, Trash2, Search, AlertTriangle } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import { useSuccessToast, useErrorToast } from '@/components/ui/Toast'
import { cn } from '@/lib/utils/cn'
import {
  useApprovedStudentRoster,
  useApprovedSupervisorRoster,
  useImportStudentRoster,
  useImportSupervisorRoster,
  useDeleteStudentRosterEntry,
  useDeleteSupervisorRosterEntry,
  type RosterImportResult,
} from '@/lib/hooks/useAdmin'

type Tab = 'STUDENT' | 'SUPERVISOR'

const STUDENT_TEMPLATE =
  'mmuId,email,fullName,programme,specialisation,faculty,intakeYear\n' +
  '1201234567,alice@student.mmu.edu.my,Alice Tan,Bachelor of Computer Science,Software Engineering,FCI,2023\n'

const SUPERVISOR_TEMPLATE =
  'mmuId,email,fullName,department,faculty,position\n' +
  '1011112222,dr.lee@mmu.edu.my,Dr Lee,Software Engineering,FCI,Senior Lecturer\n'

export function ApprovedRoster() {
  const [tab, setTab] = useState<Tab>('STUDENT')
  const [search, setSearch] = useState('')
  const [lastResult, setLastResult] = useState<RosterImportResult | null>(null)

  const studentQuery = useApprovedStudentRoster()
  const supervisorQuery = useApprovedSupervisorRoster()
  const importStudents = useImportStudentRoster()
  const importSupervisors = useImportSupervisorRoster()
  const deleteStudent = useDeleteStudentRosterEntry()
  const deleteSupervisor = useDeleteSupervisorRosterEntry()

  const fileInputRef = useRef<HTMLInputElement>(null)
  const successToast = useSuccessToast()
  const errorToast = useErrorToast()

  const isStudent = tab === 'STUDENT'
  const isLoading = isStudent ? studentQuery.isLoading : supervisorQuery.isLoading
  const importing = isStudent ? importStudents.isPending : importSupervisors.isPending

  const studentRows = studentQuery.data ?? []
  const supervisorRows = supervisorQuery.data ?? []

  const filteredStudents = filterRows(studentRows, search, (r) =>
    [r.mmuId, r.email, r.fullName ?? '', r.programme ?? '', r.specialisation ?? ''].join(' ')
  )
  const filteredSupervisors = filterRows(supervisorRows, search, (r) =>
    [r.mmuId, r.email, r.fullName ?? '', r.department ?? ''].join(' ')
  )

  const handleImport = async (file: File) => {
    setLastResult(null)
    try {
      const result = isStudent
        ? await importStudents.mutateAsync(file)
        : await importSupervisors.mutateAsync(file)
      setLastResult(result)
      successToast(
        'Import complete',
        `${result.imported} added, ${result.updated} updated, ${result.autoApproved} auto-approved.`
      )
    } catch (e) {
      errorToast('Import failed', (e as Error).message)
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleDelete = async (rosterId: number, label: string) => {
    if (!window.confirm(`Remove ${label} from the approved roster?`)) return
    try {
      if (isStudent) await deleteStudent.mutateAsync(rosterId)
      else await deleteSupervisor.mutateAsync(rosterId)
      successToast('Removed', `${label} removed from roster.`)
    } catch (e) {
      errorToast('Remove failed', (e as Error).message)
    }
  }

  const downloadTemplate = () => {
    const csv = isStudent ? STUDENT_TEMPLATE : SUPERVISOR_TEMPLATE
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = isStudent ? 'student-roster-template.csv' : 'supervisor-roster-template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-3 lg:space-y-4">
      {/* Compact hero */}
      <div className="relative bg-gradient-to-br from-stone-800 via-stone-800 to-stone-900 rounded-xl p-3 sm:p-4 text-white shadow-md overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="relative flex items-center gap-3 min-w-0">
          <div className="flex-shrink-0 w-9 h-9 bg-amber-500/20 rounded-lg flex items-center justify-center ring-1 ring-amber-500/30">
            <ShieldCheck className="h-5 w-5 text-amber-400" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-bold text-white leading-tight">Approved Roster</h1>
            <p className="text-stone-300 text-xs">Upload official student/supervisor lists. Matching signups are auto-approved instead of waiting for manual review.</p>
          </div>
        </div>
      </div>

      <Card padding="sm">
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
          <div className="flex gap-1.5">
            {(['STUDENT', 'SUPERVISOR'] as Tab[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setTab(t)
                  setLastResult(null)
                }}
                className={cn(
                  'px-2.5 py-1 rounded text-xs font-medium transition-colors',
                  tab === t
                    ? 'bg-amber-600 text-white'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                )}
              >
                {t === 'STUDENT' ? 'Students' : 'Supervisors'}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
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
              disabled={importing}
              className="h-8 px-2 text-xs"
            >
              {importing ? <Spinner size="sm" className="mr-0.5" /> : <Upload className="h-3.5 w-3.5 mr-0.5" />}
              Import CSV
            </Button>
          </div>
        </div>
        <p className="mt-2 text-[11px] text-neutral-500">
          {isStudent
            ? 'Columns: mmuId, email, fullName, programme, specialisation, faculty, intakeYear. Email must end with @student.mmu.edu.my.'
            : 'Columns: mmuId, email, fullName, department, faculty, position. Email must end with @mmu.edu.my.'}
        </p>
      </Card>

      {lastResult && (
        <div className="px-3 py-2 rounded-md border-l-4 border-l-emerald-500 bg-emerald-50/60">
          <p className="text-sm font-medium text-neutral-900">
            Imported {lastResult.imported}, updated {lastResult.updated}, auto-approved {lastResult.autoApproved}.
          </p>
          {lastResult.errorCount > 0 && (
            <div className="mt-1">
              <p className="text-xs font-semibold text-amber-700 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {lastResult.errorCount} row{lastResult.errorCount === 1 ? '' : 's'} skipped
              </p>
              <ul className="mt-0.5 text-[11px] text-amber-700 list-disc pl-5 space-y-0.5">
                {lastResult.errors.slice(0, 8).map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
                {lastResult.errors.length > 8 && (
                  <li>…and {lastResult.errors.length - 8} more</li>
                )}
              </ul>
            </div>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Spinner size="lg" />
        </div>
      ) : isStudent ? (
        <RosterTable
          empty="No students on the approved roster yet. Upload a CSV to begin."
          headers={['MMU ID', 'Email', 'Name', 'Programme', 'Specialisation', 'Faculty', 'Intake', '']}
          rows={filteredStudents.map((r) => ({
            id: r.rosterId,
            label: `${r.fullName ?? r.mmuId}`,
            cells: [
              r.mmuId,
              r.email,
              r.fullName ?? '—',
              r.programme ?? '—',
              r.specialisation ?? '—',
              r.faculty ?? '—',
              r.intakeYear ?? '—',
            ],
          }))}
          onDelete={handleDelete}
        />
      ) : (
        <RosterTable
          empty="No supervisors on the approved roster yet. Upload a CSV to begin."
          headers={['MMU ID', 'Email', 'Name', 'Department', 'Faculty', 'Position', '']}
          rows={filteredSupervisors.map((r) => ({
            id: r.rosterId,
            label: `${r.fullName ?? r.mmuId}`,
            cells: [
              r.mmuId,
              r.email,
              r.fullName ?? '—',
              r.department ?? '—',
              r.faculty ?? '—',
              r.position ?? '—',
            ],
          }))}
          onDelete={handleDelete}
        />
      )}
    </div>
  )
}

function filterRows<T>(rows: T[], search: string, asString: (r: T) => string): T[] {
  if (!search.trim()) return rows
  const q = search.trim().toLowerCase()
  return rows.filter((r) => asString(r).toLowerCase().includes(q))
}

interface TableRow {
  id: number
  label: string
  cells: (string | number)[]
}

function RosterTable({
  rows,
  headers,
  empty,
  onDelete,
}: {
  rows: TableRow[]
  headers: string[]
  empty: string
  onDelete: (id: number, label: string) => void
}) {
  if (rows.length === 0) {
    return (
      <Card className="text-center py-8">
        <ShieldCheck className="h-10 w-10 text-neutral-300 mx-auto mb-2" />
        <p className="text-sm text-neutral-500">{empty}</p>
      </Card>
    )
  }
  return (
    <Card className="overflow-x-auto" padding="sm">
      <table className="w-full text-xs">
        <thead className="bg-neutral-50 border-b border-neutral-200">
          <tr>
            {headers.map((h) => (
              <th key={h} className="text-left px-2.5 py-1.5 font-semibold text-neutral-700 uppercase tracking-wide text-[10px]">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {rows.map((row) => (
            <tr key={row.id} className="hover:bg-neutral-50">
              {row.cells.map((c, i) => (
                <td key={i} className="px-2.5 py-1.5 text-neutral-700">
                  {c}
                </td>
              ))}
              <td className="px-2.5 py-1.5 text-right">
                <button
                  type="button"
                  onClick={() => onDelete(row.id, row.label)}
                  className="text-rose-600 hover:text-rose-800"
                  aria-label={`Remove ${row.label}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  )
}
