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
    <AuthLayout>
      <div className="bg-white rounded-2xl shadow-xl shadow-stone-200/50 border border-stone-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-stone-800 to-stone-900 px-8 py-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-500 rounded-2xl mb-4 shadow-lg">
            <LogIn className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-stone-400">Log in to continue to your dashboard</p>
        </div>

        {/* Form */}
        <div className="px-8 py-8">
          {error && (
            <AlertBanner
              variant="error"
              description={error}
              dismissible
              onDismiss={() => setError(null)}
              className="mb-6"
            />
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                MMU ID or Email <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-stone-400" />
                </div>
                <input
                  type="text"
                  placeholder="e.g., 1201234567 or john@mmu.edu.my"
                  className="w-full pl-11 pr-4 py-3 border border-stone-300 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                  {...register('identifier')}
                />
              </div>
              {errors.identifier && (
                <p className="mt-1.5 text-sm text-red-500">{errors.identifier.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-stone-400" />
                </div>
                <input
                  type="password"
                  placeholder="Enter your password"
                  className="w-full pl-11 pr-4 py-3 border border-stone-300 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                  {...register('password')}
                />
              </div>
              {errors.password && (
                <p className="mt-1.5 text-sm text-red-500">{errors.password.message}</p>
              )}
              <div className="mt-2 text-right">
                <Link
                  to={ROUTES.FORGOT_PASSWORD}
                  className="text-sm text-amber-600 hover:text-amber-700 font-medium"
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="rememberMe"
                className="h-4 w-4 rounded border-stone-300 text-amber-600 focus:ring-amber-500"
                {...register('rememberMe')}
              />
              <label htmlFor="rememberMe" className="ml-2.5 text-sm text-stone-600">
                Remember me
              </label>
            </div>

            <Button
              type="submit"
              className="w-full bg-amber-600 hover:bg-amber-700 text-white py-3 rounded-xl font-medium shadow-lg shadow-amber-600/25 hover:shadow-amber-600/40 transition-all"
              isLoading={isSubmitting}
            >
              Log In
            </Button>
          </form>

          {import.meta.env.DEV && (
            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <div className="flex items-center gap-2 mb-3">
                <Info className="h-4 w-4 text-amber-600" />
                <span className="text-sm font-semibold text-amber-800">Demo Accounts</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {DEMO_ACCOUNTS.map((account) => (
                  <button
                    key={account.role}
                    type="button"
                    onClick={() => {
                      setValue('identifier', account.identifier)
                      setValue('password', account.password)
                    }}
                    className="flex items-center gap-2 p-2 text-left text-sm bg-white rounded-lg border border-amber-100 hover:border-amber-300 hover:bg-amber-50 transition-colors"
                  >
                    <account.Icon className="h-4 w-4 text-amber-600 flex-shrink-0" />
                    <span className="font-medium text-stone-700 truncate">{account.role}</span>
                  </button>
                ))}
              </div>
              <p className="mt-3 text-xs text-amber-600 text-center">
                Click to auto-fill credentials. Password: Test@123 (Admin: Admin@123)
              </p>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-stone-200 text-center">
            <p className="text-sm text-stone-600">
              Don't have an account?{' '}
              <Link
                to={ROUTES.REGISTER}
                className="font-semibold text-amber-600 hover:text-amber-700"
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
