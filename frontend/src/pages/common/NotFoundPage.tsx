import { Link } from 'react-router-dom'
import { Search, Home } from 'lucide-react'
import { Button, Card } from '@/components/ui'
import { ROUTES } from '@/lib/constants/routes'

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-4">
      <Card padding="lg" className="max-w-md w-full text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-neutral-100 flex items-center justify-center">
          <Search className="h-10 w-10 text-neutral-400" />
        </div>

        <h1 className="text-3xl font-bold text-neutral-900 mb-2">404</h1>
        <h2 className="text-xl font-semibold text-neutral-700 mb-4">
          Page Not Found
        </h2>

        <p className="text-neutral-600 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>

        <Link to={ROUTES.HOME}>
          <Button className="w-full" leftIcon={<Home className="h-4 w-4" />}>
            Go to Home
          </Button>
        </Link>
      </Card>
    </div>
  )
}
