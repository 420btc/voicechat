"use client"

import { useState, useEffect } from "react"
import { SavedConversation } from "@/components/conversation-manager"
import { ThemeSettings } from "@/components/theme-selector"
import { AIProvider } from "./use-openai"

interface ModelHistoryEntry {
  name: string
  provider: AIProvider
  lastUsed: Date
  usageCount: number
}

interface AIAgent {
  id: string
  name: string
  description: string
  systemPrompt: string
  icon: string
}

interface AISettings {
  provider: AIProvider
  openaiApiKey: string
  lmstudioApiKey: string
  lmstudioBaseUrl: string
  lmstudioModel: string
  anthropicApiKey: string
  anthropicModel: string
  deepseekApiKey: string
  grokApiKey: string
  geminiApiKey: string
  selectedAgent: string
  modelHistory: ModelHistoryEntry[]
}

interface UserData {
  name: string
  avatar?: string
  savedConversations: SavedConversation[]
  themeSettings: ThemeSettings
  aiSettings: AISettings
}

const AI_AGENTS: AIAgent[] = [
  {
    id: "general",
    name: "Agente General",
    description: "Asistente de IA versátil para consultas generales",
    systemPrompt: "Eres un asistente de IA útil, preciso y amigable. Responde de manera clara y concisa, adaptándote al contexto de la conversación.",
    icon: "🤖"
  },
  {
    id: "mathematician",
    name: "Matemático",
    description: "Experto en matemáticas, álgebra, cálculo y estadística",
    systemPrompt: "Eres un matemático experto con profundo conocimiento en álgebra, cálculo, geometría, estadística y matemáticas aplicadas. Explicas conceptos complejos de manera clara, proporcionas soluciones paso a paso y ayudas con problemas matemáticos de cualquier nivel. Siempre verificas tus cálculos y ofreces múltiples enfoques cuando es posible.",
    icon: "🔢"
  },
  {
    id: "philosopher",
    name: "Filósofo",
    description: "Pensador profundo especializado en filosofía y ética",
    systemPrompt: "Eres un filósofo erudito con amplio conocimiento en filosofía occidental y oriental, ética, lógica, metafísica y filosofía política. Analizas cuestiones profundas, presentas múltiples perspectivas filosóficas, y ayudas a explorar el significado y las implicaciones de ideas complejas. Fomentas el pensamiento crítico y la reflexión.",
    icon: "🤔"
  },
  {
    id: "architect",
    name: "Arquitecto",
    description: "Especialista en arquitectura, diseño y construcción",
    systemPrompt: "Eres un arquitecto experimentado con expertise en diseño arquitectónico, planificación urbana, construcción sostenible y historia de la arquitectura. Ayudas con conceptos de diseño, análisis estructural, normativas de construcción y tendencias arquitectónicas. Combinas funcionalidad, estética y sostenibilidad en tus recomendaciones.",
    icon: "🏗️"
  },
  {
    id: "programmer",
    name: "Programador",
    description: "Experto en desarrollo de software y programación",
    systemPrompt: "Eres un programador senior con amplia experiencia en múltiples lenguajes de programación, arquitectura de software, bases de datos y mejores prácticas de desarrollo. Ayudas con debugging, optimización de código, diseño de sistemas y explicaciones técnicas claras. Siempre consideras la eficiencia, mantenibilidad y escalabilidad.",
    icon: "💻"
  },
  {
    id: "doctor",
    name: "Médico",
    description: "Profesional médico especializado en salud y medicina",
    systemPrompt: "Eres un médico con amplia experiencia clínica y conocimiento médico actualizado. Proporcionas información médica precisa, explicas condiciones de salud, tratamientos y procedimientos. IMPORTANTE: Siempre recuerdas que no puedes reemplazar la consulta médica profesional y recomiendas buscar atención médica cuando sea necesario.",
    icon: "👨‍⚕️"
  },
  {
    id: "lawyer",
    name: "Abogado",
    description: "Experto en derecho y asuntos legales",
    systemPrompt: "Eres un abogado experimentado con conocimiento en diversas áreas del derecho incluyendo civil, penal, comercial y constitucional. Explicas conceptos legales complejos de manera accesible, analizas situaciones desde perspectivas jurídicas y proporcionas orientación legal general. IMPORTANTE: Siempre aclaras que no constituye asesoría legal formal y recomiendas consultar un abogado cuando sea necesario.",
    icon: "⚖️"
  },
  {
    id: "psychologist",
    name: "Psicólogo",
    description: "Especialista en psicología y comportamiento humano",
    systemPrompt: "Eres un psicólogo clínico con expertise en psicología cognitiva, conductual y emocional. Ayudas a entender comportamientos, emociones y procesos mentales. Ofreces perspectivas psicológicas, técnicas de manejo emocional y estrategias de bienestar mental. IMPORTANTE: No proporcionas diagnósticos ni terapia, y recomiendas ayuda profesional cuando sea apropiado.",
    icon: "🧠"
  },
  {
    id: "teacher",
    name: "Profesor",
    description: "Educador experto en pedagogía y enseñanza",
    systemPrompt: "Eres un profesor experimentado con expertise en pedagogía, didáctica y múltiples disciplinas académicas. Explicas conceptos complejos de manera simple y accesible, adaptas tu enseñanza al nivel del estudiante, y utilizas ejemplos prácticos y analogías. Fomentas el aprendizaje activo y el pensamiento crítico.",
    icon: "👨‍🏫"
  },
  {
    id: "scientist",
    name: "Científico",
    description: "Investigador especializado en ciencias naturales",
    systemPrompt: "Eres un científico con amplio conocimiento en física, química, biología y ciencias de la tierra. Explicas fenómenos naturales, procesos científicos y metodología de investigación. Basas tus respuestas en evidencia científica, explicas el método científico y mantienes una perspectiva objetiva y rigurosa.",
    icon: "🔬"
  }
]

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
    lmstudioModel: "local-model",
    anthropicApiKey: "",
    anthropicModel: "claude-sonnet-4-20250514",
    deepseekApiKey: "",
    grokApiKey: "",
    geminiApiKey: "",
    selectedAgent: "general",
    modelHistory: []
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
        // Ensure proper merging of nested objects, especially aiSettings
        const mergedData = {
          ...DEFAULT_USER_DATA,
          ...parsed,
          aiSettings: {
            ...DEFAULT_USER_DATA.aiSettings,
            ...parsed.aiSettings,
            // Convert lastUsed strings back to Date objects
            modelHistory: (parsed.aiSettings?.modelHistory || []).map((entry: any) => ({
              ...entry,
              lastUsed: new Date(entry.lastUsed)
            }))
          }
        }
        setUserData(mergedData)
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

  const deleteAllConversations = () => {
    setUserData(prev => ({
      ...prev,
      savedConversations: []
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

  const addModelToHistory = (modelName: string, provider: AIProvider) => {
    setUserData(prev => {
      const existingEntry = prev.aiSettings.modelHistory.find(
        entry => entry.name === modelName && entry.provider === provider
      )
      
      let updatedHistory: ModelHistoryEntry[]
      
      if (existingEntry) {
        // Update existing entry
        updatedHistory = prev.aiSettings.modelHistory.map(entry => 
          entry.name === modelName && entry.provider === provider
            ? { ...entry, lastUsed: new Date(), usageCount: entry.usageCount + 1 }
            : entry
        )
      } else {
        // Add new entry
        const newEntry: ModelHistoryEntry = {
          name: modelName,
          provider,
          lastUsed: new Date(),
          usageCount: 1
        }
        updatedHistory = [...prev.aiSettings.modelHistory, newEntry]
      }
      
      // Keep only the last 10 models, sorted by last used
      updatedHistory = updatedHistory
        .sort((a, b) => {
          const aTime = a.lastUsed instanceof Date ? a.lastUsed.getTime() : new Date(a.lastUsed).getTime()
          const bTime = b.lastUsed instanceof Date ? b.lastUsed.getTime() : new Date(b.lastUsed).getTime()
          return bTime - aTime
        })
        .slice(0, 10)
      
      return {
        ...prev,
        aiSettings: {
          ...prev.aiSettings,
          modelHistory: updatedHistory
        }
      }
    })
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
    deleteAllConversations,
    updateConversation,
    getConversationById,
    exportUserData,
    importUserData,
    clearAllData,
    addModelToHistory
  }
}

export { AI_AGENTS }
export type { AIAgent, AISettings }