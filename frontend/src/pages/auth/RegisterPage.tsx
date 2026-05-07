import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { UserPlus, GraduationCap, Briefcase, User, Mail, Phone, Lock, Hash } from 'lucide-react'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { Button, AlertBanner } from '@/components/ui'
import { useAuth } from '@/lib/auth/useAuth'
import { registerSchema, type RegisterFormData } from '@/lib/validators/auth'
import { ROUTES } from '@/lib/constants/routes'
import { cn } from '@/lib/utils/cn'

export function RegisterPage() {
  const [error, setError] = useState<string | null>(null)
  const { register: registerUser } = useAuth()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: undefined,
      fullName: '',
      mmuId: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false,
    },
  })

  const selectedRole = watch('role')

  const onSubmit = async (data: RegisterFormData) => {
    setError(null)
    try {
      await registerUser({
        role: data.role,
        fullName: data.fullName,
        mmuId: data.mmuId,
        email: data.email,
        phone: data.phone || undefined,
        password: data.password,
      })
      navigate(ROUTES.ACCOUNT_PENDING)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.')
    }
  }

  return (
    <AuthLayout>
      <div className="bg-white rounded-2xl shadow-xl shadow-stone-200/50 border border-stone-200 overflow-hidden max-w-lg w-full">
        {/* Header - Compact */}
        <div className="bg-gradient-to-br from-stone-800 to-stone-900 px-6 py-5 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-amber-500 rounded-xl mb-3 shadow-lg">
            <UserPlus className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-xl font-bold text-white">Create Your Account</h1>
          <p className="text-stone-400 text-sm">Join the FYP Supervision System</p>
        </div>

        {/* Form - Compact */}
        <div className="px-6 py-5">
          {error && (
            <AlertBanner
              variant="error"
              description={error}
              dismissible
              onDismiss={() => setError(null)}
              className="mb-4"
            />
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Role Selection - Inline */}
            <div>
              <div className="flex items-baseline justify-between mb-1">
                <label className="block text-sm font-semibold text-stone-800">
                  Select your role <span className="text-red-500">*</span>
                </label>
                <span className="text-xs text-stone-500">Choose one option below</span>
              </div>
              <div
                role="radiogroup"
                aria-label="Select your role"
                aria-required="true"
                className={cn(
                  'grid grid-cols-2 gap-2 p-1 rounded-xl border transition-colors',
                  !selectedRole
                    ? 'border-dashed border-amber-300 bg-amber-50/40'
                    : 'border-transparent'
                )}
              >
                <label
                  className={cn(
                    'relative flex items-center justify-center gap-2 px-3 py-3 border-2 rounded-lg cursor-pointer transition-all bg-white',
                    selectedRole === 'STUDENT'
                      ? 'border-amber-500 bg-amber-50 text-amber-700 shadow-sm ring-2 ring-amber-200'
                      : 'border-stone-300 hover:border-amber-400 hover:bg-amber-50/50'
                  )}
                >
                  <input
                    type="radio"
                    value="STUDENT"
                    className="sr-only"
                    {...register('role')}
                  />
                  <GraduationCap className={cn(
                    'h-5 w-5',
                    selectedRole === 'STUDENT' ? 'text-amber-600' : 'text-stone-500'
                  )} />
                  <span className="font-medium text-sm">Student</span>
                  {selectedRole === 'STUDENT' && (
                    <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-white text-[10px] font-bold">
                      ✓
                    </span>
                  )}
                </label>
                <label
                  className={cn(
                    'relative flex items-center justify-center gap-2 px-3 py-3 border-2 rounded-lg cursor-pointer transition-all bg-white',
                    selectedRole === 'SUPERVISOR'
                      ? 'border-amber-500 bg-amber-50 text-amber-700 shadow-sm ring-2 ring-amber-200'
                      : 'border-stone-300 hover:border-amber-400 hover:bg-amber-50/50'
                  )}
                >
                  <input
                    type="radio"
                    value="SUPERVISOR"
                    className="sr-only"
                    {...register('role')}
                  />
                  <Briefcase className={cn(
                    'h-5 w-5',
                    selectedRole === 'SUPERVISOR' ? 'text-amber-600' : 'text-stone-500'
                  )} />
                  <span className="font-medium text-sm">Supervisor</span>
                  {selectedRole === 'SUPERVISOR' && (
                    <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-white text-[10px] font-bold">
                      ✓
                    </span>
                  )}
                </label>
              </div>
              {errors.role ? (
                <p className="mt-1.5 text-xs text-red-500">{errors.role.message}</p>
              ) : !selectedRole ? (
                <p className="mt-1.5 text-xs text-stone-500">
                  Please pick whether you're registering as a Student or a Supervisor.
                </p>
              ) : null}
            </div>

            {/* Full Name & MMU ID - Two columns */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-stone-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Your full name"
                    className="w-full pl-9 pr-3 py-2.5 text-sm border border-stone-300 rounded-lg text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                    {...register('fullName')}
                  />
                </div>
                {errors.fullName && (
                  <p className="mt-1 text-xs text-red-500">{errors.fullName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">
                  MMU ID <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Hash className="h-4 w-4 text-stone-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="1201234567"
                    className="w-full pl-9 pr-3 py-2.5 text-sm border border-stone-300 rounded-lg text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                    {...register('mmuId')}
                  />
                </div>
                {errors.mmuId && (
                  <p className="mt-1 text-xs text-red-500">{errors.mmuId.message}</p>
                )}
              </div>
            </div>

            {/* Email & Phone - Two columns */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">
                  Email <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-stone-400" />
                  </div>
                  <input
                    type="email"
                    placeholder="name@mmu.edu.my"
                    className="w-full pl-9 pr-3 py-2.5 text-sm border border-stone-300 rounded-lg text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                    {...register('email')}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">
                  Phone <span className="text-stone-400 text-xs font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-4 w-4 text-stone-400" />
                  </div>
                  <input
                    type="tel"
                    placeholder="+60123456789"
                    className="w-full pl-9 pr-3 py-2.5 text-sm border border-stone-300 rounded-lg text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                    {...register('phone')}
                  />
                </div>
                {errors.phone && (
                  <p className="mt-1 text-xs text-red-500">{errors.phone.message}</p>
                )}
              </div>
            </div>

            {/* Password & Confirm - Two columns */}
            <div className="grid grid-cols-2 gap-3">
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
                    placeholder="Min 8 chars"
                    className="w-full pl-9 pr-3 py-2.5 text-sm border border-stone-300 rounded-lg text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                    {...register('password')}
                  />
                </div>
                {errors.password && (
                  <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-stone-400" />
                  </div>
                  <input
                    type="password"
                    placeholder="Re-enter"
                    className="w-full pl-9 pr-3 py-2.5 text-sm border border-stone-300 rounded-lg text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                    {...register('confirmPassword')}
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-xs text-red-500">{errors.confirmPassword.message}</p>
                )}
              </div>
            </div>

            {/* Terms and Conditions */}
            <div className="pt-2">
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="acceptTerms"
                  className="mt-0.5 h-4 w-4 rounded border-stone-300 text-amber-600 focus:ring-amber-500"
                  {...register('acceptTerms')}
                />
                <label htmlFor="acceptTerms" className="text-sm text-stone-600">
                  I agree to the{' '}
                  <a
                    href="/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-amber-600 hover:text-amber-700 underline"
                  >
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a
                    href="/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-amber-600 hover:text-amber-700 underline"
                  >
                    Privacy Policy
                  </a>
                  <span className="text-red-500"> *</span>
                </label>
              </div>
              {errors.acceptTerms && (
                <p className="mt-1 text-xs text-red-500">{errors.acceptTerms.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-amber-600 hover:bg-amber-700 text-white py-2.5 rounded-lg font-medium shadow-lg shadow-amber-600/25 hover:shadow-amber-600/40 transition-all"
              isLoading={isSubmitting}
            >
              Create Account
            </Button>
          </form>

          <div className="mt-5 pt-4 border-t border-stone-200 text-center">
            <p className="text-sm text-stone-600">
              Already have an account?{' '}
              <Link
                to={ROUTES.LOGIN}
                className="font-semibold text-amber-600 hover:text-amber-700"
              >
                Log in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </AuthLayout>
  )
}
