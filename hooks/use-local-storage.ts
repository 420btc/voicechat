"use client"

import { useState, useEffect, useCallback, startTransition } from "react"
import { AIProvider } from "./use-openai"

interface Message {
  role: "user" | "assistant"
  content: string
  timestamp: Date
  audio?: Blob
  model?: string
  provider?: AIProvider
  responseTime?: number // in milliseconds
  tokensUsed?: number
  promptTokens?: number
  images?: File[]
  files?: File[]
  generatedImages?: Array<{url: string, mimeType: string}>
}

interface StoredApiKey {
  key: string
  timestamp: number
}

interface LocalStorageData {
  conversation: Message[]
  selectedVoice: string
  apiKey: StoredApiKey | null
}

const STORAGE_KEYS = {
  CONVERSATION: "ai-chat-conversation",
  SELECTED_VOICE: "ai-chat-selected-voice",
  API_KEY: "ai-chat-api-key"
}

const API_KEY_EXPIRY_HOURS = 24

export function useLocalStorage() {
  // Clear localStorage if it's corrupted or too large
  const clearCorruptedStorage = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CONVERSATION)
      if (stored && stored.length > 5000000) { // If larger than 5MB
        console.log('Clearing large localStorage data')
        localStorage.removeItem(STORAGE_KEYS.CONVERSATION)
      }
    } catch (error) {
      console.log('Clearing corrupted localStorage')
      localStorage.clear()
    }
  }

  const [conversation, setConversation] = useState<Message[]>([])
  const [selectedVoice, setSelectedVoice] = useState<string>("alloy")
  const [apiKey, setApiKey] = useState<string>("")

  // Load data from localStorage on mount
  useEffect(() => {
    clearCorruptedStorage() // Clean up first
    loadFromStorage()
  }, [])

  // Save conversation to localStorage whenever it changes (with debounce to avoid blocking)
  useEffect(() => {
    if (conversation.length > 0) {
      // Use requestIdleCallback or setTimeout to avoid blocking the UI
      const timeoutId = setTimeout(() => {
        try {
          // Remove images and generated images before saving to avoid localStorage quota issues
          const conversationToSave = conversation.map(msg => ({
            ...msg,
            images: undefined, // Don't save user images (File objects)
            generatedImages: undefined, // Don't save generated images
            audio: undefined // Don't save audio blobs either
          }))
          localStorage.setItem(STORAGE_KEYS.CONVERSATION, JSON.stringify(conversationToSave))
        } catch (error) {
          console.error("Error saving conversation:", error)
        }
      }, 0)
      return () => clearTimeout(timeoutId)
    }
  }, [conversation])

  // Save selected voice to localStorage whenever it changes
  useEffect(() => {
    if (selectedVoice) {
      localStorage.setItem(STORAGE_KEYS.SELECTED_VOICE, selectedVoice)
    }
  }, [selectedVoice])

  const loadFromStorage = useCallback(() => {
    try {
      // Load conversation
      const storedConversation = localStorage.getItem(STORAGE_KEYS.CONVERSATION)
      if (storedConversation) {
        const parsedConversation = JSON.parse(storedConversation)
        // Convert timestamp strings back to Date objects
        const conversationWithDates = parsedConversation.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }))
        setConversation(conversationWithDates)
      }

      // Load selected voice
      const storedVoice = localStorage.getItem(STORAGE_KEYS.SELECTED_VOICE)
      if (storedVoice) {
        setSelectedVoice(storedVoice)
      }

      // Load API key with expiry check
      const storedApiKey = localStorage.getItem(STORAGE_KEYS.API_KEY)
      if (storedApiKey) {
        const parsedApiKey: StoredApiKey = JSON.parse(storedApiKey)
        const now = Date.now()
        const expiryTime = parsedApiKey.timestamp + (API_KEY_EXPIRY_HOURS * 60 * 60 * 1000)
        
        if (now < expiryTime) {
          // API key is still valid
          setApiKey(parsedApiKey.key)
        } else {
          // API key has expired, remove it
          localStorage.removeItem(STORAGE_KEYS.API_KEY)
          setApiKey("")
        }
      }
    } catch (error) {
      console.error("Error loading from localStorage:", error)
    }
  }, [])

  const saveApiKey = useCallback((key: string) => {
    const storedApiKey: StoredApiKey = {
      key,
      timestamp: Date.now()
    }
    localStorage.setItem(STORAGE_KEYS.API_KEY, JSON.stringify(storedApiKey))
    setApiKey(key)
  }, [])

  const removeApiKey = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.API_KEY)
    setApiKey("")
  }, [])

  const addMessage = useCallback((role: "user" | "assistant", content: string, timestamp?: Date, audio?: Blob, model?: string, provider?: AIProvider, responseTime?: number, tokensUsed?: number, promptTokens?: number, images?: File[], files?: File[], generatedImages?: Array<{url: string, mimeType: string}>) => {
    const message: Message = {
      role,
      content,
      timestamp: timestamp || new Date(),
      audio,
      model,
      provider,
      responseTime,
      tokensUsed,
      promptTokens,
      images,
      files,
      // Don't save generated images to localStorage to avoid quota issues
      generatedImages: role === 'assistant' ? generatedImages : undefined,
    }
    // Use startTransition to prioritize UI updates
    startTransition(() => {
      setConversation((prev) => [...prev, message])
    })
  }, [])

  const clearConversation = useCallback(() => {
    setConversation([])
    localStorage.removeItem(STORAGE_KEYS.CONVERSATION)
  }, [])

  const clearAllData = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.CONVERSATION)
    localStorage.removeItem(STORAGE_KEYS.SELECTED_VOICE)
    localStorage.removeItem(STORAGE_KEYS.API_KEY)
    setConversation([])
    setSelectedVoice("alloy")
    setApiKey("")
  }, [])

  const forceResetApp = useCallback(() => {
    try {
      // Nuclear option: clear ALL localStorage data related to the app
      const keysToRemove = Object.keys(localStorage).filter(key => 
        key.includes('ai-chat') || 
        key.includes('conversation') || 
        key.includes('image') ||
        key.includes('auto-save') ||
        key.includes('user-data') ||
        key.includes('theme')
      )
      
      keysToRemove.forEach(key => {
        localStorage.removeItem(key)
        console.log(`Force removed: ${key}`)
      })
      
      // Reset all state
      setConversation([])
      setSelectedVoice("alloy")
      setApiKey("")
      
      console.log("Aplicación completamente reiniciada")
      
      // Force page reload to ensure clean state
      setTimeout(() => {
        window.location.reload()
      }, 1000)
      
    } catch (error) {
      console.error("Error al reiniciar la aplicación:", error)
    }
  }, [])

  const clearCorruptedData = useCallback(() => {
    try {
      // Clear conversation data that might contain corrupted File objects
      localStorage.removeItem(STORAGE_KEYS.CONVERSATION)
      
      // Also clear any other potential corrupted data
      const keysToCheck = Object.keys(localStorage)
      keysToCheck.forEach(key => {
        if (key.includes('ai-chat') || key.includes('conversation') || key.includes('image')) {
          try {
            const value = localStorage.getItem(key)
            if (value && value.includes('[object File]')) {
              localStorage.removeItem(key)
              console.log(`Removed corrupted key: ${key}`)
            }
          } catch (e) {
            // If we can't parse it, it might be corrupted, remove it
            localStorage.removeItem(key)
            console.log(`Removed unparseable key: ${key}`)
          }
        }
      })
      
      // Reset conversation to empty array
      setConversation([])
      
      console.log("Datos corruptos limpiados del localStorage")
    } catch (error) {
      console.error("Error al limpiar datos corruptos:", error)
    }
  }, [])

  const updateLastUserMessageWithPromptTokens = useCallback((promptTokens: number) => {
    setConversation(prev => {
      const updated = [...prev]
      // Find the last user message and update it with prompt tokens
      for (let i = updated.length - 1; i >= 0; i--) {
        if (updated[i].role === "user") {
          updated[i] = { ...updated[i], promptTokens }
          break
        }
      }
      localStorage.setItem(STORAGE_KEYS.CONVERSATION, JSON.stringify(updated))
      return updated
    })
  }, [])

  const isApiKeyValid = useCallback(() => {
    const storedApiKey = localStorage.getItem(STORAGE_KEYS.API_KEY)
    if (!storedApiKey) return false
    
    try {
      const parsedApiKey: StoredApiKey = JSON.parse(storedApiKey)
      const now = Date.now()
      const expiryTime = parsedApiKey.timestamp + (API_KEY_EXPIRY_HOURS * 60 * 60 * 1000)
      return now < expiryTime
    } catch {
      return false
    }
  }, [])

  return {
    // State
    conversation,
    selectedVoice,
    apiKey,
    
    // Actions
    setSelectedVoice,
    setConversation,
    addMessage,
    updateLastUserMessageWithPromptTokens,
    saveApiKey,
    removeApiKey,
    clearConversation,
    clearAllData,
    clearCorruptedData,
    forceResetApp,
    isApiKeyValid,
    loadFromStorage
  }
}