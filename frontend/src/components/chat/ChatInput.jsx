import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, Square, ArrowUp, Paperclip, X, Image } from 'lucide-react'
import { useChatStore } from '../../store/chatStore'
import { useVoiceInput } from '../../hooks/useVoiceInput'

export default function ChatInput() {
  const [input, setInput] = useState('')
  const [attachedImages, setAttachedImages] = useState([])
  const { sendMessage, isStreaming } = useChatStore()
  const textareaRef = useRef(null)
  const fileInputRef = useRef(null)

  const handleVoiceResult = useCallback((transcript) => {
    setInput((prev) => prev ? prev + ' ' + transcript : transcript)
    textareaRef.current?.focus()
  }, [])

  const { isListening, supported, startListening, stopListening } = useVoiceInput(handleVoiceResult)

  const handleSend = () => {
    const trimmed = input.trim()
    if ((!trimmed && attachedImages.length === 0) || isStreaming) return
    sendMessage(trimmed, attachedImages)
    setInput('')
    setAttachedImages([])
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const handleChange = (e) => {
    setInput(e.target.value)
    const el = textareaRef.current
    if (el) { el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 180) + 'px' }
  }

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files)
    files.forEach((file) => {
      if (!file.type.startsWith('image/')) return
      const reader = new FileReader()
      reader.onload = (ev) => {
        setAttachedImages((prev) => [
          ...prev,
          { id: Date.now() + Math.random(), name: file.name, dataUrl: ev.target.result, type: file.type }
        ])
      }
      reader.readAsDataURL(file)
    })
    e.target.value = ''
  }

  const removeImage = (id) => setAttachedImages((prev) => prev.filter((img) => img.id !== id))

  const canSend = (input.trim().length > 0 || attachedImages.length > 0) && !isStreaming
  const hasInput = input.length > 0

  return (
    <div className="px-4 pb-5 pt-2">
      <div className="mx-auto max-w-2xl">

        {/* Image previews */}
        <AnimatePresence>
          {attachedImages.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: 'auto', marginBottom: 10 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              className="flex flex-wrap gap-2 overflow-hidden"
            >
              {attachedImages.map((img) => (
                <motion.div
                  key={img.id}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="relative group"
                >
                  <div className="relative h-16 w-16 overflow-hidden rounded-xl border border-white/10 bg-[#111118] shadow-lg shadow-black/30">
                    <img
                      src={img.dataUrl}
                      alt={img.name}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-150" />
                  </div>
                  <button
                    onClick={() => removeImage(img.id)}
                    className="absolute -top-1.5 -right-1.5 flex h-4.5 w-4.5 items-center justify-center rounded-full border border-white/15 bg-[#1a1a26] text-white/60 hover:text-white transition-all shadow-lg opacity-0 group-hover:opacity-100"
                    style={{ width: '18px', height: '18px' }}
                  >
                    <X size={9} />
                  </button>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input box */}
        <motion.div
          animate={
            isListening  ? { boxShadow: '0 0 0 1.5px rgba(239,68,68,0.45), 0 8px 32px rgba(239,68,68,0.08)' }
            : hasInput || attachedImages.length > 0
                         ? { boxShadow: '0 0 0 1.5px rgba(139,92,246,0.45), 0 8px 32px rgba(139,92,246,0.08)' }
            : { boxShadow: '0 0 0 1px rgba(255,255,255,0.06), 0 4px 20px rgba(0,0,0,0.3)' }
          }
          transition={{ duration: 0.18 }}
          className="relative flex items-end gap-2 rounded-2xl border border-white/6 bg-[#111118] p-2"
        >
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />

          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={isListening ? '🎙 Listening…' : 'Ask anything…'}
            rows={1}
            disabled={isStreaming}
            className="flex-1 resize-none bg-transparent px-3 py-2.5 text-sm text-white/90 placeholder-white/18 outline-none"
            style={{ minHeight: '44px', maxHeight: '180px', lineHeight: '1.55' }}
          />

          <div className="flex shrink-0 items-center gap-1 pb-1.5 pr-1">

            {/* Attach image */}
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
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
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-violet-500 text-[9px] font-700 text-white shadow-lg shadow-violet-900/40">
                  {attachedImages.length}
                </span>
              )}
            </motion.button>

            {/* Voice */}
            {supported && (
              <motion.button
                whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
                onClick={isListening ? stopListening : startListening}
                className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all ${
                  isListening
                    ? 'bg-red-500/18 text-red-400 border border-red-500/30'
                    : 'text-white/22 hover:bg-white/6 hover:text-white/55'
                }`}
              >
                {isListening
                  ? <motion.div animate={{ scale: [1,1.25,1] }} transition={{ repeat: Infinity, duration: 0.85 }}><Square size={12} fill="currentColor"/></motion.div>
                  : <Mic size={14} />}
              </motion.button>
            )}

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
                  <motion.div key="s" initial={{scale:0,rotate:-90}} animate={{scale:1,rotate:0}} exit={{scale:0}}
                    className="h-3 w-3 rounded-sm bg-current" />
                ) : (
                  <motion.div key="u" initial={{scale:0,y:4}} animate={{scale:1,y:0}} exit={{scale:0}}>
                    <ArrowUp size={15} strokeWidth={2.5} />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </motion.div>

        {/* Hint */}
        <p className="mt-2 text-center text-[11px] text-white/14">
          {/* <kbd className="rounded border border-white/8 bg-white/4 px-1.5 py-0.5 font-mono text-[10px]">Enter</kbd> send ·{' '}
          <kbd className="rounded border border-white/8 bg-white/4 px-1.5 py-0.5 font-mono text-[10px]">Shift+Enter</kbd> newline ·{' '}
          <span className="inline-flex items-center gap-1"><Image size={9} className="inline opacity-40" /> images supported</span> */}
          <span className="inline-flex items-center gap-1 opacity-90">
            ⚠️ EduLens_AI may produce inaccurate responses. Verify important information.
          </span>
        </p>
      </div>
    </div>
  )
}
