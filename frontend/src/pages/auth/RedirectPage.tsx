import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Spinner } from '@/components/ui'
import { useAuth } from '@/lib/auth/useAuth'
import { ROUTES, ROLE_ROUTES } from '@/lib/constants/routes'
import type { UserRole } from '@/types'

// Mirrors backend SecurityConfig URL→authority rules. A student should never
// land on /admin/* etc. just because they tried to deep-link there before login.
function isPathAllowedForRole(path: string, role: UserRole): boolean {
  if (path === '/admin' || path.startsWith('/admin/')) return role === 'SYSTEM_ADMIN'
  if (path === '/committee' || path.startsWith('/committee/')) return role === 'FYP_COMMITTEE'
  if (path === '/supervisor' || path.startsWith('/supervisor/')) return role === 'SUPERVISOR'
  if (path === '/supervisors' || path.startsWith('/supervisors/')) return role === 'STUDENT'
  if (path === '/student' || path.startsWith('/student/')) return role === 'STUDENT'
  return true
}

export function RedirectPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, isAuthenticated, isLoading } = useAuth()

  useEffect(() => {
    if (isLoading) return

    // Not authenticated
    if (!isAuthenticated || !user) {
      navigate(ROUTES.LOGIN, { replace: true })
      return
    }

    // Check user status
    if (user.status === 'PENDING') {
      navigate(ROUTES.ACCOUNT_PENDING, { replace: true })
      return
    }

    if (user.status === 'BLOCKED') {
      navigate(ROUTES.ACCOUNT_BLOCKED, { replace: true })
      return
    }

    if (user.status === 'INACTIVE') {
      navigate(ROUTES.LOGIN, { replace: true })
      return
    }

    // FYP1 result gate — only applies to students with a project where the result was entered.
    // null  = not yet decided, keep going (most students before/during FYP1)
    // true  = passed, AuthService already auto-flipped phase to FYP2 if a cycle is active
    // false = failed, block at the gate page until committee resolves
    if (user.role === 'STUDENT') {
      const passed = localStorage.getItem('student_fyp1_passed')
      if (passed === 'false') {
        navigate(ROUTES.FYP1_RESULT_PENDING, { replace: true })
        return
      }
    }

    // Role-based dashboard route
    const dashboardRoute = ROLE_ROUTES[user.role]
    const fromPath = (location.state as { from?: string } | null)?.from
    // eslint-disable-next-line no-console
    console.log('[RedirectPage]', {
      role: user.role,
      status: user.status,
      dashboardRoute,
      fromPath,
      fromAllowed: fromPath ? isPathAllowedForRole(fromPath, user.role) : null,
    })
    if (!dashboardRoute) {
      navigate(ROUTES.ACCESS_DENIED, { replace: true })
      return
    }

    // Honour deep-link `from` only if it's compatible with the user's role —
    // otherwise a student who deep-linked /admin/* would land on /access-denied.
    if (fromPath && fromPath !== ROUTES.LOGIN && isPathAllowedForRole(fromPath, user.role)) {
      navigate(fromPath, { replace: true })
    } else {
      navigate(dashboardRoute, { replace: true })
    }
  }, [user, isAuthenticated, isLoading, navigate, location.state])

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
      <div className="text-center">
        <Spinner size="lg" />
        <p className="mt-4 text-neutral-600">Preparing your dashboard...</p>
      </div>
    </div>
  )
}
