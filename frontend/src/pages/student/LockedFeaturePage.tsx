import { Link } from 'react-router-dom'
import { Lock, Users, Sparkles, Send, ArrowRight } from 'lucide-react'
import { Card, Button } from '@/components/ui'
import { ROUTES } from '@/lib/constants/routes'
import { useStudentRegistrationGate } from '@/lib/hooks/useStudentRegistrationGate'

export function LockedFeaturePage() {
  const { status } = useStudentRegistrationGate()

  const headline =
    status === 'SUPERVISOR_PENDING'
      ? "Waiting for your supervisor's response"
      : 'Find a supervisor first'

  const body =
    status === 'SUPERVISOR_PENDING'
      ? 'You have a pending supervision request. Once your supervisor accepts it, this section will unlock.'
      : 'This part of the system opens once you have been paired with a supervisor. Browse the supervisor directory or check the AI recommendations to start your FYP.'

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="text-center py-12 px-6">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-neutral-100 flex items-center justify-center">
          <Lock className="h-8 w-8 text-neutral-500" />
        </div>
        <h1 className="text-2xl font-bold text-neutral-900 mb-2">{headline}</h1>
        <p className="text-neutral-600 max-w-md mx-auto mb-8">{body}</p>

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

        <Link to={ROUTES.STUDENT.DASHBOARD}>
          <Button variant="ghost" rightIcon={<ArrowRight className="h-4 w-4" />}>
            Back to Dashboard
          </Button>
        </Link>
      </Card>
    </div>
  )
}
