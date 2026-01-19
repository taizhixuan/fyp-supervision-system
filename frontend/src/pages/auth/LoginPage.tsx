import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { Button, Input, AlertBanner, Card } from '@/components/ui'
import { useAuth } from '@/lib/auth/useAuth'
import { loginSchema, type LoginFormData } from '@/lib/validators/auth'
import { ROUTES } from '@/lib/constants/routes'

export function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const from = location.state?.from?.pathname || ROUTES.REDIRECT

  const {
    register,
    handleSubmit,
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
      navigate(from, { replace: true })
    } catch (err) {
      // Generic error message for security
      setError('Invalid credentials. Please try again.')
    }
  }

  return (
    <AuthLayout>
      <Card padding="lg">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">Welcome Back</h1>
          <p className="text-neutral-600">Sign in to continue to your dashboard</p>
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
          <Input
            label="MMU ID or Email"
            placeholder="e.g., 1201234567 or john@mmu.edu.my"
            error={errors.identifier?.message}
            required
            {...register('identifier')}
          />

          <div>
            <Input
              label="Password"
              type="password"
              placeholder="Enter your password"
              error={errors.password?.message}
              required
              {...register('password')}
            />
            <div className="mt-2 text-right">
              <Link
                to={ROUTES.FORGOT_PASSWORD}
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                Forgot password?
              </Link>
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="rememberMe"
              className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
              {...register('rememberMe')}
            />
            <label htmlFor="rememberMe" className="ml-2 text-sm text-neutral-600">
              Remember me
            </label>
          </div>

          <Button type="submit" className="w-full" isLoading={isSubmitting}>
            Sign In
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-neutral-600">
          Don't have an account?{' '}
          <Link
            to={ROUTES.REGISTER}
            className="font-medium text-primary-600 hover:text-primary-700"
          >
            Create one
          </Link>
        </p>
      </Card>
    </AuthLayout>
  )
}
