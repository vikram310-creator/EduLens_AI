import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LogOut, Palette, Check, ChevronDown } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const THEMES = [
  { id: 'dark',     label: 'Dark',     preview: ['#080810', '#0f0f1a', '#7c3aed'] },
  { id: 'midnight', label: 'Midnight', preview: ['#000008', '#050510', '#2563eb'] },
  { id: 'ocean',    label: 'Ocean',    preview: ['#020c14', '#051827', '#06b6d4'] },
  { id: 'light',    label: 'Light',    preview: ['#f5f5f8', '#ffffff',  '#7c3aed'] },
]

export default function ProfileDropdown({ compact = false }) {
  const { user, logout, updateTheme } = useAuth()
  const [open, setOpen]             = useState(false)
  const [showThemes, setShowThemes] = useState(false)
  const [saving, setSaving]         = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false)
        setShowThemes(false)
      }
    }
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
      {/* ── Trigger button ───────────────────────────────────────────────── */}
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 rounded-xl px-2 py-1.5 transition"
        style={{ color: 'var(--text-2)' }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-3)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        <Avatar user={user} initials={initials} size={28} />
        {!compact && (
          <span className="hidden sm:block text-xs font-medium max-w-[90px] truncate"
            style={{ color: 'var(--text-2)' }}>
            {user.name || user.email.split('@')[0]}
          </span>
        )}
        <ChevronDown size={12}
          className={`transition-transform`}
          style={{ opacity: 0.4, transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }} />
      </button>

      {/* ── Dropdown card ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 6 }}
            transition={{ duration: 0.14, ease: [0.22, 1, 0.36, 1] }}
            className="dropdown-card absolute left-0 bottom-full mb-2 w-64 rounded-2xl z-[200]"
            style={{ overflow: 'visible' }}
          >
            {/* User info */}
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

            {/* Menu */}
            <div className="p-2">
              {/* Appearance */}
              <button
                onClick={() => setShowThemes(s => !s)}
                className="dropdown-item"
              >
                <Palette size={14} style={{ color: 'var(--text-3)', flexShrink: 0 }} />
                <span className="flex-1">Appearance</span>
                <ChevronDown size={12}
                  style={{ opacity: 0.4, transform: showThemes ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
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
                        const isActive = (user.theme || 'dark') === t.id
                        return (
                          <button
                            key={t.id}
                            onClick={() => handleTheme(t.id)}
                            disabled={saving}
                            className={`theme-btn ${isActive ? 'active' : ''} disabled:opacity-50`}
                          >
                            <div className="flex gap-1 mb-1">
                              {t.preview.map((c, i) => (
                                <div key={i} className="h-3 w-3 rounded-full"
                                  style={{ background: c, border: '1px solid rgba(128,128,128,0.2)' }} />
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
                className="dropdown-item dropdown-item-danger"
              >
                <LogOut size={14} style={{ flexShrink: 0 }} />
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
      <img
        src={user.avatar_url}
        alt={user.name || 'Avatar'}
        referrerPolicy="no-referrer"
        style={{ width: size, height: size, border: '1px solid var(--border)', flexShrink: 0 }}
        className="rounded-full object-cover"
      />
    )
  }
  return (
    <div
      style={{
        width: size, height: size, fontSize: size * 0.38, flexShrink: 0,
        background: 'linear-gradient(135deg, var(--accent), var(--accent-mid))',
        border: '1px solid var(--border)',
      }}
      className="flex items-center justify-center rounded-full font-bold text-white select-none"
    >
      {initials}
    </div>
  )
}
