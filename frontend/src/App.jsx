import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Sidebar from './components/sidebar/Sidebar'
import ChatPage from './pages/ChatPage'
import LandingPage from './pages/LandingPage'
import { useChatStore } from './store/chatStore'
import { useAuth } from './context/AuthContext'
import AuthModal from './components/auth/AuthModal'
import ProfileDropdown from './components/auth/ProfileDropdown'

const PERSONAS = [
  { id: 'assistant', icon: '✦', label: 'Assistant', desc: 'General purpose AI helper',  color: 'from-violet-600/20 to-indigo-600/10', ring: 'ring-violet-500/20' },
  { id: 'coder',     icon: '⌥', label: 'Coder',     desc: 'Expert software engineer',   color: 'from-sky-600/20 to-blue-700/10',     ring: 'ring-sky-500/20'    },
  { id: 'teacher',   icon: '◈', label: 'Teacher',   desc: 'Patient, clear educator',    color: 'from-emerald-600/20 to-teal-700/10', ring: 'ring-emerald-500/20'},
  { id: 'writer',    icon: '✐', label: 'Writer',    desc: 'Creative writing partner',   color: 'from-amber-600/20 to-orange-700/10', ring: 'ring-amber-500/20'  },
  { id: 'analyst',   icon: '◎', label: 'Analyst',   desc: 'Data-driven strategist',     color: 'from-rose-600/20 to-pink-700/10',    ring: 'ring-rose-500/20'   },
]

// ── Persist which view the user was on ────────────────────────────────────────
const VIEW_KEY = 'edulens_view'

function getInitialView() {
  try {
    return localStorage.getItem(VIEW_KEY) || 'landing'
  } catch {
    return 'landing'
  }
}

export default function App() {
  const { loadSessions, activeSessionId, createSession, clearSessionState, clearActiveSession } = useChatStore()
  const { user, loading, requireAuth, setShowAuth, setAuthIntent } = useAuth()
  const [view, setView] = useState(getInitialView)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  // Persist view to localStorage
  const navigateTo = (v) => {
    try { localStorage.setItem(VIEW_KEY, v) } catch {}
    setView(v)
  }

  // ── On mount: if user is already logged in, restore the saved view ──────────
  useEffect(() => {
    if (!loading && user) {
      // User is logged in — restore their last view (app or landing)
      const savedView = localStorage.getItem(VIEW_KEY) || 'landing'
      if (savedView === 'app') {
        setView('app')
        loadSessions()
      }
    }
  }, [loading, user]) // eslint-disable-line

  // ── When user logs in during session, load their data and go to app ─────────
  useEffect(() => {
    if (user && view === 'app') {
      loadSessions()
    }
  }, [user]) // eslint-disable-line

  // ── When user logs out, clear session state and go to landing ───────────────
  // IMPORTANT: Only fire when loading=false to avoid redirecting during token
  // verification on page reload (when user is momentarily null before /auth/me responds)
  useEffect(() => {
    if (!loading && !user) {
      const savedView = localStorage.getItem(VIEW_KEY) || 'landing'
      // Only clear/redirect if we were actually in the app — not on initial landing
      if (savedView === 'app') {
        clearSessionState()
        navigateTo('landing')
      }
    }
  }, [user, loading]) // eslint-disable-line

  // ── Loading spinner ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="app-bg flex h-screen w-screen items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          className="h-6 w-6 rounded-full border-2 border-violet-500/30 border-t-violet-500" />
      </div>
    )
  }

  // ── Landing page ──────────────────────────────────────────────────────────
  if (view === 'landing') {
    return (
      <>
        <div style={{ height: '100vh', overflowY: 'auto', overflowX: 'hidden' }}>
          <LandingPage onEnterApp={() => {
            if (user) {
              navigateTo('app')
              loadSessions()
            } else {
              setAuthIntent(() => () => {
                navigateTo('app')
                loadSessions()
              })
              setShowAuth(true)
            }
          }} />
        </div>
        <AuthModal />
      </>
    )
  }

  // ── Chat App ──────────────────────────────────────────────────────────────
  const closeMobileSidebar = () => setMobileSidebarOpen(false)
  const handlePersonaClick = (personaId) => requireAuth(() => createSession(personaId))

  return (
    <div className="app-bg noise flex h-screen w-screen overflow-hidden">
      {/* Ambient blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="orb-1" style={{ width: '800px', height: '800px', top: '-20%', left: '-10%' }} />
        <div className="orb-1" style={{ width: '600px', height: '600px', bottom: '10%', right: '-10%', animationDelay: '-5s' }} />
      </div>

      {/* Desktop sidebar */}
      {user && (
        <div className="hidden lg:flex h-full flex-shrink-0">
          <Sidebar onBackToLanding={() => clearActiveSession()} onAbout={() => navigateTo('landing')} />
        </div>
      )}

      {/* Mobile backdrop */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <motion.div key="backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={closeMobileSidebar} />
        )}
      </AnimatePresence>

      {/* Mobile sidebar drawer */}
      <AnimatePresence>
        {mobileSidebarOpen && user && (
          <motion.div key="mobile-sidebar" initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            className="fixed inset-y-0 left-0 z-40 lg:hidden" style={{ width: '268px' }}>
            <Sidebar onNavigate={closeMobileSidebar} onBackToLanding={() => { clearActiveSession(); closeMobileSidebar() }} onAbout={() => { navigateTo('landing'); closeMobileSidebar() }} />
          </motion.div>
        )}
      </AnimatePresence>

      <main className="relative flex flex-1 flex-col overflow-hidden min-w-0">
        <AnimatePresence>
          {user && activeSessionId ? (
            <motion.div key={activeSessionId} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }} className="absolute inset-0 flex flex-col">
              <ChatPage onMenuOpen={() => setMobileSidebarOpen(true)} />
            </motion.div>
          ) : (
            <motion.div key="welcome" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 flex flex-col items-center justify-center px-6">

              {/* Mobile top bar */}
              <div className="absolute top-4 left-4 right-4 flex items-center justify-between lg:hidden">
                {user ? (
                  <button onClick={() => setMobileSidebarOpen(true)}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/8 bg-white/4 text-white/50 hover:bg-white/8 hover:text-white transition">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </button>
                ) : <div />}
                {user && <ProfileDropdown onAbout={() => navigateTo('landing')} />}
              </div>

              {/* Desktop top-right — removed per design update */}

              <div className="flex w-full max-w-lg flex-col items-center gap-10">
                {/* Hero */}
                <div className="text-center">
                  <motion.button
                    onClick={() => clearActiveSession()}
                    animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
                    title="Back to mode picker"
                    className="mb-5 inline-flex h-[72px] w-[72px] items-center justify-center rounded-[22px] border border-violet-500/25 bg-gradient-to-br from-violet-600/25 to-indigo-700/20 text-[32px] shadow-2xl shadow-violet-900/30 hover:border-violet-400/50 hover:shadow-violet-700/40 transition-all duration-200 cursor-pointer"
                  >
                    ⚡
                  </motion.button>
                  <h1
                    onClick={() => clearActiveSession()}
                    className="glow-text font-display text-5xl font-900 tracking-tight cursor-pointer hover:text-violet-300 transition-colors duration-200"
                    style={{ color: 'var(--text-1)' }}
                    title="Back to mode picker"
                  >
                    EduLens_AI
                  </h1>
                  <p className="mt-2 text-[15px]" style={{ color: 'var(--text-3)' }}>
                    {user ? 'Choose a mode to begin your session.' : 'Sign in to start chatting with AI.'}
                  </p>
                </div>

                {/* Persona picker */}
                <div className="grid w-full grid-cols-2 gap-2.5 sm:grid-cols-3">
                  {PERSONAS.map((p, i) => (
                    <motion.button key={p.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + i * 0.07, ease: [0.22, 1, 0.36, 1] }}
                      whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                      onClick={() => handlePersonaClick(p.id)}
                      className={`group flex flex-col items-start gap-2.5 insane-card p-5 text-left transition-all hover:scale-105`}>
                      <span className="text-[22px] leading-none">{p.icon}</span>
                      <div>
                        <div className="font-display text-[13px] font-700" style={{ color: 'var(--text-1)' }}>{p.label}</div>
                        <div className="mt-0.5 text-[11px] leading-snug" style={{ color: 'var(--text-3)' }}>{p.desc}</div>
                      </div>
                    </motion.button>
                  ))}
                </div>

                {/* Sign in CTA for guests */}
                {!user && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                    className="flex flex-col items-center gap-3">
                    <button onClick={() => setShowAuth(true)} className="btn-insane flex items-center justify-center gap-2 px-8 py-3.5 text-base font-600 text-white w-full">
                      Sign in to start chatting
                    </button>
                    <p className="text-xs" style={{ color: 'var(--text-3)' }}>Your chats are saved across sessions</p>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <AuthModal />
    </div>
  )
}
