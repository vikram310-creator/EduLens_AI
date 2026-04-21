import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
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
                  return (
                    <div className="my-4 overflow-hidden rounded-xl border border-white/8 shadow-2xl shadow-black/40">
                      <div className="flex items-center gap-3 border-b border-white/6 bg-[#13131e] px-4 py-2.5">
                        <div className="flex gap-1.5">
                          <div className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]/70" />
                          <div className="h-2.5 w-2.5 rounded-full bg-[#febc2e]/70" />
                          <div className="h-2.5 w-2.5 rounded-full bg-[#28c840]/70" />
                        </div>
                        <span className="font-mono text-[11px] font-500 uppercase tracking-wide text-white/25">{language}</span>
                      </div>
                      <SyntaxHighlighter
                        language={language}
                        style={oneDark}
                        customStyle={{ margin:0, background:'#0e0e18', fontSize:'0.775rem', fontFamily:"'JetBrains Mono',monospace", padding:'1.1rem 1.25rem', lineHeight:'1.65' }}
                        PreTag="div"
                      >
                        {String(children).trimEnd()}
                      </SyntaxHighlighter>
                    </div>
                  )
                },
              }}
            >
              {content}
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
