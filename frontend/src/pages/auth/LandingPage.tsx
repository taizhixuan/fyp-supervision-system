import { Link } from 'react-router-dom'
import { Megaphone, HelpCircle, ExternalLink } from 'lucide-react'
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

export function LandingPage() {
  const { data, isLoading, error } = useLatestAnnouncements(3)
  // Use sample announcements if no real data available (for design preview)
  const announcements = data?.announcements?.length ? data.announcements : SAMPLE_ANNOUNCEMENTS

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <img
              src="/logo.svg"
              alt="FYP Supervision System"
              className="h-12 w-auto"
            />
            <span className="text-xl font-bold text-neutral-900">
              FYP Supervision System
            </span>
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-4">
            <Link
              to={ROUTES.HELP}
              className="flex items-center gap-1.5 text-sm text-neutral-600 hover:text-primary-600 transition-colors"
            >
              <HelpCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Help</span>
            </Link>
            <Link to={ROUTES.LOGIN}>
              <Button variant="primary" size="sm">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="py-16 sm:py-24 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-neutral-900 mb-6">
              FYP Supervision System
            </h1>
            <p className="text-xl text-neutral-600 mb-8 max-w-2xl mx-auto">
              Manage your Final Year Project journey from proposal to completion.
              Connect with supervisors, track your progress, and submit your work seamlessly.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to={ROUTES.LOGIN}>
                <Button size="lg" className="min-w-[160px]">
                  Sign In
                </Button>
              </Link>
              <Link to={ROUTES.REGISTER}>
                <Button variant="secondary" size="lg" className="min-w-[160px]">
                  Create Account
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Announcements Section */}
        <section className="py-12 px-4 bg-white border-t border-neutral-200">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-center gap-2 mb-8">
              <Megaphone className="h-6 w-6 text-primary-600" />
              <h2 className="text-2xl font-semibold text-neutral-900">
                Latest Announcements
              </h2>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-12">
                <Spinner size="lg" label="Loading announcements..." />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {announcements.map((announcement) => (
                  <Card key={announcement.announcementId} hover className="h-full">
                    <div className="flex flex-col h-full">
                      <h3 className="font-semibold text-neutral-900 mb-2 line-clamp-2">
                        {announcement.title}
                      </h3>
                      <p className="text-sm text-neutral-600 mb-4 line-clamp-3 flex-1">
                        {announcement.content}
                      </p>
                      <p className="text-xs text-neutral-400">
                        {new Date(announcement.publishAt).toLocaleDateString('en-MY', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {announcements.length > 0 && (
              <div className="text-center mt-8">
                <Link
                  to="/announcements"
                  className="inline-flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  View All Announcements
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-neutral-900 text-white py-8 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-neutral-400 mb-4">
            &copy; {new Date().getFullYear()} MMU FYP Committee. All rights reserved.
          </p>
          <div className="flex items-center justify-center gap-6 text-sm">
            <Link
              to={ROUTES.HELP}
              className="text-neutral-400 hover:text-white transition-colors"
            >
              Help & FAQs
            </Link>
            <a
              href="mailto:fyp-committee@mmu.edu.my"
              className="text-neutral-400 hover:text-white transition-colors"
            >
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
