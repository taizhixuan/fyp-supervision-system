export type UserRole = 'STUDENT' | 'SUPERVISOR' | 'FYP_COMMITTEE' | 'SYSTEM_ADMIN'

export type UserStatus = 'PENDING' | 'ACTIVE' | 'BLOCKED' | 'INACTIVE'

export interface User {
  userId: number
  mmuId: string
  email: string
  fullName: string
  phone?: string
  role: UserRole
  status: UserStatus
  lastLoginAt?: string
  createdAt: string
  updatedAt: string
}

export interface LoginRequest {
  identifier: string
  password: string
  rememberMe?: boolean
}

export interface LoginResponse {
  accessToken: string
  user: User
}

export interface RegisterRequest {
  role: 'STUDENT' | 'SUPERVISOR'
  fullName: string
  mmuId: string
  email: string
  phone?: string
  password: string
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
