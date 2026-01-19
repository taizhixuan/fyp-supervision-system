import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  User,
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
} from 'lucide-react'
import { Card, Button, Input, Badge, Spinner, AlertBanner } from '@/components/ui'
import { useStudentProfile, useUpdateStudentProfile } from '@/lib/hooks/useStudent'
import { cn } from '@/lib/utils/cn'

// Validation schema
const profileSchema = z.object({
  phone: z.string().optional(),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  linkedinUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  githubUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  portfolioUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
})

type ProfileFormData = z.infer<typeof profileSchema>

// Sample data for design preview
const SAMPLE_PROFILE = {
  userId: '1',
  studentId: '1201234567',
  fullName: 'Ahmad bin Abdullah',
  email: 'ahmad@student.mmu.edu.my',
  phone: '+60 12-345 6789',
  programCode: 'BIT',
  programName: 'Bachelor of Information Technology (Hons)',
  faculty: 'Faculty of Computing and Informatics',
  intakeYear: 2021,
  expectedGraduation: '2025-06',
  cgpa: 3.45,
  profileImageUrl: undefined,
  bio: 'Passionate about building scalable web applications and exploring machine learning. Currently working on my FYP project focusing on AI-powered systems.',
  skills: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'TensorFlow', 'SQL', 'Git'],
  researchInterests: ['Artificial Intelligence', 'Machine Learning', 'Web Development', 'Cloud Computing'],
  linkedinUrl: 'https://linkedin.com/in/ahmad-abdullah',
  githubUrl: 'https://github.com/ahmad-abdullah',
  portfolioUrl: 'https://ahmad.dev',
  createdAt: '2024-01-01',
  updatedAt: '2024-01-15',
}

export function StudentProfile() {
  const [isEditing, setIsEditing] = useState(false)
  const [newSkill, setNewSkill] = useState('')
  const [newInterest, setNewInterest] = useState('')
  const [skills, setSkills] = useState<string[]>(SAMPLE_PROFILE.skills)
  const [interests, setInterests] = useState<string[]>(SAMPLE_PROFILE.researchInterests)

  const { data: profile, isLoading, error } = useStudentProfile()
  const updateProfile = useUpdateStudentProfile()

  // Use sample data if no API data available
  const displayProfile = profile || SAMPLE_PROFILE

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      phone: displayProfile.phone || '',
      bio: displayProfile.bio || '',
      linkedinUrl: displayProfile.linkedinUrl || '',
      githubUrl: displayProfile.githubUrl || '',
      portfolioUrl: displayProfile.portfolioUrl || '',
    },
  })

  const onSubmit = async (data: ProfileFormData) => {
    try {
      await updateProfile.mutateAsync({
        ...data,
        skills,
        researchInterests: interests,
      })
      setIsEditing(false)
    } catch (err) {
      // Error handled by mutation
    }
  }

  const handleCancel = () => {
    reset()
    setSkills(displayProfile.skills)
    setInterests(displayProfile.researchInterests)
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" label="Loading profile..." />
      </div>
    )
  }

  if (error && !displayProfile) {
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
            <div className="w-24 h-24 rounded-full bg-primary-100 flex items-center justify-center">
              {displayProfile.profileImageUrl ? (
                <img
                  src={displayProfile.profileImageUrl}
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
            {isEditing && (
              <button
                type="button"
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center hover:bg-primary-700 transition-colors"
              >
                <Edit2 className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Basic Info */}
          <div className="flex-1">
            <h2 className="text-xl font-bold text-neutral-900">{displayProfile.fullName}</h2>
            <p className="text-neutral-600">{displayProfile.studentId}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant="primary">{displayProfile.programCode}</Badge>
              {displayProfile.cgpa && (
                <Badge variant="success">CGPA: {displayProfile.cgpa.toFixed(2)}</Badge>
              )}
              <Badge variant="default">
                Expected Graduation: {new Date(displayProfile.expectedGraduation).toLocaleDateString('en-MY', { month: 'short', year: 'numeric' })}
              </Badge>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
              <GraduationCap className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-neutral-500">Program</p>
              <p className="font-medium text-neutral-900">{displayProfile.programName}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-success-100 flex items-center justify-center flex-shrink-0">
              <Building className="h-5 w-5 text-success-600" />
            </div>
            <div>
              <p className="text-sm text-neutral-500">Faculty</p>
              <p className="font-medium text-neutral-900">{displayProfile.faculty}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-warning-100 flex items-center justify-center flex-shrink-0">
              <Calendar className="h-5 w-5 text-warning-600" />
            </div>
            <div>
              <p className="text-sm text-neutral-500">Intake Year</p>
              <p className="font-medium text-neutral-900">{displayProfile.intakeYear}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-info-100 flex items-center justify-center flex-shrink-0">
              <Mail className="h-5 w-5 text-info-600" />
            </div>
            <div>
              <p className="text-sm text-neutral-500">Email</p>
              <p className="font-medium text-neutral-900">{displayProfile.email}</p>
            </div>
          </div>
        </div>
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
    </div>
  )
}
