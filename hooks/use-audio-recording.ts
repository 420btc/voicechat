"use client"

import { useState, useRef, useCallback } from "react"

export function useAudioRecording() {
  const [isRecording, setIsRecording] = useState(false)
  const [audioLevel, setAudioLevel] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)

  const [isCancelled, setIsCancelled] = useState(false)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const isCancelledRef = useRef<boolean>(false)

  const startRecording = useCallback(async () => {
    if (isRecording) return

    // Clear previous audio blob and reset cancelled state
    setAudioBlob(null)
    setIsCancelled(false)
    isCancelledRef.current = false

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      })

      streamRef.current = stream

      // Set up audio analysis for visualization
      const audioContext = new AudioContext()
      const analyser = audioContext.createAnalyser()
      const source = audioContext.createMediaStreamSource(stream)

      analyser.fftSize = 256
      source.connect(analyser)

      audioContextRef.current = audioContext
      analyserRef.current = analyser

      // Start level monitoring for visualization
      const dataArray = new Uint8Array(analyser.frequencyBinCount)
      
      const updateLevel = () => {
        if (analyserRef.current && isRecording) {
          analyserRef.current.getByteFrequencyData(dataArray)
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length
          const normalizedLevel = average / 255
          setAudioLevel(normalizedLevel)
          
          requestAnimationFrame(updateLevel)
        }
      }
      updateLevel()

      // Set up MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      })

      const chunks: Blob[] = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        if (!isCancelledRef.current) {
          const blob = new Blob(chunks, { type: "audio/webm;codecs=opus" })
          setAudioBlob(blob)
        }
        setAudioLevel(0)
        setIsCancelled(false) // Reset for next recording
        isCancelledRef.current = false // Reset ref for next recording
      }

      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.start()
      setIsRecording(true)
    } catch (error) {
      console.error("Error starting recording:", error)
    }
  }, [isRecording])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)

      // Clean up media resources
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [isRecording])

  const cancelRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      // Mark as cancelled to prevent audio processing
      setIsCancelled(true)
      isCancelledRef.current = true
      setIsRecording(false)

      // Clean up media resources
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }

      // Stop the media recorder (onstop will check isCancelled flag)
      if (mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop()
      }
    }
  }, [isRecording])



  return {
    isRecording,
    audioLevel,
    audioBlob,
    isCancelled,
    startRecording,
    stopRecording,
    cancelRecording,
  }
}
