import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Zap } from 'lucide-react'
import ErrorBoundary from '../ErrorBoundary'

export default function StreamingBubble({ content }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-3"
    >
      {/* Avatar with spinning ring */}
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

      {/* Content */}
      <div className="min-w-0 max-w-[80%]">
        <div className="prose-chat text-sm">
          <ErrorBoundary>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ node, inline, className, children, ...props }) {
                  const language = className?.replace('language-', '') || 'text'
                  if (inline) return <code className={className} {...props}>{children}</code>
                  const rawLang = language.toLowerCase()
                  const sbMeta = {
                    python: { color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', label: 'Python' },
                    javascript: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', label: 'JavaScript' },
                    typescript: { color: '#38bdf8', bg: 'rgba(56,189,248,0.12)', label: 'TypeScript' },
                    jsx: { color: '#61dafb', bg: 'rgba(97,218,251,0.12)', label: 'JSX' },
                    bash: { color: '#4ade80', bg: 'rgba(74,222,128,0.12)', label: 'Bash' },
                    json: { color: '#fbbf24', bg: 'rgba(251,191,36,0.12)', label: 'JSON' },
                    css: { color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', label: 'CSS' },
                    html: { color: '#fb923c', bg: 'rgba(251,146,60,0.12)', label: 'HTML' },
                  }[rawLang] || { color: '#94a3b8', bg: 'rgba(148,163,184,0.08)', label: rawLang.toUpperCase() }
                  return (
                    <div className="my-4 overflow-hidden rounded-2xl shadow-2xl shadow-black/60"
                         style={{ border: '1px solid rgba(255,255,255,0.07)', background: 'var(--surface-2)' }}>
                      <div className="flex items-center gap-3 px-4 py-2.5"
                           style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        <div className="flex gap-1.5">
                          <div className="h-2.5 w-2.5 rounded-full" style={{ background: '#ff5f57' }} />
                          <div className="h-2.5 w-2.5 rounded-full" style={{ background: '#febc2e' }} />
                          <div className="h-2.5 w-2.5 rounded-full" style={{ background: '#28c840' }} />
                        </div>
                        <span className="rounded-md px-2 py-0.5 font-mono text-[10px] font-600 tracking-wider uppercase"
                              style={{ color: sbMeta.color, background: sbMeta.bg, border: `1px solid ${sbMeta.color}22` }}>
                          {sbMeta.label}
                        </span>
                      </div>
                      <SyntaxHighlighter
                        language={rawLang}
                        style={vscDarkPlus}
                        customStyle={{
                          margin: 0, background: 'var(--surface-2)',
                          fontSize: '0.78rem',
                          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                          padding: '1.15rem 1.25rem', lineHeight: '1.7',
                        }}
                        PreTag="div"
                      >
                        {String(children).trimEnd()}
                      </SyntaxHighlighter>
                    </div>
                  )
                },
              }}
            >
              {typeof content === 'string'
                ? content
                : JSON.stringify(content)}
            </ReactMarkdown>
          </ErrorBoundary>
        </div>
        {/* Blinking cursor */}
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ repeat: Infinity, duration: 0.55 }}
          className="ml-0.5 inline-block h-[15px] w-[2px] rounded-full bg-violet-400 align-middle"
        />
      </div>
    </motion.div>
  )
}
