import { motion, AnimatePresence } from 'framer-motion'
import { useChatStore } from '../../store/chatStore'
import { Zap, Menu } from 'lucide-react'

const PERSONA = {
  assistant: { icon: '✦', label: 'Assistant', color: 'text-violet-400',  ring: 'ring-violet-500/30',  dot: 'bg-violet-400' },
  coder:     { icon: '⌥', label: 'Coder',     color: 'text-sky-400',     ring: 'ring-sky-500/30',     dot: 'bg-sky-400'    },
  teacher:   { icon: '◈', label: 'Teacher',   color: 'text-emerald-400', ring: 'ring-emerald-500/30', dot: 'bg-emerald-400'},
  writer:    { icon: '✐', label: 'Writer',    color: 'text-amber-400',   ring: 'ring-amber-500/30',   dot: 'bg-amber-400'  },
  analyst:   { icon: '◎', label: 'Analyst',   color: 'text-rose-400',    ring: 'ring-rose-500/30',    dot: 'bg-rose-400'   },
}

const MODEL_LABEL = {
  'llama-3.1-8b-instant':                    'LLaMA 3.1 · 8B',
  'llama-3.3-70b-versatile':                 'LLaMA 3.3 · 70B',
  'llama3-groq-8b-8192-tool-use-preview':    'LLaMA Groq · 8B',
  'gemma2-9b-it':                            'Gemma 2 · 9B',
}

// onMenuOpen: called when the hamburger is tapped on mobile
export default function ChatHeader({ session, totalTokens, onMenuOpen }) {
  const { model, isStreaming } = useChatStore()
  if (!session) return null
  const p = PERSONA[session.system_prompt] || PERSONA.assistant

  return (
    <div
      className="flex h-[52px] items-center justify-between border-b border-white/5 px-3 sm:px-5"
      style={{ background: 'rgba(8,8,16,0.85)', backdropFilter: 'blur(16px)' }}
    >
      {/* Left — hamburger (mobile) + persona */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Hamburger — only visible on mobile */}
        <button
          onClick={onMenuOpen}
          className="md:hidden flex h-8 w-8 items-center justify-center rounded-xl text-white/40 hover:bg-white/6 hover:text-white/80 transition"
          aria-label="Open sidebar"
        >
          <Menu size={17} />
        </button>

        <div className={`flex h-8 w-8 items-center justify-center rounded-xl ring-1 ${p.ring} bg-white/4 text-base ${p.color}`}>
          {p.icon}
        </div>
        <div className="flex flex-col">
          <span className="font-display text-[13px] font-600 leading-tight text-white truncate max-w-[140px] sm:max-w-none">{session.title}</span>
          <span className={`text-[11px] font-500 ${p.color} opacity-80`}>{p.label} mode</span>
        </div>
      </div>

      {/* Right — status chips */}
      <div className="flex items-center gap-2">
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

        <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-white/7 bg-white/3 px-2.5 py-1">
          <Zap size={9} className="text-violet-400" />
          <span className="text-[11px] font-500 text-white/40">{MODEL_LABEL[model] || model}</span>
        </div>

        <AnimatePresence>
          {totalTokens > 0 && !isStreaming && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="hidden md:flex items-center rounded-full border border-white/6 bg-white/2 px-2.5 py-1"
            >
              <span className="text-[11px] text-white/22">{totalTokens.toLocaleString()} tokens</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
