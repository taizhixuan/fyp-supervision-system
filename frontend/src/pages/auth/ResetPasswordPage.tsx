import { useState, useEffect } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { Button, Input, AlertBanner, Card, Spinner } from '@/components/ui'
import { authApi } from '@/lib/api/auth'
import { getApiErrorMessage } from '@/lib/api/client'
import { resetPasswordSchema, type ResetPasswordFormData } from '@/lib/validators/auth'
import { ROUTES } from '@/lib/constants/routes'
import { useSuccessToast } from '@/components/ui/Toast'

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')

  const [isVerifying, setIsVerifying] = useState(true)
  const [isTokenValid, setIsTokenValid] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const showSuccessToast = useSuccessToast()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  })

  // Verify token on mount
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setIsVerifying(false)
        return
      }

      try {
        const result = await authApi.verifyResetToken(token)
        setIsTokenValid(result.valid)
      } catch {
        setIsTokenValid(false)
      } finally {
        setIsVerifying(false)
      }
    }

    verifyToken()
  }, [token])

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) return

    setError(null)
    try {
      await authApi.resetPassword({
        token,
        newPassword: data.newPassword,
      })
      setIsSuccess(true)
      showSuccessToast('Password reset successful', 'You can now sign in with your new password.')
      setTimeout(() => {
        navigate(ROUTES.LOGIN)
      }, 2000)
    } catch (err) {
      setError(getApiErrorMessage(err))
    }
  }

  // Loading state
  if (isVerifying) {
    return (
      <AuthLayout showBackLink={false}>
        <Card padding="lg" className="text-center">
          <Spinner size="lg" label="Verifying reset link..." />
        </Card>
      </AuthLayout>
    )
  }

  // No token or invalid token
  if (!token || !isTokenValid) {
    return (
      <AuthLayout showBackLink={false}>
        <Card padding="lg" className="text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-warning-100 flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-warning-500" />
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">
            Link Expired
          </h1>
          <p className="text-neutral-600 mb-6">
            This password reset link has expired or is invalid.
            Please request a new one.
          </p>
          <Link to={ROUTES.FORGOT_PASSWORD}>
            <Button className="w-full">Request New Link</Button>
          </Link>
        </Card>
      </AuthLayout>
    )
  }

  // Success state
  if (isSuccess) {
    return (
      <AuthLayout showBackLink={false}>
        <Card padding="lg" className="text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-success-100 flex items-center justify-center">
            <CheckCircle2 className="h-8 w-8 text-success-500" />
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">
            Password Reset Successful
          </h1>
          <p className="text-neutral-600 mb-6">
            Your password has been reset successfully.
            Redirecting to sign in...
          </p>
          <Spinner size="sm" />
        </Card>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout showBackLink={false}>
      <Card padding="lg">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">
            Set New Password
          </h1>
          <p className="text-neutral-600">
            Create a strong password for your account
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
            label="New Password"
            type="password"
            placeholder="Enter your new password"
            helperText="Min 8 characters, 1 uppercase, 1 number"
            error={errors.newPassword?.message}
            required
            {...register('newPassword')}
          />

          <Input
            label="Confirm New Password"
            type="password"
            placeholder="Re-enter your new password"
            error={errors.confirmPassword?.message}
            required
            {...register('confirmPassword')}
          />

          <Button type="submit" className="w-full" isLoading={isSubmitting}>
            Reset Password
          </Button>
        </form>
      </Card>
    </AuthLayout>
  )
}
