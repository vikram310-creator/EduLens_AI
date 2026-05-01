import { useState, useRef, useCallback, useEffect } from 'react'

// ─── Brave detection (async — isBrave returns a Promise) ──────────────────────
// navigator.brave.isBrave() is a Promise in Brave ≥ 1.x
// We resolve it once on load and cache the result.
let _isBrave = false
let _braveChecked = false

async function checkBrave() {
  if (_braveChecked) return _isBrave
  _braveChecked = true
  try {
    if (navigator.brave && typeof navigator.brave.isBrave === 'function') {
      _isBrave = await navigator.brave.isBrave()
    }
  } catch {
    _isBrave = false
  }
  return _isBrave
}

function hasSpeechRecognition() {
  return ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)
}

// ─── Test if Web Speech actually works (Brave blocks it at runtime) ───────────
// We spin up a recognition object, start it, and listen for either a start
// event (works!) or a network/service-not-allowed error (blocked).
function testWebSpeechWorks() {
  return new Promise((resolve) => {
    if (!hasSpeechRecognition()) { resolve(false); return }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    const r = new SR()
    let settled = false
    const done = (v) => { if (!settled) { settled = true; try { r.abort() } catch {} resolve(v) } }
    const timer = setTimeout(() => done(false), 2500)
    r.onstart = () => { clearTimeout(timer); done(true) }
    r.onerror = (e) => {
      clearTimeout(timer)
      // Brave throws 'network' or 'service-not-allowed'; Chrome gets 'not-allowed' only if mic denied
      done(e.error !== 'network' && e.error !== 'service-not-allowed')
    }
    r.onend = () => { clearTimeout(timer); done(false) }
    try { r.start() } catch { clearTimeout(timer); done(false) }
  })
}

// ─── Whisper Worker (lazy-loaded) ─────────────────────────────────────────────
// Uses importScripts (classic worker) to avoid Blob ESM restrictions in Brave.
let whisperWorker = null
let workerReady = false
const workerCallbacks = new Map()
let cbId = 0

function getWhisperWorker() {
  if (whisperWorker) return whisperWorker

  // Classic worker script — uses importScripts instead of ESM import
  // so it works in Brave's stricter content-security environment.
  const workerCode = `
importScripts('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2/dist/transformers.min.js');

let transcriber = null;

async function loadModel() {
  transcriber = await self.Transformers.pipeline(
    'automatic-speech-recognition',
    'Xenova/whisper-tiny.en',
    { chunk_length_s: 30, stride_length_s: 5 }
  );
  self.postMessage({ type: 'ready' });
}

loadModel().catch(err => self.postMessage({ type: 'error', error: err.message }));

self.onmessage = async (e) => {
  const { type, audio, id } = e.data;
  if (type !== 'transcribe') return;
  try {
    const result = await transcriber(audio, { language: 'english', task: 'transcribe' });
    self.postMessage({ type: 'result', id, text: result.text });
  } catch (err) {
    self.postMessage({ type: 'error', id, error: err.message });
  }
};
`
  const blob = new Blob([workerCode], { type: 'application/javascript' })
  const url = URL.createObjectURL(blob)
  // Classic worker (no { type: 'module' }) — works in Brave
  whisperWorker = new Worker(url)

  whisperWorker.onmessage = (e) => {
    const { type, id, text, error } = e.data
    if (type === 'ready') {
      workerReady = true
    } else if (type === 'result' && workerCallbacks.has(id)) {
      workerCallbacks.get(id).resolve(text)
      workerCallbacks.delete(id)
    } else if (type === 'error' && id && workerCallbacks.has(id)) {
      workerCallbacks.get(id).reject(new Error(error))
      workerCallbacks.delete(id)
    }
  }

  return whisperWorker
}

async function transcribeAudio(float32Array) {
  const worker = getWhisperWorker()
  if (!workerReady) {
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Model load timeout')), 45000)
      const prev = worker.onmessage
      worker.onmessage = (e) => {
        if (prev) prev(e)
        if (e.data.type === 'ready') { clearTimeout(timeout); resolve() }
        else if (e.data.type === 'error' && !e.data.id) { clearTimeout(timeout); reject(new Error(e.data.error)) }
      }
    })
  }
  const id = ++cbId
  return new Promise((resolve, reject) => {
    workerCallbacks.set(id, { resolve, reject })
    worker.postMessage({ type: 'transcribe', audio: float32Array, id })
  })
}

// ─── Whisper recorder hook ─────────────────────────────────────────────────────
function useWhisperVoice(onResult, onInterim) {
  const [isListening, setIsListening] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const streamRef = useRef(null)
  const activeRef = useRef(false)

  useEffect(() => {
    try { getWhisperWorker() } catch {}
  }, [])

  const stopListening = useCallback(() => {
    activeRef.current = false
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    setIsListening(false)
    if (onInterim) onInterim('')
  }, [onInterim])

  const startListening = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      activeRef.current = true
      setIsListening(true)
      if (onInterim) onInterim('🔄 Whisper model loading (first use only)…')

      const recorder = new MediaRecorder(stream)
      mediaRecorderRef.current = recorder
      chunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = async () => {
        if (!chunksRef.current.length) {
          if (activeRef.current) setIsListening(true)
          return
        }
        setIsListening(false)
        setIsProcessing(true)
        if (onInterim) onInterim('⏳ Transcribing…')

        let audioCtx
        try {
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
          const arrayBuffer = await blob.arrayBuffer()
          audioCtx = new AudioContext({ sampleRate: 16000 })
          const decoded = await audioCtx.decodeAudioData(arrayBuffer)
          const float32 = decoded.getChannelData(0)

          const text = await transcribeAudio(float32)
          const clean = text?.trim().replace(/^[\s.,!?]+|[\s.,!?]+$/g, '')
          if (clean) {
            if (onInterim) onInterim('')
            onResult(clean)
          } else {
            if (onInterim) onInterim('')
          }
        } catch (err) {
          console.error('Whisper transcription error:', err)
          if (onInterim) onInterim('')
        } finally {
          setIsProcessing(false)
          try { audioCtx?.close() } catch {}
        }

        if (activeRef.current && streamRef.current) {
          chunksRef.current = []
          const newRecorder = new MediaRecorder(streamRef.current)
          mediaRecorderRef.current = newRecorder
          newRecorder.ondataavailable = recorder.ondataavailable
          newRecorder.onstop = recorder.onstop
          setIsListening(true)
          newRecorder.start()
          setTimeout(() => {
            if (activeRef.current && newRecorder.state === 'recording') newRecorder.stop()
          }, 5000)
        }
      }

      recorder.start()
      setTimeout(() => {
        if (activeRef.current && recorder.state === 'recording') recorder.stop()
      }, 5000)

    } catch (err) {
      console.error('Mic access error:', err)
      setIsListening(false)
      if (onInterim) onInterim('')
    }
  }, [onResult, onInterim])

  return { isListening: isListening || isProcessing, supported: true, startListening, stopListening, isProcessing }
}

// ─── Web Speech API hook ────────────────────────────────────────────────────────
function useWebSpeechVoice(onResult, onInterim) {
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef(null)
  const restartRef = useRef(false)

  const stopListening = useCallback(() => {
    restartRef.current = false
    recognitionRef.current?.stop()
    setIsListening(false)
    if (onInterim) onInterim('')
  }, [onInterim])

  const startListening = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'
    recognition.maxAlternatives = 1

    recognition.onstart = () => setIsListening(true)

    recognition.onresult = (e) => {
      let interim = ''
      let finalText = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript
        if (e.results[i].isFinal) finalText += t
        else interim += t
      }
      if (onInterim) onInterim(interim)
      if (finalText.trim()) {
        if (onInterim) onInterim('')
        onResult(finalText.trim())
      }
    }

    recognition.onerror = (e) => {
      if (restartRef.current && e.error !== 'aborted' && e.error !== 'not-allowed') {
        setTimeout(() => { if (restartRef.current) startListening() }, 300)
      } else {
        setIsListening(false)
        restartRef.current = false
        if (onInterim) onInterim('')
      }
    }

    recognition.onend = () => {
      if (restartRef.current) {
        try { recognition.start() }
        catch { setTimeout(() => { if (restartRef.current) startListening() }, 200) }
      } else {
        setIsListening(false)
        if (onInterim) onInterim('')
      }
    }

    recognitionRef.current = recognition
    restartRef.current = true
    try { recognition.start() }
    catch { restartRef.current = false; setIsListening(false) }
  }, [onResult, onInterim])

  useEffect(() => {
    return () => { restartRef.current = false; recognitionRef.current?.stop() }
  }, [])

  return { isListening, supported: hasSpeechRecognition(), startListening, stopListening }
}

// ─── Public hook — auto-selects best engine ────────────────────────────────────
// Starts with 'detecting' state, resolves after async Brave check + speech test.
export function useVoiceInput(onResult, onInterim) {
  // 'pending' | 'whisper' | 'webspeech'
  const [engine, setEngine] = useState('pending')

  useEffect(() => {
    let cancelled = false
    async function detect() {
      const brave = await checkBrave()
      if (brave) {
        if (!cancelled) setEngine('whisper')
        return
      }
      if (!hasSpeechRecognition()) {
        if (!cancelled) setEngine('whisper')
        return
      }
      // Web Speech API present — verify it actually works (Brave blocks at runtime)
      const works = await testWebSpeechWorks()
      if (!cancelled) setEngine(works ? 'webspeech' : 'whisper')
    }
    detect()
    return () => { cancelled = true }
  }, [])

  const useWhisper = engine === 'whisper' || engine === 'pending'

  const whisper = useWhisperVoice(
    useWhisper ? onResult : () => {},
    useWhisper ? onInterim : () => {}
  )
  const webSpeech = useWebSpeechVoice(
    !useWhisper ? onResult : () => {},
    !useWhisper ? onInterim : () => {}
  )

  if (engine === 'pending') {
    // While detecting, return a neutral state — mic button will still work
    // after detection completes (state update triggers re-render)
    return { isListening: false, supported: true, startListening: () => {}, stopListening: () => {}, isProcessing: false, engine: 'pending' }
  }
  if (engine === 'whisper') return { ...whisper, engine: 'whisper' }
  return { ...webSpeech, engine: 'webspeech' }
}
