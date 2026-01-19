// Student Profile Types
export interface StudentProfile {
  userId: string
  studentId: string
  fullName: string
  email: string
  phone?: string
  programCode: string
  programName: string
  faculty: string
  intakeYear: number
  expectedGraduation: string
  cgpa?: number
  profileImageUrl?: string
  bio?: string
  skills: string[]
  researchInterests: string[]
  linkedinUrl?: string
  githubUrl?: string
  portfolioUrl?: string
  createdAt: string
  updatedAt: string
}

export interface UpdateStudentProfileData {
  phone?: string
  bio?: string
  skills?: string[]
  researchInterests?: string[]
  linkedinUrl?: string
  githubUrl?: string
  portfolioUrl?: string
}

// Supervisor Types (for student view)
export interface SupervisorSummary {
  supervisorId: string
  userId: string
  fullName: string
  email: string
  title: string
  department: string
  faculty: string
  profileImageUrl?: string
  researchAreas: string[]
  currentLoad: number
  maxCapacity: number
  isAcceptingStudents: boolean
}

export interface SupervisorDetail extends SupervisorSummary {
  bio?: string
  qualifications: string[]
  publications?: string[]
  expertise: string[]
  officeLocation?: string
  officeHours?: string
  preferredMeetingPlatforms: string[]
  averageResponseTime?: string
  rating?: number
  totalSupervised: number
}

// AI Recommendation Types
export interface SupervisorRecommendation {
  supervisor: SupervisorSummary
  matchScore: number
  matchReasons: MatchReason[]
  rank: number
}

export interface MatchReason {
  category: 'research_area' | 'skills' | 'availability' | 'success_rate' | 'response_time'
  description: string
  score: number
}

export interface RecommendationFilters {
  researchAreas?: string[]
  faculty?: string
  minAvailability?: number
}

// Supervision Request Types
export type SupervisionRequestStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN' | 'EXPIRED'

export interface SupervisionRequest {
  requestId: string
  studentId: string
  supervisorId: string
  supervisor: SupervisorSummary
  proposedTitle: string
  topicDescription: string
  message?: string
  status: SupervisionRequestStatus
  submittedAt: string
  respondedAt?: string
  responseMessage?: string
  expiresAt: string
}

export interface CreateSupervisionRequestData {
  supervisorId: string
  proposedTitle: string
  topicDescription: string
  message?: string
}

// Proposal Types
export type ProposalStatus = 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'REVISION_REQUIRED' | 'APPROVED' | 'REJECTED'

export interface Proposal {
  proposalId: string
  studentId: string
  supervisorId?: string
  title: string
  problemStatement: string
  objectives: string[]
  scope: string
  methodology: string
  expectedOutcomes: string[]
  timeline?: string
  references?: string[]
  status: ProposalStatus
  version: number
  submittedAt?: string
  fileUrl?: string
  fileName?: string
  createdAt: string
  updatedAt: string
}

export interface ProposalVersion {
  versionId: string
  proposalId: string
  version: number
  title: string
  status: ProposalStatus
  submittedAt?: string
  fileUrl?: string
  changes?: string
  createdAt: string
}

export interface ProposalFeedback {
  feedbackId: string
  proposalId: string
  reviewerType: 'SUPERVISOR' | 'COMMITTEE'
  reviewerId: string
  reviewerName: string
  status: 'REVISION_REQUIRED' | 'APPROVED' | 'REJECTED'
  comments: string
  detailedFeedback?: ProposalSectionFeedback[]
  createdAt: string
}

export interface ProposalSectionFeedback {
  section: string
  status: 'OK' | 'NEEDS_IMPROVEMENT' | 'MISSING'
  comment?: string
  suggestions?: string[]
}

export interface CreateProposalData {
  title: string
  problemStatement: string
  objectives: string[]
  scope: string
  methodology: string
  expectedOutcomes: string[]
  timeline?: string
  references?: string[]
}

export interface UpdateProposalData extends Partial<CreateProposalData> {}

// AI Proposal Analysis Types
export interface ProposalAnalysisResult {
  analysisId: string
  proposalId: string
  overallScore: number
  sectionAnalysis: SectionAnalysis[]
  suggestions: ProposalSuggestion[]
  strengths: string[]
  weaknesses: string[]
  analyzedAt: string
}

export interface SectionAnalysis {
  section: string
  status: 'COMPLETE' | 'INCOMPLETE' | 'MISSING' | 'NEEDS_IMPROVEMENT'
  score: number
  feedback: string
}

export interface ProposalSuggestion {
  section: string
  type: 'CONTENT' | 'CLARITY' | 'STRUCTURE' | 'MISSING'
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
  suggestion: string
  example?: string
}

// Project Registration Types
export type RegistrationStatus = 'NOT_STARTED' | 'SUPERVISOR_PENDING' | 'PROPOSAL_PENDING' | 'UNDER_REVIEW' | 'REGISTERED' | 'DEFERRED'

export interface ProjectRegistration {
  registrationId: string
  studentId: string
  academicYear: string
  semester: number
  cycle: string
  status: RegistrationStatus
  supervisorId?: string
  supervisor?: SupervisorSummary
  proposalId?: string
  registeredAt?: string
  nextSteps: RegistrationStep[]
  timeline: RegistrationTimelineEvent[]
}

export interface RegistrationStep {
  step: number
  title: string
  description: string
  status: 'COMPLETED' | 'CURRENT' | 'PENDING'
  completedAt?: string
  dueDate?: string
}

export interface RegistrationTimelineEvent {
  eventId: string
  type: 'STATUS_CHANGE' | 'SUBMISSION' | 'FEEDBACK' | 'DEADLINE'
  title: string
  description: string
  timestamp: string
}

// Meeting Types
export type MeetingStatus = 'PENDING' | 'CONFIRMED' | 'RESCHEDULED' | 'CANCELLED' | 'COMPLETED'
export type MeetingPlatform = 'IN_PERSON' | 'ZOOM' | 'GOOGLE_MEET' | 'MICROSOFT_TEAMS' | 'OTHER'

export interface Meeting {
  meetingId: string
  studentId: string
  supervisorId: string
  supervisor: SupervisorSummary
  title: string
  agenda?: string
  scheduledAt: string
  duration: number // minutes
  platform: MeetingPlatform
  location?: string
  meetingLink?: string
  status: MeetingStatus
  notes?: string
  rescheduleReason?: string
  cancelReason?: string
  createdAt: string
  updatedAt: string
}

export interface CreateMeetingData {
  supervisorId: string
  title: string
  agenda?: string
  proposedTimes: string[] // ISO date strings
  duration: number
  platform: MeetingPlatform
  location?: string
}

export interface MeetingSlot {
  slotId: string
  startTime: string
  endTime: string
  isAvailable: boolean
}

// Supervision Log Types
export type LogStatus = 'DRAFT' | 'SUBMITTED' | 'SUPERVISOR_SIGNED' | 'LOCKED' | 'PENDING' | 'APPROVED' | 'REVISION_REQUIRED'

export interface SupervisionLog {
  logId: string
  meetingId?: string
  meeting?: Meeting
  studentId: string
  supervisorId: string
  discussionSummary?: string
  actionItems?: ActionItem[]
  nextMeetingPlan?: string
  attachmentUrl?: string
  attachmentName?: string
  status: LogStatus
  studentSignedAt?: string
  supervisorSignedAt?: string
  lockedAt?: string
  createdAt: string
  updatedAt: string
  // Additional fields for weekly log format
  weekNumber?: number
  dateRange?: string
  activitiesCompleted?: string
  challengesFaced?: string
  plannedActivities?: string
  progressPercentage?: number
  supervisorFeedback?: string
}

export interface ActionItem {
  itemId: string
  description: string
  assignee: 'STUDENT' | 'SUPERVISOR'
  dueDate?: string
  isCompleted: boolean
  completedAt?: string
}

export interface CreateLogData {
  meetingId: string
  discussionSummary: string
  actionItems: Omit<ActionItem, 'itemId' | 'isCompleted' | 'completedAt'>[]
  nextMeetingPlan?: string
}

export interface UpdateLogData extends Partial<Omit<CreateLogData, 'meetingId'>> {}

// Document Types
export type DocumentType = 'PROPOSAL' | 'REPORT' | 'PRESENTATION' | 'CODE' | 'DATASET' | 'OTHER'
export type DocumentPhase = 'FYP1' | 'FYP2' | 'FINAL'
export type DocumentCategory = 'PROPOSAL' | 'REPORT' | 'PRESENTATION' | 'MEETING_NOTES' | 'REFERENCE' | 'OTHER'

export interface FYPDocument {
  documentId: string
  studentId: string
  title: string
  description?: string
  type?: DocumentType
  category?: DocumentCategory
  phase?: DocumentPhase
  fileName: string
  fileSize: number
  fileUrl: string
  mimeType?: string
  version: number
  uploadedAt: string
  updatedAt: string
  // Additional fields for document detail views
  uploadedBy?: string
  isShared?: boolean
  tags?: string[]
}

export interface DocumentVersion {
  versionId: string
  documentId: string
  version: number
  fileName: string
  fileSize: number
  fileUrl: string
  uploadedAt: string
  changes?: string
}

export interface UploadDocumentData {
  title: string
  description?: string
  type: DocumentType
  phase: DocumentPhase
  file: File
}

// Resource Types (extended for student view)
export type DeadlineType = 'PROPOSAL' | 'REPORT' | 'PRESENTATION' | 'REGISTRATION' | 'MEETING' | 'LOG' | 'DOCUMENT' | 'OTHER'
export type DeadlinePriority = 'HIGH' | 'MEDIUM' | 'LOW'

export interface Deadline {
  deadlineId: string
  title: string
  description?: string
  dueDate: string
  type: DeadlineType
  phase?: DocumentPhase
  isUpcoming?: boolean
  daysRemaining?: number
  // Additional fields for calendar view
  priority?: DeadlinePriority
  isCompleted?: boolean
  reminderSent?: boolean
}

// Dashboard Types
export interface StudentDashboardData {
  profile: StudentProfile
  registrationStatus: ProjectRegistration
  upcomingMeetings: Meeting[]
  pendingLogs: SupervisionLog[]
  recentDocuments: FYPDocument[]
  upcomingDeadlines: Deadline[]
  proposalStatus?: Proposal
  notifications: {
    unreadCount: number
  }
  quickStats: {
    totalMeetings: number
    completedLogs: number
    documentsUploaded: number
  }
}

// Notification Preferences Types
export interface NotificationChannelSettings {
  enabled: boolean
  meetingReminders: boolean
  deadlineReminders: boolean
  proposalUpdates: boolean
  supervisorMessages: boolean
  systemAnnouncements: boolean
  weeklyDigest?: boolean
}

export interface NotificationPreferences {
  email: NotificationChannelSettings
  push: Omit<NotificationChannelSettings, 'weeklyDigest'>
  inApp: Omit<NotificationChannelSettings, 'weeklyDigest'>
  quiet: {
    enabled: boolean
    startTime: string
    endTime: string
  }
  // Legacy fields for backwards compatibility
  reminderTiming?: {
    meetingReminderHours: number
    deadlineReminderDays: number
  }
}

// Chatbot Types
export interface ChatMessage {
  messageId: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  references?: ChatReference[]
}

export interface ChatReference {
  type: 'HANDBOOK' | 'FAQ' | 'RESOURCE' | 'DEADLINE'
  title: string
  url?: string
  excerpt?: string
}

export interface ChatSession {
  sessionId: string
  messages: ChatMessage[]
  createdAt: string
  updatedAt: string
}
