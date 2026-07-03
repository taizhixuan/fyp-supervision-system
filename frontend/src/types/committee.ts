// Committee Dashboard Types
import type { ProposalContentData } from '@/components/common/ProposalContentSections'

export interface DashboardDeadline {
  deadlineId: number
  title: string
  description?: string
  dueDate: string
  deadlineType?: string
  audience?: string
  cycleType?: string
}

export interface CommitteeDashboardStats {
  totalProposals: number
  pendingReviews: number
  approvedProposals: number
  rejectedProposals: number
  totalStudents: number
  unpairedStudents: number
  totalSupervisors: number
  overloadedSupervisors: number
  activeProjects: number
  completedProjects: number
  fyp1Students: number
  fyp2Students: number
  upcomingDeadlines?: DashboardDeadline[]
}

export interface DashboardAlert {
  alertId: number
  type: 'WARNING' | 'INFO' | 'URGENT'
  title: string
  message: string
  createdAt: string
  isRead: boolean
}

export interface RecentActivity {
  activityId: number
  type: 'PROPOSAL_SUBMITTED' | 'PROPOSAL_REVIEWED' | 'STUDENT_PAIRED' | 'ANNOUNCEMENT_CREATED' | 'DOCUMENT_UPLOADED'
  title: string
  description: string
  timestamp: string
  actor?: string
}

// Cycle types
export type CycleStatus = 'PLANNING' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED'

export interface CycleSummary {
  cycleId: number
  cycleCode: string
  cycleType: 'FYP1' | 'FYP2'
  academicYear: string
  semester: number
  startDate: string
  endDate: string
  status: CycleStatus
  projectCount: number
}

// Announcement Types
export type AnnouncementScope = 'ALL' | 'FYP1' | 'FYP2' | 'PROGRAMME_CS' | 'PROGRAMME_SE' | 'PROGRAMME_DS'
export type CommitteeAnnouncementPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
export type AnnouncementStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'

export interface FYPAnnouncement {
  announcementId: number
  title: string
  content: string
  scope: AnnouncementScope
  priority: CommitteeAnnouncementPriority
  status: AnnouncementStatus
  publishAt: string
  expiresAt?: string
  createdBy: string
  createdAt: string
  updatedAt: string
  viewCount: number
  attachments?: AnnouncementAttachment[]
  links?: AnnouncementLink[]
}

export interface AnnouncementAttachment {
  attachmentId: number
  fileName: string
  fileSize: number
  mimeType?: string
  /**
   * Backend returns a relative path under /announcements/{id}/attachments/{attId}.
   * Kept as `downloadUrl` going forward; legacy `fileUrl` retained for back-compat.
   */
  downloadUrl?: string
  fileUrl?: string
}

export interface AnnouncementLink {
  linkId: number
  label: string
  url: string
}

export interface CreateAnnouncementData {
  title: string
  content: string
  scope: AnnouncementScope
  priority: CommitteeAnnouncementPriority
  publishAt: string
  expiresAt?: string
  /** New: File objects uploaded as multipart parts. */
  attachments?: File[]
  /** New: external links (label + URL pairs). */
  links?: { label: string; url: string }[]
}

// Proposal Review Types
export type CommitteeProposalStatus = 'PENDING_REVIEW' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'REVISION_REQUESTED'

export interface ProposalForCommitteeReview {
  proposalId: number
  title: string
  studentName: string
  studentId: string
  studentEmail: string
  programme: string
  cycle: 'FYP1' | 'FYP2'
  supervisorName: string
  supervisorId: string
  submittedAt: string
  status: CommitteeProposalStatus
  version: number
  aiAnalysis?: AIProposalAnalysis
  reviewHistory: ProposalReviewEntry[]
  documentUrl: string | null
  fileName?: string | null
  content?: ProposalContentData
  previousVersions?: CommitteeProposalVersion[]
  abstract?: string
  objectives?: string[]
  methodology?: string
}

export interface CommitteeProposalVersion {
  versionId: number
  version: number
  status: string
  submittedAt?: string
  createdAt?: string
  content?: ProposalContentData
  fileUrl?: string | null
  fileName?: string | null
}

export interface AIProposalAnalysis {
  overallScore: number
  feasibilityScore: number
  innovationScore: number
  clarityScore: number
  scopeScore: number
  strengths: string[]
  weaknesses: string[]
  suggestions: string[]
  analyzedAt: string
}

export interface ProposalReviewEntry {
  reviewId: number
  reviewerName: string
  reviewerRole: 'SUPERVISOR' | 'COMMITTEE'
  decision: 'APPROVED' | 'REJECTED' | 'REVISION_REQUESTED'
  feedback: string
  reviewedAt: string
}

export interface SubmitProposalReviewData {
  proposalId: number
  decision: 'APPROVED' | 'REJECTED' | 'REVISION_REQUESTED'
  feedback: string
  internalNotes?: string
}

// General Documents Types
export type CommitteeDocumentCategory = 'TEMPLATE' | 'RUBRIC' | 'HANDBOOK' | 'GUIDELINE' | 'FORM' | 'OTHER'
export type DocumentVisibility = 'PUBLIC' | 'STUDENTS_ONLY' | 'SUPERVISORS_ONLY' | 'COMMITTEE_ONLY'

export interface GeneralDocument {
  documentId: number
  title: string
  description?: string
  category: CommitteeDocumentCategory
  visibility: DocumentVisibility
  fileName: string
  fileSize: number
  fileUrl: string
  isActive: boolean
  uploadedBy: string
  uploadedAt: string
  updatedAt: string
  downloadCount: number
}

export type CommitteeDocumentCycleScope = 'EVERGREEN' | 'FYP1' | 'FYP2'

export interface CommitteeUploadDocumentData {
  title: string
  description?: string
  category: CommitteeDocumentCategory
  visibility: DocumentVisibility
  cycleScope?: CommitteeDocumentCycleScope
  file: File
  changeNotes?: string
}

// Project & Pairing Types
// Matches backend enum ProjectStatus { ACTIVE, COMPLETED, SUSPENDED, DROPPED }.
export type CommitteeProjectStatus = 'ACTIVE' | 'COMPLETED' | 'SUSPENDED' | 'DROPPED'
export type PairingStatus = 'UNPAIRED' | 'PENDING_APPROVAL' | 'PAIRED'

export interface ProjectOverview {
  projectId: number
  title: string
  studentName: string
  studentId: string
  studentEmail: string
  programme: string
  // Legacy field kept for one release; prefer cycleCode/cycleType.
  cycle: 'FYP1' | 'FYP2' | ''
  cycleId?: number
  cycleCode?: string
  cycleType?: 'FYP1' | 'FYP2'
  academicYear?: string
  cycleStatus?: CycleStatus
  supervisorName?: string
  supervisorId?: string
  pairingStatus: PairingStatus
  projectStatus: CommitteeProjectStatus
  proposalStatus: CommitteeProposalStatus
  progress: number
  lastActivity: string
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  riskFactors: string[]
}

export interface UnpairedStudent {
  studentId: string
  userId: string
  fullName: string
  email: string
  programme: string
  cycle: 'FYP1' | 'FYP2' | ''
  cycleId?: number
  cycleCode?: string
  cycleType?: 'FYP1' | 'FYP2'
  academicYear?: string
  cycleStatus?: CycleStatus
  registeredAt: string
  requestsSent: number
  requestsRejected: number
  lastRequestAt?: string
  preferredAreas?: string[]
}

export interface SupervisorLoad {
  supervisorId: string
  userId: string
  fullName: string
  email: string
  department: string
  currentLoad: number
  maxCapacity: number
  fyp1Students: number
  fyp2Students: number
  utilizationRate: number
  isOverloaded: boolean
  expertise: string[]
  students: SupervisorStudentSummary[]
}

export interface SupervisorStudentSummary {
  studentId: string
  fullName: string
  cycle: 'FYP1' | 'FYP2' | ''
  cycleId?: number
  cycleCode?: string
  cycleType?: 'FYP1' | 'FYP2'
  projectTitle?: string
  progress: number
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
}

export interface ProjectEngagement {
  lockedLogs: number
  requiredLogs: number
  completedMeetings: number
  lastConductedMeetingAt: string | null
  proposalStatus: string
  proposalVersion: number
}

export interface ProjectDetail {
  projectId: number
  title: string
  description?: string
  studentId: string
  studentName: string
  studentEmail: string
  programme: string
  cycle: string
  cycleId?: number
  cycleCode?: string
  cycleType?: 'FYP1' | 'FYP2'
  academicYear?: string
  cycleStatus?: CycleStatus
  supervisorId?: string
  supervisorName?: string
  supervisorEmail?: string
  supervisorDepartment?: string
  pairingStatus: PairingStatus
  projectStatus: CommitteeProjectStatus
  proposalStatus?: CommitteeProposalStatus
  progress: number
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  riskFactors: string[]
  registeredAt: string
  pairedAt?: string
  engagement?: ProjectEngagement
  recentMeetings?: RecentMeeting[]
}

export interface RecentMeeting {
  meetingId: number
  title: string
  scheduledAt: string
  status: 'PROPOSED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED'
}

export interface MeetingSummary {
  meetingId: number
  date: string
  type: string
  status: string
}

export interface DocumentSummary {
  documentId: number
  title: string
  type: string
  uploadedAt: string
}

export interface LogSummary {
  logId: number
  weekNumber: number
  submittedAt: string
  status: string
}

export interface ProjectTimelineEvent {
  eventId: number
  type: string
  title: string
  description: string
  timestamp: string
}

export interface ExportOptions {
  format: 'CSV' | 'PDF' | 'EXCEL'
  includeFields: string[]
  filters: {
    cycle?: 'FYP1' | 'FYP2'
    programme?: string
    status?: string
    dateRange?: {
      start: string
      end: string
    }
  }
}

// Reports Types
export type ReportType =
  | 'PAIRING_STATUS'
  | 'SUPERVISOR_LOAD'
  | 'PROPOSAL_SUMMARY'
  | 'MEETING_LOG_COMPLIANCE'
  | 'RISK_ASSESSMENT'

export type ReportFormat = 'CSV' | 'XLSX' | 'PDF'

export interface ReportConfig {
  reportType: ReportType
  format: ReportFormat
  title?: string
  filters: {
    cycleId?: number
    cycleStatus?: CycleStatus
    programme?: string
    dateFrom?: string
    dateTo?: string
    supervisorId?: number
  }
}

export interface GeneratedReport {
  reportId: number
  reportType: ReportType
  title: string
  status: 'COMPLETED' | 'FAILED' | 'PENDING'
  format: ReportFormat
  fileSize: number
  downloadUrl: string
  filters: ReportConfig['filters']
  generatedBy: string
  generatedAt: string
  expiresAt: string
}

// Notification Types
// Shared /notifications endpoint emits these 9 backend types. Trailing
// `(string & {})` admits legacy values without erroring at call sites —
// getNotificationDisplay handles unknown fallback.
export type CommitteeNotificationType =
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

export interface CommitteeNotification {
  notificationId: number
  type: CommitteeNotificationType
  title: string
  message: string
  isRead: boolean
  createdAt: string
  relatedEntityId?: number
  relatedEntityType?: string
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
}
