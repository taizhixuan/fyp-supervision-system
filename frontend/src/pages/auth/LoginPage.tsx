import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { LogIn, Mail, Lock, GraduationCap, Users, ClipboardList, Shield, Info } from 'lucide-react'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { Button, AlertBanner } from '@/components/ui'
import { useAuth } from '@/lib/auth/useAuth'
import { loginSchema, type LoginFormData } from '@/lib/validators/auth'
import { ROUTES } from '@/lib/constants/routes'

const DEMO_ACCOUNTS = [
  { role: 'Student', identifier: '1201234567', password: 'Test@123', Icon: GraduationCap },
  { role: 'Supervisor', identifier: 'sarah.lee@mmu.edu.my', password: 'Test@123', Icon: Users },
  { role: 'Committee', identifier: 'ahmad.razak@mmu.edu.my', password: 'Test@123', Icon: ClipboardList },
  { role: 'Admin', identifier: 'admin@mmu.edu.my', password: 'Admin@123', Icon: Shield },
]

export function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const fromPath = location.state?.from?.pathname

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: '',
      password: '',
      rememberMe: false,
    },
  })

  const onSubmit = async (data: LoginFormData) => {
    setError(null)
    try {
      await login(data)
      // Always go through /redirect so the role-aware logic (FYP1 gate,
      // role-vs-`from` compatibility) runs in one place.
      navigate(ROUTES.REDIRECT, { replace: true, state: { from: fromPath } })
    } catch (err) {
      // Generic error message for security
      setError('Invalid credentials. Please try again.')
    }
  }

  return (
    <AuthLayout maxWidth="4xl">
      <div className="bg-white rounded-2xl shadow-xl shadow-stone-200/50 border border-stone-200 overflow-hidden lg:grid lg:grid-cols-5">
        {/* Brand panel — top on mobile, left rail on desktop */}
        <div className="bg-gradient-to-br from-primary-900 to-[#0f1f33] px-6 py-6 text-center lg:col-span-2 lg:px-8 lg:py-10 lg:text-left lg:flex lg:flex-col lg:justify-center">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-accent-500 rounded-2xl mb-3 shadow-lg lg:w-16 lg:h-16 lg:mb-5">
            <LogIn className="h-7 w-7 text-white lg:h-8 lg:w-8" />
          </div>
          <h1 className="text-xl font-bold text-white mb-1 lg:text-3xl lg:mb-3">Welcome Back</h1>
          <p className="text-sm text-stone-400 lg:text-base">Log in to continue to your dashboard</p>
          <p className="hidden lg:block mt-6 text-xs text-stone-500 leading-relaxed">
            FYP Supervision System &middot; MMU Faculty of Computing &amp; Informatics
          </p>
        </div>

        {/* Form */}
        <div className="px-6 py-6 lg:col-span-3 lg:px-8 lg:py-8">
          {error && (
            <AlertBanner
              variant="error"
              description={error}
              dismissible
              onDismiss={() => setError(null)}
              className="mb-6"
            />
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">
                MMU ID or Email <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-stone-400" />
                </div>
                <input
                  type="text"
                  placeholder="e.g., 1201234567 or john@mmu.edu.my"
                  className="w-full pl-9 pr-3 py-2.5 text-sm border border-stone-300 rounded-lg text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  {...register('identifier')}
                />
              </div>
              {errors.identifier && (
                <p className="mt-1 text-xs text-red-500">{errors.identifier.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-stone-400" />
                </div>
                <input
                  type="password"
                  placeholder="Enter your password"
                  className="w-full pl-9 pr-3 py-2.5 text-sm border border-stone-300 rounded-lg text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  {...register('password')}
                />
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  id="rememberMe"
                  className="h-4 w-4 rounded border-stone-300 text-primary-700 focus:ring-primary-500"
                  {...register('rememberMe')}
                />
                <span className="ml-2 text-sm text-stone-600">Remember me</span>
              </label>
              <Link
                to={ROUTES.FORGOT_PASSWORD}
                className="text-sm text-primary-700 hover:text-primary-900 font-medium"
              >
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              className="w-full bg-primary-900 hover:bg-primary-800 text-white py-2.5 rounded-lg font-medium shadow-lg shadow-primary-900/25 hover:shadow-primary-900/40 transition-all"
              isLoading={isSubmitting}
            >
              Log In
            </Button>
          </form>

          {import.meta.env.DEV && (
            <div className="mt-4 p-3 bg-primary-50 border border-primary-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Info className="h-4 w-4 text-primary-700" />
                <span className="text-sm font-semibold text-primary-900">Demo Accounts</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {DEMO_ACCOUNTS.map((account) => (
                  <button
                    key={account.role}
                    type="button"
                    onClick={() => {
                      setValue('identifier', account.identifier)
                      setValue('password', account.password)
                    }}
                    className="flex items-center gap-2 px-2 py-1.5 text-left text-sm bg-white rounded-md border border-primary-100 hover:border-primary-300 hover:bg-primary-50 transition-colors"
                  >
                    <account.Icon className="h-4 w-4 text-primary-700 flex-shrink-0" />
                    <span className="font-medium text-stone-700 truncate">{account.role}</span>
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-primary-700 text-center">
                Click to auto-fill credentials. Password: Test@123 (Admin: Admin@123)
              </p>
            </div>
          )}

          <div className="mt-5 pt-4 border-t border-stone-200 text-center">
            <p className="text-sm text-stone-600">
              Don't have an account?{' '}
              <Link
                to={ROUTES.REGISTER}
                className="font-semibold text-primary-700 hover:text-primary-900"
              >
                Register here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </AuthLayout>
  )
}
