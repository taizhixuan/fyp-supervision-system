import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { Button, Input, AlertBanner, Card } from '@/components/ui'
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
      <Card padding="lg">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">
            Create Your Account
          </h1>
          <p className="text-neutral-600">
            Join the FYP Supervision System
          </p>
        </div>

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
          {/* Role Selection */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-3">
              I am a: <span className="text-error-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={cn(
                  'flex items-center justify-center px-4 py-3 border rounded-md cursor-pointer transition-all',
                  selectedRole === 'STUDENT'
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-neutral-300 hover:border-neutral-400'
                )}
              >
                <input
                  type="radio"
                  value="STUDENT"
                  className="sr-only"
                  {...register('role')}
                />
                <span className="font-medium">Student</span>
              </label>
              <label
                className={cn(
                  'flex items-center justify-center px-4 py-3 border rounded-md cursor-pointer transition-all',
                  selectedRole === 'SUPERVISOR'
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-neutral-300 hover:border-neutral-400'
                )}
              >
                <input
                  type="radio"
                  value="SUPERVISOR"
                  className="sr-only"
                  {...register('role')}
                />
                <span className="font-medium">Supervisor</span>
              </label>
            </div>
            {errors.role && (
              <p className="mt-1.5 text-sm text-error-500">{errors.role.message}</p>
            )}
          </div>

          <Input
            label="Full Name"
            placeholder="Enter your full name"
            error={errors.fullName?.message}
            required
            {...register('fullName')}
          />

          <Input
            label="MMU ID"
            placeholder="e.g., 1201234567"
            helperText="Your 10-digit MMU student/staff ID"
            error={errors.mmuId?.message}
            required
            {...register('mmuId')}
          />

          <Input
            label="Email Address"
            type="email"
            placeholder="e.g., name@student.mmu.edu.my"
            error={errors.email?.message}
            required
            {...register('email')}
          />

          <Input
            label="Phone Number"
            type="tel"
            placeholder="e.g., +60123456789"
            error={errors.phone?.message}
            {...register('phone')}
          />

          <Input
            label="Password"
            type="password"
            placeholder="Create a strong password"
            helperText="Min 8 characters, 1 uppercase, 1 number"
            error={errors.password?.message}
            required
            {...register('password')}
          />

          <Input
            label="Confirm Password"
            type="password"
            placeholder="Re-enter your password"
            error={errors.confirmPassword?.message}
            required
            {...register('confirmPassword')}
          />

          <Button type="submit" className="w-full" isLoading={isSubmitting}>
            Create Account
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-neutral-600">
          Already have an account?{' '}
          <Link
            to={ROUTES.LOGIN}
            className="font-medium text-primary-600 hover:text-primary-700"
          >
            Sign in
          </Link>
        </p>
      </Card>
    </AuthLayout>
  )
}
