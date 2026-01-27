import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import type {
  SupervisorProfile,
  SupervisionRequest,
  Supervisee,
  ProposalForReview,
  SupervisorMeeting,
  SupervisionLogForReview,
  SuperviseeDocument,
  SupervisorAnnouncement,
  SupervisorDashboardStats,
  SupervisorNotification,
  RequestStatus,
  ProposalFeedback,
  DocumentFeedback,
} from '@/types'

// Enable mock data in development mode
const USE_MOCK_DATA = import.meta.env.DEV

// ============================================
// MOCK DATA
// ============================================

const MOCK_SUPERVISOR_PROFILE: SupervisorProfile = {
  supervisorId: 'sup-001',
  userId: 'mock-supervisor-001',
  fullName: 'Dr. Sarah Lee',
  email: 'sarah.lee@mmu.edu.my',
  department: 'Faculty of Computing & Informatics',
  faculty: 'FCI',
  position: 'Associate Professor',
  researchAreas: ['Artificial Intelligence', 'Machine Learning', 'Natural Language Processing'],
  expertise: ['Deep Learning', 'Computer Vision', 'Data Mining'],
  currentSupervisionCount: 5,
  maxSupervisionQuota: 8,
  availableSlots: 3,
  isAcceptingStudents: true,
  preferredProjectTypes: ['Research', 'Application Development', 'Data Science'],
  bio: 'Associate Professor with 15 years of experience in AI research and education.',
  officeLocation: 'FCI Building, Level 5, Room 502',
  phoneNumber: '+60-3-8312-5678',
  linkedInUrl: 'https://linkedin.com/in/sarahlee',
  googleScholarUrl: 'https://scholar.google.com/citations?user=xxx',
  createdAt: '2020-01-15T00:00:00Z',
  updatedAt: '2025-01-15T00:00:00Z',
}

const MOCK_REQUESTS: SupervisionRequest[] = [
  {
    requestId: 1,
    studentId: 'std-001',
    studentName: 'Ahmad bin Abdullah',
    studentEmail: 'ahmad@student.mmu.edu.my',
    studentProgram: 'Bachelor of Computer Science (Hons)',
    studentYear: 3,
    studentCGPA: 3.45,
    proposedTitle: 'AI-Powered Code Review Assistant',
    projectDescription: 'Developing an intelligent system that uses machine learning to automatically review code quality and suggest improvements.',
    researchArea: 'Artificial Intelligence',
    motivation: 'I am passionate about AI and software engineering. Your research in NLP aligns with my interest in building intelligent developer tools.',
    status: 'PENDING',
    submittedAt: '2025-01-18T10:30:00Z',
  },
  {
    requestId: 2,
    studentId: 'std-002',
    studentName: 'Siti Aminah',
    studentEmail: 'siti@student.mmu.edu.my',
    studentProgram: 'Bachelor of Software Engineering (Hons)',
    studentYear: 3,
    studentCGPA: 3.72,
    proposedTitle: 'Sentiment Analysis for Malaysian Social Media',
    projectDescription: 'Building a sentiment analysis system that understands Malaysian language nuances including Bahasa Malaysia, English, and mixed code-switching.',
    researchArea: 'Natural Language Processing',
    motivation: 'Your expertise in NLP and local language understanding would be invaluable for my project.',
    status: 'PENDING',
    submittedAt: '2025-01-19T14:00:00Z',
  },
  {
    requestId: 3,
    studentId: 'std-003',
    studentName: 'Kumar Raj',
    studentEmail: 'kumar@student.mmu.edu.my',
    studentProgram: 'Bachelor of Computer Science (Hons)',
    studentYear: 4,
    studentCGPA: 3.28,
    proposedTitle: 'Fraud Detection System Using Deep Learning',
    projectDescription: 'Implementing a real-time fraud detection system for e-commerce transactions using deep neural networks.',
    researchArea: 'Machine Learning',
    motivation: 'Your publications on anomaly detection have inspired my project idea.',
    status: 'ACCEPTED',
    submittedAt: '2025-01-10T09:00:00Z',
    respondedAt: '2025-01-12T11:00:00Z',
  },
]

const MOCK_SUPERVISEES: Supervisee[] = [
  {
    superviseeId: 'sup-std-001',
    userId: 'usr-std-001',
    studentId: '1211234567',
    fullName: 'Kumar Raj',
    email: 'kumar@student.mmu.edu.my',
    program: 'Bachelor of Computer Science (Hons)',
    year: 4,
    cgpa: 3.28,
    projectTitle: 'Fraud Detection System Using Deep Learning',
    projectStatus: 'IN_PROGRESS',
    proposalStatus: 'APPROVED',
    supervisionStartDate: '2025-01-12T00:00:00Z',
    expectedCompletionDate: '2025-12-15T00:00:00Z',
    lastMeetingDate: '2025-01-15T10:00:00Z',
    nextMeetingDate: '2025-01-22T10:00:00Z',
    totalMeetings: 3,
    pendingLogs: 1,
    totalLogs: 3,
    documentsCount: 5,
    overallProgress: 15,
    riskLevel: 'LOW',
  },
  {
    superviseeId: 'sup-std-002',
    userId: 'usr-std-002',
    studentId: '1211234568',
    fullName: 'Mei Ling Wong',
    email: 'meiling@student.mmu.edu.my',
    program: 'Bachelor of Software Engineering (Hons)',
    year: 4,
    cgpa: 3.85,
    projectTitle: 'Smart Campus Navigation System',
    projectStatus: 'IN_PROGRESS',
    proposalStatus: 'APPROVED',
    supervisionStartDate: '2024-09-01T00:00:00Z',
    expectedCompletionDate: '2025-06-30T00:00:00Z',
    lastMeetingDate: '2025-01-18T14:00:00Z',
    nextMeetingDate: '2025-01-25T14:00:00Z',
    totalMeetings: 12,
    pendingLogs: 0,
    totalLogs: 16,
    documentsCount: 12,
    overallProgress: 65,
    riskLevel: 'LOW',
  },
  {
    superviseeId: 'sup-std-003',
    userId: 'usr-std-003',
    studentId: '1211234569',
    fullName: 'Raj Patel',
    email: 'raj@student.mmu.edu.my',
    program: 'Bachelor of Computer Science (Hons)',
    year: 4,
    cgpa: 2.95,
    projectTitle: 'IoT-Based Smart Parking System',
    projectStatus: 'IN_PROGRESS',
    proposalStatus: 'APPROVED',
    supervisionStartDate: '2024-09-01T00:00:00Z',
    expectedCompletionDate: '2025-06-30T00:00:00Z',
    lastMeetingDate: '2025-01-05T10:00:00Z',
    totalMeetings: 8,
    pendingLogs: 3,
    totalLogs: 10,
    documentsCount: 6,
    overallProgress: 40,
    riskLevel: 'HIGH',
  },
  {
    superviseeId: 'sup-std-004',
    userId: 'usr-std-004',
    studentId: '1211234570',
    fullName: 'Nurul Aisyah',
    email: 'nurul@student.mmu.edu.my',
    program: 'Bachelor of Information Technology (Hons)',
    year: 4,
    cgpa: 3.62,
    projectTitle: 'E-Learning Gamification Platform',
    projectStatus: 'IN_PROGRESS',
    proposalStatus: 'APPROVED',
    supervisionStartDate: '2024-09-01T00:00:00Z',
    expectedCompletionDate: '2025-06-30T00:00:00Z',
    lastMeetingDate: '2025-01-17T11:00:00Z',
    nextMeetingDate: '2025-01-24T11:00:00Z',
    totalMeetings: 10,
    pendingLogs: 1,
    totalLogs: 14,
    documentsCount: 9,
    overallProgress: 55,
    riskLevel: 'MEDIUM',
  },
  {
    superviseeId: 'sup-std-005',
    userId: 'usr-std-005',
    studentId: '1211234571',
    fullName: 'Jason Tan',
    email: 'jason@student.mmu.edu.my',
    program: 'Bachelor of Computer Science (Hons)',
    year: 4,
    cgpa: 3.15,
    projectTitle: 'Blockchain-Based Supply Chain Tracking',
    projectStatus: 'ON_HOLD',
    proposalStatus: 'APPROVED',
    supervisionStartDate: '2024-09-01T00:00:00Z',
    expectedCompletionDate: '2025-06-30T00:00:00Z',
    lastMeetingDate: '2024-12-20T15:00:00Z',
    totalMeetings: 6,
    pendingLogs: 4,
    totalLogs: 8,
    documentsCount: 4,
    overallProgress: 25,
    riskLevel: 'CRITICAL',
  },
]

const MOCK_PROPOSALS: ProposalForReview[] = [
  {
    proposalId: 1,
    studentId: 'std-001',
    studentName: 'Ahmad bin Abdullah',
    title: 'AI-Powered Code Review Assistant',
    version: 2,
    status: 'UNDER_REVIEW',
    submittedAt: '2025-01-18T10:30:00Z',
    lastUpdatedAt: '2025-01-18T10:30:00Z',
    content: {
      background: 'Code review is a critical practice in software development that helps maintain code quality and knowledge sharing among team members. However, manual code review is time-consuming and can be inconsistent.',
      problemStatement: 'Current code review processes are manual, time-intensive, and subject to human inconsistency. There is a need for an intelligent assistant that can automate routine code quality checks.',
      objectives: [
        'Develop an AI model that can analyze code quality',
        'Implement automated detection of common code issues',
        'Create a user-friendly interface for code review suggestions',
      ],
      scope: 'This project will focus on Python and JavaScript codebases, with potential for expansion to other languages.',
      methodology: 'The project will use transformer-based models trained on code review datasets, combined with static analysis tools.',
      expectedOutcomes: 'A functional prototype capable of providing meaningful code review suggestions with at least 80% accuracy.',
      timeline: '12 months - divided into research, development, testing, and documentation phases.',
    },
    aiAnalysis: {
      overallScore: 78,
      clarityScore: 82,
      feasibilityScore: 75,
      originality: 70,
      suggestions: [
        'Consider adding more specific metrics for measuring accuracy',
        'Include a comparison with existing tools in the background section',
        'Clarify the scope regarding code complexity levels',
      ],
      strengths: [
        'Clear problem statement',
        'Well-defined objectives',
        'Relevant research area',
      ],
      weaknesses: [
        'Timeline could be more detailed',
        'Limited discussion of potential challenges',
      ],
      analyzedAt: '2025-01-18T11:00:00Z',
    },
    previousVersions: [
      {
        versionId: 1,
        version: 1,
        submittedAt: '2025-01-10T09:00:00Z',
        status: 'REVISION_REQUIRED',
      },
    ],
    feedbackHistory: [
      {
        feedbackId: 1,
        supervisorId: 'sup-001',
        supervisorName: 'Dr. Sarah Lee',
        content: 'Please expand on the methodology section and include more details about the dataset you plan to use.',
        feedbackType: 'REVISION_REQUEST',
        createdAt: '2025-01-12T14:00:00Z',
      },
    ],
  },
  {
    proposalId: 2,
    studentId: 'std-002',
    studentName: 'Mei Ling Wong',
    title: 'Smart Campus Navigation System',
    version: 1,
    status: 'SUBMITTED',
    submittedAt: '2025-01-19T09:00:00Z',
    lastUpdatedAt: '2025-01-19T09:00:00Z',
    content: {
      background: 'Navigating large university campuses can be challenging for new students and visitors. Current mapping solutions often lack indoor navigation capabilities.',
      problemStatement: 'MMU campus lacks an efficient digital navigation system that can guide users both indoors and outdoors.',
      objectives: [
        'Create a mobile app for campus navigation',
        'Implement indoor positioning using BLE beacons',
        'Integrate with class schedules for smart routing',
      ],
      scope: 'The project will cover the main campus buildings with potential expansion to other facilities.',
      methodology: 'Agile development methodology with iterative prototyping and user testing.',
      expectedOutcomes: 'A functional mobile application with accurate navigation capabilities.',
      timeline: '10 months with bi-weekly sprints.',
    },
    previousVersions: [],
    feedbackHistory: [],
  },
]

const MOCK_MEETINGS: SupervisorMeeting[] = [
  {
    meetingId: 1,
    studentId: 'std-001',
    studentName: 'Kumar Raj',
    title: 'Weekly Progress Review',
    type: 'IN_PERSON',
    status: 'CONFIRMED',
    requestedBy: 'STUDENT',
    proposedDateTime: '2025-01-22T10:00:00Z',
    confirmedDateTime: '2025-01-22T10:00:00Z',
    duration: 60,
    location: 'FCI Building, Room 502',
    agenda: 'Review progress on fraud detection model, discuss dataset preprocessing issues',
    createdAt: '2025-01-15T10:00:00Z',
    updatedAt: '2025-01-16T11:00:00Z',
  },
  {
    meetingId: 2,
    studentId: 'std-002',
    studentName: 'Mei Ling Wong',
    title: 'Proposal Discussion',
    type: 'ONLINE',
    status: 'PENDING',
    requestedBy: 'STUDENT',
    proposedDateTime: '2025-01-25T14:00:00Z',
    alternativeDateTimes: ['2025-01-26T10:00:00Z', '2025-01-27T15:00:00Z'],
    duration: 45,
    meetingUrl: 'https://meet.google.com/abc-defg-hij',
    agenda: 'Discuss proposal feedback and next steps',
    createdAt: '2025-01-19T14:00:00Z',
    updatedAt: '2025-01-19T14:00:00Z',
  },
  {
    meetingId: 3,
    studentId: 'std-003',
    studentName: 'Raj Patel',
    title: 'Project Status Check',
    type: 'HYBRID',
    status: 'PENDING',
    requestedBy: 'SUPERVISOR',
    proposedDateTime: '2025-01-23T11:00:00Z',
    duration: 30,
    location: 'FCI Building, Room 502',
    meetingUrl: 'https://meet.google.com/xyz-uvwx-rst',
    agenda: 'Urgent check-in regarding project delays',
    createdAt: '2025-01-20T09:00:00Z',
    updatedAt: '2025-01-20T09:00:00Z',
  },
  {
    meetingId: 4,
    studentId: 'std-004',
    studentName: 'Nurul Aisyah',
    title: 'Implementation Review',
    type: 'IN_PERSON',
    status: 'CONFIRMED',
    requestedBy: 'STUDENT',
    proposedDateTime: '2025-01-24T11:00:00Z',
    confirmedDateTime: '2025-01-24T11:00:00Z',
    duration: 60,
    location: 'FCI Building, Room 502',
    agenda: 'Review gamification features implementation',
    createdAt: '2025-01-17T11:00:00Z',
    updatedAt: '2025-01-18T09:00:00Z',
  },
]

const MOCK_LOGS: SupervisionLogForReview[] = [
  {
    logId: 1,
    studentId: 'std-001',
    studentName: 'Kumar Raj',
    weekNumber: 3,
    weekStartDate: '2025-01-13T00:00:00Z',
    weekEndDate: '2025-01-19T23:59:59Z',
    status: 'PENDING',
    activities: 'Completed data preprocessing pipeline. Started implementing the baseline model for fraud detection.',
    progressSummary: 'Data pipeline is now functional. Baseline model shows 72% accuracy on test set.',
    challenges: 'Dealing with imbalanced dataset. Need to research resampling techniques.',
    nextWeekPlan: 'Implement SMOTE for handling class imbalance. Start feature engineering.',
    hoursSpent: 25,
    submittedAt: '2025-01-19T18:00:00Z',
  },
  {
    logId: 2,
    studentId: 'std-003',
    studentName: 'Raj Patel',
    weekNumber: 2,
    weekStartDate: '2025-01-06T00:00:00Z',
    weekEndDate: '2025-01-12T23:59:59Z',
    status: 'PENDING',
    activities: 'Research on IoT protocols. Set up development environment.',
    progressSummary: 'Limited progress due to hardware delivery delays.',
    challenges: 'Waiting for Arduino boards and sensors to arrive.',
    nextWeekPlan: 'Begin hardware testing once components arrive.',
    hoursSpent: 10,
    submittedAt: '2025-01-12T20:00:00Z',
  },
  {
    logId: 3,
    studentId: 'std-003',
    studentName: 'Raj Patel',
    weekNumber: 3,
    weekStartDate: '2025-01-13T00:00:00Z',
    weekEndDate: '2025-01-19T23:59:59Z',
    status: 'PENDING',
    activities: 'Received hardware components. Started basic sensor testing.',
    progressSummary: 'Hardware is functional. Basic data collection working.',
    challenges: 'Integration with cloud platform proving difficult.',
    nextWeekPlan: 'Focus on cloud integration and data transmission.',
    hoursSpent: 15,
    submittedAt: '2025-01-19T21:00:00Z',
  },
  {
    logId: 4,
    studentId: 'std-004',
    studentName: 'Nurul Aisyah',
    weekNumber: 3,
    weekStartDate: '2025-01-13T00:00:00Z',
    weekEndDate: '2025-01-19T23:59:59Z',
    status: 'PENDING',
    activities: 'Implemented badge and points system. Created leaderboard UI.',
    progressSummary: 'Gamification core features are 80% complete.',
    challenges: 'Performance optimization needed for real-time leaderboard updates.',
    nextWeekPlan: 'Optimize database queries. Begin user testing phase.',
    hoursSpent: 30,
    submittedAt: '2025-01-19T17:00:00Z',
  },
]

const MOCK_DOCUMENTS: SuperviseeDocument[] = [
  {
    documentId: 1,
    studentId: 'std-001',
    studentName: 'Kumar Raj',
    title: 'Project Proposal v2',
    type: 'PROPOSAL',
    version: 2,
    fileName: 'kumar_proposal_v2.pdf',
    fileType: 'application/pdf',
    fileSize: 2048576,
    storagePath: '/documents/std-001/proposal_v2.pdf',
    description: 'Updated proposal with revised methodology',
    uploadedAt: '2025-01-18T10:00:00Z',
    hasFeedback: true,
    feedbackCount: 1,
  },
  {
    documentId: 2,
    studentId: 'std-002',
    studentName: 'Mei Ling Wong',
    title: 'Requirements Specification',
    type: 'REPORT',
    version: 1,
    fileName: 'meiling_srs.pdf',
    fileType: 'application/pdf',
    fileSize: 1536000,
    storagePath: '/documents/std-002/srs.pdf',
    description: 'Software Requirements Specification document',
    uploadedAt: '2025-01-17T14:00:00Z',
    hasFeedback: false,
    feedbackCount: 0,
  },
  {
    documentId: 3,
    studentId: 'std-003',
    studentName: 'Raj Patel',
    title: 'Progress Report - January',
    type: 'REPORT',
    version: 1,
    fileName: 'raj_progress_jan.pdf',
    fileType: 'application/pdf',
    fileSize: 512000,
    storagePath: '/documents/std-003/progress_jan.pdf',
    description: 'Monthly progress report for January 2025',
    uploadedAt: '2025-01-15T16:00:00Z',
    hasFeedback: false,
    feedbackCount: 0,
  },
  {
    documentId: 4,
    studentId: 'std-004',
    studentName: 'Nurul Aisyah',
    title: 'UI Mockups',
    type: 'PRESENTATION',
    version: 3,
    fileName: 'nurul_ui_mockups_v3.pdf',
    fileType: 'application/pdf',
    fileSize: 8192000,
    storagePath: '/documents/std-004/ui_mockups_v3.pdf',
    description: 'Updated UI designs with gamification elements',
    uploadedAt: '2025-01-19T11:00:00Z',
    hasFeedback: true,
    feedbackCount: 2,
  },
]

const MOCK_ANNOUNCEMENTS: SupervisorAnnouncement[] = [
  {
    announcementId: 1,
    supervisorId: 'sup-001',
    title: 'Weekly Meeting Schedule Update',
    content: 'Due to the upcoming faculty meeting, all weekly meetings for next week will be rescheduled. Please check your updated slots.',
    visibility: 'ALL_SUPERVISEES',
    priority: 'HIGH',
    publishAt: '2025-01-18T09:00:00Z',
    isActive: true,
    viewCount: 4,
    createdAt: '2025-01-18T08:30:00Z',
    updatedAt: '2025-01-18T08:30:00Z',
  },
  {
    announcementId: 2,
    supervisorId: 'sup-001',
    title: 'Progress Report Deadline Reminder',
    content: 'Monthly progress reports are due by January 31st. Please ensure your reports are submitted on time.',
    visibility: 'ALL_SUPERVISEES',
    priority: 'NORMAL',
    publishAt: '2025-01-15T10:00:00Z',
    expiresAt: '2025-01-31T23:59:59Z',
    isActive: true,
    viewCount: 5,
    createdAt: '2025-01-15T09:45:00Z',
    updatedAt: '2025-01-15T09:45:00Z',
  },
]

const MOCK_DASHBOARD_STATS: SupervisorDashboardStats = {
  totalSupervisees: 5,
  pendingRequests: 2,
  upcomingMeetings: 4,
  pendingLogReviews: 5,
  proposalsToReview: 2,
  documentsToReview: 2,
  activeAnnouncements: 2,
  superviseesByStatus: {
    notStarted: 0,
    inProgress: 4,
    completed: 0,
    onHold: 1,
  },
  superviseesByRisk: {
    low: 2,
    medium: 1,
    high: 1,
    critical: 1,
  },
  recentActivity: [
    {
      activityId: 1,
      type: 'REQUEST',
      title: 'New Supervision Request',
      description: 'Siti Aminah submitted a supervision request',
      studentName: 'Siti Aminah',
      timestamp: '2025-01-19T14:00:00Z',
      actionRequired: true,
    },
    {
      activityId: 2,
      type: 'LOG',
      title: 'Log Submitted',
      description: 'Nurul Aisyah submitted weekly log #3',
      studentId: 'std-004',
      studentName: 'Nurul Aisyah',
      timestamp: '2025-01-19T17:00:00Z',
      actionRequired: true,
    },
    {
      activityId: 3,
      type: 'DOCUMENT',
      title: 'Document Uploaded',
      description: 'Nurul Aisyah uploaded UI Mockups v3',
      studentId: 'std-004',
      studentName: 'Nurul Aisyah',
      timestamp: '2025-01-19T11:00:00Z',
      actionRequired: false,
    },
    {
      activityId: 4,
      type: 'MEETING',
      title: 'Meeting Request',
      description: 'Mei Ling Wong requested a meeting',
      studentId: 'std-002',
      studentName: 'Mei Ling Wong',
      timestamp: '2025-01-19T14:00:00Z',
      actionRequired: true,
    },
  ],
}

const MOCK_NOTIFICATIONS: SupervisorNotification[] = [
  {
    notificationId: 1,
    userId: 'mock-supervisor-001',
    type: 'NEW_REQUEST',
    title: 'New Supervision Request',
    message: 'Siti Aminah has submitted a supervision request for your review.',
    isRead: false,
    relatedEntityId: 2,
    relatedEntityType: 'request',
    createdAt: '2025-01-19T14:00:00Z',
  },
  {
    notificationId: 2,
    userId: 'mock-supervisor-001',
    type: 'LOG_SUBMITTED',
    title: 'Weekly Log Submitted',
    message: 'Kumar Raj has submitted weekly log #3 for your review.',
    isRead: false,
    relatedEntityId: 1,
    relatedEntityType: 'log',
    createdAt: '2025-01-19T18:00:00Z',
  },
  {
    notificationId: 3,
    userId: 'mock-supervisor-001',
    type: 'MEETING_REQUEST',
    title: 'Meeting Request',
    message: 'Mei Ling Wong has requested a meeting on Jan 25.',
    isRead: true,
    relatedEntityId: 2,
    relatedEntityType: 'meeting',
    createdAt: '2025-01-19T14:00:00Z',
  },
  {
    notificationId: 4,
    userId: 'mock-supervisor-001',
    type: 'DOCUMENT_UPLOADED',
    title: 'New Document',
    message: 'Nurul Aisyah uploaded UI Mockups v3.',
    isRead: true,
    relatedEntityId: 4,
    relatedEntityType: 'document',
    createdAt: '2025-01-19T11:00:00Z',
  },
]

// ============================================
// QUERY KEYS
// ============================================

export const supervisorKeys = {
  all: ['supervisor'] as const,
  profile: () => [...supervisorKeys.all, 'profile'] as const,
  dashboard: () => [...supervisorKeys.all, 'dashboard'] as const,
  requests: () => [...supervisorKeys.all, 'requests'] as const,
  request: (id: number) => [...supervisorKeys.requests(), id] as const,
  supervisees: () => [...supervisorKeys.all, 'supervisees'] as const,
  supervisee: (id: string) => [...supervisorKeys.supervisees(), id] as const,
  proposals: () => [...supervisorKeys.all, 'proposals'] as const,
  proposal: (id: number) => [...supervisorKeys.proposals(), id] as const,
  meetings: () => [...supervisorKeys.all, 'meetings'] as const,
  meeting: (id: number) => [...supervisorKeys.meetings(), id] as const,
  logs: () => [...supervisorKeys.all, 'logs'] as const,
  log: (id: number) => [...supervisorKeys.logs(), id] as const,
  documents: () => [...supervisorKeys.all, 'documents'] as const,
  document: (id: number) => [...supervisorKeys.documents(), id] as const,
  announcements: () => [...supervisorKeys.all, 'announcements'] as const,
  announcement: (id: number) => [...supervisorKeys.announcements(), id] as const,
  notifications: () => [...supervisorKeys.all, 'notifications'] as const,
}

// ============================================
// HOOKS
// ============================================

// Dashboard
export function useSupervisorDashboard() {
  return useQuery({
    queryKey: supervisorKeys.dashboard(),
    queryFn: async () => {
      if (USE_MOCK_DATA) return MOCK_DASHBOARD_STATS
      const { data } = await apiClient.get<SupervisorDashboardStats>('/supervisor/dashboard')
      return data
    },
    staleTime: 30000,
  })
}

// Profile
export function useSupervisorProfile() {
  return useQuery({
    queryKey: supervisorKeys.profile(),
    queryFn: async () => {
      if (USE_MOCK_DATA) return MOCK_SUPERVISOR_PROFILE
      const { data } = await apiClient.get<SupervisorProfile>('/supervisor/profile')
      return data
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useUpdateSupervisorProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (profileData: Partial<SupervisorProfile>) => {
      if (USE_MOCK_DATA) {
        return { ...MOCK_SUPERVISOR_PROFILE, ...profileData }
      }
      const { data } = await apiClient.put<SupervisorProfile>('/supervisor/profile', profileData)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supervisorKeys.profile() })
    },
  })
}

// Requests
export function useSupervisionRequests(status?: RequestStatus) {
  return useQuery({
    queryKey: [...supervisorKeys.requests(), status],
    queryFn: async () => {
      if (USE_MOCK_DATA) {
        const filtered = status
          ? MOCK_REQUESTS.filter(r => r.status === status)
          : MOCK_REQUESTS
        return { requests: filtered, total: filtered.length }
      }
      const { data } = await apiClient.get<{ requests: SupervisionRequest[]; total: number }>(
        '/supervisor/requests',
        { params: { status } }
      )
      return data
    },
    staleTime: 30000,
  })
}

export function useSupervisionRequest(requestId: number) {
  return useQuery({
    queryKey: supervisorKeys.request(requestId),
    queryFn: async () => {
      if (USE_MOCK_DATA) {
        return MOCK_REQUESTS.find(r => r.requestId === requestId) || null
      }
      const { data } = await apiClient.get<SupervisionRequest>(`/supervisor/requests/${requestId}`)
      return data
    },
    enabled: !!requestId,
  })
}

export function useRespondToRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      requestId,
      action,
      rejectionReason,
    }: {
      requestId: number
      action: 'ACCEPT' | 'REJECT'
      rejectionReason?: string
    }) => {
      if (USE_MOCK_DATA) {
        return { success: true }
      }
      const { data } = await apiClient.post(`/supervisor/requests/${requestId}/respond`, {
        action,
        rejectionReason,
      })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supervisorKeys.requests() })
      queryClient.invalidateQueries({ queryKey: supervisorKeys.dashboard() })
    },
  })
}

// Supervisees
export function useSupervisees() {
  return useQuery({
    queryKey: supervisorKeys.supervisees(),
    queryFn: async () => {
      if (USE_MOCK_DATA) {
        return { supervisees: MOCK_SUPERVISEES, total: MOCK_SUPERVISEES.length }
      }
      const { data } = await apiClient.get<{ supervisees: Supervisee[]; total: number }>(
        '/supervisor/supervisees'
      )
      return data
    },
    staleTime: 60000,
  })
}

export function useSupervisee(superviseeId: string) {
  return useQuery({
    queryKey: supervisorKeys.supervisee(superviseeId),
    queryFn: async () => {
      if (USE_MOCK_DATA) {
        return MOCK_SUPERVISEES.find(s => s.superviseeId === superviseeId) || null
      }
      const { data } = await apiClient.get<Supervisee>(`/supervisor/supervisees/${superviseeId}`)
      return data
    },
    enabled: !!superviseeId,
  })
}

// Proposals
export function useProposalsForReview() {
  return useQuery({
    queryKey: supervisorKeys.proposals(),
    queryFn: async () => {
      if (USE_MOCK_DATA) {
        return { proposals: MOCK_PROPOSALS, total: MOCK_PROPOSALS.length }
      }
      const { data } = await apiClient.get<{ proposals: ProposalForReview[]; total: number }>(
        '/supervisor/proposals'
      )
      return data
    },
    staleTime: 30000,
  })
}

export function useProposalForReview(proposalId: number) {
  return useQuery({
    queryKey: supervisorKeys.proposal(proposalId),
    queryFn: async () => {
      if (USE_MOCK_DATA) {
        return MOCK_PROPOSALS.find(p => p.proposalId === proposalId) || null
      }
      const { data } = await apiClient.get<ProposalForReview>(`/supervisor/proposals/${proposalId}`)
      return data
    },
    enabled: !!proposalId,
  })
}

export function useSubmitProposalFeedback() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      proposalId,
      content,
      feedbackType,
    }: {
      proposalId: number
      content: string
      feedbackType: ProposalFeedback['feedbackType']
    }) => {
      if (USE_MOCK_DATA) {
        return { success: true }
      }
      const { data } = await apiClient.post(`/supervisor/proposals/${proposalId}/feedback`, {
        content,
        feedbackType,
      })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supervisorKeys.proposals() })
      queryClient.invalidateQueries({ queryKey: supervisorKeys.dashboard() })
    },
  })
}

// Meetings
export function useSupervisorMeetings(status?: string) {
  return useQuery({
    queryKey: [...supervisorKeys.meetings(), status],
    queryFn: async () => {
      if (USE_MOCK_DATA) {
        const filtered = status
          ? MOCK_MEETINGS.filter(m => m.status === status)
          : MOCK_MEETINGS
        return { meetings: filtered, total: filtered.length }
      }
      const { data } = await apiClient.get<{ meetings: SupervisorMeeting[]; total: number }>(
        '/supervisor/meetings',
        { params: { status } }
      )
      return data
    },
    staleTime: 30000,
  })
}

export function useSupervisorMeeting(meetingId: number) {
  return useQuery({
    queryKey: supervisorKeys.meeting(meetingId),
    queryFn: async () => {
      if (USE_MOCK_DATA) {
        return MOCK_MEETINGS.find(m => m.meetingId === meetingId) || null
      }
      const { data } = await apiClient.get<SupervisorMeeting>(`/supervisor/meetings/${meetingId}`)
      return data
    },
    enabled: !!meetingId,
  })
}

export function useRespondToMeeting() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      meetingId,
      action,
      confirmedDateTime,
      notes,
    }: {
      meetingId: number
      action: 'CONFIRM' | 'RESCHEDULE' | 'CANCEL'
      confirmedDateTime?: string
      notes?: string
    }) => {
      if (USE_MOCK_DATA) {
        return { success: true }
      }
      const { data } = await apiClient.post(`/supervisor/meetings/${meetingId}/respond`, {
        action,
        confirmedDateTime,
        notes,
      })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supervisorKeys.meetings() })
      queryClient.invalidateQueries({ queryKey: supervisorKeys.dashboard() })
    },
  })
}

export function useCreateMeeting() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (meetingData: Partial<SupervisorMeeting>) => {
      if (USE_MOCK_DATA) {
        return { meetingId: Math.random() * 1000 }
      }
      const { data } = await apiClient.post('/supervisor/meetings', meetingData)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supervisorKeys.meetings() })
    },
  })
}

export function useCompleteMeeting() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      meetingId,
      notes,
      actionItems,
    }: {
      meetingId: number
      notes: string
      actionItems?: string[]
    }) => {
      if (USE_MOCK_DATA) {
        return { success: true }
      }
      const { data } = await apiClient.post(`/supervisor/meetings/${meetingId}/complete`, {
        notes,
        actionItems,
      })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supervisorKeys.meetings() })
    },
  })
}

// Logs
export function useLogsForReview() {
  return useQuery({
    queryKey: supervisorKeys.logs(),
    queryFn: async () => {
      if (USE_MOCK_DATA) {
        return { logs: MOCK_LOGS, total: MOCK_LOGS.length }
      }
      const { data } = await apiClient.get<{ logs: SupervisionLogForReview[]; total: number }>(
        '/supervisor/logs'
      )
      return data
    },
    staleTime: 30000,
  })
}

export function useLogForReview(logId: number) {
  return useQuery({
    queryKey: supervisorKeys.log(logId),
    queryFn: async () => {
      if (USE_MOCK_DATA) {
        return MOCK_LOGS.find(l => l.logId === logId) || null
      }
      const { data } = await apiClient.get<SupervisionLogForReview>(`/supervisor/logs/${logId}`)
      return data
    },
    enabled: !!logId,
  })
}

export function useReviewLog() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      logId,
      action,
      comment,
    }: {
      logId: number
      action: 'APPROVE' | 'REQUEST_REVISION'
      comment?: string
    }) => {
      if (USE_MOCK_DATA) {
        return { success: true }
      }
      const { data } = await apiClient.post(`/supervisor/logs/${logId}/review`, {
        action,
        comment,
      })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supervisorKeys.logs() })
      queryClient.invalidateQueries({ queryKey: supervisorKeys.dashboard() })
    },
  })
}

export function useSignLog() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (logId: number) => {
      if (USE_MOCK_DATA) {
        return { success: true }
      }
      const { data } = await apiClient.post(`/supervisor/logs/${logId}/sign`)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supervisorKeys.logs() })
    },
  })
}

// Documents
export function useSuperviseeDocuments(filters?: { studentId?: string; type?: string }) {
  return useQuery({
    queryKey: [...supervisorKeys.documents(), filters],
    queryFn: async () => {
      if (USE_MOCK_DATA) {
        let filtered = MOCK_DOCUMENTS
        if (filters?.studentId) {
          filtered = filtered.filter(d => d.studentId === filters.studentId)
        }
        if (filters?.type) {
          filtered = filtered.filter(d => d.type === filters.type)
        }
        return { documents: filtered, total: filtered.length }
      }
      const { data } = await apiClient.get<{ documents: SuperviseeDocument[]; total: number }>(
        '/supervisor/documents',
        { params: filters }
      )
      return data
    },
    staleTime: 60000,
  })
}

export function useSuperviseeDocument(documentId: number) {
  return useQuery({
    queryKey: supervisorKeys.document(documentId),
    queryFn: async () => {
      if (USE_MOCK_DATA) {
        return MOCK_DOCUMENTS.find(d => d.documentId === documentId) || null
      }
      const { data } = await apiClient.get<SuperviseeDocument>(`/supervisor/documents/${documentId}`)
      return data
    },
    enabled: !!documentId,
  })
}

export function useSubmitDocumentFeedback() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      documentId,
      content,
      annotatedFile,
    }: {
      documentId: number
      content: string
      annotatedFile?: File
    }) => {
      if (USE_MOCK_DATA) {
        return { success: true }
      }
      const formData = new FormData()
      formData.append('content', content)
      if (annotatedFile) {
        formData.append('annotatedFile', annotatedFile)
      }
      const { data } = await apiClient.post(
        `/supervisor/documents/${documentId}/feedback`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      )
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supervisorKeys.documents() })
    },
  })
}

// Announcements
export function useSupervisorAnnouncements() {
  return useQuery({
    queryKey: supervisorKeys.announcements(),
    queryFn: async () => {
      if (USE_MOCK_DATA) {
        return { announcements: MOCK_ANNOUNCEMENTS, total: MOCK_ANNOUNCEMENTS.length }
      }
      const { data } = await apiClient.get<{ announcements: SupervisorAnnouncement[]; total: number }>(
        '/supervisor/announcements'
      )
      return data
    },
    staleTime: 60000,
  })
}

export function useSupervisorAnnouncement(announcementId: number) {
  return useQuery({
    queryKey: supervisorKeys.announcement(announcementId),
    queryFn: async () => {
      if (USE_MOCK_DATA) {
        return MOCK_ANNOUNCEMENTS.find(a => a.announcementId === announcementId) || null
      }
      const { data } = await apiClient.get<SupervisorAnnouncement>(
        `/supervisor/announcements/${announcementId}`
      )
      return data
    },
    enabled: !!announcementId,
  })
}

export function useCreateAnnouncement() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (announcementData: Partial<SupervisorAnnouncement>) => {
      if (USE_MOCK_DATA) {
        return { announcementId: Math.random() * 1000 }
      }
      const { data } = await apiClient.post('/supervisor/announcements', announcementData)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supervisorKeys.announcements() })
    },
  })
}

export function useUpdateAnnouncement() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      announcementId,
      ...announcementData
    }: Partial<SupervisorAnnouncement> & { announcementId: number }) => {
      if (USE_MOCK_DATA) {
        return { success: true }
      }
      const { data } = await apiClient.put(
        `/supervisor/announcements/${announcementId}`,
        announcementData
      )
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supervisorKeys.announcements() })
    },
  })
}

export function useDeleteAnnouncement() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (announcementId: number) => {
      if (USE_MOCK_DATA) {
        return { success: true }
      }
      const { data } = await apiClient.delete(`/supervisor/announcements/${announcementId}`)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supervisorKeys.announcements() })
    },
  })
}

// Notifications
export function useSupervisorNotifications(limit: number = 10) {
  return useQuery({
    queryKey: [...supervisorKeys.notifications(), limit],
    queryFn: async () => {
      if (USE_MOCK_DATA) {
        return {
          notifications: MOCK_NOTIFICATIONS.slice(0, limit),
          total: MOCK_NOTIFICATIONS.length,
        }
      }
      const { data } = await apiClient.get<{ notifications: SupervisorNotification[]; total: number }>(
        '/supervisor/notifications',
        { params: { limit } }
      )
      return data
    },
    staleTime: 30000,
  })
}

export function useSupervisorUnreadCount() {
  return useQuery({
    queryKey: [...supervisorKeys.notifications(), 'unread-count'],
    queryFn: async () => {
      if (USE_MOCK_DATA) {
        return { count: MOCK_NOTIFICATIONS.filter(n => !n.isRead).length }
      }
      const { data } = await apiClient.get<{ count: number }>('/supervisor/notifications/unread-count')
      return data
    },
    staleTime: 30000,
  })
}

export function useMarkSupervisorNotificationRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (notificationId: number) => {
      if (USE_MOCK_DATA) {
        return { success: true }
      }
      const { data } = await apiClient.put(`/supervisor/notifications/${notificationId}/read`)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supervisorKeys.notifications() })
    },
  })
}
