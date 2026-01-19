import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './useAuth'
import { Spinner } from '@/components/ui'
import { ROUTES } from '@/lib/constants/routes'
import type { UserRole } from '@/types'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: UserRole[]
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <Spinner size="lg" label="Loading..." />
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />
  }

  // Check user status
  if (user.status === 'PENDING') {
    return <Navigate to={ROUTES.ACCOUNT_PENDING} replace />
  }

  if (user.status === 'BLOCKED') {
    return <Navigate to={ROUTES.ACCOUNT_BLOCKED} replace />
  }

  if (user.status === 'INACTIVE') {
    return <Navigate to={ROUTES.LOGIN} replace />
  }

  // Check role-based access
  if (allowedRoles && allowedRoles.length > 0) {
    if (!allowedRoles.includes(user.role)) {
      return <Navigate to={ROUTES.ACCESS_DENIED} replace />
    }
  }

  return <>{children}</>
}

// Higher-order component for role-based routes
interface RoleBasedRouteProps {
  children: React.ReactNode
  role: UserRole
}

export function StudentRoute({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute allowedRoles={['STUDENT']}>{children}</ProtectedRoute>
}

export function SupervisorRoute({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute allowedRoles={['SUPERVISOR']}>{children}</ProtectedRoute>
}

export function CommitteeRoute({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute allowedRoles={['FYP_COMMITTEE']}>{children}</ProtectedRoute>
}

export function AdminRoute({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute allowedRoles={['SYSTEM_ADMIN']}>{children}</ProtectedRoute>
}
