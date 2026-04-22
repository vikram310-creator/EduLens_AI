import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Sidebar from './components/sidebar/Sidebar'
import ChatPage from './pages/ChatPage'
import { useChatStore } from './store/chatStore'

const PERSONAS = [
  { id: 'assistant', icon: '✦', label: 'Assistant', desc: 'General purpose AI helper',  color: 'from-violet-600/20 to-indigo-600/10', ring: 'ring-violet-500/20' },
  { id: 'coder',     icon: '⌥', label: 'Coder',     desc: 'Expert software engineer',   color: 'from-sky-600/20 to-blue-700/10',     ring: 'ring-sky-500/20'    },
  { id: 'teacher',   icon: '◈', label: 'Teacher',   desc: 'Patient, clear educator',    color: 'from-emerald-600/20 to-teal-700/10', ring: 'ring-emerald-500/20'},
  { id: 'writer',    icon: '✐', label: 'Writer',    desc: 'Creative writing partner',   color: 'from-amber-600/20 to-orange-700/10', ring: 'ring-amber-500/20'  },
  { id: 'analyst',   icon: '◎', label: 'Analyst',   desc: 'Data-driven strategist',     color: 'from-rose-600/20 to-pink-700/10',    ring: 'ring-rose-500/20'   },
]

export default function App() {
  const { loadSessions, activeSessionId, createSession } = useChatStore()
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  useEffect(() => { loadSessions() }, [])

  const closeMobileSidebar = () => setMobileSidebarOpen(false)

  return (
    <div className="noise flex h-screen w-screen overflow-hidden" style={{ background: '#080810' }}>
      {/* Global ambient blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-56 -left-40 h-[500px] w-[500px] rounded-full bg-violet-900/8 blur-[130px]" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-indigo-900/6 blur-[100px]" />
      </div>

      {/* Desktop sidebar — always visible md+ */}
      <div className="hidden lg:flex h-full flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile backdrop */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={closeMobileSidebar}
          />
        )}
      </AnimatePresence>

      {/* Mobile sidebar drawer */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <motion.div
            key="mobile-sidebar"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            className="fixed inset-y-0 left-0 z-40 lg:hidden"
            style={{ width: '268px' }}
          >
            <Sidebar onNavigate={closeMobileSidebar} />
          </motion.div>
        )}
      </AnimatePresence>

      <main className="relative flex flex-1 flex-col overflow-hidden min-w-0">
        <AnimatePresence>
          {activeSessionId ? (
            <motion.div
              key={activeSessionId}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="absolute inset-0 flex flex-col"
            >
              <ChatPage onMenuOpen={() => setMobileSidebarOpen(true)} />
            </motion.div>
          ) : (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 flex flex-col items-center justify-center px-6"
            >
              {/* Mobile menu button on welcome screen */}
              <button
                onClick={() => setMobileSidebarOpen(true)}
                className="absolute top-4 left-4 lg:hidden flex h-9 w-9 items-center justify-center rounded-xl border border-white/8 bg-white/4 text-white/50 hover:bg-white/8 hover:text-white transition"
                aria-label="Open menu"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>

              <div className="flex w-full max-w-lg flex-col items-center gap-10">
                {/* Hero */}
                <div className="text-center">
                  <motion.div
                    animate={{ y: [0, -8, 0] }}
                    transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
                    className="mb-5 inline-flex h-[72px] w-[72px] items-center justify-center rounded-[22px] border border-violet-500/25 bg-gradient-to-br from-violet-600/25 to-indigo-700/20 text-[32px] shadow-2xl shadow-violet-900/30"
                  >
                    ⚡
                  </motion.div>
                  <h1 className="font-display text-4xl font-800 tracking-tight text-white">EduLens_AI</h1>
                  <p className="mt-2 text-[15px] text-white/30">AI at the speed of thought. Choose a mode to begin.</p>
                </div>

                {/* Persona picker */}
                <div className="grid w-full grid-cols-2 gap-2.5 sm:grid-cols-3">
                  {PERSONAS.map((p, i) => (
                    <motion.button
                      key={p.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + i * 0.07, ease: [0.22, 1, 0.36, 1] }}
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => createSession(p.id)}
                      className={`group flex flex-col items-start gap-2.5 rounded-2xl border border-white/6 bg-gradient-to-br ${p.color} ring-1 ${p.ring} p-4 text-left transition-all hover:border-white/12 hover:ring-2`}
                    >
                      <span className="text-[22px] leading-none">{p.icon}</span>
                      <div>
                        <div className="font-display text-[13px] font-700 text-white">{p.label}</div>
                        <div className="mt-0.5 text-[11px] leading-snug text-white/35">{p.desc}</div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}
