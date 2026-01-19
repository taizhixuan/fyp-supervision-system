import { Link } from 'react-router-dom'
import { Ban, Mail } from 'lucide-react'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { Button, Card } from '@/components/ui'
import { ROUTES } from '@/lib/constants/routes'

export function AccountBlockedPage() {
  return (
    <AuthLayout showBackLink={false}>
      <Card padding="lg" className="text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-error-100 flex items-center justify-center">
          <Ban className="h-8 w-8 text-error-500" />
        </div>

        <h1 className="text-2xl font-bold text-neutral-900 mb-2">
          Account Blocked
        </h1>

        <p className="text-neutral-600 mb-6">
          Your account has been blocked.
        </p>

        <div className="bg-neutral-50 rounded-lg p-4 mb-6">
          <p className="text-sm text-neutral-600">
            This may be due to a policy violation or administrative action.
            To resolve this issue, please contact the FYP Committee.
          </p>
        </div>

        <div className="text-sm text-neutral-500 mb-6">
          <p className="mb-1">Contact us at:</p>
          <a
            href="mailto:fyp-committee@mmu.edu.my"
            className="inline-flex items-center gap-1.5 text-primary-600 hover:text-primary-700 font-medium"
          >
            <Mail className="h-4 w-4" />
            fyp-committee@mmu.edu.my
          </a>
        </div>

        <Link to={ROUTES.LOGIN}>
          <Button variant="secondary" className="w-full">
            Return to Sign In
          </Button>
        </Link>
      </Card>
    </AuthLayout>
  )
}
