"use client"

import { useState, useEffect, useCallback } from "react"
import { useLocalStorage } from "./use-local-storage"

interface MemoryEntry {
  id: string
  content: string
  keywords: string[]
  timestamp: Date
  relevanceScore: number
  conversationId?: string
  category: 'personal' | 'preference' | 'fact' | 'context'
}

interface LongTermMemoryData {
  entries: MemoryEntry[]
  userPreferences: Record<string, any>
  conversationSummaries: Record<string, string>
}

const MEMORY_STORAGE_KEY = "ai-chat-long-term-memory"
const MAX_MEMORY_ENTRIES = 1000
const RELEVANCE_THRESHOLD = 0.3

export function useLongTermMemory() {
  const [memoryData, setMemoryData] = useState<LongTermMemoryData>({
    entries: [],
    userPreferences: {},
    conversationSummaries: {}
  })
  const [isLoaded, setIsLoaded] = useState(false)

  // Load memory data from localStorage
  useEffect(() => {
    const loadMemoryData = () => {
      try {
        const stored = localStorage.getItem(MEMORY_STORAGE_KEY)
        if (stored) {
          const parsed = JSON.parse(stored)
          // Convert timestamp strings back to Date objects
          const processedEntries = parsed.entries?.map((entry: any) => ({
            ...entry,
            timestamp: new Date(entry.timestamp)
          })) || []
          
          setMemoryData({
            entries: processedEntries,
            userPreferences: parsed.userPreferences || {},
            conversationSummaries: parsed.conversationSummaries || {}
          })
        }
      } catch (error) {
        console.error("Error loading long-term memory:", error)
      } finally {
        setIsLoaded(true)
      }
    }

    loadMemoryData()
  }, [])

  // Save memory data to localStorage
  const saveMemoryData = useCallback((data: LongTermMemoryData) => {
    try {
      localStorage.setItem(MEMORY_STORAGE_KEY, JSON.stringify(data))
      setMemoryData(data)
    } catch (error) {
      console.error("Error saving long-term memory:", error)
    }
  }, [])

  // Extract keywords from text
  const extractKeywords = useCallback((text: string): string[] => {
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3)
    
    // Remove common words
    const stopWords = new Set(['este', 'esta', 'estos', 'estas', 'para', 'como', 'cuando', 'donde', 'porque', 'pero', 'aunque', 'mientras', 'desde', 'hasta', 'sobre', 'entre', 'durante', 'antes', 'después', 'también', 'además', 'entonces', 'ahora', 'aquí', 'allí', 'muy', 'más', 'menos', 'todo', 'todos', 'todas', 'cada', 'otro', 'otra', 'otros', 'otras', 'mismo', 'misma', 'mismos', 'mismas'])
    
    return [...new Set(words.filter(word => !stopWords.has(word)))].slice(0, 10)
  }, [])

  // Calculate relevance score between two texts
  const calculateRelevance = useCallback((text1: string, text2: string): number => {
    const keywords1 = new Set(extractKeywords(text1))
    const keywords2 = new Set(extractKeywords(text2))
    
    const intersection = new Set([...keywords1].filter(x => keywords2.has(x)))
    const union = new Set([...keywords1, ...keywords2])
    
    return union.size > 0 ? intersection.size / union.size : 0
  }, [extractKeywords])

  // Add new memory entry
  const addMemoryEntry = useCallback((content: string, category: MemoryEntry['category'] = 'context', conversationId?: string) => {
    if (!content.trim() || content.length < 10) return

    const newEntry: MemoryEntry = {
      id: Date.now().toString(),
      content: content.trim(),
      keywords: extractKeywords(content),
      timestamp: new Date(),
      relevanceScore: 1.0,
      conversationId,
      category
    }

    const updatedData = { ...memoryData }
    updatedData.entries = [newEntry, ...updatedData.entries]

    // Keep only the most recent entries
    if (updatedData.entries.length > MAX_MEMORY_ENTRIES) {
      updatedData.entries = updatedData.entries.slice(0, MAX_MEMORY_ENTRIES)
    }

    saveMemoryData(updatedData)
  }, [memoryData, extractKeywords, saveMemoryData])

  // Retrieve relevant memories for a given context
  const getRelevantMemories = useCallback((context: string, limit: number = 5): MemoryEntry[] => {
    if (!context.trim()) return []

    const scoredEntries = memoryData.entries.map(entry => ({
      ...entry,
      relevanceScore: calculateRelevance(context, entry.content)
    }))

    return scoredEntries
      .filter(entry => entry.relevanceScore >= RELEVANCE_THRESHOLD)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit)
  }, [memoryData.entries, calculateRelevance])

  // Update user preference
  const updateUserPreference = useCallback((key: string, value: any) => {
    const updatedData = {
      ...memoryData,
      userPreferences: {
        ...memoryData.userPreferences,
        [key]: value
      }
    }
    saveMemoryData(updatedData)
  }, [memoryData, saveMemoryData])

  // Add conversation summary
  const addConversationSummary = useCallback((conversationId: string, summary: string) => {
    const updatedData = {
      ...memoryData,
      conversationSummaries: {
        ...memoryData.conversationSummaries,
        [conversationId]: summary
      }
    }
    saveMemoryData(updatedData)
  }, [memoryData, saveMemoryData])

  // Generate context for AI based on current input
  const generateContextualPrompt = useCallback((userInput: string): string => {
    const relevantMemories = getRelevantMemories(userInput, 3)
    
    if (relevantMemories.length === 0) return ""

    const memoryContext = relevantMemories
      .map(memory => `- ${memory.content}`)
      .join('\n')

    return `\n\nContexto relevante de conversaciones anteriores:\n${memoryContext}\n\nTen en cuenta este contexto al responder, pero no lo menciones explícitamente a menos que sea directamente relevante.`
  }, [getRelevantMemories])

  // Clear all memory data
  const clearMemory = useCallback(() => {
    const emptyData: LongTermMemoryData = {
      entries: [],
      userPreferences: {},
      conversationSummaries: {}
    }
    saveMemoryData(emptyData)
  }, [saveMemoryData])

  return {
    isLoaded,
    memoryData,
    addMemoryEntry,
    getRelevantMemories,
    updateUserPreference,
    addConversationSummary,
    generateContextualPrompt,
    clearMemory
  }
}