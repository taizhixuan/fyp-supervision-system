export const ROUTES = {
  // Public routes
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',

  // Account status routes
  ACCOUNT_PENDING: '/account-pending',
  ACCOUNT_BLOCKED: '/account-blocked',
  FYP1_RESULT_PENDING: '/fyp1-result-pending',

  // Auth redirect
  REDIRECT: '/redirect',

  // Common routes (authenticated)
  SETTINGS: '/settings',

  // Error routes
  ACCESS_DENIED: '/access-denied',
  NOT_FOUND: '/404',
  SERVER_ERROR: '/error',
  SESSION_EXPIRED: '/session-expired',
  MAINTENANCE: '/maintenance',

  // Role-specific dashboard routes
  STUDENT: {
    DASHBOARD: '/student/dashboard',
    PROFILE: '/student/profile',
    // Supervisor Discovery
    SUPERVISORS: '/student/supervisors',
    SUPERVISOR_DETAIL: '/student/supervisors/:id',
    RECOMMENDATIONS: '/student/recommendations',
    COMPARE_SUPERVISORS: '/student/supervisors/compare',
    // Supervision Requests
    CREATE_REQUEST: '/student/request/new',
    MY_REQUESTS: '/student/requests',
    // Proposal
    PROPOSAL: '/student/proposal',
    PROPOSAL_HISTORY: '/student/proposal/history',
    PROPOSAL_ANALYSIS: '/student/proposal/analysis',
    PROPOSAL_STATUS: '/student/proposal/status',
    // Registration
    REGISTRATION: '/student/registration',
    REGISTRATION_STATUS: '/student/registration',
    // Meetings
    MEETINGS: '/student/meetings',
    MEETING_NEW: '/student/meetings/new',
    MEETING_DETAIL: '/student/meetings/:id',
    MEETING_EXPORT: '/student/meetings/export',
    // Supervision Logs (Weekly Progress)
    LOGS: '/student/logs',
    LOG_NEW: '/student/logs/new',
    LOG_DETAIL: '/student/logs/:id',
    LOG_EDIT: '/student/logs/:id/edit',
    // Meeting Logs (MMU FCI Format)
    MEETING_LOGS: '/student/meeting-logs',
    MEETING_LOG_NEW: '/student/meeting-logs/new',
    MEETING_LOG_DETAIL: '/student/meeting-logs/:id',
    MEETING_LOG_EDIT: '/student/meeting-logs/:id/edit',
    // Documents
    DOCUMENTS: '/student/documents',
    DOCUMENT_UPLOAD: '/student/documents/upload',
    DOCUMENT_DETAIL: '/student/documents/:id',
    DOCUMENT_HISTORY: '/student/documents/:id/history',
    // Resources
    RESOURCES: '/student/resources',
    RESOURCE_DETAIL: '/student/resources/:id',
    DEADLINES: '/student/deadlines',
    // Announcements (UC14)
    ANNOUNCEMENTS: '/student/announcements',
    // Notifications
    NOTIFICATIONS: '/student/notifications',
    NOTIFICATION_SETTINGS: '/student/notifications/settings',
    // Chatbot
    CHATBOT: '/student/chatbot',
  },
  SUPERVISOR: {
    // Dashboard & Profile
    DASHBOARD: '/supervisor/dashboard',
    PROFILE: '/supervisor/profile',
    // Requests
    REQUESTS: '/supervisor/requests',
    REQUEST_DETAIL: '/supervisor/requests/:id',
    // Supervisees
    SUPERVISEES: '/supervisor/supervisees',
    SUPERVISEE_DETAIL: '/supervisor/supervisees/:id',
    // Proposals
    PROPOSALS: '/supervisor/proposals',
    PROPOSAL_DETAIL: '/supervisor/proposals/:id',
    // Meetings
    MEETINGS: '/supervisor/meetings',
    MEETING_NEW: '/supervisor/meetings/new',
    MEETING_DETAIL: '/supervisor/meetings/:id',
    // Logs (Weekly Progress)
    LOGS: '/supervisor/logs',
    LOG_DETAIL: '/supervisor/logs/:id',
    // Meeting Logs (MMU FCI Format)
    MEETING_LOGS: '/supervisor/meeting-logs',
    MEETING_LOG_DETAIL: '/supervisor/meeting-logs/:id',
    // Documents
    DOCUMENTS: '/supervisor/documents',
    DOCUMENT_DETAIL: '/supervisor/documents/:id',
    DOCUMENT_FEEDBACK: '/supervisor/documents/:id/feedback',
    // Announcements
    ANNOUNCEMENTS: '/supervisor/announcements',
    ANNOUNCEMENT_NEW: '/supervisor/announcements/new',
    ANNOUNCEMENT_EDIT: '/supervisor/announcements/:id/edit',
    // Notifications
    NOTIFICATIONS: '/supervisor/notifications',
  },
  COMMITTEE: {
    // Dashboard
    DASHBOARD: '/committee/dashboard',
    // Profile
    PROFILE: '/committee/profile',
    // Announcements
    ANNOUNCEMENTS: '/committee/announcements',
    ANNOUNCEMENT_NEW: '/committee/announcements/new',
    ANNOUNCEMENT_EDIT: '/committee/announcements/:id/edit',
    // Proposal Review
    PROPOSALS: '/committee/proposals',
    PROPOSAL_DETAIL: '/committee/proposals/:id',
    // General Documents
    DOCUMENTS: '/committee/documents',
    DOCUMENT_UPLOAD: '/committee/documents/upload',
    DOCUMENT_DETAIL: '/committee/documents/:id',
    DOCUMENT_VERSIONS: '/committee/documents/:id/versions',
    // Project & Pairing
    PROJECTS: '/committee/projects',
    PROJECT_DETAIL: '/committee/projects/:id',
    UNPAIRED_STUDENTS: '/committee/projects/unpaired',
    SUPERVISOR_LOAD: '/committee/projects/supervisor-load',
    SUPERVISOR_LOAD_DETAIL: '/committee/projects/supervisor-load/:id',
    // Reports
    REPORTS: '/committee/reports',
    REPORTS_HISTORY: '/committee/reports/history',
    REPORT_DETAIL: '/committee/reports/:id',
    // Notifications
    NOTIFICATIONS: '/committee/notifications',
  },
  ADMIN: {
    // Dashboard
    DASHBOARD: '/admin/dashboard',
    // Profile
    PROFILE: '/admin/profile',
    // User Management (UC30)
    USERS: '/admin/users',
    USER_NEW: '/admin/users/new',
    USER_DETAIL: '/admin/users/:id',
    USER_EDIT: '/admin/users/:id/edit',
    // Pending registrations queue (real-world flow: faculty admin gates signups)
    PENDING_REGISTRATIONS: '/admin/registrations',
    // Approved roster (CSV-driven auto-approval list)
    APPROVED_ROSTER: '/admin/roster',
    // FYP1 pass tracking (sourced from external eBwise/Clic results)
    FYP1_PASS: '/admin/fyp1-pass',
    // System Parameters (UC31)
    PARAMETERS: '/admin/parameters',
    PARAMETER_EDIT: '/admin/parameters/:id',
    // FYP Cycles (UC31)
    CYCLES: '/admin/cycles',
    CYCLE_NEW: '/admin/cycles/new',
    CYCLE_DETAIL: '/admin/cycles/:id',
    // Deadlines (UC31)
    DEADLINES: '/admin/deadlines',
    DEADLINE_NEW: '/admin/deadlines/new',
    DEADLINE_EDIT: '/admin/deadlines/:id',
    // Integrations (UC32)
    INTEGRATIONS: '/admin/integrations',
    INTEGRATION_DETAIL: '/admin/integrations/:id',
    // Export Configuration (UC32)
    EXPORT_CONFIG: '/admin/export',
    EXPORT_CONFIG_NEW: '/admin/export/new',
    // Maintenance (UC33)
    MAINTENANCE: '/admin/maintenance',
    JOB_HISTORY: '/admin/maintenance/jobs',
    // Audit Logs
    AUDIT_LOGS: '/admin/audit-logs',
    // Notifications
    NOTIFICATIONS: '/admin/notifications',
    // Settings (legacy)
    SETTINGS: '/admin/settings',
  },
} as const

export const ROLE_ROUTES = {
  STUDENT: ROUTES.STUDENT.DASHBOARD,
  SUPERVISOR: ROUTES.SUPERVISOR.DASHBOARD,
  FYP_COMMITTEE: ROUTES.COMMITTEE.DASHBOARD,
  SYSTEM_ADMIN: ROUTES.ADMIN.DASHBOARD,
} as const

export type UserRole = keyof typeof ROLE_ROUTES
