import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LogOut, Palette, User, Check, ChevronDown } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const THEMES = [
  { id: 'dark',     label: 'Dark',     preview: ['#080810', '#0f0f1a', '#7c3aed'] },
  { id: 'midnight', label: 'Midnight', preview: ['#000008', '#050510', '#2563eb'] },
  { id: 'ocean',    label: 'Ocean',    preview: ['#020c14', '#051827', '#0891b2'] },
  { id: 'light',    label: 'Light',    preview: ['#f8fafc', '#f1f5f9', '#7c3aed'] },
]

export default function ProfileDropdown() {
  const { user, logout, updateTheme } = useAuth()
  const [open, setOpen]           = useState(false)
  const [showThemes, setShowThemes] = useState(false)
  const [saving, setSaving]       = useState(false)
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
    setSaving(true)
    await updateTheme(themeId)
    setSaving(false)
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 rounded-xl px-2 py-1.5 transition hover:bg-white/6 group"
      >
        <Avatar user={user} initials={initials} size={28} />
        <span className="hidden sm:block text-xs font-500 text-white/60 group-hover:text-white/90 transition max-w-[90px] truncate">
          {user.name || user.email.split('@')[0]}
        </span>
        <ChevronDown size={12} className={`text-white/30 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="absolute right-0 top-full mt-2 w-64 rounded-2xl border border-white/10 overflow-hidden z-50"
            style={{
              background: 'linear-gradient(145deg, #0f0f1e 0%, #0a0a14 100%)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(139,92,246,0.1)',
            }}
          >
            {/* User info */}
            <div className="p-4 border-b border-white/6">
              <div className="flex items-center gap-3">
                <Avatar user={user} initials={initials} size={40} />
                <div className="min-w-0">
                  <p className="text-sm font-600 text-white truncate">{user.name || 'User'}</p>
                  <p className="text-[11px] text-white/35 truncate">{user.email}</p>
                  <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-violet-500/15 px-2 py-0.5 text-[10px] font-500 text-violet-300">
                    {user.provider === 'google' ? '🔵 Google' : '📧 Email'}
                  </span>
                </div>
              </div>
            </div>

            {/* Theme section */}
            <div className="p-2">
              <button
                onClick={() => setShowThemes(s => !s)}
                className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm text-white/70 hover:bg-white/6 hover:text-white transition"
              >
                <span className="flex items-center gap-2.5">
                  <Palette size={14} className="text-white/40" />
                  Appearance
                </span>
                <ChevronDown size={12} className={`text-white/30 transition-transform ${showThemes ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {showThemes && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="grid grid-cols-2 gap-1.5 px-2 pb-1 pt-1.5">
                      {THEMES.map(t => (
                        <button
                          key={t.id}
                          onClick={() => handleTheme(t.id)}
                          disabled={saving}
                          className={`relative flex flex-col items-start gap-1.5 rounded-xl border p-2.5 text-left transition
                            ${user.theme === t.id
                              ? 'border-violet-500/50 bg-violet-500/10'
                              : 'border-white/6 bg-white/3 hover:border-white/14 hover:bg-white/6'}`}
                        >
                          {/* Colour preview */}
                          <div className="flex gap-1">
                            {t.preview.map((c, i) => (
                              <div key={i} className="h-3 w-3 rounded-full border border-white/10" style={{ background: c }} />
                            ))}
                          </div>
                          <span className="text-[11px] font-500 text-white/60">{t.label}</span>
                          {user.theme === t.id && (
                            <Check size={10} className="absolute right-2 top-2 text-violet-400" />
                          )}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="my-1 h-px bg-white/6" />

              <button
                onClick={() => { logout(); setOpen(false) }}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-red-400/80 hover:bg-red-500/10 hover:text-red-300 transition"
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
      <img
        src={user.avatar_url}
        alt={user.name || 'Avatar'}
        referrerPolicy="no-referrer"
        style={{ width: size, height: size }}
        className="rounded-full object-cover border border-white/10 flex-shrink-0"
      />
    )
  }
  return (
    <div
      style={{ width: size, height: size, fontSize: size * 0.38 }}
      className="flex-shrink-0 flex items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 font-700 text-white select-none border border-white/10"
    >
      {initials}
    </div>
  )
}
