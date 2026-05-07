import { Link, useNavigate } from 'react-router-dom'
import { AlertTriangle, Mail, LogOut } from 'lucide-react'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { Button, Card } from '@/components/ui'
import { useAuth } from '@/lib/auth/useAuth'
import { ROUTES } from '@/lib/constants/routes'

export function Fyp1ResultPendingPage() {
  const { logout } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await logout()
    navigate(ROUTES.LOGIN, { replace: true })
  }

  return (
    <AuthLayout showBackLink={false}>
      <Card padding="lg" className="text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-rose-100 flex items-center justify-center">
          <AlertTriangle className="h-8 w-8 text-rose-600" />
        </div>

        <h1 className="text-2xl font-bold text-neutral-900 mb-2">
          FYP1 result not passed
        </h1>

        <p className="text-neutral-600 mb-6">
          Based on the result entered for your FYP1, you are not eligible to proceed to FYP2 in
          this system. Please contact the FYP Committee if you believe this is a mistake.
        </p>

        <div className="bg-neutral-50 rounded-lg p-4 mb-6 text-left">
          <div className="flex items-center gap-2 text-neutral-700 mb-2">
            <Mail className="h-5 w-5 text-primary-500" />
            <span className="font-medium">Contact</span>
          </div>
          <a
            href="mailto:fyp-committee@mmu.edu.my"
            className="text-primary-600 hover:text-primary-700 font-medium text-sm"
          >
            fyp-committee@mmu.edu.my
          </a>
          <p className="text-xs text-neutral-500 mt-2">
            Bring up your FYP1 grade record (eBwise/Clic) when you reach out.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Button variant="secondary" onClick={handleSignOut} className="w-full">
            <LogOut className="h-4 w-4 mr-2" />
            Sign out
          </Button>
          <Link to={ROUTES.LOGIN} className="text-sm text-neutral-500 hover:text-neutral-700">
            Back to sign in
          </Link>
        </div>
      </Card>
    </AuthLayout>
  )
}
