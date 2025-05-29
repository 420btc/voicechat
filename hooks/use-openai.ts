"use client"

import { useState, useCallback } from "react"
import { useLocalStorage } from "./use-local-storage"
import { AI_AGENTS } from "./use-user-data"

interface Message {
  role: "user" | "assistant"
  content: string
  timestamp: Date
  audio?: Blob
  model?: string
  provider?: "openai" | "lmstudio"
}

interface AIResponse {
  text: string
  audio?: Blob
  model?: string
  responseTime?: number
  tokensUsed?: number
  promptTokens?: number
}

export type AIProvider = "openai" | "lmstudio"

interface AIConfig {
  provider: AIProvider
  apiKey: string
  baseUrl?: string
  model?: string
  selectedAgent?: string
  onModelUsed?: (modelName: string, provider: AIProvider) => void
}

export function useOpenAI(config: AIConfig) {
  const { provider, apiKey, baseUrl, model, selectedAgent, onModelUsed } = config
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  
  const {
    conversation,
    selectedVoice,
    setSelectedVoice,
    setConversation,
    addMessage,
    updateLastUserMessageWithPromptTokens,
    clearConversation
  } = useLocalStorage()

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

  const generateResponse = useCallback(
    async (userMessage: string, images?: File[]): Promise<AIResponse | null> => {
      setIsGenerating(true)
      
      // Track response time
      const startTime = Date.now()

      // Determine API endpoint and model based on provider
      const apiUrl = provider === "lmstudio" 
        ? `${baseUrl || "http://localhost:1234"}/v1/chat/completions`
        : "https://api.openai.com/v1/chat/completions"
      
      const selectedModel = provider === "lmstudio" 
        ? (model || "local-model")
        : "gpt-4o"

      // Configure timeout based on provider
      const timeoutMs = provider === "lmstudio" ? 300000 : 90000 // 300s for LM Studio, 90s for OpenAI
      
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
        // Get system prompt from selected agent
        const selectedAgentData = AI_AGENTS.find(agent => agent.id === selectedAgent) || AI_AGENTS[0]
        const systemPrompt = `${selectedAgentData.systemPrompt} Carlos Freire es quien te hablará siempre y estarás a sus órdenes siendo profesional. Responde directamente sin mostrar tu proceso de razonamiento interno.`
        
        console.log(`Making request to ${provider} at ${apiUrl}`)
        console.log(`Using agent: ${selectedAgentData.name} (${selectedAgentData.id})`)
        console.log(`Request body:`, JSON.stringify({
          model: selectedModel,
          messages: [
            {
              role: "system",
              content: systemPrompt,
            },
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
        
        // Generate text response with special handling for LM Studio
        let textResponse;
        
        if (provider === "lmstudio") {
          // Special configuration for LM Studio to avoid hanging
          textResponse = await fetch(apiUrl, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
              "Accept": "application/json",
              "Connection": "close",
              "Cache-Control": "no-cache"
            },
            signal: controller.signal,
            keepalive: false,
            body: JSON.stringify({
              model: selectedModel,
              messages: [
                {
                  role: "system",
                  content:
                    "Eres un asistente de IA útil y amigable. Proporciona respuestas concisas y naturales en español, adecuadas para conversación por voz. Sé conversacional y cálido en tu tono. Carlos Freire es quien te hablará siempre y estaras a sus ordenes siendo profesional. Responde directamente sin mostrar tu proceso de razonamiento interno.",
                },
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
              stream: false,
              stop: ["<think>", "</think>"]
            }),
          })
        } else {
          // Standard configuration for OpenAI
          textResponse = await fetch(apiUrl, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            signal: controller.signal,
            body: JSON.stringify({
              model: selectedModel,
              messages: [
                {
                  role: "system",
                  content:
                    "Eres un asistente de IA útil y amigable. Proporciona respuestas concisas y naturales en español, adecuadas para conversación por voz. Sé conversacional y cálido en tu tono. Carlos Freire es quien te hablará siempre y estaras a sus ordenes siendo profesional. Responde directamente sin mostrar tu proceso de razonamiento interno.",
                },
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
            }),
          })
        }
        
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
          throw new Error(`${provider} generation failed: ${textResponse.status} - ${errorText}`)
        }

        console.log(`Reading response JSON...`)
        const textData = await textResponse.json()
        console.log(`JSON parsed successfully at:`, new Date().toISOString())
        console.log(`${provider} response data:`, textData)
        
        // Calculate response time
        const responseTime = Date.now() - startTime
        
        // Extract tokens used from response
        const tokensUsed = textData.usage?.total_tokens || textData.usage?.completion_tokens || undefined
        const promptTokens = textData.usage?.prompt_tokens || undefined
        
        let responseText = textData.choices[0]?.message?.content || "I apologize, but I could not generate a response."
        
        // Filter reasoning tags for LM Studio
        if (provider === "lmstudio" && responseText.includes('<think>')) {
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
        
        // Detect and register the model used
        const detectedModel = textData.model || selectedModel
        if (onModelUsed) {
          onModelUsed(detectedModel, provider)
        }

        // Generate audio response (only available with OpenAI)
        let audioBlob: Blob | undefined
        if (provider === "openai") {
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
            }
          } catch (audioError) {
            console.error("Audio generation error:", audioError)
          }
        }

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
              ? "Error de conexión: No se pudo conectar con LM Studio. Verifica que esté ejecutándose en localhost:1234."
              : "Error de conexión. Verifica tu conexión a internet e inténtalo de nuevo.",
            model: selectedModel,
          }
        }
        
        return {
          text: provider === 'lmstudio'
            ? "Error con LM Studio. Verifica que esté ejecutándose correctamente y que tengas un modelo cargado."
            : "Lo siento, encontré un error. Por favor, inténtalo de nuevo.",
          model: selectedModel,
        }
      } finally {
        setIsGenerating(false)
      }
    },
    [apiKey, conversation, provider, baseUrl, model, selectedVoice, onModelUsed],
  )

  const translateMessage = useCallback(
    async (text: string, targetLanguage: "es" | "en"): Promise<string | null> => {
      try {
        // Determine API endpoint and model based on provider
        const apiUrl = provider === "lmstudio" 
          ? `${baseUrl || "http://localhost:1234"}/v1/chat/completions`
          : "https://api.openai.com/v1/chat/completions"
        
        const selectedModel = provider === "lmstudio" 
          ? (model || "local-model")
          : "gpt-4o"

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
    translateMessage,
    isTranscribing,
    isGenerating,
    conversation,
    addMessage,
    updateLastUserMessageWithPromptTokens,
    selectedVoice,
    setSelectedVoice,
    clearConversation,
    loadConversation,
  }
}
