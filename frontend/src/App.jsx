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

  // ── On mount: if user is already logged in, take them straight to the app ──
  useEffect(() => {
    if (!loading && user) {
      // User is logged in — always go to app (unless they explicitly went to landing)
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
  useEffect(() => {
    if (!loading && !user) {
      clearSessionState()
      navigateTo('landing')
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
        <div className="absolute -top-56 -left-40 h-[500px] w-[500px] rounded-full bg-violet-900/8 blur-[130px]" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-indigo-900/6 blur-[100px]" />
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
                    className="font-display text-4xl font-800 tracking-tight text-white cursor-pointer hover:text-violet-300 transition-colors duration-200"
                    title="Back to mode picker"
                  >
                    EduLens_AI
                  </h1>
                  <p className="mt-2 text-[15px] text-white/30">
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
                      className={`group flex flex-col items-start gap-2.5 rounded-2xl border border-white/6 bg-gradient-to-br ${p.color} ring-1 ${p.ring} p-4 text-left transition-all hover:border-white/12 hover:ring-2`}>
                      <span className="text-[22px] leading-none">{p.icon}</span>
                      <div>
                        <div className="font-display text-[13px] font-700 text-white">{p.label}</div>
                        <div className="mt-0.5 text-[11px] leading-snug text-white/35">{p.desc}</div>
                      </div>
                    </motion.button>
                  ))}
                </div>

                {/* Sign in CTA for guests */}
                {!user && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                    className="flex flex-col items-center gap-3">
                    <button onClick={() => setShowAuth(true)}
                      className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-2.5 text-sm font-600 text-white shadow-lg shadow-violet-900/30 hover:from-violet-500 hover:to-indigo-500 transition active:scale-[0.98]">
                      Sign in to start chatting
                    </button>
                    <p className="text-xs text-white/25">Your chats are saved across sessions</p>
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
