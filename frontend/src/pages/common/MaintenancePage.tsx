import { Wrench, RefreshCw } from 'lucide-react'
import { Button, Card } from '@/components/ui'

export function MaintenancePage() {
  const handleRefresh = () => {
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-4">
      <Card padding="lg" className="max-w-md w-full text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary-100 flex items-center justify-center">
          <Wrench className="h-10 w-10 text-primary-600" />
        </div>

        <h1 className="text-xl font-bold text-neutral-900 mb-2">
          Under Maintenance
        </h1>

        <p className="text-neutral-600 mb-4">
          The system is currently undergoing scheduled maintenance.
          Please check back soon.
        </p>

        <div className="bg-neutral-100 rounded-lg p-4 mb-8">
          <p className="text-sm text-neutral-600">
            <span className="font-medium">Expected completion:</span>
            <br />
            We're working to restore service as quickly as possible.
          </p>
        </div>

        <Button
          variant="secondary"
          onClick={handleRefresh}
          leftIcon={<RefreshCw className="h-4 w-4" />}
        >
          Check Again
        </Button>
      </Card>
    </div>
  )
}
