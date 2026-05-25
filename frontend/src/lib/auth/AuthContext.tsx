import {
  createContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { User, LoginRequest, RegisterRequest } from '@/types'
import { authApi, tokenStorage } from '@/lib/api/auth'
import { getApiErrorMessage } from '@/lib/api/client'

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
  const queryClient = useQueryClient()

  const isAuthenticated = !!user

  const fetchUser = useCallback(async () => {
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
    // Defensive: wipe any previous account's cached queries before the new
    // user's components subscribe, so they never momentarily render stale data.
    queryClient.clear()

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
  }, [queryClient])

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
      localStorage.removeItem('student_current_phase')
      localStorage.removeItem('student_fyp1_passed')
      setUser(null)
      // Drop every cached query so the next account doesn't see this account's data.
      queryClient.clear()
    }
  }, [queryClient])

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
