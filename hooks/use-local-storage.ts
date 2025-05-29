import { useState, useEffect, useCallback } from "react"

interface Message {
  role: "user" | "assistant"
  content: string
  timestamp: Date
  audio?: Blob
  model?: string
  provider?: "openai" | "lmstudio"
  responseTime?: number // in milliseconds
  tokensUsed?: number
  promptTokens?: number
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
  const [conversation, setConversation] = useState<Message[]>([])
  const [selectedVoice, setSelectedVoice] = useState<string>("alloy")
  const [apiKey, setApiKey] = useState<string>("")

  // Load data from localStorage on mount
  useEffect(() => {
    loadFromStorage()
  }, [])

  // Save conversation to localStorage whenever it changes
  useEffect(() => {
    if (conversation.length > 0) {
      localStorage.setItem(STORAGE_KEYS.CONVERSATION, JSON.stringify(conversation))
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

  const addMessage = useCallback((role: "user" | "assistant", content: string, timestamp?: Date, audio?: Blob, model?: string, provider?: "openai" | "lmstudio", responseTime?: number, tokensUsed?: number, promptTokens?: number) => {
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
    }
    setConversation((prev) => [...prev, message])
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
    isApiKeyValid,
    loadFromStorage
  }
}