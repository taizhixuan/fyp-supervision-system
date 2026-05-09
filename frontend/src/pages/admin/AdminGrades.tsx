import { Award, Lock } from 'lucide-react'
import { Card, Button, Spinner, Badge } from '@/components/ui'
import { useSubmittedGrades, useFinaliseGrade } from '@/lib/hooks/useGrading'
import { useSuccessToast, useErrorToast } from '@/components/ui/Toast'

export function AdminGrades() {
  const { data, isLoading } = useSubmittedGrades()
  const finalise = useFinaliseGrade()
  const successToast = useSuccessToast()
  const errorToast = useErrorToast()

  const grades = data?.grades ?? []

  const handleFinalise = async (gradeId: number, label: string) => {
    if (!confirm(`Finalise this grade for ${label}? Once locked, the grader can't change it and the student becomes able to see it.`)) {
      return
    }
    try {
      await finalise.mutateAsync(gradeId)
      successToast('Grade finalised', `${label} is now visible to the student.`)
    } catch (e) {
      errorToast('Finalise failed', (e as Error).message)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" label="Loading submitted grades..." />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
          <Award className="h-7 w-7 text-primary-600" />
          Final-Report Grades
        </h1>
        <p className="text-neutral-600 mt-1">
          Grades that supervisors have submitted but not yet finalised. Locking a grade
          publishes it to the student and freezes it for the grader.
        </p>
      </div>

      {grades.length === 0 ? (
        <Card className="text-center py-12">
          <Award className="h-12 w-12 text-neutral-300 mx-auto mb-3" />
          <p className="text-neutral-500">No grades awaiting finalisation right now.</p>
        </Card>
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-neutral-700">Grader</th>
                <th className="text-left px-4 py-3 font-medium text-neutral-700">Project</th>
                <th className="text-left px-4 py-3 font-medium text-neutral-700">Phase</th>
                <th className="text-right px-4 py-3 font-medium text-neutral-700">Score</th>
                <th className="text-left px-4 py-3 font-medium text-neutral-700">Submitted</th>
                <th className="text-right px-4 py-3 font-medium text-neutral-700">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {grades.map((g) => (
                <tr key={g.gradeId} className="hover:bg-neutral-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-neutral-900">{g.graderName ?? '—'}</div>
                    <div className="text-xs text-neutral-500">{g.graderRole}</div>
                  </td>
                  <td className="px-4 py-3 text-neutral-700">#{g.projectId}</td>
                  <td className="px-4 py-3">
                    <Badge variant="default" size="sm">{g.phase}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-semibold text-neutral-900">
                      {g.totalScore != null ? Number(g.totalScore).toFixed(1) : '—'}
                    </span>
                    {g.letterGrade && (
                      <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                        {g.letterGrade}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-neutral-500">
                    {g.updatedAt ? new Date(g.updatedAt).toLocaleString('en-MY') : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleFinalise(g.gradeId, `${g.phase} for project #${g.projectId}`)}
                      disabled={finalise.isPending}
                      leftIcon={<Lock className="h-3.5 w-3.5" />}
                    >
                      Finalise
                    </Button>
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
