import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../utils/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)   // true while checking stored token
  const [showAuth, setShowAuth] = useState(false) // gate modal
  const [authIntent, setAuthIntent] = useState(null) // cb to run after login

  // ── Bootstrap ────────────────────────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { setLoading(false); return }
    api.get('/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(({ data }) => { setUser(data); applyTheme(data.theme) })
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setLoading(false))
  }, [])

  // ── Theme ─────────────────────────────────────────────────────────────────
  const applyTheme = (theme) => {
    const t = theme || 'dark'
    document.documentElement.setAttribute('data-theme', t)
    document.body.setAttribute('data-theme', t)
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  const saveAuth = (token, userData) => {
    localStorage.setItem('token', token)
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
    setUser(null)
    applyTheme('dark')
  }

  const updateTheme = async (theme) => {
    const token = localStorage.getItem('token')
    await api.patch('/auth/theme', { theme }, { headers: { Authorization: `Bearer ${token}` } })
    setUser(u => ({ ...u, theme }))
    applyTheme(theme)
  }

  const updateProfile = async (name) => {
    const token = localStorage.getItem('token')
    const { data } = await api.patch('/auth/profile', { name }, { headers: { Authorization: `Bearer ${token}` } })
    setUser(u => ({ ...u, ...data }))
    return data
  }

  // ── Gate: show modal if not logged in, run cb after ──────────────────────
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
