import { useState } from 'react'
import { ShieldCheck, ExternalLink } from 'lucide-react'
import { Modal, ModalHeader, ModalTitle, ModalBody, ModalFooter, Button, AlertBanner } from '@/components/ui'
import { useAuth } from '@/lib/auth/useAuth'
import { authApi } from '@/lib/api/auth'
import { getApiErrorMessage } from '@/lib/api/client'
import { PRIVACY_NOTICE_VERSION } from '@/types/auth'

/**
 * Non-dismissable modal that blocks the app until the signed-in user re-accepts
 * the current Privacy Notice. Triggers whenever `user.privacyNoticeVersion`
 * doesn't match the bundled `PRIVACY_NOTICE_VERSION` constant — including for
 * legacy accounts where the column is null.
 *
 * Mount once near the app root (currently in AppShell, just inside the
 * authenticated tree).
 */
export function PrivacyConsentGate() {
  const { user, refreshUser } = useAuth()
  const [agreed, setAgreed] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const needsReConsent = user && user.privacyNoticeVersion !== PRIVACY_NOTICE_VERSION

  if (!needsReConsent) return null

  const handleAccept = async () => {
    if (!agreed || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      await authApi.acceptPrivacyNotice(PRIVACY_NOTICE_VERSION)
      await refreshUser()
    } catch (err) {
      setError(getApiErrorMessage(err))
      setSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen
      onClose={() => undefined}
      size="lg"
      closeOnOverlayClick={false}
      closeOnEscape={false}
      showCloseButton={false}
    >
      <ModalHeader>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="h-5 w-5 text-primary-700" />
          </div>
          <div>
            <ModalTitle>Privacy Notice updated</ModalTitle>
            <p className="text-sm text-neutral-500 mt-1">
              Version {PRIVACY_NOTICE_VERSION} · Please review and accept to continue
            </p>
          </div>
        </div>
      </ModalHeader>

      <ModalBody>
        <p className="text-sm text-neutral-700 leading-relaxed">
          Our Privacy Notice has been updated since you last agreed. It describes what personal data
          we collect, how it&apos;s used, who can see it, and your rights under Malaysia&apos;s Personal
          Data Protection Act 2010.
        </p>

        <a
          href="/privacy"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700 mt-3"
        >
          Read the full Privacy Notice
          <ExternalLink className="h-3.5 w-3.5" />
        </a>

        {error && (
          <AlertBanner
            variant="error"
            description={error}
            dismissible
            onDismiss={() => setError(null)}
            className="mt-4"
          />
        )}

        <label className="flex items-start gap-2.5 mt-5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
          />
          <span className="text-sm text-neutral-700">
            I have read and agree to the Privacy Notice (version {PRIVACY_NOTICE_VERSION}).
          </span>
        </label>
      </ModalBody>

      <ModalFooter>
        <Button
          type="button"
          onClick={handleAccept}
          disabled={!agreed || submitting}
          isLoading={submitting}
        >
          Accept and continue
        </Button>
      </ModalFooter>
    </Modal>
  )
}
