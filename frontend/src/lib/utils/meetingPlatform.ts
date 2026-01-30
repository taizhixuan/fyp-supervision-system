// Utility for detecting and handling online meeting platforms

export type OnlinePlatform = 'MICROSOFT_TEAMS' | 'ZOOM' | 'GOOGLE_MEET' | 'WEBEX' | 'OTHER'

export interface PlatformInfo {
  key: OnlinePlatform
  label: string
  shortLabel: string
  color: string
  bgColor: string
  urlPattern: RegExp
  placeholder: string
  helpText: string
}

export const ONLINE_PLATFORMS: PlatformInfo[] = [
  {
    key: 'MICROSOFT_TEAMS',
    label: 'Microsoft Teams',
    shortLabel: 'Teams',
    color: 'text-[#6264A7]',
    bgColor: 'bg-[#6264A7]/10',
    urlPattern: /teams\.microsoft\.com|teams\.live\.com/i,
    placeholder: 'https://teams.microsoft.com/l/meetup-join/...',
    helpText: 'Open Teams → Calendar → New Meeting → Copy the join link',
  },
  {
    key: 'ZOOM',
    label: 'Zoom',
    shortLabel: 'Zoom',
    color: 'text-[#2D8CFF]',
    bgColor: 'bg-[#2D8CFF]/10',
    urlPattern: /zoom\.us|zoomgov\.com/i,
    placeholder: 'https://zoom.us/j/123456789',
    helpText: 'Open Zoom → Schedule → Copy Invitation Link',
  },
  {
    key: 'GOOGLE_MEET',
    label: 'Google Meet',
    shortLabel: 'Meet',
    color: 'text-[#00897B]',
    bgColor: 'bg-[#00897B]/10',
    urlPattern: /meet\.google\.com/i,
    placeholder: 'https://meet.google.com/abc-defg-hij',
    helpText: 'Open Google Calendar → Create event → Add Google Meet → Copy link',
  },
  {
    key: 'WEBEX',
    label: 'Cisco Webex',
    shortLabel: 'Webex',
    color: 'text-[#07C160]',
    bgColor: 'bg-[#07C160]/10',
    urlPattern: /webex\.com/i,
    placeholder: 'https://meet.webex.com/...',
    helpText: 'Open Webex → Schedule → Copy Meeting Link',
  },
  {
    key: 'OTHER',
    label: 'Other Platform',
    shortLabel: 'Other',
    color: 'text-neutral-600',
    bgColor: 'bg-neutral-100',
    urlPattern: /./,
    placeholder: 'https://...',
    helpText: 'Paste any valid meeting URL',
  },
]

/**
 * Auto-detect the online meeting platform from a URL.
 */
export function detectPlatformFromUrl(url: string): OnlinePlatform {
  if (!url) return 'OTHER'
  for (const platform of ONLINE_PLATFORMS) {
    if (platform.key !== 'OTHER' && platform.urlPattern.test(url)) {
      return platform.key
    }
  }
  return 'OTHER'
}

/**
 * Get platform info by key.
 */
export function getPlatformInfo(key: OnlinePlatform): PlatformInfo {
  return ONLINE_PLATFORMS.find((p) => p.key === key) || ONLINE_PLATFORMS[ONLINE_PLATFORMS.length - 1]
}

/**
 * Generate a mailto link with pre-filled meeting details for sharing.
 */
export function buildMeetingShareMailto({
  to,
  title,
  dateTime,
  duration,
  meetingUrl,
  platform,
  agenda,
}: {
  to?: string
  title: string
  dateTime: string
  duration: number
  meetingUrl: string
  platform: OnlinePlatform
  agenda?: string
}): string {
  const platformInfo = getPlatformInfo(platform)
  const date = new Date(dateTime)
  const formattedDate = date.toLocaleDateString('en-MY', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const formattedTime = date.toLocaleTimeString('en-MY', {
    hour: '2-digit',
    minute: '2-digit',
  })

  const subject = encodeURIComponent(`Meeting: ${title}`)
  const body = encodeURIComponent(
    [
      `You are invited to a meeting.`,
      ``,
      `Title: ${title}`,
      `Date: ${formattedDate}`,
      `Time: ${formattedTime}`,
      `Duration: ${duration} minutes`,
      `Platform: ${platformInfo.label}`,
      ``,
      `Join here: ${meetingUrl}`,
      agenda ? `\nAgenda:\n${agenda}` : '',
    ]
      .filter(Boolean)
      .join('\n')
  )

  return `mailto:${to || ''}?subject=${subject}&body=${body}`
}
