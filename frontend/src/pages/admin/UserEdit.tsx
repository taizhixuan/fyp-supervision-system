import { useNavigate, useParams, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Save, User, Mail, Phone, Pencil } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import { useSuccessToast, useErrorToast } from '@/components/ui/Toast'
import { useAdminUser, useUpdateUser } from '@/lib/hooks/useAdmin'
import { ROUTES } from '@/lib/constants/routes'
import type { UserDetail as AdminUserDetail } from '@/types'

const editUserSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().optional(),
})

type EditUserFormData = z.infer<typeof editUserSchema>

export function UserEdit() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data, isLoading } = useAdminUser(id!)
  const user: AdminUserDetail | undefined = data
  const updateMutation = useUpdateUser()
  const successToast = useSuccessToast()
  const errorToast = useErrorToast()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EditUserFormData>({
    resolver: zodResolver(editUserSchema),
    // `values` reactively resets the form once the user loads from the API.
    values: user
      ? { fullName: user.fullName ?? '', email: user.email ?? '', phone: user.phone ?? '' }
      : undefined,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-neutral-900">User not found</h2>
        <p className="text-neutral-600 mt-2">The user you're trying to edit doesn't exist.</p>
        <Link to={ROUTES.ADMIN.USERS}>
          <Button className="mt-4">Back to Users</Button>
        </Link>
      </div>
    )
  }

  const detailPath = ROUTES.ADMIN.USER_DETAIL.replace(':id', user.userId)

  const onSubmit = async (form: EditUserFormData) => {
    try {
      await updateMutation.mutateAsync({
        userId: user.userId,
        data: {
          fullName: form.fullName,
          email: form.email,
          phone: form.phone?.trim() || undefined,
        },
      })
      successToast('User Updated', `${form.fullName}'s details have been saved.`)
      navigate(detailPath)
    } catch (error) {
      errorToast(
        'Update Failed',
        error instanceof Error ? error.message : 'Could not save the changes.'
      )
    }
  }

  return (
    <div className="space-y-3 lg:space-y-4 max-w-2xl mx-auto">
      {/* Back */}
      <Link to={detailPath} className="inline-flex items-center gap-1 text-xs text-neutral-600 hover:text-amber-700">
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Profile
      </Link>

      {/* Compact hero */}
      <div className="relative bg-gradient-to-br from-stone-800 via-stone-800 to-stone-900 rounded-xl p-3 sm:p-4 text-white shadow-md overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="relative flex items-center gap-3 min-w-0">
          <div className="flex-shrink-0 w-9 h-9 bg-amber-500/20 rounded-lg flex items-center justify-center ring-1 ring-amber-500/30">
            <Pencil className="h-5 w-5 text-amber-400" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-bold text-white leading-tight truncate">Edit {user.fullName}</h1>
            <p className="text-stone-300 text-xs">Update the user's contact details</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <Card padding="sm">
          <h3 className="font-semibold text-sm text-neutral-900 mb-2 flex items-center gap-1.5">
            <User className="h-4 w-4 text-amber-600" />
            Account Details
          </h3>

          <div className="space-y-2">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Full Name *</label>
              <Input
                {...register('fullName')}
                placeholder="e.g., Ahmad bin Abdullah"
                error={errors.fullName?.message}
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Email Address *</label>
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
              <label className="block text-sm font-medium text-neutral-700 mb-1">Phone Number</label>
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
          </div>

          <p className="text-[11px] text-neutral-500 mt-2">
            Role and account status are changed from the profile page (Suspend / Delete actions).
          </p>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <Link to={detailPath}>
            <Button variant="secondary" type="button" size="sm">
              Cancel
            </Button>
          </Link>
          <Button type="submit" size="sm" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? (
              <Spinner size="sm" className="mr-1" />
            ) : (
              <Save className="h-3.5 w-3.5 mr-1" />
            )}
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  )
}
