import { Link } from 'react-router-dom'
import {
  ArrowRight,
  UserPlus,
  FileText,
  FileCheck2,
  Calendar,
  CheckCircle2,
  GraduationCap,
  ClipboardList,
  Sparkles,
  Bot,
  Target,
  TrendingUp,
  Clock,
} from 'lucide-react'
import { Button } from '@/components/ui'
import { ROUTES } from '@/lib/constants/routes'

const FEATURES = [
  {
    icon: Sparkles,
    title: 'AI Supervisor Matching',
    description: 'Get ranked supervisor suggestions with an explainable match score, then send a supervision request.',
  },
  {
    icon: FileCheck2,
    title: 'AI Proposal Analysis',
    description: 'Check your proposal structure, readability, and section coverage before your supervisor reviews it.',
  },
  {
    icon: Bot,
    title: 'FYP Assistant',
    description: 'Ask about deadlines, procedures, and your own project — answers are grounded in the FCI handbook.',
  },
  {
    icon: Calendar,
    title: 'Meetings & Logs',
    description: 'Book supervision sessions and keep signed meeting logs that meet the FCI six-log requirement.',
  },
  {
    icon: FileText,
    title: 'Document Submission',
    description: 'Submit proposals, reports, slides, and source code, organised by FYP 1 and FYP 2 phase.',
  },
  {
    icon: TrendingUp,
    title: 'Progress & Announcements',
    description: 'Follow your status from FYP 1 to FYP 2 with a live dashboard, deadlines, and targeted announcements.',
  },
]

const STAGES = [
  { label: 'Register', sub: 'Sign up & approval', icon: UserPlus },
  { label: 'Match', sub: 'AI supervisor pairing', icon: Target },
  { label: 'Propose', sub: 'Submit & AI review', icon: FileText },
  { label: 'Supervise', sub: 'Meetings & signed logs', icon: ClipboardList },
  { label: 'Complete', sub: 'Final report & slides', icon: GraduationCap },
]

const AI_CHIPS = [
  { icon: Sparkles, label: 'AI Supervisor Match' },
  { icon: FileText, label: 'Proposal Scoring' },
  { icon: Bot, label: 'FYP Chatbot' },
]

export function LandingPage() {
  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-stone-50/90 backdrop-blur-md border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          {/* Logo & Branding */}
          <div className="flex items-center gap-3">
            <img
              src="/logo.svg"
              alt="FYP Supervision System"
              className="h-10 sm:h-12 w-auto"
            />
            <div className="hidden sm:flex flex-col">
              <span className="text-lg font-bold text-stone-800 leading-tight">
                FYP Supervision System
              </span>
              <span className="text-xs text-stone-500 leading-tight">
                Faculty of Computing and Informatics
              </span>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-3 sm:gap-4">
            <Link to={ROUTES.LOGIN}>
              <Button variant="primary" size="sm">
                Log In
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-[#1e3a5f] via-[#172e4d] to-[#0f1f33]">
          {/* Texture overlay */}
          <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noise%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noise)%22/%3E%3C/svg%3E')]" />

          {/* Grid pattern */}
          <div
            aria-hidden
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
              backgroundSize: '48px 48px',
              maskImage:
                'radial-gradient(ellipse at center, black 30%, transparent 75%)',
              WebkitMaskImage:
                'radial-gradient(ellipse at center, black 30%, transparent 75%)',
            }}
          />

          {/* Decorative gradient orbs */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-drift" />
            <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-sky-600/10 rounded-full blur-3xl animate-drift" style={{ animationDelay: '4s' }} />
            <div className="absolute top-1/2 left-1/3 w-72 h-72 bg-blue-800/30 rounded-full blur-3xl animate-drift" style={{ animationDelay: '8s' }} />
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24 lg:py-28">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-10 items-center">
              {/* Left: copy */}
              <div className="text-center lg:text-left animate-fade-in-up">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-blue-200 text-sm font-medium mb-8 border border-white/15">
                  <GraduationCap className="h-4 w-4" />
                  <span>MMU Faculty of Computing and Informatics</span>
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-tight leading-[1.15]">
                  FYP Supervision
                  <span className="block mt-2 pb-2 bg-gradient-to-r from-blue-200 to-sky-300 bg-clip-text text-transparent leading-[1.15]">
                    Management System
                  </span>
                </h1>

                <p className="text-lg sm:text-xl text-blue-100/80 mb-10 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                  The official platform for FCI final year project supervision.
                  Connect with supervisors, track progress from FYP 1 to FYP 2, and manage submissions seamlessly.
                </p>

                <div className="flex flex-col sm:flex-row items-center lg:justify-start justify-center gap-4">
                  <Link to={ROUTES.LOGIN}>
                    <Button
                      size="lg"
                      className="min-w-[180px] bg-white text-[#1e3a5f] hover:bg-blue-50 shadow-lg shadow-black/20 font-semibold dark:!bg-blue-100 dark:!text-[#0b1f3a]"
                    >
                      Log In
                      <ArrowRight className="h-5 w-5 ml-2" />
                    </Button>
                  </Link>
                  <Link to={ROUTES.REGISTER}>
                    <Button
                      variant="secondary"
                      size="lg"
                      className="min-w-[180px] bg-transparent text-white border-white/30 hover:bg-white/10 hover:border-white/50"
                    >
                      Register
                    </Button>
                  </Link>
                </div>

                {/* AI feature chips */}
                <div className="mt-10 flex flex-wrap items-center justify-center lg:justify-start gap-2">
                  {AI_CHIPS.map((chip) => (
                    <span
                      key={chip.label}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.06] border border-white/10 text-xs font-medium text-blue-100/70 backdrop-blur-sm"
                    >
                      <chip.icon className="h-3.5 w-3.5 text-sky-300" />
                      {chip.label}
                    </span>
                  ))}
                </div>
              </div>

              {/* Right: faux dashboard preview */}
              <div className="hidden lg:block relative h-[480px]" aria-hidden>
                {/* glow behind cards */}
                <div className="absolute -inset-4 bg-gradient-to-br from-sky-400/10 via-blue-500/5 to-transparent rounded-[40px] blur-2xl" />

                {/* Card 1: Supervisor Match */}
                <div className="absolute top-0 right-0 w-[340px] -rotate-2 animate-fade-in-up" style={{ animationDelay: '120ms' }}>
                  <div className="animate-float-slow rounded-2xl bg-white/[0.07] backdrop-blur-xl border border-white/15 p-5 shadow-2xl shadow-black/40">
                    <div className="flex items-center justify-between mb-4">
                      <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-sky-400/15 border border-sky-300/30 text-[10px] font-semibold uppercase tracking-wider text-sky-200">
                        <Sparkles className="h-3 w-3" />
                        AI Match
                      </div>
                      <span className="text-[10px] text-blue-200/50 font-mono">#A23</span>
                    </div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-sky-300 to-blue-500 flex items-center justify-center text-[#0f1f33] font-bold text-sm shadow-lg">
                        LW
                      </div>
                      <div>
                        <div className="font-semibold text-white text-sm">Dr. Lee Wei Han</div>
                        <div className="text-xs text-blue-200/60">Machine Learning · NLP</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-blue-200/70 mb-1.5">
                      <span>Match score</span>
                      <span className="font-semibold text-sky-200">92%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full w-[92%] rounded-full bg-gradient-to-r from-sky-300 to-blue-400" />
                    </div>
                  </div>
                </div>

                {/* Card 2: Proposal Status */}
                <div className="absolute top-[180px] left-0 w-[320px] rotate-1 animate-fade-in-up" style={{ animationDelay: '260ms' }}>
                  <div className="animate-float-slower rounded-2xl bg-white/[0.07] backdrop-blur-xl border border-white/15 p-5 shadow-2xl shadow-black/40">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-7 w-7 rounded-full bg-emerald-400/20 border border-emerald-300/30 flex items-center justify-center">
                        <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                      </div>
                      <div className="text-xs font-semibold text-emerald-200">Proposal approved</div>
                    </div>
                    <div className="text-sm font-semibold text-white mb-1 leading-snug">
                      AI-Powered Course Recommender
                    </div>
                    <div className="text-[11px] text-blue-200/55 mb-4">
                      FYP 1 · 3 of 5 milestones
                    </div>
                    <div className="flex items-center gap-1.5">
                      {[true, true, true, false, false].map((done, i) => (
                        <div
                          key={i}
                          className={`h-1.5 flex-1 rounded-full ${
                            done ? 'bg-gradient-to-r from-sky-300 to-blue-400' : 'bg-white/10'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Card 3: Next Meeting */}
                <div className="absolute bottom-0 right-8 w-[290px] -rotate-1 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
                  <div className="animate-float-slow rounded-2xl bg-white/[0.07] backdrop-blur-xl border border-white/15 p-5 shadow-2xl shadow-black/40" style={{ animationDelay: '2s' }}>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-7 w-7 rounded-lg bg-blue-400/20 border border-blue-300/30 flex items-center justify-center">
                        <Calendar className="h-3.5 w-3.5 text-blue-200" />
                      </div>
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-blue-200/70">
                        Next meeting
                      </div>
                    </div>
                    <div className="text-base font-semibold text-white">Tomorrow</div>
                    <div className="text-xs text-blue-200/60 mb-3 inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      2:30 PM · Room CR3-9
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-white/10">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-gradient-to-br from-sky-300 to-blue-500 flex items-center justify-center text-[#0f1f33] font-bold text-[10px]">
                          LW
                        </div>
                        <span className="text-[11px] text-blue-100/80">Dr. Lee Wei Han</span>
                      </div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
                        Confirmed
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-400/30 to-transparent" />
        </section>

        {/* Journey Timeline */}
        <section className="py-14 sm:py-16 px-4 bg-stone-50 border-b border-stone-200">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-10">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">
                Your FYP journey
              </span>
              <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-stone-800">
                From registration to final submission
              </h2>
            </div>

            {/* Desktop: horizontal */}
            <div className="hidden md:block relative">
              <div className="absolute top-7 left-[6%] right-[6%] h-px bg-gradient-to-r from-blue-200 via-blue-400 to-blue-200" />
              <div className="relative grid grid-cols-5">
                {STAGES.map((s, i) => (
                  <div
                    key={s.label}
                    className="relative flex flex-col items-center text-center px-2 animate-fade-in-up"
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    <div className="relative z-10 w-14 h-14 rounded-full bg-white border-2 border-blue-200 flex items-center justify-center shadow-sm shadow-blue-100/60 transition-transform duration-300 hover:-translate-y-1 hover:border-blue-400 hover:shadow-md dark:!bg-blue-100 dark:border-blue-400">
                      <s.icon className="h-6 w-6 text-[#1e3a5f] dark:text-[#0b1f3a]" />
                    </div>
                    <div className="mt-3 font-semibold text-stone-800 text-sm">{s.label}</div>
                    <div className="text-xs text-stone-500">{s.sub}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mobile: vertical */}
            <div className="md:hidden flex flex-col gap-4">
              {STAGES.map((s, i) => (
                <div key={s.label} className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-white border-2 border-blue-200 flex items-center justify-center flex-shrink-0 dark:!bg-blue-100 dark:border-blue-400">
                    <s.icon className="h-5 w-5 text-[#1e3a5f] dark:text-[#0b1f3a]" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-stone-800 text-sm">{s.label}</div>
                    <div className="text-xs text-stone-500">{s.sub}</div>
                  </div>
                  {i < STAGES.length - 1 && (
                    <div className="w-px h-6 bg-blue-200 ml-6" aria-hidden />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 sm:py-20 px-4 bg-stone-100">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full text-blue-700 text-sm font-medium mb-5 border border-blue-100">
                <Sparkles className="h-4 w-4" />
                <span>Platform highlights</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-stone-800 mb-4 tracking-tight leading-[1.15]">
                Streamline Your{' '}
                <span className="bg-gradient-to-r from-[#1e3a5f] to-blue-600 bg-clip-text text-transparent">
                  FYP Experience
                </span>
              </h2>
              <p className="text-lg text-stone-600 max-w-2xl mx-auto leading-relaxed">
                Built for FCI students, supervisors, and the FYP committee to manage the entire final year project lifecycle.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {FEATURES.map((feature) => (
                <div
                  key={feature.title}
                  className="group p-6 bg-white rounded-2xl border border-stone-200 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-100/50 hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="w-12 h-12 bg-blue-50 text-[#1e3a5f] rounded-xl flex items-center justify-center mb-4 group-hover:bg-[#1e3a5f] group-hover:text-white group-hover:scale-110 transition-all duration-300">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-semibold text-stone-800 mb-2">{feature.title}</h3>
                  <p className="text-sm text-stone-600 leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 sm:py-20 px-4 bg-gradient-to-br from-[#1e3a5f] to-[#0f1f33]">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-blue-200 text-sm font-medium mb-6 border border-white/15">
              <CheckCircle2 className="h-4 w-4 text-sky-300" />
              <span>Used by FCI students and supervisors</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 tracking-tight leading-[1.15]">
              Ready to Begin Your{' '}
              <span className="bg-gradient-to-r from-blue-200 to-sky-300 bg-clip-text text-transparent">
                FYP?
              </span>
            </h2>
            <p className="text-lg text-blue-100/80 mb-8 max-w-2xl mx-auto leading-relaxed">
              Register with your MMU student or staff account to access supervisor matching, proposal submission, and progress tracking.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to={ROUTES.REGISTER}>
                <Button
                  size="lg"
                  className="min-w-[200px] bg-white text-[#1e3a5f] hover:bg-blue-50 font-semibold dark:!bg-blue-100 dark:!text-[#0b1f3a]"
                >
                  Get Started
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[#0f1f33] text-white py-12 px-4 border-t border-white/10">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center gap-3">
            <img
              src="/logo.svg"
              alt="FYP Supervision System"
              className="h-10 w-auto"
            />
            <div className="flex flex-col">
              <span className="text-lg font-semibold text-white">
                FYP Supervision System
              </span>
              <span className="text-xs text-blue-300/60">
                Faculty of Computing and Informatics, MMU
              </span>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-white/10 text-center text-sm text-blue-200/40">
            &copy; {new Date().getFullYear()} Faculty of Computing and Informatics, Multimedia University. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
