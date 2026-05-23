import type { UserRole, UserStatus } from './auth'

// ============================================
// Admin Dashboard Types
// ============================================

export interface SystemHealthStats {
  totalUsers: number
  activeUsers: number
  pendingApprovals: number
  totalProjects: number
  activeProjects: number
  systemUptime: string
  lastBackup: string
  storageUsed: number
  storageTotal: number
  cpuUsage: number
  memoryUsage: number
  databaseSize: number
}

export interface SystemAlert {
  alertId: number
  type: 'ERROR' | 'WARNING' | 'INFO'
  title: string
  message: string
  source: string
  createdAt: string
  isResolved: boolean
}

export interface RecentAdminActivity {
  activityId: number
  action: string
  performedBy: string
  targetType: string
  targetName: string
  timestamp: string
  ipAddress?: string
}

// ============================================
// User Management Types (UC30)
// ============================================

export interface AdminUserListItem {
  userId: string
  email: string
  fullName: string
  role: UserRole
  status: UserStatus
  department?: string
  createdAt: string
  lastLoginAt?: string
  isLocked: boolean
}

// UserRole and UserStatus imported from './auth' to avoid duplicate exports

export interface CreateUserRequest {
  email: string
  fullName: string
  mmuId?: string
  phone?: string
  role: UserRole
  department?: string
  password?: string
  sendInviteEmail: boolean
}

export interface UpdateUserRequest {
  fullName?: string
  role?: UserRole
  status?: UserStatus
  department?: string
  isLocked?: boolean
}

export interface UserDetail extends AdminUserListItem {
  phone?: string
  profileImageUrl?: string
  loginAttempts: number
  passwordChangedAt?: string
  createdBy?: string
  updatedAt: string
  notes?: string
  sessions: UserSession[]
  activityLog: UserActivityLog[]
}

export interface UserSession {
  sessionId: string
  ipAddress: string
  userAgent: string
  createdAt: string
  lastActivityAt: string
  isActive: boolean
}

export interface UserActivityLog {
  logId: number
  action: string
  details: string
  timestamp: string
  ipAddress?: string
}

// ============================================
// System Parameters Types (UC31)
// ============================================

// Free-form lowercase string. Backend system_parameter.category values:
// 'general', 'supervision', 'proposal', 'notification', 'security', 'ai', 'storage'.
// New categories may be added without a frontend type change.
export type ParameterCategory = string

export type ParameterType = 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON' | 'DATE'

export interface AdminSystemParameter {
  parameterId: number
  key: string
  value: string
  type: ParameterType
  category: ParameterCategory
  label: string
  description: string
  defaultValue: string
  isEditable: boolean
  validationRules?: string
  lastModifiedBy?: string
  lastModifiedAt?: string
}

export interface UpdateParameterRequest {
  value: string
}

// ============================================
// FYP Cycle Management Types (UC31)
// ============================================

// Matches backend enum CycleStatus { PLANNING, ACTIVE, COMPLETED, ARCHIVED }.
export type CycleStatus = 'PLANNING' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED'
export type CycleType = 'FYP1' | 'FYP2'

export interface FYPCycle {
  cycleId: number
  cycleCode: string
  name: string
  type: CycleType
  academicYear: string
  semester: number
  startDate: string
  endDate: string
  status: CycleStatus
  isActive: boolean
  totalStudents: number
  pairedStudents: number
  completedProjects: number
  deadlineCount: number
  createdAt: string
  updatedAt: string
}

export interface CreateCycleRequest {
  cycleCode: string
  cycleType: CycleType
  academicYear: string
  semester: number
  startDate: string
  endDate: string
}

export interface UpdateCycleRequest {
  cycleCode?: string
  cycleType?: CycleType
  academicYear?: string
  semester?: number
  startDate?: string
  endDate?: string
  status?: CycleStatus
}

// ============================================
// Deadline Management Types (UC31)
// ============================================

// Free-form string from backend deadline.deadline_type column. Known values include
// 'REGISTRATION', 'PROPOSAL_SUBMISSION', 'PROGRESS_REPORT', 'FINAL_REPORT', 'PRESENTATION', 'CUSTOM'.
export type AdminDeadlineType = string

// Backend AdminService computes this dynamically: 'UPCOMING' | 'ACTIVE' | 'PAST'.
export type DeadlineStatus = 'UPCOMING' | 'ACTIVE' | 'PAST' | 'EXTENDED'

export interface AdminDeadline {
  deadlineId: number
  cycleId: number
  cycleName: string
  title: string
  type: AdminDeadlineType
  description?: string
  dueDate: string
  reminderDays: number[]
  status: DeadlineStatus
  targetRoles: UserRole[]
  isExtendable: boolean
  extendedDate?: string
  createdAt: string
  updatedAt: string
}

export interface CreateDeadlineRequest {
  cycleId: number
  title: string
  type: AdminDeadlineType
  description?: string
  dueDate: string
  reminderDays: number[]
  targetRoles: UserRole[]
  isExtendable: boolean
}

export interface UpdateDeadlineRequest {
  title?: string
  description?: string
  dueDate?: string
  reminderDays?: number[]
  targetRoles?: UserRole[]
  isExtendable?: boolean
  extendedDate?: string
}

// ============================================
// Integration Settings Types (UC32)
// ============================================

export type IntegrationType = 'EMAIL' | 'STORAGE' | 'AI' | 'CALENDAR' | 'SSO'
export type IntegrationStatus = 'ACTIVE' | 'INACTIVE' | 'ERROR' | 'CONFIGURING'

export interface Integration {
  integrationId: number
  name: string
  type: IntegrationType
  status: IntegrationStatus
  provider: string
  description: string
  configuredAt?: string
  lastTestedAt?: string
  lastTestResult?: 'SUCCESS' | 'FAILED'
  settings: Record<string, string>
}

export interface UpdateIntegrationRequest {
  status?: IntegrationStatus
  settings?: Record<string, string>
}

export interface TestIntegrationResult {
  success: boolean
  message: string
  responseTime?: number
  details?: Record<string, unknown>
}

// ============================================
// Export Configuration Types (UC32)
// ============================================

export type ExportFormat = 'CSV' | 'XLSX' | 'PDF' | 'JSON'
export type ExportDataType =
  | 'USERS'
  | 'PROJECTS'
  | 'PROPOSALS'
  | 'MEETINGS'
  | 'LOGS'
  | 'REPORTS'

export interface ExportConfiguration {
  configId: number
  name: string
  dataType: ExportDataType
  format: ExportFormat
  includeHeaders: boolean
  dateFormat: string
  fields: string[]
  filters?: Record<string, unknown>
  schedule?: ExportSchedule
  createdAt: string
  lastExportAt?: string
}

export interface ExportSchedule {
  enabled: boolean
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY'
  time: string
  dayOfWeek?: number
  dayOfMonth?: number
  recipients: string[]
}

export interface CreateExportConfigRequest {
  name: string
  dataType: ExportDataType
  format: ExportFormat
  includeHeaders: boolean
  dateFormat: string
  fields: string[]
  filters?: Record<string, unknown>
  schedule?: ExportSchedule
}

// ============================================
// Maintenance Types (UC33)
// ============================================

export type JobType =
  | 'BACKUP'
  | 'RESTORE'
  | 'CLEANUP'
  | 'INDEX_REBUILD'
  | 'CACHE_CLEAR'
  | 'LOG_ROTATION'

export type JobStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'

export interface MaintenanceJob {
  jobId: number
  type: JobType
  status: JobStatus
  startedAt?: string
  completedAt?: string
  progress: number
  message?: string
  triggeredBy: string
  parameters?: Record<string, unknown>
  result?: JobResult
}

export interface JobResult {
  success: boolean
  message: string
  details?: Record<string, unknown>
  artifactUrl?: string
}

export interface BackupInfo {
  backupId: number
  fileName: string
  fileSize: number
  createdAt: string
  type: 'FULL' | 'INCREMENTAL' | 'DATABASE'
  status: 'AVAILABLE' | 'CORRUPTED' | 'EXPIRED' | 'COMPLETED'
  expiresAt?: string
}

export interface SystemHealthCheck {
  checkId: string
  name: string
  status: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY'
  lastCheckedAt: string
  responseTime?: number
  message?: string
  details?: Record<string, unknown>
}

export interface CleanupOptions {
  clearTempFiles: boolean
  clearOldLogs: boolean
  clearExpiredSessions: boolean
  clearOrphanedFiles: boolean
  clearAuditLogs?: boolean
  olderThanDays: number
  auditLogsOlderThanDays?: number
}

// ============================================
// Audit Log Types
// ============================================

export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'LOGIN'
  | 'LOGOUT'
  | 'VIEW'
  | 'EXPORT'
  | 'IMPORT'
  | 'APPROVE'
  | 'REJECT'

export type AuditEntityType =
  | 'USER'
  | 'PROJECT'
  | 'PROPOSAL'
  | 'MEETING'
  | 'DOCUMENT'
  | 'ANNOUNCEMENT'
  | 'PARAMETER'
  | 'CYCLE'
  | 'DEADLINE'
  | 'INTEGRATION'

export interface AuditLog {
  auditId: number
  action: AuditAction
  entityType: AuditEntityType
  entityId: string
  entityName: string
  performedBy: string
  performedByName: string
  performedByRole: UserRole
  timestamp: string
  ipAddress?: string
  userAgent?: string
  oldValue?: string
  newValue?: string
  details?: string
}

export interface AuditLogFilters {
  action?: AuditAction
  entityType?: AuditEntityType
  performedBy?: string
  dateFrom?: string
  dateTo?: string
}

// ============================================
// Admin Notification Types
// ============================================

export type AdminNotificationType =
  | 'SYSTEM_ALERT'
  | 'USER_REGISTRATION'
  | 'BACKUP_COMPLETED'
  | 'INTEGRATION_ERROR'
  | 'SECURITY_ALERT'
  | 'MAINTENANCE_REQUIRED'

export interface AdminNotification {
  notificationId: number
  type: AdminNotificationType
  title: string
  message: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  isRead: boolean
  createdAt: string
  metadata?: Record<string, unknown>
}
