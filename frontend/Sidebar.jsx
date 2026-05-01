import { motion } from 'framer-motion'
import { Zap } from 'lucide-react'

export default function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      className="flex gap-3"
    >
      <div className="relative mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 2.5, ease: 'linear' }}
          className="absolute inset-0 rounded-xl border border-violet-500/40 border-t-violet-400"
        />
        <div className="flex h-6 w-6 items-center justify-center rounded-[10px] border border-white/8 bg-[#13131e]">
          <Zap size={12} className="text-violet-400" />
        </div>
      </div>

      <div className="flex items-center gap-1.5 rounded-xl border border-white/6 bg-[#13131e]/60 px-4 py-3">
        <span className="typing-dot" />
        <span className="typing-dot" />
        <span className="typing-dot" />
      </div>
    </motion.div>
  )
}
