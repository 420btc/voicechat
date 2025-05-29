"use client"

import { useState, useEffect } from "react"
import { SavedConversation } from "@/components/conversation-manager"
import { ThemeSettings } from "@/components/theme-selector"
import { AIProvider } from "./use-openai"

interface AISettings {
  provider: AIProvider
  openaiApiKey: string
  lmstudioApiKey: string
  lmstudioBaseUrl: string
  lmstudioModel: string
}

interface UserData {
  name: string
  avatar?: string
  savedConversations: SavedConversation[]
  themeSettings: ThemeSettings
  aiSettings: AISettings
}

const DEFAULT_USER_DATA: UserData = {
  name: "Usuario",
  avatar: "",
  savedConversations: [],
  themeSettings: {
    theme: "dark",
    accentColor: "blue",
    reducedMotion: false,
    fontSize: 14,
    highContrast: false
  },
  aiSettings: {
    provider: "openai",
    openaiApiKey: "",
    lmstudioApiKey: "lm-studio",
    lmstudioBaseUrl: "http://localhost:1234",
    lmstudioModel: "local-model"
  }
}

const STORAGE_KEY = "ai-voice-chat-user-data"

export function useUserData() {
  const [userData, setUserData] = useState<UserData>(DEFAULT_USER_DATA)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load user data from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        // Convert date strings back to Date objects
        if (parsed.savedConversations) {
          parsed.savedConversations = parsed.savedConversations.map((conv: any) => ({
            ...conv,
            createdAt: new Date(conv.createdAt),
            updatedAt: new Date(conv.updatedAt),
            messages: conv.messages.map((msg: any) => ({
              ...msg,
              timestamp: new Date(msg.timestamp)
            }))
          }))
        }
        setUserData({ ...DEFAULT_USER_DATA, ...parsed })
      }
    } catch (error) {
      console.error("Error loading user data:", error)
    } finally {
      setIsLoaded(true)
    }
  }, [])

  // Save user data to localStorage whenever it changes
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(userData))
      } catch (error) {
        console.error("Error saving user data:", error)
      }
    }
  }, [userData, isLoaded])

  const updateUserName = (name: string) => {
    setUserData(prev => ({ ...prev, name }))
  }

  const updateUserAvatar = (avatar: string) => {
    setUserData(prev => ({ ...prev, avatar }))
  }

  const updateThemeSettings = (themeSettings: ThemeSettings) => {
    setUserData(prev => ({ ...prev, themeSettings }))
  }

  const updateAISettings = (newSettings: Partial<AISettings>) => {
    setUserData(prev => ({
      ...prev,
      aiSettings: { ...prev.aiSettings, ...newSettings }
    }))
  }

  const saveConversation = (
    title: string,
    messages: Array<{
      role: "user" | "assistant"
      content: string
      timestamp: Date
      audio?: Blob
    }>
  ) => {
    const newConversation: SavedConversation = {
      id: Date.now().toString(),
      title,
      messages,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    setUserData(prev => ({
      ...prev,
      savedConversations: [newConversation, ...prev.savedConversations]
    }))

    return newConversation.id
  }

  const deleteConversation = (id: string) => {
    setUserData(prev => ({
      ...prev,
      savedConversations: prev.savedConversations.filter(conv => conv.id !== id)
    }))
  }

  const updateConversation = (
    id: string,
    updates: Partial<Omit<SavedConversation, 'id' | 'createdAt'>>
  ) => {
    setUserData(prev => ({
      ...prev,
      savedConversations: prev.savedConversations.map(conv =>
        conv.id === id
          ? { ...conv, ...updates, updatedAt: new Date() }
          : conv
      )
    }))
  }

  const getConversationById = (id: string): SavedConversation | undefined => {
    return userData.savedConversations.find(conv => conv.id === id)
  }

  const exportUserData = (): string => {
    return JSON.stringify(userData, null, 2)
  }

  const importUserData = (jsonData: string): boolean => {
    try {
      const imported = JSON.parse(jsonData)
      // Validate the structure
      if (imported && typeof imported === 'object') {
        // Convert date strings back to Date objects
        if (imported.savedConversations) {
          imported.savedConversations = imported.savedConversations.map((conv: any) => ({
            ...conv,
            createdAt: new Date(conv.createdAt),
            updatedAt: new Date(conv.updatedAt),
            messages: conv.messages.map((msg: any) => ({
              ...msg,
              timestamp: new Date(msg.timestamp)
            }))
          }))
        }
        setUserData({ ...DEFAULT_USER_DATA, ...imported })
        return true
      }
      return false
    } catch (error) {
      console.error("Error importing user data:", error)
      return false
    }
  }

  const clearAllData = () => {
    setUserData(DEFAULT_USER_DATA)
    localStorage.removeItem(STORAGE_KEY)
  }

  return {
    userData,
    isLoaded,
    updateUserName,
    updateUserAvatar,
    updateThemeSettings,
    updateAISettings,
    saveConversation,
    deleteConversation,
    updateConversation,
    getConversationById,
    exportUserData,
    importUserData,
    clearAllData
  }
}