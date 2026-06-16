import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { UserPlus, GraduationCap, Briefcase, User, Mail, Phone, Lock, Hash, BookOpen, Calendar, MailCheck, ArrowLeft } from 'lucide-react'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { Button, AlertBanner, useSuccessToast } from '@/components/ui'
import { useAuth } from '@/lib/auth/useAuth'
import { authApi } from '@/lib/api/auth'
import { getApiErrorMessage } from '@/lib/api/client'
import {
  registerSchema,
  verifyOtpSchema,
  STUDENT_SPECIALISATIONS,
  INTAKE_YEAR_MIN,
  INTAKE_YEAR_MAX,
  type RegisterFormData,
  type VerifyOtpFormData,
} from '@/lib/validators/auth'
import { ROUTES } from '@/lib/constants/routes'
import { PRIVACY_NOTICE_VERSION } from '@/types/auth'
import {
  programmeForSpecialisation,
  expectedGraduationYear,
} from '@/lib/constants/programmes'
import { cn } from '@/lib/utils/cn'

const RESEND_COOLDOWN_SECONDS = 60

export function RegisterPage() {
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<'form' | 'otp'>('form')
  const [pendingEmail, setPendingEmail] = useState('')
  const [otpError, setOtpError] = useState<string | null>(null)
  const [resendIn, setResendIn] = useState(0)
  const [isResending, setIsResending] = useState(false)
  const { register: registerUser } = useAuth()
  const navigate = useNavigate()
  const showSuccessToast = useSuccessToast()

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
      specialisation: '',
      intakeYear: undefined,
      password: '',
      confirmPassword: '',
      acceptTerms: false,
    },
  })

  const otpForm = useForm<VerifyOtpFormData>({
    resolver: zodResolver(verifyOtpSchema),
    defaultValues: { code: '' },
  })

  const selectedRole = watch('role')
  const selectedSpecialisation = watch('specialisation')
  const selectedIntakeYear = watch('intakeYear')
  const derivedProgramme = programmeForSpecialisation(selectedSpecialisation)
  const derivedGraduationYear = expectedGraduationYear(
    typeof selectedIntakeYear === 'number' ? selectedIntakeYear : undefined
  )

  // Resend cooldown ticker.
  useEffect(() => {
    if (resendIn <= 0) return
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [resendIn])

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
        acceptedPrivacyNotice: data.acceptTerms,
        privacyNoticeVersion: PRIVACY_NOTICE_VERSION,
        ...(data.role === 'STUDENT'
          ? { specialisation: data.specialisation, intakeYear: data.intakeYear }
          : {}),
      })
      // Account is NOT created yet — move to the email-verification step.
      setPendingEmail(data.email.trim().toLowerCase())
      otpForm.reset({ code: '' })
      setOtpError(null)
      setResendIn(RESEND_COOLDOWN_SECONDS)
      setStep('otp')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.')
    }
  }

  const onVerify = async (data: VerifyOtpFormData) => {
    setOtpError(null)
    try {
      const result = await authApi.verifyRegistration({ email: pendingEmail, code: data.code })
      if (result.status === 'ACTIVE') {
        showSuccessToast('Account verified', 'Your account is active — please sign in.')
        navigate(ROUTES.LOGIN)
      } else {
        navigate(ROUTES.ACCOUNT_PENDING)
      }
    } catch (err) {
      setOtpError(getApiErrorMessage(err))
    }
  }

  const onResend = async () => {
    if (resendIn > 0 || isResending) return
    setOtpError(null)
    setIsResending(true)
    try {
      await authApi.resendRegistrationOtp({ email: pendingEmail })
      otpForm.reset({ code: '' })
      setResendIn(RESEND_COOLDOWN_SECONDS)
    } catch (err) {
      setOtpError(getApiErrorMessage(err))
    } finally {
      setIsResending(false)
    }
  }

  const backToForm = () => {
    setStep('form')
    setOtpError(null)
    setError(null)
  }

  if (step === 'otp') {
    return (
      <AuthLayout maxWidth="md">
        <div className="bg-white rounded-2xl shadow-xl shadow-stone-200/50 border border-stone-200 overflow-hidden">
          <div className="bg-gradient-to-br from-primary-900 to-[#0f1f33] px-6 py-6 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-accent-500 rounded-xl mb-3 shadow-lg">
              <MailCheck className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-xl font-bold text-white lg:text-2xl">Verify your email</h1>
            <p className="text-stone-400 text-sm mt-1">
              Enter the 6-digit code we emailed to{' '}
              <span className="font-medium text-stone-200 break-all">{pendingEmail}</span>
            </p>
          </div>

          <div className="px-6 py-6">
            {otpError && (
              <AlertBanner
                variant="error"
                description={otpError}
                dismissible
                onDismiss={() => setOtpError(null)}
                className="mb-4"
              />
            )}

            <form onSubmit={otpForm.handleSubmit(onVerify)} className="space-y-4">
              <div>
                <label htmlFor="otp-code" className="block text-sm font-medium text-stone-700 mb-1.5">
                  Verification code <span className="text-red-500">*</span>
                </label>
                <input
                  id="otp-code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="000000"
                  autoFocus
                  className="w-full px-4 py-3 text-center text-2xl font-semibold tracking-[0.5em] border border-stone-300 rounded-lg text-stone-900 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  {...otpForm.register('code')}
                />
                {otpForm.formState.errors.code && (
                  <p className="mt-1 text-xs text-red-500">{otpForm.formState.errors.code.message}</p>
                )}
                <p className="mt-1.5 text-xs text-stone-500">
                  The code expires in 10 minutes. Check your spam folder if it doesn&apos;t arrive.
                </p>
              </div>

              <Button
                type="submit"
                className="w-full bg-primary-900 hover:bg-primary-800 text-white py-2.5 rounded-lg font-medium shadow-lg shadow-primary-900/25 hover:shadow-primary-900/40 transition-all"
                isLoading={otpForm.formState.isSubmitting}
              >
                Verify &amp; create account
              </Button>
            </form>

            <div className="mt-5 pt-4 border-t border-stone-200 flex items-center justify-between text-sm">
              <button
                type="button"
                onClick={backToForm}
                className="inline-flex items-center gap-1 text-stone-600 hover:text-stone-900"
              >
                <ArrowLeft className="h-4 w-4" />
                Use a different email
              </button>
              <button
                type="button"
                onClick={onResend}
                disabled={resendIn > 0 || isResending}
                className={cn(
                  'font-semibold',
                  resendIn > 0 || isResending
                    ? 'text-stone-400 cursor-not-allowed'
                    : 'text-primary-700 hover:text-primary-900'
                )}
              >
                {resendIn > 0 ? `Resend code (${resendIn}s)` : isResending ? 'Sending…' : 'Resend code'}
              </button>
            </div>
          </div>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout maxWidth="4xl">
      <div className="bg-white rounded-2xl shadow-xl shadow-stone-200/50 border border-stone-200 overflow-hidden lg:grid lg:grid-cols-5">
        {/* Brand panel — top on mobile, left rail on desktop */}
        <div className="bg-gradient-to-br from-primary-900 to-[#0f1f33] px-6 py-5 text-center lg:col-span-2 lg:px-8 lg:py-10 lg:text-left lg:flex lg:flex-col lg:justify-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-accent-500 rounded-xl mb-3 shadow-lg lg:w-16 lg:h-16 lg:mb-5">
            <UserPlus className="h-6 w-6 text-white lg:h-8 lg:w-8" />
          </div>
          <h1 className="text-xl font-bold text-white lg:text-3xl lg:mb-3">Create Your Account</h1>
          <p className="text-stone-400 text-sm lg:text-base">Join the FYP Supervision System</p>
          <p className="hidden lg:block mt-6 text-xs text-stone-500 leading-relaxed">
            FYP Supervision System &middot; MMU Faculty of Computing &amp; Informatics
          </p>
        </div>

        {/* Form */}
        <div className="px-6 py-5 lg:col-span-3 lg:px-8 lg:py-6">
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
                    ? 'border-dashed border-primary-300 bg-primary-50/40'
                    : 'border-transparent'
                )}
              >
                <label
                  className={cn(
                    'relative flex items-center justify-center gap-2 px-3 py-3 border-2 rounded-lg cursor-pointer transition-all bg-white',
                    selectedRole === 'STUDENT'
                      ? 'border-primary-500 bg-primary-50 text-primary-900 shadow-sm ring-2 ring-primary-200'
                      : 'border-stone-300 hover:border-primary-400 hover:bg-primary-50/50'
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
                    selectedRole === 'STUDENT' ? 'text-primary-700' : 'text-stone-500'
                  )} />
                  <span className="font-medium text-sm">Student</span>
                  {selectedRole === 'STUDENT' && (
                    <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent-500 text-white text-[10px] font-bold">
                      ✓
                    </span>
                  )}
                </label>
                <label
                  className={cn(
                    'relative flex items-center justify-center gap-2 px-3 py-3 border-2 rounded-lg cursor-pointer transition-all bg-white',
                    selectedRole === 'SUPERVISOR'
                      ? 'border-primary-500 bg-primary-50 text-primary-900 shadow-sm ring-2 ring-primary-200'
                      : 'border-stone-300 hover:border-primary-400 hover:bg-primary-50/50'
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
                    selectedRole === 'SUPERVISOR' ? 'text-primary-700' : 'text-stone-500'
                  )} />
                  <span className="font-medium text-sm">Supervisor</span>
                  {selectedRole === 'SUPERVISOR' && (
                    <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent-500 text-white text-[10px] font-bold">
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
                    className="w-full pl-9 pr-3 py-2.5 text-sm border border-stone-300 rounded-lg text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
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
                    placeholder="1201234567 or 123AB4567C"
                    className="w-full pl-9 pr-3 py-2.5 text-sm border border-stone-300 rounded-lg text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
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
                    placeholder={
                      selectedRole === 'STUDENT'
                        ? 'name@student.mmu.edu.my'
                        : selectedRole === 'SUPERVISOR'
                          ? 'name@mmu.edu.my'
                          : 'name@mmu.edu.my'
                    }
                    className="w-full pl-9 pr-3 py-2.5 text-sm border border-stone-300 rounded-lg text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    {...register('email')}
                  />
                </div>
                {errors.email ? (
                  <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
                ) : selectedRole ? (
                  <p className="mt-1 text-xs text-stone-500">
                    {selectedRole === 'STUDENT'
                      ? 'Use your @student.mmu.edu.my address.'
                      : 'Use your @mmu.edu.my staff address.'}
                  </p>
                ) : null}
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
                    className="w-full pl-9 pr-3 py-2.5 text-sm border border-stone-300 rounded-lg text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    {...register('phone')}
                  />
                </div>
                {errors.phone && (
                  <p className="mt-1 text-xs text-red-500">{errors.phone.message}</p>
                )}
              </div>
            </div>

            {/* Student academic info - only when STUDENT role selected */}
            {selectedRole === 'STUDENT' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1.5">
                    Specialisation <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <BookOpen className="h-4 w-4 text-stone-400" />
                    </div>
                    <select
                      className="w-full pl-9 pr-3 py-2.5 text-sm border border-stone-300 rounded-lg text-stone-900 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                      defaultValue=""
                      {...register('specialisation')}
                    >
                      <option value="" disabled>
                        Select specialisation
                      </option>
                      {STUDENT_SPECIALISATIONS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                  {errors.specialisation && (
                    <p className="mt-1 text-xs text-red-500">{errors.specialisation.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1.5">
                    Intake Year <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Calendar className="h-4 w-4 text-stone-400" />
                    </div>
                    <input
                      type="number"
                      inputMode="numeric"
                      min={INTAKE_YEAR_MIN}
                      max={INTAKE_YEAR_MAX}
                      placeholder={`e.g. ${INTAKE_YEAR_MAX}`}
                      className="w-full pl-9 pr-3 py-2.5 text-sm border border-stone-300 rounded-lg text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                      {...register('intakeYear')}
                    />
                  </div>
                  {errors.intakeYear && (
                    <p className="mt-1 text-xs text-red-500">{errors.intakeYear.message}</p>
                  )}
                </div>
              </div>
            )}

            {/* Auto-derived programme / faculty / expected graduation */}
            {selectedRole === 'STUDENT' && (derivedProgramme || derivedGraduationYear) && (
              <div className="rounded-lg border border-primary-100 bg-primary-50/60 px-3 py-2.5 text-xs text-stone-700">
                <p className="text-[11px] font-medium uppercase tracking-wide text-primary-700">
                  We&apos;ll set these for you
                </p>
                <ul className="mt-1 space-y-0.5">
                  {derivedProgramme && (
                    <li>
                      <span className="text-stone-500">Programme:</span>{' '}
                      <span className="font-medium">{derivedProgramme.programme}</span>
                    </li>
                  )}
                  {derivedProgramme && (
                    <li>
                      <span className="text-stone-500">Faculty:</span>{' '}
                      <span className="font-medium">{derivedProgramme.faculty}</span>
                    </li>
                  )}
                  {derivedGraduationYear && (
                    <li>
                      <span className="text-stone-500">Expected graduation:</span>{' '}
                      <span className="font-medium">{derivedGraduationYear}</span>
                    </li>
                  )}
                </ul>
              </div>
            )}

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
                    className="w-full pl-9 pr-3 py-2.5 text-sm border border-stone-300 rounded-lg text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
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
                    className="w-full pl-9 pr-3 py-2.5 text-sm border border-stone-300 rounded-lg text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
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
                  className="mt-0.5 h-4 w-4 rounded border-stone-300 text-primary-700 focus:ring-primary-500"
                  {...register('acceptTerms')}
                />
                <label htmlFor="acceptTerms" className="text-sm text-stone-600">
                  I agree to the{' '}
                  <a
                    href="/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-primary-700 hover:text-primary-900 underline"
                  >
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a
                    href="/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-primary-700 hover:text-primary-900 underline"
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
              className="w-full bg-primary-900 hover:bg-primary-800 text-white py-2.5 rounded-lg font-medium shadow-lg shadow-primary-900/25 hover:shadow-primary-900/40 transition-all"
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
                className="font-semibold text-primary-700 hover:text-primary-900"
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
