"use client"

import { useState, useCallback } from "react"
import { useLocalStorage } from "./use-local-storage"
import { useLongTermMemory } from "./use-long-term-memory"
import { AI_AGENTS } from "./use-user-data"

interface Message {
  role: "user" | "assistant"
  content: string
  timestamp: Date
  audio?: Blob
  model?: string
  provider?: AIProvider
  images?: File[]
}

interface AIResponse {
  text: string
  audio?: Blob
  model?: string
  responseTime?: number
  tokensUsed?: number
  promptTokens?: number
}

export type AIProvider = "openai" | "lmstudio" | "anthropic" | "deepseek" | "grok" | "gemini" | "qwen" | "deepseek-lm"

interface AIConfig {
  provider: AIProvider
  apiKey: string
  baseUrl?: string
  model?: string
  openaiModel?: string
  anthropicModel?: string
  geminiModel?: string
  selectedAgent?: string
  onModelUsed?: (modelName: string, provider: AIProvider) => void
  qwenBaseUrl?: string
  qwenModel?: string
  deepseekLmBaseUrl?: string
  deepseekLmModel?: string
  useSpecialPrompt?: boolean
}

export function useOpenAI(config: AIConfig) {
  const { provider, apiKey, baseUrl, model, openaiModel, anthropicModel, geminiModel, selectedAgent, onModelUsed, qwenBaseUrl, qwenModel, deepseekLmBaseUrl, deepseekLmModel, useSpecialPrompt } = config
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [abortController, setAbortController] = useState<AbortController | null>(null)
  
  const {
    conversation,
    selectedVoice,
    setSelectedVoice,
    setConversation,
    addMessage,
    updateLastUserMessageWithPromptTokens,
    clearConversation,
    clearCorruptedData,
    forceResetApp
  } = useLocalStorage()

  const {
    addMemoryEntry,
    generateContextualPrompt,
    updateUserPreference,
    clearMemory
  } = useLongTermMemory()

  const transcribeAudio = useCallback(
    async (audioBlob: Blob): Promise<string | null> => {
      setIsTranscribing(true)

      try {
        // Note: Transcription always uses OpenAI Whisper as LM Studio doesn't have transcription API
        const formData = new FormData()
        formData.append("file", audioBlob, "audio.webm")
        formData.append("model", "whisper-1")
        formData.append("language", "es")

        const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
          body: formData,
        })

        if (!response.ok) {
          throw new Error("Transcription failed")
        }

        const data = await response.json()
        const transcribedText = data.text?.trim()
        
        // Return null if transcription is empty, only whitespace, or too short
        if (!transcribedText || transcribedText.length < 2) {
          console.log("Transcription too short or empty, skipping:", transcribedText)
          return null
        }
        
        return transcribedText
      } catch (error) {
        console.error("Transcription error:", error)
        return null
      } finally {
        setIsTranscribing(false)
      }
    },
    [apiKey],
  )

  // Helper function to convert File to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        // Remove data:image/...;base64, prefix
        const base64 = result.split(',')[1]
        resolve(base64)
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const cancelGeneration = useCallback(() => {
    if (abortController) {
      abortController.abort()
      setAbortController(null)
    }
    setIsGenerating(false)
  }, [abortController])

  const generateResponse = useCallback(
    async (userMessage: string, images?: File[]): Promise<AIResponse | null> => {
      // Cancel any existing generation
      if (abortController) {
        abortController.abort()
      }
      
      // Create new abort controller
      const newAbortController = new AbortController()
      setAbortController(newAbortController)
      setIsGenerating(true)
      
      // Track response time
      const startTime = Date.now()

      // Determine API endpoint and model based on provider
      let apiUrl: string
      let selectedModel: string
      let timeoutMs: number
      
      switch (provider) {
        case "lmstudio":
          apiUrl = `${baseUrl || "http://25.35.17.85:1234"}/v1/chat/completions`
          selectedModel = model || "local-model"
          timeoutMs = 300000 // 5 minutes
          break
        case "qwen":
          apiUrl = `${qwenBaseUrl || "http://25.35.17.85:1234"}/v1/chat/completions`
          selectedModel = qwenModel || "qwen2.5-72b-instruct"
          timeoutMs = 300000 // 5 minutes
          break
        case "deepseek-lm":
          apiUrl = `${deepseekLmBaseUrl || "http://25.35.17.85:1234"}/v1/chat/completions`
          selectedModel = deepseekLmModel || "deepseek-v3"
          timeoutMs = 300000 // 5 minutes
          break
        case "anthropic":
          apiUrl = "/api/anthropic"
          selectedModel = anthropicModel || "claude-sonnet-4-20250514"
          timeoutMs = 90000
          break
        case "deepseek":
          apiUrl = "/api/deepseek"
          selectedModel = "deepseek-chat"
          timeoutMs = 90000
          break
        case "grok":
          apiUrl = "/api/grok"
          selectedModel = "grok-beta"
          timeoutMs = 90000
          break
        case "gemini":
          apiUrl = "/api/gemini"
          selectedModel = geminiModel || "gemini-1.5-pro"
          timeoutMs = 90000
          break
        default: // openai
          apiUrl = "https://api.openai.com/v1/chat/completions"
          selectedModel = openaiModel || "gpt-4o"
          timeoutMs = 90000
          break
      }
      
      // Create AbortController for timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => {
        console.log(`Timeout: Cancelling ${provider} request after ${timeoutMs}ms`)
        controller.abort()
      }, timeoutMs)

      try {
        // Convert images to base64 if provided
        let imageContents: Array<{type: string, image_url: {url: string}}> = []
        if (images && images.length > 0) {
          console.log(`Converting ${images.length} images to base64...`)
          for (const image of images) {
            try {
              const base64 = await fileToBase64(image)
              const mimeType = image.type || 'image/jpeg'
              imageContents.push({
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${base64}`
                }
              })
            } catch (error) {
              console.error('Error converting image to base64:', error)
            }
          }
          console.log(`Successfully converted ${imageContents.length} images`)
        }

        // Prepare user message content
        const userContent = imageContents.length > 0 
          ? [
              { type: "text", text: userMessage },
              ...imageContents
            ]
          : userMessage
        // Get system prompt from selected agent or use special prompt for Qwen/DeepSeek-LM
        let systemPrompt: string
        const selectedAgentData = AI_AGENTS.find(agent => agent.id === selectedAgent) || AI_AGENTS[0]
        
        // Generate contextual prompt with long-term memory
        const contextualPrompt = generateContextualPrompt(userMessage)
        
        // Check if empty agent is selected (no system prompt)
        if (selectedAgentData.id === "empty") {
          systemPrompt = contextualPrompt
        } else if ((provider === "qwen" || provider === "deepseek-lm") && useSpecialPrompt) {
          // Special prompt for Qwen and DeepSeek-LM models - but still use the selected agent's role
          const currentDate = new Date().toLocaleDateString('es-ES', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })
          
          systemPrompt = `${selectedAgentData.systemPrompt}

# Instrucciones adicionales para respuestas basadas en búsquedas:
Si se proporcionan resultados de búsqueda en el formato [página web X inicio]...[página web X fin], por favor cítalos usando el formato [cita:X]. Hoy es ${currentDate}. Evalúa y filtra los resultados de búsqueda según su relevancia para la pregunta. Para preguntas de listado, limítate a 10 puntos clave. Para tareas creativas, cita las referencias dentro del cuerpo del texto. Estructura bien las respuestas largas y sintetiza información de múltiples fuentes.

Carlos Freire es quien te hablará siempre y estarás a sus órdenes siendo profesional. Responde directamente sin mostrar tu proceso de razonamiento interno.

${contextualPrompt}`
        } else {
          // Regular agent-based prompt
          systemPrompt = `${selectedAgentData.systemPrompt} Carlos Freire es quien te hablará siempre y estarás a sus órdenes siendo profesional. Responde directamente sin mostrar tu proceso de razonamiento interno.

${contextualPrompt}`
        }
        
        console.log(`Making request to ${provider} at ${apiUrl}`)
        console.log(`Using agent: ${selectedAgentData.name} (${selectedAgentData.id})`)
        console.log(`Request body:`, JSON.stringify({
          model: selectedModel,
          messages: [
            ...(systemPrompt ? [{
              role: "system",
              content: systemPrompt,
            }] : []),
            ...conversation.map((msg) => ({
              role: msg.role,
              content: msg.content,
            })),
            {
              role: "user",
              content: userContent,
            },
          ],
          max_tokens: 4096,
          temperature: 0.7,
          ...(provider === "lmstudio" && { 
            stream: false,
            stop: ["<think>", "</think>"]
          }),
        }, null, 2))
        
        console.log(`Starting fetch request at:`, new Date().toISOString())
        
        // Prepare request headers and body based on provider
        let headers: Record<string, string>
        let requestBody: any
        
        // Build base messages - only include system message if systemPrompt is not empty
        const baseMessages = [
          ...(systemPrompt ? [{
            role: "system",
            content: systemPrompt,
          }] : []),
          ...conversation.map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
          {
            role: "user",
            content: userContent,
          },
        ]
        
        switch (provider) {
          case "lmstudio":
            headers = {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
              "Accept": "application/json",
              "Connection": "close",
              "Cache-Control": "no-cache"
            }
            requestBody = {
              model: selectedModel,
              messages: baseMessages,
              max_tokens: 4096,
              temperature: 0.7,
              stream: false,
              stop: ["<think>", "</think>"]
            }
            break
            
          case "qwen":
            headers = {
              Authorization: `Bearer ${apiKey || "not-needed"}`,
              "Content-Type": "application/json",
              "Accept": "application/json",
              "Connection": "close",
              "Cache-Control": "no-cache"
            }
            requestBody = {
              model: selectedModel,
              messages: baseMessages,
              max_tokens: 4096,
              temperature: 0.7,
              top_p: 0.8,
              top_k: 20,
              stream: false,
              stop: ["<think>", "</think>"],
              chat_template_kwargs: {
                enable_thinking: false
              }
            }
            break
            
          case "deepseek-lm":
            headers = {
              Authorization: `Bearer ${apiKey || "not-needed"}`,
              "Content-Type": "application/json",
              "Accept": "application/json",
              "Connection": "close",
              "Cache-Control": "no-cache"
            }
            requestBody = {
              model: selectedModel,
              messages: baseMessages,
              max_tokens: 4096,
              temperature: 0.7,
              top_p: 0.8,
              top_k: 20,
              stream: false,
              stop: ["<think>", "</think>"],
              chat_template_kwargs: {
                enable_thinking: false
              }
            }
            break
            
          case "anthropic":
            headers = {
              "x-api-key": apiKey,
              "Content-Type": "application/json"
            }
            requestBody = {
              model: selectedModel,
              max_tokens: 4096,
              temperature: 0.7,
              messages: baseMessages
            }
            break
            
          case "deepseek":
            headers = {
              "x-api-key": apiKey,
              "Content-Type": "application/json"
            }
            requestBody = {
              model: selectedModel,
              messages: baseMessages,
              max_tokens: 4096,
              temperature: 0.7
            }
            break
            
          case "grok":
            headers = {
              "x-api-key": apiKey,
              "Content-Type": "application/json"
            }
            requestBody = {
              model: selectedModel,
              messages: baseMessages,
              max_tokens: 4096,
              temperature: 0.7
            }
            break
            
          case "gemini":
            headers = {
              "x-api-key": apiKey,
              "Content-Type": "application/json"
            }
            requestBody = {
              model: selectedModel,
              messages: baseMessages,
              max_tokens: 4096,
              temperature: 0.7
            }
            break
            
          default: // openai
            headers = {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json"
            }
            requestBody = {
              model: selectedModel,
              messages: baseMessages,
              max_tokens: 4096,
              temperature: 0.7
            }
            break
        }
        
        // Make the API request
        const textResponse = await fetch(apiUrl, {
          method: "POST",
          headers,
          signal: newAbortController.signal,
          ...(provider === "lmstudio" && { keepalive: false }),
          body: JSON.stringify(requestBody),
        })
        
        console.log(`Fetch completed at:`, new Date().toISOString())
        console.log(`Response received, status:`, textResponse.status)
        console.log(`Response headers:`, Object.fromEntries(textResponse.headers.entries()))

        // Clear timeout if request completed
        clearTimeout(timeoutId)
        
        console.log(`${provider} response status:`, textResponse.status)
        
        if (!textResponse.ok) {
          console.log(`Response not OK, reading error text...`)
          const errorText = await textResponse.text().catch(() => 'Unknown error')
          console.error(`${provider} API error:`, textResponse.status, errorText)
          
          // Return specific error message instead of throwing
          return {
            text: provider === 'lmstudio'
              ? `Error ${textResponse.status}: No se pudo conectar con LM Studio. Verifica que esté ejecutándose en ${baseUrl || "http://25.35.17.85:1234"} y que tengas un modelo cargado.`
              : `Error ${textResponse.status}: ${errorText}`,
            model: selectedModel,
          }
        }

        console.log(`Reading response JSON...`)
        const textData = await textResponse.json()
        console.log(`JSON parsed successfully at:`, new Date().toISOString())
        console.log(`${provider} response data:`, textData)
        
        // Calculate response time
        const responseTime = Date.now() - startTime
        
        // Extract tokens used from response based on provider
        let tokensUsed: number | undefined
        let promptTokens: number | undefined
        
        switch (provider) {
          case "anthropic":
            tokensUsed = textData.usage?.output_tokens || undefined
            promptTokens = textData.usage?.input_tokens || undefined
            break
          case "deepseek":
          case "grok":
          case "lmstudio":
          case "openai":
          case "qwen":
          case "deepseek-lm":
          default:
            tokensUsed = textData.usage?.total_tokens || textData.usage?.completion_tokens || undefined
            promptTokens = textData.usage?.prompt_tokens || undefined
            break
          case "gemini":
            tokensUsed = textData.usageMetadata?.totalTokenCount || undefined
            promptTokens = textData.usageMetadata?.promptTokenCount || undefined
            break
        }
        
        let responseText: string
        
        // Extract response text based on provider
        switch (provider) {
          case "anthropic":
            responseText = textData.content?.[0]?.text || textData.completion || "I apologize, but I could not generate a response."
            break
          case "deepseek":
            responseText = textData.choices?.[0]?.message?.content || "I apologize, but I could not generate a response."
            break
          case "grok":
            responseText = textData.choices?.[0]?.message?.content || "I apologize, but I could not generate a response."
            break
          case "gemini":
            responseText = textData.candidates?.[0]?.content?.parts?.[0]?.text || "I apologize, but I could not generate a response."
            break
          case "lmstudio":
            responseText = textData.choices?.[0]?.message?.content || "I apologize, but I could not generate a response."
            // Filter reasoning tags for LM Studio
            if (responseText.includes('<think>')) {
              const thinkEndIndex = responseText.indexOf('</think>')
              if (thinkEndIndex !== -1) {
                responseText = responseText.substring(thinkEndIndex + 8).trim()
              } else {
                const thinkStartIndex = responseText.indexOf('<think>')
                if (thinkStartIndex !== -1) {
                  responseText = responseText.substring(0, thinkStartIndex).trim()
                }
              }
              
              if (!responseText || responseText.length < 5) {
                responseText = "Hola! ¿En qué puedo ayudarte hoy?"
              }
            }
            break
          case "qwen":
          case "deepseek-lm":
            responseText = textData.choices?.[0]?.message?.content || "I apologize, but I could not generate a response."
            // Handle Qwen3 thinking mode - filter out <think> tags
            if (responseText.includes('<think>')) {
              const thinkEndIndex = responseText.indexOf('</think>')
              if (thinkEndIndex !== -1) {
                responseText = responseText.substring(thinkEndIndex + 8).trim()
              } else {
                const thinkStartIndex = responseText.indexOf('<think>')
                if (thinkStartIndex !== -1) {
                  responseText = responseText.substring(0, thinkStartIndex).trim()
                }
              }
              
              if (!responseText || responseText.length < 10) {
                responseText = "Lo siento, no pude generar una respuesta adecuada. Por favor, intenta de nuevo."
              }
            }
            
            // If still empty or very short, provide a helpful message
            if (!responseText || responseText.trim().length < 5) {
              responseText = "Hola! ¿En qué puedo ayudarte hoy?"
            }
            break
          case "openai":
          default:
            responseText = textData.choices?.[0]?.message?.content || "I apologize, but I could not generate a response."
            break
        }
        
        // Detect and register the model used
        const detectedModel = textData.model || selectedModel
        if (onModelUsed) {
          onModelUsed(detectedModel, provider)
        }

        // Generate audio response (only available with OpenAI) - non-blocking
        let audioBlob: Blob | undefined
        if (provider === "openai") {
          // Generate audio asynchronously without blocking the response
          setTimeout(async () => {
            try {
              const audioResponse = await fetch("https://api.openai.com/v1/audio/speech", {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${apiKey}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  model: "tts-1",
                  voice: selectedVoice,
                  input: responseText,
                  response_format: "mp3",
                }),
              })

              if (audioResponse.ok) {
                audioBlob = await audioResponse.blob()
                // You could emit an event here to update the message with audio
              }
            } catch (audioError) {
              console.error("Audio generation error:", audioError)
            }
          }, 0)
        }

        // Set generating to false immediately after getting response text
        setIsGenerating(false)
        setAbortController(null)

        // Save to long-term memory after successful response (non-blocking)
        setTimeout(() => {
          try {
            const memoryContent = `Usuario: ${userMessage}\nAsistente: ${responseText}`
            addMemoryEntry(memoryContent, 'context')
          } catch (memoryError) {
            console.error('Error saving to long-term memory:', memoryError)
          }
        }, 0)

        return {
          text: responseText,
          audio: audioBlob,
          model: detectedModel,
          responseTime,
          tokensUsed,
          promptTokens,
        }
      } catch (error) {
        clearTimeout(timeoutId)
        setIsGenerating(false)
        setAbortController(null)
        
        console.error(`${provider} response generation error:`, error)
        
        // Handle specific error types
        if (error instanceof Error && error.name === 'AbortError') {
          console.error(`Timeout: ${provider} request was cancelled after ${timeoutMs}ms`)
          return {
            text: provider === 'lmstudio' 
              ? `Timeout: LM Studio no respondió en ${timeoutMs/1000} segundos. Verifica que esté ejecutándose y que tengas un modelo cargado.`
              : `Timeout: La petición tardó más de ${timeoutMs/1000} segundos. Inténtalo de nuevo.`,
            model: selectedModel,
          }
        }
        
        if (error instanceof Error && error.message?.includes('fetch')) {
          return {
            text: provider === 'lmstudio'
              ? "Error de conexión: No se pudo conectar con LM Studio. Verifica que esté ejecutándose en http://25.35.17.85:1234."
              : "Error de conexión. Verifica tu conexión a internet e inténtalo de nuevo.",
            model: selectedModel,
          }
        }
        
        // Log the actual error for debugging
        const errorInfo = error instanceof Error ? {
          errorName: error.name,
          errorMessage: error.message,
          errorStack: error.stack
        } : {
          errorName: 'Unknown',
          errorMessage: String(error),
          errorStack: undefined
        }
        
        console.error('Detailed error info:', {
          ...errorInfo,
          provider,
          apiUrl,
          selectedModel
        })
        
        const errorMessage = error instanceof Error ? error.message : String(error)
        
        return {
          text: provider === 'lmstudio'
            ? `Error inesperado con LM Studio: ${errorMessage}. Si el modelo respondió correctamente, puedes ignorar este mensaje.`
            : `Error inesperado: ${errorMessage}. Por favor, inténtalo de nuevo.`,
          model: selectedModel,
        }
      } finally {
        // setIsGenerating(false) is now called immediately after getting response text
      }
    },
    [apiKey, conversation, provider, baseUrl, model, selectedVoice, onModelUsed],
  )

  const translateMessage = useCallback(
    async (text: string, targetLanguage: "es" | "en"): Promise<string | null> => {
      try {
        // Determine API endpoint and model based on provider
        const apiUrl = provider === "lmstudio" 
          ? `${baseUrl || "http://25.35.17.85:1234"}/v1/chat/completions`
          : "https://api.openai.com/v1/chat/completions"
        
        const selectedModel = provider === "lmstudio" 
          ? (model || "local-model")
          : (openaiModel || "gpt-4o")

        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: selectedModel,
            messages: [
              {
                role: "system",
                content: `Traduce el siguiente texto al ${targetLanguage === "es" ? "español" : "inglés"}. Solo devuelve la traducción, sin explicaciones adicionales.`,
              },
              {
                role: "user",
                content: text,
              },
            ],
            max_tokens: 4096,
            temperature: 0.3,
          }),
        })

        if (!response.ok) {
          throw new Error("Translation failed")
        }

        const data = await response.json()
        return data.choices[0]?.message?.content || null
      } catch (error) {
        console.error("Translation error:", error)
        return null
      }
    },
    [apiKey, provider, baseUrl, model],
  )

  const loadConversation = useCallback((messages: Message[]) => {
    // Replace current conversation with loaded messages
    setConversation(messages)
  }, [setConversation])

  return {
    transcribeAudio,
    generateResponse,
    cancelGeneration,
    translateMessage,
    isTranscribing,
    isGenerating,
    conversation,
    addMessage,
    updateLastUserMessageWithPromptTokens,
    selectedVoice,
    setSelectedVoice,
    clearConversation,
    clearCorruptedData,
    forceResetApp,
    loadConversation,
    setConversation,
    // Long-term memory functions
    updateUserPreference,
    clearMemory,
  }
}
