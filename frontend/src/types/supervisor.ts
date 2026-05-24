// Supervisor types for the FYP Supervision System

// Base supervisor profile
export interface SupervisorProfile {
  supervisorId: string
  userId: string
  fullName: string
  email: string
  department: string
  faculty: string
  position: string
  researchAreas: string[]
  expertise: string[]
  currentSupervisionCount: number
  maxSupervisionQuota: number
  availableSlots: number
  isAcceptingStudents: boolean
  preferredProjectTypes: string[]
  bio?: string
  officeLocation?: string
  phoneNumber?: string
  linkedInUrl?: string
  googleScholarUrl?: string
  createdAt: string
  updatedAt: string
  /** Recent projects this supervisor has supervised, newest first */
  pastProjects?: SupervisorPastProject[]
}

export interface SupervisorPastProject {
  title: string
  status?: string
  year?: number | null
}

// Supervision request from student
export type RequestStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN' | 'EXPIRED'

export interface SvSupervisionRequest {
  requestId: number
  studentId: string
  studentName: string
  studentEmail: string
  studentProgram: string
  studentYear: number
  studentCGPA?: number
  proposedTitle: string
  projectDescription: string
  researchArea: string
  motivation: string
  status: RequestStatus
  submittedAt: string
  respondedAt?: string
  rejectionReason?: string
  attachments?: RequestAttachment[]
}

export interface RequestAttachment {
  attachmentId: number
  fileName: string
  fileType: string
  fileSize: number
  storagePath: string
  uploadedAt: string
}

// Supervisee (student under supervision)
// Matches backend enum ProjectStatus { ACTIVE, COMPLETED, SUSPENDED, DROPPED }.
export type ProjectStatus = 'ACTIVE' | 'COMPLETED' | 'SUSPENDED' | 'DROPPED'
export type SvProposalStatus = 'NOT_SUBMITTED' | 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'REVISION_REQUIRED' | 'APPROVED' | 'REJECTED'

export interface Supervisee {
  superviseeId: string
  userId: string
  studentId: string
  fullName: string
  email: string
  program: string
  year: number
  cgpa?: number
  projectTitle: string
  projectStatus: ProjectStatus
  proposalStatus: SvProposalStatus
  supervisionStartDate: string
  expectedCompletionDate: string
  lastMeetingDate?: string
  nextMeetingDate?: string
  totalMeetings: number
  pendingLogs: number
  totalLogs: number
  documentsCount: number
  overallProgress: number // 0-100
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
}

// Proposal for review
export interface ProposalForReview {
  proposalId: number
  studentId: string
  studentName: string
  title: string
  version: number
  status: SvProposalStatus
  submittedAt: string
  lastUpdatedAt: string
  content: {
    background: string
    problemStatement: string
    objectives: string[]
    scope: string
    methodology: string
    expectedOutcomes: string
    timeline: string
  }
  aiAnalysis?: {
    overallScore: number
    clarityScore: number
    feasibilityScore: number
    originality: number
    suggestions: string[]
    strengths: string[]
    weaknesses: string[]
    analyzedAt: string
  }
  previousVersions: SvProposalVersion[]
  feedbackHistory: SvProposalFeedback[]
}

export interface SvProposalVersion {
  versionId: number
  version: number
  submittedAt: string
  status: SvProposalStatus
}

export interface SvProposalFeedback {
  feedbackId: number
  supervisorId: string
  supervisorName: string
  content: string
  feedbackType: 'COMMENT' | 'REVISION_REQUEST' | 'APPROVAL' | 'REJECTION'
  createdAt: string
}

// Meeting types for supervisor
export type SvMeetingStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED' | 'NO_SHOW'
export type MeetingType = 'IN_PERSON' | 'ONLINE' | 'HYBRID'
export type OnlinePlatform = 'MICROSOFT_TEAMS' | 'ZOOM' | 'GOOGLE_MEET' | 'WEBEX' | 'OTHER'

export interface SupervisorMeeting {
  meetingId: number
  studentId: string
  studentName: string
  title: string
  type: MeetingType
  status: SvMeetingStatus
  requestedBy: 'STUDENT' | 'SUPERVISOR'
  proposedDateTime: string
  alternativeDateTimes?: string[]
  confirmedDateTime?: string
  duration: number // in minutes
  location?: string
  meetingUrl?: string
  onlinePlatform?: OnlinePlatform
  agenda?: string
  notes?: string
  cancelReason?: string
  actionItems?: string[]
  createdAt: string
  updatedAt: string
}

// Supervision Log for review
export type SvLogStatus = 'PENDING' | 'APPROVED' | 'REVISION_REQUIRED' | 'SIGNED' | 'LOCKED'

export interface SupervisionLogForReview {
  logId: number
  studentId: string
  studentName: string
  weekNumber: number
  weekStartDate: string
  weekEndDate: string
  status: SvLogStatus
  activities: string
  progressSummary: string
  challenges?: string
  nextWeekPlan: string
  hoursSpent: number
  submittedAt: string
  supervisorComment?: string
  supervisorSignedAt?: string
  lockedAt?: string
  attachments?: LogAttachment[]
}

export interface LogAttachment {
  attachmentId: number
  fileName: string
  fileType: string
  fileSize: number
  storagePath: string
}

// Document types for supervisor
export type SvDocumentType = 'PROPOSAL' | 'REPORT' | 'PRESENTATION' | 'MEETING_NOTES' | 'REFERENCE' | 'FEEDBACK' | 'OTHER'

export interface SuperviseeDocument {
  documentId: number
  studentId: string
  studentName: string
  title: string
  type: SvDocumentType
  version: number
  fileName: string
  fileType: string
  fileSize: number
  storagePath: string
  description?: string
  uploadedAt: string
  lastViewedAt?: string
  hasFeedback: boolean
  feedbackCount: number
}

export interface DocumentFeedback {
  feedbackId: number
  documentId: number
  supervisorId: string
  supervisorName: string
  content: string
  annotatedFilePath?: string
  createdAt: string
}

// Announcement types
export type AnnouncementVisibility = 'ALL_SUPERVISEES' | 'SPECIFIC_STUDENTS' | 'FYP1' | 'FYP2'
export type AnnouncementPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'

export interface SupervisorAnnouncementAttachment {
  attachmentId: number
  fileName: string
  fileSize: number
  mimeType?: string
  downloadUrl?: string
}

export interface SupervisorAnnouncementLink {
  linkId: number
  label: string
  url: string
}

export interface SupervisorAnnouncement {
  announcementId: number
  supervisorId: string
  title: string
  content: string
  visibility: AnnouncementVisibility
  priority: AnnouncementPriority
  targetStudentIds?: number[]
  publishAt: string
  expiresAt?: string
  isActive: boolean
  viewCount: number
  createdAt: string
  updatedAt: string
  attachments?: SupervisorAnnouncementAttachment[]
  links?: SupervisorAnnouncementLink[]
  /** "SENT" — supervisor created it; "RECEIVED" — broadcast by committee/admin. */
  direction?: 'SENT' | 'RECEIVED'
  /** Display name of the author (for received items). */
  createdBy?: string
}

export interface CreateSupervisorAnnouncementData {
  title: string
  content: string
  visibility: AnnouncementVisibility
  priority: AnnouncementPriority
  targetStudentIds?: number[]
  publishAt?: string
  expiresAt?: string
  attachments?: File[]
  links?: { label: string; url: string }[]
}

// Dashboard statistics
export interface SupervisorDashboardStats {
  totalSupervisees: number
  pendingRequests: number
  upcomingMeetings: number
  pendingLogReviews: number
  proposalsToReview: number
  documentsToReview: number
  activeAnnouncements: number
  superviseesByStatus: {
    notStarted: number
    inProgress: number
    completed: number
    onHold: number
  }
  superviseesByRisk: {
    low: number
    medium: number
    high: number
    critical: number
  }
  recentActivity: DashboardActivity[]
}

export interface DashboardActivity {
  activityId: number
  type: 'REQUEST' | 'MEETING' | 'LOG' | 'DOCUMENT' | 'PROPOSAL' | 'ANNOUNCEMENT'
  title: string
  description: string
  studentId?: string
  studentName?: string
  timestamp: string
  actionRequired: boolean
}

// Profile audit log entry
export type ProfileAuditAction = 'UPDATE_PROFILE' | 'UPDATE_RESEARCH_AREAS' | 'UPDATE_QUOTA' | 'TOGGLE_AVAILABILITY'

export interface ProfileAuditEntry {
  auditId: number
  supervisorId: string
  action: ProfileAuditAction
  field: string
  oldValue: string
  newValue: string
  timestamp: string
  ipAddress?: string
}

// The shared /notifications endpoint emits these 9 backend types. The
// trailing `string` admits unknown/legacy values (e.g. NEW_REQUEST) without
// type errors at filter call sites — getNotificationDisplay handles fallback.
export type SupervisorNotificationType =
  | 'ACCOUNT_APPROVED'
  | 'ACCOUNT_REJECTED'
  | 'CYCLE_STATUS'
  | 'DEADLINE'
  | 'FYP1_RESULT'
  | 'MEETING'
  | 'PROPOSAL'
  | 'REGISTRATION_PENDING'
  | 'REQUEST'
  | 'SYSTEM'
  // Trailing string admits legacy/unknown values without erroring at call sites.
  // eslint-disable-next-line @typescript-eslint/ban-types
  | (string & {})

export interface SupervisorNotification {
  notificationId: number
  userId: string
  type: SupervisorNotificationType
  title: string
  message: string
  isRead: boolean
  relatedEntityId?: number
  relatedEntityType?: string
  createdAt: string
}
