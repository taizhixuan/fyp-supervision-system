import { Suspense } from 'react'
import { RouterProvider } from 'react-router-dom'
import { Providers } from '@/app/providers'
import { router } from '@/app/router'
import { Spinner } from '@/components/ui'

function App() {
  return (
    <Providers>
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen bg-neutral-50">
          <div className="text-center">
            <Spinner size="lg" />
            <p className="mt-4 text-neutral-600">Loading...</p>
          </div>
        </div>
      }>
        <RouterProvider
          router={router}
          future={{ v7_startTransition: true }}
        />
      </Suspense>
    </Providers>
  )
}

export default App
