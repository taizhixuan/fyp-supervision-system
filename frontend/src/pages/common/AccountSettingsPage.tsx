import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { User, Shield, Key, Palette, Sun, Moon, Monitor, ShieldCheck, Download, ExternalLink } from 'lucide-react'
import { Card, Button, Input, AlertBanner } from '@/components/ui'
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
import { useExportPersonalData } from '@/lib/hooks/useStudent'
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
