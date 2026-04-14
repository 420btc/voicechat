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
  openaiModel: string
  lmstudioApiKey: string
  lmstudioBaseUrl: string
  lmstudioModel: string
  anthropicApiKey: string
  anthropicModel: string
  deepseekApiKey: string
  grokApiKey: string
  grokModel: string
  geminiApiKey: string
  geminiModel: string
  geminiImageModel: string
  geminiLongContext?: boolean
  falApiKey: string
  falVideoModel: string
  selectedAgent: string
  modelHistory: ModelHistoryEntry[]
  qwenBaseUrl: string
  qwenModel: string
  qwenImageModel?: string
  dashscopeApiKey?: string
  qwenTtsModel?: string
  deepseekLmBaseUrl: string
  deepseekLmModel: string
  useSpecialPrompt: boolean
}

interface UserData {
  name: string
  avatar?: string
  savedConversations: SavedConversation[]
  themeSettings: ThemeSettings & {
    notifications?: boolean
    autoSave?: boolean
    compactMode?: boolean
    voiceAutoSend?: boolean
  }
  aiSettings: AISettings
  createdAt?: string
}

const AI_AGENTS: AIAgent[] = [
  {
    id: "empty",
    name: "Sin Prompt del Sistema",
    description: "Modo sin instrucciones del sistema - respuestas completamente libres",
    systemPrompt: "",
    icon: "⚪"
  },
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
    name: "Programador / Builder",
    description: "Constructor de aplicaciones web y experto en código",
    systemPrompt: "Eres un Experto Desarrollador Web Full Stack y Constructor de Aplicaciones. Tu objetivo es ayudar al usuario a construir aplicaciones web completas y funcionales directamente en el chat. IMPORTANTE: 1. Cuando se te pida crear una interfaz o aplicación, genera SIEMPRE bloques de código separados para HTML, CSS y JavaScript. 2. Usa etiquetas markdown específicas: ```html, ```css, ```javascript. 3. El código debe ser funcional y estar listo para ejecutarse. 4. Si modificas algo, proporciona el bloque de código actualizado. 5. Puedes incluir librerías externas via CDN en el HTML (como Tailwind, Bootstrap, React via CDN, etc.). 6. Actúa como un entorno de desarrollo en tiempo real.",
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
    highContrast: false,
    notifications: true,
    autoSave: true,
    compactMode: false,
    voiceAutoSend: false
  },
  createdAt: new Date().toISOString(),
  aiSettings: {
    provider: "openai",
    openaiApiKey: "",
    openaiModel: "gpt-5.2",
    lmstudioApiKey: "lm-studio",
    lmstudioBaseUrl: "http://localhost:1234",
    lmstudioModel: "local-model",
    anthropicApiKey: "",
    anthropicModel: "claude-4-5-opus",
    deepseekApiKey: "",
    grokApiKey: "",
    grokModel: "grok-4-1-fast-reasoning",
    geminiApiKey: "",
    geminiModel: "gemini-3-flash-preview",
    geminiImageModel: "gemini-3-pro-image-preview",
    geminiLongContext: false,
    falApiKey: "",
    falVideoModel: "fal-ai/kling-video/v2.1/pro/image-to-video",
    selectedAgent: "general",
    modelHistory: [],
    qwenBaseUrl: "http://localhost:1234",
    qwenModel: "qwen2.5-72b-instruct",
    deepseekLmBaseUrl: "http://localhost:1234",
    deepseekLmModel: "deepseek-v3",
    useSpecialPrompt: false
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
        if (error instanceof Error && (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
          alert("¡El almacenamiento local está lleno! No se pueden guardar más datos. Por favor, elimina conversaciones antiguas o exporta tus datos y limpia el historial.")
        }
      }
    }
  }, [userData, isLoaded])

  const updateUserName = (name: string) => {
    setUserData(prev => ({ ...prev, name }))
  }

  const updateUserAvatar = (avatar: string) => {
    setUserData(prev => ({ ...prev, avatar }))
  }

  const updateThemeSettings = (themeSettings: ThemeSettings & {
    notifications?: boolean
    autoSave?: boolean
    compactMode?: boolean
    voiceAutoSend?: boolean
  }) => {
    setUserData(prev => ({ ...prev, themeSettings }))
  }

  const updateAISettings = (newSettings: Partial<AISettings>) => {
    setUserData(prev => ({
      ...prev,
      aiSettings: { ...prev.aiSettings, ...newSettings }
    }))
  }

  // Generate hash for conversation content
  const generateConversationHash = (messages: Array<{
    role: "user" | "assistant"
    content: string
    timestamp: Date
    audio?: Blob
  }>) => {
    // Create a string representation of the conversation content
    // Include message count and first/last message timestamps for better uniqueness
    const contentString = messages
      .map((msg, index) => `${index}:${msg.role}:${msg.content.substring(0, 100)}`)
      .join('|')
    
    const firstTimestamp = messages.length > 0 ? messages[0].timestamp.getTime() : 0
    const lastTimestamp = messages.length > 0 ? messages[messages.length - 1].timestamp.getTime() : 0
    const fullString = `${contentString}|count:${messages.length}|first:${firstTimestamp}|last:${lastTimestamp}`
    
    // Better hash function
    let hash = 0
    for (let i = 0; i < fullString.length; i++) {
      const char = fullString.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return hash.toString()
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
    // Don't save empty conversations
    if (messages.length === 0) {
      return null
    }

    // Generate hash for the conversation
    const conversationHash = generateConversationHash(messages)
    
    // Check if a conversation with the same hash already exists
    const existingConversation = userData.savedConversations.find(
      conv => generateConversationHash(conv.messages) === conversationHash
    )
    
    if (existingConversation) {
      // Update existing conversation instead of creating a duplicate
      setUserData(prev => ({
        ...prev,
        savedConversations: prev.savedConversations.map(conv =>
          conv.id === existingConversation.id
            ? { ...conv, title, messages, updatedAt: new Date() }
            : conv
        )
      }))
      return existingConversation.id
    }
    
    // Create new conversation if no duplicate found
    // Use a more unique ID combining timestamp and random number
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const newConversation: SavedConversation = {
      id: uniqueId,
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

  // Function to clean up duplicate conversations based on content similarity
  const cleanupDuplicateConversations = () => {
    const conversationHashes = new Map<string, string>()
    const duplicateIds: string[] = []
    
    userData.savedConversations.forEach(conv => {
      const hash = generateConversationHash(conv.messages)
      if (conversationHashes.has(hash)) {
        // Mark the newer conversation as duplicate (keep the older one)
        duplicateIds.push(conv.id)
      } else {
        conversationHashes.set(hash, conv.id)
      }
    })
    
    if (duplicateIds.length > 0) {
      setUserData(prev => ({
        ...prev,
        savedConversations: prev.savedConversations.filter(conv => !duplicateIds.includes(conv.id))
      }))
      return duplicateIds.length
    }
    
    return 0
  }

  const getConversationById = (id: string): SavedConversation | undefined => {
    return userData.savedConversations.find(conv => conv.id === id)
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

  const exportUserData = (): string => {
    return JSON.stringify(userData, null, 2)
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
    cleanupDuplicateConversations,
    getConversationById,
    exportUserData,
    importUserData,
    clearAllData,
    addModelToHistory
  }
}

export { AI_AGENTS }
export type { AIAgent, AISettings }
