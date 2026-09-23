import { useState } from 'react'
import { CalendarClock, Copy, Check, RefreshCw, Link2Off, AlertTriangle } from 'lucide-react'
import { Card, Button, Spinner } from '@/components/ui'
import { useErrorToast, useSuccessToast } from '@/components/ui/Toast'
import { getApiErrorMessage } from '@/lib/api/client'
import { formatDateTime } from '@/lib/utils/formatDate'
import {
  calendarFeedUrl,
  useCalendarFeedStatus,
  useRevokeCalendarFeed,
  useRotateCalendarFeed,
} from '@/lib/hooks/useMeetingExtras'

/**
 * Private webcal subscription: calendar apps poll the feed, so reschedules and
 * cancellations update automatically. Only the token's hash is stored server-side,
 * so the full link is visible once, right after it is created or reset.
 */
export function CalendarSubscriptionCard() {
  const { data: status, isLoading } = useCalendarFeedStatus()
  const rotate = useRotateCalendarFeed()
  const revoke = useRevokeCalendarFeed()
  const showError = useErrorToast()
  const showSuccess = useSuccessToast()
  const [feedUrl, setFeedUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const isLocalhost = ['localhost', '127.0.0.1'].includes(window.location.hostname)

  const handleRotate = () => {
    if (status?.enabled && !feedUrl &&
        !confirm('Reset the link? Calendars subscribed with the old link will stop updating.')) return
    rotate.mutate(undefined, {
      onSuccess: (data) => {
        if (data.token) setFeedUrl(calendarFeedUrl(data.token))
        setCopied(false)
      },
      onError: (e) => showError('Could not create link', getApiErrorMessage(e)),
    })
  }

  const handleRevoke = () => {
    if (!confirm('Turn off calendar sync? Subscribed calendars will stop updating.')) return
    revoke.mutate(undefined, {
      onSuccess: () => {
        setFeedUrl(null)
        showSuccess('Calendar sync turned off')
      },
      onError: (e) => showError('Could not turn off sync', getApiErrorMessage(e)),
    })
  }

  const copy = async () => {
    if (!feedUrl) return
    try {
      await navigator.clipboard.writeText(feedUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      showError('Copy failed', 'Select the link and copy it manually.')
    }
  }

  const webcalUrl = feedUrl?.replace(/^https?:/, 'webcal:')

  return (
    <Card>
      <div className="flex items-center gap-2 mb-1">
        <CalendarClock className="h-5 w-5 text-neutral-400" />
        <h2 className="text-lg font-semibold text-neutral-900">Calendar sync</h2>
      </div>
      <p className="text-sm text-neutral-500 mb-4">
        Subscribe once and your supervision meetings stay up to date in Google Calendar, Outlook or Apple Calendar.
        New meetings, reschedules and cancellations appear automatically (calendar apps refresh every few hours).
      </p>

      {isLoading ? (
        <Spinner size="sm" />
      ) : feedUrl ? (
        <div className="space-y-4">
          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-800 flex gap-2">
            <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <span>
              Copy this link now. It is shown only once and works like a password: anyone with it can see your meeting
              times.
            </span>
          </div>
          <div className="flex gap-2">
            <input
              readOnly
              value={feedUrl}
              onFocus={(e) => e.currentTarget.select()}
              className="flex-1 min-w-0 px-3 py-2 text-xs font-mono border border-neutral-300 rounded-lg bg-neutral-50"
              aria-label="Calendar subscription link"
            />
            <Button variant="secondary" size="sm" onClick={copy} leftIcon={copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}>
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href={`https://calendar.google.com/calendar/r?cid=${encodeURIComponent(webcalUrl!)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="secondary" size="sm">Add to Google Calendar</Button>
            </a>
            <a
              href={`https://outlook.live.com/calendar/0/addfromweb?url=${encodeURIComponent(feedUrl)}&name=${encodeURIComponent('FYP Meetings')}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="secondary" size="sm">Add to Outlook</Button>
            </a>
            <a href={webcalUrl}>
              <Button variant="secondary" size="sm">Open in Apple Calendar</Button>
            </a>
          </div>
          {isLocalhost && (
            <p className="text-xs text-neutral-500">
              Note: Google and Outlook fetch the feed from their own servers, so they cannot reach a localhost link.
              They will work once the app is deployed on a public domain. Apple Calendar on this computer can subscribe
              now.
            </p>
          )}
          <p className="text-xs text-neutral-500">
            Outlook for work or school: Add calendar → Subscribe from web → paste the link.
          </p>
        </div>
      ) : status?.enabled ? (
        <div className="space-y-3">
          <p className="text-sm text-neutral-700">
            Sync is <span className="font-medium text-success-700">on</span>
            {status.createdAt && <> since {formatDateTime(status.createdAt)}</>}
            {status.lastAccessedAt ? (
              <>. Last fetched by a calendar app {formatDateTime(status.lastAccessedAt)}.</>
            ) : (
              <>. No calendar app has fetched it yet.</>
            )}
          </p>
          <p className="text-xs text-neutral-500">
            Lost the link? Reset it to get a new one (the old link stops working).
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={handleRotate} isLoading={rotate.isPending} leftIcon={<RefreshCw className="h-4 w-4" />}>
              Reset link
            </Button>
            <Button variant="ghost" size="sm" onClick={handleRevoke} isLoading={revoke.isPending} leftIcon={<Link2Off className="h-4 w-4" />}>
              Turn off
            </Button>
          </div>
        </div>
      ) : (
        <Button onClick={handleRotate} isLoading={rotate.isPending} leftIcon={<CalendarClock className="h-4 w-4" />}>
          Create subscription link
        </Button>
      )}
    </Card>
  )
}
