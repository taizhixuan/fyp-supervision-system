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
    <div className="space-y-4 lg:space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
          <ShieldCheck className="h-7 w-7 text-primary-600" />
          Approved Roster
        </h1>
        <p className="text-neutral-600 mt-1">
          Upload the official list of students or supervisors. Anyone whose registration matches a
          row here is auto-approved instead of waiting for manual review. Pending users with
          matching MMU&nbsp;ID and email are activated immediately on upload.
        </p>
      </div>

      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div className="flex gap-2">
            {(['STUDENT', 'SUPERVISOR'] as Tab[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setTab(t)
                  setLastResult(null)
                }}
                className={cn(
                  'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                  tab === t
                    ? 'bg-primary-600 text-white'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                )}
              >
                {t === 'STUDENT' ? 'Students' : 'Supervisors'}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, ID, email"
                className="pl-9 w-64"
              />
            </div>
            <Button variant="secondary" size="sm" onClick={downloadTemplate}>
              <Download className="h-4 w-4 mr-1" />
              CSV template
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
            >
              {importing ? <Spinner size="sm" className="mr-1" /> : <Upload className="h-4 w-4 mr-1" />}
              Import CSV
            </Button>
          </div>
        </div>
        <p className="mt-3 text-xs text-neutral-500">
          {isStudent
            ? 'Columns: mmuId, email, fullName, programme, specialisation, faculty, intakeYear. Email must end with @student.mmu.edu.my.'
            : 'Columns: mmuId, email, fullName, department, faculty, position. Email must end with @mmu.edu.my.'}
        </p>
      </Card>

      {lastResult && (
        <Card className="p-4 border-l-4 border-l-emerald-500">
          <p className="text-sm font-medium text-neutral-900">
            Imported {lastResult.imported}, updated {lastResult.updated}, auto-approved{' '}
            {lastResult.autoApproved}.
          </p>
          {lastResult.errorCount > 0 && (
            <div className="mt-2">
              <p className="text-xs font-semibold text-amber-700 flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5" />
                {lastResult.errorCount} row{lastResult.errorCount === 1 ? '' : 's'} skipped
              </p>
              <ul className="mt-1 text-xs text-amber-700 list-disc pl-5 space-y-0.5">
                {lastResult.errors.slice(0, 8).map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
                {lastResult.errors.length > 8 && (
                  <li>…and {lastResult.errors.length - 8} more</li>
                )}
              </ul>
            </div>
          )}
        </Card>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12">
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
      <Card className="p-12 text-center">
        <ShieldCheck className="h-12 w-12 text-neutral-300 mx-auto mb-3" />
        <p className="text-neutral-500">{empty}</p>
      </Card>
    )
  }
  return (
    <Card className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-neutral-50 border-b border-neutral-200">
          <tr>
            {headers.map((h) => (
              <th key={h} className="text-left px-4 py-3 font-medium text-neutral-700">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {rows.map((row) => (
            <tr key={row.id} className="hover:bg-neutral-50">
              {row.cells.map((c, i) => (
                <td key={i} className="px-4 py-3 text-neutral-700">
                  {c}
                </td>
              ))}
              <td className="px-4 py-3 text-right">
                <button
                  type="button"
                  onClick={() => onDelete(row.id, row.label)}
                  className="text-rose-600 hover:text-rose-800"
                  aria-label={`Remove ${row.label}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  )
}
