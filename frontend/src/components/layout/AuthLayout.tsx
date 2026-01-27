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
    <div className="min-h-screen bg-stone-100 flex flex-col">
      {/* Header */}
      {showBackLink && (
        <header className="py-4 px-4 sm:px-6">
          <Link
            to={backLinkTo}
            className="group inline-flex items-center gap-2.5 px-4 py-2.5 text-base font-medium text-stone-700 hover:text-amber-700 bg-white hover:bg-amber-50 border border-stone-200 hover:border-amber-300 rounded-full shadow hover:shadow-md transition-all duration-200"
          >
            <ArrowLeft className="h-5 w-5 transition-transform duration-200 group-hover:-translate-x-0.5" />
            {backLinkText}
          </Link>
        </header>
      )}

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">{children}</div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-sm text-stone-500">
        <p>&copy; {new Date().getFullYear()} MMU FYP Committee. All rights reserved.</p>
      </footer>
    </div>
  )
}
