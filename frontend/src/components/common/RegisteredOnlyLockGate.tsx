import { lazy, Suspense, type ReactNode } from 'react'
import { Spinner } from '@/components/ui'
import { useStudentRegistrationGate } from '@/lib/hooks/useStudentRegistrationGate'

const LockedFeaturePage = lazy(() =>
  import('@/pages/student/LockedFeaturePage').then(m => ({ default: m.LockedFeaturePage }))
)

/**
 * Gate the supervisor-discovery flow (Find Supervisor, AI Recommendations, Compare,
 * Create Request, My Requests) for already-registered students. Once the proposal
 * is APPROVED there's no point in browsing for supervisors any more.
 */
export function RegisteredOnlyLockGate({ children }: { children: ReactNode }) {
  const { isLoading, isRegistered } = useStudentRegistrationGate()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" label="Loading..." />
      </div>
    )
  }

  if (isRegistered) {
    return (
      <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]"><Spinner size="lg" /></div>}>
        <LockedFeaturePage reason="ALREADY_REGISTERED" />
      </Suspense>
    )
  }

  return <>{children}</>
}
