import {
  createContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react'
import type { User, LoginRequest, RegisterRequest } from '@/types'
import { authApi, tokenStorage } from '@/lib/api/auth'
import { getApiErrorMessage } from '@/lib/api/client'

// Mock user for development - set to true to bypass authentication
const USE_MOCK_AUTH = import.meta.env.DEV // Enable mock auth in development

// Mock users for different roles - switch by adding ?role=supervisor or ?role=student to URL
const MOCK_STUDENT_USER: User = {
  userId: 'mock-student-001',
  email: 'student@mmu.edu.my',
  fullName: 'Ahmad bin Abdullah',
  role: 'STUDENT',
  status: 'ACTIVE',
  createdAt: '2024-09-01T00:00:00Z',
  updatedAt: '2025-01-20T00:00:00Z',
}

const MOCK_SUPERVISOR_USER: User = {
  userId: 'mock-supervisor-001',
  email: 'supervisor@mmu.edu.my',
  fullName: 'Dr. Sarah Lee',
  role: 'SUPERVISOR',
  status: 'ACTIVE',
  createdAt: '2023-01-15T00:00:00Z',
  updatedAt: '2025-01-20T00:00:00Z',
}

const MOCK_COMMITTEE_USER: User = {
  userId: 'mock-committee-001',
  email: 'committee@mmu.edu.my',
  fullName: 'Prof. Ahmad Razak',
  role: 'FYP_COMMITTEE',
  status: 'ACTIVE',
  createdAt: '2022-06-01T00:00:00Z',
  updatedAt: '2025-01-20T00:00:00Z',
}

const MOCK_ADMIN_USER: User = {
  userId: 'mock-admin-001',
  email: 'admin@mmu.edu.my',
  fullName: 'System Administrator',
  role: 'SYSTEM_ADMIN',
  status: 'ACTIVE',
  createdAt: '2020-01-01T00:00:00Z',
  updatedAt: '2025-01-20T00:00:00Z',
}

// Function to get mock user based on URL parameter or localStorage
// Usage: Add ?role=student|supervisor|committee|admin to URL
function getMockUser(): User {
  // Check URL parameter first
  const urlParams = new URLSearchParams(window.location.search)
  const roleParam = urlParams.get('role')

  // Check localStorage for persisted role
  const storedRole = localStorage.getItem('mock_user_role')

  // Persist role if specified in URL
  if (roleParam) {
    localStorage.setItem('mock_user_role', roleParam)
  }

  const role = roleParam || storedRole || 'student'

  switch (role.toLowerCase()) {
    case 'supervisor':
      return MOCK_SUPERVISOR_USER
    case 'committee':
      return MOCK_COMMITTEE_USER
    case 'admin':
      return MOCK_ADMIN_USER
    case 'student':
    default:
      return MOCK_STUDENT_USER
  }
}

interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (data: LoginRequest) => Promise<void>
  register: (data: RegisterRequest) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(USE_MOCK_AUTH ? getMockUser() : null)
  const [isLoading, setIsLoading] = useState(!USE_MOCK_AUTH)

  const isAuthenticated = !!user

  // Fetch current user on mount if token exists
  const fetchUser = useCallback(async () => {
    // Skip API call if using mock auth
    if (USE_MOCK_AUTH) {
      setUser(getMockUser())
      setIsLoading(false)
      return
    }

    const token = tokenStorage.get()
    if (!token) {
      setIsLoading(false)
      return
    }

    try {
      const currentUser = await authApi.getCurrentUser()
      setUser(currentUser)
    } catch {
      // Token is invalid, clear it
      tokenStorage.remove()
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  const login = useCallback(async (data: LoginRequest) => {
    try {
      const response = await authApi.login(data)
      tokenStorage.set(response.accessToken)
      setUser(response.user)
    } catch (error) {
      throw new Error(getApiErrorMessage(error))
    }
  }, [])

  const register = useCallback(async (data: RegisterRequest) => {
    try {
      await authApi.register(data)
      // Registration successful - user needs to wait for approval
    } catch (error) {
      throw new Error(getApiErrorMessage(error))
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } catch {
      // Ignore logout errors
    } finally {
      tokenStorage.remove()
      setUser(null)
    }
  }, [])

  const refreshUser = useCallback(async () => {
    try {
      const currentUser = await authApi.getCurrentUser()
      setUser(currentUser)
    } catch {
      tokenStorage.remove()
      setUser(null)
    }
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
