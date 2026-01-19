import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  FolderKanban,
  Search,
  Filter,
  Users,
  UserX,
  AlertTriangle,
  ChevronRight,
  Download,
  GraduationCap,
  User,
  TrendingUp,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import { useProjectOverview } from '@/lib/hooks/useCommittee'
import { ROUTES } from '@/lib/constants/routes'
import { cn } from '@/lib/utils/cn'
import type { ProjectStatus, PairingStatus } from '@/types'

const projectStatusConfig: Record<ProjectStatus, { label: string; color: string; bgColor: string }> = {
  NOT_STARTED: { label: 'Not Started', color: 'text-neutral-600', bgColor: 'bg-neutral-100' },
  IN_PROGRESS: { label: 'In Progress', color: 'text-info-600', bgColor: 'bg-info-50' },
  COMPLETED: { label: 'Completed', color: 'text-success-600', bgColor: 'bg-success-50' },
  ON_HOLD: { label: 'On Hold', color: 'text-warning-600', bgColor: 'bg-warning-50' },
  CANCELLED: { label: 'Cancelled', color: 'text-error-600', bgColor: 'bg-error-50' },
}

const pairingStatusConfig: Record<PairingStatus, { label: string; color: string; bgColor: string }> = {
  UNPAIRED: { label: 'Unpaired', color: 'text-error-600', bgColor: 'bg-error-50' },
  PENDING_APPROVAL: { label: 'Pending', color: 'text-warning-600', bgColor: 'bg-warning-50' },
  PAIRED: { label: 'Paired', color: 'text-success-600', bgColor: 'bg-success-50' },
}

const riskConfig = {
  LOW: { label: 'Low Risk', color: 'text-success-600', bgColor: 'bg-success-50' },
  MEDIUM: { label: 'Medium Risk', color: 'text-warning-600', bgColor: 'bg-warning-50' },
  HIGH: { label: 'High Risk', color: 'text-error-600', bgColor: 'bg-error-50' },
}

export function ProjectOverview() {
  const [searchQuery, setSearchQuery] = useState('')
  const [cycleFilter, setCycleFilter] = useState<'FYP1' | 'FYP2' | 'ALL'>('ALL')
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'ALL'>('ALL')
  const [pairingFilter, setPairingFilter] = useState<PairingStatus | 'ALL'>('ALL')

  const { data, isLoading } = useProjectOverview({
    cycle: cycleFilter !== 'ALL' ? cycleFilter : undefined,
    status: statusFilter !== 'ALL' ? statusFilter : undefined,
    pairingStatus: pairingFilter !== 'ALL' ? pairingFilter : undefined,
  })

  const filteredProjects = data?.projects.filter((project) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      project.title.toLowerCase().includes(query) ||
      project.studentName.toLowerCase().includes(query) ||
      project.studentId.toLowerCase().includes(query) ||
      project.supervisorName?.toLowerCase().includes(query)
    )
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    )
  }

  const stats = {
    total: data?.projects.length ?? 0,
    paired: data?.projects.filter((p) => p.pairingStatus === 'PAIRED').length ?? 0,
    unpaired: data?.projects.filter((p) => p.pairingStatus === 'UNPAIRED').length ?? 0,
    highRisk: data?.projects.filter((p) => p.riskLevel === 'HIGH').length ?? 0,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
            <FolderKanban className="h-7 w-7 text-primary-600" />
            Project & Pairing Overview
          </h1>
          <p className="text-neutral-600 mt-1">
            Monitor all FYP projects and student-supervisor pairings
          </p>
        </div>
        <div className="flex gap-2">
          <Link to={ROUTES.COMMITTEE.UNPAIRED_STUDENTS}>
            <Button variant="outline">
              <UserX className="h-4 w-4 mr-2" />
              Unpaired Students ({stats.unpaired})
            </Button>
          </Link>
          <Link to={ROUTES.COMMITTEE.EXPORT_OVERVIEW}>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <p className="text-3xl font-bold text-neutral-900">{stats.total}</p>
          <p className="text-sm text-neutral-500">Total Projects</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-3xl font-bold text-success-600">{stats.paired}</p>
          <p className="text-sm text-neutral-500">Paired Students</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-3xl font-bold text-error-600">{stats.unpaired}</p>
          <p className="text-sm text-neutral-500">Unpaired Students</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-3xl font-bold text-warning-600">{stats.highRisk}</p>
          <p className="text-sm text-neutral-500">High Risk</p>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <Input
              type="text"
              placeholder="Search by title, student, or supervisor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={cycleFilter}
              onChange={(e) => setCycleFilter(e.target.value as 'FYP1' | 'FYP2' | 'ALL')}
              className="px-3 py-2 border border-neutral-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500"
            >
              <option value="ALL">All Cycles</option>
              <option value="FYP1">FYP1</option>
              <option value="FYP2">FYP2</option>
            </select>
            <select
              value={pairingFilter}
              onChange={(e) => setPairingFilter(e.target.value as PairingStatus | 'ALL')}
              className="px-3 py-2 border border-neutral-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500"
            >
              <option value="ALL">All Pairing Status</option>
              <option value="PAIRED">Paired</option>
              <option value="UNPAIRED">Unpaired</option>
              <option value="PENDING_APPROVAL">Pending</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ProjectStatus | 'ALL')}
              className="px-3 py-2 border border-neutral-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500"
            >
              <option value="ALL">All Status</option>
              <option value="NOT_STARTED">Not Started</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="ON_HOLD">On Hold</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Quick Links */}
      <div className="flex gap-3">
        <Link to={ROUTES.COMMITTEE.SUPERVISOR_LOAD}>
          <Button variant="outline" size="sm">
            <Users className="h-4 w-4 mr-2" />
            Supervisor Load Analysis
          </Button>
        </Link>
      </div>

      {/* Projects List */}
      <div className="space-y-3">
        {filteredProjects && filteredProjects.length > 0 ? (
          filteredProjects.map((project) => {
            const pairingStatus = pairingStatusConfig[project.pairingStatus]
            const projectStatus = projectStatusConfig[project.projectStatus]
            const risk = riskConfig[project.riskLevel]

            return (
              <Link
                key={project.projectId}
                to={ROUTES.COMMITTEE.PROJECT_DETAIL.replace(':id', String(project.projectId))}
              >
                <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-center gap-4">
                    {/* Progress Circle */}
                    <div className="relative w-14 h-14 flex-shrink-0">
                      <svg className="w-14 h-14 transform -rotate-90">
                        <circle
                          className="text-neutral-200"
                          strokeWidth="4"
                          stroke="currentColor"
                          fill="transparent"
                          r="24"
                          cx="28"
                          cy="28"
                        />
                        <circle
                          className={cn(
                            project.progress >= 70 ? 'text-success-500' :
                            project.progress >= 40 ? 'text-warning-500' : 'text-error-500'
                          )}
                          strokeWidth="4"
                          strokeDasharray={`${project.progress * 1.51} 151`}
                          strokeLinecap="round"
                          stroke="currentColor"
                          fill="transparent"
                          r="24"
                          cx="28"
                          cy="28"
                        />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold">
                        {project.progress}%
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-semibold text-neutral-900 line-clamp-1">
                            {project.title || 'Untitled Project'}
                          </h3>
                          <div className="flex items-center gap-3 mt-1 text-sm text-neutral-600">
                            <span className="flex items-center gap-1">
                              <GraduationCap className="h-4 w-4" />
                              {project.studentName}
                            </span>
                            {project.supervisorName && (
                              <span className="flex items-center gap-1">
                                <User className="h-4 w-4" />
                                {project.supervisorName}
                              </span>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-neutral-400 flex-shrink-0" />
                      </div>

                      {/* Tags */}
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span className={cn(
                          'px-2 py-0.5 rounded-full text-xs font-medium',
                          pairingStatus.bgColor,
                          pairingStatus.color
                        )}>
                          {pairingStatus.label}
                        </span>
                        <span className={cn(
                          'px-2 py-0.5 rounded-full text-xs font-medium',
                          projectStatus.bgColor,
                          projectStatus.color
                        )}>
                          {projectStatus.label}
                        </span>
                        <span className="px-2 py-0.5 bg-neutral-100 text-neutral-600 rounded-full text-xs font-medium">
                          {project.cycle}
                        </span>
                        <span className="px-2 py-0.5 bg-neutral-100 text-neutral-600 rounded-full text-xs font-medium">
                          {project.programme}
                        </span>
                        {project.riskLevel !== 'LOW' && (
                          <span className={cn(
                            'px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1',
                            risk.bgColor,
                            risk.color
                          )}>
                            <AlertTriangle className="h-3 w-3" />
                            {risk.label}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            )
          })
        ) : (
          <Card className="p-12 text-center">
            <FolderKanban className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-neutral-900">No projects found</h3>
            <p className="text-neutral-500 mt-1">
              {searchQuery || cycleFilter !== 'ALL' || statusFilter !== 'ALL' || pairingFilter !== 'ALL'
                ? 'Try adjusting your filters'
                : 'No projects have been registered yet'}
            </p>
          </Card>
        )}
      </div>

      {/* Summary */}
      {data && data.projects.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-neutral-600">
              Showing {filteredProjects?.length ?? 0} of {data.total} projects
            </span>
            <div className="flex items-center gap-4">
              <span className="text-info-600">
                {data.projects.filter((p) => p.cycle === 'FYP1').length} FYP1
              </span>
              <span className="text-accent-600">
                {data.projects.filter((p) => p.cycle === 'FYP2').length} FYP2
              </span>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
