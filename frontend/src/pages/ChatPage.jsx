import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useChatStore } from '../store/chatStore'
import MessageBubble from '../components/chat/MessageBubble'
import ChatInput from '../components/chat/ChatInput'
import TypingIndicator from '../components/chat/TypingIndicator'
import ChatHeader from '../components/chat/ChatHeader'
import StreamingBubble from '../components/chat/StreamingBubble'
import { Sparkles, ChevronDown, Menu } from 'lucide-react'

const PERSONA_SUGGESTIONS = {
  assistant: [
    { icon: '💡', text: 'Explain quantum computing simply' },
    { icon: '🌍', text: 'What caused the 2008 financial crisis?' },
    { icon: '🧩', text: 'Help me brainstorm a new side project' },
    { icon: '📅', text: 'How should I structure my week?' },
  ],
  coder: [
    { icon: '🐍', text: 'Write a binary search in Python' },
    { icon: '⚡', text: 'Optimize this SQL query for performance' },
    { icon: '🔒', text: 'What is JWT and how does it work?' },
    { icon: '🐛', text: 'How do I debug a memory leak in Node.js?' },
  ],
  teacher: [
    { icon: '🔬', text: "Explain photosynthesis like I'm 10" },
    { icon: '📐', text: 'Walk me through the Pythagorean theorem' },
    { icon: '🧠', text: 'What is cognitive load theory?' },
    { icon: '🌐', text: 'How does the internet actually work?' },
  ],
  writer: [
    { icon: '✍️', text: 'Help me write a compelling opening line' },
    { icon: '📖', text: 'Give me 5 story hooks for a thriller' },
    { icon: '💬', text: 'How do I write better dialogue?' },
    { icon: '🎭', text: 'Help me develop my protagonist' },
  ],
  analyst: [
    { icon: '📊', text: 'How do I do a SWOT analysis?' },
    { icon: '📈', text: 'Explain P/E ratio in simple terms' },
    { icon: '🎯', text: 'What KPIs should a SaaS track?' },
    { icon: '🔍', text: 'How to spot bias in data analysis?' },
  ],
}

const PERSONA_WELCOME = {
  assistant: { emoji: '✦', title: 'How can I help?', sub: "Ask me anything — I'm here to help." },
  coder: { emoji: '⌥', title: 'Ready to code', sub: 'Share your code, error, or idea.' },
  teacher: { emoji: '◈', title: "Let's learn", sub: 'What would you like to understand today?' },
  writer: { emoji: '✐', title: "Let's write", sub: "I'll help you craft something great." },
  analyst: { emoji: '◎', title: "Let's analyse", sub: 'Bring your data, question, or strategy.' },
}

export default function ChatPage({ onMenuOpen }) {
  const { messages, isStreaming, streamingContent, activeSessionId, sessions, totalTokens, sendMessage } = useChatStore()
  const bottomRef = useRef(null)
  const scrollRef = useRef(null)
  const [showJump, setShowJump] = useState(false)

  const session = sessions.find((s) => s.id === activeSessionId)
  const personaId = session?.system_prompt || 'assistant'
  const isEmpty = messages.length === 0 && !isStreaming
  const welcome = PERSONA_WELCOME[personaId] || PERSONA_WELCOME.assistant
  const suggestions = PERSONA_SUGGESTIONS[personaId] || PERSONA_SUGGESTIONS.assistant

  const isNearBottomRef = useRef(true)
  const prevMessagesLength = useRef(messages.length)

  useEffect(() => {
    const isNewMessage = messages.length > prevMessagesLength.current
    prevMessagesLength.current = messages.length

    if (isNearBottomRef.current || isNewMessage) {
      bottomRef.current?.scrollIntoView({ behavior: isNewMessage ? 'smooth' : 'auto' })
    }
  }, [messages, streamingContent])

  const handleScroll = () => {
    const el = scrollRef.current
    if (!el) return
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    isNearBottomRef.current = distanceFromBottom < 150
    setShowJump(distanceFromBottom > 200)
  }

  return (
    <div className="flex h-full flex-col" style={{ position: 'relative' }}>
      {/* Mobile Menu Trigger (since header is gone) */}
      <button
        onClick={onMenuOpen}
        className="fixed top-4 left-4 z-50 flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-black/20 backdrop-blur-md lg:hidden"
        style={{ color: 'var(--text-2)' }}
      >
        <Menu size={20} />
      </button>

      <div ref={scrollRef} onScroll={handleScroll} className="chat-scroll flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-10">

          {isEmpty && (
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col items-center gap-10 py-8"
            >
              <div className="text-center">
                <motion.div
                  animate={{ y: [0, -7, 0] }}
                  transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut' }}
                  className="mb-5 inline-flex h-[76px] w-[76px] items-center justify-center rounded-[24px] border border-violet-500/20 bg-gradient-to-br from-violet-600/20 to-indigo-700/15 shadow-2xl shadow-violet-900/20"
                  style={{ fontSize: '2rem' }}
                >
                  {welcome.emoji}
                </motion.div>
                <h2 className="glow-text font-display text-[2.2rem] font-800 tracking-tight" style={{ color: 'var(--text-1)' }}>{welcome.title}</h2>
                <p className="mt-1.5 text-sm" style={{ color: 'var(--text-3)' }}>{welcome.sub}</p>
              </div>

              <div className="grid w-full grid-cols-2 gap-2.5">
                {suggestions.map((s, i) => (
                  <motion.button
                    key={s.text}
                    initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.18 + i * 0.07, ease: [0.22, 1, 0.36, 1] }}
                    whileHover={{ scale: 1.025 }} whileTap={{ scale: 0.975 }}
                    onClick={() => sendMessage(s.text)}
                    className="group flex items-start gap-3 insane-card p-5 text-left transition-all"
                  >
                    <span className="mt-0.5 text-base leading-none">{s.icon}</span>
                    <span className="text-[13px] leading-snug transition-colors group-hover:text-[var(--text-1)]" style={{ color: 'var(--text-3)' }}>
                      {s.text}
                    </span>
                  </motion.button>
                ))}
              </div>

            </motion.div>
          )}

          <AnimatePresence initial={false}>
            {messages.map((msg, i) => (
              <MessageBubble key={msg.id || i} message={msg} index={i} />
            ))}
          </AnimatePresence>

          {isStreaming && streamingContent && <StreamingBubble content={streamingContent} />}
          {isStreaming && !streamingContent && <TypingIndicator />}
          <div ref={bottomRef} className="h-2" />
        </div>
      </div>

      {/* Jump-to-bottom FAB */}
      <AnimatePresence>
        {showJump && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 8 }}
            onClick={() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' })}
            style={{ position: 'absolute', bottom: 100, right: 20, zIndex: 20 }}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-violet-500/30 bg-violet-600/90 text-white shadow-lg shadow-violet-900/40 backdrop-blur-sm transition hover:bg-violet-500"
          >
            <ChevronDown size={16} />
          </motion.button>
        )}
      </AnimatePresence>

      <ChatInput />
    </div>
  )
}
