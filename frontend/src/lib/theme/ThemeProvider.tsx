import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export type ThemePreference = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

const STORAGE_KEY = 'theme'

interface ThemeContextValue {
  theme: ThemePreference
  resolvedTheme: ResolvedTheme
  setTheme: (theme: ThemePreference) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function readStored(): ThemePreference {
  if (typeof window === 'undefined') return 'system'
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (raw === 'light' || raw === 'dark' || raw === 'system') return raw
  return 'system'
}

function systemPrefersDark(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function resolve(theme: ThemePreference): ResolvedTheme {
  if (theme === 'system') return systemPrefersDark() ? 'dark' : 'light'
  return theme
}

function applyDocumentTheme(resolved: ResolvedTheme) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  if (resolved === 'dark') root.classList.add('dark')
  else root.classList.remove('dark')
  root.style.colorScheme = resolved
}

interface ThemeProviderProps {
  children: ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<ThemePreference>(() => readStored())
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => resolve(readStored()))

  // Apply on mount + whenever the user preference changes
  useEffect(() => {
    const next = resolve(theme)
    setResolvedTheme(next)
    applyDocumentTheme(next)
    window.localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  // When in 'system' mode, listen for OS-level changes
  useEffect(() => {
    if (theme !== 'system') return
    const mql = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => {
      const next: ResolvedTheme = mql.matches ? 'dark' : 'light'
      setResolvedTheme(next)
      applyDocumentTheme(next)
    }
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [theme])

  const setTheme = useCallback((next: ThemePreference) => {
    setThemeState(next)
  }, [])

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const current = resolve(prev)
      return current === 'dark' ? 'light' : 'dark'
    })
  }, [])

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, resolvedTheme, setTheme, toggleTheme }),
    [theme, resolvedTheme, setTheme, toggleTheme]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
