import { useEffect, useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Mail,
  Phone,
  Building,
  GraduationCap,
  Calendar,
  Edit2,
  Save,
  X,
  Plus,
  Github,
  Linkedin,
  Globe,
  Sparkles,
  Camera,
  Upload,
  BookOpen,
} from 'lucide-react'
import { Card, Button, Input, Badge, Spinner, AlertBanner, Modal, ModalHeader, ModalTitle, ModalBody, ModalFooter } from '@/components/ui'
import { useStudentProfile, useUpdateStudentProfile, useUploadProfileImage } from '@/lib/hooks/useStudent'
import {
  STUDENT_SPECIALISATIONS,
  INTAKE_YEAR_MIN,
  INTAKE_YEAR_MAX,
} from '@/lib/validators/auth'
import { cn } from '@/lib/utils/cn'
import { assetUrl } from '@/lib/utils/assetUrl'

// Allowed image types and max size
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB

// Stored value can be "YYYY" (legacy from AuthService) or "YYYY-MM" (form input).
// Bare "YYYY" through `new Date()` becomes Jan 1 of that year — render as plain
// year instead so users don't see "Jan 2025" for what's really just a year.
function formatExpectedGraduation(value: string): string {
  if (/^\d{4}$/.test(value)) return value
  const d = new Date(value)
  return Number.isNaN(d.getTime())
    ? value
    : d.toLocaleDateString('en-MY', { month: 'short', year: 'numeric' })
}

// Validation schema
const profileSchema = z.object({
  phone: z.string().optional(),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  linkedinUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  githubUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  portfolioUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  specialisation: z
    .string()
    .optional()
    .refine(
      (v) => !v || (STUDENT_SPECIALISATIONS as readonly string[]).includes(v),
      'Please select a valid specialisation'
    ),
  intakeYear: z.preprocess((v) => {
    if (v === undefined || v === '' || v === null) return undefined
    const n = typeof v === 'number' ? v : Number.parseInt(String(v), 10)
    return Number.isFinite(n) ? n : undefined
  }, z
    .number()
    .int()
    .min(INTAKE_YEAR_MIN, `Intake year must be ≥ ${INTAKE_YEAR_MIN}`)
    .max(INTAKE_YEAR_MAX, `Intake year must be ≤ ${INTAKE_YEAR_MAX}`)
    .optional()),
  cgpa: z.preprocess((v) => {
    if (v === undefined || v === '' || v === null) return undefined
    const n = typeof v === 'number' ? v : Number.parseFloat(String(v))
    return Number.isFinite(n) ? n : undefined
  }, z
    .number()
    .min(0, 'CGPA cannot be negative')
    .max(4, 'CGPA cannot exceed 4.00')
    .optional()),
  expectedGraduation: z
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Use YYYY-MM (e.g. 2025-06)')
    .optional()
    .or(z.literal('')),
})

type ProfileFormData = z.infer<typeof profileSchema>

export function StudentProfile() {
  const [isEditing, setIsEditing] = useState(false)
  const [newSkill, setNewSkill] = useState('')
  const [newInterest, setNewInterest] = useState('')
  const [skills, setSkills] = useState<string[]>([])
  const [interests, setInterests] = useState<string[]>([])

  // Profile image upload state
  const [showImageModal, setShowImageModal] = useState(false)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageError, setImageError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: profile, isLoading, error } = useStudentProfile()
  const updateProfile = useUpdateStudentProfile()
  const uploadImage = useUploadProfileImage()

  const displayProfile = profile

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      phone: '',
      bio: '',
      linkedinUrl: '',
      githubUrl: '',
      portfolioUrl: '',
      specialisation: '',
      intakeYear: undefined,
      cgpa: undefined,
      expectedGraduation: '',
    },
  })

  // Hydrate the form + tag arrays once the real profile arrives.
  useEffect(() => {
    if (!profile) return
    reset({
      phone: profile.phone || '',
      bio: profile.bio || '',
      linkedinUrl: profile.linkedinUrl || '',
      githubUrl: profile.githubUrl || '',
      portfolioUrl: profile.portfolioUrl || '',
      specialisation: profile.specialisation || '',
      intakeYear: profile.intakeYear ?? undefined,
      cgpa: profile.cgpa ?? undefined,
      expectedGraduation: profile.expectedGraduation || '',
    })
    setSkills(profile.skills ?? [])
    setInterests(profile.researchInterests ?? [])
  }, [profile, reset])

  const onSubmit = async (data: ProfileFormData) => {
    try {
      await updateProfile.mutateAsync({
        ...data,
        cgpa: data.cgpa ?? null,
        expectedGraduation: data.expectedGraduation ? data.expectedGraduation : null,
        skills,
        researchInterests: interests,
      })
      setIsEditing(false)
    } catch (err) {
      // Error handled by mutation
    }
  }

  const handleCancel = () => {
    if (profile) {
      reset({
        phone: profile.phone || '',
        bio: profile.bio || '',
        linkedinUrl: profile.linkedinUrl || '',
        githubUrl: profile.githubUrl || '',
        portfolioUrl: profile.portfolioUrl || '',
        specialisation: profile.specialisation || '',
        intakeYear: profile.intakeYear ?? undefined,
        cgpa: profile.cgpa ?? undefined,
        expectedGraduation: profile.expectedGraduation || '',
      })
      setSkills(profile.skills ?? [])
      setInterests(profile.researchInterests ?? [])
    }
    setIsEditing(false)
  }

  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()])
      setNewSkill('')
    }
  }

  const removeSkill = (skill: string) => {
    setSkills(skills.filter((s) => s !== skill))
  }

  const addInterest = () => {
    if (newInterest.trim() && !interests.includes(newInterest.trim())) {
      setInterests([...interests, newInterest.trim()])
      setNewInterest('')
    }
  }

  const removeInterest = (interest: string) => {
    setInterests(interests.filter((i) => i !== interest))
  }

  // Profile image handlers
  const handleImageButtonClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    setImageError(null)

    if (!file) return

    // Validate file type
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setImageError('Please select a valid image file (JPEG, PNG, GIF, or WebP)')
      return
    }

    // Validate file size
    if (file.size > MAX_IMAGE_SIZE) {
      setImageError('Image size must be less than 5MB')
      return
    }

    setSelectedImage(file)

    // Create preview URL
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    setShowImageModal(true)

    // Reset input so same file can be selected again
    event.target.value = ''
  }

  const handleImageUpload = async () => {
    if (!selectedImage) return

    try {
      await uploadImage.mutateAsync(selectedImage)
      setShowImageModal(false)
      setSelectedImage(null)
      setImagePreview(null)
    } catch (err) {
      setImageError('Failed to upload image. Please try again.')
    }
  }

  const handleCancelImageUpload = () => {
    setShowImageModal(false)
    setSelectedImage(null)
    setImagePreview(null)
    setImageError(null)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" label="Loading profile..." />
      </div>
    )
  }

  if (error || !displayProfile) {
    return (
      <AlertBanner
        variant="error"
        title="Failed to load profile"
        description="Please try refreshing the page."
      />
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-900">My Profile</h1>
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
            >
              Save Changes
            </Button>
          </div>
        )}
      </div>

      {updateProfile.isError && (
        <AlertBanner
          variant="error"
          title="Failed to update profile"
          description="Please try again."
          dismissible
        />
      )}

      {updateProfile.isSuccess && (
        <AlertBanner
          variant="success"
          title="Profile updated"
          description="Your profile has been updated successfully."
          dismissible
        />
      )}

      {/* Profile Header Card */}
      <Card>
        <div className="flex flex-col sm:flex-row items-start gap-6">
          {/* Avatar */}
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-primary-100 flex items-center justify-center overflow-hidden">
              {assetUrl(displayProfile.profileImageUrl) ? (
                <img
                  src={assetUrl(displayProfile.profileImageUrl)!}
                  alt={displayProfile.fullName}
                  className="w-24 h-24 rounded-full object-cover"
                />
              ) : (
                <span className="text-3xl font-bold text-primary-600">
                  {displayProfile.fullName
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)}
                </span>
              )}
            </div>
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleFileSelect}
              className="hidden"
            />
            {/* Edit button - only show in edit mode */}
            {isEditing && (
              <button
                type="button"
                onClick={handleImageButtonClick}
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center hover:bg-primary-700 transition-colors shadow-md"
                title="Change profile picture"
              >
                <Camera className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Basic Info */}
          <div className="flex-1">
            <h2 className="text-xl font-bold text-neutral-900">{displayProfile.fullName}</h2>
            <p className="text-neutral-600">{displayProfile.studentId}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {displayProfile.programCode && <Badge variant="primary">{displayProfile.programCode}</Badge>}
              {displayProfile.specialisation && (
                <Badge variant="default">{displayProfile.specialisation}</Badge>
              )}
              {displayProfile.intakeYear && (
                <Badge variant="default">Intake {displayProfile.intakeYear}</Badge>
              )}
              {typeof displayProfile.cgpa === 'number' && (
                <Badge variant="success">CGPA: {displayProfile.cgpa.toFixed(2)}</Badge>
              )}
              {displayProfile.expectedGraduation && (
                <Badge variant="default">
                  Expected Graduation: {formatExpectedGraduation(displayProfile.expectedGraduation)}
                </Badge>
              )}
            </div>
          </div>

          {/* Social Links */}
          <div className="flex gap-2">
            {displayProfile.linkedinUrl && (
              <a
                href={displayProfile.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-600 hover:bg-primary-100 hover:text-primary-600 transition-colors"
              >
                <Linkedin className="h-5 w-5" />
              </a>
            )}
            {displayProfile.githubUrl && (
              <a
                href={displayProfile.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-600 hover:bg-neutral-900 hover:text-white transition-colors"
              >
                <Github className="h-5 w-5" />
              </a>
            )}
            {displayProfile.portfolioUrl && (
              <a
                href={displayProfile.portfolioUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-600 hover:bg-success-100 hover:text-success-600 transition-colors"
              >
                <Globe className="h-5 w-5" />
              </a>
            )}
          </div>
        </div>
      </Card>

      {/* Academic Information */}
      <Card>
        <h3 className="text-lg font-semibold text-neutral-900 mb-4">Academic Information</h3>
        {isEditing ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                Specialisation
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <BookOpen className="h-4 w-4 text-neutral-400" />
                </div>
                <select
                  className="w-full pl-9 pr-3 py-2.5 text-sm border border-neutral-300 rounded-lg bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  defaultValue={displayProfile.specialisation || ''}
                  {...register('specialisation')}
                >
                  <option value="">Select specialisation</option>
                  {STUDENT_SPECIALISATIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              {errors.specialisation && (
                <p className="mt-1 text-xs text-error-600">{errors.specialisation.message}</p>
              )}
            </div>
            <Input
              label="Intake Year"
              type="number"
              inputMode="numeric"
              min={INTAKE_YEAR_MIN}
              max={INTAKE_YEAR_MAX}
              placeholder={`e.g. ${INTAKE_YEAR_MAX}`}
              leftIcon={<Calendar className="h-5 w-5" />}
              error={errors.intakeYear?.message}
              {...register('intakeYear')}
            />
            <Input
              label="CGPA"
              type="number"
              inputMode="decimal"
              step="0.01"
              min={0}
              max={4}
              placeholder="e.g. 3.50"
              leftIcon={<GraduationCap className="h-5 w-5" />}
              helperText="Out of 4.00"
              error={errors.cgpa?.message}
              {...register('cgpa')}
            />
            <Input
              label="Expected Graduation"
              type="month"
              leftIcon={<Calendar className="h-5 w-5" />}
              helperText="Month and year you expect to graduate"
              error={errors.expectedGraduation?.message}
              {...register('expectedGraduation')}
            />
            <div className="flex items-start gap-3 sm:col-span-2 px-3 py-2 rounded-lg bg-neutral-50 text-xs text-neutral-500">
              <Mail className="h-4 w-4 mt-0.5 flex-shrink-0" />
              Email and program info are managed by the registry — contact the FYP committee to change them.
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
                <GraduationCap className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <p className="text-sm text-neutral-500">Program</p>
                <p className="font-medium text-neutral-900">{displayProfile.programName || '—'}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-success-100 flex items-center justify-center flex-shrink-0">
                <Building className="h-5 w-5 text-success-600" />
              </div>
              <div>
                <p className="text-sm text-neutral-500">Faculty</p>
                <p className="font-medium text-neutral-900">{displayProfile.faculty || '—'}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent-100 flex items-center justify-center flex-shrink-0">
                <BookOpen className="h-5 w-5 text-accent-600" />
              </div>
              <div>
                <p className="text-sm text-neutral-500">Specialisation</p>
                <p className="font-medium text-neutral-900">{displayProfile.specialisation || '—'}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-warning-100 flex items-center justify-center flex-shrink-0">
                <Calendar className="h-5 w-5 text-warning-600" />
              </div>
              <div>
                <p className="text-sm text-neutral-500">Intake Year</p>
                <p className="font-medium text-neutral-900">{displayProfile.intakeYear || '—'}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-success-100 flex items-center justify-center flex-shrink-0">
                <GraduationCap className="h-5 w-5 text-success-600" />
              </div>
              <div>
                <p className="text-sm text-neutral-500">CGPA</p>
                <p className="font-medium text-neutral-900">
                  {typeof displayProfile.cgpa === 'number' ? displayProfile.cgpa.toFixed(2) : '—'}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
                <Calendar className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <p className="text-sm text-neutral-500">Expected Graduation</p>
                <p className="font-medium text-neutral-900">
                  {displayProfile.expectedGraduation
                    ? formatExpectedGraduation(displayProfile.expectedGraduation)
                    : '—'}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 sm:col-span-2">
              <div className="w-10 h-10 rounded-lg bg-info-100 flex items-center justify-center flex-shrink-0">
                <Mail className="h-5 w-5 text-info-600" />
              </div>
              <div>
                <p className="text-sm text-neutral-500">Email</p>
                <p className="font-medium text-neutral-900">{displayProfile.email}</p>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Contact & Social Links */}
      <Card>
        <h3 className="text-lg font-semibold text-neutral-900 mb-4">Contact & Social Links</h3>
        {isEditing ? (
          <div className="space-y-4">
            <Input
              label="Phone Number"
              placeholder="+60 12-345 6789"
              leftIcon={<Phone className="h-5 w-5" />}
              error={errors.phone?.message}
              {...register('phone')}
            />
            <Input
              label="LinkedIn URL"
              placeholder="https://linkedin.com/in/username"
              leftIcon={<Linkedin className="h-5 w-5" />}
              error={errors.linkedinUrl?.message}
              {...register('linkedinUrl')}
            />
            <Input
              label="GitHub URL"
              placeholder="https://github.com/username"
              leftIcon={<Github className="h-5 w-5" />}
              error={errors.githubUrl?.message}
              {...register('githubUrl')}
            />
            <Input
              label="Portfolio URL"
              placeholder="https://yourportfolio.com"
              leftIcon={<Globe className="h-5 w-5" />}
              error={errors.portfolioUrl?.message}
              {...register('portfolioUrl')}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-neutral-400" />
              <span className="text-neutral-700">
                {displayProfile.phone || 'Not provided'}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Linkedin className="h-5 w-5 text-neutral-400" />
              {displayProfile.linkedinUrl ? (
                <a
                  href={displayProfile.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:underline"
                >
                  LinkedIn Profile
                </a>
              ) : (
                <span className="text-neutral-500">Not provided</span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Github className="h-5 w-5 text-neutral-400" />
              {displayProfile.githubUrl ? (
                <a
                  href={displayProfile.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:underline"
                >
                  GitHub Profile
                </a>
              ) : (
                <span className="text-neutral-500">Not provided</span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Globe className="h-5 w-5 text-neutral-400" />
              {displayProfile.portfolioUrl ? (
                <a
                  href={displayProfile.portfolioUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:underline"
                >
                  Portfolio Website
                </a>
              ) : (
                <span className="text-neutral-500">Not provided</span>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* Bio */}
      <Card>
        <h3 className="text-lg font-semibold text-neutral-900 mb-4">About Me</h3>
        {isEditing ? (
          <div>
            <textarea
              className={cn(
                'w-full px-4 py-3 rounded-lg border transition-colors resize-none',
                'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
                errors.bio ? 'border-error-500' : 'border-neutral-300'
              )}
              rows={4}
              placeholder="Tell us about yourself, your interests, and your FYP goals..."
              {...register('bio')}
            />
            {errors.bio && (
              <p className="mt-1 text-sm text-error-600">{errors.bio.message}</p>
            )}
            <p className="mt-1 text-sm text-neutral-500">
              {(displayProfile.bio?.length || 0)}/500 characters
            </p>
          </div>
        ) : (
          <p className="text-neutral-700 whitespace-pre-wrap">
            {displayProfile.bio || 'No bio provided yet.'}
          </p>
        )}
      </Card>

      {/* Skills */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-neutral-900">Skills</h3>
          <div className="flex items-center gap-2 text-sm text-primary-600">
            <Sparkles className="h-4 w-4" />
            <span>Used for AI matching</span>
          </div>
        </div>
        {isEditing && (
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="Add a skill (e.g., Python, React)"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addSkill()
                }
              }}
              className="flex-1"
            />
            <Button variant="secondary" onClick={addSkill} leftIcon={<Plus className="h-4 w-4" />}>
              Add
            </Button>
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          {skills.map((skill) => (
            <Badge
              key={skill}
              variant="primary"
              className={cn(isEditing && 'pr-1')}
            >
              {skill}
              {isEditing && (
                <button
                  type="button"
                  onClick={() => removeSkill(skill)}
                  className="ml-1 p-0.5 rounded-full hover:bg-primary-700 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </Badge>
          ))}
          {skills.length === 0 && (
            <p className="text-neutral-500">No skills added yet.</p>
          )}
        </div>
      </Card>

      {/* Research Interests */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-neutral-900">Research Interests</h3>
          <div className="flex items-center gap-2 text-sm text-primary-600">
            <Sparkles className="h-4 w-4" />
            <span>Used for AI matching</span>
          </div>
        </div>
        {isEditing && (
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="Add an interest (e.g., Machine Learning, IoT)"
              value={newInterest}
              onChange={(e) => setNewInterest(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addInterest()
                }
              }}
              className="flex-1"
            />
            <Button variant="secondary" onClick={addInterest} leftIcon={<Plus className="h-4 w-4" />}>
              Add
            </Button>
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          {interests.map((interest) => (
            <Badge
              key={interest}
              variant="success"
              className={cn(isEditing && 'pr-1')}
            >
              {interest}
              {isEditing && (
                <button
                  type="button"
                  onClick={() => removeInterest(interest)}
                  className="ml-1 p-0.5 rounded-full hover:bg-success-700 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </Badge>
          ))}
          {interests.length === 0 && (
            <p className="text-neutral-500">No research interests added yet.</p>
          )}
        </div>
      </Card>

      {/* Profile Image Upload Modal */}
      <Modal
        isOpen={showImageModal}
        onClose={handleCancelImageUpload}
        size="sm"
      >
        <ModalHeader>
          <ModalTitle>Update Profile Picture</ModalTitle>
        </ModalHeader>

        <ModalBody>
          <div className="space-y-4">
            {/* Image Preview */}
            {imagePreview && (
              <div className="flex justify-center">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-40 h-40 rounded-full object-cover border-4 border-primary-100"
                />
              </div>
            )}

            {/* Error Message */}
            {imageError && (
              <AlertBanner
                variant="error"
                description={imageError}
                dismissible
                onDismiss={() => setImageError(null)}
              />
            )}

            {/* Upload Error from mutation */}
            {uploadImage.isError && (
              <AlertBanner
                variant="error"
                description="Failed to upload image. Please try again."
              />
            )}

            {/* File Info */}
            {selectedImage && (
              <div className="text-center text-sm text-neutral-600">
                <p className="font-medium">{selectedImage.name}</p>
                <p>{(selectedImage.size / 1024).toFixed(1)} KB</p>
              </div>
            )}

            {/* Instructions */}
            <p className="text-sm text-neutral-500 text-center">
              Supported formats: JPEG, PNG, GIF, WebP (max 5MB)
            </p>
          </div>
        </ModalBody>

        <ModalFooter>
          <Button
            variant="ghost"
            onClick={handleCancelImageUpload}
            disabled={uploadImage.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleImageUpload}
            isLoading={uploadImage.isPending}
            leftIcon={<Upload className="h-4 w-4" />}
          >
            Upload
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}
