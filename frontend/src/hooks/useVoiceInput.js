import { useState, useRef, useCallback } from 'react'

export function useVoiceInput(onResult) {
  const [isListening, setIsListening] = useState(false)
  const [supported] = useState(() => 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window)
  const recognitionRef = useRef(null)

  const startListening = useCallback(() => {
    if (!supported) return
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'en-US'

    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript
      onResult(transcript)
      setIsListening(false)
    }
    recognition.onerror = () => setIsListening(false)
    recognition.onend = () => setIsListening(false)

    recognitionRef.current = recognition
    recognition.start()
    setIsListening(true)
  }, [supported, onResult])

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
    setIsListening(false)
  }, [])

  return { isListening, supported, startListening, stopListening }
}
