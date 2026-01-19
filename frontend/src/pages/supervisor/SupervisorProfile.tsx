import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  BookOpen,
  Users,
  Edit2,
  Save,
  X,
  ExternalLink,
  Plus,
  Trash2,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import { useSupervisorProfile, useUpdateSupervisorProfile } from '@/lib/hooks/useSupervisor'
import { cn } from '@/lib/utils/cn'

const profileSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  email: z.string().email('Invalid email address'),
  department: z.string().min(1, 'Department is required'),
  position: z.string().min(1, 'Position is required'),
  bio: z.string().optional(),
  officeLocation: z.string().optional(),
  phoneNumber: z.string().optional(),
  linkedInUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  googleScholarUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  researchAreas: z.array(z.string()).min(1, 'At least one research area is required'),
  expertise: z.array(z.string()),
  preferredProjectTypes: z.array(z.string()),
  maxSupervisionQuota: z.number().min(1).max(20),
  isAcceptingStudents: z.boolean(),
})

type ProfileFormData = z.infer<typeof profileSchema>

export function SupervisorProfile() {
  const [isEditing, setIsEditing] = useState(false)
  const [newResearchArea, setNewResearchArea] = useState('')
  const [newExpertise, setNewExpertise] = useState('')
  const [newProjectType, setNewProjectType] = useState('')

  const { data: profile, isLoading } = useSupervisorProfile()
  const updateProfile = useUpdateSupervisorProfile()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: profile?.fullName ?? '',
      email: profile?.email ?? '',
      department: profile?.department ?? '',
      position: profile?.position ?? '',
      bio: profile?.bio ?? '',
      officeLocation: profile?.officeLocation ?? '',
      phoneNumber: profile?.phoneNumber ?? '',
      linkedInUrl: profile?.linkedInUrl ?? '',
      googleScholarUrl: profile?.googleScholarUrl ?? '',
      researchAreas: profile?.researchAreas ?? [],
      expertise: profile?.expertise ?? [],
      preferredProjectTypes: profile?.preferredProjectTypes ?? [],
      maxSupervisionQuota: profile?.maxSupervisionQuota ?? 8,
      isAcceptingStudents: profile?.isAcceptingStudents ?? true,
    },
  })

  const watchedResearchAreas = watch('researchAreas') ?? []
  const watchedExpertise = watch('expertise') ?? []
  const watchedProjectTypes = watch('preferredProjectTypes') ?? []
  const watchedIsAccepting = watch('isAcceptingStudents')

  const handleStartEditing = () => {
    reset({
      fullName: profile?.fullName ?? '',
      email: profile?.email ?? '',
      department: profile?.department ?? '',
      position: profile?.position ?? '',
      bio: profile?.bio ?? '',
      officeLocation: profile?.officeLocation ?? '',
      phoneNumber: profile?.phoneNumber ?? '',
      linkedInUrl: profile?.linkedInUrl ?? '',
      googleScholarUrl: profile?.googleScholarUrl ?? '',
      researchAreas: profile?.researchAreas ?? [],
      expertise: profile?.expertise ?? [],
      preferredProjectTypes: profile?.preferredProjectTypes ?? [],
      maxSupervisionQuota: profile?.maxSupervisionQuota ?? 8,
      isAcceptingStudents: profile?.isAcceptingStudents ?? true,
    })
    setIsEditing(true)
  }

  const handleCancelEditing = () => {
    setIsEditing(false)
    reset()
  }

  const onSubmit = async (data: ProfileFormData) => {
    try {
      await updateProfile.mutateAsync(data)
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to update profile:', error)
    }
  }

  const addToArray = (field: 'researchAreas' | 'expertise' | 'preferredProjectTypes', value: string) => {
    if (value.trim()) {
      const current = watch(field) ?? []
      if (!current.includes(value.trim())) {
        setValue(field, [...current, value.trim()])
      }
    }
  }

  const removeFromArray = (field: 'researchAreas' | 'expertise' | 'preferredProjectTypes', index: number) => {
    const current = watch(field) ?? []
    setValue(field, current.filter((_, i) => i !== index))
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">My Profile</h1>
          <p className="text-neutral-600 mt-1">Manage your supervisor profile and preferences</p>
        </div>
        {!isEditing ? (
          <Button onClick={handleStartEditing}>
            <Edit2 className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleCancelEditing}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSubmit(onSubmit)} disabled={updateProfile.isPending}>
              {updateProfile.isPending ? (
                <Spinner size="sm" className="mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Changes
            </Button>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Basic Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Profile Card */}
            <Card>
              <div className="p-6 text-center">
                <div className="w-24 h-24 mx-auto bg-primary-100 rounded-full flex items-center justify-center mb-4">
                  <User className="h-12 w-12 text-primary-600" />
                </div>
                {isEditing ? (
                  <Input
                    {...register('fullName')}
                    className="text-center font-semibold"
                    error={errors.fullName?.message}
                  />
                ) : (
                  <h2 className="text-xl font-semibold text-neutral-900">{profile?.fullName}</h2>
                )}
                {isEditing ? (
                  <Input
                    {...register('position')}
                    className="mt-2 text-center text-sm"
                    error={errors.position?.message}
                  />
                ) : (
                  <p className="text-neutral-600">{profile?.position}</p>
                )}
                <p className="text-sm text-neutral-500 mt-1">{profile?.department}</p>

                {/* Availability Status */}
                <div className="mt-4 pt-4 border-t border-neutral-200">
                  {isEditing ? (
                    <label className="flex items-center justify-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        {...register('isAcceptingStudents')}
                        className="w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm text-neutral-700">Accepting new students</span>
                    </label>
                  ) : (
                    <span className={cn(
                      'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium',
                      profile?.isAcceptingStudents
                        ? 'bg-success-100 text-success-700'
                        : 'bg-neutral-100 text-neutral-600'
                    )}>
                      {profile?.isAcceptingStudents ? 'Accepting Students' : 'Not Accepting'}
                    </span>
                  )}
                </div>
              </div>

              {/* Contact Info */}
              <div className="px-6 pb-6 space-y-3">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-neutral-400" />
                  {isEditing ? (
                    <Input
                      {...register('email')}
                      type="email"
                      className="flex-1"
                      error={errors.email?.message}
                    />
                  ) : (
                    <span className="text-sm text-neutral-600">{profile?.email}</span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-neutral-400" />
                  {isEditing ? (
                    <Input
                      {...register('phoneNumber')}
                      className="flex-1"
                      placeholder="Phone number"
                    />
                  ) : (
                    <span className="text-sm text-neutral-600">{profile?.phoneNumber || 'Not provided'}</span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-neutral-400" />
                  {isEditing ? (
                    <Input
                      {...register('officeLocation')}
                      className="flex-1"
                      placeholder="Office location"
                    />
                  ) : (
                    <span className="text-sm text-neutral-600">{profile?.officeLocation || 'Not provided'}</span>
                  )}
                </div>
              </div>
            </Card>

            {/* Supervision Stats */}
            <Card className="p-6">
              <h3 className="font-semibold text-neutral-900 mb-4">Supervision Capacity</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-neutral-600">Current Students</span>
                    <span className="font-medium">{profile?.currentSupervisionCount ?? 0}</span>
                  </div>
                  <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-500 rounded-full"
                      style={{
                        width: `${((profile?.currentSupervisionCount ?? 0) / (profile?.maxSupervisionQuota ?? 1)) * 100}%`,
                      }}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600">Max Quota</span>
                  {isEditing ? (
                    <Input
                      type="number"
                      {...register('maxSupervisionQuota', { valueAsNumber: true })}
                      className="w-20"
                      min={1}
                      max={20}
                    />
                  ) : (
                    <span className="font-medium">{profile?.maxSupervisionQuota}</span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600">Available Slots</span>
                  <span className="font-medium text-success-600">{profile?.availableSlots}</span>
                </div>
              </div>
            </Card>

            {/* External Links */}
            <Card className="p-6">
              <h3 className="font-semibold text-neutral-900 mb-4">External Profiles</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-neutral-600 block mb-1">LinkedIn</label>
                  {isEditing ? (
                    <Input
                      {...register('linkedInUrl')}
                      placeholder="https://linkedin.com/in/..."
                      error={errors.linkedInUrl?.message}
                    />
                  ) : profile?.linkedInUrl ? (
                    <a
                      href={profile.linkedInUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary-600 hover:underline flex items-center gap-1"
                    >
                      View Profile
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <span className="text-sm text-neutral-400">Not provided</span>
                  )}
                </div>
                <div>
                  <label className="text-sm text-neutral-600 block mb-1">Google Scholar</label>
                  {isEditing ? (
                    <Input
                      {...register('googleScholarUrl')}
                      placeholder="https://scholar.google.com/..."
                      error={errors.googleScholarUrl?.message}
                    />
                  ) : profile?.googleScholarUrl ? (
                    <a
                      href={profile.googleScholarUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary-600 hover:underline flex items-center gap-1"
                    >
                      View Profile
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <span className="text-sm text-neutral-400">Not provided</span>
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column - Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Bio */}
            <Card className="p-6">
              <h3 className="font-semibold text-neutral-900 mb-4 flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-neutral-400" />
                About
              </h3>
              {isEditing ? (
                <textarea
                  {...register('bio')}
                  rows={4}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Write a brief bio about yourself..."
                />
              ) : (
                <p className="text-neutral-600">{profile?.bio || 'No bio provided.'}</p>
              )}
            </Card>

            {/* Research Areas */}
            <Card className="p-6">
              <h3 className="font-semibold text-neutral-900 mb-4 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-neutral-400" />
                Research Areas
              </h3>
              <div className="flex flex-wrap gap-2">
                {(isEditing ? watchedResearchAreas : profile?.researchAreas)?.map((area, index) => (
                  <span
                    key={index}
                    className={cn(
                      'px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm',
                      isEditing && 'flex items-center gap-1'
                    )}
                  >
                    {area}
                    {isEditing && (
                      <button
                        type="button"
                        onClick={() => removeFromArray('researchAreas', index)}
                        className="ml-1 text-primary-500 hover:text-primary-700"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </span>
                ))}
              </div>
              {isEditing && (
                <div className="flex items-center gap-2 mt-3">
                  <Input
                    value={newResearchArea}
                    onChange={(e) => setNewResearchArea(e.target.value)}
                    placeholder="Add research area"
                    className="flex-1"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addToArray('researchAreas', newResearchArea)
                        setNewResearchArea('')
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      addToArray('researchAreas', newResearchArea)
                      setNewResearchArea('')
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              )}
              {errors.researchAreas && (
                <p className="text-sm text-error-500 mt-1">{errors.researchAreas.message}</p>
              )}
            </Card>

            {/* Expertise */}
            <Card className="p-6">
              <h3 className="font-semibold text-neutral-900 mb-4">Technical Expertise</h3>
              <div className="flex flex-wrap gap-2">
                {(isEditing ? watchedExpertise : profile?.expertise)?.map((skill, index) => (
                  <span
                    key={index}
                    className={cn(
                      'px-3 py-1 bg-accent-50 text-accent-700 rounded-full text-sm',
                      isEditing && 'flex items-center gap-1'
                    )}
                  >
                    {skill}
                    {isEditing && (
                      <button
                        type="button"
                        onClick={() => removeFromArray('expertise', index)}
                        className="ml-1 text-accent-500 hover:text-accent-700"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </span>
                ))}
              </div>
              {isEditing && (
                <div className="flex items-center gap-2 mt-3">
                  <Input
                    value={newExpertise}
                    onChange={(e) => setNewExpertise(e.target.value)}
                    placeholder="Add expertise"
                    className="flex-1"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addToArray('expertise', newExpertise)
                        setNewExpertise('')
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      addToArray('expertise', newExpertise)
                      setNewExpertise('')
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </Card>

            {/* Preferred Project Types */}
            <Card className="p-6">
              <h3 className="font-semibold text-neutral-900 mb-4 flex items-center gap-2">
                <Users className="h-5 w-5 text-neutral-400" />
                Preferred Project Types
              </h3>
              <div className="flex flex-wrap gap-2">
                {(isEditing ? watchedProjectTypes : profile?.preferredProjectTypes)?.map((type, index) => (
                  <span
                    key={index}
                    className={cn(
                      'px-3 py-1 bg-success-50 text-success-700 rounded-full text-sm',
                      isEditing && 'flex items-center gap-1'
                    )}
                  >
                    {type}
                    {isEditing && (
                      <button
                        type="button"
                        onClick={() => removeFromArray('preferredProjectTypes', index)}
                        className="ml-1 text-success-500 hover:text-success-700"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </span>
                ))}
              </div>
              {isEditing && (
                <div className="flex items-center gap-2 mt-3">
                  <Input
                    value={newProjectType}
                    onChange={(e) => setNewProjectType(e.target.value)}
                    placeholder="Add project type"
                    className="flex-1"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addToArray('preferredProjectTypes', newProjectType)
                        setNewProjectType('')
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      addToArray('preferredProjectTypes', newProjectType)
                      setNewProjectType('')
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </Card>
          </div>
        </div>
      </form>
    </div>
  )
}
