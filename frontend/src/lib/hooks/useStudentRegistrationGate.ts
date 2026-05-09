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
  const status = data?.registrationStatus?.status
  const supervisorAssigned =
    status === 'PROPOSAL_PENDING' ||
    status === 'UNDER_REVIEW' ||
    status === 'REGISTERED'
  return {
    isLoading: isStudent && isLoading,
    status,
    supervisorAssigned,
    isRegistered: status === 'REGISTERED',
  }
}
