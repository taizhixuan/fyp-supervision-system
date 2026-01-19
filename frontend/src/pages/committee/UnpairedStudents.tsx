import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  UserX,
  Search,
  ArrowLeft,
  Mail,
  Calendar,
  SendHorizonal,
  AlertTriangle,
  GraduationCap,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import { useUnpairedStudents } from '@/lib/hooks/useCommittee'
import { ROUTES } from '@/lib/constants/routes'
import { cn } from '@/lib/utils/cn'

export function UnpairedStudents() {
  const [searchQuery, setSearchQuery] = useState('')
  const [cycleFilter, setCycleFilter] = useState<'FYP1' | 'FYP2' | 'ALL'>('ALL')

  const { data, isLoading } = useUnpairedStudents()

  const filteredStudents = data?.students.filter((student) => {
    if (cycleFilter !== 'ALL' && student.cycle !== cycleFilter) return false
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      student.fullName.toLowerCase().includes(query) ||
      student.studentId.toLowerCase().includes(query) ||
      student.email.toLowerCase().includes(query) ||
      student.programme.toLowerCase().includes(query)
    )
  })

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
      <div className="flex items-center gap-4">
        <Link to={ROUTES.COMMITTEE.PROJECTS}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Overview
          </Button>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
            <UserX className="h-7 w-7 text-error-600" />
            Unpaired Students
          </h1>
          <p className="text-neutral-600 mt-1">
            Students who have not been assigned a supervisor yet
          </p>
        </div>
        {data && data.students.length > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-error-50 border border-error-200 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-error-600" />
            <span className="font-medium text-error-700">
              {data.students.length} student{data.students.length > 1 ? 's' : ''} need pairing
            </span>
          </div>
        )}
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <Input
              type="text"
              placeholder="Search by name, ID, email, or programme..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <select
            value={cycleFilter}
            onChange={(e) => setCycleFilter(e.target.value as 'FYP1' | 'FYP2' | 'ALL')}
            className="px-3 py-2 border border-neutral-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500"
          >
            <option value="ALL">All Cycles</option>
            <option value="FYP1">FYP1</option>
            <option value="FYP2">FYP2</option>
          </select>
        </div>
      </Card>

      {/* Cycle Summary */}
      <div className="grid grid-cols-2 gap-4">
        <Card className={cn(
          'p-4 cursor-pointer transition-colors',
          cycleFilter === 'FYP1' ? 'ring-2 ring-primary-500' : 'hover:bg-neutral-50'
        )} onClick={() => setCycleFilter(cycleFilter === 'FYP1' ? 'ALL' : 'FYP1')}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-500">FYP1 Unpaired</p>
              <p className="text-2xl font-bold text-neutral-900">
                {data?.students.filter((s) => s.cycle === 'FYP1').length ?? 0}
              </p>
            </div>
            <div className="p-3 bg-info-50 rounded-lg">
              <GraduationCap className="h-6 w-6 text-info-600" />
            </div>
          </div>
        </Card>
        <Card className={cn(
          'p-4 cursor-pointer transition-colors',
          cycleFilter === 'FYP2' ? 'ring-2 ring-primary-500' : 'hover:bg-neutral-50'
        )} onClick={() => setCycleFilter(cycleFilter === 'FYP2' ? 'ALL' : 'FYP2')}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-500">FYP2 Unpaired</p>
              <p className="text-2xl font-bold text-neutral-900">
                {data?.students.filter((s) => s.cycle === 'FYP2').length ?? 0}
              </p>
            </div>
            <div className="p-3 bg-accent-50 rounded-lg">
              <GraduationCap className="h-6 w-6 text-accent-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Students List */}
      <div className="space-y-3">
        {filteredStudents && filteredStudents.length > 0 ? (
          filteredStudents.map((student) => (
            <Card key={student.studentId} className="p-4">
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <GraduationCap className="h-6 w-6 text-neutral-400" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-neutral-900">{student.fullName}</h3>
                      <p className="text-sm text-neutral-500">{student.studentId}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Mail className="h-4 w-4 mr-1" />
                        Email
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-neutral-600">
                    <span>{student.email}</span>
                    <span>{student.programme}</span>
                    <span className={cn(
                      'px-2 py-0.5 rounded-full text-xs font-medium',
                      student.cycle === 'FYP1' ? 'bg-info-50 text-info-700' : 'bg-accent-50 text-accent-700'
                    )}>
                      {student.cycle}
                    </span>
                  </div>

                  {/* Request Info */}
                  <div className="flex items-center gap-4 mt-3 text-xs text-neutral-500">
                    <span className="flex items-center gap-1">
                      <SendHorizonal className="h-3.5 w-3.5" />
                      {student.requestsSent} request{student.requestsSent !== 1 ? 's' : ''} sent
                    </span>
                    {student.requestsRejected > 0 && (
                      <span className="text-error-600">
                        {student.requestsRejected} rejected
                      </span>
                    )}
                    {student.lastRequestAt && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        Last request: {new Date(student.lastRequestAt).toLocaleDateString()}
                      </span>
                    )}
                    <span>
                      Registered: {new Date(student.registeredAt).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Preferred Areas */}
                  {student.preferredAreas && student.preferredAreas.length > 0 && (
                    <div className="mt-2">
                      <span className="text-xs text-neutral-500">Interests: </span>
                      {student.preferredAreas.map((area, index) => (
                        <span
                          key={area}
                          className="inline-block px-2 py-0.5 bg-neutral-100 text-neutral-600 rounded text-xs mr-1"
                        >
                          {area}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))
        ) : (
          <Card className="p-12 text-center">
            <UserX className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-neutral-900">
              {searchQuery || cycleFilter !== 'ALL' ? 'No students found' : 'All students are paired!'}
            </h3>
            <p className="text-neutral-500 mt-1">
              {searchQuery || cycleFilter !== 'ALL'
                ? 'Try adjusting your filters'
                : 'There are no unpaired students at this time'}
            </p>
          </Card>
        )}
      </div>

      {/* Summary */}
      {data && data.students.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-neutral-600">
              Showing {filteredStudents?.length ?? 0} of {data.total} unpaired students
            </span>
            <Button variant="outline" size="sm">
              <Mail className="h-4 w-4 mr-2" />
              Send Bulk Reminder
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}
