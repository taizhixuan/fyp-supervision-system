import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Search,
  Filter,
  Users,
  Star,
  MapPin,
  Mail,
  ChevronRight,
  Sparkles,
  X,
  SlidersHorizontal,
} from 'lucide-react'
import { Card, Button, Input, Badge, Spinner, Modal } from '@/components/ui'
import { useSupervisorList } from '@/lib/hooks/useStudent'
import { ROUTES } from '@/lib/constants/routes'
import { cn } from '@/lib/utils/cn'
import type { SupervisorSummary } from '@/types'

// Sample data for design preview
const SAMPLE_SUPERVISORS: SupervisorSummary[] = [
  {
    supervisorId: '1',
    userId: '101',
    fullName: 'Dr. Sarah Lee Wei Lin',
    email: 'sarah.lee@mmu.edu.my',
    title: 'Associate Professor',
    department: 'Software Engineering',
    faculty: 'Faculty of Computing and Informatics',
    profileImageUrl: undefined,
    researchAreas: ['Artificial Intelligence', 'Machine Learning', 'Natural Language Processing'],
    currentLoad: 5,
    maxCapacity: 8,
    isAcceptingStudents: true,
  },
  {
    supervisorId: '2',
    userId: '102',
    fullName: 'Prof. Dr. Ahmad Razak',
    email: 'ahmad.razak@mmu.edu.my',
    title: 'Professor',
    department: 'Computer Science',
    faculty: 'Faculty of Computing and Informatics',
    profileImageUrl: undefined,
    researchAreas: ['Cybersecurity', 'Network Security', 'Blockchain'],
    currentLoad: 7,
    maxCapacity: 8,
    isAcceptingStudents: true,
  },
  {
    supervisorId: '3',
    userId: '103',
    fullName: 'Dr. Lisa Wong Mei Hua',
    email: 'lisa.wong@mmu.edu.my',
    title: 'Senior Lecturer',
    department: 'Information Systems',
    faculty: 'Faculty of Computing and Informatics',
    profileImageUrl: undefined,
    researchAreas: ['Data Science', 'Big Data Analytics', 'Business Intelligence'],
    currentLoad: 6,
    maxCapacity: 6,
    isAcceptingStudents: false,
  },
  {
    supervisorId: '4',
    userId: '104',
    fullName: 'Dr. Muhammad Hafiz',
    email: 'muhammad.hafiz@mmu.edu.my',
    title: 'Senior Lecturer',
    department: 'Software Engineering',
    faculty: 'Faculty of Computing and Informatics',
    profileImageUrl: undefined,
    researchAreas: ['Web Development', 'Cloud Computing', 'DevOps'],
    currentLoad: 4,
    maxCapacity: 8,
    isAcceptingStudents: true,
  },
  {
    supervisorId: '5',
    userId: '105',
    fullName: 'Dr. Tan Chee Keong',
    email: 'tan.ck@mmu.edu.my',
    title: 'Associate Professor',
    department: 'Computer Science',
    faculty: 'Faculty of Computing and Informatics',
    profileImageUrl: undefined,
    researchAreas: ['Computer Vision', 'Image Processing', 'Deep Learning'],
    currentLoad: 3,
    maxCapacity: 6,
    isAcceptingStudents: true,
  },
  {
    supervisorId: '6',
    userId: '106',
    fullName: 'Dr. Siti Aminah',
    email: 'siti.aminah@mmu.edu.my',
    title: 'Lecturer',
    department: 'Information Systems',
    faculty: 'Faculty of Computing and Informatics',
    profileImageUrl: undefined,
    researchAreas: ['Human-Computer Interaction', 'UX Design', 'Accessibility'],
    currentLoad: 2,
    maxCapacity: 5,
    isAcceptingStudents: true,
  },
]

const FACULTIES = [
  'All Faculties',
  'Faculty of Computing and Informatics',
  'Faculty of Engineering',
  'Faculty of Business',
]

const RESEARCH_AREAS = [
  'Artificial Intelligence',
  'Machine Learning',
  'Cybersecurity',
  'Data Science',
  'Web Development',
  'Cloud Computing',
  'Computer Vision',
  'Natural Language Processing',
  'Blockchain',
  'IoT',
]

export function SupervisorDirectory() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFaculty, setSelectedFaculty] = useState('All Faculties')
  const [selectedAreas, setSelectedAreas] = useState<string[]>([])
  const [availableOnly, setAvailableOnly] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [compareList, setCompareList] = useState<string[]>([])

  const { data, isLoading } = useSupervisorList({
    search: searchQuery,
    faculty: selectedFaculty !== 'All Faculties' ? selectedFaculty : undefined,
    researchArea: selectedAreas.length > 0 ? selectedAreas.join(',') : undefined,
    availableOnly,
  })

  // Use sample data if no API data available
  const supervisors = data?.supervisors || SAMPLE_SUPERVISORS

  // Filter supervisors based on search and filters
  const filteredSupervisors = supervisors.filter((supervisor) => {
    const matchesSearch =
      searchQuery === '' ||
      supervisor.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supervisor.researchAreas.some((area) =>
        area.toLowerCase().includes(searchQuery.toLowerCase())
      ) ||
      supervisor.department.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesFaculty =
      selectedFaculty === 'All Faculties' || supervisor.faculty === selectedFaculty

    const matchesAreas =
      selectedAreas.length === 0 ||
      selectedAreas.some((area) => supervisor.researchAreas.includes(area))

    const matchesAvailability = !availableOnly || supervisor.isAcceptingStudents

    return matchesSearch && matchesFaculty && matchesAreas && matchesAvailability
  })

  const toggleArea = (area: string) => {
    setSelectedAreas((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
    )
  }

  const toggleCompare = (supervisorId: string) => {
    setCompareList((prev) =>
      prev.includes(supervisorId)
        ? prev.filter((id) => id !== supervisorId)
        : prev.length < 3
        ? [...prev, supervisorId]
        : prev
    )
  }

  const clearFilters = () => {
    setSelectedFaculty('All Faculties')
    setSelectedAreas([])
    setAvailableOnly(false)
  }

  const hasActiveFilters =
    selectedFaculty !== 'All Faculties' || selectedAreas.length > 0 || availableOnly

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Supervisor Directory</h1>
          <p className="text-neutral-600 mt-1">
            Find and connect with supervisors for your FYP
          </p>
        </div>
        <Link to={ROUTES.STUDENT.RECOMMENDATIONS}>
          <Button variant="primary" leftIcon={<Sparkles className="h-4 w-4" />}>
            AI Recommendations
          </Button>
        </Link>
      </div>

      {/* Search and Filters */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search by name, research area, or department..."
              leftIcon={<Search className="h-5 w-5" />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button
            variant="secondary"
            leftIcon={<SlidersHorizontal className="h-4 w-4" />}
            onClick={() => setShowFilters(!showFilters)}
          >
            Filters
            {hasActiveFilters && (
              <Badge variant="primary" size="sm" className="ml-2">
                {(selectedFaculty !== 'All Faculties' ? 1 : 0) +
                  selectedAreas.length +
                  (availableOnly ? 1 : 0)}
              </Badge>
            )}
          </Button>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-neutral-200 space-y-4">
            {/* Faculty Filter */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Faculty
              </label>
              <div className="flex flex-wrap gap-2">
                {FACULTIES.map((faculty) => (
                  <button
                    key={faculty}
                    onClick={() => setSelectedFaculty(faculty)}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                      selectedFaculty === faculty
                        ? 'bg-primary-100 text-primary-700'
                        : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                    )}
                  >
                    {faculty}
                  </button>
                ))}
              </div>
            </div>

            {/* Research Areas Filter */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Research Areas
              </label>
              <div className="flex flex-wrap gap-2">
                {RESEARCH_AREAS.map((area) => (
                  <button
                    key={area}
                    onClick={() => toggleArea(area)}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                      selectedAreas.includes(area)
                        ? 'bg-success-100 text-success-700'
                        : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                    )}
                  >
                    {area}
                  </button>
                ))}
              </div>
            </div>

            {/* Availability Filter */}
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={availableOnly}
                  onChange={(e) => setAvailableOnly(e.target.checked)}
                  className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-neutral-700">
                  Only show supervisors accepting students
                </span>
              </label>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Clear all filters
                </Button>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* Compare Bar */}
      {compareList.length > 0 && (
        <Card className="bg-primary-50 border-primary-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="font-medium text-primary-900">
                Compare Supervisors ({compareList.length}/3)
              </span>
              <div className="flex gap-2">
                {compareList.map((id) => {
                  const supervisor = supervisors.find((s) => s.supervisorId === id)
                  return supervisor ? (
                    <Badge key={id} variant="primary" className="pr-1">
                      {supervisor.fullName.split(' ').slice(0, 2).join(' ')}
                      <button
                        onClick={() => toggleCompare(id)}
                        className="ml-1 p-0.5 rounded-full hover:bg-primary-700"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ) : null
                })}
              </div>
            </div>
            <Link
              to={`${ROUTES.STUDENT.COMPARE_SUPERVISORS}?ids=${compareList.join(',')}`}
            >
              <Button variant="primary" size="sm">
                Compare Selected
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {/* Results */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-neutral-600">
          Showing {filteredSupervisors.length} supervisor(s)
        </p>
      </div>

      {/* Supervisor List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" label="Loading supervisors..." />
        </div>
      ) : filteredSupervisors.length === 0 ? (
        <Card className="text-center py-12">
          <Users className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-neutral-900 mb-2">
            No supervisors found
          </h3>
          <p className="text-neutral-500 mb-4">
            Try adjusting your search or filters
          </p>
          {hasActiveFilters && (
            <Button variant="secondary" onClick={clearFilters}>
              Clear Filters
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSupervisors.map((supervisor) => (
            <Card key={supervisor.supervisorId} hover className="relative">
              {/* Compare Checkbox */}
              <div className="absolute top-4 right-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={compareList.includes(supervisor.supervisorId)}
                    onChange={() => toggleCompare(supervisor.supervisorId)}
                    disabled={
                      !compareList.includes(supervisor.supervisorId) &&
                      compareList.length >= 3
                    }
                    className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-xs text-neutral-500">Compare</span>
                </label>
              </div>

              <div className="flex gap-4">
                {/* Avatar */}
                <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                  {supervisor.profileImageUrl ? (
                    <img
                      src={supervisor.profileImageUrl}
                      alt={supervisor.fullName}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-xl font-bold text-primary-600">
                      {supervisor.fullName
                        .split(' ')
                        .filter((n) => !['Dr.', 'Prof.'].includes(n))
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2)}
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-neutral-900">
                        {supervisor.fullName}
                      </h3>
                      <p className="text-sm text-neutral-600">{supervisor.title}</p>
                      <p className="text-sm text-neutral-500">{supervisor.department}</p>
                    </div>
                  </div>

                  {/* Availability Badge */}
                  <div className="mt-2">
                    {supervisor.isAcceptingStudents ? (
                      <Badge variant="success" size="sm">
                        Accepting Students ({supervisor.maxCapacity - supervisor.currentLoad} slots)
                      </Badge>
                    ) : (
                      <Badge variant="error" size="sm">
                        Not Accepting
                      </Badge>
                    )}
                  </div>

                  {/* Research Areas */}
                  <div className="mt-3 flex flex-wrap gap-1">
                    {supervisor.researchAreas.slice(0, 3).map((area) => (
                      <Badge key={area} variant="default" size="sm">
                        {area}
                      </Badge>
                    ))}
                    {supervisor.researchAreas.length > 3 && (
                      <Badge variant="default" size="sm">
                        +{supervisor.researchAreas.length - 3}
                      </Badge>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="mt-4 flex items-center gap-2">
                    <Link
                      to={ROUTES.STUDENT.SUPERVISOR_DETAIL.replace(
                        ':id',
                        supervisor.supervisorId
                      )}
                      className="flex-1"
                    >
                      <Button variant="secondary" size="sm" className="w-full">
                        View Profile
                      </Button>
                    </Link>
                    {supervisor.isAcceptingStudents && (
                      <Link
                        to={`${ROUTES.STUDENT.CREATE_REQUEST}?supervisorId=${supervisor.supervisorId}`}
                      >
                        <Button variant="primary" size="sm">
                          Request
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
