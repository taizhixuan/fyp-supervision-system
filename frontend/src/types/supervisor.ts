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
}

// Supervision request from student
export type RequestStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN' | 'EXPIRED'

export interface SupervisionRequest {
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
export type ProjectStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD' | 'TERMINATED'
export type ProposalStatus = 'NOT_SUBMITTED' | 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'REVISION_REQUIRED' | 'APPROVED' | 'REJECTED'

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
  proposalStatus: ProposalStatus
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
  status: ProposalStatus
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
  previousVersions: ProposalVersion[]
  feedbackHistory: ProposalFeedback[]
}

export interface ProposalVersion {
  versionId: number
  version: number
  submittedAt: string
  status: ProposalStatus
}

export interface ProposalFeedback {
  feedbackId: number
  supervisorId: string
  supervisorName: string
  content: string
  feedbackType: 'COMMENT' | 'REVISION_REQUEST' | 'APPROVAL' | 'REJECTION'
  createdAt: string
}

// Meeting types for supervisor
export type MeetingStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED' | 'NO_SHOW'
export type MeetingType = 'IN_PERSON' | 'ONLINE' | 'HYBRID'

export interface SupervisorMeeting {
  meetingId: number
  studentId: string
  studentName: string
  title: string
  type: MeetingType
  status: MeetingStatus
  requestedBy: 'STUDENT' | 'SUPERVISOR'
  proposedDateTime: string
  alternativeDateTimes?: string[]
  confirmedDateTime?: string
  duration: number // in minutes
  location?: string
  meetingUrl?: string
  agenda?: string
  notes?: string
  actionItems?: string[]
  createdAt: string
  updatedAt: string
}

// Supervision Log for review
export type LogStatus = 'PENDING' | 'APPROVED' | 'REVISION_REQUIRED' | 'SIGNED' | 'LOCKED'

export interface SupervisionLogForReview {
  logId: number
  studentId: string
  studentName: string
  weekNumber: number
  weekStartDate: string
  weekEndDate: string
  status: LogStatus
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
export type DocumentType = 'PROPOSAL' | 'REPORT' | 'PRESENTATION' | 'MEETING_NOTES' | 'REFERENCE' | 'FEEDBACK' | 'OTHER'

export interface SuperviseeDocument {
  documentId: number
  studentId: string
  studentName: string
  title: string
  type: DocumentType
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

export interface SupervisorAnnouncement {
  announcementId: number
  supervisorId: string
  title: string
  content: string
  visibility: AnnouncementVisibility
  priority: AnnouncementPriority
  targetStudentIds?: string[]
  publishAt: string
  expiresAt?: string
  isActive: boolean
  viewCount: number
  createdAt: string
  updatedAt: string
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

// Notification types for supervisor
export type SupervisorNotificationType =
  | 'NEW_REQUEST'
  | 'MEETING_REQUEST'
  | 'MEETING_CONFIRMED'
  | 'MEETING_CANCELLED'
  | 'LOG_SUBMITTED'
  | 'DOCUMENT_UPLOADED'
  | 'PROPOSAL_SUBMITTED'
  | 'PROPOSAL_REVISED'
  | 'SYSTEM'

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
