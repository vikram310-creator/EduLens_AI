import { useState, useEffect, useRef } from 'react'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import {
  Zap, MessageSquare, Shield, Cpu, BookOpen, PenTool, BarChart2,
  ChevronRight, Star, Check, Mail, Twitter, Github, Menu, X,
  ArrowRight, Sparkles, Globe, Lock, Headphones
} from 'lucide-react'

/* ── Data ──────────────────────────────────────────────────────────────────── */
const NAV_LINKS = [
  { label: 'Features',  href: '#features'  },
  { label: 'How it works', href: '#how'    },
  { label: 'Pricing',   href: '#pricing'   },
  { label: 'About',     href: '#about'     },
  { label: 'Contact',   href: '#contact'   },
]

const FEATURES = [
  { icon: Cpu,         color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)', title: 'Multiple AI Models',       desc: 'Switch between LLaMA 3.1, 3.3 70B, and Llama 4 Scout for the right balance of speed, intelligence, and vision.' },
  { icon: BookOpen,    color: '#06b6d4', bg: 'rgba(6,182,212,0.12)',  title: 'Educator Mode',             desc: 'Structured learning with step-by-step explanations, analogies, and adaptive teaching that meets you where you are.' },
  { icon: PenTool,     color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', title: 'Creative Writer',           desc: 'Craft compelling narratives, refine prose, and explore your imagination with a creative AI partner by your side.' },
  { icon: MessageSquare, color: '#10b981', bg: 'rgba(16,185,129,0.12)', title: 'Persistent Chat History', desc: 'Every conversation saved. Log back in on any device and pick up exactly where you left off — zero context lost.' },
  { icon: Shield,      color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', title: 'Secure & Private',          desc: 'JWT-based auth, bcrypt passwords, and Google OAuth. Your data is yours — never sold, never shared.' },
  { icon: BarChart2,   color: '#f43f5e', bg: 'rgba(244,63,94,0.12)',  title: 'Analyst Intelligence',      desc: 'Data-driven insights, structured analysis, and strategic breakdowns that turn raw information into clear decisions.' },
]

const STEPS = [
  { n: '01', title: 'Create your account',    desc: 'Sign up with Google in one click or use email/password. Takes under 10 seconds.' },
  { n: '02', title: 'Choose your AI persona', desc: 'Pick from Assistant, Coder, Teacher, Writer, or Analyst — each tuned for its purpose.' },
  { n: '03', title: 'Start a conversation',   desc: 'Type naturally. Your chats are saved forever and sync across every device you own.' },
]

const TESTIMONIALS = [
  { name: 'Priya Sharma',    role: 'CS Student',         stars: 5, text: 'The Teacher mode is incredible. It explains algorithms like I\'m talking to my smartest friend, not a textbook.' },
  { name: 'Marcus Webb',     role: 'Freelance Developer', stars: 5, text: 'Coder mode caught a memory leak I\'d been hunting for 3 days. Within seconds. Absolutely wild.' },
  { name: 'Aisha Nwosu',     role: 'Content Strategist',  stars: 5, text: 'Writer mode transformed my content workflow. I ship 3× more with the same quality. Game changer.' },
]

const PLANS = [
  {
    name: 'Free',
    price: '₹0',
    period: 'forever',
    accent: '#8b5cf6',
    features: ['LLaMA 3.1 8B model', '20 messages / day', 'Chat history (7 days)', 'All 5 AI personas'],
    cta: 'Get started free',
  },
  {
    name: 'Pro',
    price: '₹499',
    period: '/month',
    accent: '#06b6d4',
    highlight: true,
    features: ['All models including 70B', 'Unlimited messages', 'Permanent chat history', 'Image / vision support', 'Priority response speed', 'Export conversations'],
    cta: 'Start free trial',
  },
  {
    name: 'Teams',
    price: '₹1,499',
    period: '/month',
    accent: '#f59e0b',
    features: ['Everything in Pro', 'Up to 10 seats', 'Shared conversation library', 'Admin dashboard', 'Dedicated support', 'Custom system prompts'],
    cta: 'Contact sales',
  },
]

const FAQS = [
  { q: 'Is my data safe?',                   a: 'Yes. All passwords are bcrypt-hashed. Tokens are JWT-signed and expire. We never sell or share your conversations.' },
  { q: 'Can I use it on mobile?',            a: 'EduLens AI is fully responsive and works beautifully on every screen size from phone to ultrawide monitor.' },
  { q: 'Which AI model should I choose?',    a: 'LLaMA 3.1 8B is fastest for everyday tasks. LLaMA 3.3 70B is smarter for complex reasoning. Llama 4 Scout handles images.' },
  { q: 'Is there a free plan?',              a: 'Yes — free forever with 20 messages per day and 7-day history. No credit card required.' },
  { q: 'How do I export my chats?',          a: 'Every session has an "Export as JSON" button in the sidebar. Download anytime, own your data.' },
]

/* ── Sub-components ─────────────────────────────────────────────────────────── */
function GradientOrb({ style, className }) {
  return <div className={`pointer-events-none absolute rounded-full blur-[120px] ${className}`} style={style} />
}

function StarRating({ stars }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: stars }).map((_, i) => (
        <Star key={i} size={12} fill="#f59e0b" className="text-amber-400" />
      ))}
    </div>
  )
}

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
      <button onClick={() => setOpen(o => !o)}
        className="flex w-full items-center justify-between py-5 text-left gap-4">
        <span className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>{q}</span>
        <ChevronRight size={16} className="shrink-0 transition-transform duration-200"
          style={{ color: 'var(--text-3)', transform: open ? 'rotate(90deg)' : 'none' }} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }} className="overflow-hidden">
            <p className="pb-5 text-sm leading-relaxed" style={{ color: 'var(--text-2)' }}>{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ── Main component ─────────────────────────────────────────────────────────── */
export default function LandingPage({ onEnterApp }) {
  const { user, setShowAuth } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' })
  const [contactSent, setContactSent] = useState(false)
  const heroRef = useRef(null)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  const handleCTA = () => {
    if (user) onEnterApp()
    else setShowAuth(true)
  }

  const handleContactSubmit = (e) => {
    e.preventDefault()
    setContactSent(true)
    setContactForm({ name: '', email: '', message: '' })
    setTimeout(() => setContactSent(false), 4000)
  }

  const scrollTo = (href) => {
    setMobileMenuOpen(false)
    const el = document.querySelector(href)
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden"
      style={{ background: '#080810', fontFamily: "'DM Sans', sans-serif", color: '#f1f0f8' }}>

      {/* Global orbs */}
      <GradientOrb style={{ width: 600, height: 600, top: -200, left: '50%', transform: 'translateX(-50%)', background: 'rgba(139,92,246,0.07)' }} />
      <GradientOrb style={{ width: 400, height: 400, top: '40vh', right: -100, background: 'rgba(6,182,212,0.05)' }} />
      <GradientOrb style={{ width: 500, height: 500, bottom: '20vh', left: -150, background: 'rgba(139,92,246,0.05)' }} />

      {/* ── Navbar ─────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          background: scrolled ? 'rgba(8,8,16,0.92)' : 'transparent',
          backdropFilter: scrolled ? 'blur(20px)' : 'none',
          borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent',
        }}>
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          {/* Logo */}
          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-2.5 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl text-lg"
              style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', boxShadow: '0 4px 16px rgba(139,92,246,0.35)' }}>
              ⚡
            </div>
            <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '1.05rem', letterSpacing: '-0.01em' }}>
              EduLens<span style={{ color: '#8b5cf6' }}>_AI</span>
            </span>
          </button>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map(l => (
              <button key={l.label} onClick={() => scrollTo(l.href)}
                className="text-sm transition-colors hover:text-white"
                style={{ color: 'rgba(255,255,255,0.45)' }}>
                {l.label}
              </button>
            ))}
          </div>

          {/* CTA */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <button onClick={onEnterApp}
                className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}>
                Open App <ArrowRight size={14} />
              </button>
            ) : (
              <>
                <button onClick={() => setShowAuth(true)}
                  className="text-sm transition-colors hover:text-white"
                  style={{ color: 'rgba(255,255,255,0.5)' }}>
                  Sign in
                </button>
                <button onClick={() => setShowAuth(true)}
                  className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', boxShadow: '0 4px 16px rgba(139,92,246,0.3)' }}>
                  Get started free
                </button>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(o => !o)}
            style={{ color: 'rgba(255,255,255,0.6)' }}>
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="md:hidden border-t px-6 py-4 flex flex-col gap-3"
              style={{ background: 'rgba(8,8,16,0.97)', borderColor: 'rgba(255,255,255,0.06)' }}>
              {NAV_LINKS.map(l => (
                <button key={l.label} onClick={() => scrollTo(l.href)}
                  className="py-2 text-sm text-left" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  {l.label}
                </button>
              ))}
              <button onClick={handleCTA}
                className="mt-2 rounded-xl py-2.5 text-sm font-semibold text-white"
                style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}>
                {user ? 'Open App' : 'Get started free'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section ref={heroRef} className="relative flex min-h-screen flex-col items-center justify-center px-6 pt-16 text-center">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.22,1,0.36,1] }}
          className="max-w-4xl">

          {/* Badge */}
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-medium mb-8"
            style={{ borderColor: 'rgba(139,92,246,0.3)', background: 'rgba(139,92,246,0.08)', color: '#c4b5fd' }}>
            <Sparkles size={11} />
            Powered by LLaMA 3.3 70B & Llama 4 Scout
          </motion.div>

          {/* Headline */}
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 'clamp(2.5rem, 7vw, 5rem)', lineHeight: 1.05, letterSpacing: '-0.03em' }}>
            AI that thinks{' '}
            <span style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              at your speed
            </span>
          </h1>

          <p className="mt-6 text-lg leading-relaxed max-w-2xl mx-auto" style={{ color: 'rgba(255,255,255,0.45)' }}>
            EduLens AI gives you a personal AI tutor, coder, writer, and analyst —
            all in one place. Every conversation saved. Every insight remembered.
          </p>

          {/* CTA buttons */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
              onClick={handleCTA}
              className="flex items-center gap-2 rounded-2xl px-7 py-3.5 text-base font-semibold text-white"
              style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', boxShadow: '0 8px 32px rgba(139,92,246,0.35)' }}>
              {user ? 'Open App' : 'Start for free'} <ArrowRight size={16} />
            </motion.button>
            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
              onClick={() => scrollTo('#features')}
              className="flex items-center gap-2 rounded-2xl border px-7 py-3.5 text-base font-medium transition-colors hover:border-white/20"
              style={{ borderColor: 'rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.55)' }}>
              See features
            </motion.button>
          </div>

          {/* Social proof */}
          <div className="mt-12 flex items-center justify-center gap-6 flex-wrap">
            <div className="flex -space-x-2">
              {['#8b5cf6','#06b6d4','#f59e0b','#10b981','#f43f5e'].map((c,i) => (
                <div key={i} className="h-8 w-8 rounded-full border-2 border-[#080810] flex items-center justify-center text-xs font-bold text-white"
                  style={{ background: c, zIndex: 5-i }}>
                  {String.fromCharCode(65+i)}
                </div>
              ))}
            </div>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>
              <span style={{ color: '#c4b5fd', fontWeight: 600 }}>2,400+</span> learners & builders trust EduLens
            </p>
          </div>
        </motion.div>

        {/* Hero visual — chat preview */}
        <motion.div initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.8, ease: [0.22,1,0.36,1] }}
          className="relative mt-20 w-full max-w-3xl">
          <div className="absolute inset-0 rounded-3xl blur-[60px] opacity-30"
            style={{ background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)' }} />
          <div className="relative rounded-3xl border overflow-hidden"
            style={{ background: 'rgba(15,15,26,0.9)', borderColor: 'rgba(255,255,255,0.08)', boxShadow: '0 40px 80px rgba(0,0,0,0.5)' }}>
            {/* Fake title bar */}
            <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <div className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
              <div className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
              <div className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
              <span className="ml-3 text-xs" style={{ color: 'rgba(255,255,255,0.25)', fontFamily: "'JetBrains Mono', monospace" }}>
                EduLens_AI — Teacher mode
              </span>
            </div>
            {/* Fake messages */}
            <div className="p-6 flex flex-col gap-4">
              {[
                { role: 'user', text: 'Explain binary search like I\'m 12 years old' },
                { role: 'ai',   text: 'Imagine you\'re looking for a word in a dictionary. Instead of starting at page 1, you flip to the middle. Is your word before or after? You\'ve just eliminated half the book! Binary search does exactly this — each step cuts the remaining options in half, finding anything in milliseconds even across millions of items.' },
                { role: 'user', text: 'Can you show me the code?' },
              ].map((m, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: m.role === 'user' ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 + i * 0.15 }}
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className="max-w-sm rounded-2xl px-4 py-2.5 text-sm leading-relaxed"
                    style={{
                      background: m.role === 'user' ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.05)',
                      border: `1px solid ${m.role === 'user' ? 'rgba(139,92,246,0.3)' : 'rgba(255,255,255,0.07)'}`,
                      color: m.role === 'user' ? '#ddd6fe' : 'rgba(255,255,255,0.75)',
                      textAlign: 'left',
                    }}>
                    {m.text}
                  </div>
                </motion.div>
              ))}
              {/* Typing indicator */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}
                className="flex justify-start">
                <div className="flex items-center gap-1.5 rounded-2xl px-4 py-3"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  {[0,1,2].map(i => (
                    <motion.div key={i} animate={{ y: [0,-4,0] }}
                      transition={{ repeat: Infinity, duration: 0.8, delay: i*0.15 }}
                      className="h-1.5 w-1.5 rounded-full bg-violet-400" />
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 2 }}
          className="mt-16 flex flex-col items-center gap-2 opacity-25">
          <div className="h-10 w-6 rounded-full border-2 flex items-start justify-center pt-2"
            style={{ borderColor: 'rgba(255,255,255,0.3)' }}>
            <div className="h-2 w-0.5 rounded-full bg-white" />
          </div>
        </motion.div>
      </section>

      {/* ── Features ───────────────────────────────────────────────────────── */}
      <section id="features" className="py-32 px-6">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#8b5cf6' }}>Features</p>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 'clamp(2rem, 4vw, 3rem)', letterSpacing: '-0.02em' }}>
              Everything you need to think smarter
            </h2>
            <p className="mt-4 max-w-xl mx-auto" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Five specialized AI personas, powerful models, and a beautiful interface designed to get out of your way.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <motion.div key={f.title}
                initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07, duration: 0.5 }} viewport={{ once: true }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="group relative rounded-2xl p-6 border transition-colors"
                style={{ background: 'rgba(255,255,255,0.025)', borderColor: 'rgba(255,255,255,0.07)' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = f.color + '44'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'}>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl mb-4"
                  style={{ background: f.bg }}>
                  <f.icon size={18} style={{ color: f.color }} />
                </div>
                <h3 className="font-semibold mb-2 text-white" style={{ fontFamily: "'Syne', sans-serif" }}>{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ───────────────────────────────────────────────────── */}
      <section id="how" className="py-32 px-6" style={{ background: 'rgba(255,255,255,0.015)' }}>
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#06b6d4' }}>How it works</p>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 'clamp(2rem, 4vw, 3rem)', letterSpacing: '-0.02em' }}>
              Up and running in 30 seconds
            </h2>
          </div>
          <div className="flex flex-col gap-8">
            {STEPS.map((s, i) => (
              <motion.div key={s.n}
                initial={{ opacity: 0, x: -24 }} whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }} viewport={{ once: true }}
                className="flex items-start gap-6 group">
                <div className="shrink-0 flex h-14 w-14 items-center justify-center rounded-2xl border font-mono text-sm font-bold transition-colors"
                  style={{ borderColor: 'rgba(139,92,246,0.25)', background: 'rgba(139,92,246,0.08)', color: '#c4b5fd' }}>
                  {s.n}
                </div>
                <div className="pt-2">
                  <h3 className="font-semibold text-white mb-1" style={{ fontFamily: "'Syne', sans-serif", fontSize: '1.05rem' }}>{s.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: 0.4 }} viewport={{ once: true }}
            className="mt-12 text-center">
            <button onClick={handleCTA}
              className="inline-flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)', boxShadow: '0 8px 32px rgba(139,92,246,0.25)' }}>
              Try it free <ArrowRight size={14} />
            </button>
          </motion.div>
        </div>
      </section>

      {/* ── Testimonials ───────────────────────────────────────────────────── */}
      <section className="py-32 px-6">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#f59e0b' }}>Testimonials</p>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 'clamp(2rem, 4vw, 3rem)', letterSpacing: '-0.02em' }}>
              Loved by learners & builders
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t, i) => (
              <motion.div key={t.name}
                initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }} viewport={{ once: true }}
                className="rounded-2xl border p-6"
                style={{ background: 'rgba(255,255,255,0.025)', borderColor: 'rgba(255,255,255,0.07)' }}>
                <StarRating stars={t.stars} />
                <p className="mt-4 text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>"{t.text}"</p>
                <div className="mt-5 flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}>
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{t.name}</p>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ────────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-32 px-6" style={{ background: 'rgba(255,255,255,0.015)' }}>
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#10b981' }}>Pricing</p>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 'clamp(2rem, 4vw, 3rem)', letterSpacing: '-0.02em' }}>
              Simple, transparent pricing
            </h2>
            <p className="mt-4" style={{ color: 'rgba(255,255,255,0.4)' }}>Start free. Upgrade when you need more.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
            {PLANS.map((plan, i) => (
              <motion.div key={plan.name}
                initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }} viewport={{ once: true }}
                className="relative rounded-2xl border p-6"
                style={{
                  background: plan.highlight ? 'rgba(139,92,246,0.08)' : 'rgba(255,255,255,0.025)',
                  borderColor: plan.highlight ? 'rgba(139,92,246,0.35)' : 'rgba(255,255,255,0.07)',
                  boxShadow: plan.highlight ? '0 0 40px rgba(139,92,246,0.12)' : 'none',
                }}>
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-xs font-semibold text-white"
                    style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}>
                    Most popular
                  </div>
                )}
                <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: plan.accent }}>{plan.name}</p>
                <div className="flex items-end gap-1 mb-1">
                  <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '2.2rem', color: '#fff', lineHeight: 1 }}>{plan.price}</span>
                  <span className="mb-1.5 text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>{plan.period}</span>
                </div>
                <ul className="mt-6 mb-7 flex flex-col gap-2.5">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2.5 text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
                      <Check size={13} style={{ color: plan.accent, flexShrink: 0 }} />{f}
                    </li>
                  ))}
                </ul>
                <button onClick={handleCTA}
                  className="w-full rounded-xl py-2.5 text-sm font-semibold transition hover:opacity-90"
                  style={{
                    background: plan.highlight ? `linear-gradient(135deg, ${plan.accent}, #7c3aed)` : 'rgba(255,255,255,0.06)',
                    color: plan.highlight ? '#fff' : 'rgba(255,255,255,0.7)',
                    border: plan.highlight ? 'none' : '1px solid rgba(255,255,255,0.09)',
                  }}>
                  {plan.cta}
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── About ──────────────────────────────────────────────────────────── */}
      <section id="about" className="py-32 px-6">
        <div className="mx-auto max-w-4xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <motion.div initial={{ opacity: 0, x: -24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#f43f5e' }}>About</p>
              <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                Built for curious minds
              </h2>
              <p className="mt-5 text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
                EduLens AI was born from a simple frustration: AI tools that are either too complex or too shallow. We built a platform that adapts to you — whether you're a student tackling your first algorithm, a developer debugging production code, or a writer searching for the perfect opening line.
              </p>
              <p className="mt-4 text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
                We believe every person deserves a brilliant thinking partner available 24/7, without a premium subscription just to get started.
              </p>
              <div className="mt-8 grid grid-cols-3 gap-4">
                {[['2,400+','Users'],['5','AI Personas'],['99.9%','Uptime']].map(([num, label]) => (
                  <div key={label}>
                    <p style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '1.6rem', color: '#c4b5fd' }}>{num}</p>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{label}</p>
                  </div>
                ))}
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
              className="flex flex-col gap-4">
              {[
                { icon: Globe,      color: '#8b5cf6', label: 'Accessible globally', desc: 'Available 24/7, no downtime, from any country.' },
                { icon: Lock,       color: '#06b6d4', label: 'Privacy first',        desc: 'Your conversations are encrypted and never shared.' },
                { icon: Headphones, color: '#f59e0b', label: 'Human support',        desc: 'Real humans respond to support tickets within 24h.' },
              ].map(item => (
                <div key={item.label} className="flex items-start gap-4 rounded-xl p-4 border"
                  style={{ background: 'rgba(255,255,255,0.025)', borderColor: 'rgba(255,255,255,0.06)' }}>
                  <div className="shrink-0 flex h-9 w-9 items-center justify-center rounded-xl"
                    style={{ background: item.color + '18' }}>
                    <item.icon size={16} style={{ color: item.color }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{item.label}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────────────────────── */}
      <section className="py-24 px-6" style={{ background: 'rgba(255,255,255,0.015)' }}>
        <div className="mx-auto max-w-2xl">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#8b5cf6' }}>FAQ</p>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 'clamp(1.8rem, 3vw, 2.4rem)', letterSpacing: '-0.02em' }}>
              Common questions
            </h2>
          </div>
          <div>
            {FAQS.map(f => <FaqItem key={f.q} {...f} />)}
          </div>
        </div>
      </section>

      {/* ── Contact ────────────────────────────────────────────────────────── */}
      <section id="contact" className="py-32 px-6">
        <div className="mx-auto max-w-4xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#06b6d4' }}>Contact</p>
              <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 'clamp(1.8rem, 3vw, 2.4rem)', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                We'd love to hear from you
              </h2>
              <p className="mt-4 text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Have a question, feature request, or want to report a bug? Send us a message and we'll respond within 24 hours.
              </p>
              <div className="mt-8 flex flex-col gap-4">
                {[
                  { icon: Mail,    label: 'Email us',      val: 'support@edulens.ai' },
                  { icon: Twitter, label: 'Twitter / X',   val: '@EduLensAI'         },
                  { icon: Github,  label: 'GitHub',        val: 'vikram310-creator'   },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                      style={{ background: 'rgba(139,92,246,0.1)' }}>
                      <item.icon size={15} style={{ color: '#c4b5fd' }} />
                    </div>
                    <div>
                      <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{item.label}</p>
                      <p className="text-sm font-medium text-white">{item.val}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <form onSubmit={handleContactSubmit} className="flex flex-col gap-4">
                {[
                  { id: 'name',    label: 'Your name',    type: 'text',  placeholder: 'Vikram Singh' },
                  { id: 'email',   label: 'Email address', type: 'email', placeholder: 'you@example.com' },
                ].map(field => (
                  <div key={field.id}>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
                      {field.label}
                    </label>
                    <input type={field.type} required placeholder={field.placeholder}
                      value={contactForm[field.id]}
                      onChange={e => setContactForm(f => ({ ...f, [field.id]: e.target.value }))}
                      className="w-full rounded-xl px-4 py-2.5 text-sm outline-none transition"
                      style={{
                        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)',
                        color: '#f1f0f8',
                      }}
                      onFocus={e => { e.target.style.borderColor = '#8b5cf6'; e.target.style.boxShadow = '0 0 0 3px rgba(139,92,246,0.12)' }}
                      onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.09)'; e.target.style.boxShadow = 'none' }}
                    />
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'rgba(255,255,255,0.45)' }}>Message</label>
                  <textarea required rows={4} placeholder="Tell us anything..."
                    value={contactForm.message}
                    onChange={e => setContactForm(f => ({ ...f, message: e.target.value }))}
                    className="w-full rounded-xl px-4 py-2.5 text-sm outline-none transition resize-none"
                    style={{
                      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)',
                      color: '#f1f0f8',
                    }}
                    onFocus={e => { e.target.style.borderColor = '#8b5cf6'; e.target.style.boxShadow = '0 0 0 3px rgba(139,92,246,0.12)' }}
                    onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.09)'; e.target.style.boxShadow = 'none' }}
                  />
                </div>
                <AnimatePresence>
                  {contactSent && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                      className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm"
                      style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#6ee7b7' }}>
                      <Check size={14} /> Message sent! We'll reply within 24 hours.
                    </motion.div>
                  )}
                </AnimatePresence>
                <button type="submit"
                  className="flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white transition hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', boxShadow: '0 4px 20px rgba(139,92,246,0.3)' }}>
                  Send message <ArrowRight size={14} />
                </button>
              </form>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── CTA Banner ─────────────────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="mx-auto max-w-3xl rounded-3xl border p-12 text-center relative overflow-hidden"
          style={{ background: 'rgba(139,92,246,0.07)', borderColor: 'rgba(139,92,246,0.2)' }}>
          <GradientOrb style={{ width: 300, height: 300, top: -100, left: '50%', transform: 'translateX(-50%)', background: 'rgba(139,92,246,0.15)' }} />
          <div className="relative">
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', letterSpacing: '-0.02em' }}>
              Start thinking smarter today
            </h2>
            <p className="mt-4 text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
              Free forever. No credit card. Up and running in 30 seconds.
            </p>
            <button onClick={handleCTA}
              className="mt-8 inline-flex items-center gap-2 rounded-2xl px-8 py-3.5 text-base font-semibold text-white transition hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', boxShadow: '0 8px 32px rgba(139,92,246,0.4)' }}>
              {user ? 'Open App' : 'Get started free'} <ArrowRight size={16} />
            </button>
          </div>
        </motion.div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="border-t py-12 px-6" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg text-base"
                style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}>⚡</div>
              <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, letterSpacing: '-0.01em', fontSize: '0.95rem' }}>
                EduLens<span style={{ color: '#8b5cf6' }}>_AI</span>
              </span>
            </div>
            <div className="flex items-center gap-6 flex-wrap justify-center">
              {NAV_LINKS.map(l => (
                <button key={l.label} onClick={() => scrollTo(l.href)}
                  className="text-xs transition-colors hover:text-white"
                  style={{ color: 'rgba(255,255,255,0.3)' }}>
                  {l.label}
                </button>
              ))}
            </div>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>
              © 2025 EduLens AI. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
