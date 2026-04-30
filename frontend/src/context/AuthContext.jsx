import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import api from '../utils/api'

const AuthContext = createContext(null)
const THEME_KEY   = 'edulens_theme'
const USER_KEY    = 'cached_user'
const TOKEN_KEY   = 'token'

// ── Read from localStorage synchronously (runs at module parse time) ─────────
function readCache() {
  try {
    const token = localStorage.getItem(TOKEN_KEY)
    const user  = localStorage.getItem(USER_KEY)
    return {
      token: token || null,
      user:  user ? JSON.parse(user) : null,
      theme: localStorage.getItem(THEME_KEY) || 'dark',
    }
  } catch {
    return { token: null, user: null, theme: 'dark' }
  }
}

function applyTheme(theme) {
  const t = theme || 'dark'
  document.documentElement.setAttribute('data-theme', t)
  document.documentElement.classList.remove('theme-dark','theme-midnight','theme-ocean','theme-light')
  document.documentElement.classList.add(`theme-${t}`)
  localStorage.setItem(THEME_KEY, t)
}

// Apply theme instantly — before React even mounts — to avoid any flash
const initial = readCache()
applyTheme(initial.theme)

// ─────────────────────────────────────────────────────────────────────────────
export function AuthProvider({ children }) {
  // Initialise user from cache → renders logged-in immediately on refresh
  const [user, setUser]         = useState(initial.user)
  // loading = true only while we're verifying the token in the background
  const [loading, setLoading]   = useState(!!initial.token && !initial.user)
  const [showAuth, setShowAuth] = useState(false)
  const [authIntent, setAuthIntent] = useState(null)
  const verifyRef = useRef(false)   // prevent double-verify in React StrictMode

  // ── Background token verification ─────────────────────────────────────────
  useEffect(() => {
    if (verifyRef.current) return
    verifyRef.current = true

    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) { setLoading(false); return }

    api.get('/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(({ data }) => {
        // Server returned fresh user — update cache and state
        setUser(data)
        applyTheme(data.theme)
        localStorage.setItem(USER_KEY, JSON.stringify(data))
        localStorage.setItem(THEME_KEY, data.theme || 'dark')
      })
      .catch((err) => {
        const status = err.response?.status
        if (status === 401) {
          // Token is genuinely invalid — clear everything
          localStorage.removeItem(TOKEN_KEY)
          localStorage.removeItem(USER_KEY)
          setUser(null)
        }
        // Any other error (network, 500, timeout) → keep cached user, stay logged in
        // The background verify simply failed; we'll try again next time
      })
      .finally(() => setLoading(false))
  }, [])

  // ── Helpers ────────────────────────────────────────────────────────────────
  const persist = (token, userData) => {
    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(USER_KEY, JSON.stringify(userData))
    applyTheme(userData.theme)
    setUser(userData)
    setShowAuth(false)
  }

  const register = async (email, password, name) => {
    const { data } = await api.post('/auth/register', { email, password, name })
    persist(data.token, data.user)
    return data.user
  }

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    persist(data.token, data.user)
    return data.user
  }

  const loginWithGoogle = async (code) => {
    const { data } = await api.post('/auth/google/callback', { code })
    persist(data.token, data.user)
    return data.user
  }

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    localStorage.removeItem(THEME_KEY)
    setUser(null)
    applyTheme('dark')
  }

  const updateTheme = async (theme) => {
    applyTheme(theme)
    setUser(u => {
      const updated = { ...u, theme }
      localStorage.setItem(USER_KEY, JSON.stringify(updated))
      return updated
    })
    try {
      const token = localStorage.getItem(TOKEN_KEY)
      await api.patch('/auth/theme', { theme }, { headers: { Authorization: `Bearer ${token}` } })
    } catch (e) {
      console.warn('Theme save failed (will retry next session):', e.message)
    }
  }

  const updateProfile = async (name) => {
    const token = localStorage.getItem(TOKEN_KEY)
    const { data } = await api.patch('/auth/profile', { name }, { headers: { Authorization: `Bearer ${token}` } })
    setUser(u => {
      const updated = { ...u, ...data }
      localStorage.setItem(USER_KEY, JSON.stringify(updated))
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

  const onAuthSuccess = () => { authIntent?.(); setAuthIntent(null) }

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
