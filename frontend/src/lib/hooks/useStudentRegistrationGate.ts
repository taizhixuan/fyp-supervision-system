import { useAuth } from '@/lib/auth/useAuth'
import { useStudentDashboard } from './useStudent'

/**
 * Spec UC10/UC11: meetings, logs, and documents are reachable once the student
 * is paired with a supervisor. Pairing exists when a Project row exists, which
 * the backend reflects via registrationStatus.status ∈ {PROPOSAL_PENDING,
 * UNDER_REVIEW, REGISTERED}.
 *
 * The dashboard fetch is gated on role so admins/supervisors/committee don't
 * fire a 403 against /student/dashboard whenever the sidebar mounts.
 */
export function useStudentRegistrationGate() {
  const { user } = useAuth()
  const isStudent = user?.role === 'STUDENT'
  const { data, isLoading } = useStudentDashboard({ enabled: isStudent })
  const reg = data?.registrationStatus
  const status = reg?.status
  const supervisorAssigned =
    status === 'PROPOSAL_PENDING' ||
    status === 'UNDER_REVIEW' ||
    status === 'REGISTERED'
  // Backend explicitly sets cycleActive: false when the enrolled cycle is
  // COMPLETED/ARCHIVED. Treat undefined as "active" so admin/supervisor/etc. don't
  // accidentally lock themselves out via this hook.
  const cycleActive = reg?.cycleActive !== false
  return {
    isLoading: isStudent && isLoading,
    status,
    supervisorAssigned,
    isRegistered: status === 'REGISTERED',
    cycleActive,
    cycleStatus: reg?.cycleStatus ?? null,
  }
}
