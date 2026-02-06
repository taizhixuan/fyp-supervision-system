import { Calendar, MapPin, Hash, Users, GraduationCap } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { MeetingMode, FYPPhase } from '@/types/meetingLog'

interface MeetingLogHeaderProps {
  data: {
    meetingDate: string
    meetingNumber: number
    meetingMode: MeetingMode
    projectTitle: string
    fypPhase: FYPPhase
    student: {
      fullName: string
      matricNo: string
      programme: string
    }
    supervisor: {
      fullName: string
      title?: string
    }
    coSupervisor?: {
      name: string
    }
  }
  className?: string
}

/**
 * MMU FCI Meeting Log Header component
 * Displays meeting metadata and participant information
 */
export function MeetingLogHeader({ data, className }: MeetingLogHeaderProps) {
  const formattedDate = new Date(data.meetingDate).toLocaleDateString('en-MY', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className={cn('space-y-6', className)}>
      {/* MMU Header Banner */}
      <div className="bg-gradient-to-r from-primary-800 to-primary-900 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">MULTIMEDIA UNIVERSITY</h1>
            <p className="text-primary-200 text-sm mt-1">
              Faculty of Computing and Informatics
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">MEETING LOG</div>
            <div className="text-primary-200 text-sm">{data.fypPhase}</div>
          </div>
        </div>
      </div>

      {/* Meeting Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Meeting Number */}
        <div className="bg-stone-50 rounded-lg p-4">
          <div className="flex items-center gap-2 text-stone-600 mb-1">
            <Hash className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wide">Meeting No.</span>
          </div>
          <div className="text-2xl font-bold text-stone-900">{data.meetingNumber}</div>
        </div>

        {/* Meeting Date */}
        <div className="bg-stone-50 rounded-lg p-4">
          <div className="flex items-center gap-2 text-stone-600 mb-1">
            <Calendar className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wide">Date</span>
          </div>
          <div className="text-sm font-semibold text-stone-900">{formattedDate}</div>
        </div>

        {/* Meeting Mode */}
        <div className="bg-stone-50 rounded-lg p-4">
          <div className="flex items-center gap-2 text-stone-600 mb-1">
            <MapPin className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wide">Mode</span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'px-2 py-1 rounded-full text-xs font-semibold',
                data.meetingMode === 'PHYSICAL'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-blue-100 text-blue-700'
              )}
            >
              {data.meetingMode === 'PHYSICAL' ? 'Physical' : 'Online'}
            </span>
          </div>
        </div>

        {/* FYP Phase */}
        <div className="bg-stone-50 rounded-lg p-4">
          <div className="flex items-center gap-2 text-stone-600 mb-1">
            <GraduationCap className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wide">Phase</span>
          </div>
          <div className="text-lg font-bold text-stone-900">{data.fypPhase}</div>
        </div>
      </div>

      {/* Project Title */}
      <div className="bg-primary-50 border border-primary-100 rounded-lg p-4">
        <div className="text-xs font-medium uppercase tracking-wide text-primary-600 mb-1">
          Project Title
        </div>
        <div className="text-lg font-semibold text-primary-900">{data.projectTitle}</div>
      </div>

      {/* Participants */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Student Info */}
        <div className="border border-neutral-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-neutral-600 mb-3">
            <Users className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wide">Student</span>
          </div>
          <div className="space-y-1">
            <div className="font-semibold text-neutral-900">{data.student.fullName}</div>
            <div className="text-sm text-neutral-600">
              Matric No: <span className="font-medium">{data.student.matricNo}</span>
            </div>
            <div className="text-sm text-neutral-600">
              Programme: <span className="font-medium">{data.student.programme}</span>
            </div>
          </div>
        </div>

        {/* Supervisor Info */}
        <div className="border border-neutral-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-neutral-600 mb-3">
            <GraduationCap className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wide">Supervisor(s)</span>
          </div>
          <div className="space-y-2">
            <div>
              <div className="font-semibold text-neutral-900">
                {data.supervisor.title && `${data.supervisor.title} `}
                {data.supervisor.fullName}
              </div>
              <div className="text-xs text-neutral-500">Main Supervisor</div>
            </div>
            {data.coSupervisor && (
              <div className="pt-2 border-t border-neutral-100">
                <div className="font-medium text-neutral-800">{data.coSupervisor.name}</div>
                <div className="text-xs text-neutral-500">Co-Supervisor</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

interface MeetingLogHeaderCompactProps {
  meetingNumber: number
  meetingDate: string
  meetingMode: MeetingMode
  fypPhase: FYPPhase
  className?: string
}

/**
 * Compact version of meeting log header for list views
 */
export function MeetingLogHeaderCompact({
  meetingNumber,
  meetingDate,
  meetingMode,
  fypPhase,
  className,
}: MeetingLogHeaderCompactProps) {
  return (
    <div className={cn('flex items-center gap-4 text-sm', className)}>
      <div className="flex items-center gap-1.5 text-neutral-600">
        <Hash className="h-4 w-4" />
        <span className="font-semibold">{meetingNumber}</span>
      </div>
      <div className="flex items-center gap-1.5 text-neutral-600">
        <Calendar className="h-4 w-4" />
        <span>{new Date(meetingDate).toLocaleDateString('en-MY')}</span>
      </div>
      <span
        className={cn(
          'px-2 py-0.5 rounded-full text-xs font-medium',
          meetingMode === 'PHYSICAL'
            ? 'bg-emerald-100 text-emerald-700'
            : 'bg-blue-100 text-blue-700'
        )}
      >
        {meetingMode === 'PHYSICAL' ? 'Physical' : 'Online'}
      </span>
      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-700">
        {fypPhase}
      </span>
    </div>
  )
}
