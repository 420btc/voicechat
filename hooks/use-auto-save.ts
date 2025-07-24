"use client"

import { useEffect, useRef, useCallback } from "react"

interface Message {
  role: "user" | "assistant"
  content: string
  timestamp: Date
  audio?: Blob
  model?: string
  provider?: string
  responseTime?: number
  tokensUsed?: number
  promptTokens?: number
  images?: File[]
}

interface AutoSaveOptions {
  conversation: Message[]
  onSave: (title: string, messages: Message[]) => void
  intervalMs?: number // Default: 5 minutes
  minMessages?: number // Minimum messages before auto-save (default: 2)
  enabled?: boolean // Default: true
}

export function useAutoSave({
  conversation,
  onSave,
  intervalMs = 60 * 1000, // 1 minute
  minMessages = 1,
  enabled = true
}: AutoSaveOptions) {
  const lastSaveRef = useRef<number>(0)
  const lastConversationLengthRef = useRef<number>(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const shouldAutoSave = useCallback(() => {
    if (!enabled) return false
    if (conversation.length < minMessages) return false
    
    const now = Date.now()
    const timeSinceLastSave = now - lastSaveRef.current
    
    return timeSinceLastSave >= intervalMs
  }, [conversation.length, enabled, minMessages, intervalMs])

  const performAutoSave = useCallback(() => {
    if (!shouldAutoSave()) return
    
    const now = new Date()
    const autoTitle = `Auto-guardado ${now.toLocaleDateString('es-ES')} ${now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`
    
    try {
      onSave(autoTitle, conversation)
      lastSaveRef.current = Date.now()
      lastConversationLengthRef.current = conversation.length
      
      // Auto-save completed silently
    } catch (error) {
      console.error('Error en auto-guardado:', error)
    }
  }, [shouldAutoSave, onSave, conversation])

  // Set up auto-save interval
  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    // Set up new interval
    intervalRef.current = setInterval(performAutoSave, intervalMs)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [enabled, intervalMs, performAutoSave])

  // Update conversation length reference when conversation changes
  useEffect(() => {
    lastConversationLengthRef.current = conversation.length
  }, [conversation.length])

  // Manual save function
  const manualSave = useCallback(() => {
    if (conversation.length === 0) return false
    
    const now = new Date()
    const manualTitle = `Guardado manual ${now.toLocaleDateString('es-ES')} ${now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`
    
    try {
      onSave(manualTitle, conversation)
      lastSaveRef.current = Date.now()
      lastConversationLengthRef.current = conversation.length
      return true
    } catch (error) {
      console.error('Error en guardado manual:', error)
      return false
    }
  }, [conversation, onSave])

  // Get auto-save status
  const getStatus = useCallback(() => {
    const timeSinceLastSave = Date.now() - lastSaveRef.current
    const nextSaveIn = Math.max(0, intervalMs - timeSinceLastSave)
    
    return {
      enabled,
      lastSave: lastSaveRef.current > 0 ? new Date(lastSaveRef.current) : null,
      nextSaveIn: Math.ceil(nextSaveIn / 1000), // seconds
      canAutoSave: shouldAutoSave(),
      messageCount: conversation.length
    }
  }, [enabled, intervalMs, shouldAutoSave, conversation.length])

  return {
    manualSave,
    getStatus,
    performAutoSave
  }
}