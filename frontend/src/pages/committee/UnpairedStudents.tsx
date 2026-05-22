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
    <div className="space-y-3 lg:space-y-4">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to={ROUTES.COMMITTEE.PROJECTS}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Overview
          </Button>
        </Link>
      </div>

      {/* Compact Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <UserX className="h-5 w-5 text-error-600 flex-shrink-0" />
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 leading-tight">Unpaired Students</h1>
            <p className="text-xs text-neutral-600">Students who have not been assigned a supervisor yet</p>
          </div>
        </div>
        {data && data.students.length > 0 && (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-error-50 border border-error-200 rounded-md flex-shrink-0">
            <AlertTriangle className="h-3.5 w-3.5 text-error-600" />
            <span className="text-xs font-semibold text-error-700">
              {data.students.length} need pairing
            </span>
          </div>
        )}
      </div>

      {/* Cycle stat pills + filters */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => setCycleFilter(cycleFilter === 'FYP1' ? 'ALL' : 'FYP1')}
          className={cn(
            'flex items-center justify-between px-3 py-2 rounded-md border bg-white transition-colors',
            cycleFilter === 'FYP1' ? 'ring-2 ring-primary-500 border-primary-300' : 'border-stone-200 hover:bg-neutral-50'
          )}
        >
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-info-50 rounded-md">
              <GraduationCap className="h-4 w-4 text-info-600" />
            </div>
            <div className="text-left">
              <p className="text-[10px] uppercase tracking-wide text-neutral-500">FYP1 Unpaired</p>
              <p className="text-lg font-bold text-neutral-900 leading-none">
                {data?.students.filter((s) => s.cycle === 'FYP1').length ?? 0}
              </p>
            </div>
          </div>
        </button>
        <button
          onClick={() => setCycleFilter(cycleFilter === 'FYP2' ? 'ALL' : 'FYP2')}
          className={cn(
            'flex items-center justify-between px-3 py-2 rounded-md border bg-white transition-colors',
            cycleFilter === 'FYP2' ? 'ring-2 ring-primary-500 border-primary-300' : 'border-stone-200 hover:bg-neutral-50'
          )}
        >
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-accent-50 rounded-md">
              <GraduationCap className="h-4 w-4 text-accent-600" />
            </div>
            <div className="text-left">
              <p className="text-[10px] uppercase tracking-wide text-neutral-500">FYP2 Unpaired</p>
              <p className="text-lg font-bold text-neutral-900 leading-none">
                {data?.students.filter((s) => s.cycle === 'FYP2').length ?? 0}
              </p>
            </div>
          </div>
        </button>
      </div>

      {/* Search */}
      <Card padding="sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 pointer-events-none" />
          <Input
            type="text"
            placeholder="Search by name, ID, email, or programme..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </Card>

      {/* Students List — 2-col grid */}
      {filteredStudents && filteredStudents.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
          {filteredStudents.map((student) => (
            <Card key={student.studentId} padding="sm">
              <div className="flex items-start gap-2.5">
                <div className="w-10 h-10 bg-neutral-100 rounded-md flex items-center justify-center flex-shrink-0">
                  <GraduationCap className="h-5 w-5 text-neutral-400" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-sm text-neutral-900 leading-tight truncate">{student.fullName}</h3>
                      <p className="text-[11px] text-neutral-500 truncate">
                        {student.studentId} · {student.programme}
                      </p>
                    </div>
                    <span className={cn(
                      'px-1.5 py-0.5 rounded-md text-[10px] font-semibold flex-shrink-0',
                      student.cycle === 'FYP1' ? 'bg-info-50 text-info-700' : 'bg-accent-50 text-accent-700'
                    )}>
                      {student.cycle}
                    </span>
                  </div>

                  <p className="text-[11px] text-neutral-600 truncate mt-0.5">{student.email}</p>

                  <div className="flex items-center gap-2 mt-1 text-[10px] text-neutral-500 flex-wrap">
                    <span className="inline-flex items-center gap-0.5">
                      <SendHorizonal className="h-3 w-3" />
                      {student.requestsSent} sent
                    </span>
                    {student.requestsRejected > 0 && (
                      <span className="text-error-600">{student.requestsRejected} rejected</span>
                    )}
                    {student.lastRequestAt && (
                      <span className="inline-flex items-center gap-0.5">
                        <Calendar className="h-3 w-3" />
                        {new Date(student.lastRequestAt).toLocaleDateString('en-MY', { day: 'numeric', month: 'short' })}
                      </span>
                    )}
                  </div>

                  {student.preferredAreas && student.preferredAreas.length > 0 && (
                    <div className="mt-1 flex items-center gap-1 flex-wrap">
                      {student.preferredAreas.slice(0, 3).map((area) => (
                        <span key={area} className="px-1 py-0 bg-neutral-100 text-neutral-600 rounded text-[10px]">
                          {area}
                        </span>
                      ))}
                      {student.preferredAreas.length > 3 && (
                        <span className="text-[10px] text-neutral-400">+{student.preferredAreas.length - 3}</span>
                      )}
                    </div>
                  )}
                </div>

                <Button variant="secondary" size="sm" className="flex-shrink-0 whitespace-nowrap">
                  <Mail className="h-3.5 w-3.5 mr-1" />
                  Email
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="text-center py-8">
          <UserX className="h-10 w-10 text-neutral-300 mx-auto mb-2" />
          <h3 className="font-medium text-neutral-900 mb-1">
            {searchQuery || cycleFilter !== 'ALL' ? 'No students found' : 'All students are paired!'}
          </h3>
          <p className="text-sm text-neutral-500">
            {searchQuery || cycleFilter !== 'ALL'
              ? 'Try adjusting your filters'
              : 'There are no unpaired students at this time'}
          </p>
        </Card>
      )}
    </div>
  )
}
