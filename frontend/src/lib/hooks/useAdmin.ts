import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import type {
  SystemHealthStats,
  SystemAlert,
  RecentAdminActivity,
  AdminUserListItem,
  UserDetail,
  CreateUserRequest,
  UpdateUserRequest,
  UserStatus,
  AdminSystemParameter,
  UpdateParameterRequest,
  FYPCycle,
  CycleStatus,
  CreateCycleRequest,
  UpdateCycleRequest,
  AdminDeadline,
  CreateDeadlineRequest,
  UpdateDeadlineRequest,
  Integration,
  UpdateIntegrationRequest,
  TestIntegrationResult,
  ExportConfiguration,
  CreateExportConfigRequest,
  MaintenanceJob,
  BackupInfo,
  SystemHealthCheck,
  CleanupOptions,
  AuditLog,
  AuditLogFilters,
  AdminNotification,
  ParameterCategory,
} from '@/types'

const USE_MOCK_DATA = false

// ============================================
// Mock Data
// ============================================

const MOCK_HEALTH_STATS: SystemHealthStats = {
  totalUsers: 1247,
  activeUsers: 892,
  pendingApprovals: 23,
  totalProjects: 456,
  activeProjects: 312,
  systemUptime: '45 days, 12 hours',
  lastBackup: '2025-01-20T02:00:00Z',
  storageUsed: 45.2,
  storageTotal: 100,
  cpuUsage: 32,
  memoryUsage: 58,
  databaseSize: 2.4,
}

const MOCK_SYSTEM_ALERTS: SystemAlert[] = [
  {
    alertId: 1,
    type: 'WARNING',
    title: 'Storage Usage High',
    message: 'Storage usage has exceeded 80% threshold',
    source: 'Storage Monitor',
    createdAt: '2025-01-19T14:30:00Z',
    isResolved: false,
  },
  {
    alertId: 2,
    type: 'INFO',
    title: 'Backup Completed',
    message: 'Daily backup completed successfully',
    source: 'Backup Service',
    createdAt: '2025-01-20T02:00:00Z',
    isResolved: true,
  },
  {
    alertId: 3,
    type: 'ERROR',
    title: 'Email Service Timeout',
    message: 'Email service experienced intermittent timeouts',
    source: 'Email Integration',
    createdAt: '2025-01-18T10:15:00Z',
    isResolved: true,
  },
]

const MOCK_RECENT_ACTIVITY: RecentAdminActivity[] = [
  {
    activityId: 1,
    action: 'User account created',
    performedBy: 'Admin User',
    targetType: 'User',
    targetName: 'john.doe@mmu.edu.my',
    timestamp: '2025-01-20T10:30:00Z',
    ipAddress: '192.168.1.100',
  },
  {
    activityId: 2,
    action: 'System parameter updated',
    performedBy: 'Admin User',
    targetType: 'Parameter',
    targetName: 'max_students_per_supervisor',
    timestamp: '2025-01-20T09:15:00Z',
    ipAddress: '192.168.1.100',
  },
  {
    activityId: 3,
    action: 'Backup triggered',
    performedBy: 'System',
    targetType: 'Maintenance',
    targetName: 'Full Meeting-Progress Backup',
    timestamp: '2025-01-20T02:00:00Z',
  },
  {
    activityId: 4,
    action: 'User role changed',
    performedBy: 'Admin User',
    targetType: 'User',
    targetName: 'sarah.lee@mmu.edu.my',
    timestamp: '2025-01-19T16:45:00Z',
    ipAddress: '192.168.1.100',
  },
]

const MOCK_USERS: AdminUserListItem[] = [
  {
    userId: 'user-001',
    email: 'ahmad.abdullah@student.mmu.edu.my',
    fullName: 'Ahmad bin Abdullah',
    role: 'STUDENT',
    status: 'ACTIVE',
    department: 'Faculty of Computing',
    createdAt: '2024-09-01T00:00:00Z',
    lastLoginAt: '2025-01-20T08:30:00Z',
    isLocked: false,
  },
  {
    userId: 'user-002',
    email: 'sarah.lee@mmu.edu.my',
    fullName: 'Dr. Sarah Lee',
    role: 'SUPERVISOR',
    status: 'ACTIVE',
    department: 'Faculty of Computing',
    createdAt: '2023-01-15T00:00:00Z',
    lastLoginAt: '2025-01-20T09:00:00Z',
    isLocked: false,
  },
  {
    userId: 'user-003',
    email: 'committee@mmu.edu.my',
    fullName: 'Prof. Ahmad Razak',
    role: 'FYP_COMMITTEE',
    status: 'ACTIVE',
    department: 'Faculty of Computing',
    createdAt: '2022-06-01T00:00:00Z',
    lastLoginAt: '2025-01-19T14:20:00Z',
    isLocked: false,
  },
  {
    userId: 'user-004',
    email: 'pending.student@student.mmu.edu.my',
    fullName: 'Pending Student',
    role: 'STUDENT',
    status: 'PENDING',
    department: 'Faculty of Computing',
    createdAt: '2025-01-18T00:00:00Z',
    isLocked: false,
  },
  {
    userId: 'user-005',
    email: 'suspended.user@mmu.edu.my',
    fullName: 'Suspended User',
    role: 'STUDENT',
    status: 'SUSPENDED',
    department: 'Faculty of Engineering',
    createdAt: '2024-03-01T00:00:00Z',
    lastLoginAt: '2024-12-15T10:00:00Z',
    isLocked: true,
  },
]

const MOCK_USER_DETAIL: UserDetail = {
  userId: 'user-002',
  email: 'sarah.lee@mmu.edu.my',
  fullName: 'Dr. Sarah Lee',
  role: 'SUPERVISOR',
  status: 'ACTIVE',
  department: 'Faculty of Computing',
  phone: '+60 12-345 6789',
  createdAt: '2023-01-15T00:00:00Z',
  lastLoginAt: '2025-01-20T09:00:00Z',
  isLocked: false,
  loginAttempts: 0,
  passwordChangedAt: '2024-11-01T00:00:00Z',
  createdBy: 'System Admin',
  updatedAt: '2025-01-15T00:00:00Z',
  notes: 'Senior lecturer specializing in AI and Machine Learning',
  sessions: [
    {
      sessionId: 'sess-001',
      ipAddress: '192.168.1.50',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
      createdAt: '2025-01-20T09:00:00Z',
      lastActivityAt: '2025-01-20T11:30:00Z',
      isActive: true,
    },
  ],
  activityLog: [
    {
      logId: 1,
      action: 'Login',
      details: 'Successful login from Chrome browser',
      timestamp: '2025-01-20T09:00:00Z',
      ipAddress: '192.168.1.50',
    },
    {
      logId: 2,
      action: 'Profile Update',
      details: 'Updated expertise areas',
      timestamp: '2025-01-19T14:30:00Z',
      ipAddress: '192.168.1.50',
    },
  ],
}

const MOCK_PARAMETERS: AdminSystemParameter[] = [
  {
    parameterId: 1,
    key: 'max_students_per_supervisor',
    value: '8',
    type: 'NUMBER',
    category: 'QUOTAS',
    label: 'Maximum Students per Supervisor',
    description: 'Maximum number of students a supervisor can supervise at one time',
    defaultValue: '6',
    isEditable: true,
    validationRules: 'min:1|max:20',
    lastModifiedBy: 'Admin User',
    lastModifiedAt: '2025-01-15T00:00:00Z',
  },
  {
    parameterId: 2,
    key: 'min_meeting_duration',
    value: '30',
    type: 'NUMBER',
    category: 'MEETINGS',
    label: 'Minimum Meeting Duration (minutes)',
    description: 'Minimum duration for a supervision meeting',
    defaultValue: '30',
    isEditable: true,
    validationRules: 'min:15|max:120',
  },
  {
    parameterId: 3,
    key: 'max_meeting_duration',
    value: '120',
    type: 'NUMBER',
    category: 'MEETINGS',
    label: 'Maximum Meeting Duration (minutes)',
    description: 'Maximum duration for a supervision meeting',
    defaultValue: '120',
    isEditable: true,
    validationRules: 'min:30|max:240',
  },
  {
    parameterId: 4,
    key: 'proposal_auto_reject_days',
    value: '14',
    type: 'NUMBER',
    category: 'PROPOSALS',
    label: 'Auto-Reject Proposals After (days)',
    description: 'Number of days before unreviewed proposals are auto-rejected',
    defaultValue: '14',
    isEditable: true,
    validationRules: 'min:7|max:30',
  },
  {
    parameterId: 5,
    key: 'enable_ai_analysis',
    value: 'true',
    type: 'BOOLEAN',
    category: 'GENERAL',
    label: 'Enable AI Proposal Analysis',
    description: 'Enable AI-powered analysis for proposal submissions',
    defaultValue: 'true',
    isEditable: true,
  },
  {
    parameterId: 6,
    key: 'notification_email_enabled',
    value: 'true',
    type: 'BOOLEAN',
    category: 'NOTIFICATIONS',
    label: 'Enable Email Notifications',
    description: 'Send email notifications for important events',
    defaultValue: 'true',
    isEditable: true,
  },
  {
    parameterId: 7,
    key: 'session_timeout_minutes',
    value: '60',
    type: 'NUMBER',
    category: 'SECURITY',
    label: 'Session Timeout (minutes)',
    description: 'User session timeout duration',
    defaultValue: '30',
    isEditable: true,
    validationRules: 'min:15|max:480',
  },
  {
    parameterId: 8,
    key: 'max_login_attempts',
    value: '5',
    type: 'NUMBER',
    category: 'SECURITY',
    label: 'Maximum Login Attempts',
    description: 'Maximum failed login attempts before account lockout',
    defaultValue: '5',
    isEditable: true,
    validationRules: 'min:3|max:10',
  },
]

const MOCK_CYCLES: FYPCycle[] = [
  {
    cycleId: 1,
    name: 'FYP1 2024/2025 Sem 2',
    type: 'FYP1',
    academicYear: '2024/2025',
    semester: 2,
    startDate: '2025-01-15T00:00:00Z',
    endDate: '2025-05-31T00:00:00Z',
    status: 'ACTIVE',
    isActive: true,
    totalStudents: 156,
    pairedStudents: 142,
    completedProjects: 0,
    createdAt: '2024-11-01T00:00:00Z',
    updatedAt: '2025-01-15T00:00:00Z',
  },
  {
    cycleId: 2,
    name: 'FYP2 2024/2025 Sem 2',
    type: 'FYP2',
    academicYear: '2024/2025',
    semester: 2,
    startDate: '2025-01-15T00:00:00Z',
    endDate: '2025-05-31T00:00:00Z',
    status: 'ACTIVE',
    isActive: true,
    totalStudents: 134,
    pairedStudents: 134,
    completedProjects: 12,
    createdAt: '2024-11-01T00:00:00Z',
    updatedAt: '2025-01-15T00:00:00Z',
  },
  {
    cycleId: 3,
    name: 'FYP1 2024/2025 Sem 1',
    type: 'FYP1',
    academicYear: '2024/2025',
    semester: 1,
    startDate: '2024-09-01T00:00:00Z',
    endDate: '2024-12-31T00:00:00Z',
    status: 'COMPLETED',
    isActive: false,
    totalStudents: 148,
    pairedStudents: 148,
    completedProjects: 148,
    createdAt: '2024-06-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
]

const MOCK_DEADLINES: AdminDeadline[] = [
  {
    deadlineId: 1,
    cycleId: 1,
    cycleName: 'FYP1 2024/2025 Sem 2',
    title: 'Proposal Submission Deadline',
    type: 'PROPOSAL_SUBMISSION',
    description: 'Final date to submit project proposals',
    dueDate: '2025-02-28T23:59:59Z',
    reminderDays: [7, 3, 1],
    status: 'UPCOMING',
    targetRoles: ['STUDENT'],
    isExtendable: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    deadlineId: 2,
    cycleId: 1,
    cycleName: 'FYP1 2024/2025 Sem 2',
    title: 'Supervisor Selection',
    type: 'SUPERVISOR_SELECTION',
    description: 'Deadline for students to select supervisors',
    dueDate: '2025-02-14T23:59:59Z',
    reminderDays: [7, 3, 1],
    status: 'ACTIVE',
    targetRoles: ['STUDENT'],
    isExtendable: false,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    deadlineId: 3,
    cycleId: 2,
    cycleName: 'FYP2 2024/2025 Sem 2',
    title: 'Progress Report Submission',
    type: 'PROGRESS_REPORT',
    description: 'Mid-semester progress report submission',
    dueDate: '2025-03-15T23:59:59Z',
    reminderDays: [14, 7, 3, 1],
    status: 'UPCOMING',
    targetRoles: ['STUDENT'],
    isExtendable: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    deadlineId: 4,
    cycleId: 2,
    cycleName: 'FYP2 2024/2025 Sem 2',
    title: 'Final Report Submission',
    type: 'FINAL_REPORT',
    description: 'Final project report submission deadline',
    dueDate: '2025-05-15T23:59:59Z',
    reminderDays: [30, 14, 7, 3, 1],
    status: 'UPCOMING',
    targetRoles: ['STUDENT'],
    isExtendable: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
]

const MOCK_INTEGRATIONS: Integration[] = [
  {
    integrationId: 1,
    name: 'Email Service',
    type: 'EMAIL',
    status: 'ACTIVE',
    provider: 'SendGrid',
    description: 'Email notification service for system communications',
    configuredAt: '2024-01-15T00:00:00Z',
    lastTestedAt: '2025-01-19T10:00:00Z',
    lastTestResult: 'SUCCESS',
    settings: {
      apiKey: '********',
      fromEmail: 'noreply@fyp.mmu.edu.my',
      fromName: 'FYP Supervision System',
    },
  },
  {
    integrationId: 2,
    name: 'Cloud Storage',
    type: 'STORAGE',
    status: 'ACTIVE',
    provider: 'AWS S3',
    description: 'Document and file storage service',
    configuredAt: '2024-01-15T00:00:00Z',
    lastTestedAt: '2025-01-20T02:00:00Z',
    lastTestResult: 'SUCCESS',
    settings: {
      bucketName: 'fyp-documents',
      region: 'ap-southeast-1',
    },
  },
  {
    integrationId: 3,
    name: 'AI Analysis Service',
    type: 'AI',
    status: 'ACTIVE',
    provider: 'OpenAI',
    description: 'AI-powered proposal analysis and recommendations',
    configuredAt: '2024-06-01T00:00:00Z',
    lastTestedAt: '2025-01-18T14:00:00Z',
    lastTestResult: 'SUCCESS',
    settings: {
      model: 'gpt-4',
      maxTokens: '4000',
    },
  },
  {
    integrationId: 4,
    name: 'SSO Authentication',
    type: 'SSO',
    status: 'INACTIVE',
    provider: 'Azure AD',
    description: 'Single Sign-On integration with university directory',
    settings: {},
  },
]

const MOCK_EXPORT_CONFIGS: ExportConfiguration[] = [
  {
    configId: 1,
    name: 'Weekly User Report',
    dataType: 'USERS',
    format: 'XLSX',
    includeHeaders: true,
    dateFormat: 'DD/MM/YYYY',
    fields: ['email', 'fullName', 'role', 'status', 'lastLoginAt'],
    schedule: {
      enabled: true,
      frequency: 'WEEKLY',
      time: '08:00',
      dayOfWeek: 1,
      recipients: ['admin@mmu.edu.my'],
    },
    createdAt: '2024-06-01T00:00:00Z',
    lastExportAt: '2025-01-13T08:00:00Z',
  },
  {
    configId: 2,
    name: 'Project Progress Report',
    dataType: 'PROJECTS',
    format: 'PDF',
    includeHeaders: true,
    dateFormat: 'DD/MM/YYYY',
    fields: ['title', 'studentName', 'supervisorName', 'progress', 'status'],
    createdAt: '2024-09-01T00:00:00Z',
  },
]

const MOCK_MAINTENANCE_JOBS: MaintenanceJob[] = [
  {
    jobId: 1,
    type: 'BACKUP',
    status: 'COMPLETED',
    startedAt: '2025-01-20T02:00:00Z',
    completedAt: '2025-01-20T02:15:00Z',
    progress: 100,
    message: 'Full backup completed successfully',
    triggeredBy: 'Scheduled Task',
    result: {
      success: true,
      message: 'Backup created: backup_20250120_020000.sql.gz (245 MB)',
      artifactUrl: '/backups/backup_20250120_020000.sql.gz',
    },
  },
  {
    jobId: 2,
    type: 'CLEANUP',
    status: 'COMPLETED',
    startedAt: '2025-01-19T03:00:00Z',
    completedAt: '2025-01-19T03:05:00Z',
    progress: 100,
    message: 'Cleanup completed',
    triggeredBy: 'Scheduled Task',
    result: {
      success: true,
      message: 'Cleaned 1,234 old log entries and 56 expired sessions',
    },
  },
  {
    jobId: 3,
    type: 'INDEX_REBUILD',
    status: 'RUNNING',
    startedAt: '2025-01-20T10:30:00Z',
    progress: 65,
    message: 'Rebuilding search indexes...',
    triggeredBy: 'Admin User',
  },
]

const MOCK_BACKUPS: BackupInfo[] = [
  {
    backupId: 1,
    fileName: 'backup_20250120_020000.sql.gz',
    fileSize: 245 * 1024 * 1024,
    createdAt: '2025-01-20T02:00:00Z',
    type: 'FULL',
    status: 'AVAILABLE',
    expiresAt: '2025-02-20T02:00:00Z',
  },
  {
    backupId: 2,
    fileName: 'backup_20250119_020000.sql.gz',
    fileSize: 243 * 1024 * 1024,
    createdAt: '2025-01-19T02:00:00Z',
    type: 'FULL',
    status: 'AVAILABLE',
    expiresAt: '2025-02-19T02:00:00Z',
  },
  {
    backupId: 3,
    fileName: 'backup_20250118_020000.sql.gz',
    fileSize: 241 * 1024 * 1024,
    createdAt: '2025-01-18T02:00:00Z',
    type: 'FULL',
    status: 'AVAILABLE',
    expiresAt: '2025-02-18T02:00:00Z',
  },
]

const MOCK_HEALTH_CHECKS: SystemHealthCheck[] = [
  {
    checkId: 'db',
    name: 'Database Connection',
    status: 'HEALTHY',
    lastCheckedAt: '2025-01-20T11:30:00Z',
    responseTime: 12,
    message: 'Connection pool healthy',
  },
  {
    checkId: 'storage',
    name: 'File Storage',
    status: 'HEALTHY',
    lastCheckedAt: '2025-01-20T11:30:00Z',
    responseTime: 45,
    message: 'S3 bucket accessible',
  },
  {
    checkId: 'email',
    name: 'Email Service',
    status: 'HEALTHY',
    lastCheckedAt: '2025-01-20T11:30:00Z',
    responseTime: 234,
    message: 'SendGrid API responding',
  },
  {
    checkId: 'ai',
    name: 'AI Service',
    status: 'HEALTHY',
    lastCheckedAt: '2025-01-20T11:30:00Z',
    responseTime: 456,
    message: 'OpenAI API available',
  },
  {
    checkId: 'cache',
    name: 'Cache Service',
    status: 'DEGRADED',
    lastCheckedAt: '2025-01-20T11:30:00Z',
    responseTime: 89,
    message: 'Redis cluster partially available',
  },
]

const MOCK_AUDIT_LOGS: AuditLog[] = [
  {
    auditId: 1,
    action: 'UPDATE',
    entityType: 'PARAMETER',
    entityId: '1',
    entityName: 'max_students_per_supervisor',
    performedBy: 'admin-001',
    performedByName: 'System Administrator',
    performedByRole: 'SYSTEM_ADMIN',
    timestamp: '2025-01-20T09:15:00Z',
    ipAddress: '192.168.1.100',
    oldValue: '6',
    newValue: '8',
    details: 'Changed maximum students per supervisor',
  },
  {
    auditId: 2,
    action: 'CREATE',
    entityType: 'USER',
    entityId: 'user-006',
    entityName: 'new.user@student.mmu.edu.my',
    performedBy: 'admin-001',
    performedByName: 'System Administrator',
    performedByRole: 'SYSTEM_ADMIN',
    timestamp: '2025-01-20T10:30:00Z',
    ipAddress: '192.168.1.100',
    details: 'Created new student account',
  },
  {
    auditId: 3,
    action: 'LOGIN',
    entityType: 'USER',
    entityId: 'user-002',
    entityName: 'sarah.lee@mmu.edu.my',
    performedBy: 'user-002',
    performedByName: 'Dr. Sarah Lee',
    performedByRole: 'SUPERVISOR',
    timestamp: '2025-01-20T09:00:00Z',
    ipAddress: '192.168.1.50',
    userAgent: 'Chrome/120.0.0.0',
  },
  {
    auditId: 4,
    action: 'APPROVE',
    entityType: 'PROPOSAL',
    entityId: 'prop-123',
    entityName: 'AI-Powered Student Performance Analysis',
    performedBy: 'user-002',
    performedByName: 'Dr. Sarah Lee',
    performedByRole: 'SUPERVISOR',
    timestamp: '2025-01-19T16:30:00Z',
    ipAddress: '192.168.1.50',
    details: 'Approved proposal with feedback',
  },
  {
    auditId: 5,
    action: 'DELETE',
    entityType: 'DOCUMENT',
    entityId: 'doc-456',
    entityName: 'Draft_Report_v1.pdf',
    performedBy: 'user-001',
    performedByName: 'Ahmad bin Abdullah',
    performedByRole: 'STUDENT',
    timestamp: '2025-01-19T14:00:00Z',
    ipAddress: '192.168.1.75',
  },
]

const MOCK_ADMIN_NOTIFICATIONS: AdminNotification[] = [
  {
    notificationId: 1,
    type: 'SYSTEM_ALERT',
    title: 'Storage Usage Warning',
    message: 'Storage usage has exceeded 80% threshold. Consider cleanup or expansion.',
    priority: 'HIGH',
    isRead: false,
    createdAt: '2025-01-19T14:30:00Z',
  },
  {
    notificationId: 2,
    type: 'USER_REGISTRATION',
    title: 'New User Registrations',
    message: '5 new student accounts pending approval',
    priority: 'MEDIUM',
    isRead: false,
    createdAt: '2025-01-20T08:00:00Z',
  },
  {
    notificationId: 3,
    type: 'BACKUP_COMPLETED',
    title: 'Daily Backup Successful',
    message: 'Full database backup completed at 02:00 AM',
    priority: 'LOW',
    isRead: true,
    createdAt: '2025-01-20T02:15:00Z',
  },
]

// ============================================
// Query Keys
// ============================================

export const adminKeys = {
  all: ['admin'] as const,
  dashboard: () => [...adminKeys.all, 'dashboard'] as const,
  alerts: () => [...adminKeys.all, 'alerts'] as const,
  users: () => [...adminKeys.all, 'users'] as const,
  user: (id: string) => [...adminKeys.users(), id] as const,
  parameters: () => [...adminKeys.all, 'parameters'] as const,
  parameter: (id: number) => [...adminKeys.parameters(), id] as const,
  cycles: () => [...adminKeys.all, 'cycles'] as const,
  cycle: (id: number) => [...adminKeys.cycles(), id] as const,
  deadlines: () => [...adminKeys.all, 'deadlines'] as const,
  deadline: (id: number) => [...adminKeys.deadlines(), id] as const,
  integrations: () => [...adminKeys.all, 'integrations'] as const,
  integration: (id: number) => [...adminKeys.integrations(), id] as const,
  exportConfigs: () => [...adminKeys.all, 'exportConfigs'] as const,
  jobs: () => [...adminKeys.all, 'jobs'] as const,
  backups: () => [...adminKeys.all, 'backups'] as const,
  healthChecks: () => [...adminKeys.all, 'healthChecks'] as const,
  auditLogs: () => [...adminKeys.all, 'auditLogs'] as const,
  notifications: () => [...adminKeys.all, 'notifications'] as const,
  pendingRegistrations: () => [...adminKeys.all, 'pendingRegistrations'] as const,
  fyp1Pass: () => [...adminKeys.all, 'fyp1Pass'] as const,
  cycleTemplate: (phase: string) => [...adminKeys.all, 'cycleTemplate', phase] as const,
  rosterStudents: () => [...adminKeys.all, 'roster', 'students'] as const,
  rosterSupervisors: () => [...adminKeys.all, 'roster', 'supervisors'] as const,
}

// ============================================
// Pending Registrations (admin queue)
// ============================================

export interface PendingRegistration {
  userId: string
  mmuId: string
  email: string
  fullName: string
  phone: string | null
  role: 'STUDENT' | 'SUPERVISOR'
  department: string
  programme: string
  registeredAt: string
}

export function usePendingRegistrations(role?: 'STUDENT' | 'SUPERVISOR' | 'ALL') {
  return useQuery({
    queryKey: [...adminKeys.pendingRegistrations(), role ?? 'ALL'],
    queryFn: async () => {
      const { data } = await apiClient.get<{
        registrations: PendingRegistration[]
        total: number
        studentCount: number
        supervisorCount: number
      }>('/admin/users/pending', { params: { role: role && role !== 'ALL' ? role : undefined } })
      return data
    },
  })
}

export function useApproveRegistration() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (userId: string) => {
      const { data } = await apiClient.post(`/admin/users/${userId}/approve`)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.pendingRegistrations() })
      queryClient.invalidateQueries({ queryKey: adminKeys.users() })
      queryClient.invalidateQueries({ queryKey: adminKeys.dashboard() })
    },
  })
}

export function useRejectRegistration() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ userId, reason }: { userId: string; reason: string }) => {
      const { data } = await apiClient.post(`/admin/users/${userId}/reject`, { reason })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.pendingRegistrations() })
      queryClient.invalidateQueries({ queryKey: adminKeys.users() })
    },
  })
}

// ============================================
// Cycle Template (FYP1 standard timeline)
// ============================================

export interface TemplateDeadline {
  title: string
  deadlineType: string
  audience: string
  dayOffset: number
}

export function useCycleTemplate(phase: string = 'FYP1') {
  return useQuery({
    queryKey: adminKeys.cycleTemplate(phase),
    queryFn: async () => {
      const { data } = await apiClient.get<{ phase: string; deadlines: TemplateDeadline[] }>(
        '/admin/cycles/template',
        { params: { phase } }
      )
      return data
    },
  })
}

export function useCreateCycleFromTemplate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      phase: 'FYP1' | 'FYP2'
      cycleCode: string
      academicYear: string
      semester: number
      startDate: string
      endDate: string
    }) => {
      const { data: resp } = await apiClient.post('/admin/cycles/from-template', data)
      return resp
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.cycles() })
      queryClient.invalidateQueries({ queryKey: adminKeys.deadlines() })
    },
  })
}

// ============================================
// FYP1 Pass tracking
// ============================================

export interface Fyp1PassRow {
  projectId: number
  projectTitle: string
  studentId: string
  studentUserId: number
  studentName: string
  studentEmail: string
  supervisorName: string | null
  stage: string
  fyp1Passed: boolean | null
  /** Compliance signal for the soft-warning badge — backend includes these fields. */
  meetingLogsCompleted?: number
  meetingLogsRequired?: number
  meetsMeetingLogMinimum?: boolean
}

export function useFyp1PassList() {
  return useQuery({
    queryKey: adminKeys.fyp1Pass(),
    queryFn: async () => {
      const { data } = await apiClient.get<{
        projects: Fyp1PassRow[]
        total: number
        passedCount: number
        failedCount: number
        pendingCount: number
      }>('/admin/projects/fyp1-pass')
      return data
    },
  })
}

export function useSetFyp1Passed() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ projectId, passed }: { projectId: number; passed: boolean | null }) => {
      const { data } = await apiClient.post(`/admin/projects/${projectId}/fyp1-passed`, { passed })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.fyp1Pass() })
    },
  })
}

export function useImportFyp1Passed() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData()
      form.append('file', file)
      const { data } = await apiClient.post<{ updated: number; notFound: string[]; notFoundCount: number }>(
        '/admin/projects/fyp1-passed/import',
        form,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      )
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.fyp1Pass() })
    },
  })
}

// ============================================
// Approved roster (auto-approve via CSV)
// ============================================

export interface ApprovedStudentRosterEntry {
  rosterId: number
  mmuId: string
  email: string
  fullName: string | null
  programme: string | null
  specialisation: string | null
  faculty: string | null
  intakeYear: number | null
  uploadedAt: string | null
}

export interface ApprovedSupervisorRosterEntry {
  rosterId: number
  mmuId: string
  email: string
  fullName: string | null
  department: string | null
  faculty: string | null
  position: string | null
  uploadedAt: string | null
}

export interface RosterImportResult {
  imported: number
  updated: number
  autoApproved: number
  errors: string[]
  errorCount: number
}

export function useApprovedStudentRoster() {
  return useQuery({
    queryKey: adminKeys.rosterStudents(),
    queryFn: async () => {
      const { data } = await apiClient.get<{ entries: ApprovedStudentRosterEntry[] }>(
        '/admin/roster/students'
      )
      return data.entries
    },
  })
}

export function useApprovedSupervisorRoster() {
  return useQuery({
    queryKey: adminKeys.rosterSupervisors(),
    queryFn: async () => {
      const { data } = await apiClient.get<{ entries: ApprovedSupervisorRosterEntry[] }>(
        '/admin/roster/supervisors'
      )
      return data.entries
    },
  })
}

export function useImportStudentRoster() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData()
      form.append('file', file)
      const { data } = await apiClient.post<RosterImportResult>(
        '/admin/roster/students/import',
        form,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      )
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.rosterStudents() })
      queryClient.invalidateQueries({ queryKey: adminKeys.pendingRegistrations() })
      queryClient.invalidateQueries({ queryKey: adminKeys.users() })
      queryClient.invalidateQueries({ queryKey: adminKeys.dashboard() })
    },
  })
}

export function useImportSupervisorRoster() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData()
      form.append('file', file)
      const { data } = await apiClient.post<RosterImportResult>(
        '/admin/roster/supervisors/import',
        form,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      )
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.rosterSupervisors() })
      queryClient.invalidateQueries({ queryKey: adminKeys.pendingRegistrations() })
      queryClient.invalidateQueries({ queryKey: adminKeys.users() })
      queryClient.invalidateQueries({ queryKey: adminKeys.dashboard() })
    },
  })
}

export function useDeleteStudentRosterEntry() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (rosterId: number) => {
      await apiClient.delete(`/admin/roster/students/${rosterId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.rosterStudents() })
    },
  })
}

export function useDeleteSupervisorRosterEntry() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (rosterId: number) => {
      await apiClient.delete(`/admin/roster/supervisors/${rosterId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.rosterSupervisors() })
    },
  })
}

// ============================================
// Dashboard Hooks
// ============================================

export function useAdminDashboard() {
  return useQuery({
    queryKey: adminKeys.dashboard(),
    queryFn: async () => {
      if (USE_MOCK_DATA) {
        await new Promise((resolve) => setTimeout(resolve, 500))
        return {
          stats: MOCK_HEALTH_STATS,
          alerts: MOCK_SYSTEM_ALERTS,
          recentActivity: MOCK_RECENT_ACTIVITY,
        }
      }
      const { data } = await apiClient.get('/admin/dashboard')
      return data
    },
  })
}

export function useSystemAlerts() {
  return useQuery({
    queryKey: adminKeys.alerts(),
    queryFn: async () => {
      if (USE_MOCK_DATA) {
        await new Promise((resolve) => setTimeout(resolve, 300))
        return { alerts: MOCK_SYSTEM_ALERTS }
      }
      const { data } = await apiClient.get('/admin/dashboard')
      return { alerts: data.alerts }
    },
  })
}

// ============================================
// User Management Hooks (UC30)
// ============================================

export function useAdminUsers(filters?: { role?: string; status?: string; search?: string }) {
  return useQuery({
    queryKey: [...adminKeys.users(), filters],
    queryFn: async () => {
      if (USE_MOCK_DATA) {
        await new Promise((resolve) => setTimeout(resolve, 500))
        let users = [...MOCK_USERS]
        if (filters?.role && filters.role !== 'ALL') {
          users = users.filter((u) => u.role === filters.role)
        }
        if (filters?.status && filters.status !== 'ALL') {
          users = users.filter((u) => u.status === filters.status)
        }
        if (filters?.search) {
          const query = filters.search.toLowerCase()
          users = users.filter(
            (u) =>
              u.fullName.toLowerCase().includes(query) ||
              u.email.toLowerCase().includes(query)
          )
        }
        return { users, total: users.length }
      }
      const { data } = await apiClient.get('/admin/users', { params: { role: filters?.role, status: filters?.status, search: filters?.search } })
      return data
    },
  })
}

export function useAdminUser(userId: string) {
  return useQuery({
    queryKey: adminKeys.user(userId),
    queryFn: async () => {
      if (USE_MOCK_DATA) {
        await new Promise((resolve) => setTimeout(resolve, 400))
        return MOCK_USER_DETAIL
      }
      const { data } = await apiClient.get(`/admin/users/${userId}`)
      return data
    },
    enabled: !!userId,
  })
}

export function useCreateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: CreateUserRequest) => {
      if (USE_MOCK_DATA) {
        await new Promise((resolve) => setTimeout(resolve, 1000))
        return { userId: `user-${Date.now()}`, ...data }
      }
      const { data: responseData } = await apiClient.post('/admin/users', data)
      return responseData
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.users() })
    },
  })
}

export function useUpdateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ userId, data }: { userId: string; data: UpdateUserRequest }) => {
      if (USE_MOCK_DATA) {
        await new Promise((resolve) => setTimeout(resolve, 800))
        return { userId, ...data }
      }
      const { data: responseData } = await apiClient.put(`/admin/users/${userId}`, data)
      return responseData
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.users() })
      queryClient.invalidateQueries({ queryKey: adminKeys.user(userId) })
    },
  })
}

export function useDeleteUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (userId: string) => {
      if (USE_MOCK_DATA) {
        await new Promise((resolve) => setTimeout(resolve, 800))
        return { success: true }
      }
      const { data } = await apiClient.delete(`/admin/users/${userId}`)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.users() })
    },
  })
}

// Both "Resend Invite" and "Send Reset Link" go through the public
// /auth/forgot-password flow, which already emails the user a password-reset
// link (and is the only mailer wired to UserAccount). The admin-only endpoints
// the page used to call (`/admin/users/{id}/resend-invite` and
// `/admin/users/{id}/send-credentials`) were never implemented on the backend.
export function useResendInvite() {
  return useMutation({
    mutationFn: async (email: string) => {
      const { data } = await apiClient.post('/auth/forgot-password', { email })
      return data
    },
  })
}

export function useSendCredentials() {
  return useMutation({
    mutationFn: async ({ email }: { email: string; method?: 'EMAIL' | 'RESET_LINK' }) => {
      const { data } = await apiClient.post('/auth/forgot-password', { email })
      return data
    },
  })
}

export function useBulkUpdateUserStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ userIds, status }: { userIds: string[]; status: UserStatus }) => {
      if (USE_MOCK_DATA) {
        await new Promise((resolve) => setTimeout(resolve, 1200))
        return { success: true, updated: userIds.length }
      }
      const { data } = await apiClient.put('/admin/users/bulk-status', { userIds, status })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.users() })
    },
  })
}

// ============================================
// System Parameters Hooks (UC31)
// ============================================

export function useSystemParameters(category?: ParameterCategory) {
  return useQuery({
    queryKey: [...adminKeys.parameters(), category],
    queryFn: async () => {
      if (USE_MOCK_DATA) {
        await new Promise((resolve) => setTimeout(resolve, 400))
        let params = [...MOCK_PARAMETERS]
        if (category) {
          params = params.filter((p) => p.category === category)
        }
        return { parameters: params, total: params.length }
      }
      const { data } = await apiClient.get('/admin/parameters', { params: { category } })
      return data
    },
  })
}

export function useSystemParameter(parameterId: number) {
  return useQuery({
    queryKey: adminKeys.parameter(parameterId),
    queryFn: async () => {
      if (USE_MOCK_DATA) {
        await new Promise((resolve) => setTimeout(resolve, 300))
        return MOCK_PARAMETERS.find((p) => p.parameterId === parameterId)
      }
      const { data } = await apiClient.get(`/admin/parameters/${parameterId}`)
      return data
    },
    enabled: !!parameterId,
  })
}

export function useUpdateParameter() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      parameterId,
      data,
    }: {
      parameterId: number
      data: UpdateParameterRequest
    }) => {
      if (USE_MOCK_DATA) {
        await new Promise((resolve) => setTimeout(resolve, 600))
        return { parameterId, ...data }
      }
      const { data: responseData } = await apiClient.put(`/admin/parameters/${parameterId}`, data)
      return responseData
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.parameters() })
    },
  })
}

// ============================================
// FYP Cycle Hooks (UC31)
// ============================================

export interface FYPCycleListFilters {
  status?: CycleStatus
  type?: 'FYP1' | 'FYP2'
}

export function useFYPCycles(filters?: FYPCycleListFilters) {
  return useQuery({
    queryKey: [...adminKeys.cycles(), filters?.status ?? 'ALL', filters?.type ?? 'ALL'],
    queryFn: async () => {
      if (USE_MOCK_DATA) {
        await new Promise((resolve) => setTimeout(resolve, 400))
        return { cycles: MOCK_CYCLES, total: MOCK_CYCLES.length }
      }
      const { data } = await apiClient.get<{ cycles: FYPCycle[]; total: number }>('/admin/cycles', {
        params: { status: filters?.status, type: filters?.type },
      })
      return data
    },
  })
}

export function useFYPCycle(cycleId: number) {
  return useQuery({
    queryKey: adminKeys.cycle(cycleId),
    queryFn: async () => {
      if (USE_MOCK_DATA) {
        await new Promise((resolve) => setTimeout(resolve, 300))
        return MOCK_CYCLES.find((c) => c.cycleId === cycleId)
      }
      const { data } = await apiClient.get(`/admin/cycles/${cycleId}`)
      return data
    },
    enabled: !!cycleId,
  })
}

export function useCreateCycle() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: CreateCycleRequest) => {
      if (USE_MOCK_DATA) {
        await new Promise((resolve) => setTimeout(resolve, 800))
        return { cycleId: Date.now(), ...data }
      }
      const { data: responseData } = await apiClient.post('/admin/cycles', data)
      return responseData
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.cycles() })
    },
  })
}

export function useUpdateCycle() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ cycleId, data }: { cycleId: number; data: UpdateCycleRequest }) => {
      if (USE_MOCK_DATA) {
        await new Promise((resolve) => setTimeout(resolve, 600))
        return { cycleId, ...data }
      }
      const { data: responseData } = await apiClient.put(`/admin/cycles/${cycleId}`, data)
      return responseData
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.cycles() })
    },
  })
}

export function useActivateCycle() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (cycleId: number) => {
      const { data } = await apiClient.post<{ cycleId: number; status: CycleStatus; studentsAttached: number }>(
        `/admin/cycles/${cycleId}/activate`
      )
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.cycles() })
      queryClient.invalidateQueries({ queryKey: adminKeys.dashboard() })
    },
  })
}

export function useCompleteCycle() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (cycleId: number) => {
      const { data } = await apiClient.post(`/admin/cycles/${cycleId}/complete`)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.cycles() })
    },
  })
}

export function useArchiveCycle() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (cycleId: number) => {
      const { data } = await apiClient.post(`/admin/cycles/${cycleId}/archive`)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.cycles() })
    },
  })
}

export function useDeleteCycle() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (cycleId: number) => {
      await apiClient.delete(`/admin/cycles/${cycleId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.cycles() })
    },
  })
}

// ============================================
// Deadline Hooks (UC31)
// ============================================

export function useDeadlines(cycleId?: number) {
  return useQuery({
    queryKey: [...adminKeys.deadlines(), cycleId],
    queryFn: async () => {
      if (USE_MOCK_DATA) {
        await new Promise((resolve) => setTimeout(resolve, 400))
        let deadlines = [...MOCK_DEADLINES]
        if (cycleId) {
          deadlines = deadlines.filter((d) => d.cycleId === cycleId)
        }
        return { deadlines, total: deadlines.length }
      }
      const { data } = await apiClient.get('/admin/deadlines', { params: { cycleId } })
      return data
    },
  })
}

export function useDeadline(deadlineId: number) {
  return useQuery({
    queryKey: adminKeys.deadline(deadlineId),
    queryFn: async () => {
      if (USE_MOCK_DATA) {
        await new Promise((resolve) => setTimeout(resolve, 300))
        return MOCK_DEADLINES.find((d) => d.deadlineId === deadlineId)
      }
      const { data } = await apiClient.get(`/admin/deadlines/${deadlineId}`)
      return data
    },
    enabled: !!deadlineId,
  })
}

export function useCreateDeadline() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: CreateDeadlineRequest) => {
      if (USE_MOCK_DATA) {
        await new Promise((resolve) => setTimeout(resolve, 800))
        return { deadlineId: Date.now(), ...data }
      }
      const { data: responseData } = await apiClient.post('/admin/deadlines', data)
      return responseData
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.deadlines() })
    },
  })
}

export function useUpdateDeadline() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      deadlineId,
      data,
    }: {
      deadlineId: number
      data: UpdateDeadlineRequest
    }) => {
      if (USE_MOCK_DATA) {
        await new Promise((resolve) => setTimeout(resolve, 600))
        return { deadlineId, ...data }
      }
      const { data: responseData } = await apiClient.put(`/admin/deadlines/${deadlineId}`, data)
      return responseData
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.deadlines() })
    },
  })
}

export function useDeleteDeadline() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (deadlineId: number) => {
      if (USE_MOCK_DATA) {
        await new Promise((resolve) => setTimeout(resolve, 600))
        return { success: true }
      }
      const { data } = await apiClient.delete(`/admin/deadlines/${deadlineId}`)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.deadlines() })
    },
  })
}

// ============================================
// Integration Hooks (UC32)
// ============================================

export function useIntegrations() {
  return useQuery({
    queryKey: adminKeys.integrations(),
    queryFn: async () => {
      if (USE_MOCK_DATA) {
        await new Promise((resolve) => setTimeout(resolve, 400))
        return { integrations: MOCK_INTEGRATIONS, total: MOCK_INTEGRATIONS.length }
      }
      const { data } = await apiClient.get('/admin/integrations')
      return data
    },
  })
}

export function useIntegration(integrationId: number) {
  return useQuery({
    queryKey: adminKeys.integration(integrationId),
    queryFn: async () => {
      if (USE_MOCK_DATA) {
        await new Promise((resolve) => setTimeout(resolve, 300))
        return MOCK_INTEGRATIONS.find((i) => i.integrationId === integrationId)
      }
      const { data } = await apiClient.get(`/admin/integrations/${integrationId}`)
      return data
    },
    enabled: !!integrationId,
  })
}

export function useUpdateIntegration() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      integrationId,
      data,
    }: {
      integrationId: number
      data: UpdateIntegrationRequest
    }) => {
      if (USE_MOCK_DATA) {
        await new Promise((resolve) => setTimeout(resolve, 800))
        return { integrationId, ...data }
      }
      const { data: responseData } = await apiClient.put(`/admin/integrations/${integrationId}`, data)
      return responseData
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.integrations() })
    },
  })
}

export function useTestIntegration() {
  return useMutation({
    mutationFn: async (integrationId: number): Promise<TestIntegrationResult> => {
      if (USE_MOCK_DATA) {
        await new Promise((resolve) => setTimeout(resolve, 2000))
        return {
          success: true,
          message: 'Connection successful',
          responseTime: 234,
        }
      }
      const { data } = await apiClient.post(`/admin/integrations/${integrationId}/test`)
      return data
    },
  })
}

// ============================================
// Export Configuration Hooks (UC32)
// ============================================

export function useExportConfigurations() {
  return useQuery({
    queryKey: adminKeys.exportConfigs(),
    queryFn: async () => {
      if (USE_MOCK_DATA) {
        await new Promise((resolve) => setTimeout(resolve, 400))
        return { configs: MOCK_EXPORT_CONFIGS, total: MOCK_EXPORT_CONFIGS.length }
      }
      const { data } = await apiClient.get('/admin/export-configs')
      return data
    },
  })
}

export function useCreateExportConfig() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: CreateExportConfigRequest) => {
      if (USE_MOCK_DATA) {
        await new Promise((resolve) => setTimeout(resolve, 800))
        return { configId: Date.now(), ...data }
      }
      const { data: responseData } = await apiClient.post('/admin/export-configs', data)
      return responseData
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.exportConfigs() })
    },
  })
}

export function useRunExport() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (configId: number) => {
      if (USE_MOCK_DATA) {
        await new Promise((resolve) => setTimeout(resolve, 2000))
        return { success: true, downloadUrl: '/exports/report.xlsx' }
      }
      const { data } = await apiClient.post(`/admin/export-configs/${configId}/run`)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.exportConfigs() })
    },
  })
}

export function useDeleteExportConfig() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (configId: number) => {
      if (USE_MOCK_DATA) {
        await new Promise((resolve) => setTimeout(resolve, 400))
        return
      }
      await apiClient.delete(`/admin/export-configs/${configId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.exportConfigs() })
    },
  })
}

export function useUpdateExportConfig() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ configId, data }: { configId: number; data: Partial<CreateExportConfigRequest> }) => {
      if (USE_MOCK_DATA) {
        await new Promise((resolve) => setTimeout(resolve, 600))
        return { configId, ...data }
      }
      const { data: responseData } = await apiClient.put(`/admin/export-configs/${configId}`, data)
      return responseData
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.exportConfigs() })
    },
  })
}

// ============================================
// Maintenance Hooks (UC33)
// ============================================

export function useMaintenanceJobs() {
  return useQuery({
    queryKey: adminKeys.jobs(),
    queryFn: async () => {
      if (USE_MOCK_DATA) {
        await new Promise((resolve) => setTimeout(resolve, 400))
        return { jobs: MOCK_MAINTENANCE_JOBS, total: MOCK_MAINTENANCE_JOBS.length }
      }
      const { data } = await apiClient.get('/admin/maintenance/jobs')
      return data
    },
    refetchInterval: 5000, // Refresh every 5 seconds for running jobs
  })
}

export function useBackups() {
  return useQuery({
    queryKey: adminKeys.backups(),
    queryFn: async () => {
      if (USE_MOCK_DATA) {
        await new Promise((resolve) => setTimeout(resolve, 400))
        return { backups: MOCK_BACKUPS, total: MOCK_BACKUPS.length }
      }
      const { data } = await apiClient.get('/admin/maintenance/backups')
      return data
    },
  })
}

export function useSystemHealthChecks() {
  return useQuery({
    queryKey: adminKeys.healthChecks(),
    queryFn: async () => {
      if (USE_MOCK_DATA) {
        await new Promise((resolve) => setTimeout(resolve, 500))
        return { checks: MOCK_HEALTH_CHECKS }
      }
      const { data } = await apiClient.get('/admin/maintenance/health-checks')
      return data
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  })
}

export function useTriggerBackup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ type }: { type: 'FULL' | 'INCREMENTAL' | 'DATABASE' }) => {
      if (USE_MOCK_DATA) {
        await new Promise((resolve) => setTimeout(resolve, 1000))
        return { jobId: Date.now(), type, status: 'PENDING' }
      }
      const { data } = await apiClient.post('/admin/maintenance/backup', { type })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.jobs() })
      queryClient.invalidateQueries({ queryKey: adminKeys.backups() })
    },
  })
}

export function useRestoreBackup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (backupRef: string | number) => {
      if (USE_MOCK_DATA) {
        await new Promise((resolve) => setTimeout(resolve, 1000))
        return { jobId: Date.now(), backupRef, status: 'PENDING' }
      }
      const { data } = await apiClient.post(`/admin/maintenance/restore/${backupRef}`)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.jobs() })
    },
  })
}

export function useRunCleanup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (options: CleanupOptions) => {
      if (USE_MOCK_DATA) {
        await new Promise((resolve) => setTimeout(resolve, 1000))
        return { jobId: Date.now(), options, status: 'PENDING' }
      }
      const { data } = await apiClient.post('/admin/maintenance/cleanup', options)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.jobs() })
    },
  })
}

export function useClearCache() {
  return useMutation({
    mutationFn: async () => {
      if (USE_MOCK_DATA) {
        await new Promise((resolve) => setTimeout(resolve, 500))
        return { success: true, message: 'Cache cleared successfully' }
      }
      const { data } = await apiClient.post('/admin/maintenance/clear-cache')
      return data
    },
  })
}

// ============================================
// Audit Log Hooks
// ============================================

export function useAuditLogs(filters?: AuditLogFilters) {
  return useQuery({
    queryKey: [...adminKeys.auditLogs(), filters],
    queryFn: async () => {
      if (USE_MOCK_DATA) {
        await new Promise((resolve) => setTimeout(resolve, 500))
        let logs = [...MOCK_AUDIT_LOGS]
        if (filters?.action) {
          logs = logs.filter((l) => l.action === filters.action)
        }
        if (filters?.entityType) {
          logs = logs.filter((l) => l.entityType === filters.entityType)
        }
        if (filters?.performedBy) {
          logs = logs.filter((l) =>
            l.performedByName.toLowerCase().includes(filters.performedBy!.toLowerCase())
          )
        }
        return { logs, total: logs.length }
      }
      const { data } = await apiClient.get('/admin/audit-logs', { params: { action: filters?.action, entityType: filters?.entityType, performedBy: filters?.performedBy, dateFrom: filters?.dateFrom, dateTo: filters?.dateTo } })
      return data
    },
  })
}

// ============================================
// Admin Notification Hooks
// ============================================

export function useAdminNotifications() {
  return useQuery({
    queryKey: adminKeys.notifications(),
    queryFn: async () => {
      if (USE_MOCK_DATA) {
        await new Promise((resolve) => setTimeout(resolve, 300))
        return { notifications: MOCK_ADMIN_NOTIFICATIONS, total: MOCK_ADMIN_NOTIFICATIONS.length }
      }
      const { data } = await apiClient.get('/notifications')
      return data
    },
  })
}

export function useAdminUnreadCount() {
  return useQuery({
    queryKey: [...adminKeys.notifications(), 'unread'],
    queryFn: async () => {
      if (USE_MOCK_DATA) {
        await new Promise((resolve) => setTimeout(resolve, 200))
        return { count: MOCK_ADMIN_NOTIFICATIONS.filter((n) => !n.isRead).length }
      }
      const { data } = await apiClient.get('/notifications/unread-count')
      return data
    },
  })
}

export function useMarkAdminNotificationRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (notificationId: number) => {
      if (USE_MOCK_DATA) {
        await new Promise((resolve) => setTimeout(resolve, 300))
        return { success: true }
      }
      const { data } = await apiClient.put(`/notifications/${notificationId}/read`)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.notifications() })
    },
  })
}
