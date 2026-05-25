import { Link } from 'react-router-dom'
import { ArrowLeft, ShieldCheck } from 'lucide-react'
import { PRIVACY_NOTICE_VERSION } from '@/types/auth'

/**
 * Privacy Notice for the FYP Supervision System. Visible at /privacy
 * without authentication. Bump PRIVACY_NOTICE_VERSION in src/types/auth.ts
 * when the content materially changes so future users are reprompted.
 */
export function PrivacyNoticePage() {
  return (
    <div className="min-h-screen bg-neutral-50 py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-neutral-600 hover:text-neutral-900 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>

        <article className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-8 sm:p-10 space-y-6">
          <header className="flex items-start gap-3 pb-4 border-b border-neutral-200">
            <div className="w-11 h-11 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="h-5 w-5 text-primary-700" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">Privacy Notice</h1>
              <p className="text-sm text-neutral-500 mt-1">
                FYP Supervision System · Version {PRIVACY_NOTICE_VERSION} · Last updated 26 May 2026
              </p>
            </div>
          </header>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-neutral-900">1. Who we are</h2>
            <p className="text-sm text-neutral-700 leading-relaxed">
              The FYP Supervision System is a final-year project supervision platform built for
              the Faculty of Computing and Informatics, Multimedia University. This notice
              describes what personal data the system collects from you, why it is collected,
              and what you can do about it. It is written in line with Malaysia's Personal Data
              Protection Act 2010 (as amended in 2024).
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-neutral-900">2. What we collect</h2>
            <ul className="text-sm text-neutral-700 leading-relaxed list-disc pl-5 space-y-1">
              <li><strong>Identification data</strong> — full name, MMU ID, university email, phone number, profile image</li>
              <li><strong>Academic data</strong> — programme, specialisation, intake year, CGPA, expected graduation date</li>
              <li><strong>FYP work content</strong> — proposal title and drafts, meeting log entries, uploaded documents</li>
              <li><strong>Interaction data</strong> — supervision requests, meeting bookings, document submissions, chatbot conversations and your stated preferences</li>
              <li><strong>System-generated data</strong> — login timestamps, audit logs of privileged actions, notifications</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-neutral-900">3. Why we collect it</h2>
            <p className="text-sm text-neutral-700 leading-relaxed">
              Your data is used solely to run the FYP supervision workflow — pairing you with a
              supervisor, scheduling meetings, recording your meeting logs, tracking your
              proposal through review, surfacing the right deadlines on your dashboard, and
              giving you an AI assistant grounded in the FCI handbook. We do not sell, rent,
              or share your data for marketing.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-neutral-900">4. Who can see your data</h2>
            <ul className="text-sm text-neutral-700 leading-relaxed list-disc pl-5 space-y-1">
              <li><strong>You</strong> — full access to your own profile, proposals, meetings, logs, documents, and chat history</li>
              <li><strong>Your supervisor</strong> — once paired, they see your project content (proposals, logs, documents) for supervision purposes</li>
              <li><strong>FYP committee members</strong> — see proposals submitted for review and project overviews for coordination</li>
              <li><strong>System administrators</strong> — see all accounts for user management and platform health monitoring; access is audit-logged</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-neutral-900">5. AI processing and third-party transfer</h2>
            <p className="text-sm text-neutral-700 leading-relaxed">
              The chatbot and proposal analyzer features may send your question text,
              proposal drafts, meeting log content, and other project-related data to a
              third-party large language model provider (Groq or OpenAI) hosted outside
              Malaysia. This data is processed only to generate your reply and is not
              stored by the provider beyond their stated retention policy. If you do not
              want your data sent overseas, do not use these AI features. A self-hosted
              alternative may be configured by administrators.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-neutral-900">6. How long we keep it</h2>
            <p className="text-sm text-neutral-700 leading-relaxed">
              Account data is retained for the duration of your enrollment plus the
              statutory archival period required for academic records. Chat sessions and
              their AI memory summaries can be cleared at any time through the chatbot's
              settings. Notifications older than six months are automatically purged.
              Audit logs are retained for accountability and security review.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-neutral-900">7. Security measures</h2>
            <p className="text-sm text-neutral-700 leading-relaxed">
              Passwords are stored as bcrypt hashes; sessions use JWT bearer tokens; access
              is restricted by role-based authorisation enforced on every request; uploads
              are validated for type and size. Privileged administrative actions are
              recorded in an audit log.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-neutral-900">8. Your rights</h2>
            <p className="text-sm text-neutral-700 leading-relaxed">
              Under the PDPA you have the right to: access the personal data we hold about
              you, request correction of inaccurate data, withdraw consent for optional
              processing, and request deletion of your account subject to academic
              records-retention requirements. To exercise these rights, contact your
              FYP coordinator or the system administrator.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-neutral-900">9. Changes to this notice</h2>
            <p className="text-sm text-neutral-700 leading-relaxed">
              If this notice changes materially, the version label above will be incremented
              and you will be asked to re-confirm consent on your next sign-in.
            </p>
          </section>

          <section className="space-y-2 pt-2 border-t border-neutral-200">
            <h2 className="text-lg font-semibold text-neutral-900">10. Contact</h2>
            <p className="text-sm text-neutral-700 leading-relaxed">
              Questions about this notice or your data may be directed to the system
              administrator through the FYP coordinator's office.
            </p>
          </section>
        </article>
      </div>
    </div>
  )
}
