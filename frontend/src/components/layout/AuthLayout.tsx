import { type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { ROUTES } from '@/lib/constants/routes'

interface AuthLayoutProps {
  children: ReactNode
  showBackLink?: boolean
  backLinkTo?: string
  backLinkText?: string
}

export function AuthLayout({
  children,
  showBackLink = true,
  backLinkTo = ROUTES.HOME,
  backLinkText = 'Back to Home',
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      {/* Header */}
      {showBackLink && (
        <header className="py-4 px-6">
          <Link
            to={backLinkTo}
            className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-primary-600 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            {backLinkText}
          </Link>
        </header>
      )}

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">{children}</div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-sm text-neutral-500">
        <p>&copy; {new Date().getFullYear()} MMU FYP Committee. All rights reserved.</p>
      </footer>
    </div>
  )
}
