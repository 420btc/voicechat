"use client"

import { useState, useRef, useCallback, useEffect } from "react"

// Declaraciones de tipos para SpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition
    webkitSpeechRecognition: new () => SpeechRecognition
  }
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number
  results: SpeechRecognitionResultList
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string
  message: string
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  maxAlternatives: number
  start(): void
  stop(): void
  abort(): void
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null
  onend: ((this: SpeechRecognition, ev: Event) => any) | null
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null
}

interface RealTimeTranscriptionOptions {
  language?: string
  continuous?: boolean
  interimResults?: boolean
  maxAlternatives?: number
}

export function useRealTimeTranscription(options: RealTimeTranscriptionOptions = {}) {
  const [isSupported, setIsSupported] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [confidence, setConfidence] = useState(0)
  const [error, setError] = useState<string | null>(null)
  
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const isInitializedRef = useRef(false)

  // Initialize speech recognition
  useEffect(() => {
    if (isInitializedRef.current) return
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    
    if (SpeechRecognition) {
      setIsSupported(true)
      
      const recognition = new SpeechRecognition()
      recognition.continuous = options.continuous ?? true
      recognition.interimResults = options.interimResults ?? true
      recognition.lang = options.language ?? 'es-ES'
      recognition.maxAlternatives = options.maxAlternatives ?? 1
      
      recognition.onstart = () => {
        setIsListening(true)
        setError(null)
      }
      
      recognition.onend = () => {
        setIsListening(false)
      }
      
      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        setError(event.error)
        setIsListening(false)
      }
      
      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let finalTranscript = ''
        let interimTranscript = ''
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i]
          const transcript = result[0].transcript
          
          if (result.isFinal) {
            finalTranscript += transcript
            setConfidence(result[0].confidence)
          } else {
            interimTranscript += transcript
          }
        }
        
        if (finalTranscript) {
          setTranscript(prev => prev + finalTranscript)
        }
        
        setInterimTranscript(interimTranscript)
      }
      
      recognitionRef.current = recognition
      isInitializedRef.current = true
    } else {
      setIsSupported(false)
      setError('Speech recognition no está soportado en este navegador')
    }
  }, [options.continuous, options.interimResults, options.language, options.maxAlternatives])

  const startListening = useCallback(() => {
    if (!recognitionRef.current || isListening) return
    
    try {
      setTranscript('')
      setInterimTranscript('')
      setError(null)
      recognitionRef.current.start()
    } catch (error) {
      setError('Error al iniciar el reconocimiento de voz')
    }
  }, [isListening])

  const stopListening = useCallback(() => {
    if (!recognitionRef.current || !isListening) return
    
    try {
      recognitionRef.current.stop()
    } catch (error) {
      setError('Error al detener el reconocimiento de voz')
    }
  }, [isListening])

  const resetTranscript = useCallback(() => {
    setTranscript('')
    setInterimTranscript('')
    setConfidence(0)
  }, [])

  // Get the full text including interim results
  const fullTranscript = transcript + interimTranscript

  return {
    isSupported,
    isListening,
    transcript,
    interimTranscript,
    fullTranscript,
    confidence,
    error,
    startListening,
    stopListening,
    resetTranscript
  }
}