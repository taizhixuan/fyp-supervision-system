import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Users,
  FileText,
  Calendar,
  CheckCircle2,
  GraduationCap,
  ClipboardList,
} from 'lucide-react'
import { Button } from '@/components/ui'
import { ROUTES } from '@/lib/constants/routes'

const FEATURES = [
  {
    icon: Users,
    title: 'Supervisor Matching',
    description: 'Find the right supervisor based on your research interests and expertise alignment within FCI.',
  },
  {
    icon: ClipboardList,
    title: 'Progress Tracking',
    description: 'Track milestones from FYP 1 proposal through FYP 2 completion with clear status updates.',
  },
  {
    icon: FileText,
    title: 'Document Management',
    description: 'Submit proposals, reports, and presentations in one centralized platform.',
  },
  {
    icon: Calendar,
    title: 'Meeting Scheduler',
    description: 'Schedule supervision meetings and keep a log of all consultation sessions.',
  },
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

          {/* Decorative gradient orbs */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-sky-600/10 rounded-full blur-3xl" />
            <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-blue-800/20 rounded-full blur-3xl" />
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-32">
            <div className="text-center">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-blue-200 text-sm font-medium mb-8 border border-white/15">
                <GraduationCap className="h-4 w-4" />
                <span>MMU Faculty of Computing and Informatics</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-tight">
                FYP Supervision
                <span className="block mt-2 bg-gradient-to-r from-blue-200 to-sky-300 bg-clip-text text-transparent">
                  Management System
                </span>
              </h1>

              <p className="text-lg sm:text-xl text-blue-100/80 mb-10 max-w-2xl mx-auto leading-relaxed">
                The official platform for FCI final year project supervision.
                Connect with supervisors, track progress from FYP 1 to FYP 2, and manage submissions seamlessly.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to={ROUTES.LOGIN}>
                  <Button
                    size="lg"
                    className="min-w-[180px] bg-white text-[#1e3a5f] hover:bg-blue-50 shadow-lg shadow-black/20 font-semibold"
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

              {/* Stats */}
              <div className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto">
                <div className="text-center">
                  <div className="text-3xl sm:text-4xl font-bold text-white">500+</div>
                  <div className="text-sm text-blue-200/60 mt-1">Students</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl sm:text-4xl font-bold text-white">50+</div>
                  <div className="text-sm text-blue-200/60 mt-1">Supervisors</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl sm:text-4xl font-bold text-white">100+</div>
                  <div className="text-sm text-blue-200/60 mt-1">Projects</div>
                </div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-400/30 to-transparent" />
        </section>

        {/* Features Section */}
        <section className="py-16 sm:py-20 px-4 bg-stone-100">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-stone-800 mb-4">
                Streamline Your FYP Experience
              </h2>
              <p className="text-lg text-stone-600 max-w-2xl mx-auto">
                Built for FCI students, supervisors, and the FYP committee to manage the entire final year project lifecycle.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {FEATURES.map((feature) => (
                <div
                  key={feature.title}
                  className="group p-6 bg-white rounded-2xl border border-stone-200 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-100/50 transition-all duration-300"
                >
                  <div className="w-12 h-12 bg-blue-50 text-[#1e3a5f] rounded-xl flex items-center justify-center mb-4 group-hover:bg-[#1e3a5f] group-hover:text-white transition-colors duration-300">
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
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 rounded-full text-green-300 text-sm font-medium mb-6 border border-green-500/20">
              <CheckCircle2 className="h-4 w-4" />
              <span>Used by FCI students and supervisors</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Ready to Begin Your FYP?
            </h2>
            <p className="text-lg text-blue-200/70 mb-8 max-w-2xl mx-auto">
              Register with your MMU student or staff account to access supervisor matching, proposal submission, and progress tracking.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to={ROUTES.REGISTER}>
                <Button
                  size="lg"
                  className="min-w-[200px] bg-white text-[#1e3a5f] hover:bg-blue-50 font-semibold"
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
