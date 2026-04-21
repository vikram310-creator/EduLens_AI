import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useChatStore } from '../store/chatStore'
import MessageBubble from '../components/chat/MessageBubble'
import ChatInput from '../components/chat/ChatInput'
import TypingIndicator from '../components/chat/TypingIndicator'
import ChatHeader from '../components/chat/ChatHeader'
import StreamingBubble from '../components/chat/StreamingBubble'
import { Sparkles } from 'lucide-react'

const SUGGESTIONS = [
  { icon: '💡', text: 'Explain quantum computing simply' },
  { icon: '🐍', text: 'Write a binary search in Python' },
  { icon: '🎨', text: 'Design tips for dark mode UIs' },
  { icon: '✍️', text: 'Help me write a cover letter' },
]

export default function ChatPage() {
  const { messages, isStreaming, streamingContent, activeSessionId, sessions, totalTokens, sendMessage } = useChatStore()
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  const session = sessions.find((s) => s.id === activeSessionId)
  const isEmpty = messages.length === 0 && !isStreaming

  return (
    <div className="flex h-full flex-col">
      <ChatHeader session={session} totalTokens={totalTokens} />

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-2xl flex-col gap-7 px-5 py-8">

          {/* Empty state */}
          {isEmpty && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col items-center gap-9 py-10"
            >
              <div className="text-center">
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut' }}
                  className="mb-5 inline-flex h-[72px] w-[72px] items-center justify-center rounded-[22px] border border-violet-500/20 bg-gradient-to-br from-violet-600/20 to-indigo-700/15 text-[32px] shadow-2xl shadow-violet-900/20"
                >
                  ⚡
                </motion.div>
                <h2 className="font-display text-2xl font-700 text-white">What's on your mind?</h2>
                <p className="mt-1.5 text-sm text-white/28">Ask anything — powered by Groq's ultra-fast inference</p>
              </div>

              {/* Suggestion grid */}
              <div className="grid w-full grid-cols-2 gap-2.5">
                {SUGGESTIONS.map((s, i) => (
                  <motion.button
                    key={s.text}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.12 + i * 0.07, ease: [0.22, 1, 0.36, 1] }}
                    whileHover={{ scale: 1.025, backgroundColor: 'rgba(139,92,246,0.09)' }}
                    whileTap={{ scale: 0.975 }}
                    onClick={() => sendMessage(s.text)}
                    className="group flex items-start gap-3 rounded-xl border border-white/6 bg-white/[0.03] p-3.5 text-left transition-colors hover:border-violet-500/25"
                  >
                    <span className="mt-0.5 text-base leading-none">{s.icon}</span>
                    <span className="text-[13px] leading-snug text-white/40 transition-colors group-hover:text-white/65">{s.text}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Messages */}
          <AnimatePresence initial={false}>
            {messages.map((msg, i) => (
              <MessageBubble key={msg.id || i} message={msg} index={i} />
            ))}
          </AnimatePresence>

          {isStreaming && streamingContent && <StreamingBubble content={streamingContent} />}
          {isStreaming && !streamingContent && <TypingIndicator />}

          <div ref={bottomRef} className="h-1" />
        </div>
      </div>

      <ChatInput />
    </div>
  )
}
