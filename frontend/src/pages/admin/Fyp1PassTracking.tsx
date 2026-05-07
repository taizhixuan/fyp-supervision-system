import { useRef, useState } from 'react'
import { Award, Upload, Check, X, Clock, Search, Download } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
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

  const handleSet = async (project: Fyp1PassRow, passed: boolean | null) => {
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
          <Award className="h-7 w-7 text-primary-600" />
          FYP1 Pass Tracking
        </h1>
        <p className="text-neutral-600 mt-1">
          Mark each student&apos;s FYP1 result based on what was entered in eBwise/Clic. Passed
          students automatically advance to FYP2 on their next login (when an FYP2 cycle is active).
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-neutral-500">Total FYP1</p>
          <p className="text-2xl font-bold text-neutral-900 mt-1">{data?.total ?? 0}</p>
        </Card>
        <Card className="p-4 border-l-4 border-l-emerald-500">
          <p className="text-sm text-neutral-500 flex items-center gap-1">
            <Check className="h-3.5 w-3.5 text-emerald-600" /> Passed
          </p>
          <p className="text-2xl font-bold text-emerald-700 mt-1">{data?.passedCount ?? 0}</p>
        </Card>
        <Card className="p-4 border-l-4 border-l-rose-500">
          <p className="text-sm text-neutral-500 flex items-center gap-1">
            <X className="h-3.5 w-3.5 text-rose-600" /> Failed
          </p>
          <p className="text-2xl font-bold text-rose-700 mt-1">{data?.failedCount ?? 0}</p>
        </Card>
        <Card className="p-4 border-l-4 border-l-orange-500">
          <p className="text-sm text-neutral-500 flex items-center gap-1">
            <Clock className="h-3.5 w-3.5 text-orange-600" /> Pending
          </p>
          <p className="text-2xl font-bold text-orange-700 mt-1">{data?.pendingCount ?? 0}</p>
        </Card>
      </div>

      {/* Toolbar */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {(['ALL', 'PASSED', 'FAILED', 'PENDING'] as Filter[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={cn(
                  'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                  filter === f
                    ? 'bg-primary-600 text-white'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                )}
              >
                {f.charAt(0) + f.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or ID"
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
              disabled={importMutation.isPending}
            >
              {importMutation.isPending ? <Spinner size="sm" className="mr-1" /> : <Upload className="h-4 w-4 mr-1" />}
              Import CSV
            </Button>
          </div>
        </div>
      </Card>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <Award className="h-12 w-12 text-neutral-300 mx-auto mb-3" />
          <p className="text-neutral-500">No projects match the current filter.</p>
        </Card>
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-neutral-700">Student</th>
                <th className="text-left px-4 py-3 font-medium text-neutral-700">Project</th>
                <th className="text-left px-4 py-3 font-medium text-neutral-700">Supervisor</th>
                <th className="text-left px-4 py-3 font-medium text-neutral-700">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filtered.map((p) => (
                <tr key={p.projectId} className="hover:bg-neutral-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-neutral-900">{p.studentName}</div>
                    <div className="text-xs text-neutral-500">{p.studentId}</div>
                  </td>
                  <td className="px-4 py-3 max-w-xs">
                    <div className="line-clamp-2 text-neutral-700">{p.projectTitle}</div>
                  </td>
                  <td className="px-4 py-3 text-neutral-700">
                    {p.supervisorName || <span className="text-neutral-400">Unassigned</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleSet(p, true)}
                        disabled={setMutation.isPending}
                        className={cn(
                          'px-2.5 py-1 text-xs rounded font-medium transition-colors',
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
                          'px-2.5 py-1 text-xs rounded font-medium transition-colors',
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
                          'px-2.5 py-1 text-xs rounded font-medium transition-colors',
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
    </div>
  )
}
