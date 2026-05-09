import { lazy, Suspense, type ReactNode } from 'react'
import { Spinner } from '@/components/ui'
import { useStudentRegistrationGate } from '@/lib/hooks/useStudentRegistrationGate'

const LockedFeaturePage = lazy(() =>
  import('@/pages/student/LockedFeaturePage').then(m => ({ default: m.LockedFeaturePage }))
)

/**
 * Wraps student feature pages that require an assigned supervisor (UC10/UC11/UC12).
 * Until then, renders a friendly locked screen instead of the feature page.
 */
export function StudentFeatureGate({ children }: { children: ReactNode }) {
  const { isLoading, supervisorAssigned } = useStudentRegistrationGate()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" label="Loading..." />
      </div>
    )
  }

  if (!supervisorAssigned) {
    return (
      <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]"><Spinner size="lg" /></div>}>
        <LockedFeaturePage />
      </Suspense>
    )
  }

  return <>{children}</>
}
