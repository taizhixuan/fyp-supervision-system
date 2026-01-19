import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle2, ArrowLeft } from 'lucide-react'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { Button, Input, AlertBanner, Card } from '@/components/ui'
import { authApi } from '@/lib/api/auth'
import { getApiErrorMessage } from '@/lib/api/client'
import { forgotPasswordSchema, type ForgotPasswordFormData } from '@/lib/validators/auth'
import { ROUTES } from '@/lib/constants/routes'

export function ForgotPasswordPage() {
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [submittedEmail, setSubmittedEmail] = useState('')
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  })

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setError(null)
    try {
      await authApi.forgotPassword(data)
      setSubmittedEmail(data.email)
      setIsSubmitted(true)
    } catch (err) {
      // For security, always show success message
      // In production, the API should also return success regardless
      setSubmittedEmail(data.email)
      setIsSubmitted(true)
    }
  }

  if (isSubmitted) {
    return (
      <AuthLayout
        showBackLink={false}
      >
        <Card padding="lg" className="text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-success-100 flex items-center justify-center">
            <CheckCircle2 className="h-8 w-8 text-success-500" />
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">
            Check Your Email
          </h1>
          <p className="text-neutral-600 mb-6">
            If an account exists for <span className="font-medium">{submittedEmail}</span>,
            you will receive a password reset link shortly.
          </p>
          <Link to={ROUTES.LOGIN}>
            <Button variant="secondary" className="w-full">
              Return to Sign In
            </Button>
          </Link>
        </Card>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      backLinkTo={ROUTES.LOGIN}
      backLinkText="Back to Sign In"
    >
      <Card padding="lg">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">
            Reset Your Password
          </h1>
          <p className="text-neutral-600">
            Enter your email address and we'll send you a link to reset your password.
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
          <Input
            label="Email Address"
            type="email"
            placeholder="Enter your email address"
            error={errors.email?.message}
            required
            {...register('email')}
          />

          <Button type="submit" className="w-full" isLoading={isSubmitting}>
            Send Reset Link
          </Button>
        </form>
      </Card>
    </AuthLayout>
  )
}
