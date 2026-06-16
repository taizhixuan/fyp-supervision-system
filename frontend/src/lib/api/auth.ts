import { api } from './client'
import type {
  User,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  VerifyRegistrationRequest,
  VerifyRegistrationResponse,
  ResendRegistrationOtpRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
  UpdateProfileRequest,
} from '@/types'

export const authApi = {
  /**
   * Register a new user (Student or Supervisor)
   */
  register: async (data: RegisterRequest): Promise<{ message: string }> => {
    const response = await api.post('/auth/register', data)
    return response.data
  },

  /**
   * Verify the 6-digit code emailed during registration. Creates the account on success.
   */
  verifyRegistration: async (
    data: VerifyRegistrationRequest,
  ): Promise<VerifyRegistrationResponse> => {
    const response = await api.post('/auth/register/verify', data)
    return response.data
  },

  /**
   * Re-send the registration verification code (subject to a server-side cooldown).
   */
  resendRegistrationOtp: async (
    data: ResendRegistrationOtpRequest,
  ): Promise<{ message: string }> => {
    const response = await api.post('/auth/register/resend', data)
    return response.data
  },

  /**
   * Login with MMU ID or email
   */
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post('/auth/login', data)
    return response.data
  },

  /**
   * Logout current user
   */
  logout: async (): Promise<void> => {
    await api.post('/auth/logout')
  },

  /**
   * Request password reset email
   */
  forgotPassword: async (data: ForgotPasswordRequest): Promise<{ message: string }> => {
    const response = await api.post('/auth/forgot-password', data)
    return response.data
  },

  /**
   * Reset password with token
   */
  resetPassword: async (data: ResetPasswordRequest): Promise<{ message: string }> => {
    const response = await api.post('/auth/reset-password', data)
    return response.data
  },

  /**
   * Get current authenticated user profile
   */
  getCurrentUser: async (): Promise<User> => {
    const response = await api.get('/auth/me')
    return response.data
  },

  /**
   * Change password for authenticated user
   */
  changePassword: async (data: ChangePasswordRequest): Promise<{ message: string }> => {
    const response = await api.put('/auth/change-password', data)
    return response.data
  },

  /**
   * Update user profile (email/phone)
   */
  updateProfile: async (data: UpdateProfileRequest): Promise<User> => {
    const response = await api.put('/auth/update-profile', data)
    return response.data
  },

  /**
   * Verify reset password token
   */
  verifyResetToken: async (token: string): Promise<{ valid: boolean }> => {
    const response = await api.get(`/auth/verify-reset-token?token=${token}`)
    return response.data
  },

  /**
   * Record the user's acceptance of the current privacy notice version
   * (used by the re-consent gate when PRIVACY_NOTICE_VERSION is bumped).
   */
  acceptPrivacyNotice: async (version: string): Promise<User> => {
    const response = await api.post('/auth/accept-privacy-notice', { version })
    return response.data
  },
}

// Helper to store/retrieve auth token
export const tokenStorage = {
  get: (): string | null => localStorage.getItem('access_token'),
  set: (token: string): void => localStorage.setItem('access_token', token),
  remove: (): void => localStorage.removeItem('access_token'),
}
