import { Link } from 'react-router-dom'
import { Lock, Users, Sparkles, Send, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react'
import { Card, Button } from '@/components/ui'
import { ROUTES } from '@/lib/constants/routes'
import { useStudentRegistrationGate } from '@/lib/hooks/useStudentRegistrationGate'

export type LockedFeatureReason =
  | 'AWAITING_SUPERVISOR'
  | 'ALREADY_REGISTERED'
  | 'CYCLE_ENDED'

interface LockedFeaturePageProps {
  /** Override the auto-detected reason — useful when a route knows why it's locked. */
  reason?: LockedFeatureReason
  /** Optional title override, takes precedence over the reason-derived headline. */
  title?: string
  /** Optional body override. */
  message?: string
}

interface LockedCopy {
  headline: string
  body: string
  iconBg: string
  Icon: typeof Lock
  iconColor: string
  /** Whether to show the three discovery shortcut tiles. */
  showDiscoveryShortcuts: boolean
}

function copyForReason(reason: LockedFeatureReason, status: string | undefined): LockedCopy {
  if (reason === 'CYCLE_ENDED') {
    return {
      headline: 'Your FYP cycle has ended',
      body:
        'Your enrolled cycle has been completed or archived by the FYP committee. Your records are still available to view, but new submissions are disabled.',
      iconBg: 'bg-warning-100',
      iconColor: 'text-warning-600',
      Icon: AlertCircle,
      showDiscoveryShortcuts: false,
    }
  }
  if (reason === 'ALREADY_REGISTERED') {
    return {
      headline: 'You are already paired with a supervisor',
      body:
        'This page is part of the supervisor-discovery flow and is no longer available now that your supervision is confirmed. You can manage your project from the Dashboard, Proposal, Meetings, and Documents sections.',
      iconBg: 'bg-success-100',
      iconColor: 'text-success-600',
      Icon: CheckCircle,
      showDiscoveryShortcuts: false,
    }
  }
  // AWAITING_SUPERVISOR
  const awaiting = status === 'SUPERVISOR_PENDING'
  return {
    headline: awaiting ? "Waiting for your supervisor's response" : 'Find a supervisor first',
    body: awaiting
      ? 'You have a pending supervision request. Once your supervisor accepts it, this section will unlock.'
      : 'This part of the system opens once you have been paired with a supervisor. Browse the supervisor directory or check the AI recommendations to start your FYP.',
    iconBg: 'bg-neutral-100',
    iconColor: 'text-neutral-500',
    Icon: Lock,
    showDiscoveryShortcuts: true,
  }
}

export function LockedFeaturePage({ reason, title, message }: LockedFeaturePageProps = {}) {
  const { status, isRegistered, cycleActive } = useStudentRegistrationGate()
  const resolvedReason: LockedFeatureReason =
    reason ?? (cycleActive === false ? 'CYCLE_ENDED'
      : isRegistered ? 'ALREADY_REGISTERED'
      : 'AWAITING_SUPERVISOR')
  const copy = copyForReason(resolvedReason, status)
  const Icon = copy.Icon

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="text-center py-12 px-6">
        <div className={`w-16 h-16 mx-auto mb-4 rounded-full ${copy.iconBg} flex items-center justify-center`}>
          <Icon className={`h-8 w-8 ${copy.iconColor}`} />
        </div>
        <h1 className="text-2xl font-bold text-neutral-900 mb-2">{title ?? copy.headline}</h1>
        <p className="text-neutral-600 max-w-md mx-auto mb-8">{message ?? copy.body}</p>

        {copy.showDiscoveryShortcuts && (
          <div className="grid sm:grid-cols-3 gap-3 mb-6">
            <Link to={ROUTES.STUDENT.SUPERVISORS}>
              <div className="bg-white border border-neutral-200 rounded-xl p-4 text-center hover:border-primary-300 hover:shadow-md transition-all group cursor-pointer">
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-2 group-hover:bg-primary-600 transition-colors">
                  <Users className="h-5 w-5 text-primary-600 group-hover:text-white transition-colors" />
                </div>
                <p className="font-medium text-neutral-900 text-sm">Find Supervisor</p>
              </div>
            </Link>
            <Link to={ROUTES.STUDENT.RECOMMENDATIONS}>
              <div className="bg-white border border-neutral-200 rounded-xl p-4 text-center hover:border-primary-300 hover:shadow-md transition-all group cursor-pointer">
                <div className="w-10 h-10 bg-warning-100 rounded-lg flex items-center justify-center mx-auto mb-2 group-hover:bg-warning-600 transition-colors">
                  <Sparkles className="h-5 w-5 text-warning-600 group-hover:text-white transition-colors" />
                </div>
                <p className="font-medium text-neutral-900 text-sm">AI Recommendations</p>
              </div>
            </Link>
            <Link to={ROUTES.STUDENT.MY_REQUESTS}>
              <div className="bg-white border border-neutral-200 rounded-xl p-4 text-center hover:border-primary-300 hover:shadow-md transition-all group cursor-pointer">
                <div className="w-10 h-10 bg-info-100 rounded-lg flex items-center justify-center mx-auto mb-2 group-hover:bg-info-600 transition-colors">
                  <Send className="h-5 w-5 text-info-600 group-hover:text-white transition-colors" />
                </div>
                <p className="font-medium text-neutral-900 text-sm">My Requests</p>
              </div>
            </Link>
          </div>
        )}

        <Link to={ROUTES.STUDENT.DASHBOARD}>
          <Button variant="ghost" rightIcon={<ArrowRight className="h-4 w-4" />}>
            Back to Dashboard
          </Button>
        </Link>
      </Card>
    </div>
  )
}
