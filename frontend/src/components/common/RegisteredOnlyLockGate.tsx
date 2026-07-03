import { lazy, Suspense, type ReactNode } from 'react'
import { Spinner } from '@/components/ui'
import { useStudentRegistrationGate } from '@/lib/hooks/useStudentRegistrationGate'

const LockedFeaturePage = lazy(() =>
  import('@/pages/student/LockedFeaturePage').then(m => ({ default: m.LockedFeaturePage }))
)

/**
 * Gate the supervisor-discovery flow (Find Supervisor, AI Recommendations, Compare,
 * Create Request, My Requests) for students already paired with a supervisor AND for
 * any student whose enrolled cycle has ended. Once a supervisor is assigned there's no
 * point in browsing for supervisors; once the cycle has ended the same applies.
 */
export function RegisteredOnlyLockGate({ children }: { children: ReactNode }) {
  const { isLoading, supervisorAssigned, cycleActive } = useStudentRegistrationGate()

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

  if (supervisorAssigned) {
    return (
      <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]"><Spinner size="lg" /></div>}>
        <LockedFeaturePage reason="ALREADY_REGISTERED" />
      </Suspense>
    )
  }

  return <>{children}</>
}
