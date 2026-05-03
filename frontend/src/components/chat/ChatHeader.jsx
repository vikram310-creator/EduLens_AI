import { motion, AnimatePresence } from 'framer-motion'
import { useChatStore } from '../../store/chatStore'
import { Zap, Menu, Download } from 'lucide-react'

const PERSONA = {
  assistant: { icon: '✦', label: 'Assistant', color: 'text-violet-400',  ring: 'ring-violet-500/30',  dot: '#8b5cf6' },
  coder:     { icon: '⌥', label: 'Coder',     color: 'text-sky-400',     ring: 'ring-sky-500/30',     dot: '#38bdf8' },
  teacher:   { icon: '◈', label: 'Teacher',   color: 'text-emerald-400', ring: 'ring-emerald-500/30', dot: '#34d399' },
  writer:    { icon: '✐', label: 'Writer',    color: 'text-amber-400',   ring: 'ring-amber-500/30',   dot: '#fbbf24' },
  analyst:   { icon: '◎', label: 'Analyst',   color: 'text-rose-400',    ring: 'ring-rose-500/30',    dot: '#fb7185' },
}

const MODEL_LABEL = {
  'llama-3.1-8b-instant':                      'LLaMA 3.1 · 8B',
  'llama-3.3-70b-versatile':                   'LLaMA 3.3 · 70B',
  'llama3-groq-8b-8192-tool-use-preview':      'LLaMA Groq · 8B',
  'gemma2-9b-it':                              'Gemma 2 · 9B',
  'meta-llama/llama-4-scout-17b-16e-instruct': 'Llama 4 Scout · Vision',
}

export default function ChatHeader({ session, totalTokens, onMenuOpen }) {
  const { model, isStreaming, exportChat } = useChatStore()
  if (!session) return null
  const p = PERSONA[session.system_prompt] || PERSONA.assistant

  return (
    <div
      className="flex h-[52px] items-center justify-between border-b px-3 gap-2 shrink-0"
      style={{
        background: 'var(--surface-2)',
        borderColor: 'var(--border)',
        backdropFilter: 'blur(16px)',
      }}
    >
      {/* Left */}
      <div className="flex items-center gap-2.5 min-w-0">
        {/* Mobile hamburger */}
        <button
          onClick={onMenuOpen}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition active:scale-95 lg:hidden"
          style={{ background: 'var(--surface-3)', color: 'var(--text-2)', border: '1px solid var(--border)' }}
          aria-label="Open sidebar"
        >
          <Menu size={16} />
        </button>

        {/* Persona badge */}
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ring-1 ${p.ring} text-sm ${p.color}`}
          style={{ background: 'var(--surface-3)' }}
        >
          {p.icon}
        </div>

        {/* Title + mode */}
        <div className="flex flex-col min-w-0">
          <span
            className="font-display text-[13px] font-600 leading-tight truncate max-w-[160px] sm:max-w-xs"
            style={{ color: 'var(--text-1)' }}
          >
            {session.title || 'New Chat'}
          </span>
          <span className={`text-[11px] font-500 ${p.color} opacity-75`}>
            {p.label} mode
          </span>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Streaming indicator */}
        <AnimatePresence>
          {isStreaming && (
            <motion.div
              initial={{ opacity: 0, scale: 0.85, x: 8 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.85, x: 8 }}
              className="flex items-center gap-1.5 rounded-full border border-violet-500/20 bg-violet-500/10 px-2.5 py-1"
            >
              <motion.div
                animate={{ scale: [1, 1.5, 1], opacity: [0.7, 1, 0.7] }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="h-1.5 w-1.5 rounded-full bg-violet-400"
              />
              <span className="text-[11px] font-500 text-violet-300">Generating</span>
            </motion.div>
          )}
        </AnimatePresence>


      </div>
    </div>
  )
}
