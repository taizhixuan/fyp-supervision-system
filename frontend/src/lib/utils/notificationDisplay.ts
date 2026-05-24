import {
  Bell,
  Calendar,
  CalendarClock,
  CheckCircle,
  ClipboardList,
  FileCheck,
  FileText,
  FolderOpen,
  GraduationCap,
  Info,
  Lightbulb,
  Mail,
  Megaphone,
  MessageSquare,
  RefreshCw,
  Settings,
  UserCheck,
  UserPlus,
  UserX,
  AlertCircle,
  AlertTriangle,
  XCircle,
  Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { formatDate } from './formatDate'

export interface NotificationDisplay {
  Icon: LucideIcon
  iconColor: string
  iconBg: string
  label: string
}

// Backend currently emits these 9 types from NotificationService:
//   ACCOUNT_APPROVED, ACCOUNT_REJECTED, CYCLE_STATUS, DEADLINE,
//   FYP1_RESULT, MEETING, PROPOSAL, REGISTRATION_PENDING, REQUEST
// The extra entries below cover legacy/historical types and types
// the supervisor/committee frontends used to define locally.
const BASE_DISPLAY: Record<string, NotificationDisplay> = {
  // Real backend types
  ACCOUNT_APPROVED:       { Icon: UserCheck,     iconColor: 'text-success-600', iconBg: 'bg-success-100', label: 'Account Approved' },
  ACCOUNT_REJECTED:       { Icon: UserX,         iconColor: 'text-error-600',   iconBg: 'bg-error-100',   label: 'Account Rejected' },
  CYCLE_STATUS:           { Icon: RefreshCw,     iconColor: 'text-info-600',    iconBg: 'bg-info-100',    label: 'Cycle Update' },
  DEADLINE:               { Icon: CalendarClock, iconColor: 'text-warning-600', iconBg: 'bg-warning-100', label: 'Deadline' },
  FYP1_RESULT:            { Icon: GraduationCap, iconColor: 'text-primary-600', iconBg: 'bg-primary-100', label: 'FYP1 Result' },
  MEETING:                { Icon: Calendar,      iconColor: 'text-primary-600', iconBg: 'bg-primary-100', label: 'Meeting' },
  PROPOSAL:               { Icon: FileText,      iconColor: 'text-info-600',    iconBg: 'bg-info-100',    label: 'Proposal' },
  REGISTRATION_PENDING:   { Icon: UserPlus,      iconColor: 'text-info-600',    iconBg: 'bg-info-100',    label: 'Pending Registration' },
  REQUEST:                { Icon: Mail,          iconColor: 'text-primary-600', iconBg: 'bg-primary-100', label: 'Supervision Request' },
  // Legacy / additional types
  ANNOUNCEMENT:           { Icon: Megaphone,     iconColor: 'text-primary-600', iconBg: 'bg-primary-100', label: 'Announcement' },
  ANNOUNCEMENT_PUBLISHED: { Icon: Megaphone,     iconColor: 'text-primary-600', iconBg: 'bg-primary-100', label: 'Announcement' },
  DEADLINE_REMINDER:      { Icon: CalendarClock, iconColor: 'text-warning-600', iconBg: 'bg-warning-100', label: 'Deadline' },
  FEEDBACK:               { Icon: MessageSquare, iconColor: 'text-warning-600', iconBg: 'bg-warning-100', label: 'Feedback' },
  INFO:                   { Icon: Info,          iconColor: 'text-info-600',    iconBg: 'bg-info-100',    label: 'Info' },
  SUCCESS:                { Icon: CheckCircle,   iconColor: 'text-success-600', iconBg: 'bg-success-100', label: 'Success' },
  WARNING:                { Icon: AlertTriangle, iconColor: 'text-warning-600', iconBg: 'bg-warning-100', label: 'Warning' },
  ERROR:                  { Icon: AlertCircle,   iconColor: 'text-error-600',   iconBg: 'bg-error-100',   label: 'Error' },
  SYSTEM:                 { Icon: Settings,      iconColor: 'text-neutral-600', iconBg: 'bg-neutral-100', label: 'System' },
  SYSTEM_ALERT:           { Icon: AlertTriangle, iconColor: 'text-error-600',   iconBg: 'bg-error-100',   label: 'System Alert' },
  REPORT_READY:           { Icon: FileCheck,     iconColor: 'text-success-600', iconBg: 'bg-success-100', label: 'Report Ready' },
  TOPIC:                  { Icon: Lightbulb,     iconColor: 'text-warning-600', iconBg: 'bg-warning-100', label: 'Topic' },
  TOPIC_REVIEW:           { Icon: Lightbulb,     iconColor: 'text-warning-600', iconBg: 'bg-warning-100', label: 'Topic Review' },
  TOPIC_CONFIRMED:        { Icon: Lightbulb,     iconColor: 'text-success-600', iconBg: 'bg-success-100', label: 'Topic Confirmed' },
  NEW_REQUEST:            { Icon: Mail,          iconColor: 'text-primary-600', iconBg: 'bg-primary-100', label: 'New Request' },
  MEETING_REQUEST:        { Icon: Calendar,      iconColor: 'text-primary-600', iconBg: 'bg-primary-100', label: 'Meeting' },
  MEETING_CONFIRMED:      { Icon: CheckCircle,   iconColor: 'text-success-600', iconBg: 'bg-success-100', label: 'Meeting Confirmed' },
  MEETING_CANCELLED:      { Icon: XCircle,       iconColor: 'text-error-600',   iconBg: 'bg-error-100',   label: 'Meeting Cancelled' },
  LOG_SUBMITTED:          { Icon: ClipboardList, iconColor: 'text-info-600',    iconBg: 'bg-info-100',    label: 'Log Submitted' },
  DOCUMENT_UPLOADED:      { Icon: FolderOpen,    iconColor: 'text-info-600',    iconBg: 'bg-info-100',    label: 'Document' },
  PROPOSAL_SUBMITTED:     { Icon: FileText,      iconColor: 'text-info-600',    iconBg: 'bg-info-100',    label: 'Proposal Submitted' },
  PROPOSAL_REVISED:       { Icon: FileText,      iconColor: 'text-warning-600', iconBg: 'bg-warning-100', label: 'Proposal Revised' },
  PROPOSAL_REVISION:      { Icon: FileText,      iconColor: 'text-warning-600', iconBg: 'bg-warning-100', label: 'Proposal Revision' },
  STUDENT_UNPAIRED_ALERT: { Icon: Users,         iconColor: 'text-error-600',   iconBg: 'bg-error-100',   label: 'Unpaired Student' },
  SUPERVISOR_OVERLOAD:    { Icon: AlertTriangle, iconColor: 'text-warning-600', iconBg: 'bg-warning-100', label: 'Supervisor Overload' },
  PAIRING_REQUEST:        { Icon: Users,         iconColor: 'text-info-600',    iconBg: 'bg-info-100',    label: 'Pairing Request' },
}

const FALLBACK: NotificationDisplay = {
  Icon: Bell,
  iconColor: 'text-neutral-600',
  iconBg: 'bg-neutral-100',
  label: 'Notification',
}

// Same backend type ≠ same outcome. e.g. "Supervision Request Accepted" and
// "Supervision Request Declined" both arrive as type=REQUEST, but a user
// scanning the list needs a green check vs a red X at a glance.
export function getNotificationDisplay(
  type: string | undefined | null,
  title?: string | null,
): NotificationDisplay {
  const base = (type && BASE_DISPLAY[type]) || FALLBACK
  if (!title) return base
  const t = title.toLowerCase()

  if (type === 'REQUEST') {
    if (t.includes('accept')) return { Icon: CheckCircle, iconColor: 'text-success-600', iconBg: 'bg-success-100', label: 'Request Accepted' }
    if (t.includes('declin') || t.includes('reject')) return { Icon: XCircle, iconColor: 'text-error-600', iconBg: 'bg-error-100', label: 'Request Declined' }
  }
  if (type === 'PROPOSAL') {
    if (t.includes('approved')) return { Icon: FileCheck, iconColor: 'text-success-600', iconBg: 'bg-success-100', label: 'Proposal Approved' }
    if (t.includes('reject')) return { Icon: XCircle, iconColor: 'text-error-600', iconBg: 'bg-error-100', label: 'Proposal Rejected' }
    if (t.includes('revision')) return { Icon: FileText, iconColor: 'text-warning-600', iconBg: 'bg-warning-100', label: 'Revision Required' }
    if (t.includes('feedback')) return { Icon: MessageSquare, iconColor: 'text-warning-600', iconBg: 'bg-warning-100', label: 'Proposal Feedback' }
    if (t.includes('submit')) return { Icon: FileText, iconColor: 'text-info-600', iconBg: 'bg-info-100', label: 'Proposal Submitted' }
  }
  if (type === 'MEETING') {
    if (t.includes('confirm')) return { Icon: CheckCircle, iconColor: 'text-success-600', iconBg: 'bg-success-100', label: 'Meeting Confirmed' }
    if (t.includes('cancel')) return { Icon: XCircle, iconColor: 'text-error-600', iconBg: 'bg-error-100', label: 'Meeting Cancelled' }
    if (t.includes('reschedul')) return { Icon: RefreshCw, iconColor: 'text-warning-600', iconBg: 'bg-warning-100', label: 'Rescheduled' }
    if (t.includes('correction')) return { Icon: AlertTriangle, iconColor: 'text-warning-600', iconBg: 'bg-warning-100', label: 'Correction Required' }
    if (t.includes('sign')) return { Icon: FileCheck, iconColor: 'text-info-600', iconBg: 'bg-info-100', label: 'Awaiting Signature' }
  }
  if (type === 'FYP1_RESULT') {
    if (t.includes('fail')) return { Icon: XCircle, iconColor: 'text-error-600', iconBg: 'bg-error-100', label: 'FYP1 Failed' }
    if (t.includes('pass')) return { Icon: GraduationCap, iconColor: 'text-success-600', iconBg: 'bg-success-100', label: 'FYP1 Passed' }
  }
  return base
}

// One time-format used everywhere. < 1 min: "Just now", < 1h: "12m ago",
// < 24h: "5h ago", "Yesterday", < 7d: "3d ago", otherwise absolute "23 May 2026"
// via the shared formatDate utility.
export function formatNotificationTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000)
  if (diffSec < 60) return 'Just now'
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDay = Math.floor(diffHr / 24)
  if (diffDay === 1) return 'Yesterday'
  if (diffDay < 7) return `${diffDay}d ago`
  return formatDate(date)
}
