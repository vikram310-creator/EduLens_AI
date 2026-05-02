import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, Square, ArrowUp, Paperclip, X, Loader2, MicOff } from 'lucide-react'
import { useChatStore } from '../../store/chatStore'
import { useVoiceInput } from '../../hooks/useVoiceInput'
import { useAuth } from '../../context/AuthContext'

const VISION_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct'

export default function ChatInput() {
  const { requireAuth } = useAuth()
  const [input, setInput] = useState('')
  const [interimText, setInterimText] = useState('')
  const [attachedImages, setAttachedImages] = useState([])
  const { sendMessage, isStreaming, setModel } = useChatStore()
  const textareaRef = useRef(null)
  const fileInputRef = useRef(null)
  const committedRef = useRef('')

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

  const handleInterim = useCallback((interim) => {
    setInterimText(interim || '')
  }, [])

  const { isListening, supported, startListening, stopListening, isProcessing, engine } =
    useVoiceInput(handleVoiceResult, handleInterim)

  const isWhisper = engine === 'whisper'
  const isDetecting = engine === 'pending'

  // displayValue: for Web Speech, show interim live text. For Whisper/pending, keep input clean.
  const displayValue = (!isWhisper && !isDetecting && isListening && interimText)
    ? (input ? input + ' ' + interimText : interimText)
    : input

  // Placeholder text based on state
  const placeholder = (() => {
    if (isProcessing) return '⏳ Transcribing…'
    if (interimText && (isListening || isProcessing)) return interimText
    if (isListening && isWhisper) return '🎙 Recording… tap ■ when done'
    if (isListening) return '🎙 Speak now — typing as you talk…'
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

  // Border glow colour
  const boxShadow = micActive
    ? '0 0 0 1.5px rgba(239,68,68,0.45), 0 8px 32px rgba(239,68,68,0.08)'
    : (hasInput || attachedImages.length > 0)
      ? '0 0 0 1.5px rgba(139,92,246,0.45), 0 8px 32px rgba(139,92,246,0.08)'
      : '0 0 0 1px rgba(255,255,255,0.06), 0 4px 20px rgba(0,0,0,0.3)'

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
              <div className="flex flex-wrap gap-3 pt-1">
                {attachedImages.map((img) => (
                  <motion.div
                    key={img.id}
                    initial={{ opacity: 0, scale: 0.85, y: 8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: 4 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                    className="group relative flex flex-col items-center gap-1"
                  >
                    <div
                      className="relative overflow-hidden rounded-xl border border-white/12 bg-[#0e0e18] shadow-xl"
                      style={{ width: '88px', height: '72px' }}
                    >
                      <img
                        src={img.dataUrl} alt={img.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        className="transition-transform duration-200 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-150 rounded-xl" />
                      <div
                        className="absolute bottom-1 left-1 rounded px-1 py-0.5 text-white backdrop-blur-sm"
                        style={{ fontSize: '8px', fontWeight: 600, background: 'rgba(124,58,237,0.85)' }}
                      >Vision</div>
                    </div>
                    <span
                      className="text-white/30 text-center"
                      style={{ fontSize: '9px', maxWidth: '88px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}
                    >{img.name}</span>
                    <button
                      onClick={() => removeImage(img.id)}
                      className="absolute -top-2 -right-2 flex items-center justify-center rounded-full border border-white/10 bg-[#1c1c2e] text-white/40 hover:bg-red-500 hover:text-white transition-all shadow-lg"
                      style={{ width: '20px', height: '20px' }}
                    ><X size={10} /></button>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          animate={{ boxShadow }}
          transition={{ duration: 0.18 }}
          className="relative flex items-end gap-2 rounded-2xl border border-white/6 bg-[#111118] p-2"
        >
          <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />

          {/* Textarea area */}
          <div className="relative flex-1">
            <textarea
              ref={textareaRef}
              value={displayValue}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              rows={1}
              disabled={isStreaming || isProcessing}
              className="w-full resize-none bg-transparent px-3 py-2.5 text-sm outline-none"
              style={{
                minHeight: '44px', maxHeight: '180px', lineHeight: '1.55',
                color: (!isWhisper && !isDetecting && isListening && interimText)
                  ? 'rgba(196,181,253,0.7)'
                  : 'rgba(255,255,255,0.9)',
              }}
            />

            {/* REC / Processing badge */}
            <AnimatePresence>
              {micActive && (
                <motion.span
                  key="recbadge"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="absolute right-3 bottom-3 flex items-center gap-1 text-[10px] font-semibold tracking-wider"
                  style={{ color: isProcessing ? '#fbbf24' : '#f87171' }}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 size={10} className="animate-spin" />
                      <span>PROCESSING</span>
                    </>
                  ) : (
                    <motion.span
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ repeat: Infinity, duration: 1.2 }}
                    >● REC</motion.span>
                  )}
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          {/* Action buttons */}
          <div className="flex shrink-0 items-center gap-1 pb-1.5 pr-1">

            {/* Attach */}
            <motion.button
              whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
              onClick={() => fileInputRef.current?.click()}
              title="Attach image"
              className={`relative flex h-9 w-9 items-center justify-center rounded-xl transition-all ${
                attachedImages.length > 0
                  ? 'bg-violet-500/18 text-violet-400 border border-violet-500/30'
                  : 'text-white/22 hover:bg-white/6 hover:text-white/55'
              }`}
            >
              <Paperclip size={14} />
              {attachedImages.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-violet-500 text-[9px] font-bold text-white shadow-lg shadow-violet-900/40">
                  {attachedImages.length}
                </span>
              )}
            </motion.button>

            {/* Mic */}
            <motion.button
              whileHover={!micDisabled ? { scale: 1.08 } : {}}
              whileTap={!micDisabled ? { scale: 0.92 } : {}}
              onClick={micActive ? stopListening : startListening}
              title={
                isDetecting
                  ? 'Detecting voice engine…'
                  : micActive
                    ? 'Stop recording'
                    : isWhisper
                      ? 'Voice input (Whisper — works in Brave)'
                      : 'Voice input — types as you speak'
              }
              disabled={micDisabled}
              className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all ${
                micActive
                  ? 'bg-red-500/18 text-red-400 border border-red-500/30'
                  : isDetecting
                    ? 'text-white/15 cursor-wait'
                    : 'text-white/22 hover:bg-white/6 hover:text-white/55'
              } ${micDisabled ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              {isDetecting ? (
                <Loader2 size={13} className="animate-spin opacity-50" />
              ) : isListening && !isProcessing ? (
                <motion.div
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ repeat: Infinity, duration: 0.8 }}
                >
                  <Square size={12} fill="currentColor" />
                </motion.div>
              ) : isProcessing ? (
                <Loader2 size={14} className="animate-spin" />
              ) : supported ? (
                <Mic size={14} />
              ) : (
                <MicOff size={14} className="opacity-40" />
              )}
            </motion.button>

            {/* Send */}
            <motion.button
              whileHover={canSend ? { scale: 1.08 } : {}}
              whileTap={canSend ? { scale: 0.92 } : {}}
              onClick={handleSend}
              disabled={!canSend}
              className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-150 ${
                canSend
                  ? 'bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-lg shadow-violet-900/40'
                  : 'bg-white/4 text-white/12 cursor-not-allowed'
              }`}
            >
              <AnimatePresence mode="wait">
                {isStreaming ? (
                  <motion.div key="s" initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0 }}
                    className="h-3 w-3 rounded-sm bg-current" />
                ) : (
                  <motion.div key="u" initial={{ scale: 0, y: 4 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0 }}>
                    <ArrowUp size={15} strokeWidth={2.5} />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </motion.div>

        {/* Char counter + Footer note */}
        <div className="mt-2 flex items-center justify-between px-0.5">
          <p className="flex-1 text-center text-[11px] text-white/14">
            <span className="inline-flex items-center gap-1 opacity-90">
              ⚠️ EduLens AI may produce inaccurate responses. Verify important information.
              {!isDetecting && isWhisper && (
                <span className="ml-1 rounded px-1 py-0.5 text-[9px] font-semibold" style={{ background: 'rgba(251,191,36,0.15)', color: '#fbbf24' }}>
                  Voice: Whisper
                </span>
              )}
            </span>
          </p>
          {input.length > 50 && (
            <span className="shrink-0 text-[10px] tabular-nums" style={{ color: input.length > 3000 ? '#f87171' : 'rgba(255,255,255,0.18)' }}>
              {input.length}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
