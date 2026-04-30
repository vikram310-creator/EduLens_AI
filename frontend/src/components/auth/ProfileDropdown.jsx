import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LogOut, Palette, Check, ChevronDown } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const THEMES = [
  { id: 'dark',     label: 'Dark',     preview: ['#080810', '#0f0f1a', '#7c3aed'] },
  { id: 'midnight', label: 'Midnight', preview: ['#000008', '#050510', '#2563eb'] },
  { id: 'ocean',    label: 'Ocean',    preview: ['#020c14', '#051827', '#0891b2'] },
  { id: 'light',    label: 'Light',    preview: ['#f8fafc', '#f1f5f9', '#7c3aed'] },
]

export default function ProfileDropdown() {
  const { user, logout, updateTheme } = useAuth()
  const [open, setOpen]             = useState(false)
  const [showThemes, setShowThemes] = useState(false)
  const [saving, setSaving]         = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  if (!user) return null

  const initials = (user.name || user.email || '?')
    .split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()

  const handleTheme = async (themeId) => {
    if (saving || user.theme === themeId) return
    setSaving(true)
    await updateTheme(themeId)
    setSaving(false)
  }

  return (
    <div className="relative" ref={ref}>
      {/* Trigger */}
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 rounded-xl px-2 py-1.5 transition hover:bg-white/6 group"
        style={{ color: 'var(--text-2)' }}
      >
        <Avatar user={user} initials={initials} size={28} />
        <span className="hidden sm:block text-xs font-medium max-w-[90px] truncate transition group-hover:opacity-100"
          style={{ color: 'var(--text-2)' }}>
          {user.name || user.email.split('@')[0]}
        </span>
        <ChevronDown size={12} className={`transition-transform opacity-50 ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -6 }}
            transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="dropdown-card absolute right-0 top-full mt-2 w-64 rounded-2xl overflow-hidden z-50"
          >
            {/* User info header */}
            <div className="p-4" style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="flex items-center gap-3">
                <Avatar user={user} initials={initials} size={40} />
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-1)' }}>
                    {user.name || 'User'}
                  </p>
                  <p className="text-[11px] truncate" style={{ color: 'var(--text-3)' }}>
                    {user.email}
                  </p>
                  <span className="mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
                    style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
                    {user.provider === 'google' ? '🔵 Google' : '📧 Email'}
                  </span>
                </div>
              </div>
            </div>

            {/* Menu items */}
            <div className="p-2">
              {/* Appearance toggle */}
              <button
                onClick={() => setShowThemes(s => !s)}
                className="dropdown-item w-full"
              >
                <Palette size={14} style={{ color: 'var(--text-3)' }} />
                <span className="flex-1 text-left">Appearance</span>
                <ChevronDown size={12} className={`transition-transform opacity-40 ${showThemes ? 'rotate-180' : ''}`} />
              </button>

              {/* Theme grid */}
              <AnimatePresence>
                {showThemes && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="grid grid-cols-2 gap-1.5 px-1 pb-1 pt-1.5">
                      {THEMES.map(t => {
                        const isActive = user.theme === t.id
                        return (
                          <button
                            key={t.id}
                            onClick={() => handleTheme(t.id)}
                            disabled={saving}
                            className={`theme-btn ${isActive ? 'active' : ''} disabled:opacity-50`}
                          >
                            {/* Colour dots */}
                            <div className="flex gap-1 mb-1">
                              {t.preview.map((c, i) => (
                                <div key={i} className="h-3 w-3 rounded-full"
                                  style={{ background: c, border: '1px solid rgba(128,128,128,0.25)' }} />
                              ))}
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="theme-label">{t.label}</span>
                              {isActive && <Check size={10} style={{ color: 'var(--accent)' }} />}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="my-1 h-px" style={{ background: 'var(--border)' }} />

              <button
                onClick={() => { logout(); setOpen(false) }}
                className="dropdown-item dropdown-item-danger w-full"
              >
                <LogOut size={14} />
                Sign out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function Avatar({ user, initials, size = 32 }) {
  if (user?.avatar_url) {
    return (
      <img src={user.avatar_url} alt={user.name || 'Avatar'} referrerPolicy="no-referrer"
        style={{ width: size, height: size, border: '1px solid var(--border)' }}
        className="rounded-full object-cover flex-shrink-0" />
    )
  }
  return (
    <div
      style={{ width: size, height: size, fontSize: size * 0.38,
        background: 'linear-gradient(135deg, var(--accent), var(--accent-mid))',
        border: '1px solid var(--border)' }}
      className="flex-shrink-0 flex items-center justify-center rounded-full font-bold text-white select-none"
    >
      {initials}
    </div>
  )
}
