import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft,
  User,
  Mail,
  GraduationCap,
  AlertTriangle,
  Clock,
  TrendingUp,
  FolderKanban,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { useSupervisorLoadDetail } from '@/lib/hooks/useCommittee'
import { ROUTES } from '@/lib/constants/routes'
import { cn } from '@/lib/utils/cn'

export function SupervisorLoadDetail() {
  const { id } = useParams<{ id: string }>()
  const { data: supervisor, isLoading } = useSupervisorLoadDetail(id!)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!supervisor) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-neutral-900">Supervisor not found</h2>
        <p className="text-neutral-600 mt-2">The supervisor you're looking for doesn't exist.</p>
        <Link to={ROUTES.COMMITTEE.SUPERVISOR_LOAD}>
          <Button className="mt-4">Back to Supervisor Load</Button>
        </Link>
      </div>
    )
  }

  const utilizationColor = supervisor.utilizationRate > 100
    ? 'text-error-600'
    : supervisor.utilizationRate >= 80
      ? 'text-warning-600'
      : 'text-success-600'

  const progressBarColor = supervisor.utilizationRate > 100
    ? 'bg-error-500'
    : supervisor.utilizationRate >= 80
      ? 'bg-warning-500'
      : 'bg-success-500'

  return (
    <div className="space-y-3 lg:space-y-4 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to={ROUTES.COMMITTEE.SUPERVISOR_LOAD}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Supervisor Load
          </Button>
        </Link>
      </div>

      {/* Supervisor Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className={cn(
            'w-16 h-16 rounded-full flex items-center justify-center',
            supervisor.isOverloaded ? 'bg-error-100' : 'bg-primary-100'
          )}>
            <User className={cn(
              'h-8 w-8',
              supervisor.isOverloaded ? 'text-error-600' : 'text-primary-600'
            )} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
              {supervisor.fullName}
              {supervisor.isOverloaded && (
                <span className="px-2 py-0.5 bg-error-50 text-error-700 rounded-full text-sm font-medium">
                  Overloaded
                </span>
              )}
            </h1>
            <p className="text-neutral-600">{supervisor.department}</p>
          </div>
        </div>
      </div>

      {/* Contact & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Contact Info */}
        <Card className="p-4">
          <h3 className="text-sm font-medium text-neutral-500 mb-2">Contact</h3>
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4 text-neutral-400" />
            <a href={`mailto:${supervisor.email}`} className="text-primary-600 hover:underline">
              {supervisor.email}
            </a>
          </div>
        </Card>

        {/* Current Load */}
        <Card className="p-4">
          <h3 className="text-sm font-medium text-neutral-500 mb-2">Current Load</h3>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-neutral-900">
              {supervisor.currentLoad} / {supervisor.maxCapacity}
            </span>
            <span className={cn('text-lg font-medium', utilizationColor)}>
              {Math.round(supervisor.utilizationRate)}%
            </span>
          </div>
          <div className="h-2 bg-neutral-100 rounded-full overflow-hidden mt-2">
            <div
              className={cn('h-full rounded-full transition-all', progressBarColor)}
              style={{ width: `${Math.min(supervisor.utilizationRate, 100)}%` }}
            />
          </div>
        </Card>

        {/* Capacity Breakdown */}
        <Card className="p-4">
          <h3 className="text-sm font-medium text-neutral-500 mb-2">By Cycle</h3>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-info-500" />
              <span className="text-sm">FYP1: {supervisor.fyp1Students}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-accent-500" />
              <span className="text-sm">FYP2: {supervisor.fyp2Students}</span>
            </div>
          </div>
          <p className="text-sm text-neutral-500 mt-2">
            Available slots: {Math.max(0, supervisor.maxCapacity - supervisor.currentLoad)}
          </p>
        </Card>
      </div>

      {/* Expertise */}
      <Card>
        <h3 className="font-semibold text-neutral-900 mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary-600" />
          Expertise Areas
        </h3>
        <div className="flex flex-wrap gap-2">
          {supervisor.expertise.map((area) => (
            <span
              key={area}
              className="px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm font-medium"
            >
              {area}
            </span>
          ))}
        </div>
      </Card>

      {/* Students List */}
      <Card>
        <h3 className="font-semibold text-neutral-900 mb-4 flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-primary-600" />
          Supervised Students ({supervisor.students.length})
        </h3>

        {supervisor.students.length > 0 ? (
          <div className="space-y-3">
            {supervisor.students.map((student) => {
              const progressColor = student.progress >= 70
                ? 'text-success-600'
                : student.progress >= 40
                  ? 'text-warning-600'
                  : 'text-error-600'

              return (
                <Link
                  key={student.studentId}
                  to={ROUTES.COMMITTEE.PROJECT_DETAIL.replace(':id', String(student.projectId))}
                >
                  <div className="p-4 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-neutral-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <GraduationCap className="h-5 w-5 text-neutral-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h4 className="font-medium text-neutral-900">{student.fullName}</h4>
                            <p className="text-sm text-neutral-500">{student.studentId}</p>
                          </div>
                          <div className="text-right">
                            <span className={cn('text-lg font-semibold', progressColor)}>
                              {student.progress}%
                            </span>
                            <p className="text-xs text-neutral-500">Progress</p>
                          </div>
                        </div>
                        <p className="text-sm text-neutral-600 mt-1 line-clamp-1">
                          {student.projectTitle || 'Untitled Project'}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-neutral-500">
                          <span className={cn(
                            'px-2 py-0.5 rounded-full font-medium',
                            student.cycle === 'FYP1' ? 'bg-info-50 text-info-700' : 'bg-accent-50 text-accent-700'
                          )}>
                            {student.cycleCode ?? student.cycle}
                          </span>
                          <span className={cn(
                            'px-2 py-0.5 rounded-full font-medium',
                            student.status === 'ACTIVE' ? 'bg-info-50 text-info-700' :
                            student.status === 'COMPLETED' ? 'bg-success-50 text-success-700' :
                            student.status === 'SUSPENDED' ? 'bg-warning-50 text-warning-700' :
                            student.status === 'DROPPED' ? 'bg-error-50 text-error-700' :
                            'bg-neutral-100 text-neutral-600'
                          )}>
                            {student.status?.replace('_', ' ') || 'Unknown'}
                          </span>
                          {student.lastMeeting && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              Last meeting: {new Date(student.lastMeeting).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <GraduationCap className="h-10 w-10 text-neutral-300 mx-auto mb-2" />
            <p className="text-neutral-500">No students assigned yet</p>
          </div>
        )}
      </Card>

      {/* Warning Card for Overloaded */}
      {supervisor.isOverloaded && (
        <Card className="border-l-4 border-l-error-500 bg-error-50">
          <div className="flex items-start gap-4">
            <AlertTriangle className="h-6 w-6 text-error-600 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-error-800">Supervisor Overloaded</h3>
              <p className="text-sm text-error-700 mt-1">
                This supervisor is currently over their maximum capacity. Consider reassigning
                some students or increasing their capacity if appropriate.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button variant="secondary">
          <Mail className="h-4 w-4 mr-2" />
          Contact Supervisor
        </Button>
        <Link to={ROUTES.COMMITTEE.PROJECTS}>
          <Button variant="secondary">
            <FolderKanban className="h-4 w-4 mr-2" />
            View All Projects
          </Button>
        </Link>
      </div>
    </div>
  )
}
