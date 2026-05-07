import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  FolderKanban,
  Search,
  Users,
  UserX,
  AlertTriangle,
  ChevronRight,
  Download,
  GraduationCap,
  User,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import { useProjectOverview } from '@/lib/hooks/useCommittee'
import { ROUTES } from '@/lib/constants/routes'
import { cn } from '@/lib/utils/cn'
import type { CommitteeProjectStatus, PairingStatus } from '@/types'

const projectStatusConfig: Record<CommitteeProjectStatus, { label: string; color: string; bgColor: string }> = {
  NOT_STARTED: { label: 'Not Started', color: 'text-stone-600', bgColor: 'bg-stone-100' },
  IN_PROGRESS: { label: 'In Progress', color: 'text-sky-600', bgColor: 'bg-sky-100' },
  COMPLETED: { label: 'Completed', color: 'text-emerald-600', bgColor: 'bg-emerald-100' },
  ON_HOLD: { label: 'On Hold', color: 'text-amber-600', bgColor: 'bg-amber-100' },
  CANCELLED: { label: 'Cancelled', color: 'text-rose-600', bgColor: 'bg-rose-100' },
}

const pairingStatusConfig: Record<PairingStatus, { label: string; color: string; bgColor: string }> = {
  UNPAIRED: { label: 'Unpaired', color: 'text-rose-600', bgColor: 'bg-rose-100' },
  PENDING_APPROVAL: { label: 'Pending', color: 'text-amber-600', bgColor: 'bg-amber-100' },
  PAIRED: { label: 'Paired', color: 'text-emerald-600', bgColor: 'bg-emerald-100' },
}

const riskConfig = {
  LOW: { label: 'Low Risk', color: 'text-emerald-600', bgColor: 'bg-emerald-100' },
  MEDIUM: { label: 'Medium Risk', color: 'text-amber-600', bgColor: 'bg-amber-100' },
  HIGH: { label: 'High Risk', color: 'text-rose-600', bgColor: 'bg-rose-100' },
}

export function ProjectOverview() {
  const [searchQuery, setSearchQuery] = useState('')
  const [cycleFilter, setCycleFilter] = useState<'FYP1' | 'FYP2' | 'ALL'>('ALL')
  const [statusFilter, setStatusFilter] = useState<CommitteeProjectStatus | 'ALL'>('ALL')
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
      {/* Header - Gradient Style */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-stone-800 via-stone-800 to-stone-900 p-6 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-stone-600/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-14 h-14 bg-amber-500/20 rounded-xl flex items-center justify-center ring-1 ring-amber-500/30">
              <FolderKanban className="h-7 w-7 text-amber-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Project & Pairing Overview</h1>
              <p className="text-stone-300 mt-1">
                Monitor all FYP projects and student-supervisor pairings
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link to={ROUTES.COMMITTEE.UNPAIRED_STUDENTS}>
              <Button variant="secondary" className="border-stone-600 text-stone-200 hover:bg-stone-700">
                <UserX className="h-4 w-4 mr-2" />
                Unpaired ({stats.unpaired})
              </Button>
            </Link>
            <Link to={ROUTES.COMMITTEE.EXPORT_OVERVIEW}>
              <Button className="bg-amber-500 hover:bg-amber-600 text-white">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 text-center border-l-4 border-l-stone-400">
          <p className="text-3xl font-bold text-stone-800">{stats.total}</p>
          <p className="text-sm text-stone-600 font-medium">Total Projects</p>
        </Card>
        <Card className="p-4 text-center border-l-4 border-l-emerald-500">
          <p className="text-3xl font-bold text-emerald-600">{stats.paired}</p>
          <p className="text-sm text-stone-600 font-medium">Paired Students</p>
        </Card>
        <Card className="p-4 text-center border-l-4 border-l-rose-500">
          <p className="text-3xl font-bold text-rose-600">{stats.unpaired}</p>
          <p className="text-sm text-stone-600 font-medium">Unpaired Students</p>
        </Card>
        <Card className="p-4 text-center border-l-4 border-l-amber-500">
          <p className="text-3xl font-bold text-amber-600">{stats.highRisk}</p>
          <p className="text-sm text-stone-600 font-medium">High Risk</p>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4 bg-gradient-to-r from-stone-100 to-stone-50">
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
              className="px-3 py-2 border border-stone-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 bg-white"
            >
              <option value="ALL">All Cycles</option>
              <option value="FYP1">FYP1</option>
              <option value="FYP2">FYP2</option>
            </select>
            <select
              value={pairingFilter}
              onChange={(e) => setPairingFilter(e.target.value as PairingStatus | 'ALL')}
              className="px-3 py-2 border border-stone-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 bg-white"
            >
              <option value="ALL">All Pairing Status</option>
              <option value="PAIRED">Paired</option>
              <option value="UNPAIRED">Unpaired</option>
              <option value="PENDING_APPROVAL">Pending</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as CommitteeProjectStatus | 'ALL')}
              className="px-3 py-2 border border-stone-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 bg-white"
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
          <Button variant="secondary" size="sm" className="border-stone-300 hover:bg-stone-100">
            <Users className="h-4 w-4 mr-2" />
            Supervisor Load Analysis
          </Button>
        </Link>
      </div>

      {/* Projects List */}
      <div className="flex flex-col gap-4">
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
                <Card className="group p-4 hover:shadow-lg transition-all duration-300 cursor-pointer border-l-4 border-l-stone-300">
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
                            project.progress >= 70 ? 'text-emerald-500' :
                            project.progress >= 40 ? 'text-amber-500' : 'text-rose-500'
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
                          <h3 className="font-semibold text-stone-800 line-clamp-1 group-hover:text-amber-700 transition-colors">
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
                        <ChevronRight className="h-5 w-5 text-stone-300 group-hover:text-amber-500 group-hover:translate-x-1 transition-all flex-shrink-0" />
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
            <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FolderKanban className="h-8 w-8 text-stone-400" />
            </div>
            <h3 className="text-lg font-semibold text-stone-800">No projects found</h3>
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
        <Card className="p-4 bg-gradient-to-r from-stone-100 to-stone-50">
          <div className="flex items-center justify-between text-sm">
            <span className="text-stone-600 font-medium">
              Showing {filteredProjects?.length ?? 0} of {data.total} projects
            </span>
            <div className="flex items-center gap-4 font-medium">
              <span className="text-sky-600">
                {data.projects.filter((p) => p.cycle === 'FYP1').length} FYP1
              </span>
              <span className="text-violet-600">
                {data.projects.filter((p) => p.cycle === 'FYP2').length} FYP2
              </span>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
