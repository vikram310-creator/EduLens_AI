import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../utils/api'

const AuthContext = createContext(null)

// Persist theme in localStorage so it's applied instantly before /auth/me resolves
const THEME_KEY = 'edulens_theme'

export function AuthProvider({ children }) {
  const [user, setUser]         = useState(null)
  const [loading, setLoading]   = useState(true)
  const [showAuth, setShowAuth] = useState(false)
  const [authIntent, setAuthIntent] = useState(null)

  // Apply theme immediately on mount from cache (no flash)
  useEffect(() => {
    const cached = localStorage.getItem(THEME_KEY) || 'dark'
    applyTheme(cached)
  }, [])

  // ── Bootstrap: restore session ───────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { setLoading(false); return }

    api.get('/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(({ data }) => {
        setUser(data)
        applyTheme(data.theme)
        localStorage.setItem(THEME_KEY, data.theme || 'dark')
      })
      .catch((err) => {
        // Only wipe token on explicit 401 (invalid/expired).
        // Network errors or 5xx (cold Render start) keep the user logged in.
        if (err.response?.status === 401) {
          localStorage.removeItem('token')
        }
        // If we still have a token, try to restore from cached user data
        const cached = localStorage.getItem('cached_user')
        if (cached && err.response?.status !== 401) {
          try { setUser(JSON.parse(cached)) } catch {}
        }
      })
      .finally(() => setLoading(false))
  }, [])

  // ── Theme ─────────────────────────────────────────────────────────────────
  function applyTheme(theme) {
    const t = theme || 'dark'
    // Set on <html> — this is what CSS [data-theme] selectors target
    document.documentElement.setAttribute('data-theme', t)
    // Also set a class for Tailwind dark: variant support
    const root = document.documentElement
    root.classList.remove('theme-dark', 'theme-midnight', 'theme-ocean', 'theme-light')
    root.classList.add(`theme-${t}`)
    // Persist so next load is instant
    localStorage.setItem(THEME_KEY, t)
  }

  // ── Auth helpers ──────────────────────────────────────────────────────────
  const saveAuth = (token, userData) => {
    localStorage.setItem('token', token)
    localStorage.setItem('cached_user', JSON.stringify(userData))
    setUser(userData)
    applyTheme(userData.theme)
    setShowAuth(false)
  }

  const register = async (email, password, name) => {
    const { data } = await api.post('/auth/register', { email, password, name })
    saveAuth(data.token, data.user)
    return data.user
  }

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    saveAuth(data.token, data.user)
    return data.user
  }

  const loginWithGoogle = async (code) => {
    const { data } = await api.post('/auth/google/callback', { code })
    saveAuth(data.token, data.user)
    return data.user
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('cached_user')
    localStorage.removeItem(THEME_KEY)
    setUser(null)
    applyTheme('dark')
  }

  const updateTheme = async (theme) => {
    // Apply immediately for instant feedback
    applyTheme(theme)
    setUser(u => {
      const updated = { ...u, theme }
      localStorage.setItem('cached_user', JSON.stringify(updated))
      return updated
    })
    // Then persist to server
    try {
      const token = localStorage.getItem('token')
      await api.patch('/auth/theme', { theme }, { headers: { Authorization: `Bearer ${token}` } })
    } catch (e) {
      console.warn('Failed to save theme to server:', e.message)
    }
  }

  const updateProfile = async (name) => {
    const token = localStorage.getItem('token')
    const { data } = await api.patch('/auth/profile', { name }, { headers: { Authorization: `Bearer ${token}` } })
    setUser(u => {
      const updated = { ...u, ...data }
      localStorage.setItem('cached_user', JSON.stringify(updated))
      return updated
    })
    return data
  }

  const requireAuth = useCallback((cb) => {
    if (user) { cb?.(); return true }
    setAuthIntent(() => cb)
    setShowAuth(true)
    return false
  }, [user])

  const onAuthSuccess = () => {
    authIntent?.()
    setAuthIntent(null)
  }

  return (
    <AuthContext.Provider value={{
      user, loading,
      showAuth, setShowAuth,
      register, login, loginWithGoogle, logout,
      updateTheme, updateProfile,
      requireAuth, onAuthSuccess,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
