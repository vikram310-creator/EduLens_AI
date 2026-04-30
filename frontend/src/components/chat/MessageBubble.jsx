import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Copy, Check, Zap, X, ZoomIn } from 'lucide-react'
import ErrorBoundary from '../ErrorBoundary'

const LANG_META = {
  python:     { color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', label: 'Python' },
  javascript: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', label: 'JavaScript' },
  typescript: { color: '#38bdf8', bg: 'rgba(56,189,248,0.12)', label: 'TypeScript' },
  jsx:        { color: '#61dafb', bg: 'rgba(97,218,251,0.12)', label: 'JSX' },
  tsx:        { color: '#38bdf8', bg: 'rgba(56,189,248,0.12)', label: 'TSX' },
  css:        { color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', label: 'CSS' },
  html:       { color: '#fb923c', bg: 'rgba(251,146,60,0.12)',  label: 'HTML' },
  bash:       { color: '#4ade80', bg: 'rgba(74,222,128,0.12)',  label: 'Bash' },
  sh:         { color: '#4ade80', bg: 'rgba(74,222,128,0.12)',  label: 'Shell' },
  json:       { color: '#fbbf24', bg: 'rgba(251,191,36,0.12)', label: 'JSON' },
  sql:        { color: '#67e8f9', bg: 'rgba(103,232,249,0.12)', label: 'SQL' },
  rust:       { color: '#fb923c', bg: 'rgba(251,146,60,0.12)',  label: 'Rust' },
  go:         { color: '#34d399', bg: 'rgba(52,211,153,0.12)',  label: 'Go' },
  java:       { color: '#f87171', bg: 'rgba(248,113,113,0.12)', label: 'Java' },
  cpp:        { color: '#c084fc', bg: 'rgba(192,132,252,0.12)', label: 'C++' },
  c:          { color: '#c084fc', bg: 'rgba(192,132,252,0.12)', label: 'C' },
  text:       { color: '#94a3b8', bg: 'rgba(148,163,184,0.08)', label: 'Text' },
}
/* ── Pro Code Block ── */
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
    <div className="group/code my-4 overflow-hidden rounded-2xl shadow-2xl shadow-black/60"
         style={{ border: '1px solid rgba(255,255,255,0.07)', background: 'var(--surface-2)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5"
           style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-3">
          {/* Traffic lights */}
          <div className="flex gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full" style={{ background: '#ff5f57' }} />
            <div className="h-2.5 w-2.5 rounded-full" style={{ background: '#febc2e' }} />
            <div className="h-2.5 w-2.5 rounded-full" style={{ background: '#28c840' }} />
          </div>
          {/* Language badge */}
          <span className="rounded-md px-2 py-0.5 font-mono text-[10px] font-600 tracking-wider uppercase"
                style={{ color: meta.color, background: meta.bg, border: `1px solid ${meta.color}22` }}>
            {meta.label}
          </span>
          {/* Line count */}
          <span className="text-[10px] text-white/18 font-mono">
            {lineCount} {lineCount === 1 ? 'line' : 'lines'}
          </span>
        </div>
        {/* Copy button */}
        <button onClick={copy}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-500 transition-all duration-150"
          style={copied
            ? { color: '#4ade80', background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.25)' }
            : { color: 'rgba(255,255,255,0.28)', background: 'transparent', border: '1px solid transparent' }}>
          {copied
            ? <><Check size={10} /> Copied!</>
            : <><Copy size={10} /> Copy</>}
        </button>
      </div>
      {/* Code */}
      <SyntaxHighlighter
        language={rawLang}
        style={vscDarkPlus}
        customStyle={{
          margin: 0,
          background: 'var(--surface-2)',
          fontSize: '0.78rem',
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          padding: '1.15rem 1.25rem',
          lineHeight: '1.7',
          borderRadius: 0,
        }}
        showLineNumbers={lineCount > 4}
        lineNumberStyle={{
          color: 'rgba(255,255,255,0.1)',
          fontSize: '0.68rem',
          paddingRight: '1.25rem',
          minWidth: '2.5rem',
          userSelect: 'none',
          fontStyle: 'normal',
        }}
        wrapLongLines={false}
        PreTag="div"
      >
        {code}
      </SyntaxHighlighter>
    </div>
  )
}


/* ── Main bubble ── */
export default function MessageBubble({ message, index }) {
  const isUser = message.role === 'user'
  const [copied, setCopied] = useState(false)
  const [lightbox, setLightbox] = useState(null) // { src, name }

  // ✅ SAFETY GUARD — never pass undefined/null to ReactMarkdown
  const content = message?.content ?? ''

  const copyMsg = () => {
    navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className={`group flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      <div className={`relative mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${
        isUser
          ? 'bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-lg shadow-violet-900/40'
          : 'border border-white/8 bg-[#13131e] text-violet-400'
      }`}>
        {isUser ? 'U' : <Zap size={13} />}
        {!isUser && (
          <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-[#080810] bg-emerald-400" />
        )}
      </div>

      {/* Content */}
      <div className={`flex min-w-0 max-w-[80%] flex-col gap-2 ${isUser ? 'items-end' : 'items-start'}`}>
        {isUser ? (
          <div className="rounded-2xl rounded-tr-sm text-sm leading-relaxed text-white/90 shadow-lg shadow-violet-900/10 overflow-hidden"
               style={{ border: '1px solid rgba(139,92,246,0.2)' }}>

            {/* Attached images grid — shown above the text */}
            {message.images && message.images.length > 0 && (
              <div className={`p-2 ${message.images.length > 1 ? 'grid grid-cols-2 gap-1.5' : ''}`}
                   style={{ background: 'rgba(99,60,180,0.18)' }}>
                {message.images.map((img, i) => (
                  <div key={i}
                    className="group relative overflow-hidden cursor-zoom-in"
                    style={{ borderRadius: '10px', aspectRatio: '4/3' }}
                    onClick={() => setLightbox({ src: img.dataUrl || img, name: img.name || `Image ${i + 1}` })}
                  >
                    <img
                      src={img.dataUrl || img}
                      alt={img.name || `image ${i + 1}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      className="transition-transform duration-200 group-hover:scale-105"
                    />
                    {/* Zoom icon on hover */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                         style={{ background: 'rgba(0,0,0,0.35)', borderRadius: '10px' }}>
                      <div className="flex items-center justify-center rounded-full bg-white/20 backdrop-blur-sm"
                           style={{ width: '36px', height: '36px' }}>
                        <ZoomIn size={16} className="text-white" />
                      </div>
                    </div>
                    {/* gradient + filename */}
                    <div style={{
                      position: 'absolute', bottom: 0, left: 0, right: 0, height: '36px',
                      background: 'linear-gradient(to top, rgba(0,0,0,0.5), transparent)',
                      borderRadius: '0 0 10px 10px'
                    }} />
                    {img.name && (
                      <span className="absolute bottom-1.5 left-2 text-white/70 opacity-0 group-hover:opacity-100 transition-opacity"
                            style={{ fontSize: '9px', fontWeight: 500 }}>
                        {img.name}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Lightbox */}
            <AnimatePresence>
              {lightbox && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18 }}
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
                    {/* Close button */}
                    <button
                      onClick={() => setLightbox(null)}
                      className="absolute -top-3 -right-3 z-10 flex items-center justify-center rounded-full border border-white/15 bg-[#1c1c2e] text-white/60 hover:bg-white/10 hover:text-white transition-all shadow-xl"
                      style={{ width: '32px', height: '32px' }}
                    >
                      <X size={14} />
                    </button>

                    {/* Image */}
                    <img
                      src={lightbox.src}
                      alt={lightbox.name}
                      style={{
                        maxWidth: '88vw',
                        maxHeight: '82vh',
                        objectFit: 'contain',
                        borderRadius: '14px',
                        border: '1px solid rgba(255,255,255,0.1)',
                        boxShadow: '0 32px 80px rgba(0,0,0,0.7)',
                        display: 'block',
                      }}
                    />

                    {/* Filename bar */}
                    <div className="mt-3 flex items-center gap-2 rounded-lg px-3 py-1.5"
                         style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <span className="text-white/50" style={{ fontSize: '11px' }}>{lightbox.name}</span>
                      <span className="text-white/20" style={{ fontSize: '10px' }}>· click outside to close</span>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Text content */}
            {content && (
              <div className="px-4 py-3 whitespace-pre-wrap"
                   style={{ background: 'linear-gradient(135deg, rgba(99,60,180,0.22), rgba(67,44,140,0.18))' }}>
                {content}
              </div>
            )}
          </div>
        ) : (
          <div className="relative w-full">
            {/* ── Copy response button — top-right, appears on hover ── */}
            <div className="absolute -top-8 right-0 z-10 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
              <button
                onClick={copyMsg}
                className="flex items-center gap-1.5 rounded-lg border border-white/8 bg-[#13131e] px-2.5 py-1.5 text-[11px] font-500 text-white/40 shadow-lg backdrop-blur transition-all hover:border-white/14 hover:bg-[#1a1a26] hover:text-white/80"
              >
                {copied
                  ? <span className="flex items-center gap-1.5 text-emerald-400"><Check size={10} /> Copied</span>
                  : <span className="flex items-center gap-1.5"><Copy size={10} /> Copy response</span>
                }
              </button>
            </div>

            <div className="prose-chat text-sm">
              {content ? (
                <ErrorBoundary>
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      code({ node, inline, className, children, ...props }) {
                        if (inline) return <code className={className} {...props}>{children}</code>
                        return <CodeBlock className={className}>{children}</CodeBlock>
                      },
                    }}
                  >
                    {typeof content === 'string'
                      ? content
                      : JSON.stringify(content)}
                  </ReactMarkdown>
                </ErrorBoundary>
              ) : (
                <span className="text-white/30 italic">Empty response</span>
              )}
            </div>

            {/* Footer */}
            {message.token_count > 0 && (
              <div className="mt-2.5">
                <span className="text-[11px] text-white/18">{message.token_count.toLocaleString()} tokens</span>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}
