// MMU FCI Meeting Log Types

/**
 * Task codes matching the official MMU Meeting Log format
 */
export type MeetingLogTaskCode =
  | 'PLANNING'
  | 'LITERATURE_REVIEW'
  | 'REQUIREMENT_ANALYSIS'
  | 'DESIGN_METHODOLOGY'
  | 'PROTOTYPE_POC'
  | 'DRAFT_REPORT'

/**
 * Meeting log workflow status
 */
export type MeetingLogStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'CORRECTION_REQUIRED'
  | 'SUPERVISOR_SIGNED'
  | 'LOCKED'

/**
 * Meeting mode
 */
export type MeetingMode = 'ONLINE' | 'PHYSICAL'

/**
 * FYP Phase
 */
export type FYPPhase = 'FYP1' | 'FYP2'

/**
 * Task configuration for the 6 MMU standard tasks
 */
export interface MeetingLogTask {
  taskCode: MeetingLogTaskCode
  label: string
  isSelected: boolean
  details?: string
}

/**
 * Signature record for a meeting log
 */
export interface MeetingLogSignature {
  signatureId: string
  signerUserId: string
  signerName: string
  signerRole: 'STUDENT' | 'SUPERVISOR'
  signatureImageUrl?: string
  signatureSha256: string
  signedAt: string
}

/**
 * Student info in meeting log context
 */
export interface MeetingLogStudent {
  studentId: string
  fullName: string
  matricNo: string
  programme: string
}

/**
 * Supervisor info in meeting log context
 */
export interface MeetingLogSupervisor {
  supervisorId: string
  fullName: string
  title?: string
}

/**
 * Main Meeting Log entity matching MMU FCI format
 */
export interface MeetingLog {
  // Identity
  logId: string
  meetingId?: string
  projectId: string

  // Header metadata (Page 1)
  meetingDate: string
  meetingNumber: number
  meetingMode: MeetingMode
  projectTitle: string
  fypPhase: FYPPhase

  // Participants
  student: MeetingLogStudent
  supervisor: MeetingLogSupervisor
  coSupervisor?: {
    name: string
  }

  // Section 1: Tasks (with strike-through for unselected)
  tasks: MeetingLogTask[]
  workDoneDetails: string

  // Section 2: Work To Be Done
  workToBeDone: string

  // Section 3: Problems Faced & Solutions
  problemsAndSolutions: string

  // Section 4: Supervisor Comments
  supervisorComments: string

  // Workflow
  status: MeetingLogStatus
  correctionReason?: string
  signatures: MeetingLogSignature[]

  // Timestamps
  createdAt: string
  updatedAt: string
  submittedAt?: string
  lockedAt?: string
}

/**
 * Data for creating a new meeting log
 */
export interface CreateMeetingLogData {
  meetingId?: string
  meetingDate: string
  meetingNumber: number
  meetingMode: MeetingMode
  projectTitle: string
  fypPhase: FYPPhase
  tasks: Omit<MeetingLogTask, 'label'>[]
  workDoneDetails: string
  workToBeDone: string
  problemsAndSolutions: string
}

/**
 * Data for updating an existing meeting log
 */
export interface UpdateMeetingLogData {
  meetingDate?: string
  meetingNumber?: number
  meetingMode?: MeetingMode
  projectTitle?: string
  fypPhase?: FYPPhase
  tasks?: Omit<MeetingLogTask, 'label'>[]
  workDoneDetails?: string
  workToBeDone?: string
  problemsAndSolutions?: string
}

/**
 * Data for adding supervisor comments
 */
export interface AddSupervisorCommentsData {
  supervisorComments: string
}

/**
 * Data for signing a meeting log
 */
export interface SignMeetingLogData {
  signatureImageDataUrl: string
  signatureSha256: string
}

/**
 * Request correction data
 */
export interface RequestCorrectionData {
  correctionReason: string
}

/**
 * Standard task configuration - labels matching MMU format
 */
export const MEETING_LOG_TASKS: Record<MeetingLogTaskCode, string> = {
  PLANNING: 'Planning',
  LITERATURE_REVIEW: 'Literature Review',
  REQUIREMENT_ANALYSIS: 'Requirement Analysis',
  DESIGN_METHODOLOGY: 'Design & Methodology',
  PROTOTYPE_POC: 'Prototype / Proof of Concept',
  DRAFT_REPORT: 'Draft Report / Report Writing',
}

/**
 * Get default tasks array with all tasks unselected
 */
export function getDefaultTasks(): MeetingLogTask[] {
  return (Object.keys(MEETING_LOG_TASKS) as MeetingLogTaskCode[]).map((code) => ({
    taskCode: code,
    label: MEETING_LOG_TASKS[code],
    isSelected: false,
    details: '',
  }))
}

/**
 * Status configuration for UI display
 */
export const MEETING_LOG_STATUS_CONFIG: Record<
  MeetingLogStatus,
  {
    label: string
    variant: 'default' | 'warning' | 'success' | 'error' | 'info'
    description: string
    color: string
    bgColor: string
  }
> = {
  DRAFT: {
    label: 'Draft',
    variant: 'default',
    description: 'Log is saved as draft, not yet submitted',
    color: 'text-stone-600',
    bgColor: 'bg-stone-100',
  },
  SUBMITTED: {
    label: 'Submitted',
    variant: 'warning',
    description: 'Waiting for supervisor review',
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
  },
  CORRECTION_REQUIRED: {
    label: 'Correction Required',
    variant: 'error',
    description: 'Supervisor has requested changes',
    color: 'text-rose-600',
    bgColor: 'bg-rose-100',
  },
  SUPERVISOR_SIGNED: {
    label: 'Supervisor Signed',
    variant: 'info',
    description: 'Supervisor has signed, awaiting student signature',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  LOCKED: {
    label: 'Completed',
    variant: 'success',
    description: 'Both parties signed, log is finalized',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100',
  },
}
