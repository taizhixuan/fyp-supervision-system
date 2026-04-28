// Committee Dashboard Types
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
}

export interface AnnouncementAttachment {
  attachmentId: number
  fileName: string
  fileSize: number
  fileUrl: string
}

export interface CreateAnnouncementData {
  title: string
  content: string
  scope: AnnouncementScope
  priority: CommitteeAnnouncementPriority
  publishAt: string
  expiresAt?: string
  attachments?: File[]
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
  documentUrl: string
  abstract?: string
  objectives?: string[]
  methodology?: string
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
  plagiarismScore: number
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
  version: number
  isActive: boolean
  uploadedBy: string
  uploadedAt: string
  updatedAt: string
  downloadCount: number
  versions: CommitteeDocumentVersion[]
}

export interface CommitteeDocumentVersion {
  versionId: number
  version: number
  fileName: string
  fileSize: number
  fileUrl: string
  uploadedBy: string
  uploadedAt: string
  changeNotes?: string
}

export interface CommitteeUploadDocumentData {
  title: string
  description?: string
  category: CommitteeDocumentCategory
  visibility: DocumentVisibility
  file: File
  changeNotes?: string
}

// Project & Pairing Types
export type CommitteeProjectStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD' | 'CANCELLED'
export type PairingStatus = 'UNPAIRED' | 'PENDING_APPROVAL' | 'PAIRED'

export interface ProjectOverview {
  projectId: number
  title: string
  studentName: string
  studentId: string
  studentEmail: string
  programme: string
  cycle: 'FYP1' | 'FYP2'
  supervisorName?: string
  supervisorId?: string
  pairingStatus: PairingStatus
  projectStatus: CommitteeProjectStatus
  proposalStatus: CommitteeProposalStatus
  progress: number
  lastActivity: string
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
}

export interface UnpairedStudent {
  studentId: string
  userId: string
  fullName: string
  email: string
  programme: string
  cycle: 'FYP1' | 'FYP2'
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
  cycle: 'FYP1' | 'FYP2'
  projectTitle?: string
  progress: number
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
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
  supervisorId?: string
  supervisorName?: string
  supervisorEmail?: string
  supervisorDepartment?: string
  pairingStatus: PairingStatus
  projectStatus: CommitteeProjectStatus
  proposalStatus?: CommitteeProposalStatus
  progress: number
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  riskFactors?: string[]
  registeredAt: string
  pairedAt?: string
  milestones?: ProjectMilestone[]
  recentMeetings?: RecentMeeting[]
  submissions?: ProjectSubmission[]
}

export interface ProjectMilestone {
  milestoneId: number
  title: string
  dueDate?: string
  completedAt?: string
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE'
}

export interface RecentMeeting {
  meetingId: number
  title: string
  scheduledAt: string
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED'
}

export interface ProjectSubmission {
  submissionId: number
  title: string
  submittedAt: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'REVISION_REQUIRED'
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
  | 'PROPOSAL_SUMMARY'
  | 'STUDENT_PROGRESS'
  | 'SUPERVISOR_LOAD'
  | 'PAIRING_STATUS'
  | 'MEETING_STATISTICS'
  | 'LOG_COMPLIANCE'
  | 'DOCUMENT_SUBMISSIONS'
  | 'COMPREHENSIVE'

export interface ReportConfig {
  reportType: ReportType
  title: string
  description: string
  filters: ReportFilters
  format: 'PDF' | 'EXCEL' | 'CSV'
  includeCharts: boolean
  includeSummary: boolean
}

export interface ReportFilters {
  cycle?: 'FYP1' | 'FYP2' | 'ALL'
  programme?: string
  semester?: string
  academicYear?: string
  dateRange?: {
    start: string
    end: string
  }
  supervisorId?: string
  status?: string
}

export interface GeneratedReport {
  reportId: number
  reportType: ReportType
  title: string
  generatedBy: string
  generatedAt: string
  format: 'PDF' | 'EXCEL' | 'CSV'
  fileSize: number
  fileUrl: string
  filters: ReportFilters
  expiresAt: string
}

// Notification Types
export type CommitteeNotificationType =
  | 'PROPOSAL_SUBMITTED'
  | 'PROPOSAL_REVISION'
  | 'STUDENT_UNPAIRED_ALERT'
  | 'SUPERVISOR_OVERLOAD'
  | 'DEADLINE_REMINDER'
  | 'SYSTEM_ALERT'
  | 'REPORT_READY'

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
