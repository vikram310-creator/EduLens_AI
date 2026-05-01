import { useState, useRef, useCallback, useEffect } from 'react'

// ─── Detect if Web Speech API is truly usable ────────────────────────────────
// Brave exposes webkitSpeechRecognition but blocks it at runtime (network error).
// We detect Brave via its navigator.brave API and fall back to Whisper WASM.
function detectBrave() {
  return !!(navigator.brave && navigator.brave.isBrave)
}

function hasSpeechRecognition() {
  return ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)
}

// ─── Whisper Worker (lazy-loaded) ────────────────────────────────────────────
// Runs @xenova/transformers Whisper-tiny entirely in a Web Worker (WASM).
// No server calls, no Google, works in Brave with Shields up.
let whisperWorker = null
let workerReady = false
const workerCallbacks = new Map()
let cbId = 0

function getWhisperWorker() {
  if (whisperWorker) return whisperWorker

  // Inline worker as a blob so we don't need an extra file
  const workerCode = `
import { pipeline } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2/dist/transformers.min.js';

let transcriber = null;

async function loadModel() {
  transcriber = await pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny.en', {
    chunk_length_s: 30,
    stride_length_s: 5,
  });
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
  whisperWorker = new Worker(url, { type: 'module' })

  whisperWorker.onmessage = (e) => {
    const { type, id, text, error } = e.data
    if (type === 'ready') {
      workerReady = true
      // Flush any queued callbacks
      workerCallbacks.forEach((cb) => cb.resolve && cb.resolve(null))
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
  // Wait until model is loaded
  if (!workerReady) {
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Model load timeout')), 30000)
      const orig = worker.onmessage
      const check = (e) => {
        if (e.data.type === 'ready') { clearTimeout(timeout); resolve() }
        else if (e.data.type === 'error' && !e.data.id) { clearTimeout(timeout); reject(new Error(e.data.error)) }
        if (orig) orig(e)
      }
      worker.onmessage = check
    })
  }
  const id = ++cbId
  return new Promise((resolve, reject) => {
    workerCallbacks.set(id, { resolve, reject })
    worker.postMessage({ type: 'transcribe', audio: float32Array, id })
  })
}

// ─── Whisper recorder hook ────────────────────────────────────────────────────
function useWhisperVoice(onResult, onInterim) {
  const [isListening, setIsListening] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const streamRef = useRef(null)
  const activeRef = useRef(false)

  // Pre-warm the worker (model download starts immediately)
  useEffect(() => {
    // Kick off download in background
    try { getWhisperWorker() } catch {}
  }, [])

  const stopListening = useCallback(() => {
    activeRef.current = false
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    streamRef.current?.getTracks().forEach(t => t.stop())
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
        if (!chunksRef.current.length) return
        setIsListening(false)
        setIsProcessing(true)
        if (onInterim) onInterim('⏳ Transcribing…')

        try {
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
          const arrayBuffer = await blob.arrayBuffer()
          const audioCtx = new AudioContext({ sampleRate: 16000 })
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
          audioCtx?.close?.()
        }

        // If still active, record next chunk
        if (activeRef.current) {
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
      // Stop after 5s to get a chunk, then restart
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

// ─── Web Speech API hook ──────────────────────────────────────────────────────
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

// ─── Public hook — auto-selects best engine ───────────────────────────────────
export function useVoiceInput(onResult, onInterim) {
  // Use Whisper if: Brave browser, OR Web Speech API not available
  const useWhisper = detectBrave() || !hasSpeechRecognition()

  const whisper = useWhisperVoice(
    useWhisper ? onResult : () => {},
    useWhisper ? onInterim : () => {}
  )
  const webSpeech = useWebSpeechVoice(
    !useWhisper ? onResult : () => {},
    !useWhisper ? onInterim : () => {}
  )

  if (useWhisper) {
    return { ...whisper, engine: 'whisper' }
  }
  return { ...webSpeech, engine: 'webspeech' }
}
