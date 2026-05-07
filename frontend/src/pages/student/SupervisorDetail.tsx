import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Mail,
  MapPin,
  Clock,
  Users,
  BookOpen,
  Award,
  Calendar,
  Star,
  Send,
} from 'lucide-react'
import { Card, Button, Badge, Spinner, AlertBanner } from '@/components/ui'
import { useSupervisorDetail } from '@/lib/hooks/useStudent'
import { ROUTES } from '@/lib/constants/routes'
import { cn } from '@/lib/utils/cn'

// Sample data for design preview
const SAMPLE_SUPERVISOR = {
  supervisorId: '1',
  userId: '101',
  fullName: 'Dr. Sarah Lee Wei Lin',
  email: 'sarah.lee@mmu.edu.my',
  title: 'Associate Professor',
  department: 'Software Engineering',
  faculty: 'Faculty of Computing and Informatics',
  profileImageUrl: undefined,
  researchAreas: ['Artificial Intelligence', 'Machine Learning', 'Natural Language Processing', 'Deep Learning'],
  currentLoad: 5,
  maxCapacity: 8,
  isAcceptingStudents: true,
  bio: 'Dr. Sarah Lee is an Associate Professor at the Faculty of Computing and Informatics with over 15 years of experience in AI and Machine Learning research. She has supervised more than 50 FYP students and published extensively in top-tier journals and conferences.',
  qualifications: [
    'Ph.D. in Computer Science, University of Melbourne',
    'M.Sc. in Artificial Intelligence, University of Edinburgh',
    'B.Sc. (Hons) in Computer Science, Universiti Malaya',
  ],
  publications: [
    'Deep Learning Approaches for Natural Language Understanding (IEEE TNNLS, 2024)',
    'Transformer-based Models for Malaysian Text Classification (ACL, 2023)',
    'A Survey on AI Applications in Education (Computers & Education, 2023)',
  ],
  expertise: ['Python', 'TensorFlow', 'PyTorch', 'NLP', 'Computer Vision', 'Research Methodology'],
  officeLocation: 'Room 5.12, FCI Building, Cyberjaya Campus',
  officeHours: 'Tuesday & Thursday, 2:00 PM - 4:00 PM',
  preferredMeetingPlatforms: ['Zoom', 'In-Person', 'Google Meet'],
  averageResponseTime: '24-48 hours',
  rating: 4.8,
  totalSupervised: 52,
}

export function SupervisorDetail() {
  const { id } = useParams<{ id: string }>()
  const { data: supervisor, isLoading, error } = useSupervisorDetail(id || '')

  // Use sample data if no API data available
  const displaySupervisor = supervisor || SAMPLE_SUPERVISOR

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" label="Loading supervisor profile..." />
      </div>
    )
  }

  if (error && !displaySupervisor) {
    return (
      <AlertBanner
        variant="error"
        title="Failed to load supervisor profile"
        description="Please try refreshing the page."
      />
    )
  }

  const availableSlots = displaySupervisor.maxCapacity - displaySupervisor.currentLoad
  const loadPercentage = (displaySupervisor.currentLoad / displaySupervisor.maxCapacity) * 100

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link
        to={ROUTES.STUDENT.SUPERVISORS}
        className="inline-flex items-center gap-2 text-neutral-600 hover:text-primary-600 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Directory
      </Link>

      {/* Header Card */}
      <Card>
        <div className="flex flex-col md:flex-row gap-6">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className="w-32 h-32 rounded-xl bg-primary-100 flex items-center justify-center">
              {displaySupervisor.profileImageUrl ? (
                <img
                  src={displaySupervisor.profileImageUrl}
                  alt={displaySupervisor.fullName}
                  className="w-32 h-32 rounded-xl object-cover"
                />
              ) : (
                <span className="text-4xl font-bold text-primary-600">
                  {displaySupervisor.fullName
                    .split(' ')
                    .filter((n) => !['Dr.', 'Prof.'].includes(n))
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)}
                </span>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-neutral-900">
                  {displaySupervisor.fullName}
                </h1>
                <p className="text-lg text-neutral-600">{displaySupervisor.title}</p>
                <p className="text-neutral-500">{displaySupervisor.department}</p>
                <p className="text-sm text-neutral-400">{displaySupervisor.faculty}</p>
              </div>

              {/* Rating */}
              {displaySupervisor.rating && (
                <div className="flex items-center gap-2 bg-warning-50 px-3 py-2 rounded-lg">
                  <Star className="h-5 w-5 text-warning-500 fill-warning-500" />
                  <span className="text-lg font-semibold text-warning-700">
                    {displaySupervisor.rating.toFixed(1)}
                  </span>
                  <span className="text-sm text-warning-600">
                    ({displaySupervisor.totalSupervised} supervised)
                  </span>
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="mt-4 flex flex-wrap gap-4">
              <div className="flex items-center gap-2 text-neutral-600">
                <Mail className="h-4 w-4" />
                <a
                  href={`mailto:${displaySupervisor.email}`}
                  className="hover:text-primary-600 transition-colors"
                >
                  {displaySupervisor.email}
                </a>
              </div>
              {displaySupervisor.officeLocation && (
                <div className="flex items-center gap-2 text-neutral-600">
                  <MapPin className="h-4 w-4" />
                  <span>{displaySupervisor.officeLocation}</span>
                </div>
              )}
            </div>

            {/* Availability */}
            <div className="mt-4">
              {displaySupervisor.isAcceptingStudents ? (
                <div className="flex items-center gap-4">
                  <Badge variant="success" size="lg">
                    Accepting Students
                  </Badge>
                  <span className="text-sm text-neutral-600">
                    {availableSlots} of {displaySupervisor.maxCapacity} slots available
                  </span>
                </div>
              ) : (
                <Badge variant="error" size="lg">
                  Not Accepting Students
                </Badge>
              )}

              {/* Load Bar */}
              <div className="mt-2 w-full max-w-xs">
                <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      loadPercentage < 50
                        ? 'bg-success-500'
                        : loadPercentage < 80
                        ? 'bg-warning-500'
                        : 'bg-error-500'
                    )}
                    style={{ width: `${loadPercentage}%` }}
                  />
                </div>
                <p className="text-xs text-neutral-500 mt-1">
                  Current supervision load: {displaySupervisor.currentLoad}/{displaySupervisor.maxCapacity}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to={ROUTES.STUDENT.TOPICS}>
                <Button variant="primary" leftIcon={<Send className="h-4 w-4" />}>
                  Browse Their Topics
                </Button>
              </Link>
              <a href={`mailto:${displaySupervisor.email}`}>
                <Button variant="secondary" leftIcon={<Mail className="h-4 w-4" />}>
                  Send Email
                </Button>
              </a>
            </div>
          </div>
        </div>
      </Card>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* About */}
          {displaySupervisor.bio && (
            <Card>
              <h2 className="text-lg font-semibold text-neutral-900 mb-4">About</h2>
              <p className="text-neutral-700 whitespace-pre-wrap">{displaySupervisor.bio}</p>
            </Card>
          )}

          {/* Research Areas */}
          <Card>
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">Research Areas</h2>
            <div className="flex flex-wrap gap-2">
              {displaySupervisor.researchAreas.map((area) => (
                <Badge key={area} variant="primary" size="lg">
                  {area}
                </Badge>
              ))}
            </div>
          </Card>

          {/* Expertise */}
          {displaySupervisor.expertise && displaySupervisor.expertise.length > 0 && (
            <Card>
              <h2 className="text-lg font-semibold text-neutral-900 mb-4">Technical Expertise</h2>
              <div className="flex flex-wrap gap-2">
                {displaySupervisor.expertise.map((skill) => (
                  <Badge key={skill} variant="default">
                    {skill}
                  </Badge>
                ))}
              </div>
            </Card>
          )}

          {/* Publications */}
          {displaySupervisor.publications && displaySupervisor.publications.length > 0 && (
            <Card>
              <h2 className="text-lg font-semibold text-neutral-900 mb-4">
                Recent Publications
              </h2>
              <ul className="space-y-3">
                {displaySupervisor.publications.map((pub, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <BookOpen className="h-5 w-5 text-primary-600 flex-shrink-0 mt-0.5" />
                    <span className="text-neutral-700">{pub}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Qualifications */}
          {displaySupervisor.qualifications && displaySupervisor.qualifications.length > 0 && (
            <Card>
              <h2 className="text-lg font-semibold text-neutral-900 mb-4">Qualifications</h2>
              <ul className="space-y-3">
                {displaySupervisor.qualifications.map((qual, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Award className="h-5 w-5 text-success-600 flex-shrink-0 mt-0.5" />
                    <span className="text-neutral-700">{qual}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contact Info */}
          <Card>
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">Contact Information</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-neutral-500 mb-1">Email</p>
                <a
                  href={`mailto:${displaySupervisor.email}`}
                  className="text-primary-600 hover:underline flex items-center gap-2"
                >
                  <Mail className="h-4 w-4" />
                  {displaySupervisor.email}
                </a>
              </div>

              {displaySupervisor.officeLocation && (
                <div>
                  <p className="text-sm text-neutral-500 mb-1">Office Location</p>
                  <div className="flex items-start gap-2 text-neutral-700">
                    <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <span>{displaySupervisor.officeLocation}</span>
                  </div>
                </div>
              )}

              {displaySupervisor.officeHours && (
                <div>
                  <p className="text-sm text-neutral-500 mb-1">Office Hours</p>
                  <div className="flex items-start gap-2 text-neutral-700">
                    <Clock className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <span>{displaySupervisor.officeHours}</span>
                  </div>
                </div>
              )}

              {displaySupervisor.averageResponseTime && (
                <div>
                  <p className="text-sm text-neutral-500 mb-1">Average Response Time</p>
                  <div className="flex items-center gap-2 text-neutral-700">
                    <Clock className="h-4 w-4" />
                    <span>{displaySupervisor.averageResponseTime}</span>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Meeting Preferences */}
          {displaySupervisor.preferredMeetingPlatforms &&
            displaySupervisor.preferredMeetingPlatforms.length > 0 && (
              <Card>
                <h2 className="text-lg font-semibold text-neutral-900 mb-4">
                  Meeting Preferences
                </h2>
                <div className="space-y-2">
                  {displaySupervisor.preferredMeetingPlatforms.map((platform) => (
                    <div
                      key={platform}
                      className="flex items-center gap-2 p-2 rounded-lg bg-neutral-50"
                    >
                      <Calendar className="h-4 w-4 text-primary-600" />
                      <span className="text-neutral-700">{platform}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

          {/* Supervision Stats */}
          <Card>
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">Supervision Stats</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-neutral-600">Total Supervised</span>
                <span className="font-semibold text-neutral-900">
                  {displaySupervisor.totalSupervised} students
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-600">Current Load</span>
                <span className="font-semibold text-neutral-900">
                  {displaySupervisor.currentLoad}/{displaySupervisor.maxCapacity}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-600">Available Slots</span>
                <span
                  className={cn(
                    'font-semibold',
                    availableSlots > 0 ? 'text-success-600' : 'text-error-600'
                  )}
                >
                  {availableSlots}
                </span>
              </div>
            </div>
          </Card>

          {/* CTA */}
          {displaySupervisor.isAcceptingStudents && (
            <Card className="bg-primary-50 border-primary-200">
              <div className="text-center">
                <Users className="h-10 w-10 text-primary-600 mx-auto mb-3" />
                <h3 className="font-semibold text-primary-900 mb-2">
                  Interested in working with {displaySupervisor.fullName.split(' ')[0]}?
                </h3>
                <p className="text-sm text-primary-700 mb-4">
                  Browse this supervisor&apos;s approved project topics to pair up.
                </p>
                <Link to={ROUTES.STUDENT.TOPICS}>
                  <Button variant="primary" className="w-full">
                    Browse Topics
                  </Button>
                </Link>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
