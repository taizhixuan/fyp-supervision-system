import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import type {
  CommitteeDashboardStats,
  DashboardAlert,
  RecentActivity,
  FYPAnnouncement,
  CreateAnnouncementData,
  ProposalForCommitteeReview,
  SubmitProposalReviewData,
  GeneralDocument,
  CommitteeUploadDocumentData,
  ProjectOverview,
  CommitteeProjectStatus,
  PairingStatus,
  UnpairedStudent,
  SupervisorLoad,
  ProjectDetail,
  ReportConfig,
  GeneratedReport,
  CommitteeNotification,
  CycleSummary,
} from '@/types'
import type { CycleStatus } from '@/types/committee'

// Use mock data in development
const USE_MOCK_DATA = false

// ============================================
// MOCK DATA
// ============================================

const MOCK_DASHBOARD_STATS: CommitteeDashboardStats = {
  totalProposals: 156,
  pendingReviews: 23,
  approvedProposals: 118,
  rejectedProposals: 15,
  totalStudents: 245,
  unpairedStudents: 18,
  totalSupervisors: 42,
  overloadedSupervisors: 5,
  activeProjects: 198,
  completedProjects: 47,
  fyp1Students: 128,
  fyp2Students: 117,
}

const MOCK_ALERTS: DashboardAlert[] = [
  {
    alertId: 1,
    type: 'URGENT',
    title: 'Proposal Deadline Approaching',
    message: '23 proposals pending review. Deadline: Jan 31, 2025',
    createdAt: '2025-01-20T08:00:00Z',
    isRead: false,
  },
  {
    alertId: 2,
    type: 'WARNING',
    title: 'Supervisor Overload Alert',
    message: '5 supervisors have exceeded their maximum capacity',
    createdAt: '2025-01-19T14:30:00Z',
    isRead: false,
  },
  {
    alertId: 3,
    type: 'INFO',
    title: 'New Semester Starting',
    message: 'FYP2 cycle begins Feb 1, 2025. Ensure all pairings are complete.',
    createdAt: '2025-01-18T09:00:00Z',
    isRead: true,
  },
]

const MOCK_RECENT_ACTIVITIES: RecentActivity[] = [
  {
    activityId: 1,
    type: 'PROPOSAL_SUBMITTED',
    title: 'New Proposal Submitted',
    description: 'Ahmad bin Abdullah submitted "AI-Powered Study Assistant"',
    timestamp: '2025-01-20T10:30:00Z',
    actor: 'Ahmad bin Abdullah',
  },
  {
    activityId: 2,
    type: 'PROPOSAL_REVIEWED',
    title: 'Proposal Approved',
    description: 'Dr. Sarah Lee approved "IoT Smart Campus System"',
    timestamp: '2025-01-20T09:15:00Z',
    actor: 'Dr. Sarah Lee',
  },
  {
    activityId: 3,
    type: 'STUDENT_PAIRED',
    title: 'Student Paired',
    description: 'Tan Wei Ming paired with Dr. John Smith',
    timestamp: '2025-01-19T16:45:00Z',
  },
  {
    activityId: 4,
    type: 'ANNOUNCEMENT_CREATED',
    title: 'Announcement Published',
    description: 'FYP1 Proposal Submission Deadline announced',
    timestamp: '2025-01-19T11:00:00Z',
    actor: 'Committee Admin',
  },
  {
    activityId: 5,
    type: 'DOCUMENT_UPLOADED',
    title: 'Document Updated',
    description: 'FYP Handbook 2025 uploaded',
    timestamp: '2025-01-18T14:20:00Z',
    actor: 'Committee Admin',
  },
]

const MOCK_ANNOUNCEMENTS: FYPAnnouncement[] = [
  {
    announcementId: 1,
    title: 'FYP1 Proposal Submission Deadline',
    content: 'All FYP1 students must submit their proposals by January 31, 2025. Late submissions will not be accepted without prior approval from the FYP Committee.',
    scope: 'FYP1',
    priority: 'URGENT',
    status: 'PUBLISHED',
    publishAt: '2025-01-15T09:00:00Z',
    expiresAt: '2025-02-01T00:00:00Z',
    createdBy: 'Dr. Ahmad Hassan',
    createdAt: '2025-01-14T15:30:00Z',
    updatedAt: '2025-01-14T15:30:00Z',
    viewCount: 245,
  },
  {
    announcementId: 2,
    title: 'FYP2 Final Presentation Schedule',
    content: 'FYP2 final presentations will be held from March 15-20, 2025. Students will receive their allocated slots via email by February 28.',
    scope: 'FYP2',
    priority: 'HIGH',
    status: 'PUBLISHED',
    publishAt: '2025-01-10T09:00:00Z',
    createdBy: 'Dr. Sarah Lee',
    createdAt: '2025-01-09T10:00:00Z',
    updatedAt: '2025-01-09T10:00:00Z',
    viewCount: 189,
  },
  {
    announcementId: 3,
    title: 'Updated FYP Handbook Available',
    content: 'The FYP Handbook for Academic Year 2024/2025 has been updated. Please download the latest version from the Documents section.',
    scope: 'ALL',
    priority: 'NORMAL',
    status: 'PUBLISHED',
    publishAt: '2025-01-05T09:00:00Z',
    createdBy: 'FYP Committee',
    createdAt: '2025-01-04T14:00:00Z',
    updatedAt: '2025-01-04T14:00:00Z',
    viewCount: 312,
  },
  {
    announcementId: 4,
    title: 'Supervisor Assignment Guidelines',
    content: 'Guidelines for supervisor assignment process have been published. Students are encouraged to review supervisor expertise areas before submitting requests.',
    scope: 'ALL',
    priority: 'NORMAL',
    status: 'PUBLISHED',
    publishAt: '2025-01-02T09:00:00Z',
    createdBy: 'Dr. Ahmad Hassan',
    createdAt: '2025-01-01T16:00:00Z',
    updatedAt: '2025-01-01T16:00:00Z',
    viewCount: 278,
  },
]

const MOCK_PROPOSALS: ProposalForCommitteeReview[] = [
  {
    proposalId: 1,
    title: 'AI-Powered Study Assistant for University Students',
    studentName: 'Ahmad bin Abdullah',
    studentId: 'CS2021001',
    studentEmail: 'ahmad@student.mmu.edu.my',
    programme: 'Computer Science',
    cycle: 'FYP1',
    supervisorName: 'Dr. Sarah Lee',
    supervisorId: 'SUP001',
    submittedAt: '2025-01-18T14:30:00Z',
    status: 'PENDING_REVIEW',
    version: 1,
    abstract: 'This project aims to develop an AI-powered study assistant that helps university students organize their study materials and provides personalized learning recommendations.',
    objectives: [
      'Develop a chatbot interface for student queries',
      'Implement machine learning for personalized recommendations',
      'Create a document summarization feature',
    ],
    methodology: 'Agile development with 2-week sprints',
    documentUrl: '/documents/proposal-1.pdf',
    aiAnalysis: {
      overallScore: 78,
      feasibilityScore: 82,
      innovationScore: 75,
      clarityScore: 80,
      scopeScore: 74,
      strengths: ['Clear objectives', 'Well-defined scope', 'Relevant technology stack'],
      weaknesses: ['Limited literature review', 'Timeline may be tight'],
      suggestions: ['Consider adding more background research', 'Define success metrics clearly'],
      analyzedAt: '2025-01-18T15:00:00Z',
    },
    reviewHistory: [],
  },
  {
    proposalId: 2,
    title: 'IoT-Based Smart Campus Energy Management',
    studentName: 'Tan Wei Ming',
    studentId: 'CS2021045',
    studentEmail: 'weiming@student.mmu.edu.my',
    programme: 'Computer Science',
    cycle: 'FYP1',
    supervisorName: 'Dr. John Smith',
    supervisorId: 'SUP002',
    submittedAt: '2025-01-17T10:15:00Z',
    status: 'UNDER_REVIEW',
    version: 1,
    abstract: 'Development of an IoT system to monitor and optimize energy consumption across campus buildings.',
    documentUrl: '/documents/proposal-2.pdf',
    aiAnalysis: {
      overallScore: 85,
      feasibilityScore: 88,
      innovationScore: 82,
      clarityScore: 86,
      scopeScore: 84,
      strengths: ['Innovative approach', 'Strong technical foundation', 'Clear implementation plan'],
      weaknesses: ['Budget considerations not detailed'],
      suggestions: ['Add cost-benefit analysis'],
      analyzedAt: '2025-01-17T11:00:00Z',
    },
    reviewHistory: [],
  },
  {
    proposalId: 3,
    title: 'Blockchain-Based Academic Credential Verification',
    studentName: 'Siti Nurhaliza',
    studentId: 'SE2021023',
    studentEmail: 'siti@student.mmu.edu.my',
    programme: 'Software Engineering',
    cycle: 'FYP2',
    supervisorName: 'Dr. Ahmad Hassan',
    supervisorId: 'SUP003',
    submittedAt: '2025-01-15T09:00:00Z',
    status: 'REVISION_REQUESTED',
    version: 2,
    abstract: 'A blockchain solution for secure and tamper-proof verification of academic credentials.',
    documentUrl: '/documents/proposal-3.pdf',
    aiAnalysis: {
      overallScore: 72,
      feasibilityScore: 70,
      innovationScore: 85,
      clarityScore: 68,
      scopeScore: 65,
      strengths: ['Highly innovative concept', 'Strong security focus'],
      weaknesses: ['Scope may be too ambitious', 'Technical complexity underestimated'],
      suggestions: ['Narrow down the scope', 'Provide more implementation details'],
      analyzedAt: '2025-01-15T10:00:00Z',
    },
    reviewHistory: [
      {
        reviewId: 1,
        reviewerName: 'Dr. Ahmad Hassan',
        reviewerRole: 'SUPERVISOR',
        decision: 'REVISION_REQUESTED',
        feedback: 'Good concept but needs more detailed implementation plan. Please revise the methodology section.',
        reviewedAt: '2025-01-16T14:00:00Z',
      },
    ],
  },
]

const MOCK_DOCUMENTS: GeneralDocument[] = [
  {
    documentId: 1,
    title: 'FYP Handbook 2024/2025',
    description: 'Comprehensive guide for FYP students including guidelines, deadlines, and assessment criteria.',
    category: 'HANDBOOK',
    visibility: 'PUBLIC',
    fileName: 'FYP_Handbook_2024_2025.pdf',
    fileSize: 2456000,
    fileUrl: '/documents/handbook.pdf',
    version: 3,
    isActive: true,
    uploadedBy: 'FYP Committee',
    uploadedAt: '2025-01-05T10:00:00Z',
    updatedAt: '2025-01-05T10:00:00Z',
    downloadCount: 456,
    versions: [
      {
        versionId: 1,
        version: 1,
        fileName: 'FYP_Handbook_2024_2025_v1.pdf',
        fileSize: 2100000,
        fileUrl: '/documents/handbook_v1.pdf',
        uploadedBy: 'FYP Committee',
        uploadedAt: '2024-09-01T10:00:00Z',
        changeNotes: 'Initial release',
      },
      {
        versionId: 2,
        version: 2,
        fileName: 'FYP_Handbook_2024_2025_v2.pdf',
        fileSize: 2300000,
        fileUrl: '/documents/handbook_v2.pdf',
        uploadedBy: 'FYP Committee',
        uploadedAt: '2024-11-15T10:00:00Z',
        changeNotes: 'Updated assessment criteria',
      },
      {
        versionId: 3,
        version: 3,
        fileName: 'FYP_Handbook_2024_2025_v3.pdf',
        fileSize: 2456000,
        fileUrl: '/documents/handbook_v3.pdf',
        uploadedBy: 'FYP Committee',
        uploadedAt: '2025-01-05T10:00:00Z',
        changeNotes: 'Added FYP2 presentation guidelines',
      },
    ],
  },
  {
    documentId: 2,
    title: 'Proposal Template',
    description: 'Standard template for FYP proposal submission.',
    category: 'TEMPLATE',
    visibility: 'PUBLIC',
    fileName: 'Proposal_Template.docx',
    fileSize: 125000,
    fileUrl: '/documents/proposal_template.docx',
    version: 2,
    isActive: true,
    uploadedBy: 'FYP Committee',
    uploadedAt: '2024-09-15T10:00:00Z',
    updatedAt: '2024-12-01T10:00:00Z',
    downloadCount: 312,
    versions: [],
  },
  {
    documentId: 3,
    title: 'FYP1 Assessment Rubric',
    description: 'Grading rubric for FYP1 proposal and progress evaluation.',
    category: 'RUBRIC',
    visibility: 'SUPERVISORS_ONLY',
    fileName: 'FYP1_Assessment_Rubric.pdf',
    fileSize: 456000,
    fileUrl: '/documents/fyp1_rubric.pdf',
    version: 1,
    isActive: true,
    uploadedBy: 'Dr. Ahmad Hassan',
    uploadedAt: '2024-09-01T10:00:00Z',
    updatedAt: '2024-09-01T10:00:00Z',
    downloadCount: 89,
    versions: [],
  },
  {
    documentId: 4,
    title: 'Progress Report Template',
    description: 'Template for monthly progress reports.',
    category: 'TEMPLATE',
    visibility: 'PUBLIC',
    fileName: 'Progress_Report_Template.docx',
    fileSize: 98000,
    fileUrl: '/documents/progress_template.docx',
    version: 1,
    isActive: true,
    uploadedBy: 'FYP Committee',
    uploadedAt: '2024-09-10T10:00:00Z',
    updatedAt: '2024-09-10T10:00:00Z',
    downloadCount: 178,
    versions: [],
  },
  {
    documentId: 5,
    title: 'FYP2 Final Report Guidelines',
    description: 'Guidelines and requirements for FYP2 final report submission.',
    category: 'GUIDELINE',
    visibility: 'PUBLIC',
    fileName: 'FYP2_Final_Report_Guidelines.pdf',
    fileSize: 890000,
    fileUrl: '/documents/fyp2_guidelines.pdf',
    version: 1,
    isActive: true,
    uploadedBy: 'FYP Committee',
    uploadedAt: '2024-10-01T10:00:00Z',
    updatedAt: '2024-10-01T10:00:00Z',
    downloadCount: 234,
    versions: [],
  },
]

const MOCK_PROJECTS: ProjectOverview[] = [
  {
    projectId: 1,
    title: 'AI-Powered Study Assistant',
    studentName: 'Ahmad bin Abdullah',
    studentId: 'CS2021001',
    studentEmail: 'ahmad@student.mmu.edu.my',
    programme: 'Computer Science',
    cycle: 'FYP1',
    supervisorName: 'Dr. Sarah Lee',
    supervisorId: 'SUP001',
    pairingStatus: 'PAIRED',
    projectStatus: 'IN_PROGRESS',
    proposalStatus: 'APPROVED',
    progress: 45,
    lastActivity: '2025-01-20T10:30:00Z',
    riskLevel: 'LOW',
  },
  {
    projectId: 2,
    title: 'IoT Smart Campus System',
    studentName: 'Tan Wei Ming',
    studentId: 'CS2021045',
    studentEmail: 'weiming@student.mmu.edu.my',
    programme: 'Computer Science',
    cycle: 'FYP1',
    supervisorName: 'Dr. John Smith',
    supervisorId: 'SUP002',
    pairingStatus: 'PAIRED',
    projectStatus: 'IN_PROGRESS',
    proposalStatus: 'APPROVED',
    progress: 38,
    lastActivity: '2025-01-19T14:00:00Z',
    riskLevel: 'MEDIUM',
  },
  {
    projectId: 3,
    title: 'Blockchain Credential System',
    studentName: 'Siti Nurhaliza',
    studentId: 'SE2021023',
    studentEmail: 'siti@student.mmu.edu.my',
    programme: 'Software Engineering',
    cycle: 'FYP2',
    supervisorName: 'Dr. Ahmad Hassan',
    supervisorId: 'SUP003',
    pairingStatus: 'PAIRED',
    projectStatus: 'IN_PROGRESS',
    proposalStatus: 'REVISION_REQUESTED',
    progress: 65,
    lastActivity: '2025-01-18T16:00:00Z',
    riskLevel: 'HIGH',
  },
]

const MOCK_SUPERVISOR_LOADS: SupervisorLoad[] = [
  {
    supervisorId: 'SUP001',
    userId: 'user-sup-001',
    fullName: 'Dr. Sarah Lee',
    email: 'sarah.lee@mmu.edu.my',
    department: 'Computer Science',
    currentLoad: 8,
    maxCapacity: 8,
    fyp1Students: 5,
    fyp2Students: 3,
    utilizationRate: 100,
    isOverloaded: false,
    expertise: ['Machine Learning', 'AI', 'Data Analytics'],
    students: [
      { studentId: 'CS2021001', fullName: 'Ahmad bin Abdullah', cycle: 'FYP1', projectTitle: 'AI Study Assistant', progress: 45, riskLevel: 'LOW' },
      { studentId: 'CS2021015', fullName: 'Nurul Aina', cycle: 'FYP1', projectTitle: 'ML Image Recognition', progress: 52, riskLevel: 'LOW' },
    ],
  },
  {
    supervisorId: 'SUP002',
    userId: 'user-sup-002',
    fullName: 'Dr. John Smith',
    email: 'john.smith@mmu.edu.my',
    department: 'Computer Science',
    currentLoad: 10,
    maxCapacity: 8,
    fyp1Students: 6,
    fyp2Students: 4,
    utilizationRate: 125,
    isOverloaded: true,
    expertise: ['IoT', 'Embedded Systems', 'Networks'],
    students: [],
  },
  {
    supervisorId: 'SUP003',
    userId: 'user-sup-003',
    fullName: 'Dr. Ahmad Hassan',
    email: 'ahmad.hassan@mmu.edu.my',
    department: 'Software Engineering',
    currentLoad: 7,
    maxCapacity: 8,
    fyp1Students: 4,
    fyp2Students: 3,
    utilizationRate: 87.5,
    isOverloaded: false,
    expertise: ['Blockchain', 'Security', 'Distributed Systems'],
    students: [],
  },
]

const MOCK_REPORTS: GeneratedReport[] = [
  {
    reportId: 1,
    reportType: 'PROPOSAL_SUMMARY',
    title: 'FYP1 Proposal Status Report - January 2025',
    generatedBy: 'Dr. Ahmad Hassan',
    generatedAt: '2025-01-18T16:00:00Z',
    format: 'PDF',
    fileSize: 1250000,
    fileUrl: '/reports/proposal_summary_jan2025.pdf',
    filters: { cycle: 'FYP1', academicYear: '2024/2025' },
    expiresAt: '2025-04-18T16:00:00Z',
  },
  {
    reportId: 2,
    reportType: 'SUPERVISOR_LOAD',
    title: 'Supervisor Load Distribution Report',
    generatedBy: 'Committee Admin',
    generatedAt: '2025-01-15T10:00:00Z',
    format: 'EXCEL',
    fileSize: 890000,
    fileUrl: '/reports/supervisor_load_jan2025.xlsx',
    filters: { academicYear: '2024/2025' },
    expiresAt: '2025-04-15T10:00:00Z',
  },
  {
    reportId: 3,
    reportType: 'PAIRING_STATUS',
    title: 'Student-Supervisor Pairing Report',
    generatedBy: 'Dr. Sarah Lee',
    generatedAt: '2025-01-10T14:30:00Z',
    format: 'PDF',
    fileSize: 756000,
    fileUrl: '/reports/pairing_status_jan2025.pdf',
    filters: { cycle: 'ALL', academicYear: '2024/2025' },
    expiresAt: '2025-04-10T14:30:00Z',
  },
]

// Mock types mirror the 9 generic types the backend's NotificationService
// actually emits. Title keywords let getNotificationDisplay distinguish
// e.g. "Proposal Submitted" vs "Proposal Feedback" within type=PROPOSAL.
const MOCK_NOTIFICATIONS: CommitteeNotification[] = [
  {
    notificationId: 1,
    type: 'PROPOSAL',
    title: 'Proposal Submitted',
    message: 'Ahmad bin Abdullah submitted proposal "AI-Powered Study Assistant"',
    isRead: false,
    createdAt: '2025-01-20T10:30:00Z',
    relatedEntityId: 1,
    relatedEntityType: 'proposal',
    priority: 'NORMAL',
  },
  {
    notificationId: 2,
    type: 'SYSTEM',
    title: 'Supervisor Capacity Alert',
    message: 'Dr. John Smith has exceeded maximum student capacity (10/8)',
    isRead: false,
    createdAt: '2025-01-19T14:00:00Z',
    relatedEntityId: 2,
    relatedEntityType: 'supervisor',
    priority: 'HIGH',
  },
  {
    notificationId: 3,
    type: 'DEADLINE',
    title: 'Proposal Review Deadline',
    message: '23 proposals pending review. Deadline: Jan 31, 2025',
    isRead: false,
    createdAt: '2025-01-19T09:00:00Z',
    priority: 'URGENT',
  },
  {
    notificationId: 4,
    type: 'REGISTRATION_PENDING',
    title: 'Unpaired Students Alert',
    message: '18 students remain unpaired for FYP1',
    isRead: true,
    createdAt: '2025-01-18T10:00:00Z',
    priority: 'HIGH',
  },
  {
    notificationId: 5,
    type: 'SYSTEM',
    title: 'Report Generated',
    message: 'FYP1 Proposal Status Report is ready for download',
    isRead: true,
    createdAt: '2025-01-18T16:05:00Z',
    relatedEntityId: 1,
    relatedEntityType: 'report',
    priority: 'LOW',
  },
]

// ============================================
// QUERY KEYS
// ============================================

export const committeeKeys = {
  all: ['committee'] as const,
  dashboard: () => [...committeeKeys.all, 'dashboard'] as const,
  alerts: () => [...committeeKeys.all, 'alerts'] as const,
  activities: () => [...committeeKeys.all, 'activities'] as const,
  announcements: () => [...committeeKeys.all, 'announcements'] as const,
  announcement: (id: number) => [...committeeKeys.announcements(), id] as const,
  proposals: () => [...committeeKeys.all, 'proposals'] as const,
  proposal: (id: number) => [...committeeKeys.proposals(), id] as const,
  documents: () => [...committeeKeys.all, 'documents'] as const,
  document: (id: number) => [...committeeKeys.documents(), id] as const,
  projects: () => [...committeeKeys.all, 'projects'] as const,
  project: (id: number) => [...committeeKeys.projects(), id] as const,
  unpairedStudents: () => [...committeeKeys.all, 'unpaired-students'] as const,
  supervisorLoads: () => [...committeeKeys.all, 'supervisor-loads'] as const,
  supervisorLoad: (id: string) => [...committeeKeys.supervisorLoads(), id] as const,
  reports: () => [...committeeKeys.all, 'reports'] as const,
  report: (id: number) => [...committeeKeys.reports(), id] as const,
  notifications: () => [...committeeKeys.all, 'notifications'] as const,
  unreadCount: () => [...committeeKeys.notifications(), 'unread'] as const,
}

// ============================================
// DASHBOARD HOOKS
// ============================================

export function useCommitteeDashboard() {
  return useQuery({
    queryKey: committeeKeys.dashboard(),
    queryFn: async () => {
      if (USE_MOCK_DATA) {
        await new Promise((resolve) => setTimeout(resolve, 500))
        return {
          stats: MOCK_DASHBOARD_STATS,
          alerts: MOCK_ALERTS,
          recentActivities: MOCK_RECENT_ACTIVITIES,
        }
      }
      const { data } = await apiClient.get('/committee/dashboard')
      return data
    },
  })
}

// ============================================
// ANNOUNCEMENT HOOKS
// ============================================

export function useCommitteeAnnouncements() {
  return useQuery({
    queryKey: committeeKeys.announcements(),
    queryFn: async () => {
      if (USE_MOCK_DATA) {
        await new Promise((resolve) => setTimeout(resolve, 400))
        return { announcements: MOCK_ANNOUNCEMENTS, total: MOCK_ANNOUNCEMENTS.length }
      }
      const { data } = await apiClient.get('/committee/announcements')
      return data
    },
  })
}

export function useCommitteeAnnouncement(announcementId: number) {
  return useQuery({
    queryKey: committeeKeys.announcement(announcementId),
    queryFn: async () => {
      if (USE_MOCK_DATA) {
        await new Promise((resolve) => setTimeout(resolve, 300))
        return MOCK_ANNOUNCEMENTS.find((a) => a.announcementId === announcementId) || null
      }
      const { data } = await apiClient.get(`/committee/announcements/${announcementId}`)
      return data
    },
    enabled: !!announcementId,
  })
}

export function useCreateCommitteeAnnouncement() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: CreateAnnouncementData) => {
      if (USE_MOCK_DATA) {
        await new Promise((resolve) => setTimeout(resolve, 800))
        return { success: true, announcementId: Date.now() }
      }
      // Always send multipart so the backend can parse files + JSON in one request.
      const { attachments, ...jsonPayload } = data
      const formData = new FormData()
      formData.append('data', new Blob([JSON.stringify(jsonPayload)], { type: 'application/json' }))
      if (attachments && attachments.length > 0) {
        for (const file of attachments) {
          formData.append('files', file)
        }
      }
      const { data: responseData } = await apiClient.post('/committee/announcements', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return responseData
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: committeeKeys.announcements() })
    },
  })
}

export function useUpdateCommitteeAnnouncement() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: Partial<FYPAnnouncement> & { announcementId: number }) => {
      if (USE_MOCK_DATA) {
        await new Promise((resolve) => setTimeout(resolve, 600))
        return { success: true }
      }
      const { announcementId, ...body } = data
      const { data: responseData } = await apiClient.put(`/committee/announcements/${announcementId}`, body)
      return responseData
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: committeeKeys.announcements() })
      queryClient.invalidateQueries({ queryKey: committeeKeys.announcement(variables.announcementId) })
    },
  })
}

export function useArchiveAnnouncement() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (announcementId: number) => {
      if (USE_MOCK_DATA) {
        await new Promise((resolve) => setTimeout(resolve, 400))
        return { success: true }
      }
      const { data } = await apiClient.post(`/committee/announcements/${announcementId}/archive`)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: committeeKeys.announcements() })
    },
  })
}

// ============================================
// PROPOSAL REVIEW HOOKS
// ============================================

export function useCommitteeProposals(filters?: { status?: string; cycle?: string; programme?: string }) {
  return useQuery({
    queryKey: [...committeeKeys.proposals(), filters],
    queryFn: async () => {
      if (USE_MOCK_DATA) {
        await new Promise((resolve) => setTimeout(resolve, 500))
        let filtered = [...MOCK_PROPOSALS]
        if (filters?.status) {
          filtered = filtered.filter((p) => p.status === filters.status)
        }
        if (filters?.cycle) {
          filtered = filtered.filter((p) => p.cycle === filters.cycle)
        }
        if (filters?.programme) {
          filtered = filtered.filter((p) => p.programme.includes(filters.programme!))
        }
        return { proposals: filtered, total: filtered.length }
      }
      const { data } = await apiClient.get('/committee/proposals', { params: filters })
      return data
    },
  })
}

export function useCommitteeProposal(proposalId: number) {
  return useQuery({
    queryKey: committeeKeys.proposal(proposalId),
    queryFn: async () => {
      if (USE_MOCK_DATA) {
        await new Promise((resolve) => setTimeout(resolve, 400))
        return MOCK_PROPOSALS.find((p) => p.proposalId === proposalId) || null
      }
      const { data } = await apiClient.get(`/committee/proposals/${proposalId}`)
      return data
    },
    enabled: !!proposalId,
  })
}

export function useSubmitCommitteeProposalReview() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: SubmitProposalReviewData) => {
      if (USE_MOCK_DATA) {
        await new Promise((resolve) => setTimeout(resolve, 800))
        return { success: true }
      }
      const { proposalId, ...body } = data
      const { data: responseData } = await apiClient.post(`/committee/proposals/${proposalId}/review`, body)
      return responseData
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: committeeKeys.proposals() })
      queryClient.invalidateQueries({ queryKey: committeeKeys.proposal(variables.proposalId) })
      queryClient.invalidateQueries({ queryKey: committeeKeys.dashboard() })
    },
  })
}

// ============================================
// GENERAL DOCUMENTS HOOKS
// ============================================

export function useGeneralDocuments(filters?: { category?: string; visibility?: string }) {
  return useQuery({
    queryKey: [...committeeKeys.documents(), filters],
    queryFn: async () => {
      if (USE_MOCK_DATA) {
        await new Promise((resolve) => setTimeout(resolve, 400))
        let filtered = [...MOCK_DOCUMENTS]
        if (filters?.category) {
          filtered = filtered.filter((d) => d.category === filters.category)
        }
        if (filters?.visibility) {
          filtered = filtered.filter((d) => d.visibility === filters.visibility)
        }
        return { documents: filtered, total: filtered.length }
      }
      const { data } = await apiClient.get('/committee/documents', { params: filters })
      return data
    },
  })
}

export function useGeneralDocument(documentId: number) {
  return useQuery({
    queryKey: committeeKeys.document(documentId),
    queryFn: async () => {
      if (USE_MOCK_DATA) {
        await new Promise((resolve) => setTimeout(resolve, 300))
        return MOCK_DOCUMENTS.find((d) => d.documentId === documentId) || null
      }
      const { data } = await apiClient.get(`/committee/documents/${documentId}`)
      return data
    },
    enabled: !!documentId,
  })
}

export function useUploadGeneralDocument() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: CommitteeUploadDocumentData) => {
      if (USE_MOCK_DATA) {
        await new Promise((resolve) => setTimeout(resolve, 1500))
        return { success: true, documentId: Date.now() }
      }
      const formData = new FormData()
      formData.append('file', data.file)
      formData.append('title', data.title)
      formData.append('category', data.category)
      formData.append('visibility', data.visibility)
      if (data.description) formData.append('description', data.description)
      if (data.changeNotes) formData.append('changeNotes', data.changeNotes)
      if (data.cycleScope) formData.append('cycleScope', data.cycleScope)
      const { data: responseData } = await apiClient.post('/committee/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return responseData
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: committeeKeys.documents() })
    },
  })
}

export function useUpdateGeneralDocument() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: { documentId: number; file?: File; changeNotes?: string } & Partial<GeneralDocument>) => {
      if (USE_MOCK_DATA) {
        await new Promise((resolve) => setTimeout(resolve, 1000))
        return { success: true }
      }
      const { documentId, file, ...rest } = data
      const formData = new FormData()
      if (file) formData.append('file', file)
      Object.entries(rest).forEach(([key, value]) => {
        if (value !== undefined && value !== null) formData.append(key, String(value))
      })
      const { data: responseData } = await apiClient.put(`/committee/documents/${documentId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return responseData
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: committeeKeys.documents() })
      queryClient.invalidateQueries({ queryKey: committeeKeys.document(variables.documentId) })
    },
  })
}

export function useDeleteGeneralDocument() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (documentId: number) => {
      if (USE_MOCK_DATA) {
        await new Promise((resolve) => setTimeout(resolve, 500))
        return { success: true }
      }
      const { data } = await apiClient.delete(`/committee/documents/${documentId}`)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: committeeKeys.documents() })
    },
  })
}

// ============================================
// PROJECT & PAIRING HOOKS
// ============================================

export function useCommitteeCycles() {
  return useQuery({
    queryKey: [...committeeKeys.all, 'cycles'] as const,
    queryFn: async (): Promise<{ cycles: CycleSummary[]; total: number }> => {
      const { data } = await apiClient.get('/committee/cycles')
      return data
    },
    // Dropdown stays fresh without a manual refresh: poll 60s, treat as fresh for 30s.
    // Window-focus refetch is on by default.
    staleTime: 30_000,
    refetchInterval: 60_000,
  })
}

export function useProjectOverview(params: {
  cycleId?: number
  cycleStatus?: CycleStatus
  projectStatus?: CommitteeProjectStatus
  pairingStatus?: PairingStatus
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH'
  search?: string
  page?: number
  size?: number
} = {}) {
  return useQuery({
    queryKey: [...committeeKeys.projects(), params],
    queryFn: async () => {
      const { data } = await apiClient.get<{
        content?: ProjectOverview[]
        totalElements?: number
        totalPages?: number
        number?: number
        size?: number
      }>('/committee/projects', {
        params: {
          cycleId: params.cycleId,
          cycleStatus: params.cycleStatus,
          projectStatus: params.projectStatus,
          pairingStatus: params.pairingStatus,
          riskLevel: params.riskLevel,
          search: params.search || undefined,
          page: params.page ?? 0,
          size: params.size ?? 20,
        },
      })
      return {
        projects: data.content ?? [],
        total: data.totalElements ?? 0,
        totalPages: data.totalPages ?? 0,
        page: data.number ?? 0,
        size: data.size ?? (params.size ?? 20),
      }
    },
    placeholderData: (prev) => prev,
  })
}

export function useProjectDetail(projectId: number) {
  return useQuery({
    queryKey: committeeKeys.project(projectId),
    queryFn: async (): Promise<ProjectDetail | null> => {
      if (USE_MOCK_DATA) {
        await new Promise((resolve) => setTimeout(resolve, 400))
        const project = MOCK_PROJECTS.find((p) => p.projectId === projectId)
        if (!project) return null
        return {
          projectId: project.projectId,
          title: project.title,
          description: 'A comprehensive project aimed at developing innovative solutions.',
          studentId: project.studentId,
          studentName: project.studentName,
          studentEmail: project.studentEmail,
          programme: project.programme,
          cycle: project.cycle,
          supervisorId: project.supervisorId,
          supervisorName: project.supervisorName,
          supervisorEmail: project.supervisorId ? `${project.supervisorName?.toLowerCase().replace(' ', '.')}@mmu.edu.my` : undefined,
          supervisorDepartment: project.supervisorId ? 'Computer Science' : undefined,
          pairingStatus: project.pairingStatus,
          projectStatus: project.projectStatus,
          proposalStatus: project.proposalStatus,
          progress: project.progress,
          riskLevel: project.riskLevel,
          riskFactors: project.riskLevel === 'HIGH' ? ['No supervisor assigned', 'Behind schedule'] :
                       project.riskLevel === 'MEDIUM' ? ['Limited meeting attendance'] : [],
          registeredAt: '2024-09-01T00:00:00Z',
          pairedAt: project.supervisorId ? '2024-09-15T00:00:00Z' : undefined,
          milestones: [
            { milestoneId: 1, title: 'Proposal Submission', dueDate: '2025-01-31', completedAt: '2025-01-18', status: 'COMPLETED' as const },
            { milestoneId: 2, title: 'Literature Review', dueDate: '2025-02-28', status: 'IN_PROGRESS' as const },
            { milestoneId: 3, title: 'Implementation Phase 1', dueDate: '2025-03-31', status: 'PENDING' as const },
          ],
          recentMeetings: [
            { meetingId: 1, title: 'Initial Consultation', scheduledAt: '2025-01-15T10:00:00Z', status: 'COMPLETED' as const },
            { meetingId: 2, title: 'Progress Review', scheduledAt: '2025-01-22T14:00:00Z', status: 'SCHEDULED' as const },
          ],
          submissions: [
            { submissionId: 1, title: 'Proposal Document', submittedAt: '2025-01-18T14:30:00Z', status: 'APPROVED' as const },
            { submissionId: 2, title: 'Literature Review Draft', submittedAt: '2025-01-20T10:00:00Z', status: 'PENDING' as const },
          ],
        }
      }
      const { data } = await apiClient.get(`/committee/projects/${projectId}`)
      return data
    },
    enabled: !!projectId,
  })
}

export function useUnpairedStudents(cycleId?: number) {
  return useQuery({
    queryKey: [...committeeKeys.unpairedStudents(), cycleId],
    queryFn: async () => {
      const { data } = await apiClient.get('/committee/projects/unpaired-students', {
        params: { cycleId },
      })
      return data as { students: UnpairedStudent[] }
    },
  })
}

export function useSupervisorLoads() {
  return useQuery({
    queryKey: committeeKeys.supervisorLoads(),
    queryFn: async () => {
      if (USE_MOCK_DATA) {
        await new Promise((resolve) => setTimeout(resolve, 400))
        return { supervisors: MOCK_SUPERVISOR_LOADS, total: MOCK_SUPERVISOR_LOADS.length }
      }
      const { data } = await apiClient.get('/committee/projects/supervisor-loads')
      return data
    },
  })
}

export function useSupervisorLoadDetail(supervisorId: string) {
  return useQuery({
    queryKey: committeeKeys.supervisorLoad(supervisorId),
    queryFn: async () => {
      if (USE_MOCK_DATA) {
        await new Promise((resolve) => setTimeout(resolve, 300))
        return MOCK_SUPERVISOR_LOADS.find((s) => s.supervisorId === supervisorId) || null
      }
      const { data } = await apiClient.get(`/committee/projects/supervisor-loads/${supervisorId}`)
      return data
    },
    enabled: !!supervisorId,
  })
}

export function useExportProjects() {
  return useMutation({
    mutationFn: async (options: {
      format: 'CSV' | 'XLSX' | 'PDF'
      filters?: {
        cycleId?: number
        cycleStatus?: CycleStatus
        projectStatus?: CommitteeProjectStatus
        pairingStatus?: PairingStatus
        riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH'
        search?: string
      }
    }) => {
      const response = await apiClient.get('/committee/projects/export', {
        params: { format: options.format.toLowerCase(), ...(options.filters || {}) },
        responseType: 'blob',
      })
      const blob = response.data as Blob
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const disposition = response.headers['content-disposition'] as string | undefined
      const match = disposition?.match(/filename="?([^";]+)"?/i)
      a.download = match ? match[1]
        : `projects-${new Date().toISOString().slice(0, 10)}.${options.format.toLowerCase()}`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      return { success: true }
    },
  })
}

// ============================================
// REPORTS HOOKS
// ============================================

export function useGeneratedReports() {
  return useQuery({
    queryKey: committeeKeys.reports(),
    queryFn: async () => {
      if (USE_MOCK_DATA) {
        await new Promise((resolve) => setTimeout(resolve, 400))
        return { reports: MOCK_REPORTS, total: MOCK_REPORTS.length }
      }
      const { data } = await apiClient.get('/committee/reports')
      return data
    },
  })
}

export function useGenerateReport() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (config: ReportConfig) => {
      const { data } = await apiClient.post('/committee/reports/generate', config)
      return data as GeneratedReport
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: committeeKeys.reports() })
    },
  })
}

export function useDownloadReport() {
  return useMutation({
    mutationFn: async (report: GeneratedReport) => {
      const response = await apiClient.get(`/committee/reports/${report.reportId}/download`, {
        responseType: 'blob',
      })
      const blob = response.data as Blob
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const disposition = response.headers['content-disposition'] as string | undefined
      const match = disposition?.match(/filename="?([^";]+)"?/i)
      a.download = match ? match[1]
        : `${report.title.replace(/[^a-z0-9-]+/gi, '_')}.${report.format.toLowerCase()}`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      return { success: true }
    },
  })
}

export function useDeleteReport() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (reportId: number) => {
      if (USE_MOCK_DATA) {
        await new Promise((resolve) => setTimeout(resolve, 400))
        return { success: true }
      }
      const { data } = await apiClient.delete(`/committee/reports/${reportId}`)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: committeeKeys.reports() })
    },
  })
}

// ============================================
// NOTIFICATION HOOKS
// ============================================

export function useCommitteeNotifications(limit = 50) {
  return useQuery({
    queryKey: [...committeeKeys.notifications(), limit],
    queryFn: async () => {
      if (USE_MOCK_DATA) {
        await new Promise((resolve) => setTimeout(resolve, 300))
        return { notifications: MOCK_NOTIFICATIONS.slice(0, limit), total: MOCK_NOTIFICATIONS.length }
      }
      const { data } = await apiClient.get('/notifications', { params: { limit } })
      return data
    },
  })
}

export function useCommitteeUnreadCount() {
  return useQuery({
    queryKey: committeeKeys.unreadCount(),
    queryFn: async () => {
      if (USE_MOCK_DATA) {
        await new Promise((resolve) => setTimeout(resolve, 200))
        return { count: MOCK_NOTIFICATIONS.filter((n) => !n.isRead).length }
      }
      const { data } = await apiClient.get('/notifications/unread-count')
      return data
    },
  })
}

export function useMarkCommitteeNotificationRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (notificationId: number) => {
      if (USE_MOCK_DATA) {
        await new Promise((resolve) => setTimeout(resolve, 200))
        return { success: true }
      }
      const { data } = await apiClient.put(`/notifications/${notificationId}/read`)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: committeeKeys.notifications() })
      queryClient.invalidateQueries({ queryKey: committeeKeys.unreadCount() })
    },
  })
}

export function useMarkAllCommitteeNotificationsRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      if (USE_MOCK_DATA) {
        await new Promise((resolve) => setTimeout(resolve, 400))
        return { success: true }
      }
      const { data } = await apiClient.put('/notifications/mark-all-read')
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: committeeKeys.notifications() })
      queryClient.invalidateQueries({ queryKey: committeeKeys.unreadCount() })
    },
  })
}
