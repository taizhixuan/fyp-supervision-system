import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  CalendarCheck,
  ClipboardList,
  Compass,
  FileCheck,
  FileText,
  GraduationCap,
  HelpCircle,
  Mail,
  Search,
  Sparkles,
  Trophy,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui'
import { useAuth } from '@/lib/auth/useAuth'
import { ROUTES } from '@/lib/constants/routes'

const ROLE_GUIDES = [
  {
    icon: GraduationCap,
    title: 'For Students',
    intro: 'From topic browsing to final defence — your supervised research, end to end.',
    accent: 'from-amber-500 to-orange-500',
    badge: 'bg-amber-50 text-amber-700',
    steps: [
      'Browse approved supervisor-led topics or get AI-powered recommendations.',
      'Send a supervision request and align on scope with your supervisor.',
      'Submit a formal proposal for committee review and iterate on feedback.',
      'Log meetings, upload reports, and track progress through FYP1 and FYP2.',
    ],
  },
  {
    icon: Users,
    title: 'For Supervisors',
    intro: 'Post topics, manage your supervisees, and review submissions in one place.',
    accent: 'from-blue-500 to-indigo-500',
    badge: 'bg-blue-50 text-blue-700',
    steps: [
      'Publish project topics for the committee to approve and students to browse.',
      'Review supervision requests and accept students within your quota.',
      'Schedule meetings, sign supervision logs, and give feedback on proposals.',
      'Assess interim and final reports submitted by your supervisees.',
    ],
  },
  {
    icon: ClipboardList,
    title: 'For Committee',
    intro: 'Oversee the FYP lifecycle — cycles, deadlines, pairings, and reports.',
    accent: 'from-emerald-500 to-teal-500',
    badge: 'bg-emerald-50 text-emerald-700',
    steps: [
      'Configure FYP cycles, deadlines, and post faculty-wide announcements.',
      'Approve supervisor topics and review submitted student proposals.',
      'Monitor pairing status, supervisor workload, and unpaired students.',
      'Generate reports for academic boards and the dean.',
    ],
  },
]

const JOURNEY_STEPS = [
  {
    icon: Compass,
    title: 'Register',
    description: 'Sign up with your MMU credentials. The committee approves new accounts within 1–2 business days.',
  },
  {
    icon: Search,
    title: 'Find a Supervisor',
    description: 'Browse approved topics, compare expertise, or use the AI recommender to shortlist supervisors.',
  },
  {
    icon: FileText,
    title: 'Submit a Proposal',
    description: 'Draft your proposal in the workspace, run an AI quality check, and submit for committee review.',
  },
  {
    icon: CalendarCheck,
    title: 'Meet & Log Progress',
    description: 'Schedule supervision meetings, capture discussion notes, and let your supervisor sign each log.',
  },
  {
    icon: FileCheck,
    title: 'Submit Reports',
    description: 'Upload deliverables for each milestone — interim FYP1 report, then your final FYP2 report.',
  },
  {
    icon: Trophy,
    title: 'Complete FYP',
    description: 'Pass FYP1 to advance, then present and submit your final outcomes for FYP2 assessment.',
  },
]

const HIGHLIGHTS = [
  {
    icon: Bot,
    title: 'AI assistance throughout',
    description: 'Supervisor matching, proposal scoring, and a contextual chatbot — built into the platform.',
  },
  {
    icon: Sparkles,
    title: 'Single source of truth',
    description: 'Topics, requests, meetings, logs, documents, and decisions all live in one auditable record.',
  },
  {
    icon: HelpCircle,
    title: 'Guided every step',
    description: 'Deadlines, reminders, and status banners surface what to do next — no more guesswork.',
  },
]

export function HelpFaqPage() {
  const { isAuthenticated } = useAuth()

  const content = (
    <div className="max-w-6xl mx-auto">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-stone-800 to-stone-900 mb-12 sm:mb-16 px-6 sm:px-12 py-12 sm:py-16 text-white">
        <div className="absolute -top-32 -right-32 w-80 h-80 bg-amber-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-blue-500/15 rounded-full blur-3xl" />
        <div className="relative max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 border border-white/15 rounded-full text-xs font-medium text-amber-200 mb-5">
            <Sparkles className="h-3.5 w-3.5" />
            Help & Resources
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 tracking-tight">
            How the FYP Supervision System works
          </h1>
          <p className="text-stone-300 text-base sm:text-lg leading-relaxed">
            Everything you need to navigate your FYP journey at FCI — from finding the right
            supervisor to your final defence.
          </p>
        </div>
      </section>

      {/* Role Guides */}
      <section className="mb-16">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-stone-800 mb-2">Find your starting point</h2>
          <p className="text-stone-600">Choose the guide that matches your role on the platform.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {ROLE_GUIDES.map(({ icon: Icon, title, intro, accent, badge, steps }) => (
            <div
              key={title}
              className="bg-white rounded-2xl border border-stone-200 p-6 hover:border-stone-300 hover:shadow-lg hover:-translate-y-0.5 transition-all"
            >
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${accent} text-white flex items-center justify-center mb-5 shadow-md`}>
                <Icon className="h-7 w-7" />
              </div>
              <h3 className="text-lg font-semibold text-stone-800 mb-1">{title}</h3>
              <p className="text-sm text-stone-500 mb-5 leading-relaxed">{intro}</p>
              <ol className="space-y-3">
                {steps.map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm text-stone-600">
                    <span className={`flex-shrink-0 w-6 h-6 rounded-full ${badge} font-semibold flex items-center justify-center text-xs`}>
                      {i + 1}
                    </span>
                    <span className="leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </section>

      {/* Journey Timeline */}
      <section className="mb-16">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-stone-800 mb-2">The FYP journey</h2>
          <p className="text-stone-600">A six-step path from sign-up to final submission.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {JOURNEY_STEPS.map(({ icon: Icon, title, description }, index) => (
            <div
              key={title}
              className="relative bg-white rounded-2xl border border-stone-200 p-6 group hover:border-amber-300 hover:shadow-md transition-all"
            >
              <div className="absolute -top-3 -left-3 w-9 h-9 bg-stone-800 text-white rounded-full font-bold flex items-center justify-center text-sm shadow-md group-hover:bg-amber-600 transition-colors">
                {index + 1}
              </div>
              <div className="w-11 h-11 rounded-xl bg-stone-100 group-hover:bg-amber-50 flex items-center justify-center mb-4 transition-colors">
                <Icon className="h-5 w-5 text-stone-700 group-hover:text-amber-600 transition-colors" />
              </div>
              <h3 className="font-semibold text-stone-800 mb-2">{title}</h3>
              <p className="text-sm text-stone-600 leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why This Platform */}
      <section className="mb-16">
        <div className="rounded-3xl bg-gradient-to-br from-stone-100 to-stone-50 border border-stone-200 px-6 sm:px-10 py-10">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-stone-800 mb-2">What you get</h2>
            <p className="text-stone-600">Three things that make supervision easier than email and spreadsheets.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {HIGHLIGHTS.map(({ icon: Icon, title, description }) => (
              <div key={title} className="bg-white rounded-2xl p-6 border border-stone-200">
                <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-stone-800 mb-2">{title}</h3>
                <p className="text-sm text-stone-600 leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Support */}
      <section>
        <div className="bg-white border border-stone-200 rounded-2xl p-8 sm:p-10 relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-amber-100 rounded-full blur-3xl opacity-40" />
          <div className="relative grid grid-cols-1 md:grid-cols-5 gap-8 items-center">
            <div className="md:col-span-3">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-full text-xs font-semibold mb-4">
                <HelpCircle className="h-3.5 w-3.5" />
                Still need help?
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-stone-800 mb-3">
                Reach out to the FYP Committee
              </h2>
              <p className="text-stone-600 leading-relaxed">
                For policy questions, deadline extensions, or anything you can't resolve in the
                app, the committee responds within 1–2 business days.
              </p>
            </div>
            <div className="md:col-span-2">
              <a
                href="mailto:fyp-committee@mmu.edu.my"
                className="flex items-center gap-3 px-5 py-4 bg-stone-50 hover:bg-white border border-stone-200 hover:border-amber-300 rounded-xl transition-all group"
              >
                <div className="w-11 h-11 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors">
                  <Mail className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-stone-500 mb-0.5">Email the committee</div>
                  <div className="text-sm font-semibold text-stone-800 truncate">fyp-committee@mmu.edu.my</div>
                </div>
                <ArrowRight className="h-4 w-4 text-stone-400 group-hover:text-amber-600 transition-colors" />
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  )

  // Authenticated users view this through AppShell
  if (isAuthenticated) {
    return content
  }

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      <header className="bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link
            to={ROUTES.HOME}
            className="flex items-center gap-2 text-sm text-stone-600 hover:text-stone-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
          <Link to={ROUTES.LOGIN}>
            <Button variant="primary" size="sm">
              Log In
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 px-4 py-10 sm:py-14">{content}</main>

      <footer className="bg-stone-900 text-white py-6 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-stone-400 text-sm">
            &copy; {new Date().getFullYear()} Faculty of Computing and Informatics, Multimedia
            University. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
