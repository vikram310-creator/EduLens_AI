import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Copy, Check, Zap } from 'lucide-react'
import ErrorBoundary from '../ErrorBoundary'

/* ── Code block ── */
function CodeBlock({ children, className }) {
  const [copied, setCopied] = useState(false)
  const language = className?.replace('language-', '') || 'text'
  const code = String(children).trimEnd()

  const copy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="my-4 overflow-hidden rounded-xl border border-white/8 shadow-2xl shadow-black/40">
      <div className="flex items-center justify-between border-b border-white/6 bg-[#13131e] px-4 py-2.5">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]/70" />
            <div className="h-2.5 w-2.5 rounded-full bg-[#febc2e]/70" />
            <div className="h-2.5 w-2.5 rounded-full bg-[#28c840]/70" />
          </div>
          <span className="font-mono text-[11px] tracking-wide text-white/25 uppercase">{language}</span>
        </div>
        <button
          onClick={copy}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] text-white/30 transition-all hover:bg-white/8 hover:text-white/80"
        >
          {copied
            ? <span className="flex items-center gap-1.5 text-emerald-400"><Check size={10} /> Copied!</span>
            : <span className="flex items-center gap-1.5"><Copy size={10} /> Copy</span>
          }
        </button>
      </div>
      <SyntaxHighlighter
        language={language}
        style={oneDark}
        customStyle={{
          margin: 0,
          background: '#0e0e18',
          fontSize: '0.775rem',
          fontFamily: "'JetBrains Mono', monospace",
          padding: '1.1rem 1.25rem',
          lineHeight: '1.65',
        }}
        showLineNumbers={code.split('\n').length > 6}
        lineNumberStyle={{ color: 'rgba(255,255,255,0.12)', fontSize: '0.7rem', marginRight: '0.75rem', userSelect: 'none' }}
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
                    {content}
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
