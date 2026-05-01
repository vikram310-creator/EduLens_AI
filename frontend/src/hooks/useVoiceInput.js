import { useState, useRef, useCallback, useEffect } from 'react'
import { BASE_URL } from '../utils/api'

// ─── Brave detection (navigator.brave.isBrave is a Promise) ──────────────────
let _isBrave = null   // null = not yet checked
async function checkBrave() {
  if (_isBrave !== null) return _isBrave
  try {
    _isBrave = !!(navigator.brave && await navigator.brave.isBrave())
  } catch {
    _isBrave = false
  }
  return _isBrave
}

function hasSpeechRecognition() {
  return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window
}

// Quick runtime check — Brave blocks Web Speech with a 'network' error
function testWebSpeechWorks() {
  return new Promise((resolve) => {
    if (!hasSpeechRecognition()) { resolve(false); return }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    const r = new SR()
    let done = false
    const finish = (v) => { if (!done) { done = true; try { r.abort() } catch {} resolve(v) } }
    setTimeout(() => finish(false), 2000)
    r.onstart = () => finish(true)
    r.onerror = (e) => finish(e.error !== 'network' && e.error !== 'service-not-allowed')
    r.onend   = () => finish(false)
    try { r.start() } catch { finish(false) }
  })
}

// ─── Groq Whisper via backend (works in ALL browsers incl. Brave) ─────────────
async function transcribeViaBackend(audioBlob) {
  const form = new FormData()
  // Give a proper filename — Groq uses it to detect codec
  const ext = audioBlob.type.includes('ogg') ? 'ogg'
             : audioBlob.type.includes('mp4') ? 'mp4'
             : 'webm'
  form.append('file', audioBlob, `recording.${ext}`)

  const token = localStorage.getItem('token')
  const headers = token ? { Authorization: `Bearer ${token}` } : {}

  const res = await fetch(`${BASE_URL}/api/transcribe`, {
    method: 'POST',
    headers,
    body: form,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || `HTTP ${res.status}`)
  }
  const { text } = await res.json()
  return text || ''
}

// ─── Backend-Whisper recorder hook ────────────────────────────────────────────
function useBackendWhisperVoice(onResult, onInterim) {
  const [isListening,   setIsListening]   = useState(false)
  const [isProcessing,  setIsProcessing]  = useState(false)
  const mediaRecorderRef = useRef(null)
  const chunksRef        = useRef([])
  const streamRef        = useRef(null)
  const activeRef        = useRef(false)

  const stopListening = useCallback(() => {
    activeRef.current = false
    if (mediaRecorderRef.current?.state !== 'inactive') {
      try { mediaRecorderRef.current?.stop() } catch {}
    }
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    setIsListening(false)
    onInterim?.('')
  }, [onInterim])

  // processChunks: turn accumulated chunks into text, then optionally restart
  const processChunks = useCallback(async (mimeType) => {
    if (!chunksRef.current.length) return
    setIsListening(false)
    setIsProcessing(true)
    onInterim?.('⏳ Transcribing…')

    try {
      const blob = new Blob(chunksRef.current, { type: mimeType })
      const text = await transcribeViaBackend(blob)
      const clean = text.trim().replace(/^[\s.,!?]+|[\s.,!?]+$/g, '')
      onInterim?.('')
      if (clean) onResult(clean)
    } catch (err) {
      console.error('Transcription error:', err)
      onInterim?.('❌ Transcription failed — please try again')
      setTimeout(() => onInterim?.(''), 2500)
    } finally {
      setIsProcessing(false)
    }

    // If user didn't stop, start a new recording segment
    if (activeRef.current && streamRef.current) {
      startSegment(streamRef.current, mimeType)
    }
  }, [onResult, onInterim]) // eslint-disable-line

  const startSegment = useCallback((stream, mimeType) => {
    chunksRef.current = []
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
    mediaRecorderRef.current = recorder

    recorder.ondataavailable = (e) => {
      if (e.data?.size > 0) chunksRef.current.push(e.data)
    }
    recorder.onstop = () => processChunks(recorder.mimeType)

    recorder.start()
    setIsListening(true)

    // Auto-cut every 8 seconds to keep chunks manageable
    setTimeout(() => {
      if (activeRef.current && recorder.state === 'recording') recorder.stop()
    }, 8000)
  }, [processChunks])

  const startListening = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      activeRef.current = true
      onInterim?.('🎙 Recording…')
      startSegment(stream, null)
    } catch (err) {
      console.error('Mic access error:', err)
      const msg = err.name === 'NotAllowedError'
        ? '🚫 Microphone permission denied'
        : '❌ Could not access microphone'
      onInterim?.(msg)
      setTimeout(() => onInterim?.(''), 2500)
      setIsListening(false)
    }
  }, [startSegment, onInterim])

  return {
    isListening: isListening || isProcessing,
    isProcessing,
    supported: true,
    startListening,
    stopListening,
  }
}

// ─── Web Speech API hook ──────────────────────────────────────────────────────
function useWebSpeechVoice(onResult, onInterim) {
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef(null)
  const restartRef     = useRef(false)

  const stopListening = useCallback(() => {
    restartRef.current = false
    recognitionRef.current?.stop()
    setIsListening(false)
    onInterim?.('')
  }, [onInterim])

  const startListening = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    const r = new SR()
    r.continuous      = true
    r.interimResults  = true
    r.lang            = 'en-US'
    r.maxAlternatives = 1

    r.onstart = () => setIsListening(true)

    r.onresult = (e) => {
      let interim = '', final = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript
        if (e.results[i].isFinal) final += t
        else interim += t
      }
      onInterim?.(interim)
      if (final.trim()) { onInterim?.(''); onResult(final.trim()) }
    }

    r.onerror = (e) => {
      if (restartRef.current && e.error !== 'aborted' && e.error !== 'not-allowed') {
        setTimeout(() => { if (restartRef.current) startListening() }, 300)
      } else {
        setIsListening(false); restartRef.current = false; onInterim?.('')
      }
    }

    r.onend = () => {
      if (restartRef.current) {
        try { r.start() }
        catch { setTimeout(() => { if (restartRef.current) startListening() }, 200) }
      } else {
        setIsListening(false); onInterim?.('')
      }
    }

    recognitionRef.current = r
    restartRef.current = true
    try { r.start() } catch { restartRef.current = false; setIsListening(false) }
  }, [onResult, onInterim])

  useEffect(() => () => { restartRef.current = false; recognitionRef.current?.stop() }, [])

  return { isListening, isProcessing: false, supported: hasSpeechRecognition(), startListening, stopListening }
}

// ─── Public hook — auto-selects engine ────────────────────────────────────────
export function useVoiceInput(onResult, onInterim) {
  const [engine, setEngine] = useState('pending') // 'pending' | 'whisper' | 'webspeech'

  useEffect(() => {
    let cancelled = false
    async function detect() {
      const brave = await checkBrave()
      if (cancelled) return
      if (brave || !hasSpeechRecognition()) { setEngine('whisper'); return }
      const works = await testWebSpeechWorks()
      if (!cancelled) setEngine(works ? 'webspeech' : 'whisper')
    }
    detect()
    return () => { cancelled = true }
  }, [])

  const useWhisper = engine !== 'webspeech'

  const whisper   = useBackendWhisperVoice(
    useWhisper ? onResult : () => {},
    useWhisper ? onInterim : () => {},
  )
  const webSpeech = useWebSpeechVoice(
    !useWhisper ? onResult : () => {},
    !useWhisper ? onInterim : () => {},
  )

  if (engine === 'pending') {
    return { isListening: false, isProcessing: false, supported: true, startListening: () => {}, stopListening: () => {}, engine: 'pending' }
  }
  return { ...(useWhisper ? whisper : webSpeech), engine }
}
