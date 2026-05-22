import { type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { ROUTES } from '@/lib/constants/routes'

type MaxWidth = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl'

const MAX_WIDTH_CLASS: Record<MaxWidth, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
}

interface AuthLayoutProps {
  children: ReactNode
  showBackLink?: boolean
  backLinkTo?: string
  backLinkText?: string
  maxWidth?: MaxWidth
}

export function AuthLayout({
  children,
  showBackLink = true,
  backLinkTo = ROUTES.HOME,
  backLinkText = 'Back to Home',
  maxWidth = 'md',
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-stone-100 flex flex-col">
      {/* Header */}
      {showBackLink && (
        <header className="py-3 px-4 sm:px-6">
          <Link
            to={backLinkTo}
            aria-label={backLinkText}
            className="group inline-flex items-center gap-2 pl-1.5 pr-4 py-1.5 text-sm font-medium text-stone-700 hover:text-primary-900 bg-white/85 hover:bg-white border border-stone-200/80 hover:border-primary-200 rounded-full shadow-sm hover:shadow-md backdrop-blur-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-100"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-50 group-hover:bg-primary-100 transition-colors">
              <ArrowLeft className="h-3.5 w-3.5 text-primary-700 transition-transform duration-200 group-hover:-translate-x-0.5" />
            </span>
            {backLinkText}
          </Link>
        </header>
      )}

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-4 py-3 sm:py-5">
        <div className={`w-full ${MAX_WIDTH_CLASS[maxWidth]}`}>{children}</div>
      </main>

      {/* Footer */}
      <footer className="py-3 text-center text-xs text-stone-500">
        <p>&copy; {new Date().getFullYear()} MMU FYP Committee. All rights reserved.</p>
      </footer>
    </div>
  )
}
