import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, Square, ArrowUp, Paperclip, X, Loader2, MicOff, ChevronDown, Zap, Brain, Eye, Check } from 'lucide-react'
import { useChatStore } from '../../store/chatStore'
import { useVoiceInput } from '../../hooks/useVoiceInput'
import { useAuth } from '../../context/AuthContext'

const VISION_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct'

const MODELS = [
  {
    value: 'llama-3.1-8b-instant',
    label: 'LLaMA 3.1 8B',
    sublabel: 'Fast & efficient',
    tag: 'Fast',
    icon: Zap,
    color: '#34d399',
    colorSoft: 'rgba(52,211,153,0.12)',
    colorBorder: 'rgba(52,211,153,0.25)',
  },
  {
    value: 'llama-3.3-70b-versatile',
    label: 'LLaMA 3.3 70B',
    sublabel: 'Powerful reasoning',
    tag: 'Smart',
    icon: Brain,
    color: '#a78bfa',
    colorSoft: 'rgba(167,139,250,0.12)',
    colorBorder: 'rgba(167,139,250,0.25)',
  },
  {
    value: 'meta-llama/llama-4-scout-17b-16e-instruct',
    label: 'Llama 4 Scout',
    sublabel: 'Image understanding',
    tag: 'Vision',
    icon: Eye,
    color: '#60a5fa',
    colorSoft: 'rgba(96,165,250,0.12)',
    colorBorder: 'rgba(96,165,250,0.25)',
  },
]

function ModelDropdown({ model, setModel, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 6, scale: 0.97 }}
      transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
      className="absolute bottom-full left-0 mb-2 z-50 w-64"
      style={{
        background: 'rgba(13,13,22,0.98)',
        border: '1px solid rgba(255,255,255,0.09)',
        borderRadius: '16px',
        boxShadow: '0 24px 48px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.03)',
        backdropFilter: 'blur(24px)',
        overflow: 'hidden',
      }}
    >
      <div className="px-3.5 pt-3 pb-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.25)' }}>
          Select Model
        </span>
      </div>
      <div className="p-1.5 flex flex-col gap-0.5">
        {MODELS.map((m) => {
          const Icon = m.icon
          const active = model === m.value
          return (
            <motion.button
              key={m.value}
              whileHover={{ x: 2 }}
              transition={{ duration: 0.1 }}
              onClick={() => { setModel(m.value); onClose() }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all"
              style={{
                background: active ? m.colorSoft : 'transparent',
                border: '1px solid ' + (active ? m.colorBorder : 'transparent'),
              }}
            >
              <div
                className="flex-shrink-0 flex items-center justify-center rounded-lg"
                style={{
                  width: 30, height: 30,
                  background: active ? m.colorSoft : 'rgba(255,255,255,0.05)',
                  border: '1px solid ' + (active ? m.colorBorder : 'rgba(255,255,255,0.08)'),
                }}
              >
                <Icon size={13} style={{ color: active ? m.color : 'rgba(255,255,255,0.35)' }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold" style={{ color: active ? m.color : 'rgba(255,255,255,0.8)' }}>
                    {m.label}
                  </span>
                  <span
                    className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{
                      background: active ? m.colorSoft : 'rgba(255,255,255,0.06)',
                      color: active ? m.color : 'rgba(255,255,255,0.3)',
                      border: '1px solid ' + (active ? m.colorBorder : 'transparent'),
                    }}
                  >{m.tag}</span>
                </div>
                <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>{m.sublabel}</span>
              </div>
              {active && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 20 }}>
                  <Check size={13} style={{ color: m.color }} />
                </motion.div>
              )}
            </motion.button>
          )
        })}
      </div>
    </motion.div>
  )
}

export default function ChatInput() {
  const { requireAuth } = useAuth()
  const [input, setInput] = useState('')
  const [interimText, setInterimText] = useState('')
  const [attachedImages, setAttachedImages] = useState([])
  const [modelOpen, setModelOpen] = useState(false)
  const { sendMessage, isStreaming, setModel, model } = useChatStore()
  const textareaRef = useRef(null)
  const fileInputRef = useRef(null)
  const committedRef = useRef('')
  const modelBtnRef = useRef(null)
  const dropdownRef = useRef(null)

  const currentModel = MODELS.find(m => m.value === model) || MODELS[0]
  const ModelIcon = currentModel.icon

  useEffect(() => {
    if (!modelOpen) return
    const handler = (e) => {
      if (!modelBtnRef.current?.contains(e.target) && !dropdownRef.current?.contains(e.target)) {
        setModelOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [modelOpen])

  const handleVoiceResult = useCallback((transcript) => {
    setInput((prev) => {
      const updated = prev ? prev + ' ' + transcript : transcript
      committedRef.current = updated
      return updated
    })
    setInterimText('')
    textareaRef.current?.focus()
    const el = textareaRef.current
    if (el) { el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 180) + 'px' }
  }, [])

  const handleInterim = useCallback((interim) => { setInterimText(interim || '') }, [])

  const { isListening, supported, startListening, stopListening, isProcessing, engine } =
    useVoiceInput(handleVoiceResult, handleInterim)

  const isWhisper = engine === 'whisper'
  const isDetecting = engine === 'pending'

  const displayValue = (!isWhisper && !isDetecting && isListening && interimText)
    ? (input ? input + ' ' + interimText : interimText) : input

  const placeholder = (() => {
    if (isProcessing) return '⏳ Transcribing…'
    if (interimText && (isListening || isProcessing)) return interimText
    if (isListening && isWhisper) return '🎙 Recording… tap ■ when done'
    if (isListening) return '🎙 Speak now…'
    return 'Ask anything…'
  })()

  const handleSend = () => {
    const trimmed = input.trim()
    if ((!trimmed && attachedImages.length === 0) || isStreaming) return
    requireAuth(() => {
      sendMessage(trimmed, attachedImages)
      setInput('')
      setInterimText('')
      committedRef.current = ''
      setAttachedImages([])
      if (isListening) stopListening()
      if (textareaRef.current) textareaRef.current.style.height = 'auto'
    })
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
    if (e.key === 'Escape') setModelOpen(false)
  }

  const handleChange = (e) => {
    const val = e.target.value
    setInput(val)
    committedRef.current = val
    setInterimText('')
    const el = textareaRef.current
    if (el) { el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 180) + 'px' }
  }

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files)
    let hasNew = false
    files.forEach((file) => {
      if (!file.type.startsWith('image/')) return
      hasNew = true
      const reader = new FileReader()
      reader.onload = (ev) => {
        setAttachedImages((prev) => [
          ...prev,
          { id: Date.now() + Math.random(), name: file.name, dataUrl: ev.target.result, type: file.type }
        ])
      }
      reader.readAsDataURL(file)
    })
    if (hasNew) setModel(VISION_MODEL)
    e.target.value = ''
  }

  const removeImage = (id) => setAttachedImages((prev) => prev.filter((img) => img.id !== id))

  const canSend = (input.trim().length > 0 || attachedImages.length > 0) && !isStreaming && !isProcessing
  const hasInput = input.length > 0 || interimText.length > 0
  const micActive = isListening || isProcessing
  const micDisabled = isProcessing || isDetecting

  const boxShadow = micActive
    ? '0 0 0 1.5px rgba(239,68,68,0.5), 0 8px 40px rgba(239,68,68,0.1)'
    : (hasInput || attachedImages.length > 0)
      ? '0 0 0 1.5px ' + currentModel.colorBorder + ', 0 8px 40px rgba(0,0,0,0.35)'
      : '0 0 0 1px rgba(255,255,255,0.07), 0 4px 24px rgba(0,0,0,0.4)'

  return (
    <div className="px-4 pb-5 pt-2 mobile-safe-bottom">
      <div className="mx-auto max-w-2xl">

        {/* Attached images */}
        <AnimatePresence>
          {attachedImages.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: 'auto', marginBottom: 12 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              style={{ overflow: 'hidden' }}
            >
              <div className="flex flex-wrap gap-3 pt-1 pb-1">
                {attachedImages.map((img) => (
                  <motion.div
                    key={img.id}
                    initial={{ opacity: 0, scale: 0.85, y: 8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: 4 }}
                    transition={{ type: 'spring', stiffness: 320, damping: 24 }}
                    className="group relative"
                  >
                    <div
                      className="relative overflow-hidden rounded-2xl shadow-xl"
                      style={{ width: '80px', height: '64px', border: '1px solid rgba(255,255,255,0.1)', background: '#0e0e18' }}
                    >
                      <img src={img.dataUrl} alt={img.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        className="transition-transform duration-200 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                      <div className="absolute bottom-1.5 left-1.5 rounded-md px-1.5 py-0.5 text-white text-[8px] font-bold tracking-wide"
                        style={{ background: 'rgba(96,165,250,0.85)', backdropFilter: 'blur(4px)' }}>
                        Vision
                      </div>
                    </div>
                    <button
                      onClick={() => removeImage(img.id)}
                      className="absolute -top-2 -right-2 flex items-center justify-center rounded-full transition-all"
                      style={{ width: '20px', height: '20px', background: '#1c1c2e', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.45)' }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = 'white' }}
                      onMouseLeave={e => { e.currentTarget.style.background = '#1c1c2e'; e.currentTarget.style.color = 'rgba(255,255,255,0.45)' }}
                    ><X size={10} /></button>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main input box */}
        <motion.div
          animate={{ boxShadow }}
          transition={{ duration: 0.2 }}
          className="relative rounded-2xl"
          style={{
            background: 'rgba(14,14,24,0.95)',
            border: '1px solid rgba(255,255,255,0.07)',
            backdropFilter: 'blur(20px)',
          }}
        >
          <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />

          {/* Textarea */}
          <div className="relative px-4 pt-3.5 pb-1">
            <textarea
              ref={textareaRef}
              value={displayValue}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              rows={1}
              disabled={isStreaming || isProcessing}
              className="w-full resize-none bg-transparent text-sm outline-none placeholder:text-white/20"
              style={{
                minHeight: '28px', maxHeight: '180px', lineHeight: '1.6',
                color: (!isWhisper && !isDetecting && isListening && interimText) ? 'rgba(196,181,253,0.7)' : 'rgba(255,255,255,0.88)',
                caretColor: currentModel.color,
              }}
            />
            <AnimatePresence>
              {micActive && (
                <motion.span
                  key="recbadge"
                  initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                  className="absolute right-1 top-4 flex items-center gap-1 text-[10px] font-semibold tracking-wider"
                  style={{ color: isProcessing ? '#fbbf24' : '#f87171' }}
                >
                  {isProcessing ? (
                    <><Loader2 size={10} className="animate-spin" /><span>TRANSCRIBING</span></>
                  ) : (
                    <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.2 }}>● REC</motion.span>
                  )}
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          {/* Bottom bar */}
          <div className="flex items-center justify-between px-2.5 pb-2.5 pt-1">

            {/* Left: model pill + attach */}
            <div className="flex items-center gap-1 relative">
              <div className="relative" ref={modelBtnRef}>
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  onClick={() => setModelOpen(o => !o)}
                  className="flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-medium transition-all"
                  style={{
                    background: modelOpen ? currentModel.colorSoft : 'rgba(255,255,255,0.05)',
                    border: '1px solid ' + (modelOpen ? currentModel.colorBorder : 'rgba(255,255,255,0.08)'),
                    color: modelOpen ? currentModel.color : 'rgba(255,255,255,0.5)',
                  }}
                >
                  <ModelIcon size={11} style={{ color: modelOpen ? currentModel.color : 'rgba(255,255,255,0.4)' }} />
                  <span style={{ maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {currentModel.label}
                  </span>
                  <motion.div animate={{ rotate: modelOpen ? 180 : 0 }} transition={{ duration: 0.18 }}>
                    <ChevronDown size={10} />
                  </motion.div>
                </motion.button>

                <AnimatePresence>
                  {modelOpen && (
                    <div ref={dropdownRef}>
                      <ModelDropdown model={model} setModel={setModel} onClose={() => setModelOpen(false)} />
                    </div>
                  )}
                </AnimatePresence>
              </div>

              {/* Attach */}
              <motion.button
                whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
                onClick={() => fileInputRef.current?.click()}
                title="Attach image"
                className="relative flex h-8 w-8 items-center justify-center rounded-xl transition-all"
                style={{
                  background: attachedImages.length > 0 ? 'rgba(96,165,250,0.12)' : 'transparent',
                  border: '1px solid ' + (attachedImages.length > 0 ? 'rgba(96,165,250,0.3)' : 'transparent'),
                  color: attachedImages.length > 0 ? '#60a5fa' : 'rgba(255,255,255,0.28)',
                }}
              >
                <Paperclip size={13} />
                {attachedImages.length > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold text-white"
                    style={{ background: '#60a5fa', boxShadow: '0 2px 8px rgba(96,165,250,0.4)' }}>
                    {attachedImages.length}
                  </span>
                )}
              </motion.button>
            </div>

            {/* Right: char count + mic + send */}
            <div className="flex items-center gap-1.5">
              {input.length > 80 && (
                <span className="text-[10px] tabular-nums mr-1"
                  style={{ color: input.length > 3000 ? '#f87171' : 'rgba(255,255,255,0.2)' }}>
                  {input.length}
                </span>
              )}

              {/* Mic */}
              <motion.button
                whileHover={!micDisabled ? { scale: 1.08 } : {}}
                whileTap={!micDisabled ? { scale: 0.92 } : {}}
                onClick={micActive ? stopListening : startListening}
                disabled={micDisabled}
                className="flex h-8 w-8 items-center justify-center rounded-xl transition-all"
                style={{
                  background: micActive ? 'rgba(239,68,68,0.12)' : 'transparent',
                  border: '1px solid ' + (micActive ? 'rgba(239,68,68,0.3)' : 'transparent'),
                  color: micActive ? '#f87171' : isDetecting ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.28)',
                  cursor: micDisabled ? 'not-allowed' : 'pointer',
                  opacity: micDisabled && !micActive ? 0.5 : 1,
                }}
              >
                {isDetecting ? <Loader2 size={12} className="animate-spin opacity-50" />
                  : isListening && !isProcessing ? (
                    <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ repeat: Infinity, duration: 0.8 }}>
                      <Square size={11} fill="currentColor" />
                    </motion.div>
                  ) : isProcessing ? <Loader2 size={13} className="animate-spin" />
                  : supported ? <Mic size={13} />
                  : <MicOff size={13} className="opacity-40" />
                }
              </motion.button>

              {/* Send */}
              <motion.button
                whileHover={canSend ? { scale: 1.06 } : {}}
                whileTap={canSend ? { scale: 0.93 } : {}}
                onClick={handleSend}
                disabled={!canSend}
                className="flex h-8 w-8 items-center justify-center rounded-xl transition-all duration-150"
                style={canSend ? {
                  background: 'linear-gradient(135deg, ' + currentModel.color + 'cc, ' + currentModel.color + '88)',
                  boxShadow: '0 4px 16px ' + currentModel.color + '33',
                  color: 'white',
                } : {
                  background: 'rgba(255,255,255,0.05)',
                  color: 'rgba(255,255,255,0.15)',
                  cursor: 'not-allowed',
                }}
              >
                <AnimatePresence mode="wait">
                  {isStreaming ? (
                    <motion.div key="stop" initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0 }}
                      className="h-3 w-3 rounded-sm bg-current" />
                  ) : (
                    <motion.div key="send" initial={{ scale: 0, y: 4 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0 }}>
                      <ArrowUp size={14} strokeWidth={2.5} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Footer */}
        <div className="mt-2 flex items-center justify-center gap-2">
          <p className="text-center text-[10.5px]" style={{ color: 'rgba(255,255,255,0.18)' }}>
            EduLens AI may produce inaccurate responses. Verify important information.
          </p>
          {!isDetecting && isWhisper && (
            <span className="shrink-0 rounded-md px-1.5 py-0.5 text-[9px] font-semibold"
              style={{ background: 'rgba(251,191,36,0.12)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.2)' }}>
              Whisper
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
