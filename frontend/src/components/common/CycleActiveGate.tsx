import { lazy, Suspense, type ReactNode } from 'react'
import { Spinner } from '@/components/ui'
import { useStudentRegistrationGate } from '@/lib/hooks/useStudentRegistrationGate'

const LockedFeaturePage = lazy(() =>
  import('@/pages/student/LockedFeaturePage').then(m => ({ default: m.LockedFeaturePage }))
)

/**
 * Wrap pure-write student pages (e.g. MeetingRequest, MeetingLogCreate, DocumentUpload).
 * If the student's enrolled cycle has ended, render a "cycle ended" lock screen instead
 * of the feature so the user can't try to submit something the backend will reject.
 */
export function CycleActiveGate({ children }: { children: ReactNode }) {
  const { isLoading, cycleActive } = useStudentRegistrationGate()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" label="Loading..." />
      </div>
    )
  }

  if (cycleActive === false) {
    return (
      <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]"><Spinner size="lg" /></div>}>
        <LockedFeaturePage reason="CYCLE_ENDED" />
      </Suspense>
    )
  }

  return <>{children}</>
}
