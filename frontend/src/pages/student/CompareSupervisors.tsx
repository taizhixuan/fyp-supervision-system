import { useSearchParams, Link } from 'react-router-dom'
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  MinusCircle,
  Star,
  Users,
  Send,
} from 'lucide-react'
import { useQueries } from '@tanstack/react-query'
import { Card, Button, Badge, Spinner } from '@/components/ui'
import { studentKeys } from '@/lib/hooks/useStudent'
import { apiClient } from '@/lib/api/client'
import { ROUTES } from '@/lib/constants/routes'
import { cn } from '@/lib/utils/cn'
import type { SupervisorDetail } from '@/types'

// Sample supervisors for design preview
const SAMPLE_SUPERVISORS: Record<string, SupervisorDetail> = {
  '1': {
    supervisorId: '1',
    userId: '101',
    fullName: 'Dr. Sarah Lee Wei Lin',
    email: 'sarah.lee@mmu.edu.my',
    title: 'Associate Professor',
    department: 'Software Engineering',
    faculty: 'Faculty of Computing and Informatics',
    researchAreas: ['Artificial Intelligence', 'Machine Learning', 'NLP', 'Deep Learning'],
    currentLoad: 5,
    maxCapacity: 8,
    isAcceptingStudents: true,
    bio: 'Expert in AI and Machine Learning with 15+ years of experience.',
    qualifications: ['Ph.D. Computer Science', 'M.Sc. AI'],
    expertise: ['Python', 'TensorFlow', 'PyTorch', 'NLP'],
    officeLocation: 'Room 5.12, FCI Building',
    officeHours: 'Tue & Thu, 2-4 PM',
    preferredMeetingPlatforms: ['Zoom', 'In-Person'],
    averageResponseTime: '24-48 hours',
    rating: 4.8,
    totalSupervised: 52,
  },
  '2': {
    supervisorId: '2',
    userId: '102',
    fullName: 'Prof. Dr. Ahmad Razak',
    email: 'ahmad.razak@mmu.edu.my',
    title: 'Professor',
    department: 'Computer Science',
    faculty: 'Faculty of Computing and Informatics',
    researchAreas: ['Cybersecurity', 'Network Security', 'Blockchain', 'Cryptography'],
    currentLoad: 7,
    maxCapacity: 8,
    isAcceptingStudents: true,
    bio: 'Leading researcher in cybersecurity with industry experience.',
    qualifications: ['Ph.D. Computer Science', 'M.Sc. Network Security'],
    expertise: ['Network Security', 'Penetration Testing', 'Blockchain'],
    officeLocation: 'Room 4.08, FCI Building',
    officeHours: 'Mon & Wed, 10 AM - 12 PM',
    preferredMeetingPlatforms: ['In-Person', 'Microsoft Teams'],
    averageResponseTime: '48-72 hours',
    rating: 4.6,
    totalSupervised: 78,
  },
  '4': {
    supervisorId: '4',
    userId: '104',
    fullName: 'Dr. Muhammad Hafiz',
    email: 'muhammad.hafiz@mmu.edu.my',
    title: 'Senior Lecturer',
    department: 'Software Engineering',
    faculty: 'Faculty of Computing and Informatics',
    researchAreas: ['Web Development', 'Cloud Computing', 'DevOps', 'Microservices'],
    currentLoad: 4,
    maxCapacity: 8,
    isAcceptingStudents: true,
    bio: 'Specializes in modern web technologies and cloud architecture.',
    qualifications: ['Ph.D. Software Engineering', 'M.Sc. Computer Science'],
    expertise: ['React', 'Node.js', 'AWS', 'Docker', 'Kubernetes'],
    officeLocation: 'Room 3.15, FCI Building',
    officeHours: 'Wed & Fri, 3-5 PM',
    preferredMeetingPlatforms: ['Google Meet', 'Zoom', 'In-Person'],
    averageResponseTime: '12-24 hours',
    rating: 4.9,
    totalSupervised: 35,
  },
}

interface ComparisonRowProps {
  label: string
  values: (string | number | boolean | undefined)[]
  type?: 'text' | 'number' | 'boolean' | 'rating' | 'availability'
  highlightBest?: boolean
}

function ComparisonRow({ label, values, type = 'text', highlightBest = false }: ComparisonRowProps) {
  // Find the best value for highlighting
  let bestIndices: number[] = []
  if (highlightBest && type === 'number') {
    const max = Math.max(...values.filter((v) => typeof v === 'number') as number[])
    bestIndices = values
      .map((v, i) => (v === max ? i : -1))
      .filter((i) => i !== -1)
  } else if (highlightBest && type === 'availability') {
    const max = Math.max(...values.filter((v) => typeof v === 'number') as number[])
    bestIndices = values
      .map((v, i) => (v === max ? i : -1))
      .filter((i) => i !== -1)
  } else if (highlightBest && type === 'rating') {
    const max = Math.max(...values.filter((v) => typeof v === 'number') as number[])
    bestIndices = values
      .map((v, i) => (v === max ? i : -1))
      .filter((i) => i !== -1)
  }

  const renderValue = (value: string | number | boolean | undefined, index: number) => {
    const isBest = bestIndices.includes(index)

    if (type === 'boolean') {
      return value ? (
        <CheckCircle className="h-5 w-5 text-success-600" />
      ) : (
        <XCircle className="h-5 w-5 text-error-600" />
      )
    }

    if (type === 'rating' && typeof value === 'number') {
      return (
        <div className={cn('flex items-center gap-1', isBest && 'text-warning-600 font-semibold')}>
          <Star className={cn('h-4 w-4', isBest ? 'fill-warning-500 text-warning-500' : 'text-neutral-400')} />
          <span>{value.toFixed(1)}</span>
        </div>
      )
    }

    if (type === 'availability' && typeof value === 'number') {
      return (
        <span className={cn(
          isBest ? 'text-success-600 font-semibold' : 'text-neutral-700'
        )}>
          {value} slots
        </span>
      )
    }

    if (value === undefined || value === null || value === '') {
      return <MinusCircle className="h-5 w-5 text-neutral-300" />
    }

    return (
      <span className={cn(isBest && 'text-success-600 font-semibold')}>
        {value}
      </span>
    )
  }

  return (
    <div className="grid grid-cols-4 gap-4 py-3 border-b border-neutral-100 last:border-0">
      <div className="text-sm font-medium text-neutral-600">{label}</div>
      {values.map((value, index) => (
        <div key={index} className="text-sm text-neutral-900 text-center">
          {renderValue(value, index)}
        </div>
      ))}
    </div>
  )
}

export function CompareSupervisors() {
  const [searchParams] = useSearchParams()
  const ids = searchParams.get('ids')?.split(',').filter(Boolean) || []

  const supervisorQueries = useQueries({
    queries: ids.map((id) => ({
      queryKey: studentKeys.supervisorDetail(id),
      queryFn: async () => {
        const { data } = await apiClient.get<SupervisorDetail>(`/supervisors/${id}`)
        return data
      },
      enabled: !!id,
    })),
  })

  // Use sample data if no API data available
  const supervisors: SupervisorDetail[] = ids.map((id, index) => {
    const query = supervisorQueries[index]
    return query?.data || SAMPLE_SUPERVISORS[id] || SAMPLE_SUPERVISORS['1']
  })

  const isLoading = supervisorQueries.some((q) => q.isLoading)

  if (ids.length === 0) {
    return (
      <div className="space-y-6">
        <Link
          to={ROUTES.STUDENT.SUPERVISORS}
          className="inline-flex items-center gap-2 text-neutral-600 hover:text-primary-600 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Directory
        </Link>

        <Card className="text-center py-12">
          <Users className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
          <h2 className="text-lg font-medium text-neutral-900 mb-2">
            No supervisors selected
          </h2>
          <p className="text-neutral-500 mb-4">
            Select up to 3 supervisors from the directory to compare them side by side
          </p>
          <Link to={ROUTES.STUDENT.SUPERVISORS}>
            <Button variant="primary">Browse Supervisors</Button>
          </Link>
        </Card>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" label="Loading comparison..." />
      </div>
    )
  }

  // Pad to 3 columns for consistent layout
  while (supervisors.length < 3) {
    supervisors.push(undefined as unknown as SupervisorDetail)
  }

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

      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Compare Supervisors</h1>
        <p className="text-neutral-600 mt-1">
          Side-by-side comparison of selected supervisors
        </p>
      </div>

      {/* Comparison Table */}
      <Card padding="none" className="overflow-hidden">
        {/* Header Row - Supervisor Cards */}
        <div className="grid grid-cols-4 gap-4 p-4 bg-neutral-50 border-b border-neutral-200">
          <div className="text-sm font-semibold text-neutral-700">Criteria</div>
          {supervisors.map((supervisor, index) => (
            <div key={index} className="text-center">
              {supervisor ? (
                <div>
                  <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-2">
                    <span className="text-xl font-bold text-primary-600">
                      {supervisor.fullName
                        .split(' ')
                        .filter((n) => !['Dr.', 'Prof.'].includes(n))
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2)}
                    </span>
                  </div>
                  <h3 className="font-semibold text-neutral-900 text-sm">
                    {supervisor.fullName}
                  </h3>
                  <p className="text-xs text-neutral-500">{supervisor.title}</p>
                  <div className="mt-2">
                    {supervisor.isAcceptingStudents ? (
                      <Badge variant="success" size="sm">Available</Badge>
                    ) : (
                      <Badge variant="error" size="sm">Not Available</Badge>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-neutral-400 text-sm">Not selected</div>
              )}
            </div>
          ))}
        </div>

        {/* Comparison Rows */}
        <div className="p-4">
          {/* Basic Info */}
          <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
            Basic Information
          </h4>
          <ComparisonRow
            label="Department"
            values={supervisors.map((s) => s?.department)}
          />
          <ComparisonRow
            label="Rating"
            values={supervisors.map((s) => s?.rating)}
            type="rating"
            highlightBest
          />
          <ComparisonRow
            label="Total Supervised"
            values={supervisors.map((s) => s?.totalSupervised)}
            type="number"
            highlightBest
          />

          {/* Availability */}
          <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2 mt-6">
            Availability
          </h4>
          <ComparisonRow
            label="Accepting Students"
            values={supervisors.map((s) => s?.isAcceptingStudents)}
            type="boolean"
          />
          <ComparisonRow
            label="Available Slots"
            values={supervisors.map((s) => s ? s.maxCapacity - s.currentLoad : undefined)}
            type="availability"
            highlightBest
          />
          <ComparisonRow
            label="Response Time"
            values={supervisors.map((s) => s?.averageResponseTime)}
          />

          {/* Research */}
          <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2 mt-6">
            Research & Expertise
          </h4>
          <div className="grid grid-cols-4 gap-4 py-3 border-b border-neutral-100">
            <div className="text-sm font-medium text-neutral-600">Research Areas</div>
            {supervisors.map((supervisor, index) => (
              <div key={index} className="flex flex-wrap gap-1 justify-center">
                {supervisor?.researchAreas?.slice(0, 3).map((area) => (
                  <Badge key={area} variant="primary" size="sm">
                    {area}
                  </Badge>
                ))}
                {supervisor?.researchAreas && supervisor.researchAreas.length > 3 && (
                  <Badge variant="default" size="sm">
                    +{supervisor.researchAreas.length - 3}
                  </Badge>
                )}
                {!supervisor && <MinusCircle className="h-5 w-5 text-neutral-300" />}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-4 gap-4 py-3 border-b border-neutral-100">
            <div className="text-sm font-medium text-neutral-600">Technical Skills</div>
            {supervisors.map((supervisor, index) => (
              <div key={index} className="flex flex-wrap gap-1 justify-center">
                {supervisor?.expertise?.slice(0, 3).map((skill) => (
                  <Badge key={skill} variant="default" size="sm">
                    {skill}
                  </Badge>
                ))}
                {supervisor?.expertise && supervisor.expertise.length > 3 && (
                  <Badge variant="default" size="sm">
                    +{supervisor.expertise.length - 3}
                  </Badge>
                )}
                {!supervisor && <MinusCircle className="h-5 w-5 text-neutral-300" />}
              </div>
            ))}
          </div>

          {/* Contact */}
          <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2 mt-6">
            Contact & Location
          </h4>
          <ComparisonRow
            label="Office Location"
            values={supervisors.map((s) => s?.officeLocation)}
          />
          <ComparisonRow
            label="Office Hours"
            values={supervisors.map((s) => s?.officeHours)}
          />
          <div className="grid grid-cols-4 gap-4 py-3">
            <div className="text-sm font-medium text-neutral-600">Meeting Platforms</div>
            {supervisors.map((supervisor, index) => (
              <div key={index} className="text-sm text-neutral-900 text-center">
                {supervisor?.preferredMeetingPlatforms ? (
                  supervisor.preferredMeetingPlatforms.join(', ')
                ) : (
                  <MinusCircle className="h-5 w-5 text-neutral-300 mx-auto" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-4 gap-4 p-4 bg-neutral-50 border-t border-neutral-200">
          <div></div>
          {supervisors.map((supervisor, index) => (
            <div key={index} className="flex flex-col gap-2">
              {supervisor ? (
                <>
                  <Link
                    to={ROUTES.STUDENT.SUPERVISOR_DETAIL.replace(':id', supervisor.supervisorId)}
                  >
                    <Button variant="secondary" size="sm" className="w-full">
                      View Profile
                    </Button>
                  </Link>
                  {supervisor.isAcceptingStudents && (
                    <Link
                      to={`${ROUTES.STUDENT.CREATE_REQUEST}?supervisorId=${supervisor.supervisorId}`}
                    >
                      <Button
                        variant="primary"
                        size="sm"
                        className="w-full"
                        leftIcon={<Send className="h-4 w-4" />}
                      >
                        Request
                      </Button>
                    </Link>
                  )}
                </>
              ) : null}
            </div>
          ))}
        </div>
      </Card>

      {/* Tips */}
      <Card className="bg-primary-50 border-primary-200">
        <h3 className="font-semibold text-primary-900 mb-2">Tips for Choosing a Supervisor</h3>
        <ul className="text-sm text-primary-700 space-y-1">
          <li>• Consider research area alignment with your project interests</li>
          <li>• Check availability and response times</li>
          <li>• Review their expertise and past supervision experience</li>
          <li>• Consider meeting platform preferences for convenience</li>
        </ul>
      </Card>
    </div>
  )
}
