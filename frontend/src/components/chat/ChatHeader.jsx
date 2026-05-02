import { motion, AnimatePresence } from 'framer-motion'
import { useChatStore } from '../../store/chatStore'
import { Zap, Menu } from 'lucide-react'

const PERSONA = {
  assistant: { icon: '✦', label: 'Assistant', color: 'text-violet-400',  ring: 'ring-violet-500/30' },
  coder:     { icon: '⌥', label: 'Coder',     color: 'text-sky-400',     ring: 'ring-sky-500/30'    },
  teacher:   { icon: '◈', label: 'Teacher',   color: 'text-emerald-400', ring: 'ring-emerald-500/30'},
  writer:    { icon: '✐', label: 'Writer',    color: 'text-amber-400',   ring: 'ring-amber-500/30'  },
  analyst:   { icon: '◎', label: 'Analyst',   color: 'text-rose-400',    ring: 'ring-rose-500/30'   },
}

const MODEL_LABEL = {
  'llama-3.1-8b-instant':                      'LLaMA 3.1 · 8B',
  'llama-3.3-70b-versatile':                   'LLaMA 3.3 · 70B',
  'llama3-groq-8b-8192-tool-use-preview':      'LLaMA Groq · 8B',
  'gemma2-9b-it':                              'Gemma 2 · 9B',
  'meta-llama/llama-4-scout-17b-16e-instruct': 'Llama 4 Scout',
}

export default function ChatHeader({ session, totalTokens, onMenuOpen }) {
  const { model, isStreaming } = useChatStore()
  if (!session) return null
  const p = PERSONA[session.system_prompt] || PERSONA.assistant

  return (
    <div
      className="flex h-[52px] items-center justify-between border-b px-3 gap-2"
      style={{ background: 'var(--surface-2)', borderColor: 'var(--border)', backdropFilter: 'blur(16px)' }}
    >
      {/* Left: hamburger + persona */}
      <div className="flex items-center gap-2 min-w-0">
        <button
          onClick={onMenuOpen}
          style={{ WebkitTapHighlightColor: 'transparent' }}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/8 bg-white/4 active:bg-white/10 transition lg:hidden"
          style={{ borderColor: 'var(--border)', background: 'var(--surface-3)', color: 'var(--text-2)' }}
          aria-label="Open sidebar"
        >
          <Menu size={16} />
        </button>

        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ring-1 ${p.ring} text-base ${p.color}`}
             style={{ background: 'var(--surface-3)' }}>
          {p.icon}
        </div>

        <div className="flex flex-col min-w-0">
          <span className="font-display text-[13px] font-600 leading-tight truncate max-w-[160px] sm:max-w-xs"
            style={{ color: 'var(--text-1)' }}>
            {session.title}
          </span>
          <span className={`text-[11px] font-500 ${p.color} opacity-80`}>{p.label} mode</span>
        </div>
      </div>

      {/* Right: status chips only — NO profile icon (it lives in the sidebar) */}
      <div className="flex items-center gap-2 shrink-0">
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

        {/* Model chip */}
        <div className="hidden sm:flex items-center gap-1.5 rounded-full border px-2.5 py-1"
          style={{ borderColor: 'var(--border-strong)', background: 'var(--surface-3)' }}>
          <Zap size={9} className="text-violet-400" />
          <span className="text-[11px] font-500" style={{ color: 'var(--text-2)' }}>
            {MODEL_LABEL[model] || model}
          </span>
        </div>

        {/* Token count */}
        <AnimatePresence>
          {totalTokens > 0 && !isStreaming && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="hidden md:flex items-center rounded-full border px-2.5 py-1"
              style={{ borderColor: 'var(--border)', background: 'var(--surface-3)' }}
            >
              <span className="text-[11px]" style={{ color: 'var(--text-3)' }}>
                {totalTokens.toLocaleString()} tokens
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
