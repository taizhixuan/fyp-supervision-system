import { useState, useRef, useEffect } from 'react'
import { CalendarPlus, ChevronDown, Download } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useErrorToast } from '@/components/ui/Toast'
import { cn } from '@/lib/utils/cn'
import { downloadAuthedFile } from '@/lib/utils/download'
import {
  buildGoogleCalendarUrl,
  buildOutlookCalendarUrl,
  type CalendarEvent,
} from '@/lib/utils/calendarLinks'

interface AddToCalendarMenuProps {
  event: CalendarEvent
  /** Authenticated API path that returns the meeting as an .ics file. */
  icsPath: string
  icsFileName: string
  className?: string
  fullWidth?: boolean
}

/**
 * "Add to calendar" dropdown: Google and Outlook open a pre-filled event in a new tab,
 * Apple Calendar (and any other app) gets the backend .ics file.
 */
export function AddToCalendarMenu({ event, icsPath, icsFileName, className, fullWidth }: AddToCalendarMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const showError = useErrorToast()

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setIsOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (!isOpen) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  const googleUrl = buildGoogleCalendarUrl(event)
  const outlookUrl = buildOutlookCalendarUrl(event, 'live')
  const office365Url = buildOutlookCalendarUrl(event, 'office')
  if (!googleUrl) return null

  const openLink = (url: string | null) => {
    if (url) window.open(url, '_blank', 'noopener,noreferrer')
    setIsOpen(false)
  }

  const downloadIcs = async () => {
    setIsOpen(false)
    setDownloading(true)
    try {
      await downloadAuthedFile(icsPath, icsFileName)
    } catch {
      showError('Download failed', 'Could not generate the calendar file. Please try again.')
    } finally {
      setDownloading(false)
    }
  }

  const itemClass =
    'flex items-center gap-3 w-full px-4 py-2 text-sm text-left text-neutral-700 hover:bg-neutral-50 transition-colors'

  return (
    <div ref={menuRef} className={cn('relative', fullWidth && 'w-full', className)}>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className={cn(fullWidth && 'w-full justify-center')}
        isLoading={downloading}
        leftIcon={<CalendarPlus className="h-4 w-4" />}
        rightIcon={<ChevronDown className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')} />}
        onClick={() => setIsOpen((o) => !o)}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        Add to Calendar
      </Button>

      {isOpen && (
        <div
          className={cn(
            'absolute right-0 top-full mt-2 w-60 bg-white rounded-lg shadow-lg border border-neutral-200',
            'animate-fade-in origin-top-right z-50 py-1'
          )}
          role="menu"
        >
          <button type="button" role="menuitem" className={itemClass} onClick={() => openLink(googleUrl)}>
            <span className="h-2 w-2 rounded-full bg-[#4285F4]" aria-hidden />
            Google Calendar
          </button>
          <button type="button" role="menuitem" className={itemClass} onClick={() => openLink(outlookUrl)}>
            <span className="h-2 w-2 rounded-full bg-[#0078D4]" aria-hidden />
            Outlook.com
          </button>
          <button type="button" role="menuitem" className={itemClass} onClick={() => openLink(office365Url)}>
            <span className="h-2 w-2 rounded-full bg-[#0078D4]" aria-hidden />
            Outlook (work / school)
          </button>
          <button type="button" role="menuitem" className={itemClass} onClick={downloadIcs}>
            <span className="h-2 w-2 rounded-full bg-neutral-800" aria-hidden />
            Apple Calendar
          </button>
          <div className="border-t border-neutral-100 mt-1 pt-1">
            <button type="button" role="menuitem" className={itemClass} onClick={downloadIcs}>
              <Download className="h-4 w-4 text-neutral-400" />
              Download .ics file
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
