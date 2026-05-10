import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  User as UserIcon,
  Mail,
  Phone,
  Camera,
  Edit2,
  Save,
  X,
  Upload,
  ShieldCheck,
  Hash,
  CalendarDays,
} from 'lucide-react'
import {
  Card,
  Button,
  Input,
  Spinner,
  AlertBanner,
  Badge,
  Modal,
  ModalHeader,
  ModalTitle,
  ModalBody,
  ModalFooter,
} from '@/components/ui'
import {
  useUserProfile,
  useUpdateUserProfile,
  useUploadUserProfileImage,
} from '@/lib/hooks/useUserProfile'
import { cn } from '@/lib/utils/cn'
import { assetUrl } from '@/lib/utils/assetUrl'
import { avatarInitials as initialsFromName } from '@/lib/utils/name'

const profileSchema = z.object({
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
})
type ProfileFormData = z.infer<typeof profileSchema>

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const MAX_IMAGE_SIZE = 5 * 1024 * 1024

const ROLE_LABELS: Record<string, string> = {
  STUDENT: 'Student',
  SUPERVISOR: 'Supervisor',
  FYP_COMMITTEE: 'FYP Committee',
  SYSTEM_ADMIN: 'System Administrator',
}

const ROLE_BADGE_VARIANTS: Record<string, 'primary' | 'success' | 'warning' | 'default'> = {
  STUDENT: 'primary',
  SUPERVISOR: 'success',
  FYP_COMMITTEE: 'warning',
  SYSTEM_ADMIN: 'default',
}

interface BasicProfilePageProps {
  /** Page heading; defaults to "My Profile". */
  title?: string
  /** Override the role label shown next to the name. */
  roleLabelOverride?: string
}

function formatDate(value?: string | null) {
  if (!value) return '—'
  const d = new Date(value)
  if (isNaN(d.getTime())) return value
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

export function BasicProfilePage({ title = 'My Profile', roleLabelOverride }: BasicProfilePageProps) {
  const { data: profile, isLoading, error } = useUserProfile()
  const updateProfile = useUpdateUserProfile()
  const uploadImage = useUploadUserProfileImage()

  const [isEditing, setIsEditing] = useState(false)

  // Image upload state
  const [showImageModal, setShowImageModal] = useState(false)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageError, setImageError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: { email: '', phone: '' },
  })

  useEffect(() => {
    if (!profile) return
    reset({ email: profile.email, phone: profile.phone || '' })
  }, [profile, reset])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" label="Loading profile..." />
      </div>
    )
  }
  if (error || !profile) {
    return (
      <AlertBanner
        variant="error"
        title="Failed to load profile"
        description="Please try refreshing the page."
      />
    )
  }

  const onSubmit = async (data: ProfileFormData) => {
    try {
      // Stage-then-commit: image is held in selectedImage until Save is
      // clicked here. Without this, "Use This Picture" in the modal would
      // commit immediately and Cancel wouldn't undo it.
      if (selectedImage) {
        await uploadImage.mutateAsync(selectedImage)
      }
      await updateProfile.mutateAsync(data)
      setSelectedImage(null)
      setImagePreview(null)
      setIsEditing(false)
    } catch {
      // Error surface comes from updateProfile.isError below
    }
  }

  const handleCancel = () => {
    reset({ email: profile.email, phone: profile.phone || '' })
    setSelectedImage(null)
    setImagePreview(null)
    setImageError(null)
    setIsEditing(false)
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    setImageError(null)
    if (!file) return
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setImageError('Please select a JPEG, PNG, GIF, or WebP image')
      return
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setImageError('Image size must be less than 5MB')
      return
    }
    setSelectedImage(file)
    const reader = new FileReader()
    reader.onload = () => setImagePreview(reader.result as string)
    reader.readAsDataURL(file)
    setShowImageModal(true)
  }

  // Stage the file. Actual upload runs in onSubmit so the avatar only
  // changes when the user clicks Save (and Cancel can roll it back).
  const handleImageUpload = () => {
    if (!selectedImage) return
    setShowImageModal(false)
  }

  const handleCancelImage = () => {
    setShowImageModal(false)
    setSelectedImage(null)
    setImagePreview(null)
    setImageError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const profileImageUrl = assetUrl(profile.profileImagePath)
  const roleLabel = roleLabelOverride ?? ROLE_LABELS[profile.role] ?? profile.role
  const roleBadgeVariant = ROLE_BADGE_VARIANTS[profile.role] ?? 'default'

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-900">{title}</h1>
        {!isEditing ? (
          <Button
            variant="secondary"
            leftIcon={<Edit2 className="h-4 w-4" />}
            onClick={() => setIsEditing(true)}
          >
            Edit Profile
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="ghost" leftIcon={<X className="h-4 w-4" />} onClick={handleCancel}>
              Cancel
            </Button>
            <Button
              variant="primary"
              leftIcon={<Save className="h-4 w-4" />}
              onClick={handleSubmit(onSubmit)}
              isLoading={updateProfile.isPending}
              disabled={!isDirty}
            >
              Save Changes
            </Button>
          </div>
        )}
      </div>

      {updateProfile.isError && (
        <AlertBanner variant="error" title="Failed to update profile" description="Please try again." dismissible autoDismissMs={5000} onDismiss={() => updateProfile.reset()} />
      )}
      {updateProfile.isSuccess && (
        <AlertBanner variant="success" title="Profile updated" description="Your profile has been saved." dismissible autoDismissMs={5000} onDismiss={() => updateProfile.reset()} />
      )}

      {/* Profile Header Card */}
      <Card>
        <div className="flex flex-col sm:flex-row items-start gap-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-primary-100 flex items-center justify-center overflow-hidden">
              {isEditing && imagePreview ? (
                <img src={imagePreview} alt="Pending profile picture" className="w-24 h-24 rounded-full object-cover" />
              ) : profileImageUrl ? (
                <img src={profileImageUrl} alt={profile.fullName} className="w-24 h-24 rounded-full object-cover" />
              ) : (
                <span className="text-3xl font-bold text-primary-600">{initialsFromName(profile.fullName)}</span>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleFileSelect}
              className="hidden"
            />
            {isEditing && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center hover:bg-primary-700 transition-colors shadow-md"
                title="Change profile picture"
              >
                <Camera className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-neutral-900">{profile.fullName}</h2>
            <div className="mt-1 flex items-center gap-2 text-neutral-600">
              <ShieldCheck className="h-4 w-4 text-neutral-400" />
              <Badge variant={roleBadgeVariant}>{roleLabel}</Badge>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-sm text-neutral-500">
              <span className="inline-flex items-center gap-1.5">
                <Hash className="h-3.5 w-3.5" />
                {profile.mmuId}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5" />
                Joined {formatDate(profile.createdAt)}
              </span>
              {profile.lastLoginAt && (
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5" />
                  Last login {formatDate(profile.lastLoginAt)}
                </span>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Account Info */}
      <Card>
        <h3 className="text-lg font-semibold text-neutral-900 mb-4">Account Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center flex-shrink-0">
              <UserIcon className="h-5 w-5 text-neutral-600" />
            </div>
            <div>
              <p className="text-sm text-neutral-500">Full Name</p>
              <p className="font-medium text-neutral-900">{profile.fullName}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center flex-shrink-0">
              <Hash className="h-5 w-5 text-neutral-600" />
            </div>
            <div>
              <p className="text-sm text-neutral-500">MMU ID</p>
              <p className="font-medium text-neutral-900">{profile.mmuId}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="h-5 w-5 text-neutral-600" />
            </div>
            <div>
              <p className="text-sm text-neutral-500">Account Status</p>
              <p className="font-medium text-neutral-900">{profile.status}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center flex-shrink-0">
              <CalendarDays className="h-5 w-5 text-neutral-600" />
            </div>
            <div>
              <p className="text-sm text-neutral-500">Member Since</p>
              <p className="font-medium text-neutral-900">{formatDate(profile.createdAt)}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Contact */}
      <Card>
        <h3 className="text-lg font-semibold text-neutral-900 mb-4">Contact Details</h3>
        {isEditing ? (
          <div className="space-y-4">
            <Input
              label="Email"
              type="email"
              startIcon={<Mail className="h-4 w-4" />}
              {...register('email')}
              error={errors.email?.message}
            />
            <Input
              label="Phone"
              type="tel"
              placeholder="+60 12-345 6789"
              startIcon={<Phone className="h-4 w-4" />}
              {...register('phone')}
              error={errors.phone?.message}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-info-100 flex items-center justify-center flex-shrink-0">
                <Mail className="h-5 w-5 text-info-600" />
              </div>
              <div>
                <p className="text-sm text-neutral-500">Email</p>
                <p className="font-medium text-neutral-900">{profile.email}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-success-100 flex items-center justify-center flex-shrink-0">
                <Phone className="h-5 w-5 text-success-600" />
              </div>
              <div>
                <p className="text-sm text-neutral-500">Phone</p>
                <p className="font-medium text-neutral-900">{profile.phone || '—'}</p>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Image upload modal */}
      <Modal isOpen={showImageModal} onClose={handleCancelImage} size="md">
        <ModalHeader>
          <ModalTitle>Update Profile Picture</ModalTitle>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            {imageError && <AlertBanner variant="error" description={imageError} />}
            {imagePreview && (
              <div className="flex justify-center">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className={cn('w-40 h-40 rounded-full object-cover ring-4 ring-primary-100')}
                />
              </div>
            )}
            <p className="text-sm text-neutral-500 text-center">
              JPEG, PNG, GIF, or WebP. Max 5MB.
            </p>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={handleCancelImage}>
            Cancel
          </Button>
          <Button
            variant="primary"
            leftIcon={<Upload className="h-4 w-4" />}
            onClick={handleImageUpload}
          >
            Use This Picture
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}
