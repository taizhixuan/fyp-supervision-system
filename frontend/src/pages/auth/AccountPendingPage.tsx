import { Link } from 'react-router-dom'
import { Clock, Mail } from 'lucide-react'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { Button, Card } from '@/components/ui'
import { ROUTES } from '@/lib/constants/routes'

export function AccountPendingPage() {
  return (
    <AuthLayout showBackLink={false}>
      <Card padding="lg" className="text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-warning-100 flex items-center justify-center">
          <Clock className="h-8 w-8 text-warning-500" />
        </div>

        <h1 className="text-2xl font-bold text-neutral-900 mb-2">
          Account Pending Verification
        </h1>

        <p className="text-neutral-600 mb-6">
          Your account has been created and is pending verification by the FYP Committee.
        </p>

        <div className="bg-neutral-50 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 text-neutral-700 mb-2">
            <Mail className="h-5 w-5 text-primary-500" />
            <span className="font-medium">What's next?</span>
          </div>
          <p className="text-sm text-neutral-600">
            You will receive an email notification once your account is approved.
            This usually takes 1-2 business days.
          </p>
        </div>

        <div className="text-sm text-neutral-500 mb-6">
          <p className="mb-1">If you have questions, please contact:</p>
          <a
            href="mailto:fyp-committee@mmu.edu.my"
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
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
