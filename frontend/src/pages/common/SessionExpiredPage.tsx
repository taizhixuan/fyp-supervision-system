import { Link } from 'react-router-dom'
import { Clock, LogIn } from 'lucide-react'
import { Button, Card } from '@/components/ui'
import { ROUTES } from '@/lib/constants/routes'

export function SessionExpiredPage() {
  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-4">
      <Card padding="lg" className="max-w-md w-full text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-info-100 flex items-center justify-center">
          <Clock className="h-10 w-10 text-info-500" />
        </div>

        <h1 className="text-xl font-bold text-neutral-900 mb-2">
          Session Expired
        </h1>

        <p className="text-neutral-600 mb-8">
          Your session has expired for security reasons.
          Please sign in again to continue.
        </p>

        <Link to={ROUTES.LOGIN}>
          <Button className="w-full" leftIcon={<LogIn className="h-4 w-4" />}>
            Sign In
          </Button>
        </Link>
      </Card>
    </div>
  )
}
