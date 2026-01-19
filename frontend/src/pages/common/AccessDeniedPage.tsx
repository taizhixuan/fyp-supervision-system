import { Link, useNavigate } from 'react-router-dom'
import { ShieldX, Home, LogOut } from 'lucide-react'
import { Button, Card } from '@/components/ui'
import { useAuth } from '@/lib/auth/useAuth'
import { ROUTES, ROLE_ROUTES } from '@/lib/constants/routes'

export function AccessDeniedPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await logout()
    navigate(ROUTES.LOGIN)
  }

  const dashboardRoute = user ? ROLE_ROUTES[user.role] : ROUTES.HOME

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-4">
      <Card padding="lg" className="max-w-md w-full text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-error-100 flex items-center justify-center">
          <ShieldX className="h-10 w-10 text-error-500" />
        </div>

        <h1 className="text-3xl font-bold text-neutral-900 mb-2">403</h1>
        <h2 className="text-xl font-semibold text-neutral-700 mb-4">
          Access Denied
        </h2>

        <p className="text-neutral-600 mb-8">
          You don't have permission to access this page.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link to={dashboardRoute} className="flex-1">
            <Button className="w-full" leftIcon={<Home className="h-4 w-4" />}>
              Go to Dashboard
            </Button>
          </Link>
          <Button
            variant="secondary"
            onClick={handleSignOut}
            leftIcon={<LogOut className="h-4 w-4" />}
          >
            Sign Out
          </Button>
        </div>
      </Card>
    </div>
  )
}
