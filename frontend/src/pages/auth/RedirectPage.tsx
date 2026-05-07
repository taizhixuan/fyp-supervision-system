import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Spinner } from '@/components/ui'
import { useAuth } from '@/lib/auth/useAuth'
import { ROUTES, ROLE_ROUTES } from '@/lib/constants/routes'

export function RedirectPage() {
  const navigate = useNavigate()
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

    // Get role-based dashboard route
    const dashboardRoute = ROLE_ROUTES[user.role]
    if (dashboardRoute) {
      navigate(dashboardRoute, { replace: true })
    } else {
      // Unknown role - redirect to access denied
      navigate(ROUTES.ACCESS_DENIED, { replace: true })
    }
  }, [user, isAuthenticated, isLoading, navigate])

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
      <div className="text-center">
        <Spinner size="lg" />
        <p className="mt-4 text-neutral-600">Preparing your dashboard...</p>
      </div>
    </div>
  )
}
