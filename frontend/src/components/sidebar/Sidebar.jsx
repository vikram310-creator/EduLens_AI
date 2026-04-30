import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, MessageSquare, Trash2, Pencil, Check, X, Download, ChevronLeft, ChevronRight, Zap, Cpu } from 'lucide-react'
import { useChatStore } from '../../store/chatStore'
import { useAuth } from '../../context/AuthContext'
import { Avatar } from '../auth/ProfileDropdown'

// onNavigate: called on mobile after a session is selected / new chat created
// so the parent can close the drawer
export default function Sidebar({ onNavigate }) {
  const {
    sessions, activeSessionId, createSession,
    setActiveSession, renameSession, deleteSession,
    exportChat, model, setModel,
  } = useChatStore()
  const { user, logout } = useAuth()

  const [collapsed, setCollapsed] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const [hoveredId, setHoveredId] = useState(null)

  const MODELS = [
    { value: 'llama-3.1-8b-instant',                        label: 'LLaMA 3.1 8B',  tag: 'Fast'   },
    { value: 'llama-3.3-70b-versatile',                     label: 'LLaMA 3.3 70B', tag: 'Smart'  },
    { value: 'meta-llama/llama-4-scout-17b-16e-instruct',   label: 'Llama 4 Scout', tag: 'Vision' },
  ]

  const startEdit = (s, e) => {
    e.stopPropagation()
    setEditingId(s.id)
    setEditTitle(s.title)
  }

  const commitEdit = async (id) => {
    if (editTitle.trim()) await renameSession(id, editTitle.trim())
    setEditingId(null)
  }

  const cancelEdit = () => setEditingId(null)

  const handleNewChat = async () => {
    await createSession('assistant')
    onNavigate?.()   // close drawer on mobile
  }

  const handleSelectSession = (id) => {
    if (editingId) return
    setActiveSession(id)
    onNavigate?.()   // close drawer on mobile
  }

  const PERSONA_COLORS = {
    assistant: 'bg-violet-500/20 text-violet-300',
    coder:     'bg-blue-500/20 text-blue-300',
    teacher:   'bg-emerald-500/20 text-emerald-300',
    writer:    'bg-amber-500/20 text-amber-300',
    analyst:   'bg-rose-500/20 text-rose-300',
  }

  return (
    <motion.aside
      animate={{ width: collapsed ? 56 : 268 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="sidebar-bg relative z-10 flex h-full flex-shrink-0 flex-col overflow-hidden border-r border-white/5"
    >
      {/* Header */}
      <div className="flex h-14 items-center justify-between px-3 border-b border-white/5">
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex items-center gap-2.5"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-900/40">
                <Zap size={13} className="text-white" />
              </div>
              <span className="font-display text-sm font-700 tracking-wide text-white">EduLens_AI</span>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-muted transition hover:bg-white/6 hover:text-white"
        >
          {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
        </button>
      </div>

      {/* New Chat */}
      <div className="p-2.5">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleNewChat}
          className={`flex w-full items-center rounded-xl border border-violet-500/25 bg-gradient-to-r from-violet-600/20 to-indigo-600/15 px-3 py-2.5 text-violet-300 transition hover:from-violet-600/30 hover:to-indigo-600/25 ${collapsed ? 'justify-center' : 'gap-2.5'}`}
        >
          <Plus size={14} strokeWidth={2.5} />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="overflow-hidden whitespace-nowrap text-sm font-500"
              >
                New Chat
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* Sessions list */}
      <div className="flex-1 overflow-y-auto px-2 pb-2">
        <AnimatePresence>
          {!collapsed && sessions.length > 0 && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="px-2 py-2 text-[10px] font-600 uppercase tracking-widest text-white/20"
            >
              Conversations
            </motion.p>
          )}
        </AnimatePresence>

        <div className="flex flex-col gap-0.5">
          {sessions.map((s) => (
            <motion.div
              key={s.id}
              layout
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              onHoverStart={() => setHoveredId(s.id)}
              onHoverEnd={() => setHoveredId(null)}
              onClick={() => handleSelectSession(s.id)}
              className={`group relative flex cursor-pointer items-center rounded-xl px-2.5 py-2 transition-all duration-150 ${
                activeSessionId === s.id
                  ? 'bg-white/7 text-white'
                  : 'text-white/40 hover:bg-white/4 hover:text-white/70'
              } ${collapsed ? 'justify-center gap-0' : 'gap-2.5'}`}
            >
              {activeSessionId === s.id && (
                <motion.div
                  layoutId="active-indicator"
                  className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-violet-400"
                />
              )}

              <div className={`shrink-0 flex h-6 w-6 items-center justify-center rounded-lg text-[10px] font-700 ${
                PERSONA_COLORS[s.system_prompt] || PERSONA_COLORS.assistant
              }`}>
                {s.system_prompt?.[0]?.toUpperCase() || 'A'}
              </div>

              <AnimatePresence>
                {!collapsed && (
                  <motion.div
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    className="flex flex-1 items-center gap-1 overflow-hidden"
                  >
                    {editingId === s.id ? (
                      <div className="flex flex-1 items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <input
                          autoFocus
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') commitEdit(s.id)
                            if (e.key === 'Escape') cancelEdit()
                          }}
                          className="flex-1 min-w-0 rounded-md bg-white/10 px-2 py-0.5 text-xs text-white outline-none ring-1 ring-violet-400/40"
                        />
                        <button onClick={() => commitEdit(s.id)} className="text-violet-400 hover:text-violet-300">
                          <Check size={11} />
                        </button>
                        <button onClick={cancelEdit} className="text-white/30 hover:text-white/60">
                          <X size={11} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex flex-1 flex-col min-w-0">
                          <span className="truncate text-xs font-400 leading-snug">{s.title}</span>
                          {s.message_count > 0 && (
                            <span className="text-[10px] text-white/20">{s.message_count} messages</span>
                          )}
                        </div>
                        {(hoveredId === s.id || activeSessionId === s.id) && (
                          <div className="flex shrink-0 items-center gap-0.5 ml-1">
                            <button
                              onClick={(e) => startEdit(s, e)}
                              className="rounded-md p-1 text-white/30 hover:bg-white/8 hover:text-white/70 transition"
                            >
                              <Pencil size={10} />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); deleteSession(s.id) }}
                              className="rounded-md p-1 text-white/30 hover:bg-red-500/15 hover:text-red-400 transition"
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
          ))}

          {sessions.length === 0 && !collapsed && (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <MessageSquare size={20} className="text-white/10" />
              <p className="text-xs text-white/20">No conversations yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="border-t border-white/5 p-3 flex flex-col gap-3"
          >
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5 px-0.5">
                <Cpu size={10} className="text-white/25" />
                <span className="text-[10px] font-600 uppercase tracking-widest text-white/25">Model</span>
              </div>
              <div className="flex flex-col gap-1">
                {MODELS.map((m) => (
                  <button
                    key={m.value}
                    onClick={() => setModel(m.value)}
                    className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 text-left transition-all ${
                      model === m.value
                        ? 'bg-violet-600/20 border border-violet-500/30 text-violet-200'
                        : 'text-white/40 hover:bg-white/4 hover:text-white/60'
                    }`}
                  >
                    <span className="text-xs">{m.label}</span>
                    <span className={`text-[9px] font-600 px-1.5 py-0.5 rounded-full ${
                      model === m.value ? 'bg-violet-500/30 text-violet-300' : 'bg-white/5 text-white/20'
                    }`}>
                      {m.tag}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {activeSessionId && (
              <button
                onClick={exportChat}
                className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-white/30 hover:bg-white/5 hover:text-white/60 transition border border-white/5 hover:border-white/10"
              >
                <Download size={11} />
                Export as JSON
              </button>
            )}

            {/* User strip */}
            {user && (
              <div className="flex items-center gap-2.5 rounded-xl border border-white/6 bg-white/3 px-2.5 py-2 mt-1">
                <Avatar user={user} initials={(user.name || user.email || '?').split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase()} size={26} />
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-600 text-white/70 truncate">{user.name || user.email.split('@')[0]}</p>
                  <p className="text-[10px] text-white/25 truncate">{user.email}</p>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.aside>
  )
}
