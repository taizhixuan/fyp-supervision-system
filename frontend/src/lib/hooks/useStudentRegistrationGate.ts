import { useStudentDashboard } from './useStudent'

/**
 * Spec UC10/UC11: meetings, logs, and documents are reachable once the student
 * is paired with a supervisor. Pairing exists when a Project row exists, which
 * the backend reflects via registrationStatus.status ∈ {PROPOSAL_PENDING,
 * UNDER_REVIEW, REGISTERED}.
 */
export function useStudentRegistrationGate() {
  const { data, isLoading } = useStudentDashboard()
  const status = data?.registrationStatus?.status
  const supervisorAssigned =
    status === 'PROPOSAL_PENDING' ||
    status === 'UNDER_REVIEW' ||
    status === 'REGISTERED'
  return {
    isLoading,
    status,
    supervisorAssigned,
    isRegistered: status === 'REGISTERED',
  }
}
