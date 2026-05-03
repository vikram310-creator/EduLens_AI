import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Mail, Lock, User, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import api from '../../utils/api'

export default function AuthModal() {
  const { showAuth, setShowAuth, register, login, loginWithGoogle, onAuthSuccess } = useAuth()
  const [mode, setMode]         = useState('login')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [name, setName]         = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [googleLoading, setGoogleLoading] = useState(false)

  useEffect(() => {
    const url = new URL(window.location.href)
    const code = url.searchParams.get('code')
    if (code) {
      url.searchParams.delete('code')
      url.searchParams.delete('state')
      window.history.replaceState({}, '', url.toString())
      handleGoogleCode(code)
    }
  }, [])

  const handleGoogleCode = async (code) => {
    setGoogleLoading(true); setError('')
    try { await loginWithGoogle(code); onAuthSuccess() }
    catch (e) { setError(e.response?.data?.detail || 'Google sign-in failed') }
    finally { setGoogleLoading(false) }
  }

  const handleGoogleClick = async () => {
    setGoogleLoading(true)
    try { const { data } = await api.get('/auth/google/url'); window.location.href = data.url }
    catch { setError('Could not reach Google. Check server config.'); setGoogleLoading(false) }
  }

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      mode === 'register' ? await register(email, password, name) : await login(email, password)
      onAuthSuccess()
    } catch (err) { setError(err.response?.data?.detail || 'Something went wrong') }
    finally { setLoading(false) }
  }

  const switchMode = () => { setMode(m => m === 'login' ? 'register' : 'login'); setError('') }

  if (!showAuth) return null

  return (
    <AnimatePresence>
      <motion.div
        key="auth-backdrop"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(14px)' }}
        onClick={(e) => { if (e.target === e.currentTarget) setShowAuth(false) }}
      >
        <motion.div
          key="auth-card"
          initial={{ opacity: 0, scale: 0.92, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 24 }}
          transition={{ type: 'spring', stiffness: 340, damping: 28 }}
          className="insane-card relative w-full max-w-sm p-[1px] rounded-[2rem] overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Ambient glow */}
          <div className="pointer-events-none absolute -top-20 -right-20 h-48 w-48 rounded-full blur-[60px]"
            style={{ background: 'var(--accent-soft)' }} />

          <div className="relative p-7">
            {/* Close */}
            <button onClick={() => setShowAuth(false)}
              className="auth-icon-btn absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-lg transition">
              <X size={14} />
            </button>

            {/* Logo + title */}
            <div className="mb-6 flex flex-col items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-[14px] text-2xl"
                style={{ border: '1px solid var(--accent-soft)', background: 'var(--accent-soft)', boxShadow: '0 8px 32px var(--accent-soft)' }}>
                ⚡
              </div>
              <div className="text-center">
                <h2 className="glow-text text-2xl font-800" style={{ fontFamily: "'Outfit', sans-serif" }}>
                  {mode === 'login' ? 'Welcome back' : 'Create account'}
                </h2>
                <p className="mt-1 text-sm" style={{ color: 'var(--text-3)' }}>
                  {mode === 'login' ? 'Sign in to access your chats' : 'Join EduLens AI today'}
                </p>
              </div>
            </div>

            {/* Google */}
            <button onClick={handleGoogleClick} disabled={googleLoading || loading}
              className="btn-glass flex w-full items-center justify-center gap-2.5 rounded-xl py-3 text-sm font-semibold transition mb-4 disabled:opacity-50 disabled:cursor-not-allowed">
              {googleLoading ? <Loader2 size={16} className="animate-spin" /> : <GoogleIcon />}
              Continue with Google
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px auth-divider" />
              <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-3)' }}>or continue with email</span>
              <div className="flex-1 h-px auth-divider" />
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginBottom: 12 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-xs text-red-400"
                  style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                  <AlertCircle size={13} className="shrink-0" />{error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              {mode === 'register' && (
                <Field icon={<User size={14} />} placeholder="Your name" value={name}
                  onChange={e => setName(e.target.value)} type="text" autoComplete="name" />
              )}
              <Field icon={<Mail size={14} />} placeholder="Email address" value={email}
                onChange={e => setEmail(e.target.value)} type="email" autoComplete="email" required />
              <div className="relative">
                <Field icon={<Lock size={14} />} placeholder="Password" value={password}
                  onChange={e => setPassword(e.target.value)} type={showPw ? 'text' : 'password'}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required />
                <button type="button" onClick={() => setShowPw(p => !p)}
                  className="auth-icon-btn absolute right-3 top-1/2 -translate-y-1/2 transition">
                  {showPw ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </div>

              <button type="submit" disabled={loading || googleLoading}
                className="btn-insane flex w-full items-center justify-center gap-2 py-3.5 text-base font-semibold text-white mt-2 disabled:opacity-60 disabled:cursor-not-allowed">
                {loading && <Loader2 size={14} className="animate-spin" />}
                {mode === 'login' ? 'Sign in' : 'Create account'}
              </button>
            </form>

            <p className="auth-subtitle mt-4 text-center text-xs">
              {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <button onClick={switchMode} className="font-semibold text-violet-400 hover:text-violet-300 transition">
                {mode === 'login' ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

function Field({ icon, ...props }) {
  return (
    <div className="relative">
      <span className="auth-icon absolute left-3 top-1/2 -translate-y-1/2">{icon}</span>
      <input {...props} className="auth-input w-full rounded-xl py-2.5 pl-9 pr-3 text-sm outline-none transition" />
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  )
}
