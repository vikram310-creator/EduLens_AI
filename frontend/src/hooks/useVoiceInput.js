import { useState, useRef, useCallback, useEffect } from 'react'

export function useVoiceInput(onResult, onInterim) {
  const [isListening, setIsListening] = useState(false)
  const [supported] = useState(
    () => 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window
  )
  const recognitionRef = useRef(null)
  const restartRef = useRef(false)

  const stopListening = useCallback(() => {
    restartRef.current = false
    recognitionRef.current?.stop()
    setIsListening(false)
    if (onInterim) onInterim('')
  }, [onInterim])

  const startListening = useCallback(() => {
    if (!supported) return

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()

    // continuous + interimResults = real-time "type as you speak"
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'
    recognition.maxAlternatives = 1

    recognition.onstart = () => setIsListening(true)

    recognition.onresult = (e) => {
      let interim = ''
      let finalText = ''

      for (let i = e.resultIndex; i < e.results.length; i++) {
        const transcript = e.results[i][0].transcript
        if (e.results[i].isFinal) {
          finalText += transcript
        } else {
          interim += transcript
        }
      }

      // Show live interim text in chatbox while speaking
      if (onInterim) onInterim(interim)

      // Commit finalized words to the input
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
      // Auto-restart to keep mic open
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
    catch (err) { restartRef.current = false; setIsListening(false) }
  }, [supported, onResult, onInterim])

  useEffect(() => {
    return () => { restartRef.current = false; recognitionRef.current?.stop() }
  }, [])

  return { isListening, supported, startListening, stopListening }
}
