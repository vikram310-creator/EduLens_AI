import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Copy, Check, Zap, X, ZoomIn, RefreshCw, ThumbsUp, ThumbsDown } from 'lucide-react'
import ErrorBoundary from '../ErrorBoundary'
import { useAuth } from '../../context/AuthContext'
import { useChatStore } from '../../store/chatStore'

const LANG_META = {
  python: { color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', label: 'Python' },
  javascript: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', label: 'JavaScript' },
  typescript: { color: '#38bdf8', bg: 'rgba(56,189,248,0.12)', label: 'TypeScript' },
  jsx: { color: '#61dafb', bg: 'rgba(97,218,251,0.12)', label: 'JSX' },
  tsx: { color: '#38bdf8', bg: 'rgba(56,189,248,0.12)', label: 'TSX' },
  css: { color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', label: 'CSS' },
  html: { color: '#fb923c', bg: 'rgba(251,146,60,0.12)', label: 'HTML' },
  bash: { color: '#4ade80', bg: 'rgba(74,222,128,0.12)', label: 'Bash' },
  sh: { color: '#4ade80', bg: 'rgba(74,222,128,0.12)', label: 'Shell' },
  json: { color: '#fbbf24', bg: 'rgba(251,191,36,0.12)', label: 'JSON' },
  sql: { color: '#67e8f9', bg: 'rgba(103,232,249,0.12)', label: 'SQL' },
  rust: { color: '#fb923c', bg: 'rgba(251,146,60,0.12)', label: 'Rust' },
  go: { color: '#34d399', bg: 'rgba(52,211,153,0.12)', label: 'Go' },
  java: { color: '#f87171', bg: 'rgba(248,113,113,0.12)', label: 'Java' },
  cpp: { color: '#c084fc', bg: 'rgba(192,132,252,0.12)', label: 'C++' },
  c: { color: '#c084fc', bg: 'rgba(192,132,252,0.12)', label: 'C' },
  text: { color: '#94a3b8', bg: 'rgba(148,163,184,0.08)', label: 'Text' },
}

function CodeBlock({ children, className }) {
  const [copied, setCopied] = useState(false)
  const rawLang = (className?.replace('language-', '') || 'text').toLowerCase()
  const meta = LANG_META[rawLang] || { color: '#94a3b8', bg: 'rgba(148,163,184,0.08)', label: rawLang.toUpperCase() }
  const code = String(children).trimEnd()
  const lineCount = code.split('\n').length

  const copy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      className="group/code relative my-8 overflow-hidden rounded-[24px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] transition-all duration-500 hover:shadow-[0_40px_80px_-16px_rgba(0,0,0,0.7)]"
      style={{
        border: '1px solid var(--border)',
        background: 'linear-gradient(165deg, rgba(13,13,20,0.8) 0%, rgba(8,8,12,0.95) 100%)',
        backdropFilter: 'blur(24px)'
      }}
    >
      {/* Persona-themed top glow line */}
      <div className="absolute top-0 left-0 right-0 h-[1px]" style={{ background: `linear-gradient(90deg, transparent 0%, ${meta.color}88 50%, transparent 100%)` }} />

      <div
        className="flex items-center justify-between px-6 py-4"
        style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
      >
        <div className="flex items-center gap-5">
          <div className="flex gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-white/10" />
            <div className="h-2.5 w-2.5 rounded-full bg-white/10" />
            <div className="h-2.5 w-2.5 rounded-full bg-white/10" />
          </div>
          <div className="flex items-center gap-3">
            <span
              className="text-[10px] font-900 tracking-[0.2em] uppercase"
              style={{ color: meta.color, textShadow: `0 0 12px ${meta.color}66` }}
            >
              {meta.label}
            </span>
            <div className="h-1 w-1 rounded-full bg-white/10" />
            <span className="text-[10px] font-mono font-500 opacity-30" style={{ color: 'var(--text-3)' }}>
              {lineCount} L
            </span>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.05, y: -1 }} whileTap={{ scale: 0.95 }}
          onClick={copy}
          className="flex items-center gap-2 rounded-full px-4 py-1.5 text-[11px] font-bold tracking-tight transition-all duration-300"
          style={copied
            ? { color: '#10b981', background: 'rgba(16,185,129,0.1)', boxShadow: '0 0 20px rgba(16,185,129,0.15)' }
            : { color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }
          }
        >
          {copied ? <Check size={12} strokeWidth={3} /> : <Copy size={12} strokeWidth={2.5} />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </motion.button>
      </div>

      <div className="relative custom-scrollbar overflow-x-auto">
        <SyntaxHighlighter
          language={rawLang}
          style={vscDarkPlus}
          customStyle={{
            margin: 0,
            background: 'transparent',
            fontSize: '0.82rem',
            fontFamily: "'JetBrains Mono','Fira Code',monospace",
            padding: '1.75rem 1.5rem',
            lineHeight: '1.7',
            borderRadius: 0,
          }}
          showLineNumbers={lineCount > 1}
          lineNumberStyle={{
            color: 'var(--text-3)',
            opacity: 0.15,
            fontSize: '0.7rem',
            paddingRight: '2rem',
            minWidth: '3rem',
            textAlign: 'right',
            userSelect: 'none',
            fontStyle: 'italic'
          }}
          wrapLongLines={false}
          PreTag="div"
        >
          {code}
        </SyntaxHighlighter>

        {/* Neon corner glow */}
        <div className="absolute top-0 right-0 h-32 w-32 rounded-full filter blur-[60px] pointer-events-none opacity-[0.03]"
          style={{ background: meta.color }} />
      </div>
    </div>
  )
}

export default function MessageBubble({ message, index }) {
  const isUser = message.role === 'user'
  const [copied, setCopied] = useState(false)
  const [lightbox, setLightbox] = useState(null)
  const [reaction, setReaction] = useState(null) // 'up' | 'down'
  const { user } = useAuth()
  const { sendMessage, messages } = useChatStore()

  const userInitial = user?.name
    ? user.name.trim()[0].toUpperCase()
    : user?.email
      ? user.email[0].toUpperCase()
      : 'U'

  const content = message?.content ?? ''

  const copyMsg = () => {
    navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Regenerate: find the last user message before this assistant message and resend
  const handleRegenerate = useCallback(() => {
    const myIndex = messages.findIndex(m => m.id === message.id)
    if (myIndex <= 0) return
    const prevUser = messages.slice(0, myIndex).reverse().find(m => m.role === 'user')
    if (prevUser) sendMessage(prevUser.content, prevUser.images || [])
  }, [messages, message.id, sendMessage])

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className={`group flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      <div
        className={`relative mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${isUser
            ? 'bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-lg shadow-violet-900/40'
            : 'border border-theme text-violet-400'
          }`}
        style={{ background: isUser ? '' : 'var(--surface-3)' }}
      >
        {isUser ? userInitial : <Zap size={13} />}
        {!isUser && (
          <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-[#080810] bg-emerald-400" />
        )}
      </div>

      {/* Content */}
      <div className={`flex min-w-0 max-w-[80%] flex-col gap-2 ${isUser ? 'items-end' : 'items-start'}`}>
        {isUser ? (
          <div
            className="bubble-user rounded-2xl rounded-tr-sm text-sm leading-relaxed overflow-hidden"
          >
            {/* Images */}
            {message.images && message.images.length > 0 && (
              <div
                className={`p-1.5 ${message.images.length > 1 ? 'grid grid-cols-2 gap-1.5' : 'flex flex-col'}`}
                style={{
                  background: message.images.length > 1 ? 'rgba(0,0,0,0.15)' : 'transparent',
                  borderRadius: '16px'
                }}
              >
                {message.images.map((img, i) => {
                  const isSingle = message.images.length === 1;
                  return (
                    <div
                      key={i}
                      className="group relative overflow-hidden cursor-zoom-in"
                      style={{
                        borderRadius: isSingle ? '14px' : '10px',
                        aspectRatio: isSingle ? 'auto' : '1',
                        maxHeight: isSingle ? '460px' : 'auto',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
                        background: isSingle ? 'transparent' : 'var(--surface-3)',
                      }}
                      onClick={() => setLightbox({ src: img.dataUrl || img.data_url || img, name: img.name || `Image ${i + 1}` })}
                    >
                      <img
                        src={img.dataUrl || img.data_url || img} alt={img.name || `image ${i + 1}`}
                        style={{
                          width: isSingle ? 'auto' : '100%',
                          height: isSingle ? 'auto' : '100%',
                          maxWidth: '100%',
                          maxHeight: isSingle ? '460px' : '100%',
                          objectFit: isSingle ? 'contain' : 'cover',
                          display: 'block',
                          margin: isSingle ? '0' : 'auto',
                        }}
                        className="transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                      />
                      <div
                        className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 ease-out"
                        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.1) 100%)' }}
                      >
                        <div
                          className="flex items-center justify-center rounded-full bg-black/50 backdrop-blur-md border border-white/20 shadow-2xl transform translate-y-3 group-hover:translate-y-0 transition-transform duration-300 ease-out"
                          style={{ width: '44px', height: '44px' }}
                        >
                          <ZoomIn size={20} className="text-white/90" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Lightbox */}
            <AnimatePresence>
              {lightbox && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 flex items-center justify-center"
                  style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(8px)' }}
                  onClick={() => setLightbox(null)}
                >
                  <motion.div
                    initial={{ scale: 0.88, opacity: 0, y: 16 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.88, opacity: 0, y: 16 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 26 }}
                    className="relative flex flex-col items-center"
                    style={{ maxWidth: '90vw', maxHeight: '90vh' }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => setLightbox(null)}
                      className="absolute -top-3 -right-3 z-10 flex items-center justify-center rounded-full border border-white/15 bg-[#1c1c2e] text-white/60 hover:bg-white/10 hover:text-white transition-all shadow-xl"
                      style={{ width: '32px', height: '32px' }}
                    >
                      <X size={14} />
                    </button>
                    <img
                      src={lightbox.src} alt={lightbox.name}
                      style={{ maxWidth: '88vw', maxHeight: '82vh', objectFit: 'contain', borderRadius: '14px', border: '1px solid var(--border)', boxShadow: '0 32px 80px rgba(0,0,0,0.7)', display: 'block' }}
                    />
                    <div
                      className="mt-3 flex items-center gap-2 rounded-lg px-3 py-1.5"
                      style={{ background: 'var(--surface-3)', border: '1px solid var(--border)' }}
                    >
                      <span style={{ fontSize: '11px', color: 'var(--text-2)' }}>{lightbox.name}</span>
                      <span style={{ fontSize: '10px', color: 'var(--text-3)' }}>· click outside to close</span>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {content && (
              <div className="px-4 py-3 whitespace-pre-wrap">
                {content}
              </div>
            )}
          </div>
        ) : (
          <div className="relative w-full">
            <div className="prose-chat text-sm">
              {content ? (
                <ErrorBoundary>
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      code({ node, className, children, ...props }) {
                        const isInline = !node?.properties?.className && 
                          node?.position?.start?.line === node?.position?.end?.line &&
                          !/\n/.test(String(children))
                        if (isInline) {
                          return (
                            <code
                              style={{
                                background: 'rgba(139, 92, 246, 0.15)',
                                color: '#c4b5fd',
                                padding: '0.15em 0.45em',
                                borderRadius: '6px',
                                fontSize: '0.88em',
                                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                                border: '1px solid rgba(139, 92, 246, 0.2)',
                                fontWeight: 500,
                              }}
                              {...props}
                            >
                              {children}
                            </code>
                          )
                        }
                        return <CodeBlock className={className}>{children}</CodeBlock>
                      },
                    }}
                  >
                    {typeof content === 'string' ? content : JSON.stringify(content)}
                  </ReactMarkdown>
                </ErrorBoundary>
              ) : (
                <span className="italic" style={{ color: 'var(--text-3)' }}>Empty response</span>
              )}
            </div>

            {/* Action row */}
            <div className="mt-2.5 flex items-center gap-2 flex-wrap">
              {message.token_count > 0 && (
                <span className="text-[11px]" style={{ color: 'var(--text-3)' }}>
                  {message.token_count.toLocaleString()} tokens
                </span>
              )}

              {/* Copy */}
              <motion.button
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={copyMsg}
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-500 opacity-0 shadow-sm transition-all duration-150 group-hover:opacity-100 hover:bg-violet-500/10"
                style={{ border: '1px solid var(--border)', background: 'var(--surface-3)', color: 'var(--text-3)' }}
              >
                {copied
                  ? <span className="flex items-center gap-1 text-emerald-400"><Check size={10} /> Copied</span>
                  : <span className="flex items-center gap-1"><Copy size={10} /> Copy</span>
                }
              </motion.button>

              {/* Regenerate */}
              <motion.button
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={handleRegenerate}
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-500 opacity-0 shadow-sm transition-all duration-150 group-hover:opacity-100 hover:bg-violet-500/10"
                style={{ border: '1px solid var(--border)', background: 'var(--surface-3)', color: 'var(--text-3)' }}
                title="Regenerate response"
              >
                <RefreshCw size={10} /> Retry
              </motion.button>

              {/* Thumbs */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <motion.button
                  whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                  onClick={() => setReaction(r => r === 'up' ? null : 'up')}
                  className="flex h-6 w-6 items-center justify-center rounded-md transition"
                  style={{
                    color: reaction === 'up' ? '#4ade80' : 'var(--text-3)',
                    background: reaction === 'up' ? 'rgba(74,222,128,0.1)' : 'transparent',
                  }}
                  title="Good response"
                >
                  <ThumbsUp size={11} />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                  onClick={() => setReaction(r => r === 'down' ? null : 'down')}
                  className="flex h-6 w-6 items-center justify-center rounded-md transition"
                  style={{
                    color: reaction === 'down' ? '#f87171' : 'var(--text-3)',
                    background: reaction === 'down' ? 'rgba(248,113,113,0.1)' : 'transparent',
                  }}
                  title="Bad response"
                >
                  <ThumbsDown size={11} />
                </motion.button>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}
