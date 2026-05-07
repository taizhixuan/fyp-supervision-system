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

// Mock auth for development - set to true to enable mock login flow
const USE_MOCK_AUTH = false

// Mock users for different roles - matching correct User type
const MOCK_STUDENT_USER: User = {
  userId: 1,
  mmuId: '1201234567',
  email: 'student@student.mmu.edu.my',
  fullName: 'Ahmad bin Abdullah',
  role: 'STUDENT',
  status: 'ACTIVE',
  lastLoginAt: new Date().toISOString(),
  createdAt: '2024-09-01T00:00:00Z',
  updatedAt: new Date().toISOString(),
}

const MOCK_SUPERVISOR_USER: User = {
  userId: 2,
  mmuId: '2001000001',
  email: 'sarah.lee@mmu.edu.my',
  fullName: 'Dr. Sarah Lee',
  role: 'SUPERVISOR',
  status: 'ACTIVE',
  lastLoginAt: new Date().toISOString(),
  createdAt: '2023-01-15T00:00:00Z',
  updatedAt: new Date().toISOString(),
}

const MOCK_COMMITTEE_USER: User = {
  userId: 3,
  mmuId: '2001000002',
  email: 'ahmad.razak@mmu.edu.my',
  fullName: 'Prof. Ahmad Razak',
  role: 'FYP_COMMITTEE',
  status: 'ACTIVE',
  lastLoginAt: new Date().toISOString(),
  createdAt: '2022-06-01T00:00:00Z',
  updatedAt: new Date().toISOString(),
}

const MOCK_ADMIN_USER: User = {
  userId: 4,
  mmuId: '2001000003',
  email: 'admin@mmu.edu.my',
  fullName: 'System Administrator',
  role: 'SYSTEM_ADMIN',
  status: 'ACTIVE',
  lastLoginAt: new Date().toISOString(),
  createdAt: '2020-01-01T00:00:00Z',
  updatedAt: new Date().toISOString(),
}

// Mock credentials map - login by email or MMU ID
const MOCK_CREDENTIALS: Record<string, { user: User; password: string }> = {
  // Student
  'student@student.mmu.edu.my': { user: MOCK_STUDENT_USER, password: 'Test@123' },
  '1201234567': { user: MOCK_STUDENT_USER, password: 'Test@123' },
  // Supervisor
  'sarah.lee@mmu.edu.my': { user: MOCK_SUPERVISOR_USER, password: 'Test@123' },
  '2001000001': { user: MOCK_SUPERVISOR_USER, password: 'Test@123' },
  // Committee
  'ahmad.razak@mmu.edu.my': { user: MOCK_COMMITTEE_USER, password: 'Test@123' },
  '2001000002': { user: MOCK_COMMITTEE_USER, password: 'Test@123' },
  // Admin
  'admin@mmu.edu.my': { user: MOCK_ADMIN_USER, password: 'Test@123' },
  '2001000003': { user: MOCK_ADMIN_USER, password: 'Test@123' },
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
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const isAuthenticated = !!user

  // Fetch current user on mount if token exists or mock session persists
  const fetchUser = useCallback(async () => {
    if (USE_MOCK_AUTH) {
      // Check for persisted mock session
      const storedUserId = localStorage.getItem('mock_user_id')
      if (storedUserId) {
        const mockUser = Object.values(MOCK_CREDENTIALS).find(
          (cred) => cred.user.userId.toString() === storedUserId
        )?.user
        if (mockUser) {
          setUser(mockUser)
        }
      }
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
    if (USE_MOCK_AUTH) {
      const identifier = data.identifier.toLowerCase().trim()
      const credential = MOCK_CREDENTIALS[identifier]

      if (!credential || credential.password !== data.password) {
        throw new Error('Invalid credentials. Please try again.')
      }

      localStorage.setItem('mock_user_id', credential.user.userId.toString())
      setUser(credential.user)
      return
    }

    try {
      const response = await authApi.login(data)
      tokenStorage.set(response.accessToken)
      // Stash phase + pass info from login response. RedirectPage reads these.
      // Only set for STUDENT (server only sends these for students with a project).
      if (response.user.role === 'STUDENT') {
        localStorage.setItem('student_current_phase', response.currentPhase ?? '')
        if (response.fyp1Passed === true) localStorage.setItem('student_fyp1_passed', 'true')
        else if (response.fyp1Passed === false) localStorage.setItem('student_fyp1_passed', 'false')
        else localStorage.setItem('student_fyp1_passed', 'null')
      } else {
        localStorage.removeItem('student_current_phase')
        localStorage.removeItem('student_fyp1_passed')
      }
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
    if (USE_MOCK_AUTH) {
      localStorage.removeItem('mock_user_id')
      localStorage.removeItem('mock_user_role')
      setUser(null)
      return
    }

    try {
      await authApi.logout()
    } catch {
      // Ignore logout errors
    } finally {
      tokenStorage.remove()
      localStorage.removeItem('student_current_phase')
      localStorage.removeItem('student_fyp1_passed')
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
