import { Link } from 'react-router-dom'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { Button, Card } from '@/components/ui'
import { ROUTES } from '@/lib/constants/routes'

export function ServerErrorPage() {
  const handleRetry = () => {
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-4">
      <Card padding="lg" className="max-w-md w-full text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-warning-100 flex items-center justify-center">
          <AlertTriangle className="h-10 w-10 text-warning-500" />
        </div>

        <h1 className="text-3xl font-bold text-neutral-900 mb-2">500</h1>
        <h2 className="text-xl font-semibold text-neutral-700 mb-4">
          Something Went Wrong
        </h2>

        <p className="text-neutral-600 mb-8">
          We're experiencing technical difficulties. Please try again later.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={handleRetry}
            className="flex-1"
            leftIcon={<RefreshCw className="h-4 w-4" />}
          >
            Retry
          </Button>
          <Link to={ROUTES.HOME} className="flex-1">
            <Button
              variant="secondary"
              className="w-full"
              leftIcon={<Home className="h-4 w-4" />}
            >
              Go to Home
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  )
}
