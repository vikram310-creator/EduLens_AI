import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, MessageSquare, Trash2, Pencil, Check, X, Download, ChevronLeft, ChevronRight, Zap, Cpu, Search } from 'lucide-react'
import { useChatStore } from '../../store/chatStore'
import { useAuth } from '../../context/AuthContext'
import ProfileDropdown from '../auth/ProfileDropdown'

export default function Sidebar({ onNavigate, onBackToLanding }) {
  const {
    sessions, activeSessionId, createSession,
    setActiveSession, renameSession, deleteSession,
    exportChat, model, setModel,
  } = useChatStore()
  const { user } = useAuth()

  const [collapsed,  setCollapsed]  = useState(false)
  const [editingId,  setEditingId]  = useState(null)
  const [editTitle,  setEditTitle]  = useState('')
  const [hoveredId,  setHoveredId]  = useState(null)
  const [search,     setSearch]     = useState('')
  const searchRef = useRef(null)

  const MODELS = [
    { value: 'llama-3.1-8b-instant',                      label: 'LLaMA 3.1 8B',  tag: 'Fast'   },
    { value: 'llama-3.3-70b-versatile',                   label: 'LLaMA 3.3 70B', tag: 'Smart'  },
    { value: 'meta-llama/llama-4-scout-17b-16e-instruct', label: 'Llama 4 Scout', tag: 'Vision' },
  ]

  const PERSONA_ICONS = {
    assistant: { icon: '✦', cls: 'text-violet-400 bg-violet-500/12 ring-violet-500/20' },
    coder:     { icon: '⌥', cls: 'text-sky-400     bg-sky-500/12     ring-sky-500/20'     },
    teacher:   { icon: '◈', cls: 'text-emerald-400 bg-emerald-500/12 ring-emerald-500/20' },
    writer:    { icon: '✐', cls: 'text-amber-400   bg-amber-500/12   ring-amber-500/20'   },
    analyst:   { icon: '◎', cls: 'text-rose-400    bg-rose-500/12    ring-rose-500/20'    },
  }

  // Keyboard shortcut: Cmd/Ctrl+K focuses search
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        if (collapsed) setCollapsed(false)
        setTimeout(() => searchRef.current?.focus(), 150)
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [collapsed])

  const filteredSessions = search.trim()
    ? sessions.filter(s =>
        s.title?.toLowerCase().includes(search.toLowerCase()) ||
        s.system_prompt?.toLowerCase().includes(search.toLowerCase())
      )
    : sessions

  const startEdit   = (s, e) => { e.stopPropagation(); setEditingId(s.id); setEditTitle(s.title) }
  const commitEdit  = async (id) => { if (editTitle.trim()) await renameSession(id, editTitle.trim()); setEditingId(null) }
  const cancelEdit  = () => setEditingId(null)

  const handleNewChat = async () => { await createSession('assistant'); onNavigate?.() }
  const handleSelect  = (id) => { if (editingId) return; setActiveSession(id); onNavigate?.() }

  return (
    <motion.aside
      animate={{ width: collapsed ? 56 : 268 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="relative z-10 flex h-full flex-shrink-0 flex-col overflow-hidden"
      style={{
        background: 'linear-gradient(180deg,var(--surface-2) 0%,var(--surface) 100%)',
        borderRight: '1px solid var(--border)',
      }}
    >
      {/* Header */}
      <div className="flex h-14 items-center justify-between px-3" style={{ borderBottom: '1px solid var(--border)' }}>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
              className="flex items-center gap-2.5"
            >
              <button onClick={onBackToLanding} title="Back to home" className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-900/30 hover:opacity-80 transition">
                <Zap size={13} className="text-white" />
              </button>
              <span className="font-display text-sm font-700 tracking-wide" style={{ color: 'var(--text-1)' }}>
                EduLens_AI
              </span>
            </motion.div>
          )}
        </AnimatePresence>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex h-7 w-7 items-center justify-center rounded-lg transition"
          style={{ color: 'var(--text-3)' }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-3)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
        </button>
      </div>

      {/* New Chat */}
      <div className="p-2.5">
        <motion.button
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
          onClick={handleNewChat}
          className={`flex w-full items-center rounded-xl border border-violet-500/25 bg-gradient-to-r from-violet-600/20 to-indigo-600/15 px-3 py-2.5 text-violet-400 transition hover:from-violet-600/30 hover:to-indigo-600/25 ${collapsed ? 'justify-center' : 'gap-2.5'}`}
        >
          <Plus size={14} strokeWidth={2.5} />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }}
                className="overflow-hidden whitespace-nowrap text-sm font-500"
              >
                New Chat
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* Search */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="px-2.5 pb-2"
          >
            <div className="flex items-center gap-2 rounded-xl border border-white/6 bg-white/[0.03] px-3 py-2">
              <Search size={12} style={{ color: 'var(--text-3)', flexShrink: 0 }} />
              <input
                ref={searchRef}
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search chats…"
                className="flex-1 bg-transparent text-xs outline-none"
                style={{ color: 'var(--text-1)' }}
              />
              {search && (
                <button onClick={() => setSearch('')} style={{ color: 'var(--text-3)' }}>
                  <X size={10} />
                </button>
              )}
              {!search && (
                <kbd style={{ color: 'var(--text-3)', fontSize: '9px', opacity: 0.6 }}>⌘K</kbd>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sessions */}
      <div className="flex-1 overflow-y-auto px-2 pb-2">
        <AnimatePresence>
          {!collapsed && filteredSessions.length > 0 && (
            <motion.p
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="px-2 py-2 text-[10px] font-600 uppercase tracking-widest"
              style={{ color: 'var(--text-3)' }}
            >
              {search ? `${filteredSessions.length} result${filteredSessions.length !== 1 ? 's' : ''}` : 'Conversations'}
            </motion.p>
          )}
        </AnimatePresence>

        <div className="flex flex-col gap-0.5">
          {filteredSessions.map((s) => {
            const persona  = PERSONA_ICONS[s.system_prompt] || PERSONA_ICONS.assistant
            const isActive = activeSessionId === s.id

            return (
              <motion.div
                key={s.id} layout
                initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}
                onHoverStart={() => setHoveredId(s.id)} onHoverEnd={() => setHoveredId(null)}
                onClick={() => handleSelect(s.id)}
                className={`group relative flex cursor-pointer items-center rounded-xl px-2.5 py-2 transition-all duration-150 ${collapsed ? 'justify-center' : 'gap-2.5'}`}
                style={{
                  background: isActive ? 'var(--surface-3)' : 'transparent',
                  color: isActive ? 'var(--text-1)' : 'var(--text-3)',
                }}
                onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'var(--surface-3)'; e.currentTarget.style.color = 'var(--text-2)' } }}
                onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-3)' } }}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-indicator"
                    className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-violet-400"
                  />
                )}

                <div className={`shrink-0 flex h-6 w-6 items-center justify-center rounded-lg text-[11px] font-700 ring-1 ${persona.cls}`}>
                  {persona.icon}
                </div>

                <AnimatePresence>
                  {!collapsed && (
                    <motion.div
                      initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }}
                      className="flex flex-1 items-center gap-1 overflow-hidden"
                    >
                      {editingId === s.id ? (
                        <div className="flex flex-1 items-center gap-1" onClick={e => e.stopPropagation()}>
                          <input
                            autoFocus value={editTitle}
                            onChange={e => setEditTitle(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') commitEdit(s.id); if (e.key === 'Escape') cancelEdit() }}
                            className="flex-1 min-w-0 rounded-md px-2 py-0.5 text-xs outline-none ring-1 ring-violet-400/40"
                            style={{ background: 'var(--surface-4)', color: 'var(--text-1)', border: '1px solid var(--border-strong)' }}
                          />
                          <button onClick={() => commitEdit(s.id)} className="text-violet-400 hover:text-violet-300"><Check size={11} /></button>
                          <button onClick={cancelEdit} style={{ color: 'var(--text-3)' }}><X size={11} /></button>
                        </div>
                      ) : (
                        <>
                          <div className="flex flex-1 flex-col min-w-0">
                            <span className="truncate text-xs font-400 leading-snug" style={{ color: 'var(--text-1)' }}>
                              {s.title && s.title !== 'New Chat' ? s.title : (
                                <span style={{ color: 'var(--text-3)' }}>
                                  {s.system_prompt ? s.system_prompt.charAt(0).toUpperCase() + s.system_prompt.slice(1) : 'New Chat'}
                                </span>
                              )}
                            </span>
                            {s.message_count > 0 && (
                              <span className="text-[10px]" style={{ color: 'var(--text-3)' }}>
                                {s.message_count} {s.message_count === 1 ? 'msg' : 'msgs'}
                              </span>
                            )}
                          </div>
                          {(hoveredId === s.id || isActive) && (
                            <div className="flex shrink-0 items-center gap-0.5 ml-1">
                              <button
                                onClick={e => startEdit(s, e)}
                                className="rounded-md p-1 transition"
                                style={{ color: 'var(--text-3)' }}
                                onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-4)'; e.currentTarget.style.color = 'var(--text-1)' }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-3)' }}
                              >
                                <Pencil size={10} />
                              </button>
                              <button
                                onClick={e => { e.stopPropagation(); deleteSession(s.id) }}
                                className="rounded-md p-1 transition"
                                style={{ color: 'var(--text-3)' }}
                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#f87171' }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-3)' }}
                              >
                                <Trash2 size={10} />
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}

          {filteredSessions.length === 0 && !collapsed && (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              {search ? (
                <>
                  <Search size={18} style={{ color: 'var(--text-3)', opacity: 0.4 }} />
                  <p className="text-xs" style={{ color: 'var(--text-3)' }}>No chats match "{search}"</p>
                </>
              ) : (
                <>
                  <MessageSquare size={20} style={{ color: 'var(--text-3)', opacity: 0.4 }} />
                  <p className="text-xs" style={{ color: 'var(--text-3)' }}>No conversations yet</p>
                  <p className="text-[10px]" style={{ color: 'var(--text-3)', opacity: 0.6 }}>Click "New Chat" to start</p>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="p-3 flex flex-col gap-3"
            style={{ borderTop: '1px solid var(--border)' }}
          >
            {/* Model picker */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5 px-0.5">
                <Cpu size={10} style={{ color: 'var(--text-3)' }} />
                <span className="text-[10px] font-600 uppercase tracking-widest" style={{ color: 'var(--text-3)' }}>Model</span>
              </div>
              <div className="flex flex-col gap-1">
                {MODELS.map((m) => {
                  const active = model === m.value
                  return (
                    <button
                      key={m.value}
                      onClick={() => setModel(m.value)}
                      className="flex items-center justify-between rounded-lg px-2.5 py-1.5 text-left transition-all"
                      style={{
                        background: active ? 'var(--accent-soft)' : 'transparent',
                        border: active ? '1px solid rgba(139,92,246,0.3)' : '1px solid transparent',
                        color: active ? 'var(--accent)' : 'var(--text-3)',
                      }}
                    >
                      <span className="text-xs">{m.label}</span>
                      <span
                        className="text-[9px] font-600 px-1.5 py-0.5 rounded-full"
                        style={{
                          background: active ? 'var(--accent-soft)' : 'var(--surface-4)',
                          color: active ? 'var(--accent)' : 'var(--text-3)',
                        }}
                      >
                        {m.tag}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Export */}
            {activeSessionId && (
              <button
                onClick={exportChat}
                className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs transition"
                style={{ color: 'var(--text-3)', border: '1px solid var(--border)' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-3)'; e.currentTarget.style.color = 'var(--text-2)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-3)' }}
              >
                <Download size={11} />
                Export as JSON
              </button>
            )}

            {/* Profile */}
            {user && (
              <div className="mt-1 rounded-xl overflow-visible" style={{ border: '1px solid var(--border)', background: 'var(--surface-3)' }}>
                <ProfileDropdown onAbout={onBackToLanding} />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.aside>
  )
}
