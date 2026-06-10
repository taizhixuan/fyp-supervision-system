import { useState } from 'react'
import { useForm } from 'react-hook-form'
import type { FieldErrors } from 'react-hook-form'
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
  GraduationCap,
  Award,
  Target,
  AlertTriangle,
  FolderGit2,
  Hash,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import { AlertBanner } from '@/components/ui/AlertBanner'
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
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Right-column section tabs. The left identity panel (profile card, capacity,
  // external links) stays always visible — it's identity, not section content.
  const RIGHT_TABS = [
    { id: 'about' as const, label: 'About', icon: Briefcase },
    { id: 'research' as const, label: 'Research', icon: BookOpen },
  ]
  type RightTabId = (typeof RIGHT_TABS)[number]['id']
  const [activeRightTab, setActiveRightTab] = useState<RightTabId>('about')

  // Only right-column fields participate in tab-aware error routing; left-column
  // fields (fullName, email, position, phoneNumber, etc.) are always visible.
  const FIELD_TAB: Record<string, RightTabId> = {
    bio: 'about',
    researchAreas: 'research',
  }

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
  const watchedQuota = watch('maxSupervisionQuota')

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
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 4000)
    } catch (error) {
      console.error('Failed to update profile:', error)
    }
  }

  // Jump to the offending right-column tab when validation fails on a tabbed field.
  const onError = (formErrors: FieldErrors<ProfileFormData>) => {
    const firstErrorField = Object.keys(formErrors)[0]
    const targetTab = firstErrorField ? FIELD_TAB[firstErrorField] : undefined
    if (targetTab && targetTab !== activeRightTab) {
      setActiveRightTab(targetTab)
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
    <div className={cn('space-y-3 lg:space-y-4', isEditing && 'pb-24')}>
      {/* Header - Gradient Style */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-stone-800 via-stone-800 to-stone-900 p-6 text-white shadow-xl">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-stone-600/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-14 h-14 bg-amber-500/20 rounded-xl flex items-center justify-center ring-1 ring-amber-500/30">
              <User className="h-7 w-7 text-amber-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                My Profile
                {isEditing && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-200 text-xs font-medium border border-amber-500/30">
                    <Edit2 className="h-3 w-3" />
                    Editing
                  </span>
                )}
              </h1>
              <p className="text-stone-300 mt-1">Manage your supervisor profile and preferences</p>
            </div>
          </div>
          {!isEditing && (
            <Button onClick={handleStartEditing} className="bg-amber-500 hover:bg-amber-600 text-white border-0">
              <Edit2 className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          )}
        </div>
      </div>

      {/* Save feedback */}
      {saveSuccess && (
        <AlertBanner
          variant="success"
          title="Profile updated successfully"
          description="Your changes have been saved and logged."
          dismissible
          autoDismissMs={5000}
          onDismiss={() => setSaveSuccess(false)}
        />
      )}
      {updateProfile.isError && (
        <AlertBanner
          variant="error"
          title="Failed to update profile"
          description="Something went wrong. Please try again."
          dismissible
          autoDismissMs={5000}
          onDismiss={() => updateProfile.reset()}
        />
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Basic Info */}
          <div className="lg:col-span-1 space-y-3 lg:space-y-4">
            {/* Profile Card */}
            <Card className="overflow-hidden">
              <div className="bg-gradient-to-br from-stone-100 to-stone-50 p-6 text-center">
                <div className="w-24 h-24 mx-auto bg-gradient-to-br from-amber-100 to-amber-200 rounded-full flex items-center justify-center mb-4 ring-4 ring-white shadow-lg">
                  <GraduationCap className="h-12 w-12 text-amber-600" />
                </div>
                {isEditing ? (
                  <Input
                    {...register('fullName')}
                    className="text-center font-semibold"
                    error={errors.fullName?.message}
                  />
                ) : (
                  <h2 className="text-xl font-bold text-stone-800">{profile?.fullName}</h2>
                )}
                {isEditing ? (
                  <Input
                    {...register('position')}
                    className="mt-2 text-center text-sm"
                    error={errors.position?.message}
                  />
                ) : (
                  <p className="text-stone-600 font-medium">{profile?.position}</p>
                )}
                <p className="text-sm text-stone-500 mt-1">{profile?.department}</p>

                {/* Availability Status */}
                <div className="mt-4 pt-4 border-t border-stone-200">
                  {isEditing ? (
                    <label className="flex items-center justify-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        {...register('isAcceptingStudents')}
                        className="w-4 h-4 rounded border-stone-300 text-amber-600 focus:ring-amber-500"
                      />
                      <span className="text-sm text-stone-700">Accepting new students</span>
                    </label>
                  ) : (
                    <span className={cn(
                      'inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold',
                      profile?.isAcceptingStudents
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-stone-200 text-stone-600'
                    )}>
                      {profile?.isAcceptingStudents ? (
                        <>
                          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                          Accepting Students
                        </>
                      ) : 'Not Accepting'}
                    </span>
                  )}
                </div>
              </div>

              {/* Contact Info */}
              <div className="p-6 space-y-4">
                <h3 className="text-sm font-semibold text-stone-800 uppercase tracking-wider">Contact Info</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-stone-50">
                    <div className="p-2 bg-slate-100 rounded-lg">
                      <Hash className="h-4 w-4 text-slate-600" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-stone-500 uppercase tracking-wider font-medium">MMU ID</span>
                      <span className="text-sm font-mono text-stone-700">{profile?.supervisorId}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-stone-50 hover:bg-stone-100 transition-colors">
                    <div className="p-2 bg-sky-100 rounded-lg">
                      <Mail className="h-4 w-4 text-sky-600" />
                    </div>
                    {isEditing ? (
                      <Input
                        {...register('email')}
                        type="email"
                        className="flex-1"
                        error={errors.email?.message}
                      />
                    ) : (
                      <span className="text-sm text-stone-600">{profile?.email}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-stone-50 hover:bg-stone-100 transition-colors">
                    <div className="p-2 bg-emerald-100 rounded-lg">
                      <Phone className="h-4 w-4 text-emerald-600" />
                    </div>
                    {isEditing ? (
                      <Input
                        {...register('phoneNumber')}
                        className="flex-1"
                        placeholder="Phone number"
                      />
                    ) : (
                      <span className="text-sm text-stone-600">{profile?.phoneNumber || 'Not provided'}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-stone-50 hover:bg-stone-100 transition-colors">
                    <div className="p-2 bg-amber-100 rounded-lg">
                      <MapPin className="h-4 w-4 text-amber-600" />
                    </div>
                    {isEditing ? (
                      <Input
                        {...register('officeLocation')}
                        className="flex-1"
                        placeholder="Office location"
                      />
                    ) : (
                      <span className="text-sm text-stone-600">{profile?.officeLocation || 'Not provided'}</span>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            {/* Supervision Stats */}
            <Card className="overflow-hidden">
              <div className="p-4 border-b border-stone-200 bg-gradient-to-r from-stone-50 to-stone-100/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-violet-100 rounded-lg">
                    <Users className="h-5 w-5 text-violet-600" />
                  </div>
                  <h3 className="font-semibold text-stone-800">Supervision Capacity</h3>
                </div>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-stone-600">Current Students</span>
                    <span className="text-lg font-bold text-stone-800">{profile?.currentSupervisionCount ?? 0}</span>
                  </div>
                  <div className="h-3 bg-stone-100 rounded-full overflow-hidden shadow-inner">
                    <div
                      className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all"
                      style={{
                        width: `${((profile?.currentSupervisionCount ?? 0) / (profile?.maxSupervisionQuota ?? 1)) * 100}%`,
                      }}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50">
                  <span className="text-sm font-medium text-stone-600">Max Quota</span>
                  {isEditing ? (
                    <Input
                      type="number"
                      {...register('maxSupervisionQuota', { valueAsNumber: true })}
                      className="w-20"
                      min={1}
                      max={20}
                    />
                  ) : (
                    <span className="font-bold text-stone-800">{profile?.maxSupervisionQuota}</span>
                  )}
                </div>
                {isEditing && watchedQuota < (profile?.currentSupervisionCount ?? 0) && (
                  <div className="flex items-start gap-2 p-3 rounded-xl bg-warning-50 border border-warning-200">
                    <AlertTriangle className="h-4 w-4 text-warning-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-warning-700">
                      Quota ({watchedQuota}) is below current students ({profile?.currentSupervisionCount}). Existing supervisees will not be affected, but no new students can be accepted.
                    </p>
                  </div>
                )}
                <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50">
                  <span className="text-sm font-medium text-emerald-700">Available Slots</span>
                  <span className="font-bold text-emerald-600">{profile?.availableSlots}</span>
                </div>
              </div>
            </Card>

            {/* External Links */}
            <Card className="overflow-hidden">
              <div className="p-4 border-b border-stone-200 bg-gradient-to-r from-stone-50 to-stone-100/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-sky-100 rounded-lg">
                    <ExternalLink className="h-5 w-5 text-sky-600" />
                  </div>
                  <h3 className="font-semibold text-stone-800">External Profiles</h3>
                </div>
              </div>
              <div className="p-5 space-y-4">
                <div className="p-3 rounded-xl bg-stone-50 hover:bg-stone-100 transition-colors">
                  <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider block mb-2">LinkedIn</label>
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
                      className="text-sm text-sky-600 hover:text-sky-700 font-medium flex items-center gap-2"
                    >
                      View Profile
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  ) : (
                    <span className="text-sm text-stone-400">Not provided</span>
                  )}
                </div>
                <div className="p-3 rounded-xl bg-stone-50 hover:bg-stone-100 transition-colors">
                  <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider block mb-2">Google Scholar</label>
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
                      className="text-sm text-sky-600 hover:text-sky-700 font-medium flex items-center gap-2"
                    >
                      View Profile
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  ) : (
                    <span className="text-sm text-stone-400">Not provided</span>
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column - Details */}
          <div className="lg:col-span-2 space-y-3 lg:space-y-4">
            {/* Right-column tab nav */}
            <div className="border-b border-stone-200">
              <nav className="flex gap-1 -mb-px overflow-x-auto" aria-label="Profile details">
                {RIGHT_TABS.map((tab) => {
                  const isActive = activeRightTab === tab.id
                  const TabIcon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveRightTab(tab.id)}
                      aria-current={isActive ? 'page' : undefined}
                      className={cn(
                        'inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                        isActive
                          ? 'border-amber-500 text-amber-700'
                          : 'border-transparent text-stone-600 hover:text-stone-900 hover:border-stone-300'
                      )}
                    >
                      <TabIcon className="h-4 w-4" />
                      {tab.label}
                    </button>
                  )
                })}
              </nav>
            </div>

            {/* Tab: About — Bio + Recent Supervised Projects */}
            {activeRightTab === 'about' && (
            <>
            {/* Bio */}
            <Card className="overflow-hidden">
              <div className="p-4 border-b border-stone-200 bg-gradient-to-r from-stone-50 to-stone-100/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <Briefcase className="h-5 w-5 text-amber-600" />
                  </div>
                  <h3 className="font-semibold text-stone-800">About</h3>
                </div>
              </div>
              <div className="p-5">
                {isEditing ? (
                  <textarea
                    {...register('bio')}
                    rows={4}
                    className="w-full px-4 py-3 border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                    placeholder="Write a brief bio about yourself..."
                  />
                ) : (
                  <p className="text-stone-600 leading-relaxed">{profile?.bio || 'No bio provided.'}</p>
                )}
              </div>
            </Card>

            {/* Recent Supervised Projects */}
            <Card className="overflow-hidden">
              <div className="p-4 border-b border-stone-200 bg-gradient-to-r from-stone-50 to-stone-100/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-rose-100 rounded-lg">
                      <FolderGit2 className="h-5 w-5 text-rose-600" />
                    </div>
                    <h3 className="font-semibold text-stone-800">Recent Supervised Projects</h3>
                  </div>
                  <span className="text-xs text-stone-500">Used by AI matching</span>
                </div>
              </div>
              <div className="p-5">
                {profile?.pastProjects && profile.pastProjects.length > 0 ? (
                  <ul className="space-y-3">
                    {profile.pastProjects.map((project, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-3 p-3 rounded-xl bg-stone-50"
                      >
                        <FolderGit2 className="h-5 w-5 text-rose-500 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-stone-800 font-medium">{project.title}</p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-stone-500">
                            {project.year && <span>{project.year}</span>}
                            {project.year && project.status && <span>·</span>}
                            {project.status && (
                              <span className={cn(
                                'px-2 py-0.5 rounded-md text-xs font-medium',
                                project.status === 'COMPLETED'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : project.status === 'ACTIVE'
                                  ? 'bg-sky-100 text-sky-700'
                                  : 'bg-stone-200 text-stone-700'
                              )}>
                                {project.status}
                              </span>
                            )}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-stone-500">
                    No supervised projects yet. Once students are paired with you, their project titles appear here.
                  </p>
                )}
              </div>
            </Card>
            </>
            )}

            {/* Tab: Research — Research Areas + Expertise + Preferred Project Types */}
            {activeRightTab === 'research' && (
            <>
            {/* Research Areas */}
            <Card className="overflow-hidden">
              <div className="p-4 border-b border-stone-200 bg-gradient-to-r from-stone-50 to-stone-100/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-sky-100 rounded-lg">
                    <BookOpen className="h-5 w-5 text-sky-600" />
                  </div>
                  <h3 className="font-semibold text-stone-800">Research Areas</h3>
                </div>
              </div>
              <div className="p-5">
                <div className="flex flex-wrap gap-2">
                  {(isEditing ? watchedResearchAreas : profile?.researchAreas)?.map((area, index) => (
                    <span
                      key={index}
                      className={cn(
                        'px-4 py-2 bg-sky-100 text-sky-700 rounded-xl text-sm font-medium transition-all hover:bg-sky-200',
                        isEditing && 'flex items-center gap-2 pr-2'
                      )}
                    >
                      {area}
                      {isEditing && (
                        <button
                          type="button"
                          onClick={() => removeFromArray('researchAreas', index)}
                          className="p-1 rounded-full bg-sky-200 hover:bg-sky-300 text-sky-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </span>
                  ))}
                </div>
                {isEditing && (
                  <div className="flex items-center gap-2 mt-4">
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
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        addToArray('researchAreas', newResearchArea)
                        setNewResearchArea('')
                      }}
                      className="border-sky-300 text-sky-600 hover:bg-sky-50"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                {errors.researchAreas && (
                  <p className="text-sm text-rose-500 mt-2">{errors.researchAreas.message}</p>
                )}
              </div>
            </Card>

            {/* Expertise */}
            <Card className="overflow-hidden">
              <div className="p-4 border-b border-stone-200 bg-gradient-to-r from-stone-50 to-stone-100/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-violet-100 rounded-lg">
                    <Award className="h-5 w-5 text-violet-600" />
                  </div>
                  <h3 className="font-semibold text-stone-800">Technical Expertise</h3>
                </div>
              </div>
              <div className="p-5">
                <div className="flex flex-wrap gap-2">
                  {(isEditing ? watchedExpertise : profile?.expertise)?.map((skill, index) => (
                    <span
                      key={index}
                      className={cn(
                        'px-4 py-2 bg-violet-100 text-violet-700 rounded-xl text-sm font-medium transition-all hover:bg-violet-200',
                        isEditing && 'flex items-center gap-2 pr-2'
                      )}
                    >
                      {skill}
                      {isEditing && (
                        <button
                          type="button"
                          onClick={() => removeFromArray('expertise', index)}
                          className="p-1 rounded-full bg-violet-200 hover:bg-violet-300 text-violet-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </span>
                  ))}
                </div>
                {isEditing && (
                  <div className="flex items-center gap-2 mt-4">
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
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        addToArray('expertise', newExpertise)
                        setNewExpertise('')
                      }}
                      className="border-violet-300 text-violet-600 hover:bg-violet-50"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </Card>

            {/* Preferred Project Types */}
            <Card className="overflow-hidden">
              <div className="p-4 border-b border-stone-200 bg-gradient-to-r from-stone-50 to-stone-100/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <Target className="h-5 w-5 text-emerald-600" />
                  </div>
                  <h3 className="font-semibold text-stone-800">Preferred Project Types</h3>
                </div>
              </div>
              <div className="p-5">
                <div className="flex flex-wrap gap-2">
                  {(isEditing ? watchedProjectTypes : profile?.preferredProjectTypes)?.map((type, index) => (
                    <span
                      key={index}
                      className={cn(
                        'px-4 py-2 bg-emerald-100 text-emerald-700 rounded-xl text-sm font-medium transition-all hover:bg-emerald-200',
                        isEditing && 'flex items-center gap-2 pr-2'
                      )}
                    >
                      {type}
                      {isEditing && (
                        <button
                          type="button"
                          onClick={() => removeFromArray('preferredProjectTypes', index)}
                          className="p-1 rounded-full bg-emerald-200 hover:bg-emerald-300 text-emerald-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </span>
                  ))}
                </div>
                {isEditing && (
                  <div className="flex items-center gap-2 mt-4">
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
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        addToArray('preferredProjectTypes', newProjectType)
                        setNewProjectType('')
                      }}
                      className="border-emerald-300 text-emerald-600 hover:bg-emerald-50"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </Card>
            </>
            )}
          </div>
        </div>
      </form>

      {/* Sticky bottom action bar — visible only while editing */}
      {isEditing && (
        <div className="sticky bottom-0 z-30 bg-white/95 backdrop-blur-md border border-stone-200 rounded-xl shadow-lg shadow-stone-300/30 px-3 sm:px-4 py-3 flex items-center justify-between gap-2">
          <Button
            variant="secondary"
            onClick={handleCancelEditing}
            disabled={updateProfile.isPending}
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={handleSubmit(onSubmit, onError)}
            disabled={updateProfile.isPending}
            className="bg-emerald-500 hover:bg-emerald-600 text-white border-0"
          >
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
  )
}
