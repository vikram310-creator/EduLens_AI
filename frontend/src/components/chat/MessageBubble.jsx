import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Copy, Check, Zap } from 'lucide-react'
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
         style={{ border: '1px solid rgba(255,255,255,0.07)', background: '#0a0a12' }}>
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
          background: '#0a0a12',
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
          <div className="rounded-2xl rounded-tr-sm bg-gradient-to-br from-violet-600/30 to-indigo-700/25 px-4 py-3 text-sm leading-relaxed text-white/90 border border-violet-500/20 shadow-lg shadow-violet-900/10">
            {/* Attached images */}
            {message.images && message.images.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {message.images.map((img, i) => (
                  <img
                    key={i}
                    src={img.dataUrl || img}
                    alt={img.name || 'attachment'}
                    className="max-h-40 max-w-[200px] rounded-lg border border-white/10 object-cover shadow"
                  />
                ))}
              </div>
            )}
            {content && <p className="whitespace-pre-wrap">{content}</p>}
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
