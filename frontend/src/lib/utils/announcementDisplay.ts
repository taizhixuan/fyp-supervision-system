import { AlertOctagon, AlertTriangle, Info, Megaphone } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface PriorityDisplay {
  label: string
  Icon: LucideIcon
  // For pill badges
  pillClass: string
  // For the left rail / border on cards
  barClass: string
  borderClass: string
  // For the avatar tile that holds the icon
  iconClass: string
  // Used when sorting URGENT to top
  rank: number
}

const FALLBACK: PriorityDisplay = {
  label: 'Normal',
  Icon: Info,
  pillClass: 'bg-info-100 text-info-700',
  barClass: 'bg-info-400',
  borderClass: 'border-l-info-400',
  iconClass: 'text-info-700 bg-info-100',
  rank: 2,
}

export const PRIORITY_DISPLAY: Record<string, PriorityDisplay> = {
  URGENT: {
    label: 'Urgent',
    Icon: AlertOctagon,
    pillClass: 'bg-error-100 text-error-700',
    barClass: 'bg-error-500',
    borderClass: 'border-l-error-500',
    iconClass: 'text-error-700 bg-error-100',
    rank: 4,
  },
  HIGH: {
    label: 'High',
    Icon: AlertTriangle,
    pillClass: 'bg-warning-100 text-warning-700',
    barClass: 'bg-warning-500',
    borderClass: 'border-l-warning-500',
    iconClass: 'text-warning-700 bg-warning-100',
    rank: 3,
  },
  NORMAL: {
    label: 'Normal',
    Icon: Info,
    pillClass: 'bg-info-100 text-info-700',
    barClass: 'bg-info-400',
    borderClass: 'border-l-info-400',
    iconClass: 'text-info-600 bg-info-100',
    rank: 2,
  },
  LOW: {
    label: 'Low',
    Icon: Megaphone,
    pillClass: 'bg-neutral-100 text-neutral-600',
    barClass: 'bg-neutral-300',
    borderClass: 'border-l-neutral-300',
    iconClass: 'text-neutral-500 bg-neutral-100',
    rank: 1,
  },
}

export function getPriorityDisplay(priority: string | undefined | null): PriorityDisplay {
  if (!priority) return FALLBACK
  return PRIORITY_DISPLAY[priority] ?? FALLBACK
}

// Scope / audience labels — backend ships raw enum values like SPECIFIC_STUDENTS
// or PROGRAMME_CS. Centralise the human-friendly mapping so every role page
// agrees and nothing leaks an all-caps underscore token into the UI.
export const SCOPE_LABEL: Record<string, string> = {
  ALL: 'All Users',
  ALL_STUDENTS: 'All Students',
  ALL_SUPERVISEES: 'All Supervisees',
  SPECIFIC_STUDENTS: 'Targeted',
  FYP1: 'FYP1 Students',
  FYP2: 'FYP2 Students',
  PROGRAMME_CS: 'Computer Science',
  PROGRAMME_SE: 'Software Engineering',
  PROGRAMME_DS: 'Data Science',
  PROGRAMME_IT: 'Information Technology',
}

export function getScopeLabel(scope: string | undefined | null): string {
  if (!scope) return ''
  if (SCOPE_LABEL[scope]) return SCOPE_LABEL[scope]
  // Friendly fallback: turn "PROGRAMME_FOO" → "Programme foo", "WEIRD_SCOPE" → "Weird scope".
  const cleaned = scope.replace(/_/g, ' ').toLowerCase()
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
}
