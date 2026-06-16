export type UserRole = 'STUDENT' | 'SUPERVISOR' | 'FYP_COMMITTEE' | 'SYSTEM_ADMIN'

export type UserStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'BLOCKED'

export interface User {
  userId: number
  mmuId: string
  email: string
  fullName: string
  phone?: string
  role: UserRole
  status: UserStatus
  profileImagePath?: string
  lastLoginAt?: string
  createdAt: string
  updatedAt: string
  /** Privacy-notice version the user agreed to. Null for pre-PDPA seeded accounts; mismatch with PRIVACY_NOTICE_VERSION triggers the re-consent gate. */
  privacyNoticeVersion?: string | null
}

export interface LoginRequest {
  identifier: string
  password: string
  rememberMe?: boolean
}

export interface LoginResponse {
  accessToken: string
  user: User
  /** Set for STUDENT role with a project: 'FYP1' or 'FYP2'. */
  currentPhase?: 'FYP1' | 'FYP2'
  /** true (passed FYP1), false (failed FYP1), null (result not yet decided). STUDENT only. */
  fyp1Passed?: boolean | null
}

export interface RegisterRequest {
  role: 'STUDENT' | 'SUPERVISOR'
  fullName: string
  mmuId: string
  email: string
  phone?: string
  password: string
  /** Student-only. Backend ignores it for non-STUDENT roles. */
  specialisation?: string
  /** Student-only. Backend ignores it for non-STUDENT roles. */
  intakeYear?: number
  /** Required by the backend — proves the user ticked the consent checkbox. */
  acceptedPrivacyNotice: boolean
  /** Version of the privacy notice the user agreed to. */
  privacyNoticeVersion: string
}

/** Bump this when the privacy notice content materially changes. */
export const PRIVACY_NOTICE_VERSION = 'v1'

export interface VerifyRegistrationRequest {
  email: string
  /** 6-digit code emailed to the registrant. */
  code: string
}

export interface VerifyRegistrationResponse {
  message: string
  /** ACTIVE = roster auto-approved (sign in now); PENDING = awaiting admin approval. */
  status: 'ACTIVE' | 'PENDING'
}

export interface ResendRegistrationOtpRequest {
  email: string
}

export interface ForgotPasswordRequest {
  email: string
}

export interface ResetPasswordRequest {
  token: string
  newPassword: string
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}

export interface UpdateProfileRequest {
  email?: string
  phone?: string
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
}
