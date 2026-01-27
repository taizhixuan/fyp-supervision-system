import { Link } from 'react-router-dom'
import {
  Megaphone,
  HelpCircle,
  ArrowRight,
  Users,
  FileText,
  Calendar,
  CheckCircle2,
  GraduationCap,
  ClipboardList,
} from 'lucide-react'
import { Button, Card, Spinner } from '@/components/ui'
import { ROUTES } from '@/lib/constants/routes'
import { useLatestAnnouncements } from '@/lib/hooks/useResources'

// Sample announcements for design preview
const SAMPLE_ANNOUNCEMENTS = [
  {
    announcementId: 'sample-1',
    title: 'FYP 1 Proposal Submission Deadline Extended',
    content: 'The deadline for FYP 1 proposal submission has been extended to March 15, 2025. Please ensure all required documents are submitted through the system before the deadline.',
    publishAt: '2025-01-15T10:00:00Z',
  },
  {
    announcementId: 'sample-2',
    title: 'New AI-Powered Supervisor Matching Feature',
    content: 'We are excited to announce the launch of our new AI-powered supervisor matching feature. Students can now receive personalized supervisor recommendations based on their research interests.',
    publishAt: '2025-01-10T09:00:00Z',
  },
  {
    announcementId: 'sample-3',
    title: 'Supervision Log Submission Reminder',
    content: 'Students are reminded to submit their supervision logs within 48 hours after each meeting with their supervisor. Logs must be reviewed and signed by your supervisor before the end of each month.',
    publishAt: '2025-01-05T14:00:00Z',
  },
]

const FEATURES = [
  {
    icon: Users,
    title: 'Smart Supervisor Matching',
    description: 'AI-powered recommendations to find the perfect supervisor based on your research interests.',
  },
  {
    icon: ClipboardList,
    title: 'Progress Tracking',
    description: 'Keep track of milestones, meetings, and submissions throughout your FYP journey.',
  },
  {
    icon: FileText,
    title: 'Document Management',
    description: 'Submit proposals, reports, and presentations all in one centralized platform.',
  },
  {
    icon: Calendar,
    title: 'Meeting Scheduler',
    description: 'Book supervision sessions and manage your calendar with ease.',
  },
]

export function LandingPage() {
  const { data, isLoading } = useLatestAnnouncements(3)
  // Use sample announcements if no real data available (for design preview)
  const announcements = data?.announcements?.length ? data.announcements : SAMPLE_ANNOUNCEMENTS

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-stone-50/90 backdrop-blur-md border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <img
              src="/logo.svg"
              alt="FYP Supervision System"
              className="h-10 sm:h-12 w-auto"
            />
            <span className="text-lg sm:text-xl font-bold text-stone-800 hidden sm:block">
              FYP Supervision System
            </span>
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              to={ROUTES.HELP}
              className="flex items-center gap-1.5 text-sm text-stone-600 hover:text-stone-900 transition-colors px-3 py-2 rounded-lg hover:bg-stone-100"
            >
              <HelpCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Help</span>
            </Link>
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
        <section className="relative overflow-hidden bg-gradient-to-br from-stone-800 via-stone-900 to-stone-800">
          {/* Texture overlay */}
          <div className="absolute inset-0 opacity-20 bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noise%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noise)%22/%3E%3C/svg%3E')]" />

          {/* Decorative gradient orbs */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-96 h-96 bg-amber-900/20 rounded-full blur-3xl" />
            <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-olive-900/20 rounded-full blur-3xl" />
            <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-stone-700/30 rounded-full blur-3xl" />
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-32">
            <div className="text-center">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-900/30 backdrop-blur-sm rounded-full text-amber-200 text-sm font-medium mb-8 border border-amber-700/30">
                <GraduationCap className="h-4 w-4" />
                <span>MMU Final Year Project Portal</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-tight">
                Your FYP Journey
                <span className="block mt-2 text-amber-200">
                  Starts Here
                </span>
              </h1>

              <p className="text-lg sm:text-xl text-stone-300 mb-10 max-w-2xl mx-auto leading-relaxed">
                Manage your Final Year Project from proposal to completion.
                Connect with supervisors, track progress, and submit your work seamlessly.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to={ROUTES.LOGIN}>
                  <Button
                    size="lg"
                    className="min-w-[180px] bg-amber-600 text-white hover:bg-amber-700 shadow-lg shadow-amber-900/30"
                  >
                    Log In
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Button>
                </Link>
                <Link to={ROUTES.REGISTER}>
                  <Button
                    variant="secondary"
                    size="lg"
                    className="min-w-[180px] bg-transparent text-stone-200 border-stone-600 hover:bg-stone-700/50 hover:border-stone-500"
                  >
                    Register
                  </Button>
                </Link>
              </div>

              {/* Stats */}
              <div className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto">
                <div className="text-center">
                  <div className="text-3xl sm:text-4xl font-bold text-white">500+</div>
                  <div className="text-sm text-stone-400 mt-1">Students</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl sm:text-4xl font-bold text-white">50+</div>
                  <div className="text-sm text-stone-400 mt-1">Supervisors</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl sm:text-4xl font-bold text-white">100+</div>
                  <div className="text-sm text-stone-400 mt-1">Projects</div>
                </div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-stone-600 to-transparent" />
        </section>

        {/* Features Section */}
        <section className="py-16 sm:py-20 px-4 bg-stone-100">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-stone-800 mb-4">
                Everything You Need
              </h2>
              <p className="text-lg text-stone-600 max-w-2xl mx-auto">
                A comprehensive platform designed to streamline your Final Year Project experience.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {FEATURES.map((feature) => (
                <div
                  key={feature.title}
                  className="group p-6 bg-white rounded-2xl border border-stone-200 hover:border-amber-300 hover:shadow-lg hover:shadow-amber-100/50 transition-all duration-300"
                >
                  <div className="w-12 h-12 bg-stone-100 text-stone-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-amber-600 group-hover:text-white transition-colors duration-300">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-semibold text-stone-800 mb-2">{feature.title}</h3>
                  <p className="text-sm text-stone-600 leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Announcements Section */}
        <section className="py-16 sm:py-20 px-4 bg-white">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-center gap-3 mb-12">
              <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-xl flex items-center justify-center">
                <Megaphone className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-stone-800">
                  Latest Announcements
                </h2>
                <p className="text-stone-600 text-sm mt-1">Stay updated with important news</p>
              </div>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-12">
                <Spinner size="lg" label="Loading announcements..." />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {announcements.map((announcement, index) => (
                  <Card
                    key={announcement.announcementId}
                    hover
                    className="h-full group relative overflow-hidden"
                  >
                    {/* Accent bar */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-amber-600" />

                    <div className="flex flex-col h-full pt-2">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-amber-100 text-amber-700 rounded-lg flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </div>
                        <h3 className="font-semibold text-stone-800 line-clamp-2 group-hover:text-amber-700 transition-colors">
                          {announcement.title}
                        </h3>
                      </div>
                      <p className="text-sm text-stone-600 mb-4 line-clamp-3 flex-1 leading-relaxed">
                        {announcement.content}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-stone-400">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(announcement.publishAt).toLocaleDateString('en-MY', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {announcements.length > 0 && (
              <div className="text-center mt-10">
                <Link
                  to="/announcements"
                  className="inline-flex items-center gap-2 px-6 py-3 text-sm text-amber-700 hover:text-amber-800 font-medium bg-amber-50 hover:bg-amber-100 rounded-full transition-all duration-200"
                >
                  View All Announcements
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 sm:py-20 px-4 bg-gradient-to-br from-stone-800 to-stone-900">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-900/30 rounded-full text-green-300 text-sm font-medium mb-6 border border-green-700/30">
              <CheckCircle2 className="h-4 w-4" />
              <span>Join hundreds of students already using the platform</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Ready to Start Your FYP Journey?
            </h2>
            <p className="text-lg text-stone-400 mb-8 max-w-2xl mx-auto">
              Create your account today and get matched with the perfect supervisor for your research interests.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to={ROUTES.REGISTER}>
                <Button
                  size="lg"
                  className="min-w-[200px] bg-amber-600 text-white hover:bg-amber-700"
                >
                  Get Started Free
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </Link>
              <Link to={ROUTES.HELP}>
                <Button
                  variant="secondary"
                  size="lg"
                  className="min-w-[200px] bg-transparent text-stone-200 border-stone-600 hover:bg-stone-700/50 hover:border-stone-500"
                >
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-stone-900 text-white py-12 px-4 border-t border-stone-800">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <img
                src="/logo.svg"
                alt="FYP Supervision System"
                className="h-10 w-auto"
              />
              <span className="text-lg font-semibold text-stone-300">
                FYP Supervision System
              </span>
            </div>
            <div className="flex items-center gap-8 text-sm">
              <Link
                to={ROUTES.HELP}
                className="text-stone-400 hover:text-white transition-colors"
              >
                Help & FAQs
              </Link>
              <a
                href="mailto:fyp-committee@mmu.edu.my"
                className="text-stone-400 hover:text-white transition-colors"
              >
                Contact Us
              </a>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-stone-800 text-center text-sm text-stone-500">
            &copy; {new Date().getFullYear()} MMU FYP Committee. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
