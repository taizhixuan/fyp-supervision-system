import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  ArrowLeft,
  UserPlus,
  Mail,
  User,
  Shield,
  Building,
  Key,
  Send,
  CheckCircle,
  Hash,
  Phone,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import { useSuccessToast, useErrorToast } from '@/components/ui/Toast'
import { useCreateUser } from '@/lib/hooks/useAdmin'
import { ROUTES } from '@/lib/constants/routes'
import { cn } from '@/lib/utils/cn'
import type { UserRole } from '@/types'

const createUserSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  mmuId: z
    .string()
    .transform((v) => v.trim().toUpperCase())
    .pipe(
      z
        .string()
        .regex(
          /^(\d{10}|\d{3}[A-Z]{2}\d{4}[A-Z])$/,
          'MMU ID must be 10 digits or in MMU format (e.g. 123AB4567C)',
        ),
    )
    .optional()
    .or(z.literal('')),
  phone: z.string().optional(),
  role: z.enum(['STUDENT', 'SUPERVISOR', 'FYP_COMMITTEE', 'SYSTEM_ADMIN'] as const),
  department: z.string().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters').optional(),
  sendInviteEmail: z.boolean(),
})

type CreateUserFormData = z.infer<typeof createUserSchema>

const roleOptions: { value: UserRole; label: string; description: string }[] = [
  {
    value: 'STUDENT',
    label: 'Student',
    description: 'FYP students who submit proposals and track progress',
  },
  {
    value: 'SUPERVISOR',
    label: 'Supervisor',
    description: 'Academic staff who supervise student projects',
  },
  {
    value: 'FYP_COMMITTEE',
    label: 'FYP Committee',
    description: 'Faculty coordinators who manage the FYP program',
  },
  {
    value: 'SYSTEM_ADMIN',
    label: 'System Admin',
    description: 'IT staff with full system access',
  },
]

const departmentOptions = [
  'Faculty of Computing',
  'Faculty of Engineering',
  'Faculty of Business',
  'Faculty of Applied Sciences',
  'Faculty of Creative Multimedia',
]

export function CreateUser() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const createMutation = useCreateUser()
  const successToast = useSuccessToast()
  const errorToast = useErrorToast()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      role: 'STUDENT',
      sendInviteEmail: true,
    },
  })

  const selectedRole = watch('role')
  const sendInviteEmail = watch('sendInviteEmail')

  const onSubmit = async (data: CreateUserFormData) => {
    try {
      await createMutation.mutateAsync({
        email: data.email,
        fullName: data.fullName,
        mmuId: data.mmuId || undefined,
        phone: data.phone || undefined,
        role: data.role,
        department: data.department,
        password: data.sendInviteEmail ? undefined : data.password,
        sendInviteEmail: data.sendInviteEmail,
      })
      successToast(
        'User Created',
        data.sendInviteEmail
          ? `Invitation email sent to ${data.email}`
          : `Account created for ${data.fullName}`
      )
      navigate(ROUTES.ADMIN.USERS)
    } catch (error) {
      errorToast(
        'Failed to Create User',
        error instanceof Error ? error.message : 'An unexpected error occurred'
      )
    }
  }

  return (
    <div className="space-y-3 lg:space-y-4 lg:max-w-5xl lg:mx-auto">
      {/* Back */}
      <Link to={ROUTES.ADMIN.USERS} className="inline-flex items-center gap-1 text-xs text-neutral-600 hover:text-amber-700">
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Users
      </Link>

      {/* Compact hero */}
      <div className="relative bg-gradient-to-br from-stone-800 via-stone-800 to-stone-900 rounded-xl p-3 sm:p-4 text-white shadow-md overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="relative flex items-center gap-3 min-w-0">
          <div className="flex-shrink-0 w-9 h-9 bg-amber-500/20 rounded-lg flex items-center justify-center ring-1 ring-amber-500/30">
            <UserPlus className="h-5 w-5 text-amber-400" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-bold text-white leading-tight">Create User Account</h1>
            <p className="text-stone-300 text-xs">Create a new user account for the FYP system</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="lg:grid lg:grid-cols-12 lg:gap-3 lg:items-start space-y-3 lg:space-y-0">
        {/* Left column: form fields */}
        <div className="lg:col-span-7 space-y-3">
        {/* Basic Information */}
        <Card padding="sm">
          <h3 className="font-semibold text-sm text-neutral-900 mb-2 flex items-center gap-1.5">
            <User className="h-4 w-4 text-amber-600" />
            Basic Information
          </h3>

          <div className="space-y-2">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Full Name *
              </label>
              <Input
                {...register('fullName')}
                placeholder="e.g., Ahmad bin Abdullah"
                error={errors.fullName?.message}
              />
            </div>

            {/* MMU ID */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                MMU ID
              </label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <Input
                  {...register('mmuId')}
                  placeholder="e.g., 1201234567"
                  className="pl-9"
                  error={errors.mmuId?.message}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <Input
                  {...register('email')}
                  type="email"
                  placeholder="e.g., user@mmu.edu.my"
                  className="pl-9"
                  error={errors.email?.message}
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <Input
                  {...register('phone')}
                  type="tel"
                  placeholder="e.g., +60123456789"
                  className="pl-9"
                  error={errors.phone?.message}
                />
              </div>
            </div>

            {/* Department */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Department
              </label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <select
                  {...register('department')}
                  className="w-full pl-9 pr-3 py-2 border border-neutral-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select department (optional)</option>
                  {departmentOptions.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </Card>

        {/* Role Selection */}
        <Card padding="sm">
          <h3 className="font-semibold text-sm text-neutral-900 mb-2 flex items-center gap-1.5">
            <Shield className="h-4 w-4 text-amber-600" />
            User Role *
          </h3>

          <div className="space-y-1.5">
            {roleOptions.map((option) => (
              <label
                key={option.value}
                className={cn(
                  'flex items-start gap-2 p-2 rounded-md border cursor-pointer transition-colors',
                  selectedRole === option.value
                    ? 'border-amber-500 bg-amber-50'
                    : 'border-neutral-200 hover:bg-neutral-50'
                )}
              >
                <input
                  type="radio"
                  {...register('role')}
                  value={option.value}
                  className="mt-0.5"
                />
                <div>
                  <span className="text-sm font-medium text-neutral-900">{option.label}</span>
                  <p className="text-[11px] text-neutral-500">{option.description}</p>
                </div>
              </label>
            ))}
          </div>
        </Card>

        {/* Account Setup */}
        <Card padding="sm">
          <h3 className="font-semibold text-sm text-neutral-900 mb-2 flex items-center gap-1.5">
            <Key className="h-4 w-4 text-amber-600" />
            Account Setup
          </h3>

          <div className="space-y-2">
            {/* Send Invite Email Toggle */}
            <label className="flex items-start gap-2 p-2 rounded-md border border-neutral-200 cursor-pointer hover:bg-neutral-50">
              <input
                type="checkbox"
                {...register('sendInviteEmail')}
                className="mt-0.5"
              />
              <div>
                <span className="text-sm font-medium text-neutral-900 flex items-center gap-1.5">
                  <Send className="h-3.5 w-3.5" />
                  Send Invitation Email
                </span>
                <p className="text-[11px] text-neutral-500">
                  User will receive an email with a link to set their password
                </p>
              </div>
            </label>

            {/* Manual Password (if not sending invite) */}
            {!sendInviteEmail && (
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Initial Password *
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                  <Input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter initial password"
                    className="pl-9"
                    error={errors.password?.message}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                <p className="text-xs text-neutral-500 mt-1">
                  Minimum 8 characters. User should change this after first login.
                </p>
              </div>
            )}
          </div>
        </Card>
        </div>

        {/* Right column: sticky live summary + actions */}
        <aside className="lg:col-span-5">
          <div className="lg:sticky lg:top-6 space-y-3">
            {/* Summary preview */}
            <Card padding="sm" className="bg-neutral-50">
              <h4 className="font-semibold text-sm text-neutral-900 mb-0.5 flex items-center gap-1.5">
                <UserPlus className="h-4 w-4 text-amber-600" />
                Account Summary
              </h4>
              <p className="text-[11px] text-neutral-500 mb-2">
                Updates as you fill in the form on the left.
              </p>

              <dl className="space-y-1.5 text-xs">
                <div className="flex justify-between gap-3">
                  <dt className="text-neutral-500 flex-shrink-0">Name</dt>
                  <dd className="font-medium text-neutral-900 text-right truncate">
                    {watch('fullName') || <span className="text-neutral-400 italic font-normal">Not provided</span>}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-neutral-500 flex-shrink-0">Email</dt>
                  <dd className="font-medium text-neutral-900 text-right truncate">
                    {watch('email') || <span className="text-neutral-400 italic font-normal">Not provided</span>}
                  </dd>
                </div>
                {watch('mmuId') && (
                  <div className="flex justify-between gap-3">
                    <dt className="text-neutral-500 flex-shrink-0">MMU ID</dt>
                    <dd className="font-medium text-neutral-900 text-right truncate">{watch('mmuId')}</dd>
                  </div>
                )}
                {watch('phone') && (
                  <div className="flex justify-between gap-3">
                    <dt className="text-neutral-500 flex-shrink-0">Phone</dt>
                    <dd className="font-medium text-neutral-900 text-right truncate">{watch('phone')}</dd>
                  </div>
                )}
                {watch('department') && (
                  <div className="flex justify-between gap-3">
                    <dt className="text-neutral-500 flex-shrink-0">Department</dt>
                    <dd className="font-medium text-neutral-900 text-right truncate">{watch('department')}</dd>
                  </div>
                )}
              </dl>

              <div className="mt-2 pt-2 border-t border-neutral-200">
                <p className="text-[10px] uppercase tracking-wide text-neutral-500 mb-0.5">Role</p>
                <p className="text-sm font-semibold text-neutral-900">
                  {roleOptions.find((r) => r.value === selectedRole)?.label}
                </p>
                <p className="text-[11px] text-neutral-500">
                  {roleOptions.find((r) => r.value === selectedRole)?.description}
                </p>
              </div>

              <div className="mt-2 pt-2 border-t border-neutral-200 flex items-start gap-1.5">
                {sendInviteEmail ? (
                  <Send className="h-3.5 w-3.5 text-amber-600 mt-0.5 flex-shrink-0" />
                ) : (
                  <Key className="h-3.5 w-3.5 text-amber-600 mt-0.5 flex-shrink-0" />
                )}
                <div className="text-[11px] text-neutral-600">
                  {sendInviteEmail
                    ? 'An invitation email will be sent so the user can set their own password.'
                    : 'You\'ll set an initial password — share it with the user securely.'}
                </div>
              </div>
            </Card>

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <Link to={ROUTES.ADMIN.USERS}>
                <Button variant="secondary" type="button" size="sm">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" size="sm" disabled={createMutation.isPending}>
                {createMutation.isPending ? (
                  <Spinner size="sm" className="mr-1" />
                ) : (
                  <CheckCircle className="h-3.5 w-3.5 mr-1" />
                )}
                Create User
              </Button>
            </div>
          </div>
        </aside>
      </form>
    </div>
  )
}
