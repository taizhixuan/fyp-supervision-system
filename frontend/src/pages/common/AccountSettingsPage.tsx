import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { User, Shield, Key, Palette, Sun, Moon, Monitor, ShieldCheck, Download, ExternalLink, AlertTriangle, Trash2, Clock, CheckCircle, XCircle } from 'lucide-react'
import { Card, Button, Input, AlertBanner, Modal, ModalHeader, ModalTitle, ModalBody, ModalFooter, Badge } from '@/components/ui'
import { useAuth } from '@/lib/auth/useAuth'
import { authApi } from '@/lib/api/auth'
import { getApiErrorMessage } from '@/lib/api/client'
import {
  updateProfileSchema,
  changePasswordSchema,
  type UpdateProfileFormData,
  type ChangePasswordFormData,
} from '@/lib/validators/auth'
import { useSuccessToast } from '@/components/ui/Toast'
import { useTheme, type ThemePreference } from '@/lib/theme/ThemeProvider'
import {
  useExportPersonalData,
  useMyDeletionRequest,
  useRequestAccountDeletion,
  useChatPreferences,
  useUpdateChatPreferences,
  type DeletionRequest,
} from '@/lib/hooks/useStudent'
import { PRIVACY_NOTICE_VERSION } from '@/types/auth'
import { cn } from '@/lib/utils/cn'

type Tab = 'profile' | 'security' | 'privacy' | 'appearance'

export function AccountSettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('profile')

  const tabs = [
    { id: 'profile' as const, label: 'Profile', icon: User },
    { id: 'security' as const, label: 'Security', icon: Shield },
    { id: 'privacy' as const, label: 'Privacy', icon: ShieldCheck },
    { id: 'appearance' as const, label: 'Appearance', icon: Palette },
  ]

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-neutral-900 mb-6">Account Settings</h1>

      {/* Tab navigation */}
      <div className="flex gap-1 border-b border-neutral-200 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors',
              activeTab === tab.id
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-neutral-600 hover:text-neutral-900 hover:border-neutral-300'
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'profile' && <ProfileTab />}
      {activeTab === 'security' && <SecurityTab />}
      {activeTab === 'privacy' && <PrivacyTab />}
      {activeTab === 'appearance' && <AppearanceTab />}
    </div>
  )
}

function PrivacyTab() {
  const { user } = useAuth()
  const exportData = useExportPersonalData()
  const showSuccessToast = useSuccessToast()
  const [error, setError] = useState<string | null>(null)
  const isStudent = user?.role === 'STUDENT'

  const handleExport = async () => {
    setError(null)
    try {
      await exportData.mutateAsync()
      showSuccessToast('Download started', 'Your personal data file is being downloaded.')
    } catch (err) {
      setError(getApiErrorMessage(err))
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className="h-5 w-5 text-neutral-400" />
          <h2 className="text-lg font-semibold text-neutral-900">Privacy Notice</h2>
        </div>
        <p className="text-sm text-neutral-500 mb-4">
          You agreed to version <span className="font-medium text-neutral-700">{PRIVACY_NOTICE_VERSION}</span> of
          the Privacy Notice when you registered. We&apos;ll reprompt for consent if the notice changes materially.
        </p>
        <Link
          to="/privacy"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700"
        >
          Read the full Privacy Notice
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </Card>

      <Card>
        <div className="flex items-center gap-2 mb-1">
          <Download className="h-5 w-5 text-neutral-400" />
          <h2 className="text-lg font-semibold text-neutral-900">Download my data</h2>
        </div>
        <p className="text-sm text-neutral-500 mb-4">
          Get a JSON file with everything we hold about you — profile, project, proposal, meetings, meeting logs,
          documents (metadata only), supervision requests, chatbot history, and notifications. This is the PDPA
          right of access.
        </p>

        {error && (
          <AlertBanner
            variant="error"
            description={error}
            dismissible
            onDismiss={() => setError(null)}
            className="mb-4"
          />
        )}

        {isStudent ? (
          <Button
            type="button"
            onClick={handleExport}
            isLoading={exportData.isPending}
          >
            <Download className="h-4 w-4 mr-2" />
            Download my data (JSON)
          </Button>
        ) : (
          <p className="text-xs text-neutral-500 italic">
            Data export is available for student accounts. Other roles can request a copy through the system
            administrator.
          </p>
        )}
      </Card>

      {isStudent && <AiConsentCard />}
      {isStudent && <DeletionRequestCard />}
    </div>
  )
}

function AiConsentCard() {
  const prefs = useChatPreferences()
  const update = useUpdateChatPreferences()
  const showSuccessToast = useSuccessToast()
  const [error, setError] = useState<string | null>(null)

  const consent = prefs.data?.aiProcessingConsented
  const consentDecidedAt = prefs.data?.aiConsentDecidedAt

  const setConsent = async (granted: boolean) => {
    if (!prefs.data) return
    setError(null)
    try {
      await update.mutateAsync({
        responseLength: prefs.data.responseLength,
        tone: prefs.data.tone,
        language: prefs.data.language,
        aiProcessingConsented: granted,
      })
      showSuccessToast(
        granted ? 'AI processing enabled' : 'AI processing disabled',
        granted
          ? 'You can now use the FYP Assistant.'
          : 'The FYP Assistant is blocked until you re-enable consent.'
      )
    } catch (err) {
      setError(getApiErrorMessage(err))
    }
  }

  return (
    <Card>
      <div className="flex items-center gap-2 mb-1">
        <ShieldCheck className="h-5 w-5 text-neutral-400" />
        <h2 className="text-lg font-semibold text-neutral-900">AI processing consent</h2>
      </div>
      <p className="text-sm text-neutral-500 mb-4">
        The FYP Assistant sends your chat messages and supporting context to a third-party large language model
        provider (Groq or OpenAI) hosted outside Malaysia. You can revoke consent at any time — once revoked, the
        chatbot is blocked until you re-enable it here.
      </p>

      {error && (
        <AlertBanner
          variant="error"
          description={error}
          dismissible
          onDismiss={() => setError(null)}
          className="mb-4"
        />
      )}

      <div className="flex items-center justify-between rounded-md border border-neutral-200 p-3">
        <div>
          <p className="text-sm font-medium text-neutral-900">
            {consent === true ? 'Consent granted' : consent === false ? 'Consent revoked' : 'Not asked yet'}
          </p>
          {consentDecidedAt && (
            <p className="text-xs text-neutral-500 mt-0.5">
              Last updated {new Date(consentDecidedAt).toLocaleString()}
            </p>
          )}
        </div>
        {consent === true ? (
          <Button
            type="button"
            variant="secondary"
            onClick={() => setConsent(false)}
            isLoading={update.isPending}
          >
            Revoke consent
          </Button>
        ) : (
          <Button
            type="button"
            onClick={() => setConsent(true)}
            isLoading={update.isPending}
          >
            Grant consent
          </Button>
        )}
      </div>
    </Card>
  )
}

function DeletionRequestCard() {
  const { data: existing, isLoading } = useMyDeletionRequest()
  const requestDeletion = useRequestAccountDeletion()
  const showSuccessToast = useSuccessToast()
  const [showModal, setShowModal] = useState(false)
  const [reason, setReason] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const hasActiveRequest = existing && (existing.status === 'PENDING' || existing.status === 'APPROVED')

  const handleSubmit = async () => {
    if (!confirmed) return
    setError(null)
    try {
      await requestDeletion.mutateAsync(reason.trim())
      showSuccessToast('Request submitted', 'An administrator will review your request.')
      setShowModal(false)
      setReason('')
      setConfirmed(false)
    } catch (err) {
      setError(getApiErrorMessage(err))
    }
  }

  return (
    <Card>
      <div className="flex items-center gap-2 mb-1">
        <Trash2 className="h-5 w-5 text-neutral-400" />
        <h2 className="text-lg font-semibold text-neutral-900">Delete my account</h2>
      </div>
      <p className="text-sm text-neutral-500 mb-4">
        Submit a request to delete your account (PDPA right of erasure). An administrator will review the request.
        On approval, your personal details are anonymised and chat history is permanently deleted. Academic
        records (project, proposal, meeting logs, documents) are retained anonymised so supervisor records and
        compliance counts remain intact.
      </p>

      {isLoading ? (
        <p className="text-sm text-neutral-500">Checking request status…</p>
      ) : existing ? (
        <DeletionRequestStatus request={existing} />
      ) : null}

      {!hasActiveRequest && (
        <Button
          type="button"
          variant="danger"
          onClick={() => setShowModal(true)}
          className="mt-4"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          {existing ? 'Submit a new deletion request' : 'Request account deletion'}
        </Button>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        size="lg"
      >
        <ModalHeader>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <ModalTitle>Request account deletion</ModalTitle>
          </div>
        </ModalHeader>
        <ModalBody>
          <div className="rounded-md bg-amber-50 border border-amber-200 p-3 mb-4">
            <p className="text-sm text-amber-900 font-medium">What happens on approval</p>
            <ul className="text-xs text-amber-800 list-disc pl-5 mt-2 space-y-1">
              <li>Your name, email, MMU ID, phone, and profile image are replaced with placeholders</li>
              <li>Your chatbot history, memory, and preferences are permanently deleted</li>
              <li>Your notifications and push subscriptions are deleted</li>
              <li>Your project, proposal, meeting logs, and uploaded documents are kept (academic record)</li>
              <li>You will no longer be able to sign in</li>
            </ul>
          </div>

          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Reason (optional)
          </label>
          <textarea
            className="block w-full rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 border"
            rows={3}
            placeholder="Tell us why you're leaving (optional, helps us improve)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />

          {error && (
            <AlertBanner
              variant="error"
              description={error}
              dismissible
              onDismiss={() => setError(null)}
              className="mt-4"
            />
          )}

          <label className="flex items-start gap-2.5 mt-4 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-neutral-300 text-red-600 focus:ring-red-500"
            />
            <span className="text-sm text-neutral-700">
              I understand that, once an administrator approves this request, I will no longer be able to sign in
              and my chat history will be permanently deleted.
            </span>
          </label>
        </ModalBody>
        <ModalFooter>
          <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={handleSubmit}
            disabled={!confirmed || requestDeletion.isPending}
            isLoading={requestDeletion.isPending}
          >
            Submit request
          </Button>
        </ModalFooter>
      </Modal>
    </Card>
  )
}

function DeletionRequestStatus({ request }: { request: DeletionRequest }) {
  const config: Record<DeletionRequest['status'], { icon: typeof Clock; label: string; variant: 'warning' | 'success' | 'error'; tint: string }> = {
    PENDING:   { icon: Clock,       label: 'Pending admin review', variant: 'warning', tint: 'bg-amber-50 border-amber-200 text-amber-900' },
    APPROVED:  { icon: CheckCircle, label: 'Approved — processing', variant: 'success', tint: 'bg-emerald-50 border-emerald-200 text-emerald-900' },
    COMPLETED: { icon: CheckCircle, label: 'Account deleted',        variant: 'success', tint: 'bg-neutral-50 border-neutral-200 text-neutral-900' },
    REJECTED:  { icon: XCircle,     label: 'Request declined',       variant: 'error',   tint: 'bg-red-50 border-red-200 text-red-900' },
  }
  const cfg = config[request.status]
  const Icon = cfg.icon
  return (
    <div className={cn('rounded-md border p-3 mt-2', cfg.tint)}>
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4" />
        <p className="text-sm font-medium">{cfg.label}</p>
        <Badge variant={cfg.variant} className="ml-auto">{request.status}</Badge>
      </div>
      {request.requestedAt && (
        <p className="text-xs mt-1 opacity-80">Requested {new Date(request.requestedAt).toLocaleString()}</p>
      )}
      {request.decisionNote && (
        <p className="text-xs mt-2"><span className="font-medium">Note:</span> {request.decisionNote}</p>
      )}
    </div>
  )
}

function AppearanceTab() {
  const { theme, setTheme, resolvedTheme } = useTheme()

  const options: Array<{
    value: ThemePreference
    label: string
    description: string
    icon: typeof Sun
  }> = [
    {
      value: 'light',
      label: 'Light',
      description: 'Bright surfaces and dark text — best for daytime use.',
      icon: Sun,
    },
    {
      value: 'dark',
      label: 'Dark',
      description: 'Deep slate surfaces — easier on the eyes at night.',
      icon: Moon,
    },
    {
      value: 'system',
      label: 'System',
      description: 'Match your operating system preference automatically.',
      icon: Monitor,
    },
  ]

  return (
    <Card>
      <div className="flex items-center gap-2 mb-1">
        <Palette className="h-5 w-5 text-neutral-400" />
        <h2 className="text-lg font-semibold text-neutral-900">Appearance</h2>
      </div>
      <p className="text-sm text-neutral-500 mb-6">
        Choose how the FYP Supervision System looks for you.
        {theme === 'system' && (
          <>
            {' '}Currently following system preference (
            <span className="font-medium text-neutral-700">{resolvedTheme}</span>).
          </>
        )}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {options.map((option) => {
          const Icon = option.icon
          const active = theme === option.value
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setTheme(option.value)}
              className={cn(
                'flex flex-col items-start gap-2 p-4 rounded-lg border-2 text-left transition-all',
                active
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50'
              )}
              aria-pressed={active}
            >
              <div
                className={cn(
                  'h-9 w-9 rounded-md flex items-center justify-center',
                  active ? 'bg-primary-100 text-primary-700' : 'bg-neutral-100 text-neutral-600'
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p
                  className={cn(
                    'text-sm font-semibold',
                    active ? 'text-primary-700' : 'text-neutral-900'
                  )}
                >
                  {option.label}
                </p>
                <p className="text-xs text-neutral-500 mt-1">{option.description}</p>
              </div>
            </button>
          )
        })}
      </div>
    </Card>
  )
}

function ProfileTab() {
  const { user, refreshUser } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const showSuccessToast = useSuccessToast()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<UpdateProfileFormData>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      email: user?.email || '',
      phone: user?.phone || '',
    },
  })

  const onSubmit = async (data: UpdateProfileFormData) => {
    setError(null)
    try {
      await authApi.updateProfile(data)
      await refreshUser()
      showSuccessToast('Profile updated', 'Your profile has been updated successfully.')
    } catch (err) {
      setError(getApiErrorMessage(err))
    }
  }

  return (
    <Card>
      <h2 className="text-lg font-semibold text-neutral-900 mb-6">Profile Information</h2>

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
          label="Full Name"
          value={user?.fullName || ''}
          disabled
          helperText="Contact the FYP Committee to change your name"
        />

        <Input
          label="MMU ID"
          value={user?.mmuId || ''}
          disabled
          helperText="MMU ID cannot be changed"
        />

        <Input
          label="Email Address"
          type="email"
          error={errors.email?.message}
          {...register('email')}
        />

        <Input
          label="Phone Number"
          type="tel"
          placeholder="e.g., +60123456789"
          error={errors.phone?.message}
          {...register('phone')}
        />

        <div className="pt-4">
          <Button
            type="submit"
            isLoading={isSubmitting}
            disabled={!isDirty}
          >
            Save Changes
          </Button>
        </div>
      </form>
    </Card>
  )
}

function SecurityTab() {
  const [error, setError] = useState<string | null>(null)
  const showSuccessToast = useSuccessToast()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  })

  const onSubmit = async (data: ChangePasswordFormData) => {
    setError(null)
    try {
      await authApi.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      })
      showSuccessToast('Password updated', 'Your password has been changed successfully.')
      reset()
    } catch (err) {
      setError(getApiErrorMessage(err))
    }
  }

  return (
    <Card>
      <div className="flex items-center gap-2 mb-6">
        <Key className="h-5 w-5 text-neutral-400" />
        <h2 className="text-lg font-semibold text-neutral-900">Change Password</h2>
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
          label="Current Password"
          type="password"
          placeholder="Enter your current password"
          error={errors.currentPassword?.message}
          required
          {...register('currentPassword')}
        />

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

        <div className="pt-4">
          <Button type="submit" isLoading={isSubmitting}>
            Update Password
          </Button>
        </div>
      </form>
    </Card>
  )
}
