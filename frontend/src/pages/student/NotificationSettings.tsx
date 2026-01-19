import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  Bell,
  Mail,
  Smartphone,
  Monitor,
  Calendar,
  FileText,
  MessageSquare,
  Users,
  AlertCircle,
  Save,
  CheckCircle,
} from 'lucide-react'
import { Card, Button, Spinner } from '@/components/ui'
import { useNotificationPreferences, useUpdateNotificationPreferences } from '@/lib/hooks/useStudent'
import { ROUTES } from '@/lib/constants/routes'
import { cn } from '@/lib/utils/cn'
import type { NotificationPreferences } from '@/types'

// Sample data
const SAMPLE_PREFERENCES: NotificationPreferences = {
  email: {
    enabled: true,
    meetingReminders: true,
    deadlineReminders: true,
    proposalUpdates: true,
    supervisorMessages: true,
    systemAnnouncements: true,
    weeklyDigest: false,
  },
  push: {
    enabled: true,
    meetingReminders: true,
    deadlineReminders: true,
    proposalUpdates: true,
    supervisorMessages: true,
    systemAnnouncements: false,
  },
  inApp: {
    enabled: true,
    meetingReminders: true,
    deadlineReminders: true,
    proposalUpdates: true,
    supervisorMessages: true,
    systemAnnouncements: true,
  },
  quiet: {
    enabled: false,
    startTime: '22:00',
    endTime: '08:00',
  },
}

const notificationCategories = [
  {
    id: 'meetingReminders',
    label: 'Meeting Reminders',
    description: 'Notifications about upcoming meetings and changes',
    icon: Calendar,
  },
  {
    id: 'deadlineReminders',
    label: 'Deadline Reminders',
    description: 'Reminders for upcoming submission deadlines',
    icon: AlertCircle,
  },
  {
    id: 'proposalUpdates',
    label: 'Proposal Updates',
    description: 'Updates on your proposal status and feedback',
    icon: FileText,
  },
  {
    id: 'supervisorMessages',
    label: 'Supervisor Messages',
    description: 'Messages and feedback from your supervisor',
    icon: MessageSquare,
  },
  {
    id: 'systemAnnouncements',
    label: 'System Announcements',
    description: 'Important system updates and announcements',
    icon: Monitor,
  },
]

export function NotificationSettings() {
  const { data, isLoading } = useNotificationPreferences()
  const updatePreferences = useUpdateNotificationPreferences()

  const [preferences, setPreferences] = useState<NotificationPreferences>(SAMPLE_PREFERENCES)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Use sample data
  const displayPrefs = data || preferences

  const handleToggle = (
    channel: 'email' | 'push' | 'inApp',
    setting: string,
    value: boolean
  ) => {
    setPreferences((prev) => ({
      ...prev,
      [channel]: {
        ...prev[channel],
        [setting]: value,
      },
    }))
  }

  const handleQuietToggle = (setting: string, value: any) => {
    setPreferences((prev) => ({
      ...prev,
      quiet: {
        ...prev.quiet,
        [setting]: value,
      },
    }))
  }

  const handleSave = async () => {
    try {
      await updatePreferences.mutateAsync(preferences)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err) {
      // Error handled by mutation
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" label="Loading settings..." />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back Button */}
      <Link
        to={ROUTES.STUDENT.NOTIFICATIONS}
        className="inline-flex items-center gap-2 text-neutral-600 hover:text-primary-600 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Notifications
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Notification Settings</h1>
        <p className="text-neutral-600 mt-1">Manage how and when you receive notifications</p>
      </div>

      {/* Channel Settings */}
      <div className="space-y-4">
        {/* Email Notifications */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                <Mail className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <h2 className="font-semibold text-neutral-900">Email Notifications</h2>
                <p className="text-sm text-neutral-500">Receive notifications via email</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.email.enabled}
                onChange={(e) => handleToggle('email', 'enabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>

          {preferences.email.enabled && (
            <div className="space-y-3 pl-13 border-t border-neutral-100 pt-4">
              {notificationCategories.map((category) => (
                <SettingRow
                  key={category.id}
                  label={category.label}
                  description={category.description}
                  icon={category.icon}
                  checked={preferences.email[category.id as keyof typeof preferences.email] as boolean}
                  onChange={(value) => handleToggle('email', category.id, value)}
                />
              ))}
              <SettingRow
                label="Weekly Digest"
                description="Receive a weekly summary of your FYP progress"
                icon={Calendar}
                checked={preferences.email.weeklyDigest}
                onChange={(value) => handleToggle('email', 'weeklyDigest', value)}
              />
            </div>
          )}
        </Card>

        {/* Push Notifications */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-success-100 flex items-center justify-center">
                <Smartphone className="h-5 w-5 text-success-600" />
              </div>
              <div>
                <h2 className="font-semibold text-neutral-900">Push Notifications</h2>
                <p className="text-sm text-neutral-500">Receive push notifications on your device</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.push.enabled}
                onChange={(e) => handleToggle('push', 'enabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>

          {preferences.push.enabled && (
            <div className="space-y-3 pl-13 border-t border-neutral-100 pt-4">
              {notificationCategories.map((category) => (
                <SettingRow
                  key={category.id}
                  label={category.label}
                  description={category.description}
                  icon={category.icon}
                  checked={preferences.push[category.id as keyof typeof preferences.push] as boolean}
                  onChange={(value) => handleToggle('push', category.id, value)}
                />
              ))}
            </div>
          )}
        </Card>

        {/* In-App Notifications */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-warning-100 flex items-center justify-center">
                <Monitor className="h-5 w-5 text-warning-600" />
              </div>
              <div>
                <h2 className="font-semibold text-neutral-900">In-App Notifications</h2>
                <p className="text-sm text-neutral-500">Notifications within the application</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.inApp.enabled}
                onChange={(e) => handleToggle('inApp', 'enabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>

          {preferences.inApp.enabled && (
            <div className="space-y-3 pl-13 border-t border-neutral-100 pt-4">
              {notificationCategories.map((category) => (
                <SettingRow
                  key={category.id}
                  label={category.label}
                  description={category.description}
                  icon={category.icon}
                  checked={preferences.inApp[category.id as keyof typeof preferences.inApp] as boolean}
                  onChange={(value) => handleToggle('inApp', category.id, value)}
                />
              ))}
            </div>
          )}
        </Card>

        {/* Quiet Hours */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center">
                <Bell className="h-5 w-5 text-neutral-600" />
              </div>
              <div>
                <h2 className="font-semibold text-neutral-900">Quiet Hours</h2>
                <p className="text-sm text-neutral-500">Pause notifications during specific hours</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.quiet.enabled}
                onChange={(e) => handleQuietToggle('enabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>

          {preferences.quiet.enabled && (
            <div className="border-t border-neutral-100 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={preferences.quiet.startTime}
                    onChange={(e) => handleQuietToggle('startTime', e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={preferences.quiet.endTime}
                    onChange={(e) => handleQuietToggle('endTime', e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
              <p className="text-xs text-neutral-500 mt-2">
                Push and in-app notifications will be muted during quiet hours
              </p>
            </div>
          )}
        </Card>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-between pt-4 border-t border-neutral-200">
        <div className="flex items-center gap-2">
          {saveSuccess && (
            <>
              <CheckCircle className="h-5 w-5 text-success-600" />
              <span className="text-sm text-success-600 font-medium">Settings saved!</span>
            </>
          )}
        </div>
        <Button
          variant="primary"
          leftIcon={<Save className="h-4 w-4" />}
          onClick={handleSave}
          isLoading={updatePreferences.isPending}
        >
          Save Settings
        </Button>
      </div>
    </div>
  )
}

function SettingRow({
  label,
  description,
  icon: Icon,
  checked,
  onChange,
}: {
  label: string
  description: string
  icon: typeof Bell
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-3">
        <Icon className="h-4 w-4 text-neutral-400" />
        <div>
          <p className="text-sm font-medium text-neutral-900">{label}</p>
          <p className="text-xs text-neutral-500">{description}</p>
        </div>
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
        />
        <div className="w-9 h-5 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-600"></div>
      </label>
    </div>
  )
}
