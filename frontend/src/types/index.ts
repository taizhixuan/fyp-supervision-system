export * from './auth'
export * from './notification'
export * from './resource'
export * from './student'
export * from './supervisor'
// committee.ts also declares CycleStatus (same union as admin's). Re-export the
// whole module except CycleStatus to avoid the barrel ambiguity; CycleStatus
// comes from admin.ts (canonical), and committee's copy is aliased below.
export type {
  DashboardDeadline,
  CommitteeDashboardStats,
  DashboardAlert,
  RecentActivity,
  CycleSummary,
  AnnouncementScope,
  CommitteeAnnouncementPriority,
  AnnouncementStatus,
  FYPAnnouncement,
  AnnouncementAttachment,
  AnnouncementLink,
  CreateAnnouncementData,
  CommitteeProposalStatus,
  ProposalForCommitteeReview,
  AIProposalAnalysis,
  ProposalReviewEntry,
  SubmitProposalReviewData,
  CommitteeDocumentCategory,
  DocumentVisibility,
  GeneralDocument,
  CommitteeDocumentCycleScope,
  CommitteeUploadDocumentData,
  CommitteeProjectStatus,
  PairingStatus,
  ProjectOverview,
  UnpairedStudent,
  SupervisorLoad,
  SupervisorStudentSummary,
  ProjectEngagement,
  ProjectDetail,
  RecentMeeting,
  MeetingSummary,
  DocumentSummary,
  LogSummary,
  ProjectTimelineEvent,
  ExportOptions,
  ReportType,
  ReportFormat,
  ReportConfig,
  GeneratedReport,
  CommitteeNotificationType,
  CommitteeNotification,
} from './committee'
export * from './admin'
export * from './meetingLog'

// Aliases for cross-file name collisions
// admin.ts and committee.ts both export CycleStatus (same union of
// PLANNING/ACTIVE/COMPLETED/ARCHIVED). admin's is re-exported via `export *`;
// committee's is exposed under a prefixed name for any call site that wants it.
export type { CycleStatus as CommitteeCycleStatus } from './committee'
